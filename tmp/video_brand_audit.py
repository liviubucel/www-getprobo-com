from __future__ import annotations

from pathlib import Path
import re

import cv2
import numpy as np
import pytesseract
from pytesseract import Output

VIDEOS = [
    Path("public/changelog/2026-04-03-markdown-copy-paste.mp4"),
    Path("public/changelog/2026-05-04-cookie.banner.mp4"),
]
OUT = Path("/tmp/video-brand-audit")
REPORT = OUT / "report.txt"
SAMPLE_FPS = 4.0


def normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower().replace("0", "o"))


def is_probo(value: str) -> bool:
    token = normalise(value)
    return "probo" in token or token in {"pr0bo", "proboapp", "proboapp"}


def collect_frame(video: Path, frame_index: int) -> np.ndarray | None:
    cap = cv2.VideoCapture(str(video))
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
    ok, frame = cap.read()
    cap.release()
    return frame if ok else None


def contact_sheet(video: Path, fps: float, frame_count: int, match_frames: list[int]) -> None:
    base_points = [0, frame_count // 4, frame_count // 2, (3 * frame_count) // 4, max(0, frame_count - 1)]
    clustered: list[int] = []
    for idx in sorted(set(match_frames)):
        if not clustered or idx - clustered[-1] >= max(1, round(fps * 0.35)):
            clustered.append(idx)
    wanted = sorted(set(base_points + clustered))[:15]

    thumbs: list[np.ndarray] = []
    for idx in wanted:
        frame = collect_frame(video, idx)
        if frame is None:
            continue
        h, w = frame.shape[:2]
        tw = 640
        th = max(1, round(h * tw / w))
        thumb = cv2.resize(frame, (tw, th), interpolation=cv2.INTER_AREA)
        label = f"frame {idx} | {idx / fps:.2f}s"
        cv2.rectangle(thumb, (0, 0), (250, 30), (0, 0, 0), -1)
        cv2.putText(thumb, label, (8, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)
        thumbs.append(thumb)

    if not thumbs:
        return
    cols = 3
    rows = (len(thumbs) + cols - 1) // cols
    cell_h = max(t.shape[0] for t in thumbs)
    sheet = np.full((rows * cell_h, cols * 640, 3), 245, dtype=np.uint8)
    for i, thumb in enumerate(thumbs):
        r, c = divmod(i, cols)
        sheet[r * cell_h : r * cell_h + thumb.shape[0], c * 640 : (c + 1) * 640] = thumb
    cv2.imwrite(str(OUT / f"{video.stem}-contact.jpg"), sheet, [int(cv2.IMWRITE_JPEG_QUALITY), 90])


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
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
        match_frames: list[int] = []

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
                match_frames.append(index)
                lines.append(
                    "MATCH "
                    f"frame={index} t={timestamp:.3f}s text={text!r} "
                    f"conf={data['conf'][i]} "
                    f"box={data['left'][i]},{data['top'][i]},{data['width'][i]},{data['height'][i]}"
                )
            index += 1

        cap.release()
        contact_sheet(video, fps, frame_count, match_frames)
        lines.extend(["END_VIDEO", ""])

    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(REPORT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
