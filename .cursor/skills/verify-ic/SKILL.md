# Verify Ic
Iceland's Ring of Wonder: An Explorer's Map - static leaflet map experience.
## Launch
Any static file server from the repo root, e.g. python3 -m http.server.
## Doctor
`python3 .cursor/skills/verify-ic/verify.py`
## Drive
Serves the static site and renders it in headless Chromium asserting the boot marker, map container, and zero JS console errors.
## Evidence
`.cursor/skills/verify-ic/evidence.json`
## Cleanup
Static/production server terminated after the render.
## Known boundaries
Render smoke only; scene quality unverified.
