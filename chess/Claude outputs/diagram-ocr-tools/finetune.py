"""Carry on training an existing model (weights.npz, batch norm already folded) on new data.

    python3 finetune.py START.npz OUT.npz EPOCHS train1.npz [train2.npz ...] [--val name=val.npz ...]
Same network as train.py, without batch norm (it's folded into the start weights),
so the model starts exactly where it was and moves from there. Reports accuracy
on each --val set before training and after each epoch, and saves after each epoch
(OUT.npz, plus OUT-epN.npz) so any epoch can be kept.
"""
import time, argparse
import numpy as np
from tinygrad import Tensor, nn, TinyJit
from tinygrad.nn.state import get_parameters
from tinygrad.helpers import Context
from train import prep

class Net:
    def __init__(self, w):
        self.c = []
        for i in range(4):
            c = nn.Conv2d(w[f'c{i}w'].shape[1], w[f'c{i}w'].shape[0], 3, padding=1)
            c.weight = Tensor(w[f'c{i}w']); c.bias = Tensor(w[f'c{i}b'])
            self.c.append(c)
        self.fc = nn.Linear(64, 13)
        self.fc.weight = Tensor(w['fcw']); self.fc.bias = Tensor(w['fcb'])
    def __call__(self, x):
        for i in range(4):
            x = self.c[i](x).relu()
            x = x.max_pool2d(2) if i < 3 else x.mean(axis=(2, 3))
        return self.fc(x)
    def save(self, path):
        out = {}
        for i in range(4): out[f'c{i}w'] = self.c[i].weight.numpy(); out[f'c{i}b'] = self.c[i].bias.numpy()
        out['fcw'] = self.fc.weight.numpy(); out['fcb'] = self.fc.bias.numpy()
        np.savez(path, **out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('start'); ap.add_argument('out'); ap.add_argument('epochs', type=int); ap.add_argument('data', nargs='+')
    ap.add_argument('--val', action='append', default=[]); ap.add_argument('--bs', type=int, default=128); ap.add_argument('--lr', type=float, default=5e-4)
    a = ap.parse_args()
    xs, ys = [], []
    for f in a.data:
        d = np.load(f); xs.append(d['x']); ys.append(d['y'])
    X = prep(np.concatenate(xs)); Y = np.concatenate(ys).astype(np.int32)
    vals = []
    for v in a.val:
        name, f = v.split('=', 1); d = np.load(f); vals.append((name, prep(d['x']), d['y'].astype(np.int32)))
    net = Net(np.load(a.start))
    opt = nn.optim.Adam(get_parameters(net), lr=a.lr)

    @TinyJit
    def step(xb, yb):
        opt.zero_grad()
        loss = net(xb).sparse_categorical_crossentropy(yb)
        loss.backward(); opt.step()
        return loss.realize()

    def report(tag):
        parts = []
        with Context(TRAINING=0):
            for name, Xv, Yv in vals:
                p = np.concatenate([net(Tensor(Xv[i:i + 512])).argmax(axis=1).numpy() for i in range(0, len(Xv), 512)])
                parts.append(f'{name} {(p == Yv).mean() * 100:.2f}%')
        print(tag, ' | '.join(parts), flush=True)

    report('start:')
    n = len(X); steps = n // a.bs
    for ep in range(a.epochs):
        lr = a.lr * (0.5 ** ep)
        opt.lr.assign(Tensor([lr])) if hasattr(opt.lr, 'assign') else setattr(opt, 'lr', lr)
        perm = np.random.permutation(n); t0 = time.time(); tot = 0
        with Context(TRAINING=1):
            for s in range(steps):
                idx = perm[s * a.bs:(s + 1) * a.bs]
                tot += step(Tensor(X[idx]), Tensor(Y[idx])).item()
        report(f'epoch {ep + 1}: loss {tot / steps:.4f}, {time.time() - t0:.0f}s |')
        net.save(a.out); net.save(a.out.replace('.npz', f'-ep{ep + 1}.npz'))

if __name__ == '__main__':
    main()
