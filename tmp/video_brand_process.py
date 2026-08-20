from __future__ import annotations

from functools import lru_cache
from io import BytesIO
from pathlib import Path
import re
import subprocess

import cairosvg
import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import pytesseract
from pytesseract import Output

VIDEO = Path("public/changelog/2026-05-04-cookie.banner.mp4")
OUTPUT = VIDEO.with_suffix(".zebrabyte.mp4")
LOGO_SVG = Path("public/images/zbt-negru.svg")
SAMPLE_STEP = 15


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower().replace("0", "o"))


def has_probo(frame: np.ndarray) -> bool:
    data = pytesseract.image_to_data(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), output_type=Output.DICT, config="--psm 11")
    return any("probo" in norm(t or "") for t in data.get("text", []))


def source_has_legacy_brand() -> bool:
    cap = cv2.VideoCapture(str(VIDEO))
    i = 0
    found = False
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % SAMPLE_STEP == 0 and has_probo(frame):
            found = True
            break
        i += 1
    cap.release()
    return found


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


@lru_cache(maxsize=16)
def logo_rgba(height: int) -> Image.Image:
    raw = cairosvg.svg2png(bytestring=LOGO_SVG.read_bytes(), output_height=max(32, height * 4))
    img = Image.open(BytesIO(raw)).convert("RGBA")
    width = max(1, round(img.width * height / img.height))
    return img.resize((width, height), Image.Resampling.LANCZOS)


def median_color(frame: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> tuple[int, int, int]:
    h, w = frame.shape[:2]
    x1, x2 = max(0, x1), min(w, x2)
    y1, y2 = max(0, y1), min(h, y2)
    patch = frame[y1:y2, x1:x2]
    if patch.size == 0:
        return (248, 248, 248)
    med = np.median(patch.reshape(-1, 3), axis=0).astype(np.uint8)
    return int(med[0]), int(med[1]), int(med[2])


def clear_rect(frame: np.ndarray, rect: tuple[int, int, int, int], sample: tuple[int, int, int, int] | None = None) -> None:
    x1, y1, x2, y2 = rect
    color = median_color(frame, *(sample or rect))
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness=-1)


def composite_logo(frame: np.ndarray, x: int, y: int, height: int) -> None:
    pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).convert("RGBA")
    logo = logo_rgba(height)
    pil.alpha_composite(logo, (x, y))
    frame[:] = cv2.cvtColor(np.asarray(pil.convert("RGB")), cv2.COLOR_RGB2BGR)


def draw_text(frame: np.ndarray, xy: tuple[int, int], text: str, size: int, fill: tuple[int, int, int] = (36, 36, 36)) -> None:
    pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil)
    draw.text(xy, text, font=font(size), fill=fill)
    frame[:] = cv2.cvtColor(np.asarray(pil), cv2.COLOR_RGB2BGR)


def find_app_window(frame: np.ndarray) -> tuple[int, int, int, int] | None:
    b, g, r = cv2.split(frame)
    mx = cv2.max(cv2.max(b, g), r)
    mn = cv2.min(cv2.min(b, g), r)
    mask = ((mx > 220) & ((mx - mn) < 38)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = frame.shape[:2]
    candidates: list[tuple[int, int, int, int]] = []
    for contour in contours:
        x, y, cw, ch = cv2.boundingRect(contour)
        if cw >= w * 0.42 and ch >= h * 0.30:
            candidates.append((x, y, cw, ch))
    return max(candidates, key=lambda q: q[2] * q[3]) if candidates else None


def edit_app_brand(frame: np.ndarray) -> None:
    win = find_app_window(frame)
    if not win:
        return
    x, y, w, _ = win
    if x > frame.shape[1] * 0.25:
        return
    clear_rect(frame, (x + 6, y + 7, min(x + 190, x + w - 5), y + 38), (x + 200, y + 8, min(x + 300, x + w - 5), y + 37))
    composite_logo(frame, x + 12, y + 13, 15)
    slash_x = x + 12 + logo_rgba(15).width + 10
    draw_text(frame, (slash_x, y + 12), "/  ZebraByte", 11, (55, 55, 55))


def edit_domain(frame: np.ndarray) -> None:
    clear_rect(frame, (658, 300, 825, 334), (620, 294, 860, 340))
    draw_text(frame, (675, 308), "https://zebrabyte.ro", 11, (45, 45, 45))


def edit_cookie_footer(frame: np.ndarray) -> None:
    clear_rect(frame, (1340, 964, 1545, 1025), (1290, 948, 1600, 1035))
    draw_text(frame, (1360, 982), "Privacy by", 14, (100, 100, 100))
    composite_logo(frame, 1442, 980, 18)


def edit_final_logo(frame: np.ndarray) -> None:
    brightness = float(np.mean(cv2.cvtColor(frame[110:170, 550:710], cv2.COLOR_BGR2GRAY)))
    if brightness < 165:
        return
    clear_rect(frame, (565, 112, 700, 165), (520, 105, 760, 172))
    composite_logo(frame, 585, 128, 20)


def edit_frame(frame: np.ndarray, t: float) -> np.ndarray:
    out = frame.copy()
    if t <= 6.70:
        edit_app_brand(out)
    if 4.05 <= t <= 4.75:
        edit_domain(out)
    if 8.80 <= t <= 10.45:
        edit_cookie_footer(out)
    if t >= 12.25:
        edit_final_logo(out)
    return out


def render() -> tuple[float, int, int, int]:
    cap = cv2.VideoCapture(str(VIDEO))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {VIDEO}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 60.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{width}x{height}", "-r", f"{fps:.6f}", "-i", "-",
        "-i", str(VIDEO),
        "-map", "0:v:0", "-map", "1:a?",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "copy", "-movflags", "+faststart", "-shortest", str(OUTPUT),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    index = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            edited = edit_frame(frame, index / fps)
            proc.stdin.write(edited.tobytes())
            index += 1
    finally:
        cap.release()
        proc.stdin.close()
    code = proc.wait()
    if code != 0:
        raise RuntimeError(f"ffmpeg exited with {code}")
    if index != frame_count:
        raise RuntimeError(f"Frame count mismatch while rendering: read {index}, expected {frame_count}")
    return fps, width, height, frame_count


def qa(expected: tuple[float, int, int, int]) -> None:
    fps, width, height, frame_count = expected
    cap = cv2.VideoCapture(str(OUTPUT))
    out_fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    out_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    out_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if abs(out_fps - fps) > 0.05 or out_w != width or out_h != height or abs(out_count - frame_count) > 1:
        raise RuntimeError(f"Output geometry mismatch: {out_fps=}, {out_w=}x{out_h=}, {out_count=}; expected {fps=}, {width=}x{height=}, {frame_count=}")

    leaks: list[str] = []
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % SAMPLE_STEP == 0:
            data = pytesseract.image_to_data(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), output_type=Output.DICT, config="--psm 11")
            for j, text in enumerate(data.get("text", [])):
                if "probo" in norm(text or ""):
                    leaks.append(f"frame={i} t={i / fps:.3f}s text={text!r} box={data['left'][j]},{data['top'][j]},{data['width'][j]},{data['height'][j]}")
        i += 1
    cap.release()
    if leaks:
        raise RuntimeError("Legacy Probo branding remains after render:\n" + "\n".join(leaks))


def main() -> None:
    if not source_has_legacy_brand():
        print("No sampled Probo branding remains; skipping render.")
        return
    meta = render()
    qa(meta)
    OUTPUT.replace(VIDEO)
    print(f"Rebranded and QA-passed: {VIDEO}")


if __name__ == "__main__":
    main()
