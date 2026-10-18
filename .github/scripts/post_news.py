"""Постит в Telegram-канал новости, которые впервые появились в этом пуше.
Правки существующих страниц не постятся. Максимум 3 поста за раз."""
import os, re, sys, json, subprocess, urllib.request, urllib.parse

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
CHAT = os.environ.get("TELEGRAM_CHAT_ID", "@seville_info").strip() or "@seville_info"
BEFORE = os.environ.get("BEFORE_SHA", "")
SITE = "http://sevilleinfo.ru/"
DRY = os.environ.get("DRY_RUN") == "1"

if not TOKEN and not DRY:
    print("Нет TELEGRAM_BOT_TOKEN — пропускаю."); sys.exit(0)

def git(*a): return subprocess.run(["git", *a], capture_output=True, text=True).stdout
if not BEFORE or set(BEFORE) == {"0"}:
    print("Нет предыдущего коммита — пропускаю."); sys.exit(0)
added = [f for f in git("diff", "--name-only", "--diff-filter=A", BEFORE, "HEAD").split()
         if re.fullmatch(r"news-[\w-]+\.html", f)]
if not added: print("Новых новостей нет."); sys.exit(0)
if len(added) > 3: print("Слишком много новых страниц сразу (%d) — постю первые 3." % len(added)); added = added[:3]

def clean(s): return re.sub(r"<[^>]+>", "", s).strip()
for f in added:
    h = open(f, encoding="utf-8").read()
    t = re.search(r"<h1>(.*?)</h1>", h, re.S); l = re.search(r'<p class="lead">(.*?)</p>', h, re.S)
    if not t: print("Нет заголовка в", f); continue
    text = "<b>%s</b>\n\n%s\n\n<a href=\"%s%s\">Читать на сайте →</a>" % (clean(t.group(1)), clean(l.group(1)) if l else "", SITE, f)
    if DRY: print("---", f, "\n", text); continue
    data = urllib.parse.urlencode({"chat_id": CHAT, "text": text, "parse_mode": "HTML"}).encode()
    r = json.load(urllib.request.urlopen("https://api.telegram.org/bot%s/sendMessage" % TOKEN, data, timeout=20))
    print(f, "->", "ok" if r.get("ok") else r)
