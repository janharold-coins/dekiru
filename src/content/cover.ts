/** Split a long title over two lines at the space nearest the middle (the cover title doesn't wrap). */
export function coverTitle(title: string) {
  const t = title.trim();
  if (t.length <= 22 || t.includes("\n")) return t;
  const mid = t.length / 2;
  let best = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? t : `${t.slice(0, best)}\n${t.slice(best + 1)}`;
}
