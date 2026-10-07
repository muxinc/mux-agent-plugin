---
name: mux-video
description: >
  Mux Video. Use when the user wants assets, direct uploads, playback IDs,
  playback URLs, tracks, captions/subtitles, playback restrictions, signing
  keys, secure playback tokens, delivery usage, DRM configurations, or
  transcription vocabularies. Triggers: "upload a video", "list assets",
  "playback URL", "mux sign", "create upload", "asset status".
---

# Mux Video

Use this skill for on-demand video: assets, uploads, playback, and related Video APIs.

1. Confirm the Mux MCP server `mux` is connected (OAuth environment selected).
2. Call **`search_docs`** for the resource (e.g. assets, uploads, playback IDs, signing keys).
3. Call **`execute`** with TypeScript against `@mux/ts` — do not guess method names.
4. Prefer MCP over `mux` CLI unless the user asks for CLI.

## Common tasks

| Task | Approach |
| --- | --- |
| List / inspect assets | `search_docs` → `execute` listing assets; report status, duration, playback IDs |
| Direct upload | Create upload via SDK; return upload URL and upload id; explain client PUT |
| Playback URL | Resolve playback ID → standard Mux stream/player URL patterns from docs |
| Playback ID lookup | Map playback ID → asset or live stream |
| Tracks / captions | Add or list text tracks; subtitle generation flows from docs |
| Playback restrictions | Create/update restrictions; attach to playback IDs as documented |
| Secure playback | Create signing keys; generate signed tokens via SDK (CLI equivalent: `mux sign`) |
| Delivery usage | Query delivery usage for the environment |
| DRM / vocabularies | Follow docs for DRM configurations and transcription vocabularies |

## Safety

- Creating uploads and assets is a write — confirm intent for production environments.
- Never print signing-key private material unless the user explicitly needs it for their app.
- Deletes / asset removal: confirm with the user first. MCP does not specially gate destructive ops.
- Exploring: prefer a read-only token.

## Out of scope

- Live ingest / stream keys → `mux-live`
- Engagement metrics / views / quality → `mux-data`
- Robots chaptering / summarize jobs → `mux` bootstrap skill + Robots via `execute`
