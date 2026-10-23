(function(){'use strict';const button=document.getElementById('copy-intro'),status=document.getElementById('share-status'),fallback=document.getElementById('share-fallback');if(!button)return;button.addEventListener('click',async()=>{const u=new URL(window.location.href),local=['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(u.hostname);u.search='';u.hash='';u.username='';u.password='';const text='แบบเปลี่ยนหนึ่งฉบับ ใครบ้างต้องรู้? ลองตาม BIM & Data จากโมเดล Data Center ไปถึงเอกสาร หลักฐาน สิทธิ์ และผลของการตัดสินใจ — Revit Thailand / nonprofit educational showcase'+(!local&&u.protocol==='https:'?'\n'+u.href:'');try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(text);status.textContent=local?'คัดลอกข้อความแล้ว ลิงก์ localhost ใช้ได้เฉพาะเครื่องนี้ จึงไม่ได้ใส่ในข้อความแชร์':'คัดลอกข้อความแล้ว';fallback.hidden=true;}catch(_){fallback.value=text;fallback.hidden=false;fallback.focus();fallback.select();status.textContent='เลือกข้อความไว้แล้ว คัดลอกด้วย Ctrl+C หรือเมนูของอุปกรณ์';}});})();

/* Questions are navigation aids; they never grant access or change a project decision. */
(function(){
 'use strict';
 const launch=document.getElementById('brief-launch');
 if(!launch)return;
 const briefs={
  space:{ref:'01 / ความสัมพันธ์ของพื้นที่',title:'ห้องไหนควรอยู่ติดกัน และห้องไหนควรแยก?',description:'ลองจัดกล่องให้คนและงานเดินต่อกันได้ เส้นเชื่อมจะช่วยบอกว่าความสัมพันธ์ไหนยังต้องคิดต่อ',steps:['เลือกโจทย์แล้วลากโซนไปวาง','ดูเส้นเชื่อมและคำเตือนเรื่องตำแหน่ง','ลองอีกแบบ หรือเปิดตัวอย่างเพื่อเทียบเหตุผล'],href:'datacenter.html#view=play',label:'ลองจัดพื้นที่ ↗'},
  material:{ref:'02 / สถาปัตย์และวัสดุ',title:'เปลี่ยนวัสดุหนึ่งชั้น ต้องถามใครต่อ?',description:'เปิดชั้นประกอบในโมเดล ลองข้อเสนอเปลี่ยนระบบ แล้วดูว่าสเปค รอยต่อ และหลักฐานไหนต้องตรวจร่วมกัน',steps:['เลือกพื้น ผนัง ฝ้า หลังคา หรือทางเข้า','เลือกชั้นวัสดุและลองข้อเสนอเปลี่ยนระบบ','ดูเงื่อนไขที่ยังขาดก่อนให้ข้อเสนอทางเทคนิค'],href:'datacenter.html#view=architecture',label:'ลองเปิดชั้นวัสดุ ↗'},
  maintenance:{ref:'03 / งานดูแลอาคาร',title:'อุปกรณ์ต้องเข้าซ่อม ใครเข้าพื้นที่ได้?',description:'มีใบงานอย่างเดียวพอไหม? ลองตามคนซ่อมผ่านจุดอนุญาต ตรวจพื้นที่และหน้าที่ ก่อนเริ่มงาน',steps:['เลือกเคสเสียหรือซ่อมตามรอบ','ดูว่าใครต้องอนุญาตและผ่านจุดไหน','ลองเปลี่ยนเงื่อนไข แล้วดูสิ่งที่ต้องทบทวน'],href:'datacenter.html#view=maintenance',label:'ลองตามงานซ่อม ↗'}
 };
 const buttons=Array.from(document.querySelectorAll('[data-brief]'));
 function select(key){
  const brief=briefs[key];if(!brief)return;
  document.getElementById('brief-ref').textContent=brief.ref;
  document.getElementById('brief-title').textContent=brief.title;
  document.getElementById('brief-description').textContent=brief.description;
  const items=brief.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;});
  document.getElementById('brief-steps').replaceChildren(...items);
  launch.setAttribute('href',brief.href);launch.textContent=brief.label;
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.getAttribute('data-brief')===key)));
 }
 buttons.forEach(button=>button.addEventListener('click',()=>select(button.getAttribute('data-brief'))));
})();
