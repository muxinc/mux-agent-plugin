---
name: mux-live
description: >
  Mux Live Streams. Use when the user wants to create or manage live streams,
  stream keys, RTMP ingest, reconnect windows, simulcast targets, live
  playback IDs, or recording a live stream to a Mux asset. Triggers: "go
  live", "create live stream", "stream key", "simulcast", "live playback".
---

# Mux Live Streams

Use this skill for live video ingest and playback.

1. Confirm the Mux MCP server `mux` is connected.
2. Call **`search_docs`** for live streams, simulcast, reconnect, or related APIs.
3. Call **`execute`** with TypeScript against `@mux/ts`.
4. Prefer MCP over shelling to `mux` CLI unless the user asks.

## Common tasks

| Task | Approach |
| --- | --- |
| Create live stream | SDK create; return stream key + playback IDs; remind user to store the key securely |
| List / status | List live streams; report status, reconnect window, active asset |
| Playback | Share live playback ID / URL patterns from docs |
| Simulcast | Add/update simulcast targets per docs |
| Reconnect | Explain or configure reconnect windows from docs |
| Record to asset | Enable or inspect recorded asset linkage after the stream |

## Safety

- Stream keys are secrets — show them when creating (user needs them for OBS/ffmpeg) but do not log them into casual summaries later.
- Disabling or deleting live streams is destructive — confirm with the user.
- Prefer read-only tokens when only inspecting status.

## Out of scope

- VOD assets / direct uploads → `mux-video`
- Post-stream analytics → `mux-data`
