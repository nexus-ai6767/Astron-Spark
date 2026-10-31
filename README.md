# ASTRON website

Static site (`index.html`, `style.css`, `script.js`, `astron-assistant.js`) plus an optional Node server for manual UPI order review and the website assistant.

## Run locally
- Static preview: open `index.html`, or `npx serve .`
- With the API: `cp .env.example .env`, set `ADMIN_TOKEN` (24+ chars), then `npm install && npm start`

## Before deploying
- Replace `your-domain-here.com` in `index.html`, `robots.txt` and `sitemap.xml`.
- Put the private Pro build at `PRODUCT_ZIP` (see `.env.example`); it is never served publicly.
- `JARVIS_PC_RELEASE.zip` and `JARVIS_STARTER.zip` are the public downloads linked from the page.
