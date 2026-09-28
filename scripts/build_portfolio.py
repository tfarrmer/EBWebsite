"""
Build the portfolio gallery from the "portfolio photos" folder.

  1. Copies every image in "portfolio photos/" (sorted by filename) into
     images/portfolio/ as 01.jpg, 02.png, ... keeping each file's format.
     The originals are never modified, moved, or deleted.
  2. Writes web-optimized JPEG copies (max 1600px wide) to
     images/portfolio/web/.
  3. Regenerates the gallery markup in pages/portfolio.html between the
     <!-- portfolio:start --> and <!-- portfolio:end --> markers.
     If no images are found, 9 placeholder blocks are rendered instead.

Usage (from the project root):
    python scripts/build_portfolio.py

Requires Pillow for the web copies (pip install Pillow). Without it, the
originals are still copied and used directly on the page.
"""

import html
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_DIR = os.path.join(ROOT, "portfolio photos")
OUT_DIR = os.path.join(ROOT, "images", "portfolio")
WEB_DIR = os.path.join(OUT_DIR, "web")
PAGE = os.path.join(ROOT, "pages", "portfolio.html")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
MAX_WEB_WIDTH = 1600
PLACEHOLDER_COUNT = 9
START_MARK = "<!-- portfolio:start -->"
END_MARK = "<!-- portfolio:end -->"
INDENT = "        "

try:
    from PIL import Image
except ImportError:
    Image = None


def source_images():
    if not os.path.isdir(SOURCE_DIR):
        return []
    files = []
    for name in sorted(os.listdir(SOURCE_DIR)):
        path = os.path.join(SOURCE_DIR, name)
        if os.path.isfile(path) and os.path.splitext(name)[1].lower() in IMAGE_EXTS:
            files.append(path)
    return files


def clear_generated(folder):
    """Remove only files this script generated (numbered names like 01.jpg)."""
    if not os.path.isdir(folder):
        return
    for name in os.listdir(folder):
        if re.fullmatch(r"\d+\.[a-z]+", name):
            os.remove(os.path.join(folder, name))


def image_size(path):
    if Image is None:
        return None
    with Image.open(path) as im:
        return im.size


def make_web_copy(src, dest):
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > MAX_WEB_WIDTH:
            height = round(im.height * MAX_WEB_WIDTH / im.width)
            im = im.resize((MAX_WEB_WIDTH, height), Image.LANCZOS)
        im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        return im.size


def build_images(sources):
    os.makedirs(OUT_DIR, exist_ok=True)
    clear_generated(OUT_DIR)
    if Image is not None:
        os.makedirs(WEB_DIR, exist_ok=True)
        clear_generated(WEB_DIR)

    digits = max(2, len(str(len(sources))))
    items = []
    for i, src in enumerate(sources, start=1):
        ext = os.path.splitext(src)[1].lower()
        if ext == ".jpeg":
            ext = ".jpg"
        stem = str(i).zfill(digits)
        original = os.path.join(OUT_DIR, stem + ext)
        shutil.copy2(src, original)

        if Image is not None:
            web = os.path.join(WEB_DIR, stem + ".jpg")
            size = make_web_copy(original, web)
            rel = "../images/portfolio/web/" + stem + ".jpg"
        else:
            size = image_size(original)
            rel = "../images/portfolio/" + stem + ext

        items.append({"n": i, "src": rel, "size": size})
    return items


def gallery_markup(items):
    lines = []
    if not items:
        for _ in range(PLACEHOLDER_COUNT):
            lines += [
                '<li class="gallery__item">',
                '  <div class="image-placeholder gallery__placeholder" role="img" aria-label="[Alt text placeholder: describe image here]">',
                '    <span class="image-placeholder__label" aria-hidden="true">[Image placeholder]</span>',
                "  </div>",
                "</li>",
            ]
    else:
        for item in items:
            alt = html.escape("Makeup by Erika Elise, look {}".format(item["n"]))
            dims = ""
            if item["size"]:
                dims = ' width="{}" height="{}"'.format(*item["size"])
            lines += [
                '<li class="gallery__item">',
                '  <a class="gallery__link" href="{}">'.format(item["src"]),
                '    <img class="gallery__img" src="{}"{} loading="lazy" decoding="async" alt="{}">'.format(
                    item["src"], dims, alt
                ),
                "  </a>",
                "</li>",
            ]
    return "\n".join(INDENT + line for line in lines)


def write_page(markup):
    with open(PAGE, encoding="utf-8") as f:
        page = f.read()
    start = page.find(START_MARK)
    end = page.find(END_MARK)
    if start == -1 or end == -1:
        sys.exit("Markers not found in " + PAGE)
    start += len(START_MARK)
    page = page[:start] + "\n" + markup + "\n" + INDENT + page[end:]
    with open(PAGE, "w", encoding="utf-8", newline="\n") as f:
        f.write(page)


def main():
    sources = source_images()
    items = build_images(sources)
    write_page(gallery_markup(items))
    if items:
        print("Built {} portfolio images.".format(len(items)))
    else:
        print("No images found; rendered {} placeholders.".format(PLACEHOLDER_COUNT))
    if Image is None:
        print("Pillow not installed: skipped web-optimized copies.")


if __name__ == "__main__":
    main()
