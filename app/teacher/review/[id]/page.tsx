"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ChatView } from "@/components/chat";
import { Highlight } from "@/components/highlight";
import { ObjectPicture, RoleGate } from "@/components/ui";
import { getObject, sourceTitle } from "@/lib/objects";
import { LOG_SECTIONS, SECTION_TEXT } from "@/lib/schema";
import type { Investigation, User } from "@/lib/schema";
import { classesForTeacher, getInvestigation, getUser, saveLog } from "@/lib/store";

type Decision = "rewrite" | "accept" | "discuss";

function Review({ teacher, inv }: { teacher: User; inv: Investigation }) {
  const obj = getObject(inv.objectId)!;
  const student = getUser(inv.studentId);
  const [decision, setDecision] = useState<Decision>(inv.log.review?.decision ?? (inv.log.flag ? "rewrite" : "accept"));
  const [feedback, setFeedback] = useState(inv.log.review?.feedback ?? "");
  const [sent, setSent] = useState(false);
  const matches = inv.log.flag?.matches ?? [];
  const allowed = classesForTeacher(teacher.id).some((c) => c.studentIds.includes(inv.studentId));
  if (!allowed) return <main className="page"><div className="card"><h1>Not in your classes</h1></div></main>;

  return (
    <main className="page">
      <Link href="/teacher" style={{ color: "var(--paper)" }}>← Back to class</Link>
      <div className="grid cols-main-side">
        <section className="card">
          <div className="spread">
            <div className="row" style={{ alignItems: "flex-start" }}><ObjectPicture obj={obj} size="thumb" /><div className="stack" style={{ gap: 2 }}>
              <span className="eyebrow">{obj.code} · the answer is “{obj.identity}” (students never see this)</span>
              <h1 style={{ fontSize: 32 }}>{student?.name}</h1>
            </div></div>
            {inv.log.flag && <span className="pill bad">Reasoning mirrors the chat ({Math.round(inv.log.flag.score * 100)}% of phrases)</span>}
          </div>
          {inv.log.flag && <p className="small muted">Highlighted passages match the guide&apos;s replies almost word for word.</p>}
          <div className="grid cols-2">
            <div className="stack">
              <h2 style={{ fontSize: 18 }}>Interpretation Log {inv.log.submittedAt ? "" : "(not submitted yet)"}</h2>
              {LOG_SECTIONS.map((s) => (
                <div key={s} className="tile stack" style={{ gap: 4 }}>
                  <strong>{SECTION_TEXT[s]}</strong>
                  <p>{inv.log[s] ? <Highlight text={inv.log[s]} matches={matches} /> : <span className="muted">Empty</span>}</p>
                  {inv.log.sources[s].length > 0 && (
                    <span className="small muted">Sources: {inv.log.sources[s].map((id) => obj.sources.find((x) => x.id === id)?.title ?? id).join(", ")}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="stack">
              <h2 style={{ fontSize: 18 }}>Conversation</h2>
              <div className="chat" style={{ maxHeight: 560 }}>
                <ChatView messages={inv.messages} obj={obj} />
              </div>
            </div>
          </div>
        </section>
        <aside className="card">
          <h2 style={{ fontSize: 24 }}>Your response</h2>
          {!inv.log.submittedAt ? (
            <p className="muted">You can respond once {student?.name} submits their log.</p>
          ) : (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                saveLog(inv.id, { ...inv.log, review: { decision, feedback: feedback.trim(), at: new Date().toISOString() } });
                setSent(true);
              }}
            >
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                <legend className="eyebrow" style={{ marginBottom: 8 }}>Decision</legend>
                {([["rewrite", "Return for rewrite"], ["accept", "Accept"], ["discuss", "Talk in class"]] as const).map(([v, t]) => (
                  <label key={v} className="tile row" style={{ cursor: "pointer", border: decision === v ? "2px solid var(--terra)" : undefined }}>
                    <input type="radio" name="decision" checked={decision === v} onChange={() => setDecision(v)} /> {t}
                  </label>
                ))}
              </fieldset>
              <div className="field">
                <label htmlFor="fb">Feedback to {student?.name}</label>
                <textarea id="fb" className="textarea" rows={6} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What did they do well? What should they try next time?" />
                <span className="small muted">Shown to the student, and to their parents.</span>
              </div>
              <button className="btn">Send to {student?.name}</button>
              {sent && <p className="banner ok" role="status">Sent.</p>}
            </form>
          )}
          <span className="small muted">Sources the student was pointed to: {[...new Set(inv.messages.flatMap((m) => (m.from === "guide" && m.sourceId ? [sourceTitle(obj, m.sourceId)] : [])))].join(", ") || "none yet"}</span>
        </aside>
      </div>
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGate role="teacher">
      {(user) => {
        const inv = getInvestigation(id);
        return inv ? <Review teacher={user} inv={inv} /> : <main className="page"><div className="card"><h1>Not found</h1></div></main>;
      }}
    </RoleGate>
  );
}
