from __future__ import annotations
import base64, json, re
from io import BytesIO
from pathlib import Path
import cv2, numpy as np, pytesseract, cairosvg
from PIL import Image, ImageDraw, ImageFont

OUT=Path('/tmp/compliance-media-audit'); OUT.mkdir(parents=True,exist_ok=True)
LOTTIES=[Path('public/lottie/trust-center')/n for n in ['slack.json','nda.json','authentication.json','updates.json']]
SVGS=[Path('public/trust-center')/n for n in ['browser.svg','documents.svg','pdf.svg','audit-row-1.svg','audit-row-2.svg','audit-row-3.svg','subprocessor-docusign.svg','subprocessor-hubspot.svg','subprocessor-linear.svg','subprocessor-stripe.svg','data-requests.svg','security-encryption.svg','security-privacy.svg','security-monitoring.svg','security-vulnerability.svg','quote-ellipse.svg','ellipse.svg']]

def norm(s): return re.sub(r'[^a-z0-9]','',s.lower().replace('0','o'))
def legacy(s):
    n=norm(s)
    return 'probo' in n or 'getprobo' in n

def ocr(img):
    arr=np.array(img.convert('RGB'))
    d=pytesseract.image_to_data(arr,output_type=pytesseract.Output.DICT,config='--psm 11')
    hits=[]
    for i,t in enumerate(d.get('text',[])):
        t=(t or '').strip()
        if legacy(t): hits.append((t,int(d['left'][i]),int(d['top'][i]),int(d['width'][i]),int(d['height'][i]),d['conf'][i]))
    return hits

report=[]; previews=[]
for p in LOTTIES:
    obj=json.loads(p.read_text())
    report.append(f'LOTTIE {p}')
    for idx,a in enumerate(obj.get('assets',[])):
        src=a.get('p','')
        if not isinstance(src,str) or not src.startswith('data:image/'): continue
        try:
            raw=base64.b64decode(src.split(',',1)[1]); img=Image.open(BytesIO(raw)).convert('RGBA')
        except Exception as e:
            report.append(f'  asset={idx} decode_error={e}'); continue
        hits=ocr(img)
        if hits:
            name=f'{p.stem}-asset-{idx}.png'; img.save(OUT/name); previews.append(OUT/name)
            report.append(f'  MATCH asset={idx} size={img.width}x{img.height} hits={hits}')
    report.append('')

for p in SVGS:
    if not p.exists(): continue
    text=p.read_text(errors='ignore')
    literal=[m.group(0) for m in re.finditer(r'(?i).{0,30}(?:probo|getprobo).{0,30}',text)]
    try:
        png=cairosvg.svg2png(bytestring=text.encode(),output_width=1400)
        img=Image.open(BytesIO(png)).convert('RGBA')
        hits=ocr(img)
    except Exception as e:
        hits=[]; report.append(f'SVG {p} raster_error={e}')
    if literal or hits:
        name=f'svg-{p.stem}.png'; img.save(OUT/name); previews.append(OUT/name)
        report.append(f'SVG {p} literal={literal[:5]} ocr={hits}')

page=Path('src/pages/products/compliance-portal.astro').read_text(errors='ignore')
for m in re.finditer(r'(?i).{0,70}(?:probo|getprobo).{0,70}',page): report.append('PAGE_TEXT '+m.group(0).replace('\n',' '))
(OUT/'report.txt').write_text('\n'.join(report))
print((OUT/'report.txt').read_text())
