# Mission 3: 3D Hero Integration Report

## What was replaced

The hero section's flat plate-and-phone illustration (`public/media/hero-plate.webp`, painted on the hero canvas) was replaced by the confirmed 3D mascot. Nothing else was removed:
- The illustration file stays in the repository.
- The CAMPUSPLATE wordmark, scroll choreography and "Why students use it" cards still run as before.
- Every other section, image, price, link and the waitlist form are unchanged.

## Which model

**Doctor Mascot**, version 1, from `Venture_3D_Confirmed_Handoff.zip`, confirmed 2026-11-04T17:19:40Z. The package was validated before any change:
- All five files are present, and the schema is `venture3d.handoff/1.0`.
- The model, project and preview checksums all match.
- The glTF validator reports 0 errors and 0 warnings.
- It has 118 parts and no outside file links.
- It measures 59.7 × 120.0 × 52.7 cm.

The site serves the GLB byte-for-byte unchanged, and the automated check compares its SHA-256 against the manifest.

## What visitors can do

- Drag to turn the mascot. On touch screens, a sideways swipe turns it and a vertical swipe still scrolls the page.
- Use Front, Side and Back views, zoom in and out (zooming in aims at the face), and Reset view.
- Use the keyboard: arrow keys turn it, + and − zoom, and 0 resets.
- See a short entrance animation and a gentle idle sway. Both turn off when the visitor prefers reduced motion.
- Scroll as before: the mascot glides aside, to the right on wide screens and below the cards on phones.

## How it works

- The model renders with three.js in `src/lib/mascot3d.ts`, loaded lazily so the page paints first. It draws only while something moves.
- The camera angle, lighting preset and shadows come from `model-manifest.json`. The mint studio background was left out on purpose so the mascot stands on the brand green, and its shadow is tinted deep green.
- Without WebGL, or if loading fails, the confirmed `preview.png` appears, labelled "Static preview · 3D is not available on this device".
- `npm run import-model` validates a new handoff ZIP and copies it into `public/media/3d/`.

## Verification

`node scripts/check-site.mjs [url]` drives Microsoft Edge headless and compares real screenshots. It passed 46 of 46 checks on the production build:

| Area | What was checked |
| --- | --- |
| Model | It loads, and the GLB matches the handoff checksum |
| Framing | It is 78% of the window height, not clipped, stands on the wordmark, and its controls don't cover the text |
| Interaction | Drag, arrow keys, zoom, the Front, Side and Back views, and reset back to the starting image |
| Scroll beat | The mascot moves aside, the hero copy rises, and the two don't overlap |
| Navigation | Navigation links scroll to their sections, and all sections are present |
| Existing features | Pricing copy is unchanged and waitlist validation still works |
| Motion | The idle sway runs normally and stops with reduced motion |
| Phone (390 × 844) | Visible, controls fit, vertical swipes still scroll, and the mascot moves below the copy |
| No WebGL | The labelled static preview shows, with no 3D controls |
| Files | No missing files and no JavaScript errors |

## Limitations

- The GLB is 3.5 MB, so the first visit on a slow connection shows a loading indicator for a few seconds.
- The handoff has no hotspots, so none are shown.
- Tests used Edge with software rendering. Safari, Firefox and real phones were not tested.
- `/favicon.ico` returns 404. That was already the case before this work.

## Updating the model later

1. In the Venture 3D Studio, edit the model and press Confirm Model.
2. Replace `handoff/Venture_3D_Confirmed_Handoff.zip` with the new download.
3. Run `npm run import-model`. It refuses invalid packages and changes nothing.
4. Run `npm run build`, then commit and push to `main` to redeploy.
