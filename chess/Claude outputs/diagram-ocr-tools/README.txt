Tools that made diagram-model.bin, the network that reads book diagrams from photos.

gen.py          synthetic training squares (book styles, 41 lichess piece sets, photo roughness)
synth_board.py  whole synthetic "phone photos" of diagrams, with the true position and corners
train.py        trains the square classifier with tinygrad; folds batch norm into the convolutions
evalboard.py    reads synthetic photos the same way the page does; --export writes diagram-model.bin

They expect the lichess piece sets at ../dl/lila/public/piece (a sparse checkout of
github.com/lichess-org/lila). Needs: pip install numpy pillow cairosvg tinygrad

Typical run:
  python3 gen.py all1.npz 70000 --seed 41
  python3 gen.py all2.npz 70000 --seed 42
  python3 train.py w.npz 7 all1.npz all2.npz
  python3 evalboard.py w.npz --export diagram-model.bin
