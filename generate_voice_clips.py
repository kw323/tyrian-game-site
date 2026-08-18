import os
try:
    from gtts import gTTS
    print("gTTS available")
except ImportError:
    import subprocess
    subprocess.check_call(["sudo", "pip3", "install", "gtts"])
    from gtts import gTTS

clips = {
    "shield_warning": "Shield critical. Recharge required.",
    "generator_warning": "Generator overload. Power output dropping.",
    "time_lock_active": "Time lock engaged. Hostiles frozen.",
    "void_armor_active": "Void armor active. Damage absorbed.",
    "over_power_active": "Overpower surge online. Maximum fire rate.",
    "weapon_upgraded": "Weapon calibration upgraded successfully.",
    "stage_cleared": "Stage cleared. Preparing jump to next sector.",
    "boss_incoming": "Warning. Massive flagship signature detected."
}

os.makedirs("/home/ubuntu/tyrian-game-site/client/public/audio/voice", exist_ok=True)

for key, text in clips.items():
    tts = gTTS(text=text, lang='en', tld='com')
    out_path = f"/home/ubuntu/tyrian-game-site/client/public/audio/voice/{key}.mp3"
    tts.save(out_path)
    print(f"Generated voice clip: {out_path}")

print("All English gameplay voice clips generated successfully.")
