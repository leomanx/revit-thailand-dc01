// Native Canvas rendering of the component renderer; not browser/layout QA.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,GlobalFonts}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
if(fs.existsSync('C:/Windows/Fonts/arial.ttf'))GlobalFonts.registerFromPath('C:/Windows/Fonts/arial.ttf','Arial');
const ROOT=path.resolve(__dirname,'..'),D=require('../data/datacenter.json'),A=require('../dc-architecture.js');
const sheet=createCanvas(1800,2160),out=sheet.getContext('2d');out.fillStyle='#edf3f5';out.fillRect(0,0,1800,2160);
for(let i=0;i<A.cases.length;i++){
 const canvas=createCanvas(900,540),env={module:{exports:{}},localStorage:{getItem:()=>JSON.stringify({...A.create(),selected:A.cases[i].id})}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'dc-architecture.js'),'utf8'),env);
 const nodes=new Map(),host={set innerHTML(html){nodes.clear();for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],{});nodes.set('arch-canvas',canvas);},querySelector:s=>nodes.get(s.slice(1)),querySelectorAll:()=>[]};
 env.module.exports.mount(host,D,'ARC');out.drawImage(canvas,(i%2)*900,Math.floor(i/2)*540);
}
const dest=path.join(ROOT,'docs/ARCHITECTURE_PREVIEW.png');fs.writeFileSync(dest,sheet.toBuffer('image/png'));console.log('Wrote docs/ARCHITECTURE_PREVIEW.png (native renderer contact sheet)');
