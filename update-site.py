#!/usr/bin/env python3
"""Keep the website's download facts true. Standard library only.

Run it from the website folder after you replace a zip:

    python update-site.py                       # refresh size / SHA-256 / date for each zip
    python update-site.py --domain example.com  # also replace the your-domain-here.com placeholder

It edits index.html (the data-size, data-sha and data-date elements) and rewrites checksums.txt.
"""
import argparse, hashlib, os, re, sys, zipfile
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
PLACEHOLDER = "your-domain-here.com"
TEXT_EXT = (".html", ".xml", ".txt", ".json", ".md", ".js")


def human(n):
    return f"{n / 1024:.1f} KB" if n < 1024 * 1024 else f"{n / 1048576:.1f} MB"


def zip_date(path):
    """Newest file date stored inside the zip (stable, unlike the copy's modified time)."""
    with zipfile.ZipFile(path) as z:
        stamps = [datetime(*i.date_time) for i in z.infolist() if i.date_time[0] >= 1980]
    d = max(stamps) if stamps else datetime.fromtimestamp(os.path.getmtime(path))
    return f"{d.day} {d.strftime('%b %Y')}"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--domain", help="your real domain, e.g. astron.example.com (no https://)")
    args = ap.parse_args()

    index = os.path.join(HERE, "index.html")
    html = open(index, encoding="utf-8").read()
    names = sorted(set(re.findall(r'data-(?:sha|size|date)="([^"]+)"', html)))
    lines = []
    for name in names:
        path = os.path.join(HERE, name)
        if not os.path.isfile(path):
            print(f"! missing {name}, skipped")
            continue
        digest, size, date = sha256(path), human(os.path.getsize(path)), zip_date(path)
        html = re.sub(rf'(data-sha="{re.escape(name)}">)[^<]*', rf"\g<1>{digest}", html)
        html = re.sub(rf'(data-size="{re.escape(name)}">)[^<]*', rf"\g<1>{size}", html)
        html = re.sub(rf'(data-date="{re.escape(name)}">)[^<]*', rf"\g<1>{date}", html)
        lines.append(f"{digest}  {name}")
        print(f"{name}: {size}, {date}, {digest[:16]}…")
    open(index, "w", encoding="utf-8").write(html)
    open(os.path.join(HERE, "checksums.txt"), "w").write("\n".join(lines) + "\n")

    if args.domain:
        domain = args.domain.replace("https://", "").replace("http://", "").strip("/")
        count = 0
        for fn in os.listdir(HERE):
            if fn.endswith(TEXT_EXT) and fn != "update-site.py":
                p = os.path.join(HERE, fn)
                s = open(p, encoding="utf-8").read()
                if PLACEHOLDER in s:
                    open(p, "w", encoding="utf-8").write(s.replace(PLACEHOLDER, domain))
                    count += 1
        print(f"domain set to {domain} in {count} file(s)")
    else:
        left = [f for f in os.listdir(HERE) if f.endswith(TEXT_EXT) and PLACEHOLDER in open(os.path.join(HERE, f), encoding="utf-8").read()]
        if left:
            print(f"note: placeholder domain still present in: {', '.join(sorted(left))}  (run with --domain)")

if __name__ == "__main__":
    sys.exit(main())
