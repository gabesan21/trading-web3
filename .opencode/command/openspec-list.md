---
agent: plan
description: List all OpenSpec changes and their current status.
---
<!-- OPENSPEC:START -->
**Guardrails**
- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to `openspec/AGENTS.md` (located inside the `openspec/` directory—run `ls openspec` or `openspec update` if you don't see it) if you need additional OpenSpec conventions or clarifications.

**Steps**
1. Run `openspec list` to display all active and archived changes.
2. Present the output to the user in a clear and readable format.
3. If the user requests additional filters or options (e.g., `--specs`, `--json`), run the command with those flags.

**Reference**
- Use `openspec list --specs` to also show all registered specs.
- Use `openspec list --json` for machine-readable output.
- Use `openspec show <id>` to get detailed information about a specific change.
<!-- OPENSPEC:END -->
