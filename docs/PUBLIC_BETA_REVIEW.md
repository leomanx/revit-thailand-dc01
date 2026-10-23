# Public beta release review — DC01

2026-10-22 · 2.7.0-beta.1 · dataset `cfecfc6b46226c9100dd`

**Verdict: source is prepared for GitHub review; follower-facing release is a public-beta candidate, pending real-browser/mobile acceptance and actual hosted CI/URL checks.** Not published in this review. No repository, push, Actions run, or hosting deployment has been created or claimed.

The purpose is an educational sandbox, not an accredited engineering design, real CDE, plant control system, selected manufacturer solution or compliance tool. Publicly stating this scope makes substantive technical critique easier to address; it does not excuse an incorrect explanation. Findings supported by context should be corrected.

## Review coverage and evidence

| Area | Review / result | Limits |
|---|---|---|
| Dataset / references | 14 stages, 25 companies, 11 zones, 237 records, 42 issues, 84 requirements, 24 assets; IDs, naming, revisions, dependency DAG and provider/acceptance references verified | authored project assumptions, not a national/ISO-mandated implementation |
| Control workflow | every issue can be closed by assigned parties after prerequisites; wrong role/approach, stale evidence/source baseline and forged imports rejected in tests | selectable roles and replay are learning controls, not authentication or signatures |
| Access requests | file/revision/requester/state/use/expiry/revoke/stale scope tested; read grants do not authorize revise/evidence/accept | public payload is readable outside the UI; use is recorded purpose metadata, not DRM / downstream-use enforcement |
| Electrical / cooling | unit equations, main/branch example loads, pipe pair flow, rack dual-feed non-duplication and equipment output/input/thermal distinctions tested | no campus capacity balance, protection, hydraulic, short circuit, diversity or derating result |
| Geometry / 3D | canonical zones/objects/GUID refs, projections, mesh finiteness, picking, fit, filters, isolation and service count tests | simplified canvas model, no clash/solid solver, coordinated design or IFC geometry loading |
| Zone Quest | relationship persistence, side adjacency, collisions, bounded group move, snap, cancel, keyboard/undo and restore tests | game units; rules do not establish physical adjacency, segregation or engineering performance |
| Work control | 5 cases / 11 gates; role/duty, prior gate, window and zone; conflict/suspension invalidation; replay and duplicate-count tests | simulated qualification/evidence, no manual baseline validation or actual LOTO/plant commands; clock is a what-if input |
| Architecture | 7 scopes including ceiling and continuous access, typed spec placeholders, layer/picking/rotation, evidence/substitution/access holds, context invalidation and ARC-only recommendation tested | cutaway study separate from campus; most model links are zone-only; no site solar/CFD/water/accessibility/structural/fire solver |
| Risk / ROI | denominators, unique cases, reopened gates, zero/missing assumptions, break-even / sensitivity and export tested | backlog severity is not calibrated engineering risk; benefit is hypothetical, not measured or causal savings |
| Digital Twin | synthetic identity/semantics/unit/quality/freshness failure cases | no live connector, operational update loop or complete Twin claim |
| Downloadable examples | IFC4 424 entities / 24 proxies meshed / zero schema findings; BCF 2.1 8 XML members / 3 topics validated; 24 mappings; 15 PDF pages; sample CRC/hashes pass on rerun | EXPRESS rules not executed; optional lark unavailable; no receiving commercial viewer test. PDF visual inspection retained from 2026-10-21, not rerun as browser QA |
| Build / payload | 37 static files including manifest, 80 local references without missing targets; HTTP root and 36 payloads under `/dc01/` match hashes; SHA checks, reproducible builds, safe output boundaries and public-pattern scan pass | pattern scan is not exhaustive secret detection; hosted origin and actual base URL not yet available |
| Privacy / source | public site contains no known credential patterns, personal machine paths, external runtime CDN or runtime network-call code; curated repository ZIP excludes internal prompts/handoffs and local/generated folders; clean extracted source passes tests/build/audit and produces the same static manifest | host may keep logs; local user text must be reviewed before sending sessions/Issues; no selected reuse license |
| Automated validation | **154 tests passed**; syntax/build/audit and exchange validator rerun; actual architecture renderer contact sheet inspected | DOM fixtures/native renders do not prove browser/mobile/screen-reader behavior or WCAG conformance |

## Corrections made in this review

