# ItPay Buyer Skill

[![Agent Skill](https://img.shields.io/badge/Agent%20Skill-itpay--buyer-111827)](./SKILL.md)
[![Bundled CLI](https://img.shields.io/badge/%40itpay%2Fcli-2.0.25-6366f1)](https://www.npmjs.com/package/@itpay/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

ItPay 官方 Buyer Skill。Agent 安装一个目录后即可发现并调用固定版本的 ItPay CLI，用于发现、比较、购买、恢复、接收和退款经过验证的第三方服务。

The official ItPay buyer Skill. It ships a pinned CLI bundle so an Agent can discover and execute ItPay workflows without a global CLI installation or a separately configured MCP connector.

## 为什么这样打包

- 根目录只有一份 `SKILL.md`，避免递归扫描时注册出两个同名 Skill。
- description 把 ItPay、付费/验证服务、企业查询、Checkout、交付、订单和退款等触发语义放在最前面，便于 Agent 在 Skill 列表被截断时仍能匹配。
- `agents/openai.yaml` 允许隐式调用，并提供显式 `$itpay-buyer` 启动提示。
- `bin/itpay` 从 Skill 自身路径解析固定 CLI，不依赖当前工作目录或全局 `PATH`。
- `vendor/itpay-cli` 内置 `@itpay/cli` 2.0.25 和离线 Agent docs；CLI 通过环境变量读取根 `SKILL.md`，不再携带第二份副本。
- 自动化测试检查发现元数据、唯一入口、wrapper、8 个 Agent Type、CLI command families 和离线 docs。

本仓库采用单文件 bundle，而不是 Git submodule。普通 Git clone、SkillHub 导入及多数 Agent Skill 安装器不会递归拉取 submodule；bundle 能保证 Skill 被发现后立即有可执行入口。

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

重新启动 Agent 会话，使其重新扫描 Skills。Claude Code 在既有 Skills 目录中支持热更新；OpenClaw 通常会刷新快照。运行时只要求 Node.js 18 或更新版本，不需要执行 `npm install -g @itpay/cli`。

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

若 Backend 报告 CLI 合约不兼容，应通过原 Git、SkillHub 或 Agent installer 渠道更新本 Skill，并确认 `sh <skill-root>/bin/itpay --version` 与 Backend 指定版本完全一致。不要安装全局 CLI，也不要改用 npm `latest`；二者都不会安全地更新当前 wrapper 使用的固定 bundle。

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

当前 bundle 固定到 `@itpay/cli@2.0.25`、Git commit `f8fd62a8707919da77e7a792103a23b40b0e252f`，并带有两项可审计的通用 Skill 适配：接受历史名称 `itpay-buyer` 作为 canonical `itpay` 的别名，以及在通用 onboarding 中公布 Backend 已支持的全部 8 个 Agent Type。升级时应从对应 CLI source build 生成 ESM bundle，同步 `docs/agent/buyer`，重新应用这两项适配并运行全部测试。

## 安全边界

- Agent 不代表用户选择候选、批准购买、授权受保护结果或申请退款。
- 二维码被展示、打开或扫描不代表付款成功；只接受 ItPay Backend 的 canonical Checkout 或 Order 状态。
- 不暴露 Device 私钥、Buyer token、Provider 凭据、独立 display token 或未授权结果。
- 不通过新建 Execution、切换 Agent Type、切换 CLI 或轮换本地身份绕过额度与状态。

## License

[MIT](./LICENSE) © ItPay
