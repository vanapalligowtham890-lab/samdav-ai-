import os
import sys
import wave
import imageio_ffmpeg
import subprocess
from playwright.sync_api import sync_playwright

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(PROJECT_DIR, 'public', 'demo_audio')
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'Videos for gnani.Ai')

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

def test_sec_2():
    temp_dir = os.path.join(PROJECT_DIR, ".test_sec2")
    os.makedirs(temp_dir, exist_ok=True)
    audio_path = os.path.join(AUDIO_DIR, "section_2_dashboard.wav")
    with wave.open(audio_path, 'rb') as w:
        duration = w.getnframes() / float(w.getframerate())
    print(f"Section 2 audio duration: {duration:.1f}s", flush=True)

    with sync_playwright() as p:
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
        page.wait_for_timeout(2000)
        print("Page loaded, URL:", page.url, flush=True)

        # Smooth scroll to metrics
        smooth_scroll_cubic(page, 200, duration_ms=2000)
        page.wait_for_timeout(2500)

        # Move mouse over Dial Next Prospect
        page.mouse.move(960, 320)
        page.wait_for_timeout(2000)

        # Smooth scroll down to prospect cards
        smooth_scroll_cubic(page, 550, duration_ms=2500)
        page.wait_for_timeout(4000)

        # Smooth scroll back up
        smooth_scroll_cubic(page, 0, duration_ms=2000)
        page.wait_for_timeout(3000)

        video_path = page.video.path()
        context.close()
        browser.close()

    out_mp4 = os.path.join(DESKTOP_DIR, "02_Section_2_Live_Dashboard.mp4")
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', video_path,
        '-i', audio_path,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '17',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', f"{duration:.2f}",
        out_mp4
    ]
    subprocess.run(cmd, check=True)
    print(f"Section 2 complete: {out_mp4}", flush=True)
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    test_sec_2()

