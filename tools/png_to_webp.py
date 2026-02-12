#!/usr/bin/env python3

from pathlib import Path
import subprocess
import re

#############################################
# CHANGE THIS EACH RUN
#############################################

RUN_DIR = Path("/home/greg/devplex/Nightland/nightlandapp/assets/images/sprites/monsters/")
LOSSLESS = True
QUALITY = 85   # great default for dark games

#############################################
# FILES TO EXCLUDE FROM CONVERSION
# Use just the filename, e.g. "icon.png"
# or a partial path, e.g. "icons/icon.png"
#############################################

EXCLUDE_FILES = [
    # "icon.png",
    # "splash.png",
    # "adaptive-icon.png",
]

#############################################

if not RUN_DIR.exists():
    raise SystemExit(f"\nDirectory not found:\n{RUN_DIR}\n")

print(f"\nProcessing directory:\n{RUN_DIR}\n")

#############################################
# Verify ImageMagick
#############################################

try:
    subprocess.run(
        ["magick", "-version"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )
except:
    raise SystemExit("ImageMagick not installed. sudo pacman -S imagemagick")

#############################################
# Convert PNG -> WEBP
#############################################

png_files = list(RUN_DIR.rglob("*.png"))

print(f"Found {len(png_files)} PNG files\n")


def is_excluded(png: Path) -> bool:
    for entry in EXCLUDE_FILES:
        # Match by filename only or by partial path suffix
        if png.name == entry or str(png).endswith(entry):
            return True
    return False


for png in png_files:

    if is_excluded(png):
        print(f"Excluded (skipping):         {png.name}")
        continue

    webp = png.with_suffix(".webp")

    if webp.exists():
        print(f"Skipping (already exists):   {png.name}")
        continue

    if LOSSLESS:
        subprocess.run([
            "magick",
            str(png),
            "-define",
            "webp:lossless=true",
            str(webp)
        ], check=True)
    else:
        subprocess.run([
            "magick",
            str(png),
            "-strip",
            "-quality",
            str(QUALITY),
            str(webp)
        ], check=True)

    print(f"Converted:                   {png.name}")

#############################################
# Rewrite references across repo
#############################################

repo_root = Path(__file__).resolve().parent.parent

code_exts = {".ts", ".tsx", ".js", ".jsx"}

png_regex = re.compile(r"""(['"])([^'"]+?\.png)\1""")

nonlocal_rewrites = [0]


def webp_exists_for_import_path(path: str) -> bool:
    if path.startswith("@assets/"):
        fs_path = path.replace("@assets/", "assets/", 1)
    elif path.startswith("@/"):
        fs_path = path.replace("@/", "", 1)
    elif path.startswith("/"):
        fs_path = path.lstrip("/")
    else:
        fs_path = path

    if "assets/" not in fs_path:
        return False

    return (repo_root / fs_path).with_suffix(".webp").exists()


def is_excluded_import(path: str) -> bool:
    for entry in EXCLUDE_FILES:
        if path.endswith(entry) or Path(path).name == entry:
            return True
    return False


SKIP_DIRS = {"node_modules", ".git", ".expo", ".next", "dist", "build"}


def repl(match):
    quote = match.group(1)
    path = match.group(2)

    if is_excluded_import(path):
        return match.group(0)

    if webp_exists_for_import_path(path):
        nonlocal_rewrites[0] += 1
        return f"{quote}{path[:-4]}.webp{quote}"

    return match.group(0)


for file in repo_root.rglob("*"):

    if any(part in SKIP_DIRS for part in file.parts):
        continue

    if not file.is_file():
        continue

    if file.suffix not in code_exts:
        continue

    text = file.read_text(encoding="utf-8", errors="ignore")

    new_text = png_regex.sub(repl, text)

    if new_text != text:
        file.write_text(new_text, encoding="utf-8")


rewrites = nonlocal_rewrites[0]

#############################################
# Delete PNGs (skips excluded files)
#############################################

for png in png_files:
    if is_excluded(png):
        continue
    if png.with_suffix(".webp").exists():
        png.unlink()

print("\nDONE.")
print(f"References updated: {rewrites}\n")
print("Now run:")
print("npx expo start -c\n")
