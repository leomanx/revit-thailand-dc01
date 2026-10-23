# DC01 — SIAM EDGE / Data Center lifecycle learning case

## เริ่มใช้

เปิด `datacenter.html` ด้วยเบราว์เซอร์ หรือรัน `npm start` แล้วเปิด `http://127.0.0.1:4173` ไม่ต้องติดตั้ง npm dependencies ตัวแอปไม่ใช้ fetch, CDN หรือ ES module imports จึงเตรียมไว้สำหรับใช้ออฟไลน์ด้วยไฟล์ relative

มุมมองมี 7 ส่วน: ภาพรวม / โซนและองค์กร / ทะเบียนไฟล์ / Lifecycle / Asset–Handover–Twin / บันทึกการตัดสินใจ / กติกาและแหล่งอ้างอิง

## สมมติฐานโครงการ

- DC01 เป็นโครงการและบริษัทสมมติทั้งหมด ไม่มีข้อมูลสถานที่ ลูกค้า ผู้เช่า หรือ security topology จริง
- 2 Data Halls × 500 racks × 12 kW เฉลี่ยสมมติ = 12 MW **IT load** ไม่ใช่ facility/utility demand หรือผล sizing ที่ตรวจแล้ว
- A/B คือชื่อเส้นทางเชิงแนวคิด ไม่ใช่ข้อยืนยัน independence, 2N, Tier หรือ certification
- 6 chiller objects เป็น inventory เพื่ออธิบายข้อมูล ไม่ใช่หลักฐาน capacity/duty/standby/N+1
- แสดงหลายช่วงเวลาใน master case เดียว ไม่อ้างว่าทุกไฟล์เป็นฉบับมีผลพร้อมกัน
- ทุกเกณฑ์ gate, code, required field และบทบาทเป็น project-defined example ต้องแทนด้วย appointment/EIR/AIR/BEP/approval matrix ของโครงการจริง

## โซนและมิติข้อมูล

| Volume / Zone | ขอบเขต | Lead interface |
| --- | --- | --- |
| SITE | campus, survey basis, utility/drainage/access | CIV |
| DH1 / DH2 | Data Hall 1/2, rack/cooling/containment/fire interfaces | ARC / multidisciplinary |
| E01 / E02 | electrical gallery, Path A/B, UPS and service zones | ELD |
| GEN | generator, fuel/exhaust/lifting interfaces | ELD / VGE / STR |
| CHY | cooling yard, chillers, pumps and isolation/access | MCD / MCS / VCH |
| NOC | operations, BMS/EPMS, alarm ownership, data mappings | ICT / BMS / OPS |
| MMR | carrier entry, diverse pathways, security boundaries | ICT / SEC |
| OFF | support/training/office and controlled-access boundary | ARC |
| RF | roof plant, loads, maintenance and access | MCD / STR |

Volume/zone, company, discipline, system, phase, CDE state และ intended use เป็นคนละมิติ พื้นที่ Commercial หรือ Site process ไม่ใช่ CDE state เพิ่ม

## บริษัทและตัวแทนข้อมูล

25 originators ครอบคลุม Owner, PMO, Information Manager/Admin, ARC, STR, CIV, Electrical/Mechanical/Public Health/Fire/ICT/Security designers, BMS integrator, QS, Main Contractor, Electrical/Mechanical specialists, UPS/Generator/Chiller vendors, CxP, Survey, FM, Twin integrator และ Authority reviewer แบบสมมติ รายละเอียด remit, deliverables และ code อยู่ในมุมมองโซน/องค์กร

ชื่อบริษัทบอกผู้จัดทำข้อมูล ไม่ได้ให้อำนาจอนุมัติทั้งโครงการ ผู้สวมบทบาททำได้เฉพาะหน้าที่ที่เคสกำหนด แต่อัตลักษณ์เป็น simulation ไม่มี login จึงใช้บังคับสิทธิ์จริงไม่ได้

## 14 ช่วงงาน / 42 ปัญหา

