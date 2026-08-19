#!/usr/bin/env python3
"""Verify that every manifest entry points to a playable English MP3 asset."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "english_voice_lines.json"
VOICES_ROOT = PROJECT_ROOT / "client" / "public" / "voices" / "en"
MIN_PLAYABLE_BYTES = 1024


def normalize_speaker(value: object) -> str:
    speaker = str(value or "elena").lower()
    return "".join(character for character in speaker if character.isascii() and (character.isalnum() or character in "_-")) or "elena"


def main() -> int:
    with MANIFEST_PATH.open("r", encoding="utf-8") as source:
        lines: list[dict[str, Any]] = json.load(source)

    invalid: list[str] = []
    for item in lines:
        line_id = str(item.get("lineId") or "").strip()
        speaker = normalize_speaker(item.get("speaker"))
        if not line_id:
            invalid.append("Entry without lineId")
            continue

        asset_path = VOICES_ROOT / speaker / f"{line_id}.mp3"
        if not asset_path.is_file():
            invalid.append(f"Missing: {asset_path.relative_to(PROJECT_ROOT)}")
        elif asset_path.stat().st_size < MIN_PLAYABLE_BYTES:
            invalid.append(f"Placeholder: {asset_path.relative_to(PROJECT_ROOT)} ({asset_path.stat().st_size} bytes)")

    if invalid:
        print(f"Voice asset verification failed: {len(invalid)} invalid entries.")
        print("\n".join(invalid))
        return 1

    print(f"Voice asset verification passed: {len(lines)} manifest entries have MP3 files of at least {MIN_PLAYABLE_BYTES} bytes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
