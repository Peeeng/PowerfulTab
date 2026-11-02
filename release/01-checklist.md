# 01 · Release checklist

## A. One-time setup

- [ ] Use a Chrome Web Store developer account at https://chrome.google.com/webstore/devconsole.
- [ ] Complete the current registration requirements shown by Google.
- [ ] Keep the public repository, README, and LICENSE accurate.
- [ ] Publish [docs/privacy.md](../docs/privacy.md) via GitHub Pages and verify the HTTPS page without login.
- [ ] Save and verify the publisher contact email in account Settings.

## B. Every release

- [ ] Choose a strictly increasing manifest version.
- [ ] Synchronize `manifest.config.ts`, `package.json`, `package-lock.json`, CHANGELOG, and release notes.
- [ ] Move implemented Unreleased items into the new version. Mark prepared / submitted / published accurately.
- [ ] Run `npm run release` to build `release/dist.zip`.
- [ ] Verify ZIP integrity and the root `manifest.json` version.
- [ ] Run `npm run promo` for English store-icon / branding artwork.
- [ ] Capture real, privacy-safe screenshots of the current English UI. Branding generation does not capture the product.
- [ ] Test the unpacked build in Chrome, including switching languages and preserving saved preferences.

## C. Store upload

Open the existing PowerfulTab item for updates; create an item only for its first submission.

| Field | Source |
| --- | --- |
| Name / short description / detailed description | `02-store-listing.md` |
| Primary listing language | English; optionally add a localized listing separately |
| Category | Productivity |
| Permissions / single purpose / remote code | `03-permissions.md` |
| Privacy policy | Verified public URL for `docs/privacy.md` |
| Icon | `screenshots/icon-128.png` |
| Small promotional tile | `screenshots/promo-small-440x280.png` |
| Marquee image | `screenshots/promo-marquee-1400x560.png` |
| Real screenshots | See `05-screenshots.md` |

- [ ] Disclose local browsing-activity processing truthfully; do not blindly mark every data category No.
- [ ] Verify data-use certifications against implementation and policy.
- [ ] Save the draft before submitting.
- [ ] Select intended distribution / visibility in the dashboard.

## D. Review and follow-up

- [ ] Submit for review only after validation; timelines are determined by Google.
- [ ] Respond to review feedback using specific evidence; see `06-faq.md`.
- [ ] Record actual submission / publication status only after it is confirmed.
- [ ] Add a verified store URL to README after publication.
- [ ] Do not solicit fake reviews.
- [ ] Follow dashboard requirements for both code and metadata updates.
