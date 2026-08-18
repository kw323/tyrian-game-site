import os
try:
    from gtts import gTTS
except ImportError:
    os.system('pip3 install gTTS')
    from gtts import gTTS

pilot_lines = [
    {"lineId": "stage-1-contact", "speaker": "elena", "text": "Pilot, this is the experimental craft. Orders come from me alone."},
    {"lineId": "stage-1-after", "speaker": "naomi", "text": "Look at her. Absolute perfection. Touch her with dirty hands and I will break your finger."},
    {"lineId": "stage-2-contact", "speaker": "elena", "text": "Pirate raiders ahead. By military decree—destroy them."},
    {"lineId": "stage-2-after", "speaker": "naomi", "text": "My weapon systems are the sharpest in the galaxy. Use them properly."},
    {"lineId": "stage-3-contact", "speaker": "elena", "text": " Sector secure. Maintain tactical readiness and keep weapon energy stable."},
    {"lineId": "stage-3-after", "speaker": "naomi", "text": "Energy levels stable. Do not push the generator beyond its thermal limits."},
    {"lineId": "stage-4-contact", "speaker": "elena", "text": "Patrol route compromised. Clear all hostile signatures immediately."},
    {"lineId": "stage-4-after", "speaker": "naomi", "text": "Shield integrity holding at ninety percent. Good enough for now."},
    {"lineId": "stage-5-contact", "speaker": "elena", "text": "Approaching the outer perimeter of Arc-9. Watch your flanks."},
    {"lineId": "stage-5-after", "speaker": "naomi", "text": "Arc-9 sensors are picking up heavy military traffic. Stay alert."}
]

def generate_audio():
    base_dir = '/home/ubuntu/tyrian-game-site/client/public/voices/en'
    
    for item in pilot_lines:
        speaker = item['speaker']
        line_id = item['lineId']
        text = item['text']
        
        speaker_dir = os.path.join(base_dir, speaker)
        os.makedirs(speaker_dir, exist_ok=True)
        
        file_path = os.path.join(speaker_dir, f"{line_id}.mp3")
        print(f"Generating audio for {line_id} ({speaker}): '{text}'")
        
        try:
            tts = gTTS(text=text, lang='en', slow=False)
            tts.save(file_path)
            print(f"Saved: {file_path}")
        except Exception as e:
            print(f"Error generating {line_id}: {e}")

if __name__ == '__main__':
    generate_audio()
