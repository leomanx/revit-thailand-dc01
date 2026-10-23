'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const runtime=['datacenter.html','dc.css','dc-engine.js','dc-viewer.js','dc-detail.js','dc-building.js','dc-ui.js','dc-zoning.js','dc-maintenance.js','dc-architecture.js','public-notes.html','feedback-template.md','lab.css','lab-engine.js','lab-ui.js','showcase.css','showcase.js','assets/dc01-campus.png','assets/social-card.png','assets/rt-mark.svg','data/datacenter.js','data/datacenter.json','data/dc-downloads.js','data/template.js','data/cde-template.json'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function siteUrl(value=''){
 if(!value)return '';
 const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||['localhost','127.0.0.1','[::1]','0.0.0.0'].includes(u.hostname))throw new Error('SITE_URL must be a public HTTPS site base URL without credentials/query/hash');
 return u.href.replace(/\/?$/,'/');
}
function safeDestination(dest){
 const root=fs.realpathSync(ROOT),resolved=path.resolve(dest),relative=path.relative(root,resolved);
 if(relative==='dist'||relative.startsWith('tmp'+path.sep)){
  let cursor=resolved;while(cursor!==root){if(fs.existsSync(cursor)&&fs.lstatSync(cursor).isSymbolicLink())throw new Error('Refusing symlink build destination');cursor=path.dirname(cursor);}
  return resolved;
 }
 throw new Error('Build destination must be project dist or a project tmp subdirectory');
}
function filesIn(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?filesIn(path.join(dir,d.name)):[path.join(dir,d.name)]).sort();}
function validate(dir){
 const missing=[],checked=[],root=path.resolve(dir);
 function check(value,source){
  const decoded=value.replaceAll('&amp;','&');if(!decoded||/^(?:https?:|mailto:|tel:|data:|blob:|#)/i.test(decoded))return;
  if(decoded.startsWith('/')||decoded.includes('\\'))throw new Error('Non-portable local URL in '+source+': '+value);
  const target=decodeURIComponent(decoded.split(/[?#]/)[0]);if(!target)return;
  const full=path.resolve(root,path.dirname(source),target);if(!full.startsWith(root+path.sep))throw new Error('URL escapes release root: '+value);
  checked.push(source+' → '+target);if(!fs.existsSync(full)||!fs.statSync(full).isFile())missing.push(source+' → '+value);
 }
 for(const f of filesIn(root)){const name=path.relative(root,f).replaceAll(path.sep,'/');if(name.endsWith('.html')){const html=fs.readFileSync(f,'utf8');for(const m of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g))check(m[1],name);for(const m of html.matchAll(/property="og:image" content="([^"]+)"/g))check(m[1],name);}if(name.endsWith('.css'))for(const m of fs.readFileSync(f,'utf8').matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))check(m[1],name);}
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/datacenter.json'),'utf8'));
 for(const f of data.files.filter(f=>f.download))check(f.download,'datacenter.html');check(data.samples.bundle,'datacenter.html');
 if(missing.length)throw new Error('Broken release links:\n'+missing.join('\n'));
 return {checked:checked.length,missing:[]};
}
function build({dest=path.join(ROOT,'dist'),publicUrl=process.env.SITE_URL||''}={}){
 dest=safeDestination(dest);const base=siteUrl(publicUrl),data=require('../data/datacenter.json');
 if(fs.existsSync(dest)){
  const marker=path.join(dest,'release-manifest.json');
  if(!fs.existsSync(marker)||JSON.parse(fs.readFileSync(marker,'utf8')).schema!=='DC01-static-release-v1')throw new Error('Refusing to replace unmanaged output directory');
 }
 if(fs.existsSync(path.join(ROOT,'tmp'))&&fs.lstatSync(path.join(ROOT,'tmp')).isSymbolicLink())throw new Error('Refusing symlink staging parent');fs.mkdirSync(path.join(ROOT,'tmp'),{recursive:true});const stage=fs.mkdtempSync(path.join(ROOT,'tmp','static-build-'));
 const copy=(source,target=source)=>{const from=path.join(ROOT,source);if(fs.lstatSync(from).isSymbolicLink())throw new Error('Runtime asset must not be a symlink: '+source);const to=path.join(stage,target);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
 try{
  for(const f of runtime)copy(f);
  copy('index.html','basics.html');
  for(const f of new Set([...data.files.filter(f=>f.download).map(f=>f.download),data.samples.bundle,'samples/manifest.json','samples/README.txt']))copy(f);
  let landing=fs.readFileSync(path.join(ROOT,'landing.html'),'utf8');
  if(base){const image=new URL('assets/social-card.png',base).href;landing=landing.replace('content="assets/social-card.png"','content="'+image+'"').replace('<!-- PUBLIC_URL_METADATA -->','<link rel="canonical" href="'+base+'"><meta property="og:url" content="'+base+'">');}
  fs.writeFileSync(path.join(stage,'index.html'),landing);
  fs.writeFileSync(path.join(stage,'landing.html'),landing);
  for(const html of filesIn(stage).filter(f=>f.endsWith('.html'))){let content=fs.readFileSync(html,'utf8').replace(/href="index\.html"/g,'href="basics.html"');if(path.basename(html)==='index.html'||path.basename(html)==='landing.html')content=content.replaceAll('href="landing.html"','href="index.html"');fs.writeFileSync(html,content);}
  fs.writeFileSync(path.join(stage,'.nojekyll'),'');
  const links=validate(stage);
  const entries=filesIn(stage).map(f=>({path:path.relative(stage,f).replaceAll(path.sep,'/'),bytes:fs.statSync(f).size,sha256:hash(fs.readFileSync(f))}));
  const manifest={schema:'DC01-static-release-v1',appVersion:require('../package.json').version,datasetId:data.datasetId,publicUrl:base||null,files:entries};
  fs.writeFileSync(path.join(stage,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  // Destination is fixed/verified above and only replaced when it contains our build marker.
  if(fs.existsSync(dest))fs.rmSync(dest,{recursive:true,force:false});
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.renameSync(stage,dest);
  return {directory:dest,files:entries.length+1,bytes:entries.reduce((n,e)=>n+e.bytes,0),datasetId:data.datasetId,publicUrl:base||null,socialAbsoluteUrls:Boolean(base),links};
 }catch(error){if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true,force:true});throw error;}
}
if(require.main===module){const report=build();fs.mkdirSync(path.join(ROOT,'output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'output/static-release-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
module.exports={build,validate,siteUrl,ROOT,runtime};
