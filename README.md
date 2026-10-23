# ItPay Buyer Skill candidate

This independent Skill contains the fixed Buyer CLI 2.1.52 candidate, with no
runtime dependency download or global CLI installation. The canonical Skill name
is `itpay`; the old `skill show itpay-buyer` reader remains a compatible alias.
This branch is not a published SkillHub release or a verified native-host setup.

Read root `SKILL.md` and `references/itpay-cli-invocation.md`. Use
`sh <skill-root>/bin/itpay` from the actual installed root for every logical
`itpay` command. Keep its Backend, real Agent Type and permitted private state
directory unchanged. No command here authorizes a new identity, payment or refund.

## Fixed source

`SOURCE.json` pins the exact CLI commit, original tarball SHA-256, canonical Skill
and every vendored payload file. The payload is unmodified: only its duplicate
`skills/itpay/SKILL.md` is represented by the byte-identical root `SKILL.md`, which
the compiled CLI verifies against its embedded canonical hash. There is one
registered Skill root, no private patched CLI, and no runtime archive extraction.
Full reachable dependency licenses remain in `THIRD-PARTY-NOTICES.txt`.

Rebuild from the reviewed local tarball with `scripts/vendor-cli.py`; it does not
download, publish or rebuild the CLI. `npm test` checks the actual wrapper from
another directory, canonical/legacy reader, paired hashes, direct current docs,
real Dot/Muse types and absence of retired tutorials. These checks do not prove
host discovery, cross-session persistence, account authorization or natural UX.

## Candidate use and delivery

Install only through an already authorized host Skill channel and permitted
paths. Do not silently replace another installed Skill or reset its identity.
The new Backend/API/publication combination must be installed and verified before
business testing; the 2.1.52 tarball is not yet on npm next. Production latest and
other default channels are unchanged. Dot/Muse native MCP products have their own
remote packages; this Skill does not create or bypass an MCP connection.

Actions, publication and actual runtime installation remain separately approved.
