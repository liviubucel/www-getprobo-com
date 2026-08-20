from __future__ import annotations

import json
import re
from pathlib import Path
from io import BytesIO

import cv2
import cairosvg
import numpy as np
import pytesseract
from PIL import Image

ROOT = Path('.')
OUT = Path('/tmp/global-visual-audit')
OUT.mkdir(parents=True, exist_ok=True)
REPORT = OUT / 'report.txt'
MEDIA_EXTS = {'.png','.jpg','.jpeg','.webp','.gif','.avif','.svg','.mp4','.webm','.mov','.m4v'}
SKIP_PARTS = {'.git','node_modules','dist'}


def norm(s: str) -> str:
    return re.sub(r'[^a-z0-9]', '', s.lower().replace('0','o').replace('|','l'))


def legacy(s: str) -> bool:
    n = norm(s)
    return 'probo' in n or 'getprobo' in n or n in {'prbo','pr0bo'}


def ocr_array(arr: np.ndarray) -> list[tuple[str,int,int,int,int,str]]:
    if arr.ndim == 4:
        arr = cv2.cvtColor(arr, cv2.COLOR_RGBA2RGB)
    if arr.ndim == 2:
        arr = cv2.cvtColor(arr, cv2.COLOR_GRAY2RGB)
    h,w = arr.shape[:2]
    scale = min(2.0, 1800/max(w,h)) if max(w,h) else 1.0
    if scale > 1.05:
        arr = cv2.resize(arr, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    data = pytesseract.image_to_data(arr, output_type=pytesseract.Output.DICT, config='--psm 11')
    hits=[]
    for i,t in enumerate(data.get('text', [])):
        t=(t or '').strip()
        if legacy(t):
            hits.append((t,int(data['left'][i]),int(data['top'][i]),int(data['width'][i]),int(data['height'][i]),str(data['conf'][i])))
    return hits


def save_preview(arr: np.ndarray, name: str) -> None:
    p = OUT/'hits'/name
    p.parent.mkdir(parents=True, exist_ok=True)
    if arr.ndim == 3 and arr.shape[2] == 4:
        arr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA)
    elif arr.ndim == 3:
        arr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(p), arr)


def audit_raster(path: Path, lines: list[str]) -> None:
    try:
        im = Image.open(path)
    except Exception as e:
        lines.append(f'ERROR raster {path}: {e}')
        return
    total = getattr(im, 'n_frames', 1)
    wanted = sorted(set([0, total//4, total//2, (3*total)//4, max(0,total-1)])) if total>1 else [0]
    for idx in wanted:
        try:
            im.seek(idx)
            frame = im.convert('RGB')
            arr=np.array(frame)
            hits=ocr_array(arr)
            if hits:
                lines.append(f'MATCH raster {path} frame={idx}/{total} size={frame.width}x{frame.height} hits={hits}')
                save_preview(arr, f'{path.as_posix().replace("/","__")}-f{idx}.png')
        except Exception as e:
            lines.append(f'ERROR raster-frame {path} frame={idx}: {e}')


def audit_svg(path: Path, lines: list[str]) -> None:
    try:
        text=path.read_text(encoding='utf-8', errors='ignore')
        literals=[m.group(0) for m in re.finditer(r'(?is).{0,50}(?:getprobo|probo).{0,50}',text)]
        if literals:
            lines.append(f'MATCH svg-text {path} snippets={literals[:8]}')
        png=cairosvg.svg2png(bytestring=text.encode(), output_width=1600, background_color='white')
        arr=np.array(Image.open(BytesIO(png)).convert('RGB'))
        hits=ocr_array(arr)
        if hits:
            lines.append(f'MATCH svg-render {path} hits={hits}')
            save_preview(arr, f'{path.as_posix().replace("/","__")}.png')
    except Exception as e:
        lines.append(f'ERROR svg {path}: {e}')


def audit_video(path: Path, lines: list[str]) -> None:
    cap=cv2.VideoCapture(str(path))
    if not cap.isOpened():
        lines.append(f'ERROR video-open {path}')
        return
    fps=cap.get(cv2.CAP_PROP_FPS) or 30.0
    count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration=count/fps if fps else 0
    step=max(1, round(fps/2))
    hits_found=0
    idx=0
    while True:
        ok,frame=cap.read()
        if not ok: break
        if idx % step == 0 or idx == count-1:
            rgb=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            hits=ocr_array(rgb)
            if hits:
                lines.append(f'MATCH video {path} frame={idx} t={idx/fps:.3f}s/{duration:.3f}s hits={hits}')
                if hits_found < 6:
                    save_preview(rgb, f'{path.as_posix().replace("/","__")}-f{idx}.png')
                hits_found+=1
        idx+=1
    cap.release()


def audit_rendered_lottie(lines: list[str]) -> None:
    rendered=OUT/'lottie-rendered'
    if not rendered.exists():
        lines.append('LOTTIE_RENDERED 0')
        return
    frames=sorted(rendered.glob('*.png'))
    lines.append(f'LOTTIE_RENDERED {len(frames)}')
    for p in frames:
        try:
            arr=np.array(Image.open(p).convert('RGB'))
            hits=ocr_array(arr)
            if hits:
                lines.append(f'MATCH lottie-render {p.name} hits={hits}')
                save_preview(arr, f'lottie__{p.name}')
        except Exception as e:
            lines.append(f'ERROR lottie-render {p}: {e}')


def main() -> None:
    lines=[]
    media=[]
    for p in ROOT.rglob('*'):
        if not p.is_file(): continue
        if any(part in SKIP_PARTS for part in p.parts): continue
        if p.suffix.lower() in MEDIA_EXTS:
            media.append(p)
    counts={}
    for p in media: counts[p.suffix.lower()]=counts.get(p.suffix.lower(),0)+1
    lines.append('INVENTORY '+json.dumps(counts, sort_keys=True))
    lines.append(f'TOTAL_MEDIA {len(media)}')

    for i,p in enumerate(sorted(media),1):
        ext=p.suffix.lower()
        print(f'[{i}/{len(media)}] {p}', flush=True)
        if ext == '.svg': audit_svg(p,lines)
        elif ext in {'.png','.jpg','.jpeg','.webp','.gif','.avif'}: audit_raster(p,lines)
        else: audit_video(p,lines)

    audit_rendered_lottie(lines)

    source_exts={'.astro','.tsx','.ts','.jsx','.js','.svelte','.md','.mdx','.css','.scss','.html','.json'}
    for p in ROOT.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in source_exts: continue
        if any(part in SKIP_PARTS for part in p.parts): continue
        try: text=p.read_text(encoding='utf-8', errors='ignore')
        except Exception: continue
        if re.search(r'(?i)(getprobo|probo\.com|/probo[-_/]|probo-logo)', text):
            snippets=[m.group(0).replace('\n',' ') for m in re.finditer(r'(?is).{0,80}(?:getprobo|probo\.com|/probo[-_/]|probo-logo).{0,80}', text)]
            if snippets:
                lines.append(f'SOURCE_REF {p} snippets={snippets[:12]}')

    REPORT.write_text('\n'.join(lines), encoding='utf-8')
    print('\n--- GLOBAL VISUAL AUDIT ---')
    print(REPORT.read_text(encoding='utf-8'))

if __name__=='__main__': main()
