# English dubbing audit — 2026-08-17

## Findings

- The repository contains 202 English MP3 files under `client/public/voices/en/`.
- `english_voice_lines.json` contains 404 records but only 202 unique line IDs. Each `stage-N-contact` and `stage-N-after` ID appears twice; the later records overwrite the earlier records in `VoiceManifest`.
- The MP3 files are real MPEG Layer III audio at 24 kHz mono, not empty placeholder files in every case.
- `stage-1-contact.mp3` transcribed as: “Pilot, this is the experimental craft. Orders come from me alone.” This matches the updated English meaning for stage 1 Commander Elena.
- `stage-1-after.mp3` transcribed as: “Look at her. Absolute perfection. Touch her with dirty hands and I will break your finger.” This matches the updated English meaning for stage 1 Dr. Naomi.
- `stage-101-contact.mp3` is 1.8 seconds long and produced an empty transcription, despite the manifest text being a long Ghost line about the Archon Mothership. This is a confirmed mismatch or unusable audio sample.
- The audit therefore does not support claiming that all English dubbing is synchronized. At least the stage 101 Ghost asset needs replacement, and the duplicate manifest records need cleanup before a complete 1:1 audit can be trusted.

## Runtime note

`VoicePlaybackManager` loads `/voices/en/<speaker>/<lineId>.mp3`; the current game UI requests only `stage-<level>-contact` and `stage-<level>-after`. The manifest must therefore have one authoritative record per ID and the corresponding MP3 must contain the same English text.

## Recommended next action

Regenerate the confirmed-bad files first, then run a batch audio transcription/duration audit for all 202 IDs before saving a new checkpoint.

