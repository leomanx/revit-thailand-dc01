"""Publish the reviewed repository seed to public GitHub + Pages; never purchases hosting.

Uses Git Credential Manager via its normal helper protocol. No token is printed,
written to disk, embedded in a remote URL, or passed in process arguments.
Refuses a nonempty repository unless its source manifest matches this exact seed.
"""
from pathlib import Path,PurePosixPath
import base64,hashlib,json,os,subprocess,sys,tempfile,time,urllib.request,urllib.error,zipfile

ROOT=Path(__file__).resolve().parents[1]
OWNER='leomanx';REPO='revit-thailand-dc01';FULL=OWNER+'/'+REPO
API='https://api.github.com'
ENV={**os.environ,'GIT_TERMINAL_PROMPT':'0','GCM_INTERACTIVE':'never'}

def run(args,cwd=ROOT):
    r=subprocess.run(args,cwd=cwd,env=ENV,text=True,capture_output=True,encoding='utf-8')
    if r.returncode:raise RuntimeError('Command failed: '+args[0]+' '+args[1]+'; '+r.stderr.strip())
    return r.stdout.strip()

def is_hosting_control(entry):
    return entry.get('path')=='.nojekyll' and entry.get('bytes')==0 and entry.get('sha256')==hashlib.sha256(b'').hexdigest()

