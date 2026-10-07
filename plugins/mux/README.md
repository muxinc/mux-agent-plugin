# Mux

Official **Mux** plugin for Cursor (same MCP and skills used across Grok Bot, Claude Code, Codex, and Muse): **MCP connector** plus **skills** for Video, Live Streams, Mux Data, and Robots.

Install from the [Cursor Marketplace](https://cursor.com/marketplace) (when published) and follow [Using the Mux MCP Server](https://www.mux.com/docs/integrations/mcp-server). This folder is the package Cursor loads. Source: [muxinc/mux-agent-plugin](https://github.com/muxinc/mux-agent-plugin).

## Connect

**Settings → Tools & MCP** and connect `mux`. Complete OAuth at dashboard.mux.com and pick an environment. The connector URL is `https://mcp.mux.com`.

Do not paste a personal MCP URL. Do not add a second Mux MCP server. Do not put Access Token ID/Secret in this plugin — OAuth is the marketplace path.

For non-OAuth clients, use Basic `TOKEN_ID:TOKEN_SECRET` against the hosted URL, or a local `@mux/mcp` with `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`. Prefer a read-only token when exploring.

## Skills

| Skill | Origin | Use for |
| --- | --- | --- |
| `mux` | Plugin-only | Bootstrap, Code Mode (`search_docs` + `execute`), auth, safety, routing |
| `mux-docs` | Upstream ([muxinc/skills](https://github.com/muxinc/skills)) | API/docs questions via llms.txt / collection indexes (vendored as `mux-docs`; upstream name was `mux-video`) |
| `mux-video` | Plugin-only | Assets, direct uploads, playback IDs, tracks, signing keys, delivery usage, DRM |
| `mux-robots` | Plugin-only | Robots jobs on an existing Mux asset (summarize, chapters, captions, …) |
| `mux-robots-directives` | Plugin-only | Compose Directives pipelines (workflows, resources, attach on ingest) |
| `mux-analyze-any-video` | Plugin-only | Robots on any source: ingest URL/local file into Mux when needed, then analyze |
| `mux-live` | Plugin-only | Live streams, stream keys, simulcast, reconnect windows, recording |
| `mux-data` | Plugin-only | Metrics, dimensions, filters, video views, real-time, exports, errors |

Refresh upstream skills from the repo root with `./scripts/sync-upstream-skills.sh` (skips plugin-only folders).

## How the MCP works

The remote server exposes two tools:

1. **`search_docs`** — query Mux API / SDK documentation.
2. **`execute`** — run TypeScript against the full `@mux/ts` SDK in an isolated sandbox (Code Mode).

Prefer these over shelling to the [Mux CLI](https://github.com/muxinc/cli) unless the user asks for CLI.

## License

MIT. See the repository [LICENSE](../../LICENSE).
