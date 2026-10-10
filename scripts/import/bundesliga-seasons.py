"""
Bundesliga final tables 2005/06-2024/25 for Målløs (data/source/seasons.json).

Two independent sources, and a season is written only if they agree exactly:
  1. football-data.co.uk D1.csv: every match result; the table is computed here
     (3 points per win, then goal difference, then goals scored).
  2. English Wikipedia's league table for the season (the {{#invoke:sports table}}
     block): W/D/L/GF/GA per club.
Every club's (points, goals for, goals against) must match between the two, and no two
clubs may be level on points, goal difference and goals, so the order is unambiguous.
"Relegated" = in the table this season and absent from the next season's fixtures
(2025/26 is read for the last one), which also covers relegation play-off losers.

  python3 scripts/import/bundesliga-seasons.py
"""
import csv, io, json, re, sys, urllib.parse, urllib.request
from collections import defaultdict

FIRST, LAST = 2006, 2025  # end years of the seasons
UA = {"User-Agent": "quizkaiser-data/1.0"}
CLUB = {
    "Bayern Munich": "bayern", "Dortmund": "dortmund", "Schalke 04": "schalke", "Werder Bremen": "werder",
    "Nurnberg": "nuernberg", "Wolfsburg": "wolfsburg", "Ein Frankfurt": "frankfurt", "RB Leipzig": "leipzig",
    "Leverkusen": "leverkusen", "Stuttgart": "stuttgart", "Hamburg": "hsv", "Kaiserslautern": "kaiserslautern",
    "Hannover": "hannover", "M'gladbach": "gladbach", "Hertha": "hertha", "Mainz": "mainz", "Bielefeld": "bielefeld",
    "FC Koln": "koeln", "Duisburg": "duisburg", "Bochum": "bochum", "Cottbus": "cottbus", "Aachen": "aachen",
    "Karlsruhe": "karlsruhe", "Hansa Rostock": "rostock", "Hoffenheim": "hoffenheim", "Freiburg": "freiburg",
    "St Pauli": "st-pauli", "Augsburg": "augsburg", "Fortuna Dusseldorf": "duesseldorf", "Greuther Furth": "fuerth",
    "Braunschweig": "braunschweig", "Paderborn": "paderborn", "Ingolstadt": "ingolstadt", "Darmstadt": "darmstadt",
    "Union Berlin": "union-berlin", "Heidenheim": "heidenheim", "Holstein Kiel": "holstein-kiel",
}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()

def fd_url(end):
    return f"https://www.football-data.co.uk/mmz4281/{(end - 1) % 100:02d}{end % 100:02d}/D1.csv"

def fd_table(end):
    rows = defaultdict(lambda: [0, 0, 0, 0])
    for r in csv.DictReader(io.StringIO(get(fd_url(end)).decode("latin-1"))):
        if not r.get("HomeTeam"):
            continue
        h, a, hg, ag = r["HomeTeam"], r["AwayTeam"], int(r["FTHG"]), int(r["FTAG"])
        for t, gf, ga in ((h, hg, ag), (a, ag, hg)):
            x = rows[t]; x[1] += gf; x[2] += ga; x[3] += 1; x[0] += 3 if gf > ga else 1 if gf == ga else 0
    return sorted(rows.items(), key=lambda kv: (-kv[1][0], -(kv[1][1] - kv[1][2]), -kv[1][1]))

def wiki_title(end):
    return f"{end - 1}–{end % 100:02d} Bundesliga"

def wiki_table(end):
    raw = lambda t: get("https://en.wikipedia.org/w/index.php?title=" + urllib.parse.quote(t) + "&action=raw").decode()
    s = raw(wiki_title(end))
    m = re.search(r"\{\{(%d[–-]%02d Bundesliga table)\}\}" % (end - 1, end % 100), s)
    if m:
        s = raw("Template:" + m.group(1).replace("-", "–"))
    blk = s[s.lower().find("sports table"):]
    g = lambda k, c: int((re.search(r"\|\s*%s_%s\s*=\s*(-?\d+)" % (k, re.escape(c)), blk) or [0, 0])[1])
    codes = sorted(set(re.findall(r"\|\s*win_([^\s=|]+)\s*=", blk)))
    return {(3 * g("win", c) + g("draw", c) + g("adjust_points", c), g("gf", c), g("ga", c)) for c in codes}

def main():
    tables = {end: fd_table(end) for end in range(FIRST, LAST + 2)}
    seasons, problems = [], []
    for end in range(FIRST, LAST + 1):
        t = tables[end]
        fd = {(v[0], v[1], v[2]) for _, v in t}
        if len(t) != 18 or any(v[3] != 34 for _, v in t): problems.append(f"{end}: not 18 clubs x 34 games")
        if fd != wiki_table(end): problems.append(f"{end}: football-data and Wikipedia disagree")
        for (_, a), (_, b) in zip(t, t[1:]):
            if (a[0], a[1] - a[2], a[1]) == (b[0], b[1] - b[2], b[1]): problems.append(f"{end}: unresolved tie")
        nxt = {n for n, _ in tables[end + 1]}
        ids = [CLUB[n] for n, _ in t]
        relegated = [CLUB[n] for n, _ in t if n not in nxt]
        if len(relegated) not in (2, 3): problems.append(f"{end}: {len(relegated)} relegated")
        seasons.append({
            "id": f"bundesliga-{end}", "competition": "bundesliga", "year": end, "name": f"Bundesliga {end - 1}/{end % 100:02d}",
            "status": "verified",
            "sources": [
                {"url": fd_url(end), "title": f"football-data.co.uk – Bundesliga {end - 1}/{end % 100:02d}, alle 306 Ergebnisse", "kind": "web", "accessed": "2026-10-10", "note": "Tabelle aus den Ergebnissen berechnet (Punkte, Tordifferenz, Tore)."},
                {"url": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(wiki_title(end).replace(" ", "_")), "title": f"{wiki_title(end)} – Wikipedia", "kind": "web", "accessed": "2026-10-10", "note": "Punkte, Tore und Gegentore aller 18 Klubs stimmen mit football-data.co.uk überein."},
            ],
            "table": [{"club": c, "points": v[0], **({"outcome": "champion"} if i == 0 else {"outcome": "relegated"} if c in relegated else {})} for i, (c, (_, v)) in enumerate(zip(ids, t))],
            "relegated": relegated,
        })
    if problems:
        sys.exit("\n".join(problems))
    json.dump(seasons, open("data/source/seasons.json", "w"), ensure_ascii=False, indent=2)
    print(f"wrote {len(seasons)} seasons")

main()
