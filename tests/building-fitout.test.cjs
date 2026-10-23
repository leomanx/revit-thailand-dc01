const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const B=require('../dc-building.js'),D=require('../data/datacenter.json');
test('room fit-out has unique selectable groups, positive bounded geometry and valid spec references',()=>{
 const groups=B.build(D,{},'SITE');assert.equal(new Set(groups.map(g=>g.id)).size,groups.length);
 assert.deepEqual(new Set(groups.map(g=>g.zoneId)),new Set(Object.keys(B.profiles)));
 for(const g of groups){const v=D.scene.zoneVolumes.find(v=>v.zoneId===g.zoneId);assert.ok(v);assert.ok(g.specs.every(id=>B.specs[id]));for(const p of g.parts){for(const k of ['x','y','z','w','d','h','alpha'])assert.ok(Number.isFinite(p[k]));assert.ok(Math.min(p.w,p.d,p.h)>0);assert.ok(p.x>=v.x-.001&&p.x+p.w<=v.x+v.w+.001,g.id+' x');assert.ok(p.y>=v.y-.001&&p.y+p.d<=v.y+v.d+.001,g.id+' y');assert.ok(p.z>=v.ffl-.001&&p.z+p.h<=v.soffit+.001,g.id+' z');}}
});
test('NOC includes six video panels, three dimensioned staffed consoles, envelope and service interfaces',()=>{
 const g=B.build(D,{isolateZone:true},'NOC'),p=g.flatMap(g=>g.parts);assert.equal(g.filter(g=>/NOC-OP/.test(g.id)).length,3);assert.equal(p.filter(p=>p.part==='display panel').length,6);assert.equal(p.filter(p=>p.part==='chair back').length,3);const desk=p.find(p=>p.part.startsWith('matte console'));assert.equal(desk.w,1.65);assert.equal(desk.d,.75);assert.ok(Math.abs(desk.z+desk.h-3.75-.74)<1e-8);for(const part of ['HVAC grille','acoustic ceiling','door leaf','mullion','cable raceway'])assert.ok(p.some(p=>p.part.includes(part)),part);
});
test('fit-out follows level/isolation/explode controls and is absent from isolated service views',()=>{
 assert.equal(B.build(D,{isolateService:true},'NOC').length,0);
 assert.ok(B.build(D,{levelFilter:'01'},'SITE').every(g=>g.level==='01'));
 assert.ok(B.build(D,{isolateZone:true},'NOC').every(g=>g.zoneId==='NOC'));
 const a=B.build(D,{isolateZone:true},'NOC'),b=B.build(D,{isolateZone:true,explodeMode:true},'NOC'),v=D.scene.zoneVolumes.find(v=>v.zoneId==='NOC');for(let i=0;i<a.length;i++)for(let j=0;j<a[i].parts.length;j++){const p=a[i].parts[j],q=b[i].parts[j];assert.ok(Math.abs(q.z-p.z-3.4)<1e-8);assert.ok(Math.abs(q.x-p.x-(v.x+v.w/2-18)*.28)<1e-8);assert.ok(Math.abs(q.y-p.y-(v.y+v.d/2-16)*.28)<1e-8);}
});
test('performance briefs distinguish assumptions, TBC, evidence, owners and unresolved access',()=>{
 for(const [id,s] of Object.entries(B.specs)){assert.ok(s.material);assert.ok(s.rows.length>=3,id);for(const r of s.rows)for(const k of ['criterion','target','verify','owner','status'])assert.ok(r[k],id+' '+k);}
 for(const p of Object.values(B.profiles)){assert.ok(p.gaps.length);assert.ok(p.specs.every(id=>B.specs[id]));}
 assert.match(B.specs['AC-01'].rows[1].target,/OPEN DESIGN GAP/);assert.ok(!B.profiles.DH1.specs.includes('AF-01'));assert.ok(B.profiles.GEN.specs.includes('YD-01'));
 assert.match(B.zonePanel(D,'NOC','NOC-OP1'),/NC-01/);assert.match(B.zonePanel(D,'NOC'),/ยังไม่ตรวจ/);assert.equal(B.zonePanel(D,'SITE'),'');for(const c of require('../dc-architecture.js').cases)assert.match(B.archPanel(c),/Criteria/);
});
test('renderer projects and picks real fit-out geometry and reset clears component selection',()=>{
 const ctx=new Proxy({measureText:s=>({width:String(s).length*6}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),k);}}),canvas={width:0,height:0,style:{},closest:()=>null,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:900,height:600})};
 const env={DCBuilding:B,DCDetail:require('../dc-detail.js'),module:{exports:{}},setTimeout:f=>f()};vm.runInNewContext(fs.readFileSync(require.resolve('../dc-viewer.js'),'utf8'),env);const V=env.module.exports,st={selectedZone:'NOC',selectedAsset:null};V.bindCanvas(canvas,D,()=>st,()=>{});assert.equal(V.getSceneEntities(D,'NOC',null).zones.find(z=>z.id==='NOC').h,.15);V.command('toggleIsolate',D,st);V.command('fitZone',D,st);V.command('selectBuilding:NOC-OP1',D,st);assert.equal(V.getState().selectedBuilding,'NOC-OP1');let found=false;for(let y=20;y<580&&!found;y+=6)for(let x=20;x<880;x+=6)if(V.pickAt(x,y)?.kind==='building'){found=true;break;}assert.ok(found);V.command('reset',D,st);assert.equal(V.getState().selectedBuilding,null);
});
