# Zone Quest — interactive adjacency playground

2026-10-22 · app 2.5.0

User intent: make the existing 2D zone diagram approachable and playful for students across AEC, with persistent connecting lines, draggable boxes, and feedback when required neighbours separate.

## Delivered

- `datacenter.html#view=play`: dedicated simple entry point. Also embedded in the 3D/zone page above the collapsible reference map. Landing and overview promote the game.
- Three open missions: one service pair (4 nodes), two halls with A/B separation (6 nodes), cross-team relationships (10 nodes). No time pressure or locked progression.
- SVG relationship paths follow each box. Shared-side adjacency, game separation and informational links have distinct styles and text equivalents. Corner-only touching is not adjacency; overlap is a separate failure.
- Pointer/touch dragging, keyboard arrows (Shift for larger steps), optional grid, proximity snap to eligible neighbours, optional connected-group movement, undo, shuffled reset, hints, example solution and stars.
- Selecting a node reveals plain-language explanations, discipline tags and links to its 3D zone and file register. These routes retain the existing role/access policy.
- Local layout persists separately under `dc01-zoning-play-v1`. It does not alter canonical footprints, 3D geometry, dataset identity, CDE decisions, document revisions, access rights or ROI.

## Assumptions and boundaries

The board is an abstract bubble diagram in game units. Near means a shared-side relationship within 24 units; far means at least 180 units between rectangular edges. These are exercise rules, not engineering distances or requirements. Electrical A/B separation alone does not establish resilience. Informational links can represent interfaces across floors and do not prescribe adjacent rooms. Roof is an interface node, not a ground-floor room. Game stars are independent from real project gates and all simulated risk/ROI metrics.

## Validation

132 automated tests pass across the project, including 12 new checks covering feasible missions, adjacency/separation/overlap, snap, bounded group translation, malformed saved state, pointer commit/cancel, undo, keyboard, hints, example, mission switching, 3D callback and UI routing without changing CDE decisions.

Event tests use a DOM fixture and do not prove browser layout. Browser/mobile visual acceptance remains pending because the prior browser tool attempt to acquire localhost was rejected by URL security policy; no alternate browser automation was used to bypass it. User preview remains available on port 4173. Manual acceptance: drag with mouse and touch; scroll the board on a narrow screen; check arrows and focus; switch missions; reload; open 3D/files; confirm original reference map and CDE state remain intact.

Static build and both release ZIPs include the new dependency. No hosting publication or repository creation occurred in this change.
