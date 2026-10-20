"""Train the square classifier (13 classes) on gen.py output, with tinygrad.

    python3 train.py OUT_weights.npz EPOCHS train1.npz [train2.npz ...] [--val val.npz]

Net (input 1x40x40, pixels scaled to 0..1 then normalised per square):
  conv3x3 16 + BN + relu, maxpool 2        -> 16x20x20
  conv3x3 32 + BN + relu, maxpool 2        -> 32x10x10
  conv3x3 64 + BN + relu, maxpool 2        -> 64x5x5
  conv3x3 64 + BN + relu, global avg pool  -> 64
  linear 64 -> 13
Batch norm is folded into the convolutions when saving, so the browser runs
plain conv + bias + relu.
"""
import sys, time, argparse
import numpy as np
from tinygrad import Tensor, nn, TinyJit
from tinygrad.nn.state import get_parameters
from tinygrad.helpers import Context

def prep(x):
    x = x.astype(np.float32) / 255.0
    m = x.mean(axis=(1, 2), keepdims=True); s = x.std(axis=(1, 2), keepdims=True) + 0.05
    return ((x - m) / s)[:, None, :, :]

class Net:
    def __init__(self):
        self.c = [nn.Conv2d(1, 16, 3, padding=1), nn.Conv2d(16, 32, 3, padding=1),
                  nn.Conv2d(32, 64, 3, padding=1), nn.Conv2d(64, 64, 3, padding=1)]
        self.b = [nn.BatchNorm(16), nn.BatchNorm(32), nn.BatchNorm(64), nn.BatchNorm(64)]
        self.fc = nn.Linear(64, 13)
    def __call__(self, x):
        for i in range(4):
            x = self.b[i](self.c[i](x)).relu()
            x = x.max_pool2d(2) if i < 3 else x.mean(axis=(2, 3))
        return self.fc(x)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('epochs', type=int); ap.add_argument('data', nargs='+')
    ap.add_argument('--val'); ap.add_argument('--bs', type=int, default=128); ap.add_argument('--lr', type=float, default=2e-3)
    a = ap.parse_args()
    xs, ys = [], []
    for f in a.data:
        d = np.load(f); xs.append(d['x']); ys.append(d['y'])
    X = prep(np.concatenate(xs)); Y = np.concatenate(ys).astype(np.int32)
    Xv = Yv = None
    if a.val:
        d = np.load(a.val); Xv, Yv = prep(d['x']), d['y'].astype(np.int32)
    net = Net()
    params = get_parameters(net)
    opt = nn.optim.Adam(params, lr=a.lr)

    @TinyJit
    def step(xb, yb):
        opt.zero_grad()
        loss = net(xb).sparse_categorical_crossentropy(yb)
        loss.backward(); opt.step()
        return loss.realize()

    def evaluate(Xe, Ye):
        pred = []
        with Context(TRAINING=0):
            for i in range(0, len(Xe), 512):
                pred.append(net(Tensor(Xe[i:i + 512])).argmax(axis=1).numpy())
        p = np.concatenate(pred)
        return (p == Ye).mean(), p

    n = len(X); steps = n // a.bs
    for ep in range(a.epochs):
        lr = a.lr * (0.5 ** (ep // 3))
        opt.lr.assign(Tensor([lr])) if hasattr(opt.lr, 'assign') else setattr(opt, 'lr', lr)
        perm = np.random.permutation(n); t0 = time.time(); tot = 0
        with Context(TRAINING=1):
            for s in range(steps):
                idx = perm[s * a.bs:(s + 1) * a.bs]
                tot += step(Tensor(X[idx]), Tensor(Y[idx])).item()
        msg = f'epoch {ep + 1}: loss {tot / steps:.4f}, {time.time() - t0:.0f}s'
        if Xv is not None:
            acc, _ = evaluate(Xv, Yv); msg += f', val {acc * 100:.2f}%'
        print(msg, flush=True)

    # fold batch norm into the convolutions and save plain arrays
    out = {}
    for i in range(4):
        c, b = net.c[i], net.b[i]
        w = c.weight.numpy(); bias = c.bias.numpy() if c.bias is not None else np.zeros(w.shape[0], np.float32)
        g = b.weight.numpy(); beta = b.bias.numpy(); mu = b.running_mean.numpy(); var = b.running_var.numpy()
        k = g / np.sqrt(var + b.eps)
        out[f'c{i}w'] = (w * k[:, None, None, None]).astype(np.float32)
        out[f'c{i}b'] = ((bias - mu) * k + beta).astype(np.float32)
    out['fcw'] = net.fc.weight.numpy().astype(np.float32); out['fcb'] = net.fc.bias.numpy().astype(np.float32)
    np.savez(a.out, **out)
    if Xv is not None:
        acc, p = evaluate(Xv, Yv)
        conf = np.zeros((13, 13), int)
        for t, q in zip(Yv, p): conf[t, q] += 1
        worst = sorted(((conf[i, j], i, j) for i in range(13) for j in range(13) if i != j), reverse=True)[:6]
        names = ['.', 'K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p']
        print('final val %.2f%%; most confused: %s' % (acc * 100, ', '.join(f'{names[i]}->{names[j]} {c}' for c, i, j in worst)))

if __name__ == '__main__':
    main()
