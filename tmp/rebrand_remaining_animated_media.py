import cv2, subprocess, os, math
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cairosvg
from io import BytesIO
SRC='public/changelog/2026-05-04-cookie.banner.mp4'
OUT='public/changelog/.2026-05-04-cookie.banner.rebrand.mp4'
LOGO='public/images/zbt-negru.svg'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
raw=cairosvg.svg2png(bytestring=open(LOGO,'rb').read(),output_width=600)
lf=Image.open(BytesIO(raw)).convert('RGBA'); a=np.array(lf)[:,:,3]; ys,xs=np.where(a>5); lf=lf.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)); icon=lf.crop((0,0,int(lf.width*.38),lf.height)); ia=np.array(icon)[:,:,3]; ys,xs=np.where(ia>5); icon=icon.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))

def bgmed(fr,x,y,w,h):
 H,W=fr.shape[:2]; sx0=min(W-1,x+w+3); sx1=min(W,sx0+max(8,w//3)); sy0=max(0,y);sy1=min(H,y+h); s=fr[sy0:sy1,sx0:sx1]
 if s.size<10:s=fr[max(0,y-3):min(H,y+h+3),max(0,x):min(W,x+w)]
 return tuple(int(v) for v in np.median(s.reshape(-1,3),axis=0)) if s.size else (248,248,245)

def patch_brand(fr,x,y,w,h,s,footer=False):
 H,W=fr.shape[:2]; x=int(round(x));y=int(round(y));w=max(3,int(round(w)));h=max(3,int(round(h)))
 pw=w if footer else max(w,int(round(112*s))); pw=min(pw,W-x); h=min(h,H-y)
 if x<0 or y<0 or x>=W or y>=H or pw<=0 or h<=0:return
 bg=bgmed(fr,x,y,pw,h); roi=np.zeros((h,pw,3),np.uint8);roi[:]=bg
 pil=Image.fromarray(cv2.cvtColor(roi,cv2.COLOR_BGR2RGBA));d=ImageDraw.Draw(pil)
 if footer:
  fs=max(5,int(round(7*s))); f=ImageFont.truetype(REG,fs); label='Privacy by'; tx=max(1,int(2*s));ty=max(0,int(4*s));d.text((tx,ty),label,font=f,fill=(100,100,100,255));tw=d.textlength(label,font=f)
  ih=max(8,int(round(10*s)));iw=max(8,int(icon.width/icon.height*ih));ic=icon.resize((iw,ih),Image.Resampling.LANCZOS);ix=int(tx+tw+3*s);iy=max(0,int((h-ih)/2));pil.alpha_composite(ic,(ix,iy));bf=ImageFont.truetype(BOLD,max(5,int(round(6.4*s))));d.text((ix+iw+max(1,int(2*s)),max(0,int(5*s))),'ZEBRABYTE',font=bf,fill=(25,25,25,255))
 else:
  ih=max(11,int(round(17*s)));iw=max(11,int(icon.width/icon.height*ih));ic=icon.resize((iw,ih),Image.Resampling.LANCZOS);ix=max(1,int(7*s));iy=max(0,int((h-ih)/2));pil.alpha_composite(ic,(ix,iy));f=ImageFont.truetype(BOLD,max(7,int(round(10*s))));d.text((ix+iw+max(2,int(4*s)),max(0,int(6*s))),'ZEBRABYTE',font=f,fill=(20,20,20,255))
 fr[y:y+h,x:x+pw]=cv2.cvtColor(np.array(pil),cv2.COLOR_RGBA2BGR)

def patch_domain(fr,x,y,w,h,s):
 H,W=fr.shape[:2];x=int(round(x));y=int(round(y));w=int(round(w));h=int(round(h));pw=min(W-x,max(w,int(150*s)));h=min(h,H-y)
 if pw<=0 or h<=0:return
 bg=bgmed(fr,x,y,pw,h);roi=np.zeros((h,pw,3),np.uint8);roi[:]=bg;pil=Image.fromarray(cv2.cvtColor(roi,cv2.COLOR_BGR2RGBA));d=ImageDraw.Draw(pil);f=ImageFont.truetype(REG,max(6,int(round(8.2*s))));d.text((max(1,int(3*s)),max(0,int(6*s))),'https://zebrabyte.ro',font=f,fill=(70,70,70,255));fr[y:y+h,x:x+pw]=cv2.cvtColor(np.array(pil),cv2.COLOR_RGBA2BGR)

def interp(points,i):
 if len(points)==1:return points[0][1:]
 if i<=points[0][0]: a,b=points[0],points[1]
 elif i>=points[-1][0]: a,b=points[-2],points[-1]
 else:
  for j in range(len(points)-1):
   if points[j][0]<=i<=points[j+1][0]:a,b=points[j],points[j+1];break
 r=(i-a[0])/(b[0]-a[0]);return tuple(a[k]+r*(b[k]-a[k]) for k in range(1,6))

header2=[(710,485,65,88,36,1.1),(720,543,102,80,33,1.0),(730,568,118,80,33,1.0)]
footer2=[(500,1556,916,94,23,1.0),(510,1545,918,103,25,1.1),(520,1448,942,150,36,1.6),(525,1408,952,169,41,1.8)]
domain1=[(210,761,245,144,32,1.2),(220,706,276,132,29,1.1),(230,679,290,132,29,1.1),(240,671,297,120,27,1.0)]
domain2=[(290,660,302,120,27,1.0),(300,660,302,120,27,1.0),(310,660,302,120,27,1.0)]
cap=cv2.VideoCapture(SRC);fps=cap.get(cv2.CAP_PROP_FPS);n=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));W=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));H=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
cmd=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',OUT]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
counts={'header':0,'footer':0,'domain':0,'status':0};i=0
while True:
 ok,fr=cap.read()
 if not ok:break
 if 402<=i<=505: patch_brand(fr,590,132,80,33,1.0,False);counts['header']+=1
 elif 700<=i<=735:
  x,y,w,h,s=interp(header2,i);patch_brand(fr,x,y,w,h,s,False);counts['header']+=1
 if 402<=i<=500: patch_brand(fr,1556,916,94,23,1.0,True);counts['footer']+=1
 elif 501<=i<=530:
  x,y,w,h,s=interp(footer2,i);patch_brand(fr,x,y,w,h,s,True);counts['footer']+=1
 if 205<=i<=245:
  x,y,w,h,s=interp(domain1,i);patch_domain(fr,x,y,w,h,s);counts['domain']+=1
 elif 285<=i<=315:
  x,y,w,h,s=interp(domain2,i);patch_domain(fr,x,y,w,h,s);counts['domain']+=1
 if 296<=i<=345:
  x0,y0,x1,y1=125,937,790,953;samp=fr[y0:y1,800:900]
  if samp.size:
   bg=tuple(int(v) for v in np.median(samp.reshape(-1,3),axis=0));cv2.rectangle(fr,(x0,y0),(x1,y1),bg,-1);counts['status']+=1
 proc.stdin.write(fr.tobytes());i+=1
cap.release();proc.stdin.close();rc=proc.wait()
if rc: raise SystemExit(rc)
if i != n: raise RuntimeError(f'frame count mismatch: {i} != {n}')
os.replace(OUT,SRC)
print('rc',rc,'frames',i,'counts',counts,'size',os.path.getsize(SRC))
