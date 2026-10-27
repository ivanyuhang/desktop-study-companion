"""Optimize supplied generated illustrations; runtime uses the checked-in WebP files."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("canopy", type=Path)
parser.add_argument("frame", type=Path)
parser.add_argument("wreath", type=Path)
args = parser.parse_args()
destination = Path(__file__).resolve().parents[1] / "src/renderer/src/assets/forest"
destination.mkdir(parents=True, exist_ok=True)
for source, name, size in [(args.canopy, "canopy.webp", 1600), (args.frame, "woodland-frame.webp", 1024), (args.wreath, "timer-wreath.webp", 768)]:
    image = Image.open(source)
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    image.save(destination / name, "WEBP", quality=88, method=6)
    if "A" in image.getbands():
        assert image.getpixel((image.width // 2, image.height // 2))[-1] == 0
    print(name, image.size, (destination / name).stat().st_size)