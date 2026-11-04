# Changelog

All notable changes to **PowerfulTab** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

New work is recorded under Unreleased, then moved to a numbered version when selected. "Release materials prepared" does not mean uploaded, submitted, or approved. Older dates and capabilities below are preserved from existing project records, not newly verified publication claims.

## [Unreleased] - Not published

### Changed

- Debounced title, favicon, loading-status, and other presentation-driven tab refreshes by 500ms. URL, pinning, and native group changes still refresh immediately.
- After tab deletion, removed rows and counts update immediately while remaining tabs keep their displayed group membership and group order until 3s after the last deletion. Ordinary refreshes, activation, and search do not reset this delay; structural additions, navigation, moves, grouping-rule changes, and explicit Organize still apply immediately.
- Move now skips the window picker when only one eligible destination exists (including the usual two-window case); multiple destinations retain the picker. Destination mode is rechecked and its active tab remains selected.
- Moved toolbar status text to a separate full-width row below the puppy and controls, preventing grouping results from pushing action buttons down. Long messages wrap instead of truncating.
- Removed the puppy's downward offset in both dashboard and sidebar toolbars so it aligns vertically with the controls and status text.
- Kept the Organize button label unchanged while busy in both languages, preventing label-driven width changes; disabled state and separate status text remain.
- Restored the four screenshots to plain proportional conversions from originals; removed added card framing, shadows, rounded corners, and decorative background. Dimensions remain 1280×800, 24-bit RGB PNG without alpha.

## [0.1.12] - Release materials prepared

### Changed

- Styled the four screenshots as floating window cards with rounded corners, stronger two-layer shadows, and a pale background. Output remains 1280×800 RGB PNG; originals are preserved and screenshot content is proportionally inset without distortion.
- Removed default-value wording from English / Chinese settings hints; current values remain visible in controls. Language and Theme no longer show hint markers or descriptions. Stored values and behavior are unchanged.
- Replaced the two previous screenshots with four supplied English UI captures, retaining originals and converting to 1280×800 24-bit RGB PNG. Removed redundant old size-suffixed files and stopped regenerating aliases. Captures still require privacy review before public upload.

## [0.1.11] - Release materials prepared

### Added

- Language selection: English by default, with Simplified Chinese available. Missing or invalid saved language values fall back to English; existing preferences remain intact.
- Typed, bundled English / Chinese messages for settings, hints, toolbar, search, tab actions, window picker, status / error messages, Undo, relative times, and fallback popup. No remote translation or new permissions.

### Changed

- Replaced the toolbar cat with a floppy-eared puppy: bright eyes, rosy cheeks, tiny tongue, and paws over the edge. Retains the existing footprint, light/dark colors, and reduced-motion-safe hover effect.
- Deduplicate is icon-only in the toolbar and fallback popup in both languages; localized hover hints and accessible labels are retained.
- English manifest description / action title, entry-page language / titles, README, release materials, permission explanations, privacy policy, and generated branding captions.
- Language selection previews settings labels; Save applies across views, while Cancel discards. Tab titles, URLs, group names, search queries / history, collapse state, and ordering / search-clear timers are preserved.
- Narrow toolbars wrap status text to fit English controls; the decorative puppy remains visible. Deduplicate removes its text only, preserving its icon and hover hint.
- Added local language-storage, translation-coverage, UI-switching, and timer regression checks.

## [0.1.10] - Release materials prepared

### Added

- Domain whitelist in Domain mode: listed hostnames use first-level path grouping. Path whitelist is shown only in Path mode and uses domain grouping for listed hosts. Independent lists use shared UI / native grouping rules and do not affect deduplication.
- Search clear delay, default 60 seconds; 0 disables it. Input or history selection restarts the timer; expiry clears the query but keeps history.
- IME composition pauses clearing until completion. Ordinary list refreshes do not restart the timer or steal search focus.

### Changed

- Settings hints moved to 12px non-focusable question marks at label upper-right corners.
- Renamed the Chinese search-retention setting without changing saved values.
- Path whitelist became an inline two-line input; both whitelist fields expanded to 220px with narrow-view shrinking.
- Removed the space in the Chinese Path-whitelist label.

## [0.1.9] - Release materials prepared

### Added

- Move a tab to another window, choosing by window ID, tab count, and active-page title.

### Changed

- Compacted move / duplicate / close actions to 58px to leave more title space.
- Recent visit updates debounced 500ms; search and active highlights remain immediate.
- Default minimum 3 tabs and maximum 15 groups (including other), preserving saved settings.
- Removed older branding and migrated local settings / search history.
- Removed extension shortcut functionality; opening the interface still attempts search focus.
- Local processing; no additional permissions.

