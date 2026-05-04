# test-md-editor

A minimal browser-based Markdown editor with live preview, built with React and Vite.

## Features

- Side-by-side editor and rendered preview
- GitHub-flavored Markdown via [marked](https://github.com/markedjs/marked)
- HTML sanitized with [DOMPurify](https://github.com/cure53/DOMPurify)
- Auto-save to `localStorage` as you type
- Import `.md` files from disk
- Export the document as `.md` or `.html`
- Live character and word counts

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

The dev server prints a local URL (typically http://localhost:5173) — open it in your browser.

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — produce a production build in `dist/`
- `npm run preview` — preview the production build locally

## Project structure

```
index.html         # Vite entry HTML
vite.config.js     # Vite + React plugin config
src/
  main.jsx         # React root
  App.jsx          # Editor UI, parsing, import/export
  styles.css       # Layout and preview styles
```

## How it works

`App.jsx` keeps the raw Markdown in component state, persists it to `localStorage` (debounced ~200ms), and re-renders the preview by piping the text through `marked.parse` and then `DOMPurify.sanitize`. Import reads files via `FileReader`; export creates a `Blob` and triggers a download.