| Stage | ข้อมูลหลัก | ตัวอย่างปัญหาที่ต้องควบคุม |
| --- | --- | --- |
| BRF / Brief | OPR, EIR, AIR, MIDP, decision register | นิยาม 12 MW ไม่ตรงกัน / AIR ช้า / ไม่มี mandate |
| CON / Concept | massing, SLD, cooling BOD, cost, initial Cx | A/B มี common path / เปลี่ยน UPS ไม่ได้ / weather basis ต่าง |
| SD / Schematic | discipline models, federation, fire/ICT/security | coordinate basis ไม่ตรง / density กับ load ไม่ตรง / maintenance envelope |
| DD / Design Development | SLD/load, P&ID, SOO, fire matrix, points | revision ไม่ตรง / SOO ขัดกัน / vendor weights เปลี่ยน |
| TND / Tender | tender register, BOQ, specs, model reliance | bidder คนละ addendum / ใช้ tender ก่อสร้าง / ข้อมูลลับรั่ว |
| PRM / Permit | controlled submissions, conditions tracker | เหมา approval ทุก scope / ยื่นคนละ revision / เงื่อนไขไม่มี owner |
| PRC / Procurement | certified GA, objects, deviations, FAT | รุ่นแทน interface เปลี่ยน / serial ไม่ตรง FAT / vendor object uncontrolled |
| SHP / Shop | specialist models/drawings, federation, BCF | แก้ clash เสีย A/B intent / opening คนละ revision / sequence/access |
| CST / Construction | work package, ITP/inspection, RFI/NCR, redline | PDF เก่าในแชต / RFI ไม่กลับเข้า records / ปิด NCR จากรูปอย่างเดียว |
| CXC / Commissioning | readiness, functional/integrated tests, exceptions | equipment pass แต่ integrated fail / config คนละ version / เวลาไม่ตรง |
| ASB / As-built | verified record models, scan/dependencies, tags | model ไม่ตรง field change / เดา serial จาก scan / RCP ขาด RCS |
| HOV / Handover | AIR/asset exchange, manuals, training, defects | หา manual ไม่เจอ / IDs ซ้ำและข้อมูลขาด / รับ critical defect แบบไร้ owner |
| FM / Operation | CMMS, SOP/MOP/EOP, service/change records | serial เปลี่ยนไม่อัปเดต / valve tag เก่า / defect closure คนละระบบ |
| DTW / Digital Twin | mappings, point contract, synthetic readings | UPS ผิดตัว / stale ยังเขียว / มี viewer แต่ไม่มี use case/update owner |

Tender/Permit/Procurement และ phased construction อาจซ้อนกันในคนละ scope การกดดู stage ไม่ใช่ transition ที่อนุมัติทั้งโครงการ

## วิธีเล่นปัญหาหนึ่งเรื่อง

1. เลือก stage อ่านปัญหาและผลกระทบ แล้วเลือกวิธีจัดการ การตอบถูกยังไม่ปิดประเด็น
2. อ่านผู้รับผิดชอบหลักฐานทั้งสองชุด สลับบทบาทที่เมนูด้านบนหรือปุ่มสวมบทบาทข้างหลักฐาน
3. ทดลองรับด้วยบริษัทผิดเพื่อดูเหตุผล แล้วรับ/ยืนยันด้วย provider ที่ระบุ ระบบบันทึก file ID, revision และ source context
4. สลับไปยัง named receiving authority ของประเด็น แล้วทดลองผ่าน gate
5. เปิด revision ใหม่ของหลักฐานหรือ related source โดย originator ผล/หลักฐานเดิมจะล้าสมัย ต้อง provider review และรับใหม่
6. ดูบันทึกและ export ผลทดลองกลับไปอภิปรายว่าระบบจริงมีจุดที่ยังข้ามได้หรือไม่

การรับหลักฐานในบทเรียนสมมติว่า provider ได้ตรวจ applicability/contents และมีผลรองรับแล้ว ตัวแอปไม่ได้อ่าน binary เพื่อพิสูจน์การตรวจจริง หาก source เปลี่ยน การ re-attest ต้องมี review/no-impact assessment หรือหลักฐานแก้ไขที่ appropriate ในโครงการจริง

## ไฟล์ / Naming / Baseline

ตัวอย่าง `DC01-ELD-E02-00-M3-E-0001.rvt`

| Field | ค่า | ความหมาย |
| --- | --- | --- |
| Project | DC01 | รหัสโครงการ |
| Originator | ELD | Volt Design Partners / Electrical Designer |
| Volume/System | E02 | spatial electrical gallery / Path B |
| Level/Location | 00 | ground/service floor |
| Type | M3 | model ใน code register นี้ |
| Role | E | electrical function |
| Number | 0001 | identifier ในกลุ่มรหัสนี้ |

