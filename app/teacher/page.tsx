"use client";

import Link from "next/link";
import { useState } from "react";
import { Dots, RoleGate } from "@/components/ui";
import { analyseClass, questionsUsed } from "@/lib/insights";
import { OBJECTS, getObject } from "@/lib/objects";
import type { ClassRoom, User } from "@/lib/schema";
import { assignObject, classesForTeacher, createClass, getDb, getUser, findInvestigation } from "@/lib/store";

function CreateClass({ teacher, onCreated }: { teacher: User; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreated(createClass(teacher.id, name).id);
        setName("");
      }}
    >
      <label htmlFor="cls-name" className="sr-only">New class name</label>
      <input id="cls-name" className="input" style={{ flex: 1, minWidth: 200 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="New class name, e.g. Year 9 History" />
      <button className="btn" disabled={!name.trim()}>Create class</button>
    </form>
  );
}

function Assign({ cls }: { cls: ClassRoom }) {
  const options = OBJECTS.filter((o) => !cls.assignments.some((a) => a.objectId === o.id));
  const [objectId, setObjectId] = useState(options[0]?.id ?? "");
  const [due, setDue] = useState("");
  if (options.length === 0) return <p className="small muted">Every object is assigned.</p>;
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        if (objectId) assignObject(cls.id, objectId, due ? new Date(due).toISOString() : undefined);
      }}
    >
      <label htmlFor="assign-obj" className="sr-only">Object</label>
      <select id="assign-obj" className="select" style={{ flex: 1, minWidth: 220 }} value={objectId} onChange={(e) => setObjectId(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.code} — {o.identity} (hidden from students)</option>
        ))}
      </select>
      <label htmlFor="assign-due" className="sr-only">Due date</label>
      <input id="assign-due" type="date" className="input" style={{ width: 170 }} value={due} onChange={(e) => setDue(e.target.value)} />
      <button className="btn">Assign</button>
    </form>
  );
}

