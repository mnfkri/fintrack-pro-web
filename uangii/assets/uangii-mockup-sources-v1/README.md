# Uangii website image package v1

Five assets, each exported as PNG and WebP in the parent assets directory:
- uangii-hero-v1: 2560 × 1440 (16:9)
- uangii-feature-beranda-v1: 2000 × 1500 (4:3)
- uangii-feature-investasi-v1: 2000 × 1500 (4:3)
- uangii-feature-transaksi-v1: 2000 × 1500 (4:3)
- uangii-feature-fio-ai-v1: 2000 × 1500 (4:3)

Use WebP for the website and PNG as the lossless master. HTML integration is intentionally outside this package. Existing assets are retained.

The original four supplied screenshots are preserved here. Screens, icons, text and numbers are composited directly from those images; they are not generated or retyped. Source resolution limits enlarged screenshot sharpness. Fio content already hidden by the original app viewport is not reconstructed.

## Generation

Background generated with the built-in image_gen tool. Final phone frames, screenshots and detail crops are composited using Node canvas; sharp exports the WebP versions. Rebuild with `node website/uangii/assets/build-uangii-mockups.cjs` from the project root. The script uses the installed desktop dependency bundle.

Final background prompt:

Create one premium minimalist fintech product photography BACKGROUND PLATE only, landscape 16:9. No phones, no screens, no text, no logos, no letters, no watermark. Deep midnight navy #070f1f seamless studio backdrop, soft restrained emerald #10b981 and teal #14b8a6 volumetric glow concentrated behind the middle, a small touch of cyan. Very subtle dark glass sculptural elliptical pedestal at the very bottom center and delicate curved translucent green glass ribbon confined to the outer lower left and far right margins, leaving the large central 75% completely empty and dark for real smartphone screenshots to be composited later. Sophisticated realistic materials, gentle studio lighting, crisp high resolution, calm restrained composition, matte dark background that blends into a navy website. No purple, no gold coins, no busy particles, no charts. This single reusable backdrop will be used consistently for five Uangii website product mockup assets.

## Verification

All five PNG dimensions and ratios checked. Visual review confirms correct feature mappings, preserved screenshot UI and consistent navy/teal treatment. The hero uses Beranda front and center, with Investasi and Fio behind. Feature illustrations pair the full screenshot with an enlarged detail. Screenshot source files are retained for future revisions.
