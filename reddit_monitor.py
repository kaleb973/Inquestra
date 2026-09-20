#!/usr/bin/env python3
"""
Inquestra Reddit Monitor
------------------------
Checks r/labrats, r/PhD, r/bioengineering, r/molecularbiology daily for
posts about ELNs, lab notebooks, and competing tools.

Saves a digest to reddit_digest_YYYY-MM-DD.txt in the same folder.

Run manually:   python reddit_monitor.py
Schedule it:    Windows Task Scheduler -> run daily at 9am
No API keys needed. Uses Reddit's public JSON endpoints.
"""

import urllib.request
import urllib.parse
import json
import re
import os
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────

SUBREDDITS = [
    "labrats",
    "PhD",
    "bioengineering",
    "molecularbiology",
    "biochemistry",
]

KEYWORDS = [
    "ELN",
    "electronic lab notebook",
    "benchling",
    "labarchives",
    "scinote",
    "elab",
    "lab notebook",
    "protocol software",
    "sample inventory",
    "research notebook",
]

# Only show posts newer than this many days
MAX_AGE_DAYS = 7

# Minimum upvotes to include (filters out noise)
MIN_SCORE = 1

# Where to save the digest
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Reddit OAuth2 Setup ───────────────────────────────────────────────────────
#
# Reddit now requires authentication for search. Get free credentials in 2 min:
#   1. Go to https://www.reddit.com/prefs/apps
#   2. Click "create another app" at the bottom
#   3. Choose "script", name it anything (e.g. "labresearch")
#   4. Set redirect URI to:  http://localhost:8080
#   5. Copy the CLIENT_ID (under the app name) and CLIENT_SECRET
#   6. Fill in your Reddit username and password below
#
# This uses "script" OAuth — reads public posts only. No posting.

REDDIT_CLIENT_ID     = "YOUR_CLIENT_ID_HERE"
REDDIT_CLIENT_SECRET = "YOUR_CLIENT_SECRET_HERE"
REDDIT_USERNAME      = "YOUR_REDDIT_USERNAME"
REDDIT_PASSWORD      = "YOUR_REDDIT_PASSWORD"

_token_cache: dict = {}


def get_access_token() -> str | None:
    if _token_cache.get("token"):
        return _token_cache["token"]

    url = "https://www.reddit.com/api/v1/access_token"
    credentials = f"{REDDIT_CLIENT_ID}:{REDDIT_CLIENT_SECRET}"
    import base64
    b64 = base64.b64encode(credentials.encode()).decode()
    headers = {
        "Authorization": f"Basic {b64}",
        "User-Agent": f"InquestraMonitor/1.0 by {REDDIT_USERNAME}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    body = (
        f"grant_type=password"
        f"&username={urllib.parse.quote(REDDIT_USERNAME)}"
        f"&password={urllib.parse.quote(REDDIT_PASSWORD)}"
    ).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            token = data.get("access_token")
            _token_cache["token"] = token
            return token
    except Exception as e:
        print(f"    [auth failed: {e}]")
        return None


