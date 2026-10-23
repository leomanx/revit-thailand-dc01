(function () {
  'use strict';
  const E = window.CDELab;
  const $ = id => document.getElementById(id);
  const node = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const KEY = 'revit-thailand-control-lab-v1';
  let state = E.create(), reflection = '', last = null, storageNote = '';
  try { const saved = localStorage.getItem(KEY); if (saved) { const data = JSON.parse(saved); state = E.restore(data); reflection = typeof data.reflection === 'string' ? data.reflection.slice(0, 4000) : ''; } }
  catch (_) { storageNote = 'เปิดด้วยข้อมูลตั้งต้น: อ่านข้อมูลที่บันทึกไม่ได้ คุณยังทดลองและ Export ได้'; }
  const data = () => ({ ...E.exportSession(state), reflection });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data())); } catch (_) { storageNote = 'เบราว์เซอร์นี้บันทึกในเครื่องไม่ได้ กรุณา Export ก่อนปิด'; } }
  const purposeName = value => value === 'construction' ? 'ใช้ก่อสร้าง (construction)' : 'ใช้ประสาน (coordination)';
  function recordText(v) { return v ? E.revisionLabel(v.revision) + ' · ' + E.actors[v.actor].name + (v.purpose ? ' · ' + purposeName(v.purpose) : '') : 'ยังไม่มี'; }
  const host = $('control-lab');
  host.innerHTML = `
    <div class="lab-intro"><div><div class="eyebrow">LEARN BY DECIDING / ทดลองให้เห็นผล</div><h2>ควบคุมงาน เริ่มที่การตัดสินใจ</h2><p>โฟลเดอร์ช่วยจัดเก็บ แต่คน กติกา และหลักฐานทำให้ควบคุมงานได้ ลองทำผิดทางก่อน แล้วดูว่าจุดควบคุมหยุดอะไรไว้</p></div><div class="lab-number" aria-hidden="true">01 — 03</div></div>
    <div id="lab-scenarios" class="scenario-switch" aria-label="เลือกสถานการณ์"></div>
    <div class="lab-grid"><div><div class="lab-brief"><h3 id="lab-title"></h3><p id="lab-brief"></p></div>
    <div class="panel"><div class="lab-status">INFORMATION CONTAINER / ข้อมูลจำลอง</div><h3 id="lab-file" class="lab-file"></h3>
    <div class="lab-metrics"><div><small>Revision ปัจจุบัน</small><strong id="lab-revision"></strong></div><div><small>สถานะข้อมูล</small><strong id="lab-state"></strong></div><div><small>ตำแหน่งโฟลเดอร์</small><strong id="lab-folder"></strong></div></div>
    <p class="lab-explain">ลองย้ายไป Published แล้วกด “ตรวจใช้หน้างาน” การเปลี่ยนที่เก็บเพียงอย่างเดียวไม่สร้างผลอนุมัติ ไม่เพิ่มสิทธิ์ และไม่เปลี่ยนสถานะข้อมูลในแบบจำลองนี้</p>
    <div class="lab-form"><div><label for="lab-actor">ตอนนี้คุณสวมบทบาทใคร?</label><select id="lab-actor"></select></div><div><label for="lab-purpose">ต้องการออกข้อมูลเพื่ออะไร?</label><select id="lab-purpose"><option value="construction">ใช้ก่อสร้าง (construction)</option><option value="coordination">ใช้ประสาน (coordination)</option></select></div><div><label for="lab-location">ทดลองเปลี่ยนตำแหน่งจัดเก็บ</label><select id="lab-location"><option>WIP</option><option>SHARED</option><option>PUBLISHED</option><option>ARCHIVED</option><option>Commercial</option></select></div><div><label for="lab-site-revision">Revision ที่หน้างานถืออยู่ (เลข)</label><input id="lab-site-revision" type="number" min="1" max="9999" value="1" /></div></div>
    <div class="lab-current"><strong id="lab-role-name"></strong><span id="lab-role-access"></span></div>
    <p class="small">ทุกปุ่มกดทดลองได้ แม้ยังขาดเงื่อนไข เพื่อดูเหตุผลที่ถูกหยุด · เอกสารและผลตรวจทั้งหมดเป็นข้อมูลสมมติ</p>
    <div id="lab-result" role="status" aria-live="polite" aria-atomic="true"></div><div id="lab-actions" class="lab-actions"></div>
    </div></div>
    <aside><div class="panel"><h3>จุดควบคุมที่ต้องตอบให้ได้</h3><p class="small">ใคร · ทำอะไร · กับ revision ไหน · เพื่ออะไร · อ้างหลักฐานใด</p><ul id="lab-evidence" class="lab-evidence"></ul>
    <details class="lab-policy"><summary>กติกาของโครงการตัวอย่างนี้</summary><ul><li>WIP อ่านได้เฉพาะทีม ARC; Admin ไม่ได้รับสิทธิ์อ่านโดยอัตโนมัติ</li><li>หัวหน้าสถาปนิกตรวจภายในและอนุญาตแชร์ ผู้ประสาน BIM บันทึกผลประสาน</li><li>Document Controller จัดชุดส่ง; ผู้อนุมัติที่ได้รับมอบหมายอนุมัติ; Document Controller ออกเอกสาร</li><li>อนุมัติผูกกับ revision + intended use การส่งใหม่หรือประสานใหม่ยกเลิกผลอนุมัติที่ค้าง</li><li>หากเปิด revision ใหม่ เคสนี้กำหนด Hold ชุดเก่า ต้องตรวจและอนุมัติใหม่ นโยบายจริงต้องกำหนดตาม change control</li><li>Commercial ให้เฉพาะ Commercial กับผู้อนุมัติฝั่ง Owner อ่านได้ พื้นที่นี้แยกจากสถานะ CDE</li></ul><p>นี่คือนโยบายสำหรับการสอน ไม่ใช่กฎ ISO หรือการจำลอง permission inheritance ของ ACC จริง การย้ายไฟล์ในระบบจริงอาจเปลี่ยนสิทธิ์ตามปลายทาง ต้องทดสอบการสืบทอดสิทธิ์เพิ่มเติม</p></details>
    </div><div class="panel" style="margin-top:18px"><h3>ลองให้ครบ แล้วอธิบายด้วยเหตุผล</h3><ul id="lab-goals" class="lab-goals"></ul><p id="lab-lesson" class="lab-takeaway"></p>
    <details class="lab-policy"><summary>เส้นทางแนะนำสำหรับเคส 01 และ 02</summary><ol><li>หัวหน้าสถาปนิก → ตรวจภายใน → อนุญาตแชร์</li><li>ผู้ประสาน BIM → บันทึกผลประสาน</li><li>Document Controller → ส่งขออนุมัติ</li><li>ผู้อนุมัติที่ได้รับมอบหมาย → อนุมัติ</li><li>Document Controller → ออกเอกสาร</li><li>หัวหน้าหน้างาน → ใส่เลข revision ให้ตรง → ตรวจใช้หน้างาน</li></ol><p>ลองออกเพื่อ coordination แล้วตรวจใช้ก่อสร้าง จะเห็นว่าคำว่า Published อย่างเดียวไม่พอ</p></details>
    <details class="lab-policy"><summary>ถ้าคนส่งแบบทางแชตข้ามระบบล่ะ?</summary><p>ตัวเว็บหยุดได้เฉพาะการกระทำในแบบจำลอง งานจริงต้องตกลงช่องทางออกเอกสาร ผู้รับต้องตรวจเลขอ้างอิงและ revision ก่อนใช้ พร้อมวิธีหยุดและแก้เหตุเมื่อพบฉบับผิด</p><ol><li>ป้องกัน: จำกัดผู้มีสิทธิ์ออก และใช้ชุดควบคุมที่ระบุวัตถุประสงค์</li><li>ตรวจพบ: ตรวจรับชุดที่หน้างานถือ เทียบทะเบียนฉบับใช้งาน</li><li>ตอบสนอง: แจ้งผู้ได้รับผลกระทบ ระงับหรือถอนชุดผิด และยืนยันว่าเปลี่ยนฉบับครบแล้ว</li></ol><p>ถ้ายังไม่มีผู้รับผิดชอบและหลักฐานยืนยันทั้งสามส่วน โครงสร้างโฟลเดอร์ที่สวยก็ยังควบคุมพฤติกรรมการทำงานไม่ได้</p></details>
    <details id="lab-reset-confirm" class="lab-reset"><summary>เริ่มเคสนี้ใหม่ / ล้างผลทดลอง</summary><p class="small">ล้างเฉพาะผลทดลองและบันทึกสะท้อนคิดของเคสที่เปิดอยู่ Export เก็บก่อนได้</p><div class="controls"><button id="lab-reset" class="btn">ยืนยันเริ่มใหม่</button></div></details>
    </div></aside></div>
    <div class="panel lab-log"><div class="lab-log-header"><h3>ประวัติการตัดสินใจ</h3><span id="lab-log-count" class="small"></span></div><p class="small">เก็บทั้งรายการที่ผ่านและถูกหยุด การสลับบทบาทใช้เพื่อเรียนรู้ ไม่มีการยืนยันตัวตน และประวัตินี้ไม่ใช่ audit log ที่ป้องกันการแก้ไข</p><ol id="lab-log" tabindex="0" aria-label="ประวัติการตัดสินใจ เลื่อนอ่านได้"></ol><div class="lab-tools"><button id="lab-export" class="btn">Export ผลทดลอง JSON</button><button id="lab-import-button" class="btn">Import ผลทดลอง</button><input id="lab-import" class="sr-only" type="file" accept=".json,application/json" tabindex="-1" aria-label="ไฟล์ผลทดลอง JSON"/><button id="lab-report" class="btn">ดาวน์โหลดสรุปสำหรับคุยกับทีม</button></div><div id="lab-transfer-status" role="status" aria-live="polite"></div></div>
    <div class="panel lab-reflect"><h3>เอากลับไปคุยกับทีมจริง</h3><label for="lab-reflection">ในโครงการของคุณ จุดไหนที่คนยังข้ามได้? ใครต้องรับผิดชอบ และจะใช้หลักฐานอะไรยืนยันว่าควบคุมได้?</label><textarea id="lab-reflection" maxlength="4000" placeholder="เช่น เรามีโฟลเดอร์ Published แต่ยังส่งแบบทางแชตโดยไม่ระบุ revision ผู้รับจึงไม่รู้ว่าฉบับไหนใช้งานได้…"></textarea><p class="lab-credit" id="lab-storage-note"></p></div>`;
  // innerHTML above contains only fixed application markup. User/imported data is always textContent/value.
  const descriptions = {
    read: 'ลองสิทธิ์เข้าถึงข้อมูล แยกจากหน้าที่และอำนาจอนุมัติ', check: 'หัวหน้าสถาปนิกยืนยันผลตรวจของ revision นี้',
    share: 'เปิดให้ทีมที่ได้รับสิทธิ์ใช้ประสานงาน', coordinate: 'ผู้ประสานยืนยันว่าปิดประเด็นในชุดนี้แล้ว',
    submit: 'ผูกชุดส่งกับ revision และวัตถุประสงค์', authorize: 'ผู้มีอำนาจตัดสินใจอย่างชัดแจ้ง',
    publish: 'Document Controller ออกชุดควบคุมพร้อมเลขอ้างอิง', use: 'ตรวจเอกสารที่ถือกับชุดที่ออกเพื่อก่อสร้าง', revise: 'เปลี่ยนเนื้อหา แล้วดูว่าหลักฐานใดต้องทำใหม่'
  };
  const buttons = {};
  ['read', 'check', 'share', 'coordinate', 'submit', 'authorize', 'publish', 'use', 'revise'].forEach((action, i) => {
    const b = node('button', undefined, 'lab-action'); b.type = 'button'; b.dataset.action = action;
    b.append(node('span', String(i + 1).padStart(2, '0'), 'action-number'));
    const text = node('span'); text.append(node('strong', E.labels[action]), node('small', descriptions[action]));
    const status = node('small'); text.append(status); b.append(text); b.onclick = () => run(action); $('lab-actions').append(b); buttons[action] = { b, status };
  });
  Object.entries(E.actors).forEach(([key, actor]) => { const opt = node('option', actor.name + ' / ' + actor.company); opt.value = key; $('lab-actor').append(opt); });
  Object.entries(E.scenarios).forEach(([key, scenario]) => {
    const b = node('button', undefined, 'btn'); b.append(node('strong', scenario.title), node('small', key === 'commercial' ? 'หน้าที่ · สิทธิ์ · ความลับ' : key === 'change' ? 'Revision · Hold · หลักฐานใหม่' : 'ตรวจ · แชร์ · อนุมัติ · ออกเอกสาร'));
    b.dataset.scenario = key; b.onclick = () => { if (state.scenario === key) return; downloadDraftNote(); state = E.create(key); reflection = ''; last = null; $('lab-reflection').value = ''; save(); render(); }; $('lab-scenarios').append(b);
  });
  function downloadDraftNote() { /* Keep each scenario's draft in this browser for return visits. */ try { localStorage.setItem(KEY + ':' + state.scenario, JSON.stringify(data())); } catch (_) {} }
  // Return to a scenario restores its draft; selecting a new one does not discard prior work.
  $('lab-scenarios').querySelectorAll('button').forEach(b => { const original = b.onclick; b.onclick = () => { if (state.scenario === b.dataset.scenario) return; original(); try { const draft = localStorage.getItem(KEY + ':' + state.scenario); if (draft) { const parsed = JSON.parse(draft); state = E.restore(parsed); reflection = typeof parsed.reflection === 'string' ? parsed.reflection.slice(0,4000) : ''; } } catch (_) {} $('lab-reflection').value = reflection; save(); render(); }; });
  function run(action, value) {
    if (state.events.length >= 1000) { $('lab-transfer-status').textContent = 'ครบ 1,000 รายการแล้ว กรุณา Export และเริ่มเคสใหม่'; return; }
    last = E.act(state, action, value); save(); render(); $('lab-result').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function evidence(label, value) { const li = node('li'); li.append(node('span', label), node('span', value)); $('lab-evidence').append(li); }
  function render() {
    const scenario = E.scenarios[state.scenario];
    $('lab-title').textContent = scenario.title; $('lab-brief').textContent = scenario.brief; $('lab-file').textContent = scenario.file;
    $('lab-revision').textContent = E.revisionLabel(state.revision); $('lab-state').textContent = state.state; $('lab-folder').textContent = state.folder;
    $('lab-actor').value = state.actor; $('lab-purpose').value = state.purpose; $('lab-location').value = state.folder; $('lab-site-revision').value = state.siteRevision;
    $('lab-role-name').textContent = E.actors[state.actor].name + ' · ' + E.actors[state.actor].company;
    $('lab-role-access').textContent = E.canRead(state) ? 'อ่านข้อมูลได้ตามนโยบายเคสนี้ แต่สิทธิ์อ่านไม่ได้ให้สิทธิ์อนุมัติ' : 'ยังไม่มีสิทธิ์อ่านข้อมูลตามขอบเขตนี้ การรู้ว่ามีไฟล์ไม่เท่ากับการเห็นเนื้อหา';
    document.querySelectorAll('[data-scenario]').forEach(b => { const active = b.dataset.scenario === state.scenario; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    Object.entries(buttons).forEach(([action, ui]) => { const reasons = E.blockers(state, action); ui.b.hidden = state.scenario === 'commercial' && action !== 'read'; ui.status.textContent = reasons.length ? 'ยังไม่ผ่าน: ' + reasons[0] + (reasons.length > 1 ? ' (และอีก ' + (reasons.length-1) + ' เงื่อนไข)' : '') : 'พร้อมทดลองขั้นตอนนี้'; ui.status.className = reasons.length ? 'waiting' : 'ready'; });
    $('lab-purpose').disabled = state.scenario === 'commercial'; $('lab-site-revision').disabled = state.scenario === 'commercial';
    $('lab-result').replaceChildren();
    if (last) { const box = node('div', undefined, 'lab-callout' + (last.allowed ? '' : ' denied')); box.append(node('strong', (last.allowed ? 'ผ่าน / ' : 'หยุด / ') + E.labels[last.action]), node('p', last.message)); $('lab-result').append(box); }
    $('lab-evidence').replaceChildren();
    if (state.scenario === 'commercial') { evidence('ผู้ได้รับสิทธิ์อ่าน', 'Commercial + ผู้อนุมัติฝั่ง Owner'); evidence('เหตุผล', 'ขอบเขตความลับตามกลุ่มผู้รับ ไม่ตามตำแหน่ง Admin'); evidence('พื้นที่จัดเก็บ', state.folder + ' · ไม่เปลี่ยนรายชื่อผู้รับ'); }
    else { evidence('ผลตรวจภายใน', recordText(state.check)); evidence('ผลประสาน', recordText(state.coordination)); evidence('ชุดส่งขออนุมัติ', recordText(state.submission)); evidence('ผลอนุมัติ', recordText(state.authorization)); evidence('เลขออกเอกสาร', state.release ? state.release.reference + ' · ' + purposeName(state.release.purpose) : 'ยังไม่มี'); evidence('ชุดออกก่อนหน้า', state.history.length ? state.history.map(h => E.revisionLabel(h.revision) + ' / ' + h.status).join(' · ') : 'ยังไม่มี'); }
    const goals = state.scenario === 'commercial' ? [['admin:false','ลองอ่านด้วย Admin แล้วถูกหยุด'],['coordinator:false','ลองอ่านด้วย BIM แล้วถูกหยุด'],['commercial:true','Commercial อ่านได้'],['approver:true','ผู้อนุมัติฝั่ง Owner อ่านได้']] : [['move','ลองย้ายโฟลเดอร์ แล้วสังเกตสถานะ'],['share','ผ่านการตรวจและอนุญาตแชร์'],['authorize','ได้รับผลอนุมัติที่ระบุ revision + use'],['publish','ออกเอกสารควบคุม'],['use','ตรวจใช้หน้างานผ่าน'],['revise','เปิด revision ใหม่ แล้วสังเกตหลักฐาน']];
    $('lab-goals').replaceChildren(); goals.forEach(([key,text]) => { const done = state.achievements.includes(key); $('lab-goals').append(node('li', (done ? '✓ ' : '○ ') + text, done ? 'done' : '')); });
    $('lab-lesson').textContent = scenario.lesson;
    $('lab-log-count').textContent = state.events.length + ' รายการ · ถูกหยุด ' + state.events.filter(e => !e.allowed).length + ' ครั้ง';
    $('lab-log').replaceChildren();
    if (!state.events.length) $('lab-log').append(node('li','เริ่มจากลองสิ่งที่คุณคิดว่าทำได้ เช่น เปลี่ยนเป็น Admin แล้วขออ่าน WIP หรือย้ายโฟลเดอร์ไป Published','lab-empty'));
    [...state.events].reverse().forEach(e => { const li = node('li'); li.append(node('span', '#' + e.number, 'event-index')); const body = node('div'); body.append(node('strong', (e.allowed ? 'ผ่าน · ' : 'หยุด · ') + E.labels[e.action], e.allowed ? '' : 'rejected'), node('p', e.message), node('small', E.actors[e.actor].name + ' · ' + E.revisionLabel(e.revision) + ' · ' + purposeName(e.purpose) + ' · ' + new Date(e.at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}))); li.append(body); $('lab-log').append(li); });
    $('lab-storage-note').textContent = storageNote || 'บันทึกผลทดลองในเบราว์เซอร์นี้เท่านั้น · ไม่ส่งข้อมูลขึ้นเซิร์ฟเวอร์ · สลับบทบาทได้เพื่อเรียนรู้ · อย่าใส่ข้อมูลโครงการที่เป็นความลับ';
  }
  $('lab-actor').onchange = e => { state.actor = e.target.value; last = null; render(); };
  $('lab-purpose').onchange = e => { state.purpose = e.target.value; last = null; render(); };
  $('lab-location').onchange = e => run('move', e.target.value);
  $('lab-site-revision').onchange = e => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 1 && n <= 9999) state.siteRevision = n; render(); };
  $('lab-reflection').value = reflection; $('lab-reflection').oninput = e => { reflection = e.target.value; save(); };
  $('lab-reset').onclick = () => { state = E.create(state.scenario); reflection = ''; last = null; $('lab-reflection').value = ''; $('lab-reset-confirm').open = false; save(); downloadDraftNote(); render(); };
  function download(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = node('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  $('lab-export').onclick = () => download('cde-control-lab-' + state.scenario + '.json', JSON.stringify(data(), null, 2), 'application/json');
  $('lab-report').onclick = () => { const text = ['# Revit Thailand — บันทึกทดลองควบคุมงาน', '', E.scenarios[state.scenario].title, E.scenarios[state.scenario].lesson, '', '## สิ่งที่ทีมต้องตกลง', 'ผู้รับผิดชอบ / ผู้มีอำนาจ / revision / intended use / หลักฐาน / การเปลี่ยนแปลง / ขอบเขตผู้รับ', '', reflection || '(ยังไม่ได้บันทึก)', '', '## ประวัติการตัดสินใจ', ...state.events.map(e => e.number + '. ' + (e.allowed ? 'ผ่าน' : 'หยุด') + ' | ' + E.actors[e.actor].name + ' | ' + E.revisionLabel(e.revision) + ' | ' + e.purpose + ' | ' + e.at + '\n   ' + E.labels[e.action] + ': ' + e.message), '', 'ข้อมูลสมมติสำหรับเรียนรู้ ไม่ใช่หลักฐานอนุมัติงานจริง หรือ audit log ที่ป้องกันการแก้ไข'].join('\n'); download('cde-team-discussion.txt', text, 'text/plain;charset=utf-8'); };
  $('lab-import-button').onclick = () => $('lab-import').click();
  $('lab-import').onchange = async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > 1500000) throw new Error('ไฟล์ใหญ่เกิน 1.5 MB'); const input = JSON.parse(await file.text()); const restored = E.restore(input); state = restored; reflection = typeof input.reflection === 'string' ? input.reflection.slice(0,4000) : ''; $('lab-reflection').value = reflection; last = null; save(); render(); $('lab-transfer-status').textContent = 'นำเข้าแล้ว: เล่นการกระทำซ้ำตามกติกา ไม่เชื่อผลอนุมัติจากไฟล์โดยตรง'; } catch (err) { $('lab-transfer-status').textContent = 'นำเข้าไม่ได้: ' + (err instanceof SyntaxError ? 'JSON ไม่ถูกต้อง' : err.message); } finally { e.target.value = ''; } };
  render();
})();