1. **Program vs geometry vs capacity.** Added visible explanations that 12 MW IT is program context, not capacity proven by the shown equipment; compact teaching hall geometry does not place 500 racks. 4000 A / ideal 2.633 MW conversion, 1.8 MW sample feeder and 2.4 MW CHW samples must not be represented as a complete 12 MW design. Kept canonical dataset unchanged rather than silently changing the baseline behind existing learning sessions.
2. **Architectural scope.** Added floor/wall/ceiling/roof/façade/door/access study, complete-assembly evidence, material substitutions, maintainability and environmental context. No fire rating inferred from material thickness or leaf-only certificate. EPD is evidence, not automatic environmental superiority. Slots for spec filenames are clearly metadata-only.
3. **Public framing.** Added Public Beta label, `public-notes.html`, feedback text and GitHub bug/content issue forms. Simplified README to the current version instead of mixing prototype and later milestones. Existing old milestone documents are development history, not current feature claims.
4. **Evidence provenance.** Updated exchange report date to the actual rerun date; retained the older PDF visual inspection date explicitly. Did not claim unavailable EXPRESS or commercial interoperability checks.
5. **Keyboard continuity.** Preserve active input/select/checkbox/layer focus across local architecture and maintenance re-renders; fixture checks cover control focus restoration. Real keyboard/screen-reader acceptance remains pending.
6. **Release hygiene.** Added public payload audit to manual Pages workflow and a non-deploying push/PR CI workflow. Prepared a curated `DC01-github-source.zip` with source hashes and no internal prompts, separate from static ZIP and full local handoff ZIP. No permissive license invented for the owner.

## Remaining release checks

### Before sharing the URL to followers

- Open built **dist** on a real desktop browser and a narrow/touch device (roughly 390px), not only source preview. Check landing, sidebar scroll, all view navigation, selected role, dialogs, back links, and public notes.
- Zone Quest: actual mouse/touch drag, empty-space scroll on mobile, arrows, snap/group, undo, hints, reload, no move counter.
- Architecture: click front/back material layers and their text alternatives, rotate/explode, change all seven cases, switch ARC, test substitution/HOLD, change sun/wind/rain/access, verify confirmations reset and 3D/file links target the stated scope.
- Maintenance: complete one full scenario through company and duty switches; try wrong zone/time, conflict after permit, and expired entry/start; inspect why it stops. Other scenarios need a quick reference/label check.
- Basic Lab: confirm empty decision-history message occupies full width at desktop/mobile and normal events retain their number/body columns.
- Test real download and a CDE export/reimport containing disposable text, plus blocked localStorage behavior. Check a screen-reader/keyboard pass before making accessibility claims.
- Select the actual repository, add curated source, run Checks; enable Pages via GitHub Actions and run the manual publish workflow only when authorized. Use its real `base_url` for final build. Verify hosted root/deep links/runtime/sample downloads and social metadata on the real origin. Save release manifest and ZIP for rollback.

The existing browser-tool URL acquisition for localhost was explicitly rejected by security policy. This review did not retry through another browser/automation surface to bypass that block. HTTP smoke, native rendering and fixture tests remain separate evidence. This is the concrete remaining verification gap, not a generic recommendation to seek endless reviews.

### Known scope for later development

- A physically dimensioned full 12 MW layout, complete electrical/cooling sizing, technical code strategy and actual architectural surface materials in campus are future work. The current beta must continue to call them illustrative.
- Native IFC/BCF viewer interoperability, coordinated BIM geometry, signed permits, secure identities and real CMMS/document-baseline integration are outside this static application.
- Unified export/import for all four learning modules is not implemented. CDE Export is not a full browser backup; modules keep separate state. Public notes state this clearly.
- Reuse license is undecided; do not add an open-source badge or claim a license without the owner's choice.

## Authoritative references consulted

- [UK BIM Framework Guidance Part C, Edition 1 (2020)](https://ukbimframework.org/wp-content/uploads/2021/02/Guidance-Part-C_Facilitating-the-common-data-environment-workflow-and-technical-solutions_Edition-1.pdf): CDE workflow, states and metadata; not the full current ISO text or a project appointment.
- [OSHA 1910.147](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147) and [contractor coordination](https://www.osha.gov/etools/lockout-tagout/tutorial/outside-personnel): limited hazardous-energy role/coordination principles, not Thai or electrical compliance instructions.
- [UL door / frame / hardware guide](https://www.ul.com/thecodeauthority/knowledge/ul-fire-rated-doors-guide): assembly scope and components; no sampled product is UL certified by this exercise.
- [GSA EPD guidance](https://www.gsa.gov/governmentwide-initiatives/federal-highperformance-buildings/highperformance-building-clearinghouse/integrative-design-strategies/life-cycle-perspective/environmental-product-declaration): EPD does not itself imply environmental superiority.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node): current official workflow references; actual repository runner remains unexecuted.

An informed reader can legitimately question scope, assumptions or missing evidence. The useful response is an exact file/assembly/context reference, a correction where needed, and an explicit boundary where this is a study rather than a verified design. No claim of immunity from criticism is made.
