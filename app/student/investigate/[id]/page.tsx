"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { ChatView } from "@/components/chat";
import { Chip, Dots, ObjectPicture, RoleGate } from "@/components/ui";
import { offlineAnswer } from "@/lib/guide";
import { questionsLeft, questionsUsed } from "@/lib/insights";
import { findPassage, getObject, type ObjectCase } from "@/lib/objects";
import { ChatMessage, LOG_SECTIONS, MAX_QUESTIONS, SECTION_TEXT } from "@/lib/schema";
import type { GuideMessage, Investigation, User } from "@/lib/schema";
import { addMessages, findInvestigation, startInvestigation, wordsFor } from "@/lib/store";

async function ask(obj: ObjectCase, inv: Investigation, question: string): Promise<GuideMessage> {
  const history: { question: string; reply: string }[] = [];
  for (let i = 0; i < inv.messages.length - 1; i++) {
    const q = inv.messages[i]!;
    const r = inv.messages[i + 1]!;
    if (q.from === "student" && r.from === "guide") history.push({ question: q.text, reply: r.text });
  }
  const seen = inv.messages.flatMap((m) => (m.from === "guide" && m.sourceId ? [m.sourceId] : []));
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ objectId: obj.id, question, history, seen }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const parsed = ChatMessage.safeParse(await res.json());
    if (parsed.success && parsed.data.from === "guide") return parsed.data;
  } catch {
    // Fall through to answering from the sources on this device.
  }
  return { ...offlineAnswer(question, obj, seen, new Date().toISOString()), via: "sources", aiError: "Couldn't reach the server." };
}

function Investigate({ user, obj }: { user: User; obj: ObjectCase }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inv = findInvestigation(user.id, obj.id);
  const count = inv?.messages.length ?? 0;

  useEffect(() => {
    if (!findInvestigation(user.id, obj.id)) startInvestigation(user.id, obj.id);
  }, [user.id, obj.id]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count, pending]);

  if (!inv) return <main className="page" />;
  const used = questionsUsed(inv);
  const left = questionsLeft(inv);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || left === 0 || busy) return;
    setBusy(true);
    setPending(q);
    setQuestion("");
    const at = new Date().toISOString();
    const reply = await ask(obj, inv!, q);
    // Every question counts, including ones that ask for the answer directly.
    addMessages(inv!.id, [{ from: "student", text: q, at }, reply]);
    setPending(null);
    setBusy(false);
  }

  const seenSources = new Map<string, string[]>();
  for (const m of inv.messages) {
    if (m.from === "guide" && m.sourceId) {
      const f = findPassage(obj, m.sourceId);
      if (f) seenSources.set(f.source.title, [...new Set([...(seenSources.get(f.source.title) ?? []), f.passage.text])]);
    }
  }
  const words = wordsFor(user.id);
  const lastGuide = [...inv.messages].reverse().find((m) => m.from === "guide");
  const aiOff = lastGuide?.from === "guide" && lastGuide.via === "sources" ? lastGuide.aiError : undefined;
  const logStarted = LOG_SECTIONS.filter((s) => inv.log[s].trim().length > 0);

  return (
    <main className="page">
      <div className="spread">
        <h1 className="dark-title" style={{ fontSize: 34 }}>{obj.code}</h1>
        <div className="row" style={{ color: "var(--paper)" }}>
          <span>Questions</span>
          <Dots used={used} />
          <strong>{used} / {MAX_QUESTIONS}</strong>
        </div>
      </div>
      <div className="grid cols-investigate">
        <aside className="card">
          <ObjectPicture obj={obj} />
          <p className="small muted">What is it? That&apos;s for you to work out. Click the picture to see it full size.</p>
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">What you can see</span>
            <p>{obj.brief}</p>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">Sources you&apos;ve been pointed to</span>
            {seenSources.size === 0 && <span className="small muted">None yet. Ask a question to start.</span>}
            {[...seenSources.entries()].map(([title, texts]) => (
              <details key={title} className="tile" style={{ padding: "8px 12px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--terra)" }}>{title}</summary>
                {texts.map((t) => <p key={t} className="small" style={{ marginTop: 6 }}>{t}</p>)}
              </details>
            ))}
          </div>
        </aside>

        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="spread" style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 22 }}>Ask the evidence</h2>
            <span className="small muted">Every answer is labeled and sourced</span>
          </div>
          {aiOff && (
            <p className="banner small" role="status" style={{ margin: "12px 16px 0", borderRadius: 10 }}>
              AI answers are off right now, so replies are quoted straight from the sources. Reason: {aiOff}
            </p>
          )}
          <div className="chat" style={{ borderRadius: 0 }} aria-live="polite">
            <ChatView messages={inv.messages} obj={obj} student={user} />
            {pending && (
              <>
                <div className="bubble-me">{pending}</div>
                <div className="bubble-guide"><span className="muted">Checking the sources…</span></div>
              </>
            )}
            <div ref={endRef} />
          </div>
          {left > 0 ? (
            <form onSubmit={submit} className="stack" style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--line)", gap: 6 }}>
              <label htmlFor="q" className="small muted" style={{ fontWeight: 600 }}>
                Ask a question · {left} left for this object
              </label>
              <div className="row">
                <input id="q" className="input" style={{ flex: 1, minWidth: 200 }} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} placeholder="Ask about what you can see, where it was found, or when…" disabled={busy} />
                <button className="btn" disabled={busy || !question.trim()}>Ask</button>
              </div>
            </form>
          ) : (
            <div className="banner ok" style={{ margin: 16 }}>
              <span style={{ flex: 1 }}>You&apos;ve used all {MAX_QUESTIONS} questions. Time to write up your reasoning.</span>
              <Link className="btn small" href={`/student/log/${obj.id}`}>Open my log</Link>
            </div>
          )}
        </section>

        <aside className="stack" style={{ gap: 20 }}>
          <div className="card">
            <h2 style={{ fontSize: 20 }}>Interpretation Log</h2>
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: 4 }}>
              {LOG_SECTIONS.map((s) => (
                <li key={s} className="small">{logStarted.includes(s) ? "✓" : "○"} {SECTION_TEXT[s]}</li>
              ))}
            </ul>
            <Link className="btn" href={`/student/log/${obj.id}`}>{inv.log.submittedAt ? "View my log" : "Open my log"}</Link>
          </div>
          <div className="card">
            <h2 style={{ fontSize: 20 }}>My word list</h2>
            {words.length === 0 && <p className="small muted">Words you rewrite from the dictionary under each answer appear here.</p>}
            {words.map((w) => (
              <div key={w.term} className="small">
                <strong>{w.term}</strong>
                <br />“{w.paraphrase}”
              </div>
            ))}
          </div>
          <div className="card">
            <span className="eyebrow">Answer labels</span>
            <div className="row"><Chip label="fact" /><Chip label="record" /><Chip label="inference" /><Chip label="cultural" /></div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const obj = getObject(id);
  return (
    <RoleGate role="student">
      {(user) =>
        obj ? (
          <Investigate user={user} obj={obj} />
        ) : (
          <main className="page"><div className="card"><h1>Object not found</h1><Link href="/student">Back</Link></div></main>
        )
      }
    </RoleGate>
  );
}
