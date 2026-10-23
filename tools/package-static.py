"""Package already-built, validated dist files at ZIP root for static hosting."""
from pathlib import Path
import json,zipfile,hashlib
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
manifest=json.loads((dist/'release-manifest.json').read_text(encoding='utf-8'))
assert manifest['schema']=='DC01-static-release-v1'
allowed={entry['path'] for entry in manifest['files']}|{'release-manifest.json'}
actual={str(p.relative_to(dist)).replace('\\','/') for p in dist.rglob('*') if p.is_file()}
assert allowed==actual,'Unexpected/missing files in dist; build again'
for entry in manifest['files']:
    p=dist/entry['path'];assert not p.is_symlink();assert hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256']
out=root/'output';out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/'DC01-static-site.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(allowed):archive.write(dist/name,name)
with zipfile.ZipFile(out/'DC01-static-site.zip') as archive:assert archive.testzip() is None
print(str(out/'DC01-static-site.zip'),len(allowed),'files')
