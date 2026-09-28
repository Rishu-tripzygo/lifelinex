# LifelineX Landing Page

Plain HTML/CSS/JS. No build step, no framework, no external dependency
except the Google Fonts stylesheet link in <head>.

## Files
- index.html   — the whole page (markup + styles + the assessment quiz script reference)
- quiz.js      — vanilla JS for the 12-step assessment (no libraries)
- assets/      — logo (SVG) and two photos (JPG), referenced by relative path

## To deploy
Upload this folder as-is to any static host (Vercel, Netlify, S3, cPanel, etc.)
or your existing web server's public directory. `index.html` is the entry point.

## Known placeholders / next steps
1. "Book Your Slot" (pricing section) currently links directly to a Cal.com
   booking page (https://cal.com/doctor-pj77l1/30min) with NO payment gate yet.
   Razorpay integration (charge Rs.999 -> then show booking link) is the next step.
2. No CRM webhook is wired up yet — quiz answers currently go nowhere but the
   browser's memory. Wire `quiz.js`'s state object to your CRM once you have
   an endpoint.
3. Google Fonts (Sora, Work Sans) load from Google's CDN at runtime — normal
   and recommended, but note it as an external dependency.
4. Favicon uses assets/logo-icon.svg.

## Custom domain
GitHub Pages: repo Settings -> Pages -> Deploy from branch `main` / root, then add your domain.
Or import the repo in Vercel/Netlify (no build command, output dir = root) and attach the domain there.