Revision `R01/R02`, status/intended use, classification, stage และ confidentiality อยู่ใน metadata ไม่เติมเป็น field 8/9 และไม่อ้างว่า `Rxx` เป็น revision rule ของ ISO ทุกโครงการ รหัส M3/CM/DR/RP/SH/SP/OM/OB/IS และ discipline codes เป็นตัวอย่างที่ตั้งขึ้นเฉพาะ DC01

Archive เก็บ superseded snapshot ใน revision folder โดยใช้ชื่อ container เดิมได้ โดยไม่แปลว่าแก้ไขประวัติได้ Model native WIP และ IFC/PDF derivative ที่ออกให้ผู้รับอาจอยู่คนละ CDE state มี `dependencyVersions` ระบุฉบับที่อ้างตอนออก แต่ไม่มีการ sync binaries หรือ downstream design อัตโนมัติ

## Asset และ Twin

- 24 asset examples มี UPS A/B, switchboards, generators, chillers, CRAH, pumps และ racks เป็น representative rows ไม่ใช่ inventory เต็ม 12 MW
- Submitted data มี 6 findings ใน 4 rows: AS002 serial ว่าง, AS006 manual ว่าง, AS011 warranty start ว่าง, AS021 AssetID ไม่ตรงและซ้ำกับ AS022 (duplicate ทั้งสองแถว)
- แก้ได้ด้วย GCC/OPS โดยดู verified reference สมมติหรือกด reconcile จากนั้น HOV-02 จึงผ่านได้ การแก้หลังรับข้อมูลทำให้ต้องรับ HOV-02 ใหม่
- ตรวจค่าที่ populated แต่ไม่ตรง verified reference ด้วย ไม่ใช่เพียง non-empty
- Digital thread แสดงตัวอย่างข้อมูลที่เกี่ยวข้องในแต่ละ stage ต้องตรวจ applicability จริง ไม่ใช่ automatic certification ว่าเอกสารทุกไฟล์ครอบคลุม asset นั้น
- Twin มี 5 synthetic cases: valid, wrong source asset, stale, wrong units, bad quality ส่วนที่ไม่ผ่านแสดง UNKNOWN ใช้แทน normal ไม่ได้
- อายุข้อมูล 120 วินาทีเป็น threshold สมมติสำหรับสอน ไม่ใช่ universal standard ไม่ตรวจ performance alarm limits หรือสั่งควบคุมอุปกรณ์จริง

## ชุดไฟล์เปิดได้จริง

`samples/DC01-learning-exchanges.zip` มี IFC4 proxy model (24 asset boxes), BCF 2.1 (3 topics + selected GUID + camera + schematic snapshot), JSON mapping, JSON synthetic telemetry, PDF casebook (14 stage pages + source page), README และ SHA-256 manifest

IFC ไม่ใช่ export ของ `.rvt` ที่ระบุในทะเบียน และ BCF snapshot ไม่ใช่ผลตรวจ clash จาก model production ไฟล์ native/document editable อื่นในทะเบียนเป็น catalog-only รายการที่ดาวน์โหลดได้ถูกระบุด้วย `download` / ป้ายเปิดตัวอย่างได้จริงอย่างชัดเจน

## Developer notes

- เนื้อหา: `data/datacenter-content.cjs`; canonical output: `data/datacenter.json`; offline browser output: `data/datacenter.js`
- Generate data: `npm run data:dc`; Node tests: `npm test`; local preview: `npm start`
- Generate genuine samples with the bundled Python: `python tools/build-dc-samples.py` (reportlab + Pillow)
- Exchange validation: `python tools/validate-dc-exchanges.py --schemas tmp/bcf-schemas --ifc-path tmp/ifc-validation` (IfcOpenShell, lxml, pypdf)
- IfcOpenShell and official XSD caches in `tmp/` are verification dependencies, not app runtime dependencies or part of the distributable
- Import limits: 2.5 MB / 2,000 actions / 8,000 note characters. Replays validated actions instead of accepting imported approval flags. Sessions ต้องตรง dataset fingerprint จึงไม่ replay ข้าม baseline ที่ file IDs อาจเปลี่ยน. User text is HTML-escaped or assigned via DOM value/text methods

ไม่มี backend, authentication, CDE/OT connection, authority verification, standards certification, complete IFC engineering model หรือ tamper-resistant audit log
