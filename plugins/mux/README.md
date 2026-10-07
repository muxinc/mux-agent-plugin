# Mux

The official **Mux** plugin for AI coding agents. It connects your agent to
your Mux account through the remote [Mux MCP server](https://www.mux.com/docs/integrations/mcp-server)
(`https://mcp.mux.com`, OAuth) and adds skills that teach the agent how to work
with Mux Video, Live Streams, Mux Data, and Mux Robots. Ask in plain language
to list or upload assets, get playback URLs, create live streams, query viewer
analytics, or run Robots workflows such as summaries, chapters, and captions,
and the agent uses the Mux tools on your behalf.

The same package works in Cursor, Claude Code, Codex, and Muse Code. Source:
[muxinc/mux-agent-plugin](https://github.com/muxinc/mux-agent-plugin).

## What's included

**MCP server** — one remote server named `mux` at `https://mcp.mux.com`. It
exposes two tools:

1. `search_docs` — search Mux API and SDK documentation.
2. `execute` — run TypeScript against the `@mux/ts` SDK in an isolated sandbox
   (Code Mode), scoped to the Mux environment you authorize.

**Skills** (in `skills/`):

| Skill | Use for |
| --- | --- |
| `mux` | Bootstrap: Code Mode (`search_docs` + `execute`), auth model, safety, routing to the other skills |
| `mux-docs` | Answering Mux API, SDK, CLI, and webhook questions from current docs (mux.com/llms.txt); vendored from [muxinc/skills](https://github.com/muxinc/skills) |
| `mux-video` | Assets, direct uploads, playback IDs and URLs, tracks and captions, playback restrictions, signing keys, DRM, delivery usage |
| `mux-live` | Live streams, stream keys, RTMP ingest, reconnect windows, simulcast targets, recording to assets |
| `mux-data` | Mux Data metrics, dimensions, filters, video views, real-time monitoring, exports, playback errors |
| `mux-robots` | Robots workflows on an existing Mux asset: summarize, chapters, moderation, premium captions, translation, key moments, scenes, thumbnails, ask-questions |
| `mux-robots-directives` | Composing Robots Directives into multi-step pipelines (for example captions then translate), including attaching them at asset creation |
| `mux-analyze-any-video` | Running Robots on a video that is not yet a Mux asset by ingesting it into Mux first |

## Install

The repository [muxinc/mux-agent-plugin](https://github.com/muxinc/mux-agent-plugin)
is a plugin marketplace for each host below. The marketplace name and plugin
name are both `mux`.

### Cursor

Install **Mux** from the [Cursor Marketplace](https://cursor.com/marketplace).
Then open **Settings → Tools & MCP**, connect `mux`, and complete the OAuth
flow.

### Claude Code

```text
/plugin marketplace add muxinc/mux-agent-plugin
/plugin install mux@mux
```

Run `/mcp` and authenticate the `mux` server if Claude Code doesn't prompt you.

### Codex

```bash
codex plugin marketplace add muxinc/mux-agent-plugin
codex plugin add mux@mux
```

Then sign in to the `mux` MCP server when Codex prompts you (or run
`codex mcp login mux`).

### Muse Code (experimental)

```bash
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins marketplace add mux https://github.com/muxinc/mux-agent-plugin
muse plugins install mux@mux
muse plugins approve mux
```

Run `muse mcp login mux` if the server asks for OAuth.

## Authentication

Connecting runs Mux OAuth: you sign in at dashboard.mux.com and pick the Mux
environment the agent may use. The plugin contains no access tokens. Don't add
a second Mux MCP server or paste a personal MCP URL.

Clients without OAuth support can call the same URL with HTTP Basic auth
(`TOKEN_ID:TOKEN_SECRET` from a Mux Access Token), or run `@mux/mcp` locally
with `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`. Use a read-only token while exploring.

## Safety

The MCP server doesn't add extra confirmation for destructive operations. What
the agent can do equals the permissions of the environment and token you
authorize. Confirm deletes, asset removal, and live stream teardown before
running them.

## Data & privacy

- The plugin connects only to the Mux MCP server at `https://mcp.mux.com`,
  using OAuth against your Mux account.
- When the agent calls a Mux tool, the request (for example asset, upload,
  playback, live stream, Mux Data, or Robots queries, plus the code passed to
  `execute`) is sent to Mux and processed under your Mux account.
- The plugin itself stores nothing else. It has no hooks, telemetry, or local
  scripts; OAuth credentials are held by your agent host.
- Mux handles this data under the [Mux Privacy Policy](https://www.mux.com/privacy)
  and [Terms of Service](https://www.mux.com/terms).

## Support

- Docs: [Using the Mux MCP Server](https://www.mux.com/docs/integrations/mcp-server)
- Help: [mux.com/support](https://www.mux.com/support)
- Issues: [github.com/muxinc/mux-agent-plugin/issues](https://github.com/muxinc/mux-agent-plugin/issues)

## License

MIT. See [LICENSE](LICENSE).
