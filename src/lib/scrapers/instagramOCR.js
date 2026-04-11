import { chromium } from "playwright";

/**
 * Executes a fast Playwright session to bypass Instagram's block of basic curl/fetch.
 * It grabs the OpenGraph description which natively contains the follower counts
 * without needing screenshot OCR.
 */
export async function scrapeInstagramStats(username) {
  let browser = null;
  
  try {
    // 1. Launch headless browser dynamically
    browser = await chromium.launch({ headless: true });
    // Use an aggressive desktop User-Agent
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    
    const page = await context.newPage();
    
    // 2. Navigate to profile fast - don't wait for networkidle because IG streams tracking
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
    
    // 3. Immediately look for the OpenGraph description meta tag
    // Instagram embeds "X Followers, Y Following, Z Posts" right here for link previews
    const metaLocator = page.locator('meta[property="og:description"]');
    
    // Wait up to 3 seconds for the meta tag if relying on hydration
    try {
        await metaLocator.waitFor({ state: "attached", timeout: 3000 });
    } catch (e) {
        // Ignore timeout
    }

    if (await metaLocator.count() > 0) {
      const content = await metaLocator.getAttribute("content");
      return {
        success: true,
        data: {
          rawOcrText: content,
          note: "Extracted via Playwright Headless OpenGraph parsing."
        }
      };
    } else {
        // Maybe hit login wall
        return {
           success: false,
           error: "Login wall encountered before stats populated"
        };
    }

  } catch (error) {
    console.error("Instagram Headless Scraper Error:", error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) await browser.close();
  }
}
