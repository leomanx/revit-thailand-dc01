'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT,validate}=require('./build-static.cjs');
function audit(dir=path.join(ROOT,'dist')){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'release-manifest.json'),'utf8')),findings=[];
 const report=(kind,file)=>findings.push({kind,file});
 const secrets=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{30,}\b/,/\bAKIA[0-9A-Z]{16}\b/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}\b/];
 for(const f of manifest.files){
  if(/(^|\/)(?:tmp|output|tests|tools|node_modules|\.github|\.git|\.netlify)(?:\/|$)|(?:^|\/)\.env(?:\.|$)/.test(f.path))report('unexpected-source-or-private-path',f.path);
  const full=path.resolve(dir,f.path);if(!full.startsWith(path.resolve(dir)+path.sep))throw new Error('Unsafe manifest path');
  const bytes=fs.readFileSync(full);if(bytes.length!==f.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==f.sha256)report('payload-digest-mismatch',f.path);
  if(/\.(html|js|css|json|md|txt)$/i.test(f.path)){
   const s=bytes.toString('utf8');if(secrets.some(p=>p.test(s)))report('potential-credential-pattern',f.path);
   if(/[A-Za-z]:[\\/](?:Users|Work)[\\/]|file:\/\/|127\.0\.0\.1:\d|localhost:\d/.test(s))report('machine-local-reference',f.path);
   if(f.path.endsWith('.html')&&/\b(?:src|href)=["'](?:https?:)?\/\/[^"']+\.(?:js|css)(?:[?"'])/i.test(s))report('external-runtime-dependency',f.path);
   if(f.path.endsWith('.js')&&/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(s))report('runtime-network-call-requires-review',f.path);
  }
 }
 const required=['dc-architecture.js','dc-maintenance.js','dc-zoning.js','public-notes.html','feedback-template.md'];
 for(const file of required)if(!manifest.files.some(f=>f.path===file))report('missing-public-beta-content',file);
 return {schema:'DC01-public-audit-v1',appVersion:manifest.appVersion,datasetId:manifest.datasetId,files:manifest.files.length+1,links:validate(dir),checks:['manifest hashes','runtime file boundaries','known credential patterns','local machine references','external runtime dependencies','runtime network calls','required beta content'],findings,limitations:'Pattern scan is not a guarantee of absence of secrets. Does not prove browser layout, engineering compliance, source licensing or hosted deployment.'};
}
if(require.main===module){const r=audit();fs.mkdirSync(path.join(ROOT,'output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'output/public-audit.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r,null,2));if(r.findings.length)process.exitCode=1;}
module.exports={audit};
