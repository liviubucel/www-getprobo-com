from __future__ import annotations

import json, re
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

import cv2, cairosvg, numpy as np, pytesseract
from PIL import Image

ROOT=Path('.')
OUT=Path('/tmp/global-visual-audit'); OUT.mkdir(parents=True,exist_ok=True)
REPORT=OUT/'report.txt'
RASTER={'.png','.jpg','.jpeg','.webp','.gif','.avif'}
VIDEO={'.mp4','.webm','.mov','.m4v'}
MEDIA=RASTER|VIDEO|{'.svg'}
SKIP={'.git','node_modules','dist'}

def norm(s): return re.sub(r'[^a-z0-9]','',s.lower().replace('0','o').replace('|','l'))
def legacy(s):
    n=norm(s); return 'probo' in n or 'getprobo' in n or n in {'prbo','pr0bo'}

def ocr(arr):
    if arr.ndim==4: arr=cv2.cvtColor(arr,cv2.COLOR_RGBA2RGB)
    if arr.ndim==2: arr=cv2.cvtColor(arr,cv2.COLOR_GRAY2RGB)
    h,w=arr.shape[:2]
    scale=min(1.7,1500/max(w,h)) if max(w,h) else 1
    if scale>1.08: arr=cv2.resize(arr,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
    d=pytesseract.image_to_data(arr,output_type=pytesseract.Output.DICT,config='--psm 11')
    return [(str(t).strip(),int(d['left'][i]),int(d['top'][i]),int(d['width'][i]),int(d['height'][i]),str(d['conf'][i])) for i,t in enumerate(d.get('text',[])) if legacy(str(t or '').strip())]

def preview(arr,name):
    p=OUT/'hits'/name; p.parent.mkdir(parents=True,exist_ok=True)
    if arr.ndim==3 and arr.shape[2]==4: arr=cv2.cvtColor(arr,cv2.COLOR_RGBA2BGRA)
    elif arr.ndim==3: arr=cv2.cvtColor(arr,cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(p),arr)

def audit_one(p):
    out=[]; ext=p.suffix.lower(); safe=p.as_posix().replace('/','__')
    try:
        if ext=='.svg':
            text=p.read_text(encoding='utf-8',errors='ignore')
            lit=[m.group(0) for m in re.finditer(r'(?is).{0,50}(?:getprobo|probo).{0,50}',text)]
            if lit: out.append(f'MATCH svg-text {p} snippets={lit[:8]}')
            arr=np.array(Image.open(BytesIO(cairosvg.svg2png(bytestring=text.encode(),output_width=1400,background_color='white'))).convert('RGB'))
            hits=ocr(arr)
            if hits: out.append(f'MATCH svg-render {p} hits={hits}'); preview(arr,safe+'.png')
        elif ext in RASTER:
            im=Image.open(p); total=getattr(im,'n_frames',1)
            wanted=sorted(set([0,total//4,total//2,(3*total)//4,max(0,total-1)])) if total>1 else [0]
            for idx in wanted:
                im.seek(idx); arr=np.array(im.convert('RGB')); hits=ocr(arr)
                if hits:
                    out.append(f'MATCH raster {p} frame={idx}/{total} size={im.width}x{im.height} hits={hits}')
                    preview(arr,f'{safe}-f{idx}.png')
        elif ext in VIDEO:
            # All distinct site videos were already audited frame-by-frame in the preceding video pass.
            out.append(f'PREVIOUSLY_VALIDATED video {p}')
    except Exception as e: out.append(f'ERROR {p}: {e}')
    return out

def audit_lottie():
    rendered=OUT/'lottie-rendered'; frames=sorted(rendered.glob('*.png')) if rendered.exists() else []
    lines=[f'LOTTIE_RENDERED {len(frames)}']
    def one(p):
        try:
            arr=np.array(Image.open(p).convert('RGB')); hits=ocr(arr)
            if hits: preview(arr,'lottie__'+p.name); return f'MATCH lottie-render {p.name} hits={hits}'
        except Exception as e: return f'ERROR lottie-render {p}: {e}'
        return None
    with ThreadPoolExecutor(max_workers=4) as ex:
        for r in ex.map(one,frames):
            if r: lines.append(r)
    return lines

def main():
    files=[p for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() in MEDIA and not any(x in SKIP for x in p.parts)]
    counts={}
    for p in files: counts[p.suffix.lower()]=counts.get(p.suffix.lower(),0)+1
    lines=['INVENTORY '+json.dumps(counts,sort_keys=True),f'TOTAL_MEDIA {len(files)}']
    with ThreadPoolExecutor(max_workers=4) as ex:
        jobs={ex.submit(audit_one,p):p for p in files}
        for i,f in enumerate(as_completed(jobs),1):
            p=jobs[f]; print(f'[{i}/{len(files)}] {p}',flush=True); lines.extend(f.result())
    lines.extend(audit_lottie())
    source_exts={'.astro','.tsx','.ts','.jsx','.js','.svelte','.md','.mdx','.css','.scss','.html','.json'}
    for p in ROOT.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in source_exts or any(x in SKIP for x in p.parts): continue
        try: text=p.read_text(encoding='utf-8',errors='ignore')
        except: continue
        if re.search(r'(?i)(getprobo|probo\.com|/probo[-_/]|probo-logo)',text):
            snippets=[m.group(0).replace('\n',' ') for m in re.finditer(r'(?is).{0,80}(?:getprobo|probo\.com|/probo[-_/]|probo-logo).{0,80}',text)]
            if snippets: lines.append(f'SOURCE_REF {p} snippets={snippets[:12]}')
    REPORT.write_text('\n'.join(lines),encoding='utf-8'); print(REPORT.read_text(encoding='utf-8'))

if __name__=='__main__': main()
