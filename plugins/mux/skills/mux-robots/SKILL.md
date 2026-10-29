---
name: mux-robots
description: >
  Mux Robots (GA, v1 API) AI workflows on an existing Mux Video asset. Use for
  analyze structure (title, summary, tags, chapters, scenes, key moments),
  summarize, chapters, contextual text (social / blog / newsletter copy),
  moderate, premium captions, edit captions, translate captions or audio, key
  moments, thumbnails, engagement insights, and ask-questions. For multi-step
  Directives pipelines → mux-robots-directives. Triggers: "robots", "summarize
  this asset", "generate chapters", "find scenes", "moderate video", "premium
  captions", "key moments", "social post from video".
---

# Mux Robots

AI jobs on **Mux Video assets** through the **Robots v1 (GA) API** (`/robots/v1`). Prefer Mux MCP **`execute`** (`@mux/ts`); call **`search_docs`** when unsure of params or output shapes. Prefer MCP over `mux` CLI unless the user asks for CLI.

In `@mux/ts` 16+, `client.robots` calls v1. `client.robotsV0` is the deprecated Beta: use it only to read or cancel jobs that were created on v0. Never create new v0 jobs, and never submit the same job to both versions (it runs and bills twice).

## Prerequisites

- **Asset ID required.** Playback ID → resolve to asset first. URL / local / non-Mux source → `mux-analyze-any-video` (ingest, then Robots).
- Asset must be `ready`, not live, with a **public or signed** playback ID (DRM-only is not supported).
- Caption-based workflows need a **ready caption track** (track readiness is separate from asset readiness). v1 has no English preference: it uses the first ready caption track unless you pass `language_code`, which matches exactly (`en` ≠ `en-US`).
- Token needs **Mux Robots** permissions (`robots:read` to read, `robots:write` to create/cancel) in the asset's environment. If the org has not enabled Robots, an admin must complete the enablement step linked in the API error. On permission/enablement errors, explain and stop — no workarounds.
- Creating jobs is a **write** billed in Mux AI units. **Confirm** before create.

## Workflows

All create calls take `{ parameters: { asset_id, ... } }`. Most accept `output_steering` (style, audience, vocabulary, time scope). `search_docs` for exact params.

| Goal | SDK (`client.robots.jobs.*`) |
| --- | --- |
| Title, summary, tags, chapters, **scenes**, key moments in one call | `analyzeStructure` |
| Summarize (title / description / tags) | `summarize` |
| Chapters | `generateChapters` |
| Social posts, blog post, newsletter copy | `generateContextualText` |
| Ask questions / classify | `askQuestions` |
| Key moments / highlight clips | `findKeyMoments` |
| Best thumbnails | `findBestThumbnails` |
| Engagement insights (from Mux Data) | `generateEngagementInsights` |
| Moderate | `moderate` |
| Premium captions | `generatePremiumCaptions` |
| Edit captions (find/replace, censor) | `editCaptions` |
| Translate captions / dub audio | `translateCaptions` / `translateAudio` |

`find-scenes` does not exist in v1 — use `analyzeStructure` and read `outputs.scenes`.

### v1 field names (Beta names fail or are ignored)

- Translation target: `output_language_code` (not `to_language_code`).
- Key moments: `target_duration: { min, max }` in **seconds** (not `target_duration_ms`); `use_shots: true` for visual selection.
- Steering: `output_steering` (Beta `prompt_overrides` is gone).
- Caption replacement: `replace_existing_tracks` (premium captions: `"replace_all"` / `"fail"`; edit captions: `"replace"` / `"fail"` + full `track_name`).
- Outputs use seconds: `time`, `start_time`, `end_time`; tracks are `track_id` / `replaced_track_ids`; `detected_language_code`.
- Errors: read `error.messages[]`. `409` = asset/track not ready or a duplicate active job; `404` = wrong id, environment, or API version.

### Run + poll

1. Create job → note `id`, `workflow`, and initial `status`.
2. Poll the same workflow's `.retrieve(jobId)` with bounded backoff until `completed`, `errored`, or `cancelled` (`pending` / `processing` meanwhile).
3. Report `outputs` (or `errors`). If the job writes to the asset (captions, chapters, metadata), also check `asset_updates` — a job can complete while an asset update `failed`.
4. Jobs are deleted after 30 days.

Other job calls: `client.robots.jobs.list({ workflow, status, asset_id })`, `client.robots.jobs.cancel(jobId)` (pending/processing only). Production apps should use webhooks: `robots.v1.job.<workflow>.<status>` with underscores (e.g. `robots.v1.job.ask_questions.completed`).

```typescript
async function run(client) {
  const job = await client.robots.jobs.analyzeStructure.create({
    parameters: { asset_id: 'ASSET_ID' },
  });
  return { id: job.id, status: job.status };
}
```

## Directives

Multi-workflow / auto-run pipelines (captions→translate, attach on ingest) → **`mux-robots-directives`**.

## Out of scope

- Directive composition / pipelines → `mux-robots-directives`
- Non-Mux URL / local file ingest → `mux-analyze-any-video`
- Asset / upload / playback management without Robots → `mux-video`
- Live ingest → `mux-live`
- QoE / view analytics (Mux Data) → `mux-data`
