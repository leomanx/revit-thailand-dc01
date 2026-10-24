/* Room fit-out + preliminary performance briefs. All values are fictional project targets, not code minima. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DCBuilding=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const row=(criterion,target,verify,owner)=>({criterion,target,verify,owner,status:'ตั้งต้น / ยังไม่ตรวจ'});
 const specs={
  'AF-01':{name:'พื้นยกสำเร็จรูป / NOC, MMR, Office',material:'แผ่น steel-encapsulated calcium-sulphate หรือระบบเทียบเท่า พร้อม pedestal / stringer และผิวด้านที่ถอดเปลี่ยนได้',rows:[row('โมดูลและระดับ','600 × 600 mm; NOC/OFF FFL−SSL 150 mm, MMR 300 mm (รวมแผ่นพื้น ไม่ใช่ net void)','shop layout + สำรวจระดับ + ตรวจว่าช่องใต้พื้นพอสำหรับสายจริง','ARC / ICT'),row('แรงกดเฉพาะจุด','ตั้งเป้า 3 kN ที่จุดวิกฤตของระบบทั้งชุด สำหรับ support rooms เท่านั้น','รายงานทดสอบที่ระบุวิธี/หัวกด/ช่วงรองรับ; เทียบขา console และ rack จริง','STR / ICT'),row('การขนเปลี่ยน','ยังไม่กำหนด rolling load จนทราบรถเข็น น้ำหนัก และจำนวนรอบ','test report คนละกรณีกับ concentrated load; ตรวจเส้นทาง threshold และพื้นที่ยกแผ่น','STR / OPS'),row('ไฟฟ้าสถิต / bonding','TBC ตามอุปกรณ์และแผน ESD; ไม่ถือว่าพื้นทุกห้องต้องมีค่าเดียวกัน','ทดสอบระบบผิว+กาว+แผ่น+สายดินที่ติดตั้งจริง ตามวิธีที่ ELD ระบุ','ELD / ICT')]},
  'AF-DC':{name:'พื้น Data Hall / heavy equipment brief',material:'access floor 600 × 600 mm พร้อม understructure สำหรับ rack และทางขนเปลี่ยนโดยเฉพาะ; ห้ามใช้ support-room load แทน',rows:[row('ระดับในโมเดล','FFL−SSL 600 mm รวมระบบพื้น; net void ต้องหักแผ่นและโครง','coordinated section / level survey / underfloor services','ARC / MEP'),row('แรงและการโก่ง','TBC จาก rack weight, foot/castor contact และ allowable deflection; ไม่อนุมานจาก kg/m² อย่างเดียว','concentrated / ultimate / rolling tests พร้อมหัวกดและจำนวนรอบที่ตรง brief; STR ตรวจ slab/pedestal/seismic แยก','STR / ICT'),row('ESD / airflow / replacement','TBC จาก ESD program และ cooling topology; แผ่นเจาะรูไม่เท่ากับแผ่นทึบ','site resistance test + airflow/pressure study ถ้าใช้ underfloor air + replacement route','ELD / MCD / OPS')]},
  'YD-01':{name:'พื้นลาน plant / ภายนอก',material:'reinforced concrete พร้อม drainage/joints; coating เลือกแยกตาม fuel/chemical/UV และพื้นที่ใช้งาน ไม่ใช้ interior resin โดยอัตโนมัติ',rows:[row('แรง / vibration','TBC จาก equipment operating weight, dynamic forces และ lifting route','vendor reaction loads + anchor/inertia-base/isolation design','STR / MEP'),row('น้ำ / สารเคมี','ชนิด finish, bund/drainage และ spill strategy TBC ตามสารและความเสี่ยงจริง','chemical compatibility / UV / wet slip test และ drainage calculation','ARC / PHE / OPS'),row('ซ่อม / ความร้อน / เสียง','TBC ตาม vendor maintenance envelope, air/exhaust discharge และ acoustic limits','service/lifting study + thermal/acoustic assessment; เส้น walkway ไม่ใช่ proof of clearance','MCD / ELD / OPS')]},
  'FL-02':{name:'ผิว resin สำหรับพื้นที่บริการ',material:'resin 2–3 mm บน substrate ที่เตรียมผิว พร้อม compatible primer; ESD เป็นข้อเสนอแยก ไม่เกิดจากสีผิว',rows:[row('ความชื้นพื้น','ต้องไม่เกินขอบเขตที่ผู้ผลิตระบบยอมรับ; TBC ตาม substrate','ระบุวิธี RH/CM และขอบเขตที่เทียบกันได้ก่อนทดสอบ ห้ามใช้ค่า % ต่างวิธีแทนกัน','ARC / GCC'),row('การยึดเกาะ','ตั้งเป้า pull-off ≥ 1.5 MPa หรือ failure ใน substrate ที่ STR ยอมรับ','รายงาน pull-off พร้อมอายุบ่ม ตำแหน่ง วิธีและ failure mode','ARC / STR'),row('การลื่น / สารเคมี','TBC ตามรองเท้า สภาพเปียก และสารทำความสะอาดจริง','ระบุวิธีทดสอบและสารสัมผัส; ไม่เทียบค่า R กับ DCOF โดยตรง','ARC / OPS')]},
  'WL-01':{name:'ผนังแบ่งห้องและผิว acoustic',material:'stud / mineral wool / board สองด้าน พร้อม head detail, seals และ acoustic lining บางช่วง',rows:[row('Acoustic separation','ตั้งเป้า laboratory Rw ≥ 45 dB สำหรับ NOC/OFF; ผลหน้างานยังไม่กำหนด','รายงาน assembly เดียวกัน + flanking/door/MEP study; Rw ไม่ใช่ค่าเสียงที่วัดในห้อง','ARC / acoustic'),row('Fire / smoke','TBC ตาม fire strategy ของ compartment จริง ไม่กำหนดนาทีจากความหนา','listed/tested wall assembly รวม head/penetration/doorset และ field of application','FLS / ARC'),row('ผิว / การทำความสะอาด','ผิวด้าน ลดแสงสะท้อน; ทำ mock-up กับจอและน้ำยาที่ใช้งาน','ตรวจ glare, abrasion, VOC ที่วิธี/หน่วย/อายุทดสอบตรงกัน','ARC / OPS')]},
  'CL-01':{name:'ฝ้าดูดซับเสียง / NOC, Office',material:'mineral-fibre panel 600 × 600 × 20 mm บน exposed grid พร้อม independent service supports',rows:[row('การดูดซับเสียง','ตั้งเป้า NRC ≥ 0.70; ไม่ใช่ค่า sound insulation ของห้อง','รายงานทดสอบพร้อม mounting/plenum; ตรวจ reverberation ของห้องอีกครั้ง','ARC / acoustic'),row('ระดับและช่องเหนือฝ้า','NOC/OFF ceiling +6.35 m; soffit +6.70 m → plenum 350 mm ก่อนหักงานระบบ','coordinated section; ตรวจ clash และระยะถอดอุปกรณ์จริง','ARC / MEP'),row('ช่องเปิดซ่อม','แผงถอดได้ 600 × 600 mm เป็นสมมติฐาน ไม่ยืนยันขนาดที่พอซ่อม','ทาบ maintenance envelope กับ damper/valve; service load ห้ามฝากที่ grid โดยไม่มีการออกแบบ','MEP / OPS'),row('Fire / humidity','TBC ทั้งระบบรวม suspension; reaction-to-fire ไม่แทน fire resistance','assembly report + humidity/sag test และขอบเขตใช้งาน','FLS / ARC')]},
  'RF-01':{name:'หลังคา / กันซึม / ทางซ่อม',material:'membrane 4–5 mm ตัวอย่าง พร้อม compatible primer, insulation, flashing และ protection walkway',rows:[row('ความลาด','ตั้งเป้า nominal fall 1:80 เป็นโจทย์ศึกษา ไม่ใช่หลักฐานว่าทุกจุดระบายน้ำได้','survey falls รวม deflection/tolerance; คำนวณ outlet/overflow ด้วยฝนออกแบบจริง','ARC / PHE'),row('กันซึม','upstand 150 mm เหนือ finished roof เป็นสมมติฐาน ต้อง resolve ธรณี/ประตู','detail membrane termination + penetration + drain และทดสอบวิธีที่เหมาะกับโครงสร้าง','ARC / GCC'),row('ฉนวน / แรงลม','ยังไม่กำหนด U-value และ uplift pressure จนมี climate/โครงสร้าง/พลังงาน brief','คำนวณทั้งระบบ + thermal bridges + fixing/pull-out/wind-zone report','ARC / STR')]},
  'FC-01':{name:'Façade / กระจกและแผงหุ้ม',material:'insulated backing + drained cavity + cladding; glazing low-reflection / solar-control เป็นแนวทาง ยังไม่เลือกผลิตภัณฑ์',rows:[row('แสงสะท้อนใน NOC','ต้องไม่เกิดภาพแหล่งแสงเด่นในจอจากตำแหน่งนั่งหลัก','daylight/glare mock-up กับ display จริงและ blind; ยังไม่คำนวณ daylight หรือ SHGC','ARC / ICT'),row('น้ำ อากาศ และลม','test pressure / air leakage TBC จาก wind design และการใช้งาน','specify test method, pressure และ acceptance; whole-system mock-up รวมขอบช่องเปิด','ARC / STR'),row('ไฟ / การยึด','cavity barrier, anchors และ fire spread TBC ตาม strategy','ระบบรวม insulation/backing/joint/fixing ต้องอยู่ในขอบเขตทดสอบ','FLS / STR')]},
  'DR-01':{name:'ประตู วงกบ hardware และ access control',material:'doorset ทั้งชุด พร้อม closer, latch, seal, reader และ interface ปลดล็อกตาม strategy',rows:[row('ช่องเปิด','ตั้งเป้า clear opening 900 × 2100 mm สำหรับประตูคนใน support room; ไม่ใช่ code minimum','วัดช่องเปิดสุทธิหลังติด hardware และเทียบ user/escape/equipment route','ARC / FLS'),row('Fire / release','rating และ fail-safe/fail-secure TBC ตามตำแหน่ง ไม่ใช้ค่าเดียวทุกบาน','doorset evidence + cause/effect + witnessed functional test รวมไฟดับ','FLS / SEC'),row('แรงเปิด / เสียง / ธรณี','TBC ตามผู้ใช้ door closer และ seals ทั้งชุด','site test ขณะระบบปรับอากาศทำงาน ตรวจ maneuvering space และขนเปลี่ยน','ARC / OPS')]},
  'AC-01':{name:'ทางเข้าถึง / ทางขนย้าย',material:'พื้นผิวแน่น ไม่หลวม รอยต่อเรียบ และ drainage แยกจากแนวผู้ใช้',rows:[row('ทางเดินในห้อง','ตั้งเป้า 1200 mm clear หลังเก้าอี้ใน NOC; ต้องตรวจขณะใช้งานจริง','dimensioned occupied layout / mock-up; ฉากนี้ไม่ใช่ clearance solver','ARC / OPS'),row('ทางขึ้นชั้น 01','ยังไม่มี coordinated stair/lift/escape core ในโมเดลนี้ → OPEN DESIGN GAP','ต้องเพิ่ม route จาก lobby ถึง NOC/OFF รวมผู้ใช้ทุกกลุ่มและ evacuation strategy','ARC / FLS'),row('ความชัน / การลื่น','TBC ตามกฎหมายท้องถิ่น ผู้ใช้ และสภาวะเปียก; ไม่ตัดสินด้วยภาพทางลาด','route survey / slip test ที่ระบุวิธี / drainage และ accessibility review','ARC / CIV')]},
  'NC-01':{name:'NOC console / displays / task environment',material:'console top ผิวด้าน 25 mm, โครงโลหะ, ergonomic chair และจอปรับตำแหน่งได้; ไม่ระบุแบรนด์',rows:[row('จำนวนและขนาดตัวอย่าง','3 operator positions; โต๊ะ 1650 × 750 mm, top +740 mm จาก FFL; จอผนัง 6 ช่อง','task/staffing analysis + anthropometric mock-up; ไม่ใช่ maximum occupancy หรือ workstation compliance','ICT / OPS'),row('แสงทำงาน','ตั้งต้น dimmable ambient 300 lx ที่ task plane + task light ปรับได้ถึง 500 lx','lighting calculation และ lux survey ที่ระบุ task plane; ตรวจ glare/flicker และกะกลางคืน','ELD / ARC'),row('การระบายความร้อน','console/display heat load และจำนวนวงจร TBC; ห้ามถือว่า grille ที่เห็นรับโหลดได้แล้ว','equipment schedule W/unit × diversity + HVAC/power design / A-B strategy','MCD / ELD / ICT'),row('เสียงและการสื่อสาร','ตั้งเป้า background LAeq ≤ 45 dB(A) ในสภาพใช้งานที่ระบุ; ไม่ใช่เสียงเตือนสูงสุด','acoustic study + site survey โดยระบุช่วงเวลา ตำแหน่ง HVAC และ alarm intelligibility','acoustic / OPS')]}
 };
 const profiles={
  NOC:{name:'NOC / ห้องควบคุม',specs:['NC-01','AF-01','WL-01','CL-01','FC-01','DR-01','AC-01'],purpose:'3 จุดปฏิบัติงานสำหรับศึกษาการมองจอ การสื่อสาร และทางซ่อม ไม่ใช่ข้อสรุป staffing/occupancy',gaps:['stair/lift และทางหนีภัยจากชั้น 01 ยังไม่ resolve','lighting/glare และ HVAC heat load ยังไม่มีผลคำนวณ','fire compartment / alarm audibility ต้องให้ FLS และ OPS ร่วมตรวจ']},
  OFF:{name:'Office / Support',specs:['AF-01','WL-01','CL-01','DR-01','AC-01'],purpose:'4 โต๊ะทำงานและมุมคุยงาน แสดง furniture / ceiling / façade interfaces',gaps:['ยังไม่มี WC, pantry และ accessible route ทั้งเส้น','ยังไม่พิสูจน์ occupancy, egress หรือ ventilation']},
  MMR:{name:'Meet-me / Carrier room',specs:['AF-01','WL-01','DR-01'],purpose:'ตัวอย่าง patch frames 2 ฝั่งและทางสายเหนือศีรษะ; ไม่ใช่ termination schedule ของ carrier จริง',gaps:['เส้นทาง carrier diversity และ firestop ยังไม่ coordinated','rack load / rolling load / cooling / grounding ต้องออกแบบต่อ']},
  DH1:{name:'Data Hall 01',specs:['AF-DC','WL-01','DR-01'],purpose:'ขอบเขตห้อง แนว containment และทางเดินประกอบกับ rack assets เดิม',gaps:['AF-01 สำหรับ support room ห้ามใช้ยืนยัน floor load ของ data hall','ยังไม่ใช่ rack population หรือ airflow model ครบตาม program 12 MW']},
  DH2:{name:'Data Hall 02',specs:['AF-DC','WL-01','DR-01'],purpose:'ขอบเขตห้องและ containment ตัวอย่างสำหรับเทียบเส้นทาง B',gaps:['พื้น data hall ต้องมี heavy-equipment brief แยกจาก support rooms','ยังไม่พิสูจน์ fire strategy / airflow / egress']},
  E01:{name:'Electrical gallery A',specs:['FL-02','WL-01','DR-01'],purpose:'ผิวพื้น แนวฝารางสาย และประตูทางเข้าบนบริบทอุปกรณ์เดิม',gaps:['trench, arc-flash working space และ water exclusion ต้อง coordinated','ค่า rating ผนัง/ประตูยังไม่กำหนดจาก fire strategy']},
  E02:{name:'Electrical gallery B',specs:['FL-02','WL-01','DR-01'],purpose:'ผิวพื้นและทางสายแสดงเส้นทางแยกจาก A',gaps:['การแยก A/B ในภาพยังไม่พิสูจน์ resilience หรือ fire segregation']},
  GEN:{name:'Generator yard',specs:['YD-01','DR-01'],purpose:'ขอบเขต yard / service gate / support interfaces รอบเครื่องเดิม',gaps:['FL-02 เป็นเกณฑ์เทียบผิวเท่านั้น; ต้องเลือก coating ที่ทน fuel/UV จริง','ยังไม่คำนวณ exhaust, acoustics, bund volume หรือ fire separation']},
  CHY:{name:'Cooling yard',specs:['YD-01','AC-01'],purpose:'ขอบเขตลานและ service walkway รอบ plant เดิม',gaps:['coating / drainage ต้องเทียบสารเคมีและสภาพภายนอก','ไม่มี plume/CFD, lifting study หรือ maintenance clearance solver']},
  RF:{name:'Roof / Overhead',specs:['RF-01','AC-01'],purpose:'แสดง walkway, drain และ curb ตัวอย่าง ไม่ปูแผ่นทึบบังอุปกรณ์เดิม',gaps:['drainage/overflow/downpipe ยังไม่เชื่อมครบ','wind uplift, thermal performance และ fall protection ยังไม่ออกแบบ']}
 };
 function build(D,state={},selectedZone){
  if(state.isolateService)return [];
  const groups=[];
  for(const v of D.scene?.zoneVolumes||[]){
   if(!profiles[v.zoneId]||(state.levelFilter&&state.levelFilter!=='ALL'&&state.levelFilter!==v.level)||(state.isolateZone&&selectedZone&&selectedZone!=='SITE'&&selectedZone!==v.zoneId))continue;
   const dx=state.explodeMode?(v.x+v.w/2-18)*.28:0,dy=state.explodeMode?(v.y+v.d/2-16)*.28:0,dz=state.explodeMode?(v.level==='01'?3.4:v.level==='RF'?6.4:0):0;
   const x=v.x+dx,y=v.y+dy,z=v.ffl+dz,H=(v.ceilingH??v.soffit)-v.ffl;
   const group=(suffix,label,specIds)=>{const g={id:v.zoneId+'-'+suffix,zoneId:v.zoneId,level:v.level,label,specs:specIds,parts:[]};groups.push(g);return g;};
   const box=(g,part,xx,yy,zz,w,d,h,color,alpha=1)=>{if(Math.min(w,d,h)>0)g.parts.push({part,x:xx,y:yy,z:zz,w,d,h,color,alpha});};
   const enclosed=['NOC','OFF','MMR','DH1','DH2','E01','E02'].includes(v.zoneId);
   if(enclosed){
    const shell=group('WALL','ผนัง / ช่องเปิด / ผิวพื้น',['WL-01',v.zoneId.startsWith('E')?'FL-02':v.zoneId.startsWith('DH')?'AF-DC':'AF-01']);
    box(shell,'north wall',x,y,z,v.w,.12,H,'#bbc7bd',.38);box(shell,'west wall',x,y,z,.12,v.d,H,'#bbc7bd',.28);
    box(shell,'floor finish',x+.13,y+.13,z+.004,v.w-.26,v.d-.26,.015,'#718d87',.45);
    const door=group('DOOR','ประตู / reader / header',['DR-01','AC-01']);
    box(door,'door leaf — schematic clear opening 900',x+v.w-1.25,y+v.d-.1,z,.9,.05,2.1,'#9ebeca',.35);
    for(const xx of [x+v.w-1.32,x+v.w-.3])box(door,'door jamb',xx,y+v.d-.15,z,.07,.15,2.2,'#506965');
    box(door,'head',x+v.w-1.32,y+v.d-.15,z+2.14,1.09,.15,.07,'#506965');box(door,'access reader',x+v.w-1.51,y+v.d-.12,z+1.05,.1,.09,.15,'#487b91');
   }
   if(['NOC','OFF'].includes(v.zoneId)){
    const ceil=group('CEILING','ฝ้า cutaway / โคม / supply-return grille',v.zoneId==='NOC'?['CL-01','NC-01']:['CL-01']);
    for(let i=0;i<3;i++){
     const cx=x+.55+i*(v.w-1.1)/3;
     box(ceil,'600 mm acoustic ceiling strip',cx,y+.45,z+H-.02,.6,v.d-.9,.02,'#e1ded0',.32);
     box(ceil,'dimmable luminaire',cx,y+1.2,z+H-.07,.12,1.2,.045,'#f1e7ae');
    }
    for(const yy of [.55,v.d-.75])box(ceil,'HVAC grille — no capacity assigned',x+v.w-1.5,y+yy,z+H-.06,.6,.25,.05,'#708f9a');
    const glz=group('FACADE','กระจก / mullions / blind',['FC-01']);
    box(glz,'glazing cutaway',x+v.w-.05,y+.25,z+.85,.04,v.d-.5,1.5,'#83bdcc',.25);
    for(let i=0;i<4;i++)box(glz,'mullion',x+v.w-.09,y+.3+i*(v.d-.6)/3,z+.8,.08,.05,1.6,'#5b7576');
    box(glz,'roller blind headbox',x+v.w-.18,y+.25,z+2.35,.15,v.d-.5,.12,'#c5c2ad');
   }
   if(v.zoneId==='NOC'){
    const wall=group('VIDEO','Video wall 3 × 2 / support',['NC-01','WL-01']);
    box(wall,'display backing / service void',x+1.8,y+.17,z+.75,4.7,.18,1.45,'#485b61');
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)box(wall,'display panel',x+1.9+i*1.52,y+.365,z+.84+j*.65,1.46,.045,.59,j?'#3b879b':'#5b9eac');
    for(let i=0;i<3;i++){
     const g=group('OP'+(i+1),'Operator '+(i+1)+' / console, monitor, chair',['NC-01','AC-01']),cx=x+.65+i*2.3;
     box(g,'matte console top 1650 x 750',cx,y+1.2,z+.715,1.65,.75,.025,'#c1b698');
     for(const xx of [cx+.1,cx+1.45])box(g,'console leg',xx,y+1.27,z,.07,.6,.715,'#526765');
     box(g,'monitor stand',cx+.72,y+1.35,z+.74,.08,.12,.15,'#40565a');box(g,'operator screen',cx+.45,y+1.3,z+.88,.75,.055,.42,'#4c90a2');
     box(g,'keyboard',cx+.5,y+1.7,z+.742,.55,.15,.018,'#536264');
     box(g,'chair seat',cx+.5,y+2.13,z+.43,.55,.55,.08,'#596f81');box(g,'chair back',cx+.5,y+2.61,z+.51,.55,.07,.48,'#596f81');box(g,'chair pedestal',cx+.72,y+2.35,z+.08,.08,.08,.35,'#536264');
     box(g,'chair base',cx+.48,y+2.15,z+.04,.6,.5,.04,'#536264');
    }
    const acoustic=group('ACOUSTIC','ผิวดูดซับเสียง / service raceway',['WL-01','NC-01']);
    for(let i=0;i<4;i++)box(acoustic,'acoustic wall panel',x+.15,y+.35+i*.7,z+.8,.055,.55,1.3,'#9b9f87');
    box(acoustic,'low-level cable raceway',x+.2,y+.17,z+.12,v.w-.4,.12,.12,'#786d52');
   }else if(v.zoneId==='OFF'){
    for(let i=0;i<4;i++){
     const g=group('DESK'+(i+1),'โต๊ะทำงาน '+(i+1),['AF-01','AC-01']),cx=x+.5+i*2.15;
     box(g,'desk top',cx,y+1.25,z+.72,1.6,.7,.03,'#c1b698');box(g,'desk frame',cx+.2,y+1.3,z,.08,.55,.72,'#526765');box(g,'desk frame',cx+1.35,y+1.3,z,.08,.55,.72,'#526765');box(g,'screen',cx+.5,y+1.3,z+.8,.65,.06,.42,'#4c90a2');box(g,'chair seat',cx+.5,y+2.1,z+.45,.5,.5,.08,'#687d88');box(g,'chair back',cx+.5,y+2.55,z+.53,.5,.08,.42,'#687d88');
    }
   }else if(v.zoneId==='MMR'){
    for(let i=0;i<4;i++){
     const g=group('FRAME'+(i+1),'Carrier patch frame '+(i+1)+' (teaching object)',['AF-01','WL-01']),cx=x+.8+i*1.7;
     for(const xx of [cx,cx+.65])box(g,'open frame upright',xx,y+.6,z,.05,.65,2.1,i<2?'#b89148':'#5e99a8');
     for(let j=0;j<6;j++)box(g,'patch panel',cx+.05,y+.6,z+.2+j*.29,.6,.06,.12,'#738791');
    }
    const tray=group('TRAY','Carrier A/B overhead trays',['AF-01']);
    for(const yy of [.65,1.6])box(tray,'separate tray schematic',x+.5,y+yy,z+2.5,v.w-1,.3,.08,'#8d9a9c');
   }else if(['DH1','DH2'].includes(v.zoneId)){
    const g=group('CONTAIN','Containment edge / aisle reference',['WL-01','DR-01']);
    for(const xx of [x+.5,x+v.w-.65])box(g,'containment end post',xx,y+v.d/2-.6,z,.08,1.2,2.5,'#839b9a',.65);
    for(const yy of [y+v.d/2-.6,y+v.d/2+.55])box(g,'containment upper rail',x+.5,yy,z+2.45,v.w-1,.06,.06,'#839b9a',.65);
   }else if(v.zoneId.startsWith('E')){
    const g=group('TRENCH','Cable trench cover / removable modules',['FL-02']);
    for(let i=0;i<10;i++)box(g,'removable trench cover',x+.3+i*(v.w-.6)/10,y+.3,z+.025,(v.w-.6)/10-.02,.45,.025,'#79858a');
   }else if(['GEN','CHY'].includes(v.zoneId)){
    const g=group('YARD','ลาน / service gate / perimeter',['YD-01','AC-01']);
    for(let i=0;i<8;i++)box(g,'yard fence post',x+.2+i*(v.w-.4)/7,y+.12,z,.06,.06,2,'#7e908a');
    box(g,'yard rail',x+.2,y+.12,z+1.7,v.w-.4,.04,.04,'#7e908a');
    box(g,'service walkway',x+.2,y+v.d-.8,z+.025,v.w-.4,.6,.025,'#b8b4a0',.6);
   }else if(v.zoneId==='RF'){
    const g=group('DRAIN','Roof drain / curb / service walkway',['RF-01']);
    box(g,'walkway sample',x+.3,y+v.d-.8,z+.03,v.w-.6,.6,.03,'#b8b4a0',.65);
    for(const xx of [x+.4,x+v.w-.8]){box(g,'drain body proxy',xx,y+.4,z,.3,.3,.08,'#334e54');box(g,'upstand curb sample',xx,y+.9,z,.6,.12,.15,'#7d9890');}
   }
  }
  return groups;
 }
 function specPanel(ids){return `<section class="building-specs"><p class="callout">PRELIMINARY / สมมติฐานออกแบบเพื่อเรียนรู้ · ตัวเลขตั้งต้นไม่ใช่ข้อกำหนดกฎหมาย ไม่ใช่ approved spec และยังไม่มีผลตรวจจริง ค่าที่เป็น TBC ต้องกำหนดก่อน tender / procurement</p>${[...new Set(ids)].filter(id=>specs[id]).map(id=>{const s=specs[id];return `<details><summary>${esc(id+' · '+s.name)}</summary><p>${esc(s.material)}</p><div class="table-wrap"><table><thead><tr><th>Criteria</th><th>เป้าหมายตั้งต้น / ขอบเขต</th><th>วิธีตรวจ / หลักฐานที่ต้องขอ</th><th>ผู้ร่วมทบทวน</th></tr></thead><tbody>${s.rows.map(r=>`<tr><th scope="row">${esc(r.criterion)}</th><td>${esc(r.target)}</td><td>${esc(r.verify)}</td><td>${esc(r.owner)}<br><small>${r.status}</small></td></tr>`).join('')}</tbody></table></div></details>`;}).join('')}<details><summary>หลักคิดและแหล่งอ่านต่อ</summary><p>ตัวเลขในตารางเป็น project assumptions ของบทเรียน แหล่งต่อไปนี้รองรับหัวข้อที่ควรตรวจ ไม่ได้เป็นที่มาของค่าตัวเลขทั้งหมด:</p><ul><li><a href="https://www.hse.gov.uk/humanfactors/topics/control-room.htm" target="_blank" rel="noopener">HSE — control room ergonomics / ISO 11064 scope</a></li><li><a href="https://www.cibse.org/knowledge-research/knowledge-portal/lg22-lighting-for-control-rooms-2022-pdf" target="_blank" rel="noopener">CIBSE LG22 — lighting for control rooms</a></li><li><a href="https://armstrongceilings.com.au/performance/fire-resistance/" target="_blank" rel="noopener">Armstrong — fire resistance ของระบบฝ้า</a></li><li><a href="https://www.ul.com/thecodeauthority/knowledge/ul-fire-rated-doors-guide" target="_blank" rel="noopener">UL — doorset assemblies</a></li></ul><p>ไม่ใช้ผลทดสอบผลิตภัณฑ์ชิ้นเดียวแทนสมรรถนะทั้งระบบ ไม่ใช้ Rw / NRC / rating ไฟ แทนกัน และไม่ปลด control gate จากการอ่านตารางนี้</p></details></section>`;}
 function exportBrief(D,zone){const p=profiles[zone];if(!p)return null;const components=build(D,{isolateZone:true},zone).map(g=>({id:g.id,label:g.label,specs:g.specs}));return {schema:'DC01-room-brief-v1',zone,status:'ILLUSTRATIVE / NOT APPROVED / NOT A CDE REGISTER FILE',profile:p,specifications:Object.fromEntries([...new Set([...p.specs,...components.flatMap(g=>g.specs)])].map(k=>[k,specs[k]])),components,notice:'Fictional design assumptions. TBC requires coordinated design, applicable code and evidence; no live approval, FM identity or IFC geometry.'};}
 function zonePanel(D,zone,selected){const p=profiles[zone];if(!p)return '';const groups=build(D,{isolateZone:true,levelFilter:'ALL'},zone),g=groups.find(g=>g.id===selected);return `<section class="building-zone"><span class="eyebrow">ROOM FIT-OUT / PRELIMINARY BRIEF</span><h3>${esc(p.name)}</h3><p>${esc(p.purpose)}</p><p class="small">${groups.length} กลุ่มองค์ประกอบสาธิต · คลิกชิ้นส่วนใน 3D หรือเลือกชื่อเพื่อไฮไลต์ ไม่ใช่ canonical FM assets และไม่เพิ่มรายการใน IFC proxy</p><button class="btn small" data-do="roomInterior" data-id="${esc(zone)}">ดูภายในห้อง / cutaway</button><button class="btn small" data-do="viewerCmd" data-cmd="reset">กลับมุมรวม</button><button class="btn small" data-do="exportBuildingBrief" data-id="${esc(zone)}">ดาวน์โหลด room / material brief (.json)</button><div class="building-parts">${groups.map(g=>`<button class="btn small" data-do="buildingPart" data-id="${esc(g.id)}" aria-pressed="${g.id===selected}">${esc(g.label)}</button>`).join('')}</div>${g?`<p class="callout">เลือก ${esc(g.id+' / '+g.label)} · เกณฑ์ที่เกี่ยวข้อง ${g.specs.map(esc).join(', ')}</p>`:''}<details open><summary>สิ่งที่ยังต้องออกแบบ / ยังไม่มีในโมเดล</summary><ul>${p.gaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></details>${specPanel(g?g.specs:Object.keys(exportBrief(D,zone).specifications))}</section>`;}
 const archMap={FLOOR:['FL-02','AF-DC'],WALL:['WL-01'],CEILING:['CL-01'],ROOF:['RF-01'],FACADE:['FC-01'],DOOR:['DR-01'],ACCESS:['AC-01']};
 return {specs,profiles,build,exportBrief,specPanel,zonePanel,archPanel:c=>specPanel(archMap[c.id.split('-')[0]]||[])};
});
