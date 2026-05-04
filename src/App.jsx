import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const STORAGE_KEY = 'md-editor-content';

const SAMPLE = `# Welcome

Type markdown and watch it style **inline** — like Bear.

## How it looks

- Lists render with the bullet visible
- *Italics* and **bold** apply to the inner text
- \`inline code\` gets a monospace look
- Headings grow with their level

> Quotes are indented and softened.

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Your content auto-saves locally as you type.
`;

const markdownHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.9em', fontWeight: '700', lineHeight: '1.25' },
  { tag: t.heading2, fontSize: '1.55em', fontWeight: '700', lineHeight: '1.3' },
  { tag: t.heading3, fontSize: '1.3em', fontWeight: '600' },
  { tag: t.heading4, fontSize: '1.15em', fontWeight: '600' },
  { tag: [t.heading5, t.heading6], fontSize: '1.05em', fontWeight: '600' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: 'var(--accent)', textDecoration: 'underline' },
  { tag: t.url, color: 'var(--accent)' },
  { tag: t.monospace, fontFamily: 'var(--mono)', background: 'var(--code-bg)', padding: '0.05em 0.3em', borderRadius: '3px' },
  { tag: t.quote, color: 'var(--muted)', fontStyle: 'italic' },
  { tag: t.list, color: 'var(--text)' },
  { tag: t.processingInstruction, color: 'var(--muted)' },
  { tag: t.contentSeparator, color: 'var(--muted)' },
  { tag: t.meta, color: 'var(--muted)' },
]);

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '17px',
    color: 'var(--text)',
    backgroundColor: 'var(--bg)',
  },
  '.cm-scroller': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: '1.65',
    padding: '2.5rem max(1.25rem, calc(50% - 22rem))',
  },
  '.cm-content': {
    caretColor: 'var(--accent)',
    maxWidth: '44rem',
    margin: '0 auto',
  },
  '.cm-line': { padding: '0' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, ::selection': { background: 'rgba(29, 58, 138, 0.18)' },
  '&.cm-focused .cm-selectionBackground': { background: 'rgba(29, 58, 138, 0.22)' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
});

export default function App() {
  const [text, setText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? SAMPLE);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      parent: editorRef.current,
      state: EditorState.create({
        doc: text,
        extensions: [
          history(),
          drawSelection(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(markdownHighlight),
          editorTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) setText(u.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, text), 200);
    return () => clearTimeout(id);
  }, [text]);

  const wordCount = useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text]
  );

  const replaceDoc = (next) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: next },
    });
  };

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
    reader.onload = () => replaceDoc(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAll = () => {
    if (confirm('Clear the editor?')) replaceDoc('');
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
          <button onClick={clearAll}>Clear</button>
        </div>
      </header>

      <main className="editor-wrap" ref={editorRef} />

      <footer className="status">
        <span>{text.length} chars</span>
        <span>{wordCount} words</span>
        <span>Auto-saved locally</span>
      </footer>
    </div>
  );
}
