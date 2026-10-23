# Dimensioned service model update

2026-10-21 · เพิ่มรายละเอียดก่อนทำ static/social release · app 2.3

เพิ่ม service assemblies 19 ชุดใน `scene.serviceDetail` สร้างเป็น 1,047 component meshes จาก `dc-detail.js` ใช้เส้นทางเป็นฐานสร้างรูปทรงสามมิติที่มีหน้าตัดและมิติจริงในหน่วยเมตร ไม่ใช่เพียงเพิ่มความหนาของ single-line บนจอ

## สิ่งที่เพิ่ม

| ชนิด | จำนวน assemblies | Geometry / metadata |
| --- | ---: | --- |
| Busway | 6 | Main A/B 4000 A; representative hall branches A/B 1600 A; casing 340 × 180 mm, colour stripe, module joints, tap-off boxes/cable tails, trapeze supports/hanger rods, terminal bars และ PE |
| CHW | 3 | Header DN300 และ hall branches DN200; supply/return คนละเส้น, 50 mm radial insulation, rounded corner meshes, valves/handwheel representation, flanges และ saddles |
| ICT ladder tray | 1 | 600 × 100 mm envelope, side rails, rungs, divider และ cable runs 12 เส้น |
| Main shafts | 2 | Electrical และ mechanical risers จาก L00 ถึง +7.20 m; translucent enclosure, floor collars, vertical busways/CHW และ drain |
| Doors | 3 | Main double-leaf glazed entrance 2400 × 2400 mm พร้อม canopy/apron/posts, service door 2000 × 2600 mm และ hall personnel door 1200 × 2300 mm; jamb/head/leaf/handle/threshold เป็น meshes |
| Underground bundles | 4 | Power A/B ชุดละ 8 × Ø160 mm (4 columns × 2 rows), carrier ชุดละ 4 × Ø110 mm (2 × 2), individual conduits, end-bore markers และ draw-pit covers |

โมเดลนี้เป็น dimensioned teaching geometry ไม่ใช่ vendor-selected product, fabrication geometry หรือ native/IFC geometry loader สัดส่วน รายละเอียด การยึดแขวน joint spacing ฉนวน door opening และ shaft envelope เป็นค่าที่ตั้งสำหรับกรณีสมมติ ยังไม่ใช่ผลตรวจข้อกำหนด/การก่อสร้าง

## สเปคและการคำนวณที่แยกชนิด

- Busway 400 V 3-phase, PF 0.95; Main 4000 A ตั้ง assumed load 1800 kW; branch 1600 A ตั้ง 800 kW ค่า ideal kW แสดงจาก `√3 × V × A × PF / 1000` ไม่ใช่ rating ที่ผ่าน derating, short-circuit, harmonic, neutral, voltage drop หรือ protection coordination
- CHW 7/13 °C (ΔT 6 K): header 2400 kW thermal, branches 1200 + 1200 kW thermal; flow จาก `Q / (4.186 × ΔT)` โดยประมาณ density = 1 kg/L Supply และ return เป็น flow เดียวที่ไป/กลับ ไม่บวกกำลังความเย็นหรือ flow สองครั้ง
- Rack 12 kW เป็น TOTAL representative IT load แม้มี A/B inputs 2 ทาง ไม่ตีความเป็น 24 kW
- UPS แยก output, assumed efficiency และ loss; Generator แยก kVA/PF/kW; Chiller แยก cooling kW, electrical input, assumed COP และ total heat rejection; CRAH/Pump แยก cooling/fan/motor/flow/head
- ลบ Heat Rej แบบรวมคลุมเครือใน spatial card เดิม เพื่อไม่ให้ local illustrative heat คละกับ total chiller heat rejection
- ไม่บวก representative branch/main rating ทั้งหมดแล้วอ้างว่ารองรับ campus 12 MW: ขอบเขตนี้เป็นเพียงบาง feeder/branch และ inventory ตัวอย่าง ไม่ใช่ load schedule หรือ redundancy/capacity proof
- จุดใต้ดินเดิมใช้เป็น **bundle centreline** ในรายละเอียดใหม่ แสดง `Bundle CL` แทนการเรียกทุก route coordinate ว่า invert โดยไม่มีการหัก radius/offset ให้ถูกต้อง