def fetch_json(url: str) -> dict | None:
    # Convert www.reddit.com to oauth.reddit.com for authenticated requests
    url = url.replace("https://www.reddit.com/", "https://oauth.reddit.com/")
    token = get_access_token()
    if not token:
        return None
    headers = {
        "Authorization": f"bearer {token}",
        "User-Agent": f"InquestraMonitor/1.0 by {REDDIT_USERNAME}",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            raw = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", raw)
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print(f"    [rate limited, skipping]")
        elif e.code == 403:
            print(f"    [access denied — check your credentials]")
        else:
            print(f"    [HTTP {e.code}, skipping]")
        return None
    except Exception as e:
        print(f"    [fetch error: {type(e).__name__}, skipping]")
        return None


def keyword_match(text: str) -> list[str]:
    """Return list of matched keywords (case-insensitive)."""
    text_lower = text.lower()
    return [kw for kw in KEYWORDS if kw.lower() in text_lower]


def age_days(utc_timestamp: float) -> float:
    now = datetime.now(timezone.utc).timestamp()
    return (now - utc_timestamp) / 86400


def engagement_label(score: int, comments: int) -> str:
    if score >= 50 or comments >= 20:
        return "[HIGH]"
    if score >= 10 or comments >= 5:
        return "[MED] "
    return "[LOW] "


# ── Main ──────────────────────────────────────────────────────────────────────

def scan_subreddit(subreddit: str, keyword: str) -> list[dict]:
    encoded = urllib.parse.quote(keyword)
    url = (
        f"https://www.reddit.com/r/{subreddit}/search.json"
        f"?q={encoded}&restrict_sr=1&sort=new&limit=15"
    )
    data = fetch_json(url)
    if not data:
        return []

    posts = []
    try:
        children = data["data"]["children"]
    except (KeyError, TypeError):
        return []

    for child in children:
        try:
            d = child["data"]
            score = d.get("score", 0)
            created = d.get("created_utc", 0)
            days_old = age_days(created)

            if days_old > MAX_AGE_DAYS:
                continue
            if score < MIN_SCORE:
                continue

            title = d.get("title", "").strip()
            body = d.get("selftext", "").strip()
            full_text = title + " " + body

            matched = keyword_match(full_text)
            if not matched:
                continue

            posts.append({
                "subreddit": subreddit,
                "title": title,
                "score": score,
                "comments": d.get("num_comments", 0),
                "days_old": round(days_old, 1),
                "permalink": "https://reddit.com" + d.get("permalink", ""),
                "body_preview": body[:300].replace("\n", " ") if body else "",
                "matched_keywords": matched,
                "post_id": d.get("id", ""),
            })
        except Exception:
            continue

    return posts


def deduplicate(posts: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for p in posts:
        if p["post_id"] not in seen:
            seen.add(p["post_id"])
            out.append(p)
    return out


def build_digest(posts: list[dict]) -> str:
    today = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        "=" * 70,
        f"  INQUESTRA REDDIT RESEARCH DIGEST — {today}",
        "=" * 70,
        "",
    ]

    if not posts:
        lines.append("No new relevant posts found in the last 7 days.")
        return "\n".join(lines)

    # Sort by engagement (score + comments)
    posts.sort(key=lambda p: p["score"] + p["comments"] * 2, reverse=True)

    lines.append(f"Found {len(posts)} relevant post(s):\n")

    for i, p in enumerate(posts, 1):
        label = engagement_label(p["score"], p["comments"])
        lines += [
            f"{'─' * 60}",
            f"#{i}  {label}  r/{p['subreddit']}  [{p['days_old']}d ago]",
            f"TITLE:    {p['title']}",
            f"SCORE:    {p['score']} upvotes | {p['comments']} comments",
            f"KEYWORDS: {', '.join(p['matched_keywords'])}",
            f"LINK:     {p['permalink']}",
        ]
        if p["body_preview"]:
            lines.append(f"PREVIEW:  {p['body_preview'][:250]}...")
        lines.append("")

    lines += [
        "=" * 70,
        "HOW TO ENGAGE (quick reminder):",
        "  [HIGH] -> Reply within 24h. Help first, no pitch.",
        "  [MED]  -> Worth reading + engaging if relevant.",
        "  [LOW]  -> Read for insights. Low visibility, don't waste time.",
        "",
        "DISCLOSURE TEMPLATE (use whenever you mention Inquestra):",
        '  "[disclosure: I\'m building Inquestra, an ELN aimed at this exact',
        '   problem, so take my input with appropriate skepticism]"',
        "=" * 70,
    ]

    return "\n".join(lines)


def main():
    print(f"\nInquestra Reddit Monitor — {datetime.now().strftime('%Y-%m-%d')}")
    print("Scanning subreddits...\n")

    all_posts = []
    for subreddit in SUBREDDITS:
        for keyword in KEYWORDS:
            print(f"  r/{subreddit} <- '{keyword}'")
            posts = scan_subreddit(subreddit, keyword)
            all_posts.extend(posts)

    posts = deduplicate(all_posts)
    digest = build_digest(posts)

    filename = f"reddit_digest_{datetime.now().strftime('%Y-%m-%d')}.txt"
    output_path = os.path.join(OUTPUT_DIR, filename)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(digest)

    print(f"\nDone. {len(posts)} posts found.")
    print(f"Digest saved to: {output_path}\n")
    print(digest)


if __name__ == "__main__":
    main()
