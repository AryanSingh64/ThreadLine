import { NextResponse } from "next/server";

// Simple robust regex extractors
function extractTag(html, regex) {
  const match = html.match(regex);
  return match ? match[1] : null;
}

export async function POST(req) {
  try {
    const { url, username, platform } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // -- 1. Platform Specific API Overrides --
    if (platform === "Docker Hub" && username) {
      const dockerRes = await fetch(`https://hub.docker.com/v2/users/${username}/`);
      if (dockerRes.ok) {
        const data = await dockerRes.json();
        return NextResponse.json({ success: true, status: 200, parsed: { type: "docker", data }, url });
      } else {
        return NextResponse.json({ success: false, status: dockerRes.status, url, error: "Not Found" });
      }
    }

    if (platform === "Chess.com" && username) {
      const chessRes = await fetch(`https://api.chess.com/pub/player/${username}`);
      if (chessRes.ok) {
        const data = await chessRes.json();
        return NextResponse.json({ success: true, status: 200, parsed: { type: "chess", data }, url });
      } else {
        return NextResponse.json({ success: false, status: chessRes.status, url, error: "Not Found" });
      }
    }

    // -- 2. General HTML Fetch --
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(10000)
    });

    const status = response.status;
    const text = await response.text();

    const lowerContent = text.toLowerCase();
    const errPhrases = ["page not found", "account not found", "user not found", "doesn't exist", "404 not found", "isn't available", "recaptcha"];
    const hasTextError = errPhrases.some(phrase => lowerContent.includes(phrase));

    if (!response.ok || hasTextError) {
      return NextResponse.json({ success: false, status: response.ok ? 404 : status, url, error: hasTextError ? "Not Found (Content Check)" : "HTTP Error" });
    }

    // -- 3. Smart Parsing --
    let parsedData = null;

    // A. Next.js Data
    const nextDataStr = extractTag(text, /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataStr) {
      try {
        const json = JSON.parse(nextDataStr);
        parsedData = { type: "nextjs", data: json.props?.pageProps || json };
      } catch (e) { }
    }

    // B. Window Initial State / Redux
    if (!parsedData) {
      const windowStateMatches = text.match(/window\.__[A-Z_]+\s*=\s*({.+?});/s);
      if (windowStateMatches) {
        try {
          parsedData = { type: "windowState", data: JSON.parse(windowStateMatches[1]) };
        } catch(e) {}
      }
    }

    // C. OpenGraph Meta Tags Fallback
    if (!parsedData) {
      const ogTitle = extractTag(text, /<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
      const ogDesc = extractTag(text, /<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i);
      if (ogTitle || ogDesc) {
        parsedData = { type: "meta", data: { title: ogTitle, description: ogDesc } };
      }
    }

    // D. Final fallback to minimal text extract
    if (!parsedData) {
      parsedData = { 
        type: "raw", 
        data: text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) 
      };
    }

    return NextResponse.json({
      success: true,
      status,
      parsed: parsedData,
      url,
    });
  } catch (error) {
    console.error("Scraper Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
