---
name: mux
description: >
  Mux MCP bootstrap. Use for Mux, mux.com, video infrastructure, @mux/ts,
  mcp.mux.com, Code Mode, search_docs, execute, Robots jobs, signing keys,
  webhooks, whoami, environment auth, and any Mux API task when no more
  specific skill fits. Trigger even when the user does not name MCP or Mux.
---

# Mux

Connect Cursor to Mux through this plugin’s MCP server (`mux` at `https://mcp.mux.com`), then drive the account with **Code Mode**.

## Connect

1. **Settings → Tools & MCP** → connect `mux`.
2. Complete Mux OAuth: log in at dashboard.mux.com and choose an environment.
3. Do not add a second Mux MCP server. Do not paste a personal MCP URL.
4. Do not put Access Token ID/Secret in the plugin. Marketplace path is OAuth.

Token fallback (non-OAuth clients / local `@mux/mcp`): `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET`, or Basic `base64(TOKEN_ID:TOKEN_SECRET)` against the hosted URL. Prefer a **Read-only** token when exploring.

## First calls (Code Mode)

The hosted Mux MCP exposes **two** tools — not one tool per API endpoint:

1. **`search_docs`** — look up Mux API / SDK docs before writing code.
2. **`execute`** — run TypeScript against the full `@mux/ts` SDK in an isolated sandbox. Return values and logs come back as the tool result.

Workflow:

1. Confirm the `mux` MCP server is connected.
2. Call `search_docs` for the resource or method you need.
3. Call `execute` with focused TypeScript using `@mux/ts` (Video, Data, Robots, System).
4. Prefer MCP `execute` over shelling to the [Mux CLI](https://github.com/muxinc/cli) unless the user explicitly asks for CLI commands.

## Routing

| Need | Skill |
| --- | --- |
| Assets, uploads, playback IDs, tracks, signing / secure playback, delivery usage, DRM, vocabularies | `mux-video` |
| Live streams, stream keys, simulcast, reconnect, live → asset | `mux-live` |
| Metrics, dimensions, views, real-time, exports, errors, engagement | `mux-data` |
| Robots jobs / workflows / directives, webhooks verify, whoami, account utils | stay on this skill → `search_docs` + `execute` |

## Capability surface (mirrors CLI areas)

Agents should cover the same ground as Mux CLI via SDK in `execute`:

- Assets, Live Streams, Uploads, Playback ID lookup, Playback Restrictions
- Signing Keys & Secure Playback
- Transcription Vocabularies, Delivery Usage, DRM Configurations
- Robots, Mux Data
- Auth & environment (OAuth environment picker; or token-scoped environment)
- Webhook verify / unwrap (forwarding is a local CLI concern — do not assume MCP can open local ports)

## Safety

- Destructive operations are **not** specially gated. Deletes, asset removal, and live-stream teardown require explicit user confirmation.
- When exploring an unfamiliar account, recommend or assume a read-only access token.
- Do not dump raw secrets, signing private keys, or stream keys unless the user asked for them.
- Do not invent API fields — use `search_docs` first.
