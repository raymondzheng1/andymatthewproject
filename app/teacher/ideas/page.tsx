"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { RoleGate } from "@/components/ui";
import { z } from "zod";
import { LessonPlanSchema, offlinePlan, type LessonPlan } from "@/lib/ideas";

const PlanReply = LessonPlanSchema.extend({ via: z.enum(["ai", "sources"]), aiError: z.string().optional() });
type Plan = LessonPlan & { via: "ai" | "sources"; aiError?: string };
import { analyseClass } from "@/lib/insights";
import type { User } from "@/lib/schema";
import { classesForTeacher, getDb } from "@/lib/store";

type Exchange = { question: string; plan: Plan | null };

const SUGGESTED = ["How can I help them with the time period?", "How do I teach fact vs inference in 15 minutes?", "How can I get them writing in their own words?"];

function Ideas({ teacher }: { teacher: User }) {
  const params = useSearchParams();
  const classes = classesForTeacher(teacher.id);
  const [classId, setClassId] = useState(params.get("class") ?? classes[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const cls = classes.find((c) => c.id === classId);
  const analysis = cls ? analyseClass(cls, getDb().investigations) : null;

  async function ask(q: string) {
    if (!q.trim() || !cls || !analysis || busy) return;
    setBusy(true);
    setQuestion("");
    setThread((t) => [...t, { question: q, plan: null }]);
    let plan: Plan;
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ className: cls.name, analysis, question: q }),
      });
      const parsed = PlanReply.safeParse(await res.json());
      plan = parsed.success ? parsed.data : { ...offlinePlan(analysis, q), via: "sources", aiError: `Unexpected reply from the server (${res.status}).` };
    } catch {
      plan = { ...offlinePlan(analysis, q), via: "sources", aiError: "Couldn't reach the server." };
    }
    setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, plan } : x)));
    setBusy(false);
  }

  if (classes.length === 0) {
    return <main className="page"><div className="card"><h1>Create a class first</h1><p>Teaching ideas are based on your class&apos;s logs and conversations.</p></div></main>;
  }

  return (
    <main className="page">
      <div className="grid cols-side-main">
        <aside className="card">
          <div className="field">
            <label htmlFor="ideas-class">Working from</label>
            <select id="ideas-class" className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {analysis && <span className="small muted">{analysis.logsSubmitted} logs · {analysis.conversations} conversations · {analysis.flagged} flagged</span>}
          </div>
          <span className="eyebrow" style={{ color: "var(--terra-dk)" }}>Class needs work on</span>
          <div className="row">
            {analysis?.needsWork.length ? analysis.needsWork.map((n) => <span key={n.title} className="pill bad">{n.title}</span>) : <span className="small muted">Nothing yet</span>}
          </div>
          <span className="eyebrow">Try asking</span>
          {SUGGESTED.map((s) => (
            <button key={s} className="btn ghost" style={{ justifyContent: "flex-start", whiteSpace: "normal", textAlign: "left", fontWeight: 500 }} onClick={() => ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </aside>
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="spread" style={{ padding: "14px 22px", borderBottom: "1px solid var(--line)" }}>
            <h1 style={{ fontSize: 24 }}>Teaching ideas</h1>
            <span className="small muted">Suggestions based on your class&apos;s logs and conversations</span>
          </div>
          <div className="chat" style={{ borderRadius: 0, minHeight: 380 }} aria-live="polite">
            {thread.length === 0 && <p className="muted">Ask how to teach a skill, support a student, or plan a lesson.</p>}
            {thread.map((x, i) => (
              <div key={i} className="stack">
                <div className="bubble-me">{x.question}</div>
                <div className="bubble-guide" style={{ maxWidth: "94%" }}>
                  {!x.plan ? (
                    <span className="muted">Thinking about your class…</span>
                  ) : (
                    <>
                      <p>{x.plan.intro}</p>
                      <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
                        {x.plan.steps.map((s) => (
                          <li key={s.title}>
                            <strong>{s.title}</strong> <span className="small muted">{s.minutes} min</span>
                            <p>{s.activity}</p>
                            {s.why && <p className="small muted">{s.why}</p>}
                          </li>
                        ))}
                      </ol>
                      <span className="small muted" style={{ fontSize: 12 }}>
                        {x.plan.via === "ai" ? "Written by AI for your class" : `Built-in lesson template (AI unavailable: ${x.plan.aiError ?? "unknown reason"})`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form
            className="row"
            style={{ padding: "14px 22px 18px", borderTop: "1px solid var(--line)" }}
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <label htmlFor="iq" className="sr-only">Ask for teaching ideas</label>
            <input id="iq" className="input" style={{ flex: 1, minWidth: 220 }} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} placeholder="Ask how to teach a skill, support a student, or plan a lesson…" disabled={busy} />
            <button className="btn" disabled={busy || !question.trim()}>Ask</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <RoleGate role="teacher">
      {(user) => (
        <Suspense fallback={null}>
          <Ideas teacher={user} />
        </Suspense>
      )}
    </RoleGate>
  );
}
