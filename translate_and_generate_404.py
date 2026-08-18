import concurrent.futures
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path

from openai import OpenAI

try:
    from gtts import gTTS
except ImportError as exc:
    raise SystemExit("gTTS is required. Install it with: sudo pip3 install gTTS") from exc

ROOT = Path('/home/ubuntu/tyrian-game-site')
SOURCE = ROOT / 'english_voice_lines.json'
TRANSLATED = ROOT / 'english_voice_lines_clean.json'
AUDIO_ROOT = ROOT / 'client/public/voices/en'
MODEL = 'gpt-5-mini'
EXPECTED = 404
HEBREW_RE = re.compile(r'[\u0590-\u05FF]')

VOICE_STYLE = {
    'elena': 'authoritative, calm military commander; concise and controlled',
    'naomi': 'brilliant spacecraft scientist; sharp, affectionate, sarcastic humor',
    'ghost': 'low, dry, cryptic space informant; restrained wit',
    'sera': 'confident, competitive test pilot; guarded but emotionally honest',
    'protagonist': 'calm, understated pilot; brief and observant replies',
    'archon': 'deep, intimidating alien ruler; measured and alien in tone',
}


def load_source():
    data = json.loads(SOURCE.read_text(encoding='utf-8'))
    if len(data) != EXPECTED:
        raise RuntimeError(f'Expected exactly {EXPECTED} source lines, found {len(data)}')
    ids = [item.get('lineId') for item in data]
    if any(not item for item in ids) or len(set(ids)) != EXPECTED:
        raise RuntimeError('Source line IDs are missing or duplicated')
    if any(not item.get('speaker') for item in data):
        raise RuntimeError('One or more source lines have no speaker')
    return data


def translate_one(item, client):
    speaker = item['speaker']
    style = VOICE_STYLE.get(speaker, 'natural cinematic game dialogue')
    source_text = item.get('text', '').strip()
    if not source_text:
        raise RuntimeError(f"Empty source text for {item['lineId']}")

    system = (
        'You are the lead English dialogue translator for a bilingual space-shooter campaign. '
        'Translate one complete line from Hebrew into natural spoken English. Preserve the full meaning, '
        'all details, names, jokes, emotional intent, punctuation, and approximate length. Never summarize, '
        'shorten, omit, invent, or answer the line. Return only the English dialogue text, with no quotation marks, '
        'stage directions, labels, notes, or Hebrew characters.'
    )
    user = (
        f"Speaker: {speaker}\n"
        f"Voice direction: {style}\n"
        f"Line ID: {item['lineId']}\n"
        f"Source line:\n{source_text}\n\n"
        'Translate the entire source line into English now.'
    )

    last_error = None
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{'role': 'system', 'content': system}, {'role': 'user', 'content': user}],
                max_completion_tokens=400,
            )
            translated = (response.choices[0].message.content or '').strip()
            translated = translated.strip('"“”')
            if not translated:
                raise RuntimeError('empty model response')
            if HEBREW_RE.search(translated):
                raise RuntimeError('model response still contains Hebrew characters')
            return {**item, 'text': translated, 'sourceText': source_text, 'translationModel': MODEL}
        except Exception as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Translation failed for {item['lineId']}: {last_error}")


def translate_all(items):
    client = OpenAI()
    translated = [None] * len(items)
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(translate_one, item, client): index for index, item in enumerate(items)}
        for future in concurrent.futures.as_completed(futures):
            index = futures[future]
            try:
                translated[index] = future.result()
                if (index + 1) % 25 == 0:
                    print(f'Translated {index + 1}/{len(items)} lines', flush=True)
            except Exception as exc:
                failures.append(str(exc))
    if failures:
        raise RuntimeError('Translation stopped; no audio was generated.\n' + '\n'.join(failures))
    if len(translated) != EXPECTED or any(item is None for item in translated):
        raise RuntimeError('Translation produced fewer than 404 complete records')
    if any(HEBREW_RE.search(item['text']) for item in translated):
        raise RuntimeError('Translated output still contains Hebrew characters')
    TRANSLATED.write_text(json.dumps(translated, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return translated


def generate_audio(items):
    AUDIO_ROOT.mkdir(parents=True, exist_ok=True)
    failures = []
    for index, item in enumerate(items, 1):
        speaker = re.sub(r'[^a-z0-9_-]', '', item['speaker'].lower()) or 'unknown'
        line_id = item['lineId']
        path = AUDIO_ROOT / speaker / f'{line_id}.mp3'
        path.parent.mkdir(parents=True, exist_ok=True)
        if HEBREW_RE.search(item['text']):
            failures.append(f'{line_id}: Hebrew remained before TTS')
            continue
        temporary = Path(tempfile.mkstemp(prefix=f'{line_id}-', suffix='.mp3', dir=path.parent)[1])
        try:
            gTTS(text=item['text'], lang='en', slow=False).save(str(temporary))
            if not temporary.exists() or temporary.stat().st_size < 512:
                raise RuntimeError('generated audio is missing or suspiciously small')
            os.replace(temporary, path)
        except Exception as exc:
            failures.append(f'{line_id}: {exc}')
            temporary.unlink(missing_ok=True)
        if index % 25 == 0:
            print(f'Generated {index}/{len(items)} audio files', flush=True)
        time.sleep(0.08)
    if failures:
        raise RuntimeError('Audio generation failed for one or more lines:\n' + '\n'.join(failures))


def verify(items):
    expected = set()
    for item in items:
        speaker = re.sub(r'[^a-z0-9_-]', '', item['speaker'].lower()) or 'unknown'
        expected.add(str(AUDIO_ROOT / speaker / f"{item['lineId']}.mp3"))
    actual = {
        str(path) for path in AUDIO_ROOT.rglob('*.mp3')
        if path.is_file()
    }
    missing = sorted(expected - actual)
    empty = sorted(path for path in expected if Path(path).exists() and Path(path).stat().st_size < 512)
    if missing or empty or len(expected) != EXPECTED:
        raise RuntimeError(f'Verification failed: expected={len(expected)}, missing={len(missing)}, undersized={len(empty)}')
    print(f'VERIFIED: {len(expected)} unique English MP3 paths exist and are non-empty')


def main():
    items = load_source()
    print(f'Loaded exactly {len(items)} source lines')
    translated = translate_all(items)
    print(f'Wrote clean English source: {TRANSLATED}')
    generate_audio(translated)
    verify(translated)
    print('COMPLETE: 404/404 lines translated and voiced without skipping')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'FATAL: {exc}', file=sys.stderr)
        raise
