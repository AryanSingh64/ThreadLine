# ThreadLine — Digital Intelligence Aggregation Platform

> **"Trace Every Thread. Unravel Every Connection."**
> A full-stack OSINT cyber intelligence platform with dual-mode scanning: hackathon-safe local analysis + deep research with live OSINT sources.

---

## Overview

ThreadLine lets a user enter **one identifier** (email, username, domain, or IP) and get a deep investigation report. It operates in **two modes**:

1. **Standard Scan** — 100% local, zero external calls. Uses local datasets, DNS (system-level), direct HTTP checks, and pattern analysis. **Hackathon-safe.**
2. **Deep Research Mode** — Unlocks live OSINT sources (crt.sh, ip-api.com, WHOIS, Shodan InternetDB, OpenPhish). Produces richer, real-world intelligence. **Toggle-activated.**

---

## Dual-Mode Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SEARCH INPUT                         │
│              ┌─────────────────────────┐                │
│              │  [  email / user / domain / IP  ]        │
│              └──────────┬──────────────┘                │
│                         │                               │
│              ┌──────────▼──────────────┐                │
│              │  ⚡ Standard   🔬 Deep   │  ← Mode Toggle │
│              └──────────┬──────────────┘                │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
  ┌───────▼────────┐            ┌────────▼─────────┐
  │  STANDARD SCAN │            │  DEEP RESEARCH   │
  │  (No ext. API) │            │  (Live OSINT)    │
  │                │            │                  │
  │ ✅ DNS Recon   │            │ Everything in    │
  │ ✅ HTTP Finger │            │ Standard PLUS:   │
  │ ✅ Username    │            │                  │
  │    Enum        │            │ 🔬 crt.sh       │
  │ ✅ Email Intel │            │    Subdomains    │
  │ ✅ Pattern     │            │ 🔬 WHOIS        │
  │    Analysis    │            │    (whoiser)     │
  │ ✅ Dataset     │            │ 🔬 ip-api.com   │
  │    Matching    │            │    Geolocation   │
  │ ✅ Local IP    │            │ 🔬 Shodan       │
  │    Lookup      │            │    InternetDB    │
  │                │            │ 🔬 OpenPhish    │
  └───────┬────────┘            │    Live Feed     │
          │                     └────────┬─────────┘
          │                              │
          └──────────┬───────────────────┘
                     │
          ┌──────────▼──────────┐
          │  Correlation Engine │
          └──────────┬──────────┘
          ┌──────────▼──────────┐
          │  Scoring Engine     │
          └──────────┬──────────┘
          ┌──────────▼──────────┐
          │  Explanation Engine │
          └──────────┬──────────┘
          ┌──────────▼──────────┐
          │  SSE → Dashboard    │
          └─────────────────────┘
