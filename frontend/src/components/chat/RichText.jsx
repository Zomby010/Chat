/**
 * Renders AI text with light formatting (paragraphs, bullet lists, **bold**)
 * by building React elements, so no HTML from the model is ever injected.
 */
function inline(text, keyBase) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong> : p));
}

export default function RichText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    const bullet = /^([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) {
        list = { ordered: /^\d/.test(line), items: [] };
        blocks.push(list);
      }
      list.items.push(bullet[2]);
      return;
    }
    list = null;
    if (line) blocks.push({ p: line, key: i });
  });
  return blocks.map((b, i) => {
    if (b.items) {
      const Tag = b.ordered ? 'ol' : 'ul';
      return (
        <Tag key={i}>
          {b.items.map((it, j) => (
            <li key={j}>{inline(it, `${i}-${j}`)}</li>
          ))}
        </Tag>
      );
    }
    return <p key={i}>{inline(b.p, i)}</p>;
  });
}
