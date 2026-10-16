"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ObjectPicture, RoleGate } from "@/components/ui";
import { checkOriginality, questionsLeft, ruleFeedback, shouldFlag } from "@/lib/insights";
import { findPassage, getObject, type ObjectCase } from "@/lib/objects";
import { LOG_SECTIONS, ReasoningFeedback, SECTION_TEXT } from "@/lib/schema";
import type { InterpretationLog, Investigation, LogSection, User } from "@/lib/schema";
import { classesForStudent, findInvestigation, investigationsFor, saveLog } from "@/lib/store";

const PROMPTS: Record<LogSection, string> = {
  material: "What is it made of, and how do you know?",
  location: "Where was it found, and what was near it?",
  timePeriod: "When is it from, and what evidence dates it?",
  reasoning: "How does the evidence fit together? What do you think, and how sure are you?",
};

function LogEditor({ user, obj, inv }: { user: User; obj: ObjectCase; inv: Investigation }) {
  const [log, setLog] = useState<InterpretationLog>(inv.log);
  const [saved, setSaved] = useState(true);
  const [fb, setFb] = useState<ReasoningFeedback | null>(inv.log.feedback ?? null);
  const [fbBusy, setFbBusy] = useState(false);
  const [fbStale, setFbStale] = useState(false);
  const locked = !!log.submittedAt && log.review?.decision !== "rewrite";
  const hasTeacher = !user.guest && classesForStudent(user.id).length > 0;
  const blank = LOG_SECTIONS.every((s) => !log[s].trim());

  const pastInvs = investigationsFor(user.id)
    .filter((i) => i.id !== inv.id && i.log.submittedAt)
    .sort((a, b) => (a.log.submittedAt! < b.log.submittedAt! ? -1 : 1));
  const left = questionsLeft(inv);

  /** Ask the AI to read the log. Falls back to the fixed checklist if it can't be reached. */
  async function getFeedback(target: InterpretationLog = log): Promise<ReasoningFeedback> {
    setFbBusy(true);
    let result: ReasoningFeedback;
    try {
      const strip = (l: InterpretationLog) => ({ material: l.material, location: l.location, timePeriod: l.timePeriod, reasoning: l.reasoning, sources: l.sources });
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          objectId: obj.id,
          log: strip(target),
          past: pastInvs.slice(-2).map((i) => ({ objectCode: getObject(i.objectId)?.code ?? i.objectId, log: strip(i.log) })),
          questionsLeft: left,
        }),
      });
      const parsed = ReasoningFeedback.safeParse(await res.json());
      result = parsed.success ? parsed.data : ruleFeedback(target, pastInvs.map((i) => i.log), left, `Unexpected reply from the server (${res.status}).`);
    } catch {
      result = ruleFeedback(target, pastInvs.map((i) => i.log), left, "Couldn't reach the server.");
    }
    setFb(result);
    setFbStale(false);
    setFbBusy(false);
    return result;
  }

  const seen = [...new Set(inv.messages.flatMap((m) => (m.from === "guide" && m.sourceId ? [m.sourceId] : [])))]
    .map((id) => findPassage(obj, id))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const sourceOptions = [...new Map(seen.map((s) => [s.source.id, s.source.title])).entries()];

  function update(next: InterpretationLog) {
    setLog(next);
    setSaved(false);
    if (fb) setFbStale(true);
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

  async function submit() {
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
    // Feedback is saved with the log so it shows on the home page and to parents.
    const feedback = await getFeedback(next);
    const withFeedback = { ...next, feedback };
    setLog(withFeedback);
    persist(withFeedback);
  }

  return (
    <main className="page">
      <div className="grid cols-main-side">
        <section className="card">
          <div className="spread">
            <div className="stack" style={{ gap: 2 }}>
              <span className="row"><ObjectPicture obj={obj} size="thumb" /><span className="eyebrow">{obj.code}</span></span>
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
              {hasTeacher
                ? "Write in your own words. Logs that closely copy the chat are sent to your teacher to review."
                : "Write in your own words. You'll get feedback on your reasoning when you finish."}
            </span>
            {locked ? (
              <Link className="btn ghost" href="/student">Back to my investigations</Link>
            ) : (
              <button className="btn" onClick={() => void submit()} disabled={blank || fbBusy}>
                {log.submittedAt ? "Resubmit" : hasTeacher ? "Submit to teacher" : "Finish log"}
              </button>
            )}
          </div>
        </section>
        <aside className="card" aria-live="polite">
          <h2 style={{ fontSize: 24 }}>Feedback on your reasoning</h2>
          {!locked && (
            <button className="btn ghost" onClick={() => void getFeedback()} disabled={fbBusy || blank}>
              {fbBusy ? "Reading your log…" : fb ? "Check my reasoning again" : "Check my reasoning"}
            </button>
          )}
          {!fb && !fbBusy && <p className="small muted">Write your log, then press “Check my reasoning” for feedback on how well your evidence supports your ideas.</p>}
          {fb && fbStale && !fbBusy && <p className="small muted">You&apos;ve changed your log since this feedback.</p>}
          {fb && (
            <>
              <span className="eyebrow">Try improving</span>
              {fb.improve.length === 0 && <p className="small muted">Nothing to flag. Nice work.</p>}
              {fb.improve.map((t) => <div key={t} className="tile small">{t}</div>)}
              {fb.compare.length > 0 && (
                <>
                  <span className="eyebrow">Compared with your earlier logs</span>
                  {fb.compare.map((c) => (
                    <div key={c.text} className="row small" style={{ alignItems: "flex-start" }}>
                      <span className={`pill ${c.tone === "better" ? "good" : c.tone === "worse" ? "bad" : "warn"}`}>{c.tone === "better" ? "Better" : c.tone === "worse" ? "Weaker" : "Same"}</span>
                      <span style={{ flex: 1 }}>{c.text}</span>
                    </div>
                  ))}
                </>
              )}
              <span className="small muted" style={{ fontSize: 12 }}>
                {fb.via === "ai" ? "Written by AI from your log and the sources" : `Automatic checklist (AI unavailable: ${fb.aiError ?? "unknown reason"})`}
              </span>
            </>
          )}
          <Link href={`/student/investigate/${obj.id}`} className="small">Back to the conversation</Link>
        </aside>
      </div>
    </main>
  );
}

function LogPage({ user, obj }: { user: User; obj: ObjectCase }) {
  if (user.guest && !obj.practice) return <GuestOnlyPractice />;
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
  return <LogEditor key={inv.id} user={user} obj={obj} inv={inv} />;
}

function GuestOnlyPractice() {
  return (
    <main className="page">
      <div className="card" style={{ maxWidth: 560 }}>
        <h1>Practice objects only</h1>
        <p>Guest accounts can use the practice objects. Create a student account to investigate other objects or join a class.</p>
        <Link className="btn" href="/student" style={{ alignSelf: "flex-start" }}>Back to practice objects</Link>
      </div>
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const obj = getObject(id);
  return <RoleGate role="student">{(user) => (obj ? <LogPage user={user} obj={obj} /> : <main className="page"><div className="card"><h1>Object not found</h1></div></main>)}</RoleGate>;
}

