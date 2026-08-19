#!/usr/bin/env python3
"""Generate Japanese and Simplified Chinese subtitles for every authored voice line.

The source line IDs are the canonical dialogue/voice sequence. Output is resumable so
an interrupted run never discards already validated translations.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "english_voice_lines.json"
OUTPUT = ROOT / "client/src/game/story/locales/dialogue.voice-lines.json"
CHUNK_SIZE = 18
MODEL = "gpt-5-mini"


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_output(entries: dict[str, dict[str, str]]) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    ordered = [entries[line_id] for line_id in sorted(entries)]
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(ordered, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def translate_chunk(client: OpenAI, chunk: list[dict[str, Any]]) -> list[dict[str, str]]:
    payload = [
        {
            "lineId": item["lineId"],
            "speaker": item["speaker"],
            "english": item["text"],
            "hebrewReference": item.get("heText", ""),
        }
        for item in chunk
    ]
    schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "dialogue_translations",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "translations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "lineId": {"type": "string"},
                                "ja": {"type": "string"},
                                "zh": {"type": "string"},
                            },
                            "required": ["lineId", "ja", "zh"],
                            "additionalProperties": False,
                        },
                    }
                },
                "required": ["translations"],
                "additionalProperties": False,
            },
        },
    }
    prompt = (
        "Translate every supplied game dialogue line into natural Japanese and natural Simplified Chinese. "
        "This is a fast pre-mission space-radio exchange in the game PROTECT THE STARSHIP. "
        "Keep each translation concise, expressive, culturally natural, and faithful to the speaker's personality. "
        "Use the Hebrew reference only to resolve meaning if English is generic or repetitive; do not output Hebrew. "
        "Preserve named characters and proper nouns appropriately. Do not add narration, labels, or explanations. "
        "Return every lineId exactly once.\n\nSOURCE LINES:\n"
        + json.dumps(payload, ensure_ascii=False)
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a professional Japanese and Simplified Chinese game localization editor. Output only the requested JSON."},
            {"role": "user", "content": prompt},
        ],
        max_completion_tokens=8000,
        response_format=schema,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("The translation model returned an empty response.")
    result = json.loads(content)
    translations = result["translations"]
    expected = {item["lineId"] for item in chunk}
    received = {item.get("lineId") for item in translations}
    if expected != received:
        raise RuntimeError(f"Translation IDs did not match the request. Missing={expected - received}; extra={received - expected}")
    if any(not item["ja"].strip() or not item["zh"].strip() for item in translations):
        raise RuntimeError("A translation was empty.")
    return translations


def main() -> int:
    source = load_json(SOURCE, [])
    if not isinstance(source, list) or not source:
        raise RuntimeError("Voice dialogue source is empty or invalid.")
    source_ids = [item["lineId"] for item in source]
    if len(source_ids) != len(set(source_ids)):
        raise RuntimeError("Voice dialogue source contains duplicate line IDs.")

    existing_list = load_json(OUTPUT, [])
    translated: dict[str, dict[str, str]] = {
        item["lineId"]: item
        for item in existing_list
        if isinstance(item, dict) and isinstance(item.get("lineId"), str)
        and isinstance(item.get("ja"), str) and isinstance(item.get("zh"), str)
        and item["ja"].strip() and item["zh"].strip()
    }
    pending = [item for item in source if item["lineId"] not in translated]
    print(f"Dialogue translation status: {len(translated)}/{len(source)} complete; {len(pending)} pending.")
    if not pending:
        return 0

    client = OpenAI()
    for start in range(0, len(pending), CHUNK_SIZE):
        chunk = pending[start:start + CHUNK_SIZE]
        for attempt in range(1, 4):
            try:
                output = translate_chunk(client, chunk)
                for item in output:
                    translated[item["lineId"]] = item
                write_output(translated)
                print(f"Translated {min(start + len(chunk), len(pending))}/{len(pending)} pending dialogue lines.")
                break
            except Exception as error:
                if attempt == 3:
                    raise
                print(f"Chunk retry {attempt}/3 after error: {error}", file=sys.stderr)
                time.sleep(attempt * 2)

    if set(translated) != set(source_ids):
        raise RuntimeError("Output does not contain exactly the voice dialogue source IDs.")
    write_output(translated)
    print(f"Wrote {len(translated)} dialogue translations to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
