---
name: mux-robots
description: >
  Mux Robots AI workflows on an existing Mux Video asset. Use for summarize,
  chapters, moderate, premium captions, translate, key moments, scenes,
  thumbnails, engagement insights, and ask-questions. For multi-step Directives
  pipelines → mux-robots-directives. Triggers: "robots", "summarize this asset",
  "generate chapters", "moderate video", "premium captions", "key moments".
---

# Mux Robots

AI jobs on **Mux Video assets**. Prefer Mux MCP **`execute`** (`@mux/ts`); call **`search_docs`** when unsure of method names or params. Prefer MCP over `mux` CLI unless the user asks for CLI.

## Prerequisites

- **Asset ID required.** Playback ID → resolve to asset first. URL / local / non-Mux source → `mux-analyze-any-video` (ingest, then Robots).
- Asset should be `ready` before creating jobs.
- Robots needs **ToS acceptance** and **Robots permissions** on the token/environment. On permission/ToS errors, explain and stop — no workarounds.
- Creating jobs is a **write** (and may bill units). **Confirm** before create.

## Workflows

Always `search_docs` for the exact create/retrieve shape. Typical SDK paths (all take `parameters.asset_id` unless noted):

| Goal | SDK (approx.) |
| --- | --- |
| Summarize (title / description / tags) | `client.robots.jobs.summarize.create` |
| Chapters | `client.robots.jobs.generateChapters.create` |
| Moderate | `client.robots.jobs.moderate.create` |
| Premium captions | `client.robots.jobs.generatePremiumCaptions.create` |
| Translate captions / audio | `client.robots.jobs.translateCaptions.create` / `translateAudio.create` |
| Key moments | `client.robots.jobs.findKeyMoments.create` |
| Scenes | `client.robots.jobs.findScenes.create` |
| Best thumbnails | `client.robots.jobs.findBestThumbnails.create` |
| Engagement insights | `client.robots.jobs.generateEngagementInsights.create` |
| Ask questions | `client.robots.jobs.askQuestions.create` |

### Run + poll

1. Create job → note `id` and initial `status`.
2. Poll matching `.retrieve(jobId)` until `completed`, `errored`, or `cancelled` (`pending` / `processing` meanwhile).
3. Report `outputs` (or `errors`). Jobs expire after ~30 days.

```typescript
async function run(client) {
  const job = await client.robots.jobs.summarize.create({
    parameters: { asset_id: 'ASSET_ID' },
  });
  return job.id;
}
```

## Directives

Multi-workflow / auto-run pipelines (captions→translate, shots→scenes, attach on ingest) → **`mux-robots-directives`**.

## Out of scope

- Directive composition / pipelines → `mux-robots-directives`
- Non-Mux URL / local file ingest → `mux-analyze-any-video`
- Asset / upload / playback management without Robots → `mux-video`
- Live ingest → `mux-live`
- QoE / view analytics (Mux Data) → `mux-data`
