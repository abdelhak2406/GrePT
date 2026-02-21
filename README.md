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
- The extension currently includes a background service worker and a ChatGPT content script scaffold.
