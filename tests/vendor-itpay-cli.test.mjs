import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile),wrapper=fileURLToPath(new URL('../bin/itpay',import.meta.url));
async function run(args){const state=await mkdtemp(join(tmpdir(),'itpay-skill-fixture-'));try{return await exec('sh',[wrapper,...args],{cwd:tmpdir(),env:{...process.env,ITPAY_STATE_DIR:state},timeout:10000,maxBuffer:1024*1024});}finally{await rm(state,{recursive:true,force:true});}}
test('Pinned wrapper works from another directory and canonical/legacy Skill reader retains the same instructions',async()=>{
 assert.equal((await run(['--version'])).stdout.trim(),'2.1.52');
 for(const name of ['itpay','itpay-buyer']){const out=JSON.parse((await run(['--agent-type','dot','skill','show',name,'--json'])).stdout);assert.equal(out.status,'shown');assert.equal(out.result.skill,'itpay');assert.equal(out.result.content,await readFile(new URL('../SKILL.md',import.meta.url),'utf8'));assert.equal(out.next,null);}
});
test('Bundled current purchase docs are discoverable directly, without retired tutorials',async()=>{
 const list=JSON.parse((await run(['docs','list','--json'])).stdout);const topics=list.result.topics.map(t=>t.topic);assert(topics.includes('purchase'));assert(topics.includes('rail-booking'));assert(!topics.includes('quickstart'));assert(!topics.includes('rail-fast-checkout'));
 const search=JSON.parse((await run(['docs','search','price_policy','--json'])).stdout);assert.equal(search.status,'matched');assert.equal(search.result.topics[0].topic,'purchase');assert.equal(search.next.command,'itpay docs show purchase --json');
});
test('Real cloud types remain distinct and onboarding does not promise account or cross-session readiness',async()=>{
 const types=JSON.parse((await run(['install','--json'])).stdout).result.agent_types.map(t=>t.agent_type);for(const type of ['dot','muse','codex-desktop','workbuddy','openclaw'])assert(types.includes(type));
 for(const type of ['dot','muse']){const out=JSON.parse((await run(['install',type,'--json'])).stdout);assert.equal(out.status,'instructions_ready');assert.equal(out.result.agent_type,type);assert.equal(out.result.default_host,'plain-chat');assert.equal(out.next.command,`itpay --agent-type ${type} setup --json`);}
});
