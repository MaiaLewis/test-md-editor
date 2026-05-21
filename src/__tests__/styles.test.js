import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(__dirname, '../styles.css');

let css;

beforeAll(() => {
  css = readFileSync(cssPath, 'utf-8');
});

// Helper: extract :root block content
function getRootBlock(cssText) {
  const match = cssText.match(/:root\s*\{([^}]+)\}/);
  return match ? match[1] : '';
}

// Helper: get value of a CSS custom property from :root
function getCSSVar(cssText, varName) {
  const rootBlock = getRootBlock(cssText);
  const regex = new RegExp(`${varName}\\s*:\\s*([^;\\n]+)`);
  const match = rootBlock.match(regex);
  return match ? match[1].trim() : null;
}

// Helper: get all declarations for a CSS selector (plain selector, not pre-escaped)
function getDeclarations(cssText, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 'g');
  const results = [];
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    results.push(match[1]);
  }
  return results.join('\n');
}

describe('styles.css - Light Mode Theme CSS Variables (:root)', () => {
  it('should define --bg as light blue (#eaf2fb)', () => {
    expect(getCSSVar(css, '--bg')).toBe('#eaf2fb');
  });

  it('should define --panel as light panel color (#d7e6f5)', () => {
    expect(getCSSVar(css, '--panel')).toBe('#d7e6f5');
  });

  it('should define --border as light border color (#b6cce3)', () => {
    expect(getCSSVar(css, '--border')).toBe('#b6cce3');
  });

  it('should define --text as dark blue (#0a1a3d)', () => {
    expect(getCSSVar(css, '--text')).toBe('#0a1a3d');
  });

  it('should define --muted as muted blue (#4a5d85)', () => {
    expect(getCSSVar(css, '--muted')).toBe('#4a5d85');
  });

  it('should define --accent as dark navy (#1d3a8a)', () => {
    expect(getCSSVar(css, '--accent')).toBe('#1d3a8a');
  });

  it('should define --code-bg as light code background (#d0dff0)', () => {
    expect(getCSSVar(css, '--code-bg')).toBe('#d0dff0');
  });

  it('should define the new --preview-bg variable (#f3f7fc)', () => {
    expect(getCSSVar(css, '--preview-bg')).toBe('#f3f7fc');
  });

  it('should not use old dark mode background (#1e1e1e) for --bg', () => {
    const rootBlock = getRootBlock(css);
    expect(rootBlock).not.toContain('#1e1e1e');
  });

  it('should not use old dark mode panel (#252526) for --panel', () => {
    const rootBlock = getRootBlock(css);
    expect(rootBlock).not.toContain('#252526');
  });

  it('should not use old dark mode text (#e6e6e6) for --text', () => {
    const rootBlock = getRootBlock(css);
    expect(rootBlock).not.toContain('#e6e6e6');
  });

  it('should not use old dark mode code-bg (#2d2d2d) for --code-bg', () => {
    const rootBlock = getRootBlock(css);
    expect(rootBlock).not.toContain('#2d2d2d');
  });

  it('should have all 8 required CSS variables defined in :root', () => {
    const required = ['--bg', '--panel', '--border', '--text', '--muted', '--accent', '--code-bg', '--preview-bg'];
    const rootBlock = getRootBlock(css);
    for (const v of required) {
      expect(rootBlock, `missing CSS variable ${v}`).toContain(v);
    }
  });

  it('should have light-colored (high luminance) values for background variables', () => {
    // Light mode: backgrounds should start with # and have high hex values
    const bg = getCSSVar(css, '--bg');
    const panel = getCSSVar(css, '--panel');
    const previewBg = getCSSVar(css, '--preview-bg');
    // All should be 6-digit hex colors starting with high value (light colors)
    expect(bg).toMatch(/^#[e-f][a-f0-9]{5}$/i);
    expect(panel).toMatch(/^#[c-f][a-f0-9]{5}$/i);
    expect(previewBg).toMatch(/^#[e-f][a-f0-9]{5}$/i);
  });
});

describe('styles.css - .toolbar h1 color (PR addition)', () => {
  it('should include color: var(--text) in .toolbar h1', () => {
    const decls = getDeclarations(css, '.toolbar h1');
    expect(decls).toContain('color');
    expect(decls).toContain('var(--text)');
  });
});

describe('styles.css - .actions button background (light mode change)', () => {
  it('should use light mode button background #c4d8ee', () => {
    const decls = getDeclarations(css, '.actions button');
    expect(decls).toContain('#c4d8ee');
  });

  it('should not use old dark mode button background #2d2d30 anywhere in file', () => {
    expect(css).not.toContain('#2d2d30');
  });

  it('should set button color using var(--text)', () => {
    const decls = getDeclarations(css, '.actions button');
    expect(decls).toContain('var(--text)');
  });
});

describe('styles.css - .actions button:hover background (light mode change)', () => {
  it('should use light hover background #b0caea', () => {
    const decls = getDeclarations(css, '.actions button:hover');
    expect(decls).toContain('#b0caea');
  });

  it('should not use old dark mode hover background #37373d anywhere in file', () => {
    expect(css).not.toContain('#37373d');
  });

  it('should set hover border-color to var(--accent)', () => {
    const decls = getDeclarations(css, '.actions button:hover');
    expect(decls).toContain('var(--accent)');
  });
});

describe('styles.css - .editor::placeholder rule (new PR addition)', () => {
  it('should contain .editor::placeholder selector', () => {
    expect(css).toContain('.editor::placeholder');
  });

  it('should set placeholder color to var(--muted)', () => {
    const decls = getDeclarations(css, '.editor::placeholder');
    expect(decls).toContain('var(--muted)');
  });

  it('should not set placeholder color to a hardcoded value', () => {
    const decls = getDeclarations(css, '.editor::placeholder');
    // color should not be a hex value directly, must use CSS variable
    expect(decls).not.toMatch(/color\s*:\s*#/);
  });
});

describe('styles.css - .preview light mode styles (PR changes)', () => {
  it('should set .preview background to var(--preview-bg)', () => {
    const decls = getDeclarations(css, '.preview');
    expect(decls).toContain('var(--preview-bg)');
  });

  it('should set .preview color to var(--text)', () => {
    const decls = getDeclarations(css, '.preview');
    expect(decls).toContain('var(--text)');
  });

  it('should not use hardcoded dark background #1a1a1a for .preview', () => {
    expect(css).not.toContain('#1a1a1a');
  });

  it('should use the new --preview-bg variable (not --bg) for preview background', () => {
    const decls = getDeclarations(css, '.preview');
    expect(decls).toContain('var(--preview-bg)');
    // preview-bg differs from --bg; this test confirms it's specifically preview-bg
    expect(getCSSVar(css, '--preview-bg')).not.toBe(getCSSVar(css, '--bg'));
  });
});

describe('styles.css - .markdown-body h1/h2/h3 color (PR addition)', () => {
  it('should contain color: var(--text) in the combined heading rule', () => {
    const match = css.match(/\.markdown-body h1,[\s\S]*?\.markdown-body h2,[\s\S]*?\.markdown-body h3\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const decls = match ? match[1] : '';
    expect(decls).toContain('var(--text)');
  });
});

describe('styles.css - .markdown-body code color (PR addition)', () => {
  it('should contain color: var(--text) for inline code styling', () => {
    // Match .markdown-body code { ... } - the standalone block (not pre code)
    const match = css.match(/\.markdown-body code\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const decls = match ? match[1] : '';
    expect(decls).toContain('var(--text)');
  });
});

describe('styles.css - .markdown-body blockquote background (PR change)', () => {
  it('should use updated blockquote background rgba(29, 58, 138, 0.06)', () => {
    const decls = getDeclarations(css, '.markdown-body blockquote');
    expect(decls).toContain('rgba(29, 58, 138, 0.06)');
  });

  it('should not use old dark blockquote background rgba(79, 140, 201, 0.05)', () => {
    expect(css).not.toContain('rgba(79, 140, 201, 0.05)');
  });

  it('blockquote background should use the accent color RGB (29, 58, 138 = #1d3a8a)', () => {
    // --accent is #1d3a8a = rgb(29, 58, 138)
    // blockquote background should reference the same color as --accent
    const accentHex = getCSSVar(css, '--accent');
    expect(accentHex).toBe('#1d3a8a');
    const decls = getDeclarations(css, '.markdown-body blockquote');
    // rgba(29, 58, 138, 0.06) matches #1d3a8a with 6% opacity
    expect(decls).toContain('rgba(29, 58, 138,');
  });
});

describe('styles.css - package-lock.json structural integrity', () => {
  let lock;

  beforeAll(() => {
    const lockPath = resolve(__dirname, '../../package-lock.json');
    lock = JSON.parse(readFileSync(lockPath, 'utf-8'));
  });

  it('should have package-lock.json present in project root', () => {
    const lockPath = resolve(__dirname, '../../package-lock.json');
    expect(() => readFileSync(lockPath, 'utf-8')).not.toThrow();
  });

  it('should have lockfileVersion 3', () => {
    expect(lock.lockfileVersion).toBe(3);
  });

  it('should have project name test-md-editor', () => {
    expect(lock.name).toBe('test-md-editor');
  });

  it('should list dompurify as a runtime dependency', () => {
    expect(lock.packages[''].dependencies).toHaveProperty('dompurify');
  });

  it('should list marked as a runtime dependency', () => {
    expect(lock.packages[''].dependencies).toHaveProperty('marked');
  });

  it('should list react as a runtime dependency', () => {
    expect(lock.packages[''].dependencies).toHaveProperty('react');
  });

  it('should list react-dom as a runtime dependency', () => {
    expect(lock.packages[''].dependencies).toHaveProperty('react-dom');
  });

  it('should list vite as a dev dependency', () => {
    expect(lock.packages[''].devDependencies).toHaveProperty('vite');
  });

  it('should list @vitejs/plugin-react as a dev dependency', () => {
    expect(lock.packages[''].devDependencies).toHaveProperty('@vitejs/plugin-react');
  });

  it('should resolve dompurify to version 3.x in node_modules', () => {
    const pkg = lock.packages['node_modules/dompurify'];
    expect(pkg).toBeDefined();
    expect(pkg.version).toMatch(/^3\./);
  });

  it('should resolve marked to version 12.x in node_modules', () => {
    const pkg = lock.packages['node_modules/marked'];
    expect(pkg).toBeDefined();
    expect(pkg.version).toMatch(/^12\./);
  });

  it('should resolve react to version 18.x in node_modules', () => {
    const pkg = lock.packages['node_modules/react'];
    expect(pkg).toBeDefined();
    expect(pkg.version).toMatch(/^18\./);
  });

  it('should resolve react-dom to version 18.x in node_modules', () => {
    const pkg = lock.packages['node_modules/react-dom'];
    expect(pkg).toBeDefined();
    expect(pkg.version).toMatch(/^18\./);
  });

  it('should have dompurify license as MPL-2.0 OR Apache-2.0', () => {
    const pkg = lock.packages['node_modules/dompurify'];
    expect(pkg.license).toBe('(MPL-2.0 OR Apache-2.0)');
  });

  it('should have react listed with MIT license', () => {
    const pkg = lock.packages['node_modules/react'];
    expect(pkg.license).toBe('MIT');
  });

  it('requires: true should be set in package-lock.json', () => {
    expect(lock.requires).toBe(true);
  });
});
