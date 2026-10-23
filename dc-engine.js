(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DCEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const create=()=>({version:1,decisions:{},evidence:{},acceptances:{},revisions:{},assetEdits:{},accessRequests:{},events:[]});
 const revision=(s,f)=>s.revisions[f.id]||f.revision;
 const revLabel=n=>'R'+String(n).padStart(2,'0');
 function file(data,id){const f=data.files.find(x=>x.id===id);if(!f)throw new Error('Unknown file');return f;}
 function issue(data,id){const q=data.issues.find(x=>x.id===id);if(!q)throw new Error('Unknown issue');return q;}
 function evidenceValid(s,data,req){const ev=s.evidence[req.id];return Boolean(ev&&ev.fileId===req.fileId&&ev.actor===req.provider&&ev.revision===revision(s,file(data,req.fileId))&&Object.entries(ev.contextRevisions).every(([id,n])=>revision(s,file(data,id))===n));}
 function dependencyIds(data,ids){const seen=new Set();function walk(id){if(seen.has(id))return;seen.add(id);const f=file(data,id);for(const dep of [...f.dependencies,...(f.derivedFrom?[f.derivedFrom]:[])])walk(dep);}ids.forEach(walk);return [...seen];}
 function accepted(s,data,q){const a=s.acceptances[q.id];return Boolean(a&&s.decisions[q.id]&&q.options.find(o=>o.id===s.decisions[q.id])?.correct&&Object.entries(a.revisions).every(([id,n])=>revision(s,file(data,id))===n)&&q.requirements.every(r=>evidenceValid(s,data,r)&&a.revisions[r.fileId]===revision(s,file(data,r.fileId))));}
 function stageStatus(s,data,id){const list=data.issues.filter(q=>q.stage===id);return {total:list.length,accepted:list.filter(q=>accepted(s,data,q)).length,criticalOpen:list.filter(q=>q.severity==='critical'&&!accepted(s,data,q)).length};}
 function baseRead(data,f,actor){if(f.state==='WIP')return actor===f.originator;return f.recipients.includes(actor)||actor===f.originator;}
 const accessActions=['accessRequest','accessApprove','accessDeny','accessRevoke'];
 const accessUses=['coordination','procurement','operation','review'];
 function accessApprover(data,f){return f.originator;}
 function accessStatus(s,data,r,now=new Date().toISOString()){
  if(r.status==='DENIED'||r.status==='REVOKED')return r.status;
  const f=file(data,r.fileId);
  if(!Number.isFinite(Date.parse(now)))return 'INVALID_TIME';
  if(Date.parse(now)<Date.parse(r.requestedAt))return 'NOT_YET_ACTIVE';
  if(r.revision!==revision(s,f)||r.fileState!==f.state||r.confidentiality!==f.confidentiality)return 'STALE';
  const ms=Date.parse(now);
  if(r.status==='APPROVED')return ms<Date.parse(r.approvedAt)?'NOT_YET_ACTIVE':ms>=Date.parse(r.expiresAt)?'EXPIRED':'ACTIVE';
  return ms>=Date.parse(r.reviewBy)?'EXPIRED_REQUEST':'PENDING';
 }
 function readAccess(s,data,f,actor,now=new Date().toISOString()){
  if(!data.companies.some(c=>c.id===actor))return {allowed:false,basis:'UNKNOWN_ACTOR'};
  if(baseRead(data,f,actor))return {allowed:true,basis:actor===f.originator?'ORIGINATOR':'RECIPIENT'};
  const grant=Object.values(s?.accessRequests||{}).find(r=>r.requester===actor&&r.fileId===f.id&&accessStatus(s,data,r,now)==='ACTIVE'&&r.approvedBy===accessApprover(data,f));
  return grant?{allowed:true,basis:'SCOPED_GRANT',requestId:grant.id,expiresAt:grant.expiresAt,use:grant.use}:{allowed:false,basis:'NO_READ_SCOPE'};
 }
 function canRead(data,f,actor,s,now){return readAccess(s,data,f,actor,now).allowed;}
 function accessRows(s,data,now=new Date().toISOString()){return Object.values(s.accessRequests||{}).map(r=>({...r,effectiveStatus:accessStatus(s,data,r,now)}));}
 function applyAccess(s,data,input,now){
  const text=v=>typeof v==='string'&&v.trim().length>=5&&v.length<=500;
  if(!text(input.reason))throw new Error('ระบุเหตุผล 5–500 ตัวอักษร');
  if(!s.accessRequests)s.accessRequests={};
  if(input.action==='accessRequest'){
   const f=file(data,input.fileId);
   if(!accessUses.includes(input.use)||!Number.isInteger(input.hours)||input.hours<1||input.hours>168)throw new Error('กำหนด intended use และระยะเวลา 1–168 ชั่วโมง');
   if(canRead(data,f,input.actor,s,now))return {ok:false,message:'อ่านได้อยู่แล้ว ไม่ต้องขอสิทธิ์เพิ่ม'};
   if(Object.values(s.accessRequests).some(r=>r.fileId===f.id&&r.requester===input.actor&&accessStatus(s,data,r,now)==='PENDING'))return {ok:false,message:'มีคำขอ revision นี้รอพิจารณาแล้ว'};
   const id='AR'+String(Object.keys(s.accessRequests).length+1).padStart(4,'0');
   s.accessRequests[id]={id,fileId:f.id,revision:revision(s,f),fileState:f.state,confidentiality:f.confidentiality,requester:input.actor,reviewer:accessApprover(data,f),reason:input.reason.trim(),use:input.use,hours:input.hours,requestedAt:now,reviewBy:new Date(Date.parse(now)+7*86400000).toISOString(),status:'PENDING'};
   return {ok:true,message:id+' ส่งคำขอ read เฉพาะไฟล์/ฉบับนี้ รอ '+accessApprover(data,f)+' พิจารณา; ยังอ่านไม่ได้'};
  }
  const r=s.accessRequests[input.requestId];if(!r)throw new Error('ไม่พบคำขอสิทธิ์');
  const f=file(data,r.fileId);
  if(input.actor!==accessApprover(data,f)||input.actor===r.requester)return {ok:false,message:'พิจารณาสิทธิ์ได้โดย originator '+accessApprover(data,f)+' ตาม policy สมมติ; ผู้ขออนุมัติเองไม่ได้'};
  const status=accessStatus(s,data,r,now);
  if(input.action==='accessRevoke'){
   if(status!=='ACTIVE')return {ok:false,message:'เพิกถอนได้เฉพาะ grant ที่ยัง ACTIVE'};
   r.status='REVOKED';r.revokedAt=now;r.revokedBy=input.actor;r.revocationReason=input.reason.trim();
   return {ok:true,message:r.id+' เพิกถอนสิทธิ์ read แล้ว; สิทธิ์ตาม recipient เดิมไม่ถูกเปลี่ยน'};
  }
  if(status!=='PENDING')return {ok:false,message:r.id+' ไม่ใช่คำขอที่รอพิจารณาปัจจุบัน ('+status+') ให้ส่งคำขอใหม่'};
  if(input.action==='accessApprove'&&(!Number.isInteger(input.hours)||input.hours<1||input.hours>r.hours))throw new Error('grant ต้องไม่เกินระยะเวลาที่ขอ');
  r.reviewedBy=input.actor;r.reviewedAt=now;r.reviewReason=input.reason.trim();
  if(input.action==='accessDeny'){r.status='DENIED';return {ok:true,message:r.id+' ปฏิเสธคำขอพร้อมเหตุผลแล้ว'};}
  r.status='APPROVED';r.approvedBy=input.actor;r.approvedAt=now;r.grantedHours=input.hours;r.expiresAt=new Date(Date.parse(now)+input.hours*3600000).toISOString();
  return {ok:true,message:r.id+' อนุญาต read ถึง '+r.expiresAt+' เฉพาะ '+f.id+' '+revLabel(r.revision)+' / '+r.use+'; ไม่ให้สิทธิ์แก้แบบหรือผ่าน gate'};
 }
 function dashboardMetrics(s,data,now=new Date().toISOString()){
  const closed=data.issues.filter(q=>accepted(s,data,q)),open=data.issues.filter(q=>!accepted(s,data,q));
  const weights={critical:5,high:3,medium:1,low:1};
  const severityWeight=q=>weights[q.severity]??1;
  const roots=data.files.filter(f=>revision(s,f)!==f.revision);
  const staleFiles=data.files.filter(f=>dependencyIds(data,[f.id]).some(id=>revision(s,file(data,id))!==file(data,id).revision));
  const reqs=data.issues.flatMap(q=>q.requirements),defects=assetProblems(s,data),badAssets=[...new Set(defects.map(p=>p.id))];
  const access=accessRows(s,data,now),valid=reqs.filter(r=>evidenceValid(s,data,r));
  return {issues:{total:data.issues.length,accepted:closed.length,open:open.length,criticalOpen:open.filter(q=>q.severity==='critical').length,acceptedIds:closed.map(q=>q.id)},
   risk:{openIndex:open.reduce((n,q)=>n+severityWeight(q),0),baselineIndex:data.issues.reduce((n,q)=>n+severityWeight(q),0),weights,notice:'Illustrative severity-weighted backlog index; not probability, expected loss or measured safety performance'},
   evidence:{total:reqs.length,valid:valid.length,stale:reqs.filter(r=>s.evidence[r.id]&&!evidenceValid(s,data,r)).length},
   revisions:{changed:roots.map(f=>f.id),affected:staleFiles.map(f=>f.id),total:data.files.length},
   assets:{total:data.assets.length,usable:data.assets.length-badAssets.length,defective:badAssets,findings:defects.length},
   twin:{total:data.twin.cases.length,trusted:data.twin.cases.filter(c=>twinCheck(data,c).trusted).length},
   access:{total:access.length,pending:access.filter(r=>r.effectiveStatus==='PENDING').length,active:access.filter(r=>r.effectiveStatus==='ACTIVE').length,expired:access.filter(r=>['EXPIRED','EXPIRED_REQUEST'].includes(r.effectiveStatus)).length,revoked:access.filter(r=>r.effectiveStatus==='REVOKED').length,denied:access.filter(r=>r.effectiveStatus==='DENIED').length,stale:access.filter(r=>r.effectiveStatus==='STALE').length},
   actions:{total:s.events.length,stopped:s.events.filter(e=>!e.ok).length}};
 }
 function roiScenario(metrics,params){
  const limits={hoursPerCase:1000,hourlyRate:100000,investment:100000000,realization:100};
  for(const [k,max] of Object.entries(limits))if(typeof params[k]!=='number'||!Number.isFinite(params[k])||params[k]<0||params[k]>max)throw new Error('Scenario input out of range: '+k);
  const cases=metrics.issues.accepted,hours=cases*params.hoursPerCase*params.realization/100,benefit=hours*params.hourlyRate,net=benefit-params.investment,unitBenefit=params.hoursPerCase*params.hourlyRate*params.realization/100;
  return {cases,hours,benefit,net,roiPercent:params.investment>0?net/params.investment*100:null,breakEvenCases:params.investment===0?0:unitBenefit>0?Math.ceil(params.investment/unitBenefit):null,notice:'Hypothetical scenario based on unique accepted sample issues. No measured project savings or causal attribution.'};
 }
 function assetRows(s,data){return data.assets.map(a=>({...a,...{submitted:{...a.submitted,...s.assetEdits[a.id]}}}));}
 function assetProblems(s,data){const rows=assetRows(s,data),problems=[];for(const a of rows){const r=a.submitted;for(const field of ['tag','serial','manufacturer','model','zone','system','warrantyStart','manual']){if(!r[field])problems.push({id:a.id,field,message:field+' ว่าง'});else if(r[field]!==a.canonical[field])problems.push({id:a.id,field,message:field+' ไม่ตรง verified reference: '+a.canonical[field]});}if(rows.filter(x=>x.submitted.tag===r.tag).length>1)problems.push({id:a.id,field:'tag',message:'AssetID ซ้ำ: '+r.tag});if(r.manual&&!data.files.some(f=>f.id===r.manual))problems.push({id:a.id,field:'manual',message:'อ้าง manual ที่ไม่มีในทะเบียน'});if(r.warrantyStart&&!/^\d{4}-\d{2}-\d{2}$/.test(r.warrantyStart))problems.push({id:a.id,field:'warrantyStart',message:'วันที่ warranty ต้องเป็น YYYY-MM-DD'});}return problems;}
 function twinCheck(data,sample){const reasons=[];if(sample.asset!==sample.sourceAsset)reasons.push('Asset identity ไม่ตรงกับ source');if(sample.unit!==data.twin.unit)reasons.push('หน่วยไม่ตรง data contract');if(sample.quality!=='GOOD')reasons.push('Quality flag ไม่ผ่าน');if(sample.ageSeconds>data.twin.freshnessSeconds)reasons.push('ข้อมูลเก่ากว่า freshness limit');return {trusted:reasons.length===0,reasons};}
 function assetInspector(s,data,assetId,actor,now=new Date().toISOString()){
  const rows=assetRows(s,data),a=rows.find(x=>x.id===assetId||x.tag===assetId||x.ifcGuid===assetId||x.objectId===assetId);
  if(!a)throw new Error('Unknown asset');
  const problems=assetProblems(s,data).filter(p=>p.id===a.id);
  const modelF=file(data,a.modelFile),modelRev=revision(s,modelF);
  const proxyF=file(data,data.samples.ifc),proxyRev=revision(s,proxyF);
  const mappingStale=modelRev!==(a.modelRevision??a.relations?.[0]?.baselineRev??modelF.revision)||proxyRev!==data.scene.modelRevision;
  const dependencyStale=f=>dependencyIds(data,[f.id]).some(id=>{const d=file(data,id);return revision(s,d)!==d.revision||Object.entries(d.dependencyVersions||{}).some(([dep,n])=>revision(s,file(data,dep))!==n);});
  const docs=(a.relations||[]).map(rel=>{
   const f=file(data,rel.fileId),curRev=revision(s,f),stale=curRev!==rel.baselineRev||dependencyStale(f);
   return {...rel,file:f,currentRevision:curRev,currentRevLabel:revLabel(curRev),baselineRevLabel:revLabel(rel.baselineRev),stale,canRead:canRead(data,f,actor,s,now)};
  });
  const threadDocs=a.thread.map(t=>{
   const f=file(data,t.fileId),curRev=revision(s,f),stale=curRev!==f.revision||dependencyStale(f);
   return {...t,file:f,currentRevision:curRev,currentRevLabel:revLabel(curRev),stale,canRead:canRead(data,f,actor,s,now)};
  });
  const zoneIssues=data.issues.filter(q=>q.zone===a.zone||q.relatedFiles.some(fid=>docs.some(d=>d.fileId===fid)||threadDocs.some(t=>t.fileId===fid))).map(q=>({
   ...q,accepted:accepted(s,data,q),requirementsStatus:q.requirements.map(r=>({...r,valid:evidenceValid(s,data,r),file:file(data,r.fileId),currentRevLabel:revLabel(revision(s,file(data,r.fileId)))}))
  }));
  return {asset:a,problems,dataQuality:problems.length===0?'PASS':'DEFECTS_FOUND',modelFile:modelF,modelRevLabel:revLabel(modelRev),proxyFile:proxyF,proxyRevLabel:revLabel(proxyRev),mappingStatus:mappingStale?'STALE_BASELINE':'ALIGNED',docs,threadDocs,issues:zoneIssues};
 }
 function fileObjects(data,fileId){
  const f=file(data,fileId);
  const directAssets=data.assets.filter(a=>a.modelFile===f.id||a.testFile===f.id||a.canonical.manual===f.id||(a.relations||[]).some(r=>r.fileId===f.id));
  const zoneAssets=data.assets.filter(a=>a.zone===f.zone);
  const contextualAssets=data.assets.filter(a=>a.thread.some(t=>t.fileId===f.id)&&!directAssets.includes(a));
  return {file:f,zone:data.zones.find(z=>z.id===f.zone),directAssets,zoneAssets,contextualAssets};
 }
 function act(s,data,input,now=new Date().toISOString()){
  if(!input||!data.companies.some(c=>c.id===input.actor)||!['choose','evidence','accept','revise','assetEdit','assetRepair',...accessActions].includes(input.action))throw new Error('ข้อมูลการกระทำไม่ถูกต้อง');
  input=Object.fromEntries(['action','actor','issueId','option','requirement','fileId','assetId','field','value','reason','use','hours','requestId'].filter(k=>Object.hasOwn(input,k)).map(k=>[k,input[k]]));
  if(s.events.length>=2000)throw new Error('ครบ 2,000 รายการ กรุณาส่งออกและเริ่มผลทดลองชุดใหม่');
  if(!Number.isFinite(Date.parse(now))||(s.events.length&&Date.parse(now)<Date.parse(s.events[s.events.length-1].at)))throw new Error('Invalid or non-monotonic action time');
  let ok=true,message='',q;
  if(['choose','evidence','accept'].includes(input.action))q=issue(data,input.issueId);
  if(accessActions.includes(input.action)){({ok,message}=applyAccess(s,data,input,now));}
  else if(input.action==='choose'){
   const option=q.options.find(o=>o.id===input.option);if(!option)throw new Error('Unknown decision');s.decisions[q.id]=option.id;delete s.acceptances[q.id];message=option.reason;ok=option.correct;
  }else if(input.action==='evidence'){
   const req=q.requirements.find(r=>r.id===input.requirement);if(!req)throw new Error('Unknown requirement');
   if(input.actor!==req.provider){ok=false;message='ผู้รับผิดชอบหลักฐานนี้คือ '+req.provider+' การอัปโหลดโดยผู้ดูแลไม่แทนการยืนยันของผู้รับผิดชอบ';}
   else{s.evidence[req.id]={fileId:req.fileId,revision:revision(s,file(data,req.fileId)),actor:input.actor,at:now,contextRevisions:Object.fromEntries(dependencyIds(data,q.relatedFiles.filter(id=>!file(data,id).evidenceFor)).map(id=>[id,revision(s,file(data,id))]))};message='จำลองรับ/ยืนยันหลักฐาน '+req.id+' จาก '+input.actor+' สำหรับ '+revLabel(revision(s,file(data,req.fileId)))+' และ source baseline ที่บันทึก; ยังไม่ใช่ผลยอมรับประเด็น';}
  }else if(input.action==='accept'){
   const missing=[];if(input.actor!==q.gateBy)missing.push('ผู้มีอำนาจรับประเด็นนี้คือ '+q.gateBy);if(!q.options.find(o=>o.id===s.decisions[q.id])?.correct)missing.push('ยังไม่ได้เลือกแนวทางที่ตอบจุดควบคุม');
   const reqs=q.requirements.filter(r=>!evidenceValid(s,data,r));if(reqs.length)missing.push('ขาด/ล้าสมัย: '+reqs.map(r=>r.id).join(', '));
   if(q.stage==='HOV'&&q.id==='HOV-02'&&assetProblems(s,data).length)missing.push('Asset register ยังมี validation errors ต้องแก้ในแท็บ Asset / Twin ก่อน');
   if(missing.length){ok=false;message=missing.join(' • ');}
   else{s.acceptances[q.id]={actor:input.actor,at:now,revisions:Object.fromEntries(dependencyIds(data,q.relatedFiles).map(id=>[id,revision(s,file(data,id))]))};message='จำลองรับการแก้ประเด็น '+q.id+' แล้ว — '+q.acceptanceScope;}
  }else if(input.action==='revise'){
   const f=file(data,input.fileId);if(f.state==='ARCHIVED'){ok=false;message='Snapshot ใน Archive เก็บเป็นประวัติ ให้เปิด revision ที่ source ปัจจุบันแทน';}
   else if(input.actor!==f.originator){ok=false;message='เปิด revision ได้โดย originator '+f.originator+' ในแบบจำลองนี้';}
   else{s.revisions[f.id]=revision(s,f)+1;message='เปิด '+f.name+' '+revLabel(revision(s,f))+'; หลักฐานและผลยอมรับที่อ้าง revision เดิมต้องทบทวนใหม่';}
  }else{
   if(input.actor!=='GCC'&&input.actor!=='OPS'){ok=false;message='แก้ submitted asset register ได้โดย GCC หรือ OPS ในเคสนี้';}
   else{
    const a=data.assets.find(x=>x.id===input.assetId);if(!a)throw new Error('Unknown asset');
    if(input.action==='assetRepair'){s.assetEdits[a.id]={...a.canonical};message='จำลอง reconcile '+a.tag+' กับ verified receiving / nameplate reference แล้ว';}
    else{if(!Object.hasOwn(a.canonical,input.field)||typeof input.value!=='string'||input.value.length>160)throw new Error('Invalid asset field');s.assetEdits[a.id]={...s.assetEdits[a.id],[input.field]:input.value};message='แก้ submitted '+a.tag+' / '+input.field+' แล้ว ต้อง validate และให้ผู้รับข้อมูลพิจารณา';}
    delete s.acceptances['HOV-02'];
   }
  }
  const e={...input,at:now,ok,message,number:s.events.length+1};s.events.push(e);return e;
 }
 function exportSession(s,notes='',data){return {format:'DC01-learning-session',version:1,datasetId:data?.datasetId||null,notes,actions:s.events.map(({action,actor,issueId,option,requirement,fileId,assetId,field,value,reason,use,hours,requestId,at})=>Object.fromEntries(Object.entries({action,actor,issueId,option,requirement,fileId,assetId,field,value,reason,use,hours,requestId,at}).filter(([,v])=>v!==undefined)))};}
 function restore(input,data){if(!input||input.format!=='DC01-learning-session'||input.version!==1||!Array.isArray(input.actions)||input.actions.length>2000||typeof(input.notes||'')!=='string'||(input.notes||'').length>8000)throw new Error('รูปแบบ session ไม่ถูกต้อง');if(input.datasetId!==data.datasetId)throw new Error('Session อ้างข้อมูลกรณีศึกษาคนละฉบับ ไม่ replay ข้าม baseline เพื่อป้องกันอ้าง file IDs ผิด');const s=create();for(const a of input.actions){if(!a||typeof a.at!=='string'||a.at.length>40||!Number.isFinite(Date.parse(a.at)))throw new Error('Invalid timestamp');act(s,data,a,a.at);}return s;}
 return {create,revision,revLabel,file,issue,dependencyIds,evidenceValid,accepted,stageStatus,canRead,baseRead,readAccess,accessRows,accessApprover,dashboardMetrics,roiScenario,assetRows,assetProblems,twinCheck,assetInspector,fileObjects,act,exportSession,restore};
});
