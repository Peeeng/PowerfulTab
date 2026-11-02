# PowerfulTab Privacy Policy

Last updated: 2026-11-02

PowerfulTab processes information locally to help you manage open Chrome tabs. This policy describes the data used, stored, and disclosed by the extension.

## 1. Local processing; no uploads

PowerfulTab reads open tabs' URLs, titles, icons, active states, and timestamps to group, search, sort, and perform requested tab actions.

The developer does not collect personally identifying information, upload tab data to servers, share or sell it to third parties, or use it for advertising, credit scoring, or lending decisions.

## 2. Local storage

The following stays in `chrome.storage.local`, within your Chrome profile:

| Data | Purpose |
| --- | --- |
| Domain and path grouping whitelists | Apply grouping exceptions in the selected mode |
| Protected URL list | Exclude specified URLs from organizing and deduplication |
| Language and light / dark theme | Render the chosen interface |
| Grouping mode, group-size limits, and tab-order preferences | Organize and display tabs |
| Search-history retention and saved search terms | Show recent searches; 0 disables retention |
| Search clear delay | Clear the current query after inactivity; 0 disables clearing |
| Tab creation / first-recorded timestamps | Creation-based ordering |
| Last-visited timestamps | Visit-based ordering and relative times |

`chrome.storage.session` temporarily stores active-tab ID history in each window to support new-tab group inheritance. It is not uploaded.

Both language dictionaries and the pinyin dictionary are bundled in the extension; no remote translation service is used. Changing interface language does not translate your tab titles, URLs, group names, or search history.

Uninstalling PowerfulTab through `chrome://extensions/` removes its stored extension data.

## 3. Chrome permissions

| Permission | Purpose |
| --- | --- |
| `tabs` | Read tab metadata and activate, duplicate, close, move, or order tabs |
| `tabGroups` | Manage native Chrome groups |
| `sessions` | Query / restore recently closed tabs for Undo |
| `storage` | Store local preferences, history, and timestamps |
| `sidePanel` | Show the tab manager in the side panel |
| `favicon` | Display site icons via Chrome's extension /_favicon/ endpoint |

These permissions serve local tab management. PowerfulTab does not read page bodies or inject scripts into websites.

## 4. Network and third-party services

PowerfulTab does not upload tab-management data or fetch remote code, analytics, advertisements, or translations. Site icons are supplied by Chrome's favicon API. Opening, duplicating, or activating a website may cause the browser to load that website normally; this is not data collection by PowerfulTab.

No analytics, advertising, or tracking SDK is integrated.

## 5. Children

The developer does not collect data from children under 13.

## 6. Policy updates

Changes will be published on the privacy-policy page in this project's GitHub repository.

## 7. Contact

- GitHub Issues: https://github.com/Peeeng/PowerfulTab/issues
- Email: Peeeng520@gmail.com
