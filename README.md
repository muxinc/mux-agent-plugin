# Mux for Cursor

Official Mux plugin for the [Cursor Marketplace](https://cursor.com/marketplace) — a shared remote MCP connector plus skills for Video, Live Streams, Mux Data, and Robots. Works in Cursor and Grok Bot.

Canonical repository (placeholder until published): [github.com/muxinc/cursor-plugin](https://github.com/muxinc/cursor-plugin)

Docs: [Using the Mux MCP Server](https://www.mux.com/docs/integrations/mcp-server)

> **Author contact:** plugin metadata uses `open-source@mux.com`. TODO: confirm the preferred public contact email with Mux before marketplace submit.

## What you get

- **Connector** — one MCP server (`mux`) at `https://mcp.mux.com`. Cursor’s Connect flow runs Mux OAuth (dashboard.mux.com login + environment picker). No access token in the plugin.
- **Skills** — routers that teach the agent to use Mux Code Mode (`search_docs` + `execute` against `@mux/ts`), plus docs discovery from [muxinc/skills](https://github.com/muxinc/skills):
  - `mux` — bootstrap, auth model, safety, routing
  - `mux-docs` — **upstream** docs discovery (llms.txt / collection indexes); prefer for API/docs questions
  - `mux-video` — assets, direct uploads, playback IDs, tracks, signing / secure playback, delivery usage
  - `mux-robots` — Robots jobs on an existing Mux asset
  - `mux-robots-directives` — compose Directives pipelines (multi-workflow, attach on ingest)
  - `mux-analyze-any-video` — Robots on any source (ingest URL/local file when needed, then analyze)
  - `mux-live` — live streams, simulcast, reconnect, recording to assets
  - `mux-data` — metrics, dimensions, video views, real-time, exports, errors

## Auth (two paths)

### Marketplace / remote MCP (preferred for Cursor + Grok Bot)

Install this plugin, then **Settings → Tools & MCP → Connect** on `mux`. OAuth opens dashboard.mux.com; pick the environment. Clients that support OAuth need no Access Token ID/Secret in config.

`mcp.json` in this plugin is url-only:

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

### Token / local fallback (CLI-style)

For clients without OAuth, CI, or a local `@mux/mcp` install:

1. Create an Access Token under **Settings → Access Tokens** in the [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens).
2. Prefer a **Read-only** token when exploring.
3. Either:
   - Hosted MCP with Basic auth: `Authorization: Basic base64(TOKEN_ID:TOKEN_SECRET)` in headers, or
   - Local server with `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` env vars.

The [Mux CLI](https://github.com/muxinc/cli) (`mux login`) stores credentials in `~/.config/mux/config.json` and supports named environments (`mux login --name production`). CLI auth is Access Token or browser sign-in for the CLI itself — marketplace plugins should still use OAuth at `https://mcp.mux.com`.

## Install

### From Marketplace (when published)

Install **Mux** from the [Cursor Marketplace](https://cursor.com/marketplace), then Connect under **Settings → Tools & MCP**.

### Local test (before publish)

Copy the **plugin folder**, not the repo root:

```bash
mkdir -p ~/.cursor/plugins/local
rm -rf ~/.cursor/plugins/local/mux
cp -R plugins/mux ~/.cursor/plugins/local/mux
```

Confirm this tree:

```text
~/.cursor/plugins/local/mux/
  .cursor-plugin/plugin.json
  mcp.json
  skills/*/SKILL.md
  assets/logo.svg
```

Enable **Include third-party Plugins, Skills, and other configs**. Run **Developer: Reload Window**.

Settings → Plugins should list **Mux**. Tools & MCP should show a single `mux` server. Connect and complete OAuth.

Prefer a copy over a symlink; Cursor has rejected some symlinks.

If you previously added Mux under **Settings → Tools & MCP** or in `~/.cursor/mcp.json`, **remove that user MCP first** so it does not shadow the plugin server.

## Use

After Connect, ask for example:

- List my recent Mux video assets and their status
- Create a direct upload and give me the upload URL
- Give me the playback URL for playback ID `...`
- Create a live stream and show the stream key
- Best performing country for streaming over the last month (Mux Data)
- Run a Robots job to generate chapters for asset `ASSET_ID`
- Analyze this public video URL with Mux Robots (summarize / chapters)

The agent should prefer Mux MCP tools (`search_docs`, then `execute` with TypeScript against `@mux/ts`). Do not shell out to `mux` CLI unless the user asks.

## Safety

Destructive operations are **not** specially gated by the MCP server. Capability equals the authorized environment + token permissions. Use a read-only access token when exploring. Confirm deletes, asset removal, and live-stream teardown with the user.

## Submit to Cursor Marketplace

When ready to publish under the muxinc org:

1. Push this repo to `https://github.com/muxinc/cursor-plugin` (or your chosen name).
2. Open [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).
3. Submit the marketplace repo; `plugins/mux` is the package Cursor loads (see `.cursor-plugin/marketplace.json`).
4. After approval, install from the Marketplace and verify OAuth Connect.

## Upstream skills ([muxinc/skills](https://github.com/muxinc/skills))

This plugin vendors selected skills from the official Mux skills repo and keeps Cursor-specific skills locally.

| Skill folder | Origin | Notes |
| --- | --- | --- |
| `mux-docs` | **Upstream** (`muxinc/skills` → `skills/mux-docs`) | Upstream frontmatter `name` is `mux-video`; vendored as folder + `name: mux-docs` so it does not collide with our `mux-video` skill |
| `mux` | Plugin-only | Bootstrap / routing |
| `mux-video` | Plugin-only | Video API via MCP Code Mode |
| `mux-live` | Plugin-only | Live streams |
| `mux-data` | Plugin-only | Mux Data |
| `mux-analyze-any-video` | Plugin-only | Robots on any source |
| `mux-robots` | Plugin-only | Robots on an existing asset |
| `mux-robots-directives` | Plugin-only | Directives pipelines |

### Sync upstream

From the repo root:

```bash
./scripts/sync-upstream-skills.sh
```

The script sparse-clones (or curls) `muxinc/skills` `skills/*` into `plugins/mux/skills/`, remaps `mux-docs` frontmatter `name` to `mux-docs`, and **never overwrites** the plugin-only folders listed above. Optional: `UPSTREAM_REF=main` / `UPSTREAM_REPO=...`.

After syncing, re-copy the plugin folder into `~/.cursor/plugins/local/mux` for local testing (see Install).

## Repo layout


```text
.cursor-plugin/marketplace.json   # marketplace owner + plugin list
scripts/sync-upstream-skills.sh   # pull muxinc/skills → plugins/mux/skills
plugins/mux/                      # package Cursor loads
  .cursor-plugin/plugin.json
  mcp.json
  assets/logo.svg
  skills/
    mux-docs/SKILL.md             # upstream (vendored; name remapped)
    mux/, mux-video/, …           # plugin-only
  README.md
LICENSE
README.md
```

## License

MIT. See [LICENSE](LICENSE).
