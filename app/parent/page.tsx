"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { NotesThread } from "@/components/notes";
import { Dots, RoleGate, Strength } from "@/components/ui";
import { questionsUsed, sectionStrength } from "@/lib/insights";
import { getObject } from "@/lib/objects";
import { LOG_SECTIONS, SECTION_TEXT } from "@/lib/schema";
import type { User } from "@/lib/schema";
import { AccountError, childrenOf, classesForStudent, investigationsFor, linkChild } from "@/lib/store";

function AddChild({ parent, initial, onAdded }: { parent: User; initial: string; onAdded: (id: string) => void }) {
  const [code, setCode] = useState(initial);
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        try {
          onAdded(linkChild(parent.id, code).id);
          setCode("");
        } catch (err) {
          setError(err instanceof AccountError ? err.message : "Couldn't add that child.");
        }
      }}
    >
      <label htmlFor="link" className="label">Add your child</label>
      <span className="small muted">Paste the family link or code from your child&apos;s account page (it looks like FAMILY-123456).</span>
      <div className="row">
        <input id="link" className="input" style={{ flex: 1, minWidth: 220 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="FAMILY-123456 or the full link" />
        <button className="btn" disabled={!code.trim()}>Add child</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

function ChildView({ parent, child }: { parent: User; child: User }) {
  const invs = investigationsFor(child.id).filter((i) => i.messages.length > 0);
  const submitted = invs.filter((i) => i.log.submittedAt).sort((a, b) => (a.log.submittedAt! < b.log.submittedAt! ? -1 : 1)).slice(-3);
  const reviews = invs.filter((i) => i.log.review?.feedback);
  const classes = classesForStudent(child.id);
  return (
    <div className="grid cols-main-side">
      <section className="card">
        <span className="eyebrow">{classes.length ? classes.map((c) => c.name).join(", ") : "Not in a class"}</span>
        <h1 style={{ fontSize: 34 }}>{child.name}&apos;s progress</h1>
        {invs.length === 0 && <p className="muted">{child.name} hasn&apos;t started an investigation yet.</p>}
        <div className="grid cols-3" style={{ gap: 14 }}>
          {invs.map((inv) => {
            const obj = getObject(inv.objectId);
            return (
              <div key={inv.id} className="tile stack" style={{ gap: 6 }}>
                <strong style={{ fontFamily: "var(--serif)", fontSize: 20 }}>{obj?.code}</strong>
                <span className="row small"><Dots used={questionsUsed(inv)} /> {questionsUsed(inv)}/7</span>
                <span className="small muted">{inv.log.review ? "Teacher replied" : inv.log.submittedAt ? "Log submitted" : "In progress"}</span>
                <Link href={`/parent/child/${child.id}/${inv.objectId}`} className="small">Read the chat and log</Link>
              </div>
            );
          })}
        </div>
        {submitted.length > 0 && (
          <>
            <h2 style={{ fontSize: 22 }}>How their reasoning is growing</h2>
            <div className="table-wrap tile" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr><th>Interpretation Log</th>{submitted.map((i) => <th key={i.id}>{getObject(i.objectId)?.code}</th>)}</tr>
                </thead>
                <tbody>
                  {LOG_SECTIONS.map((s) => (
                    <tr key={s}>
                      <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--ink)" }}>{SECTION_TEXT[s]}</th>
                      {submitted.map((i) => <td key={i.id}><Strength value={sectionStrength(i.log, s)} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">Strong = written and linked to a source. Developing = written but no source. Not yet = left blank.</p>
          </>
        )}
      </section>
      <aside className="stack" style={{ gap: 20 }}>
        <div className="card">
          <h2 style={{ fontSize: 22 }}>Teacher&apos;s recommendations</h2>
          {reviews.length === 0 && <p className="small muted">No feedback from the teacher yet.</p>}
          {reviews.map((i) => (
            <div key={i.id} className="stack" style={{ gap: 4 }}>
              <p>“{i.log.review!.feedback}”</p>
              <span className="small muted">on {getObject(i.objectId)?.code}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 style={{ fontSize: 22 }}>Notes with {child.name}</h2>
          <NotesThread student={child} me={parent} />
        </div>
      </aside>
    </div>
  );
}

function ParentHome({ parent }: { parent: User }) {
  const params = useSearchParams();
  const children = childrenOf(parent.id);
  const [selected, setSelected] = useState<string | null>(null);
  const child = children.find((c) => c.id === selected) ?? children[0];
  return (
    <main className="page">
      <div className="card" style={{ gap: 12 }}>
        {children.length > 0 && (
          <div className="row">
            <label htmlFor="kid" className="label">Child</label>
            <select id="kid" className="select" style={{ width: 240 }} value={child?.id} onChange={(e) => setSelected(e.target.value)}>
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Link href="/parent/guide" className="small">How the conversations and log work</Link>
          </div>
        )}
        <AddChild parent={parent} initial={params.get("link") ?? ""} onAdded={setSelected} />
      </div>
      {child && <ChildView parent={parent} child={child} />}
    </main>
  );
}

export default function Page() {
  return (
    <RoleGate role="parent">
      {(user) => (
        <Suspense fallback={null}>
          <ParentHome parent={user} />
        </Suspense>
      )}
    </RoleGate>
  );
}
