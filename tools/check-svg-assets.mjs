import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const roots=["public","src/assets"], bare=/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, failures=[];
async function walk(dir){let es;try{es=await readdir(dir,{withFileTypes:true})}catch(e){if(e?.code==='ENOENT')return;throw e}for(const e of es){const f=path.join(dir,e.name);if(e.isDirectory()){await walk(f);continue}if(!e.isFile()||!e.name.toLowerCase().endsWith('.svg'))continue;const s=await readFile(f,'utf8');if([...s.matchAll(bare)].length)failures.push(`${f}: unescaped XML entity '&'`);if(!/<svg\b/i.test(s)||!/<\/svg>/i.test(s))failures.push(`${f}: missing <svg> root/end tag`)}}
for(const root of roots)await walk(root);if(failures.length){console.error('SVG asset validation failed:\n'+failures.map(x=>`- ${x}`).join('\n'));process.exit(1)}console.log('SVG assets: sanity checks passed.');
