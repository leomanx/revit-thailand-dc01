# Room fit-out and preliminary performance briefs — 2026-10-24

`dc-building.js` adds 39 stable teaching component groups / 237 boxes in 10 zones. These are scene-only objects, separate from the 24 canonical FM assets, 237 CDE file records and IFC identity proxies. Selecting a group highlights its geometry and filters the relevant specification schedules. The zone inspector exports a local JSON room/material brief for further study; the export is not a registered CDE deliverable or approval.

NOC now contains three 1650 × 750 mm consoles (top 740 mm above FFL), monitor/keyboard/chair groups, six video-wall panels, acoustic wall panels, cable raceway, cutaway ceiling strips, luminaires, supply/return grille proxies, glazing/mullions/blind, a door/reader and floor finish. OFF adds four desk groups, MMR patch frames/trays, halls containment references, galleries trench-cover modules, yards perimeter/walkway references and RF drain/curb/walkway samples. These arrangements are schematic; equipment loads, human factors, collision checks and real staffing have not been resolved by a solver.

Floor buildup geometry now follows FFL minus SSL rather than imposing a 220 mm minimum over a 150 mm buildup. Fit-to-zone scales its distance to room dimensions. Fit-out geometry follows level, isolate and explode controls and is excluded from isolated service-assembly views.

Eleven schedules contain 36 preliminary criteria, each with a target or explicit TBC, measurement/evidence requirements, reviewers and an unverified status: support-room access floors, Data Hall heavy-load floor brief, resin finish, walls/acoustics, ceiling, roof, facade, doors, accessible routes, NOC consoles/task environment, exterior plant-yard surfaces. Architecture Lab's seven scopes expose the same schedules.

Numeric examples are **fictional project design targets**, not statutory minima, manufacturer product declarations, measured performance or values asserted by the linked references. In particular: a support-room 3 kN point-load assumption does not specify a Data Hall floor; 150/300/600 mm buildup includes floor panels/structure and is not net void; NRC is not Rw; lab Rw is not in-situ separation; reaction to fire is not assembly fire resistance; 300/500 lx examples do not establish control-room lighting compliance. TBC items must be resolved before tender/procurement. Choosing a component or reading/exporting a brief changes no approval, evidence receipt, live access or ROI.

## Open design gaps

The level-01 NOC and office still have no coordinated stair/lift/egress core. The UI explicitly marks this as OPEN DESIGN GAP rather than depicting an unverified access route. Occupancy, universal access, toilets/pantry, ventilation/heat loads, fire compartments, alarm intelligibility, rack population and actual project plant capacity remain unresolved. Ceiling geometry is cutaway strip representation, not a full reflected-ceiling layout; grille/lighting proxies have no proved duty or photometric calculation. Existing generic door proxies may overlap the new room-door study; the model is not a clash-free coordination deliverable.

## Primary reading

- [HSE: control rooms](https://www.hse.gov.uk/humanfactors/topics/control-room.htm): human factors and scope of control-centre ergonomic review.
- [CIBSE LG22: lighting for control rooms](https://www.cibse.org/knowledge-research/knowledge-portal/lg22-lighting-for-control-rooms-2022-pdf): task/display/daylight coordination.
- [Armstrong: fire resistance](https://armstrongceilings.com.au/performance/fire-resistance/): system-specific test evidence, not inference from tile appearance.
- [UL: fire-rated doors](https://www.ul.com/thecodeauthority/knowledge/ul-fire-rated-doors-guide): whole-doorset evidence and applicability.

These references guide topics to investigate; the numerical assumptions in the lesson are not quotations or certifications from them.

Validation includes geometry bounds, unique group/spec IDs, NOC furniture counts and dimensions, floor elevations, level/isolate/explode filtering, pickable renderer geometry, reset selection and schema/evidence completeness. Desktop browser review is recorded separately; these checks are not engineering compliance.
