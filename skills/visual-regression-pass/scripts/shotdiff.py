"""Compare two labelled screenshot runs and write side-by-sides of what changed.

Layout: <root>/<label>/<app>/*.png

  python3 shotdiff.py <root> <labelA> <labelB> [app ...]

Prints, per app, how many shots changed and which are missing, with the
changed-pixel count and bounding box of each, and writes A|B side-by-sides to
<root>/diff/<labelB>/<app>/. A pixel counts as changed when any channel
differs by more than 16; a shot counts as changed above 50 pixels.
Needs Pillow.
"""
import os
import sys

from PIL import Image, ImageChops

THRESHOLD, MIN_PIXELS, MAX_WIDTH = 16, 50, 1400


def main():
    root, a, b, *apps = sys.argv[1:]
    apps = apps or sorted(x for x in os.listdir(f"{root}/{b}") if not x.startswith("."))
    for app in apps:
        pa, pb = f"{root}/{a}/{app}", f"{root}/{b}/{app}"
        if not os.path.isdir(pb):
            continue
        out = f"{root}/diff/{b}/{app}"
        os.makedirs(out, exist_ok=True)
        changed, missing = [], []
        for f in sorted(os.listdir(pa)):
            if not f.endswith(".png"):
                continue
            if not os.path.exists(f"{pb}/{f}"):
                missing.append(f)
                continue
            A = Image.open(f"{pa}/{f}").convert("RGB")
            B = Image.open(f"{pb}/{f}").convert("RGB")
            if A.size != B.size:
                changed.append((f, f"size {A.size} -> {B.size}"))
                continue
            mask = ImageChops.difference(A, B).point(lambda v: 255 if v > THRESHOLD else 0).convert("L")
            n = sum(1 for v in mask.getdata() if v)
            if n <= MIN_PIXELS:
                continue
            changed.append((f, n, mask.getbbox()))
            w, h = A.size
            s = min(1, MAX_WIDTH / (2 * w))
            pair = Image.new("RGB", (int(2 * w * s) + 10, int(h * s)), "white")
            pair.paste(A.resize((int(w * s), int(h * s))), (0, 0))
            pair.paste(B.resize((int(w * s), int(h * s))), (int(w * s) + 10, 0))
            pair.save(f"{out}/{f}")
        print(f"{app:28} changed {len(changed):3}  missing {len(missing)}")
        for row in sorted(changed, key=lambda r: -r[1] if isinstance(r[1], int) else 0)[:12]:
            print("    ", row)


if __name__ == "__main__":
    main()