function ClassView({ cls }: { cls: ClassRoom }) {
  const db = getDb();
  const analysis = analyseClass(cls, db.investigations);
  const rows = cls.studentIds.flatMap((sid) =>
    cls.assignments.map((a) => ({ student: getUser(sid), objectId: a.objectId, inv: findInvestigation(sid, a.objectId) })),
  );
  const flagged = rows.filter((r) => r.inv?.log.flag && r.inv.log.submittedAt && !r.inv.log.review);
  const sharedNotes = db.notes.filter((n) => n.shareWithTeacher && cls.studentIds.includes(n.studentId));

  return (
    <>
      <div className="spread">
        <h1 className="dark-title" style={{ fontSize: 34 }}>{cls.name}</h1>
        <div className="row" style={{ color: "var(--paper)" }}>
          <span>Class code</span>
          <span className="code" style={{ fontSize: 18, padding: "6px 10px", color: "var(--ink)" }}>{cls.code}</span>
        </div>
      </div>
      <div className="grid cols-4">
        {[
          [String(cls.studentIds.length), "Students"],
          [String(analysis.logsSubmitted), "Logs submitted"],
          [String(analysis.flagged), "Logs flagged"],
          [`${analysis.avgQuestions}`, "Avg questions used"],
        ].map(([n, t]) => (
          <div key={t} className="card" style={{ padding: 18, gap: 2 }}>
            <strong style={{ fontFamily: "var(--serif)", fontSize: 30 }}>{n}</strong>
            <span className="muted">{t}</span>
          </div>
        ))}
      </div>
      <div className="grid cols-main-side">
        <div className="stack" style={{ gap: 20 }}>
          {flagged.length > 0 && (
            <div className="banner">
              <span style={{ flex: 1 }}>
                <strong>{flagged.length} log{flagged.length === 1 ? "" : "s"} flagged.</strong> Written reasoning closely mirrors the chat.
              </span>
              <Link className="btn small" href={`/teacher/review/${flagged[0]!.inv!.id}`}>Review</Link>
            </div>
          )}
          <section className="card">
            <h2 style={{ fontSize: 22 }}>Students</h2>
            {cls.studentIds.length === 0 && <p className="muted">No students yet. Share the class code <strong>{cls.code}</strong> so students can join.</p>}
            {cls.assignments.length === 0 && cls.studentIds.length > 0 && <p className="muted">Assign an object below to start.</p>}
            {rows.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Object</th><th>Questions</th><th>Log</th><th>Originality</th><th><span className="sr-only">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {rows.map(({ student, objectId, inv }) => (
                      <tr key={`${student?.id}-${objectId}`} style={inv?.log.flag && !inv.log.review ? { background: "#fbefea" } : undefined}>
                        <td style={{ fontWeight: 600 }}>{student?.name}</td>
                        <td>{getObject(objectId)?.code}</td>
                        <td><span className="row" style={{ gap: 6 }}><Dots used={inv ? questionsUsed(inv) : 0} /><span className="small muted">{inv ? questionsUsed(inv) : 0}/7</span></span></td>
                        <td>
                          {inv?.log.review ? <span className="pill good">Reviewed</span> : inv?.log.submittedAt ? <span className="pill good">Submitted</span> : inv?.messages.length ? <span className="pill warn">In progress</span> : <span className="pill neutral">Not started</span>}
                        </td>
                        <td>{inv?.log.flag ? <span className="pill bad">Flagged</span> : <span className="muted">—</span>}</td>
                        <td style={{ textAlign: "right" }}>{inv ? <Link href={`/teacher/review/${inv.id}`}>{inv.log.submittedAt ? "Review" : "View chat"}</Link> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <h3 style={{ fontSize: 18 }}>Assign an object</h3>
            <Assign cls={cls} />
          </section>
          {sharedNotes.length > 0 && (
            <section className="card">
              <h2 style={{ fontSize: 22 }}>Notes from parents</h2>
              {sharedNotes.map((n) => (
                <div key={n.id} className="tile small">
                  <p>{n.text}</p>
                  <span className="muted">{getUser(n.authorId)?.name} about {getUser(n.studentId)?.name}</span>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="card">
          <h2 style={{ fontSize: 24 }}>Class analysis</h2>
          <span className="small muted">From {analysis.logsSubmitted} logs and {analysis.conversations} conversations</span>
          <span className="eyebrow" style={{ color: "var(--fact-fg)" }}>Doing well</span>
          {analysis.doingWell.length === 0 && <p className="small muted">Not enough work submitted yet.</p>}
          {analysis.doingWell.map((x) => (
            <div key={x.title} className="tile"><strong>{x.title}</strong><p className="small muted">{x.detail}</p></div>
          ))}
          <span className="eyebrow" style={{ color: "var(--terra-dk)" }}>Needs work</span>
          {analysis.needsWork.length === 0 && <p className="small muted">Nothing stands out yet.</p>}
          {analysis.needsWork.map((x) => (
            <div key={x.title} className="tile"><strong>{x.title}</strong><p className="small muted">{x.detail}</p></div>
          ))}
          <Link className="btn" href={`/teacher/ideas?class=${cls.id}`}>Get teaching ideas</Link>
        </aside>
      </div>
    </>
  );
}

function Dashboard({ teacher }: { teacher: User }) {
  const classes = classesForTeacher(teacher.id);
  const [selected, setSelected] = useState<string | null>(null);
  const cls = classes.find((c) => c.id === selected) ?? classes[0];
  return (
    <main className="page">
      <div className="card" style={{ gap: 10 }}>
        <div className="spread">
          <div className="row">
            <label htmlFor="pick" className="label">Class</label>
            {classes.length > 0 ? (
              <select id="pick" className="select" style={{ width: 260 }} value={cls?.id} onChange={(e) => setSelected(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <span className="muted">You have no classes yet.</span>
            )}
          </div>
        </div>
        <CreateClass teacher={teacher} onCreated={setSelected} />
      </div>
      {cls && <ClassView cls={cls} />}
    </main>
  );
}

export default function TeacherPage() {
  return <RoleGate role="teacher">{(user) => <Dashboard teacher={user} />}</RoleGate>;
}
