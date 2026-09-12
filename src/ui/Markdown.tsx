import type { ComponentChildren } from 'preact';

/**
 * The dossier's tiny markdown: **bold**, *italic*, "- " lists, "# " headings, "> " quotes, blank-line paragraphs.
 * No HTML passthrough; everything is text.
 */
export function Markdown({ text, class: cls }: { text: string; class?: string }) {
  const blocks = splitBlocks(text);
  return <div class={`md${cls ? ` ${cls}` : ''}`}>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}

type Block = { kind: 'p' | 'h1' | 'h2' | 'quote'; text: string } | { kind: 'ul'; items: string[] };

function splitBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const out: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (para.length) out.push({ kind: 'p', text: para.join(' ') });
    para = [];
    if (list) out.push({ kind: 'ul', items: list });
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^##\s+/.test(line)) {
      flush();
      out.push({ kind: 'h2', text: line.replace(/^##\s+/, '') });
    } else if (/^#\s+/.test(line)) {
      flush();
      out.push({ kind: 'h1', text: line.replace(/^#\s+/, '') });
    } else if (/^>\s?/.test(line)) {
      flush();
      out.push({ kind: 'quote', text: line.replace(/^>\s?/, '') });
    } else if (/^[-*•]\s+/.test(line)) {
      if (para.length) {
        out.push({ kind: 'p', text: para.join(' ') });
        para = [];
      }
      (list ??= []).push(line.replace(/^[-*•]\s+/, ''));
    } else {
      if (list) {
        out.push({ kind: 'ul', items: list });
        list = null;
      }
      para.push(line.trim());
    }
  }
  flush();
  return out;
}

function renderBlock(b: Block, key: number) {
  switch (b.kind) {
    case 'h1':
      return <h3 key={key}>{inline(b.text)}</h3>;
    case 'h2':
      return <h4 key={key}>{inline(b.text)}</h4>;
    case 'quote':
      return <blockquote key={key}>{inline(b.text)}</blockquote>;
    case 'ul':
      return (
        <ul key={key}>
          {b.items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </ul>
      );
    default:
      return <p key={key}>{inline(b.text)}</p>;
  }
}

/** **bold** and *italic* only. */
export function inline(text: string): ComponentChildren {
  const parts: ComponentChildren[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<b key={k++}>{tok.slice(2, -2)}</b>);
    else parts.push(<i key={k++}>{tok.slice(1, -1)}</i>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
