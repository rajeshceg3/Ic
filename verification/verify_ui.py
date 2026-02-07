from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- DESKTOP ---
        print("--- DESKTOP TEST ---")
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            print("Navigating to app (Desktop)...")
            page.goto("http://localhost:8080")

            # Wait for itinerary list to appear
            print("Waiting for itinerary list...")
            page.wait_for_selector("li.cursor-pointer", timeout=10000)
            print("Itinerary list found.")

            # Take initial screenshot (Home)
            print("Taking home screenshot...")
            page.screenshot(path="verification/home_desktop.png")

            # Click the first clickable item in the itinerary
            print("Clicking itinerary item 1...")
            # Using specific class added to clickable items
            items = page.locator("li.cursor-pointer")
            if items.count() > 0:
                items.first.click()
                time.sleep(3) # Wait for flyTo and UI update
                print("Taking sidebar/nav screenshot...")
                page.screenshot(path="verification/nav_desktop.png")

                # Verify content changed
                content_text = page.locator("#poi-content").text_content()
                if "Back to home" in content_text or "Read Full Guide" in content_text:
                     print("Desktop navigation verified by text content.")
                else:
                     print("Desktop navigation verification failed (text didn't update).")

            else:
                print("No clickable items found in itinerary.")
        except Exception as e:
            print(f"Desktop Test Failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            context.close()

        # --- MOBILE ---
        print("\n--- MOBILE TEST ---")
        context_mobile = browser.new_context(viewport={'width': 375, 'height': 667}, is_mobile=True, has_touch=True)
        page_mobile = context_mobile.new_page()

        try:
            print("Navigating to app (Mobile)...")
            page_mobile.goto("http://localhost:8080")

            print("Waiting for markers...")
            page_mobile.wait_for_selector(".leaflet-marker-icon", timeout=10000)

            # Take screenshot mobile closed
            page_mobile.screenshot(path="verification/mobile_home.png")

            # Click the menu button to open sidebar (floating button)
            print("Opening mobile menu...")
            menu_btn = page_mobile.locator("#menu-button")
            if menu_btn.is_visible():
                menu_btn.click()
                time.sleep(1) # Wait for animation

                # Verify sidebar class or visibility
                # On mobile, sidebar is the bottom sheet

                print("Taking mobile sheet screenshot...")
                page_mobile.screenshot(path="verification/mobile_sheet_open.png")

                # Now click an itinerary item
                print("Clicking itinerary item on mobile...")
                # Use the same specific selector
                items_mobile = page_mobile.locator("li.cursor-pointer")
                if items_mobile.count() > 0:
                    first_item = items_mobile.first
                    # Try regular click first, dispatch if needed
                    # ensure it's visible in viewport if it's a bottom sheet
                    first_item.scroll_into_view_if_needed()
                    first_item.click()

                    time.sleep(2)
                    page_mobile.screenshot(path="verification/mobile_nav.png")

                    # Verify content changed
                    content_text = page_mobile.locator("#poi-content").text_content()
                    if "Back to home" in content_text or "Read Full Guide" in content_text:
                        print("Mobile navigation verified by text content.")
                    else:
                        print("Mobile navigation might have failed (text content didn't change as expected).")
                        print(f"Content preview: {content_text[:100]}...")
                else:
                    print("No clickable items found in mobile list!")
            else:
                print("Menu button (fab-toggle) not visible!")

        except Exception as e:
            print(f"Mobile Test Failed: {e}")
            page_mobile.screenshot(path="verification/error_mobile.png")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    run()
