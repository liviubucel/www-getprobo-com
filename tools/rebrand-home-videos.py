#!/usr/bin/env python3
"""Apply precomputed frame tracking to the four original Probo homepage MP4s.

This helper intentionally has no third-party Python dependencies. FFmpeg decodes the
original MP4 into raw BGR frames, this program changes only the tracked Probo brand
pixels, then FFmpeg encodes the same frame sequence again. Motion/content stays intact.
"""

from __future__ import annotations

import base64
import json
import sys
import zlib
from pathlib import Path

WIDTH = 1000
HEIGHT = 720
FRAME_BYTES = WIDTH * HEIGHT * 3
MARK_WIDTH = 48
MARK_HEIGHT = 48
TEXT_WIDTH = 86
TEXT_HEIGHT = 21
DARK_BGR = (18, 30, 20)  # ZebraByte #141e12
WHITE_BGR = (255, 255, 255)

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
TRACKS = json.loads(
    zlib.decompress(
        base64.b64decode((TOOLS / "home-video-tracking.b64").read_text(encoding="ascii").strip())
    )
)
MARK_ALPHA = base64.b64decode(
    (TOOLS / "home-video-mark-alpha.b64").read_text(encoding="ascii").strip()
)
TEXT_ALPHA = base64.b64decode(
    (TOOLS / "home-video-text-alpha.b64").read_text(encoding="ascii").strip()
)

ICON_CACHE: dict[int, tuple[int, int, bytearray]] = {}
TEXT_CACHE: dict[int, tuple[int, int, bytes]] = {}


