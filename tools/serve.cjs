'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const PROJECT=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.pdf':'application/pdf','.zip':'application/zip','.bcfzip':'application/zip','.ifc':'application/octet-stream','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
function createPreviewServer({directory=PROJECT,base='',entry='datacenter.html'}={}){
 const root=path.resolve(directory);base=base.replace(/\/$/,'');
 if(base&&!/^\/[A-Za-z0-9_-]+$/.test(base))throw new Error('Preview base must be a single safe path segment');
 return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  let route,target;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(route.includes('\\')||route.includes('\0'))throw new Error('Invalid URL');}catch(_){res.writeHead(400).end();return;}
  if(base){if(route!==base&&!route.startsWith(base+'/')){res.writeHead(404).end('Not found');return;}route=route.slice(base.length)||'/';}
  target=path.resolve(root,'.'+route);if(target===root)target=path.join(root,entry);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(err,content)=>{if(err){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.writeHead(200);res.end(req.method==='HEAD'?undefined:content);});
 });
}
if(require.main===module){const args=process.argv.slice(2),isDist=args.includes('--dist'),value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback,port=Number(value('--port',4173)),base=value('--base','');if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Port must be 1024–65535');const server=createPreviewServer({directory:path.join(PROJECT,isDist?'dist':'.'),entry:isDist?'index.html':'datacenter.html',base});server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port '+port+' is already in use. Open the existing local preview, or select --port.':e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port+base+'/'));}
module.exports={createPreviewServer};
