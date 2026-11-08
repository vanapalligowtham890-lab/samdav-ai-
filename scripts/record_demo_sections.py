import os
import sys
import time
import wave
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')
api_key = os.getenv('GNANI_API_KEY')
if not api_key:
    print("Error: GNANI_API_KEY not found in .env.local")
    sys.exit(1)

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_AUDIO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_audio')
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'Vaani_Recap_Demo_Recording')

os.makedirs(PUBLIC_AUDIO_DIR, exist_ok=True)
os.makedirs(DESKTOP_DIR, exist_ok=True)

# Perfectly calibrated 5 sections that run strictly below 3 minutes (~2m 34s total)
SECTIONS = [
    {
        "id": "section_1_intro",
        "title": "Section 1 — Introduction & The SMB Problem",
        "screen": "Landing Page (/)",
        "action": "Start on homepage. Show header logo, problem headline, voice audition chips, and Gnani attribution.",
        "script": (
            "Hello judges! I am Gowtham, presenting Vaani Recap — an autonomous multilingual AI cold calling "
            "and lead briefing agent built for over 63 million Indian SMBs. Vaani Recap automates outbound calling, "
            "transcribes regional calls, and delivers an audio evening recap under 60 words."
        )
    },
    {
        "id": "section_2_dashboard",
        "title": "Section 2 — Live Dashboard & Outbound Dialing",
        "screen": "Dashboard (/today)",
        "action": "Navigate to Dashboard. Highlight Verified Caller ID (+91 98765 43210), 6 live metrics, and click 'Dial Next Prospect'.",
        "script": (
            "Here is the live Dashboard. Outbound calls route through the owner's verified forwarding number, "
            "showing a trusted caller ID. When I click Dial Next Prospect, the AI agent initiates the cold call "
            "using our sector campaign script and engages the customer."
        )
    },
    {
        "id": "section_3_recordings",
        "title": "Section 3 — Call Recordings & Multi-Voice Dialogue",
        "screen": "Recordings & Transcripts (/calls)",
        "action": "Click Recordings. Hit Play on a call to hear contrasting agent & customer voices. Point out verbatim STT transcript & budget.",
        "script": (
            "In Recordings, every call is synthesized using Gnani Timbre v3.0 with distinct, contrasting voices "
            "for agent and customer without repetition. Simultaneously, Gnani Prisma STT transcribes the call, "
            "capturing customer intent and budget."
        )
    },
    {
        "id": "section_4_spoken_recap",
        "title": "Section 4 — Spoken Evening Brief & Lead Card",
        "screen": "Dashboard & Lead Card (/leads/[id])",
        "action": "Click Play on Today's Spoken Recap (<60 words). Click 'View lead card' to show extracted quotes & one-click WhatsApp.",
        "script": (
            "At day end, owners listen to our Spoken Evening Brief under 60 words, synthesized with Gnani Timbre, "
            "highlighting won deals and callbacks. Clicking any prospect opens their structured Lead Card with objection "
            "quotes and a one-click WhatsApp follow-up."
        )
    },
    {
        "id": "section_5_settings_conclusion",
        "title": "Section 5 — 10 Language Modes & Submission Closing",
        "screen": "Settings (/settings)",
        "action": "Show 10 Indian Language Modes, 16+ Timbre voices, SQLite zero-billing cache, and close with thank you.",
        "script": (
            "In Settings, Vaani Recap supports 10 Indian language modes across Telugu, Hinglish, Hindi, and Tamil, "
            "with over 16 verified Gnani Timbre voices. Audio hashes are cached in SQLite for zero duplicate billing. Thank you!"
        )
    }
]

