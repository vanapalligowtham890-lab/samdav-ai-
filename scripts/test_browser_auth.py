from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe", headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/login")
        print("Login URL:", page.url)
        print("Inputs count:", len(page.locator("input").all()))
        
        # Try sign up first
        page.goto("http://localhost:3000/signup")
        print("Signup URL:", page.url)
        page.locator("input[type='email']").fill("demo.gowtham@vaani.ai")
        password_inputs = page.locator("input[type='password']").all()
        if len(password_inputs) >= 2:
            password_inputs[0].fill("demo123456")
            password_inputs[1].fill("demo123456")
        page.locator("button[type='submit']").click()
        page.wait_for_timeout(3500)
        print("URL after signup attempt:", page.url)
        
        # Navigate to today
        page.goto("http://localhost:3000/today")
        page.wait_for_timeout(2000)
        print("URL after /today:", page.url)
        browser.close()

if __name__ == "__main__":
    test()

