# 06 · Review troubleshooting

Examples below are troubleshooting guidance, not a guarantee of approval or a prediction of review outcomes.

## Single purpose

Describe the extension as one tab-management tool: organizing, searching, sorting, and requested tab actions. Keep the manifest and listing aligned. Organize groups tabs; the separate Deduplicate button closes exact URL duplicates.

## Permission justification

Explain each requested permission using `03-permissions.md`. PowerfulTab does not request host permissions, history, cookies, or webRequest. Do not add permissions merely to work around a review form.

## Privacy policy

Verify the public HTTPS policy URL loads without login or 404. Explain local data processing, storage, purposes, absence of uploads / sharing, and removal. Use the canonical English policy in `docs/privacy.md`.

## Screenshots and metadata

Use genuine English UI captures at an allowed size, without private data. Do not advertise AI organizing, multiple deduplication modes, or other capabilities not in the submitted package. The updated language listing must accompany a build that actually includes language selection.

## Functionality and quality

Describe real capabilities: native domain / path grouping, reciprocal whitelists, exact full-URL deduplication, multi-keyword / pinyin search, moving / duplicating tabs, window colors, and Undo where Chrome supplies sessions. Do not claim the feature set guarantees acceptance.

## Response template

```text
Hi Chrome Web Store team,

Thank you for the review. We have addressed the points raised:

1. [Policy reference] — Updated [item] in version [version] to [specific change].
2. [Additional point] — [Specific change and evidence].

The tabs permission supports local tab metadata and requested tab-management
actions. Tab data is not uploaded to the developer.
The privacy policy is publicly available at:
https://peeeng.github.io/PowerfulTab/privacy

[Only if true: Screenshots have been replaced with current, genuine English UI
captures, and the new package has been resubmitted.]

Please review the updated submission. Thank you.

Best,
[Publisher name]
```

Replace placeholders and remove every statement that has not actually been completed.

## Before resubmission

- [ ] Manifest, actual behavior, listing, and single purpose agree.
- [ ] Every permission is justified.
- [ ] Policy URL is public and accurate.
- [ ] Screenshots are current and privacy-safe.
- [ ] Data-use disclosures and certifications are accurate.
- [ ] The package version is higher than previously uploaded versions.
- [ ] Test the current build in Chrome, including both languages.
- [ ] Save the draft, then follow current dashboard submission requirements.

After approval, add the verified store URL to README. Record actual publication separately from packaging / submission.
