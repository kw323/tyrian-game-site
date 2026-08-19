#!/usr/bin/env python3
"""Regenerate canonical English dialogue voices with a distinct TTS voice per speaker.

The script treats english_voice_lines.json as the sole source of truth. It writes only
canonical manifest paths under client/public/voices/en/{speaker}/{lineId}.mp3 and uses
an atomic replacement so the game never receives a partial clip.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
from typing import Any

import edge_tts

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "english_voice_lines.json"
LOCALIZED_LINES_PATH = PROJECT_ROOT / "client" / "src" / "game" / "story" / "locales" / "dialogue.voice-lines.json"
VOICES_ROOT = PROJECT_ROOT / "client" / "public" / "voices" / "en"
MIN_PLAYABLE_BYTES = 1024

# Voices and delivery vary by character. The exact dialogue sentence is never changed.
SPEAKER_VOICES: dict[str, dict[str, str]] = {
    "protagonist": {
        "voice": "en-US-AndrewNeural",
        "rate": "-2%",
        "pitch": "-4Hz",
        "volume": "+0%",
    },
    "naomi": {
        "voice": "en-US-AvaNeural",
        "rate": "+2%",
        "pitch": "+2Hz",
        "volume": "+0%",
    },
    "ghost": {
        "voice": "en-US-GuyNeural",
        "rate": "-12%",
        "pitch": "-10Hz",
        "volume": "-2%",
    },
    "elena": {
        "voice": "en-US-MichelleNeural",
        "rate": "-7%",
        "pitch": "-3Hz",
        "volume": "+0%",
    },
    "sera": {
        "voice": "en-US-AriaNeural",
        "rate": "+7%",
        "pitch": "+8Hz",
        "volume": "+1%",
    },
    "archon": {
        "voice": "en-US-ChristopherNeural",
        "rate": "-14%",
        "pitch": "-14Hz",
        "volume": "+0%",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing playable clips. Required for a full voice overhaul.",
    )
    parser.add_argument(
        "--speaker",
        action="append",
        default=[],
        help="Regenerate only one speaker. Repeat to select multiple speakers.",
    )
    parser.add_argument(
        "--line-id",
        action="append",
        default=[],
        help="Regenerate only a specific canonical line ID. Repeat to select several lines.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=2,
        help="Number of simultaneous synthesis requests; default is conservative.",
    )
    return parser.parse_args()


def load_manifest() -> list[dict[str, Any]]:
    with MANIFEST_PATH.open("r", encoding="utf-8") as source:
        manifest = json.load(source)
    if not isinstance(manifest, list):
        raise ValueError("The voice manifest must be a JSON array.")

    # VoiceManifest displays the localized English text when present, so synthesis
    # must use the same value. Hebrew remains the story authority; this is its
    # culturally adapted English localization already used by the game UI.
    with LOCALIZED_LINES_PATH.open("r", encoding="utf-8") as source:
        localized_lines = json.load(source)
    localized_by_line_id = {
        str(item.get("lineId") or "").strip(): str(item.get("en") or "").strip()
        for item in localized_lines
        if isinstance(item, dict)
    }
    for item in manifest:
        if not isinstance(item, dict):
            continue
        localized_english = localized_by_line_id.get(str(item.get("lineId") or "").strip())
        if localized_english:
            item["text"] = localized_english
    return manifest


def normalize_speaker(value: object) -> str:
    return str(value or "").strip().lower()


def get_targets(args: argparse.Namespace) -> list[dict[str, str]]:
    speakers = {speaker.lower() for speaker in args.speaker}
    line_ids = set(args.line_id)
    targets: list[dict[str, str]] = []

    for item in load_manifest():
        line_id = str(item.get("lineId") or "").strip()
        speaker = normalize_speaker(item.get("speaker"))
        text = str(item.get("text") or "").strip()
        if not line_id or not speaker or not text:
            continue
        if speaker not in SPEAKER_VOICES:
            raise ValueError(f"No configured voice exists for speaker: {speaker}")
        if speakers and speaker not in speakers:
            continue
        if line_ids and line_id not in line_ids:
            continue
        targets.append({"line_id": line_id, "speaker": speaker, "text": text})

    return targets


async def synthesize_target(
    index: int,
    total: int,
    target: dict[str, str],
    overwrite: bool,
    semaphore: asyncio.Semaphore,
) -> tuple[str, str]:
    line_id = target["line_id"]
    speaker = target["speaker"]
    output_path = VOICES_ROOT / speaker / f"{line_id}.mp3"

    if output_path.is_file() and output_path.stat().st_size >= MIN_PLAYABLE_BYTES and not overwrite:
        return "SKIPPED", f"{index}/{total}\t{speaker}\t{line_id}"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(".mp3.part")
    temporary_path.unlink(missing_ok=True)
    voice = SPEAKER_VOICES[speaker]

    try:
        async with semaphore:
            communicator = edge_tts.Communicate(
                target["text"],
                voice=voice["voice"],
                rate=voice["rate"],
                pitch=voice["pitch"],
                volume=voice["volume"],
            )
            await communicator.save(str(temporary_path))
        if not temporary_path.is_file() or temporary_path.stat().st_size < MIN_PLAYABLE_BYTES:
            raise RuntimeError("Generated MP3 is empty or below the playable-size threshold.")
        os.replace(temporary_path, output_path)
        return "GENERATED", f"{index}/{total}\t{speaker}\t{line_id}\t{output_path.stat().st_size} bytes"
    except Exception as error:
        temporary_path.unlink(missing_ok=True)
        return "FAILED", f"{index}/{total}\t{speaker}\t{line_id}\t{error}"


async def main_async() -> int:
    args = parse_args()
    if args.concurrency < 1 or args.concurrency > 4:
        raise ValueError("--concurrency must be between 1 and 4.")

    targets = get_targets(args)
    if not targets:
        print("No canonical voice targets selected.")
        return 0

    print(f"Canonical targets selected: {len(targets)}")
    print(f"Overwrite existing playable clips: {args.overwrite}")
    semaphore = asyncio.Semaphore(args.concurrency)
    tasks = [
        synthesize_target(index, len(targets), target, args.overwrite, semaphore)
        for index, target in enumerate(targets, start=1)
    ]
    results = await asyncio.gather(*tasks)

    failures = 0
    for status, message in results:
        print(f"{status}\t{message}")
        if status == "FAILED":
            failures += 1

    print(f"Completed: {len(results) - failures} successful, {failures} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main_async()))
