#!/usr/bin/env node
/**
 * Build the OpenAI plugin directory upload ZIP (ChatGPT + Codex) from plugins/mux.
 *
 * Layout follows https://developers.openai.com/plugins/deploy/submission (Codex format):
 *   .codex-plugin/plugin.json   (only file in .codex-plugin/)
 *   .mcp.json                   (Codex shape: {"mcpServers":{"mux":{"url":...}}})
 *   skills/<name>/SKILL.md
 *   assets/logo.png, assets/icon.png
 *   README.md, LICENSE
 *
 * Excluded on purpose: .claude-plugin/, .cursor-plugin/, .muse-plugin/ and the
 * Cursor-only mcp.json, so the portal sees exactly one manifest and one MCP config.
 * Also excluded: .DS_Store and any dotfiles other than the two above. Symlinks fail the build.
 *
 * Output is deterministic (sorted entries, fixed timestamps):
 *   dist/mux-openai-plugin.zip
 *
 * Usage: node scripts/build-openai-zip.mjs   (or: npm run build:openai)
 */
import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'plugins', 'mux');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'mux-openai-plugin.zip');

const CATEGORIES = new Set([
  'Productivity', 'Creativity', 'Developer Tools', 'Business & Operations', 'Data & Analytics',
  'Communication', 'Education & Research', 'Security', 'Finance', 'Healthcare', 'Travel',
  'Entertainment', 'Other',
]);

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

async function readJson(rel) {
  return JSON.parse(await readFile(path.join(SRC, rel), 'utf8'));
}

/** Recursively collect regular files under dir (relative to SRC). Rejects symlinks. */
async function collect(relDir) {
  const out = [];
  for (const entry of await readdir(path.join(SRC, relDir), { withFileTypes: true })) {
    const rel = path.posix.join(relDir, entry.name);
    if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue;
    const st = await lstat(path.join(SRC, rel));
    if (st.isSymbolicLink()) fail(`symlink not allowed in package: ${rel}`);
    else if (st.isDirectory()) out.push(...(await collect(rel)));
    else if (st.isFile()) {
      if (entry.name.startsWith('.')) warn(`skipping dotfile: ${rel}`);
      else out.push(rel);
    }
  }
  return out;
}

function pngSize(buf) {
  const sig = '89504e470d0a1a0a';
  if (buf.subarray(0, 8).toString('hex') !== sig) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function checkLen(label, value, max) {
  if (typeof value !== 'string' || !value.trim()) return fail(`${label} is required`);
  if (/[\r\n]/.test(value) && label !== 'interface.longDescription') fail(`${label} must be one line`);
  if (value.length > max) fail(`${label} is ${value.length} chars (max ${max})`);
}

function checkHttps(label, value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) fail(`${label} must be an HTTPS URL without credentials`);
    if (value.length > 1024) fail(`${label} exceeds 1024 chars`);
  } catch {
    fail(`${label} is not a valid URL: ${value}`);
  }
}

// ---------- manifest ----------
const manifest = await readJson('.codex-plugin/plugin.json');
const codexDir = await readdir(path.join(SRC, '.codex-plugin'));
const extra = codexDir.filter((f) => f !== 'plugin.json' && f !== '.DS_Store');
if (extra.length) fail(`.codex-plugin/ must only contain plugin.json (found: ${extra.join(', ')})`);

if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(manifest.name ?? '')) fail('name must be a valid package id');
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version ?? '')) fail('version must be semver');
checkLen('description', manifest.description, 1024);
checkLen('author.name', manifest.author?.name, 120);
if (manifest.hooks) fail('lifecycle hooks are not allowed for directory submission');
if (manifest.apps) fail('apps / .app.json are not allowed for directory submission');
if (manifest.skills !== './skills/') fail('skills must be "./skills/"');
if (manifest.mcpServers !== './.mcp.json') fail('mcpServers must be "./.mcp.json"');

