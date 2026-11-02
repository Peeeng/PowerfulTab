# 03 · Permission justifications

Use these English descriptions in the developer dashboard's Privacy practices section. They reflect implementation, not a guarantee of approval.

## Single purpose

```text
PowerfulTab manages open browser tabs: group by domain or path, search titles and URLs, remove exact URL duplicates, and move, duplicate, close, or sort tabs. Organize never closes tabs. All processing is local; tab data is not uploaded.
```

## Remote code

Select **No, I am not using remote code**. If a justification field is still required:

```text
PowerfulTab does not use remote code. All JavaScript, dependencies, pinyin dictionaries, and interface translations are bundled in the uploaded extension package. No JavaScript, WebAssembly, or other executable code is downloaded or executed from remote servers.
```

## tabs

```text
Reads open tabs' URLs, titles, icons, and activity to display and search tabs, group by domain or path, deduplicate exact URLs, and sort by visit time. It also activates, duplicates, closes, and moves tabs when requested. The extension does not read page bodies or inject scripts into websites. Tab data is processed locally and not uploaded.
```

## tabGroups

```text
Creates and updates native Chrome tab groups in each window using the selected grouping mode, domain/path whitelists, and group-size limits. New tabs can inherit their source tab's group. Organizing does not close tabs.
```

## sessions

```text
Supports Undo after manual tab or group closing by querying recently closed sessions with chrome.sessions.getRecentlyClosed and restoring them with chrome.sessions.restore. Exact deduplication does not create an Undo prompt.
```

## storage

```text
Uses chrome.storage.local for language, theme, grouping mode, both grouping whitelists, group-size limits, tab-order preferences, search retention, search clear delay, search history, and creation/visit timestamps. chrome.storage.session temporarily stores active-tab ID history for new-tab group inheritance. Search retention can be set to 0. Stored data is not uploaded.
```

## sidePanel

```text
Displays the PowerfulTab tab manager in Chrome's side panel so users can browse, search, and manage open tabs alongside the current page.
```

## favicon

```text
Uses Chrome's extension /_favicon/ endpoint to display site icons in tab lists so users can identify websites. It does not read page bodies or upload tab data to the extension developer.
```

## Data-use disclosure

| Data / use | Current behavior |
| --- | --- |
| Personally identifying information | Not collected by the developer |
| Health, financial, payment, authentication, communications, or location data | Not collected by the developer |
| Web browsing activity | Processed locally: open-tab URLs, titles, active state, and visit timestamps |
| Website content such as page bodies, screenshots, or forms | Not read |
| Unrelated uses, advertising, sale, transfer, credit / lending decisions | Not used |
| Upload to developer or third parties | None |
| Accuracy / compliance certifications | The publisher must verify the actual implementation and complete required certifications |

Local processing does not eliminate disclosure obligations. See [Chrome Web Store user data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq). Review restricted-use, transfer, and credit-use declarations individually, then save the draft.

## Publisher contact email

In developer account **Settings**, enter and save `Peeeng520@gmail.com`, start verification, and complete the email link. Confirm the verified state in the dashboard. Putting an email in README or the listing does not replace account verification.

## Host permissions

PowerfulTab does not request host permissions, including `<all_urls>`. The `web_accessible_resources.matches` entry is not a host-permission grant. Language support adds no permissions.
