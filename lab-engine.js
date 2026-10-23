/* Educational project policy, not an Autodesk permission implementation. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CDELab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const actors = {
    author: { name: 'ผู้ออกแบบ ARC', company: 'ARC' },
    lead: { name: 'หัวหน้าสถาปนิก', company: 'ARC' },
    coordinator: { name: 'ผู้ประสาน BIM', company: 'LEAD' },
    controller: { name: 'Document Controller', company: 'LEAD' },
    approver: { name: 'ผู้อนุมัติที่ได้รับมอบหมาย', company: 'OWNER' },
    site: { name: 'หัวหน้าหน้างาน', company: 'CON' },
    admin: { name: 'ผู้ดูแล CDE', company: 'ADMIN' },
    commercial: { name: 'ผู้จัดการ Commercial', company: 'COST' }
  };
  const scenarios = {
    coordination: { title: '01 แบบเสร็จ ≠ พร้อมก่อสร้าง', file: 'PRJ-ARC-ZZ-01-DR-A-0001.pdf',
      brief: 'ทีม ARC ทำแบบเสร็จแล้ว ผู้รับเหมาเร่งขอใช้วันนี้ ลองย้ายโฟลเดอร์หรือใช้บัญชี Admin แล้วตรวจว่าผ่านจุดควบคุมได้หรือไม่',
      lesson: 'สิ่งที่ควบคุมคือการตัดสินใจต่อข้อมูล revision ที่ระบุ เพื่อวัตถุประสงค์ที่ตกลง พร้อมผู้รับผิดชอบและหลักฐาน',
      expected: ['บันทึกผลตรวจ', 'อนุญาตแชร์', 'บันทึกประสาน', 'ส่งขออนุมัติ', 'อนุมัติ', 'ออกเอกสาร', 'ตรวจใช้หน้างาน'] },
    change: { title: '02 แบบเปลี่ยน หลักฐานเดิมยังใช้ได้หรือ?', file: 'PRJ-ARC-ZZ-01-DR-A-0002.pdf',
      brief: 'R01 เคยออกให้ก่อสร้างแล้ว แต่มีการเปลี่ยนแบบเป็น R02 และโครงการกำหนด Hold ระหว่างทบทวน ลองนำ R01 ไปใช้ หรือใช้การอนุมัติเดิมกับ R02',
      lesson: 'การอนุมัติต้องผูกกับ revision และ intended use เสมอ ในเคสนี้ change notice กำหนด Hold จนกว่าจะออก revision ใหม่ ไม่ใช่กฎว่า revision ใหม่ทุกชนิดต้องหยุดงานโดยอัตโนมัติ',
      expected: ['ปฏิเสธ revision เก่า', 'ตรวจและอนุมัติ R02 ใหม่', 'ออกเอกสาร R02', 'ตรวจใช้หน้างาน R02'] },
    commercial: { title: '03 มีหน้าที่ ≠ มีสิทธิ์เห็นทุกเรื่อง', file: 'PRJ-CST-ZZ-ZZ-RP-C-0001.pdf',
      brief: 'รายงานต้นทุนถูกเก็บในพื้นที่ Commercial ผู้ประสาน BIM และ Admin ต้องทำงานเกี่ยวข้อง แต่ไม่ได้อยู่ในรายชื่อผู้รับข้อมูล ลองขออ่านแล้วดูขอบเขตสิทธิ์',
      lesson: 'หน้าที่ใน RACI ไม่เปิดสิทธิ์อ่านโดยอัตโนมัติ การตั้งสิทธิ์ต้องแยกจากอำนาจอนุมัติ และขอบเขตความลับต้องทดสอบกับผู้ใช้ตัวแทน',
      expected: ['Admin ถูกปฏิเสธ', 'BIM ถูกปฏิเสธ', 'Commercial อ่านได้', 'Owner อ่านได้'] }
  };
  function create(scenario = 'coordination') {
    if (!Object.hasOwn(scenarios, scenario)) throw new Error('Unknown scenario');
    return { version: 1, scenario, actor: 'author', revision: scenario === 'change' ? 2 : 1,
      state: 'WIP', folder: scenario === 'commercial' ? 'Commercial' : 'WIP', purpose: 'construction',
      siteRevision: scenario === 'change' ? 1 : 1, check: null, coordination: null,
      submission: null, authorization: null, release: null,
      history: scenario === 'change' ? [{ revision: 1, purpose: 'construction', reference: 'ISSUE-R01-DEMO', status: 'HOLD / superseded in this scenario' }] : [],
      events: [], achievements: [] };
  }
  const revisionLabel = n => 'R' + String(n).padStart(2, '0');
  function canRead(s) {
    if (s.scenario === 'commercial') return ['commercial', 'approver'].includes(s.actor);
    if (s.state === 'WIP') return ['author', 'lead'].includes(s.actor);
    if (s.state === 'SHARED') return ['author', 'lead', 'coordinator', 'controller', 'approver'].includes(s.actor);
    return ['author', 'lead', 'coordinator', 'controller', 'approver', 'site'].includes(s.actor);
  }
  function blockers(s, action) {
    const reasons = [];
    const role = (ids, text) => { if (!ids.includes(s.actor)) reasons.push(text); };
    const evidence = (key, text) => { if (!s[key] || s[key].revision !== s.revision) reasons.push(text); };
    if (s.scenario === 'commercial' && !['read', 'move'].includes(action)) return ['เคสนี้ฝึกขอบเขตการอ่านข้อมูล Commercial; ใช้เคส 01 หรือ 02 เพื่อฝึกออกเอกสาร'];
    switch (action) {
      case 'read': if (!canRead(s)) reasons.push(s.scenario === 'commercial' ? 'ไม่มีชื่อในกลุ่ม Commercial ที่ได้รับสิทธิ์อ่าน แม้เป็น Admin หรือมีงานใน RACI' : 'บทบาทนี้ไม่ได้รับสิทธิ์อ่านข้อมูลในสถานะปัจจุบัน; ตำแหน่งโฟลเดอร์ไม่เพิ่มสิทธิ์'); break;
      case 'check': role(['lead'], 'ต้องเป็นหัวหน้าสถาปนิกที่ได้รับมอบหมายตรวจภายใน'); if (s.state !== 'WIP') reasons.push('การตรวจภายในชุดนี้ทำใน WIP; หากเปลี่ยนเนื้อหาให้เปิด revision ใหม่'); break;
      case 'share': role(['lead'], 'ผู้อนุญาตแชร์ต้องเป็นหัวหน้าสถาปนิกตามนโยบายเคสนี้'); evidence('check', 'ยังไม่มีผลตรวจภายในของ revision นี้'); if (s.state !== 'WIP') reasons.push('ต้องเริ่มจาก WIP'); break;
      case 'coordinate': role(['coordinator'], 'ต้องเป็นผู้ประสาน BIM ที่ได้รับมอบหมาย'); if (s.state !== 'SHARED') reasons.push('ต้องอนุญาตแชร์ก่อนให้ทีมอื่นประสาน'); break;
      case 'submit': role(['controller'], 'Document Controller เป็นผู้จัดชุดส่งในเคสนี้'); if (s.state !== 'SHARED') reasons.push('ข้อมูลต้องอยู่ใน SHARED'); evidence('check', 'ขาดผลตรวจ revision นี้'); evidence('coordination', 'ขาดผลประสานที่ปิดประเด็นของ revision นี้'); break;
      case 'authorize': role(['approver'], 'ต้องเป็นผู้อนุมัติที่ได้รับมอบหมาย; Manage หรือ RACI อย่างเดียวใช้แทนไม่ได้'); if (s.state !== 'SHARED') reasons.push('ต้องอยู่ใน SHARED ก่อนพิจารณา'); evidence('submission', 'ยังไม่มีชุดส่งขออนุมัติ revision นี้'); evidence('coordination', 'ยังไม่มีผลประสาน revision นี้'); if (s.submission && s.submission.purpose !== s.purpose) reasons.push('วัตถุประสงค์ไม่ตรงกับชุดส่ง'); break;
      case 'publish': role(['controller'], 'ผู้มีสิทธิ์ออกเอกสารในเคสนี้คือ Document Controller'); if (s.state !== 'SHARED') reasons.push('ต้องเป็นชุด SHARED ที่รอออกเอกสาร'); evidence('authorization', 'ยังไม่มีผลอนุมัติอย่างชัดแจ้งสำหรับ revision นี้'); if (s.authorization && s.authorization.purpose !== s.purpose) reasons.push('ผลอนุมัติไม่ครอบคลุมวัตถุประสงค์ที่เลือก'); break;
      case 'use': role(['site'], 'ให้หัวหน้าหน้างานตรวจชุดที่จะนำไปใช้'); if (!s.release || s.state !== 'PUBLISHED') reasons.push('ยังไม่มีชุดออกเอกสารที่ใช้งานได้ และเคสเปลี่ยนแบบกำหนด Hold ชุดเดิม'); if (s.siteRevision !== s.revision) reasons.push('revision ที่หน้างานถือไม่ตรงกับ revision ปัจจุบัน'); if (!s.release || s.release.purpose !== 'construction') reasons.push('ยังไม่มีผลอนุญาตใช้เพื่อก่อสร้าง; ชุดเพื่อประสานใช้แทนไม่ได้'); break;
      case 'revise': role(['author'], 'การแก้เนื้อหาในเคสนี้ทำโดยผู้ออกแบบ ARC'); break;
      case 'move': break;
      default: reasons.push('ไม่รู้จักการกระทำนี้');
    }
    return reasons;
  }
  const labels = { read: 'ขออ่านข้อมูล', check: 'บันทึกผลตรวจภายใน', share: 'อนุญาตแชร์', coordinate: 'บันทึกผลประสาน', submit: 'ส่งขออนุมัติ', authorize: 'อนุมัติเพื่อวัตถุประสงค์ที่ระบุ', publish: 'ออกเอกสารควบคุม', use: 'ตรวจใช้หน้างาน', revise: 'เปิด revision ใหม่', move: 'เปลี่ยนตำแหน่งโฟลเดอร์' };
  function act(s, action, value, now = new Date().toISOString()) {
    const reasons = blockers(s, action);
    if (action === 'move' && !['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED', 'Commercial'].includes(value)) reasons.push('ตำแหน่งโฟลเดอร์ไม่ถูกต้อง');
    let message = reasons.join(' • ');
    if (!reasons.length) {
      const record = () => ({ revision: s.revision, actor: s.actor, purpose: s.purpose, at: now });
      switch (action) {
        case 'read': message = 'ได้รับสิทธิ์อ่านในขอบเขตตัวอย่างนี้ การอ่านไม่ได้อนุมัติให้ก่อสร้าง'; break;
        case 'check': s.check = record(); message = 'บันทึกผลตรวจภายใน revision นี้แล้ว ยังไม่แชร์ให้ทีมอื่น'; break;
        case 'share': s.state = 'SHARED'; s.folder = 'SHARED'; message = 'อนุญาตแชร์เพื่อประสานแล้ว ยังไม่ใช่การอนุญาตก่อสร้าง'; break;
        case 'coordinate': s.coordination = record(); s.submission = null; s.authorization = null; message = 'บันทึกผลประสานและปิดประเด็นของ revision นี้ ต้องส่งให้ผู้มีอำนาจพิจารณาต่อ'; break;
        case 'submit': s.submission = record(); s.authorization = null; message = 'จัดชุดส่งพร้อม revision และวัตถุประสงค์แล้ว ยังรอผลอนุมัติ'; break;
        case 'authorize': s.authorization = record(); message = 'บันทึกผลอนุมัติสำหรับ ' + revisionLabel(s.revision) + ' / ' + s.purpose + ' ต้องออกเอกสารควบคุมต่อ'; break;
        case 'publish': s.release = { ...record(), reference: 'ISSUE-' + revisionLabel(s.revision) + '-' + (s.history.length + 1) }; s.history.push({ ...s.release, status: 'Issued' }); s.state = 'PUBLISHED'; s.folder = 'PUBLISHED'; message = 'ออกเอกสารพร้อมเลขอ้างอิงแล้ว สิทธิ์ใช้ขึ้นกับ revision และวัตถุประสงค์'; break;
        case 'use': message = 'ผ่านจุดตรวจข้อมูลของสถานการณ์จำลอง: revision ตรงและออกเพื่อก่อสร้างแล้ว การอนุญาตทำงานจริงยังขึ้นกับเงื่อนไขโครงการอื่น'; break;
        case 'revise': s.revision++; s.state = 'WIP'; s.folder = 'WIP'; ['check', 'coordination', 'submission', 'authorization', 'release'].forEach(k => s[k] = null); s.history.forEach(h => h.status = 'HOLD / superseded in this scenario'); message = 'เปิด revision ใหม่และ Hold ชุดเดิมตามนโยบายเคสนี้ หลักฐาน revision เก่ายังอยู่ในประวัติ แต่ใช้อนุมัติ revision ใหม่ไม่ได้'; break;
        case 'move': s.folder = value; message = 'เปลี่ยนตำแหน่งแล้ว สถานะข้อมูล ผลอนุมัติ และสิทธิ์ใช้ยังเหมือนเดิม'; break;
      }
    }
    const event = { number: s.events.length + 1, action, actor: s.actor, revision: s.revision, purpose: s.purpose, siteRevision: s.siteRevision, value: action === 'move' ? value : null, allowed: !reasons.length, message, at: now };
    s.events.push(event);
    const achievement = s.scenario === 'commercial' ? (action === 'read' ? s.actor + ':' + event.allowed : '') : (event.allowed ? action : action === 'use' && s.siteRevision !== s.revision ? 'stale-blocked' : '');
    if (achievement && !s.achievements.includes(achievement)) s.achievements.push(achievement);
    return event;
  }
  // Replay validated actions instead of trusting imported state/approval flags.
  function exportSession(s) {
    return { format: 'revit-thailand-control-lab', version: 1, scenario: s.scenario,
      actions: s.events.map(e => ({ actor: e.actor, action: e.action, purpose: e.purpose, revision: e.revision,
        siteRevision: e.siteRevision || 1, value: e.value || null, at: e.at })), reflection: '' };
  }
  function restore(input) {
    if (!input || input.format !== 'revit-thailand-control-lab' || input.version !== 1 || !Object.hasOwn(scenarios, input.scenario) || !Array.isArray(input.actions) || input.actions.length > 1000) throw new Error('รูปแบบไฟล์ไม่ถูกต้อง หรือมีรายการเกิน 1,000 รายการ');
    const s = create(input.scenario);
    for (const item of input.actions) {
      if (!item || !Object.hasOwn(actors, item.actor) || !Object.hasOwn(labels, item.action) || !['coordination', 'construction'].includes(item.purpose) || !Number.isInteger(item.siteRevision) || item.siteRevision < 1 || item.siteRevision > 9999 || (item.value !== null && (typeof item.value !== 'string' || item.value.length > 40)) || typeof item.at !== 'string' || item.at.length > 40 || !Number.isFinite(Date.parse(item.at))) throw new Error('ข้อมูลการกระทำไม่ถูกต้อง');
      s.actor = item.actor; s.purpose = item.purpose; s.siteRevision = item.siteRevision;
      const e = act(s, item.action, item.value, item.at); e.siteRevision = s.siteRevision; e.value = item.value;
    }
    return s;
  }
  return { actors, scenarios, labels, create, blockers, canRead, act, revisionLabel, exportSession, restore };
});
