---
name: mux-analyze-any-video
description: Analyze a video from any source with Mux Robots by ingesting into Mux first when needed. Use when the user wants Robots (summarize, chapters, moderate, captions, etc.) on a URL, local file, or non-Mux video, or asks to analyze a video that is not already a Mux asset.
---

# Analyze any video (Mux Robots)

Robots jobs run on **Mux Video assets only**. Never claim Robots can analyze a raw URL, local path, or third-party page without ingesting into Mux first. Use the Robots v1 (GA) API — `client.robots` in `@mux/ts` 16+ (`client.robotsV0` is the deprecated Beta).

Prefer Mux MCP **`search_docs`** + **`execute`** (`@mux/ts`) over shell `mux` unless the user asks for CLI.

## Source branch

| Source | Action |
| --- | --- |
| Mux asset ID (or playback ID → resolve to asset) | Run Robots on that asset |
| Public HTTPS URL to a media file | Confirm → `video.assets.create` with `inputs: [{ url }]` → poll until `ready` → Robots |
| Local or private file | Confirm → direct upload (`video.uploads.create`) → client PUT → poll upload/asset until ready → Robots |
| Ambiguous (page URL, “this video”, multiple candidates) | Ask which source before creating anything |

### Public URL ingest

```typescript
async function run(client) {
  const asset = await client.video.assets.create({
    inputs: [{ url: 'https://example.com/video.mp4' }],
    playback_policies: ['public'], // or ['signed']; Robots does not support DRM-only assets
  });
  return asset.id;
}
```

Poll `client.video.assets.retrieve(assetId)` until `status === 'ready'` (or `errored`). Then create the Robots job.

### Direct upload (local / private)

1. `client.video.uploads.create({ cors_origin, new_asset_settings: { playback_policies: [...] } })`
2. Return upload URL; user/client PUTs the file
3. Poll upload until `asset_created`; use `asset_id`
4. Poll asset until `ready`; then Robots

## Confirm before create

Creating assets incurs **storage/encoding cost**. Confirm with the user before `assets.create` or `uploads.create`. After analysis, offer optional `video.assets.delete` if they only needed a one-off Robots run.

## Permissions

Robots needs **Mux Robots** permissions on the token (`robots:write` to create jobs, `robots:read` to read them) in the same environment as the asset, and Robots enabled for the org (an admin completes the enablement step linked in the API error). On permission/enablement errors, say so plainly and stop — do not invent workarounds.

## Example Robots workflows

`search_docs` for exact params before coding. Typical jobs (all take `parameters.asset_id`; full list in `mux-robots`):

| Goal | SDK |
| --- | --- |
| Title, summary, tags, chapters, scenes, key moments | `client.robots.jobs.analyzeStructure.create` |
| Summarize | `client.robots.jobs.summarize.create` |
| Chapters | `client.robots.jobs.generateChapters.create` |
| Moderate | `client.robots.jobs.moderate.create` |
| Premium captions | `client.robots.jobs.generatePremiumCaptions.create` |
| Key moments | `client.robots.jobs.findKeyMoments.create` |

Caption-based workflows also need a ready caption track — on a fresh ingest, run premium captions first or enable auto-generated captions on the asset input. Create job → poll the workflow's `.retrieve(jobId)` until `completed` / `errored` / `cancelled` → report outputs.

## Directives (optional)

For auto-run on ingest, attach v1 directive IDs when creating the asset (`directives: [{ id }]`) or upload (`new_asset_settings.directives`), or create/run directives via `client.robots.directives.*` (see `mux-robots-directives`). Use when the user wants workflows every time media lands — not required for one-off analysis.

## Out of scope

- Already-Mux assets with no ingest needed → `mux-robots` (or stay here if already mid-flow)
- Pure asset/upload management without Robots → `mux-video`
- Live ingest → `mux-live`
