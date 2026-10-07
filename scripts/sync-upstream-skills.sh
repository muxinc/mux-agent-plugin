#!/usr/bin/env bash
# Sync skills from https://github.com/muxinc/skills into plugins/mux/skills/.
#
# - Sparse-clones (or curls) upstream skills/* into a temp dir
# - Copies each upstream skill folder into plugins/mux/skills/
# - Remaps mux-docs frontmatter name from mux-video -> mux-docs
#   (collision with this plugin's mux-video skill)
# - Never overwrites plugin-only custom skill folders (CUSTOM_SKILLS)
#
# Usage (from repo root):
#   ./scripts/sync-upstream-skills.sh
#   UPSTREAM_REF=main ./scripts/sync-upstream-skills.sh
#
# Env:
#   UPSTREAM_REPO  (default: https://github.com/muxinc/skills.git)
#   UPSTREAM_REF   (default: main)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_SKILLS="${REPO_ROOT}/plugins/mux/skills"
UPSTREAM_REPO="${UPSTREAM_REPO:-https://github.com/muxinc/skills.git}"
UPSTREAM_REF="${UPSTREAM_REF:-main}"
UPSTREAM_SKILLS_PATH="skills"

# Plugin-owned skills — never overwrite these folders from upstream.
CUSTOM_SKILLS="mux mux-video mux-live mux-data mux-analyze-any-video mux-robots mux-robots-directives"

is_custom() {
  local name="$1"
  local c
  for c in $CUSTOM_SKILLS; do
    if [ "$c" = "$name" ]; then
      return 0
    fi
  done
  return 1
}

# Local folder name for an upstream skill directory basename.
local_name_for() {
  local upstream_name="$1"
  # Upstream ships skills/mux-docs with frontmatter name: mux-video.
  # Keep the folder as mux-docs; remap is applied to frontmatter only.
  echo "$upstream_name"
}

remap_skill_frontmatter() {
  local skill_dir="$1"
  local local_name="$2"
  local skill_md="${skill_dir}/SKILL.md"
  [ -f "$skill_md" ] || return 0

  # Only mux-docs needs a name remap today (upstream name is mux-video).
  if [ "$local_name" != "mux-docs" ]; then
    return 0
  fi

  python3 - "$skill_md" "$local_name" <<'PY'
import re, sys
path, local_name = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
if not m:
    sys.exit(0)
fm, body = m.group(1), m.group(2)
fm = re.sub(r"(?m)^name:\s*.*$", f"name: {local_name}", fm, count=1)
note = (
    "> **Source:** vendored from [muxinc/skills](https://github.com/muxinc/skills) "
    "(`skills/mux-docs`). Upstream frontmatter name is `mux-video`; this plugin vendors "
    "it as `mux-docs` so it does not collide with the plugin’s `mux-video` skill.\n\n"
)
body_stripped = body.lstrip()
if body_stripped.startswith("> **Source:** vendored from"):
    parts = body_stripped.split("\n\n", 1)
    body_stripped = parts[1] if len(parts) > 1 else ""
open(path, "w", encoding="utf-8").write(f"---\n{fm}\n---\n\n{note}{body_stripped}")
PY
}

fetch_upstream() {
  local tmp="$1"
  mkdir -p "$tmp/skills"

  if command -v git >/dev/null 2>&1; then
    echo "Cloning ${UPSTREAM_REPO}@${UPSTREAM_REF} (sparse: ${UPSTREAM_SKILLS_PATH}/)..."
    if git clone --depth 1 --filter=blob:none --sparse \
        --branch "$UPSTREAM_REF" "$UPSTREAM_REPO" "$tmp/repo"; then
      (
        cd "$tmp/repo"
        git sparse-checkout set "$UPSTREAM_SKILLS_PATH"
      )
      if [ -d "$tmp/repo/${UPSTREAM_SKILLS_PATH}" ]; then
        cp -a "$tmp/repo/${UPSTREAM_SKILLS_PATH}/." "$tmp/skills/"
        return 0
      fi
      echo "Sparse clone missing ${UPSTREAM_SKILLS_PATH}; falling back to curl..." >&2
    else
      echo "git clone failed; falling back to curl..." >&2
    fi
  fi

  echo "Fetching skills via GitHub API + curl..."
  local api="https://api.github.com/repos/muxinc/skills/contents/${UPSTREAM_SKILLS_PATH}?ref=${UPSTREAM_REF}"
  local listing
  listing="$(curl -fsSL "$api")"
  python3 -c 'import json,sys; [print(i["name"]) for i in json.load(sys.stdin) if i.get("type")=="dir"]' <<EOF_JSON >"$tmp/skill_names.txt"
$listing
EOF_JSON
  while IFS= read -r skill; do
    [ -n "$skill" ] || continue
    mkdir -p "$tmp/skills/$skill"
    curl -fsSL "https://api.github.com/repos/muxinc/skills/contents/${UPSTREAM_SKILLS_PATH}/${skill}?ref=${UPSTREAM_REF}" \
      >"$tmp/files.json"
    python3 -c 'import json,sys; [print(i["name"]+"\t"+i["download_url"]) for i in json.load(sys.stdin) if i.get("type")=="file" and i.get("download_url")]' \
      <"$tmp/files.json" >"$tmp/file_urls.txt"
    while IFS="$(printf '\t')" read -r fname url; do
      [ -n "$fname" ] || continue
      curl -fsSL "$url" -o "$tmp/skills/$skill/$fname"
    done <"$tmp/file_urls.txt"
  done <"$tmp/skill_names.txt"
}

main() {
  mkdir -p "$DEST_SKILLS"
  local tmp
  tmp="$(mktemp -d)"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" EXIT

  fetch_upstream "$tmp"

  if [ ! -d "$tmp/skills" ] || [ -z "$(ls -A "$tmp/skills" 2>/dev/null || true)" ]; then
    echo "ERROR: no upstream skills found under ${UPSTREAM_SKILLS_PATH}" >&2
    exit 1
  fi

  local synced=0 skipped=0
  local skill local_name base
  for skill in "$tmp/skills"/*; do
    [ -d "$skill" ] || continue
    base="$(basename "$skill")"
    local_name="$(local_name_for "$base")"

    if is_custom "$local_name" || is_custom "$base"; then
      echo "SKIP  ${base} (plugin-only custom skill — not overwritten)"
      skipped=$((skipped + 1))
      continue
    fi

    echo "SYNC  ${base} -> plugins/mux/skills/${local_name}/"
    rm -rf "${DEST_SKILLS}/${local_name}"
    mkdir -p "${DEST_SKILLS}/${local_name}"
    cp -a "$skill"/. "${DEST_SKILLS}/${local_name}/"
    remap_skill_frontmatter "${DEST_SKILLS}/${local_name}" "$local_name"
    synced=$((synced + 1))
  done

  echo
  echo "Done. synced=${synced} skipped_custom=${skipped}"
  echo "Custom skills preserved: ${CUSTOM_SKILLS}"
}

main "$@"
