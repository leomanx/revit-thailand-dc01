const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),D=require('../data/datacenter.json');
test('Git staging preserves reviewed source and exchange bytes even when autocrlf is enabled',()=>{
 const parent=path.join(ROOT,'tmp');fs.mkdirSync(parent,{recursive:true});const dir=fs.mkdtempSync(path.join(parent,'git-bytes-'));
 const git=(...args)=>cp.execFileSync('git',args,{cwd:dir,stdio:['ignore','pipe','pipe'],maxBuffer:5*1024*1024});
 try{
  fs.copyFileSync(path.join(ROOT,'.gitattributes'),path.join(dir,'.gitattributes'));
  const fixtures=new Map([['windows-text.js',Buffer.from('const sample = 1;\r\n// byte-preserved source\r\n')],...D.files.filter(f=>f.download).map(f=>[f.download,fs.readFileSync(path.join(ROOT,f.download))])]);
  for(const [name,bytes] of fixtures){const dest=path.join(dir,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
  git('init');git('config','core.autocrlf','true');git('add','--all');
  for(const [name,bytes] of fixtures)assert.deepEqual(git('show',':'+name),bytes,name);
 }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(parent)+path.sep));fs.rmSync(dir,{recursive:true,force:true});}
});
