# 05 · Screenshot guide

Use **1280×800** or **640×400** real product screenshots, JPEG or 24-bit RGB PNG without alpha. Check the current store dashboard for required counts and additional assets.

Current files `screenshots/screen-1.png` through `screen-4.png` are 1280×800, 24-bit RGB PNG without alpha, converted without distortion from the supplied screenshots. Originals are in `screenshots/originals/`. Old `-1280x800` aliases have been removed and are no longer generated.

Screenshots use plain proportional resizing with no added shadows, rounded corners, or card background. Output dimensions stay 1280×800; any aspect-ratio padding is white. Re-running the script renders from unchanged originals, avoiding repeated downscaling.

These captures show the English UI: tab list, move-window dialog, settings, and pinyin-initial search. They are not privacy-redacted: the settings capture contains internal hostnames, and the browsing captures show account / message information. Do not upload them publicly before reviewing and redacting. Run `node scripts/prepare-store-screenshots.mjs` to reconvert the four originals to the required format.

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
