"""Fit palette inputs to an existing set of hand-picked neutrals.

Reads `--color-<token>: #rrggbb` declarations from a CSS file. The light set
is everything before the first rule whose selector contains
`[data-theme="dark"]`; the dark set is the body of that rule.

  python3 fit_palette.py theme.css
      Least-squares fit of every input against the default ladder
      (ladders.json), per theme, with the ΔE of each token.

  python3 fit_palette.py theme.css light '<inputs json>' ['<ladder overrides json>']
      Evaluate explicit inputs, e.g.
      '{"hue":286,"tint":0.003,"paper":1,"depth":0.0175,"ink":0.141,"ink_step":0.145,"ink_tint":0.012}'
      '{"field":0,"line-3":-7.4,"ink-2":1.58}'

ΔE is OKLab distance × 100. Under ~2 is visually the same colour.
Grounds and lines: L = paper + depth × n.  Inks: L = ink + ink_step × n.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from oklch import dE, lch2hex, oklch  # noqa: E402

SURF = ["ground", "panel", "surface", "surface-2", "surface-3", "field",
        "line", "line-2", "line-3", "field-line"]
INK = ["ink", "ink-2", "ink-3", "ink-4"]
LADDERS = json.loads((Path(__file__).parent / "ladders.json").read_text())


def grab(css: str, dark: bool) -> dict:
    parts = re.split(r'[^{}]*\[data-theme="dark"\][^{]*\{', css, maxsplit=1)
    if dark:
        if len(parts) < 2:
            return {}
        css = parts[1].split("}", 1)[0]
    else:
        css = parts[0]
    found = {}
    for t in SURF + INK:
        m = re.search(r"--color-" + re.escape(t) + r":\s*(#[0-9a-fA-F]{6})", css)
        if m:
            found[t] = m.group(1)
    return found


def lsq(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    vx = sum((x - mx) ** 2 for x in xs)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / vx if vx else 0
    return my - b * mx, b


def auto_fit(found: dict, ladder: dict) -> dict:
    out = {}
    for keys, base, step, tint in ((SURF, "paper", "depth", "tint"),
                                   (INK, "ink", "ink_step", "ink_tint")):
        ks = [k for k in keys if k in found]
        if len(ks) < 2:
            continue
        a, b = lsq([ladder[k] for k in ks], [oklch(found[k])[0] for k in ks])
        chroma = sorted(oklch(found[k])[1] for k in ks)[len(ks) // 2]
        hues = [oklch(found[k])[2] for k in ks if oklch(found[k])[1] > 0.002]
        out.update({base: round(a, 4), step: round(b, 4), tint: round(chroma, 4)})
        if hues:
            out["hue"] = round(sum(hues) / len(hues))
    out.setdefault("hue", 0)
    return out


def report(found: dict, inputs: dict, ladder: dict) -> float:
    worst = 0.0
    for k, hexv in found.items():
        if k in SURF:
            L, c = inputs["paper"] + inputs["depth"] * ladder[k], inputs["tint"]
        else:
            L, c = inputs["ink"] + inputs["ink_step"] * ladder[k], inputs["ink_tint"]
        got = lch2hex(L, c, inputs["hue"])
        e = dE(hexv, got)
        worst = max(worst, e)
        print(f"  {k:11} {hexv} -> {got}  dE {e:4.1f}{'  !!' if e > 2 else ''}")
    print(f"  worst dE {worst:.2f}")
    return worst


def main():
    css = Path(sys.argv[1]).read_text()
    if len(sys.argv) >= 4:
        scheme = sys.argv[2]
        inputs = json.loads(sys.argv[3])
        ladder = {**LADDERS[scheme], **(json.loads(sys.argv[4]) if len(sys.argv) > 4 else {})}
        report(grab(css, scheme == "dark"), inputs, ladder)
        return
    for scheme in ("light", "dark"):
        found = grab(css, scheme == "dark")
        if not found:
            continue
        inputs = auto_fit(found, LADDERS[scheme])
        print(f"== {scheme}  {json.dumps(inputs)}")
        report(found, inputs, LADDERS[scheme])


if __name__ == "__main__":
    main()
