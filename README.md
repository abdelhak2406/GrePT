# GrePt

grep your AI conversations and export them. ChatGPT today, more sources soon.

## Releases

Pre-built releases are available on the [Releases page](https://git.bazedtux.com/bazedtux/download_gpt/releases).

1. Download the latest `grept-vX.Y.Z.zip`
2. Unzip it — you'll get a `dist/` folder
3. Load it as an unpacked extension (see [Testing in the browser](#testing-in-the-browser))

Releases are published automatically when a new version tag is pushed.

## Local development

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Single-test examples

```bash
npx vitest run src/shared/sanitize-file-name.test.ts
npx vitest run -t "falls back when the title has no valid characters"
```

## Testing in the browser

**Browser support:** Chromium-based browsers (Chrome, Edge, Brave, etc.). Firefox support is in progress.

1. **Build** the extension:

   ```bash
   npm run build
   ```

   Or use watch mode during development to rebuild on file changes:

   ```bash
   npm run dev
   ```

2. **Load the extension in Chrome/Chromium:**
   - Open `chrome://extensions`
   - Enable **Developer mode** (toggle in the top right)
   - Click **Load unpacked** and select the `dist/` folder

3. **Run it:**
   - Navigate to any ChatGPT conversation page (`chatgpt.com`)
   - Click the extension icon in the toolbar
   - It downloads `grept-chats.json`

4. **After rebuilding:** click the refresh icon on the extension card in `chrome://extensions` to pick up changes.

## Extension output

- The JSON output follows an Open WebUI-native import format (`chat` objects in an array).
- In Open WebUI, import from Settings -> Data Controls -> Import Chats.
- The exporter is DOM-based, so it can mark exports as partial when the page appears not fully loaded.
- Currently targets ChatGPT (`chatgpt.com`). Support for additional AI chat sources is planned.
