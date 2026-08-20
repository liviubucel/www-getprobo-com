from __future__ import annotations

import base64
import json
import re
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

SLACK = Path("public/lottie/trust-center/slack.json")
PAGE = Path("src/pages/products/compliance-portal.astro")
ASSET_ID = "zebrabyte-slack-brand-overlay"
LAYER_NAME = "ZebraByte Slack Brand Overlay"


def brand_overlay_png() -> bytes:
    width, height = 190, 66
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Hide only the legacy brand row. The lower-right area remains transparent
    # so the original "New Access Request" line is never covered.
    draw.rectangle((0, 0, 64, 65), fill=(255, 255, 255, 255))
    draw.rectangle((63, 7, 188, 41), fill=(255, 255, 255, 255))

    mark_png = cairosvg.svg2png(
        bytestring=Path("public/favicon.svg").read_bytes(),
        output_width=48,
        output_height=48,
    )
    mark = Image.open(BytesIO(mark_png)).convert("RGBA")
    image.alpha_composite(mark, (8, 8))

    font_path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if not font_path.exists():
        font_path = Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf")
    font = ImageFont.truetype(str(font_path), 12)
    app_font = ImageFont.truetype(str(font_path), 9)

    text_x, text_y = 66, 13
    draw.text((text_x, text_y), "ZEBRABYTE", font=font, fill=(38, 38, 38, 255))
    text_width = int(draw.textlength("ZEBRABYTE", font=font))

    badge_x = text_x + text_width + 5
    badge_y = 11
    badge_w, badge_h = 29, 20
    draw.rounded_rectangle(
        (badge_x, badge_y, badge_x + badge_w, badge_y + badge_h),
        radius=5,
        fill=(238, 238, 238, 255),
    )
    app_width = int(draw.textlength("APP", font=app_font))
    draw.text(
        (badge_x + (badge_w - app_width) / 2, badge_y + 4),
        "APP",
        font=app_font,
        fill=(104, 104, 104, 255),
    )

    out = BytesIO()
    image.save(out, format="PNG", optimize=True)
    return out.getvalue()


def patch_slack_lottie() -> None:
    data = json.loads(SLACK.read_text(encoding="utf-8"))

    data["assets"] = [a for a in data.get("assets", []) if a.get("id") != ASSET_ID]
    data["layers"] = [l for l in data.get("layers", []) if l.get("nm") != LAYER_NAME]

    png = brand_overlay_png()
    data.setdefault("assets", []).append(
        {
            "id": ASSET_ID,
            "w": 190,
            "h": 66,
            "p": "data:image/png;base64," + base64.b64encode(png).decode("ascii"),
            "e": 1,
        }
    )

    max_ind = max((int(layer.get("ind", 0)) for layer in data.get("layers", [])), default=0)
    overlay_layer = {
        "ddd": 0,
        "ind": max_ind + 1,
        "ty": 2,
        "nm": LAYER_NAME,
        "refId": ASSET_ID,
        "sr": 1,
        "ks": {
            "o": {"a": 0, "k": 100, "ix": 11},
            "r": {"a": 0, "k": 0, "ix": 10},
            "p": {"a": 0, "k": [309, 483, 0], "ix": 2, "l": 2},
            "a": {"a": 0, "k": [95, 33, 0], "ix": 1, "l": 2},
            "s": {"a": 0, "k": [100, 100, 100], "ix": 6, "l": 2},
        },
        "ao": 0,
        "ip": float(data.get("ip", 0)),
        "op": float(data.get("op", 1290.6)),
        "st": float(data.get("ip", 0)),
        "bm": 0,
    }

    # Lottie renders lower-index AE layers above the following layers.
    data.setdefault("layers", []).insert(0, overlay_layer)
    SLACK.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")


def patch_page() -> None:
    text = PAGE.read_text(encoding="utf-8")

    replacements = [
        (
            "Security teams use Probo to share the right materials, protect sensitive documents, and keep access requests moving.",
            "Reference teams used this compliance-portal model to share the right materials, protect sensitive documents, and keep access requests moving.",
        ),
        (
            "&ldquo;Probo handled our SOC 2 and compliance, so we could focus on building.&rdquo;",
            "&ldquo;Much of the SOC 2 and compliance workload was handled outside the product team, so it could stay focused on building.&rdquo;",
        ),
        ("https://compliance.probo.com/", "https://trust.zebrabyte.ro/"),
        ("https://www.probo.com/products/compliance-portal", "https://www.zebrabyte.ro/compliance-portal"),
        ("https://www.probo.com", "https://www.zebrabyte.ro"),
        ("Probo Compliance Portal", "ZebraByte Compliance Portal"),
    ]
    for old, new in replacements:
        text = text.replace(old, new)

    text = re.sub(r"\bProbo\b", "ZebraByte", text)
    text = re.sub(r"\bgetprobo\b", "ZebraByte", text, flags=re.IGNORECASE)

    leftovers = re.findall(r"(?i)\bprobo\b|getprobo|(?:^|\.)probo\.com", text)
    if leftovers:
        raise RuntimeError(f"Legacy page branding remains: {leftovers[:20]}")

    PAGE.write_text(text, encoding="utf-8")


def main() -> None:
    patch_slack_lottie()
    patch_page()
    print(f"Patched {SLACK}")
    print(f"Patched {PAGE}")


if __name__ == "__main__":
    main()
