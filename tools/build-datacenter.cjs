const fs=require('node:fs'),path=require('node:path');
const {companies,zones,stages,sources}=require('../data/datacenter-content.cjs');
const root=path.resolve(__dirname,'..');
const companyMap=Object.fromEntries(companies.map(x=>[x.id,x]));
const files=[],issues=[],sequences=new Map();
const formats={rvt:['Revit','Native authoring model; links, shared coordinates and software version must be controlled. Not a downloadable model in this case.'],ifc:['IFC exchange','Open exchange representation; verify schema, geometry, GUIDs and required properties.'],dwg:['AutoCAD / Civil 3D','Native drawing or civil data; manage xrefs, fonts, units and plot dependencies.'],pdf:['PDF reader','Issued/readable representation. Its presence does not prove acceptance or suitability.'],docx:['Word','Editable narrative / specification; controlled PDF derivative is issued separately.'],xlsx:['Excel','Structured schedule / register. Schema and values require validation, not only file presence.'],nwf:['Navisworks Manage','Federation project referencing external sources; it is not a self-contained model.'],nwc:['Navisworks cache','Derived cache tied to exact source version and export configuration.'],nwd:['Navisworks snapshot','Dated coordination snapshot; retain manifest, source revisions and intended use.'],rfa:['Revit family','Vendor object; verify dimensions, connectors, clearance and certified-data applicability.'],step:['STEP-compatible CAD','Neutral equipment geometry; not proof of installed identity or performance.'],e57:['Point-cloud software','Exchange scan data; record survey control, coverage and accuracy/tolerance.'],rcp:['Autodesk ReCap','Project/index with companion RCS dependencies; verify complete recipient package.'],rcs:['Autodesk ReCap','Scan data companion to a registered RCP project.'],bcfzip:['BCF-compatible viewer','Issue exchange, not a model or approval certificate.'],json:['JSON / integration tool','Structured data; validate identity, schema, units, timestamps, quality and references.']};
const stateFor=s=>['BRF','CON','SD','DD','SHP','PRC'].includes(s)?'SHARED':'PUBLISHED';
function add(stage, spec, extra={}) {
 const [originator,volume,level,type,role,ext,title]=spec;
 const group=[originator,volume,level,type,role].join('-');
 const number=extra.number||String((sequences.get(group)||0)+1).padStart(4,'0');
 if(!extra.number) sequences.set(group,Number(number));
 const containerId=['DC01',originator,volume,level,type,role,number].join('-');
 const id='F'+String(files.length+1).padStart(4,'0');
 const f={id,stableKey:`${containerId}.${ext}@R${String(extra.revision||2).padStart(2,'0')}`,containerId,name:containerId+'.'+ext,stage:stage.id,originator,zone:volume,level,type,role,ext,title,
  category:['rvt','ifc','nwf','nwd','nwc','step','rfa','e57','rcp','rcs'].includes(ext)?'Model / data':type==='DR'?'Drawing':'Document / register',
  revision:2,state:['rvt','dwg','rfa'].includes(ext)&&stage.id!=='ASB'?'WIP':stateFor(stage.id),status:stage.purpose,purpose:stage.purpose,
  classification:'DC01/'+(type==='M3'?'Model':type==='DR'?'Drawing':type==='SH'?'Schedule':'Information')+'/'+role,
  author:companyMap[originator].role,checker:originator==='IMT'?'IMT information delivery lead':companyMap[originator].id+' appointed discipline/package lead',
  acceptanceBy:stage.gateBy,confidentiality:['QSX'].includes(originator)?'COMMERCIAL':['SEC'].includes(originator)?'SECURITY':'PROJECT',
  recipients:['QSX'].includes(originator)?['QSX','OWN','PMO']:['SEC'].includes(originator)?['SEC','OWN','OPS']:companies.filter(c=>!['REG','QSX'].includes(c.id)).map(c=>c.id),
  software:formats[ext][0],formatNote:formats[ext][1],nativeVersion:ext==='rvt'||ext==='rfa'?'Revit 2026 — project assumption':ext==='dwg'?'DWG target version / units agreed per exchange':null,
  derivedFrom:extra.derivedFrom||null,dependencies:[],download:null,
  description:extra.description||title+' — '+stage.focus,
  path:`${['rvt','dwg','rfa'].includes(ext)&&stage.id!=='ASB'?'01_WIP':stateFor(stage.id)==='SHARED'?'02_SHARED':'03_PUBLISHED'}/${stage.id}/${volume}/${originator}/${type==='M3'?'01_Models':type==='DR'?'02_Drawings':'03_Documents'}/${containerId}.${ext}`,
  wipPath:`01_WIP/${originator}/${stage.id}/${volume}/${containerId}.${ext}`,
  ...extra};
 if(f.state==='WIP')f.path=f.wipPath;
 else if(!extra.path)f.path=`${{SHARED:'02_SHARED',PUBLISHED:'03_PUBLISHED',ARCHIVED:'04_ARCHIVED'}[f.state]}/${stage.id}/${volume}/${originator}/${type==='M3'?'01_Models':type==='DR'?'02_Drawings':'03_Documents'}/${containerId}.${ext}`;
 files.push(f);return f;
}
for(const stage of stages){
 stage.fileIds=[];stage.issueIds=[];
 for(const spec of stage.outputs){
  const f=add(stage,spec);stage.fileIds.push(f.id);
  if(['rvt','dwg','docx'].includes(f.ext)){
   const derivative=add(stage,[f.originator,f.zone,f.level,f.type,f.role,f.ext==='rvt'?'ifc':'pdf',f.title+' / '+(f.ext==='rvt'?'IFC exchange':'issued PDF')],{number:f.containerId.split('-').at(-1),derivedFrom:f.id});
   stage.fileIds.push(derivative.id);
  }
  if(f.ext==='nwf'){ f.dependencies=files.filter(x=>x.stage===stage.id&&x.ext==='rvt').map(x=>x.id);const cache=add(stage,['IMT',f.zone,f.level,'CM','X','nwc','Federation source cache / controlled export'],{derivedFrom:f.dependencies[0]||null});stage.fileIds.push(cache.id);f.dependencies.push(cache.id); }
  if(f.ext==='rcp'){const scan=add(stage,['SUR',f.zone,f.level,'M3','V','rcs','Registered scan data / RCP companion'],{companionOf:f.id});stage.fileIds.push(scan.id);f.dependencies.push(scan.id);}
 }
 const primary=files.find(f=>f.id===stage.fileIds[0]);
 const previous=add(stage,[primary.originator,primary.zone,primary.level,primary.type,primary.role,primary.ext,primary.title+' / superseded snapshot'],{number:primary.containerId.split('-').at(-1),state:'ARCHIVED',revision:1,current:false,status:'SUPERSEDED / retain record',purpose:'historical record only',path:`04_ARCHIVED/${stage.id}/${primary.originator}/R01/${primary.name}`});stage.fileIds.push(previous.id);
 const tuples=stage.issues;delete stage.issues;delete stage.outputs;
 tuples.forEach((r,index)=>{
  const [title,severity,zone,fixBy,verifyBy,gateBy,problem,bad,good,shortcut,consequence,proof1,proof2]=r;
  const id=stage.id+'-'+String(index+1).padStart(2,'0');
  const reqs=[[proof1,fixBy],[proof2,verifyBy]].map(([label,provider],i)=>{
   const f=add(stage,[provider,zone,zones.find(z=>z.id===zone)?.level||'ZZ','RP',companyMap[provider].discipline,'pdf',label],{state:'SHARED',evidenceFor:id,description:'Training evidence for '+id+': '+label+'. Receiving or accepting this item is simulated; no actual design/test approval.'});f.path=f.path.replace('03_PUBLISHED','02_SHARED');stage.fileIds.push(f.id);
   return {id:id+'-E'+(i+1),label,provider,fileId:f.id,check:i===0?'ตรวจขอบเขต revision และผลแก้ไขให้ตอบประเด็นนี้':'ตรวจ applicability และข้อยกเว้นโดยผู้รับผิดชอบที่ระบุ'};
  });
  const options=[{id:'proceed',text:bad,correct:false,reason:consequence+' ทางเลือกนี้ยังไม่มีผู้รับผิดชอบและหลักฐานที่ตอบประเด็น'},{id:'control',text:good,correct:true,reason:'แนวทางนี้ทำให้ตรวจ scope, baseline, ผู้ตัดสินใจ และหลักฐานได้ แต่ยังต้องรับหลักฐานและผ่าน gate ก่อนปิดประเด็น'},{id:'shortcut',text:shortcut,correct:false,reason:'เปลี่ยนป้าย ภาพ หรือวิธีจัดไฟล์ ไม่ได้พิสูจน์ว่าเงื่อนไขของข้อมูลหรือระบบถูกต้อง: '+consequence}];
  // Vary choice positions so the learner must read, not memorize a button position.
  const shift=(stages.indexOf(stage)+index)%3;options.push(...options.splice(0,shift));
  const issue={id,stage:stage.id,title,severity,zone,system:zone==='E01'||zone==='E02'?'Power / A-B':zone==='CHY'?'Cooling':zone==='NOC'?'Controls / information':'Multidiscipline',fixBy,verifyBy,gateBy,problem,consequence,options,requirements:reqs,
   relatedFiles:[...new Set([...stage.fileIds.filter(fid=>{const f=files.find(x=>x.id===fid);return !f.evidenceFor&&(f.zone===zone||f.zone==='SITE');}).slice(0,5),...reqs.map(x=>x.fileId)])],
   acceptanceScope:'รับการแก้ประเด็น '+id+' สำหรับ '+stage.purpose+' เท่านั้น ไม่รับรองทุกระบบหรืออนุญาตเริ่มงานจริง',
   conduct:{prevent:'กำหนดผู้รับผิดชอบ '+fixBy+' และ gate '+gateBy+' พร้อม baseline ของ '+stage.name,detect:'ทบทวน '+proof1+' เทียบ '+proof2+' และตรวจผู้รับผลกระทบ',respond:'Hold เฉพาะ scope ที่ได้รับผลกระทบ บันทึก disposition แจ้งผู้รับ และยืนยันการแก้ไข/ทดสอบซ้ำตามที่แต่งตั้ง'}};
  issues.push(issue);stage.issueIds.push(id);
 });
}
// Stable dependency chain to make source/exchange/drawing/test/asset relationships inspectable.
for(let i=1;i<stages.length;i++)for(const id of stages[i].fileIds.filter(id=>!files.find(f=>f.id===id).evidenceFor).slice(0,3)){
 const file=files.find(f=>f.id===id);const prev=stages[i-1].fileIds.map(id=>files.find(f=>f.id===id)).find(f=>f.originator===file.originator&&!f.derivedFrom&&!f.evidenceFor)||files.find(f=>f.id===stages[i-1].fileIds[0]);
 file.dependencies.push(prev.id);
}
const assetSpecs=[
 ['UPS-A-01','UPS','E01','UPS-A','VUP'],['UPS-B-01','UPS','E02','UPS-B','VUP'],['UPS-A-02','UPS','E01','UPS-A','VUP'],['UPS-B-02','UPS','E02','UPS-B','VUP'],
 ['MSB-A-01','Switchboard','E01','ELE-A','ELS'],['MSB-B-01','Switchboard','E02','ELE-B','ELS'],
 ...[1,2,3,4].map(n=>['GEN-'+String(n).padStart(2,'0'),'Generator','GEN','GEN-SYS','VGE']),
 ...[1,2,3,4,5,6].map(n=>['CH-'+String(n).padStart(2,'0'),'Chiller','CHY','CHW-SYS','VCH']),
 ...[1,2,3,4].map(n=>['CRAH-DH1-'+String(n).padStart(2,'0'),'CRAH','DH1','COOL-DH1','MCS']),
 ['PMP-CHW-01','Pump','CHY','CHW-SYS','MCS'],['PMP-CHW-02','Pump','CHY','CHW-SYS','MCS'],['RACK-DH1-001','Rack','DH1','ICT-DH1','ICT'],['RACK-DH2-001','Rack','DH2','ICT-DH2','ICT']
];
function ifcGuid(n){const chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';let value=BigInt('0x0dca0000000000000000000000000000')+BigInt(n),s='';for(let i=0;i<22;i++){s=chars[Number(value%64n)]+s;value/=64n;}return s;}
const exactLayouts={
 'UPS-A-01':{x:4.0,y:11.6,w:2.4,d:1.2,h:2.0,plinthH:0.15,clearF:1.5,clearR:0.6,clearT:0.8,weightKg:2850,heatKW:28,gridRef:'B-03'},
 'UPS-A-02':{x:7.4,y:11.6,w:2.4,d:1.2,h:2.0,plinthH:0.15,clearF:1.5,clearR:0.6,clearT:0.8,weightKg:2850,heatKW:28,gridRef:'C-03'},
 'MSB-A-01':{x:11.0,y:11.6,w:3.2,d:1.1,h:2.2,plinthH:0.15,clearF:1.8,clearR:0.8,clearT:0.9,weightKg:3400,heatKW:16,gridRef:'D-03'},
 'UPS-B-01':{x:21.0,y:11.6,w:2.4,d:1.2,h:2.0,plinthH:0.15,clearF:1.5,clearR:0.6,clearT:0.8,weightKg:2850,heatKW:28,gridRef:'F-03'},
 'UPS-B-02':{x:24.4,y:11.6,w:2.4,d:1.2,h:2.0,plinthH:0.15,clearF:1.5,clearR:0.6,clearT:0.8,weightKg:2850,heatKW:28,gridRef:'G-03'},
 'MSB-B-01':{x:28.0,y:11.6,w:3.2,d:1.1,h:2.2,plinthH:0.15,clearF:1.8,clearR:0.8,clearT:0.9,weightKg:3400,heatKW:16,gridRef:'H-03'},
 'GEN-01':{x:2.0,y:18.8,w:2.6,d:3.6,h:2.6,plinthH:0.30,clearF:1.2,clearR:1.0,clearT:1.5,weightKg:18500,heatKW:110,gridRef:'A-04'},
 'GEN-02':{x:5.2,y:18.8,w:2.6,d:3.6,h:2.6,plinthH:0.30,clearF:1.2,clearR:1.0,clearT:1.5,weightKg:18500,heatKW:110,gridRef:'B-04'},
 'GEN-03':{x:8.4,y:18.8,w:2.6,d:3.6,h:2.6,plinthH:0.30,clearF:1.2,clearR:1.0,clearT:1.5,weightKg:18500,heatKW:110,gridRef:'C-04'},
 'GEN-04':{x:11.6,y:18.8,w:2.6,d:3.6,h:2.6,plinthH:0.30,clearF:1.2,clearR:1.0,clearT:1.5,weightKg:18500,heatKW:110,gridRef:'D-04'},
 'CH-01':{x:21.8,y:18.5,w:3.2,d:1.6,h:2.3,plinthH:0.25,clearF:1.4,clearR:0.8,clearT:1.2,weightKg:9200,heatKW:18,gridRef:'F-04'},
 'CH-02':{x:25.6,y:18.5,w:3.2,d:1.6,h:2.3,plinthH:0.25,clearF:1.4,clearR:0.8,clearT:1.2,weightKg:9200,heatKW:18,gridRef:'G-04'},
 'CH-03':{x:29.4,y:18.5,w:3.2,d:1.6,h:2.3,plinthH:0.25,clearF:1.4,clearR:0.8,clearT:1.2,weightKg:9200,heatKW:18,gridRef:'H-04'},
 'CH-04':{x:21.8,y:20.8,w:3.2,d:1.6,h:2.3,plinthH:0.25,clearF:1.4,clearR:0.8,clearT:1.2,weightKg:9200,heatKW:18,gridRef:'F-05'},
 'CH-05':{x:25.6,y:20.8,w:3.2,d:1.6,h:2.3,plinthH:0.25,clearF:1.4,clearR:0.8,clearT:1.2,weightKg:9200,heatKW:18,gridRef:'G-05'},
 'CH-06':{x:29.4,y:20.8,w:3.2,d:1.6,h:2.3,plinthH:0.25,clearF:1.4,clearR:0.8,clearT:1.2,weightKg:9200,heatKW:18,gridRef:'H-05'},
 'PMP-CHW-01':{x:33.1,y:18.6,w:1.4,d:1.2,h:1.5,plinthH:0.20,clearF:1.0,clearR:0.6,clearT:0.8,weightKg:1150,heatKW:6,gridRef:'I-04'},
 'PMP-CHW-02':{x:33.1,y:20.8,w:1.4,d:1.2,h:1.5,plinthH:0.20,clearF:1.0,clearR:0.6,clearT:0.8,weightKg:1150,heatKW:6,gridRef:'I-05'},
 'CRAH-DH1-01':{x:3.8,y:3.6,w:2.0,d:1.1,h:2.1,plinthH:0.60,clearF:1.4,clearR:0.5,clearT:0.6,weightKg:1450,heatKW:4,gridRef:'B-01'},
 'CRAH-DH1-02':{x:6.5,y:3.6,w:2.0,d:1.1,h:2.1,plinthH:0.60,clearF:1.4,clearR:0.5,clearT:0.6,weightKg:1450,heatKW:4,gridRef:'C-01'},
 'CRAH-DH1-03':{x:9.2,y:3.6,w:2.0,d:1.1,h:2.1,plinthH:0.60,clearF:1.4,clearR:0.5,clearT:0.6,weightKg:1450,heatKW:4,gridRef:'C-02'},
 'CRAH-DH1-04':{x:11.9,y:3.6,w:2.0,d:1.1,h:2.1,plinthH:0.60,clearF:1.4,clearR:0.5,clearT:0.6,weightKg:1450,heatKW:4,gridRef:'D-02'},
 'RACK-DH1-001':{x:7.8,y:6.8,w:2.4,d:1.2,h:2.2,plinthH:0.60,clearF:1.2,clearR:1.0,clearT:0.5,weightKg:1200,heatKW:12,gridRef:'C-02'},
 'RACK-DH2-001':{x:24.8,y:6.8,w:2.4,d:1.2,h:2.2,plinthH:0.60,clearF:1.2,clearR:1.0,clearT:0.5,weightKg:1200,heatKW:12,gridRef:'G-02'}
};
const zoneDatumSpecs={
 SITE:{egl:-0.80,ssl:-0.60,ffl:-0.60,ceilingH:null,soffit:0.00,roomH:0.20,floorSystem:'Compacted Subgrade + Main Frontage Highway (-0.70m), Ring Road (-0.60m) & Podium Apron (±0.00m)'},
 DH1:{egl:-0.80,ssl:0.00,ffl:0.60,ceilingH:4.20,soffit:4.80,roomH:4.80,floorSystem:'600mm Heavy-Duty Raised Access Floor (+0.60m FFL) over ±0.00m SSL'},
 DH2:{egl:-0.80,ssl:0.00,ffl:0.60,ceilingH:4.20,soffit:4.80,roomH:4.80,floorSystem:'600mm Heavy-Duty Raised Access Floor (+0.60m FFL) over ±0.00m SSL'},
 E01:{egl:-0.80,ssl:0.00,ffl:0.15,ceilingH:3.90,soffit:4.80,roomH:4.80,floorSystem:'Epoxy Slab ±0.00m SSL + 150mm Equipment Plinth (+0.15m FFL) + Cable Trench'},
 E02:{egl:-0.80,ssl:0.00,ffl:0.15,ceilingH:3.90,soffit:4.80,roomH:4.80,floorSystem:'Epoxy Slab ±0.00m SSL + 150mm Equipment Plinth (+0.15m FFL) + Cable Trench'},
 GEN:{egl:-0.80,ssl:0.00,ffl:0.30,ceilingH:4.50,soffit:4.80,roomH:4.80,floorSystem:'Acoustic Yard Slab ±0.00m SSL + 300mm Anti-Vibration Inertia Plinth (+0.30m FFL)'},
 CHY:{egl:-0.80,ssl:0.00,ffl:0.25,ceilingH:null,soffit:4.80,roomH:4.80,floorSystem:'Bunded Plant Slab ±0.00m SSL + 250mm Concrete Plinth & Spring Isolators (+0.25m FFL)'},
 MMR:{egl:-0.80,ssl:0.00,ffl:0.30,ceilingH:3.50,soffit:4.80,roomH:4.80,floorSystem:'300mm Telecom Access Floor (+0.30m FFL) over ±0.00m SSL with Diverse Vault Entry'},
 NOC:{egl:-0.80,ssl:3.60,ffl:3.75,ceilingH:6.35,soffit:6.70,roomH:3.10,floorSystem:'L01 Mezzanine Deck (+3.60m SSL over Security Lobby) + 150mm Console Floor (+3.75m FFL, 2.60m Clear)'},
 OFF:{egl:-0.80,ssl:3.60,ffl:3.75,ceilingH:6.35,soffit:6.70,roomH:3.10,floorSystem:'L01 Office Deck (+3.60m SSL over Loading Dock) + 150mm Access Floor (+3.75m FFL, 2.60m Clear)'},
 RF:{egl:-0.80,ssl:4.80,ffl:4.95,ceilingH:null,soffit:7.20,roomH:2.40,floorSystem:'Main Roof Structural Slab (+4.80m SSL) + Waterproofing & 150mm Floating Plinth (+4.95m FFL)'}
};
const assets=assetSpecs.map(([tag,type,zone,system,supplier],i)=>{
 const zObj=zones.find(z=>z.id===zone);
 const zDatum=zoneDatumSpecs[zone]||zoneDatumSpecs.E01;
 const lay=exactLayouts[tag]||{x:zObj.x+2,y:zObj.y+1.5,w:2.2,d:1.3,h:2.0,plinthH:0.15,clearF:1.5,clearR:0.6,clearT:0.8,weightKg:1500,heatKW:10,gridRef:'B-02'};
 const baseSsl=zDatum.ssl;
 const ffl=Number((baseSsl+lay.plinthH).toFixed(2));
 const topElev=Number((ffl+lay.h).toFixed(2));
 const manual=files.find(f=>f.stage==='HOV'&&f.ext==='pdf'&&(f.originator===supplier||f.originator==='GCC'));
 const model=files.find(f=>['ASB','SHP','PRC','SD'].includes(f.stage)&&['rvt','ifc','step','rfa'].includes(f.ext)&&f.originator===supplier)||files.find(f=>f.stage==='ASB'&&f.ext==='ifc');
 const canonical={tag,serial:'DEMO-'+supplier+'-'+String(i+1).padStart(4,'0'),manufacturer:companyMap[supplier].name,model:type.toUpperCase().replaceAll(' ','-')+'-DEMO',zone,system,warrantyStart:'2027-10-01',manual:manual.id};
 const submitted={...canonical};if(i===1)submitted.serial='';if(i===10)submitted.warrantyStart='';if(i===20)submitted.tag='PMP-CHW-02';if(i===5)submitted.manual='';
 const designer=['UPS','Switchboard','Generator'].includes(type)?'ELD':type==='Rack'?'ICT':'MCD';
 const installer=designer==='ELD'?'ELS':designer==='MCD'?'MCS':'ICT';
 const candidate=(stage,owner)=>files.filter(f=>f.stage===stage&&f.originator===owner&&!f.evidenceFor&&!f.derivedFrom&&f.state!=='ARCHIVED').sort((a,b)=>(b.zone===zone)-(a.zone===zone))[0];
 const sldFile=(candidate('DD',designer)||candidate('SD',designer)).id;
 const shopFile=(candidate('SHP',installer)||candidate('SHP','GCC')).id;
 const asbFile=(candidate('ASB',installer)||candidate('ASB','GCC')||model).id;
 const cmmsFile=files.find(f=>f.stage==='FM'&&f.originator==='OPS')?.id;
 return {id:'AS'+String(i+1).padStart(3,'0'),objectId:'OBJ-AS'+String(i+1).padStart(3,'0'),tag,type,zone,system,supplier,ifcGuid:ifcGuid(i+100),modelFile:model.id,modelRevision:model.revision,canonical,submitted,
   maintainable:type!=='Rack',parentSystem:system,location:zObj.name,criticality:type==='UPS'||type==='Switchboard'?'Critical':'Project-defined',
   testFile:files.find(f=>f.stage==='CXC'&&f.ext==='pdf'&&(f.zone===zone||f.zone==='SITE')).id,
   cmmsKey:'DC01/AS'+String(i+1).padStart(3,'0'),
   telemetryPoint:(['UPS','Switchboard','Generator'].includes(type)?'EPMS.':'BMS.')+tag.replaceAll('-','_')+'.'+(type==='UPS'?'ActivePower':'DemoValue'),
   spatial:{
    x:lay.x,y:lay.y,z:ffl,egl:zDatum.egl,ssl:baseSsl,ffl,topElev,ceilingH:zDatum.ceilingH,soffit:zDatum.soffit,plinthH:lay.plinthH,
    w:lay.w,d:lay.d,h:lay.h,
    clearanceFront:lay.clearF,clearanceRear:lay.clearR,clearanceTop:lay.clearT,
    gridRef:lay.gridRef,weightKg:lay.weightKg,heatRejectionKW:lay.heatKW,
    mounting:zDatum.floorSystem,
    Note:'Illustrative coordinates and dimensions; no engineering, clearance, capacity or compliance verification.'
   },
   relations:[
     {relationType:'Authoring / Vendor Model',source:supplier,fileId:model.id,baselineRev:files.find(f=>f.id===model.id).revision,scope:'Component geometry & interface',verificationStatus:'Requires multidiscipline check'},
     {relationType:'Design Diagram / Basis',source:type==='Chiller'||type==='Pump'||type==='CRAH'?'MCD':'ELD',fileId:sldFile,baselineRev:files.find(f=>f.id===sldFile).revision,scope:'System topology & rating',verificationStatus:'Subject to DD consistency gate'},
     {relationType:'Shop / Coordination',source:type==='Chiller'||type==='Pump'||type==='CRAH'?'MCS':'ELS',fileId:shopFile,baselineRev:files.find(f=>f.id===shopFile).revision,scope:'Installation & service clearance',verificationStatus:'Clash-free does not prove A/B intent'},
     {relationType:'Commissioning / Test',source:'CXP',fileId:files.find(f=>f.stage==='CXC'&&f.ext==='pdf'&&!f.evidenceFor&&(type==='UPS'?f.title.startsWith('UPS functional'):type==='Chiller'?f.title.startsWith('Chiller startup'):f.title.startsWith('Integrated system test'))).id,baselineRev:2,scope:'Functional & integrated test',verificationStatus:'Requires config & exception check'},
     {relationType:'Verified Record / As-Built',source:'GCC',fileId:asbFile,baselineRev:files.find(f=>f.id===asbFile).revision,scope:'Installed verification',verificationStatus:'Must match field changes & nameplate'},
     {relationType:'O&M / Warranty',source:supplier,fileId:manual.id,baselineRev:manual.revision,scope:'Maintenance & warranty start',verificationStatus:'Find-and-use by AssetID required'},
     {relationType:'CMMS / FM Register',source:'OPS',fileId:cmmsFile,baselineRev:files.find(f=>f.id===cmmsFile).revision,scope:'Operational change tracking',verificationStatus:'Persistent AssetID across module swaps'}
   ],
   sourceNote:'Verified receiving/nameplate reference is fictional. Blank/duplicate values in submitted data are intentional teaching defects.'};
});
for(const a of assets){
 const designer=['UPS','Switchboard','Generator'].includes(a.type)?'ELD':a.type==='Rack'?'ICT':'MCD';
 const specialist=designer==='ELD'?'ELS':designer==='MCD'?'MCS':'ICT';
 const preferred={BRF:'OWN',CON:designer,SD:designer,DD:designer,TND:designer,PRM:designer,PRC:a.supplier,SHP:specialist,CST:specialist,CXC:'CXP',ASB:specialist,HOV:a.supplier,FM:'OPS',DTW:'DTI'};
 a.modelRevision=files.find(f=>f.id===a.modelFile).revision;
 a.relations.forEach(rel=>{
  const f=files.find(f=>f.id===rel.fileId);
  rel.source=f.originator;rel.baselineRev=f.revision;
  rel.verificationStatus='Illustrative package association; confirm AssetID, system, zone and approved revision before use';
  rel.scope+=' (package context; not verified asset-specific evidence)';
  if(rel.relationType==='Verified Record / As-Built')rel.relationType='Record / As-Built candidate';
 });
 a.thread=stages.map(s=>{
  const candidates=s.fileIds.map(id=>files.find(f=>f.id===id)).filter(f=>!f.evidenceFor&&f.state!=='ARCHIVED'&&!f.derivedFrom);
  const score=f=>(f.originator===preferred[s.id]?20:0)+(f.zone===a.zone?8:f.zone==='SITE'?3:0)+(f.title.toLowerCase().includes(a.type.toLowerCase())?10:0);
  const best=[...candidates].sort((x,y)=>score(y)-score(x))[0];
  if(!best.assetRefs)best.assetRefs=[];best.assetRefs.push(a.id);
  return {stage:s.id,fileId:best.id,note:'Illustrative information-control relationship for '+a.tag+'; verify actual asset applicability in a real package.'};
 });
}
const exemplar=add(stages.find(s=>s.id==='ASB'),['IMT','SITE','ZZ','M3','X','ifc','Campus asset identity teaching model / proxy exchange'],{state:'SHARED',purpose:'education / asset identity exchange only',status:'TRAINING PROXY',description:'A standalone campus-wide IFC4 teaching example with 24 proxy assets. Not derived from the native record models listed in this register.'});
stages.find(s=>s.id==='ASB').fileIds.push(exemplar.id);exemplar.download='samples/'+exemplar.name;exemplar.sampleNote='Actual minimal IFC4 teaching model: 24 campus-wide proxy asset boxes with tags and properties, not a detailed coordinated Revit export.';
const mapping=files.find(f=>f.stage==='DTW'&&f.ext==='json'&&f.originator==='DTI');mapping.download='samples/'+mapping.name;
const telemetry=files.find(f=>f.stage==='DTW'&&f.ext==='json'&&f.title.startsWith('Synthetic'));telemetry.download='samples/'+telemetry.name;
const bcf=files.find(f=>f.ext==='bcfzip');bcf.download='samples/'+bcf.name;bcf.sampleNote='Actual minimal BCF issue archive; schema/interoperability testing is recorded in validation notes.';
const casebook=add(stages[0],['IMT','SITE','ZZ','RP','X','pdf','DC01 lifecycle evidence casebook / 14-stage training reference'],{state:'PUBLISHED',purpose:'education / case review only',status:'TRAINING REFERENCE',description:'14-stage fictional casebook: scope, interface risks, evidence and acceptance boundaries. Not a signed approval or field test procedure.'});
casebook.download='samples/'+casebook.name;casebook.sampleNote='Actual 15-page PDF: 14-stage training casebook plus sources, one worked information-control example per stage. No construction authority or real test procedure.';stages[0].fileIds.push(casebook.id);
for(const f of files){f.dependencyVersions=Object.fromEntries([...new Set([...(f.derivedFrom?[f.derivedFrom]:[]),...f.dependencies])].map(id=>[id,files.find(x=>x.id===id).revision]));}
const scene={
 schema:'DC01-scene-manifest-v1',
 modelRevision:2,
 dataBaseline:'R02',
 coordinateNote:'Conceptual software-rendered 3D teaching scene in metres, local assumed datum. Not loaded from the IFC/native models. Dimensions, routes, structural support and access are illustrative and require engineering verification.',
 benchmark:{id:'DC01-BM01',x:1.0,y:1.0,z:0.0,egl:-0.80,roadLevel:-0.60,elevationMasl:'Local teaching datum only; no surveyed MSL reference',localDatum:'±0.000 m = L00 Structural Slab Level (SSL) · EGL -0.80m · Ring Road -0.60m · Frontage Highway -0.70m',northAngle:'0.0° local project axis; True North not surveyed'},
 siteMasterplan:{
  propertyBoundary:{x:-4,y:-4,w:45,d:41.5,egl:-0.80,fenceHeight:2.40,note:'Perimeter Security Fence & Property Line (45m × 41.5m conceptual campus plot)'},
  frontageRoad:{id:'RD-FRONTAGE',name:'Main Public Frontage Highway (Illustrative Road)',x:-6.0,y:38.0,w:49.0,d:5.6,z:-0.70,entryX:13.5,entryW:6.0,note:'Public highway (-0.70m FFL) with median island, curb, and entry/exit throat into Sally Port Gatehouse'},
  monumentSign:{id:'SIGN-DC01',title:'SIAM EDGE DC01',subtitle:'12 MW IT · ILLUSTRATIVE TEACHING CAMPUS',x:6.2,y:35.2,z:-0.60,w:5.6,d:0.65,h:1.85,baseH:0.45,color:'#173d34',accent:'#ffcf56'},
  buildingPodium:{x:0.5,y:2.0,w:35.0,d:27.5,zBase:-0.60,zTop:0.00,note:'Reinforced Concrete Building Podium & Retaining Edge (-0.60m Road to ±0.00m SSL)'},
  baseVolumes:[
   {id:'LOBBY-L00',name:'Main Security Lobby, Badging & Guard Control (L00 Base under NOC)',parentZone:'NOC',level:'00',x:3.0,y:25.0,z:0.00,w:9.0,d:4.0,h:3.60,ffl:0.10,color:'#cbd8ce',kind:'lobby'},
   {id:'DOCK-L00',name:'Loading Dock, Receiving & Staging Bay (L00 Base under OFF)',parentZone:'OFF',level:'00',x:25.0,y:25.0,z:0.00,w:10.0,d:4.0,h:3.60,ffl:1.20,dockHeight:1.20,bays:2,canopyDepth:1.6,color:'#cfdad2',kind:'loadingDock'}
  ],
  roads:[
   {id:'RD-SOUTH',name:'Main South Internal Logistics & Docking Road (Illustrative Logistics Route)',x:-3.5,y:30.2,w:44.0,d:3.6,z:-0.60,direction:'two-way'},
   {id:'RD-WEST',name:'West Service & Generator Fuel Loop',x:-3.5,y:-2.5,w:3.6,d:36.3,z:-0.60,direction:'north-south'},
   {id:'RD-NORTH',name:'North Fire Engine & Maintenance Access Road',x:-3.5,y:-2.5,w:44.0,d:3.6,z:-0.60,direction:'east-west'},
   {id:'RD-EAST',name:'East Chiller Crane & Plant Service Road',x:36.9,y:-2.5,w:3.6,d:36.3,z:-0.60,direction:'north-south'},
   {id:'RD-ENTRY',name:'Main Entrance Driveway & Sally Port Throat',x:13.5,y:33.8,w:6.0,d:4.2,z:-0.65,direction:'north-south'}
  ],
  apronsAndRamps:[
   {id:'GATE-01',name:'Main Security Gatehouse & Vehicle Airlock (Sally Port)',x:13.5,y:33.8,w:6.0,d:3.2,z:-0.60,h:3.10,kind:'gatehouse'},
   {id:'APRON-DOCK',name:'Heavy-Duty Concrete Truck Backing Apron & Dock Levelers (Loading Dock)',x:25.0,y:29.0,w:10.0,d:1.2,zBase:-0.60,zTop:0.60,kind:'dockApron'},
   {id:'RAMP-GEN',name:'West Heavy Equipment & Fuel Unloading Ramp (-0.60m → ±0.00m)',x:0.1,y:19.0,w:1.4,d:4.0,zBase:-0.60,zTop:0.00,kind:'ramp'},
   {id:'RAMP-CHY',name:'East Chiller Rigging & Loading Bay Apron (-0.60m → ±0.00m)',x:35.5,y:19.0,w:1.4,d:4.0,zBase:-0.60,zTop:0.00,kind:'ramp'},
   {id:'RAMP-MAIN',name:'South Operations Lobby Entrance Steps & Accessible Ramp',x:5.5,y:29.0,w:4.0,d:1.2,zBase:-0.60,zTop:0.00,kind:'ramp'}
  ],
  utilityConnections:[
   {id:'UTIL-MEA-A',name:'22kV Utility Substation Feeder A (West Property Vault)',x:-0.8,y:39.5,z:-1.15,targetZone:'E01',color:'#e0a326'},
   {id:'UTIL-MEA-B',name:'22kV Utility Substation Feeder B (East Diverse Vault)',x:38.2,y:39.5,z:-1.15,targetZone:'E02',color:'#3891d6'},
   {id:'UTIL-ISP-1',name:'Carrier Fiber PoP-1 Entry Vault (South-West Diverse Entry)',x:1.5,y:39.5,z:-0.95,targetZone:'MMR',color:'#9b6fe0'},
   {id:'UTIL-ISP-2',name:'Carrier Fiber PoP-2 Entry Vault (South-East Illustrative Entry)',x:35.5,y:39.5,z:-0.95,targetZone:'MMR',color:'#c77dff'}
  ],
  ductBanks:[
   {id:'DB-PWR-A',name:'22kV Path A Concrete-Encased Duct Bank (West Entry → E01)',system:'ELE-A',targetZone:'E01',centerlineElev:-1.15,conduits:'4×2 Way Ø160mm HDPE in Red-Dyed Concrete',separationNote:'Illustrative separate entries; whole-route clearance, common-mode failures and maintainability have not been assessed',color:'#e0a326',points:[[-0.8,39.5,-1.15],[-0.8,34.0,-1.15],[-0.8,12.8,-1.15],[12.6,12.8,-1.15],[12.6,12.8,0.15]]},
   {id:'DB-PWR-B',name:'22kV Path B Concrete-Encased Duct Bank (East Entry → E02)',system:'ELE-B',targetZone:'E02',centerlineElev:-1.15,conduits:'4×2 Way Ø160mm HDPE in Blue-Marked Concrete',separationNote:'Illustrative separate entries; whole-route clearance, common-mode failures and maintainability have not been assessed',color:'#3891d6',points:[[38.2,39.5,-1.15],[38.2,34.0,-1.15],[38.2,12.8,-1.15],[29.6,12.8,-1.15],[29.6,12.8,0.15]]},
   {id:'DB-ICT-A',name:'Carrier Fiber Duct Bank A (West PoP-1 → MMR West Entry)',system:'ICT-A',targetZone:'MMR',centerlineElev:-0.95,conduits:'2×2 Way Ø110mm HDPE Sub-Ducts',separationNote:'Illustrative separate entries; whole-route clearance, common-mode failures and maintainability have not been assessed',color:'#9b6fe0',points:[[1.5,39.5,-0.95],[1.5,34.5,-0.95],[1.5,27.8,-0.95],[15.5,27.8,-0.95],[15.5,27.8,0.30]]},
   {id:'DB-ICT-B',name:'Carrier Fiber Duct Bank B (East PoP-2 → MMR East Entry)',system:'ICT-B',targetZone:'MMR',centerlineElev:-0.95,conduits:'2×2 Way Ø110mm HDPE Sub-Ducts',separationNote:'Illustrative separate entries; whole-route clearance, common-mode failures and maintainability have not been assessed',color:'#c77dff',points:[[35.5,39.5,-0.95],[35.5,34.5,-0.95],[21.5,34.5,-0.95],[21.5,27.8,-0.95],[21.5,27.8,0.30]]}
  ],
  manholes:[
   {id:'MH-EA1',name:'MV Power Draw Pit A1',x:-0.8,y:34.0,z:-1.15,path:'A',color:'#e0a326'},
   {id:'MH-EA2',name:'MV Power Draw Pit A2 (E01 Lead-in)',x:-0.8,y:12.8,z:-1.15,path:'A',color:'#e0a326'},
   {id:'MH-EB1',name:'MV Power Draw Pit B1',x:38.2,y:34.0,z:-1.15,path:'B',color:'#3891d6'},
   {id:'MH-EB2',name:'MV Power Draw Pit B2 (E02 Lead-in)',x:38.2,y:12.8,z:-1.15,path:'B',color:'#3891d6'},
   {id:'MH-TW1',name:'Telecom Manhole W1 (Carrier 1)',x:1.5,y:34.5,z:-0.95,path:'ICT-1',color:'#9b6fe0'},
   {id:'MH-TW2',name:'Telecom Manhole W2 (MMR West Vault)',x:1.5,y:27.8,z:-0.95,path:'ICT-1',color:'#9b6fe0'},
   {id:'MH-TE1',name:'Telecom Manhole E1 (Carrier 2)',x:35.5,y:34.5,z:-0.95,path:'ICT-2',color:'#c77dff'},
   {id:'MH-TE2',name:'Telecom Manhole E2 (MMR East Vault)',x:21.5,y:34.5,z:-0.95,path:'ICT-2',color:'#c77dff'}
  ]
 },
 levels:[
  {id:'SITE',code:'SITE / EGL',name:'External Ground, Frontage Highway & Duct Banks',egl:-0.80,ssl:-0.60,ffl:-0.60,raisedFloorVoid:0.00,ceilingH:null,soffit:0.00,clearHeight:0.00,note:'Duct bundle CL -1.15m · EGL -0.80m · Frontage Highway -0.70m · Ring Road FFL -0.60m · Podium ±0.00m'},
  {id:'00',code:'L00',name:'Ground / Main Technical, Data Halls, Lobby & Loading Dock',egl:-0.80,ssl:0.00,ffl:0.60,raisedFloorVoid:0.60,ceilingH:4.20,soffit:4.80,clearHeight:3.60,note:'SSL ±0.00m · Data Hall FFL +0.60m · Loading Dock Platform +1.20m · Ceiling +4.20m · Structural Soffit +4.80m'},
  {id:'01',code:'L01',name:'Upper Control / NOC & Administration Office Mezzanine',egl:-0.80,ssl:3.60,ffl:3.75,raisedFloorVoid:0.15,ceilingH:6.35,soffit:6.70,clearHeight:2.60,note:'SSL +3.60m (directly above L00 Lobby & Loading Dock) · Access Floor FFL +3.75m · Ceiling +6.35m (2.60m Clear) · Soffit +6.70m'},
  {id:'RF',code:'RF',name:'Main Roof Plant / Overhead Gantry Level',egl:-0.80,ssl:4.80,ffl:4.95,raisedFloorVoid:0.15,ceilingH:null,soffit:7.20,clearHeight:2.25,note:'Main Roof Slab SSL +4.80m · Floating Plinth FFL +4.95m · Acoustic Screen Top +7.20m'}
 ],
 grids:{
  x:[{label:'A',pos:1},{label:'B',pos:5},{label:'C',pos:10},{label:'D',pos:15},{label:'E',pos:19},{label:'F',pos:24},{label:'G',pos:29},{label:'H',pos:34},{label:'I',pos:36}],
  y:[{label:'01',pos:3},{label:'02',pos:10},{label:'03',pos:15},{label:'04',pos:23},{label:'05',pos:29},{label:'06',pos:35}]
 },
 routes:[
  {id:'RT-PWR-A',name:'Electrical Path A Busway / Tray (4000A)',system:'UPS-A / ELE-A',zone:'E01',targetZone:'DH1',elevationLabel:'CL +3.45m (BOP +3.25m)',color:'#e0a326',points:[[5.2,20.5,3.45],[5.2,12.2,3.45],[12.6,12.2,3.45],[12.6,6.8,3.45],[7.8,6.8,3.45]],relatedStages:['CON','SD','DD','SHP']},
  {id:'RT-PWR-B',name:'Electrical Path B Busway / Tray (4000A)',system:'UPS-B / ELE-B',zone:'E02',targetZone:'DH2',elevationLabel:'CL +3.75m (BOP +3.55m)',color:'#3891d6',points:[[11.6,20.5,3.75],[11.6,16.5,3.75],[22.2,16.5,3.75],[22.2,12.2,3.75],[29.6,12.2,3.75],[29.6,6.8,3.75],[24.8,6.8,3.75]],relatedStages:['CON','SD','DD','SHP']},
  {id:'RT-CHW-M',name:'Chilled Water Supply/Return Header (DN300)',system:'CHW-SYS',zone:'CHY',targetZone:'DH1',elevationLabel:'BOP +2.95m / Underfloor +0.30m',color:'#28b0a6',points:[[33.8,19.8,2.95],[18.0,19.8,2.95],[18.0,4.2,2.95],[3.8,4.2,2.95],[18.0,4.2,2.95],[26.0,4.2,2.95]],relatedStages:['CON','SD','DD','SHP','CST']},
  {id:'RT-ICT-D',name:'Diverse Carrier & Control Fibre Pathway',system:'ICT-DH1 / ICT-DH2',zone:'MMR',targetZone:'NOC',elevationLabel:'Tray BOP +3.35m → Riser → L01 +5.20m',color:'#9b6fe0',points:[[18.5,27.0,3.35],[7.5,27.0,3.35],[7.5,27.0,5.20],[7.5,27.0,3.35],[18.5,27.0,3.35],[18.5,6.8,3.35],[7.8,6.8,3.35],[18.5,6.8,3.35],[26.0,6.8,3.35]],relatedStages:['SD','DD','DTW']}
 ],
 zoneVolumes:zones.map(z=>{
  const zd=zoneDatumSpecs[z.id]||zoneDatumSpecs.E01;
  // Share the same footprint with the zoning diagram; roof overlaps lower levels.
  const x3d=z.x;
  const y3d=z.y;
  const d3d=z.h;
  return {
   id:'VOL-'+z.id,zoneId:z.id,name:z.name,level:z.level,lead:z.lead,
   x:x3d,y:y3d,z:zd.ssl,egl:zd.egl,ssl:zd.ssl,ffl:zd.ffl,ceilingH:zd.ceilingH,soffit:zd.soffit,
   w:z.w,d:d3d,h:zd.roomH,floorSystem:zd.floorSystem,
   fireRating:'Illustrative compartment only; fire strategy and rating not verified',
   category:z.id.startsWith('E')||z.id==='GEN'?'power':z.id==='CHY'?'cooling':z.id==='DH1'||z.id==='DH2'?'hall':'support'
  };
 })
};
scene.serviceDetail=require('./build-services.cjs')({assets,files,scene});
const data={version:'2.0.0',project:{id:'DC01',name:'SIAM EDGE / Data Center',subtitle:'From first requirement to trusted operational data',itLoadMW:12,halls:2,racksPerHall:500,averageRackKW:12,
  assumptions:['12 MW คือ illustrative IT load: 2 × 500 × 12 kW; ไม่ใช่ utility/facility demand หรือขนาดออกแบบที่ตรวจแล้ว','A/B เป็นเส้นทางเชิงแนวคิด ไม่อ้างว่าระบบได้ Tier rating, certification หรือ redundancy performance ใด','6 chiller objects เป็น inventory สมมติ ไม่พิสูจน์ capacity, duty/standby หรือ N+1','Master case แสดงหลายช่วงเวลาใน snapshot เดียว ไฟล์ที่อยู่คนละ stage ไม่ใช่ฉบับที่มีผลพร้อมกันทั้งหมด','Permit, tender, procurement และ phased construction อาจซ้อนกัน ต้องออกตาม package ไม่ใช่กด Next แล้วทุกฝ่ายเปลี่ยน phase พร้อมกัน'],
  disclaimer:'Fictional educational project. No real site, credentials, tenant information, permit approval, engineering certification or live ACC/OT connection.',
  coordinateBasis:'Project local metres; survey benchmark DC01-BM01 and levels are teaching assumptions; no real-world geolocation.'},
 companies,zones,stages,files,issues,assets,scene,sources,
 naming:{fields:['Project','Originator','Volume/System','Level/Location','Type','Role','Number'],project:'DC01',levels:{'00':'Ground/service floor','01':'Upper support/control floor',RF:'Roof',ZZ:'No single level / campus-wide'},types:{M3:'3D model / geometric data',CM:'Coordination/federation',DR:'Drawing',RP:'Report / narrative',SH:'Schedule / structured register',SP:'Specification',OM:'Operations manual',OB:'Object / family',IS:'Issue exchange'},roles:{A:'Architecture',S:'Structure',E:'Electrical',M:'Mechanical',P:'Public health',F:'Fire / life safety',C:'Civil',T:'ICT',Y:'Security',B:'Controls / BMS',Q:'Commercial',O:'Owner / Operations',X:'Cross-discipline / information management',V:'Survey'},notes:'Codes are a project-defined educational register, not ISO-mandated codes. Revision, status, classification and stage are metadata, not extra filename fields.'},
 samples:{ifc:exemplar.id,bcf:bcf.id,mapping:mapping.id,telemetry:telemetry.id,casebook:casebook.id,bundle:'samples/DC01-learning-exchanges.zip'},
 twin:{asOf:'2026-10-21T09:00:00+07:00',freshnessSeconds:120,unit:'kW',source:'Synthetic EPMS export; no real endpoint',cases:[{id:'normal',name:'ปกติ / valid sample',asset:'UPS-A-01',sourceAsset:'UPS-A-01',value:325,unit:'kW',quality:'GOOD',ageSeconds:20},{id:'misbound',name:'ชื่อถูก แต่ source ผิดเครื่อง',asset:'UPS-A-01',sourceAsset:'UPS-B-01',value:325,unit:'kW',quality:'GOOD',ageSeconds:20},{id:'stale',name:'ค่าค้าง 30 นาที',asset:'UPS-A-01',sourceAsset:'UPS-A-01',value:325,unit:'kW',quality:'GOOD',ageSeconds:1800},{id:'badunit',name:'หน่วยผิด / W แทน kW',asset:'UPS-A-01',sourceAsset:'UPS-A-01',value:325,unit:'W',quality:'GOOD',ageSeconds:20},{id:'quality',name:'Quality ไม่ผ่าน',asset:'UPS-A-01',sourceAsset:'UPS-A-01',value:325,unit:'kW',quality:'BAD',ageSeconds:20}]}};
data.datasetId=require('node:crypto').createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0,20);
fs.writeFileSync(path.join(root,'data/datacenter.json'),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(root,'data/datacenter.js'),'/* Generated from datacenter-content.cjs by tools/build-datacenter.cjs */\nwindow.DC_DATA='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
console.log(JSON.stringify({stages:stages.length,companies:companies.length,zones:zones.length,files:files.length,issues:issues.length,assets:assets.length}));
