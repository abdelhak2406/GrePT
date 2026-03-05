# GrePt

grep your AI conversations and export them. ChatGPT today, more sources soon.


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

## Extension output

- Build artifacts are generated in `dist/`.
- Load `dist/` as an unpacked extension in Chromium-based browsers.
- Open any ChatGPT conversation page, click the extension action, and it downloads:
  - `grept-chats.json`
- The JSON output follows an Open WebUI-native import format (`chat` objects in an array).
- In Open WebUI, import from Settings -> Data Controls -> Import Chats.
- The exporter is DOM-based, so it can mark exports as partial when the page appears not fully loaded.
- Currently targets ChatGPT (`chatgpt.com`). Support for additional AI chat sources is planned.
