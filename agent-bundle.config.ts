import { defineConfig } from 'agent-bundle/config';

/**
 * Agent Bundle project for the Mux Agent Plugin.
 *
 * Skills source of truth: plugins/mux/skills (listed explicitly below).
 * Discovery only auto-reads src/skills/; we point at plugins/mux (shared skill
 * source) instead so skill markdown is not duplicated. Muse reuses the same folder via
 * packs/muse/skills → symlink.
 *
 * Cursor marketplace path plugins/mux stays hand-maintained for local cp install;
 * Agent Bundle emits a composite artifact/ for claude, codex, cursor, and portable.
 *
 * Muse Code has no Agent Bundle target — see packs/muse/.
 *
 * Pinned preview: agent-bundle@bf98f04 (pkg.pr.new, 2026-10-05). Not on npm registry.
 */
export default defineConfig({
  plugin: {
    name: 'mux',
    description:
      'Mux Agent Plugin: remote MCP connector plus skills for Video, Live Streams, Mux Data, and Robots — for Cursor, Grok Bot, Claude Code, Codex, and Muse.',
    logo: 'plugins/mux/assets/logo.png',
    metadata: {
      author: { name: 'Mux', email: 'open-source@mux.com' },
      homepage: 'https://www.mux.com/docs/integrations/mcp-server',
      repository: 'https://github.com/muxinc/cursor-plugin',
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
  targets: ['claude', 'codex', 'cursor', 'portable'],
  // Keep existing .cursor-plugin/marketplace.json (points at plugins/mux).
  // Do not enable output.repositoryMarketplace — it would overwrite that file.
  output: {
    distPath: 'artifact',
  },
});
