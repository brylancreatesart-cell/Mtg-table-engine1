#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STYLE_DIR = ROOT / "styles"
SCRIPT_DIR = ROOT / "scripts"
REPORT = ROOT / "refactor-report.json"

STYLE_RE = re.compile(r"<style(?P<attrs>[^>]*)>(?P<body>.*?)</style\s*>", re.I | re.S)
SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>", re.I | re.S)
TYPE_RE = re.compile(r"\btype\s*=\s*([\"'])(.*?)\1", re.I | re.S)
SRC_RE = re.compile(r"\bsrc\s*=", re.I)
BLOCKING_ATTR_RE = re.compile(r"\b(async|defer|nomodule)\b", re.I)
JS_TYPES = {
    "text/javascript",
    "application/javascript",
    "application/ecmascript",
    "text/ecmascript",
    "",
}


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ensure_clean_target_dir(path: Path, prefix: str) -> None:
    path.mkdir(parents=True, exist_ok=True)
    for p in path.glob(f"{prefix}-*.css" if path == STYLE_DIR else f"{prefix}-*.js"):
        p.unlink()


def main() -> None:
    original = INDEX.read_text(encoding="utf-8")
    original_bytes = len(original.encode("utf-8"))
    STYLE_DIR.mkdir(exist_ok=True)
    SCRIPT_DIR.mkdir(exist_ok=True)

    # Only remove files owned by this mechanical splitter.
    for p in STYLE_DIR.glob("inline-*.css"):
        p.unlink()
    for p in SCRIPT_DIR.glob("inline-*.js"):
        p.unlink()

    style_records = []
    script_records = []

    style_counter = 0
    def style_replace(match: re.Match[str]) -> str:
        nonlocal style_counter
        attrs = match.group("attrs") or ""
        body = match.group("body")
        # Externalizing <style media=...> etc. requires attribute translation. Leave
        # attributed style blocks inline rather than changing semantics.
        if attrs.strip():
            return match.group(0)
        style_counter += 1
        rel = f"styles/inline-{style_counter:02d}.css"
        path = ROOT / rel
        path.write_text(body, encoding="utf-8")
        style_records.append({"path": rel, "bytes": len(body.encode("utf-8")), "sha256": sha256(body)})
        return f'<link rel="stylesheet" href="{rel}">'

    after_styles = STYLE_RE.sub(style_replace, original)

    script_counter = 0
    def script_replace(match: re.Match[str]) -> str:
        nonlocal script_counter
        attrs = match.group("attrs") or ""
        body = match.group("body")
        if SRC_RE.search(attrs) or BLOCKING_ATTR_RE.search(attrs):
            return match.group(0)
        type_match = TYPE_RE.search(attrs)
        script_type = type_match.group(2).strip().lower() if type_match else ""
        # Data blocks and modules are intentionally left inline; moving modules can
        # change relative-import resolution, and data blocks are not executable JS.
        if script_type not in JS_TYPES or script_type == "module":
            return match.group(0)
        script_counter += 1
        rel = f"scripts/inline-{script_counter:02d}.js"
        path = ROOT / rel
        path.write_text(body, encoding="utf-8")
        script_records.append({"path": rel, "bytes": len(body.encode("utf-8")), "sha256": sha256(body), "attrs": attrs})
        attrs_out = attrs.rstrip()
        spacer = "" if not attrs_out else ""
        return f'<script{attrs_out} src="{rel}"></script>'

    rewritten = SCRIPT_RE.sub(script_replace, after_styles)

    if not style_records and not script_records:
        raise SystemExit("Safety stop: no eligible inline CSS or JavaScript blocks were found.")

    INDEX.write_text(rewritten, encoding="utf-8")

    # Byte-for-byte ownership validation: every generated file must exactly match
    # the body extracted from the original source.
    for rec in style_records + script_records:
        text = (ROOT / rec["path"]).read_text(encoding="utf-8")
        if sha256(text) != rec["sha256"]:
            raise SystemExit(f"Safety stop: generated content hash mismatch for {rec['path']}")

    report = {
        "operation": "mechanical-inline-extraction",
        "behavioral_intent": "no functional or visual changes",
        "original_index_bytes": original_bytes,
        "refactored_index_bytes": len(rewritten.encode("utf-8")),
        "styles_extracted": len(style_records),
        "scripts_extracted": len(script_records),
        "styles": style_records,
        "scripts": script_records,
        "remaining_inline_style_tags": len(STYLE_RE.findall(rewritten)),
        "remaining_inline_script_tags": len([m for m in SCRIPT_RE.finditer(rewritten) if not SRC_RE.search(m.group('attrs') or '')]),
        "original_sha256": sha256(original),
        "refactored_index_sha256": sha256(rewritten),
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
