#!/usr/bin/env node
/**
 * Agent Bundle hardcodes Cursor artifact displayName to plugin.name ("mux").
 * After `agent-bundle build`, rewrite user-facing displayName fields to "Mux".
 * Never changes plugin id `name`.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTIFACT = path.join(ROOT, 'artifact');
const TARGET = 'Mux';

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.json')) yield full;
  }
}

function fixDisplayNames(value, trail = []) {
  let changed = 0;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      changed += fixDisplayNames(value[i], trail.concat(String(i)));
    }
    return changed;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (
        (key === 'displayName' || key === 'display_name') &&
        typeof child === 'string' &&
        child !== TARGET
      ) {
        const lower = child.toLowerCase();
        if (lower === 'mux' || lower === 'mux agent plugin') {
          value[key] = TARGET;
          changed += 1;
          console.log(
            `  ${trail.concat(key).join('.')} : ${JSON.stringify(child)} -> ${JSON.stringify(TARGET)}`,
          );
        }
      } else {
        changed += fixDisplayNames(child, trail.concat(key));
      }
    }
  }
  return changed;
}

const files = [];
for await (const file of walk(ARTIFACT)) files.push(file);
if (files.length === 0) {
  console.error(`fix-display-names: no JSON under ${ARTIFACT} (run agent-bundle build first)`);
  process.exit(1);
}

let total = 0;
for (const file of files.sort()) {
  let data;
  try {
    data = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    continue;
  }
  const n = fixDisplayNames(data);
  if (n === 0) continue;
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`fixed ${path.relative(ROOT, file)} (${n})`);
  total += n;
}

console.log(`fix-display-names: ${total} field(s) set to ${JSON.stringify(TARGET)}`);
