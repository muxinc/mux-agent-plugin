# Mux Agent Plugin

This repo packages **Mux** for agent hosts (Cursor, Grok Bot, Claude Code, Codex,
Muse): a shared remote MCP connector (`https://mcp.mux.com`) plus skills for Video,
Live Streams, Mux Data, and Robots. On every host the user-facing display name is
**Mux** (plugin id `mux`).

Repository: [github.com/muxinc/mux-agent-plugin](https://github.com/muxinc/mux-agent-plugin)

Docs: [Using the Mux MCP Server](https://www.mux.com/docs/integrations/mcp-server)

> **Author contact:** plugin metadata uses `devex@mux.com`.

## Hosts

One package, `plugins/mux`, carries a manifest per host side by side. The
repo root is a self-hosted marketplace (named `mux`) for each host.

| Host | Plugin manifest (in `plugins/mux`) | Marketplace file (repo root) | Status |
| --- | --- | --- | --- |
| **Cursor / Grok Bot** | `.cursor-plugin/plugin.json` + `mcp.json` | `.cursor-plugin/marketplace.json` | Local install documented; Cursor Marketplace submit pending |
| **Claude Code** | `.claude-plugin/plugin.json` + `.mcp.json` | `.claude-plugin/marketplace.json` | Self-hosted marketplace; ready for Anthropic directory submission |
| **Codex** | `.codex-plugin/plugin.json` + `.mcp.json` | `.claude-plugin/marketplace.json` (Codex reads it) | Self-hosted marketplace |
| **Muse Code** | `.muse-plugin/plugin.json` | `.claude-plugin/marketplace.json` (Muse reads it) | Experimental / beta |
| **Portable** | Agent Plugins standard via Agent Bundle | — | Emitted into `artifact/` by `npm run build` |

See [`plugins/mux/README.md`](plugins/mux/README.md) for the user-facing
description, install steps, and the Data & privacy section.

## What you get

- **Connector** — one MCP server (`mux`) at `https://mcp.mux.com`. On Cursor,
  Connect runs Mux OAuth (dashboard.mux.com login + environment picker). No
  access token in the plugin.
- **Skills** — authored once under `plugins/mux/skills/`; every host manifest
  and Agent Bundle (`skills:` → `plugins/mux/skills/...`) read the same files:
  - `mux` — bootstrap, auth model, safety, routing
  - `mux-docs` — upstream docs discovery (llms.txt / collection indexes)
  - `mux-video` — assets, direct uploads, playback IDs, tracks, signing
  - `mux-robots` — Robots jobs on an existing Mux asset
  - `mux-robots-directives` — Directives pipelines
  - `mux-analyze-any-video` — Robots on any source
  - `mux-live` — live streams, simulcast, reconnect, recording
  - `mux-data` — metrics, dimensions, video views, real-time, exports

## Auth (two paths)

### Remote MCP / OAuth (preferred)

Install the host package, then connect `mux` at `https://mcp.mux.com`. Clients
that support OAuth need no Access Token ID/Secret in config.

`plugins/mux` ships two MCP files with the same single server:

- `mcp.json` — Cursor format (url-only, transport inferred). The Cursor
  manifest pins it explicitly with `"mcpServers": "./mcp.json"` so Cursor never
  picks up `.mcp.json` by accident.
- `.mcp.json` — Claude Code / Codex format (`"type": "http"`).

```json
{
  "mcpServers": {
    "mux": {
      "type": "http",
      "url": "https://mcp.mux.com"
    }
  }
}
```

Keep both files pointing at the same URL.

Do not paste a personal MCP URL. Do not add a second Mux MCP server.

### Token / stdio fallback (CLI-style hosts)

Some hosts only speak **stdio** MCP and cannot use a remote URL. This repo does
**not** ship a local Mux MCP binary. For those hosts:

1. Create an Access Token under **Settings → Access Tokens** in the
   [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens).
2. Prefer a **Read-only** token when exploring.
3. Either:
   - Hosted MCP with Basic auth:
     `Authorization: Basic base64(TOKEN_ID:TOKEN_SECRET)` in headers, or
   - Local server with `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` (e.g. `@mux/mcp` or
     the [Mux CLI](https://github.com/muxinc/cli) auth store).

Marketplace / Agent Bundle path should still prefer OAuth at
`https://mcp.mux.com` where the host supports URL/HTTP MCP.

## Install by host

### Cursor / Grok Bot (local — primary path)

The maintained Mux plugin folder (Cursor Marketplace shape) is **`plugins/mux`**.
Copy it (prefer copy over symlink; Cursor has rejected some symlinks):

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

Enable **Include third-party Plugins, Skills, and other configs**. Run
**Developer: Reload Window**. Settings → Plugins should list **Mux**.
Connect `mux` under Tools & MCP and complete OAuth.

If you previously added Mux under **Settings → Tools & MCP** or in
`~/.cursor/mcp.json`, **remove that user MCP first** so it does not shadow the
plugin server.

#### Optional: install from Agent Bundle Cursor artifact

After `npm run build`, you can also install the composite artifact:

```bash
npx agent-bundle install cursor --from artifact
# or: node artifact/install.mjs
```

`plugins/mux` remains the source of truth for marketplace-shaped Cursor
installs; rebuild/sync skills there (they are the same files Agent Bundle
reads via the same `plugins/mux/skills` paths).

### Claude Code

```text
/plugin marketplace add muxinc/mux-agent-plugin
/plugin install mux@mux
```

Local checkout: `claude plugin marketplace add ./` then
`claude plugin install mux@mux`. Validate with `claude plugin validate plugins/mux`
and `claude plugin validate .`.

### Codex

```bash
codex plugin marketplace add muxinc/mux-agent-plugin
codex plugin add mux@mux
```

Codex reads the root `.claude-plugin/marketplace.json` and the plugin's
`.codex-plugin/plugin.json` (display name, skills, `.mcp.json`).

**OpenAI plugin directory (ChatGPT + Codex):** `npm run build:openai` writes
`dist/mux-openai-plugin.zip` for https://platform.openai.com/plugins. Listing fields,
review test cases, and the submission checklist are in
[`docs/openai-submission.md`](docs/openai-submission.md).

### Muse Code (experimental)

```bash
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins marketplace add mux https://github.com/muxinc/mux-agent-plugin
muse plugins install mux@mux
muse plugins approve mux
muse mcp login mux   # if OAuth required
```

Local checkout: `muse plugins install "$(pwd)/plugins/mux" --scope user`.

Settings-file fallback when experimental plugins are off:

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

### Portable (Agent Plugins)

```bash
npm run build
node artifact/install.mjs
# or: npx agent-bundle install portable --from artifact
```

## Agent Bundle (multi-host build)

This repo is also an [Agent Bundle](https://scriptedalchemy.github.io/agent-bundle/)
project. Agent Bundle is **pre-release** (not on the npm registry name yet).
We pin a green `main` preview tarball from
[pkg.pr.new](https://pkg.pr.new):

```text
agent-bundle@bf98f04f4620b8ff416f040245c6b7a007b7a677
```

```bash
# Node >= 22.19
npm install
npm run validate   # agent-bundle validate
npm run build      # writes artifact/
npm run check      # validate + build
```

Config: [`agent-bundle.config.ts`](agent-bundle.config.ts)  
Targets: `claude`, `codex`, `cursor`, `portable`  
Output: `artifact/` (composite plugin root + `INSTALL.md` +
`agent-bundle.manifest.json`)

Skills are **not** duplicated: `agent-bundle.config.ts` lists explicit
`skills:` paths under `plugins/mux/skills/`, and every host manifest in
`plugins/mux` points at the same folder. Edit skills only under
`plugins/mux/skills/`. If you add or rename a skill, also update
`plugins/mux/.muse-plugin/plugin.json` (Muse lists skills explicitly) and the
`skills:` list in `agent-bundle.config.ts`.

`plugins/mux` must contain real files only — no symlinks and no `.DS_Store`
(`find plugins/mux -type l -o -name .DS_Store` should print nothing).

> Do **not** set `output.repositoryMarketplace` — it would overwrite the
> hand-maintained `.cursor-plugin/marketplace.json` that points at
> `./plugins/mux`.

## Use

After Connect, ask for example:

- List my recent Mux video assets and their status
- Create a direct upload and give me the upload URL
- Give me the playback URL for playback ID `...`
- Create a live stream and show the stream key
- Best performing country for streaming over the last month (Mux Data)
- Run a Robots job to generate chapters for asset `ASSET_ID`
- Analyze this public video URL with Mux Robots (summarize / chapters)

The agent should prefer Mux MCP tools (`search_docs`, then `execute` with
TypeScript against `@mux/ts`). Do not shell out to `mux` CLI unless the user
asks.

## Safety

Destructive operations are **not** specially gated by the MCP server.
Capability equals the authorized environment + token permissions. Use a
read-only access token when exploring. Confirm deletes, asset removal, and
live-stream teardown with the user.

## Submit to Cursor Marketplace (future)

When ready to publish under the muxinc org:

1. Push this repo to `https://github.com/muxinc/mux-agent-plugin` (or your chosen name).
2. Open [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).
3. Submit the marketplace repo; `plugins/mux` is the package Cursor loads
   (see `.cursor-plugin/marketplace.json`).
4. After approval, install from the Marketplace and verify OAuth Connect.

## Upstream skills ([muxinc/skills](https://github.com/muxinc/skills))

| Skill folder | Origin | Notes |
| --- | --- | --- |
| `mux-docs` | **Upstream** (`muxinc/skills` → `skills/mux-docs`) | Frontmatter remapped to `name: mux-docs` |
| `mux`, `mux-video`, `mux-live`, `mux-data`, `mux-robots`, `mux-robots-directives`, `mux-analyze-any-video` | Plugin-only | |

```bash
./scripts/sync-upstream-skills.sh
```

After syncing, re-copy `plugins/mux` into `~/.cursor/plugins/local/mux` for
local Cursor testing. Agent Bundle and the other host manifests read the same
files in place.

## Repo layout

```text
agent-bundle.config.ts          # multi-host Agent Bundle project
package.json                    # scripts: build / validate / check
artifact/                       # generated by npm run build (gitignored)
.cursor-plugin/marketplace.json # Cursor marketplace (owner + plugin list)
.claude-plugin/marketplace.json # Claude Code marketplace (also read by Codex and Muse)
plugins/mux/                    # Mux plugin, all hosts (source of truth)
  .cursor-plugin/plugin.json    # Cursor (pins mcp.json)
  .claude-plugin/plugin.json    # Claude Code (+ directory listing fields)
  .codex-plugin/plugin.json     # Codex (interface.displayName "Mux")
  .muse-plugin/plugin.json      # Muse Code (skills listed explicitly)
  mcp.json                      # Cursor MCP config
  .mcp.json                     # Claude Code / Codex MCP config
  assets/logo.png
  skills/*/SKILL.md
  README.md                     # host-neutral README + Data & privacy
  LICENSE
scripts/fix-display-names.mjs
scripts/sync-upstream-skills.sh
docs/testing.md
LICENSE
README.md
```

## License

MIT. See [LICENSE](LICENSE).
