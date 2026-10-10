import type { ReactNode } from "react";

/** Same word splitting as the originality check, so matches line up exactly. */
const subwords = (token: string) => token.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);

/** Wraps the stretches of `text` that appear in `matches` (normalised phrases) in <mark>. */
export function Highlight({ text, matches }: { text: string; matches: string[] }): ReactNode {
  const parts = text.split(/(\s+)/);
  // Flatten to the checker's words, remembering which part each came from.
  const words: string[] = [];
  const owner: number[] = [];
  parts.forEach((p, i) => {
    for (const w of subwords(p)) {
      words.push(w);
      owner.push(i);
    }
  });

  const markedParts = new Set<number>();
  for (const m of matches) {
    const target = m.split(" ").filter(Boolean);
    if (target.length === 0) continue;
    for (let i = 0; i + target.length <= words.length; i++) {
      if (target.every((t, j) => words[i + j] === t)) for (let j = 0; j < target.length; j++) markedParts.add(owner[i + j]!);
    }
  }

  // Whitespace between two marked words stays inside the mark.
  const isMarked = (i: number): boolean => {
    if (markedParts.has(i)) return true;
    if (parts[i]!.trim()) return false;
    return markedParts.has(i - 1) && markedParts.has(i + 1);
  };

  const out: ReactNode[] = [];
  let run = "";
  let runMarked = false;
  parts.forEach((p, i) => {
    const m = isMarked(i);
    if (m !== runMarked && run) {
      out.push(runMarked ? <mark key={i}>{run}</mark> : <span key={i}>{run}</span>);
      run = "";
    }
    runMarked = m;
    run += p;
  });
  if (run) out.push(runMarked ? <mark key="end">{run}</mark> : <span key="end">{run}</span>);
  return <>{out}</>;
}
