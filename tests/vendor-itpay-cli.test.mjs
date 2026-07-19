import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const wrapper = fileURLToPath(new URL("../bin/itpay", import.meta.url));
const vendorPackage = JSON.parse(
  await readFile(new URL("../vendor/itpay-cli/package.json", import.meta.url), "utf8"),
);
const cliCache = await mkdtemp(join(tmpdir(), "itpay-skill-cli-cache-"));

async function run(args) {
  const home = await mkdtemp(join(tmpdir(), "itpay-skill-test-"));
  return execFileAsync("sh", [wrapper, ...args], {
    cwd: tmpdir(),
    env: { ...process.env, HOME: home, ITPAY_CLI_CACHE_DIR: cliCache },
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
}

test("shell wrapper upgrades and runs the latest CLI from outside the Skill directory", async () => {
  const { stdout, stderr } = await run(["--version"]);
  assert.equal(stdout.trim(), vendorPackage.version);
  assert.equal(stderr, "");
});

test("wrapper fails closed when latest version resolution fails", async () => {
  const home = await mkdtemp(join(tmpdir(), "itpay-skill-fail-test-"));
  await assert.rejects(
    execFileAsync("sh", [wrapper, "--version"], {
      cwd: tmpdir(),
      env: {
        ...process.env,
        HOME: home,
        ITPAY_CLI_CACHE_DIR: cliCache,
        ITPAY_NPM_COMMAND: "/usr/bin/false",
      },
      encoding: "utf8",
      timeout: 10_000,
    }),
    (error) => {
      assert.match(error.stderr, /could not upgrade and verify the latest official CLI/);
      assert.equal(error.stdout, "");
      return true;
    },
  );
});

test("vendored CLI exposes discovery, checkout, and refund command families", async () => {
  const { stdout } = await run(["--help"]);
  assert.match(stdout, /catalog\s+Browse V3 service catalog/);
  assert.match(stdout, /services\s+Generic V3 Service Execution commands/);
  assert.match(stdout, /checkout.*canonical V3 checkout presentation/);
  assert.match(stdout, /refund \[options\]\s+Create a V3 refund request/);
});

test("canonical root Skill is available through the latest CLI and keeps Agent Type", async () => {
  const { stdout } = await run([
    "--agent-type",
    "codex-desktop",
    "skill",
    "show",
    "itpay-buyer",
    "--json",
  ]);
  const envelope = JSON.parse(stdout);
  assert.equal(envelope.status, "shown");
  assert.equal(envelope.result.skill, "itpay-buyer");
  assert.match(envelope.result.content, /# ItPay Buyer/);
  assert.equal(
    envelope.next.command,
    "itpay --agent-type codex-desktop catalog list --json",
  );
});

test("onboarding exposes all Backend-supported Agent Types", async () => {
  const { stdout } = await run(["install", "--json"]);
  const envelope = JSON.parse(stdout);
  assert.deepEqual(
    envelope.result.agent_types.map((item) => item.agent_type),
    [
      "codex-desktop",
      "codex-cli",
      "claude-code-desktop",
      "claude-code-cli",
      "workbuddy",
      "kimi-code",
      "openclaw",
      "hermes",
    ],
  );

  const { stdout: targetStdout } = await run(["install", "kimi-code", "--json"]);
  const targetEnvelope = JSON.parse(targetStdout);
  assert.equal(targetEnvelope.result.install_command, "sh <skill-root>/bin/itpay");
  assert.equal(
    targetEnvelope.next.command,
    "itpay --agent-type kimi-code readyz --json",
  );
});

test("newly exposed Agent Types can load the canonical root Skill", async () => {
  for (const agentType of ["kimi-code", "openclaw", "hermes"]) {
    const { stdout } = await run([
      "--agent-type",
      agentType,
      "skill",
      "show",
      "itpay-buyer",
      "--json",
    ]);
    const envelope = JSON.parse(stdout);
    assert.equal(envelope.status, "shown");
    assert.equal(
      envelope.next.command,
      `itpay --agent-type ${agentType} catalog list --json`,
    );
    assert.match(envelope.result.content, /version: 2\.3\.0/);
  }
});

test("progressive docs come from the resolved latest CLI", async () => {
  const { stdout } = await run(["docs", "list", "--json"]);
  const envelope = JSON.parse(stdout);
  const topics = envelope.result.topics.map((topic) => topic.topic);
  assert.equal(envelope.status, "listed");
  assert.ok(topics.includes("quickstart"));
  assert.ok(topics.includes("payment-flow"));
  assert.ok(topics.includes("orders-refunds"));
});
