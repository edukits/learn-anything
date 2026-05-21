# BiRefNet background removal

Dev-only local preprocessing for creating transparent PNG assets before they are used by the app. This is not part of the server or frontend runtime.

The script uses `ZhengPeng7/BiRefNet` from Hugging Face through `transformers` and defaults to Apple Silicon MPS when PyTorch can see it. Model code and weights are downloaded into the local Hugging Face cache the first time it runs.

## Setup

From the repo root:

```sh
UV_CACHE_DIR=tools/birefnet-bg-remove/.uv-cache uv sync --project tools/birefnet-bg-remove
```

`uv` creates `tools/birefnet-bg-remove/.venv`. The command above also keeps uv's package cache under `tools/birefnet-bg-remove/.uv-cache`, so Python ML dependencies stay out of the Node workspace and your home cache.

## Usage

```sh
corepack pnpm birefnet:remove-bg path/to/image.jpg -o processed/background-removed
```

Batch a directory:

```sh
corepack pnpm birefnet:remove-bg raw-images/ --recursive --mask -o processed/background-removed
```

You can also run the tool directly through `uv`:

```sh
UV_CACHE_DIR=tools/birefnet-bg-remove/.uv-cache uv run --project tools/birefnet-bg-remove python tools/birefnet-bg-remove/remove_background.py path/to/image.jpg
```

Useful options:

- `--device auto` prefers `mps` and falls back to CPU.
- `--device mps` fails if MPS is unavailable.
- `--device cpu` is slower but useful when debugging Metal-specific issues.
- `--mask` writes `<name>.mask.png` next to the transparent PNG.
- `--overwrite` replaces existing outputs.

For MPS compatibility, the script sets `PYTORCH_ENABLE_MPS_FALLBACK=1` before importing PyTorch. Unsupported Metal ops can then fall back to CPU instead of failing mid-run.
