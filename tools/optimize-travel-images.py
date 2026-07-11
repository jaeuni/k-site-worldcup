from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "images" / "places"
VARIANTS = {
    "optimized": ((960, 600), 82),
    "thumbnails": ((480, 300), 76),
    "map-thumbs": ((240, 150), 70),
}


def save_variant(source: Path, destination: Path, size: tuple[int, int], quality: int) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        image.thumbnail(size, Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=quality, method=6)


def main() -> None:
    sources = sorted(path for path in SOURCE_DIR.iterdir() if path.suffix.lower() in {".png", ".jpg", ".jpeg"})
    for folder in VARIANTS:
        (ROOT / "images" / folder).mkdir(parents=True, exist_ok=True)

    for source in sources:
        for folder, (size, quality) in VARIANTS.items():
            destination = ROOT / "images" / folder / f"{source.stem}.webp"
            save_variant(source, destination, size, quality)

    print(f"Created {len(sources)} images in {len(VARIANTS)} responsive variants.")


if __name__ == "__main__":
    main()
