"use client";

import Link from "next/link";
import { use, useState } from "react";
import { RoleGate } from "@/components/ui";
import { checkOriginality, logFeedback, questionsLeft, shouldFlag } from "@/lib/insights";
import { findPassage, getObject, type ObjectCase } from "@/lib/objects";
import { LOG_SECTIONS, SECTION_TEXT } from "@/lib/schema";
import type { InterpretationLog, Investigation, LogSection, User } from "@/lib/schema";
import { findInvestigation, investigationsFor, saveLog } from "@/lib/store";

const PROMPTS: Record<LogSection, string> = {
  material: "What is it made of, and how do you know?",
  location: "Where was it found, and what was near it?",
  timePeriod: "When is it from, and what evidence dates it?",
  reasoning: "How does the evidence fit together? What do you think, and how sure are you?",
};

function LogEditor({ user, obj, inv }: { user: User; obj: ObjectCase; inv: Investigation }) {
  const [log, setLog] = useState<InterpretationLog>(inv.log);
  const [saved, setSaved] = useState(true);
  const locked = !!log.submittedAt && log.review?.decision !== "rewrite";

  const seen = [...new Set(inv.messages.flatMap((m) => (m.from === "guide" && m.sourceId ? [m.sourceId] : [])))]
    .map((id) => findPassage(obj, id))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const sourceOptions = [...new Map(seen.map((s) => [s.source.id, s.source.title])).entries()];

  function update(next: InterpretationLog) {
    setLog(next);
    setSaved(false);
  }

  function persist(next = log) {
    saveLog(inv.id, next);
    setSaved(true);
  }

  function toggleSource(section: LogSection, sourceId: string) {
    const list = log.sources[section];
    const next = { ...log, sources: { ...log.sources, [section]: list.includes(sourceId) ? list.filter((s) => s !== sourceId) : [...list, sourceId] } };
    update(next);
    persist(next);
  }

  function submit() {
    const guideTexts = inv.messages.flatMap((m) => (m.from === "guide" ? [m.text] : []));
    const originality = checkOriginality(log, guideTexts);
    const next: InterpretationLog = {
      ...log,
      submittedAt: new Date().toISOString(),
      flag: shouldFlag(originality) ? { score: originality.score, matches: originality.matches } : undefined,
      review: undefined,
    };
    setLog(next);
    persist(next);
  }

  const past = investigationsFor(user.id)
    .filter((i) => i.id !== inv.id && i.log.submittedAt)
    .sort((a, b) => (a.log.submittedAt! < b.log.submittedAt! ? -1 : 1))
    .map((i) => i.log);
  const feedback = logFeedback(log, past, questionsLeft(inv));
  const improve = feedback.filter((f) => f.tone === "improve");
  const compare = feedback.filter((f) => f.tone !== "improve");

  return (
    <main className="page">
      <div className="grid cols-main-side">
        <section className="card">
          <div className="spread">
            <div className="stack" style={{ gap: 2 }}>
              <span className="eyebrow">{obj.code}</span>
              <h1 style={{ fontSize: 32 }}>Interpretation Log</h1>
            </div>
            <span className="small muted">{locked ? "Submitted" : saved ? "Saved" : "Unsaved changes"}</span>
          </div>
          {log.review && (
            <div className={`banner${log.review.decision === "accept" ? " ok" : ""}`}>
              <div className="stack" style={{ gap: 4 }}>
                <strong>
                  {log.review.decision === "rewrite" ? "Your teacher asked you to rewrite this log" : log.review.decision === "accept" ? "Your teacher accepted this log" : "Your teacher wants to talk about this in class"}
                </strong>
                {log.review.feedback && <span>“{log.review.feedback}”</span>}
              </div>
            </div>
          )}
          {LOG_SECTIONS.map((s) => (
            <div key={s} className="field">
              <label htmlFor={`log-${s}`}>{SECTION_TEXT[s]}</label>
              <span className="small muted">{PROMPTS[s]}</span>
              <textarea
                id={`log-${s}`}
                className="textarea"
                rows={s === "reasoning" ? 5 : 3}
                value={log[s]}
                readOnly={locked}
                onChange={(e) => update({ ...log, [s]: e.target.value })}
                onBlur={() => persist()}
              />
              <div className="row small" role="group" aria-label={`Sources for ${SECTION_TEXT[s]}`}>
                <span className="muted">Sources:</span>
                {sourceOptions.length === 0 && <span className="muted">Ask questions to unlock sources to link.</span>}
                {sourceOptions.map(([id, title]) => {
                  const on = log.sources[s].includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`btn small ${on ? "" : "ghost"}`}
                      style={{ minHeight: 30, fontSize: 13 }}
                      aria-pressed={on}
                      disabled={locked}
                      onClick={() => toggleSource(s, id)}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <span className="small muted" style={{ maxWidth: 520 }}>
              Write in your own words. Logs that closely copy the chat are sent to your teacher to review.
            </span>
            {locked ? (
              <Link className="btn ghost" href="/student">Back to my investigations</Link>
            ) : (
              <button className="btn" onClick={submit} disabled={LOG_SECTIONS.every((s) => !log[s].trim())}>
                {log.submittedAt ? "Resubmit" : "Submit to teacher"}
              </button>
            )}
          </div>
        </section>
        <aside className="card">
          <h2 style={{ fontSize: 24 }}>Feedback</h2>
          <span className="eyebrow">Try improving</span>
          {improve.length === 0 && <p className="small muted">Nothing to flag. Nice work.</p>}
          {improve.map((f) => <div key={f.text} className="tile small">{f.text}</div>)}
          {compare.length > 0 && (
            <>
              <span className="eyebrow">Compared with your last log</span>
              {compare.map((f) => (
                <div key={f.text} className="row small" style={{ alignItems: "flex-start" }}>
                  <span className={`pill ${f.tone === "better" ? "good" : "warn"}`}>{f.tone === "better" ? "Better" : "Same"}</span>
                  <span style={{ flex: 1 }}>{f.text}</span>
                </div>
              ))}
            </>
          )}
          <Link href={`/student/investigate/${obj.id}`} className="small">Back to the conversation</Link>
        </aside>
      </div>
    </main>
  );
}

function LogPage({ user, obj }: { user: User; obj: ObjectCase }) {
  const inv = findInvestigation(user.id, obj.id);
  if (!inv) {
    return (
      <main className="page">
        <div className="card" style={{ maxWidth: 520 }}>
          <h1>Start by asking questions</h1>
          <p>Your log is for the evidence you find. Ask some questions first.</p>
          <Link className="btn" href={`/student/investigate/${obj.id}`} style={{ alignSelf: "flex-start" }}>Start {obj.code}</Link>
        </div>
      </main>
    );
  }
  return <LogEditor key={inv.log.submittedAt ?? "draft"} user={user} obj={obj} inv={inv} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const obj = getObject(id);
  return <RoleGate role="student">{(user) => (obj ? <LogPage user={user} obj={obj} /> : <main className="page"><div className="card"><h1>Object not found</h1></div></main>)}</RoleGate>;
}