```

### What Each Mode Activates

| Module | Standard ⚡ | Deep 🔬 | How |
|--------|:---------:|:------:|-----|
| DNS Reconnaissance | ✅ | ✅ | Node.js built-in `dns.promises` (system-level, not an API) |
| HTTP Tech Fingerprinting | ✅ | ✅ | Direct `fetch()` to target domain (visiting the website) |
| Username Enumeration | ✅ | ✅ | Direct HEAD/GET to profile URLs (visiting pages) |
| Email Intelligence | ✅ | ✅ | MX lookup (DNS) + local pattern analysis |
| Pattern Analysis | ✅ | ✅ | Pure algorithmic — regex, heuristics, no network |
| Dataset Matching | ✅ | ✅ | Local JSON file lookups, zero network |
| Local IP GeoIP | ✅ | ✅ | Offline DB-IP Lite CSV bundled in project |
| Subdomain Discovery | ❌ | ✅ | crt.sh Certificate Transparency API |
| WHOIS Domain Lookup | ❌ | ✅ | `whoiser` npm — TCP port 43 to WHOIS servers |
| IP Geolocation (full) | ❌ | ✅ | ip-api.com free JSON endpoint |
| Shodan InternetDB | ❌ | ✅ | `internetdb.shodan.io/{ip}` — ports, vulns |
| OpenPhish Live Feed | ❌ | ✅ | `openphish.com/feed.txt` — active phishing URLs |
| Correlation Engine | ✅ | ✅ | In-memory graph building (pure logic) |
| Scoring Engine | ✅ | ✅ | Weighted heuristic calculation (pure logic) |
| Explanation Engine | ✅ | ✅ | Template-based narrative (pure logic) |

> [!IMPORTANT]
> **Standard mode alone is already powerful.** It runs 7 local modules, builds a full correlation graph, generates a risk score, and produces a professional-looking report — all without a single external API call. Deep Research just makes it richer with real-world data.

---

## User Review Required

> [!IMPORTANT]
> **Tech Stack**: Using **Next.js App Router** with JavaScript (not TypeScript) as the unified full-stack framework. API routes handle all backend logic. Single deployment, single language. Confirm this is good.

> [!IMPORTANT]
> **App Name**: Updated to **ThreadLine** as requested. All branding, logos, and UI copy will use this name.

> [!WARNING]
> **Deep Research Mode UI**: The mode toggle will be clearly labeled so judges understand:
> - Standard = "Local Intelligence Only — No External APIs"
> - Deep Research = "Live OSINT Sources — External Queries Enabled"
> 
> This way you can demo Standard mode for hackathon compliance, and switch to Deep Research to show the full power.

---

## Proposed Changes

### Component 1: Project Foundation

#### [NEW] Project scaffolding & configuration

Initialize Next.js 15 App Router with Tailwind CSS, JavaScript, and required dependencies.

**Dependencies:**
| Package | Purpose | Used In |
|---------|---------|---------|
| `next` + `react` + `react-dom` | Framework | Both modes |
| `tailwindcss` + `@tailwindcss/postcss` | Styling | Both modes |
| `framer-motion` | Animations & page transitions | Both modes |
| `d3` + `d3-force` | Force-directed graph | Both modes |
| `jspdf` + `html2canvas` | Client-side PDF report | Both modes |
| `lucide-react` | Icons | Both modes |
| `whoiser` | WHOIS lookups (TCP port 43) | Deep mode only |

---

### Component 2: Local Datasets (Bundled with App)

All datasets are JSON files shipped inside the project. Zero runtime downloads.

#### [NEW] [data/breach_emails.json](file:///f:/Github-Code/ThreadLine/data/breach_emails.json)
~300 synthetic emails in simulated breach records. Includes breach metadata.
```json
[
  {
    "email": "aryan.dev@gmail.com",
    "username": "aryan_dev",
    "breaches": [
      {
        "name": "SocialVault 2023",
        "date": "2023-06-15",
        "dataExposed": ["email", "password_hash", "username"],
        "recordCount": 14200000,
        "severity": "high"
      }
    ]
  }
]
```
**Source:** Create ourselves. Include common name patterns so demo queries always get hits.

#### [NEW] [data/suspicious_domains.json](file:///f:/Github-Code/ThreadLine/data/suspicious_domains.json)
~200 domains flagged as suspicious with categories and risk levels.
**Source:** Create ourselves based on public phishing research patterns.

#### [NEW] [data/known_usernames.json](file:///f:/Github-Code/ThreadLine/data/known_usernames.json)
~150 synthetic usernames in simulated leak records.
**Source:** Create ourselves.

#### [NEW] [data/domain_reputation.json](file:///f:/Github-Code/ThreadLine/data/domain_reputation.json)
~300 domains with reputation scores, categories, and flags (including known-good like google.com, github.com).
**Source:** Create ourselves.

#### [NEW] [data/phishing_patterns.json](file:///f:/Github-Code/ThreadLine/data/phishing_patterns.json)
Regex patterns + keyword lists for detecting phishing-style naming.
**Source:** Public research — OWASP, MITRE ATT&CK, common phishing pattern knowledge.

#### [NEW] [data/platform_urls.json](file:///f:/Github-Code/ThreadLine/data/platform_urls.json)
50+ platform profile URL templates for username enumeration.
**Source:** [Sherlock's data.json](https://github.com/sherlock-project/sherlock/blob/master/sherlock_project/resources/data.json) — MIT licensed, 400+ sites.

#### [NEW] [data/disposable_emails.json](file:///f:/Github-Code/ThreadLine/data/disposable_emails.json)
3000+ disposable email provider domains.
**Source:** [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) — MIT licensed.

#### [NEW] [data/ip_ranges.json](file:///f:/Github-Code/ThreadLine/data/ip_ranges.json)
Offline IP-to-country/ISP mapping for common ranges (~500-1000 entries).
**Source:** [DB-IP Lite](https://db-ip.com/db/lite.php) — free, Creative Commons licensed. Download CSV, convert to JSON.

#### [NEW] [data/threat_indicators.json](file:///f:/Github-Code/ThreadLine/data/threat_indicators.json)
MITRE ATT&CK-based indicator patterns for threat scoring context.
**Source:** [MITRE ATT&CK](https://attack.mitre.org/) — public knowledge base.

---

### Component 3: Backend — Intelligence Modules

All backend logic lives in Next.js API routes and library files.

#### [NEW] [src/app/api/investigate/route.js](file:///f:/Github-Code/ThreadLine/src/app/api/investigate/route.js)

**The main SSE endpoint.** Accepts `?q=<input>&mode=standard|deep`

```
Flow:
1. Parse query: input value + scan mode
2. Detect input type (email / username / domain / IP)
3. Initialize SSE stream
4. Select modules based on type + mode
5. Dispatch modules in parallel (async)
6. Stream each module result as SSE event
7. Run correlation engine on all results
8. Run scoring engine
9. Generate AI explanation
10. Stream final summary + graph data
11. Close stream
```

**SSE Event Types:**
| Event | Payload |
|-------|---------|
| `status` | `{ message: "Scanning...", module: "dns" }` |
| `module_result` | `{ module: "dns", data: {...}, nodes: [...], edges: [...] }` |
| `graph_update` | `{ nodes: [...], edges: [...] }` |
| `score` | `{ score: 72, label: "High Risk", breakdown: [...] }` |
| `explanation` | `{ text: "This domain..." }` |
| `complete` | `{ summary: {...} }` |

---

#### [NEW] [src/lib/orchestrator.js](file:///f:/Github-Code/ThreadLine/src/lib/orchestrator.js)

Input type detection + mode-aware module routing.

```javascript
// Detection:
// Email:    contains '@' and valid domain
// Domain:   has TLD, no @, not IP
// IP:       matches x.x.x.x
// Username: everything else

