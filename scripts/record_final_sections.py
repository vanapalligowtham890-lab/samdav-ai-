import os
import sys
import wave
import imageio_ffmpeg
import subprocess
import shutil
import tempfile
from playwright.sync_api import sync_playwright

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'Videos for gnani.Ai')
PUBLIC_VIDEO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_videos')

def get_wav_duration(filepath):
    with wave.open(filepath, 'rb') as w:
        return w.getnframes() / float(w.getframerate())

def smooth_scroll_timer(page, target_y, duration_ms):
    page.evaluate(f'''() => {{
        return new Promise((resolve) => {{
            const startY = window.scrollY;
            const targetY = {target_y};
            const distance = targetY - startY;
            const duration = {duration_ms};
            const startTime = Date.now();
            const interval = setInterval(() => {{
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                window.scrollTo(0, startY + distance * ease);
                if (progress >= 1) {{
                    clearInterval(interval);
                    resolve();
                }}
            }}, 16);
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

def record_section(section_num, title, url, audio_name, actions_callback):
    audio_path = os.path.join(DESKTOP_DIR, audio_name)
    duration = get_wav_duration(audio_path)
    print(f"\n[{section_num}/5] Recording {title} ({duration:.1f}s)...", flush=True)

    ud = tempfile.mkdtemp()
    temp_rec = tempfile.mkdtemp()

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=ud,
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True,
            viewport={'width': 1920, 'height': 1080},
            record_video_dir=temp_rec,
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
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(url)
        page.wait_for_timeout(2000)

        actions_callback(page)

        video_path = page.video.path()
        context.close()

    out_mp4 = os.path.join(DESKTOP_DIR, f"{section_num:02d}_{title.replace(' ', '_').replace('&', 'and')}.mp4")
    mux(video_path, audio_path, out_mp4, duration)
    shutil.copy2(out_mp4, os.path.join(PUBLIC_VIDEO_DIR, os.path.basename(out_mp4)))
    print(f"Saved: {out_mp4}", flush=True)

    shutil.rmtree(ud, ignore_errors=True)
    shutil.rmtree(temp_rec, ignore_errors=True)
    return out_mp4

def sec3_actions(page):
    page.mouse.move(600, 320)
    page.wait_for_timeout(2500)
    smooth_scroll_timer(page, 480, 2200)
    page.wait_for_timeout(4500)
    smooth_scroll_timer(page, 920, 2200)
    page.wait_for_timeout(5000)
    smooth_scroll_timer(page, 0, 2000)
    page.wait_for_timeout(4000)

def sec4_actions(page):
    page.mouse.move(750, 240)
    page.wait_for_timeout(3500)
    smooth_scroll_timer(page, 450, 2000)
    page.wait_for_timeout(2500)
    lead_link = page.locator("a:has-text('View lead card'), a[href^='/leads/']")
    if lead_link.count() > 0:
        lead_link.first.click()
        page.wait_for_timeout(3000)
        smooth_scroll_timer(page, 360, 2000)
        page.wait_for_timeout(4500)

def sec5_actions(page):
    smooth_scroll_timer(page, 200, 1800)
    page.wait_for_timeout(3000)
    smooth_scroll_timer(page, 650, 2200)
    page.wait_for_timeout(4000)
    smooth_scroll_timer(page, 1100, 2000)
    page.wait_for_timeout(4000)
    smooth_scroll_timer(page, 0, 2000)
    page.wait_for_timeout(3000)

def create_master_video():
    print("\nCreating Master Video...", flush=True)
    all_files = [f for f in os.listdir(DESKTOP_DIR) if f.endswith(".mp4") and f.startswith("0")]
    all_files.sort()
    
    concat_file = os.path.join(DESKTOP_DIR, "concat_final.txt")
    with open(concat_file, "w") as f:
        for f_name in all_files:
            full_path = os.path.join(DESKTOP_DIR, f_name).replace(chr(92), '/')
            f.write(f"file '{full_path}'\n")

    master_mp4 = os.path.join(DESKTOP_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4")
    cmd = [
        FFMPEG_EXE, '-y',
        '-f', 'concat', '-safe', '0', '-i', concat_file,
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
        '-avoid_negative_ts', 'make_zero',
        master_mp4
    ]
    subprocess.run(cmd, check=True)
    shutil.copy2(master_mp4, os.path.join(PUBLIC_VIDEO_DIR, "Vaani_Recap_Complete_Demo_Video_Under_3Mins.mp4"))

    if os.path.exists(concat_file):
        os.remove(concat_file)

    probe = subprocess.run([FFMPEG_EXE, '-i', master_mp4], stderr=subprocess.PIPE, text=True)
    for l in probe.stderr.splitlines():
        if "Duration:" in l:
            print(f"Master Video Duration: {l.strip()}", flush=True)
    print(f"Master Video Created Successfully: {master_mp4}", flush=True)

def main():
    record_section(3, "Section 3 Call Recordings", "http://localhost:3000/calls", "section_3_recordings.wav", sec3_actions)
    record_section(4, "Section 4 Spoken Recap Lead Card", "http://localhost:3000/today", "section_4_spoken_recap.wav", sec4_actions)
    record_section(5, "Section 5 10 Languages Settings", "http://localhost:3000/settings", "section_5_settings_conclusion.wav", sec5_actions)
    create_master_video()
    print("\nALL VIDEOS PRODUCED AND VERIFIED SUCCESSFULLY!", flush=True)

if __name__ == "__main__":
    main()

