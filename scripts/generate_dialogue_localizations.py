#!/usr/bin/env python3
"""Generate canonical multilingual dialogue from the Hebrew story source.

Each line in english_voice_lines.json has a stable lineId and Hebrew text authored for the
campaign. Hebrew is the authoritative plot and speaker source. English, Japanese, and
Simplified Chinese are regenerated from that Hebrew line so subtitles and voice-over
always describe the same event in the same sequence.
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
CHUNK_SIZE = 10
MODEL = "gpt-5-mini"


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_output(entries: dict[str, dict[str, str]], source_ids: list[str]) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    ordered = [entries[line_id] for line_id in source_ids]
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(ordered, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def translate_chunk(client: OpenAI, chunk: list[dict[str, Any]]) -> list[dict[str, str]]:
    payload = [
        {
            "lineId": item["lineId"],
            "stage": item["stage"],
            "speaker": item["speaker"],
            "hebrew": item["heText"],
        }
        for item in chunk
    ]
    schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "canonical_dialogue_translations",
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
                                "en": {"type": "string"},
                                "ja": {"type": "string"},
                                "zh": {"type": "string"},
                            },
                            "required": ["lineId", "en", "ja", "zh"],
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
        "The Hebrew dialogue below is the canonical story source for PROTECT THE STARSHIP. "
        "For every line, create one English, one Japanese, and one Simplified Chinese localization. "
        "The three translations must preserve the exact story meaning, intent, speaker identity, and line-by-line sequence of the Hebrew source. "
        "Do not use, infer from, or preserve any older English script. Adapt naturally for each culture, but never add facts, threats, jokes, or emotional beats absent from Hebrew. "
        "This is concise spoken space-radio dialogue: retain the line's brevity and personality. "
        "Keep proper names and Program Zero consistent. Return each lineId exactly once and output no narration or explanations.\n\n"
        "CANONICAL HEBREW LINES:\n"
        + json.dumps(payload, ensure_ascii=False)
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a meticulous professional game localization editor. Hebrew is the sole canonical source. Output only the requested JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        max_completion_tokens=12000,
        response_format=schema,
    )
    if not response.choices:
        error = getattr(response, "error", None) or "unknown provider error"
        raise RuntimeError(f"The translation model returned no choices for this chunk: {error}")
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("The translation model returned an empty response.")
    result = json.loads(content)
    translations = result["translations"]
    expected = {item["lineId"] for item in chunk}
    received = {item.get("lineId") for item in translations}
    if expected != received:
        raise RuntimeError(f"Translation IDs did not match the request. Missing={expected - received}; extra={received - expected}")
    for item in translations:
        if any(not item[key].strip() for key in ("en", "ja", "zh")):
            raise RuntimeError(f"An output translation was empty for {item['lineId']}.")
    return translations


def main() -> int:
    source = load_json(SOURCE, [])
    if not isinstance(source, list) or not source:
        raise RuntimeError("Voice dialogue source is empty or invalid.")
    source_ids = [item.get("lineId") for item in source]
    if any(not isinstance(line_id, str) or not line_id for line_id in source_ids):
        raise RuntimeError("Voice dialogue source contains a missing line ID.")
    if len(source_ids) != len(set(source_ids)):
        raise RuntimeError("Voice dialogue source contains duplicate line IDs.")
    missing_hebrew = [item["lineId"] for item in source if not isinstance(item.get("heText"), str) or not item["heText"].strip()]
    if missing_hebrew:
        raise RuntimeError(f"Hebrew canonical source is missing for: {', '.join(missing_hebrew)}")

    existing = load_json(OUTPUT, [])
    canonical: dict[str, dict[str, str]] = {
        item["lineId"]: item
        for item in existing
        if isinstance(item, dict)
        and isinstance(item.get("lineId"), str)
        and isinstance(item.get("en"), str) and item["en"].strip()
        and isinstance(item.get("ja"), str) and item["ja"].strip()
        and isinstance(item.get("zh"), str) and item["zh"].strip()
        and item["lineId"] in source_ids
    }
    pending = [item for item in source if item["lineId"] not in canonical]
    print(f"Canonical localization status: {len(canonical)}/{len(source)} complete; {len(pending)} pending.")
    client = OpenAI()
    for start in range(0, len(pending), CHUNK_SIZE):
        chunk = pending[start:start + CHUNK_SIZE]
        for attempt in range(1, 4):
            try:
                translations = translate_chunk(client, chunk)
                for item in translations:
                    canonical[item["lineId"]] = item
                write_output(canonical, [line_id for line_id in source_ids if line_id in canonical])
                print(f"Localized {len(canonical)}/{len(source)} canonical Hebrew lines.")
                break
            except Exception as error:
                if attempt == 3:
                    raise
                print(f"Chunk retry {attempt}/3 after error: {error}", file=sys.stderr)
                time.sleep(attempt * 2)

    if set(canonical) != set(source_ids):
        raise RuntimeError("Output does not contain exactly the Hebrew canonical source IDs.")
    write_output(canonical, source_ids)
    print(f"Wrote {len(canonical)} Hebrew-canonical localizations to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
