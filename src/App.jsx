import { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const STORAGE_KEY = 'md-editor-content';

const SAMPLE = `# Welcome to the Markdown Editor

Start typing on the **left**, see the rendered preview on the **right**.

## Features

- Live preview
- Auto-save to local storage
- Import \`.md\` files
- Export to \`.md\` or \`.html\`

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Tip: your content is saved as you type.

---

## Joke of the day 🌉

**Why did the Golden Gate Bridge break up with the Bay Bridge?**

> Because it was tired of always being the one holding everything together! 😄
`;

marked.setOptions({ gfm: true, breaks: true });

export default function App() {
  const [text, setText] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? SAMPLE;
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, text), 200);
    return () => clearTimeout(id);
  }, [text]);

  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(text || '')),
    [text]
  );

  const wordCount = useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text]
  );

  const download = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAll = () => {
    if (confirm('Clear the editor?')) setText('');
  };

  return (
    <div className="app">
      <header className="toolbar">
        <h1>Markdown Editor</h1>
        <div className="actions">
          <button onClick={() => fileInputRef.current?.click()}>Import .md</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            onChange={onImport}
            hidden
          />
          <button onClick={() => download('document.md', text, 'text/markdown')}>
            Export .md
          </button>
          <button
            onClick={() =>
              download(
                'document.html',
                `<!doctype html><meta charset="utf-8"><title>Document</title>${html}`,
                'text/html'
              )
            }
          >
            Export .html
          </button>
          <button onClick={clearAll}>Clear</button>
        </div>
      </header>

      <main className="panes">
        <textarea
          className="editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck="true"
          placeholder="Write some markdown..."
        />
        <article
          className="preview markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>

      <footer className="status">
        <span>{text.length} chars</span>
        <span>{wordCount} words</span>
        <span>Auto-saved locally</span>
      </footer>
    </div>
  );
}
