# Maintenance / work-control tabletop — 2.6.0

2026-10-22. User requested equipment faults, planned maintenance, who passes which checkpoint, who is authorized, and removal of the brand establishment/origin story.

## Delivered

Open `datacenter.html#view=maintenance` (sidebar: เสีย / PM / ใครเข้าซ่อม).

Five scenarios share the existing canonical asset, zone and supplier IDs: UPS-A-01 module fault; CH-01 planned maintenance; overdue GEN-01 maintenance; PMP-CHW-01 vibration; CRAH-DH1-01 planned inspection. Each has component scope, sample last/due dates, impact, vendor, document links and a 3D link. PM dates are fictional and are not OEM interval recommendations. All scheduling uses a fixed simulation date, 22 October 2026, and a sample permit window 09:00 inclusive to 12:00 exclusive, Thai local time.

Eleven gates: request → vendor plan → operations impact review → permit → entrance check-in → escort/brief → work-readiness evidence event → start → service report → witness/return-to-service record → close. Routes show the main entrance, registration, NOC, zone gate and work face. Each gate identifies company, personal duty and fictional staff ID. OPS has distinct dispatcher, lead, permit, desk, escort, authorized and witness duties; supplier tech identity is limited to the case's supplier. SEC in the project is a design company and is not silently treated as a security guard.

Document read rights, physical entry, and work authorization remain separate concepts. The current role selector plus a duty selector determine the tabletop mandate. Skipped gates, wrong supplier/duty, wrong target zone and expired entry/start attempts are recorded as stopped. Operations lead can introduce a readiness conflict or suspend the job; this invalidates review and every downstream gate. Clearing a conflict does not revive the old permit. All relevant gates must be repeated. Reports and closeout may be recorded after the window; this does not extend authorization to continue work. Changing the simulation clock is explicitly a what-if control, not trusted audit time.

Local event history lives under `dc01-maintenance-v1`, separately from CDE and Zone Quest. Saved logs are replayed; stored `ok` flags are not trusted. Summary counts appear on the maintenance page and Impact dashboard: closed work orders, work-start records, holds and stopped attempts. These counts do not change project gate acceptance, Access Grants, asset condition, real MTTR, uptime or ROI. Reset clears only the selected scenario's exercise history.

## Educational limits and sources

All appointments, qualifications and evidence events are fictional. The exercise does not validate actual identity, training, site safety, engineering capacity, manual revision applicability, real permit validity, isolation or restoration. It contains no plant switching or repair instructions. The document link uses the existing effective CDE read policy, while maintenance events do not attest CDE evidence or validate a changed document revision. A real implementation must integrate current document baselines and site-specific permit/evidence systems rather than reuse these event buttons as approval.

Role and contractor coordination principles were checked against [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147) and its [control-of-hazardous-energy overview](https://www.osha.gov/control-hazardous-energy/). These sources support the distinction between trained authorized personnel and other affected personnel and the need for coordinated energy-control programs. They do not certify this fictional workflow, electrical procedure, or compliance with Thai law. All gate names, routes, role assignments and schedules are authored case assumptions.

## Brand update

Removed establishment dates, relaunch language and origin story from app sidebar/footer/guide, landing logo/navigation/story and the source-generated social card. Retained the Revit Thailand name. This latest instruction supersedes older handoffs requesting brand history; do not reintroduce it.

## Validation

144 project tests pass, including scenario/identity integrity, every full flow, role/order/time/zone rejection, expiry, conflict invalidation, suspension, replay, non-duplicated counts, event-level UI handlers, page routing, unchanged CDE decisions and removal of brand history. Static release includes the new module. Browser/mobile visual acceptance remains pending under the existing localhost URL security restriction; no alternate browser automation was used to bypass it.
