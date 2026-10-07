# Desktop testing

Run these on your machine before marketplace submit.

## Load locally

```bash
mkdir -p ~/.cursor/plugins/local
rm -rf ~/.cursor/plugins/local/mux
cp -R plugins/mux ~/.cursor/plugins/local/mux
```

Confirm:

```text
~/.cursor/plugins/local/mux/
  .cursor-plugin/plugin.json
  mcp.json
  skills/*/SKILL.md
  assets/logo.svg
```

Enable **Include third-party Plugins, Skills, and other configs**. Reload the window.

Settings → Plugins should list **Mux**. Tools & MCP should show a single `mux` server.

## Connect

Connect `mux` and complete Mux OAuth (dashboard login + environment).

- Pass: Mux consent / environment picker.
- Fail: GitHub “search issues” fallback (bad MCP schema) or a missing server.

If a tester already added Mux under **Settings → Tools & MCP** or `~/.cursor/mcp.json`, remove that user MCP first.

## Prompt matrix

| Prompt | Expect |
| --- | --- |
| Who am I / which Mux environment? | `mux` skill → `execute` with account utilities |
| List recent video assets | `mux-video` → `search_docs` / `execute` |
| Create a direct upload | `mux-video`; confirm write intent |
| Create a live stream | `mux-live` |
| Best country for streaming last month | `mux-data` |
| Generate chapters with Robots | `mux` bootstrap → `execute` Robots APIs |

Destructive ops are not specially gated — use read-only tokens when exploring.
