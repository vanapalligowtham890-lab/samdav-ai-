from playwright.sync_api import sync_playwright

def test_init_script():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        
        # Add cookie
        context.add_cookies([
            {'name': 'vaani_session', 'value': 'active', 'domain': 'localhost', 'path': '/'}
        ])
        
        # Add init script that runs before every page load
        context.add_init_script('''
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
            document.cookie = "vaani_session=active; path=/; max-age=604800; SameSite=Lax";
        ''')
        
        page = context.new_page()
        page.goto("http://localhost:3000/today")
        page.wait_for_timeout(2000)
        print("Page URL:", page.url)
        print("Page title:", page.title())
        h2s = page.locator("h2, h3").all_inner_texts()
        print("H2/H3 elements:", h2s[:5])
        page.screenshot(path="dashboard_init_test.png")
        print("Saved dashboard_init_test.png successfully!")
        browser.close()

if __name__ == "__main__":
    test_init_script()

