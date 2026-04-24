---
description: Generate today's email action-item digest for the current persona
allowed-tools: Bash(npx tsx bin/digest.ts:*)
---

Run today's digest using the Email Secretary CLI:

!npx tsx bin/digest.ts --persona=${PERSONA:-finance}

After it prints, summarize the top 3 items in plain language and offer to:
- mark any of them done (use the `secretary` MCP `mark_done` tool)
- snooze any of them (use the `secretary` MCP `snooze` tool)
- open the source email if the user wants more detail
