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
ASSET_ID = "zebrabyte-slack-brand-local"
LAYER_NAME = "ZebraByte Slack Brand Local"


def brand_overlay_png() -> bytes:
    width, height = 290, 70
    image = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)

    # This rectangle covers only the legacy logo + Probo + APP region.
    # The timestamp starts to the right of this area and remains untouched.
    draw.rectangle((0, 0, 289, 69), fill=(255, 255, 255, 255))

    logo_png = cairosvg.svg2png(
        bytestring=Path("public/images/zbt-negru.svg").read_bytes(),
        output_width=150,
        output_height=44,
    )
    logo = Image.open(BytesIO(logo_png)).convert("RGBA")
    image.alpha_composite(logo, (10, 13))

    font_path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if not font_path.exists():
        font_path = Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf")
    app_font = ImageFont.truetype(str(font_path), 14)

    badge_x, badge_y, badge_w, badge_h = 173, 20, 48, 28
    draw.rounded_rectangle(
        (badge_x, badge_y, badge_x + badge_w, badge_y + badge_h),
        radius=7,
        fill=(238, 238, 238, 255),
    )
    app_width = int(draw.textlength("APP", font=app_font))
    draw.text(
        (badge_x + (badge_w - app_width) / 2, badge_y + 5),
        "APP",
        font=app_font,
        fill=(104, 104, 104, 255),
    )

    out = BytesIO()
    image.save(out, format="PNG", optimize=True)
    return out.getvalue()


def local_overlay_layer(ind: int, parent: int | None, ip: float, op: float) -> dict:
    layer = {
        "ddd": 0,
        "ind": ind,
        "ty": 2,
        "nm": LAYER_NAME,
        "refId": ASSET_ID,
        "sr": 1,
        "ks": {
            "o": {"a": 0, "k": 100, "ix": 11},
            "r": {"a": 0, "k": 0, "ix": 10},
            "p": {"a": 0, "k": [145, 35, 0], "ix": 2, "l": 2},
            "a": {"a": 0, "k": [145, 35, 0], "ix": 1, "l": 2},
            "s": {"a": 0, "k": [100, 100, 100], "ix": 6, "l": 2},
        },
        "ao": 0,
        "ip": ip,
        "op": op,
        "st": ip,
        "bm": 0,
    }
    if parent is not None:
        layer["parent"] = parent
    return layer


def patch_slack_lottie() -> None:
    data = json.loads(SLACK.read_text(encoding="utf-8"))

    # Remove any previous experimental overlay.
    data["layers"] = [
        layer
        for layer in data.get("layers", [])
        if not str(layer.get("nm", "")).startswith("ZebraByte Slack Brand")
    ]
    for asset in data.get("assets", []):
        if asset.get("layers"):
            asset["layers"] = [
                layer
                for layer in asset["layers"]
                if not str(layer.get("nm", "")).startswith("ZebraByte Slack Brand")
            ]
    data["assets"] = [a for a in data.get("assets", []) if a.get("id") not in {ASSET_ID, "zebrabyte-slack-brand-overlay"}]

    png = brand_overlay_png()
    data.setdefault("assets", []).append(
        {
            "id": ASSET_ID,
            "w": 290,
            "h": 70,
            "p": "data:image/png;base64," + base64.b64encode(png).decode("ascii"),
            "e": 1,
        }
    )

    # These are the four internal Slack-card compositions used at different
    # points in the animation (9:18, 10:04 and 11:26 states). Parenting the
    # overlay to each card root makes it inherit the card's motion/zoom/fades.
    targets = {
        "355": None,
        "861": 362,
        "2494": 868,
        "3004": 2501,
    }
    assets_by_id = {str(a.get("id")): a for a in data.get("assets", [])}
    for asset_id, parent in targets.items():
        asset = assets_by_id.get(asset_id)
        if not asset or not asset.get("layers"):
            raise RuntimeError(f"Missing expected Slack card asset {asset_id}")
        max_ind = max((int(layer.get("ind", 0)) for layer in asset["layers"]), default=0)
        asset["layers"].insert(
            0,
            local_overlay_layer(
                max_ind + 10000,
                parent,
                float(data.get("ip", 0)),
                float(data.get("op", 1290.6)),
            ),
        )

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
