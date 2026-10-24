(function(){
 'use strict';
 const D=window.DC_DATA,E=window.DCEngine,V=window.DCViewer,Z=window.DCZoning,M=window.DCMaintenance,A=window.DCArchitecture,$=id=>document.getElementById(id),KEY='dc01-lifecycle-session-v1';
 const h=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const company=id=>D.companies.find(c=>c.id===id),stage=id=>D.stages.find(s=>s.id===id),file=id=>E.file(D,id);
 let state=E.create(),notes='',actor='IMT',view='overview',selectedStage='BRF',selectedZone='E01',selectedAsset='AS001',inspectorTab='docs',treeFilter='',selectedFileId='F0001',twinCase='normal',assetTab='register',dialogFile=null,storageMessage='';
 let selectedService=null;
 let accessFileId=D.files.find(f=>!E.canRead(D,f,'IMT')).id,accessDraft={reason:'',use:'coordination',hours:24},accessReviews={};
 let roiInputs={hoursPerCase:8,hourlyRate:800,investment:50000,realization:50};
 const filters={q:'',stage:'',originator:'',zone:'',kind:'',state:''};
 try{const saved=localStorage.getItem(KEY);if(saved){const input=JSON.parse(saved);state=E.restore(input,D);notes=typeof input.notes==='string'?input.notes:'';if(input.scenario)for(const k of Object.keys(roiInputs))if(Object.hasOwn(input.scenario,k))roiInputs[k]=typeof input.scenario[k]==='number'?input.scenario[k]:null;}}catch(_){try{localStorage.setItem(KEY+'-previous-baseline',localStorage.getItem(KEY)||'');}catch(_){}storageMessage='ชุดข้อมูลเปลี่ยนหรืออ่าน session เดิมไม่ได้ เปิดผลทดลองใหม่และสำรองข้อความเดิมไว้ใน localStorage key '+KEY+'-previous-baseline';}
 function restoreScenario(input){roiInputs={hoursPerCase:8,hourlyRate:800,investment:50000,realization:50};if(input.scenario)for(const k of Object.keys(roiInputs))if(Object.hasOwn(input.scenario,k))roiInputs[k]=typeof input.scenario[k]==='number'?input.scenario[k]:null;}
 function priorSession(){try{return localStorage.getItem(KEY+'-previous-baseline')||'';}catch(_){return '';}}
 const packet=()=>({...E.exportSession(state,notes,D),scenario:{...roiInputs}});
 function save(){try{localStorage.setItem(KEY,JSON.stringify(packet()));}catch(_){storageMessage='บันทึกในเครื่องไม่ได้ กรุณา Export ก่อนปิด';}}
 const chip=(text,cls='')=>`<span class="chip ${cls}">${h(text)}</span>`;
 const fileLink=id=>`<button class="file-link" data-do="file" data-id="${h(id)}">${h(file(id).name)}</button>`;
 const button=(text,action,attrs='',cls='')=>`<button class="btn ${cls}" data-do="${action}" ${attrs}>${text}</button>`;
 const viewButton=(label,target,cls='')=>button(h(label),'view',`data-target="${target}"`,cls);
 const countAccepted=()=>D.issues.filter(q=>E.accepted(state,D,q)).length;
 function heading(kicker,title,text){return `<div class="page-heading"><span class="eyebrow">${h(kicker)}</span><h1>${h(title)}</h1><p class="lead">${h(text)}</p></div>`;}
 function notify(text,ok=true){const n=$('dc-notice');n.className='notice'+(ok?'':' bad');n.replaceChildren();const span=document.createElement('span');span.textContent=text;const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','ปิดข้อความ');close.onclick=()=>n.hidden=true;n.append(span,close);n.hidden=false;}

 function architectureView(){return heading("ARCHITECTURE / MATERIALS / ENVIRONMENT","สเปควัสดุ ต้องเหมาะกับทั้งระบบ","เลือกพื้น ผนัง ฝ้า หลังคา façade หรือทางเข้าถึง ดูชั้นวัสดุใน 3D แล้วลองเปลี่ยนวัสดุ ทิศ แดด ลม ฝน และเงื่อนไขการใช้พื้นที่")+(A?.shell()||"<p>กรุณาโหลดหน้าใหม่เพื่อเปิด Architecture Lab</p>");}
 function maintenanceView(){return heading("OPS CONTROL ROOM · เหตุการณ์สมมติ","อุปกรณ์เสีย ใครเข้าซ่อมได้?","ลองจัดการใบงานตามรอบและเหตุขัดข้อง ตั้งแต่แจ้งเหตุ ทบทวนผลกระทบ ขอ Permit ผ่านประตู จนถึงบันทึกส่งต่อ FM")+(M?.shell()||"<p>กรุณาโหลดหน้าใหม่เพื่อเปิดสถานการณ์ซ่อมบำรุง</p>");}
 function playView(){return heading('ZONE QUEST · เริ่มเล่นได้ทุกสาขา','ลองจัดโซน แล้วตามความสัมพันธ์','เริ่มจากกล่องไม่กี่ใบ ลองขยับ ดูสิ่งที่เปลี่ยน แล้วค่อยเปิดเหตุผลและโมเดล 3D')+(Z?.shell()||'<p>เปิดสนามไม่ได้ กรุณาโหลดหน้าใหม่</p>');}
 function overview(){return `
 <div class="hero"><div class="hero-text"><span class="eyebrow">REVIT THAILAND · NONPROFIT EDUCATIONAL SHOWCASE</span><h1>หนึ่ง Data Center<br>หลายทีม หลายฉบับ<br>ใครควบคุมความจริง?</h1><p class="lead">ตั้งแต่โจทย์แรกจนถึงข้อมูลเดินระบบ ติดตามว่าแต่ละฝ่ายสร้างไฟล์อะไร ส่งให้ใคร ใช้ตัดสินใจเรื่องใด และสำรวจความสัมพันธ์ใน 3D Model ระหว่างพื้นที่–อุปกรณ์–เอกสาร–หลักฐาน–สิทธิ์การเข้าถึง</p><div class="button-row">${viewButton('✦ เล่นจัดโซน เริ่มง่าย ๆ','play','primary')}${viewButton('สำรวจ 3D Model & โซน →','atlas','primary')}${button('เริ่มจากโจทย์ Owner','stage','data-id="BRF"')}${viewButton('เปิดทะเบียนไฟล์','files')}${viewButton('Impact / Risk / ROI','impact')}${viewButton('สถาปัตย์ / วัสดุ / แดดลมฝน','architecture')}${viewButton('⚒ อุปกรณ์เสีย / ลองเข้าซ่อม','maintenance')}${viewButton('คำขอสิทธิ์','access')}</div></div><div class="hero-graphic"><span class="label">SIAM EDGE / DC01</span><div class="power">12 <small>MW IT</small></div><p>2 Data Halls · เส้นทางไฟฟ้า A/B<br>24 Representative Assets · 11 Zones · 237 Files</p><div class="formula">2 HALLS × 500 RACKS × 12 kW = 12 MW IT<br>สมมติฐานเพื่อเรียนรู้ ไม่ใช่ผลออกแบบหรือ Tier certification</div></div></div>
 <div class="stats"><div class="stat"><strong>${D.stages.length}</strong><small>ช่วงงาน ตั้งแต่ Brief ถึง Digital Twin</small></div><div class="stat"><strong>${D.files.length}</strong><small>รายการไฟล์ พร้อมชื่อ / บริษัท / revision</small></div><div class="stat"><strong>${D.assets.length}</strong><small>วัตถุ 3D & ตัวแทนทรัพย์สินที่ตรวจสอบได้</small></div><div class="stat"><strong>${D.issues.length}</strong><small>ปัญหาให้ตัดสินใจ · ผ่านแล้ว ${countAccepted()}</small></div></div>
 <div class="callout">เริ่มได้ทุก phase: Tender, Permit, Procurement และ Construction อาจซ้อนกันในคนละ package การคลิกเลือกช่วงงานหรือวัตถุ 3D เป็นการเปิดดูกรณีศึกษา ไม่ได้เปลี่ยนสถานะโครงการหรืออนุมัติให้ทำงาน</div>
 <div class="section-head"><h2>จากความต้องการ → ข้อมูลที่ใช้ทำงานได้</h2><span class="small">3 ปัญหาต่อช่วงงาน</span></div><div class="stage-preview">${D.stages.map((s,i)=>{const p=E.stageStatus(state,D,s.id);return `<button class="stage-tile" data-do="stage" data-id="${s.id}"><span class="number">${String(i+1).padStart(2,'0')} / ${s.id}</span><strong>${h(s.name)}</strong><small>${p.accepted}/${p.total} ประเด็นผ่าน gate</small></button>`;}).join('')}</div>
 <div class="section-head"><h2>อย่าหยุดที่การจัดไฟล์ให้ดูเป็นระบบ</h2></div><div class="grid two"><div class="panel"><ol class="principle-list"><li><div><strong>เลือกวัตถุใน 3D แล้วตามสายใยข้อมูล</strong><p>การเห็นกล่องอุปกรณ์ในโมเดลไม่ได้แปลว่าแบบก่อสร้าง ผลทดสอบ หรือสิทธิ์อ่านเอกสารพร้อมใช้งาน</p></div></li><li><div><strong>แยกคนลงมือ คนตรวจ และคนรับความเสี่ยง</strong><p>สลับบริษัทด้านบน แล้วลองรับหลักฐานหรือผ่าน gate ที่ตนไม่มี mandate</p></div></li><li><div><strong>ผูกทุกข้ออ้างกับ revision และหลักฐาน</strong><p>รับหลักฐานแล้วลองเปิด revision ใหม่ ผลยอมรับเดิมจะล้าสมัย ต้องตรวจและตัดสินใจใหม่</p></div></li></ol></div><div class="panel"><h3>ตามอุปกรณ์หนึ่งตัวไปให้ถึง FM</h3><p>ดู UPS-A-01 จากแนวคิด A/B → vendor interface → shop → inspection → commissioning → verified record → AssetID → simulated EPMS point</p><div class="button-row">${button('เลือก UPS-A-01 ใน 3D','inspect3d','data-id="AS001"','primary')}${button('ดูทะเบียนทรัพย์สิน UPS-A-01','asset','data-id="AS001"')}</div><div class="callout green">ไฟล์ native CAD/BIM เป็นรายการสมมติในทะเบียน ส่วน IFC, BCF, JSON และ PDF ที่ติดป้าย “เปิดตัวอย่างได้จริง” มีไฟล์จริงให้ดาวน์โหลด ไม่สร้างไฟล์ข้อความปลอมเป็น .rvt หรือ .dwg</div></div></div>
 <div class="handover-strip"><strong>จุดหมายของเครื่องมือนี้: ควบคุมพฤติกรรมการใช้ข้อมูล</strong><p>ถ้าคนส่งแบบข้ามระบบ ทีมต้องมีวิธีป้องกัน ตรวจพบ และตอบสนอง พร้อมชื่อผู้รับผิดชอบและหลักฐานว่าหน้างานเปลี่ยนฉบับแล้ว เครื่องมือการเรียนรู้นี้ไม่บังคับสิทธิ์หรือการกระทำในโครงการจริง</p></div>`;}

 function renderInspectorContent(insp){
  const a=insp.asset;
  if(inspectorTab==='docs'){
   return `<h4>ความสัมพันธ์เอกสารของ ${h(a.tag)} (Relation Chain)</h4>
   <p class="small">แต่ละเส้นความสัมพันธ์ระบุ source, baseline revision และสถานะการตรวจสอบ ไม่ใช่ลิงก์ที่แปลว่าอนุมัติอัตโนมัติ</p>
   ${insp.docs.map(d=>`<div class="rel-card ${d.stale?'stale':''}">
    <div class="rel-card-head"><span>${h(d.relationType)}</span>${chip(d.file.state,d.file.state.toLowerCase())}</div>
    <div>${fileLink(d.file.id)}</div>
    <div class="badge-row">
     ${chip('Current '+d.currentRevLabel,d.stale?'high':'')}
     ${chip('Baseline '+d.baselineRevLabel)}
     ${chip(d.canRead?'Access: อ่านได้':'Access: ถูกจำกัด ('+d.file.confidentiality+'/'+d.file.state+')',d.canRead?'good':'block')}
     ${d.stale?chip('Baseline Stale — ต้องทบทวน','critical'):chip('Baseline ตรง','good')}
    </div>
    <div class="small"><strong>Originator:</strong> ${h(d.source)} · <strong>Scope:</strong> ${h(d.scope)}<br><strong>Rule:</strong> ${h(d.verificationStatus)}</div>
   </div>`).join('')}`;
  }
  if(inspectorTab==='issues'){
   return `<h4>ประเด็นควบคุมในโซน ${h(a.zone)} และเอกสารที่เกี่ยวข้อง</h4>
   ${insp.issues.map(q=>`<div class="rel-card ${q.accepted?'':'stale'}">
    <div class="rel-card-head"><span>${h(q.id)} · ${h(q.stage)}</span>${q.accepted?chip('Accepted','good'):chip(q.severity,q.severity)}</div>
    <div><strong>${h(q.title)}</strong></div>
    <p class="small" style="margin:4px 0">${h(q.problem)}</p>
    <div class="small">แก้: <strong>${h(q.fixBy)}</strong> · ตรวจ: <strong>${h(q.verifyBy)}</strong> · Gate: <strong>${h(q.gateBy)}</strong></div>
    <div class="button-row" style="margin-top:6px">${button('เปิดตัดสินใจประเด็นนี้','stage',`data-id="${q.stage}"`,'small primary')}</div>
   </div>`).join('')||'<p class="small">ไม่มีประเด็นผูกโดยตรง</p>'}`;
  }
  if(inspectorTab==='evidence'){
   const reqs=insp.issues.flatMap(q=>q.requirementsStatus.map(r=>({...r,issueId:q.id})));
   return `<h4>หลักฐาน (Evidence Receipts) ที่เกี่ยวข้อง</h4>
   <p class="small">เปลี่ยน source หรือ evidence revision จะทำให้หลักฐานเดิมล้าสมัยทันที</p>
   ${reqs.map(r=>`<div class="rel-card ${r.valid?'':'stale'}">
    <div class="rel-card-head"><span>${h(r.id)} (${h(r.issueId)})</span>${chip(r.valid?'Valid Receipt':'ยังไม่รับ / ล้าสมัย',r.valid?'good':'high')}</div>
    <div>${h(r.label)}</div>
    <div class="small" style="margin:4px 0">${fileLink(r.file.id)} · Provider: <strong>${h(r.provider)}</strong> · ${h(r.currentRevLabel)}</div>
    <div class="button-row">${button('ลองเปิด Revision ใหม่','revise',`data-id="${r.file.id}"`,'small ghost')}${button('ไปที่ Gate','stage',`data-id="${r.issueId.split('-')[0]}"`,'small')}</div>
   </div>`).join('')}`;
  }
  if(inspectorTab==='deps'){
   return `<h4>Digital Thread 14 ช่วงงาน (${h(a.tag)})</h4>
   <p class="small">คลิกไฟล์เพื่อเปิดดู dependency หรือจำลองเปิด revision ใหม่เพื่อทดสอบผลกระทบ</p>
   ${insp.threadDocs.map(t=>`<div class="rel-card ${t.stale?'stale':''}">
    <div class="rel-card-head"><span>${h(t.stage)}</span>${chip(t.currentRevLabel,t.stale?'high':'')}${chip(t.file.state,t.file.state.toLowerCase())}</div>
    <div>${fileLink(t.file.id)}</div>
    <div class="small">${h(t.file.title)} · Originator: ${h(t.file.originator)}</div>
   </div>`).join('')}`;
  }
  return `<h4>สิทธิ์การเข้าถึง (Effective Access Policy: ${h(actor)})</h4>
  <p class="small">การมองเห็นวัตถุ ${h(a.tag)} ใน 3D Viewer ไม่ได้ให้สิทธิ์อ่านเอกสารทุกฉบับในทะเบียน</p>
  <div class="callout ${insp.docs.every(d=>d.canRead)?'green':'red'}">
   บทบาทปัจจุบัน: <strong>${h(actor)} (${h(company(actor).name)})</strong><br>
   อ่านได้ ${insp.docs.filter(d=>d.canRead).length} / ${insp.docs.length} เอกสารหลักของอุปกรณ์นี้
  </div>
  ${insp.docs.map(d=>`<div class="rel-card">
   <div class="rel-card-head"><span>${h(d.file.name)}</span>${chip(d.canRead?'อ่านได้':'ปฏิเสธการอ่าน',d.canRead?'good':'block')}</div>
   <div class="small">State: <strong>${h(d.file.state)}</strong> · Scope: <strong>${h(d.file.confidentiality)}</strong> · Originator: <strong>${h(d.file.originator)}</strong></div>
   <div class="button-row" style="margin-top:5px">${button('ทดสอบเปิดไฟล์','file',`data-id="${d.file.id}"`,'small')}${!d.canRead?button('ขอ read access','requestAccess',`data-id="${d.file.id}"`,'small primary')+button('สวมบทบาท '+d.file.originator,'actor',`data-id="${d.file.originator}"`,'small ghost'):''}</div>
  </div>`).join('')}`;
 }

 function renderSpatialEngineeringCard(a,zv){
  const sp=a.spatial||{};
  const ceilStr=zv?.ceilingH?`+${zv.ceilingH.toFixed(2)}m (Clear ${(zv.ceilingH-sp.ffl).toFixed(2)}m)`:'Open to Structure (No False Ceiling)';
  return `<div class="rel-card" style="background:#f3f7f2;border-color:#c6d6c4;margin-top:10px">
   <div class="rel-card-head"><span>📐 Illustrative Datum, Elevations & Envelope</span>${chip('Grid '+(sp.gridRef||'—'))}</div>
   <dl class="definition" style="margin-top:6px">
    <dt>Site / Ground</dt><dd class="mono">DuctBank: -1.15m | EGL: ${(sp.egl??-0.80).toFixed(2)}m | Road: -0.60m | Podium: ±0.00m</dd>
    <dt>Floor Datums</dt><dd class="mono">SSL: +${sp.ssl?.toFixed(2)}m | FFL: +${sp.ffl?.toFixed(2)}m | Top: +${sp.topElev?.toFixed(2)}m</dd>
    <dt>Ceiling / Soffit</dt><dd class="mono">Ceiling: ${ceilStr} | Soffit: +${(zv?.soffit||4.8).toFixed(2)}m</dd>
    <dt>Floor System</dt><dd>${h(sp.mounting||'Concrete Plinth')}</dd>
    <dt>Coordinates</dt><dd class="mono">X: ${sp.x?.toFixed(2)}m · Y: ${sp.y?.toFixed(2)}m · Z(FFL): +${sp.ffl?.toFixed(2)}m</dd>
    <dt>Dimensions</dt><dd class="mono">${sp.w?.toFixed(2)}m (W) × ${sp.d?.toFixed(2)}m (D) × ${sp.h?.toFixed(2)}m (H)</dd>
    <dt>Service Env.</dt><dd class="mono">Front: ${sp.clearanceFront?.toFixed(2)}m · Rear: ${sp.clearanceRear?.toFixed(2)}m · Top: ${sp.clearanceTop?.toFixed(2)}m</dd>
    <dt>Illustrative mass</dt><dd class="mono">${sp.weightKg?.toLocaleString()||'—'} kg</dd>
    <dt>Fire Boundary</dt><dd>${h(zv?.fireRating||'Project-defined fire compartment')}</dd>
   </dl>
  </div>`;
 }

 function renderServiceInspector(service){
  const kw=v=>Number(v).toLocaleString('th-TH',{maximumFractionDigits:2});
  return `<section class="service-spec-card"><span class="eyebrow">DIMENSIONED SERVICE ASSEMBLY · ${h(service.kind)}</span><h2>${h(service.id)}</h2><p>${h(service.name)}</p><div class="button-row">${button(V?.getState().isolateService?'คืนบริบทอาคาร':'แยกดู assembly นี้','viewerCmd','data-cmd="toggleIsolateService"','small primary')}</div><div class="badge-row">${chip(service.zone)}${chip(service.owner)}${chip('Illustrative specification','high')}</div>
  <p class="small">${h(D.scene.serviceDetail.notice)} · เป็นบาง feeder / branch ไม่ใช่ขนาดระบบสำหรับ 12 MW ทั้ง campus</p>
  <dl class="definition">
  ${service.currentA?`<dt>Rated / model load</dt><dd>${service.currentA} A · ${service.voltageV} V · PF ${service.powerFactor}<br>Assumed load ${kw(service.loadKW)} kW<br>Ideal PF conversion ${kw(service.idealKW)} kW<br><small>√3 × V × A × PF / 1000; ไม่ใช่ capacity ที่ derate/ตรวจแล้ว</small></dd>`:''}
  ${service.pipeCount?`<dt>Pipe count / size</dt><dd>${service.pipeCount} เส้น · DN${service.dn} · OD ${(service.outerDiameterM*1000).toFixed(1)} mm · ฉนวน ${service.insulationM*1000} mm</dd><dt>Thermal / flow</dt><dd>${kw(service.coolingKW)} kW cooling · ${service.supplyC}/${service.returnC} °C · ΔT ${service.returnC-service.supplyC} K<br>${kw(service.flowLps)} L/s ต่อ supply หรือ return (ไม่บวก flow สองเส้น)</dd>`:''}
  ${service.conduitCount?`<dt>Conduit count</dt><dd>${service.conduitCount} ท่อ · ${service.columns} columns × ${service.rows} rows · Ø${Math.round(service.outerDiameterM*1000)} mm</dd>`:''}
  ${Object.entries(service.specs||{}).map(([k,v])=>`<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join('')}
  <dt>Zones / levels</dt><dd>${h(service.zoneIds.join(' / '))} · ${h(service.levels.join(' / '))}</dd></dl>
  <h3>อุปกรณ์และเอกสารที่เกี่ยวข้อง</h3><div class="button-row">${service.assetIds.map(id=>button(h(D.assets.find(a=>a.id===id).tag),'select3dAsset',`data-id="${id}"`,'small')).join('')||'<span class="small">ไม่มี AssetID เฉพาะชิ้นในตัวอย่างนี้</span>'}</div>
  <ul class="file-mini-list">${service.fileIds.map(id=>`<li>${fileLink(id)} · ${chip(E.canRead(D,file(id),actor,state)?'อ่านได้':'จำกัดสิทธิ์')}</li>`).join('')}</ul><p class="small">เป็น package context ของฝ่ายผู้จัดทำ ต้องตรวจ applicability และ revision ก่อนใช้ ตัว geometry ยังไม่ใช่ IFC/native model ที่โหลดมาหรือแบบก่อสร้าง</p></section>`;
 }
 function assetServiceCard(a){const spec=a.serviceSpecs;if(!spec)return '';const labels={outputKW:'Output (kW)',ratedKVA:'Rated (kVA)',voltageV:'Voltage (V)',currentA:'Current (A)',powerFactor:'Power factor',idealKW:'Ideal PF conversion (kW)',assumedEfficiency:'Assumed efficiency',lossKW:'Loss at assumed point (kW)',coolingKW:'Cooling duty (kW thermal)',inputKW:'Electrical input (kW)',assumedCOP:'Assumed COP',heatRejectionKW:'Total heat rejection (kW thermal)',fanKW:'Fan input (kW)',motorKW:'Motor nameplate (kW)',flowLps:'Assumed flow (L/s)',headKPa:'Assumed differential head (kPa)',itKW:'IT load TOTAL (kW)',feedCount:'A/B inputs (count)'};return `<section class="service-spec-card"><h3>Representative service / nameplate</h3><dl class="definition">${Object.entries(labels).filter(([k])=>Object.hasOwn(spec,k)).map(([k,l])=>`<dt>${l}</dt><dd>${h(spec[k])}</dd>`).join('')}</dl><p class="small">${h(spec.description)} · ${h(spec.basis)}</p></section>`;}
 function atlas(){
  const z=D.zones.find(z=>z.id===selectedZone)||D.zones[0],zv=(D.scene?.zoneVolumes||[]).find(v=>v.zoneId===z.id),list=D.files.filter(f=>f.zone===z.id),open=D.issues.filter(q=>q.zone===z.id&&!E.accepted(state,D,q));
  const insp=selectedAsset?E.assetInspector(state,D,selectedAsset,actor):null,a=insp?.asset,vst=V?.getState()||{showSite:true,showDuctBanks:true,showClearance:true,showRoutes:true,showElevations:true,showLabels:true,isolateZone:false,explodeMode:false,isFullscreen:false,levelFilter:'ALL',viewMode:'iso'};
  const qTree=treeFilter.toLowerCase().trim();
  const services=D.scene.serviceDetail?.services||[],service=services.find(x=>x.id===selectedService);
  const dbs=D.scene?.siteMasterplan?.ductBanks||[];
  return `${heading('3D OBJECT & INFORMATION RELATIONSHIPS','สำรวจพื้นที่ อุปกรณ์ และหลักฐานที่ใช้ตัดสินใจ','เลือกโซนหรือวัตถุเพื่อไล่ความสัมพันธ์ของข้อมูลตั้งแต่แนวคิดจนถึงการเดินระบบ เปรียบเทียบผู้จัดทำ สิทธิ์อ่าน revision และจุดควบคุม')}
  <div class="callout"><strong>โมเดลเพื่อการเรียนรู้:</strong> ภาพสามมิตินี้สร้างจาก scene manifest ด้วย Canvas ไม่ได้อ่าน geometry จาก IFC/Revit ที่ดาวน์โหลด พิกัด ขนาด น้ำหนัก ระยะซ่อมบำรุงและแนว A/B เป็นสมมติฐาน ไม่ใช่ผลตรวจ capacity, fire strategy, redundancy หรือ Tier certification เส้นทางแยกกันในภาพยังไม่พิสูจน์ว่าไม่มีจุดเสียหายร่วม</div>
  <div class="callout"><strong>ขอบเขตตัวเลข:</strong> 12 MW IT เป็นโจทย์โปรแกรมทั้งโครงการ ไม่ใช่โหลดที่โมเดลนี้พิสูจน์ว่ารองรับ ขนาดห้องเป็น teaching geometry แบบย่อ ไม่ได้จัดวางครบ 500 racks ต่อ Hall; busway 4000 A ที่เห็นเป็นเพียง feeder ตัวอย่าง 1,800 kW และ CHW header 2,400 kW เป็นตัวอย่างบางส่วน ไม่ใช่ระบบจ่ายไฟ/ความเย็นครบทั้ง campus</div>
  <div class="viewer-shell">
   <aside class="viewer-tree" aria-label="โครงสร้างโซนและวัตถุ 3D">
    <label class="small" for="tree-search"><strong>Object Tree · Assets / Zones / Services</strong></label>
    <input id="tree-search" type="search" value="${h(treeFilter)}" placeholder="ค้นหาเช่น UPS, E01, CH-01, GUID...">
    <div class="tree-scroll">
     ${D.zones.map(zn=>{
      const zAssets=D.assets.filter(x=>x.zone===zn.id&&(!qTree||[x.tag,x.type,x.zone,x.system,x.ifcGuid,zn.name].join(' ').toLowerCase().includes(qTree)));
      if(qTree&&!zAssets.length&&![zn.id,zn.name].join(' ').toLowerCase().includes(qTree))return '';
      const zVol=(D.scene?.zoneVolumes||[]).find(v=>v.zoneId===zn.id);
      return `<div class="tree-zone ${zn.id===selectedZone?'active':''}">
       <button class="tree-zone-btn" data-do="zone" data-id="${zn.id}" aria-pressed="${zn.id===selectedZone}"><span>${h(zn.id)} · ${h(zn.name)} <small class="mono">(L${h(zn.level)} · +${(zVol?.ffl??0).toFixed(2)}m)</small></span>${chip(zAssets.length)}</button>
       ${zAssets.length?`<ul class="tree-assets">${zAssets.map(x=>{
        const hasErr=E.assetProblems(state,D).some(p=>p.id===x.id);
        return `<li><button class="tree-asset-btn ${x.id===selectedAsset?'active':''}" data-do="select3dAsset" data-id="${x.id}" aria-pressed="${x.id===selectedAsset}"><span>${h(x.tag)}</span><span>${hasErr?'⚠️':''} +${x.spatial?.ffl?.toFixed(2)||'0.15'}m</span></button></li>`;
       }).join('')}</ul>`:''}
      </div>`;
     }).join('')||'<p class="empty">ไม่พบโซนหรืออุปกรณ์</p>'}<details class="service-tree" open><summary>Service assemblies (${services.length})</summary>${services.filter(s=>!qTree||[s.id,s.name,s.kind,s.zone].join(' ').toLowerCase().includes(qTree)).map(s=>`<button class="tree-asset-btn ${selectedService===s.id?'active':''}" data-do="selectService" data-id="${s.id}" aria-pressed="${selectedService===s.id}"><span>${h(s.id)}</span><small>${h(s.kind)}</small></button>`).join('')||'<p class="small">ไม่พบ service ที่ค้นหา</p>'}</details>
    </div>
   </aside>

   <section class="viewer-stage ${vst.isFullscreen?'is-fullscreen':''}" aria-label="3D Interactive Canvas">
    <div class="viewer-toolbar">
     <div class="button-row">
      ${button('3D Iso','viewerCmd','data-cmd="viewIso"','small '+(vst.viewMode==='iso'?'active':''))}
      ${button('Top Plan','viewerCmd','data-cmd="viewTop"','small '+(vst.viewMode==='top'?'active':''))}
      ${button('South Elev','viewerCmd','data-cmd="viewSouth"','small '+(vst.viewMode==='south'?'active':''))}
      ${button('East Elev','viewerCmd','data-cmd="viewEast"','small '+(vst.viewMode==='east'?'active':''))}
      ${button('Zoom '+z.id,'viewerCmd','data-cmd="fitZone"','small')}
      ${a?button('Zoom '+h(a.tag),'viewerCmd','data-cmd="fitAsset"','small'):''}
      ${button('🧩 แยกโมเดล (Separate / Explode)','viewerCmd','data-cmd="toggleExplode" aria-pressed="'+vst.explodeMode+'" title="แยกชิ้นส่วนโซนและชั้นออกจากกันเพื่อดูภายในชัดเจน"','small '+(vst.explodeMode?'active':''))}
      ${button('🏷️ เปิด/ปิด Label','viewerCmd','data-cmd="toggleLabels" aria-pressed="'+vst.showLabels+'" title="ซ่อนหรือแสดงป้ายชื่อทั้งหมดใน 3D"','small '+(vst.showLabels?'active':''))}
      ${button('Reset','viewerCmd','data-cmd="reset"','small')}
      ${button(vst.isFullscreen?'🗗 ย่อกลับ':'⛶ ขยายเต็มจอ','viewerCmd','data-cmd="fullscreen" title="ขยายดูโมเดล 3D เต็มหน้าจอ"','small primary')}
     </div>
     <div class="button-row">
      ${[['ALL','ทุกชั้น'],['00','L00 (±0.0m)'],['01','L01 (+3.6m)'],['RF','RF (+4.8m)']].map(([lv,lbl])=>button(lbl,'viewerCmd',`data-cmd="level:${lv}"`,'small '+(vst.levelFilter===lv?'active':''))).join('')}
      ${button('⚡ Duct Bank','viewerCmd','data-cmd="toggleDuctBanks" aria-pressed="'+vst.showDuctBanks+'"','small '+(vst.showDuctBanks?'active':''))}
      ${button('Site & Roads','viewerCmd','data-cmd="toggleSite" aria-pressed="'+vst.showSite+'"','small '+(vst.showSite?'active':''))}
      ${button('Isolate โซน '+z.id,'viewerCmd','data-cmd="toggleIsolate" aria-pressed="'+vst.isolateZone+'"','small '+(vst.isolateZone?'active':''))}
      ${button('▽ Elevations','viewerCmd','data-cmd="toggleElevations" aria-pressed="'+vst.showElevations+'"','small '+(vst.showElevations?'active':''))}
      ${button('Detailed services','viewerCmd','data-cmd="toggleServiceDetail" aria-pressed="'+(vst.showServiceDetail!==false)+'"','small '+(vst.showServiceDetail!==false?'active':''))}${button('90° Busway/Pipes','viewerCmd','data-cmd="toggleRoutes" aria-pressed="'+vst.showRoutes+'"','small '+(vst.showRoutes?'active':''))}
      ${button('Clearance','viewerCmd','data-cmd="toggleClearance" aria-pressed="'+vst.showClearance+'"','small '+(vst.showClearance?'active':''))}
     </div>
     <div class="zone-pill-bar" role="group" aria-label="แถบเลือกและแจกแจงโซน">
      <span class="small" style="color:#b8d4c3;font-weight:700;margin-right:4px">โซน (คลิกเลือก):</span>
      ${D.zones.map(zn=>{
       const zvItem=(D.scene?.zoneVolumes||[]).find(v=>v.zoneId===zn.id);
       const isSel=zn.id===selectedZone;
       return `<button class="btn small ${isSel?'active':''}" data-do="zone" data-id="${zn.id}" aria-pressed="${isSel}" title="${h(zn.name)} · Level ${h(zn.level)} · FFL +${(zvItem?.ffl??0).toFixed(2)}m">${h(zn.id)} <small style="opacity:0.8">L${h(zn.level)}</small></button>`;
      }).join('')}
     </div>
    </div>
    <div class="canvas-wrap"><canvas tabindex="0" id="dc-3d-canvas" aria-label="โมเดล 3D แสดงผังบริเวณ โซน ค่าระดับ ท่อร้อยสายใต้ดิน และอุปกรณ์ คลิกเพื่อเลือกโซนหรือวัตถุ ใช้ลูกศรหมุน Shift และลูกศรเลื่อน เครื่องหมายบวกหรือลบซูม Home คืนมุมมอง"></canvas></div>
    <div class="viewer-legend">
     <span><i class="legend-dot" style="background:#1e2724"></i>Frontage Highway (-0.70m) & Sign</span>
     <span><i class="legend-dot" style="background:#cfdad2"></i>Loading Dock (+1.20m) & Lobby (L00)</span>
     <span><i class="legend-dot" style="background:#e0a326"></i>Duct Bank & Busway A</span>
     <span><i class="legend-dot" style="background:#3891d6"></i>Duct Bank & Busway B</span>
     <span><i class="legend-dot" style="background:#9b6fe0"></i>Diverse Fiber Duct Bank PoP-1 / PoP-2</span>
     <span><i class="legend-dot" style="background:#1e7054"></i>UPS (+0.15m) / Chiller (+0.25m)</span>
     <span><i class="legend-dot" style="background:#8cdcf5"></i>Ceiling (FCL) & Soffit</span>
    </div>
   </section>

   <aside class="inspector-pane" aria-label="Properties & Related Records Inspector">
    <div class="rel-card" style="background:#e9f3ec;border-color:#9fc2ab;margin-bottom:10px">
     <div class="rel-card-head"><span>📍 SELECTED ZONE · ${h(z.id)} (${h(z.name)})</span>${chip('Level '+z.level)}</div>
     <div class="small"><strong>SSL:</strong> +${(zv?.ssl??0).toFixed(2)}m · <strong>FFL:</strong> +${(zv?.ffl??0).toFixed(2)}m · <strong>Ceiling:</strong> ${zv?.ceilingH?'+'+zv.ceilingH.toFixed(2)+'m':'Open'} · <strong>Soffit:</strong> +${(zv?.soffit??0).toFixed(2)}m</div>
     <div class="small"><strong>Lead:</strong> ${h(z.lead)} · <strong>Scope:</strong> ${h(z.scope)}</div>
    </div>
    ${!service?(window.DCBuilding?.zonePanel(D,z.id,V?.getState().selectedBuilding)||''):''}
    ${service?renderServiceInspector(service):''}
    ${a?`<span class="eyebrow">OBJECT INSPECTOR · ${h(a.objectId)} · GRID ${h(a.spatial?.gridRef||'—')}</span>
    <h2 style="margin:4px 0 6px">${h(a.tag)} <small class="small">(${h(a.type)})</small></h2>
    <div class="badge-row">
     ${chip('Zone '+a.zone+' (L'+z.level+')')}
     ${chip('FFL +'+a.spatial?.ffl?.toFixed(2)+'m')}
     ${chip('Identity baseline: '+insp.mappingStatus,insp.mappingStatus==='ALIGNED'?'good':'high')}<p class="small">ALIGNED ตรวจ revision/identity เท่านั้น ไม่ยืนยัน geometry หรือการติดตั้งจริง</p>
     ${chip(insp.dataQuality==='PASS'?'Asset Data: ผ่านกติกา':'Asset Data: มีข้อบกพร่อง ('+insp.problems.length+')',insp.dataQuality==='PASS'?'good':'high')}
    </div>
    <dl class="definition" style="margin-top:8px">
     <dt>AssetID / Key</dt><dd class="mono">${h(a.tag)} (${h(a.cmmsKey)})</dd>
     <dt>IFC GUID</dt><dd class="mono">${h(a.ifcGuid)}</dd>
     <dt>Originator</dt><dd>${h(a.supplier)} · ${h(company(a.supplier).name)}</dd>
     <dt>Native Source</dt><dd>${fileLink(insp.modelFile.id)} (${h(insp.modelRevLabel)} · ${h(insp.modelFile.state)})</dd>
     <dt>Exchange IFC</dt><dd>${fileLink(insp.proxyFile.id)} (${h(insp.proxyRevLabel)})</dd>
     <dt>Telemetry Point</dt><dd class="mono">${h(a.telemetryPoint)}</dd>
    </dl>
    ${assetServiceCard(a)}${renderSpatialEngineeringCard(a,zv)}
    <div class="button-row" style="margin-top:10px">
     ${button('แก้ข้อมูล Handover','asset',`data-id="${a.id}"`,'small primary')}
     ${button('กรองไฟล์โซน '+a.zone,'zoneFiles',`data-id="${a.zone}"`,'small')}
    </div>
    <div class="inspector-tabs" role="group" aria-label="ข้อมูลวัตถุ">
     ${[['docs','Documents ('+insp.docs.length+')'],['issues','Issues ('+insp.issues.length+')'],['evidence','Evidence'],['deps','14-Stage Thread'],['access','Access ('+actor+')']].map(([k,lbl])=>`<button data-do="inspectorTab" data-value="${k}" class="${inspectorTab===k?'active':''}" aria-pressed="${inspectorTab===k}">${h(lbl)}</button>`).join('')}
    </div>
    <div>${renderInspectorContent(insp)}</div>`:`<div class="callout">${service?'เลือก service assembly อยู่ เลือก Asset จาก Object Tree เพื่อดูข้อมูลเฉพาะชิ้น':'โซน '+h(z.id)+' ไม่มีอุปกรณ์ตัวอย่างในทะเบียน FM; องค์ประกอบห้องด้านบนเป็น teaching objects แยกจากทะเบียนนี้ เปิดไฟล์โซนเพื่อดูบริบทโครงการได้'}</div>${button('เปิดไฟล์โซน '+h(z.id),'zoneFiles',`data-id="${z.id}"`,'small')}`}
   </aside>
  </div>

  <div class="callout">Detailed services แสดง casing, joints, tap-offs, hangers, ท่อคู่/ฉนวน/valves และ riser/door assemblies จากสเปคสมมติ เลือกจาก tree หรือคลิกในฉากเพื่อดูรายละเอียด เส้นทางข้ามโซนซ่อนขณะ Explode เพื่อไม่แสดงการเชื่อมต่อที่ผิดตำแหน่ง ตัวอย่างนี้ครอบคลุมเพียงบาง feeder/branch ไม่ใช่ระบบจ่ายโหลดครบ 12 MW</div>
  <div class="section-head"><h2>แจกแจง 11 โซน + แนวท่อร้อยสายใต้ดินเชิงแนวคิด</h2><span class="small">คลิกโซนในตารางเพื่อซิงค์กับโมเดล 3D ทันที</span></div>
  <div class="grid two">
   <div class="panel">
    <h3>ตารางแจกแจงโซนและค่าระดับ (11 Zones + L00 Base Volumes)</h3>
    <div class="table-wrap" style="max-height:340px;overflow:auto">
     <table>
      <thead><tr><th>Zone</th><th>Level</th><th>SSL / FFL</th><th>Ceiling / Soffit</th><th>Lead & ระบบพื้น</th></tr></thead>
      <tbody>
       ${(D.scene?.zoneVolumes||[]).map(v=>`<tr class="${v.zoneId===selectedZone?'selected-row':''}" data-do="zone" data-id="${h(v.zoneId)}" style="cursor:pointer">
        <td><button class="file-link" data-do="zone" data-id="${h(v.zoneId)}">${h(v.zoneId)}</button><span class="file-title">${h(v.name)}</span></td>
        <td>${chip('L'+v.level)}</td>
        <td class="mono">${v.ssl>=0?'+':''}${v.ssl.toFixed(2)}m / ${v.ffl>=0?'+':''}${v.ffl.toFixed(2)}m</td>
        <td class="mono">${v.ceilingH?'+'+v.ceilingH.toFixed(2)+'m':'Open'} / +${v.soffit.toFixed(2)}m</td>
        <td><strong>${h(v.lead)}</strong><span class="file-title">${h(v.floorSystem)}</span></td>
       </tr>`).join('')}
      </tbody>
     </table>
    </div>
   </div>
   <div class="panel">
    <h3>แนวท่อร้อยสายใต้ดิน (Underground Duct Banks & Manholes)</h3>
    <p class="small">ออกแบบแยกเส้นทางไฟฟ้า 22kV (Path A / Path B) และท่อสื่อสารไฟเบอร์ (Carrier PoP-1 / PoP-2) เข้าจากคนละฝั่งของถนนหน้าโครงการ ตำแหน่งบ่อพักและแนวเส้นทางเป็นตัวอย่าง ยังไม่ได้ตรวจระยะห่างตลอดแนว ความเสี่ยงขุดโดนร่วมกัน การตัดแยกเพื่อซ่อมบำรุง หรือผลกระทบขณะระบบขัดข้อง</p>
    ${dbs.map(db=>`<div class="rel-card" style="border-left:4px solid ${h(db.color)}">
     <div class="rel-card-head"><span>${h(db.id)} · ${h(db.name)}</span>${chip('Bundle CL '+db.centerlineElev.toFixed(2)+'m')}</div>
     <div class="small"><strong>Conduits:</strong> ${h(db.conduits)} · <strong>Target Zone:</strong> ${button(db.targetZone,'highlightZone3d',`data-id="${db.targetZone}"`,'small ghost')}</div>
     <div class="small"><strong>Separation:</strong> ${h(db.separationNote)}</div>
    </div>`).join('')}
   </div>
  </div>

  <div class="section-head"><h2>ผังความสัมพันธ์ 2D · ลองลากจัดโซน</h2><span class="small">เลือกกล่องแล้วตามไปดูโซนเดียวกันใน 3D</span></div>
 ${Z?.shell()||''}
 <details class="zone-reference"><summary>เทียบผังอ้างอิงและขอบเขตความรับผิดชอบของแต่ละโซน</summary>
  <div class="callout"><strong>ลองขยับความสัมพันธ์ด้วยตัวเอง</strong> ลากกล่อง ดูเส้นที่ตามไป และรับคำใบ้เมื่อคู่ที่ควรอยู่ติดกันแยกห่าง ${viewButton("✦ เปิดสนามจัดโซน","play","primary")}</div><div class="map-layout"><div><div class="campus" aria-label="แผนผังโซนสมมติ ไม่ได้มาตราส่วน">${D.zones.filter(z=>z.id!=='SITE').map(q=>`<button class="zone ${q.id===selectedZone?'selected':''} ${q.id.startsWith('E')||q.id==='GEN'?'power':q.id==='CHY'?'cooling':''}" data-do="zone" data-id="${q.id}" aria-pressed="${q.id===selectedZone}" style="left:${q.x/38*100}%;top:${q.y/39*100+5}%;width:${q.w/38*100}%;height:${q.h/39*100}%"><strong>${q.id}</strong><small>${h(q.name)}</small></button>`).join('')}</div><p class="small">ผังเชิงแนวคิด ไม่ใช่พื้นที่จริงหรือแบบก่อสร้าง · เส้นขอบอาคาร/ห้องไม่ได้พิสูจน์ segregation performance</p><div class="zone-list">${D.zones.map(q=>button(q.id,'zone',`data-id="${q.id}" aria-pressed="${q.id===selectedZone}"`,'small')).join('')}</div></div><div class="panel zone-details">${chip(z.id)}<h2>${h(z.name)}</h2><dl class="definition"><dt>Level code</dt><dd>${h(z.level)} / ${h(D.naming.levels[z.level])}</dd><dt>Lead interface</dt><dd>${h(z.lead)} · ${h(company(z.lead).name)}</dd><dt>ขอบเขต</dt><dd>${h(z.scope)}</dd><dt>ต้องควบคุม</dt><dd>${h(z.risk)}</dd><dt>ทะเบียน</dt><dd>${list.length} ไฟล์ · ${open.length} ประเด็นยังไม่ผ่าน gate</dd></dl><div class="button-row" style="margin-top:18px">${button('กรองไฟล์โซนนี้','zoneFiles',`data-id="${z.id}"`,'primary')}</div><h3 style="margin-top:22px">ตัวอย่าง interface ที่ต้องตัดสินใจ</h3>${open.slice(0,4).map(q=>`<p class="small">${chip(q.severity,q.severity)} <a href="#main" data-do="stage" data-id="${q.stage}">${h(q.id+' / '+q.title)}</a></p>`).join('')||'<p>ประเด็นในโซนนี้ผ่านแล้ว ดูประวัติและ revision ที่อ้างอิงก่อนใช้ผล</p>'}</div></div>
 </details>
  <div class="section-head"><h2>25 องค์กร ใครทำอะไร ส่งอะไร</h2><span class="small">ชื่อบริษัททั้งหมดสมมติ</span></div><div class="company-cards">${D.companies.map(c=>`<article class="panel company-card">${chip(c.id)}<h3>${h(c.name)}</h3><div class="role">${h(c.role)}</div><p>${h(c.scope)}</p><p class="small"><strong>ข้อมูลที่จัดทำ:</strong> ${h(c.deliverables)}</p><div class="button-row">${button('ดูไฟล์','companyFiles',`data-id="${c.id}"`,'small')}${button('สวมบทบาทนี้','actor',`data-id="${c.id}"`,'small ghost')}</div></article>`).join('')}</div>`;
 }

 function fileRows(rows){return rows.map(f=>{
  const allowed=E.canRead(D,f,actor,state);
  const staleDeps=Object.entries(f.dependencyVersions||{}).some(([depId,depRev])=>E.revision(state,file(depId))!==depRev);
  return `<tr class="${f.id===selectedFileId?'selected-row':''}" data-do="selectFileRow" data-id="${h(f.id)}">
   <td>${fileLink(f.id)}<span class="file-title">${h(f.title)}</span>${f.download?'<span class="chip good">เปิดตัวอย่างได้จริง</span>':'<span class="ext">ทะเบียนสมมติ / ไม่มี native binary</span>'}</td>
   <td>${h(f.originator)}<span class="file-title">${h(company(f.originator).name)}</span></td>
   <td>${h(f.zone)} / ${h(f.level)}</td>
   <td>${chip(f.stage)}<span class="file-title">${h(stage(f.stage).name)}</span></td>
   <td><div class="badge-row">${chip(f.state,f.state.toLowerCase())}${chip(E.revLabel(E.revision(state,f)))}${staleDeps?chip('Upstream Changed','high'):''}</div></td>
   <td><span class="ext">.${h(f.ext)}</span><span class="file-title">${h(f.category)}</span></td>
   <td>${h(f.purpose)}<div class="badge-row">${chip(f.confidentiality)}${chip(allowed?'อ่านได้':'จำกัดสิทธิ์',allowed?'good':'block')}</div></td>
  </tr>`;
 }).join('');}

 function optionList(items,value,label='ทั้งหมด'){return `<option value="">${label}</option>`+items.map(([v,t])=>`<option value="${h(v)}" ${v===value?'selected':''}>${h(t)}</option>`).join('');}
 function filteredFiles(){const q=filters.q.toLowerCase().trim();return D.files.filter(f=>(!filters.stage||f.stage===filters.stage)&&(!filters.originator||f.originator===filters.originator)&&(!filters.zone||f.zone===filters.zone)&&(!filters.kind||f.category===filters.kind)&&(!filters.state||f.state===filters.state)&&(!q||[f.name,f.title,f.ext,f.id,f.originator,f.zone,f.purpose].join(' ').toLowerCase().includes(q)));}

 function filesView(){
  const rows=filteredFiles();
  const selF=rows.find(x=>x.id===selectedFileId)||rows[0]||null;
  if(selF)selectedFileId=selF.id;
  const fObj=selF?E.fileObjects(D,selF.id):null,allowed=selF?E.canRead(D,selF,actor,state):false;
  const stateCounts={WIP:0,SHARED:0,PUBLISHED:0,ARCHIVED:0};
  D.files.forEach(f=>{stateCounts[f.state]=(stateCounts[f.state]||0)+1;});
  return `${heading('CONTAINER REGISTER / SPLIT WORKSPACE','ไฟล์ไหน ของใคร สัมพันธ์กับวัตถุ 3D ใด','ค้นหาและกรอง source model, exchange, drawing, document และ issue evidence แยกป้าย CDE state, revision, intended use, access และ baseline freshness ออกจากกันอย่างชัดเจน')}
  <div class="callout green"><strong>ตัวอย่าง:</strong> DC01-ELD-E01-00-M3-E-0001.rvt → Project / Originator / Volume / Level / Type / Role / Number · รหัสทั้งหมดเป็น project-defined ไม่ใช่ชุดรหัส ISO ที่บังคับใช้ทุกโครงการ</div>
  <div class="filter-bar"><div><label for="filter-q">ค้นหาชื่อ / คำอธิบาย / นามสกุล</label><input id="filter-q" data-filter="q" value="${h(filters.q)}" placeholder="เช่น UPS, .ifc, FAT, E01, SOO" type="search"></div><div><label for="filter-stage">ช่วงงาน</label><select id="filter-stage" data-filter="stage">${optionList(D.stages.map(s=>[s.id,s.id+' / '+s.name]),filters.stage)}</select></div><div><label for="filter-originator">บริษัทผู้จัดทำ</label><select id="filter-originator" data-filter="originator">${optionList(D.companies.map(c=>[c.id,c.id+' / '+c.name]),filters.originator)}</select></div><div><label for="filter-zone">โซน</label><select id="filter-zone" data-filter="zone">${optionList(D.zones.map(z=>[z.id,z.id+' / '+z.name]),filters.zone)}</select></div><div><label for="filter-state">CDE state</label><select id="filter-state" data-filter="state">${optionList(['WIP','SHARED','PUBLISHED','ARCHIVED'].map(x=>[x,x]),filters.state)}</select></div></div>
  <div class="subnav">${['','Model / data','Drawing','Document / register'].map(k=>button(h(k||'ทุกชนิด'),'fileKind',`data-value="${h(k)}" aria-pressed="${filters.kind===k}"`,'small '+(filters.kind===k?'active':''))).join('')}</div>
  <div class="table-top"><span class="file-count">${rows.length} / ${D.files.length} รายการ · ${rows.filter(f=>f.download).length} ตัวอย่างเปิดได้จริง</span><div class="button-row">${button('ล้างตัวกรอง','clearFilters','','small')}${button('Export ทะเบียนที่กรอง JSON','exportFiles','','small')}${D.samples.bundle?`<a class="btn small primary" href="${h(D.samples.bundle)}" download>ดาวน์โหลดชุดไฟล์ตัวอย่าง</a>`:''}</div></div>

  <div class="files-workspace">
   <aside class="folder-tree" aria-label="CDE Folder Structure">
    <h3>CDE Folders</h3>
    <button class="folder-btn ${filters.state===''?'active':''}" data-do="folderFilter" data-state=""><span>📁 All Containers</span>${chip(D.files.length)}</button>
    <button class="folder-btn ${filters.state==='WIP'?'active':''}" data-do="folderFilter" data-state="WIP"><span>01_WIP (Originator)</span>${chip(stateCounts.WIP,'wip')}</button>
    <button class="folder-btn ${filters.state==='SHARED'?'active':''}" data-do="folderFilter" data-state="SHARED"><span>02_SHARED</span>${chip(stateCounts.SHARED,'shared')}</button>
    <button class="folder-btn ${filters.state==='PUBLISHED'?'active':''}" data-do="folderFilter" data-state="PUBLISHED"><span>03_PUBLISHED</span>${chip(stateCounts.PUBLISHED,'published')}</button>
    <button class="folder-btn ${filters.state==='ARCHIVED'?'active':''}" data-do="folderFilter" data-state="ARCHIVED"><span>04_ARCHIVED</span>${chip(stateCounts.ARCHIVED,'archived')}</button>
    <h3 style="margin-top:14px">Spatial Zones</h3>
    ${D.zones.map(z=>`<button class="folder-btn ${filters.zone===z.id?'active':''}" data-do="zoneFolderFilter" data-zone="${z.id}"><span>${h(z.id)} · ${h(z.name.split('/')[0])}</span>${chip(D.files.filter(f=>f.zone===z.id).length)}</button>`).join('')}
   </aside>

   <div class="table-wrap"><table><thead><tr><th>Container / filename / title</th><th>Originator</th><th>Zone / level</th><th>Project stage</th><th>CDE / revision</th><th>Format</th><th>Intended use & Access</th></tr></thead><tbody>${fileRows(rows)||'<tr><td colspan="7" class="empty">ไม่พบรายการ ลองล้างตัวกรองหรือค้นหาคำอื่น</td></tr>'}</tbody></table></div>

   <aside class="file-side-inspector" aria-label="Selected File Inspector">
    ${selF?`<span class="eyebrow">SELECTED CONTAINER · ${h(selF.id)}</span>
    <h3 style="margin:5px 0;overflow-wrap:anywhere">${h(selF.name)}</h3>
    <p class="small">${h(selF.title)}</p>
    <div class="badge-row">
     ${chip('CDE: '+selF.state,selF.state.toLowerCase())}
     ${chip('Rev: '+E.revLabel(E.revision(state,selF)))}
     ${chip('Use: '+selF.purpose)}
     ${chip(allowed?'Access: อ่านได้':'Access: จำกัดสิทธิ์ ('+selF.confidentiality+')',allowed?'good':'block')}
    </div>
    <div class="path" style="margin:8px 0">${h(selF.path)}</div>
    <dl class="definition">
     <dt>Stable Key</dt><dd class="mono">${h(selF.containerId+'.'+selF.ext+'@'+E.revLabel(E.revision(state,selF)))}</dd>
     <dt>Originator</dt><dd>${h(selF.originator)} · ${h(company(selF.originator).name)}</dd>
     <dt>Zone / Stage</dt><dd>${h(selF.zone)} / ${h(selF.stage)}</dd>
    </dl>
    <h4 style="margin:12px 0 6px">เชื่อมไปยัง 3D Objects / Zone</h4>
    <p class="small">ความสัมพันธ์กับ package ที่บันทึกไว้ (${fObj.directAssets.length} ชิ้น): เป็นตัวอย่างการเชื่อมข้อมูล ยังไม่ยืนยัน applicability ของเอกสารต่ออุปกรณ์</p>
    <div class="button-row">${fObj.directAssets.map(a=>button(h(a.tag),'inspect3d',`data-id="${a.id}"`,'small')).join('')||'<span class="small">ไม่มีความสัมพันธ์ที่บันทึกไว้</span>'}</div>
    <p class="small">อุปกรณ์ในโซนเดียวกันด้านล่างเป็นบริบทพื้นที่ ต้องตรวจ AssetID และขอบเขตเอกสารก่อนใช้</p>
    <div class="button-row">
     ${button('Highlight โซน '+selF.zone+' ใน 3D','highlightZone3d',`data-id="${selF.zone}"`,'small primary')}
     ${fObj.zoneAssets.slice(0,4).map(a=>button('3D: '+a.tag,'inspect3d',`data-id="${a.id}"`,'small')).join('')}
    </div>
    <div class="button-row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">
     ${button('รายละเอียดเต็ม / Dependencies','file',`data-id="${selF.id}"`,'small')}
     ${button('ลองเปิด Revision ใหม่','revise',`data-id="${selF.id}"`,'small ghost')}
    </div>`:'<p class="empty">ไม่มีไฟล์ตรงตัวกรอง จึงไม่มีรายการที่เลือก</p>'}
   </aside>
  </div>
  <p class="small">ทะเบียนเป็นภาพกรณีศึกษาหลายช่วงเวลา: R01 ที่ Archived กับ R02 ที่เป็น WIP/Shared/Published มีชื่อ container เดิมได้เพราะ revision เป็น metadata การเห็นชื่อไฟล์ในบทเรียนไม่ได้ให้สิทธิ์อ่านเนื้อหาในระบบจริง</p>`;
 }

 function issueCard(q){const good=E.accepted(state,D,q),decision=q.options.find(o=>o.id===state.decisions[q.id]);return `<article class="issue" id="issue-${q.id}"><div class="issue-head"><div class="issue-meta">${chip(q.id)}${chip(q.severity,q.severity)}${chip(q.zone)}${good?chip('รับการแก้แล้ว','good'):chip('ยังไม่ผ่าน gate','block')}<span>${h(q.system)}</span>${button('ดูโซน '+q.zone+' ใน 3D','highlightZone3d',`data-id="${q.zone}"`,'small ghost')}</div><h3>${h(q.title)}</h3><p>${h(q.problem)}</p></div><div class="issue-body"><div class="issue-meta"><span>แก้: <strong>${q.fixBy}</strong></span><span>ตรวจ: <strong>${q.verifyBy}</strong></span><span>รับประเด็น: <strong>${q.gateBy}</strong></span></div><div class="impact"><strong>ถ้าปล่อยผ่าน:</strong> ${h(q.consequence)}</div><div class="question-label">1 / จะเลือกจัดการอย่างไร?</div><div class="choices" aria-label="ทางเลือกสำหรับ ${q.id}">${q.options.map((o,i)=>`<button class="choice ${o.id===decision?.id?'chosen '+(!o.correct?'bad-choice':''):''}" aria-pressed="${o.id===decision?.id}" data-do="choose" data-id="${q.id}" data-option="${o.id}"><span>${String.fromCharCode(65+i)}</span><span>${h(o.text)}</span></button>`).join('')}</div>${decision?`<div class="choice-result ${decision.correct?'':'bad'}">${h(decision.reason)}</div>`:''}
 <div class="question-label">2 / หลักฐานอะไร ใครต้องยืนยัน?</div><ul class="requirements">${q.requirements.map(r=>{const valid=E.evidenceValid(state,D,r),f=file(r.fileId),ev=state.evidence[r.id];return `<li class="requirement"><div class="requirement-top"><span class="requirement-title">${h(r.label)}</span>${chip(valid?'รับหลักฐาน revision นี้แล้ว':ev?'หลักฐานล้าสมัย':'ยังไม่รับหลักฐาน',valid?'good':'high')}</div><p>ผู้รับผิดชอบ: <strong>${r.provider} / ${h(company(r.provider).role)}</strong><br>${h(r.check)}</p>${fileLink(f.id)} <span class="small">${E.revLabel(E.revision(state,f))}</span><div class="req-actions">${button('สวมบทบาท '+r.provider,'actor',`data-id="${r.provider}"`,'small ghost')}${button('จำลองรับหลักฐานจาก '+r.provider,'evidence',`data-id="${q.id}" data-req="${r.id}"`,'small')}${button('ลองเปิด revision ใหม่','revise',`data-id="${f.id}"`,'small ghost')}</div></li>`;}).join('')}</ul><div class="question-label">3 / ใครมีอำนาจรับการแก้ประเด็นนี้?</div><div class="gate-box ${good?'accepted':''}"><strong>${q.gateBy} / ${h(company(q.gateBy).role)}</strong><p>${h(q.acceptanceScope)}</p>${button('สวมบทบาท '+q.gateBy,'actor',`data-id="${q.gateBy}"`,'small ghost')} ${button(good?'ตรวจและรับประเด็นอีกครั้ง':'ทดลองผ่าน gate','accept',`data-id="${q.id}"`,'primary')}</div>
 <details><summary>ป้องกัน / ตรวจพบ / ตอบสนอง ต้องทำอะไรจริง?</summary><ul><li><strong>ป้องกัน:</strong> ${h(q.conduct.prevent)}</li><li><strong>ตรวจพบ:</strong> ${h(q.conduct.detect)}</li><li><strong>ตอบสนอง:</strong> ${h(q.conduct.respond)}</li></ul><p>ปุ่มรับหลักฐานใช้ข้อมูลและผลตรวจสมมติ ไม่ได้อ่านไฟล์เพื่อพิสูจน์ว่าข้อเท็จจริงหน้างานถูกต้อง ผู้รับผิดชอบจริงต้องตรวจเนื้อหาและ scope ตาม appointment</p></details><details><summary>ไฟล์ที่เกี่ยวข้องกับประเด็นนี้</summary><ul class="file-mini-list">${q.relatedFiles.map(id=>`<li>${fileLink(id)}<small>${h(file(id).title)}</small></li>`).join('')}</ul></details></div></article>`;}

 function lifecycle(){const s=stage(selectedStage),p=E.stageStatus(state,D,s.id);return `${heading('LIFECYCLE / DECISIONS & CONTROL POINTS','เห็นปัญหาตลอดชีวิตโครงการ','เลือกช่วงงาน ลองทางเลือก แล้วรับหลักฐานด้วยบทบาทที่ถูกต้องก่อนผ่าน gate เปิด revision ใหม่เพื่อดูว่าผลเดิมยังเชื่อถือได้หรือไม่')}
 <div class="life-layout"><nav class="stage-list" aria-label="เลือกช่วงงาน">${D.stages.map((x,i)=>{const n=E.stageStatus(state,D,x.id);return `<button data-do="stage" data-id="${x.id}" class="${x.id===s.id?'active':''}" aria-pressed="${x.id===s.id}"><strong><span class="stage-id">${String(i+1).padStart(2,'0')} ${x.id}</span>${h(x.name)}</strong><small>${n.accepted}/${n.total} ผ่าน gate · ${n.criticalOpen} critical เปิด</small></button>`;}).join('')}</nav><div><div class="stage-banner"><span class="eyebrow">${h(s.phase)} / ${s.id}</span><h2>${h(s.name)}</h2><strong>${h(s.thai)}</strong><p>${h(s.focus)}</p><div class="gate"><strong>Stage acceptance intent:</strong> ${h(s.gate)}<br><strong>Intended use:</strong> ${h(s.purpose)} · <strong>Stage lead:</strong> ${h(s.gateBy)}</div></div><div class="progress-track" aria-hidden="true"><span style="width:${p.accepted/p.total*100}%"></span></div><p class="small">${p.accepted}/${p.total} ประเด็นตัวอย่างผ่าน gate · ${p.criticalOpen} critical ยังเปิด · การผ่านประเด็นตัวอย่างไม่ใช่การอนุมัติ stage จริงทั้งโครงการ</p><div class="grid two"><div class="panel"><h3>ต้องรู้อะไรก่อนเริ่ม?</h3><ul class="stage-inputs">${s.inputs.map(x=>`<li>${h(x)}</li>`).join('')}</ul></div><div class="panel"><h3>ตัวอย่างชุดข้อมูลที่ส่งต่อ</h3><ul class="file-mini-list">${s.fileIds.map(id=>file(id)).filter(f=>!f.evidenceFor&&f.state!=='ARCHIVED').slice(0,4).map(f=>`<li>${fileLink(f.id)}<small>${h(f.title)} · ${chip(f.state,f.state.toLowerCase())}</small></li>`).join('')}</ul><div class="button-row" style="margin-top:12px">${button('ดูไฟล์ช่วงนี้ทั้งหมด','stageFiles',`data-id="${s.id}"`,'small')}</div></div></div>${D.issues.filter(q=>q.stage===s.id).map(issueCard).join('')}</div></div>`;}

 function assetsView(){const problems=E.assetProblems(state,D),rows=E.assetRows(state,D),a=rows.find(x=>x.id===selectedAsset)||rows[0],r=a.submitted,sample=D.twin.cases.find(x=>x.id===twinCase),trust=E.twinCheck(D,sample);return `${heading('PIM → VERIFIED RECORD → AIM → TRUSTED USE','ส่งมอบสิ่งที่ใช้เดินระบบได้','24 asset examples เชื่อม verified identity, model GUID, manuals, test records และ operational data แก้ข้อบกพร่องจริงในทะเบียน แล้วลองข้อมูล Twin ที่หลอกตาได้')}
 <div class="subnav">${button('Asset / Handover validation','assetTab','data-value="register"','small '+(assetTab==='register'?'active':''))}${button('Digital Twin / Data trust','assetTab','data-value="twin"','small '+(assetTab==='twin'?'active':''))}</div>
 ${assetTab==='register'?`<div class="handover-strip"><strong>${problems.length?problems.length+' ข้อบกพร่องใน submitted asset data':'ข้อมูลผ่านกติกาตรวจในตัวอย่างนี้แล้ว'}</strong><p>มี serial ว่าง, warranty start ว่าง, AssetID ซ้ำ/ไม่ตรง verified reference และ manual reference ว่าง ถูกใส่ไว้เพื่อทดลองแก้ การผ่าน validator ไม่แทน Operator acceptance หรือการตรวจข้อมูลทุกประเภทตาม AIR</p></div><div class="asset-layout"><div class="panel"><h3>เลือกอุปกรณ์แล้วตรวจความสัมพันธ์</h3><label class="small" for="asset-select">Asset identity</label><select id="asset-select" class="asset-option">${rows.map(x=>`<option value="${x.id}" ${x.id===a.id?'selected':''}>${x.tag} / ${x.type} / ${x.zone}${problems.some(p=>p.id===x.id)?' — ต้องแก้':''}</option>`).join('')}</select><h3 style="margin-top:20px">${h(a.tag)}</h3><dl class="definition"><dt>Supplier</dt><dd>${h(a.supplier+' / '+company(a.supplier).name)}</dd><dt>System / parent</dt><dd>${h(a.system)}</dd><dt>Location</dt><dd>${h(a.location)}</dd><dt>IFC GUID ตัวอย่าง</dt><dd class="mono">${h(a.ifcGuid)}</dd><dt>Proxy exchange</dt><dd>${fileLink(D.samples.ifc)}<span class="small"> GUID ตัวอย่างผูกกับไฟล์ proxy นี้ ไม่ใช่การยืนยัน GUID ใน native model</span></dd><dt>Model example</dt><dd>${fileLink(a.modelFile)}</dd><dt>Test example</dt><dd>${fileLink(a.testFile)}</dd><dt>Manual reference</dt><dd>${a.canonical.manual?fileLink(a.canonical.manual):'ยังไม่มี'}</dd></dl><div class="button-row" style="margin-top:12px">${button('ส่องวัตถุนี้ใน 3D Model','inspect3d',`data-id="${a.id}"`,'small primary')}</div><details style="margin-top:16px"><summary>Verified receiving / nameplate reference (สมมติ)</summary><dl class="definition">${Object.entries(a.canonical).map(([k,v])=>`<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join('')}</dl><p>${h(a.sourceNote)}</p></details><div class="callout">ตัวอย่างมีเพียง 24 asset rows ไม่ใช่ inventory ครบทั้ง Data Center และไม่ใช่ COBie workbook ที่ผ่าน certification</div></div><div class="panel"><h3>Submitted data — ข้อมูลที่จะรับเข้า FM</h3><p class="small">แก้ได้ด้วย GCC หรือ OPS ในเคสนี้ ค่าที่แก้ถูกบันทึกในเครื่องและทำให้ต้องพิจารณา HOV-02 ใหม่</p><div class="asset-editor">${Object.keys(a.canonical).map(field=>`<div><label for="asset-${field}">${h(field)}</label><input id="asset-${field}" data-asset-field="${field}" value="${h(r[field])}" maxlength="160"></div>`).join('')}</div><div class="button-row" style="margin-top:16px">${button('Reconcile กับ verified reference','assetRepair',`data-id="${a.id}"`,'primary')}</div><ul class="asset-errors">${problems.filter(p=>p.id===a.id).map(p=>`<li>${h(p.message)}</li>`).join('')||'<li style="color:#356443">รายการนี้ผ่านกติกาตรวจข้อมูลตัวอย่าง</li>'}</ul><div class="button-row">${button('กลับไปรับ Handover gate','stage','data-id="HOV"','small')}${button('Export asset exchange JSON','exportAssets','','small')}</div></div></div><div class="section-head"><h2>Digital thread ของ ${h(a.tag)}</h2><span class="small">ตัวอย่างข้อมูลที่ต้องติดตาม ไม่ใช่หลักฐานยืนยัน applicability อัตโนมัติ</span></div><div class="panel"><ul class="file-mini-list">${a.thread.map(t=>`<li>${chip(t.stage)} ${fileLink(t.fileId)}<small>${h(file(t.fileId).title)} · ผู้จัดทำ ${h(file(t.fileId).originator)} · ${E.revLabel(E.revision(state,file(t.fileId)))}</small></li>`).join('')}</ul></div><div class="section-head"><h2>ภาพรวมทะเบียนทรัพย์สิน</h2><span class="small">คลิก AssetID เพื่อดูรายละเอียด</span></div><div class="table-wrap"><table><thead><tr><th>AssetID / type</th><th>Submitted AssetID</th><th>Zone / system</th><th>Serial</th><th>Warranty start</th><th>Validation</th></tr></thead><tbody>${rows.map(x=>`<tr><td><button class="file-link" data-do="asset" data-id="${x.id}">${h(x.tag)}</button><span class="file-title">${h(x.type)}</span></td><td>${h(x.submitted.tag)}</td><td>${h(x.zone)} / ${h(x.system)}</td><td>${h(x.submitted.serial||'— missing —')}</td><td>${h(x.submitted.warrantyStart||'— missing —')}</td><td>${chip(problems.some(p=>p.id===x.id)?'ต้องแก้':'ผ่านกติกาตัวอย่าง',problems.some(p=>p.id===x.id)?'high':'good')}</td></tr>`).join('')}</tbody></table></div>`:
 `<div class="asset-layout"><div class="panel"><span class="eyebrow">SYNTHETIC / READ-ONLY / NO OT CONNECTION</span><h2 style="margin-top:10px">UPS-A-01 · EPMS power</h2><p>ตัวเลขสมมติ ไม่ใช่กำลังไฟที่ออกแบบหรือค่าจริงของสถานที่ใด ไม่มี endpoint, credentials หรือคำสั่งควบคุมอุปกรณ์</p><div class="twin-value ${trust.trusted?'':'untrusted'}">${trust.trusted?sample.value:'UNKNOWN'} <small>${trust.trusted?h(sample.unit):'/ ไม่ใช้ตัดสินใจ'}</small></div>${chip(trust.trusted?'ข้อมูลผ่าน data contract ตัวอย่าง':'หยุด: ข้อมูลยังเชื่อถือไม่ได้',trust.trusted?'good':'block')}<p class="small">Raw value = ${sample.value} ${h(sample.unit)} · Source = ${h(sample.sourceAsset)} · Age = ${sample.ageSeconds}s · Quality = ${h(sample.quality)}</p><div class="callout ${trust.trusted?'green':'red'}">${trust.trusted?'Identity, unit, quality และ freshness ผ่านเฉพาะกติกาตัวอย่างนี้ ไม่ได้ยืนยันความปกติของระบบทางวิศวกรรม':trust.reasons.map(h).join(' • ')}</div><dl class="definition"><dt>Canonical asset</dt><dd>UPS-A-01</dd><dt>IFC GUID</dt><dd class="mono">${h(D.assets[0].ifcGuid)}</dd><dt>Source point</dt><dd>EPMS.UPS_A_01.ActivePower</dd><dt>CMMS key</dt><dd>DC01/AS001</dd><dt>Record model ในทะเบียน</dt><dd>${fileLink(D.assets[0].modelFile)}</dd><dt>IFC proxy mapping</dt><dd>${fileLink(D.samples.ifc)}</dd></dl></div><div class="panel"><h3>ลองข้อมูลที่ทำให้ตัดสินใจผิด</h3><div class="twin-controls">${D.twin.cases.map(c=>button(h(c.name),'twinCase',`data-id="${c.id}" aria-pressed="${c.id===twinCase}"`,c.id===twinCase?'active':'')).join('')}</div><div class="twin-contract" style="margin-top:18px"><strong>Data contract ของเคสนี้</strong><p class="small">AssetID ต้องตรง source · unit = kW · quality = GOOD · age ≤ ${D.twin.freshnessSeconds} วินาที<br>As-of เวลาอ้างอิงจำลอง: ${h(D.twin.asOf)} เกณฑ์ freshness เป็นสมมติฐานที่เลือกเพื่อสอน ไม่ใช่มาตรฐานสากล</p></div><p>โมเดล 3D ที่สวยอาจแสดงข้อมูลผิดอุปกรณ์หรือค่าค้าง การยอมรับ Digital Twin ต้องระบุ use case, data owner, mapping, update responsibility และสิ่งที่ยังไม่รู้</p><div class="button-row">${button('ไปประเด็น Digital Twin','stage','data-id="DTW"','small primary')}${fileLink(D.samples.mapping)}${fileLink(D.samples.telemetry)}</div></div></div>`}`;}

 function accessView(){
  const f=file(accessFileId),scope=E.readAccess(state,D,f,actor),rows=E.accessRows(state,D).slice().reverse();
  const labels={PENDING:'รอพิจารณา',ACTIVE:'ใช้งานได้',DENIED:'ปฏิเสธ',REVOKED:'เพิกถอน',STALE:'คนละ baseline',EXPIRED:'หมดอายุ',EXPIRED_REQUEST:'คำขอเกิน 7 วัน',NOT_YET_ACTIVE:'ยังไม่ถึงเวลา'};
  const uses={coordination:'ตรวจประสานงาน',procurement:'จัดซื้อ / ตรวจ interface',operation:'เตรียมเดินระบบ / บำรุงรักษา',review:'ทบทวนข้อมูลเฉพาะเรื่อง'};
  const time=v=>v?h(new Date(v).toLocaleString('th-TH',{timeZone:'Asia/Bangkok',dateStyle:'medium',timeStyle:'short'})):'—';
  return `${heading('M2 / ACCESS GOVERNANCE','ขอสิทธิ์เพื่อทำงาน โดยคงขอบเขตความรับผิดชอบ','เลือกไฟล์และส่งเหตุผล ตรวจสิทธิ์ปัจจุบัน แล้วติดตามผลพิจารณาแยกตามคำขอ')}
  <div class="access-workspace">
  <div class="access-scope-note"><span class="chip">READ ACCESS เท่านั้น</span><p>สิทธิ์อ่านผูกกับบริษัท ไฟล์ และ revision · ไม่ให้สิทธิ์แก้แบบหรือผ่าน gate · บทเรียนจำลอง ไม่มีการยืนยันตัวตนจริง</p></div>
  <div class="access-layout"><section class="panel access-compose">
   <div class="access-panel-heading"><span class="eyebrow">01 / REQUEST</span><h2>ส่งคำขออ่านข้อมูล</h2><p>ระบุไฟล์และงานที่จำเป็นต้องใช้ข้อมูล</p></div>
   <div class="access-field"><label for="access-file">ไฟล์ / ฉบับปัจจุบัน</label><select id="access-file" aria-describedby="access-selected-file">${D.files.map(x=>`<option value="${x.id}" ${x.id===f.id?'selected':''}>${h(x.id+' · '+x.name+' · '+E.revLabel(E.revision(state,x)))}</option>`).join('')}</select></div>
   <div id="access-selected-file" class="access-file-preview"><span class="eyebrow">SELECTED FILE · ${h(f.id)}</span><strong>${h(f.name)}</strong><span>${h(f.title)}</span><div class="badge-row">${chip(E.revLabel(E.revision(state,f)))}${chip(f.state)}${chip(f.confidentiality)}</div></div>
   <div class="access-parties"><div><small>ผู้ขอ / บทบาทปัจจุบัน</small><strong>${h(actor)}</strong><span>${h(company(actor).name)}</span></div><div><small>ผู้พิจารณาตาม policy</small><strong>${h(E.accessApprover(D,f))}</strong><span>${h(company(E.accessApprover(D,f)).name)}</span></div></div>
   <div class="access-fields-row"><div class="access-field"><label for="access-use">วัตถุประสงค์ที่จะใช้</label><select id="access-use">${Object.entries(uses).map(([v,l])=>`<option value="${v}" ${accessDraft.use===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="access-field"><label for="access-hours">ระยะเวลาหลังอนุมัติ</label><div class="access-duration"><input id="access-hours" type="number" min="1" max="168" step="1" value="${h(accessDraft.hours)}" aria-describedby="access-hours-help"><span>ชั่วโมง</span></div><small id="access-hours-help">เลือกได้ 1–168 ชั่วโมง</small></div></div>
   <div class="access-field"><label for="access-reason">จำเป็นต้องอ่านเพื่อทำงานอะไร</label><textarea id="access-reason" maxlength="500" rows="4" aria-describedby="access-reason-help" placeholder="เช่น ตรวจ connector ของ UPS-A-01 เทียบกับ shop ก่อนสั่งซื้อ">${h(accessDraft.reason)}</textarea><small id="access-reason-help">เหตุผล 5–500 ตัวอักษร เพื่อให้ผู้พิจารณาเข้าใจขอบเขตงาน</small></div>
   <div class="access-form-footer"><div class="button-row">${button('ส่งคำขอ read access','accessRequest','','primary')}${button('ดู metadata ไฟล์','file',`data-id="${f.id}"`,'small')}</div><p class="small">${scope.allowed?'บทบาทนี้อ่านได้แล้ว ไม่ต้องขอสิทธิ์ซ้ำ':'ส่งคำขอแล้วต้องรอผู้พิจารณา ยังไม่เปิดสิทธิ์ทันที'}</p></div>
  </section>
  <aside class="panel access-current"><div class="access-panel-heading"><span class="eyebrow">02 / CURRENT ACCESS</span><h2>สิทธิ์ปัจจุบันของ ${h(actor)}</h2></div>
   <div class="access-read-status ${scope.allowed?'is-allowed':'is-restricted'}">${chip(scope.allowed?'อ่านได้แล้ว':'ยังไม่มี read scope',scope.allowed?'good':'block')}<p>${h(scope.basis)}</p></div>
   <dl class="access-definition"><dt>ไฟล์ / revision</dt><dd>${fileLink(f.id)}<span class="access-meta-line">${E.revLabel(E.revision(state,f))}</span></dd><dt>สถานะข้อมูล</dt><dd>${h(f.state)}<span class="access-meta-line">${h(f.confidentiality)}</span></dd><dt>Grant ที่ใช้</dt><dd>${h(scope.requestId||'—')}${scope.expiresAt?'<span class="access-meta-line">หมดอายุ '+time(scope.expiresAt)+' (เวลาไทย)</span><span class="access-meta-line">Use: '+h(uses[scope.use]||scope.use)+'</span>':''}</dd></dl>
   <div class="access-refresh"><small>ตรวจ ณ ${time(new Date().toISOString())} · เวลาไทย</small>${button('ตรวจสถานะล่าสุด','refreshAccess','','small')}</div>
   <details class="access-walkthrough"><summary>ลองให้เห็นผลจริง · 4 ขั้นตอน</summary><ol><li>ส่งคำขอเมื่อยังอ่านไม่ได้ แล้วทดลองเปิดไฟล์: ยังถูกจำกัด</li><li>สวมบทบาทผู้พิจารณา ตรวจเหตุผล และอนุญาตหรือปฏิเสธ</li><li>กลับเป็นผู้ขอ เปิดไฟล์ในทะเบียนหรือ 3D Inspector</li><li>originator เปิด revision ใหม่หรือเพิกถอน แล้วตรวจว่าผู้ขออ่านฉบับนั้นไม่ได้</li></ol></details>
   <p class="small access-policy-hint">การเพิกถอน grant เพิ่มเติมไม่ลบสิทธิ์ recipient/originator เดิม เวลาหมดอายุอิงนาฬิกาเครื่อง ไม่ใช่ trusted server time</p>
  </aside></div>
  <details class="access-policy"><summary>ขอบเขตและกติกาการพิจารณาสิทธิ์</summary><p>นโยบายสมมติ: originator ของไฟล์เป็นผู้พิจารณา read access รวม WIP/Commercial/Security ผู้ดูแลระบบ IMT ไม่มีสิทธิ์อนุมัติแทนโดยอัตโนมัติ Grant ใช้กับบริษัทผู้ขอ ไฟล์เดียว revision เดียว และวัตถุประสงค์ที่ระบุ ไม่ให้สิทธิ์เขียน อนุมัติแบบ หรือผ่าน gate เปลี่ยน revision แล้วต้องขอใหม่ ทั้งหมดเป็น simulation ที่เปลี่ยนบทบาทได้ ไม่ใช่ระบบรักษาความลับจริง</p></details>
  <div class="section-head access-list-heading"><div><span class="eyebrow">03 / REQUEST HISTORY</span><h2>คำขอและผลพิจารณา (${rows.length})</h2></div>${button('Export session + ประวัติคำขอ','exportSession','','small')}</div>
  <div class="access-requests">${rows.map(r=>{const rf=file(r.fileId),reviewer=E.accessApprover(D,rf),canReview=actor===reviewer&&actor!==r.requester,review=accessReviews[r.id]||{reason:'',hours:r.hours},actionable=['PENDING','ACTIVE'].includes(r.effectiveStatus);return `<article class="panel access-request">
   <header class="access-request-heading"><div><span class="eyebrow">${h(r.id)}</span><h3>${h(r.requester)} <span aria-label="ส่งให้">→</span> ${h(reviewer)}</h3></div>${chip(labels[r.effectiveStatus]||r.effectiveStatus,r.effectiveStatus==='ACTIVE'?'good':r.effectiveStatus==='PENDING'?'high':'block')}</header>
   <div class="access-request-body"><div class="access-request-summary"><div class="access-request-file">${fileLink(r.fileId)}<span class="access-meta-line">${E.revLabel(r.revision)} · ${h(r.fileState)} · ${h(r.confidentiality)}</span></div>
    <p class="access-purpose"><strong>${h(uses[r.use]||r.use)}</strong><span>${h(r.reason)}</span></p>
    <dl class="access-request-dates"><div><dt>ระยะเวลาที่ขอ</dt><dd>${r.hours} ชั่วโมง</dd></div><div><dt>ส่งคำขอ</dt><dd>${time(r.requestedAt)}</dd></div><div><dt>พิจารณาภายใน</dt><dd>${time(r.reviewBy)}</dd></div>${r.expiresAt?`<div><dt>อนุญาต / หมดอายุ</dt><dd>${r.grantedHours} ชั่วโมง<span class="access-meta-line">${time(r.expiresAt)}</span></dd></div>`:''}</dl><p class="access-time-note">วันและเวลาแสดงเป็นเวลาไทย</p>
    ${r.reviewReason?`<div class="access-review-record"><small>ผลพิจารณาโดย ${h(r.reviewedBy)}</small><p>${h(r.reviewReason)}</p></div>`:''}${r.revocationReason?`<div class="access-review-record"><small>${h(r.revokedBy)} เพิกถอน</small><p>${h(r.revocationReason)}</p></div>`:''}</div>
   <div class="access-review-pane"><h4>${canReview&&actionable?'ดำเนินการกับคำขอนี้':actionable?'ทดลองสลับบทบาท':'ผลพิจารณาที่บันทึกไว้'}</h4>
   ${canReview&&actionable?`<div class="access-field"><label for="review-${r.id}">เหตุผลพิจารณา / เพิกถอน</label><textarea id="review-${r.id}" data-review="${r.id}" maxlength="500" rows="3">${h(review.reason)}</textarea></div>${r.effectiveStatus==='PENDING'?`<div class="access-field"><label for="hours-${r.id}">จำนวนชั่วโมงที่จะอนุญาต</label><div class="access-duration"><input id="hours-${r.id}" data-review-hours="${r.id}" type="number" min="1" max="${r.hours}" value="${h(review.hours)}"><span>ชั่วโมง</span></div><small>ไม่เกินระยะเวลาที่ขอ ${r.hours} ชั่วโมง</small></div><div class="access-review-actions">${button('อนุญาตเฉพาะขอบเขตนี้','accessApprove',`data-id="${r.id}"`,'small primary')}${button('ปฏิเสธพร้อมเหตุผล','accessDeny',`data-id="${r.id}"`,'small')}</div>`:`<div class="access-review-actions">${button('เพิกถอน grant','accessRevoke',`data-id="${r.id}"`,'small')}</div>`}`:actionable?`<p class="small">ผู้พิจารณาคือ ${h(reviewer)} · ผู้ขอคือ ${h(r.requester)}</p><div class="access-review-actions">${button('สวมบทบาทผู้พิจารณา '+reviewer,'actor',`data-id="${reviewer}"`,'small')}${button('สวมบทบาทผู้ขอ '+r.requester,'actor',`data-id="${r.requester}"`,'small')}</div>`:`<p class="small">${h(labels[r.effectiveStatus]||r.effectiveStatus)} · เก็บประวัติคำขอและเหตุผลไว้เพื่อติดตามขอบเขตเดิม</p>`}</div></div></article>`;}).join('')||'<div class="access-empty"><span class="eyebrow">ยังไม่มีคำขอ</span><h3>เริ่มจากไฟล์ที่บทบาทนี้ยังอ่านไม่ได้</h3><p>เลือกไฟล์ด้านบน ระบุงานที่ต้องใช้ แล้วส่งคำขอเพื่อทดลองขั้นตอนพิจารณา</p></div>'}</div></div>`;
 }
 function dashboard(){
  const m=E.dashboardMetrics(state,D);let roi=null,scenarioError='';try{roi=E.roiScenario(m,roiInputs);}catch(_){scenarioError='กรอกสมมติฐานให้ครบและอยู่ในขอบเขตที่กำหนด จึงคำนวณ scenario ได้';}
  const pct=(n,d)=>d?Math.round(n/d*100):0;
  const meter=(title,n,d,detail)=>`<article class="panel metric-card"><h3>${h(title)}</h3><strong class="metric-value">${n}<small> / ${d}</small></strong><div class="metric-meter" role="meter" aria-label="${h(title)}" aria-valuemin="0" aria-valuemax="${d||1}" aria-valuenow="${n}" aria-valuetext="${n} จาก ${d}"><span style="width:${pct(n,d)}%"></span></div><p class="small">${h(detail)}</p></article>`;
  const fmt=n=>n===null?'ยังคำนวณไม่ได้':Number(n).toLocaleString('th-TH',{maximumFractionDigits:1});
  return `${heading('M3 / INFORMATION → DECISION → IMPACT','BIM & Data สร้างผลเมื่อข้อมูลใช้ตัดสินใจได้','Dashboard คำนวณจาก session นี้: หลักฐานที่ยังใช้ได้ ประเด็นที่ผ่าน gate ผลกระทบของ revision และความพร้อมของข้อมูลส่งมอบ ไม่วัดความสำเร็จด้วยจำนวนไฟล์หรือกล่องโมเดลอย่างเดียว')}
  <div class="callout">ตัวเลขด้านบนเป็นผลจากการทดลองในกรณีสมมติ ไม่ใช่ผลไซต์งานจริง Severity index ไม่ใช่โอกาสเกิดเหตุหรือ expected loss ส่วนเงินและเวลาของ ROI ด้านล่างเป็น scenario จากสมมติฐานที่แก้ได้ ยังไม่มีหลักฐานว่าประหยัดจริง</div>
  <div class="metrics-grid">${meter('ประเด็นผ่าน gate ปัจจุบัน',m.issues.accepted,m.issues.total,'นับ issue ไม่ซ้ำ; source/evidence เปลี่ยนอาจทำให้ผลที่เคยผ่านล้าสมัย')}${meter('หลักฐานที่ยังใช้ได้',m.evidence.valid,m.evidence.total,'ล้าสมัย '+m.evidence.stale+' รายการ; ไม่ใช่แค่นับว่ารับไฟล์แล้ว')}${meter('Asset data ผ่านกติกา',m.assets.usable,m.assets.total,'พบ '+m.assets.findings+' field findings ใน '+m.assets.defective.length+' assets; ไม่แทนการยอมรับโดย Operator')}${meter('Twin scenarios ที่เชื่อถือได้',m.twin.trusted,m.twin.total,'ผลตรวจชุดข้อมูลสังเคราะห์คงที่ ไม่ใช่ availability ของระบบ live')}</div>
  <div class="grid two"><section class="panel"><h2>Risk assessment แบบเปิดที่มา</h2><p class="metric-value">${m.risk.openIndex}<small> / ${m.risk.baselineIndex} severity points ยังเปิด</small></p><p>Critical ที่ยังไม่ผ่าน gate: <strong>${m.issues.criticalOpen}</strong> / ${D.issues.filter(q=>q.severity==='critical').length} ประเด็น</p><p class="small">สูตร: Σ น้ำหนัก severity ของ issue ที่ยังไม่ accepted ปัจจุบัน · critical = 5, high = 3, medium/low = 1 น้ำหนักสมมติเพื่อจัดลำดับทบทวน ไม่ใช่ค่ามาตรฐานหรือ probability index ลดลงเมื่อ gate ผ่าน แต่ยังไม่พิสูจน์ว่าความเสี่ยงทางวิศวกรรมหายไป</p>
  <div class="button-row">${button('เปิด Issues & Gates','view','data-target="lifecycle"','small')}${button('ตรวจหลักฐานการตัดสินใจ','view','data-target="journal"','small')}</div></section>
  <section class="panel"><h2>Revision ripple effect</h2><p class="metric-value">${m.revisions.affected.length}<small> / ${m.revisions.total} files ต้องทบทวน baseline</small></p><p>source เปลี่ยน ${m.revisions.changed.length} ไฟล์ → รวม downstream ${m.revisions.affected.length} ไฟล์ นับ file ID ไม่ซ้ำ ไม่รวมเป็นมูลค่าความเสียหาย</p><details><summary>เปิดรายชื่อและย้อนหลักฐาน</summary><ul class="file-mini-list">${m.revisions.affected.map(id=>`<li>${fileLink(id)} · ${E.revLabel(E.revision(state,file(id)))}</li>`).join('')||'<li>ยังไม่มี revision เปลี่ยนจาก baseline ใน session นี้</li>'}</ul></details></section></div>
  <section class="panel"><h2>Control gates ทั้ง 14 ช่วงงาน</h2><div class="table-wrap"><table><thead><tr><th>Stage</th><th>ผ่าน / ทั้งหมด</th><th>Critical เปิด</th><th>ตรวจหลักฐาน</th></tr></thead><tbody>${D.stages.map(s=>{const p=E.stageStatus(state,D,s.id);return `<tr><td>${h(s.id+' · '+s.name)}</td><td>${p.accepted} / ${p.total}</td><td>${p.criticalOpen}</td><td>${button('เปิด '+s.id,'stage',`data-id="${s.id}"`,'small')}</td></tr>`;}).join('')}</tbody></table></div></section>
  <section class="panel"><h2>Access governance และพฤติกรรมการใช้ข้อมูล</h2><div class="impact-strip"><p>Pending <strong>${m.access.pending}</strong></p><p>Active <strong>${m.access.active}</strong></p><p>Expired <strong>${m.access.expired}</strong></p><p>Stale <strong>${m.access.stale}</strong></p><p>Denied <strong>${m.access.denied}</strong></p><p>Revoked <strong>${m.access.revoked}</strong></p></div><p class="small">คำขอทั้งหมด ${m.access.total} · การกระทำที่ระบบหยุด ${m.actions.stopped} / ${m.actions.total} ครั้ง การหยุดเป็นผลตามกติกาของแบบจำลอง ไม่ใช่ security incidents และไม่ตีความว่าคำขอถูกปฏิเสธมากยิ่งดี</p>${button('ตรวจคำขอและขอบเขตสิทธิ์','view','data-target="access"','small')}</section>
  <section class="panel"><h2>การซ่อมบำรุงและสิทธิ์เข้าทำงาน</h2>${M?.summary()||'เปิดหน้า Work control เพื่อเริ่มทดลอง'}${viewButton("ลองเคสอุปกรณ์เสีย / PM","maintenance","small")}</section>
  <section class="panel roi-panel"><span class="eyebrow">HYPOTHETICAL SCENARIO · THB · ไม่ใช่ผลประหยัดจริง</span><h2>ข้อมูลที่ควบคุมได้ อาจคุ้มค่าอย่างไร</h2><p>ใช้ ${m.issues.accepted} issue ที่ accepted ปัจจุบันเป็นจำนวนกรณีสมมติ ไม่บวกการกด accept ซ้ำ ไม่รวม revision impact หรือ risk points เป็นเงินอีกชั้น และไม่ถือว่าทุก issue ป้องกัน rework ได้จริง</p>
  <p class="small">คำนวณใหม่เมื่อยืนยันค่าหรือออกจากช่อง เพื่อให้พิมพ์ทศนิยมและแก้ตัวเลขได้ต่อเนื่อง</p><div class="scenario-controls">${[['hoursPerCase','ชั่วโมง rework ที่สมมติว่าหลีกเลี่ยงได้ต่อกรณี',1000],['hourlyRate','ต้นทุนแรงงานสมมติ THB/ชั่วโมง',100000],['investment','ต้นทุนจัดการข้อมูลสมมติ THB',100000000],['realization','สัดส่วนที่สมมติว่าเกิดผลจริง (%)',100]].map(([k,l,max])=>`<div><label for="roi-${k}">${l}</label><input id="roi-${k}" data-scenario="${k}" type="number" min="0" max="${max}" step="any" value="${h(roiInputs[k])}"></div>`).join('')}</div>
  ${roi?`<div class="impact-strip"><p>ชั่วโมงที่อาจหลีกเลี่ยง <strong>${fmt(roi.hours)}</strong></p><p>Benefit สมมติ THB <strong>${fmt(roi.benefit)}</strong></p><p>Net สมมติ THB <strong>${fmt(roi.net)}</strong></p><p>ROI สมมติ <strong>${roi.roiPercent===null?'N/A (ต้นทุน = 0)':fmt(roi.roiPercent)+'%'}</strong></p><p>Break-even กรณีสมมติ <strong>${fmt(roi.breakEvenCases)}</strong></p></div>
  <p class="small">สูตร: hours = unique accepted issues × hours/case × realization%; benefit = hours × THB/hour; net = benefit − investment; ROI = net / investment × 100 เฉพาะ investment &gt; 0</p>
  <div class="table-wrap"><table><caption>Sensitivity ต่อ realization โดยคงสมมติฐานอื่นเดิม</caption><thead><tr><th>Realization</th><th>Benefit สมมติ THB</th><th>Net สมมติ THB</th></tr></thead><tbody>${[0,25,50,75,100].map(realization=>{const r=E.roiScenario(m,{...roiInputs,realization});return `<tr><td>${realization}%</td><td>${fmt(r.benefit)}</td><td>${fmt(r.net)}</td></tr>`;}).join('')}</tbody></table></div>`:`<p class="callout red" role="status">${h(scenarioError)}</p>`}
  <p class="small">การพิสูจน์ ROI จริงต้องมี baseline, comparator, measured hours/cost, attribution และช่วงเวลาที่เทียบกันได้ ข้อมูลเหล่านี้ยังไม่มีในกรณีนี้ ไม่คำนวณ payback period จากจำนวน issue ซึ่งไม่ใช่อัตราผลประหยัดต่อเวลา</p>
  <div class="button-row">${button('Export metrics + สมมติฐาน + สูตร','exportImpact','','primary')}${button('เปิดบันทึก session','view','data-target="journal"','small')}</div></section>`;
 }

 function journal(){return `${priorSession()?`<div class="callout">มี session เดิมที่อ้าง model baseline ก่อนหน้า สำรองไว้โดยไม่ replay ข้ามข้อมูล ${button('ดาวน์โหลด session เดิมที่สำรอง','exportPriorSession','','small')}</div>`:''}${heading('DECISION RECORD / TEAM DISCUSSION','รู้ว่าใครตัดสินใจ และยังค้างอะไร','บันทึกทั้งการเลือกทางเสี่ยง การรับหลักฐาน การเปิด revision และการยอมรับประเด็น ข้อมูลนี้แก้หรือล้างได้ จึงไม่ใช่ audit trail ที่ใช้รับรองงานจริง')}
 <div class="stats"><div class="stat"><strong>${state.events.length}</strong><small>การกระทำที่บันทึก</small></div><div class="stat"><strong>${countAccepted()}/${D.issues.length}</strong><small>ประเด็นผ่าน gate ตัวอย่าง</small></div><div class="stat"><strong>${state.events.filter(e=>!e.ok).length}</strong><small>ทางเลือก / การกระทำที่ถูกหยุด</small></div><div class="stat"><strong>${E.assetProblems(state,D).length}</strong><small>ข้อบกพร่อง asset data</small></div></div>
 <div class="grid two"><div class="panel"><h3>บันทึกเพื่อกลับไปคุยกับทีม</h3><label class="small" for="dc-notes">ใครต้องป้องกัน ตรวจพบ และตอบสนอง? ช่องทางไหนยังข้ามได้? เราจะพิสูจน์ว่าคนใช้ฉบับถูกอย่างไร?</label><textarea id="dc-notes" class="notes" maxlength="8000" placeholder="ระบุประเด็นจริงโดยไม่ใส่ข้อมูลลับ ชื่อผู้รับผิดชอบ จุดหยุดงาน หลักฐาน และวิธีตรวจผล…">${h(notes)}</textarea><p class="small">${h(storageMessage||'บันทึกเฉพาะเบราว์เซอร์นี้ ไม่ส่งข้อมูลออก ไม่มี analytics')}</p><div class="button-row">${button('Export ผลทดลอง JSON','exportSession','','primary')}${button('Import ผลทดลอง','importSession')}${button('รายงานคุยกับทีม .txt','exportReport')}</div><input id="session-file" type="file" accept=".json,application/json" hidden><details style="margin-top:15px"><summary>ล้างผลทดลองทั้งหมด (ต้องยืนยัน)</summary><p>ล้างเฉพาะการตัดสินใจ หลักฐาน asset edits และบันทึกในเบราว์เซอร์นี้ กรุณา Export ก่อนหากต้องการเก็บ</p>${button('ยืนยันล้างผลทดลอง DC01','resetSession','','small')}</details></div><div class="panel"><h3>สถานะประเด็นในแต่ละช่วง</h3><ul class="file-mini-list">${D.stages.map(s=>{const p=E.stageStatus(state,D,s.id);return `<li>${button(h(s.id+' / '+s.name),'stage',`data-id="${s.id}"`,'small ghost')} <span class="small">${p.accepted}/${p.total} ผ่าน · ${p.criticalOpen} critical ค้าง</span></li>`;}).join('')}</ul></div></div>
 <div class="section-head"><h2>ประวัติการตัดสินใจล่าสุดก่อน</h2></div><div class="panel"><ol class="journal-events" tabindex="0" aria-label="ประวัติการตัดสินใจ">${[...state.events].reverse().map(e=>`<li>${chip(e.ok?'ผ่าน':'หยุด',e.ok?'good':'block')} <strong>#${e.number} ${h(e.issueId||e.fileId||e.assetId||'')} / ${h(e.action)}</strong><p>${h(e.message)}</p><small>${h(e.actor+' / '+company(e.actor).name)} · ${h(new Date(e.at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}))}</small></li>`).join('')||'<li class="empty">ยังไม่มีประวัติ เริ่มจากเลือกช่วงงานและลองตัดสินใจ</li>'}</ol></div>`;}

 function guide(){return `${heading('READ THE RULES / QUESTION THE ASSUMPTIONS','สมจริงในตรรกะ โปร่งใสในข้อจำกัด','การเรียนรู้ต้องบอกให้ได้ว่าอะไรเป็นข้อเท็จจริง อะไรเป็นสมมติฐาน และผลตรวจหนึ่งอย่างยังไม่ได้พิสูจน์อะไร')}
 <div class="grid two"><div class="panel"><h3>สมมติฐานของ DC01 & Revit Thailand</h3><ul>${D.project.assumptions.map(a=>`<li>${h(a)}</li>`).join('')}</ul><p class="small">${h(D.project.coordinateBasis)}</p></div><div class="panel"><h3>สิ่งที่เครื่องมือควบคุม / ไม่ได้ควบคุม</h3><p>ตรวจบทบาทบริษัทที่สวม หลักฐานที่ผูกกับ revision ทางเลือก และ gate ของปัญหาตัวอย่างได้ ผู้ใช้สลับบทบาทเองได้ จึงไม่มี authentication หรือการบังคับสิทธิ์จริง</p><p>ไม่เชื่อม ACC, CMMS, BMS/EPMS หรือ OT; ไม่มีการสั่งตัดต่อระบบ ทดสอบไฟฟ้า หรือ procedure สำหรับหน้างานจริง ไม่มีข้อสรุปด้านกฎหมาย Permit, certification, code compliance หรือ Tier rating</p><p>ทะเบียน native model/drawing เป็นตัวอย่าง metadata ไม่ใช่ binary ที่เปิดใน Revit/AutoCAD ได้ ตัวอย่าง IFC เป็น proxy boxes; รายละเอียดไฟล์จริงและวิธีตรวจอยู่ในเอกสาร validation</p></div></div>
 <div class="section-head"><h2>ชื่อไฟล์และขอบเขตข้อมูล</h2></div><div class="panel"><div class="file-fields">${['DC01','ELD','E01','00','M3','E','0001'].map((v,i)=>`<span class="file-field">${v}<small>${h(D.naming.fields[i])}</small></span>`).join('')}<span class="file-field">.rvt<small>representation format</small></span></div><p>${h(D.naming.notes)}</p><div class="grid two"><div><h3>Level / location</h3><dl class="definition">${Object.entries(D.naming.levels).map(([k,v])=>`<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join('')}</dl></div><div><h3>Type codes (เฉพาะโครงการนี้)</h3><dl class="definition">${Object.entries(D.naming.types).map(([k,v])=>`<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join('')}</dl></div></div><p class="small">Originator = รหัสบริษัทผู้สร้างข้อมูล ไม่ใช่ผู้รับไฟล์; Role = discipline/function code, Volume = spatial breakdown ของกรณีนี้; ระบบ A/B, UPS, CHW เป็น metadata แยกจากชื่อ</p></div>
 <div class="section-head"><h2>คำที่ชวนสับสน</h2></div><div class="table-wrap"><table class="glossary"><thead><tr><th>คำ</th><th>ความหมายในเครื่องมือนี้</th><th>ยังไม่ได้พิสูจน์อะไร</th></tr></thead><tbody>${[
 ['Phase / Stage','บริบทและวัตถุประสงค์การส่งข้อมูลในช่วงงาน','ไม่ใช่ CDE state และอาจซ้อนกันหลาย package'],['WIP / Shared / Published / Archived','การจัดการสถานะ/การออกข้อมูลและการเก็บประวัติ','โฟลเดอร์อย่างเดียวไม่พิสูจน์ approval หรือ permission to construct'],['RACI / Appointments','งานที่ทำ ผู้รับผิดชอบ และ mandate ตามที่แต่งตั้ง','ไม่ได้ให้ technical access โดยอัตโนมัติ'],['Clash-free','ผ่านกติกา clash ที่ตั้งไว้กับ source versions ที่ระบุ','ยังไม่พิสูจน์ capacity, sequence, maintainability หรือ common-mode risk'],['FAT / Functional / Integrated test','ผลทดสอบภายในขอบเขตและ configuration ที่บันทึก','test หนึ่งชนิดไม่ครอบคลุมระบบหรือเงื่อนไขทั้งหมด'],['As-built / Record','ข้อมูลอ้างสิ่งที่ติดตั้ง พร้อม verification scope และ exclusions','ป้ายชื่อไม่ยืนยันว่าตรงหน้างานหรือ asset identity ถูก'],['PIM → AIM','คัดและตรวจข้อมูลจากงานโครงการไปใช้บริหารทรัพย์สินตาม AIR','ไม่ใช่ย้ายโมเดลทั้งหมดแล้วถือว่า FM ใช้ได้'],['COBie-style mapping','ตัวอย่าง field mapping ให้คุยเรื่อง asset exchange','ไม่ใช่ COBie workbook ที่ validate ครบ schema/standard'],['Digital Twin','use case ที่มี identity, data relationships, synchronization และ ownership ตรวจสอบได้','3D viewer หรือค่าตัวเลขที่เคลื่อนไหวอย่างเดียวไม่พอ']].map(r=>`<tr>${r.map(v=>`<td>${h(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="section-head"><h2>ไฟล์ตัวอย่างที่มีเนื้อหาจริง</h2></div><div class="panel"><ul class="file-mini-list">${D.files.filter(f=>f.download).map(f=>`<li>${fileLink(f.id)}<small>${h(f.sampleNote||f.formatNote)}</small></li>`).join('')}</ul><div class="button-row" style="margin-top:18px"><a class="btn primary" href="${h(D.samples.bundle)}" download>ดาวน์โหลดชุดตัวอย่างทั้งหมด</a></div></div>
 <div class="section-head"><h2>แหล่งอ้างอิงหลัก</h2></div><div class="panel"><p>ข้อมูลวิศวกรรม บริษัท code lists และลำดับตัดสินใจใน DC01 เขียนขึ้นเป็นกรณีสมมติ ลิงก์เหล่านี้สนับสนุนหลักการ ไม่ได้ endorse case หรือรับรอง correctness ของ design</p><ol class="source-list">${D.sources.map(s=>`<li><a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.title)}</a><p>${h(s.use)}</p></li>`).join('')}</ol></div>`;}

 const viewLabels={architecture:'สถาปัตย์ / วัสดุ / แดดลมฝน',maintenance:'อุปกรณ์เสีย / PM / Work control',play:'สนามจัดโซน / Zone Quest',access:'คำขอสิทธิ์ & Grants',impact:'Impact / Risk / ROI',overview:'ภาพรวมโครงการ',atlas:'3D Model & โซนพื้นที่',files:'ทะเบียนไฟล์ & ชุดส่ง',lifecycle:'Issues & Control Gates',assets:'Assets / Handover / Twin',journal:'บันทึกการตัดสินใจ',guide:'กติกา & แหล่งอ้างอิง'};

 function mount3D(){
  const canvas=$('dc-3d-canvas');
  if(!canvas||!V)return;
  V.bindCanvas(canvas,D,()=>({selectedZone,selectedAsset}),hit=>{
   if(hit.kind==='building'){selectedService=null;selectedAsset=null;selectedZone=hit.zoneId;V.command('selectBuilding:'+hit.id,D,{selectedZone,selectedAsset});}
   else if(hit.kind==='service'){selectedService=hit.id;selectedAsset=null;selectedZone=hit.zoneId;V.command('selectService:'+hit.id,D,{selectedZone,selectedAsset});}
   else if(hit.kind==='asset'){selectedService=null;V.command('clearService',D,{selectedZone,selectedAsset});
    selectedAsset=hit.id;
    selectedZone=hit.zoneId;
   }else if(hit.kind==='zone'){selectedService=null;V.command('clearService',D,{selectedZone,selectedAsset});
    selectedZone=hit.id;
    const first=D.assets.find(a=>a.zone===hit.id);
    selectedAsset=first?.id||null;
   }
   render();
  });
  V.draw(D,selectedZone,selectedAsset);
 }

 function render(){
  if(view==='assets'&&!selectedAsset){selectedAsset=D.assets[0].id;selectedZone=D.assets[0].zone;}
  if(selectedAsset&&selectedService){selectedService=null;V?.command('clearService',D,{selectedZone,selectedAsset});}
  const active=document.activeElement,focusAction=active?.dataset?.do,focusKey=active?.dataset?.id,focusValue=active?.dataset?.value,focusCmd=active?.dataset?.cmd,focusId=active?.id,start=active?.selectionStart,end=active?.selectionEnd;
  document.querySelectorAll('#dc-nav [data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
  $('dc-actor').value=actor;
  const bc=$('dc-breadcrumb');
  if(bc)bc.innerHTML=`DC01 <span>/</span> ${h(viewLabels[view]||view)} <span>/</span> โซน ${h(selectedZone)} · วัตถุ ${h(D.assets.find(a=>a.id===selectedAsset)?.tag||selectedService||V?.getState().selectedBuilding||'ไม่มีวัตถุ')}`;
  const content=$('dc-content'),oldStage=content.querySelector('.viewer-stage');
  const html=({overview,architecture:architectureView,maintenance:maintenanceView,play:playView,atlas,files:filesView,lifecycle,assets:assetsView,journal,guide,access:accessView,impact:dashboard})[view]();
  if(view==='atlas'&&oldStage){
   // Keep the fullscreen element and canvas connected while updating selection/role.
   const template=document.createElement('template');template.innerHTML=html;
   const shell=content.querySelector('.viewer-shell'),fresh=template.content.querySelector('.viewer-shell');
   shell.querySelector('.viewer-tree').replaceWith(fresh.querySelector('.viewer-tree'));
   shell.querySelector('.inspector-pane').replaceWith(fresh.querySelector('.inspector-pane'));
   oldStage.querySelector('.viewer-toolbar').replaceWith(fresh.querySelector('.viewer-toolbar'));
   oldStage.querySelector('.viewer-legend').replaceWith(fresh.querySelector('.viewer-legend'));
   const oldChildren=[...content.children],newChildren=[...template.content.children];
   oldChildren.forEach((el,i)=>{if(el!==shell&&newChildren[i])el.replaceWith(newChildren[i]);});
  }else{V?.dispose?.();content.innerHTML=html;}

  if(view==='atlas')mount3D();
  M?.mount($('maintenance-play'),D,actor);
  A?.mount($('architecture-play'),D,actor);
  Z?.mount($('zoning-play'),id=>{selectedService=null;V?.command('clearService',D,{selectedZone,selectedAsset});selectedZone=id;selectedAsset=D.assets.find(a=>a.zone===id)?.id||null;setView('atlas');V?.command('fitZone',D,{selectedZone,selectedAsset});});
  if(focusAction&&!focusId){[...document.querySelectorAll('button[data-do]')].find(b=>b.dataset.do===focusAction&&b.dataset.id===focusKey&&b.dataset.value===focusValue&&b.dataset.cmd===focusCmd)?.focus({preventScroll:true});}
  if(focusId){const next=$(focusId);if(next){next.focus({preventScroll:true});if(typeof next.setSelectionRange==='function'&&typeof start==='number'&&next.type!=='number')try{next.setSelectionRange(start,end);}catch(_){}}}
 }

 function renderFile(id){dialogFile=id;const f=file(id),allowed=E.canRead(D,f,actor,state),parts=f.containerId.split('-'),family=D.files.filter(g=>g.containerId===f.containerId&&g.id!==f.id),fObj=E.fileObjects(D,f.id);$('file-dialog-content').innerHTML=`<div class="dialog-header"><div><span class="eyebrow">${h(f.id)} / ${h(f.category)}</span><h2 id="file-dialog-title">${h(f.name)}</h2></div><button class="btn small" data-do="closeFile" aria-label="ปิดรายละเอียดไฟล์">ปิด ×</button></div><div class="dialog-body"><h3>${h(f.title)}</h3><div class="button-row">${chip(f.state,f.state.toLowerCase())}${chip(E.revLabel(E.revision(state,f)))}${chip(f.confidentiality)}${chip(f.download?'เปิดตัวอย่างได้จริง':'ทะเบียนสมมติ / ไม่มี native binary',f.download?'good':'')}</div><div class="file-fields">${parts.map((v,i)=>`<span class="file-field">${h(v)}<small>${h(D.naming.fields[i])}</small></span>`).join('')}</div><dl class="definition wide"><dt>Originator / author</dt><dd>${h(f.originator+' / '+company(f.originator).name)}<br>${h(f.author)}</dd><dt>Checker / responsibility</dt><dd>${h(f.checker)}</dd><dt>Stage lead / gate context</dt><dd>${h(f.acceptanceBy)} — mandate จริงต้องดู appointment ของ package</dd><dt>Zone / level</dt><dd>${h(f.zone+' / '+f.level)}</dd><dt>Project stage</dt><dd>${h(f.stage+' / '+stage(f.stage).name)}</dd><dt>Intended use / status</dt><dd>${h(f.purpose)}<br>${h(f.status)}</dd><dt>Classification</dt><dd>${h(f.classification)} (project taxonomy)</dd><dt>Software / version</dt><dd>${h(f.software)}${f.nativeVersion?'<br>'+h(f.nativeVersion):''}</dd></dl><div class="callout ${allowed?'green':'red'}"><strong>ทดลองสิทธิ์อ่านในนโยบายตัวอย่าง:</strong> ${h(actor)} ${allowed?'อ่านได้ตาม effective policy: '+h(E.readAccess(state,D,f,actor).basis):'ยังไม่มีสิทธิ์อ่านเนื้อหาในขอบเขตนี้'}<br>แสดง metadata เพื่อเรียนรู้ ไม่ใช่ระบบ security จริง; Admin ไม่ได้มีสิทธิ์ดู WIP หรือ Commercial ทุกชุด</div>${allowed?`<p>${h(f.description)}</p><p class="small">${h(f.formatNote)}</p>`:'<p class="small">เนื้อหาตัวอย่างถูกซ่อนในมุมมองนี้ ลองเลือก originator หรือผู้รับตาม scope เพื่อเรียนรู้ความต่างระหว่างรู้ว่ามีไฟล์กับมีสิทธิ์อ่าน</p>'}${!allowed?button('ขอ read access สำหรับไฟล์/ฉบับนี้','requestAccess',`data-id="${f.id}"`,'primary'):''}<h3>Proposed CDE path / project-defined</h3><div class="path">${h(f.path)}</div><p class="small">Authoring source: ${h(f.wipPath)}</p><h3>Source / derivative / dependencies</h3>${f.derivedFrom?`<p class="small">Derived from ${fileLink(f.derivedFrom)} · อ้างตอนออก ${E.revLabel(f.dependencyVersions[f.derivedFrom])} / ปัจจุบัน ${E.revLabel(E.revision(state,file(f.derivedFrom)))} · ต้องตรวจ delta และ applicability ก่อนอ้างอิง</p>`:''}<ul class="file-mini-list">${[...new Set([...f.dependencies,...family.map(g=>g.id)])].filter(v=>v!==f.id).map(fid=>`<li>${fileLink(fid)}<small>${h(file(fid).title)} · ${E.revLabel(E.revision(state,file(fid)))} · ${h(file(fid).state)}${f.dependencyVersions&&f.dependencyVersions[fid]?' · อ้างตอนออก '+E.revLabel(f.dependencyVersions[fid])+(f.dependencyVersions[fid]!==E.revision(state,file(fid))?' / ต้องทบทวน baseline':''):''}</small></li>`).join('')||'<li class="small">ไม่มี dependency เพิ่มในทะเบียนตัวอย่างนี้ ไม่ใช่การยืนยันว่าไฟล์ production ไม่มี external references</li>'}</ul><div class="callout">${h(f.sampleNote||'รายการนี้เป็นชื่อและ metadata สำหรับฝึก ไม่มี binary native file ให้ดาวน์โหลด ไม่สามารถเปิดแทนงาน Revit/CAD จริงได้')}</div><div class="button-row">${allowed&&f.download?`<a class="btn primary" href="${h(f.download)}" download>ดาวน์โหลดตัวอย่าง .${h(f.ext)}</a>`:''}${button('ลองเปิด revision ใหม่','revise',`data-id="${f.id}"`,'small')}${button('ไปช่วงงานนี้','stage',`data-id="${f.stage}"`,'small')}${button('ดูโซน '+f.zone+' ใน 3D','highlightZone3d',`data-id="${f.zone}"`,'small')}${fObj.zoneAssets[0]?button('ดู '+fObj.zoneAssets[0].tag+' ใน 3D','inspect3d',`data-id="${fObj.zoneAssets[0].id}"`,'small'):''}</div><p class="small">การเปิด revision ใหม่ในแบบจำลองจะทำให้หลักฐานที่อ้างฉบับก่อนล้าสมัย ไม่แก้ binary และไม่อัปเดต derivative หรือ downstream design ให้โดยอัตโนมัติ</p></div>`;}

 function setView(v){if(!['overview','architecture','maintenance','play','atlas','files','lifecycle','assets','journal','guide','access','impact'].includes(v))return;view=v;$('dc-notice').hidden=true;render();$('main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 function perform(input){try{const result=E.act(state,D,{...input,actor});save();render();if($('file-dialog').open&&dialogFile)renderFile(dialogFile);notify(result.message,result.ok);}catch(err){notify(err.message,false);}}
 function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function report(){return ['DC01 / Revit Thailand — Team discussion record','Fictional learning session, not real approval or tamper-resistant audit evidence.','',`Accepted sample issues: ${countAccepted()}/${D.issues.length}`,`Asset validation findings: ${E.assetProblems(state,D).length}`,'', 'TEAM NOTES',notes||'(not recorded)','', 'STAGE / GATE STATUS',...D.stages.map(s=>{const p=E.stageStatus(state,D,s.id);return `${s.id} ${s.name}: ${p.accepted}/${p.total} accepted; ${p.criticalOpen} critical open`;}),'','DECISION HISTORY',...state.events.map(e=>`${e.number}. ${e.at} | ${e.actor} | ${e.action} | ${e.issueId||e.fileId||e.assetId||''} | ${e.ok?'PASS':'STOP'}\n${e.message}`)].join('\n');}

 document.addEventListener('click',e=>{const sampleLink=e.target.closest('a[download]');if(sampleLink){const href=sampleLink.getAttribute('href'),targets=href===D.samples.bundle?D.files.filter(f=>f.download):D.files.filter(f=>f.download===href);if(targets.some(f=>!E.canRead(D,f,actor,state))){e.preventDefault();notify('อ่านตัวอย่างนี้ยังไม่ได้ตาม policy ปัจจุบัน กรุณาขอ read access; bundle ต้องมีสิทธิ์ทุกไฟล์ในชุด',false);return;}const payload=window.DC_SAMPLES?.[sampleLink.getAttribute('href')];if(payload){e.preventDefault();download(payload.name,Uint8Array.from(atob(payload.base64),c=>c.charCodeAt(0)),payload.mime);return;}}const nav=e.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return;}const b=e.target.closest('[data-do]');if(!b)return;
  if(b.dataset.do==='selectFileRow'&&e.target.closest('[data-do="file"]'))return;
  e.preventDefault();const {do:action,id,target,value,option,req,cmd,state:stVal,zone:znVal}=b.dataset;
  if(action==='view')setView(target);
  else if(action==='stage'){selectedStage=id;if($('file-dialog').open)$('file-dialog').close();setView('lifecycle');}
  else if(action==='exportBuildingBrief'){const brief=window.DCBuilding?.exportBrief(D,id);if(brief)download('DC01-'+id+'-preliminary-material-brief.json',JSON.stringify(brief,null,2));}
  else if(action==='roomInterior'){selectedZone=id;selectedAsset=null;selectedService=null;V?.command('roomInterior',D,{selectedZone,selectedAsset});render();}
  else if(action==='buildingPart'){const g=window.DCBuilding?.build(D,{levelFilter:'ALL'},'SITE').find(g=>g.id===id);if(g){selectedZone=g.zoneId;selectedAsset=null;selectedService=null;V?.command('selectBuilding:'+id,D,{selectedZone,selectedAsset});render();}}
  else if(action==='zone'){selectedService=null;V?.command('clearService',D,{selectedZone,selectedAsset});selectedZone=id;const first=D.assets.find(a=>a.zone===id);if(D.assets.find(a=>a.id===selectedAsset)?.zone!==id)selectedAsset=first?.id||null;render();}
  else if(action==='selectService'){const service=D.scene.serviceDetail?.services.find(s=>s.id===id);if(service){selectedService=id;selectedAsset=null;selectedZone=service.zone;V?.command('selectService:'+id,D,{selectedZone,selectedAsset});setView('atlas');}}
  else if(action==='select3dAsset'){selectedAsset=id;const a=D.assets.find(x=>x.id===id);if(a)selectedZone=a.zone;render();V?.command('fitAsset',D,{selectedZone,selectedAsset});}
  else if(action==='inspect3d'){selectedAsset=id;const a=D.assets.find(x=>x.id===id);if(a)selectedZone=a.zone;if($('file-dialog').open)$('file-dialog').close();setView('atlas');V?.command('fitAsset',D,{selectedZone,selectedAsset});}
  else if(action==='highlightZone3d'){selectedZone=id;const first=D.assets.find(a=>a.zone===id);selectedAsset=first?.id||null;if($('file-dialog').open)$('file-dialog').close();setView('atlas');V?.command('fitZone',D,{selectedZone,selectedAsset});}
  else if(action==='viewerCmd'){if(cmd==='reset'){selectedService=null;selectedAsset=D.assets.find(a=>a.zone===selectedZone)?.id||null;}V?.command(cmd,D,{selectedZone,selectedAsset});if(cmd!=='fullscreen'&&(['toggleIsolateService','toggleServiceDetail','toggleSite','toggleDuctBanks','toggleExplode','toggleLabels','toggleIsolate','toggleRoutes','toggleClearance','toggleElevations','viewIso','viewTop','viewSouth','viewEast','reset','fullscreen'].includes(cmd)||cmd.startsWith('level:')))render();}
  else if(action==='inspectorTab'){inspectorTab=value;render();}
  else if(action==='selectFileRow'){selectedFileId=id;render();}
  else if(action==='folderFilter'){filters.state=stVal||'';render();}
  else if(action==='zoneFolderFilter'){filters.zone=filters.zone===znVal?'':znVal;render();}
  else if(action==='asset'){selectedAsset=id;selectedZone=D.assets.find(a=>a.id===id).zone;assetTab='register';setView('assets');}
  else if(action==='zoneFiles'||action==='companyFiles'||action==='stageFiles'){Object.keys(filters).forEach(k=>filters[k]='');filters[action==='zoneFiles'?'zone':action==='companyFiles'?'originator':'stage']=id;setView('files');}
  else if(action==='actor'){actor=id;render();if($('file-dialog').open&&dialogFile)renderFile(dialogFile);notify('สวมบทบาท '+id+' แล้ว การเลือกบทบาทเป็น simulation ไม่ใช่การยืนยันตัวตน');}
  else if(action==='file'){selectedFileId=id;renderFile(id);if(!$('file-dialog').open)$('file-dialog').showModal();if(view==='files')render();}
  else if(action==='closeFile')$('file-dialog').close();
  else if(action==='requestAccess'){accessFileId=id;if($('file-dialog').open)$('file-dialog').close();setView('access');}
  else if(action==='refreshAccess'){render();if($('file-dialog').open&&dialogFile)renderFile(dialogFile);}
  else if(action==='accessRequest')perform({action,fileId:accessFileId,...accessDraft});
  else if(['accessApprove','accessDeny','accessRevoke'].includes(action)){const review=accessReviews[id]||{reason:'',hours:state.accessRequests[id]?.hours};perform({action,requestId:id,reason:review.reason,hours:review.hours});}
  else if(action==='exportImpact'){const metrics=E.dashboardMetrics(state,D);let scenario=null;try{scenario=E.roiScenario(metrics,roiInputs);}catch(_){}download('DC01-impact-scenario.json',JSON.stringify({schema:'DC01-impact-scenario-v1',datasetId:D.datasetId,at:new Date().toISOString(),metrics,assumptions:roiInputs,scenario,formulas:{hours:'unique accepted cases * hoursPerCase * realization / 100',benefit:'hours * hourlyRate',net:'benefit - investment',roi:'net / investment * 100 when investment > 0'},notice:'Fictional learning session. Scenario is not measured savings, causal ROI, incident probability or certified engineering risk.'},null,2));}
  else if(action==='choose')perform({action,issueId:id,option});
  else if(action==='evidence')perform({action,issueId:id,requirement:req});
  else if(action==='accept')perform({action,issueId:id});
  else if(action==='revise')perform({action,fileId:id});
  else if(action==='assetRepair')perform({action,assetId:id});
  else if(action==='fileKind'){filters.kind=value;render();}
  else if(action==='clearFilters'){Object.keys(filters).forEach(k=>filters[k]='');render();}
  else if(action==='assetTab'){assetTab=value;render();}
  else if(action==='twinCase'){twinCase=id;render();}
  else if(action==='exportPriorSession'){const raw=priorSession();if(raw)download('DC01-previous-baseline-session.json',raw);else notify('ไม่มี session ก่อนเปลี่ยน baseline ที่สำรองไว้');}
  else if(action==='exportSession')download('DC01-learning-session.json',JSON.stringify(packet(),null,2));
  else if(action==='exportFiles')download('DC01-filtered-file-register.json',JSON.stringify({project:D.project.id,filters,files:filteredFiles().map(f=>E.canRead(D,f,actor,state)?({...f,revision:E.revision(state,f)}):({id:f.id,name:f.name,originator:f.originator,zone:f.zone,stage:f.stage,state:f.state,revision:E.revision(state,f),access:'METADATA_ONLY'})),notice:'Fictional register. Not an ACC import template or approval.'},null,2));
  else if(action==='exportAssets')download('DC01-asset-exchange.json',JSON.stringify({schema:'DC01-learning-asset-exchange-v1',assets:E.assetRows(state,D),findings:E.assetProblems(state,D),notice:'Project-specific teaching schema, not certified COBie.'},null,2));
  else if(action==='exportReport')download('DC01-team-discussion.txt',report(),'text/plain;charset=utf-8');
  else if(action==='importSession')$('session-file').click();
  else if(action==='resetSession'){state=E.create();notes='';restoreScenario({});accessDraft.reason='';accessReviews={};storageMessage='';save();render();notify('ล้างผลทดลอง DC01 แล้ว');}
 });
 document.addEventListener('input',e=>{
  if(e.target.dataset.scenario){const k=e.target.dataset.scenario;if(Object.hasOwn(roiInputs,k)){roiInputs[k]=e.target.value===''?null:Number(e.target.value);save();}}
  else if(e.target.id==='access-reason')accessDraft.reason=e.target.value;
  else if(e.target.id==='access-hours')accessDraft.hours=Number(e.target.value);
  else if(e.target.dataset.review){const id=e.target.dataset.review;accessReviews[id]={hours:state.accessRequests[id]?.hours,...accessReviews[id],reason:e.target.value};}
  else if(e.target.dataset.reviewHours){const id=e.target.dataset.reviewHours;accessReviews[id]={reason:'',...accessReviews[id],hours:Number(e.target.value)};}
  else if(e.target.dataset.filter!==undefined){filters[e.target.dataset.filter]=e.target.value;render();}
  else if(e.target.id==='tree-search'){treeFilter=e.target.value;render();}
  else if(e.target.id==='dc-notes'){notes=e.target.value;save();}
 });
 document.addEventListener('change',async e=>{const el=e.target;
  if(el.dataset.scenario){const k=el.dataset.scenario;if(Object.hasOwn(roiInputs,k)){roiInputs[k]=el.value===''?null:Number(el.value);save();render();}}
  else if(el.id==='access-file'){accessFileId=el.value;render();}
  else if(el.id==='access-use')accessDraft.use=el.value;
  else if(el.id==='dc-actor'){actor=el.value;render();if($('file-dialog').open&&dialogFile)renderFile(dialogFile);}
  else if(el.dataset.filter!==undefined){filters[el.dataset.filter]=el.value;render();}
  else if(el.id==='asset-select'){selectedAsset=el.value;selectedZone=D.assets.find(a=>a.id===selectedAsset).zone;render();}
  else if(el.dataset.assetField)perform({action:'assetEdit',assetId:selectedAsset,field:el.dataset.assetField,value:el.value});
  else if(el.id==='session-file'){const f=el.files[0];if(!f)return;try{if(f.size>2500000)throw new Error('ไฟล์ใหญ่เกิน 2.5 MB');const input=JSON.parse(await f.text()),restored=E.restore(input,D);state=restored;notes=input.notes||'';restoreScenario(input);save();render();notify('นำเข้าและ replay ตามกติกาแล้ว ไม่เชื่อผล approval / state ที่ใส่เพิ่มในไฟล์');}catch(err){notify('นำเข้าไม่ได้: '+(err instanceof SyntaxError?'JSON ไม่ถูกต้อง':err.message),false);}finally{el.value='';}}
 });
 let accessTick='';window.setInterval?.(()=>{const signature=E.accessRows(state,D).map(r=>r.id+':'+r.effectiveStatus).join('|');if(signature!==accessTick){accessTick=signature;render();if($('file-dialog').open&&dialogFile)renderFile(dialogFile);}},15000);
 window.addEventListener('resize',()=>{if(view==='atlas')V?.draw(D,selectedZone,selectedAsset);});
 $('dc-actor').innerHTML=D.companies.map(c=>`<option value="${c.id}">${c.id} / ${h(c.name)} — ${h(c.role)}</option>`).join('');
 $('file-dialog').addEventListener('click',e=>{if(e.target===$('file-dialog')){const r=$('file-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('file-dialog').close();}});
 function entryView(){
  const raw=window.location?.hash?.slice(1)||'';if(!raw)return null;
  const params=new URLSearchParams(raw.includes('=')?raw:'view='+raw),target=params.get('view');
  if(!Object.hasOwn(viewLabels,target))return null;
  view=target;const st=params.get('stage'),asset=params.get('asset'),service=params.get('service');
  if(view==='lifecycle'&&D.stages.some(s=>s.id===st))selectedStage=st;
  const a=D.assets.find(a=>a.id===asset);if(a&&['assets','atlas'].includes(view)){selectedAsset=a.id;selectedZone=a.zone;selectedService=null;}
  const assembly=D.scene.serviceDetail?.services.find(s=>s.id===service);
  if(view==='atlas'&&assembly){selectedService=assembly.id;selectedAsset=null;selectedZone=assembly.zone;return 'service';}
  if(a&&view==='atlas')return 'asset';
  const zone=params.get('zone');if(view==='atlas'&&D.zones.some(z=>z.id===zone)){selectedZone=zone;selectedAsset=null;selectedService=null;return params.get('room')==='1'?'room':'zone';}
  return null;
 }
 function openEntry(){const focus=entryView();if($('file-dialog').open)$('file-dialog').close();render();if(focus==='service'){V?.command('selectService:'+selectedService,D,{selectedZone,selectedAsset});render();}else if(focus==='asset')V?.command('fitAsset',D,{selectedZone,selectedAsset});else if(focus==='zone'||focus==='room'){V?.command(focus==='room'?'roomInterior':'fitZone',D,{selectedZone,selectedAsset});render();}}
 window.addEventListener('hashchange',openEntry);
 openEntry();
})();
