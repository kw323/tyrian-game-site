#!/usr/bin/env python3
"""Generate only missing or placeholder English voice assets from the campaign manifest.

The tool never overwrites an existing playable MP3. It writes each new clip to a
temporary path, verifies a minimum file size, and then atomically replaces only
the corresponding placeholder file.
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
MANIFEST_PATH = PROJECT_ROOT / "english_voice_lines.json"
VOICES_ROOT = PROJECT_ROOT / "client" / "public" / "voices" / "en"
MIN_PLAYABLE_BYTES = 1024


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="List files that need regeneration without writing audio.")
    parser.add_argument("--line-id", action="append", default=[], help="Generate only this line ID. Repeat for more than one line.")
    parser.add_argument("--limit", type=int, default=0, help="Generate at most this many placeholder files. Zero means no limit.")
    parser.add_argument("--pause", type=float, default=0.2, help="Delay in seconds between remote TTS requests.")
    return parser.parse_args()


def load_manifest() -> list[dict[str, Any]]:
    with MANIFEST_PATH.open("r", encoding="utf-8") as source:
        data = json.load(source)
    if not isinstance(data, list):
        raise ValueError("The voice manifest must be a JSON array.")
    return data


def normalize_speaker(value: object) -> str:
    speaker = str(value or "elena").lower()
    return "".join(character for character in speaker if character.isascii() and (character.isalnum() or character in "_-")) or "elena"


def is_playable(path: Path) -> bool:
    return path.is_file() and path.stat().st_size >= MIN_PLAYABLE_BYTES


def collect_targets(lines: list[dict[str, Any]], requested_ids: set[str]) -> list[tuple[str, str, str, Path]]:
    targets: list[tuple[str, str, str, Path]] = []
    for item in lines:
        line_id = str(item.get("lineId") or "").strip()
        text = str(item.get("text") or "").strip()
        if not line_id or not text:
            continue
        if requested_ids and line_id not in requested_ids:
            continue

        speaker = normalize_speaker(item.get("speaker"))
        target_path = VOICES_ROOT / speaker / f"{line_id}.mp3"
        if not is_playable(target_path):
            targets.append((line_id, speaker, text, target_path))
    return targets


def generate_clip(text: str, target_path: Path) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = target_path.with_suffix(".mp3.part")
    temporary_path.unlink(missing_ok=True)

    try:
        gTTS(text=text, lang="en", tld="com", slow=False).save(str(temporary_path))
        if temporary_path.stat().st_size < MIN_PLAYABLE_BYTES:
            raise RuntimeError(f"Generated file is below {MIN_PLAYABLE_BYTES} bytes.")
        os.replace(temporary_path, target_path)
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    targets = collect_targets(load_manifest(), set(args.line_id))
    if args.limit > 0:
        targets = targets[:args.limit]

    print(f"Placeholder files selected: {len(targets)}")
    if args.dry_run:
        for line_id, speaker, _, target_path in targets:
            print(f"DRY RUN\t{line_id}\t{speaker}\t{target_path.relative_to(PROJECT_ROOT)}")
        return 0

    generated = 0
    failures: list[str] = []
    for index, (line_id, speaker, text, target_path) in enumerate(targets, start=1):
        try:
            generate_clip(text, target_path)
            generated += 1
            print(f"GENERATED\t{index}/{len(targets)}\t{line_id}\t{speaker}\t{target_path.stat().st_size} bytes")
        except Exception as error:
            failures.append(line_id)
            print(f"FAILED\t{index}/{len(targets)}\t{line_id}\t{error}")
        if index < len(targets) and args.pause > 0:
            time.sleep(args.pause)

    print(f"Completed: {generated} generated, {len(failures)} failed.")
    if failures:
        print("Failed IDs: " + ", ".join(failures))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
