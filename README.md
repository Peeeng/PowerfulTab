<div align="center">

<img src="src/assets/icons/icon-128.png" alt="PowerfulTab" width="96" height="96" />

# PowerfulTab

**Organize Chrome tabs: Domain / Path groups · Exact deduplication · Fast search · Multi-window colors**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.config.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Privacy](https://img.shields.io/badge/Privacy-Local-brightgreen)](docs/privacy.md)

[✨ Features](#features) · [📸 Preview](#preview) · [📦 Installation](#installation-and-updates) · [🛠 Development](#development) · [🔒 Privacy](#local-data-and-permissions)

</div>

---

## 🌌 Overview

PowerfulTab manages Chrome tabs with domain / first-level path grouping, exact URL deduplication, search, window colors, and tab actions. Built with Manifest V3, TypeScript, React 18, Vite 5, and GSAP.

The interface defaults to **English**. Choose **English** or **简体中文** in Settings → Language, then Save. The selection is stored locally and applies to the dashboard, side panel, and fallback popup. Existing installations without a language preference also default to English. Tab titles, URLs, group names, and search history are never translated.

Product and repository names are **PowerfulTab**; npm uses `powerfultab`. Older local data is migrated without losing settings or search history. Load this project's `dist/` directory for development.

## Preview

![PowerfulTab branding: domain / path groups, exact deduplication, and local search](release/screenshots/promo-marquee-1400x560.png)

This is a promotional image, not a product screenshot. Capture current UI screenshots using the [screenshot guide](release/05-screenshots.md). Existing screenshots are not automatically updated when the interface changes; use English and remove private information before uploading new screenshots.

## Features

| Feature | Behavior |
| --- | --- |
| 🚀 Organize | Groups and orders tabs; never deduplicates, closes tabs, or merges windows |
| 🧹 Deduplicate | Closes tabs only when full URLs are identical; keeps the most recently visited |
| Organize by | Full hostname or hostname + first-level path |
| Domain whitelist | In Domain mode, listed hostnames use first-level path grouping |
| Path whitelist | In Path mode, listed hostnames use domain grouping |
| Minimum tabs | Default 3; smaller planned groups go to `other` |
| Maximum groups | Default 15; always enabled and includes `other` |
| Tab order | Created: oldest first; Last visited: newest first; changes debounced for 3 seconds |
| 🔎 Search | URL, title, and Chinese-title pinyin initials; space-separated keywords must all match |
| 🕘 Search history | Default 1 saved search; configurable, including 0 |
| Search clear delay | Default 60 seconds after the last input; 0 disables automatic clearing |
| Tab actions | Activate, move to another window, duplicate, close a tab, or close a group |
| 🎨 Window colors | Color stripe per window; matching highlights for active tabs |
| ⚙️ Settings | Compact labels with small hover hints; Save applies, Cancel / Esc / outside click discards |
| 🌐 Language | English by default; Simplified Chinese also available |
| 🌗 Theme | Light / dark, from the toolbar or Settings |

## Organizing and deduplicating

### Organize

Organize does not run deduplication:

1. Read tabs and settings; skip pinned tabs and protected URLs.
2. Compute planned groups independently for each window using the active mode and its whitelist.
3. Send groups below Minimum tabs to `other`.
4. Sort eligible groups by tab count, largest first; ties preserve original planned-group order.
5. Apply Maximum groups. If needed, keep the first `n-1` groups and combine smaller / excess groups into `other`. Never create an empty `other`.
6. Order members using the selected tab-order setting, ungroup participating tabs, then create Chrome native groups.
7. Place native groups largest first, with gray `other` last. Even a single-tab `other` is grouped.

When Maximum groups is 1 and merging is needed, all participating tabs go to `other`.

### Group keys and names

| Case | Group key | Display example |
| --- | --- | --- |
| Domain | Full hostname | `data.example.com` → `data` |
| First-level path | Hostname + first nonempty path segment | `data.example.com/dorado/instance` → `data.dorado` |
| Path whitelist, in Path mode | Full hostname | `cloud.example.com` → `cloud` |
| Domain whitelist, in Domain mode | Hostname + first-level path | `data.example.com/dorado/instance` → `data.dorado` |
| No path segment | Separate root-path key when path grouping applies | Short domain label |
| Small / excess groups | `__other__` | `other` |

Path names use the **leftmost hostname segment + "." + first-level path**. Query parameters and hash do not affect grouping. Path segments are URL-decoded when possible. Different hostnames are not merged just because their display labels match.

Domain-only short labels preserve existing rules: use the leftmost segment, shorten hyphenated prefixes, skip placeholder prefixes such as `www` or `bytedance`, and use the `larkoffice` → `lark` alias.

Both whitelists are saved independently. Switching modes does not clear either list; only the active mode's list is shown and used. The same hostname may appear in both lists. Input accepts hostnames or URLs separated by commas, spaces, or new lines; Save extracts hostnames, normalizes, and deduplicates them. Matching is exact, not automatically inherited by subdomains.

These lists change grouping, not deduplication or URL protection. Whitelisted path groups use the same naming and minimum / maximum rules as other path groups.

### Deduplicate

The overlapping-page toolbar icon performs exact URL deduplication. The button is icon-only in both languages; hover for the localized explanation. The **entire URL string** must match, including:

- Hostname, path, and trailing slash.
- Every query parameter, value, and parameter order.
- Hash.

No tracking parameters are stripped. Different pages are never closed just because a domain or path matches. Pinned tabs and protected URLs are excluded. The tab with the greatest last-visited timestamp survives; ties keep the earlier input tab.

Last-visited timestamps come from activation, creation, and URL-change events, not reading duration. Existing tabs use Chrome's `lastAccessed` when available, otherwise a fallback.

## Settings

Open Settings using the toolbar gear. Labels are bold; input and hint text use normal weight. Settings hints use a 12px "?" at the label's upper-right corner, except Language and Theme, which have no descriptions. Hover or click to view rules; hints do not repeat default values because current values are visible in controls. The marker cannot take focus, and descriptions are associated with their input controls for screen readers.

| Setting | Default | Rule |
| --- | --- | --- |
| Language | English | English / Simplified Chinese; Save applies, Cancel discards |
| Organize by | Domain | Domain / First-level path |
| Domain whitelist | Empty | Domain mode only; listed domains use first-level path grouping |
| Path whitelist | Empty | Path mode only; listed domains use domain grouping |
| Minimum tabs | 3 | Positive integer; smaller groups go to `other` |
| Maximum groups | 15 | Positive integer, always enabled, includes `other` |
| Tab order | Last visited | Created: oldest first; Last visited: newest first |
| Search history | 1 | Nonnegative integer; 0 disables retention |
| Search clear delay | 60 seconds | Restart on input; 0 disables automatic clearing |
| Theme | Light | Light / Dark |

Whitelist fields are inline, 220px wide when space allows, and show two lines by default. Only Save writes settings. Cancel, Esc, or clicking outside closes without saving; outside cancellation is ignored during saving. Changing Language previews the settings labels, but other views update only after Save.

Chrome does not expose historical creation times for existing tabs. New tabs are timestamped; older tabs use first-recorded order.

## Search and focus

There is an input field, not a separate search button. Filtering is immediate, case-insensitive, and ignores outer whitespace.

- All space-separated keywords must match the same tab. Each keyword can match a different field: title, URL, or pinyin initials. Order does not matter; repeated spaces, tabs, and new lines are separators.
- Chinese-title pinyin initials are supported in either UI language: `bd` matches 百度, `wx` matches 微信, and `cqyh` matches 重庆银行. Spaces and punctuation do not interrupt initial matching; English letters and digits in mixed titles are preserved.
- Conversion runs locally with a bundled dictionary and bounded cache. Groups and Recent use the same matcher.
- History is recorded after roughly 500ms of inactivity, on blur, or on Enter. Latest first; case-insensitive duplicates move to the front.
- Clicking / focusing the input opens history. Select with a mouse or arrow keys + Enter; Esc closes the dropdown. Search history = 0 hides it.
- Typing or choosing history restarts Search clear delay. Expiry clears the query and restores all tabs without deleting history, focusing the input, or scrolling. IME composition pauses clearing until composition ends. Saving a new timeout restarts the countdown.
- Clearing a query does not change native tabs / groups.
- Initial opening or an explicit extension-icon opening attempts to focus search, with brief mount retries. Ordinary tab actions do not repeatedly steal focus. Switching UI language does not remount search or reset its timer / query.

The side panel uses one global configuration, not per-tab panels. Switching tabs in a window keeps the same instance. Reloading clears older per-tab options. Use Chrome's native close button to close the side panel.

## Tab rows and window colors

- Click a row to activate its original tab and window. The list preserves scroll position and does not jump to Recent.
- Last-visited time shares space with move, duplicate, and close buttons: time is shown normally; actions appear on hover or keyboard focus.
- Move goes directly to the other window when there is only one eligible destination; multiple destinations open a picker with window IDs, tab counts, and active titles. Tabs move to the end of another normal window in the same browsing mode without switching focus; pinned tabs remain in the destination's pinned area. Destination activity is preserved. Native groups do not transfer across windows. Moving the source window's last tab closes that window in Chrome.
- Duplicate uses `chrome.tabs.duplicate()`; it creates another tab, not a clipboard copy.
- Actions are 18px each with 2px gaps: a 58px action area. Move / duplicate hover purple; close hovers red.
- A focused row supports Enter to activate and Backspace / Delete to close. Internal action key events do not trigger row-level actions.
- Scrollbars are hidden; mouse wheels, trackpads, and normal scrolling still work.

All rows have a **5px window-color stripe**, full row height and flush with active highlights; each row has 1px external spacing above / below.

Window IDs map to a fixed 10-color rotation: blue, orange, green, purple, pink, cyan, yellow, yellow-green, indigo, red (`windowId % 10`). Searching or switching / closing other windows does not recolor existing ones; IDs with the same remainder reuse colors.

Active tabs in every window have a pale matching background and window badge. The focused window's active tab gets an additional outline; dark mode uses subdued dark backgrounds.

New tabs inherit the opener's native group, or the same window's recent active tab when no opener is known. This includes `other`. Existing groups and pinned tabs are not overridden; no cross-window inheritance. URL-based classification happens on the next Organize action.

## Rendering logic

Dashboard and CardGrid power both the full tab manager and side panel:

1. Read all windows' tabs, settings, creation / visit timestamps, and the focused window.
2. Compute planned groups from the full tab set and apply minimum / maximum rules.
3. Update group order by count immediately; the old 30-second group-order delay is removed.
4. Add / remove groups as needed, with `other` last.
5. Filter after grouping, so a search cannot push a valid group into `other` due to too few matches.
6. Order members by the selected setting; display counts, recent activity, relative times, and actions.
7. Recent shows at most 8 matching tabs by visit time. Timestamp-driven membership / ordering is debounced 500ms; search, removal, and active highlighting update immediately. Main-list reordering follows the selected setting with a 3-second debounce. Mere visits do not reorder Created mode; ordinary refresh / search / language changes do not reset ordering timers. New tabs append initially; closed tabs disappear immediately. Reloading, explicit Organize, or changing sort mode applies ordering immediately. List-order delays never move native Chrome tabs. Recent is a shortcut view of the same tabs, not part of group totals.
8. Search temporarily expands matching groups; clearing restores saved collapse state. No matches shows an empty state.

Creation, removal, moves, and settings changes trigger immediate queries; title, favicon, loading-status, and other presentation updates debounce queries by 500ms. URL, pinning, and native group changes remain immediate. Activation, focus, and timestamp changes update locally. After deletion, closed rows and counts update immediately, but displayed group membership and group order wait until 3s after the last deletion. Ordinary refreshes, activation, and search do not restart this delay; new tabs, navigation, moves, grouping-rule changes, and explicit Organize still apply grouping immediately. A 30-second fallback refresh updates relative times; it is not a sort delay and does not auto-organize native tabs.

### Known boundaries

- The dashboard applies thresholds across windows, while native Organize applies them per window. Two windows with 2 tabs each may form a 4-tab dashboard group but remain in native `other` with Minimum tabs = 3.
- CardGrid shows computed groups, not a direct map of native `groupId`. Inherited native groups can temporarily differ from displayed URL-based groups.
- Native ungroup / group / move failures currently go to background logs. Participating counts do not guarantee every native call succeeded.
- Creation / visit times are event records, not reading duration; API behavior depends on Chrome version.
- Manual close and close-group show a 5-second Undo when Chrome supplies restorable sessions. Deduplicate does not create this prompt. Recovery depends on `chrome.sessions`.

## Installation and updates

### 🛍️ Option 1: Chrome Web Store

A verified public store URL is not recorded in this repository. Once published, install from the store; until then use source or ZIP installation below. Prepared release materials do not mean a version has been submitted or approved.

### 🧑‍💻 Option 2: Load from source

```bash
git clone https://github.com/Peeeng/PowerfulTab.git
cd PowerfulTab
npm install
npm run build
```

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository's **`dist/`** folder.
4. Click the PowerfulTab toolbar icon to open the side panel.

### 📦 Option 3: Load a ZIP

Extract the extension ZIP into a stable folder, enable Developer mode, then Load unpacked from the extracted folder containing `manifest.json`.

Generate a release ZIP with `npm run release`; output: `release/dist.zip`.

### 🔄 Update / reload

After editing source, run `npm run build`, reload the extension in Chrome, and close / reopen existing side panels or tab-manager pages. Reloading an old extracted ZIP does not load this repository's new `dist/` code.

Normal builds do not update `release/dist.zip`. Regenerate it with `npm run release` when preparing a release. The current prepared version is **0.1.12**, with simplified settings hints; see [release notes](release/11-v0.1.12.md). Screenshot files have since been restored to plain images without decorative card effects; the ZIP is unaffected. Prepared does not mean submitted or published to the store. Screenshot assets still require privacy review before public upload.

## Development

```bash
npm run dev      # Watch builds
npm run build    # TypeScript check + production build
npm run release  # Build and package release/dist.zip
npm run promo    # Generate English branding artwork
npm run test:i18n # Language, UI, storage, and search-timer regression checks
```

```text
src/
├── background/
│   ├── index.ts                 # Timestamps, side panel, message bridge
│   └── inherit-group.ts         # New-tab native group inheritance
├── core/
│   ├── grouping.ts              # Keys, names, thresholds, native groups
│   ├── tabs.ts                  # Organize, deduplicate, tab queries
│   ├── dedupe.ts                # Exact full-URL deduplication
│   ├── search.ts                # URL / title / pinyin matching, history
│   ├── i18n.ts                  # Typed English / Chinese messages
│   ├── storage.ts               # Settings, timestamps, history
│   ├── sort.ts                  # Legacy independent sorting
│   └── types.ts                 # Settings and message types
├── components/                 # Shared dialogs, icons, language context
├── dashboard/
│   ├── Dashboard.tsx            # State, actions, scroll preservation
│   ├── components/CardGrid.tsx  # Group lists, ordering, colors, actions
│   └── components/TabSearch.tsx # Search, history, focus
├── popup/                      # Fallback popup entry
└── assets/icons/
```

The extension icon opens the side panel; Popup remains a fallback. Manifest: `manifest.config.ts`. Entry pages: `index.html`, `sidepanel.html`, `popup.html`.

## Local data and permissions

Preferences (including language), whitelists, search history, and timestamps stay in `chrome.storage.local`; source-tab activation history stays in `chrome.storage.session`. Keys use `powerfultab.*`. Migration writes new keys before removing older ones and keeps existing new-key data.

| Permission | Purpose |
| --- | --- |
| `tabs` | Query, activate, duplicate, close, move, and order tabs |
| `tabGroups` | Create native groups, set titles / colors, move groups |
| `sessions` | Query and restore recently closed sessions |
| `storage` | Local settings, history, timestamps, session state |
| `sidePanel` | Show the tab manager in Chrome's side panel |
| `favicon` | Display site icons |

Language support adds no permissions, remote code, translation services, or uploads.

[Privacy policy](docs/privacy.md) · [Report an issue](https://github.com/Peeeng/PowerfulTab/issues) · [MIT License](LICENSE)

### Privacy policy and store submission

PowerfulTab processes URLs, titles, and history locally. No uploads does not mean no data processing: disclose browsing activity truthfully and publish an accurate policy for store submission.

The policy is in [docs/privacy.md](docs/privacy.md). No separate server or domain is required:

1. Commit / push the current `docs/` to `Peeeng/PowerfulTab`, branch `main`.
2. In GitHub **Settings → Pages**, choose **Deploy from a branch**.
3. Select **main /docs**, save, and wait for deployment.
4. Verify the full policy is publicly reachable without login at `https://peeeng.github.io/PowerfulTab/privacy`.
5. Enter that URL in the store's Privacy policy field and complete accurate disclosures.

This is an intended URL, not proof of deployment. Update the policy when behavior changes. Contact: `Peeeng520@gmail.com`.

## 🐶 Design

- Blue-purple browser tabs and a lightning bolt. Icon source: `src/assets/icons/icon.svg`. Render sizes with `node scripts/render-icons.mjs`; `npm run promo` creates the matching store icon and English artwork; release builds regenerate icons.
- A cheerful floppy-eared puppy with bright eyes, rosy cheeks, a tiny tongue, and subtle hover motion. Its compact size and light / dark colors match the toolbar.
- Glowing Organize button with GSAP 3D hover parallax.
- Light / dark themes, colored window stripes, and active highlights.
- Compact rows with relative times such as Just now / 5m / 2h / 3d.

## 🙏 Contributing and feedback

Open an [issue](https://github.com/Peeeng/PowerfulTab/issues) or a PR. Check current behavior / known boundaries and run `npm run build` before submitting.

Email: Peeeng520@gmail.com.

## 📄 License

MIT. Maintainer: [Peeeng](https://github.com/Peeeng). Copyright notices: [LICENSE](LICENSE).