def main():
    archive=ROOT/'output/DC01-github-source.zip'
    if not archive.is_file():raise RuntimeError('Run python tools/package-public-source.py first')
    with zipfile.ZipFile(archive) as z:
        manifest=json.loads(z.read('SOURCE-MANIFEST.json'))
        if manifest.get('schema')!='DC01-public-source-v1':raise RuntimeError('Unexpected source archive')
        expected={e['path'] for e in manifest['files']}|{'SOURCE-MANIFEST.json'}
        if set(z.namelist())!=expected:raise RuntimeError('Unexpected files in source archive')
        if any(Path(n).is_absolute() or '..' in PurePosixPath(n).parts or '\\' in n for n in expected):raise RuntimeError('Unsafe source archive path')
        for e in manifest['files']:
            if hashlib.sha256(z.read(e['path'])).hexdigest()!=e['sha256']:raise RuntimeError('Source digest mismatch')
    # Credentials remain in memory and are sent only to the official GitHub API.
    r=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',env=ENV,text=True,capture_output=True)
    credential=dict(line.split('=',1) for line in r.stdout.splitlines() if '=' in line)
    if r.returncode or not credential.get('password'):raise RuntimeError('No noninteractive GitHub credential. Sign in through the normal Git Credential Manager flow, then retry.')
    token=credential['password']
    def api(route,method='GET',body=None,allow404=False):
        request=urllib.request.Request(API+route,data=None if body is None else json.dumps(body).encode(),method=method,headers={
            'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':'application/json',
            'User-Agent':'DC01-public-beta-publisher','X-GitHub-Api-Version':'2022-11-28'})
        try:
            with urllib.request.urlopen(request,timeout=15) as response:
                content=response.read();return json.loads(content) if content else {}
        except urllib.error.HTTPError as e:
            status=e.code;e.close()
            if allow404 and status==404:return None
            raise RuntimeError('GitHub API '+method+' '+route+' returned HTTP '+str(status)) from None
        except urllib.error.URLError:
            raise RuntimeError('Cannot connect to GitHub. Check network/DNS access to github.com and api.github.com; no network/security settings were changed.') from None
    user=api('/user')
    if user.get('login','').lower()!=OWNER:raise RuntimeError('Git credential account differs from the connected account '+OWNER)
    repo=api('/repos/'+FULL,allow404=True)
    if repo is None:
        repo=api('/user/repos','POST',{'name':REPO,'description':'Independent Revit Thailand educational BIM, CDE and AEC decision sandbox. Fictional DC01 public beta.',
                                     'private':False,'auto_init':False,'has_issues':True,'has_wiki':False})
        print('Created public repository '+FULL,flush=True)
    if repo.get('private'):raise RuntimeError('Existing repository is private; will not change its visibility')
    remote_manifest=api('/repos/'+FULL+'/contents/SOURCE-MANIFEST.json',allow404=True)
    if remote_manifest is not None:
        remote=json.loads(base64.b64decode(remote_manifest['content']))
        if remote!=manifest:raise RuntimeError('Repository contains a different source version. Review/update it through normal Git; this initial publisher will not overwrite it.')
        print('Exact source seed already present; resume Pages setup',flush=True)
    else:
        branches=api('/repos/'+FULL+'/branches')
        if branches:raise RuntimeError('Existing repository is not empty and has no matching source manifest; no files overwritten')
        (ROOT/'tmp').mkdir(exist_ok=True)
        work=Path(tempfile.mkdtemp(prefix='github-publish-',dir=ROOT/'tmp')).resolve()
        with zipfile.ZipFile(archive) as z:
            for name in z.namelist():
                if not (work/name).resolve().is_relative_to(work):raise RuntimeError('Unsafe archive path')
            z.extractall(work)
        run(['git','init','-b','main'],work)
        run(['git','config','user.name',OWNER],work)
        run(['git','config','user.email',str(user['id'])+'+'+OWNER+'@users.noreply.github.com'],work)
        run(['git','add','--all'],work)
        run(['git','commit','-m','Publish DC01 '+manifest['version']+' educational public beta'],work)
        run(['git','remote','add','origin','https://github.com/'+FULL+'.git'],work)
        run(['git','push','-u','origin','main'],work)
        print('Pushed reviewed source to '+FULL,flush=True)
    pages=api('/repos/'+FULL+'/pages',allow404=True)
    if pages is None:pages=api('/repos/'+FULL+'/pages','POST',{'build_type':'workflow'})
    elif pages.get('build_type')!='workflow':pages=api('/repos/'+FULL+'/pages','PUT',{'build_type':'workflow'})
    previous=api('/repos/'+FULL+'/actions/workflows/pages.yml/runs?event=workflow_dispatch&branch=main&per_page=1').get('workflow_runs',[])
    previous_id=previous[0]['id'] if previous else 0
    api('/repos/'+FULL+'/actions/workflows/pages.yml/dispatches','POST',{'ref':'main'})
    print('Started GitHub Pages workflow; no Netlify deployment or paid upgrade requested',flush=True)
    deadline=time.time()+420;run_info=None
    while time.time()<deadline:
        runs=api('/repos/'+FULL+'/actions/workflows/pages.yml/runs?event=workflow_dispatch&branch=main&per_page=1').get('workflow_runs',[])
        if runs and runs[0]['id']>previous_id:
            run_info=runs[0]
            if run_info['status']=='completed':break
        time.sleep(5)
    if not run_info or run_info.get('conclusion')!='success':
        raise RuntimeError('Pages is pending or failed; inspect https://github.com/'+FULL+'/actions before sharing a URL')
    pages=api('/repos/'+FULL+'/pages');site=pages.get('html_url','')
    if not site.startswith('https://'+OWNER+'.github.io/'):raise RuntimeError('Unexpected Pages origin; inspect repository settings')
    if not site.endswith('/'):site+='/'
    def public_get(path):
        with urllib.request.urlopen(urllib.request.Request(site+path,headers={'User-Agent':'DC01-public-beta-check'}),timeout=20) as response:return response.read()
    remote_release=None
    for attempt in range(12):
        try:
            remote_release=json.loads(public_get('release-manifest.json'));break
        except (urllib.error.URLError,ValueError):time.sleep(5)
    if not remote_release or remote_release.get('appVersion')!=manifest['version']:raise RuntimeError('Public release version is not yet visible')
    controls=[];verified=0
    for e in remote_release['files']:
        if is_hosting_control(e):
            controls.append(e['path']);continue
        if hashlib.sha256(public_get(e['path'])).hexdigest()!=e['sha256']:raise RuntimeError('Hosted payload digest mismatch: '+e['path'])
        verified+=1
    report={'repository':'https://github.com/'+FULL,'site':site,'version':manifest['version'],'workflow':run_info['html_url'],
            'hostedPayloadHashes':'pass','files':len(remote_release['files']),'verifiedPublicPayloads':verified,'hostControlFiles':controls,'netlifyUsed':False}
    (ROOT/'output/deployment-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    try:main()
    except Exception as e:
        print('PUBLISH NOT COMPLETED: '+str(e),file=sys.stderr);sys.exit(1)