// Routing (mode-aware):
function getModules(inputType, mode) {
  const standard = {
    domain:   ['dns', 'techFingerprint', 'patternAnalysis', 'datasetMatch'],
    email:    ['emailIntel', 'dns', 'patternAnalysis', 'datasetMatch'],
    username: ['usernameEnum', 'patternAnalysis', 'datasetMatch'],
    ip:       ['localIpLookup', 'dns', 'patternAnalysis', 'datasetMatch']
  };
  
  const deep = {
    domain:   ['subdomain', 'whois', 'dns', 'techFingerprint', 'patternAnalysis', 'datasetMatch', 'openphish'],
    email:    ['emailIntel', 'whois', 'dns', 'usernameEnum', 'patternAnalysis', 'datasetMatch'],
    username: ['usernameEnum', 'patternAnalysis', 'datasetMatch'],
    ip:       ['ipGeoApi', 'shodanInternetDB', 'localIpLookup', 'dns', 'patternAnalysis', 'datasetMatch']
  };
  
  return mode === 'deep' ? deep[inputType] : standard[inputType];
}
```

---

#### Intelligence Modules — Standard Mode (No External APIs)

#### [NEW] [src/lib/modules/dns.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/dns.js)
- Uses Node.js built-in `dns.promises` (system-level DNS resolver)
- Queries: A, AAAA, MX, NS, TXT, CNAME, SOA records
- **Why it's not an API:** Uses the OS DNS resolver, same as any app that connects to the internet
- Each record type → graph node

#### [NEW] [src/lib/modules/techFingerprint.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/techFingerprint.js)
- Direct `fetch()` to `https://{domain}` — like opening the website in a browser
- Reads response headers: `Server`, `X-Powered-By`, `X-Generator`, `Via`
- Checks security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- Flags missing security headers as risk factors
- **Why it's not an API:** You're visiting the target website, not calling a third-party service

