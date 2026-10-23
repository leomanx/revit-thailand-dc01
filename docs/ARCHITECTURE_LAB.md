# Architecture Lab — materials, assemblies and environment

2.7.0-beta.1 · 2026-10-22 · `datacenter.html#view=architecture`

The user expanded the release review to cover important architect work, material specification/suitability, basic 3D relationships, then explicitly floor / wall / ceiling / roof / façade / orientation / sun / wind / rain / access. This update implements seven representative study cases; it is not a complete architectural design or compliance suite.

## Cases and responsibilities

| Case | Scope | Important interfaces |
|---|---|---|
| FLOOR-DH1 | slab / preparation / finish system | rack and rolling load, moisture, ESD, cleaning, environmental data |
| WALL-E01 | lining / framing / insulation zone | assembly fire performance, deflection, penetrations, door junctions |
| CEILING-OFF | panel / grid-hanger zone / plenum | MEP clearances, sprinkler/detector/light interfaces, access panels, support responsibility |
| ROOF-RF | support / insulation-falls zone / membrane / protection | drainage/overflow, upstands, penetrations, plant supports, wind and repair route |
| FACADE-OFF | backing / insulation / cavity / cladding | anchors, fire/cavity barriers, water/air layers, thermal bridges, solar/glare/window interfaces |
| DOOR-DH1 | leaf skins / core sample | complete doorset, hardware, seals, fire/smoke strategy, access control / egress |
| ACCESS-OFF | approach / drainage-joint zone / walking surface | continuous route, threshold, level changes, vertical circulation, diverse users, maintenance replacement route |

Case parties include ARC, STR, FLS, CIV, mechanical/electrical disciplines, SEC as a design interface, and OPS. Discipline consultation is shown, not falsely recorded as completed approval by those parties. ARC alone records the exercise's technical recommendation, which remains distinct from contractual authorization, permits, acceptance or construction issue.

## 3D and model link

`dc-architecture.js` owns pure box/face geometry, orthographic projection, depth ordering and polygon selection plus a DOM shell. Layers preserve the authored illustrative mm thickness. Expanded spacing is explicitly an explanatory display. Layers representing voids, grids or service zones are labeled as volumes, not solid materials.

Rotate via buttons or canvas arrow keys; click a face or its text equivalent to select a layer. A compass shows face / sun / wind-source directions in the conceptual study. Seven-case native Canvas contact sheet is `ARCHITECTURE_PREVIEW.png`; produced by `tools/render-architecture-preview.cjs` using the actual renderer. It does not prove browser layout.

Existing campus geometry remains canonical and unmodified. Two cases link to existing detailed door service objects. Other surfaces link at zone scope only. ACCESS-OFF links the ground main entrance in the NOC lobby footprint, then explicitly notes Office is upstairs and vertical circulation is not verified by that doorway. No statement that campus face materials or detailed IFC exports were changed.

## Material evidence and invalidation

Each case has an exercise spec filename following the seven-field dictionary. The UI explicitly identifies this as metadata only, not a downloadable PDF or canonical CDE file ID. Existing file buttons are package context and use the existing modal/read policy; they are not claimed as approved product tests.

Base proposal starts with unconfirmed evidence; alternate proposal has declared gaps that cannot be overcome merely by ticking all boxes. ARC's exercise attestations are fictional, not document uploads or third-party testing. Blocked access independently holds recommendation. Changing proposal, direction, sun altitude, wind, rain or route context clears attestations and recommendation. Reload restores only validated UI choices, never evidence/authority. Storage key: `dc01-architecture-v1`; state is independent of CDE export, Zone Quest, maintenance and ROI.

## Environmental assumptions

Eight cardinal/intercardinal directions and user-selected sun elevation (5–85°). For a conceptual vertical face, positive front-facing dot alignment indicates a direct-facing situation; windward indicates wind source is in its front half-plane. Rain plus windward prompts interface review. No irradiance / cooling load / solar ephemeris / true north / site weather / airflow / water ingress / uplift / runoff calculation. Roof exposure is discussed separately, and leeward does not mean dry or safe. The exercise does not recommend using natural ventilation in Data Halls.

No U-value, SHGC, acoustic rating, OTTV, condensation calculation, wheelchair route certification or fire minutes are invented. These are questions for project-specific performance evidence, professional judgment and applicable requirements. UL door guide and GSA EPD guidance support limited assembly/evidence principles; they do not certify sample products or a Thai code solution.

## Validation and next work

Tests cover all references/scopes, layer geometry and thickness, finite bounded projections across rotations, picking, material/evidence/access holds, ARC-only recommendation, import trust boundaries, environmental direction behavior and event-level controls/invalidation. Main UI routes preserve CDE decision authority. Browser/mobile interaction, actual receiving IFC/BCF viewer interoperability, and professional design validation remain separate pending activities; do not infer them from fixture tests or native renders.
