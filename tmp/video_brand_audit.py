from __future__ import annotations

from pathlib import Path
import re

import cv2
import pytesseract
from pytesseract import Output

VIDEOS = [
    Path("public/changelog/2026-04-03-markdown-copy-paste.mp4"),
    Path("public/changelog/2026-05-04-cookie.banner.mp4"),
]
REPORT = Path("/tmp/video-brand-audit/report.txt")
SAMPLE_FPS = 4.0


def normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower().replace("0", "o"))


def is_probo(value: str) -> bool:
    token = normalise(value)
    return "probo" in token or token in {"pr0bo", "proboapp", "proboapp"}


def main() -> None:
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []

    for video in VIDEOS:
        cap = cv2.VideoCapture(str(video))
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open {video}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps else 0.0
        step = max(1, round(fps / SAMPLE_FPS))

        lines.extend(
            [
                f"VIDEO {video}",
                f"DURATION {duration:.3f}",
                f"FPS {fps:.6f}",
                f"FRAMES {frame_count}",
                f"SIZE {width}x{height}",
                f"SAMPLE_STEP {step}",
            ]
        )

        index = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if index % step:
                index += 1
                continue

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            data = pytesseract.image_to_data(rgb, output_type=Output.DICT, config="--psm 11")
            timestamp = index / fps
            for i, text in enumerate(data.get("text", [])):
                text = (text or "").strip()
                if not is_probo(text):
                    continue
                lines.append(
                    "MATCH "
                    f"frame={index} t={timestamp:.3f}s text={text!r} "
                    f"conf={data['conf'][i]} "
                    f"box={data['left'][i]},{data['top'][i]},{data['width'][i]},{data['height'][i]}"
                )
            index += 1

        cap.release()
        lines.extend(["END_VIDEO", ""])

    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(REPORT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
