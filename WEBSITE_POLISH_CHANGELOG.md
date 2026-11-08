# ASTRON Website Polish Changelog

## Source and scope
- Updated the existing `index.html`, `style.css`, and `script.js` in place.
- Kept the existing site structure, release ZIPs, server folder, pricing/payment forms, download paths, and existing sections.

## Changes
- Added a responsive mobile navigation toggle with accessible labels, `aria-expanded`, Escape-to-close, and close-on-link behavior.
- Mobile navigation uses a compact Get Started CTA and hides the two wide desktop nav buttons.
- Applied a consistent electric-blue/cyan accent palette across the existing page styling.
- Replaced unsupported-looking live metrics (uptime, command count, voice accuracy, response time) with feature-status labels instead of presenting unverified numbers as measured facts.
- Clarified that the command demo is an illustrative simulation and does not control the visitor's PC.
- Added reduced-motion handling and improved mobile layout for the compatibility panel.

## Verification
- Parsed the HTML with Python's standard HTMLParser successfully.
- `node --check script.js` passed when Node.js is available.
- ZIP integrity checked after packaging.
- This is static-source validation only; it does not claim cross-browser or Windows runtime testing.

## Rollback
Restore `index.html`, `style.css`, and `script.js` from the original `ASTRON_Website_Android_Link_Fixed.zip`.

## Motion layer (fx.css, fx.js, fx2.js)
- `fx.css` + `fx.js`: boot sequence, interactive neural background, cursor glow, sliding nav pill, word-by-word hero headline, typed voice demo, marquee, 3D card tilt with animated borders, magnetic buttons, price count-up, back-to-top ring. Loaded on all pages.
- `fx2.js`: 3D particle core over the hero art (plain canvas, no libraries) and the pinned scroll-driven "How it works" section. Home page only.
- All motion respects prefers-reduced-motion; cursor effects are off on touch devices.
- Rollback: delete the `fx*` <link>/<script> lines from the HTML pages.

## fx3 premium layer (fx3.css, fx3.js) — added in this update
- New `In motion` bento section (index.html, before "How it works"): animated voice waveform with rotating demo phrases, local-first diagram, hand-landmark sketch, memory web, command pipeline. Labelled as decorative, not live data.
- Aurora gradient backdrop, light film grain, cursor-lit card borders, rotating border-beam on the screenshot frame and featured price card, blur-in section headings, gradient shimmer, softer button glow.
- Right-edge section dock (screens >= 1280 px) with tooltips and active-section tracking.
- Ctrl/Cmd+K (or "/") command palette: jump to sections, open docs or the assistant, switch accent colour (blue / violet / emerald / amber, remembered in localStorage).
- Footer wordmark, slim custom scrollbar.
- Respects prefers-reduced-motion; cursor effects only on fine-pointer devices; grain hidden on phones.
- Loaded from index.html, docs.html, privacy.html, terms.html, refund.html. Rollback: delete the two `fx3` lines in each page (and the `id="in-motion"` section in index.html).
- Checked in headless Chromium: no page errors, no horizontal overflow at 1440 px and 390 px, palette and accent switching work. Not checked: Safari/Firefox, real touch devices.
- Not translated: the new section's text is English-only (i18n.js has no keys for it yet).

## Mobile optimisation pass (fx3.css / fx3.js / viewport meta)
- Bug fix (existing): the Command lab grid column was sized by its widest child, so on phones the Run button and pipeline spilled out of the card and were clipped. Fixed with `minmax(0,1fr)`.
- Touch targets: buttons, preset chips, tabs, copy/sound/language toggles, back-to-top and menu button are at least 44 px on touch devices; form checkboxes are 24 px inside 44 px rows.
- Inputs are 16 px on touch devices so iOS Safari does not zoom the page on focus.
- Safe areas: `viewport-fit=cover` on every page; nav, assistant button, back-to-top and footer respect notches and the home indicator.
- Performance on phones: aurora is static (no blur filter, no animation), heading blur-in, shimmer, border-beam and card-glow effects are off, grain is hidden, reveal transitions are shorter, bento animations pause while off-screen (all screen sizes).
- Touch: sticky hover lifts removed, tap highlight removed, `touch-action: manipulation` to avoid the tap delay.
- Layout: tighter section rhythm, full-width hero buttons, 12 px minimum for real text, wrapped long code/tables, narrower assistant panel, 100dvh mobile menu that scrolls on short phones, landscape-phone rules, extra rules under 380 px.
- Checked in headless Chromium (touch emulation) at 360 x 740 and 390 x 844: no horizontal overflow, no page errors, menu opens and navigates. Not checked: real iOS Safari / Android Chrome devices.
- Note: `jarvis-pro-launch-bg.png` (1.7 MB) and `jarvis-mobile-coming-soon.png` (1.3 MB) are not referenced by any page; delete them from the repo to keep it light.

