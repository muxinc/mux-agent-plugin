---
name: mux-data
description: >
  Mux Data analytics. Use when the user wants video performance metrics,
  dimensions, filters, breakdowns, video views, real-time monitoring, exports,
  quality of experience, engagement by country, or common playback errors.
  Triggers: "mux data", "best performing country", "view count", "video
  errors", "quality metrics", "engagement".
---

# Mux Data

Use this skill for analytics and quality-of-experience insights.

1. Confirm the Mux MCP server `mux` is connected.
2. Call **`search_docs`** for Data metrics, dimensions, filters, views, or exports.
3. Call **`execute`** with TypeScript against `@mux/ts` Data APIs.
4. Prefer MCP over CLI unless the user asks for CLI.

## Common tasks

| Task | Approach |
| --- | --- |
| Top metrics | Query metrics for a timeframe; explain units from docs |
| Breakdowns | Dimension breakdowns (country, browser, ASN, video title, etc.) |
| List dimensions | Discover available dimensions/filters via docs + SDK |
| Video views | List or inspect views; summarize errors and rebuffering |
| Real-time | Use real-time endpoints when the user needs live monitoring |
| Exports | Start or check exports per docs |
| Errors | Common failure codes / messages for the environment |

## Prompt patterns (examples)

- Best performing country for streaming over the last month
- Top videos by view count last week
- Most common video errors
- Breakdown of video quality metrics

## Safety

- Analytics reads are usually safe; still respect environment boundaries.
- Do not export or dump viewer PII-like fields beyond what the user asked for.
- Writes (if any export/config mutations) — confirm first. Destructive ops are not specially gated.

## Out of scope

- Creating assets / uploads → `mux-video`
- Creating live streams → `mux-live`
