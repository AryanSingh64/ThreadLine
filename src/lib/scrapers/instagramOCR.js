import Tesseract from "tesseract.js";
import sharp from "sharp";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

/**
 * Executes a Playwright session to bypass Instagram's strict HTML walls.
 * It takes a screenshot of the profile stats section, preprocesses it via Sharp
 * for optimal OCR, and extracts text using Tesseract.js.
 * 
 * Note: A real implementation requires a signed-in session or proxy network, 
 * as Instagram throws login walls quickly.
 */
export async function scrapeInstagramStats(username) {
  let browser = null;
  const tempImagePath = path.join(process.cwd(), "tmp", `ig_${username}.png`);
  const processedImagePath = path.join(process.cwd(), "tmp", `ig_${username}_processed.png`);
  
  try {
    // 1. Ensure temp directory exists
    if (!fs.existsSync(path.join(process.cwd(), "tmp"))) {
      fs.mkdirSync(path.join(process.cwd(), "tmp"));
    }

    // 2. Launch headless browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    
    const page = await context.newPage();
    
    // 3. Navigate to profile (Timeout aggressive to avoid waiting infinitely on login walls)
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "networkidle", timeout: 15000 });
    
    // Wait briefly for elements to mount
    await page.waitForTimeout(2000);
    
    // 4. We attempt to grab the exact stats header section:
    // IG class names change constantly. A generic xpath or standard selector for the 'header' section
    const statsLocator = page.locator('header section > ul');
    
    // If not found, login wall hit. Fall back to generic screenshot
    if (await statsLocator.count() > 0) {
      await statsLocator.first().screenshot({ path: tempImagePath });
    } else {
      // Just take top-half of the screen
      await page.screenshot({ path: tempImagePath, clip: { x: 0, y: 0, width: 800, height: 400 } });
    }

    // 5. Preprocess via Sharp (Convert to Grayscale, increase contrast)
    // Instagram's custom fonts are notoriously difficult for OCR if anti-aliasing isn't sharpened
    await sharp(tempImagePath)
      .grayscale()
      .normalize()
      .modulate({ contrast: 1.5, brightness: 1 })
      .toFile(processedImagePath);

    // 6. Tesseract Extract
    const { data: { text } } = await Tesseract.recognize(
      processedImagePath,
      'eng',
      { logger: m => console.log(m) }
    );

    // Basic cleaning of OCR text
    const cleanText = text.replace(/\n+/g, " ").trim();
    
    return {
      success: true,
      data: {
        rawOcrText: cleanText,
        note: "Data extracted via Playwright + Tesseract OCR preprocessing."
      }
    };

  } catch (error) {
    console.error("Instagram OCR Scraper Error:", error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) await browser.close();
    
    // Cleanup temporary images silently
    try {
      if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
      if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);
    } catch (e) {}
  }
}
