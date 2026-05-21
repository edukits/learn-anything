#!/usr/bin/env python3
"""Local BiRefNet background removal utility.

This is intentionally a dev-only preprocessing tool. It downloads model code and
weights from Hugging Face on first use, then uses the local cache on later runs.
"""

from __future__ import annotations

import argparse
import os
from collections.abc import Iterable
from pathlib import Path

os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")


DEFAULT_MODEL = "ZhengPeng7/BiRefNet"
IMAGE_EXTENSIONS = {".avif", ".bmp", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"}


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Remove image backgrounds with BiRefNet for local asset preprocessing.",
	)
	parser.add_argument(
		"inputs",
		nargs="+",
		type=Path,
		help="Input image files or directories. Directories are scanned for common image extensions.",
	)
	parser.add_argument(
		"-o",
		"--output",
		type=Path,
		default=Path("processed/background-removed"),
		help="Output directory. Defaults to processed/background-removed.",
	)
	parser.add_argument(
		"--model",
		default=DEFAULT_MODEL,
		help=f"Hugging Face model id. Defaults to {DEFAULT_MODEL}.",
	)
	parser.add_argument(
		"--device",
		choices=["auto", "mps", "cpu"],
		default="auto",
		help="Inference device. 'auto' prefers Apple Silicon MPS when available.",
	)
	parser.add_argument(
		"--size",
		type=int,
		default=1024,
		help="Square inference size in pixels. BiRefNet's default is 1024.",
	)
	parser.add_argument(
		"--mask",
		action="store_true",
		help="Also write the foreground alpha mask as <name>.mask.png.",
	)
	parser.add_argument(
		"--recursive",
		action="store_true",
		help="Scan input directories recursively.",
	)
	parser.add_argument(
		"--overwrite",
		action="store_true",
		help="Overwrite existing output files.",
	)
	return parser.parse_args()


def resolve_device(requested: str) -> torch.device:
	import torch

	if requested == "cpu":
		return torch.device("cpu")

	if requested in {"auto", "mps"} and torch.backends.mps.is_available():
		return torch.device("mps")

	if requested == "mps":
		raise RuntimeError(
			"MPS was requested but is not available. Check that this is an Apple Silicon Mac "
			"with a compatible PyTorch build, or run with --device cpu."
		)

	return torch.device("cpu")


def iter_images(paths: Iterable[Path], recursive: bool) -> list[Path]:
	images: list[Path] = []

	for path in paths:
		if path.is_dir():
			matches = path.rglob("*") if recursive else path.glob("*")
			images.extend(
				child
				for child in matches
				if child.is_file() and child.suffix.lower() in IMAGE_EXTENSIONS
			)
		elif path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
			images.append(path)
		else:
			raise FileNotFoundError(f"No supported image found at {path}")

	return sorted(dict.fromkeys(images))


def load_model(model_id: str, device: torch.device) -> torch.nn.Module:
	import torch
	from transformers import AutoModelForImageSegmentation

	torch.set_float32_matmul_precision("high")
	model = AutoModelForImageSegmentation.from_pretrained(model_id, trust_remote_code=True)
	model.to(device)
	model.eval()
	return model


def model_input_dtype(model: torch.nn.Module) -> torch.dtype:
	import torch

	for parameter in model.parameters():
		if parameter.dtype.is_floating_point:
			return parameter.dtype

	return torch.float32


def build_transform(size: int) -> transforms.Compose:
	from torchvision import transforms

	return transforms.Compose(
		[
			transforms.Resize((size, size)),
			transforms.ToTensor(),
			transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
		]
	)


def predict_mask(
	model: torch.nn.Module,
	image: Image.Image,
	transform: transforms.Compose,
	device: torch.device,
) -> Image.Image:
	import torch
	from PIL import Image
	from torchvision import transforms

	tensor = transform(image.convert("RGB")).unsqueeze(0)
	tensor = tensor.to(device=device, dtype=model_input_dtype(model))

	with torch.inference_mode():
		prediction = model(tensor)[-1].sigmoid().cpu()[0].squeeze()

	mask = transforms.ToPILImage()(prediction)
	return mask.resize(image.size, Image.Resampling.LANCZOS)


def remove_background(
	model: torch.nn.Module,
	image_path: Path,
	output_dir: Path,
	transform: transforms.Compose,
	device: torch.device,
	write_mask: bool,
	overwrite: bool,
) -> None:
	from PIL import Image, ImageOps

	output_dir.mkdir(parents=True, exist_ok=True)
	output_path = output_dir / f"{image_path.stem}.png"
	mask_path = output_dir / f"{image_path.stem}.mask.png"

	if output_path.exists() and (not write_mask or mask_path.exists()) and not overwrite:
		print(f"skip {image_path} -> {output_path} (exists)")
		return

	image = ImageOps.exif_transpose(Image.open(image_path)).convert("RGBA")
	mask = predict_mask(model, image, transform, device)
	image.putalpha(mask)
	image.save(output_path)

	if write_mask:
		mask.save(mask_path)

	print(f"wrote {image_path} -> {output_path}")


def main() -> None:
	args = parse_args()
	try:
		device = resolve_device(args.device)
		images = iter_images(args.inputs, args.recursive)

		if not images:
			raise RuntimeError("No supported input images found.")

		print(f"loading {args.model} on {device.type}")
		model = load_model(args.model, device)
		transform = build_transform(args.size)

		for image_path in images:
			remove_background(
				model=model,
				image_path=image_path,
				output_dir=args.output,
				transform=transform,
				device=device,
				write_mask=args.mask,
				overwrite=args.overwrite,
			)
	except ModuleNotFoundError as error:
		raise SystemExit(
			f"Missing Python dependency '{error.name}'. Run: "
			"UV_CACHE_DIR=tools/birefnet-bg-remove/.uv-cache "
			"uv sync --project tools/birefnet-bg-remove"
		) from error


if __name__ == "__main__":
	main()
