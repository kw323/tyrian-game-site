#!/usr/bin/env python3
"""Apply a subtle radio treatment to Ghost's regenerated canonical dialogue clips."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "english_voice_lines.json"
GHOST_VOICE_ROOT = PROJECT_ROOT / "client" / "public" / "voices" / "en" / "ghost"
MIN_PLAYABLE_BYTES = 1024


def main() -> int:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required for Ghost's radio treatment.")

    with MANIFEST_PATH.open("r", encoding="utf-8") as source:
        manifest = json.load(source)
    canonical_ids = [
        str(item.get("lineId") or "").strip()
        for item in manifest
        if isinstance(item, dict) and str(item.get("speaker") or "").strip().lower() == "ghost"
    ]
    clips = [GHOST_VOICE_ROOT / f"{line_id}.mp3" for line_id in canonical_ids if line_id]
    if not clips:
        raise RuntimeError("No canonical Ghost voice clips were found.")

    # Narrow the voice frequency range slightly and use a very light tremolo.
    # The effect should read as encrypted ship comms, not as a robotic voice.
    filters = "highpass=f=260,lowpass=f=4200,acompressor=threshold=-19dB:ratio=2:attack=20:release=180,tremolo=f=7:d=0.05"
    completed = 0
    for clip in clips:
        temporary = clip.with_suffix(".radio.mp3")
        temporary.unlink(missing_ok=True)
        command = [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(clip),
            "-af",
            filters,
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "3",
            str(temporary),
        ]
        subprocess.run(command, check=True)
        if not temporary.is_file() or temporary.stat().st_size < MIN_PLAYABLE_BYTES:
            raise RuntimeError(f"Radio treatment failed for {clip.name}.")
        temporary.replace(clip)
        completed += 1

    print(f"Applied radio treatment to {completed} Ghost clips.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
