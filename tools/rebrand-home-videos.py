#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from pathlib import Path

import cairosvg
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "public" / "videos"
MARK_SVG = ROOT / "public" / "favicon.svg"
TMP = ROOT / ".home-video-rebrand"
TMP.mkdir(exist_ok=True)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/noto/NotoSans-ExtraCondensedBold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
FONT_PATH = next((path for path in FONT_CANDIDATES if Path(path).exists()), FONT_CANDIDATES[-1])

svg = MARK_SVG.read_text(encoding="utf-8").replace("currentColor", "#ffffff")
mark_png = TMP / "zebrabyte-mark.png"
cairosvg.svg2png(bytestring=svg.encode(), write_to=str(mark_png), output_width=256, output_height=256)
MARK_MASTER = Image.open(mark_png).convert("RGBA")
ICON_CACHE: dict[int, np.ndarray] = {}
TEXT_CACHE: dict[tuple[int, int, int], np.ndarray] = {}
COVER_CACHE: dict[tuple[int, int, tuple[int, int, int]], np.ndarray] = {}


def app_icon(side: int) -> np.ndarray:
    if side in ICON_CACHE:
        return ICON_CACHE[side]
    image = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    radius = max(5, int(side * 0.18))
    draw.rounded_rectangle((0, 0, side - 1, side - 1), radius=radius, fill=(20, 30, 18, 255))
    padding = int(side * 0.18)
    mark = MARK_MASTER.resize((side - 2 * padding, side - 2 * padding), Image.Resampling.LANCZOS)
    image.alpha_composite(mark, (padding, padding))
    rgba = np.asarray(image)
    result = rgba[..., [2, 1, 0, 3]]
    ICON_CACHE[side] = result
    return result


def text_overlay(size: int, width: int, height: int) -> np.ndarray:
    key = (size, width, height)
    if key in TEXT_CACHE:
        return TEXT_CACHE[key]
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(FONT_PATH, size)
    draw.text((0, -1), "ZebraByte", font=font, fill=(20, 20, 20, 255))
    rgba = np.asarray(image)
    result = rgba[..., [2, 1, 0, 3]]
    TEXT_CACHE[key] = result
    return result


def solid_overlay(width: int, height: int, bgr: tuple[int, int, int]) -> np.ndarray:
    key = (width, height, bgr)
    if key in COVER_CACHE:
        return COVER_CACHE[key]
    overlay = np.empty((height, width, 4), np.uint8)
    overlay[:, :, :3] = bgr
    overlay[:, :, 3] = 255
    COVER_CACHE[key] = overlay
    return overlay


def alpha_blend(frame: np.ndarray, overlay: np.ndarray, x: int, y: int, opacity: float = 1.0) -> None:
    height, width = overlay.shape[:2]
    frame_height, frame_width = frame.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(frame_width, x + width), min(frame_height, y + height)
    if x0 >= x1 or y0 >= y1:
        return
    ox, oy = x0 - x, y0 - y
    patch = overlay[oy : oy + y1 - y0, ox : ox + x1 - x0]
    alpha = patch[:, :, 3:4].astype(np.float32) * (opacity / 255.0)
    base = frame[y0:y1, x0:x1].astype(np.float32)
    frame[y0:y1, x0:x1] = np.clip(
        patch[:, :, :3].astype(np.float32) * alpha + base * (1.0 - alpha),
        0,
        255,
    ).astype(np.uint8)


def local_background(frame: np.ndarray, x0: int, y0: int, x1: int, y1: int) -> tuple[int, int, int]:
    frame_height, frame_width = frame.shape[:2]
    padding = 10
    roi = frame[
        max(0, y0 - padding) : min(frame_height, y1 + padding),
        max(0, x0 - padding) : min(frame_width, x1 + padding),
    ]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    neutral_light = (hsv[:, :, 1] < 45) & (hsv[:, :, 2] > 150)
    values = roi[neutral_light]
    if len(values) > 30:
        return tuple(int(value) for value in np.median(values, axis=0))
    return (250, 250, 247)


def probo_candidate(frame: np.ndarray):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # Probo's lime app mark is the only lime-on-dark object in these four keyshots.
    mask = cv2.inRange(hsv, np.array([30, 70, 70]), np.array([43, 255, 255]))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if area < 15 or width < 4 or height < 4 or width > 120 or height > 120 or x > 450:
            continue
        moments = cv2.moments(contour)
        cx = moments["m10"] / moments["m00"] if moments["m00"] else x + width / 2
        cy = moments["m01"] / moments["m00"] if moments["m00"] else y + height / 2
        radius = max(18, int(max(width, height) * 1.15))
        roi = frame[
            max(0, int(cy - radius)) : min(frame.shape[0], int(cy + radius)),
            max(0, int(cx - radius)) : min(frame.shape[1], int(cx + radius)),
        ]
        dark_ratio = (cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY) < 90).mean() if roi.size else 0
        if dark_ratio <= 0.025:
            continue
        score = area * dark_ratio
        candidate = (score, width, height, dark_ratio, cx, cy)
        if best is None or candidate[0] > best[0]:
            best = candidate
    return best


def rebrand_frame(frame: np.ndarray, keyshot: int) -> tuple[np.ndarray, bool]:
    candidate = probo_candidate(frame)
    if not candidate:
        return frame, False

    _, width, height, dark_ratio, cx, cy = candidate
    side = max(24, int(round(max(width, height) + 10)))
    icon_x = int(round(cx - side / 2))
    icon_y = int(round(cy - side / 2))
    # Preserve original fade/scale transitions rather than making the replacement pop in.
    opacity = min(1.0, max(0.12, dark_ratio / 0.16))

    background = local_background(frame, icon_x, icon_y, icon_x + side, icon_y + side)
    alpha_blend(frame, solid_overlay(side, side, background), icon_x, icon_y, opacity)
    alpha_blend(frame, app_icon(side), icon_x, icon_y, opacity)

    # keyshot2 contains only the app mark. The other clips contain the Probo name + APP tag;
    # keep APP/time exactly in place and replace only the brand name.
    if keyshot in (1, 3, 4):
        gap = int(side * 0.42)
        word_width = int(side * 1.28)
        word_height = int(side * 0.55)
        word_x = icon_x + side + gap
        word_y = icon_y - 2
        word_background = local_background(
            frame,
            word_x,
            word_y,
            word_x + word_width,
            word_y + word_height,
        )
        alpha_blend(
            frame,
            solid_overlay(word_width, word_height, word_background),
            word_x,
            word_y,
            opacity,
        )
        font_size = max(10, int(side * 0.30))
        alpha_blend(
            frame,
            text_overlay(font_size, word_width, word_height),
            word_x,
            word_y,
            opacity,
        )

    return frame, True


def process_video(keyshot: int) -> None:
    source = VIDEO_DIR / f"keyshot{keyshot}.mp4"
    output = TMP / f"keyshot{keyshot}.mp4"
    capture = cv2.VideoCapture(str(source))
    fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

    command = [
        "ffmpeg",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{width}x{height}",
        "-r",
        str(fps),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    changed = 0
    frames = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        frame, did_change = rebrand_frame(frame, keyshot)
        changed += int(did_change)
        frames += 1
        assert encoder.stdin is not None
        encoder.stdin.write(frame.tobytes())
    capture.release()
    assert encoder.stdin is not None
    encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError(f"ffmpeg failed for keyshot{keyshot}")
    output.replace(source)
    print(f"keyshot{keyshot}: rebranded {changed}/{frames} frames")


for number in (1, 2, 3, 4):
    process_video(number)
