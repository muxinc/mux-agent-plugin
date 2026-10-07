---
name: mux-robots-directives
description: >
  Compose Mux Robots Directives into multi-workflow analysis pipelines.
  Use when stitching captions→translate, shots→scenes/key-moments, resources,
  workflow inputs/dependencies, attaching directives on asset create, or choosing
  one directive vs several. Triggers: "directive pipeline", "auto-run robots",
  "captions then translate", "attach directive", "robots on ingest".
---

# Mux Robots Directives (pipelines)

Reusable pipelines: one Directive = named workflows (+ optional resources) that run when an asset is ready or when you trigger a run. Prefer MCP **`search_docs`** + **`execute`** (`@mux/ts`). One-off single jobs → `mux-robots`. Non-Mux sources → `mux-analyze-any-video` first.

**Confirm** before `directives.create`, attach-on-ingest, or `runs.create` (writes; may bill units). Needs Robots permissions + ToS.

## One directive vs several

| Prefer | When |
| --- | --- |
| **One** directive | Same ordered pipeline every time (e.g. captions → translate → chapters) |
| **Several** | Independent product lines, optional branches, or different attach sets per ingest path |
| **Jobs only** (`mux-robots`) | One-shot analysis on an existing asset; no reuse |

List existing (`client.robots.directives.list`) before creating duplicates.

## Composition

Each workflow needs a unique `reference_id`. Chain with `inputs: ['other_ref']` so a step waits on prior workflow(s). Declare **resources** the engine must ensure first (caption/audio tracks, shots).

Resource `source.via` (approx.):

| `via` | Meaning |
| --- | --- |
| `required` | Must already exist on the asset |
| `external` | Provided outside the directive |
| `workflow` | Produced by a workflow `binding` (reference_id) |
| `mux_api` | Engine calls Mux (`generate_subtitles`, `request_shots`, `create_track`, …) |

### Pattern: captions → translate

```typescript
async function run(client) {
  return client.robots.directives.create({
    name: 'Captions then Spanish',
    subject: { type: 'video.asset' },
    workflows: [
      { reference_id: 'premium_captions', workflow: 'generate-premium-captions' },
      {
        reference_id: 'translate_es',
        workflow: 'translate-captions',
        inputs: ['premium_captions'],
        params: { to_language_code: 'es' },
      },
    ],
  });
}
```

### Pattern: shots → scenes / visual key-moments

Declare a shots resource (`type: 'video.asset.shots'`, often `source: { via: 'mux_api', action: 'request_shots' }`) and workflows that need visuals (`find-scenes`, `find-key-moments` with shots). Always `search_docs` for exact resource + `inputs` shapes.

## Attach on asset create

Pass directive IDs at ingest so the pipeline auto-runs when the asset is ready:

```typescript
async function run(client) {
  return client.video.assets.create({
    inputs: [{ url: 'https://example.com/video.mp4' }],
    playback_policies: ['public'],
    directives: [{ id: 'DIRECTIVE_ID' }],
  });
}
```

Uploads: same idea under `new_asset_settings.directives` when supported — confirm via `search_docs`. Creating the asset is a separate write; confirm storage/encoding cost too.

## Idempotency

1. `directives.list` / retrieve by known id — reuse instead of recreate.
2. Stable human `name`s; store returned ids in app config.
3. Re-attach the **same** directive ids on every ingest; do not mint a new directive per upload.
4. Manual re-run: `client.robots.directives.runs.create(directiveId, { asset_id })` — may re-bill; confirm.

## Run status

Poll `client.robots.directives.runs.retrieve(directiveId, runId)` (or list). Statuses include `pending` / `dispatching` / `running` / `waiting` / `completed` / `partial` / `errored`. Node states may show `waiting_for_resources` or `waiting_for_source_workflow` — fix missing tracks/shots or `inputs` links, do not invent APIs.

## Out of scope

- Single Robots job create/poll → `mux-robots`
- Ingest URL/local file → `mux-analyze-any-video`
- Asset CRUD without Robots → `mux-video`
