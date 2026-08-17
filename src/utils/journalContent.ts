export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** ~200 wpm average adult reading speed. Falls back to '1 min read' minimum. */
export function calculateReadingTime(html: string): string {
  const text = (html || '').replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function slugifyHeading(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base ? `${base}-${index}` : `section-${index}`;
}

/**
 * Parses article HTML once, injects stable ids on every h2/h3, and returns
 * both the annotated HTML (for rendering) and the heading list (for the TOC).
 * Guarded for SSR/build environments where `window`/DOMParser may be absent.
 */
export function processArticleContent(html: string): { html: string; headings: Heading[] } {
  const safeHtml = html || '<p>No content provided for this story yet.</p>';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return { html: safeHtml, headings: [] };
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(safeHtml, 'text/html');
    const nodes = Array.from(doc.querySelectorAll('h2, h3'));
    const headings: Heading[] = nodes.map((node, idx) => {
      const text = node.textContent?.trim() || `Section ${idx + 1}`;
      const id = slugifyHeading(text, idx);
      node.setAttribute('id', id);
      return { id, text, level: node.tagName === 'H2' ? 2 : 3 };
    });
    return { html: doc.body.innerHTML, headings };
  } catch (err) {
    console.error('Error processing article content:', err);
    return { html: safeHtml, headings: [] };
  }
}
