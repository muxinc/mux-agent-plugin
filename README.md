# Mux Agent Plugin

This repo packages **Mux** for agent hosts (Cursor, Grok Bot, Claude Code, Codex,
Muse): a shared remote MCP connector (`https://mcp.mux.com`) plus skills for Video,
Live Streams, Mux Data, and Robots. On every host the user-facing display name is
**Mux** (plugin id `mux`).

Canonical repository (placeholder until published):
[github.com/muxinc/cursor-plugin](https://github.com/muxinc/cursor-plugin)

Docs: [Using the Mux MCP Server](https://www.mux.com/docs/integrations/mcp-server)

> **Author contact:** plugin metadata uses `devex@mux.com`.

## Hosts

| Host | How it is packaged | Status |
| --- | --- | --- |
| **Cursor / Grok Bot** | Hand-maintained `plugins/mux` (Cursor Marketplace shape) **and** Agent Bundle `cursor` / `portable` artifact | Local install documented; marketplace submit is future |
| **Claude Code** | Agent Bundle `claude` target in `artifact/` | Build locally; not published to a Claude marketplace |
| **Codex** | Agent Bundle `codex` target in `artifact/` | Build locally; not published |
| **Muse Code** | Thin native pack in `packs/muse/` (Agent Bundle has **no** Muse target) | Experimental / beta |
| **Portable** | Agent Plugins open standard (`plugin.json` + `mcp.json`) via Agent Bundle | Emitted into `artifact/` |

This repo does **not** claim anything is published to Cursor Marketplace,
Claude, or Codex registries yet. Keep marketplace submit / `muxinc` push as
future work.

## What you get

- **Connector** — one MCP server (`mux`) at `https://mcp.mux.com`. On Cursor,
  Connect runs Mux OAuth (dashboard.mux.com login + environment picker). No
  access token in the plugin.
- **Skills** — authored once under `plugins/mux/skills/` and shared into Agent
  Bundle (`skills:` → `plugins/mux/skills/...`) and Muse (`packs/muse/skills` → symlink):
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

Cursor `mcp.json` (and Agent Bundle emissions) are url-only:

```json
{
  "mcpServers": {
    "mux": {
      "url": "https://mcp.mux.com"
    }
  }
}
```

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

```bash
npm install          # needs Node >= 22.19; Agent Bundle via pkg.pr.new (pre-release)
npm run build
npx agent-bundle install claude --from artifact --scope user
# or follow artifact/INSTALL.md (claude plugin marketplace add / install)
```

### Codex

```bash
npm install
npm run build
npx agent-bundle install codex --from artifact
# or follow artifact/INSTALL.md
```

### Muse Code (experimental)

See [`packs/muse/README.md`](packs/muse/README.md). Short form:

```bash
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins install "$(pwd)/packs/muse" --scope user
muse plugins approve mux
muse mcp login mux   # if OAuth required
```

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
`skills:` paths under `plugins/mux/skills/`. Muse uses a symlink to the same
folder. Edit skills only under `plugins/mux/skills/`.

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

1. Push this repo to `https://github.com/muxinc/cursor-plugin` (or your chosen name).
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
local Cursor testing. Agent Bundle / Muse pick up the same files via symlink.

## Repo layout

```text
agent-bundle.config.ts          # multi-host Agent Bundle project
package.json                    # scripts: build / validate / check
artifact/                       # generated by npm run build (gitignored)
.cursor-plugin/marketplace.json # Cursor marketplace owner + plugin list
plugins/mux/                    # Mux plugin (Cursor Marketplace shape; source of truth)
  .cursor-plugin/plugin.json
  mcp.json
  assets/logo.png
  skills/*/SKILL.md
packs/muse/                     # Muse Code thin pack (experimental)
  .muse-plugin/plugin.json
  skills/ → ../../plugins/mux/skills
scripts/sync-upstream-skills.sh
docs/testing.md
LICENSE
README.md
```

## License

MIT. See [LICENSE](LICENSE).
