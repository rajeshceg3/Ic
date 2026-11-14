# Fieldbook mobile regression

With Playwright available:

    NODE_PATH=/path/to/node_modules CHROME_PATH=/path/to/chrome WIDTHS=320,390,1280 node verification/mobile.cjs
    NODE_PATH=/path/to/node_modules CHROME_PATH=/path/to/chrome WIDTHS=320,390,1280 node verification/places.cjs
    NODE_PATH=/path/to/node_modules CHROME_PATH=/path/to/chrome node verification/extra.cjs

URL overrides the local Python server for the first two scripts. The first
checks rendered entry, Fieldbook/tools, keyboard choice, scroll, next/previous,
Escape, focus return and viewport bounds. The second checks all 16 stops,
search, night mode, save/logbook, honest scene-condition labels and persistent
controls after idle. The third checks reduced-motion keyboard selection,
lightbox/Escape, home without accidental lightbox, and tour start/stop.

Screenshots are written alongside these scripts for inspection. Basemap,
camera values, marker layout, scene effects, audio and gesture-controller
code remain unchanged. Existing remote photo failures/placeholder fallback
and selected-marker framing require separate work.
