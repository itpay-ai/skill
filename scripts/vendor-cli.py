#!/usr/bin/env python3
"""Import one fixed local Buyer artifact, without rebuilding or patching it."""
import argparse, hashlib, json, os, pathlib, re, subprocess, tarfile
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--tarball',type=pathlib.Path,required=True);parser.add_argument('--cli-root',type=pathlib.Path,required=True);args=parser.parse_args()
cli=args.cli_root.resolve()
status=subprocess.check_output(['git','status','--porcelain'],cwd=cli,text=True).splitlines()
if any(line[3:]!='node_modules' for line in status):raise ValueError('Fixed CLI source must be clean before vendoring')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=cli,text=True).strip()
if not re.fullmatch('[a-f0-9]{40}',commit):raise ValueError('Invalid CLI revision')
payload=args.tarball.read_bytes();files={};modes={}
with tarfile.open(args.tarball,'r:gz')as archive:
 for member in archive.getmembers():
  path=pathlib.PurePosixPath(member.name)
  if path.parts[0]!='package' or '..'in path.parts:raise ValueError('Unsafe archive path')
  if member.isdir():continue
  if not member.isfile():raise ValueError('Only ordinary package files are allowed')
  name=str(pathlib.PurePosixPath(*path.parts[1:]));files[name]=archive.extractfile(member).read();modes[name]=member.mode
package=json.loads(files['package.json'])
if package.get('name')!='@itpay/cli' or package.get('itpayBundleFormat')!='buyer-esm-v1':raise ValueError('Wrong artifact format')
if package.get('gitHead')!=commit:raise ValueError('Artifact gitHead differs from fixed CLI source')
for field in ['dependencies','optionalDependencies','peerDependencies','bundleDependencies']:
 if package.get(field):raise ValueError('Buyer must not download runtime dependencies')
for name in ['dist/src/main.js','dist/src/state/config.js','skills/itpay/SKILL.md']:
 if files[name]!=(cli/name).read_bytes():raise ValueError('Artifact/source output mismatch: '+name)
vendor=root/'vendor/itpay-cli'
prior={}
if(root/'SOURCE.json').exists():prior=json.loads((root/'SOURCE.json').read_text()).get('files',{})
known=set(subprocess.check_output(['git','ls-files','-z','vendor/itpay-cli'],cwd=root).decode().split('\0'))-{''}
known|={'vendor/itpay-cli/'+path for path in prior}
if prior:
 for path,digest in prior.items():
  local=vendor/path
  if local.exists() and hashlib.sha256(local.read_bytes()).hexdigest()!=digest:raise ValueError('Preserve modified payload: '+path)
elif subprocess.check_output(['git','diff','--name-only','HEAD','--','vendor/itpay-cli'],cwd=root).strip():raise ValueError('Preserve existing vendor edits')
for name in subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z','vendor/itpay-cli'],cwd=root).decode().split('\0'):
 if name and name not in known:raise ValueError('Preserve unknown vendor file: '+name)
for name in known:
 path=root/name
 if path.is_file():path.unlink()
canonical=files.pop('skills/itpay/SKILL.md')
for name,content in files.items():
 target=vendor/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content);target.chmod(modes[name]&0o777)
(root/'SKILL.md').write_bytes(canonical)
sha=lambda data:hashlib.sha256(data).hexdigest()
source={'source':'itpay-ai/cli','cli_commit':commit,'cli_version':package['version'],'format':'buyer-esm-v1','cli_tarball_sha256':sha(payload),'skill_sha256':sha(canonical),'canonical_skill_in_root':True,'omitted_packaged_paths':{'skills/itpay/SKILL.md':'Exact canonical bytes are at root SKILL.md; compiled CLI verifies its embedded hash.'},'payload_patches':[],'files':{name:sha(content)for name,content in sorted(files.items())}}
(root/'SOURCE.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'cli_commit':commit,'cli_version':package['version'],'files':len(files),'canonical_roots':1,'payload_patches':0,'sha256':source['cli_tarball_sha256']}))
