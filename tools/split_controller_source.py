#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

SOURCE = Path("scripts/inline-101.js")
OUT_DIR = Path("scripts/app-src")
REPORT = Path("controller-source-report.json")
MAX_PART_BYTES = 70000


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def split_at_newlines(data: bytes, max_bytes: int) -> list[bytes]:
    parts: list[bytes] = []
    start = 0
    total = len(data)
    while start < total:
        target = min(start + max_bytes, total)
        if target < total:
            cut = data.rfind(b"\n", start, target + 1)
            if cut <= start:
                cut = data.find(b"\n", target)
                if cut == -1:
                    cut = total
                else:
                    cut += 1
            else:
                cut += 1
        else:
            cut = total
        parts.append(data[start:cut])
        start = cut
    return parts


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing {SOURCE}")

    original = SOURCE.read_bytes()
    if len(original) < 100_000:
        raise SystemExit(f"Safety stop: {SOURCE} is unexpectedly small ({len(original)} bytes)")

    parts = split_at_newlines(original, MAX_PART_BYTES)
    if len(parts) < 2:
        raise SystemExit("Safety stop: controller did not split into multiple parts")

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    entries = []
    for idx, payload in enumerate(parts, 1):
        path = OUT_DIR / f"controller-part-{idx:02d}.part.js"
        path.write_bytes(payload)
        entries.append({
            "order": idx,
            "path": str(path),
            "bytes": len(payload),
            "sha256": sha256(payload),
        })

    rebuilt = b"".join(Path(item["path"]).read_bytes() for item in entries)
    if rebuilt != original:
        raise SystemExit("Safety stop: byte-for-byte reconstruction failed")

    report = {
        "operation": "byte-exact-controller-source-fragmentation",
        "runtime_file_changed": False,
        "source": str(SOURCE),
        "source_bytes": len(original),
        "source_sha256": sha256(original),
        "max_part_bytes": MAX_PART_BYTES,
        "parts": entries,
        "reconstructed_bytes": len(rebuilt),
        "reconstructed_sha256": sha256(rebuilt),
        "byte_exact": True,
        "note": "These fragments preserve the existing single-IIFE lexical scope by rebuilding the runtime controller; they are not loaded independently by the browser.",
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "parts": len(entries),
        "bytes": len(original),
        "sha256": sha256(original),
        "byte_exact": True,
    }, indent=2))


if __name__ == "__main__":
    main()