อ้างอิงหลักการ/รูปแบบองค์ประกอบจาก [Schneider Electric — busbar trunking families](https://www.se.com/uk/en/product-subcategory/80119-high-power-canalis-busbar/) และ [Belimo — heat transfer relation](https://www.belimo.com/at/sr_RS/energy-valve/hvac-applications/computer-room-air-conditioner) ค่าหน้าตัด รายละเอียด และ nameplate ใน DC01 เป็นสมมติ ไม่ใช่การคัดลอก selected product หรือการรับรองโดยผู้ผลิต

## วิธีดูในหน้าเว็บ

1. Refresh หน้าเดิม แล้วเปิด **3D Model & โซนพื้นที่**
2. ใน Object Tree เลื่อนลง **Service assemblies (19)** ค้นด้วยชื่อเช่น `BW-A-MAIN`, `CHW-HEADER`, `SHAFT-ELE-01`, `DOOR-MAIN-01` หรือเลือกจากตัวรูปทรงในฉาก
3. เลือก service แล้วแยกดู assembly และ fit ในกรอบให้อัตโนมัติ Inspector แสดง specs, จำนวนท่อ/เส้น, assumed duty/flow, owner, asset links และ file package context พร้อมสิทธิ์อ่านปัจจุบัน
4. กด **คืนบริบทอาคาร** เพื่อกลับไปดู campus หรือเลือก asset เพื่อกลับข้อมูลเฉพาะชิ้น
5. **Detailed services** เปิด/ปิดรูปทรงรายละเอียดได้; Routes และ Duct Banks ยังควบคุมแยกกัน เส้นทางข้ามโซนซ่อนขณะ Explode เพื่อไม่แสดงการเชื่อมต่อผิดตำแหน่ง เลือก network assembly อีกครั้งจะออกจาก Explode และเปิด overlay ที่จำเป็น

Geometry ใช้ painter depth sorting กับ back-face culling สำหรับ opaque service faces และ polygon hit-testing; ไม่ใช่ solid boolean, collision solver หรือ full occlusion engine ท่อ bend/valve/handwheel เป็น simplified components ไม่ใช่ fabrication-ready fittings

## Verification / ข้อจำกัด

- 108 automated tests ผ่าน: เดิม 95 + geometry 11 + UI selection/spec cards 2
- ตรวจ stable IDs/refs/owner, nonzero orthogonal source segments, finite mesh vertices/faces, individual conduit counts, pipe pair separation, busway/thermal arithmetic, door leaf counts, shafts, filter/explode/isolation, service picking และ fit-framing ทุก assembly
- เรนเดอร์ด้วย native Canvas จาก scene และ renderer เดียวกับ Viewer เพื่อดูรูปร่างที่ `SERVICE_DETAIL_PREVIEW.png` ภาพนี้ไม่ใช่ browser screenshot และไม่ได้พิสูจน์ browser/mobile layout
- Browser/native fullscreen/touch visual acceptance ยังไม่ได้ทำในรอบนี้ตามข้อจำกัดเดิม ไม่ใช่ผลผ่านเพราะ unit tests
- IFC ดาวน์โหลดเดิมยังเป็น 24 identity proxy boxes ไม่ได้เปลี่ยนเป็น geometry busway/door/shaft ชุดนี้ และไม่แอบอ้างว่าเป็น detailed export
- เปลี่ยน model/data fingerprint แล้ว session ก่อนหน้าไม่ replay ข้าม baseline อัตโนมัติ ข้อความเดิมสำรองใน localStorage ตามกลไกเดิม และเพิ่มปุ่มดาวน์โหลด session ที่สำรองในหน้า **บันทึกการตัดสินใจ**

โค้ดข้อมูลอยู่ที่ `tools/build-services.cjs` ถูกเรียกโดย `tools/build-datacenter.cjs`; geometry อยู่ `dc-detail.js`; selection/spec UI อยู่ `dc-ui.js` ไม่มี dependency ใหม่ในแอปที่ผู้ใช้ต้องติดตั้ง
