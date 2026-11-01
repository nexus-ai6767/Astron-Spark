# ASTRON website

Static site (HTML, CSS, vanilla JS). Upload every file in this folder to the root of your GitHub repo; there are no sub-folders.

## Things to edit
- `site-config.js` — version, GitHub repo for live counts, real testimonials, real Android screenshot file names.
- `python update-site.py` — refreshes size / SHA-256 / date for each zip and `checksums.txt`. Run it whenever you replace a zip.
- `python update-site.py --domain yourdomain.com` — replaces the `your-domain-here.com` placeholder everywhere.
- `privacy.html`, `terms.html`, `refund.html` — drafts. Add your legal name/address and have them reviewed. Confirm the refund terms.

## Backend (optional, for payments and the assistant)
`npm install`, copy `.env.example` to `.env`, then `npm start`. See `server.js`.
