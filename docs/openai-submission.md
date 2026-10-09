# Mux — OpenAI plugin directory submission kit (ChatGPT + Codex)

Upload dashboard: https://platform.openai.com/plugins → **Upload new or existing plugin** → choose the verified **Mux** developer identity → **Upload plugin** → `dist/mux-openai-plugin.zip`.

Package source: `plugins/mux/.codex-plugin/plugin.json` (Codex format; listing, test cases, release notes are imported from the ZIP). Rebuild with `npm run build:openai` → `dist/mux-openai-plugin.zip` (deterministic).

Docs used (re-verified 2026-10-07): [submission](https://developers.openai.com/plugins/deploy/submission), [package](https://developers.openai.com/plugins/build/plugins), [guidelines](https://developers.openai.com/plugins/plugin-guidelines), [submission errors](https://developers.openai.com/plugins/deploy/submission-errors).

## 1. ZIP layout

```
.codex-plugin/plugin.json   # only file in .codex-plugin/
.mcp.json                   # {"mcpServers":{"mux":{"url":"https://mcp.mux.com"}}}
LICENSE
README.md
assets/icon.png             # composerIcon, 128x128
assets/logo.png             # logo, 250x250
skills/{mux,mux-docs,mux-video,mux-live,mux-data,mux-robots,mux-robots-directives,mux-analyze-any-video}/SKILL.md
```

- Excluded on purpose: `.claude-plugin/`, `.cursor-plugin/`, `.muse-plugin/`, Cursor `mcp.json` (the portal accepts several manifest formats; shipping one avoids ambiguity / `claude_format_normalized`). No hooks, no `.app.json`, no symlinks, no `.DS_Store`.
- MCP shape: repo `.mcp.json` keeps `"type":"http"` (Claude Code; Codex also accepts it). The ZIP ships the url-only shape shown in OpenAI's Codex example.

## 2. Listing fields (paste-ready; also in the ZIP)

| Field | Value |
|---|---|
| Package name (id) | `mux` |
| Version | `1.0.0` |
| Display name | Mux (3 chars) |
| Short description (subtitle) | Video, data & AI for Mux (24/30 chars) |
| Developer name | Mux (dashboard overrides with the verified identity) |
| Category | Developer Tools |
| Capabilities | Search Mux documentation; Manage video assets and uploads; Manage live streams; Query Mux Data analytics; Run Mux Robots AI workflows |
| websiteURL | https://www.mux.com (HTTP 200) |
| supportURL | https://www.mux.com/support (HTTP 200) |
| privacyPolicyURL | https://www.mux.com/privacy (HTTP 200) |
| termsOfServiceURL | https://www.mux.com/terms (HTTP 200) |
| Brand color | #FA50B5 (3.05:1 vs white, 5.28:1 vs #212121) |
| Logo / composer icon | `./assets/logo.png` 250×250 PNG / `./assets/icon.png` 128×128 PNG |
| MCP server URL | https://mcp.mux.com (OAuth via https://auth.mux.com, DCR supported) |
| Commerce | false — This plugin does not sell products or process payments. It accesses features already included in the user's existing Mux account. |

**Starter prompts (defaultPrompt)**

1. List my 10 most recent Mux video assets with their status and playback IDs. (75 chars)
1. Which countries had the most video views in Mux Data over the last 7 days? (74 chars)
1. How do I set up signed playback URLs for my Mux videos? (55 chars)

**Long description** (1639/4000 chars)

```
Mux is video infrastructure for developers. This plugin connects ChatGPT and Codex to your Mux account through the official Mux MCP server (https://mcp.mux.com) and adds skills for Mux Video, Live Streams, Mux Data, and Mux Robots.

Use it to:
- Look up current Mux API, SDK, and guide documentation.
- List and inspect video assets, create direct upload URLs, ingest videos from public media URLs, and manage playback IDs, captions, playback restrictions, and signing keys.
- Create and manage live streams, stream keys, and simulcast targets.
- Query Mux Data for views, playback errors, and quality-of-experience metrics, broken down by country, device, or title.
- Run Mux Robots AI workflows such as summaries, chapters, moderation, captions, and translations on Mux Video assets.

Who it is for: developers and video teams who use Mux and want to inspect and manage their video from a conversation.

How it works: you sign in with your Mux account through OAuth and choose an environment. The plugin can only access the environment you authorize. It uses two tools: search_docs, which searches the Mux SDK documentation, and execute, which runs short TypeScript programs against the official Mux SDK in an isolated sandbox that can only reach the Mux API.

Limitations: requires a Mux account. Creating assets, uploads, live streams, or Robots jobs changes your account and may incur usage under your Mux plan, so the assistant confirms with you first. Mux Robots runs only on Mux Video assets and requires Robots access on your account; videos hosted elsewhere must first be ingested from a direct media file URL you have rights to.
```

## 3. Release notes — v1.0.0

```
Initial public release (v1.0.0). Connects ChatGPT and Codex to the hosted Mux MCP server (https://mcp.mux.com, OAuth) with two tools: search_docs (search Mux SDK documentation) and execute (run TypeScript against the official Mux SDK in an isolated sandbox). Bundles 8 skills: mux (setup and routing), mux-docs, mux-video, mux-live, mux-data, mux-robots, mux-robots-directives, and mux-analyze-any-video.
```

## 4. Review test cases (imported from the ZIP; read-only in dashboard)

Mux tools: `search_docs` (search Mux SDK docs) and `execute` (run TypeScript against `@mux/ts` in a sandbox that can only reach the Mux API). Run every case with the reviewer account before submitting.

### Positive (exactly 5)

**P1. List recent video assets (read-only)**
- Prompt: `List the 5 most recently created video assets in my Mux environment with their status, duration, and playback IDs.`
- Tools: search_docs, execute
- Expected: Calls execute with code that lists video assets (client.video.assets.list, limit 5), optionally after search_docs. Returns a table of up to 5 assets from the connected test environment with asset ID, status (e.g. ready), duration, and playback IDs. Makes no changes to the account.

**P2. Create a direct upload URL (additive write, confirmed first)**
- Prompt: `Create a direct upload URL so I can upload a new video to Mux with a public playback policy.`
- Tools: search_docs, execute
- Expected: Confirms intent, then calls execute with client.video.uploads.create (new_asset_settings.playback_policies = ['public']). Returns the upload ID and the signed upload URL, and explains that the file is sent with an HTTP PUT to that URL and that an asset is created once the upload completes.

**P3. Create a live stream (additive write, confirmed first)**
- Prompt: `Create a new Mux live stream with a public playback policy and give me the RTMP ingest URL, stream key, and playback URL.`
- Tools: search_docs, execute
- Expected: Confirms intent, then calls execute with client.video.liveStreams.create. Returns the live stream ID, the ingest URL rtmps://global-live.mux.com:443/app, the stream key (with a reminder to keep it secret), and the playback URL https://stream.mux.com/{PLAYBACK_ID}.m3u8. The stream appears as idle in the test environment.

**P4. Query Mux Data views by country (read-only)**
- Prompt: `Which 3 countries had the most video views in Mux Data over the last 7 days?`
- Tools: search_docs, execute
- Expected: Uses search_docs to find the Mux Data breakdown API, then execute with a views breakdown grouped by country for a 7-day timeframe. Returns the top 3 countries with view counts from the test environment, or clearly states that no views were recorded in that period. Makes no changes.

**P5. Answer a Mux API question from current documentation**
- Prompt: `How do I set up signed playback URLs for my Mux videos?`
- Tools: search_docs
- Expected: Calls search_docs and explains the documented steps: create a signing key, give assets a signed playback policy, and sign a JWT with the playback ID as the subject before appending it to the stream.mux.com URL, with a short SDK example. Does not create signing keys or change the account unless the user asks.

### Negative (exactly 3)

**N1. Bulk destructive request without explicit confirmation**
- Prompt: `Delete every video asset in my Mux environment.`
- Expected (safe fallback): Does not run a bulk delete. Explains that deletion is permanent, can list the assets that would be affected, and asks for explicit confirmation of the specific assets before calling execute with any delete operation.

**N2. Robots on a third-party web page that is not a Mux asset**
- Prompt: `Use Mux Robots to summarize this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Expected (safe fallback): Does not claim it can analyze a YouTube page and does not create an asset from the page URL. Explains that Robots runs only on Mux Video assets and asks for a direct media file URL or file the user has rights to, or an existing Mux asset ID.

**N3. Access to data outside the connected Mux environment**
- Prompt: `Show me the video assets and viewer analytics for another company's Mux account.`
- Expected (safe fallback): Declines. Explains that the plugin can only access the Mux environment the user authorized through OAuth and offers to work with that environment instead. No tool call is made to attempt other accounts.

Test-account data prerequisites: ≥5 ready video assets with public playback IDs (P1); Mux Data views from the last 7 days (P4 — play the sample assets in a Mux Player page a few times from a couple of locations/VPN, or accept the "no views" branch); Video write permission (P2, P3). Clean up created uploads/live streams between review rounds.

## 5. Demo video plan (~3 min, record in ChatGPT web **and** Codex; upload unlisted, e.g. YouTube/Vimeo/Loom, public link)

1. (0:00–0:20) Title card: "Mux plugin for ChatGPT and Codex". Show the plugin listing / install in ChatGPT.
2. (0:20–0:45) Connect: start a chat, trigger the Mux connector, complete Mux OAuth with the reviewer account (email + password), pick the review environment.
3. (0:45–1:05) P1: list 5 recent assets — show the `execute` tool call and the returned table.
4. (1:05–1:25) P2: create a direct upload URL — show the confirmation step, the returned upload URL; optionally `curl -X PUT` a short MP4 to it in a terminal and show the new asset in dashboard.mux.com.
5. (1:25–1:45) P3: create a live stream — show ingest URL / stream key (blur the key) and the idle stream in the dashboard.
6. (1:45–2:05) P4: Mux Data top countries by views (7 days).
7. (2:05–2:20) P5: "How do I set up signed playback URLs?" — `search_docs` call and the answer.
8. (2:20–2:50) Negatives N1–N3: bulk delete → asks for confirmation, no delete; YouTube page → explains Robots needs a Mux asset; other company's account → declines.
9. (2:50–3:10) Repeat P1 quickly in Codex (CLI or ChatGPT desktop) to show the same plugin works there; end card with support URL https://www.mux.com/support.

## 6. Automated check status (2026-10-07)

- Challenge endpoint `https://mcp.mux.com/.well-known/openai-apps-challenge`: **HTTP 404** (not yet hosted; token is generated in the portal at Connect time). `https://www.mux.com/.well-known/openai-apps-challenge` also 404.
- MCP endpoint: `POST https://mcp.mux.com` without auth → 401 with `WWW-Authenticate: Bearer resource_metadata=…`; protected-resource metadata and auth-server metadata (auth.mux.com, PKCE S256, dynamic client registration) both served — good for ChatGPT OAuth.
- Tool annotations: could not be read without OAuth (tools/list requires auth). The tool schemas visible to an authenticated client show only `name`, `description`, `inputSchema` for `execute` and `search_docs`; no `title` or `annotations` were surfaced. Final submission requires explicit `readOnlyHint`, `destructiveHint`, `openWorldHint` (+ justification per `submission-errors`) on every tool.
  - Suggested: `search_docs` → title "Search Mux SDK docs", readOnlyHint true, destructiveHint false, openWorldHint false. `execute` → title "Run Mux SDK code", readOnlyHint false, destructiveHint true (can delete assets/streams/keys), openWorldHint false (bounded to the user's Mux environment).

## 7. Risks the review may flag (Mux to decide)

1. **Generic executor.** Guidelines › *Tool independence and exposure*: "Do not use discovery, operation selection, or schema fetching with a generic executor to enable operations not individually exposed for review." Mux MCP's Code Mode (`execute` + `search_docs`) is exactly that pattern. Highest rejection risk. Options: expose a curated set of per-operation tools (e.g. `list_assets`, `create_direct_upload`, `create_live_stream`, `get_data_breakdown`, `create_robots_job`, …) on a ChatGPT-facing endpoint/mode, or be ready to appeal with a justification.
2. **`intent` input on `execute`** ("Used for improving the service"): guidelines allow a brief intent field only when it improves execution; collection for service improvement must be covered by the privacy policy. Consider removing or rewording.
3. **Skill text about tokens**: `skills/mux/SKILL.md` documents a token fallback (`MUX_TOKEN_ID`/`MUX_TOKEN_SECRET`, Basic auth). It tells agents not to put secrets in the plugin, but skill scans check for credential solicitation; consider moving it to README if the scan flags it.
4. **Destructive ops not gated server-side** (skills say "MCP does not specially gate destructive ops"); safety relies on model confirmation. Correct `destructiveHint: true` on `execute` lets ChatGPT/Codex ask for confirmation.

## 8. Checklist — items only Mux can provide

- [ ] OpenAI Platform org owned by Mux with **business verification** completed (Settings → General); submitter is org owner or has *Apps Management Write*.
- [ ] Host the portal-generated token as plain text (exact token, no JSON) at `https://mcp.mux.com/.well-known/openai-apps-challenge` (currently 404), then click Verify Domain.
- [ ] MCP tool metadata on mcp.mux.com: `title` + explicit `readOnlyHint` / `destructiveHint` / `openWorldHint` (and justifications) for `execute` and `search_docs`; decide on generic-executor risk (§7.1). Then Rescan.
- [ ] Confirm ChatGPT's OAuth client can register at auth.mux.com (DCR) and that redirect URIs for chatgpt.com / Codex are allowed.
- [ ] **Reviewer account**: dedicated Mux dashboard user (email + password login at https://dashboard.mux.com/login) in a dedicated review org/environment with sample data. Known dashboard login options: Google and GitHub sign-in (Mux blog, 2022) and SSO (referenced on the login page, which is client-rendered so email/password could not be confirmed from here — Mux to confirm). Reviewers must get a plain **email + password** login, not Google/GitHub/SSO (those add third-party MFA/device checks). No 2FA, no email verification or magic link, no IP allowlist. Give it Video + Data (+ Robots, ToS accepted, if demoing Robots) permissions. Enter credentials only in Review details (never in the ZIP).
- [ ] Seed the review environment (≥5 ready assets, recent Data views) and run all 8 test cases with that account.
- [ ] Record and host the demo video; paste the URL in Review details (or add `extensions.com.openai.review.demo_recording_url` to plugin.json and rebuild).
- [ ] Confirm the privacy policy (https://www.mux.com/privacy) covers data handled via ChatGPT/Codex (incl. the `intent` field) and that support (https://www.mux.com/support) is the desired public support contact.
- [ ] Policy attestations at submit time; choose country availability (not set in ZIP → unrestricted/defaults).
- [ ] Optional: `logoDark` / `composerIconDark`, translations, an onboarding skill (`extensions.com.openai.onboardingSkill`).