def synthesize_chunk(text, voice="Harshad", language="en-IN"):
    url = "https://api.vachana.ai/api/v1/tts/inference"
    headers = {
        "X-API-Key-ID": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "voice": voice,
        "language": language,
        "model": "timbre-v3.0",
        "audio_config": {
            "audio_encoding": "LINEAR16",
            "sample_rate_hertz": 24000
        }
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code != 200:
        raise Exception(f"API Error {resp.status_code}: {resp.text}")
    return resp.content

def save_wav(pcm_data, filepath, sample_rate=24000):
    with wave.open(filepath, 'wb') as wav:
        wav.setnchannels(1)      # Mono
        wav.setsampwidth(2)      # 16-bit
        wav.setframerate(sample_rate)
        wav.writeframes(pcm_data)

def get_wav_duration_seconds(filepath):
    with wave.open(filepath, 'rb') as wav:
        frames = wav.getnframes()
        rate = wav.getframerate()
        return frames / float(rate)

def main():
    print("=" * 70)
    print("VAANI RECAP — RECORDING ALL SECTIONS (STRICTLY BELOW 3 MINUTES)")
    print("Target Duration: ~2 minutes 34 seconds (under 180s)")
    print("=" * 70)

    all_pcm = []
    pause_pcm = b'\x00\x00' * int(24000 * 0.8) # 800ms natural breathing pause between sections
    manifest = []
    current_time_cursor = 0.0

    for idx, sec in enumerate(SECTIONS, 1):
        print(f"\n[{idx}/5] Recording: {sec['title']}...")
        pcm = synthesize_chunk(sec['script'], voice="Harshad", language="en-IN")
        
        # Save individual section WAV
        pub_path = os.path.join(PUBLIC_AUDIO_DIR, f"{sec['id']}.wav")
        desk_path = os.path.join(DESKTOP_DIR, f"{sec['id']}.wav")
        save_wav(pcm, pub_path)
        save_wav(pcm, desk_path)
        
        duration = get_wav_duration_seconds(pub_path)
        start_min, start_sec = int(current_time_cursor // 60), int(current_time_cursor % 60)
        end_time = current_time_cursor + duration
        end_min, end_sec = int(end_time // 60), int(end_time % 60)
        time_slot = f"{start_min}:{start_sec:02d} - {end_min}:{end_sec:02d}"

        print(f"      Time Slot: {time_slot} ({duration:.1f}s)")
        print(f"      Screen:    {sec['screen']}")
        print(f"      Audio:     {sec['id']}.wav")

        manifest.append({
            "id": sec['id'],
            "title": sec['title'],
            "time_slot": time_slot,
            "start_seconds": round(current_time_cursor, 1),
            "end_seconds": round(end_time, 1),
            "duration": round(duration, 1),
            "screen": sec['screen'],
            "action": sec['action'],
            "script": sec['script'],
            "filename": f"{sec['id']}.wav",
            "url": f"/demo_audio/{sec['id']}.wav"
        })

        all_pcm.append(pcm)
        current_time_cursor = end_time
        if idx < len(SECTIONS):
            all_pcm.append(pause_pcm)
            current_time_cursor += 0.8
        
        time.sleep(0.4)

    # Save Full Continuous Merged Narration
    combined_pcm = b''.join(all_pcm)
    full_pub_path = os.path.join(PUBLIC_AUDIO_DIR, "vaani_recap_full_demo_narration.wav")
    full_desk_path = os.path.join(DESKTOP_DIR, "vaani_recap_full_demo_narration.wav")
    save_wav(combined_pcm, full_pub_path)
    save_wav(combined_pcm, full_desk_path)

    full_duration = get_wav_duration_seconds(full_pub_path)
    mins = int(full_duration // 60)
    secs = int(full_duration % 60)

    print("\n" + "=" * 70)
    print("VERIFICATION & TIMING AUDIT:")
    print("=" * 70)
    print(f"TOTAL DURATION: {full_duration:.1f} seconds ({mins}m {secs:02d}s)")
    if full_duration < 180.0:
        print(f"STATUS: VERIFIED! STRICTLY BELOW 3 MINUTES ({full_duration:.1f}s < 180s)!")
    else:
        print(f"STATUS: ERROR! Exceeds 3 minutes!")

    # Save manifest.json
    manifest_data = {
        "title": "Vaani Recap Video Demo Narration",
        "voice": "Gnani Timbre v3.0 Harshad (Indian English)",
        "total_duration_seconds": round(full_duration, 1),
        "total_duration_formatted": f"{mins}:{secs:02d}",
        "target_limit": "Below 3 minutes (< 180s)",
        "full_audio_filename": "vaani_recap_full_demo_narration.wav",
        "full_audio_url": "/demo_audio/vaani_recap_full_demo_narration.wav",
        "sections": manifest
    }
    with open(os.path.join(PUBLIC_AUDIO_DIR, 'manifest.json'), 'w') as f:
        json.dump(manifest_data, f, indent=2)
    with open(os.path.join(DESKTOP_DIR, 'manifest.json'), 'w') as f:
        json.dump(manifest_data, f, indent=2)

    print(f"\nManifest saved to both project and desktop.")
    return manifest_data

if __name__ == '__main__':
    main()
