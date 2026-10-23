# Role & Responsibility — ISO 19650-aligned ACC CDE Case Study

**Version 1.1 | Revit Thailand | Educational scenario**

## Governance boundaries
- **Appointments** establish contractual responsibilities and authority (Appointing Party, Lead Appointed Party and Appointed Parties).
- **Information management functions** may be allocated to nominated individuals/teams, but a generic role title does not confer statutory or contractual decision rights.
- **RACI** describes who does, owns, reviews or is informed about an activity; it does not confer folder access.
- **ACC permissions** are separate technical entitlements. Configure based on groups/company, folder and information sensitivity; validate inheritance with representative test accounts.
- **Workflow approval** is separate from file moves and from technical `Manage` access. Define accepted purposes and approvers in project documents.

## Role catalogue
| Party / Role | Core remit |
|---|---|
| Owner / Appointing Party | Defines information requirements, acceptance authority and project governance. |
| Project Manager | Coordinates deliverables, milestones and decision escalations. |
| Lead Appointed Party | Coordinates delivery team and information delivery plan. |
| Information Manager | Coordinates information management procedures, codes and exchange controls; authority is appointment-defined. |
| BIM Manager / BIM Coordinator | Leads BIM execution, federation, clashes and model quality. |
| Architect / Discipline Lead | Authors/checks/authorizes architectural information within appointed scope. |
| Engineer / Discipline Lead | Authors/checks/authorizes engineering information within appointed scope. |
| Main Contractor | Coordinates construction submissions, methods and site records. |
| Subcontractor / Specialist | Produces package-specific information and submits via agreed gate. |
| Document Controller | Maintains controlled issue, transmittal, revision and audit record. |
| CDE / ACC Administrator | Configures platform, groups and technical permissions; no automatic approval mandate. |
| Facility Manager / Operator | Defines/validates operational data needs and handover information. |

## Example RACI matrix
The following **illustrative matrix**, not an ISO-prescribed one, is modeled in `data/cde-template.json` and available interactively in the WebApp's **05 Roles & RACI** tab. Each activity has one accountable party for teaching clarity. Replace assignments to reflect actual contract scopes, appointed lead, design responsibility and hold points.

| Activity | Accountable | Responsible/Supporting example |
|---|---|---|
| Define information requirements | Owner / Appointing Party |  |
| Prepare / coordinate BEP and delivery plan | Lead Appointed Party | Information Manager, BIM Manager / BIM Coordinator |
| Author discipline information (architecture example) | Architect / Discipline Lead |  |
| Check discipline model/drawing (architecture example) | Architect / Discipline Lead | BIM Manager / BIM Coordinator |
| Authorize WIP for Shared coordination | Architect / Discipline Lead | BIM Manager / BIM Coordinator, Document Controller |
| Federated coordination / clash review | Lead Appointed Party | BIM Manager / BIM Coordinator, Architect / Discipline Lead, Engineer / Discipline Lead |
| Authorize Published issue for defined use | Owner / Appointing Party | Lead Appointed Party, Architect / Discipline Lead, Engineer / Discipline Lead, Document Controller |
| Control transmittal and revision registers | Document Controller |  |
| Configure technical ACC folder permissions | Lead Appointed Party | Information Manager, CDE / ACC Administrator |
| Review and accept asset handover information | Owner / Appointing Party | Lead Appointed Party, Main Contractor, Subcontractor / Specialist, Document Controller |

## Practical role-to-permission principles
1. Architect / Engineer: manage own organization's WIP only; read approved Shared scopes; formal issue requires workflow authorization.
2. Lead Appointed Party / BIM Coordinator: coordinate federation and review; avoid unconditional read of unrelated confidential WIP.
3. Contractor / Specialist: manage assigned package work and site records; read only relevant Published/Shared deliverables.
4. Document Controller: manage issuance and records in designated folders, not automatic design-approval authority.
5. CDE Administrator: configure rights and naming rules, but administration is not equivalent to permission to publish, approve or view commercially restricted information.
6. Owner / Project Manager: receive and decide submissions only where named by the agreed approval matrix; sensitive commercial access is separately scoped.

## Hands-on extension (15–20 minutes)
**Scenario:** ARC drawing needs MEP coordination, then authorization for construction.
1. Select `Architect / Discipline Lead` in the Roles & RACI tab. Identify who is accountable for the architecture WIP internal check.
2. Select `BIM Manager / BIM Coordinator`. Identify their part in federation and why checking clashes does not authorize construction.
3. Select `Document Controller`. Find their contribution to transmittal records; explain why this is not design approval.
4. Select `CDE / ACC Administrator`. Decide whether technical folder `Manage` grants the right to approve design (answer: no).
5. Export CSV using the Copy RACI button. Review all assignments with the actual appointed parties and revise before real-world adoption.

**Evidence:** completed RACI, screenshot of a selected role, risk/approval note, sample permission test plan.

## Review checklist
- Confirm one accountable actor for each project-defined activity (or document exceptions).
- Separate delivery responsibility, technical privileges and formal approval authority.
- Confirm originator organization, approval thresholds and escalation for each gate.
- Protect WIP and restricted Commercial/Contracts folders.
- Check role delegation, absence cover, date/version and approval of responsibility matrix.

> Not an official ISO template, ACC permission export, or audit of legal contractual authority.
