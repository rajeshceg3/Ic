import time
from playwright.sync_api import sync_playwright

def verify_desktop(page):
    print("Verifying Desktop...")
    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto("http://localhost:8000")

    # Wait for map to load (canvas or tiles)
    page.wait_for_selector(".leaflet-container")

    # Check sidebar visibility
    sidebar = page.locator("#poi-sidebar")
    if sidebar.is_visible():
        print("Sidebar visible on desktop.")

    # Wait for list to populate
    page.wait_for_selector("#poi-content li")

    # Click first item
    first_item = page.locator("#poi-content li").first
    first_item.click()

    # Wait for details to load
    page.wait_for_selector("#home-button")
    print("POI details loaded.")

    time.sleep(2) # Wait for animation
    page.screenshot(path="verification_desktop.png")
    print("Desktop screenshot saved.")

def verify_mobile(page):
    print("Verifying Mobile...")
    page.set_viewport_size({"width": 375, "height": 667}) # iPhone SE/8
    page.goto("http://localhost:8000")

    page.wait_for_selector(".leaflet-container")

    # Check sidebar state (should be peek)
    sidebar = page.locator("#poi-sidebar")

    # In my logic, on mobile load, sheetState is 'peek'
    # Class should be 'sheet-peek'

    # Wait a bit for JS to init
    time.sleep(1)

    classes = sidebar.get_attribute("class")
    if "sheet-peek" in classes:
        print("Sidebar starts in peek mode on mobile.")
    else:
        print(f"Sidebar classes: {classes}")

    page.screenshot(path="verification_mobile_peek.png")

    # Click handle to expand
    handle = page.locator("#sheet-handle")
    if handle.is_visible():
        handle.click()
        time.sleep(1) # Wait for transition

        classes = sidebar.get_attribute("class")
        if "sheet-full" in classes:
            print("Sidebar expanded to full mode.")
        else:
             print(f"Sidebar classes after click: {classes}")

        page.screenshot(path="verification_mobile_full.png")
    else:
        print("Handle not visible!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            verify_desktop(page)
            verify_mobile(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