#### [NEW] [src/lib/modules/usernameEnum.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/usernameEnum.js)
- Loads platform URLs from `data/platform_urls.json`
- HTTP HEAD/GET to `github.com/{user}`, `instagram.com/{user}`, etc.
- Check status: 200 = exists, 404 = not found
- Rate-limited: 500ms delay, User-Agent rotation
- **Standard mode:** Top 25 platforms (~10-12 sec)
- **Deep Research mode:** 50+ platforms (~25 sec)
- **Why it's not an API:** You're visiting profile pages, same as typing URLs in a browser

#### [NEW] [src/lib/modules/emailIntel.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/emailIntel.js)
- Extracts domain from email → DNS MX lookup
- Detects provider (Gmail, Outlook, ProtonMail, custom)
- Checks disposable email list (local JSON)
- Format validation + pattern analysis
- Extracts username part for cross-referencing

#### [NEW] [src/lib/modules/patternAnalysis.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/patternAnalysis.js)
- Pure algorithmic analysis on the input string
- Checks: phishing keywords, suspicious TLDs, excessive hyphens, digit patterns, domain age indicators, typosquatting patterns, leetspeak detection
- Loads rules from `data/phishing_patterns.json`
- Works on ALL input types
- **Zero network calls**

#### [NEW] [src/lib/modules/datasetMatch.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/datasetMatch.js)
- Searches local JSON datasets for matches:
  - `breach_emails.json` — email/username breach matches
  - `suspicious_domains.json` — domain reputation
  - `known_usernames.json` — username leak records
  - `domain_reputation.json` — domain scoring
  - `threat_indicators.json` — MITRE pattern matches
- Returns matched records with metadata
- **Zero network calls**

#### [NEW] [src/lib/modules/localIpLookup.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/localIpLookup.js)
- Searches `data/ip_ranges.json` for IP range matches
- Returns country, ISP, organization from offline dataset
- Reverse DNS lookup via `dns.promises.reverse()`
- **Zero external calls** — uses bundled dataset + system DNS

#### [NEW] Available vs. Missing Advanced Threat Limits (Standard Mode)
Based on an offline/No-API architecture, here is exactly what Standard Mode **HAS** versus what it **REQUIRES DEEP MODE FOR**:

✅ **What Standard Mode HAS (Runs Offline):**
- **Homograph / Punycode Detection:** Native JS parses strings for the `xn--` prefix or regex mixed scripts (Latin + Cyrillic). Needs zero external data.
- **Domain Reputation:** Cross-references target against the local `top-1m-domains.csv` checking for "newly registered/unknown" signals.
- **Known Bad Matches:** Exact string lookups against the local `security.csv` (Maligna entries) and `phisetank-dataset-phising.csv`.
- **IP Geo-Mismatch:** Uses offline `dbip-country-lite` to detect if an IP claiming to be a US service physically resolves to a high-risk country.

❌ **What Standard Mode LACKS (Requires Deep Mode):**
- **Live ASN / Network Ownership Validation:** We cannot mathematically prove an IP belongs to AS15169 (Google) without a live ASN API request or a massive 10GB BGP routing table offline file.
- **SSL/TLS Certificate Extraction (Port 443):** Node.js `tls.connect` can extract live certificates to check if they are 2-day old Let's Encrypt certs, but this requires making a live external cryptographic request to the target domain.
- **JARM Fingerprinting:** Sending active malformed TLS packets to a server to hash its response (to detect Cobalt Strike vs Nginx) requires live external interaction.
- **Live Reverse DNS Verification:** Accurately tracing a spoofed IP back to its true PTR record requires pinging authoritative DNS servers.

---

#### Intelligence Modules — Deep Research Mode (External Sources)

#### [NEW] [src/lib/modules/sslExtraction.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/sslExtraction.js)
- 🔬 Open direct cryptographic socket via Node.js native `tls.connect(443, domain)`
- Extract exact `valid_from` and `issuer` fields from `socket.getPeerCertificate()`
- Flags Let's Encrypt certificates under 3 days old as critical phishing risks.
- **External:** Port 443 to Target Domain

#### [NEW] [src/lib/modules/reverseDns.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/reverseDns.js)
- 🔬 Live Reverse DNS (PTR) Checks using Node.js `dns.promises.reverse(ip)`
- Accurately traces a spoofed IP back to its true registered PTR domain.
- **External:** Authoritative DNS Servers

