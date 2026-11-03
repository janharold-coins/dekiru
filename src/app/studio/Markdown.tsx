import { Fragment, type ReactNode } from "react";

/**
 * Just enough Markdown for the Studio rules (src/studio/STUDIO.md): headings, paragraphs, bullet and
 * numbered lists, tables, **bold** and `code`. Anything else shows as plain text.
 */
export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const Tag = (["h1", "h2", "h3"] as const)[h[1].length - 1];
      out.push(<Tag key={i}>{inline(h[2])}</Tag>);
      i++; continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!/^\|[\s|:-]+\|$/.test(lines[i])) rows.push(lines[i].slice(1, -1).split("|").map((c) => c.trim()));
        i++;
      }
      const [head, ...body] = rows;
      out.push(
        <table key={i} className="links">
          <thead><tr>{head.map((c, n) => <th key={n}>{inline(c)}</th>)}</tr></thead>
          <tbody>{body.map((r, n) => <tr key={n}>{r.map((c, m) => <td key={m}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>,
      );
      continue;
    }
    const list = /^(\s*)(-|\d+\.)\s+/.exec(line);
    if (list) {
      const ordered = list[2] !== "-";
      const items: string[] = [];
      while (i < lines.length && /^(-|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i].replace(/^(-|\d+\.)\s+/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += " " + lines[i++].trim(); // wrapped item
        items.push(item);
      }
      const List = ordered ? "ol" : "ul";
      out.push(<List key={i}>{items.map((it, n) => <li key={n}>{inline(it)}</li>)}</List>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||-\s|\d+\.\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(<p key={i}>{inline(para.join(" "))}</p>);
  }
  return <div className="md">{out}</div>;
}

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, n) => (
    part.startsWith("**") && part.endsWith("**") ? <b key={n}>{part.slice(2, -2)}</b>
      : part.startsWith("`") && part.endsWith("`") ? <code key={n}>{part.slice(1, -1)}</code>
        : <Fragment key={n}>{part}</Fragment>
  ));
}
