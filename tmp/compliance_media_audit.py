from __future__ import annotations
import base64, json, re
from io import BytesIO
from pathlib import Path
import numpy as np, pytesseract, cairosvg
from PIL import Image

OUT=Path('/tmp/compliance-media-audit'); OUT.mkdir(parents=True,exist_ok=True)
LOTTIES=[Path('public/lottie/trust-center')/n for n in ['slack.json','nda.json','authentication.json','updates.json']]
SVGS=[Path('public/trust-center')/n for n in ['browser.svg','documents.svg','pdf.svg','audit-row-1.svg','audit-row-2.svg','audit-row-3.svg','subprocessor-docusign.svg','subprocessor-hubspot.svg','subprocessor-linear.svg','subprocessor-stripe.svg','data-requests.svg','security-encryption.svg','security-privacy.svg','security-monitoring.svg','security-vulnerability.svg','quote-ellipse.svg','ellipse.svg']]

def norm(s): return re.sub(r'[^a-z0-9]','',s.lower().replace('0','o'))
def legacy(s): return 'probo' in norm(s) or 'getprobo' in norm(s)
def ocr(img):
    d=pytesseract.image_to_data(np.array(img.convert('RGB')),output_type=pytesseract.Output.DICT,config='--psm 11')
    return [(t,int(d['left'][i]),int(d['top'][i]),int(d['width'][i]),int(d['height'][i]),d['conf'][i]) for i,t in enumerate(d.get('text',[])) if legacy((t or '').strip())]

def walk_layers(layers,prefix=''):
    out=[]
    for i,l in enumerate(layers or []):
        nm=str(l.get('nm',''))
        if re.search(r'(?i)(logo|probo|app|slack|brand|header)',nm):
            out.append((prefix+i.__str__(),nm,l.get('ty'),l.get('refId'),l.get('parent'),l.get('ks',{}).get('p'),l.get('ks',{}).get('s')))
    return out

report=[]
for p in LOTTIES:
    obj=json.loads(p.read_text())
    report.append(f'LOTTIE {p} size={obj.get("w")}x{obj.get("h")} fr={obj.get("fr")} ip={obj.get("ip")} op={obj.get("op")}')
    for row in walk_layers(obj.get('layers',[])): report.append('  LAYER '+repr(row))
    for ai,a in enumerate(obj.get('assets',[])):
        if a.get('layers'):
            for row in walk_layers(a.get('layers'),f'asset{ai}:'): report.append('  PRECOMP_LAYER '+repr(row))
        src=a.get('p','')
        if isinstance(src,str) and src.startswith('data:image/'):
            try:
                img=Image.open(BytesIO(base64.b64decode(src.split(',',1)[1]))).convert('RGBA')
                hits=ocr(img)
                report.append(f'  IMAGE_ASSET {ai} id={a.get("id")} size={img.width}x{img.height} hits={hits}')
                if hits: img.save(OUT/f'{p.stem}-asset-{ai}.png')
            except Exception as e: report.append(f'  IMAGE_ASSET {ai} error={e}')
    report.append('')

for p in SVGS:
    if not p.exists(): continue
    text=p.read_text(errors='ignore'); literal=[m.group(0) for m in re.finditer(r'(?i).{0,30}(?:probo|getprobo).{0,30}',text)]
    try:
        img=Image.open(BytesIO(cairosvg.svg2png(bytestring=text.encode(),output_width=1400))).convert('RGBA'); hits=ocr(img)
    except Exception as e:
        hits=[]; report.append(f'SVG {p} raster_error={e}')
    if literal or hits:
        report.append(f'SVG {p} literal={literal[:5]} ocr={hits}'); img.save(OUT/f'svg-{p.stem}.png')

page=Path('src/pages/products/compliance-portal.astro').read_text(errors='ignore')
for m in re.finditer(r'(?i).{0,70}(?:probo|getprobo).{0,70}',page): report.append('PAGE_TEXT '+m.group(0).replace('\n',' '))
(OUT/'report.txt').write_text('\n'.join(report)); print((OUT/'report.txt').read_text())
