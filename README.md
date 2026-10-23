# Revit Thailand — DC01 Learning Lab

**2.7.0-beta.1 · Public beta · ข้อมูลสมมติทั้งโครงการ**

ทดลองใช้: [DC01 Learning Lab](https://leomanx.github.io/revit-thailand-dc01/) · [GitHub repository / แจ้งปัญหา](https://github.com/leomanx/revit-thailand-dc01)

เครื่องมือเรียนรู้ความสัมพันธ์ระหว่างพื้นที่ โมเดล เอกสาร คน และการตัดสินใจ ด้วยกรณี Data Center สมมติ ไม่ใช่ ACC integration, BIM authoring software หรือระบบอนุมัติงานจริง

## เริ่มใช้งาน

ใช้ Node.js 24 สำหรับ development / CI ไม่มี runtime npm dependencies ที่ต้อง install:

```text
npm test
npm start
```

เปิด `http://127.0.0.1:4173/landing.html` สำหรับหน้าแนะนำ หรือ `http://127.0.0.1:4173/datacenter.html` สำหรับเครื่องมือ สามารถเปิด HTML ใน browser รุ่นใหม่โดยตรงได้ด้วย ข้อมูลและ download payload ฝังสำหรับ offline; การเก็บผลข้ามการเปิด file:// ขึ้นกับ browser แนะนำใช้ HTTP preview เพื่อทดสอบ session

## ทดลองอะไรได้

Room fit-out เพิ่มองค์ประกอบ NOC / Office / MMR และพื้นที่อื่นรวม 39 กลุ่ม เลือกชิ้นส่วน 3D เพื่อเปิดเกณฑ์วัสดุ 11 schedules / 36 criteria พร้อม export brief JSON ดู `docs/ROOM_FITOUT.md`; ค่าเป็นเป้าหมายสมมติ ไม่ใช่ approved specification


- 3D / zones / services: Canvas scene พร้อม 19 representative assemblies และ 24 assets เชื่อมข้อมูลกับ file register และ access policy
- Zone Quest: 3 ภารกิจจัดกล่องพร้อมเส้นสัมพันธ์ snap / group / undo / hints ไม่มีตัวนับจำนวนขยับบนหน้าเกม
- Architecture Lab (`#view=architecture`): 7 กลุ่มพื้น ผนัง ฝ้า หลังคา façade ประตู ทางเข้าถึง; 3D layer study, spec / material substitutions, interfaces และ conceptual sun / wind / rain orientation
- Maintenance (`#view=maintenance`): 5 เคส corrective / PM, 11 work-control gates, personal duty ภายในบริษัท, จำกัดเวลา/โซน และ invalidation เมื่อพบ conflict
- Lifecycle: 14 stages, 25 fictional companies, 237 file records, 42 issues, 84 evidence requirements; ผูกหลักฐานและผลยอมรับกับ revision/context
- Access requests: pending / approve / deny / expiry / revoke / stale; read scope ไม่ให้อำนาจแก้เอกสารหรือ accept issue
- Impact: open severity backlog, revision ripple, asset data readiness และสมมติฐาน ROI / sensitivity ไม่ใช่ measured savings
- Handover / synthetic Twin: ตัวอย่างตรวจ identity, mapping, freshness, units และ quality ไม่มี live telemetry

Basic CDE Lab เดิมอยู่ `index.html` ใน source; ใน static release อยู่ `basics.html`

## Build / GitHub Pages

```text
npm run build:static
npm run audit:public
npm run preview:static
```

`dist/index.html` คือ Showcase, `dist/datacenter.html` คือเครื่องมือ. Preview output จริงอยู่พอร์ต 4174. Runtime allowlist แยก source/tests/tools/tmp/session ออกจาก public payload และสร้าง SHA-256 release manifest

ก่อน build สำหรับ hosting ตั้ง `SITE_URL` เป็น HTTPS base URL จริงรวม repository subpath เช่น `https://owner.github.io/repository/` เพื่อให้ social metadata ถูกปลายทาง ไม่ใช้ URL ตัวอย่างเป็นปลายทางจริง

- `.github/workflows/checks.yml`: tests → build → public payload audit บน push / PR ไม่มี deploy
- `.github/workflows/pages.yml`: manual Pages publish ผ่าน GitHub Actions; เผยแพร่เว็บจริงแล้วเมื่อ 2026-10-24 ดูขั้นตอนและขอบเขตการตรวจใน `docs/DEPLOYMENT.md`
- `netlify.toml`: static build configuration; การ deploy ยังขึ้นกับบัญชี/สิทธิ์และข้อจำกัดของ hosting
- `python tools/package-static.py`: ZIP เฉพาะ public payload ที่ตรวจ hashes แล้ว
- `python tools/package-public-source.py`: curated GitHub source ZIP พร้อม hashes ไม่รวม internal prompts / handoffs / local state
- `python tools/package-dc.py`: full local source/offline handoff ZIP สำหรับส่งต่องาน ไม่ใช่ ZIP สำหรับ public web root หรือ repository upload

## ขอบเขตที่ควรอ่านก่อนแชร์

อ่าน [Public notes](public-notes.html), [Public beta review](docs/PUBLIC_BETA_REVIEW.md) และ [Architecture handoff](docs/ARCHITECTURE_LAB.md)

12 MW IT เป็น program assumption ไม่ใช่ผล sizing. Campus เป็น teaching geometry แบบย่อ ไม่ได้จัดวางครบ 500 racks ต่อ Hall. Busway / pipe / asset specs เป็น representative samples ไม่ใช่หลักฐานว่าโหลดหรือพื้นที่ทั้งโครงการพอ ไม่มี Tier, code, fire, structural หรือ performance certification

รูปแบบชื่อ 7 fields, Rxx revisions, classification, hierarchy และ mandates เป็น project-defined exercises ไม่ใช่รูปแบบที่ ISO บังคับ. การสลับบทบาทไม่ใช่ authentication; ทุก static payload เป็นข้อมูลสาธารณะ. ห้ามนำข้อมูลโครงการจริงหรือ credential มาใส่

IFC4 sample เป็น 24 identity proxy boxes แยกจาก detailed viewer geometry; BCF 2.1, JSON, PDF มีไฟล์ตัวอย่างจริง ส่วน .rvt/.dwg/native names อื่นเป็น metadata ไม่มี binary ปลอม. ดู [Exchange validation](docs/EXCHANGE_VALIDATION.json)

ผลทดลองเก็บใน localStorage ตาม browser/origin. CDE Export ไม่รวม state ของ Zone Quest / maintenance / architecture ซึ่งแยกกัน. ไม่มี analytics หรือ runtime network call จากแอปเอง; hosting อาจเก็บ access logs. ตรวจข้อความส่วนตัวก่อนส่ง Export/Issue

Browser/mobile visual acceptance, actual GitHub runner, public URL และ hosted smoke test ยัง pending. Automated tests และ native Canvas renders ไม่ใช่หลักฐานว่าผ่าน browser, accessibility หรือ receiving commercial IFC/BCF viewer

## เนื้อหาและการมีส่วนร่วม

แจ้งปัญหาด้วย [แบบฟอร์มข้อความ](feedback-template.md) หรือ GitHub Issue templates ที่เตรียมไว้ ระบุ version / page / object / file ID / steps / expected result. ข้อโต้แย้งด้านเนื้อหาใส่ source, edition, clause และ applicability ถ้ามี ไม่จำเป็นต้องมีมาตรฐานอ้างอิงเพื่อแจ้ง UI bug

แก้ canonical case ที่ `data/datacenter-content.cjs` แล้วรัน `npm run data:dc`; ถ้า baseline เปลี่ยนต้องทบทวน sample packs, fingerprint และ session compatibility. Geometry service builder อยู่ `tools/build-services.cjs`; architecture และ maintenance เป็น teaching modules แยก ไม่แก้ canonical model หรือปลด CDE gates

Python validators / sample generators ต้องใช้ libraries ที่ระบุใน source (เช่น IfcOpenShell, lxml, pypdf, reportlab) แต่ไม่ต้องใช้เพื่อรันเว็บ ทดสอบ Node หรือ build static. Native contact sheet helper ต้องมี `@napi-rs/canvas`; ไม่ใช่ browser QA

เอกสาร milestone รุ่นเก่าใน docs เป็นประวัติการพัฒนา ให้ยึด README, Public notes และ handoff ล่าสุดก่อน ไม่มี LICENSE สำหรับการใช้ source ซ้ำที่เจ้าของเลือกในรุ่นนี้ จึงไม่อ้างว่าเป็น open-source licensed project. Revit Thailand เป็น independent learning project ไม่ได้รับการรับรองจาก Autodesk, ISO หรือเจ้าของแหล่งอ้างอิง

## เผยแพร่ตามคำขอ / GitHub Pages

อ่าน [Deployment guide](docs/DEPLOYMENT.md). คำสั่ง `python tools/publish-github.py` มีผลสร้าง public repo `leomanx/revit-thailand-dc01`, push curated source, เปิด Pages และรัน workflow เมื่อ credential/เครือข่ายพร้อม ใช้เฉพาะเมื่อเจ้าของอนุญาตเผยแพร่แล้ว ไม่มีการใช้ Netlify หรือซื้อเครดิต ไม่เขียน token ลงไฟล์. เครื่องมือทดสอบ publisher แบบ offline: `python tests/publish-github.test.py` (4 checks).
