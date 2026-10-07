import { defineConfig } from 'agent-bundle/config';

/**
 * Agent Bundle project for the Mux Agent Plugin.
 *
 * Skills source of truth: plugins/mux/skills (listed explicitly below).
 * Discovery only auto-reads src/skills/; we point at plugins/mux (shared skill
 * source) instead so skill markdown is not duplicated.
 *
 * plugins/mux is the hand-maintained, multi-host package that the repo
 * marketplaces install (.cursor-plugin/, .claude-plugin/, .codex-plugin/,
 * .muse-plugin/ manifests side by side, real files only — no symlinks).
 * Agent Bundle additionally emits a composite artifact/ for claude, codex,
 * cursor, and portable.
 *
 * Muse Code has no Agent Bundle target — see plugins/mux/.muse-plugin/plugin.json.
 *
 * Display names:
 * - Hand-maintained plugins/mux manifests (Cursor/Claude/Codex/Muse) use displayName "Mux".
 * - Claude: claude.displayName / marketplace.plugin.displayName → "Mux".
 * - Codex: codex.interface.displayName + codex.marketplace.displayName → "Mux".
 * - Cursor *artifact* (.cursor-plugin/plugin.json from Agent Bundle): the adapter
 *   hardcodes displayName to plugin.name ("mux"). There is no cursor.displayName
 *   config key; casing cannot be "Mux" in the emitted Cursor artifact without a
 *   compiler change. Local Marketplace installs use plugins/mux (displayName Mux).
 * Post-build: `npm run fix:display-names` (wired into `npm run build`) rewrites
 * artifact/** displayName fields from "mux" to "Mux".
 *
 * Claude plugin.json author is also forced to { name: plugin.name } ("mux") by
 * the adapter; full author (Mux / devex@mux.com) appears on Cursor/Codex/portable
 * and Claude marketplace plugin entries via plugin.metadata.
 *
 * Pinned preview: agent-bundle@bf98f04 (pkg.pr.new, 2026-10-05). Not on npm registry.
 */
export default defineConfig({
  plugin: {
    name: 'mux',
    description:
      'Connect to Mux with the official remote MCP connector and skills for Video, Live Streams, Mux Data, and Robots.',
    logo: 'plugins/mux/assets/logo.png',
    metadata: {
      author: { name: 'Mux', email: 'devex@mux.com' },
      homepage: 'https://www.mux.com',
      repository: 'https://github.com/muxinc/mux-agent-plugin',
      license: 'MIT',
      keywords: [
        'mux',
        'video',
        'live-streaming',
        'mux-data',
        'mcp',
        'uploads',
        'playback',
        'robots',
      ],
    },
  },
  // Explicit paths: Agent Bundle ignores top-level skills/ and only auto-discovers
  // src/skills/. Naming plugins/mux/skills keeps one copy of skill bodies.
  skills: [
    'plugins/mux/skills/mux',
    'plugins/mux/skills/mux-docs',
    'plugins/mux/skills/mux-video',
    'plugins/mux/skills/mux-live',
    'plugins/mux/skills/mux-data',
    'plugins/mux/skills/mux-robots',
    'plugins/mux/skills/mux-robots-directives',
    'plugins/mux/skills/mux-analyze-any-video',
  ],
  mcp: {
    servers: {
      mux: {
        // Remote Mux MCP (OAuth on hosts that support it). Do not invent a local binary.
        transport: 'streamable-http',
        url: 'https://mcp.mux.com',
      },
    },
  },
  // Host UI titles: "Mux" wherever Agent Bundle admits a displayName field.
  claude: {
    displayName: 'Mux',
    marketplace: {
      owner: { name: 'Mux', email: 'devex@mux.com' },
      plugin: {
        displayName: 'Mux',
        author: { name: 'Mux', email: 'devex@mux.com' },
      },
    },
  },
  codex: {
    interface: {
      displayName: 'Mux',
      developerName: 'Mux',
    },
    marketplace: {
      displayName: 'Mux',
    },
    author: { name: 'Mux', email: 'devex@mux.com' },
  },
  cursor: {
    author: { name: 'Mux', email: 'devex@mux.com' },
    // No cursor.displayName — adapter always emits displayName === plugin.name.
  },
  portable: {
    author: { name: 'Mux', email: 'devex@mux.com' },
  },
  targets: ['claude', 'codex', 'cursor', 'portable'],
  // Keep existing .cursor-plugin/marketplace.json (points at plugins/mux).
  // Do not enable output.repositoryMarketplace — it would overwrite that file.
  output: {
    distPath: 'artifact',
  },
});
