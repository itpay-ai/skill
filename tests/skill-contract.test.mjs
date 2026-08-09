import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const skill = await readFile(new URL("../SKILL.md", import.meta.url), "utf8");
const openai = await readFile(new URL("../agents/openai.yaml", import.meta.url), "utf8");
const invocation = await readFile(
  new URL("../references/itpay-cli-invocation.md", import.meta.url),
  "utf8",
);
const wrapper = await readFile(new URL("../bin/itpay", import.meta.url), "utf8");
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const vendorPackage = JSON.parse(
  await readFile(new URL("../vendor/itpay-cli/package.json", import.meta.url), "utf8"),
);
const skillRoot = dirname(fileURLToPath(new URL("../SKILL.md", import.meta.url)));

async function findSkillFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries
    .filter((entry) => entry.name !== ".git")
    .map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return findSkillFiles(path);
      return entry.isFile() && entry.name === "SKILL.md" ? [path] : [];
    }));
  return nested.flat();
}

test("Skill frontmatter supports Agent discovery and SkillHub publishing", () => {
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
  assert.match(frontmatter, /^name: itpay-buyer$/m);
  assert.match(frontmatter, /^description: /m);
  assert.match(frontmatter, /^metadata:$/m);
  assert.match(frontmatter, /^  slug: itpay-buyer$/m);
  assert.match(frontmatter, /^license: MIT$/m);
  assert.match(frontmatter, /^  version: 2\.2\.1$/m);
  assert.match(frontmatter, /^  displayName: ItPay Buyer$/m);
  assert.match(frontmatter, /ItPay/);
  assert.match(frontmatter, /company lookup|企业查询/);
  assert.match(frontmatter, /Checkout|payment QR/);
  assert.match(frontmatter, /refund/);
  assert.match(frontmatter, /another skill/);
});

test("implicit invocation and default prompt advertise the Skill", () => {
  assert.match(openai, /allow_implicit_invocation: true/);
  assert.match(openai, /default_prompt: "Use \$itpay-buyer /);
});

test("bundled command is the only normal control surface", () => {
  assert.match(skill, /references\/itpay-cli-invocation\.md/);
  assert.match(skill, /sh <skill-root>\/bin\/itpay/);
  assert.match(skill, /no global CLI install or MCP connection is required/i);
  assert.match(invocation, /Replace only the leading launcher/);
  assert.match(invocation, /archive-based installer.*executable bit/);
  assert.match(invocation, /Do not choose the launcher with `command -v`/);
});

test("the repository exposes exactly one canonical SKILL.md", async () => {
  const files = await findSkillFiles(skillRoot);
  assert.deepEqual(files.map((file) => relative(skillRoot, file)), ["SKILL.md"]);
});

test("runtime metadata pins compatible Node and CLI versions", () => {
  assert.equal(packageJson.version, "2.2.1");
  assert.equal(packageJson.engines.node, ">=18");
  assert.equal(vendorPackage.version, "2.0.25");
  assert.equal(
    vendorPackage.itpaySource.commit,
    "f8fd62a8707919da77e7a792103a23b40b0e252f",
  );
  assert.equal(vendorPackage.itpaySkillPatches.length, 2);
});

test("bundled compatibility recovery updates the Skill instead of a global CLI", () => {
  assert.match(skill, /backend_contract_incompatible/);
  assert.match(skill, /result\.required_cli_version/);
  assert.match(skill, /do \*\*not\*\* execute the returned global npm recovery/i);
  assert.match(skill, /result\.current_cli_version/);
  assert.match(skill, /sh <skill-root>\/bin\/itpay --version/);
  assert.match(invocation, /global `npm install` cannot change the CLI used by this wrapper/);
  assert.match(invocation, /never infer one from prose or substitute `latest`/i);
  assert.doesNotMatch(wrapper, /npm|resolve-itpay-cli/);
});

test("Skill maps every Backend-supported Agent Type without impersonation", () => {
  for (const agentType of [
    "codex-desktop",
    "codex-cli",
    "claude-code-desktop",
    "claude-code-cli",
    "workbuddy",
    "kimi-code",
    "openclaw",
    "hermes",
  ]) {
    assert.ok(skill.includes("`" + agentType + "`"));
  }
  assert.match(skill, /never impersonate another runtime/);
});

test("bundled third-party dependencies retain their license notices", async () => {
  for (const notice of [
    "commander-LICENSE",
    "qrcode-LICENSE",
    "dijkstrajs-LICENSE.md",
    "pngjs-LICENSE",
  ]) {
    await access(new URL(`../vendor/itpay-cli/licenses/${notice}`, import.meta.url));
  }
});
