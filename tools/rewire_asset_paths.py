#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

CODE_EXTS = {".ts", ".tsx", ".js", ".jsx"}

# We will rewrite these patterns:
# 1) import ... from '@assets/images/<file>'
# 2) require('@assets/images/<file>')
# 3) require('../assets/images/<file>') and similar relative paths ending in /assets/images/<file>
IMPORT_RE = re.compile(r"""from\s+['"](@assets/images/([^'"]+))['"]""")
REQUIRE_RE = re.compile(r"""require\(\s*['"]([^'"]+/assets/images/([^'"]+))['"]\s*\)""")
REQUIRE_ALIAS_RE = re.compile(r"""require\(\s*['"](@assets/images/([^'"]+))['"]\s*\)""")

def iter_code_files(root: Path) -> List[Path]:
    files: List[Path] = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix in CODE_EXTS:
            # skip common noise
            if any(part in {".git", "node_modules", ".expo", ".next", "dist", "build"} for part in p.parts):
                continue
            files.append(p)
    return files

def build_filename_index(images_root: Path) -> Tuple[Dict[str, str], Dict[str, List[str]]]:
    """
    Returns:
      unique_map: filename -> "@assets/images/<new/subpath/filename>"
      collisions: filename -> [subpaths...]
    """
    all_paths: Dict[str, List[str]] = {}
    for p in images_root.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(images_root).as_posix()  # e.g. "sprites/monsters/abhuman.png"
        name = p.name
        all_paths.setdefault(name, []).append(rel)

    unique_map: Dict[str, str] = {}
    collisions: Dict[str, List[str]] = {}
    for name, rels in all_paths.items():
        if len(rels) == 1:
            unique_map[name] = f"@assets/images/{rels[0]}"
        else:
            collisions[name] = sorted(rels)

    return unique_map, collisions

def rewrite_file(path: Path, filename_map: Dict[str, str]) -> Tuple[bool, List[str]]:
    text = path.read_text(encoding="utf-8")
    original = text
    changes: List[str] = []

    # 1) import from '@assets/images/<file>'
    def repl_import(m: re.Match) -> str:
        full = m.group(1)     # @assets/images/<file>
        filepart = m.group(2) # <file>
        new = filename_map.get(Path(filepart).name)
        if not new:
            return m.group(0)
        if new == full:
            return m.group(0)
        changes.append(f"import: {full} -> {new}")
        return m.group(0).replace(full, new)

    text = IMPORT_RE.sub(repl_import, text)

    # 2) require('@assets/images/<file>')
    def repl_req_alias(m: re.Match) -> str:
        full = m.group(1)
        filepart = m.group(2)
        new = filename_map.get(Path(filepart).name)
        if not new:
            return m.group(0)
        if new == full:
            return m.group(0)
        changes.append(f"require(alias): {full} -> {new}")
        return m.group(0).replace(full, new)

    text = REQUIRE_ALIAS_RE.sub(repl_req_alias, text)

    # 3) require('../assets/images/<file>') or require('../../assets/images/<file>') etc
    def repl_req_rel(m: re.Match) -> str:
        full = m.group(1)      # something/assets/images/<file>
        filepart = m.group(2)  # <file>
        fname = Path(filepart).name
        new_alias = filename_map.get(fname)
        if not new_alias:
            return m.group(0)

        # We rewrite relative requires to alias requires, because alias is stable across moves
        changes.append(f"require(rel->alias): {full} -> {new_alias}")
        return f"require('{new_alias}')"

    text = REQUIRE_RE.sub(repl_req_rel, text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True, changes
    return False, changes

def main() -> None:
    ap = argparse.ArgumentParser(description="Rewrite @assets/images/<file> references after moving images.")
    ap.add_argument("--repo", default=".", help="Repo root (default: .)")
    ap.add_argument("--images", default="assets/images", help="Images root relative to repo (default: assets/images)")
    ap.add_argument("--dry-run", action="store_true", help="Do not write files; just report")
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    images_root = (repo / args.images).resolve()

    if not images_root.exists():
        raise SystemExit(f"Images directory not found: {images_root}")

    filename_map, collisions = build_filename_index(images_root)

    if collisions:
        print("⚠️ Filename collisions detected (script will NOT rewrite these names):")
        for name, rels in sorted(collisions.items()):
            print(f"  {name}:")
            for r in rels:
                print(f"    - {r}")
        print()

    code_files = iter_code_files(repo)
    changed_files: List[Path] = []
    total_edits = 0

    for f in code_files:
        original = f.read_text(encoding="utf-8")
        if args.dry_run:
            # simulate rewrite without writing
            tmp = f.with_suffix(f.suffix + ".tmp_scan")
            tmp.write_text(original, encoding="utf-8")
            changed, changes = rewrite_file(tmp, filename_map)
            tmp.unlink(missing_ok=True)
        else:
            changed, changes = rewrite_file(f, filename_map)

        if changed:
            changed_files.append(f)
            total_edits += len(changes)
            print(f"✅ {f.relative_to(repo)}")
            for c in changes[:12]:
                print(f"   - {c}")
            if len(changes) > 12:
                print(f"   - ... +{len(changes) - 12} more")
            print()

    print(f"Done. Files changed: {len(changed_files)}; total path rewrites: {total_edits}")
    if args.dry_run:
        print("Dry-run only. Re-run without --dry-run to apply changes.")

if __name__ == "__main__":
    main()
