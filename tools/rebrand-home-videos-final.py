import base64
import cv2
import numpy as np
import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SPECS = {
    1: dict(ref_t=1.0, core=(170,324,56,56), side=76, offset=(4,4), roi=(0,80,650,650), threshold=.72, slack=True, title=True, title_offset=96, title_size=28, title_width=180, redraw_meta=False),
    2: dict(ref_t=1.0, core=(174,198,56,56), side=64, offset=(3,3), roi=(60,70,500,620), threshold=.68, slack=False, title=False),
    3: dict(ref_t=2.0, core=(73,378,56,56), side=72, offset=(4,4), roi=(0,180,700,700), threshold=.68, slack=False, title=True, title_offset=96, title_size=22, title_width=300, redraw_meta=True),
    4: dict(ref_t=1.0, core=(151,290,56,56), side=69, offset=(4,4), roi=(0,40,700,700), threshold=.68, slack=False, title=True, title_offset=96, title_size=22, title_width=300, redraw_meta=True),
}

FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FONT_REG = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
MARK_W = MARK_H = 48
mark_alpha = np.frombuffer(
    base64.b64decode(Path("/tmp/home-video-mark-alpha.b64").read_text().strip()),
    dtype=np.uint8,
).reshape(MARK_H, MARK_W)


def frame_at(path: str, seconds: float):
    cap = cv2.VideoCapture(path)
    cap.set(cv2.CAP_PROP_POS_MSEC, seconds * 1000)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise RuntimeError(path)
    return frame


def rounded_mask(side: int, radius: int):
    m = np.zeros((side, side), np.uint8)
    cv2.rectangle(m, (radius, 0), (side - radius - 1, side - 1), 255, -1)
    cv2.rectangle(m, (0, radius), (side - 1, side - radius - 1), 255, -1)
    for cx, cy in ((radius,radius),(side-radius-1,radius),(radius,side-radius-1),(side-radius-1,side-radius-1)):
        cv2.circle(m, (cx, cy), radius, 255, -1)
    return m


def make_tile(side: int):
    tile = np.zeros((side, side, 4), np.uint8)
    tile[:, :, :3] = (17, 34, 16)
    tile[:, :, 3] = rounded_mask(side, max(4, round(side * .17)))
    padding = max(5, round(side * .22))
    inner = side - 2 * padding
    mark = cv2.resize(mark_alpha, (inner, inner), interpolation=cv2.INTER_LANCZOS4)
    a = mark[:, :, None].astype(np.float32) / 255.0
    roi = tile[padding:padding+inner, padding:padding+inner]
    roi[:, :, :3] = (255 * a + roi[:, :, :3] * (1 - a)).astype(np.uint8)
    return tile


def card_bg(frame, x, y, side):
    x1 = max(0, x - 15); y1 = max(0, y - 15)
    x2 = min(frame.shape[1], x + side + 210); y2 = min(frame.shape[0], y + side + 20)
    reg = frame[y1:y2, x1:x2]
    hsv = cv2.cvtColor(reg, cv2.COLOR_BGR2HSV)
    good = (hsv[:, :, 1] < 35) & (hsv[:, :, 2] > 170)
    vals = reg[good]
    if len(vals) < 30:
        return tuple(int(v) for v in np.median(reg.reshape(-1,3), axis=0))
    lum = np.mean(vals, axis=1)
    vals = vals[lum >= np.percentile(lum, 55)]
    return tuple(int(v) for v in np.median(vals, axis=0))


def logo_strength(frame, x, y, side, bg, ref_strength):
    p = frame[max(0,y):min(frame.shape[0],y+side), max(0,x):min(frame.shape[1],x+side)]
    if p.size == 0:
        return 0.0
    diff = np.mean(np.abs(p.astype(np.float32) - np.array(bg, np.float32)))
    return float(np.clip(diff / max(ref_strength, 1e-3), 0, 1))


def blend_rgba(frame, overlay, x, y, alpha_scale):
    h, w = overlay.shape[:2]
    if x < 0 or y < 0 or x + w > frame.shape[1] or y + h > frame.shape[0]:
        return
    a = overlay[:, :, 3:4].astype(np.float32) / 255.0 * alpha_scale
    dst = frame[y:y+h, x:x+w].astype(np.float32)
    frame[y:y+h, x:x+w] = (overlay[:, :, :3].astype(np.float32) * a + dst * (1-a)).astype(np.uint8)


def fill(frame, box, bg):
    x1,y1,x2,y2 = [int(v) for v in box]
    x1=max(0,x1); y1=max(0,y1); x2=min(frame.shape[1],x2); y2=min(frame.shape[0],y2)
    if x2 > x1 and y2 > y1:
        frame[y1:y2, x1:x2] = bg