## fx4 — download flow, comparison, proof hooks (fx4.css, fx4.js)
- **Sticky mobile bar** (phones ≤ 760 px): slim "Get ASTRON" bar appears after the hero, hides near pricing/downloads/payment/CTA/footer, while the menu or assistant is open, and can be dismissed (remembered for the session). Floating assistant and back-to-top buttons move up while it is visible.
- **Device detection**: a tiny inline script in `<head>` sets `html[data-os]` (windows / android / ios / mac / linux / other). CSS then highlights the matching download row ("Recommended for your device"), shows a one-line note above the downloads, switches the sticky bar label and the final CTA button (Android gets the APK), and points the hero button at the Android section. Mac, Linux and iOS visitors see an honest "ships for Windows and Android" note. All variants are static HTML, so the Hindi toggle translates them.
- **Pricing**: "Which one should I pick?" helper (4 choices → matching card, highlighted pricing card and table column) and a Core / Starter / Pro comparison table. Every table cell comes from wording already on this site; a dash means "not listed for that edition", not "not included".
- **Demo video**: "See it in action" section stays hidden until `demoVideo` is set in `site-config.js`. Muted, looping, `playsinline`, nothing downloads until it scrolls into view, pauses off-screen, no autoplay under reduced-motion or Save-Data (play button instead).
- **Testimonials and Android screenshots**: unchanged code paths in `script.js`. They need real content in `site-config.js` (`testimonials`, `androidScreens`). Nothing was invented.
- **Footer**: "All systems online" (a static claim shown with a pulsing dot) is now "Local-first · Windows & Android" with a non-pulsing dot, on all five pages.
- Hindi strings added in `i18n.js` for everything new.
- Checked in headless Chromium with Windows, Android and macOS user agents: correct note/badges/labels, no overflow at 390 / 1200 / 1440 px, no page errors, Hindi toggle works. Not checked: real devices, Safari/Firefox.

## Hero: robot image replaced by a 3D core
- Removed the robot `<img>` and its preload from index.html (astron-robot.webp is no longer referenced; delete it to save weight).
- `fx2.js` now draws a centrepiece core in plain canvas: glowing nucleus, ~600-point sphere with wireframe, three orbit rings with beads, floating sparks. Follows the mouse, pulses, pauses off-screen, still frame under reduced-motion. No libraries.

## Hero core v3 (fx2.js)
- Layers: soft atmosphere, HUD ring (ticks, rotating segments, dashed inner ring), radial voice-waveform ring, glassy point shell with edge glow and a sweeping scan band, inner rotating crystal (icosahedron), plasma nucleus with light rays, energy arcs travelling across the surface, three orbit rings with comet trails, floating sparks.
- Reacts to the hero's typed voice demo: typing raises the waveform ring, the "✓ …" reply fires a burst.
- Colours follow the accent switcher (blue / violet / emerald / amber) via the --cyan, --blue, --violet variables.
- Glows are pre-rendered sprites (rebuilt only when the accent changes); pauses off-screen; still frame under reduced-motion; fewer points on phones.

## Core loads faster (core.js)
- The hero core moved out of `fx2.js` into its own `core.js`, preloaded and loaded before every other script. It paints its first frame immediately and fades in; it hooks the typed voice demo later, once that exists.
- The intro/boot screen is now **off by default** (it held the page for about 1 s before the hero was visible). Set `bootScreen: true` in `site-config.js` to bring it back. When on, it is also shorter (about 0.9 s).
- Measured in headless Chromium (software rendering, no GPU): core visible to the user at roughly 2.4 s before, roughly 0.8 s after. Real devices will differ.
- Deploy note: upload `core.js` next to the other files.
