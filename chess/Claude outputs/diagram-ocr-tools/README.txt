Tools that made diagram-model.bin, the network that reads board diagrams from photos and screenshots.

Book diagrams (phone photos of printed pages):
  gen.py           synthetic training squares (book styles, 41 lichess piece sets, photo roughness)
  synth_board.py   whole synthetic "phone photos" of diagrams, with the true position and corners

App screenshots (flat colours, crisp pieces):
  screen_glyphs.py  cuts the pieces and square colours out of a screenshot of the starting
                    position on a flat-coloured board -> glyphs/NAME.npz
  texture_glyphs.py the same for a textured board (marble, wood): pieces with a dark outline,
                    plus the empty squares as background tiles -> glyphs/NAME.npz
  screen_gen.py     synthetic training squares in those styles, on other flat colours, and the
                    lichess sets on flat colours; --textures adds textured boards
  screen_boards.py  whole synthetic screenshots in random positions, for testing
  glyphs/           made by the two cutting tools from your own screenshots, and not kept here:
                    the piece art belongs to those apps, and this folder is pushed to GitHub.
                    The model was trained with duo_light, duo_dark (Duolingo), chesscom (green
                    board, Neo pieces) and custom (chess.com Sky and Sea board, blue and white pieces).
                    To remake them: texture_glyphs.py custom.jpg custom 34 247 1045 1258

Training and testing:
  train.py          trains the square classifier from scratch with tinygrad; folds batch norm in
  finetune.py       carries on training an existing model (batch norm already folded) on new data
  evalboard.py      reads synthetic photos the same way the page does; --export writes diagram-model.bin

They expect the lichess piece sets at ../dl/lila/public/piece (a sparse checkout of
github.com/lichess-org/lila: git clone --depth 1 --filter=blob:none --sparse ...; git sparse-checkout set public/piece).
Needs: pip install numpy pillow cairosvg tinygrad scipy

How the current model was made (2026-11-04): the book model (from train.py, 7 epochs on two
70,000-square gen.py sets) fine-tuned on new book squares plus the same number of screen squares,
in two stages:
  python3 screen_glyphs.py duo_light.jpg duo_light 0 834 1080 1914 --tol 6     (and duo_dark, chesscom --tol 10)
  python3 gen.py btrain.npz 70000 --seed 141
  python3 screen_gen.py strain.npz 70000 --seed 142
  python3 finetune.py book.npz stage1.npz 3 btrain.npz strain.npz --val books=bval.npz --val screens=sval.npz
then, for the textured board, from stage1-ep2.npz:
  python3 gen.py btrain2.npz 70000 --seed 241
  python3 screen_gen.py strain2.npz 70000 --textures custom --seed 242
  python3 finetune.py stage1-ep2.npz stage2.npz 2 btrain2.npz strain2.npz --lr 3e-4 --val books=bval.npz --val screens=sval.npz
  python3 evalboard.py stage2-ep2.npz --export diagram-model.bin
Results, squares right / boards fully right, before the app's position check:
  book photos (150)        99.41% / 121  ->  99.75% / 132
  Duolingo light (40)      89.26% / 0    ->  100%   / 40
  Duolingo dark (40)       73.05% / 0    ->  99.92% / 39
  chess.com Neo (40)       99.84% / 36   ->  100%   / 40
  Sky and Sea (40)         51.76% / 0    ->  99.22% / 25
  the four real starting-position screenshots, after the position check: 60, 38, 64, 40 -> 64 each
Keep a book test set (synth_board.py) and a screen test set (screen_boards.py) and check both
before replacing the model: adding a style must not make book diagrams worse.
