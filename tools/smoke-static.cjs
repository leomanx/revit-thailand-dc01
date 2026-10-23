// HTTP payload smoke under a project subpath. This does not launch a browser.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createPreviewServer}=require('./serve.cjs');
const ROOT=path.resolve(__dirname,'..');
async function main(){const directory=path.join(ROOT,'dist'),manifest=JSON.parse(fs.readFileSync(path.join(directory,'release-manifest.json'),'utf8')),server=createPreviewServer({directory,base:'/dc01',entry:'index.html'});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const origin='http://127.0.0.1:'+server.address().port+'/dc01/';
 try{
  const root=await fetch(origin);if(!root.ok||!(await root.text()).includes('แบบเปลี่ยนหนึ่งฉบับ'))throw new Error('Incorrect showcase root');
  for(const f of manifest.files){const r=await fetch(new URL(f.path,origin));if(!r.ok)throw new Error('HTTP failure: '+f.path);const b=Buffer.from(await r.arrayBuffer());if(crypto.createHash('sha256').update(b).digest('hex')!==f.sha256)throw new Error('HTTP content mismatch: '+f.path);}
  const report={schema:'DC01-http-smoke-v1',version:manifest.appVersion,base:'/dc01/',root:'showcase',payloads:manifest.files.length,hashes:'pass',browser:false};fs.mkdirSync(path.join(ROOT,'output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'output/http-smoke.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await new Promise(resolve=>server.close(resolve));}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
