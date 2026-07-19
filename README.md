# ItPay Buyer Skill

[![Agent Skill](https://img.shields.io/badge/Agent%20Skill-itpay--buyer-111827)](./SKILL.md)
[![Bundled CLI](https://img.shields.io/badge/%40itpay%2Fcli-2.0.12-6366f1)](https://www.npmjs.com/package/@itpay/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

ItPay 官方 Buyer Skill。Agent 安装一个目录后即可发现，并在每次执行前自动升级、验证和调用最新官方 ItPay CLI，用于发现、比较、购买、恢复、接收和退款经过验证的第三方服务。

The official ItPay buyer Skill. Its wrapper upgrades and verifies npm's latest official CLI before every run, without a global CLI installation or a separately configured MCP connector.

## 为什么这样打包

- 根目录只有一份 `SKILL.md`，避免递归扫描时注册出两个同名 Skill。
- description 把 ItPay、付费/验证服务、企业查询、Checkout、交付、订单和退款等触发语义放在最前面，便于 Agent 在 Skill 列表被截断时仍能匹配。
- `agents/openai.yaml` 允许隐式调用，并提供显式 `$itpay-buyer` 启动提示。
- `bin/itpay` 每次先解析 npm latest；缺少该版本时安装到 Skill 专用用户缓存，补丁和完整性验证通过后才执行。
- `bin/resolve-itpay-cli.mjs` 自动保留根 `SKILL.md`、全部 8 个 Agent Type 和 Skill wrapper 安装提示；任何补丁无法应用时 fail closed。
- `vendor/itpay-cli` 保留可审计的 `2.0.12` 基线和许可证，但不会在升级失败时被静默执行。
- 自动化测试检查发现元数据、唯一入口、wrapper、8 个 Agent Type、CLI command families 和离线 docs。

本仓库不使用 Git submodule。普通 Git clone、SkillHub 导入及多数 Agent Skill 安装器不会递归拉取 submodule；wrapper 使用 npm 官方包和独立缓存，使 Skill 被发现后能自动获得最新 CLI。

## 安装

### 共享 Agent Skills 目录

```bash
git clone https://github.com/itpay-ai/skill.git ~/.agents/skills/itpay-buyer
```

目标目录名必须保持为 `itpay-buyer`，与 `SKILL.md` 的 `name` 一致；不要克隆成 `skill`、`repo` 或其他名字。

该位置可被 Codex、OpenClaw、Kimi Code 及其他采用共享 Agent Skills 目录的客户端发现。新会话中可自然触发，也可显式调用：

| Agent | 显式调用 | ItPay Agent Type |
| --- | --- | --- |
| Codex Desktop | `$itpay-buyer` | `codex-desktop` |
| Codex CLI | `$itpay-buyer` | `codex-cli` |
| Kimi Code | `/skill:itpay-buyer` | `kimi-code` |
| OpenClaw | `itpay-buyer` / 自然语言 | `openclaw` |
| Hermes | Agent 的 Skill 调用入口 | `hermes` |
| WorkBuddy | Agent 的 Skill 调用入口 | `workbuddy` |

### Claude Code

```bash
git clone https://github.com/itpay-ai/skill.git ~/.claude/skills/itpay-buyer
```

使用 `/itpay-buyer`，CLI 使用 `claude-code-cli`；桌面宿主使用 `claude-code-desktop`。

### OpenClaw 安装器

```bash
openclaw skills install git:itpay-ai/skill --global
```

### SkillHub

```bash
skillhub install itpay-buyer --dir ~/.agents/skills
```

重新启动 Agent 会话，使其重新扫描 Skills。Claude Code 在既有 Skills 目录中支持热更新；OpenClaw 通常会刷新快照。运行时要求 Node.js 18+、npm 和 registry 网络访问，不需要执行 `npm install -g @itpay/cli`。

ItPay Backend 当前接受 8 个精确 Agent Type：`codex-desktop`、`codex-cli`、`claude-code-desktop`、`claude-code-cli`、`workbuddy`、`kimi-code`、`openclaw`、`hermes`。其他客户端即使能解析标准 `SKILL.md`，也不能冒充这些类型执行认证交易。

兼容格式依据：[Agent Skills specification](https://agentskills.io/specification)、[Codex Skills](https://developers.openai.com/codex/skills)、[Claude Code Skills](https://code.claude.com/docs/en/skills)、[OpenClaw Skills](https://docs.openclaw.ai/skills)、[Kimi Code Skills](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html)。

## 使用

可以自然提出需求，也可以显式调用：

```text
用 $itpay-buyer 查一下“美团”对应的准确企业主体，先给我候选和价格，不要直接购买。
```

```text
Use $itpay-buyer to find a verified company-information service. Show me the price and wait for approval before checkout.
```

Agent 会先锁定本 Skill 的 wrapper 和真实 Agent Type，然后通过 CLI 返回的 `next.command` 推进同一 Service Execution。候选选择、购买、Checkout、受保护结果授权和退款仍由人决定。

## 本地验证

```bash
npm test
skillhub publish . --dry-run --json
sh ./bin/itpay --version
sh ./bin/itpay docs list --json
```

## 仓库结构

```text
.
├── SKILL.md
├── agents/openai.yaml
├── bin/itpay
├── references/itpay-cli-invocation.md
├── tests/
└── vendor/itpay-cli/
    ├── itpay-cli.bundle.mjs
    ├── docs/agent/buyer/
    └── licenses/
```

## 更新 vendored CLI

vendored 基线固定到 `@itpay/cli@2.0.12`、Git commit `7b8cc441cc47c04797adf2721e1e22d1f425b86d`。运行时 wrapper 每次查询 npm latest，在用户缓存中安装缺失版本，并自动应用根 `SKILL.md`、8 个 Agent Type 和 wrapper 安装提示补丁。若上游结构变化导致补丁无法精确应用，命令会停止，避免执行未经 Skill 集成验证的新版本。

## 安全边界

- Agent 不代表用户选择候选、批准购买、授权受保护结果或申请退款。
- 二维码被展示、打开或扫描不代表付款成功；只接受 ItPay Backend 的 canonical Checkout 或 Order 状态。
- 不暴露 Device 私钥、Buyer token、Provider 凭据、独立 display token 或未授权结果。
- 不通过新建 Execution、切换 Agent Type、切换 CLI 或轮换本地身份绕过额度与状态。

## License

[MIT](./LICENSE) © ItPay
