"""Copy the Senior Living (Anubandham) PWA into public/senior-living/ so it ships with this site.

The app is developed separately. After changing it, run its own build first, then this script,
then commit public/senior-living/:

    python3 ~/Documents/Claude/Garimella/Anubandham_App/build.py
    python3 scripts/sync-senior-living.py [path-to-Anubandham_App]

Netlify's _headers file is skipped; the equivalent no-cache rules live in my-apache.conf.
"""
import os, shutil, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Documents/Claude/Garimella/Anubandham_App")
BUILD = os.path.join(SRC, "deploy")
DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "senior-living")

if os.path.getmtime(os.path.join(SRC, "anubandham.html")) > os.path.getmtime(os.path.join(BUILD, "index.html")):
    sys.exit("anubandham.html is newer than deploy/index.html — run the app's build.py first.")

shutil.rmtree(DEST, ignore_errors=True)
os.makedirs(DEST)
for name in os.listdir(BUILD):
    if name != "_headers" and not name.startswith("."):
        shutil.copy2(os.path.join(BUILD, name), DEST)
print("Synced Senior Living into", os.path.normpath(DEST), "-", sorted(os.listdir(DEST)))
