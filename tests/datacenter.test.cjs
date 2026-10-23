const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const D=require('../data/datacenter.json'),E=require('../dc-engine.js');
const run=(s,actor,action,props={})=>E.act(s,D,{actor,action,...props},'2026-10-21T02:00:00.000Z');
function closeIssue(s,q){run(s,q.fixBy,'choose',{issueId:q.id,option:q.options.find(o=>o.correct).id});for(const r of q.requirements)assert.equal(run(s,r.provider,'evidence',{issueId:q.id,requirement:r.id}).ok,true);return run(s,q.gateBy,'accept',{issueId:q.id});}
test('DC01 has 14 stages, 42 issues, 25 companies, 11 zones and 24 canonical assets',()=>{assert.equal(D.stages.length,14);assert.equal(D.issues.length,42);assert.equal(D.companies.length,25);assert.equal(D.zones.length,11);assert.equal(D.assets.length,24);assert.equal(D.project.halls*D.project.racksPerHall*D.project.averageRackKW/1000,D.project.itLoadMW);});
test('every file name resolves to project-defined dictionaries; filename+revision unique',()=>{const keys=new Set();for(const f of D.files){const parts=f.containerId.split('-');assert.equal(parts.length,7);assert.equal(parts[0],'DC01');assert.ok(D.companies.some(c=>c.id===parts[1]),f.name);assert.ok(D.zones.some(z=>z.id===parts[2]),f.name);assert.ok(Object.hasOwn(D.naming.levels,parts[3]),f.name);assert.ok(Object.hasOwn(D.naming.types,parts[4]),f.name);assert.ok(Object.hasOwn(D.naming.roles,parts[5]),f.name);assert.match(parts[6],/^\d{4}$/);assert.equal(f.name,f.containerId+'.'+f.ext);assert.ok(!keys.has(f.name+'|'+f.revision),f.name);keys.add(f.name+'|'+f.revision);}});
test('all stage, evidence, source, derivative and asset references resolve',()=>{for(const s of D.stages){assert.equal(s.issueIds.length,3);s.fileIds.forEach(id=>E.file(D,id));}for(const f of D.files){for(const id of [...f.dependencies,...(f.derivedFrom?[f.derivedFrom]:[])])E.file(D,id);}for(const q of D.issues){assert.equal(q.options.filter(o=>o.correct).length,1);q.relatedFiles.forEach(id=>E.file(D,id));for(const r of q.requirements){assert.ok(D.companies.some(c=>c.id===r.provider));assert.equal(E.file(D,r.fileId).evidenceFor,q.id);}}for(const a of D.assets){E.file(D,a.modelFile);E.file(D,a.testFile);E.file(D,a.canonical.manual);}});
test('dependency graph has no cycles and records exact reference revisions',()=>{function walk(f,stack=[]){assert.ok(!stack.includes(f.id),stack.join(' -> '));for(const id of [...f.dependencies,...(f.derivedFrom?[f.derivedFrom]:[])]){assert.equal(f.dependencyVersions[id],E.file(D,id).revision);walk(E.file(D,id),[...stack,f.id]);}}D.files.forEach(f=>walk(f));});
test('phase is not CDE state and all four CDE states exist in the register',()=>{assert.deepEqual([...new Set(D.files.map(f=>f.state))].sort(),['ARCHIVED','PUBLISHED','SHARED','WIP']);for(const s of D.stages)assert.ok(D.files.some(f=>f.stage===s.id&&f.state==='ARCHIVED'));assert.ok(D.files.some(f=>f.stage==='TND'&&f.state==='WIP'));});
test('proposed file paths agree with representation states, with originator-first WIP',()=>{for(const f of D.files){const prefix={WIP:'01_WIP/',SHARED:'02_SHARED/',PUBLISHED:'03_PUBLISHED/',ARCHIVED:'04_ARCHIVED/'}[f.state];assert.ok(f.path.startsWith(prefix),f.name);if(f.state==='WIP')assert.ok(f.path.startsWith('01_WIP/'+f.originator+'/'));}});
test('native WIP is private to originator and sensitive publications have explicit scopes',()=>{const f=D.files.find(f=>f.ext==='rvt'&&f.state==='WIP');assert.equal(E.canRead(D,f,f.originator),true);assert.equal(E.canRead(D,f,'IMT'),false);assert.equal(E.canRead(D,f,'OWN'),false);const commercial=D.files.find(f=>f.originator==='QSX'&&f.state==='PUBLISHED');assert.equal(E.canRead(D,commercial,'QSX'),true);assert.equal(E.canRead(D,commercial,'IMT'),false);const security=D.files.find(f=>f.originator==='SEC');if(security)assert.equal(E.canRead(D,security,'GCC'),false);});
test('choosing a sensible approach alone cannot accept an issue',()=>{const s=E.create(),q=D.issues[0];run(s,q.fixBy,'choose',{issueId:q.id,option:'control'});assert.equal(run(s,q.gateBy,'accept',{issueId:q.id}).ok,false);assert.equal(E.accepted(s,D,q),false);});
test('admin cannot attest another company evidence or exercise its acceptance mandate',()=>{const s=E.create(),q=D.issues[0];assert.equal(run(s,'IMT','evidence',{issueId:q.id,requirement:q.requirements[0].id}).ok,false);assert.equal(run(s,'IMT','accept',{issueId:q.id}).ok,false);assert.equal(s.evidence[q.requirements[0].id],undefined);});
test('all 42 issues can be closed by the named providers and accepting party after asset fixes',()=>{const s=E.create();for(const a of D.assets)run(s,'OPS','assetRepair',{assetId:a.id});for(const q of D.issues){assert.equal(closeIssue(s,q).ok,true,q.id);assert.equal(E.accepted(s,D,q),true,q.id);}assert.equal(D.issues.filter(q=>E.accepted(s,D,q)).length,42);});
test('wrong approach with all evidence still cannot pass the gate',()=>{const s=E.create(),q=D.issues[1];run(s,q.fixBy,'choose',{issueId:q.id,option:'shortcut'});for(const r of q.requirements)run(s,r.provider,'evidence',{issueId:q.id,requirement:r.id});assert.equal(run(s,q.gateBy,'accept',{issueId:q.id}).ok,false);});
test('new evidence revision makes acceptance stale; new receipt alone cannot revive old acceptance',()=>{const s=E.create(),q=D.issues[0];closeIssue(s,q);const r=q.requirements[0];run(s,r.provider,'revise',{fileId:r.fileId});assert.equal(E.accepted(s,D,q),false);run(s,r.provider,'evidence',{issueId:q.id,requirement:r.id});assert.equal(E.accepted(s,D,q),false);assert.equal(run(s,q.gateBy,'accept',{issueId:q.id}).ok,true);assert.equal(E.accepted(s,D,q),true);});
test('revision of a related source invalidates the decision snapshot through dependencies',()=>{const s=E.create(),q=D.issues.find(q=>q.stage==='SD');closeIssue(s,q);const source=E.file(D,q.relatedFiles.find(id=>!E.file(D,id).evidenceFor&&E.file(D,id).state!=='ARCHIVED'));assert.ok(source);run(s,source.originator,'revise',{fileId:source.id});assert.equal(E.accepted(s,D,q),false);});
test('source changes also require providers to review and attest evidence context again',()=>{const s=E.create(),q=D.issues.find(q=>q.stage==='SD');closeIssue(s,q);const source=E.file(D,q.relatedFiles.find(id=>!E.file(D,id).evidenceFor&&E.file(D,id).state!=='ARCHIVED'));run(s,source.originator,'revise',{fileId:source.id});assert.equal(E.evidenceValid(s,D,q.requirements[0]),false);assert.equal(run(s,q.gateBy,'accept',{issueId:q.id}).ok,false);for(const r of q.requirements)run(s,r.provider,'evidence',{issueId:q.id,requirement:r.id});assert.equal(run(s,q.gateBy,'accept',{issueId:q.id}).ok,true);});
test('archived snapshots cannot be rewritten by opening another revision',()=>{const s=E.create(),f=D.files.find(f=>f.state==='ARCHIVED');assert.equal(run(s,f.originator,'revise',{fileId:f.id}).ok,false);assert.equal(E.revision(s,f),1);});
test('a different company cannot revise an originator file',()=>{const s=E.create(),f=D.files.find(f=>f.originator==='ELD'&&f.state!=='ARCHIVED');assert.equal(run(s,'IMT','revise',{fileId:f.id}).ok,false);assert.equal(E.revision(s,f),f.revision);});
test('asset validation catches missing data, duplicate IDs and incorrect but populated identity',()=>{const s=E.create();assert.equal(E.assetProblems(s,D).length,6);run(s,'OPS','assetEdit',{assetId:'AS001',field:'serial',value:'MADE-UP'});assert.ok(E.assetProblems(s,D).some(p=>p.id==='AS001'&&p.field==='serial'));for(const a of D.assets)run(s,'GCC','assetRepair',{assetId:a.id});assert.equal(E.assetProblems(s,D).length,0);});
test('HOV-02 requires usable asset data and editing data invalidates prior acceptance',()=>{const s=E.create(),q=D.issues.find(q=>q.id==='HOV-02');assert.equal(closeIssue(s,q).ok,false);for(const a of D.assets)run(s,'OPS','assetRepair',{assetId:a.id});assert.equal(run(s,q.gateBy,'accept',{issueId:q.id}).ok,true);run(s,'OPS','assetEdit',{assetId:'AS001',field:'serial',value:''});assert.equal(E.accepted(s,D,q),false);});
test('asset fields reject arbitrary keys and unappointed companies cannot edit',()=>{const s=E.create();assert.equal(run(s,'IMT','assetRepair',{assetId:'AS001'}).ok,false);assert.throws(()=>run(s,'OPS','assetEdit',{assetId:'AS001',field:'__proto__',value:'bad'}));});
test('twin trust distinguishes misbinding, stale, bad units and quality from normal',()=>{for(const c of D.twin.cases)assert.equal(E.twinCheck(D,c).trusted,c.id==='normal',c.id);});
test('session roundtrip replays decisions, denied actions, dependencies, edits and revisions',()=>{const s=E.create(),q=D.issues[0];run(s,'IMT','accept',{issueId:q.id});closeIssue(s,q);run(s,q.requirements[0].provider,'revise',{fileId:q.requirements[0].fileId});run(s,'OPS','assetRepair',{assetId:'AS002'});const input=E.exportSession(s,'<img src=x onerror=alert(1)>',D);const restored=E.restore(JSON.parse(JSON.stringify(input)),D);assert.deepEqual(restored,s);});
test('session import rejects malformed actions, oversized logs and injected approvals',()=>{const input=E.exportSession(E.create(),'',D);input.acceptances={'BRF-01':{actor:'OWN'}};input.assetEdits={AS001:{serial:'fake'}};assert.deepEqual(E.restore(input,D),E.create());assert.throws(()=>E.restore({...input,actions:[{action:'accept',actor:'__proto__',issueId:'BRF-01',at:new Date().toISOString()}]},D));assert.throws(()=>E.restore({...input,actions:Array(2001).fill({})},D));assert.throws(()=>E.restore({...input,notes:{}},D));});
test('offline browser data is identical to canonical JSON',()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../data/datacenter.js'),'utf8'),ctx);assert.deepEqual(JSON.parse(JSON.stringify(ctx.window.DC_DATA)),D);});
test('every advertised downloadable example exists and no native binary is faked',()=>{for(const f of D.files.filter(f=>f.download)){assert.ok(fs.existsSync(path.resolve(__dirname,'..',f.download)),f.name);assert.ok(['ifc','bcfzip','json','pdf'].includes(f.ext));}assert.ok(fs.existsSync(path.resolve(__dirname,'..',D.samples.bundle)));});
test('all six offline downloads match the verified payload files byte for byte',()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../data/dc-downloads.js'),'utf8'),ctx);const entries=Object.entries(ctx.window.DC_SAMPLES);assert.equal(entries.length,6);for(const [url,item] of entries)assert.deepEqual(Buffer.from(item.base64,'base64'),fs.readFileSync(path.resolve(__dirname,'..',url)));});

test("session import refuses replay against another data baseline",()=>{const input=E.exportSession(E.create(),"",D);assert.throws(()=>E.restore({...input,datasetId:"different"},D),/baseline/);});

test("Milestone 1: 3D scene manifest, persistent object/asset/zone IDs, strict zone bounds, elevation datums, and bidirectional inspector relationships",()=>{
 assert.equal(D.scene.schema,"DC01-scene-manifest-v1");
 assert.equal(D.scene.zoneVolumes.length,11);
 assert.equal(D.scene.levels.length,4);
 assert.ok(D.scene.siteMasterplan&&D.scene.siteMasterplan.roads.length>=4);
 assert.ok(D.scene.siteMasterplan.frontageRoad&&D.scene.siteMasterplan.monumentSign);
 assert.ok(D.scene.siteMasterplan.baseVolumes&&D.scene.siteMasterplan.baseVolumes.some(b=>b.kind==="loadingDock"));
 assert.equal(D.scene.siteMasterplan.vehicles,undefined,"Blocky vehicle placeholders removed per architectural review");
 assert.ok(D.scene.siteMasterplan.ductBanks&&D.scene.siteMasterplan.ductBanks.length>=4);
 assert.ok(D.scene.siteMasterplan.manholes&&D.scene.siteMasterplan.manholes.length>=8);
 // Verify Tier-III underground duct banks are strictly orthogonal along X, Y, or Z axis
 for(const db of D.scene.siteMasterplan.ductBanks){
  for(let i=1;i<db.points.length;i++){
   const [x0,y0,z0]=db.points[i-1],[x1,y1,z1]=db.points[i];
   const changedAxes=[x0!==x1,y0!==y1,z0!==z1].filter(Boolean).length;
   assert.equal(changedAxes,1,`${db.id} segment ${i-1}->${i} must be strictly orthogonal along 1 axis`);
  }
 }
 assert.ok(D.scene.grids&&D.scene.grids.x.length>=8&&D.scene.grids.y.length>=6);
 assert.equal(D.scene.benchmark.id,"DC01-BM01");
 assert.ok(D.scene.routes.length>=4);
 // Verify every segment of every 3D route is strictly orthogonal (aligned with X, Y, or Z axis — no diagonal lines)
 for(const rt of D.scene.routes){
  for(let i=1;i<rt.points.length;i++){
   const [x0,y0,z0]=rt.points[i-1],[x1,y1,z1]=rt.points[i];
   const changedAxes=[x0!==x1,y0!==y1,z0!==z1].filter(Boolean).length;
   assert.equal(changedAxes,1,`${rt.id} segment ${i-1}->${i} must be strictly orthogonal along 1 axis`);
  }
 }
 const objIds=new Set(),stableKeys=new Set();
 for(const f of D.files){
  assert.ok(f.stableKey&&f.stableKey.includes(f.containerId),f.id);
  assert.ok(!stableKeys.has(f.stableKey),f.stableKey);
  stableKeys.add(f.stableKey);
 }
 for(const a of D.assets){
  assert.ok(a.objectId&&a.objectId.startsWith("OBJ-"),a.id);
  assert.ok(!objIds.has(a.objectId),a.objectId);
  objIds.add(a.objectId);
  const z=D.zones.find(x=>x.id===a.zone);
  const zv=D.scene.zoneVolumes.find(x=>x.zoneId===a.zone);
  assert.ok(z&&zv,a.zone);
  assert.ok(a.spatial&&Number.isFinite(a.spatial.x)&&Number.isFinite(a.spatial.y)&&Number.isFinite(a.spatial.z),a.tag);
  // Every asset footprint must fit strictly inside its assigned zone boundary
  assert.ok(a.spatial.x>=z.x&&a.spatial.x+a.spatial.w<=z.x+z.w,`${a.tag} X footprint [${a.spatial.x}..${a.spatial.x+a.spatial.w}] strictly inside zone ${z.id} [${z.x}..${z.x+z.w}]`);
  assert.ok(a.spatial.y>=z.y&&a.spatial.y+a.spatial.d<=z.y+z.h,`${a.tag} Y footprint [${a.spatial.y}..${a.spatial.y+a.spatial.d}] strictly inside zone ${z.id} [${z.y}..${z.y+z.h}]`);
  // Elevation datum consistency: SSL <= FFL < topElev <= room soffit
  assert.equal(a.spatial.ssl,zv.ssl,`${a.tag} SSL matches zone ${z.id}`);
  assert.ok(a.spatial.ffl>=a.spatial.ssl,`${a.tag} FFL >= SSL`);
  assert.equal(a.spatial.topElev,Number((a.spatial.ffl+a.spatial.h).toFixed(2)),`${a.tag} topElev = FFL + H`);
  assert.ok(a.spatial.topElev+a.spatial.clearanceTop<=zv.soffit,`${a.tag} top + clearance fits under zone soffit`);
  assert.ok(Array.isArray(a.relations)&&a.relations.length>=7,a.tag);
 }
 const s=E.create();
 const inspImt=E.assetInspector(s,D,"UPS-A-01","IMT");
 assert.equal(inspImt.asset.id,"AS001");
 assert.equal(inspImt.dataQuality,"PASS");
 assert.equal(inspImt.mappingStatus,"ALIGNED");
 // WIP vendor/authoring model should not be readable by IMT if originator is VUP/ELS
 const wipRel=inspImt.docs.find(d=>d.file.state==="WIP");
 if(wipRel){
  assert.equal(wipRel.canRead,false);
  const inspOrig=E.assetInspector(s,D,"UPS-A-01",wipRel.file.originator);
  assert.equal(inspOrig.docs.find(d=>d.fileId===wipRel.fileId).canRead,true);
 }
 // Revising a related model/document marks the relationship stale in the 3D inspector
 const targetRel=inspImt.docs[0];
 run(s,targetRel.file.originator,"revise",{fileId:targetRel.fileId});
 const inspAfter=E.assetInspector(s,D,"AS001",targetRel.file.originator);
 assert.equal(inspAfter.docs[0].stale,true);
 // Bidirectional file -> 3D object/zone lookup
 const linked=E.fileObjects(D,targetRel.fileId);
 assert.ok(linked.zoneAssets.some(x=>x.id==="AS001"));
});
