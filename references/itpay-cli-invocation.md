# ItPay CLI Invocation

Read this before running any ItPay command from this Skill.

## Resolve The Bundled Command

Resolve the directory containing this Skill's `SKILL.md`, then bind the logical command `itpay` to `sh <skill-root>/bin/itpay` using the absolute Skill path. Reuse that exact wrapper for the entire workflow, even when the working directory changes. Calling it through `sh` also works when an archive-based installer did not preserve the executable bit.

The wrapper pins the bundled CLI and offline Agent docs, then points the CLI back to the canonical root Buyer Skill. It requires Node.js 18 or newer and does not require npm installation, an MCP connector, or a global executable.

Do not choose the launcher with `command -v`, install `@itpay/cli`, or fall back to `itp`. A different launcher can change the protocol version, local Device identity, Backend defaults, or Host behavior.

## Translate Returned Commands

The CLI emits commands with the stable logical name `itpay`. Execute the returned arguments unchanged through the bound wrapper:

```text
returned: itpay --agent-type codex-desktop catalog list --json
execute:  sh <skill-root>/bin/itpay --agent-type codex-desktop catalog list --json
```

Replace only the leading launcher. Fill placeholders only with values supplied by the human or returned by the current canonical ItPay state. Do not rewrite flags, IDs, inputs, Host, target, Agent Type, or Backend selection.

The upstream CLI may mention `npm install -g @itpay/cli` when packaged assets are missing. In this bundled Skill, treat that as a damaged Skill installation and report it; do not install a second CLI.

The same distribution boundary applies to compatibility recovery. A global `npm install` cannot change the CLI used by this wrapper. When `backend_contract_incompatible` supplies `result.required_cli_version`, report both `result.current_cli_version` and the required version, then ask the human to update or reinstall this Skill through its existing Git, SkillHub, or Agent installer channel. Run no other ItPay command until the wrapper's `--version` exactly matches; then retry typed `readyz`. If the Backend supplies no valid required version, stop and report it; never infer one from prose or substitute `latest`.

## Lock The Environment

Choose these once and preserve them across every continuation and recovery command:

- the exact bundled wrapper;
- one real `--agent-type` or one stable `ITPAY_AGENT_TYPE`;
- the default Backend URL or one deliberate fixed `ITPAY_BACKEND_URL`;
- the Host and Host permission context.

Never mix local Device state across launchers or change Backend/Agent Type to recover quota or an uncertain payment.

## Parse JSON Envelopes

Pass `--json` for Agent-run commands. On exit code 0, parse stdout as one JSON envelope. On a nonzero exit, parse the JSON envelope from stderr when present.

Use fields as follows:

- `status`: current command state;
- `result`: bounded facts for this step;
- `handoff`: human-visible Checkout or presentation data;
- `instruction`: how to use the current facts;
- `next`: zero or one preferred continuation;
- `recovery`: exceptional read/resume paths.

Do not scrape terminal prose when JSON is available. Never print a complete envelope, token, private key, or standalone display token to the human.

## Handle Failure

- Validation or missing-input error: correct only the named input, or ask the human for it.
- Compatibility or Backend contract error: stop business commands and surface the message. Update this Skill only when the CLI supplies an exact required version; verify the bundled wrapper version before typed `readyz`. Do not install or search for another CLI.
- Network timeout during a state-changing operation: treat state as unknown and use the returned or documented read/resume path before retrying.
- Device/session error after the CLI's one renewal attempt: stop. Do not switch Agent Type, delete local state, or rotate identity.
- Bundled asset error: report that the Skill installation is incomplete or damaged.

Run no payment, purchase, protected-read, or refund transition unless the current Skill rules and the human's explicit approval allow it.