## [0.1.8] - Release materials prepared

### Added

- Chinese-title pinyin-initial search, such as `bd` for Baidu and `wx` for WeChat.
- Space-separated keywords that must all match, regardless of order.
- Each keyword can match title, URL, or initials independently; repeated and outer whitespace is ignored.
- Local search with a bundled dictionary and no additional permissions.

## [0.1.4] - 2026-10-30

- Group-member ordering follows the configured Created (ascending) or Last visited (descending) mode with a 3-second debounce when order changes; visits do not reorder Created mode.
- Removed the side-panel toggle command, retaining the then-existing Ctrl+Shift+F focus command; removed the 10-second Recent and 30-second group-order delays.
- Replaced per-tab side-panel configuration with a global panel to avoid same-window remounts, sorting, and search-focus grabs.
- Compatibility logic no longer creates tabId-specific panels; reload / update clears old options.

## [0.1.3] - 2026-10-30

- Same-window activation no longer refocuses the window; active / visit changes update locally rather than repeatedly querying everything.
- Added the then-existing Ctrl+Shift+F search-focus command, independent of the side-panel toggle; macOS used Control.
- Recent membership / visit ordering updated after 10 seconds of inactivity.
- Unified npm / local project naming under PowerfulTab while retaining the then-existing storage keys.
- Fixed list jumping by keeping existing row order during a session and updating only timestamps / highlights; Organize or sort-setting changes reordered.

## [0.1.2] - 2026-10-29

- Updated product name and project links to PowerfulTab; contact Peeeng520@gmail.com.
- Organize became grouping-only, with domain / first-level path, hostname exceptions, minimum tabs, and maximum groups.
- Separate exact full-URL deduplication retained the most recently visited tab.
- Added title / URL search, configurable history, the then-existing side-panel shortcut, duplication, and new-tab group inheritance.
- Shortcuts were managed in Chrome's extension-shortcut settings without extension-defined defaults.
- Added window colors, active highlighting, group-member time sorting, and a 30-second reorder delay.
- Updated privacy policy, store text, permission explanations, and branding; prepared a package without submitting to review.

## [0.1.1] - 2026-06-12

Bugfix release focused on native-group correctness and visuals, as recorded in existing release notes.

### Fixed

- Ungrouped target tabs before rebuilding groups to prevent duplicate same-name chips.
- Adjusted the then-existing deduplicate → sort → group sequence to prevent tabs from entering another domain's group.
- Corrected manifest homepage_url to the Peeeng/PowerfulTab repository.

### Changed

- Group colors limited to blue, cyan, pink, and purple; gray reserved for special cases.
- Shortened group titles from hostnames to business labels:
  - `aidp.bytedance.net` → aidp.
  - `neeko-aidp.bytedance.net` → neeko.
  - `meego.larkoffice.com` → meego.
  - `bytedance.larkoffice.com` → lark via tenant fallback / alias.
  - `www.notion.so` → notion.
- The then-existing behavior left isolated single-domain tabs ungrouped rather than creating an Other chip.

### Tech

- Added clusterByDomain: clusters ordered by their most recent visit, members by lastAccessed descending.

## [0.1.0] - 2026-06-10

The existing historical record described this as the first public release submitted to Chrome Web Store.

### Added

- One-click domain grouping into native Chrome groups.
- Three historical deduplication modes: Strict (exact URL), Loose (ignore hash / tracking parameters), and Domain (keep one recently visited tab per domain).
- Recent-visit ordering using chrome.tabs.onActivated timestamps.
- Undo using chrome.sessions.
- Pinned-tab / whitelist protection.
- Side-panel view using chrome.sidePanel.
- Light / dark themes with system or manual selection.
- Hover-only single-tab close actions, separate from timestamps.
- Historical blue folder / sparkle icon assets.
- Hand-drawn cat and GSAP 3D toolbar parallax.
- Local-processing privacy policy at the recorded [policy URL](https://peeeng.github.io/PowerfulTab/privacy).

### Tech

- Manifest V3 + service worker.
- TypeScript 5 + React 18.
- Vite 7 + @crxjs/vite-plugin, as recorded in the historical notes.
- GSAP toolbar interactions.

### Known limitations recorded at the time

- Chromium-family browsers only (Chrome / Edge / Brave / Arc).
- No iframe-content support.
- The old Domain deduplication mode required caution with multiple-account tabs.

[0.1.1]: https://github.com/Peeeng/PowerfulTab/releases/tag/v0.1.1
[0.1.0]: https://github.com/Peeeng/PowerfulTab/releases/tag/v0.1.0
