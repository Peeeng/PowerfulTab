# 05 · Screenshot guide

Use **1280×800** or **640×400** real product screenshots, JPEG or 24-bit RGB PNG without alpha. Check the current store dashboard for required counts and additional assets.

Existing files `screenshots/screen-1.png` and `screen-2.png` are 1280×800 RGB PNG; `-1280x800` aliases contain the same images. Originals are in `screenshots/originals/`.

These are older screenshots, not regenerated English UI captures. They may contain internal or private information. Do not upload them publicly without checking and redacting; ideally replace them with current, safe English captures. Run `node scripts/prepare-store-screenshots.mjs` to convert new originals to the required format.

## Capture scenarios

| Scene | Show |
| --- | --- |
| Dashboard | Domain groups, Recent, Organize, and compact actions |
| Native organizing | Chrome groups after Organize |
| Settings | English language, mode-specific whitelist, limits, history, clear delay, and tab order |
| Dark theme | Matching window colors and active highlights |
| Side panel | Compact rows and hover actions |

## Capture

1. Load the current `dist/` in a clean test Chrome profile.
2. Set Settings → Language → English and Save.
3. Open public sample pages with non-sensitive titles.
4. Open DevTools, enable Device Mode, choose Responsive, and set 1280×800 at 100% scale.
5. Use the DevTools screenshot command, or capture the real window and crop to an allowed size without distortion.
6. Save originals in `screenshots/originals/`, then run the conversion script.

## Privacy checks

- [ ] No internal hostnames, private documents, messages, tokens, query secrets, personal bookmarks, or real browsing history.
- [ ] Use public sample websites such as GitHub, Wikipedia, or documentation pages.
- [ ] Verify titles, URLs, account badges, and window names.
- [ ] Screenshots must show actual implemented functionality, not fabricated mockups.

## Branding assets

`npm run promo` creates English branding artwork, not product screenshots:

| Asset | Size |
| --- | --- |
| `icon-128.png` | 128×128 |
| `promo-small-440x280.png` | 440×280 |
| `promo-marquee-1400x560.png` | 1400×560 |

Optional English captions can explain a real screenshot. Do not replace UI captures with branding tiles or make unsupported feature claims.
