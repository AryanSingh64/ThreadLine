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

    // --- STRATEGIES DICTIONARY ---
    const strategies = {
      "Chess.com": async () => {
        const [profRes, statsRes] = await Promise.all([
          fetch(`https://api.chess.com/pub/player/${username}`),
          fetch(`https://api.chess.com/pub/player/${username}/stats`)
        ]);
        if (profRes.ok) {
          const profile = await profRes.json();
          let stats = null;
          if (statsRes.ok) stats = await statsRes.json();
          return { success: true, status: 200, parsed: { type: "chess", data: { profile, stats } }, url };
        }
        return { success: false, status: profRes.status, url, error: "Not Found" };
      },
      "Docker Hub": async () => {
        const dockerRes = await fetch(`https://hub.docker.com/v2/users/${username}/`);
        if (dockerRes.ok) {
          const data = await dockerRes.json();
          return { success: true, status: 200, parsed: { type: "docker", data }, url };
        }
        return { success: false, status: dockerRes.status, url, error: "Not Found" };
      },
      "Reddit": async () => {
        const redditRes = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
          headers: { "User-Agent": "ThreadLineBot/1.0 by ThreadLine" }
        });
        if (redditRes.ok) {
          const data = await redditRes.json();
          if (data?.data?.name) {
            return { success: true, status: 200, parsed: { type: "reddit", data: data.data }, url };
          }
        }
        return { success: false, status: redditRes.status, url, error: "Not Found" };
      },
      "CodeChef": async () => {
        const res = await fetch(`https://www.codechef.com/api/user/${username}`);
        if(res.ok) {
             const data = await res.json();
             return { success: true, status: 200, parsed: { type: "codechef", data }, url };
        }
        return null; // Fallback to HTML NEXT_DATA extraction
      },
      "Bluesky": async () => {
        const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}.bsky.social`);
        if(res.ok) {
             const data = await res.json();
             return { success: true, status: 200, parsed: { type: "bluesky", data }, url };
        }
        return { success: false, status: res.status, url, error: "Not Found" };
      },
      "Hugging Face": async () => {
        const res = await fetch(`https://huggingface.co/api/users/${username}/overview`);
        if(res.ok) {
             const data = await res.json();
             if (data.user) {
                return { success: true, status: 200, parsed: { type: "huggingface", data }, url };
             }
        }
        return null; // Fallback to OG meta if API fails
      },
      "Mixcloud": async () => {
        const res = await fetch('https://www.mixcloud.com/graphql', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             query: `{ user(lookup:{username:"${username}"}) { username, displayName, followerCount, biog } }`
          })
        });
        if (res.ok) {
             const data = await res.json();
             return { success: true, status: 200, parsed: { type: "mixcloud", data }, url };
        }
        return null;
      },
      "Instagram": async () => {
        // Platform restricted wall - skip intentionally per directives
        return { success: false, status: 403, url, error: "Platform restricted (No public API)" };
      }
    };

    // --- APPLY STRATEGY ---
    try {
      if (strategies[platform]) {
        const result = await strategies[platform]();
        if (result) return NextResponse.json(result);
      }
    } catch (err) {
      console.warn(`Strategy API Error for ${platform}:`, err.message);
      // If strategy threw error, fallthrough to generic fetching seamlessly
    }

    // -- General HTML Fetch HTML/Next.js/Window Fallback --
    // Applied to HackerEarth, Kaggle, etc.
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

    // A. Next.js Data (__NEXT_DATA__) -> Perfect for HackerEarth
    const nextDataStr = extractTag(text, /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
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

    // C. OpenGraph Meta Tags Fallback -> Best explicit fallback for Kaggle
    if (!parsedData) {
      const ogTitle = extractTag(text, /<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
      const ogDesc = extractTag(text, /<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i);
      if (ogTitle || ogDesc) {
        // Light extraction tuning
        let details = ogDesc;
        if (platform === "Kaggle" && ogTitle) {
           details = `Kaggle Account: ${ogTitle}. ${ogDesc ? ogDesc : ''}`;
        }
        parsedData = { type: "meta", data: { title: ogTitle, description: details } };
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
