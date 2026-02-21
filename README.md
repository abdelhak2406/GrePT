# DownloadGPT

Extension-first project for exporting ChatGPT conversations.

## Local development

All commands should run inside the toolbox dev container.

```bash
toolbox run -c dev npm install
toolbox run -c dev npm run lint
toolbox run -c dev npm run typecheck
toolbox run -c dev npm run test
toolbox run -c dev npm run build
```

## Single-test examples

```bash
toolbox run -c dev npx vitest run src/shared/sanitize-file-name.test.ts
toolbox run -c dev npx vitest run -t "falls back when the title has no valid characters"
```

## Extension output

- Build artifacts are generated in `dist/`.
- Load `dist/` as an unpacked extension in Chromium-based browsers.
- Open any ChatGPT conversation page, click the extension action, and it downloads:
  - `YYYY-MM-DD_HH-mm-ss_<title>.md`
  - `YYYY-MM-DD_HH-mm-ss_<title>.json`
- The exporter is DOM-based, so it can mark exports as partial when the page appears not fully loaded.
