"""Offline publisher checks: no real network, credentials, repository or deployment."""
from pathlib import Path
import importlib.util,unittest,tempfile,zipfile,json,hashlib,io,urllib.error
from types import SimpleNamespace
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'tools/publish-github.py')
pub=importlib.util.module_from_spec(spec);spec.loader.exec_module(pub)

class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.parent=(Path(__file__).resolve().parents[1]/'tmp').resolve();self.parent.mkdir(exist_ok=True)
        self.tmp=tempfile.TemporaryDirectory(prefix='publisher-test-',dir=self.parent);self.root=Path(self.tmp.name).resolve();(self.root/'output').mkdir()
        content=b'Fictional educational source'
        self.content=content;self.sha=hashlib.sha256(content).hexdigest()
        self.manifest={'schema':'DC01-public-source-v1','version':'2.7.0-beta.1','files':[{'path':'README.md','sha256':self.sha,'bytes':len(content)}]}
        with zipfile.ZipFile(self.root/'output/DC01-github-source.zip','w') as z:
            z.writestr('README.md',content);z.writestr('SOURCE-MANIFEST.json',json.dumps(self.manifest))
        self.root_patch=patch.object(pub,'ROOT',self.root);self.root_patch.start()
        self.processes=[];self.requests=[]
    def tearDown(self):
        self.root_patch.stop();self.assertTrue(self.root.is_relative_to(self.parent));self.tmp.cleanup()
    def process(self,args,**kwargs):
        self.processes.append(args)
        if args[:3]==['git','credential','fill']:return SimpleNamespace(returncode=0,stdout='username=leomanx\npassword=offline-test-only\n',stderr='')
        return SimpleNamespace(returncode=0,stdout='',stderr='')
    def response(self,obj):return io.BytesIO(json.dumps(obj).encode())
    def missing(self,url):raise urllib.error.HTTPError(url,404,'Not found',{},None)
    def test_only_exact_empty_nojekyll_marker_is_hosting_control(self):
        entry={'path':'.nojekyll','bytes':0,'sha256':hashlib.sha256(b'').hexdigest()}
        self.assertTrue(pub.is_hosting_control(entry))
        for change in [{'path':'README.md'},{'path':'.other'},{'bytes':1},{'sha256':'incorrect'}]:self.assertFalse(pub.is_hosting_control({**entry,**change}))
    def test_wrong_account_stops_before_any_repository_change(self):
        with patch.object(pub.subprocess,'run',side_effect=self.process),patch.object(pub.urllib.request,'urlopen',return_value=self.response({'login':'another-account','id':1})):
            with self.assertRaisesRegex(RuntimeError,'account differs'):pub.main()
        self.assertEqual(len(self.processes),1)
    def test_nonempty_repository_without_matching_marker_is_not_overwritten(self):
        def network(req,**kw):
            self.requests.append((req.full_url,req.get_method()))
            if req.full_url.endswith('/user'):return self.response({'login':'leomanx','id':30502564})
            if '/contents/' in req.full_url:self.missing(req.full_url)
            if req.full_url.endswith('/branches'):return self.response([{'name':'main'}])
            return self.response({'private':False})
        with patch.object(pub.subprocess,'run',side_effect=self.process),patch.object(pub.urllib.request,'urlopen',side_effect=network):
            with self.assertRaisesRegex(RuntimeError,'not empty'):pub.main()
        self.assertTrue(all(method=='GET' for _,method in self.requests));self.assertEqual(len(self.processes),1)
    def test_modified_source_stops_before_credentials_or_network(self):
        with zipfile.ZipFile(self.root/'output/DC01-github-source.zip','w') as z:
            z.writestr('README.md',b'changed');z.writestr('SOURCE-MANIFEST.json',json.dumps(self.manifest))
        with patch.object(pub.subprocess,'run') as proc,patch.object(pub.urllib.request,'urlopen') as network:
            with self.assertRaisesRegex(RuntimeError,'digest mismatch'):pub.main()
            proc.assert_not_called();network.assert_not_called()
    def test_new_public_repository_pages_and_hosted_hash_flow_without_token_leak(self):
        created=False;enabled=False;dispatched=False
        def network(req,**kw):
            nonlocal created,enabled,dispatched
            url=req.full_url;method=req.get_method();self.requests.append((url,method))
            if url.startswith('https://leomanx.github.io/'):
                self.assertNotIn('Authorization',req.headers)
                if url.endswith('release-manifest.json'):return self.response({'appVersion':self.manifest['version'],'files':self.manifest['files']+[{'path':'.nojekyll','bytes':0,'sha256':hashlib.sha256(b'').hexdigest()}]})
                return io.BytesIO(self.content)
            self.assertEqual(req.headers.get('Authorization'),'Bearer offline-test-only')
            if url.endswith('/user'):return self.response({'login':'leomanx','id':30502564})
            if url.endswith('/user/repos'):
                body=json.loads(req.data);self.assertFalse(body['private']);created=True;return self.response({'private':False})
            if '/contents/' in url:self.missing(url)
            if url.endswith('/branches'):return self.response([])
            if '/pages.yml/runs?' in url:return self.response({'workflow_runs':[{'id':1,'status':'completed','conclusion':'success','html_url':'https://github.com/leomanx/revit-thailand-dc01/actions/runs/1'}] if dispatched else []})
            if url.endswith('/dispatches'):dispatched=True;return io.BytesIO(b'')
            if url.endswith('/pages'):
                if method=='POST':enabled=True
                if not enabled:self.missing(url)
                return self.response({'build_type':'workflow','html_url':'https://leomanx.github.io/revit-thailand-dc01/'})
            if not created:self.missing(url)
            return self.response({'private':False})
        with patch.object(pub.subprocess,'run',side_effect=self.process),patch.object(pub.urllib.request,'urlopen',side_effect=network),patch('builtins.print'):
            pub.main()
        report=json.loads((self.root/'output/deployment-report.json').read_text())
        self.assertEqual(report['hostedPayloadHashes'],'pass');self.assertFalse(report['netlifyUsed']);self.assertEqual(report['verifiedPublicPayloads'],1);self.assertEqual(report['hostControlFiles'],['.nojekyll']);self.assertFalse(any(url.endswith('/.nojekyll') for url,_ in self.requests))
        self.assertNotIn('offline-test-only',json.dumps(report)+json.dumps(self.processes))
        self.assertTrue(any(args[:2]==['git','push'] for args in self.processes))

if __name__=='__main__':unittest.main()