def detect_all(gray, tpl, roi, threshold):
    rx1,ry1,rx2,ry2 = roi
    res = cv2.matchTemplate(gray[ry1:ry2, rx1:rx2], tpl, cv2.TM_CCOEFF_NORMED)
    work = res.copy(); out = []
    for _ in range(5):
        _, score, _, loc = cv2.minMaxLoc(work)
        if score < threshold:
            break
        gx, gy = rx1 + loc[0], ry1 + loc[1]
        out.append((gx, gy, float(score)))
        x,y = loc
        work[max(0,y-55):min(work.shape[0],y+55), max(0,x-70):min(work.shape[1],x+70)] = -1
    return out


def draw_title(frame, x, y, cfg, strength):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    im = Image.fromarray(rgb)
    draw = ImageDraw.Draw(im, "RGBA")
    tx = x + cfg["title_offset"]
    by = y + 4
    alpha = int(255 * strength)
    font = ImageFont.truetype(FONT_BOLD, cfg["title_size"])
    draw.text((tx, by), "ZEBRABYTE", font=font, fill=(18,18,18,alpha))
    if cfg.get("redraw_meta"):
        bbox = draw.textbbox((tx,by), "ZEBRABYTE", font=font)
        nx = bbox[2] + 12
        app_font = ImageFont.truetype(FONT_REG, 18)
        time_font = ImageFont.truetype(FONT_REG, 23)
        pill_y = by + 2; pill_w = 47; pill_h = 27
        draw.rounded_rectangle((nx,pill_y,nx+pill_w,pill_y+pill_h), radius=6, fill=(224,224,224,alpha))
        draw.text((nx+7,pill_y+3), "APP", font=app_font, fill=(105,105,105,alpha))
        nx += pill_w + 17
        draw.text((nx,by+1), "9:16 AM", font=time_font, fill=(95,95,95,alpha))
    frame[:] = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)


def process(idx: int, cfg):
    src = f"public/videos/keyshot{idx}.mp4"
    dst = f"/tmp/keyshot{idx}-final.mp4"
    ref = frame_at(src, cfg["ref_t"])
    cx,cy,cw,ch = cfg["core"]
    tpl = cv2.cvtColor(ref[cy:cy+ch, cx:cx+cw], cv2.COLOR_BGR2GRAY)
    side = cfg["side"]; offx,offy = cfg["offset"]
    tile = make_tile(side)
    rx, ry = cx-offx, cy-offy
    rbg = card_bg(ref, rx, ry, side)
    ref_strength = np.mean(np.abs(ref[ry:ry+side,rx:rx+side].astype(np.float32) - np.array(rbg,np.float32)))

    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    enc = subprocess.Popen([
        "ffmpeg","-loglevel","error","-y","-f","rawvideo","-pix_fmt","bgr24",
        "-s",f"{width}x{height}","-r",f"{fps:.8f}","-i","-","-an","-c:v","libx264",
        "-preset","slow","-tune","animation","-crf","15","-pix_fmt","yuv420p","-movflags","+faststart",dst
    ], stdin=subprocess.PIPE)

    detected_frames = 0; multi_frames = 0; max_instances = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        det = detect_all(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), tpl, cfg["roi"], cfg["threshold"])
        if det: detected_frames += 1
        if len(det) > 1: multi_frames += 1
        max_instances = max(max_instances, len(det))
        for lx,ly,_ in sorted(det, key=lambda d: d[1]):
            x,y = lx-offx, ly-offy
            bg = card_bg(frame,x,y,side)
            strength = logo_strength(frame,x,y,side,bg,ref_strength)
            if strength < .025:
                continue
            slack = None
            if cfg.get("slack"):
                sx,sy = x+52,y+54
                if 0 <= sx < width-30 and 0 <= sy < height-30:
                    slack = frame[sy:sy+30,sx:sx+30].copy()

            # Remove original pixels completely using the actual card surface from this frame.
            fill(frame,(x-2,y-2,x+side+2,y+side+2),bg)
            if cfg.get("title"):
                tx = x + cfg["title_offset"]
                fill(frame,(tx-4,y-5,tx+cfg["title_width"],y+39),bg)

            # ZebraByte follows the original element's fade/opacity, so transitions stay native.
            blend_rgba(frame,tile,x,y,strength)
            if slack is not None:
                sx,sy = x+52,y+54
                frame[sy:sy+30,sx:sx+30] = slack
            if cfg.get("title"):
                draw_title(frame,x,y,cfg,strength)
        enc.stdin.write(frame.tobytes())

    cap.release(); enc.stdin.close()
    if enc.wait() != 0:
        raise RuntimeError(f"encode failed for keyshot{idx}")
    os.replace(dst, src)
    print(f"keyshot{idx}: frames={total}; detected={detected_frames}; multi={multi_frames}; max_instances={max_instances}")


for idx, cfg in SPECS.items():
    process(idx, cfg)
