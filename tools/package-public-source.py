"""Curated repository seed; excludes internal prompts/handoffs and generated/private folders."""
from pathlib import Path
import hashlib,json,re,zipfile

root=Path(__file__).resolve().parents[1]
names=['README.md','package.json','.gitignore','.gitattributes','netlify.toml','START-DC01.cmd',
       'index.html','landing.html','datacenter.html','public-notes.html','feedback-template.md',
       'dc.css','dc-engine.js','dc-detail.js','dc-viewer.js','dc-ui.js','dc-zoning.js','dc-maintenance.js','dc-architecture.js',
       'lab.css','lab-engine.js','lab-ui.js','showcase.css','showcase.js']
paths=[root/n for n in names]
for folder in ['data','assets','samples','tools','tests','.github']:
    paths.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
docs=['DEPLOYMENT.md','PUBLIC_BETA_REVIEW.md','ARCHITECTURE_LAB.md','ARCHITECTURE_PREVIEW.png','MAINTENANCE_SCENARIOS.md',
      'ZONING_PLAYGROUND.md','SERVICE_MODEL_DETAIL.md','DATACENTER_CASE.md','CONTROL_LAB.md',
      'ROLE_RESPONSIBILITY.md','EXCHANGE_VALIDATION.json']
paths.extend(root/'docs'/n for n in docs)
patterns=[rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'\bgh[pousr]_[A-Za-z0-9]{30,}\b',
          rb'\bgithub_pat_[A-Za-z0-9_]{30,}\b',rb'\bAKIA[0-9A-Z]{16}\b',rb'\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}\b']
entries=[]
for p in sorted(set(paths)):
    if p.is_symlink():raise ValueError('Refusing source symlink')
    content=p.read_bytes();name=p.relative_to(root).as_posix()
    if p.suffix in ['.js','.cjs','.py','.json','.md','.txt','.html','.css','.yml','.toml']:
        if any(re.search(pattern,content) for pattern in patterns):raise ValueError('Potential credential pattern: '+name)
        if re.search(rb'[A-Za-z]:[\\/](?:Users|Work)[\\/]',content):raise ValueError('Personal machine path: '+name)
    entries.append({'path':name,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
version=json.loads((root/'package.json').read_text())['version']
manifest={'schema':'DC01-public-source-v1','version':version,'files':entries,
          'notice':'Repository seed, not web root. No license for reuse is selected. Does not include internal prompts, local sessions, credentials or generated dist.'}
out=root/'output';out.mkdir(exist_ok=True);dest=out/'DC01-github-source.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
    for e in entries:z.write(root/e['path'],e['path'])
    z.writestr('SOURCE-MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(dest) as z:
    assert z.testzip() is None
    for e in entries:assert hashlib.sha256(z.read(e['path'])).hexdigest()==e['sha256']
    assert not any(n.startswith(('tmp/','output/','dist/','.git/')) for n in z.namelist())
print(json.dumps({'file':dest.name,'sourceFiles':len(entries),'members':len(entries)+1,'bytes':dest.stat().st_size,
                  'credentialPatterns':0,'personalPaths':0,'manifestHashes':'pass'},indent=2))
