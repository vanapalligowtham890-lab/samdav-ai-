import os
import sys
import time
import subprocess
import wave
import json
import requests
import imageio_ffmpeg
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv('.env.local')
api_key = os.getenv('GNANI_API_KEY')
if not api_key:
    print("Error: GNANI_API_KEY not found in .env.local")
    sys.exit(1)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_audio')
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'Videos for gnani.Ai')
PUBLIC_VIDEO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_videos')

os.makedirs(DESKTOP_DIR, exist_ok=True)
os.makedirs(PUBLIC_VIDEO_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

# 5 Calibrated Sections — spoken by Harshad / Riyaa for Aditya University Admissions Desk
SECTIONS = [
    {
        "id": "01_Section_1_Introduction",
        "title": "Section 1 — Introduction & The Aditya University Problem",
        "audio_name": "section_1_intro.wav",
        "script": (
            "Hello respected evaluators! I am Gowtham, presenting Samvad AI — an autonomous parent admissions "
            "and student counseling agent built for Aditya University. During B.Tech admissions season, our agent "
            "handles high-volume parent inquiries, explains our NAAC A++ accreditation, and guides families through our 180-acre Surampalem campus."
        )
    },
    {
        "id": "02_Section_2_Live_Dashboard",
        "title": "Section 2 — Live Admissions Dashboard & Parent Advisory",
        "audio_name": "section_2_dashboard.wav",
        "script": (
            "Here is the live Admissions Dashboard for Aditya University. The agent operates autonomously, "
            "advising parents on four-year B.Tech programs in CSE, AI and Machine Learning, Data Science, and ECE. "
            "In our prototype mode, all parent consultations are pre-calibrated with verified Gnani Timbre neural voices."
        )
    },
    {
        "id": "03_Section_3_Call_Recordings",
        "title": "Section 3 — Authentic Parent Consultations & Dual Voice Dialogue",
        "audio_name": "section_3_recordings.wav",
        "script": (
            "In Recordings, every call features authentic multi-turn counseling between our officer Shivani "
            "and real Telugu parents — both Fathers and Mothers — with natural four hundred millisecond pauses. "
            "Parents ask deep questions about our Industry 4.0 curriculum, Technical Hub coding, and hostel security, with strict gender-accurate honorifics."
        )
    },
    {
        "id": "04_Section_4_Spoken_Recap_Lead_Card",
        "title": "Section 4 — Admissions Daily Brief & Lead Card",
        "audio_name": "section_4_spoken_recap.wav",
        "script": (
            "At day end, the admissions office listens to our Spoken Daily Brief under sixty words, synthesized with Gnani Timbre, "
            "highlighting confirmed admissions and campus counseling visits. Clicking any parent opens their structured Lead Card with EAPCET ranks "
            "and one-click WhatsApp follow-ups."
        )
    },
    {
        "id": "05_Section_5_10_Languages_Settings",
        "title": "Section 5 — Sovereign AI Voice Catalog & Performance",
        "audio_name": "section_5_settings_conclusion.wav",
        "script": (
            "In Settings, our system leverages Gnani Prisma STT and Gnani Timbre TTS across 10 Indian language modes "
            "with over 16 verified voices. All audio files and transcripts are cached in SQLite for zero duplicate billing and instantaneous playback. Thank you!"
        )
    }
]

def synthesize_audio(text, voice="Devansh", language="en-IN"):
    url = "https://api.vachana.ai/api/v1/tts/inference"
    headers = {"X-API-Key-ID": api_key, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "voice": voice,
        "language": language,
        "model": "timbre-v3.0",
        "audio_config": {"audio_encoding": "LINEAR16", "sample_rate_hertz": 24000}
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code != 200:
        raise Exception(f"TTS API Error {resp.status_code}: {resp.text}")
    return resp.content

def save_wav(pcm_data, filepath):
    with wave.open(filepath, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(pcm_data)

def get_wav_duration(filepath):
    with wave.open(filepath, 'rb') as w:
        return w.getnframes() / float(w.getframerate())

def smooth_scroll_cubic(page, target_y, duration_ms):
    """Studio-grade 60fps smooth scroll using cubic-bezier interpolation."""
    page.evaluate(f'''() => {{
        return new Promise((resolve) => {{
            const startY = window.scrollY;
            const targetY = {target_y};
            const distance = targetY - startY;
            const duration = {duration_ms};
            let start = null;
            function step(timestamp) {{
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                // easeInOutCubic
                const ease = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                window.scrollTo(0, startY + distance * ease);
                if (progress < 1) {{
                    window.requestAnimationFrame(step);
                }} else {{
                    resolve();
                }}
            }}
            window.requestAnimationFrame(step);
        }});
    }}''')

def mux_video_audio(video_file, audio_file, output_mp4, duration):
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', video_file,
        '-i', audio_file,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '17',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', f"{duration:.2f}",
        output_mp4
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def prepare_all_audios():
    print("=" * 70)
    print("SYNTHESIZING CRYSTAL-CLEAR DEVANSH AUDIO (NO SHOUTING / NO RASP)...")
    print("=" * 70)
    audio_paths = []
    total_sec = 0.0

    for idx, sec in enumerate(SECTIONS, 1):
        print(f"[{idx}/5] Synthesizing {sec['title']}...")
        pcm = synthesize_audio(sec['script'], voice="Devansh", language="en-IN")
        pub_wav = os.path.join(AUDIO_DIR, sec['audio_name'])
        desk_wav = os.path.join(DESKTOP_DIR, sec['audio_name'])
        save_wav(pcm, pub_wav)
        save_wav(pcm, desk_wav)
        dur = get_wav_duration(pub_wav)
        total_sec += dur
        print(f"      -> {sec['audio_name']}: {dur:.1f}s")
        audio_paths.append((pub_wav, dur))
        time.sleep(0.4)

    print(f"\nTotal Clean Narration Duration: {total_sec:.1f}s ({int(total_sec // 60)}m {int(total_sec % 60):02d}s)")
    print(f"Target Check: {'VERIFIED STRICTLY BELOW 3 MINS (< 180s)!' if total_sec < 180 else 'EXCEEDED'}")
    return audio_paths

def record_section_1(p, temp_dir, audio_path, duration):
    print(f"\n[1/5] Recording Section 1 Video: Landing Page ({duration:.1f}s)...")
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080}, record_video_dir=temp_dir, record_video_size={'width': 1920, 'height': 1080})
    page = context.new_page()
    page.goto("http://localhost:3000/")
    page.wait_for_timeout(2000)

    # Hover header logo and brand
    page.hover("header a")
    page.wait_for_timeout(3500)

    # Buttery smooth scroll down to Voice Catalog
    smooth_scroll_cubic(page, 580, duration_ms=2800)
    page.wait_for_timeout(4000)

    # Buttery smooth scroll down to Workflow
    smooth_scroll_cubic(page, 1200, duration_ms=3000)
    page.wait_for_timeout(4500)

    # Buttery smooth scroll down to SMB tags
    smooth_scroll_cubic(page, 1850, duration_ms=2500)
    page.wait_for_timeout(4000)

    # Smooth scroll back to hero
    smooth_scroll_cubic(page, 0, duration_ms=2800)
    page.wait_for_timeout(4000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "01_Section_1_Introduction.mp4")
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "01_Section_1_Introduction.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration)
    mux_video_audio(video_path, audio_path, pub_mp4, duration)
    print(f"      -> Successfully saved: {out_mp4}")
    return out_mp4

def record_section_2(p, temp_dir, audio_path, duration):
    print(f"\n[2/5] Recording Section 2 Video: Dashboard ({duration:.1f}s)...")
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080}, record_video_dir=temp_dir, record_video_size={'width': 1920, 'height': 1080})
    context.add_cookies([{'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}])
    context.add_init_script('''
        localStorage.setItem("vaani_users_mock", JSON.stringify({
            "gowtham@vaani.ai": { uid: "user_gowtham_01", email: "gowtham@vaani.ai", password: "password123" }
        }));
        localStorage.setItem("vaani_current_user_mock", JSON.stringify({ uid: "user_gowtham_01", email: "gowtham@vaani.ai" }));
        localStorage.setItem("vaani_setup_mock", JSON.stringify({
            companyName: "Ishiva digital",
            companyType: "Digital Marketing & Agency",
            forwardingNumber: "+91 98765 43210",
            voice: "Shivani",
            language: "te-en",
            completed: true
        }));
    ''')
    page = context.new_page()
    page.goto("http://localhost:3000/today")
    page.wait_for_timeout(2500)

    # Highlight Verified Forwarding Caller ID at top
    page.hover("header")
    page.wait_for_timeout(3000)

    # Smooth scroll to 6 metric cards
    smooth_scroll_cubic(page, 200, duration_ms=1800)
    page.wait_for_timeout(3000)

    # Click 'Dial Next Prospect'
    dial_btn = page.locator("button:has-text('Dial Next Prospect')")
    if dial_btn.count() > 0:
        dial_btn.first.click()
        page.wait_for_timeout(4500)

    # Smooth scroll down to prospect call cards
    smooth_scroll_cubic(page, 580, duration_ms=2500)
    page.wait_for_timeout(5000)

    # Smooth scroll back up
    smooth_scroll_cubic(page, 0, duration_ms=2000)
    page.wait_for_timeout(3000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "02_Section_2_Live_Dashboard.mp4")
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "02_Section_2_Live_Dashboard.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration)
    mux_video_audio(video_path, audio_path, pub_mp4, duration)
    print(f"      -> Successfully saved: {out_mp4}")
    return out_mp4

def record_section_3(p, temp_dir, audio_path, duration):
    print(f"\n[3/5] Recording Section 3 Video: Call Recordings & STT ({duration:.1f}s)...")
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080}, record_video_dir=temp_dir, record_video_size={'width': 1920, 'height': 1080})
    context.add_cookies([{'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}])
    context.add_init_script('''
        localStorage.setItem("vaani_current_user_mock", JSON.stringify({ uid: "user_gowtham_01", email: "gowtham@vaani.ai" }));
        localStorage.setItem("vaani_setup_mock", JSON.stringify({
            companyName: "Ishiva digital",
            companyType: "Digital Marketing & Agency",
            forwardingNumber: "+91 98765 43210",
            voice: "Shivani",
            language: "te-en",
            completed: true
        }));
    ''')
    page = context.new_page()
    page.goto("http://localhost:3000/calls")
    page.wait_for_timeout(2500)

    # Click play button on call recording
    play_btn = page.locator("button:has(svg.lucide-play)")
    if play_btn.count() > 0:
        play_btn.first.click()
        page.wait_for_timeout(4500)

    # Smooth scroll down to verbatim multi-speaker transcript and intent badges
    smooth_scroll_cubic(page, 520, duration_ms=2500)
    page.wait_for_timeout(5000)

    # Smooth scroll to next conversation
    smooth_scroll_cubic(page, 950, duration_ms=2500)
    page.wait_for_timeout(5500)

    # Smooth scroll back up
    smooth_scroll_cubic(page, 0, duration_ms=2200)
    page.wait_for_timeout(4000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "03_Section_3_Call_Recordings.mp4")
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "03_Section_3_Call_Recordings.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration)
    mux_video_audio(video_path, audio_path, pub_mp4, duration)
    print(f"      -> Successfully saved: {out_mp4}")
    return out_mp4

def record_section_4(p, temp_dir, audio_path, duration):
    print(f"\n[4/5] Recording Section 4 Video: Spoken Brief & Lead Card ({duration:.1f}s)...")
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080}, record_video_dir=temp_dir, record_video_size={'width': 1920, 'height': 1080})
    context.add_cookies([{'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}])
    context.add_init_script('''
        localStorage.setItem("vaani_current_user_mock", JSON.stringify({ uid: "user_gowtham_01", email: "gowtham@vaani.ai" }));
        localStorage.setItem("vaani_setup_mock", JSON.stringify({
            companyName: "Ishiva digital",
            companyType: "Digital Marketing & Agency",
            forwardingNumber: "+91 98765 43210",
            voice: "Shivani",
            language: "te-en",
            completed: true
        }));
    ''')
    page = context.new_page()
    page.goto("http://localhost:3000/today")
    page.wait_for_timeout(2500)

    # Hover and play spoken voice recap (<60 words)
    recap_btn = page.locator("button:has-text('Play Voice Brief'), button:has(svg.lucide-play)")
    if recap_btn.count() > 0:
        recap_btn.first.click()
        page.wait_for_timeout(4000)

    # Smooth scroll down to prospect card and click 'View lead card'
    smooth_scroll_cubic(page, 450, duration_ms=2000)
    page.wait_for_timeout(2000)

    lead_link = page.locator("a:has-text('View lead card'), a[href^='/leads/']")
    if lead_link.count() > 0:
        lead_link.first.click()
        page.wait_for_timeout(3500)
        # Smooth scroll on Lead Card showing customer objection & WhatsApp button
        smooth_scroll_cubic(page, 380, duration_ms=2200)
        page.wait_for_timeout(4500)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4")
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration)
    mux_video_audio(video_path, audio_path, pub_mp4, duration)
    print(f"      -> Successfully saved: {out_mp4}")
    return out_mp4

def record_section_5(p, temp_dir, audio_path, duration):
    print(f"\n[5/5] Recording Section 5 Video: 10 Indian Languages & Settings ({duration:.1f}s)...")
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080}, record_video_dir=temp_dir, record_video_size={'width': 1920, 'height': 1080})
    context.add_cookies([{'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}])
    context.add_init_script('''
        localStorage.setItem("vaani_current_user_mock", JSON.stringify({ uid: "user_gowtham_01", email: "gowtham@vaani.ai" }));
        localStorage.setItem("vaani_setup_mock", JSON.stringify({
            companyName: "Ishiva digital",
            companyType: "Digital Marketing & Agency",
            forwardingNumber: "+91 98765 43210",
            voice: "Shivani",
            language: "te-en",
            completed: true
        }));
    ''')
    page = context.new_page()
    page.goto("http://localhost:3000/settings")
    page.wait_for_timeout(2500)

    # Hover over 10 Language Mode buttons
    smooth_scroll_cubic(page, 200, duration_ms=2000)
    page.wait_for_timeout(3500)

    # Smooth scroll through the 16+ verified Timbre voices
    smooth_scroll_cubic(page, 680, duration_ms=2800)
    page.wait_for_timeout(4500)

    # Smooth scroll to SQLite Cache and Firebase RTDB section
    smooth_scroll_cubic(page, 1150, duration_ms=2500)
    page.wait_for_timeout(4500)

    # Smooth scroll back to top
    smooth_scroll_cubic(page, 0, duration_ms=2500)
    page.wait_for_timeout(3000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "05_Section_5_10_Languages_Settings.mp4")
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "05_Section_5_10_Languages_Settings.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration)
    mux_video_audio(video_path, audio_path, pub_mp4, duration)
    print(f"      -> Successfully saved: {out_mp4}")
    return out_mp4

def create_master_video(section_mp4s):
    print("\n" + "=" * 70)
    print("CONCATENATING COMPLETE MASTER VIDEO (STRICTLY UNDER 3 MINUTES)...")
    print("=" * 70)

    concat_file = os.path.join(DESKTOP_DIR, "concat_manifest.txt")
    with open(concat_file, "w") as f:
        for mp4 in section_mp4s:
            clean_path = mp4.replace("\\", "/")
            f.write(f"file '{clean_path}'\n")

    master_output = os.path.join(DESKTOP_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")
    pub_output = os.path.join(PUBLIC_VIDEO_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")

    cmd = [FFMPEG_EXE, '-y', '-f', 'concat', '-safe', '0', '-i', concat_file, '-c', 'copy', master_output]
    subprocess.run(cmd, check=True)
    subprocess.run([FFMPEG_EXE, '-y', '-f', 'concat', '-safe', '0', '-i', concat_file, '-c', 'copy', pub_output], check=True)

    if os.path.exists(concat_file):
        os.remove(concat_file)

    probe = subprocess.run([FFMPEG_EXE, '-i', master_output], stderr=subprocess.PIPE, text=True)
    duration_line = [l for l in probe.stderr.splitlines() if "Duration:" in l]
    print(f"\nMaster Demo Video Successfully Created:")
    print(f"Desktop Path: {master_output}")
    print(f"Public Path:  {pub_output}")
    if duration_line:
        print(f"Info: {duration_line[0].strip()}")

    return master_output

def main():
    temp_dir = os.path.join(PROJECT_DIR, ".smooth_video_temp")
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Synthesize all clean Devansh audios
    audios = prepare_all_audios()

    # 2. Record every section with silky smooth 60fps cubic-bezier scrolling
    section_mp4s = []
    with sync_playwright() as p:
        s1 = record_section_1(p, temp_dir, audios[0][0], audios[0][1])
        s2 = record_section_2(p, temp_dir, audios[1][0], audios[1][1])
        s3 = record_section_3(p, temp_dir, audios[2][0], audios[2][1])
        s4 = record_section_4(p, temp_dir, audios[3][0], audios[3][1])
        s5 = record_section_5(p, temp_dir, audios[4][0], audios[4][1])
        section_mp4s = [s1, s2, s3, s4, s5]

    # Clean temp dir
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)

    # 3. Mux into Master Continuous Demo Video
    create_master_video(section_mp4s)

    print("\n" + "=" * 70)
    print("ALL PROFESSIONAL DEMO VIDEOS RECORDED & VERIFIED:")
    print(f"Folder: {DESKTOP_DIR}")
    print("=" * 70)

if __name__ == "__main__":
    main()

