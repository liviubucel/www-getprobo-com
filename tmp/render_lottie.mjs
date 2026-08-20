import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const files=['slack.json','nda.json','authentication.json','updates.json'];
const out='/tmp/compliance-media-audit/rendered'; fs.mkdirSync(out,{recursive:true});
const player=fs.readFileSync('node_modules/lottie-web/build/player/lottie.min.js','utf8');
const candidates=['/snap/bin/chromium','/usr/bin/chromium-browser','/usr/bin/chromium'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('Chromium executable not found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
for(const file of files){
  const data=JSON.parse(fs.readFileSync(path.join('public/lottie/trust-center',file),'utf8'));
  const page=await browser.newPage();
  await page.setViewport({width:data.w,height:data.h,deviceScaleFactor:1});
  await page.setContent(`<html><body style="margin:0;background:white"><div id="a" style="width:${data.w}px;height:${data.h}px"></div><script>${player}</script><script>window.DATA=${JSON.stringify(data)};window.anim=lottie.loadAnimation({container:document.getElementById('a'),renderer:'svg',loop:false,autoplay:false,animationData:window.DATA});window.ready=new Promise(r=>window.anim.addEventListener('DOMLoaded',r));</script></body></html>`,{waitUntil:'load'});
  await page.evaluate(()=>window.ready);
  const frames=[0,.1,.25,.5,.75,.9,.99].map(x=>Math.floor(data.ip+(data.op-data.ip)*x));
  for(const frame of frames){
    await page.evaluate(f=>window.anim.goToAndStop(f,true),frame);
    await new Promise(r=>setTimeout(r,100));
    await page.screenshot({path:path.join(out,`${file.replace('.json','')}-${String(frame).padStart(4,'0')}.png`),clip:{x:0,y:0,width:data.w,height:data.h}});
  }
  await page.close();
}
await browser.close();