const i = manifest.interface ?? {};
checkLen('interface.displayName', i.displayName, 30);
checkLen('interface.shortDescription', i.shortDescription, 30);
checkLen('interface.longDescription', i.longDescription, 4000);
checkLen('interface.developerName', i.developerName, 80);
if (!CATEGORIES.has(i.category)) fail(`interface.category "${i.category}" is not an allowed category`);
if (!Array.isArray(i.capabilities) || i.capabilities.length > 20) fail('interface.capabilities must be an array of <= 20');
for (const c of i.capabilities ?? []) checkLen('interface.capabilities[]', c, 120);
for (const k of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) checkHttps(`interface.${k}`, i[k]);
const prompts = Array.isArray(i.defaultPrompt) ? i.defaultPrompt : i.defaultPrompt ? [i.defaultPrompt] : [];
if (prompts.length > 3) fail('interface.defaultPrompt allows at most 3 prompts');
if (new Set(prompts.map((p) => p.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase())).size !== prompts.length)
  fail('interface.defaultPrompt entries must be unique');
for (const p of prompts) {
  checkLen('interface.defaultPrompt[]', p, 128);
  if (/@\w/.test(p)) fail(`interface.defaultPrompt must not contain @mentions: ${p}`);
}
for (const k of ['logo', 'composerIcon', 'logoDark', 'composerIconDark']) {
  if (!i[k]) {
    if (k === 'logo' || k === 'composerIcon') fail(`interface.${k} is required`);
    continue;
  }
  if (!i[k].startsWith('./assets/')) fail(`interface.${k} must start with ./assets/`);
  const buf = await readFile(path.join(SRC, i[k])).catch(() => null);
  if (!buf) { fail(`interface.${k} file missing: ${i[k]}`); continue; }
  const size = pngSize(buf);
  if (!size) fail(`interface.${k} must be a PNG (this script only checks PNG)`);
  else if (size.width !== size.height || size.width < 48 || size.width > 4096)
    fail(`interface.${k} must be square, 48..4096 px (got ${size.width}x${size.height})`);
  if (buf.length > 5 * 1024 * 1024) fail(`interface.${k} exceeds 5 MiB`);
}
const oai = manifest.extensions?.['com.openai'] ?? {};
const tc = oai.review?.test_cases;
if (tc) {
  if (tc.positive?.length !== 5) warn(`review.test_cases.positive has ${tc.positive?.length ?? 0} cases (exactly 5 required at submission)`);
  if (tc.negative?.length !== 3) warn(`review.test_cases.negative has ${tc.negative?.length ?? 0} cases (exactly 3 required at submission)`);
  for (const c of tc.positive ?? []) if (!c.description || !c.prompt || !c.tools_triggered || !c.expected_behavior) fail(`positive case incomplete: ${c.description}`);
  for (const c of tc.negative ?? []) if (!c.description || !c.prompt) fail(`negative case incomplete: ${c.description}`);
}
if (oai.review && ('test_credentials' in oai.review || 'reviewer_instructions' in oai.review))
  fail('never put test_credentials / reviewer_instructions in the package');
if (!oai.review?.demo_recording_url) warn('review.demo_recording_url not set (required before submitting for review; enter it in the dashboard or add it here)');

// ---------- MCP config (normalize to the documented Codex upload shape) ----------
const mcp = await readJson('.mcp.json');
const servers = Object.entries(mcp.mcpServers ?? {});
if (servers.length !== 1) fail(`expected exactly one MCP server, found ${servers.length}`);
const zipMcp = { mcpServers: {} };
for (const [name, cfg] of servers) {
  if (!cfg.url) fail(`MCP server ${name} must be remote (url)`);
  else checkHttps(`mcpServers.${name}.url`, cfg.url);
  // Repo .mcp.json keeps "type":"http" for Claude Code. Codex accepts it too, but the
  // OpenAI upload docs show the Codex .mcp.json as url-only, so ship that shape.
  const { type, ...rest } = cfg;
  if (type && !['http', 'streamable-http'].includes(type)) fail(`MCP server ${name} has unsupported type ${type}`);
  zipMcp.mcpServers[name] = rest;
}

