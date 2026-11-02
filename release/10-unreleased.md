# PowerfulTab · Unreleased language update

Status: implemented in source / development build, not assigned a new release version or uploaded to the store. The previous release ZIP is unchanged.

- Added Language in Settings, with English as the default and Simplified Chinese as an option. Missing or invalid saved language values fall back to English; other preferences remain intact.
- Localized toolbar, search, settings and hints, tab actions, window picker, empty states, status messages, Undo, relative-time labels, and the fallback popup.
- Switching languages preserves the current query, history, native / planned groups, collapse state, list-order timers, and auto-clear countdown. Tab titles, URLs, and group names are not translated.
- Settings labels preview the selected language; Save applies it across views, while Cancel / outside dismissal discards it.
- Switched manifest descriptions, page titles, README, release documentation, permissions, privacy policy, and generated branding captions to English.
- No new permissions, remote translation calls, or uploaded data. Both dictionaries are bundled.

Before store submission: choose a new version, synchronize package / manifest / CHANGELOG / release notes, run `npm run release`, capture privacy-safe English UI screenshots if updating them, and save the English listing in the developer dashboard.
