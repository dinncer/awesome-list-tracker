# Awesome List Tracker

![Awesome List Tracker](https://github.com/user-attachments/assets/2673459e-6cc7-4c33-8b98-def3120d82bb)

Firefox extension for tracking recent changes in starred GitHub awesome lists.

Follow updates from [`topics/awesome-list`](https://github.com/topics/awesome-list) repositories without keeping GitHub tabs open.

## Install

[Awesome List Tracker on addons.mozilla.org](https://addons.mozilla.org/firefox/addon/awesome-list-tracker/)

## Features

- Auto-import starred GitHub Awesome Lists.
- Track commits and diffs from favorite lists.
- Review updates from the popup.
- Open Markdown links in new tabs.
- Mark updates as read.

## Requirements

- Firefox 140 or newer.

## Development Install

Load `manifest.json` from `about:debugging#/runtime/this-firefox` using `Load Temporary Add-on...`.

## Permissions

The extension requests:

- `storage` to save tracked repositories, cache entries, and last-read timestamps locally in Firefox.
- `https://api.github.com/*` to fetch starred repositories, commits, and commit diffs from GitHub.

The extension declares no data collection.

## License

[MIT](LICENSE)
