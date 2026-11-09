from playwright.sync_api import sync_playwright
import json

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        
        # 1. Set cookie
        context.add_cookies([
            {'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}
        ])
        
        # 2. Open / and initialize localStorage
        page = context.new_page()
        page.goto("http://localhost:3000/")
        page.evaluate('''() => {
            const user = { uid: "user_gowtham_01", email: "gowtham@vaani.ai" };
            localStorage.setItem("vaani_current_user_mock", JSON.stringify(user));
            localStorage.setItem("vaani_setup_mock", JSON.stringify({
                companyName: "Ishiva digital",
                companyType: "Digital Marketing & Agency",
                forwardingNumber: "+91 98765 43210",
                voice: "Shivani",
                language: "te-en",
                completed: true
            }));
            document.cookie = "vaani_session=active; path=/; max-age=604800; SameSite=Lax";
        }''')
        
        # 3. Now navigate to /today
        page.goto("http://localhost:3000/today")
        page.wait_for_timeout(2500)
        print("Final URL:", page.url)
        print("Dashboard title/text:", page.locator("h1, h2, h3").all_inner_texts()[:5])
        
        # 4. Take a screenshot to inspect
        page.screenshot(path="dashboard_test.png")
        print("Screenshot saved to dashboard_test.png")
        browser.close()

if __name__ == "__main__":
    test()