def scale_alpha(source: bytes, source_width: int, source_height: int, width: int, height: int) -> bytes:
    output = bytearray(width * height)
    for y in range(height):
        sy = min(source_height - 1, (y * source_height) // max(1, height))
        source_row = sy * source_width
        target_row = y * width
        for x in range(width):
            sx = min(source_width - 1, (x * source_width) // max(1, width))
            output[target_row + x] = source[source_row + sx]
    return bytes(output)


def rounded_inside(x: int, y: int, side: int, radius: int) -> bool:
    if radius <= 0:
        return True
    if radius <= x < side - radius or radius <= y < side - radius:
        return True
    cx = radius if x < radius else side - radius - 1
    cy = radius if y < radius else side - radius - 1
    dx = x - cx
    dy = y - cy
    return dx * dx + dy * dy <= radius * radius


def icon_pixels(side: int) -> tuple[int, int, bytearray]:
    cached = ICON_CACHE.get(side)
    if cached:
        return cached

    padding = max(1, int(side * 0.18))
    mark_side = max(1, side - 2 * padding)
    mark = scale_alpha(MARK_ALPHA, MARK_WIDTH, MARK_HEIGHT, mark_side, mark_side)
    radius = max(4, int(side * 0.18))
    rgba = bytearray(side * side * 4)

    for y in range(side):
        for x in range(side):
            pos = (y * side + x) * 4
            if not rounded_inside(x, y, side, radius):
                continue

            b, g, r = DARK_BGR
            mx = x - padding
            my = y - padding
            if 0 <= mx < mark_side and 0 <= my < mark_side:
                mark_alpha = mark[my * mark_side + mx]
                inverse = 255 - mark_alpha
                b = (WHITE_BGR[0] * mark_alpha + b * inverse + 127) // 255
                g = (WHITE_BGR[1] * mark_alpha + g * inverse + 127) // 255
                r = (WHITE_BGR[2] * mark_alpha + r * inverse + 127) // 255

            rgba[pos] = b
            rgba[pos + 1] = g
            rgba[pos + 2] = r
            rgba[pos + 3] = 255

    result = (side, side, rgba)
    ICON_CACHE[side] = result
    return result


def text_pixels(side: int) -> tuple[int, int, bytes]:
    cached = TEXT_CACHE.get(side)
    if cached:
        return cached
    width = max(1, round(TEXT_WIDTH * side / 72))
    height = max(1, round(TEXT_HEIGHT * side / 72))
    alpha = scale_alpha(TEXT_ALPHA, TEXT_WIDTH, TEXT_HEIGHT, width, height)
    result = (width, height, alpha)
    TEXT_CACHE[side] = result
    return result


def blend_channel(old: int, new: int, alpha: int) -> int:
    return (new * alpha + old * (255 - alpha) + 127) // 255


def blend_solid(
    frame: bytearray,
    x: int,
    y: int,
    width: int,
    height: int,
    bgr: tuple[int, int, int],
    opacity: int,
) -> None:
    if opacity <= 0:
        return
    x0 = max(0, x)
    y0 = max(0, y)
    x1 = min(WIDTH, x + width)
    y1 = min(HEIGHT, y + height)
    for py in range(y0, y1):
        row = py * WIDTH * 3
        for px in range(x0, x1):
            pos = row + px * 3
            frame[pos] = blend_channel(frame[pos], bgr[0], opacity)
            frame[pos + 1] = blend_channel(frame[pos + 1], bgr[1], opacity)
            frame[pos + 2] = blend_channel(frame[pos + 2], bgr[2], opacity)


def blend_icon(frame: bytearray, x: int, y: int, side: int, opacity: int) -> None:
    width, height, rgba = icon_pixels(side)
    for oy in range(height):
        py = y + oy
        if not 0 <= py < HEIGHT:
            continue
        frame_row = py * WIDTH * 3
        overlay_row = oy * width * 4
        for ox in range(width):
            px = x + ox
            if not 0 <= px < WIDTH:
                continue
            overlay_pos = overlay_row + ox * 4
            intrinsic = rgba[overlay_pos + 3]
            if not intrinsic:
                continue
            alpha = intrinsic * opacity // 255
            pos = frame_row + px * 3
            frame[pos] = blend_channel(frame[pos], rgba[overlay_pos], alpha)
            frame[pos + 1] = blend_channel(frame[pos + 1], rgba[overlay_pos + 1], alpha)
            frame[pos + 2] = blend_channel(frame[pos + 2], rgba[overlay_pos + 2], alpha)


def blend_text(frame: bytearray, x: int, y: int, side: int, opacity: int) -> None:
    width, height, alpha_mask = text_pixels(side)
    for oy in range(height):
        py = y + oy
        if not 0 <= py < HEIGHT:
            continue
        frame_row = py * WIDTH * 3
        mask_row = oy * width
        for ox in range(width):
            px = x + ox
            if not 0 <= px < WIDTH:
                continue
            intrinsic = alpha_mask[mask_row + ox]
            if not intrinsic:
                continue
            alpha = intrinsic * opacity // 255
            pos = frame_row + px * 3
            frame[pos] = blend_channel(frame[pos], 20, alpha)
            frame[pos + 1] = blend_channel(frame[pos + 1], 20, alpha)
            frame[pos + 2] = blend_channel(frame[pos + 2], 20, alpha)


def edit_frame(frame: bytearray, keyshot: int, frame_index: int) -> None:
    entry = TRACKS[str(keyshot)]["entries"].get(str(frame_index))
    if not entry:
        return

    icon_x, icon_y, side, opacity, bg_b, bg_g, bg_r, word_b, word_g, word_r = entry
    icon_background = (bg_b, bg_g, bg_r)
    blend_solid(frame, icon_x, icon_y, side, side, icon_background, opacity)
    blend_icon(frame, icon_x, icon_y, side, opacity)

    if keyshot in (1, 3, 4):
        gap = int(side * 0.42)
        word_width = int(side * 1.28)
        word_height = int(side * 0.55)
        word_x = icon_x + side + gap
        word_y = icon_y - 2
        word_background = (word_b, word_g, word_r)
        blend_solid(
            frame,
            word_x,
            word_y,
            word_width,
            word_height,
            word_background,
            opacity,
        )
        blend_text(frame, word_x, word_y, side, opacity)


def read_exact(stream, size: int) -> bytes:
    chunks = []
    remaining = size
    while remaining:
        chunk = stream.read(remaining)
        if not chunk:
            break
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in {"1", "2", "3", "4"}:
        print("usage: rebrand-home-videos.py <1|2|3|4>", file=sys.stderr)
        return 2

    keyshot = int(sys.argv[1])
    source = sys.stdin.buffer
    target = sys.stdout.buffer
    frame_index = 0

    while True:
        raw = read_exact(source, FRAME_BYTES)
        if not raw:
            break
        if len(raw) != FRAME_BYTES:
            raise RuntimeError(f"partial raw frame: {len(raw)} bytes")
        frame = bytearray(raw)
        edit_frame(frame, keyshot, frame_index)
        target.write(frame)
        frame_index += 1

    expected = TRACKS[str(keyshot)]["frames"]
    if frame_index != expected:
        raise RuntimeError(f"keyshot{keyshot}: expected {expected} frames, received {frame_index}")
    print(f"keyshot{keyshot}: processed {frame_index} original frames", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
