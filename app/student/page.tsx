"use client";

import Link from "next/link";
import { NotesThread } from "@/components/notes";
import { Dots, ObjectPicture, RoleGate } from "@/components/ui";
import { logFeedback, questionsUsed } from "@/lib/insights";
import { OBJECTS, getObject } from "@/lib/objects";
import { MAX_QUESTIONS } from "@/lib/schema";
import type { Investigation, User } from "@/lib/schema";
import { classesForStudent, findInvestigation, getDb, investigationsFor, parentsOf } from "@/lib/store";

function status(inv: Investigation | undefined): { text: string; cls: string } {
  if (!inv || inv.messages.length === 0) return { text: "Not started", cls: "neutral" };
  if (inv.log.review) return { text: "Feedback ready", cls: "good" };
  if (inv.log.submittedAt) return { text: "Submitted", cls: "good" };
  return { text: "In progress", cls: "warn" };
}

function ObjectRow({ user, objectId, due }: { user: User; objectId: string; due?: string }) {
  const obj = getObject(objectId);
  if (!obj) return null;
  const inv = findInvestigation(user.id, objectId);
  const used = inv ? questionsUsed(inv) : 0;
  const s = status(inv);
  return (
    <div className="tile spread">
      <ObjectPicture obj={obj} size="thumb" />
      <div className="stack" style={{ gap: 4, flex: "1 1 260px" }}>
        <div className="row">
          <strong style={{ fontFamily: "var(--serif)", fontSize: 21 }}>{obj.code}</strong>
          <span className={`pill ${s.cls}`}>{s.text}</span>
        </div>
        <span className="small muted">{obj.brief}</span>
        {due && <span className="small muted">Due {new Date(due).toLocaleDateString()}</span>}
      </div>
      <div className="stack" style={{ alignItems: "flex-end", gap: 4 }}>
        <Dots used={used} />
        <span className="small muted">{used} of {MAX_QUESTIONS} questions</span>
      </div>
      <div className="row">
        <Link className="btn" href={`/student/investigate/${obj.id}`}>{inv && inv.messages.length ? "Continue" : "Start"}</Link>
        {inv?.log.submittedAt && <Link className="btn ghost" href={`/student/log/${obj.id}`}>View log</Link>}
      </div>
    </div>
  );
}

export default function StudentHome() {
  return (
    <RoleGate role="student">
      {(user) => {
        const classes = classesForStudent(user.id);
        const assigned = classes.flatMap((c) => c.assignments.map((a) => ({ ...a, className: c.name })));
        const assignedIds = new Set(assigned.map((a) => a.objectId));
        const explore = OBJECTS.filter((o) => !o.practice && !assignedIds.has(o.id));
        const practice = OBJECTS.filter((o) => o.practice);
        const done = getDb().walkthroughDone.includes(user.id);
        const mine = investigationsFor(user.id);
        const submitted = mine.filter((i) => i.log.submittedAt).sort((a, b) => (a.log.submittedAt! < b.log.submittedAt! ? -1 : 1));
        const latest = submitted[submitted.length - 1];
        const suggestions = latest ? logFeedback(latest.log, submitted.slice(0, -1).map((i) => i.log), 0).filter((f) => f.tone !== "better").slice(0, 3) : [];
        const reviews = mine.filter((i) => i.log.review?.feedback);
        const parents = parentsOf(user.id);

        return (
          <main className="page">
            <div className="grid cols-main-side">
              <section className="card">
                <span className="eyebrow">Welcome back, {user.name}</span>
                <h1 style={{ fontSize: 36 }}>Your investigations</h1>
                {!done && (
                  <div className="banner">
                    <span style={{ flex: 1 }}>New here? The walkthrough shows you how to ask good questions.</span>
                    <Link className="btn small" href="/student/walkthrough">Start walkthrough</Link>
                  </div>
                )}
                {assigned.length > 0 && <h2 style={{ fontSize: 22 }}>From your teacher</h2>}
                {assigned.map((a) => <ObjectRow key={a.objectId} user={user} objectId={a.objectId} due={a.due} />)}
                <h2 style={{ fontSize: 22 }}>{assigned.length ? "Explore more" : "Objects to investigate"}</h2>
                {explore.map((o) => <ObjectRow key={o.id} user={user} objectId={o.id} />)}
                <h2 style={{ fontSize: 22 }}>Practice</h2>
                {practice.map((o) => <ObjectRow key={o.id} user={user} objectId={o.id} />)}
                {classes.length === 0 && (
                  <p className="small muted">
                    Got a class code from a teacher? Add it on your <Link href="/student/account">account page</Link>.
                  </p>
                )}
              </section>

              <aside className="stack" style={{ gap: 20 }}>
                <div className="card">
                  <h2 style={{ fontSize: 22 }}>Suggestions for next time</h2>
                  {suggestions.length ? (
                    <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                      {suggestions.map((s) => <li key={s.text}>{s.text}</li>)}
                    </ul>
                  ) : (
                    <p className="small muted">Submit an Interpretation Log to get suggestions.</p>
                  )}
                </div>
                {reviews.length > 0 && (
                  <div className="card">
                    <h2 style={{ fontSize: 22 }}>From your teacher</h2>
                    {reviews.map((i) => (
                      <div key={i.id} className="stack" style={{ gap: 4 }}>
                        <p>“{i.log.review!.feedback}”</p>
                        <span className="small muted">on {getObject(i.objectId)?.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="card">
                  <h2 style={{ fontSize: 22 }}>Notes with {parents.length ? parents.map((p) => p.name).join(" & ") : "your parent"}</h2>
                  {parents.length ? (
                    <NotesThread student={user} me={user} />
                  ) : (
                    <p className="small muted">
                      To share notes with a parent, give them your family link from your <Link href="/student/account">account page</Link>.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </main>
        );
      }}
    </RoleGate>
  );
}
