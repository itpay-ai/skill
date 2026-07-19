# ItPay CLI Invocation

Read this before running any ItPay command from this Skill.

## Resolve The Bundled Command

Resolve the directory containing this Skill's `SKILL.md`, then bind the logical command `itpay` to `sh <skill-root>/bin/itpay` using the absolute Skill path. Reuse that exact wrapper for the entire workflow, even when the working directory changes. Calling it through `sh` also works when an archive-based installer did not preserve the executable bit.

Before every command, the wrapper queries npm for the latest official `@itpay/cli`, installs that exact version into a Skill-specific user cache when absent, reapplies the canonical Skill and eight-Agent-Type integration patches, verifies the installation, and only then runs it. It requires Node.js 18+, npm, and registry access, but never needs a global executable or MCP connector.

Do not choose the launcher with `command -v`, install `@itpay/cli`, or fall back to `itp`. A different launcher can change the protocol version, local Device identity, Backend defaults, or Host behavior.

## Translate Returned Commands

The CLI emits commands with the stable logical name `itpay`. Execute the returned arguments unchanged through the bound wrapper:

```text
returned: itpay --agent-type codex-desktop catalog list --json
execute:  sh <skill-root>/bin/itpay --agent-type codex-desktop catalog list --json
```

Replace only the leading launcher. Fill placeholders only with values supplied by the human or returned by the current canonical ItPay state. Do not rewrite flags, IDs, inputs, Host, target, Agent Type, or Backend selection.

The wrapper owns npm resolution and installation. Never run an npm install command yourself. If latest lookup, installation, integrity verification, required patching, or docs resolution fails, report the updater failure and stop; never execute the vendored fallback.

## Lock The Environment

Choose these once and preserve them across every continuation and recovery command:

- the exact auto-updating wrapper;
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
- Compatibility or Backend contract error: stop and surface the message. Do not search for another CLI.
- Network timeout during a state-changing operation: treat state as unknown and use the returned or documented read/resume path before retrying.
- Device/session error after the CLI's one renewal attempt: stop. Do not switch Agent Type, delete local state, or rotate identity.
- Updater or latest-package error: stop before the requested CLI command; never fall back to an older version.

Run no payment, purchase, protected-read, or refund transition unless the current Skill rules and the human's explicit approval allow it.
