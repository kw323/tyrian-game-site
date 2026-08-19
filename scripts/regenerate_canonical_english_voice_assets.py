#!/usr/bin/env python3
"""Regenerate English voice assets from the Hebrew-canonical English localization.

The displayed English campaign text comes from dialogue.voice-lines.json, rather than
from the historic english_voice_lines.json draft. This utility preserves the voice-file
layout while regenerating every clip from the displayed canonical English sentence.
"""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any

from gtts import gTTS

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = PROJECT_ROOT / "english_voice_lines.json"
LOCALIZATION_PATH = PROJECT_ROOT / "client" / "src" / "game" / "story" / "locales" / "dialogue.voice-lines.json"
VOICES_ROOT = PROJECT_ROOT / "client" / "public" / "voices" / "en"
MIN_PLAYABLE_BYTES = 1024


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Validate and list target clips without writing audio.")
    parser.add_argument("--line-id", action="append", default=[], help="Regenerate only this line ID. Repeat for more than one line.")
    parser.add_argument("--pause", type=float, default=0.12, help="Delay in seconds between requests.")
    return parser.parse_args()


def load_json(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"Expected an array in {path}")
    return data


def validate_and_collect(requested_ids: set[str]) -> list[tuple[str, str, str, Path]]:
    source = load_json(SOURCE_PATH)
    localized = load_json(LOCALIZATION_PATH)
    source_ids = [str(item.get("lineId") or "") for item in source]
    localized_by_id = {str(item.get("lineId") or ""): item for item in localized}
    if len(source_ids) != len(set(source_ids)):
        raise ValueError("Voice source has duplicate line IDs.")
    if set(localized_by_id) != set(source_ids):
        missing = set(source_ids) - set(localized_by_id)
        extra = set(localized_by_id) - set(source_ids)
        raise ValueError(f"Localization IDs do not match voice source. Missing={missing}; extra={extra}")

    targets: list[tuple[str, str, str, Path]] = []
    for line in source:
        line_id = str(line["lineId"])
        if requested_ids and line_id not in requested_ids:
            continue
        speaker = str(line.get("speaker") or "elena")
        english = localized_by_id[line_id].get("en")
        if not isinstance(english, str) or not english.strip():
            raise ValueError(f"Canonical English text is missing for {line_id}")
        targets.append((line_id, speaker, english.strip(), VOICES_ROOT / speaker / f"{line_id}.mp3"))
    if requested_ids and {line_id for line_id, _, _, _ in targets} != requested_ids:
        raise ValueError("One or more requested line IDs were not found.")
    return targets


def generate_clip(text: str, target_path: Path) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = target_path.with_suffix(".mp3.part")
    temporary.unlink(missing_ok=True)
    try:
        gTTS(text=text, lang="en", tld="com", slow=False).save(str(temporary))
        if temporary.stat().st_size < MIN_PLAYABLE_BYTES:
            raise RuntimeError("Generated clip is unexpectedly small.")
        os.replace(temporary, target_path)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    targets = validate_and_collect(set(args.line_id))
    print(f"Canonical English clips selected: {len(targets)}")
    if args.dry_run:
        for line_id, speaker, _, target in targets:
            print(f"DRY RUN\t{line_id}\t{speaker}\t{target.relative_to(PROJECT_ROOT)}")
        return 0

    failures: list[str] = []
    for index, (line_id, speaker, text, target) in enumerate(targets, start=1):
        try:
            generate_clip(text, target)
            print(f"REGENERATED\t{index}/{len(targets)}\t{line_id}\t{speaker}\t{len(text)} chars")
        except Exception as error:
            failures.append(f"{line_id}: {error}")
            print(f"FAILED\t{index}/{len(targets)}\t{line_id}\t{error}")
        if index < len(targets) and args.pause > 0:
            time.sleep(args.pause)

    if failures:
        raise SystemExit("Voice generation failures:\n" + "\n".join(failures))
    print(f"Regenerated {len(targets)} canonical English voice clips.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
