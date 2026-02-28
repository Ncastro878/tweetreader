# Tweet Reader

<p align="center">
  <img src="tweet-reader/banner.png" alt="Tweet Reader banner" width="600">
</p>

A Chrome extension that reads tweets aloud using the Web Speech API. Adds unobtrusive buttons to every tweet on X (formerly Twitter) for single-tweet and full-thread reading, with real-time word highlighting as it speaks.

## Features

### Read Single Tweet
Click the `🔊` button on any tweet to hear it read aloud. Click `⏹` to stop.

### Read Entire Thread
Click the `📖` button to read all visible tweets on the page sequentially. The currently-reading tweet is highlighted with a blue left border and auto-scrolled into view.

### Word-by-Word Highlighting
As a tweet is read aloud, each word is highlighted in real time so you can follow along visually.

### Keyboard Shortcut
Press `Alt+S` to read the tweet you're hovering over. If no tweet is hovered, the tweet closest to the center of the viewport is read instead.

### Smart Text Cleaning
- **Emoji stripping** — Emojis are removed before speaking so the voice doesn't try to narrate them.
- **Hashtag cleaning** — The `#` symbol is stripped from hashtags so the voice says "trending" instead of "hashtag trending".

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:Ncastro878/tweetreader.git
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `tweet-reader` directory inside the cloned repo.
5. Navigate to [x.com](https://x.com) — the extension activates automatically.

## Project Structure

```
tweetreader/
├── tweet-reader/
│   ├── manifest.json   # Chrome extension manifest (Manifest V3)
│   └── content.js      # All extension logic (injected into x.com pages)
├── .gitignore
└── README.md
```

The extension is intentionally kept minimal — two files, no build step, no background scripts, no external dependencies.

## How It Works

- A `MutationObserver` watches for new tweets added to the DOM (infinite scroll, navigation) and injects the reader buttons into each tweet's action bar.
- Speech is handled entirely through the browser's built-in [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (`SpeechSynthesisUtterance`).
- Word highlighting uses the `onboundary` event fired by the speech engine to track which word is currently being spoken.

## Browser Support

Chrome (desktop). Requires the Web Speech API, which is supported in all modern Chromium-based browsers.

## Privacy Policy

Tweet Reader does **not** collect, store, transmit, or share any user data. Specifically:

- **No personal data** is collected (no names, emails, accounts, or identifiers).
- **No browsing data** is collected or tracked.
- **No analytics or telemetry** of any kind is used.
- **No network requests** are made by the extension. All functionality runs locally in your browser.
- **No third-party services** are contacted. Text-to-speech is handled entirely by your browser's built-in Web Speech API.
- **No data leaves your device** at any time.

This extension requires access to `x.com` and `twitter.com` solely to inject the reader buttons into tweet action bars. It does not read, store, or transmit any content from these sites.

## License

MIT
