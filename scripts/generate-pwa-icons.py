#!/usr/bin/env python3
"""
Generate square PWA icons (192×192, 512×512) for VerifScan.

The source logo.png (272×66) is a horizontal wordmark that doesn't fit
PWA's square icon requirement. This script composites it onto a brand-blue
square background to produce valid PWA icons.

Outputs (in /home/z/my-project/public/):
  - icon-192.png   (192×192, purpose=any)
  - icon-512.png   (512×512, purpose=any)
  - icon-192-maskable.png  (192×192, with 10% safe padding for maskable)
  - icon-512-maskable.png  (512×512, with 10% safe padding for maskable)
  - apple-touch-icon.png  (180×180, for iOS)
  - favicon-32.png         (32×32)
  - favicon-16.png         (16×16)
"""
from PIL import Image, ImageDraw, ImageFilter
import os

# Brand palette
BRAND_BLUE = (15, 67, 130, 255)   # #0f4382
BRAND_GREEN = (46, 189, 90, 255)  # #2ebd5a
WHITE = (255, 255, 255, 255)

SRC = "/home/z/my-project/public/logo.png"
OUT_DIR = "/home/z/my-project/public"

# Load source logo (RGBA)
src = Image.open(SRC).convert("RGBA")
print(f"Source logo: {src.size[0]}x{src.size[1]}")

def make_icon(size: int, maskable: bool = False) -> Image.Image:
    """
    Create a square icon of given size.
    - Non-maskable: logo takes ~75% of width, centered on brand-blue background.
    - Maskable: logo takes ~60% of width (safe zone for circular/squircle masks).
    """
    # Background: solid brand blue
    bg = Image.new("RGBA", (size, size), BRAND_BLUE)

    # Compute logo target size
    if maskable:
        max_width = int(size * 0.60)  # 60% width (safe zone)
        max_height = int(size * 0.35)  # 35% height (wordmark is wide)
    else:
        max_width = int(size * 0.78)
        max_height = int(size * 0.45)

    src_w, src_h = src.size
    ratio = min(max_width / src_w, max_height / src_h)
    new_w = max(1, int(src_w * ratio))
    new_h = max(1, int(src_h * ratio))

    logo_resized = src.resize((new_w, new_h), Image.LANCZOS)

    # Center
    x = (size - new_w) // 2
    y = (size - new_h) // 2

    bg.paste(logo_resized, (x, y), logo_resized)
    return bg


def make_apple_icon(size: int = 180) -> Image.Image:
    """Apple touch icon: rounded look with white background, logo centered."""
    bg = Image.new("RGBA", (size, size), WHITE)
    max_width = int(size * 0.75)
    max_height = int(size * 0.45)
    src_w, src_h = src.size
    ratio = min(max_width / src_w, max_height / src_h)
    new_w = max(1, int(src_w * ratio))
    new_h = max(1, int(src_h * ratio))
    logo_resized = src.resize((new_w, new_h), Image.LANCZOS)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    bg.paste(logo_resized, (x, y), logo_resized)
    return bg


def make_favicon(size: int) -> Image.Image:
    """Small favicon: brand-blue background with just enough logo to read."""
    bg = Image.new("RGBA", (size, size), BRAND_BLUE)
    # For tiny favicons, only show the "V" shield-ish part of the logo (leftmost ~25%)
    if size <= 32:
        # Crop just the left portion of the logo (icon area)
        src_w, src_h = src.size
        # Logo is 272x66; the shield/icon is roughly the leftmost 60px
        cropped = src.crop((0, 0, int(src_w * 0.25), src_h))
        max_dim = int(size * 0.75)
        ratio = max_dim / max(cropped.size)
        new_w = max(1, int(cropped.size[0] * ratio))
        new_h = max(1, int(cropped.size[1] * ratio))
        resized = cropped.resize((new_w, new_h), Image.LANCZOS)
        x = (size - new_w) // 2
        y = (size - new_h) // 2
        bg.paste(resized, (x, y), resized)
    else:
        max_width = int(size * 0.78)
        max_height = int(size * 0.45)
        src_w, src_h = src.size
        ratio = min(max_width / src_w, max_height / src_h)
        new_w = max(1, int(src_w * ratio))
        new_h = max(1, int(src_h * ratio))
        logo_resized = src.resize((new_w, new_h), Image.LANCZOS)
        x = (size - new_w) // 2
        y = (size - new_h) // 2
        bg.paste(logo_resized, (x, y), logo_resized)
    return bg


# Generate all icons
icons_to_generate = [
    ("icon-192.png",            make_icon(192, maskable=False)),
    ("icon-512.png",            make_icon(512, maskable=False)),
    ("icon-192-maskable.png",   make_icon(192, maskable=True)),
    ("icon-512-maskable.png",   make_icon(512, maskable=True)),
    ("apple-touch-icon.png",    make_apple_icon(180)),
    ("icon-32.png",             make_favicon(32)),
    ("icon-16.png",             make_favicon(16)),
]

for name, img in icons_to_generate:
    path = os.path.join(OUT_DIR, name)
    img.save(path, "PNG", optimize=True)
    print(f"✓ {name} ({img.size[0]}×{img.size[1]})")

# Also generate an ICO favicon (multi-size)
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
ico_images = [make_favicon(s[0]) for s in ico_sizes]
ico_path = os.path.join(OUT_DIR, "favicon.ico")
ico_images[0].save(ico_path, format="ICO", sizes=ico_sizes, append_images=ico_images[1:])
print(f"✓ favicon.ico (multi-size: {ico_sizes})")

print("\nAll PWA icons generated successfully.")
