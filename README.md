# ItPay Buyer Skill

[![Agent Skill](https://img.shields.io/badge/Agent%20Skill-itpay--buyer-111827)](./SKILL.md)
[![ItPay CLI](https://img.shields.io/npm/v/%40itpay%2Fcli?label=%40itpay%2Fcli)](https://www.npmjs.com/package/@itpay/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

ItPay 官方 Buyer Skill，让 AI Agent 通过 ItPay 发现、购买并接收经过验证的第三方服务。

The official ItPay buyer skill for AI agents to discover, purchase, resume, receive, and refund verified third-party services through ItPay.

## 能做什么

- 发现并比较 ItPay 当前提供的服务。
- 在用户明确同意价格后创建 Checkout。
- 向用户展示 ItPay 支付页面和二维码。
- 在中断后恢复原有 Service Execution、Checkout 或退款流程。
- 读取 Agent 可见结果，或在用户授权后读取受保护结果。
- 查询订单、收据及退款状态。

Skill 负责约束 Agent 的行为；实际目录、报价、支付状态和交付结果始终以 ItPay 后端及官方 CLI 返回为准。

## 安装

### SkillHub

Skill 在 SkillHub 上架后可安装到对应 Agent 的 skills 目录：

```bash
# Codex
skillhub install itpay-buyer --dir ~/.codex/skills

# Claude Code
skillhub install itpay-buyer --dir ~/.claude/skills
```

### 从 GitHub 安装

```bash
# Codex
git clone https://github.com/itpay-ai/skill.git ~/.codex/skills/itpay-buyer

# Claude Code
git clone https://github.com/itpay-ai/skill.git ~/.claude/skills/itpay-buyer
```

安装 Skill 后，还需要官方 ItPay CLI：

```bash
npm install -g @itpay/cli
itpay readyz --json
```

## 使用

在支持 Skills 的 Agent 中直接提出 ItPay 相关需求，或显式调用：

```text
Use $itpay-buyer to find a verified company-information service.
```

```text
用 $itpay-buyer 查找一个合适的企业信息服务，先告诉我价格，不要直接购买。
```

基础流程：

```bash
itpay install --json
itpay install <agent_type> --json
itpay --agent-type <agent_type> readyz --json
itpay --agent-type <agent_type> catalog list --json
itpay --agent-type <agent_type> services start <service_id> --json
```

之后只执行 CLI 返回的 `next.command`，并在候选选择、购买、受保护结果授权和退款等关键节点等待用户决定。完整规则见 [SKILL.md](./SKILL.md)。

## 安全边界

- Agent 不能代表用户批准购买、选择候选或申请退款。
- 二维码被展示、打开或扫描不代表付款成功；只接受 ItPay 后端确认的支付状态。
- 不得在对话中暴露 Device 私钥、Buyer token、Provider 凭据或受保护结果。
- 不得通过新建 Execution、切换 Agent Type 或轮换本地身份绕过额度与权限限制。
- 支付和交付状态必须来自 ItPay 的权威工作流，不得猜测或自行构造。

## 仓库结构

```text
.
├── SKILL.md            # Agent 工作流与安全规则
├── agents/openai.yaml  # Codex/OpenAI 界面元数据
├── README.md           # 项目说明
└── LICENSE             # MIT License
```

## 发布与版本

SkillHub 发布元数据位于 `SKILL.md` 的 `metadata` 字段。发布新版本时：

1. 更新 `metadata.version`，使用 SemVer。
2. 校验 `name`、`slug` 和目录入口仍为 `itpay-buyer`。
3. 确认文档中的 CLI 命令与当前 [`@itpay/cli`](https://www.npmjs.com/package/@itpay/cli) 一致。
4. 运行 SkillHub 本地预检：

```bash
skillhub publish . --dry-run --json
```

5. 通过 SkillHub 的“从 GitHub 导入”发布或更新版本。

## 相关链接

- [ItPay](https://itpay.ai)
- [ItPay CLI on npm](https://www.npmjs.com/package/@itpay/cli)
- [Skill definition](./SKILL.md)
- [SkillHub](https://skillhub.cn)

## License

[MIT](./LICENSE) © ItPay
