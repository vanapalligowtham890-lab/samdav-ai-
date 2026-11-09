import os
import sys
import wave
import imageio_ffmpeg
import subprocess
import shutil
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

def smooth_scroll_cubic(page, target_y, duration_ms):
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
                const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
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

def mux(video_file, audio_file, output_mp4, duration):
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', video_file,
        '-i', audio_file,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', f"{duration:.2f}",
        output_mp4
    ]
    subprocess.run(cmd, check=True)

def record_section_3(p, temp_dir):
    audio_path = os.path.join(DESKTOP_DIR, "section_3_recordings.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[3/5] Recording Section 3: Call Recordings ({duration:.1f}s)...", flush=True)

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
    page.goto("http://localhost:3000/calls")
    page.wait_for_timeout(2500)

    # Click play button on call recording
    page.mouse.move(500, 350)
    page.wait_for_timeout(2000)

    # Smooth scroll down to verbatim multi-speaker transcript and intent badges
    smooth_scroll_cubic(page, 480, duration_ms=2500)
    page.wait_for_timeout(4500)

    # Smooth scroll to next conversation
    smooth_scroll_cubic(page, 950, duration_ms=2500)
    page.wait_for_timeout(5000)

    # Smooth scroll back up
    smooth_scroll_cubic(page, 0, duration_ms=2200)
    page.wait_for_timeout(4000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "03_Section_3_Call_Recordings.mp4")
    mux(video_path, audio_path, out_mp4, duration)
    shutil.copy2(out_mp4, os.path.join(PUBLIC_VIDEO_DIR, "03_Section_3_Call_Recordings.mp4"))
    print(f"Section 3 saved: {out_mp4}", flush=True)
    return out_mp4

def record_section_4(p, temp_dir):
    audio_path = os.path.join(DESKTOP_DIR, "section_4_spoken_recap.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[4/5] Recording Section 4: Spoken Brief & Lead Card ({duration:.1f}s)...", flush=True)

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

    # Hover over spoken voice recap card (<60 words)
    page.mouse.move(700, 260)
    page.wait_for_timeout(3500)

    # Smooth scroll down to prospect card
    smooth_scroll_cubic(page, 450, duration_ms=2000)
    page.wait_for_timeout(2500)

    # Click first lead link
    lead_link = page.locator("a:has-text('View lead card'), a[href^='/leads/']")
    if lead_link.count() > 0:
        lead_link.first.click()
        page.wait_for_timeout(3000)
        smooth_scroll_cubic(page, 380, duration_ms=2200)
        page.wait_for_timeout(4000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4")
    mux(video_path, audio_path, out_mp4, duration)
    shutil.copy2(out_mp4, os.path.join(PUBLIC_VIDEO_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4"))
    print(f"Section 4 saved: {out_mp4}", flush=True)
    return out_mp4

def record_section_5(p, temp_dir):
    audio_path = os.path.join(DESKTOP_DIR, "section_5_settings_conclusion.wav")
    duration = get_wav_duration(audio_path)
    print(f"\n[5/5] Recording Section 5: 10 Indian Languages & Settings ({duration:.1f}s)...", flush=True)

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
    page.goto("http://localhost:3000/settings")
    page.wait_for_timeout(2500)

    # Hover over 10 Language Mode buttons
    smooth_scroll_cubic(page, 200, duration_ms=2000)
    page.wait_for_timeout(3500)

    # Smooth scroll through the 16+ verified Timbre voices
    smooth_scroll_cubic(page, 680, duration_ms=2500)
    page.wait_for_timeout(4000)

    # Smooth scroll to SQLite Cache and Firebase RTDB section
    smooth_scroll_cubic(page, 1100, duration_ms=2200)
    page.wait_for_timeout(4000)

    # Smooth scroll back to top
    smooth_scroll_cubic(page, 0, duration_ms=2200)
    page.wait_for_timeout(3000)

    video_path = page.video.path()
    context.close()
    browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "05_Section_5_10_Languages_Settings.mp4")
    mux(video_path, audio_path, out_mp4, duration)
    shutil.copy2(out_mp4, os.path.join(PUBLIC_VIDEO_DIR, "05_Section_5_10_Languages_Settings.mp4"))
    print(f"Section 5 saved: {out_mp4}", flush=True)
    return out_mp4

def create_master_video():
    print("\nConcatenating Complete Master Video (Under 3 Minutes)...", flush=True)
    sections = [
        os.path.join(DESKTOP_DIR, "01_Section_1_Introduction.mp4"),
        os.path.join(DESKTOP_DIR, "02_Section_2_Live_Dashboard.mp4"),
        os.path.join(DESKTOP_DIR, "03_Section_3_Call_Recordings.mp4"),
        os.path.join(DESKTOP_DIR, "04_Section_4_Spoken_Recap_Lead_Card.mp4"),
        os.path.join(DESKTOP_DIR, "05_Section_5_10_Languages_Settings.mp4")
    ]
    concat_file = os.path.join(DESKTOP_DIR, "concat.txt")
    with open(concat_file, "w") as f:
        for s in sections:
            f.write(f"file '{s.replace(chr(92), '/')}'\n")

    master_mp4 = os.path.join(DESKTOP_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")
    pub_master = os.path.join(PUBLIC_VIDEO_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")
    cmd = [FFMPEG_EXE, '-y', '-f', 'concat', '-safe', '0', '-i', concat_file, '-c', 'copy', master_mp4]
    subprocess.run(cmd, check=True)
    shutil.copy2(master_mp4, pub_master)

    if os.path.exists(concat_file):
        os.remove(concat_file)

    probe = subprocess.run([FFMPEG_EXE, '-i', master_mp4], stderr=subprocess.PIPE, text=True)
    for l in probe.stderr.splitlines():
        if "Duration:" in l:
            print(f"Master Video Duration: {l.strip()}", flush=True)

    print(f"Master Video created: {master_mp4}", flush=True)

def main():
    temp_dir = os.path.join(PROJECT_DIR, ".sec_temp")
    os.makedirs(temp_dir, exist_ok=True)
    with sync_playwright() as p:
        record_section_3(p, temp_dir)
        record_section_4(p, temp_dir)
        record_section_5(p, temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)
    create_master_video()
    print("ALL DONE SUCCESSFULLY!", flush=True)

if __name__ == "__main__":
    main()

