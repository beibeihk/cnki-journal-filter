# CNKI Journal Filter / 知网期刊筛选器

A lightweight, unofficial browser extension for filtering CNKI search results by journal tier.

一个面向中国知网（CNKI）用户的非官方浏览器插件，可在搜索结果页按期刊等级快速筛选论文。

## Features

- Fast selection for preset journal tiers: `A` / `A-` / `B+` / `B`
- Custom journal input with comma, Chinese comma, dunhao, or line-break separation
- Real-time filtering directly on CNKI search result pages
- Compatible with multiple CNKI result layouts
- Remembers previous selections in local browser storage

## Supported Sites

- `https://kns.cnki.net/*`
- `https://kns.cnki.cn/*`
- `https://cnki.net/*`
- `https://*.cnki.net/*`

## Install In Developer Mode

### Microsoft Edge

1. Open `edge://extensions/`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select this project folder

### Google Chrome

1. Open `chrome://extensions/`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select this project folder

## Usage

1. Open CNKI and search for papers.
2. Click the extension icon in the browser toolbar.
3. Select preset journal tiers or enter custom journal names.
4. Click `应用筛选` to keep only matching results.
5. Click `重置` or `显示全部` to restore the full result list.

## Package For Store Submission

Zip the following files and folders only:

```text
manifest.json
popup.html
popup.css
popup.js
content.js
background.js
icons/icon16.png
icons/icon32.png
icons/icon48.png
icons/icon128.png
```

## Project Structure

```text
manifest.json      Extension manifest (Manifest V3)
popup.html         Popup markup
popup.css          Popup styles
popup.js           Popup logic and journal presets
content.js         CNKI page filtering logic
background.js      Service worker
icons/             Extension icons
```

## Privacy

This extension does not collect, upload, or sell personal data.

It stores only the user's selected journal list and custom journal names in the browser's local storage so the last-used configuration can be restored.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Notes

- This project is independent and is not affiliated with or endorsed by CNKI.
- The extension is intended for academic search efficiency and local browser use only.

