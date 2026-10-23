from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=root/'output';out.mkdir(exist_ok=True)
names=['datacenter.html','landing.html','showcase.css','showcase.js','netlify.toml','dc.css','dc-engine.js','dc-viewer.js','dc-detail.js','dc-building.js','dc-ui.js','dc-zoning.js','dc-maintenance.js','dc-architecture.js','public-notes.html','feedback-template.md','index.html','lab.css','lab-engine.js','lab-ui.js','README.md','package.json','START-DC01.cmd','.gitignore','.gitattributes']
paths=[root/name for name in names]
for folder in ['data','docs','samples','tools','tests','assets','.github']:
    paths.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
destination=out/'DC01-learning-tool.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(paths):archive.write(p,'DC01-learning-tool/'+str(p.relative_to(root)).replace('\\','/'))
with zipfile.ZipFile(destination) as archive:assert archive.testzip() is None;assert not any('/tmp/' in p or 'ifc-validation/' in p for p in archive.namelist());print(str(destination),len(archive.namelist()),'members',destination.stat().st_size,'bytes')
