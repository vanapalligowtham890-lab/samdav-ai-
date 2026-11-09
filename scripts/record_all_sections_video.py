import os
import sys
import time
import subprocess
import wave
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_audio')
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'Videos for gnani.Ai')
PUBLIC_VIDEO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_videos')

os.makedirs(DESKTOP_DIR, exist_ok=True)
os.makedirs(PUBLIC_VIDEO_DIR, exist_ok=True)

def get_wav_duration(filepath):
    with wave.open(filepath, 'rb') as w:
        return w.getnframes() / float(w.getframerate())

def mux_video_audio(video_file, audio_file, output_mp4, duration=None):
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', video_file,
        '-i', audio_file,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k'
    ]
    if duration:
        cmd.extend(['-t', str(duration)])
    else:
        cmd.append('-shortest')
    cmd.append(output_mp4)
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def smooth_scroll(page, start_y, end_y, steps=25, delay_ms=40):
    step_size = (end_y - start_y) / float(steps)
    for i in range(1, steps + 1):
        cur_y = start_y + (step_size * i)
        page.evaluate(f"window.scrollTo({{ top: {cur_y}, behavior: 'smooth' }})")
        page.wait_for_timeout(delay_ms)

def record_section_1(p, temp_dir):
    audio_path = os.path.join(AUDIO_DIR, "section_1_intro.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[1/5] Recording Section 1: Intro & Problem ({duration:.1f}s)...")

    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        record_video_dir=temp_dir,
        record_video_size={'width': 1920, 'height': 1080}
    )
    page = context.new_page()
    page.goto("http://localhost:3000/")
    page.wait_for_timeout(2000)

    # Hover on Logo and Title
    page.hover("header img")
    page.wait_for_timeout(2500)

    # Show Hero Heading & Pitch
    page.wait_for_timeout(3000)

    # Smooth scroll down to Voice Catalog Section
    smooth_scroll(page, 0, 520, steps=20, delay_ms=40)
    page.wait_for_timeout(2000)

    # Hover over Telugu voice cards
    voice_buttons = page.locator("button, a").all()
    page.wait_for_timeout(3000)

    # Smooth scroll down to Workflow cards
    smooth_scroll(page, 520, 1150, steps=25, delay_ms=40)
    page.wait_for_timeout(3500)

    # Smooth scroll down to Business tags & Footer
    smooth_scroll(page, 1150, 1750, steps=20, delay_ms=40)
    page.wait_for_timeout(3500)

    # Scroll back up to header
    smooth_scroll(page, 1750, 0, steps=30, delay_ms=30)
    page.wait_for_timeout(2000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "01_Section_1_Introduction.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration=duration)
    # Also save to public dir
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "01_Section_1_Introduction.mp4")
    mux_video_audio(video_path, audio_path, pub_mp4, duration=duration)
    print(f"      -> Saved: {out_mp4}")
    return out_mp4

def record_section_2(p, temp_dir):
    audio_path = os.path.join(AUDIO_DIR, "section_2_dashboard.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[2/5] Recording Section 2: Live Dashboard & Outbound Dialing ({duration:.1f}s)...")

    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        record_video_dir=temp_dir,
        record_video_size={'width': 1920, 'height': 1080}
    )
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

    # Focus on Verified Forwarding Number at top
    page.wait_for_timeout(2500)

    # Hover across the 6 KPI metric cards
    smooth_scroll(page, 0, 180, steps=10, delay_ms=30)
    page.wait_for_timeout(2500)

    # Click "Dial Next Prospect" button
    dial_btn = page.locator("button:has-text('Dial Next Prospect')")
    if dial_btn.count() > 0:
        dial_btn.first.click()
        page.wait_for_timeout(4000)

    # Scroll down to inspect the active prospect call cards
    smooth_scroll(page, 180, 520, steps=15, delay_ms=40)
    page.wait_for_timeout(4000)

    # Return up smoothly
    smooth_scroll(page, 520, 0, steps=20, delay_ms=30)
    page.wait_for_timeout(3000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "02_Section_2_Live_Dashboard.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration=duration)
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "02_Section_2_Live_Dashboard.mp4")
    mux_video_audio(video_path, audio_path, pub_mp4, duration=duration)
    print(f"      -> Saved: {out_mp4}")
    return out_mp4

def record_section_3(p, temp_dir):
    audio_path = os.path.join(AUDIO_DIR, "section_3_recordings.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[3/5] Recording Section 3: Call Recordings & STT Extraction ({duration:.1f}s)...")

    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        record_video_dir=temp_dir,
        record_video_size={'width': 1920, 'height': 1080}
    )
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

    # Hover over call cards
    page.wait_for_timeout(2500)

    # Click Play button on first call recording
    play_btn = page.locator("button:has(svg.lucide-play)")
    if play_btn.count() > 0:
        play_btn.first.click()
        page.wait_for_timeout(5000)

    # Scroll down to show verbatim multi-speaker transcript and intent badges
    smooth_scroll(page, 0, 480, steps=20, delay_ms=40)
    page.wait_for_timeout(4500)

    # Scroll down to show next recording with contrasting voices
    smooth_scroll(page, 480, 920, steps=20, delay_ms=40)
    page.wait_for_timeout(5000)

    # Return up smoothly
    smooth_scroll(page, 920, 0, steps=25, delay_ms=30)
    page.wait_for_timeout(3000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "03_Section_3_Call_Recordings.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration=duration)
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "03_Section_3_Call_Recordings.mp4")
    mux_video_audio(video_path, audio_path, pub_mp4, duration=duration)
    print(f"      -> Saved: {out_mp4}")
    return out_mp4

