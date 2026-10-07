# Mux for Muse Code (experimental)

Thin Muse-native pack of **Mux**. **Agent Bundle has no Muse target**, so this
pack lives beside `plugins/mux` and shares the same skill markdown via symlink
(`packs/muse/skills` → `plugins/mux/skills`).

> Muse Code plugins are **beta / experimental**. The wire contract may change.
> Prefer the settings-file MCP fallback below if experimental plugins are off.

## What you get

- Remote MCP: `https://mcp.mux.com` (HTTP / streamable HTTP)
- Skills (same bodies as the Cursor/Agent Bundle Mux plugin): `mux`, `mux-docs`, `mux-video`, `mux-live`,
  `mux-data`, `mux-robots`, `mux-robots-directives`, `mux-analyze-any-video`

## Install (experimental native plugin)

From this directory (`packs/muse`):

```bash
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins install . --scope user
muse plugins approve mux
muse mcp login mux   # if OAuth is required for the remote MCP
```

Or with an absolute path from the repo root:

```bash
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins install "$(pwd)/packs/muse" --scope user
muse plugins approve mux
```

The `MUSE_EXPERIMENTAL_PLUGINS=1` flag gates the management CLI only; once
approved, the plugin can run in ordinary sessions (subject to Muse beta churn).

## Settings-file fallback (experimental plugins off)

If native plugins are unavailable, declare Mux in Muse settings
(`~/.config/muse/settings.json` or the Muse settings file for your install):

```json
{
  "mcp_servers": {
    "mux": {
      "transport": "streamable_http",
      "url": "https://mcp.mux.com",
      "mode": "optional"
    }
  }
}
```

For hosts that only speak stdio MCP (not Muse’s HTTP path), use a Mux Access
Token with Basic auth or a local `@mux/mcp` install — see the root README
“Token / local fallback”. This pack does **not** ship a local Mux MCP binary.

Skills can also be discovered from shared Agent Skills roots; the plugin pack
is the preferred path so skill routing matches other Mux hosts.

## Layout

```text
packs/muse/
  .muse-plugin/plugin.json   # displayName Mux; logo: assets/logo.png
  skills/          → symlink to ../../plugins/mux/skills
  assets/logo.png  → symlink to ../../plugins/mux/assets/logo.png
  README.md
```

Logo parity with Cursor: `assets/logo.png` is a symlink to the same file as
`plugins/mux/assets/logo.png`, and `.muse-plugin/plugin.json` references it via
`"logo": "assets/logo.png"` (ignored if Muse’s schema drops unknown fields).

Do not duplicate skill markdown here. Edit skills under `plugins/mux/skills/`.

## Auth

Prefer OAuth via `muse mcp login mux` (or Muse’s Connect equivalent) against
`https://mcp.mux.com`. Do not paste Access Token secrets into the plugin
manifest.
