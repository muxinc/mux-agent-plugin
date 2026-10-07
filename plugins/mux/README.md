# Mux

Official Mux plugin for Cursor: **MCP connector** plus **skills** for Video, Live Streams, Mux Data, and Robots.

Install from the [Cursor Marketplace](https://cursor.com/marketplace) (when published) and follow [Using the Mux MCP Server](https://www.mux.com/docs/integrations/mcp-server). This folder is the package Cursor loads. Source: [muxinc/cursor-plugin](https://github.com/muxinc/cursor-plugin).

## Connect

**Settings → Tools & MCP** and connect `mux`. Complete OAuth at dashboard.mux.com and pick an environment. The connector URL is `https://mcp.mux.com`.

Do not paste a personal MCP URL. Do not add a second Mux MCP server. Do not put Access Token ID/Secret in this plugin — OAuth is the marketplace path.

For non-OAuth clients, use Basic `TOKEN_ID:TOKEN_SECRET` against the hosted URL, or a local `@mux/mcp` with `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`. Prefer a read-only token when exploring.

## Skills

| Skill | Use for |
| --- | --- |
| `mux` | Bootstrap, Code Mode (`search_docs` + `execute`), auth, safety, routing |
| `mux-video` | Assets, direct uploads, playback IDs, tracks, signing keys, delivery usage, DRM |
| `mux-live` | Live streams, stream keys, simulcast, reconnect windows, recording |
| `mux-data` | Metrics, dimensions, filters, video views, real-time, exports, errors |

## How the MCP works

The remote server exposes two tools:

1. **`search_docs`** — query Mux API / SDK documentation.
2. **`execute`** — run TypeScript against the full `@mux/ts` SDK in an isolated sandbox (Code Mode).

Prefer these over shelling to the [Mux CLI](https://github.com/muxinc/cli) unless the user asks for CLI.

## License

MIT. See the repository [LICENSE](../../LICENSE).
