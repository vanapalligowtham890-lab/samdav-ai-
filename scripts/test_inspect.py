from playwright.sync_api import sync_playwright

def inspect_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        page.goto("http://localhost:3000/signup")
        
        # Fill signup form
        page.locator("input[type='email']").fill("gowtham_sales@vaani.ai")
        passwords = page.locator("input[type='password']").all()
        passwords[0].fill("pass1234")
        passwords[1].fill("pass1234")
        page.locator("button[type='submit']").click()
        page.wait_for_timeout(2000)
        print("After signup, URL:", page.url)
        
        # If redirect to setup, fill setup or go to today
        page.goto("http://localhost:3000/today")
        page.wait_for_timeout(3000)
        print("After goto today, URL:", page.url)
        print("Body text snippet:", page.locator("body").inner_text()[:400])
        browser.close()

if __name__ == "__main__":
    inspect_dashboard()

