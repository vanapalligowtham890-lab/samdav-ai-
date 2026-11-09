from playwright.sync_api import sync_playwright
import json

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        
        # 1. Add session cookie
        context.add_cookies([
            {'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}
        ])
        
        # 2. Go to / and inject user mock into localStorage
        page = context.new_page()
        page.goto("http://localhost:3000/")
        page.evaluate('''() => {
            const user = { uid: "user_gowtham_01", email: "gowtham@vaani.ai" };
            localStorage.setItem("vaani_users_mock", JSON.stringify({
                "gowtham@vaani.ai": { uid: "user_gowtham_01", email: "gowtham@vaani.ai", password: "password123" }
            }));
            localStorage.setItem("vaani_current_user_mock", JSON.stringify(user));
            localStorage.setItem("vaani_setup_mock", JSON.stringify({
                companyName: "Ishiva digital",
                companyType: "Digital Marketing & Agency",
                forwardingNumber: "+91 98765 43210",
                voice: "Shivani",
                language: "te-en",
                completed: true
            }));
        }''')
        
        # 3. Navigate to /today
        page.goto("http://localhost:3000/today")
        page.wait_for_timeout(3000)
        print("URL on /today:", page.url)
        print("Body text on /today:\n", page.locator("body").inner_text()[:500])
        browser.close()

if __name__ == "__main__":
    test()

