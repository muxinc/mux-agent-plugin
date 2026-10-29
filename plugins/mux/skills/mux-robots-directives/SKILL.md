---
name: mux-robots-directives
description: >
  Compose Mux Robots Directives (GA, v1 API) into multi-workflow analysis
  pipelines. Use when stitching captions→translate, shots-based analysis,
  resources and bindings, attaching directives on asset create or direct
  upload, migrating Beta (v0) directives, or choosing one directive vs several.
  Triggers: "directive pipeline", "auto-run robots", "captions then translate",
  "attach directive", "robots on ingest".
---

# Mux Robots Directives (pipelines)

Reusable pipelines on the **Robots v1 (GA) API**: one Directive = **resources** (tracks / shots the engine must have) + **bindings** (Robots workflows to run), dispatched when an attached asset is ready or when you trigger a run. Prefer MCP **`search_docs`** + **`execute`** (`@mux/ts` 16+, `client.robots.directives`). One-off single jobs → `mux-robots`. Non-Mux sources → `mux-analyze-any-video` first.

**Confirm** before `directives.create`, attach-on-ingest, or `runs.create` (writes; bill Mux AI units). Needs Robots permissions (`robots:write`) on the token's environment.

## One directive vs several

| Prefer | When |
| --- | --- |
| **One** directive | Same ordered pipeline every time (e.g. captions → translate → chapters) |
| **Several** | Independent product lines, optional branches, or different attach sets per ingest path |
| **Jobs only** (`mux-robots`) | One-shot analysis on an existing asset; no reuse |

List existing (`client.robots.directives.list`) before creating duplicates. List returns **summaries** (v0 and v1); `retrieve` a v1 directive for its full config.

## Composition (v1 shape)

```text
{ name, subject: { type: 'video.asset' }, resources: [...], bindings: [...] }
```

- **Binding:** `reference_id` (unique), `workflow` (e.g. `generate-premium-captions`), `parameters`, optional `inputs`.
- **`inputs` lists resource `reference_id`s** declared in the same Directive — not other bindings. To chain bindings, declare a resource produced by the upstream binding (`source.via: 'workflow'`) and list that resource in the downstream binding's `inputs`.
- Do not put `asset_id` or a source `track_id` in binding `parameters` — the Directive supplies them.
- **Resource:** `reference_id`, `type`, `source`.
  - `video.asset.track` — `kind: 'subtitles' | 'audio'`, optional `language_code` (BCP 47).
  - `video.asset.shots` — no selector; one per asset.

Resource `source.via` (defaults to `external`):

| `via` | Meaning |
| --- | --- |
| `external` | Wait for the resource to appear on the asset (24-hour cap) |
| `required` | Must already be ready when the run starts, or dependent bindings fail |
| `workflow` | Produced by binding `source.binding: '<reference_id>'` |
| `mux_api` | Engine calls Mux Video: `action` = `generate_subtitles`, `create_track`, or `generate_shots`, optional `parameters` |

### Pattern: captions → translate

```typescript
async function run(client) {
  return client.robots.directives.create({
    name: 'Captions then Spanish',
    subject: { type: 'video.asset' },
    resources: [
      {
        reference_id: 'captions_en',
        type: 'video.asset.track',
        kind: 'subtitles',
        language_code: 'en',
        source: { via: 'workflow', binding: 'premium_captions' },
      },
    ],
    bindings: [
      {
        reference_id: 'premium_captions',
        workflow: 'generate-premium-captions',
        parameters: { language_code: 'en' },
      },
      {
        reference_id: 'translate_es',
        workflow: 'translate-captions',
        inputs: ['captions_en'],
        parameters: { output_language_code: 'es' },
      },
    ],
  });
}
```

Auto captions instead of premium: make `captions_en` `source: { via: 'mux_api', action: 'generate_subtitles', parameters: { language_code: 'en', source_audio_language_code: 'en-US' } }` and drop the premium binding.

### Pattern: shots / visual analysis

Bindings for `find-key-moments` and `generate-contextual-text` take `parameters.use_shots: true`, which generates or reuses Mux shots on its own. To make a binding wait until shots are ready before it dispatches, declare `{ reference_id: 'shots', type: 'video.asset.shots', source: { via: 'mux_api', action: 'generate_shots' } }` and list `'shots'` in its `inputs`. Scenes come from `analyze-structure` (`find-scenes` is not in v1). `search_docs` for exact binding parameters.

## Attach on ingest

Pass directive IDs so the pipeline auto-runs when the asset is ready:

```typescript
async function run(client) {
  return client.video.assets.create({
    inputs: [{ url: 'https://example.com/video.mp4' }],
    playback_policies: ['public'],
    directives: [{ id: 'DIRECTIVE_ID' }],
  });
}
```

Direct uploads: `client.video.uploads.create({ new_asset_settings: { ..., directives: [{ id }] } })`. Attaching the same directive to the same asset twice starts one run. Creating the asset is a separate write; confirm storage/encoding cost too.

## Directives are immutable

There is no update endpoint. To change a pipeline, create a new directive, switch ingest to the new id, and optionally `client.robots.directives.delete(id)` the old one (soft delete; in-flight runs finish).

## Beta (v0) directives

v0 directives keep working until v0 retires (six months after GA) but are **not** migrated. Recreate them in v1: `workflows` → `bindings`, `params` → `parameters`, `source.params` → `source.parameters`, `kind: 'caption'` → `'subtitles'`, `language` → `language_code`, `request_shots` → `generate_shots`, `to_language_code` → `output_language_code`, `find-scenes` → `analyze-structure`. Detail/run/delete routes need the version that created the directive (`404` otherwise; follow `_links.self.href`). Never attach both the old and new id — both run and bill.

## Idempotency

1. `directives.list` / `retrieve` by known id — reuse instead of recreate.
2. Stable human `name`s; store returned ids in app config.
3. Re-attach the **same** directive ids on every ingest; do not mint a new directive per upload.
4. Manual run on an existing asset: `client.robots.directives.runs.create(directiveId, { asset_id })` — `409` if a run for that directive + asset is already active; may re-bill, so confirm.

## Run status

Poll `client.robots.directives.runs.retrieve(directiveId, runId)` (or `runs.list(directiveId)`). Run fields: `id`, `directive_id`, `subject_id`, `status`, `node_states`, `started_at`, `completed_at`. Statuses: `pending` / `dispatching` / `running` / `waiting` / `completed` / `partial` / `errored`. Node states: `dispatched` (`workflow`, `job_id` → read with `mux-robots`), `failed` (`reason`), `waiting_for_resources`, `waiting_for_source_bindings` (`source_bindings`). Fix missing tracks/shots or `inputs` links — do not invent APIs. Webhooks: `robots.v1.directive_run.<status>`. Runs are kept 30 days after finishing.

## Out of scope

- Single Robots job create/poll → `mux-robots`
- Ingest URL/local file → `mux-analyze-any-video`
- Asset CRUD without Robots → `mux-video`