def record_section_4(p, temp_dir):
    audio_path = os.path.join(AUDIO_DIR, "section_4_spoken_recap.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[4/5] Recording Section 4: Spoken Evening Brief & Lead Card ({duration:.1f}s)...")

    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        record_video_dir=temp_dir,
        record_video_size={'width': 1920, 'height': 1080}
    )
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

    # Point to the Spoken Evening Voice Recap card (<60 words)
    recap_play = page.locator("button:has-text('Play Voice Brief'), button:has(svg.lucide-play)")
    if recap_play.count() > 0:
        recap_play.first.hover()
        page.wait_for_timeout(1500)
        recap_play.first.click()
        page.wait_for_timeout(3500)

    # Scroll down to prospect list and click 'View lead card'
    smooth_scroll(page, 0, 420, steps=15, delay_ms=30)
    page.wait_for_timeout(2000)

    lead_card_link = page.locator("a:has-text('View lead card'), a[href^='/leads/']")
    if lead_card_link.count() > 0:
        lead_card_link.first.click()
        page.wait_for_timeout(3500)

        # On the Lead Card page: highlight customer intent, budget, objection quote & WhatsApp button
        smooth_scroll(page, 0, 350, steps=15, delay_ms=30)
        page.wait_for_timeout(4000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration=duration)
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4")
    mux_video_audio(video_path, audio_path, pub_mp4, duration=duration)
    print(f"      -> Saved: {out_mp4}")
    return out_mp4

def record_section_5(p, temp_dir):
    audio_path = os.path.join(AUDIO_DIR, "section_5_settings_conclusion.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[5/5] Recording Section 5: 10 Language Modes & Settings ({duration:.1f}s)...")

    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        record_video_dir=temp_dir,
        record_video_size={'width': 1920, 'height': 1080}
    )
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

    # Hover over 10 Language Mode buttons (Telugu, Hinglish, Hindi, Tamil, English)
    smooth_scroll(page, 0, 220, steps=10, delay_ms=30)
    page.wait_for_timeout(3000)

    # Scroll through the 16+ verified Timbre voices
    smooth_scroll(page, 220, 680, steps=20, delay_ms=40)
    page.wait_for_timeout(4500)

    # Scroll down to SQLite Cache and Firebase RTDB Sync section
    smooth_scroll(page, 680, 1100, steps=20, delay_ms=40)
    page.wait_for_timeout(4500)

    # Scroll back to top
    smooth_scroll(page, 1100, 0, steps=25, delay_ms=30)
    page.wait_for_timeout(3000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "05_Section_5_10_Languages_Settings.mp4")
    mux_video_audio(video_path, audio_path, out_mp4, duration=duration)
    pub_mp4 = os.path.join(PUBLIC_VIDEO_DIR, "05_Section_5_10_Languages_Settings.mp4")
    mux_video_audio(video_path, audio_path, pub_mp4, duration=duration)
    print(f"      -> Saved: {out_mp4}")
    return out_mp4

def create_full_continuous_video(section_mp4s):
    print("\n" + "=" * 70)
    print("CONCATENATING COMPLETE DEMO VIDEO (UNDER 3 MINUTES)...")
    print("=" * 70)

    # Create concat list file
    concat_list = os.path.join(DESKTOP_DIR, "concat_list.txt")
    with open(concat_list, "w") as f:
        for mp4 in section_mp4s:
            clean_path = mp4.replace("\\", "/")
            f.write(f"file '{clean_path}'\n")

    full_output = os.path.join(DESKTOP_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")
    pub_output = os.path.join(PUBLIC_VIDEO_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")

    cmd = [
        FFMPEG_EXE, '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concat_list,
        '-c', 'copy',
        full_output
    ]
    subprocess.run(cmd, check=True)
    subprocess.run([FFMPEG_EXE, '-y', '-f', 'concat', '-safe', '0', '-i', concat_list, '-c', 'copy', pub_output], check=True)

    if os.path.exists(concat_list):
        os.remove(concat_list)

    # Measure final duration
    probe_cmd = [
        FFMPEG_EXE, '-i', full_output
    ]
    probe = subprocess.run(probe_cmd, stderr=subprocess.PIPE, text=True)
    duration_line = [l for l in probe.stderr.splitlines() if "Duration:" in l]
    print(f"\nFinal Video Created:")
    print(f"Desktop Path: {full_output}")
    print(f"Public Path:  {pub_output}")
    if duration_line:
        print(f"{duration_line[0].strip()}")

    return full_output

def main():
    import tempfile
    temp_dir = os.path.join(PROJECT_DIR, ".video_temp")
    os.makedirs(temp_dir, exist_ok=True)

    with sync_playwright() as p:
        sec1 = record_section_1(p, temp_dir)
        sec2 = record_section_2(p, temp_dir)
        sec3 = record_section_3(p, temp_dir)
        sec4 = record_section_4(p, temp_dir)
        sec5 = record_section_5(p, temp_dir)

    # Clean temp dir
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)

    # Create Full Merged Video
    create_full_continuous_video([sec1, sec2, sec3, sec4, sec5])

    print("\n" + "=" * 70)
    print("ALL VIDEOS RECORDED & SAVED SUCCESSFULLY ON DESKTOP:")
    print(f"Folder: {DESKTOP_DIR}")
    print("=" * 70)

if __name__ == "__main__":
    main()

