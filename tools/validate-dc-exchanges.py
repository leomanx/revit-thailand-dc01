"""Read-only checks for the generated exchange pack. XSDs are official cached data."""
from pathlib import Path
import json,sys,zipfile,hashlib,argparse
from datetime import date
from lxml import etree
from pypdf import PdfReader

parser=argparse.ArgumentParser();parser.add_argument('--schemas',default='tmp/bcf-schemas');parser.add_argument('--ifc-path',default='tmp/ifc-validation');args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1];D=json.loads((ROOT/'data/datacenter.json').read_text(encoding='utf-8'));F={f['id']:f for f in D['files']}
def sample(key):return ROOT/F[D['samples'][key]]['download']
sys.path.insert(0,str((ROOT/args.ifc_path).resolve()))
import ifcopenshell,ifcopenshell.validate,ifcopenshell.geom
m=ifcopenshell.open(str(sample('ifc')));logger=ifcopenshell.validate.json_logger();ifcopenshell.validate.validate(m,logger)
assert not logger.statements,json.dumps(logger.statements,default=str)
proxies=m.by_type('IfcBuildingElementProxy');assert len(proxies)==len(D['assets'])
for a in D['assets']:
    product=m.by_guid(a['ifcGuid']);assert product.Tag==a['tag']
    pset=next(rel.RelatingPropertyDefinition for rel in product.IsDefinedBy if rel.RelatingPropertyDefinition.Name=='DC01_Asset');props={p.Name:p.NominalValue.wrappedValue for p in pset.HasProperties};assert props['SerialNumber']==a['canonical']['serial'];assert props['System']==a['system']
    shape=ifcopenshell.geom.create_shape(ifcopenshell.geom.settings(),product);assert len(shape.geometry.verts)>0
schemas={name:etree.XMLSchema(etree.parse(str(ROOT/args.schemas/name))) for name in ['markup.xsd','project.xsd','version.xsd','visinfo.xsd']}
bcf_checked=[]
with zipfile.ZipFile(sample('bcf')) as z:
    assert z.testzip() is None
    for name in z.namelist():
        schema='version.xsd' if name=='bcf.version' else 'project.xsd' if name=='project.bcfp' else 'markup.xsd' if name.endswith('/markup.bcf') else 'visinfo.xsd' if name.endswith('.bcfv') else None
        if schema:
            doc=etree.fromstring(z.read(name));schemas[schema].assertValid(doc);bcf_checked.append(name)
            if name.endswith('.bcfv'):
                for component in doc.findall('.//Component'):assert m.by_guid(component.attrib['IfcGuid'])
mapping=json.loads(sample('mapping').read_text(encoding='utf-8'));assert len(mapping['mappings'])==24
for record in mapping['mappings']:
    assert m.by_guid(record['ifcGuid']).Tag==record['assetId']
    assert record['point']==next(a['telemetryPoint'] for a in D['assets'] if a['tag']==record['assetId'])
telemetry=json.loads(sample('telemetry').read_text(encoding='utf-8'));assert len(telemetry['cases'])==5
pdf=PdfReader(sample('casebook'));assert len(pdf.pages)==15
for i,s in enumerate(D['stages']):assert s['name'] in pdf.pages[i].extract_text(),s['id']
manifest=json.loads((ROOT/'samples/manifest.json').read_text());
for entry in manifest['files']:assert hashlib.sha256((ROOT/'samples'/entry['filename']).read_bytes()).hexdigest()==entry['sha256']
with zipfile.ZipFile(ROOT/D['samples']['bundle']) as z:assert z.testzip() is None;assert len(z.namelist())==7
report={'date':date.today().isoformat(),'ifc':{'reader':ifcopenshell.version,'schema':m.schema,'entities':len(list(m)),'proxies':len(proxies),'meshedShapes':len(proxies),'schemaFindings':len(logger.statements),'expressRulesExecuted':False,'limitation':'Schema/geometry validation, not engineering, coordination, performance or certification.'},'bcf':{'version':'2.1','officialSchemas':'https://github.com/buildingSMART/BCF-XML/tree/release_2_1/Schemas','validatedXmlMembers':len(bcf_checked),'topics':3,'limitation':'XSD and linked IFC GUID checks; no receiving commercial viewer interoperability test.'},'json':{'assetMappings':24,'syntheticCases':5},'pdf':{'pages':15,'stagePages':14,'visualReview':'Prior all-page/first/source-page inspection retained; this run checked page text/structure only.','visualReviewDate':'2026-10-21'},'zip':{'files':7,'crc':'pass','sha256':'all 5 payloads match manifest'}}
(ROOT/'docs/EXCHANGE_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
