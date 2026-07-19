import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheRoot = resolve(
  process.env.ITPAY_CLI_CACHE_DIR ||
    join(process.env.XDG_CACHE_HOME || join(homedir(), ".cache"), "itpay-buyer", "cli"),
);
const npmCommand = process.env.ITPAY_NPM_COMMAND || "npm";

const latest = JSON.parse(
  execFileSync(npmCommand, ["view", "@itpay/cli", "version", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (typeof latest !== "string" || !/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(latest)) {
  throw new Error("npm returned an invalid latest @itpay/cli version");
}

const packageRoot = join(cacheRoot, latest, "node_modules", "@itpay", "cli");
if (!isReady(packageRoot, latest)) ensureInstalled(latest, packageRoot);

const entry = existsSync(join(packageRoot, "dist", "src", "main.js"))
  ? join(packageRoot, "dist", "src", "main.js")
  : join(packageRoot, "itpay-cli.bundle.mjs");
process.stdout.write(`${entry}\n${join(packageRoot, "docs", "agent", "buyer")}\n`);

function isReady(root, version) {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    return (
      pkg.version === version &&
      existsSync(join(root, ".itpay-skill-patched")) &&
      (existsSync(join(root, "dist", "src", "main.js")) ||
        existsSync(join(root, "itpay-cli.bundle.mjs")))
    );
  } catch {
    return false;
  }
}

function ensureInstalled(version, packageRoot) {
  mkdirSync(cacheRoot, { recursive: true });
  const lock = join(cacheRoot, ".update-lock");
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      mkdirSync(lock);
      try {
        if (!isReady(packageRoot, version)) installLatest(version, packageRoot);
        return;
      } finally {
        rmSync(lock, { recursive: true, force: true });
      }
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (isReady(packageRoot, version)) return;
      try {
        if (Date.now() - statSync(lock).mtimeMs > 120_000) {
          rmSync(lock, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  throw new Error("timed out waiting for another ItPay CLI update");
}

function installLatest(version, finalRoot) {
  const versionDir = dirname(dirname(dirname(finalRoot)));
  const staging = `${versionDir}.staging-${process.pid}-${Date.now()}`;
  rmSync(staging, { recursive: true, force: true });
  try {
    execFileSync(
      npmCommand,
      [
        "install",
        "--prefix",
        staging,
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--save=false",
        `@itpay/cli@${version}`,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    const stagedRoot = join(staging, "node_modules", "@itpay", "cli");
    patchSkillIntegration(stagedRoot);
    const installedVersion = JSON.parse(readFileSync(join(stagedRoot, "package.json"), "utf8")).version;
    if (installedVersion !== version) throw new Error(`installed ${installedVersion}, expected ${version}`);
    rmSync(versionDir, { recursive: true, force: true });
    renameSync(staging, versionDir);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function patchSkillIntegration(root) {
  const skillFile = join(root, "dist", "src", "commands", "skill.js");
  const installFile = join(root, "dist", "src", "commands", "install.js");
  let skillSource = readFileSync(skillFile, "utf8");
  if (!skillSource.includes("process.env.ITPAY_CLI_SKILL_FILE")) {
    skillSource = replaceOnce(
      skillSource,
      "function findSkillPath() {\n    if (process.env.ITPAY_CLI_SKILLS_DIR)",
      "function findSkillPath() {\n    if (process.env.ITPAY_CLI_SKILL_FILE) {\n        return resolve(process.env.ITPAY_CLI_SKILL_FILE);\n    }\n    if (process.env.ITPAY_CLI_SKILLS_DIR)",
      "canonical Skill path",
    );
    writeFileSync(skillFile, skillSource);
  }

  let installSource = readFileSync(installFile, "utf8");
  for (const type of ["hermes", "openclaw", "kimi-code"]) {
    if (!installSource.includes(`\"${type}\"`)) {
      installSource = replaceOnce(
        installSource,
        '    "workbuddy",\n',
        `    "workbuddy",\n    "${type}",\n`,
        `${type} Agent Type`,
      );
    }
  }
  if (!installSource.includes('"kimi-code":')) {
    installSource = replaceOnce(
      installSource,
      '    workbuddy: "在 WorkBuddy 中始终传这个 Agent Type；Checkout 返回 qr_image_url 时，必须按当次 instruction 调用 present_files 在右侧打开二维码，不要检查本地二维码文件。",\n',
      '    workbuddy: "在 WorkBuddy 中始终传这个 Agent Type；Checkout 返回 qr_image_url 时，必须按当次 instruction 调用 present_files 在右侧打开二维码，不要检查本地二维码文件。",\n    "kimi-code": "在 Kimi Code 中始终传这个 Agent Type；付款交接应显示在当前用户可见界面。",\n    openclaw: "在 OpenClaw 中始终传这个 Agent Type；付款交接应显示在当前用户可见界面。",\n    hermes: "在 Hermes 中始终传这个 Agent Type；付款交接应显示在当前用户可见界面。",\n',
      "Agent Type instructions",
    );
  }
  if (!installSource.includes("process.env.ITPAY_CLI_SKILL_FILE")) {
    installSource = replaceOnce(
      installSource,
      '            install_command: "npm install -g @itpay/cli",',
      '            install_command: process.env.ITPAY_CLI_SKILL_FILE ? "sh <skill-root>/bin/itpay" : "npm install -g @itpay/cli",',
      "bundled install command",
    );
  }
  writeFileSync(installFile, installSource);
  writeFileSync(join(root, ".itpay-skill-patched"), `${readFileSync(join(skillRoot, "SKILL.md"), "utf8").length}\n`);
}

function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`latest CLI cannot apply required ${label} patch`);
  return source.replace(needle, replacement);
}
