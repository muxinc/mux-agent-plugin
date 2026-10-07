# Desktop testing

Run these on your machine before marketplace submit or a multi-host release.

## Cursor — load locally (primary)

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
  assets/logo.png
```

Enable **Include third-party Plugins, Skills, and other configs**. Reload the
window.

Settings → Plugins should list **Mux**. Tools & MCP should show a single `mux`
server.

### Connect

Connect `mux` and complete Mux OAuth (dashboard login + environment).

- Pass: Mux consent / environment picker.
- Fail: GitHub “search issues” fallback (bad MCP schema) or a missing server.

If a tester already added Mux under **Settings → Tools & MCP** or
`~/.cursor/mcp.json`, remove that user MCP first.

## Agent Bundle — validate and build

Requires Node `>= 22.19`. Agent Bundle is installed from pkg.pr.new (pinned
SHA in `package.json`), not the npm registry.

```bash
npm install
npm run validate
npm run build
# optional: npm run check
```

Expect `artifact/` with host projections (`.claude-plugin/`, `.codex-plugin/`,
`.cursor-plugin/`, portable `plugin.json` / `mcp.json`), shared `skills/`,
`INSTALL.md`, and `agent-bundle.manifest.json`.

Optional host install from the artifact (see `artifact/INSTALL.md`):

```bash
npx agent-bundle install cursor --from artifact
npx agent-bundle install claude --from artifact --scope user
npx agent-bundle install codex --from artifact
```

## Claude Code — validate and install locally

```bash
claude plugin validate plugins/mux
claude plugin validate .
claude plugin marketplace add ./
claude plugin install mux@mux
```

## Codex — install locally

```bash
codex plugin marketplace add ./
codex plugin add mux@mux
codex mcp list   # expect mux -> https://mcp.mux.com
```

## Muse Code — experimental

```bash
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins validate plugins/mux   # if your Muse build has a validate command
muse plugins install "$(pwd)/plugins/mux" --scope user
muse plugins approve mux
```

Settings-file fallback when experimental plugins are off
(`~/.config/muse/settings.json`):

```json
{
  "mcp_servers": {
    "mux": {
      "transport": "streamable_http",
      "url": "https://mcp.mux.com",
      "mode": "optional"
    }
  }
}
```

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
