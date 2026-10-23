"""Generate genuine open exchange examples; never fake proprietary native binaries."""
from pathlib import Path
import json, uuid, zipfile, io, html, hashlib, base64
from xml.etree import ElementTree as ET
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'data/datacenter.json').read_text(encoding='utf-8'))
OUT=ROOT/'samples';OUT.mkdir(exist_ok=True)
FILES={f['id']:f for f in D['files']}
def target(key): return ROOT/FILES[D['samples'][key]]['download']
def guid(n):
    chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'
    value=int('0dca0000000000000000000000000000',16)+n
    result=''
    for _ in range(22):result=chars[value%64]+result;value//=64
    return result

# Minimal IFC4 spatial structure, solid proxy boxes and explicit asset properties.
# Not a detailed engineering model and not an IFC export from any registered .rvt file.
entities=[]
def entity(text):
    entities.append(f'#{len(entities)+1}={text};')
    return '#'+str(len(entities))
def q(value):return "'"+str(value).replace("'","''")+"'"
p0=entity('IFCCARTESIANPOINT((0.,0.,0.))')
z=entity('IFCDIRECTION((0.,0.,1.))');x=entity('IFCDIRECTION((1.,0.,0.))')
axis=entity(f'IFCAXIS2PLACEMENT3D({p0},{z},{x})')
context=entity(f"IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,0.00001,{axis},$)")
unit=entity('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)');units=entity(f'IFCUNITASSIGNMENT(({unit}))')
project=entity(f"IFCPROJECT('{guid(1)}',$,'DC01 Teaching Model',$,$,$,$,({context}),{units})")
placement=entity(f'IFCLOCALPLACEMENT($,{axis})')
site=entity(f"IFCSITE('{guid(2)}',$,'DC01 Campus',$,$,{placement},$,$,.ELEMENT.,$,$,$,$,$)")
building=entity(f"IFCBUILDING('{guid(3)}',$,'Siam Edge Demonstration',$,$,{placement},$,$,.ELEMENT.,$,$,$)")
storey=entity(f"IFCBUILDINGSTOREY('{guid(4)}',$,'00 Service floor',$,$,{placement},$,$,.ELEMENT.,0.)")
entity(f"IFCRELAGGREGATES('{guid(5)}',$,$,$,{project},({site}))")
entity(f"IFCRELAGGREGATES('{guid(6)}',$,$,$,{site},({building}))")
entity(f"IFCRELAGGREGATES('{guid(7)}',$,$,$,{building},({storey}))")
products=[]
for i,a in enumerate(D['assets']):
    xx=(i%6)*4.+2.;yy=(i//6)*5.+2.
    pos=entity(f'IFCCARTESIANPOINT(({xx:.1f},{yy:.1f},0.))')
    local_axis=entity(f'IFCAXIS2PLACEMENT3D({pos},{z},{x})')
    local=entity(f'IFCLOCALPLACEMENT({placement},{local_axis})')
    profile=entity("IFCRECTANGLEPROFILEDEF(.AREA.,'Teaching proxy',$,1.2,1.0)")
    solid=entity(f'IFCEXTRUDEDAREASOLID({profile},{axis},{z},2.0)')
    rep=entity(f"IFCSHAPEREPRESENTATION({context},'Body','SweptSolid',({solid}))")
    shape=entity(f'IFCPRODUCTDEFINITIONSHAPE($,$,({rep}))')
    obj=entity(f"IFCBUILDINGELEMENTPROXY('{a['ifcGuid']}',$,{q(a['tag'])},'Training proxy box, not manufacturer geometry','TRAINING_PROXY',{local},{shape},{q(a['tag'])},.NOTDEFINED.)")
    products.append(obj)
    props=[]
    for name,value in [('AssetID',a['tag']),('System',a['system']),('Zone',a['zone']),('SerialNumber',a['canonical']['serial']),('Manufacturer',a['canonical']['manufacturer']),('Model',a['canonical']['model']),('CMMSKey','DC01/'+a['id'])]:
        props.append(entity(f'IFCPROPERTYSINGLEVALUE({q(name)},$,IFCLABEL({q(value)}),$)'))
    pset=entity(f"IFCPROPERTYSET('{guid(1000+i)}',$,'DC01_Asset',$,({','.join(props)}))")
    entity(f"IFCRELDEFINESBYPROPERTIES('{guid(2000+i)}',$,$,$,({obj}),{pset})")
entity(f"IFCRELCONTAINEDINSPATIALSTRUCTURE('{guid(3000)}',$,$,$,({','.join(products)}),{storey})")
ifc="ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('DC01 minimal IFC4 teaching proxies, no certification'),'2;1');\nFILE_NAME("+q(target('ifc').name)+",'2026-10-21T09:00:00',('Revit Thailand learning case'),('Independent fictional case'),'DC01 sample generator','DC01 educational exporter','No construction use');\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n"+'\n'.join(entities)+'\nENDSEC;\nEND-ISO-10303-21;\n'
target('ifc').write_text(ifc,encoding='utf-8')

mapping={'schema':'DC01-asset-point-map-v1','notice':'Fictional read-only mapping, no live endpoint or credentials. Proxy model GUIDs refer only to the included IFC example.','modelFile':target('ifc').name,'modelRevision':'R02','mappings':[{'assetId':a['tag'],'ifcGuid':a['ifcGuid'],'cmmsKey':'DC01/'+a['id'],'zone':a['zone'],'system':a['system'],'point':a['telemetryPoint'],'unit':'kW' if a['type'] in ['UPS','Switchboard','Generator'] else 'project-defined; verify point semantics','sourceOwner':'BMS','informationOwner':'OPS'} for a in D['assets']]}
target('mapping').write_text(json.dumps(mapping,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
target('telemetry').write_text(json.dumps({'schema':'DC01-synthetic-telemetry-v1','asOf':D['twin']['asOf'],'freshnessLimitSeconds':D['twin']['freshnessSeconds'],'notice':'All readings synthetic. Normal quality does not prove engineering operating limits.','cases':D['twin']['cases']},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# BCF 2.1 issue exchange: minimal topics, camera, component selection and PNG snapshot.
def xml_bytes(root):return ET.tostring(root,encoding='utf-8',xml_declaration=True)
bcf_issues=[('SD-01','Coordinate / federation basis mismatch','IMT'),('SHP-01','Busway route undermines A-B design intent','ELS'),('CST-01','Old drawing copy at the workfront','GCC')]
with zipfile.ZipFile(target('bcf'),'w',zipfile.ZIP_DEFLATED) as archive:
    version=ET.Element('Version',{'VersionId':'2.1'});archive.writestr('bcf.version',xml_bytes(version))
    proj=ET.Element('ProjectExtension');p=ET.SubElement(proj,'Project',{'ProjectId':str(uuid.uuid5(uuid.NAMESPACE_DNS,'DC01-training'))});ET.SubElement(p,'Name').text='DC01 / Fictional learning case';ET.SubElement(proj,'ExtensionSchema');archive.writestr('project.bcfp',xml_bytes(proj))
    for idx,(issue_id,title,assigned) in enumerate(bcf_issues):
        topic_guid=str(uuid.uuid5(uuid.NAMESPACE_DNS,'DC01-'+issue_id));view_guid=str(uuid.uuid5(uuid.NAMESPACE_DNS,'DC01-view-'+issue_id))
        markup=ET.Element('Markup');header=ET.SubElement(markup,'Header');f=ET.SubElement(header,'File',{'IfcProject':guid(1),'isExternal':'true'});ET.SubElement(f,'Filename').text=target('ifc').name;ET.SubElement(f,'Date').text='2026-10-21T02:00:00Z';ET.SubElement(f,'Reference').text=target('ifc').name
        topic=ET.SubElement(markup,'Topic',{'Guid':topic_guid,'TopicType':'InformationControl','TopicStatus':'Open'})
        for key,value in [('Title',title),('Priority','Critical'),('Index',str(idx+1)),('CreationDate','2026-10-21T02:00:00Z'),('CreationAuthor','DC01 Training / IMT'),('AssignedTo',assigned),('Description','Fictional information-control issue '+issue_id+'. Illustrative camera and component only; no engineering defect has been detected in a real model.')]:ET.SubElement(topic,key).text=value
        viewref=ET.SubElement(markup,'Viewpoints',{'Guid':view_guid});ET.SubElement(viewref,'Viewpoint').text='viewpoint.bcfv';ET.SubElement(viewref,'Snapshot').text='snapshot.png'
        archive.writestr(topic_guid+'/markup.bcf',xml_bytes(markup))
        view=ET.Element('VisualizationInfo',{'Guid':view_guid});components=ET.SubElement(view,'Components');selection=ET.SubElement(components,'Selection');ET.SubElement(selection,'Component',{'IfcGuid':D['assets'][0]['ifcGuid']});ET.SubElement(components,'Visibility',{'DefaultVisibility':'true'})
        camera=ET.SubElement(view,'OrthogonalCamera')
        for key,values in [('CameraViewPoint',(18,20,22)),('CameraDirection',(-.5,-.5,-.70710678)),('CameraUpVector',(-.5,-.5,.70710678))]:
            vector=ET.SubElement(camera,key)
            for label,value in zip(['X','Y','Z'],values):ET.SubElement(vector,label).text=str(value)
        ET.SubElement(camera,'ViewToWorldScale').text='35'
        archive.writestr(topic_guid+'/viewpoint.bcfv',xml_bytes(view))
        image=Image.new('RGB',(900,550),'#eef2e8');draw=ImageDraw.Draw(image);draw.rectangle((25,25,875,100),fill='#193f35');draw.text((45,53),'DC01 / '+issue_id+' / TRAINING VIEWPOINT',fill='white')
        for aidx,a in enumerate(D['assets']):
            cx=60+(aidx%6)*130;cy=150+(aidx//6)*90;draw.rectangle((cx,cy,cx+95,cy+50),fill='#d6e6bf' if aidx else '#e7bb7e',outline='#56795f');draw.text((cx+4,cy+18),a['tag'],fill='#173d34')
        draw.text((45,520),'Schematic proxy layout. Not a real site, clash detection result or construction drawing.',fill='#3c5a43')
        buf=io.BytesIO();image.save(buf,format='PNG');archive.writestr(topic_guid+'/snapshot.png',buf.getvalue())

casework=[
 ('BRF','The phrase 12 MW means different things to the owner and design team.','Confirm the IT-load definition, phase boundary and acceptance measures before design proceeds.',['Owner-approved OPR with defined load terminology and assumptions','Operator review with measurable acceptance requirements']),
 ('CON','A and B paths appear separate on the single-line diagram, but occupy a common spatial risk area.','Review common-mode assumptions across electrical layout and fire compartments; obtain the named risk decision.',['Topology and spatial-route option review','Fire interface and recorded residual-risk disposition']),
 ('SD','Models appear aligned in a federation, while discipline exports use different coordinate bases.','Establish one documented survey/control reference and verify an actual exchange against it.',['Coordinate and level register with source versions','Survey-based exchange validation and exceptions']),
 ('DD','A new single-line diagram is paired with an old load schedule and plan.','Reconcile the dependency set and issue a package manifest with exact revisions and intended use.',['SLD, load schedule and model consistency review','Transmittal manifest identifying exact representations and revisions']),
 ('TND','Bidders received different addenda and therefore priced different scope.','Use controlled addendum distribution and acknowledged baseline reconciliation before comparison.',['Addendum distribution and recipient acknowledgements','Reconciled tender pricing baseline and exceptions']),
 ('PRM','An authority response covers one submission scope, but the team treats it as blanket permission.','Track the scope and conditions of the simulated response and assess affected packages separately.',['Authority scope and conditions register','Affected-package hold/release decision with named responsibility']),
 ('PRC','A substitute UPS has the same headline rating but different clearances and interfaces.','Assess the deviation against electrical, cooling, architecture and maintenance interfaces before acceptance.',['Certified substitute equipment interface package','Multidiscipline deviation decision and limitations']),
 ('SHP','A clash is removed by moving busway into a common segment of A and B routes.','Recheck design intent and segregation assumptions; clash-free geometry alone is insufficient.',['Busway-route and design-intent review','Accepted deviation with affected-system evidence']),
 ('CST','The CDE has withdrawn an old issue, but a foreman still uses the PDF received in a chat.','Control the affected workfront, recall the obsolete copy and verify recipients changed revision; inspect affected work.',['Distribution and recall acknowledgements','Affected-work inspection and corrective-action evidence']),
 ('CXC','Equipment tests passed, but an integrated scenario retains an unresolved exception.','Separate test coverage and configuration; obtain a scoped decision on residual exceptions and retest needs.',['Integrated-test coverage and traceable results','Exception disposition and retest acceptance']),
 ('ASB','A bypass valve installed under an accepted field change is absent from the record model.','Reconcile the field-change register with installed evidence and record verification coverage and limitations.',['Field-change to record-model reconciliation','Survey or inspection verification with coverage statement']),
 ('HOV','Manuals are present, but the operator cannot find the applicable manual from an AssetID.','Test the actual find-and-use path with the recipient, including model, serial, warranty and location applicability.',['Asset-to-document linkage and applicability','Operator find-and-use acceptance evidence']),
 ('FM','A replacement component is recorded in email but not in asset or warranty records.','Keep persistent asset identity and track the component/serial change with effective dates and applicability.',['Service and component replacement record','CMMS and warranty reconciliation']),
 ('DTW','The viewer displays UPS-A-01, but its value originates from UPS-B-01.','Validate the canonical identity chain from asset to model, CMMS and source point before decision support.',['AssetID, IFC GUID and point-mapping validation','Source-owner identity reconciliation and limitation record'])
]

W,H=A4
styles={
 'body':ParagraphStyle('body',fontName='Helvetica',fontSize=10,leading=15,textColor=HexColor('#344b42'),spaceAfter=10),
 'small':ParagraphStyle('small',fontName='Helvetica',fontSize=8,leading=11,textColor=HexColor('#54695c')),
 'h':ParagraphStyle('h',fontName='Helvetica-Bold',fontSize=12,leading=16,textColor=HexColor('#1c4b39')),
 'title':ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=25,leading=30,textColor=HexColor('#193f35')),
}
pdf=canvas.Canvas(str(target('casebook')),pagesize=A4)
pdf.setTitle('DC01 Lifecycle Evidence Casebook / Fictional learning case')
pdf.setAuthor('Revit Thailand / educational case')
def paragraph(text,y,style='body',x=42,width=W-84):
    p=Paragraph(html.escape(text.replace('—','-').replace('–','-')),styles[style]);_,height=p.wrap(width,H);p.drawOn(pdf,x,y-height);return y-height-10
def base(number,label):
    pdf.setFillColor(HexColor('#f4f5ef'));pdf.rect(0,0,W,H,fill=1,stroke=0)
    pdf.setFillColor(HexColor('#193f35'));pdf.rect(0,H-88,W,88,fill=1,stroke=0)
    pdf.setFillColor(white);pdf.setFont('Helvetica-Bold',11);pdf.drawString(42,H-35,'SIAM EDGE / DC01')
    pdf.setFont('Helvetica',8);pdf.drawString(42,H-53,'REVIT THAILAND - FICTIONAL INFORMATION-MANAGEMENT CASE')
    pdf.setFont('Helvetica-Bold',8);pdf.drawRightString(W-42,H-35,label)
    pdf.setFillColor(HexColor('#a8492a'));pdf.setFont('Helvetica-Bold',8);pdf.drawString(42,47,'TRAINING ONLY / UNSIGNED / NO CONSTRUCTION OR TEST AUTHORITY')
    pdf.setFillColor(HexColor('#657966'));pdf.setFont('Helvetica',8);pdf.drawString(42,31,'Project codes and responsibilities are defined only for this fictional case.')
    pdf.drawRightString(W-42,31,str(number)+' / 15')
for page,(sid,problem,response,evidences) in enumerate(casework,1):
    s=next(x for x in D['stages'] if x['id']==sid);issue=next(x for x in D['issues'] if x['stage']==sid)
    base(page,sid+' / '+s['phase'].upper());y=H-115
    y=paragraph(s['name'],y,'title');y=paragraph('Intended use: '+s['purpose'],y,'small')
    y=paragraph('01 / What is going wrong?',y-8,'h');y=paragraph(problem,y)
    y=paragraph('02 / The controlled response',y-4,'h');y=paragraph(response,y)
    y=paragraph('03 / Who must provide what?',y-4,'h')
    for idx,proof in enumerate(evidences):
        r=issue['requirements'][idx];f=FILES[r['fileId']]
        y=paragraph(f"{idx+1}. {r['provider']} - {proof}",y)
        y=paragraph(f"Evidence register: {f['name']} | R02 | simulated receipt, not a real inspection result.",y,'small')
    y=paragraph('04 / The acceptance boundary',y-3,'h')
    y=paragraph('Named receiving authority in this case: '+issue['gateBy']+'. Accept only this information-control issue, within the stated use and recorded baseline. File upload, a folder move or technical administration does not establish that authority.',y)
    y=paragraph('Revision control: changing a referenced source or evidence revision makes the previous acceptance stale. Review the affected scope and obtain a new decision; do not overwrite the historical record.',y,'small')
    y=paragraph('Discuss with the team',y-4,'h');y=paragraph('What prevents bypass? Who will detect the wrong copy, identity or configuration? Who will hold, notify, correct and verify closure?',y)
    assert y>75,(sid,y)
    pdf.showPage()
base(15,'REFERENCES / SCOPE');y=H-115;y=paragraph('Assumptions & sources',y,'title')
for text in ['12 MW is illustrative IT load: 2 halls x 500 racks x 12 kW. It is not facility demand, a sizing calculation or a certified resilience rating.','Permit, tender, procurement and phased construction can overlap. The case is not a mandatory sequential project schedule.','The IFC contains 24 proxy boxes with fictional asset properties. It is not the geometry of the native models listed in the register. The BCF camera/snapshot is schematic.','JSON samples are synthetic and read-only. No real credentials, OT endpoints, control commands, tenant data or site location are included.']:
    y=paragraph(text,y,'small')
for s in D['sources']:
    y=paragraph(s['title'],y-3,'h');y=paragraph(s['url'],y,'small')
assert y>75,y
pdf.save()

readme='DC01 / REVIT THAILAND / FICTIONAL LEARNING EXCHANGES\n\n'+ '\n'.join([
 'All files are teaching examples. No real site, credentials, engineering acceptance or certification.',
 'IFC: actual IFC4 text with 24 proxy boxes, project/site/building/storey and asset property sets. Model geometry is schematic. No real design-model export is implied.',
 'BCF: actual BCF 2.1 ZIP with 3 information-control topics, selected component, camera and schematic PNG. Validate with the receiving viewer before production use.',
 'JSON: canonical identity mapping and synthetic telemetry cases. No live service or control interface.',
 'PDF: 14 stage examples plus a scope/source page. Unsigned, not a construction or test procedure.',
 'Native .rvt, .rfa, .dwg, .nwc, .nwf, .nwd, .e57, .rcp and .rcs entries in the web register are catalog-only: no fake binaries are supplied.',
 'Revision/status/classification/stage are separate metadata. Project naming codes are fictional.',
 '', 'SOURCES', *[s['title']+'\n'+s['url'] for s in D['sources']]
])+'\n'
(OUT/'README.txt').write_text(readme,encoding='utf-8')
manifest={'project':'DC01','scope':'fictional learning exchanges','files':[]}
for key in ['ifc','bcf','mapping','telemetry','casebook']:
    f=target(key);manifest['files'].append({'registerId':D['samples'][key],'filename':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'revision':'R02'})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
with zipfile.ZipFile(ROOT/D['samples']['bundle'],'w',zipfile.ZIP_DEFLATED) as archive:
    for entry in manifest['files']:archive.write(OUT/entry['filename'],entry['filename'])
    archive.write(OUT/'README.txt','README.txt');archive.write(OUT/'manifest.json','manifest.json')
downloads={}
for f in [target(k) for k in ['ifc','bcf','mapping','telemetry','casebook']]+[ROOT/D['samples']['bundle']]:
    mime={'.pdf':'application/pdf','.json':'application/json','.ifc':'application/octet-stream','.bcfzip':'application/zip','.zip':'application/zip'}[f.suffix]
    downloads['samples/'+f.name]={'name':f.name,'mime':mime,'base64':base64.b64encode(f.read_bytes()).decode('ascii')}
(ROOT/'data/dc-downloads.js').write_text('/* Generated offline payloads; no network is needed after page load. */\nwindow.DC_SAMPLES='+json.dumps(downloads,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({'files':len(manifest['files']),'pdf':str(target('casebook')),'ifcEntities':len(entities),'ifcAssets':len(products),'bundle':D['samples']['bundle']}))
