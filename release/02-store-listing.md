# 02 · Chrome Web Store listing

Use English as the store listing's primary language. The in-extension language setting is independent of Chrome's store-language configuration.

## Name (45 characters maximum)

```text
PowerfulTab — Tab Organizer
```

## Short description (132 characters maximum)

```text
Organize tabs by domain or path, remove exact URL duplicates, and search across windows. Local-only. No uploads.
```

## Detailed description

```text
PowerfulTab — Bring order to your browser tabs

Manage crowded Chrome windows with native tab groups, precise deduplication, and fast local search.

FEATURES

• Organize: group tabs by domain or first-level path, independently in each window. Organizing never closes tabs.
• Domain whitelist: in Domain mode, listed hostnames use first-level path grouping.
• Path whitelist: in Path mode, listed hostnames use domain grouping. Both lists are saved independently and match exact hostnames.
• Group limits: default minimum 3 tabs and maximum 15 groups, including other. Small or excess groups go to other.
• Exact deduplication: a separate button closes only identical full URLs, including path, parameters, and hash. The most recently visited duplicate survives.
• Search: match titles, URLs, and Chinese-title pinyin initials. Separate keywords with spaces; every keyword must match.
• Search history: keep the latest 1 search by default, choose another count, or set 0 to disable.
• Search clear delay: default 60 seconds after the last input. Typing or choosing history restarts the timer; 0 disables automatic clearing. IME composition pauses clearing. Saved history is preserved.
• Tab order: creation time (oldest first) or last visit (newest first), with a 3-second reorder debounce.
• Window filters: multi-select colored window icons below search. Window IDs and tab counts appear on hover. Window colors use unused palette entries before repeating; active-tab highlights share those colors.
• Tab actions: activate, duplicate, close, or move a tab to another compatible window.
• New-tab inheritance: new tabs join the source tab's native group when possible.
• Recent: a shortcut list of recent tabs, eight by default and adjustable in Settings. Visit updates use a 500ms debounce; search, window filters, and active highlights stay immediate.
• Close old tabs: preview and confirm closing tabs older than a selected visit threshold. A slider offers 1h, 2h, 6h, 12h, 1d, 2d, 3d, 5d, 7d, and 15d, with 3d selected initially. Cleanup applies to selected windows independently of search, retains pinned/protected/extension/unknown-visit tabs, and rechecks visit times before closing.
• Undo: manual tab / group closing and time-based cleanup offer a 5-second Undo when Chrome supplies restorable tab or window sessions. Large batches may only be partly recoverable within Chrome’s session-history limit. Deduplication does not show this prompt.
• Pinned-tab protection: pinned tabs are excluded from organizing and deduplication.
• Side panel: manage tabs alongside the current page, with light and dark themes.
• Language: English by default, with Simplified Chinese available in Settings. Tab titles and group names remain unchanged.
• Compact settings: small question-mark hints beside labels; only the current grouping mode's whitelist is displayed.

PRIVACY

Processing takes place locally. PowerfulTab does not upload tab data, sell data, or include analytics, advertising, or remote translation services.
Settings, language, search history, and tab timestamps are stored in chrome.storage.local. Active-tab ID history used for group inheritance stays in chrome.storage.session.
Pinyin dictionaries and both interface languages are bundled with the extension.

GET STARTED

1. Click the PowerfulTab extension icon.
2. The side panel opens.
3. Click Organize to create native Chrome tab groups.
4. Open Settings to choose your language and grouping preferences.

FEEDBACK

GitHub: https://github.com/Peeeng/PowerfulTab
Email: Peeeng520@gmail.com

See CHANGELOG.md in the repository for version history.
```

## Single purpose

```text
PowerfulTab manages open browser tabs: group by domain or path, search titles and URLs, remove exact URL duplicates, and move, duplicate, close, or sort tabs. Organize never closes tabs. All processing is local; tab data is not uploaded.
```

## Category

Productivity

## Keywords

Tab manager · Tab organizer · Deduplicate · Side panel · Search

This listing matches the prepared **0.1.15** package. Save it as the English primary listing when uploading that package; do not advertise these features against an older build.