#### [NEW] [src/lib/modules/asnLookup.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/asnLookup.js)
- 🔬 Fetches `http://ip-api.com/json/{ip}?fields=status,isp,org,as`
- Validates data center ownership (e.g., checking if it's hosted on DigitalOcean vs AS15169 Google).
- **External:** IP-API

#### [NEW] [src/lib/modules/jarmFingerprint.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/jarmFingerprint.js)
- 🔬 Queries Shodan internetDB or runs a native Python child process `exec('python3 jarm.py')`.
- Hashes active TLS Server Responses to fingerprint exact backend software (Cobalt Strike vs Nginx).
- **External:** Shodan API or Direct Port 443 malformed packets.

#### [NEW] [src/lib/modules/subdomain.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/subdomain.js)
- 🔬 Fetches `https://crt.sh/?q=%25.{domain}&output=json`
- Parses Certificate Transparency logs
- Deduplicates, removes wildcards
- Returns subdomains as graph nodes
- **External:** crt.sh (free, no key)

#### [NEW] [src/lib/modules/whois.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/whois.js)
- 🔬 Uses `whoiser` npm package (TCP port 43)
- Extracts: registrar, creation date, expiry, name servers, registrant org
- Flags young domains (<90 days) as suspicious
- **External:** WHOIS protocol servers

#### [NEW] [src/lib/modules/ipGeoApi.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/ipGeoApi.js)
- 🔬 Queries `http://ip-api.com/json/{ip}` (full geolocation)
- Returns: country, city, ISP, lat/long, timezone, org, AS
- **External:** ip-api.com (free, 45 req/min, HTTP only)

#### [NEW] [src/lib/modules/shodanInternetDB.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/shodanInternetDB.js)
- 🔬 Queries `https://internetdb.shodan.io/{ip}`
- Returns: open ports, known CVEs, hostnames, tags
- **External:** Shodan (free, no key)

#### [NEW] [src/lib/modules/openphish.js](file:///f:/Github-Code/ThreadLine/src/lib/modules/openphish.js)
- 🔬 Fetches `https://openphish.com/feed.txt`
- Checks if target domain appears in active phishing feed
- Caches feed for 1 hour to minimize requests
- **External:** OpenPhish (free, non-commercial)

---

#### Post-Processing Engines (Both Modes)

#### [NEW] [src/lib/correlation.js](file:///f:/Github-Code/ThreadLine/src/lib/correlation.js)
Connects all discovered entities into a unified graph:
```
email → domain          ("registered_on")
domain → subdomain      ("parent_of")
domain → IP             ("resolves_to")
IP → geolocation        ("located_in")
username → platform     ("active_on")
email → username        ("derived_from")
entity → dataset        ("matched_in")
entity → pattern        ("flagged_by")
domain → tech           ("powered_by")
domain → DNS record     ("has_record")
domain → breach         ("exposed_in")
IP → open_port          ("exposes")
domain → phishing_feed  ("flagged_in")
```

#### [NEW] [src/lib/scoring.js](file:///f:/Github-Code/ThreadLine/src/lib/scoring.js)
Heuristic threat scoring (0-100):
```
Standard mode factors:
+15  per breach dataset match
+10  per suspicious pattern detected
+8   per missing security header
+5   per exposed social profile
+10  matches phishing pattern rule
+3   disposable email provider
+7   suspicious DNS configuration
+5   email format anomaly

Deep mode bonus factors:
+20  domain age < 90 days (WHOIS)
+12  no SSL / HTTPS redirect fails
+8   resolves to known-bad IP range
+5   per open port (Shodan)
+15  found in OpenPhish feed
+7   excessive subdomains (>50, crt.sh)

Labels:
0-30:   "Low Risk"     (green)
31-60:  "Moderate"     (amber)
61-80:  "High Risk"    (red)
81-100: "Critical"     (pulsing red)
```

#### [NEW] [src/lib/explanation.js](file:///f:/Github-Code/ThreadLine/src/lib/explanation.js)
AI-style narrative generator. Produces polished text based on findings:
> "This identity was matched against 2 simulated breach datasets, suggesting credential exposure through data leaks. The associated domain uses a disposable email provider and lacks critical security headers. Pattern analysis detected phishing-style naming conventions. Combined signals indicate a **High Risk** of compromise."

---

### Component 4: Frontend — UI & UX

#### Full Project Structure

```
src/
├── app/
│   ├── layout.js                    # Root layout, fonts, metadata
│   ├── page.js                      # Landing screen (Step 1)
│   ├── investigate/
│   │   └── page.js                  # Search + Results (Steps 2-4)
│   ├── api/
│   │   └── investigate/
│   │       └── route.js             # SSE endpoint
│   └── globals.css                  # Design system + Tailwind
├── components/
│   ├── landing/
│   │   ├── Hero.jsx                 # Hero with CTA
│   │   └── ParticleField.jsx        # Neural network background
│   ├── search/
│   │   ├── SearchConsole.jsx        # Input field + mode toggle
│   │   ├── InputTypeIndicator.jsx   # Type detection badge
│   │   └── ModeToggle.jsx           # Standard ⚡ / Deep 🔬 switch
│   ├── scan/
│   │   ├── ScanAnimation.jsx        # Full-screen loading overlay
│   │   └── ScanMessages.jsx         # Rotating status messages
│   ├── dashboard/
│   │   ├── DashboardLayout.jsx      # Main grid layout
│   │   ├── SummaryPanel.jsx         # Identity + risk score card
│   │   ├── EvidencePanel.jsx        # Matched data + pattern flags
│   │   ├── ThreatMeter.jsx          # Animated circular gauge (0-100)
│   │   ├── TimelinePanel.jsx        # Chronological evidence
│   │   ├── ExplanationPanel.jsx     # AI narrative (typewriter)
│   │   ├── ModuleStatusGrid.jsx     # Shows which modules ran
│   │   └── ExportButton.jsx         # PDF download
│   ├── graph/
│   │   ├── IntelGraph.jsx           # D3 force-directed graph
│   │   └── NodeDetailPanel.jsx      # Side panel on node click
│   ├── terminal/
│   │   └── LiveTerminal.jsx         # Green-on-black scan log
│   └── ui/
│       ├── GlassCard.jsx            # Glassmorphism wrapper
│       ├── GlowBorder.jsx           # Neon border effect
│       ├── Logo.jsx                 # ThreadLine logo
│       └── UserBadge.jsx            # Top-left name badge
├── hooks/
│   ├── useInvestigation.js          # SSE + state management
│   └── useLocalStorage.js           # Name + prefs persistence
├── lib/                             # (modules described above)
└── data/                            # (datasets described above)
```

---

#### UX Flow — 4 Steps

**Step 1: Landing** (`/`)
- Dark cyber hero, particle field background
- ThreadLine logo with glow
- "Begin Investigation" CTA
- First visit: name prompt modal → saved to localStorage
- Top-left: icon + user name

**Step 2: Search Console** (`/investigate`)
- Single large input field
- Auto-detects type → shows badge (Email / Domain / Username / IP)
- **Mode Toggle:** ⚡ Standard (default) | 🔬 Deep Research
- Mode descriptions:
  - Standard: "Local analysis, no external queries"
  - Deep: "Full OSINT — live external sources"
- "Investigate" button

**Step 3: Scan Animation** (overlay)
- Full-screen Framer Motion transition
- Radar pulse + progress ring
- Real SSE status messages replace placeholders
- Module completion checkmarks appear

**Step 4: Dashboard** (reveals below search)
- Summary + Threat Meter + Evidence + Graph + Timeline + AI Explanation + Terminal
- Module Status Grid shows which modules ran (Standard vs Deep)
- Export Report button → client-side PDF

---

### Component 5: Design System

```css
/* ═══ ThreadLine Design Tokens ═══ */

/* Backgrounds */
--bg-void:         #030305;
--bg-primary:      #06060a;
--bg-secondary:    #0d0d14;
--bg-elevated:     #12121e;
--glass-bg:        rgba(13,13,25,0.6);
--glass-border:    rgba(0,212,255,0.12);

/* Accents */
--cyan:            #00d4ff;
--green:           #00ff88;
--red:             #ff3366;
--amber:           #ffaa00;
--purple:          #a855f7;

/* Text */
--text-primary:    #e2e8f0;
--text-secondary:  #64748b;

/* Typography */
--font-ui:         'Inter', system-ui, sans-serif;
--font-mono:       'JetBrains Mono', monospace;

/* Effects */
--blur-glass:      blur(20px);
--glow-cyan:       0 0 20px rgba(0,212,255,0.3);
```

---

### Component 6: Graph Visualization

#### [NEW] [src/components/graph/IntelGraph.jsx](file:///f:/Github-Code/ThreadLine/src/components/graph/IntelGraph.jsx)

D3.js force-directed graph on HTML5 Canvas.

**Node Types:**
| Type | Color | Shape |
|------|-------|-------|
| Input (query) | Cyan | Large pulsing circle |
| Domain | Purple | Circle |
| Subdomain | Purple-dim | Small circle |
| Email | Green | Circle |
| Username | Amber | Circle |
| IP Address | Red | Circle |
| Platform | White | Square |
| Dataset Match | Red | Triangle |
| Pattern Flag | Amber | Diamond |

**Interactions:** Hover highlights, click opens detail panel, drag nodes, zoom, auto-animate on load.

Dynamic import: `next/dynamic` with `{ ssr: false }`.

---

### Component 7: PDF Report

Client-side with jsPDF + html2canvas.

**Sections:**
1. Header — ThreadLine logo, title, date
2. Executive Summary — risk score, verdict
3. Evidence Table — all findings
4. AI Explanation — full narrative
5. Graph Snapshot — canvas capture
6. Timeline — chronological events
7. Footer — "Generated by ThreadLine"

---

### Component 8: n8n-Style Module Pipeline

Each module follows a standard interface and runs as an independent worker:

```javascript
// Every module exports:
export async function run(input, inputType, options) {
  return {
    module: 'module_name',
    mode: 'standard' | 'deep',       // which mode this belongs to
    status: 'success' | 'partial' | 'error',
    data: { ... },                    // raw findings
    nodes: [{ id, label, type }],     // graph nodes
    edges: [{ source, target, rel }], // graph edges
    riskContribution: 0-25,           // score contribution
    timeline: [{ time, event, detail }] // timeline entries
  }
}
```

The orchestrator dispatches all relevant modules in parallel via `Promise.allSettled()`, streaming results as they complete.

---

## Decisions (Finalized)

- **Mode Toggle:** Simple **on/off toggle** next to the search bar. Off = Standard (default), On = Deep Research.
- **Username Enumeration:** **25 platforms** in Standard mode, **50+ platforms** in Deep Research mode.

---

## Verification Plan

### Build & Run
```bash
npm run build    # Verify no errors
npm run dev      # Start dev server
```

### Browser Tests
1. Landing page renders with particle background
2. Search console detects input types
3. Mode toggle switches between Standard/Deep
4. SSE stream connects and delivers events
5. Scan animation plays with real status messages
6. Dashboard panels populate with data
7. Graph renders with interactive nodes
8. Threat meter animates to correct score
9. AI explanation renders with typewriter effect
10. PDF export generates and downloads
11. localStorage persists name and preferences

### Edge Cases
- Invalid input handling
- Network timeout for Deep mode modules
- Empty results graceful handling
- Mode switch mid-investigation

---

## Estimated Effort

| Phase | Scope | Time |
|-------|-------|------|
| 1. Foundation | Next.js + Tailwind + design system | 1-2h |
| 2. Datasets | Create all 8 JSON datasets | 1-2h |
| 3. Standard Modules | 6 local modules | 3-4h |
| 4. Deep Modules | 5 external modules | 2-3h |
| 5. Orchestrator + SSE | Streaming pipeline | 2h |
| 6. Correlation + Scoring | Intelligence layer | 2h |
| 7. Landing + Search | Landing, console, mode toggle | 2-3h |
| 8. Scan Animation | Full-screen dramatic loading | 1-2h |
| 9. Dashboard | 7 panels + layout | 3-4h |
| 10. Graph | D3 force-directed + interactions | 3-4h |
| 11. PDF | Report generation | 1-2h |
| 12. Polish | Animations, edge cases, demo prep | 2-3h |
| **Total** | | **~24-34h** |
