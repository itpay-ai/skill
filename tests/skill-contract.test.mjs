import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const skill=await read('SKILL.md'),source=JSON.parse(await read('SOURCE.json'));
const wrapper=await read('bin/itpay'),invocation=await read('references/itpay-cli-invocation.md');
test('The independent Skill uses the exact canonical Buyer business instructions, not a divergent tutorial',()=>{
 assert.equal(source.canonical_skill_in_root,true);assert.equal(createHash('sha256').update(skill).digest('hex'),source.skill_sha256);assert.match(skill,/^name: itpay$/m);assert.match(skill,/references\/itpay-cli-invocation\.md/);assert.match(skill,/real `dot` or `muse`/);assert.match(skill,/Do not write Python, Node, regex or jq parsers/);assert.match(skill,/missing genuine consent/);
});
test('Wrapper stays on the pinned dependency-free ESM payload and preserves permitted state',()=>{
 assert.match(wrapper,/vendor\/itpay-cli\/dist\/src\/main\.js/);assert.match(wrapper,/ITPAY_CLI_DOCS_DIR/);assert.match(wrapper,/ITPAY_CLI_SKILLS_DIR/);assert.doesNotMatch(wrapper,/npm|resolve-itpay-cli/);assert.match(invocation,/Replace only the leading launcher/);assert.match(invocation,/archive-based installer.*executable bit/);assert.match(invocation,/ITPAY_STATE_DIR/);assert.match(invocation,/never infer one from prose or substitute `latest`/i);assert.match(invocation,/Do not write Python, Node, regex or jq parsers/);
});
test('Version, original payload files and full dependency notices match the fixed CLI',async()=>{
 const pkg=JSON.parse(await read('vendor/itpay-cli/package.json'));assert.equal(pkg.version,'2.1.52');assert.equal(pkg.version,source.cli_version);assert.equal(pkg.itpayBundleFormat,'buyer-esm-v1');assert.deepEqual(source.payload_patches,[]);assert.match(source.cli_commit,/^[a-f0-9]{40}$/);assert.match(source.cli_tarball_sha256,/^[a-f0-9]{64}$/);
 for(const [path,digest]of Object.entries(source.files))assert.equal(createHash('sha256').update(await readFile(new URL('vendor/itpay-cli/'+path,root))).digest('hex'),digest,path);
 const notice=await read('vendor/itpay-cli/THIRD-PARTY-NOTICES.txt');for(const name of ['commander','qrcode','dijkstrajs','pngjs','zod'])assert(notice.includes(name));
});
test('Host metadata names the actual canonical Skill',async()=>{
 const meta=await read('agents/openai.yaml');assert.match(meta,/allow_implicit_invocation: true/);assert.match(meta,/Use \$itpay /);assert.doesNotMatch(meta,/Use \$itpay-buyer /);
});
