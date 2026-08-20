import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root='.';
const out='/tmp/global-visual-audit/lottie-rendered';
fs.mkdirSync(out,{recursive:true});
const player=fs.readFileSync('node_modules/lottie-web/build/player/lottie.min.js','utf8');
const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/opt/google/chrome/chrome','/snap/bin/chromium','/usr/bin/chromium-browser','/usr/bin/chromium'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('Chrome/Chromium executable not found');

function walk(dir){
  const result=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','dist','.astro'].includes(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) result.push(...walk(p));
    else if(ent.isFile() && ent.name.endsWith('.json')) result.push(p);
  }
  return result;
}
function isLottie(data){
  return data && typeof data==='object' && Array.isArray(data.layers) && Number.isFinite(Number(data.w)) && Number.isFinite(Number(data.h)) && Number.isFinite(Number(data.fr));
}
const files=[];
for(const file of walk(root)){
  try{
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    if(isLottie(data)) files.push([file,data]);
  }catch{}
}
console.log(`LOTTIE_COUNT ${files.length}`);
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
for(const [file,data] of files){
  const page=await browser.newPage();
  const w=Math.max(1,Math.min(1600,Number(data.w)));
  const h=Math.max(1,Math.min(1600,Number(data.h)));
  await page.setViewport({width:w,height:h,deviceScaleFactor:1});
  const payload=JSON.stringify(data).replace(/<\/script/gi,'<\\/script');
  await page.setContent(`<html><body style="margin:0;background:white"><div id="a" style="width:${w}px;height:${h}px"></div><script>${player}</script><script>window.DATA=${payload};window.anim=lottie.loadAnimation({container:document.getElementById('a'),renderer:'svg',loop:false,autoplay:false,animationData:window.DATA});window.ready=new Promise(r=>window.anim.addEventListener('DOMLoaded',r));</script></body></html>`,{waitUntil:'load'});
  await page.evaluate(()=>window.ready);
  const ip=Number(data.ip||0), op=Number(data.op||ip+1);
  const frames=[0,.08,.2,.4,.6,.8,.95,.995].map(x=>Math.floor(ip+(op-ip)*x));
  const safe=file.replace(/^\.\//,'').replaceAll('/','__').replaceAll('\\','__').replace(/\.json$/,'');
  for(const frame of [...new Set(frames)]){
    await page.evaluate(f=>window.anim.goToAndStop(f,true),frame);
    await new Promise(r=>setTimeout(r,60));
    await page.screenshot({path:path.join(out,`${safe}--${String(frame).padStart(5,'0')}.png`),clip:{x:0,y:0,width:w,height:h}});
  }
  await page.close();
}
await browser.close();