// ---------- skills ----------
const skillDirs = (await readdir(path.join(SRC, 'skills'), { withFileTypes: true })).filter((d) => d.isDirectory());
const skillNames = new Set();
for (const d of skillDirs) {
  if (d.name.startsWith('.')) fail(`hidden skill dir: ${d.name}`);
  const md = await readFile(path.join(SRC, 'skills', d.name, 'SKILL.md'), 'utf8').catch(() => null);
  if (!md) { fail(`skills/${d.name}/SKILL.md missing`); continue; }
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) { fail(`skills/${d.name}/SKILL.md missing front matter`); continue; }
  const name = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (!name) fail(`skills/${d.name}: name missing`);
  if (!/^description:/m.test(fm[1])) fail(`skills/${d.name}: description missing`);
  if (name && skillNames.has(name)) fail(`duplicate skill name ${name}`);
  if (name && `${manifest.name}:${name}`.length > 64) fail(`skill identity too long: ${manifest.name}:${name}`);
  skillNames.add(name);
}

// ---------- file list ----------
const files = new Map(); // zip path -> Buffer
files.set('.codex-plugin/plugin.json', await readFile(path.join(SRC, '.codex-plugin/plugin.json')));
files.set('.mcp.json', Buffer.from(`${JSON.stringify(zipMcp, null, 2)}\n`));
for (const rel of [...(await collect('skills')), ...(await collect('assets'))]) {
  files.set(rel, await readFile(path.join(SRC, rel)));
}
for (const rel of ['README.md', 'LICENSE']) {
  const buf = await readFile(path.join(SRC, rel)).catch(() => null);
  if (buf) files.set(rel, buf);
}

for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`build-openai-zip: ${errors.length} error(s); ZIP not written`);
  process.exit(1);
}

// ---------- deterministic ZIP writer (deflate, no extra fields) ----------
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1; // 2026-01-01
const locals = [];
const centrals = [];
let offset = 0;
for (const name of [...files.keys()].sort()) {
  const data = files.get(name);
  const nameBuf = Buffer.from(name, 'utf8');
  const deflated = zlib.deflateRawSync(data, { level: 9 });
  const useDeflate = deflated.length < data.length;
  const body = useDeflate ? deflated : data;
  const method = useDeflate ? 8 : 0;
  const crc = zlib.crc32(data) >>> 0;

  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0);
  lh.writeUInt16LE(20, 4);
  lh.writeUInt16LE(0x0800, 6); // UTF-8 names
  lh.writeUInt16LE(method, 8);
  lh.writeUInt16LE(DOS_TIME, 10);
  lh.writeUInt16LE(DOS_DATE, 12);
  lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(body.length, 18);
  lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(nameBuf.length, 26);
  lh.writeUInt16LE(0, 28);
  locals.push(lh, nameBuf, body);

  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0);
  ch.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix
  ch.writeUInt16LE(20, 6);
  ch.writeUInt16LE(0x0800, 8);
  ch.writeUInt16LE(method, 10);
  ch.writeUInt16LE(DOS_TIME, 12);
  ch.writeUInt16LE(DOS_DATE, 14);
  ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(body.length, 20);
  ch.writeUInt32LE(data.length, 24);
  ch.writeUInt16LE(nameBuf.length, 28);
  ch.writeUInt32LE(((0o100644 << 16) >>> 0), 38); // regular file, rw-r--r--
  ch.writeUInt32LE(offset, 42);
  centrals.push(ch, nameBuf);

  offset += lh.length + nameBuf.length + body.length;
}
const central = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.size, 8);
end.writeUInt16LE(files.size, 10);
end.writeUInt32LE(central.length, 12);
end.writeUInt32LE(offset, 16);

await mkdir(OUT_DIR, { recursive: true });
const zip = Buffer.concat([...locals, central, end]);
await writeFile(OUT, zip);

console.log(`wrote ${path.relative(ROOT, OUT)} (${zip.length} bytes, ${files.size} files)`);
for (const name of [...files.keys()].sort()) console.log(`  ${name}  (${files.get(name).length} B)`);
