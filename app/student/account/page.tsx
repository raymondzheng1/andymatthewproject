"use client";

import { useState } from "react";
import { RoleGate } from "@/components/ui";
import { AccountError, classesForStudent, joinClass, parentsOf } from "@/lib/store";
import type { User } from "@/lib/schema";

function JoinClass({ user }: { user: User }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const cls = joinClass(user.id, code);
          setMsg({ ok: true, text: `You've joined ${cls.name}.` });
          setCode("");
        } catch (err) {
          setMsg({ ok: false, text: err instanceof AccountError ? err.message : "Couldn't join that class." });
        }
      }}
    >
      <label htmlFor="join" className="label">Join a class</label>
      <div className="row">
        <input id="join" className="input" style={{ flex: 1, minWidth: 180 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Class code from your teacher" />
        <button className="btn" disabled={!code.trim()}>Join</button>
      </div>
      {msg && <p className={msg.ok ? "banner ok" : "error"} role="status">{msg.text}</p>}
    </form>
  );
}

export default function Account() {
  return (
    <RoleGate role="student">
      {(user) => {
        const link = typeof window !== "undefined" ? `${window.location.origin}/parent?link=${user.parentLinkCode}` : "";
        const parents = parentsOf(user.id);
        return (
          <main className="page">
            <div className="grid cols-2">
              <section className="card">
                <h1 style={{ fontSize: 30 }}>Your account</h1>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="label">Your login code</span>
                  <span className="code">{user.loginCode}</span>
                  <span className="small muted">Type this on the log-in page to get back into your account. Keep it private.</span>
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="label">Your classes</span>
                  {classesForStudent(user.id).map((c) => <span key={c.id}>{c.name}</span>)}
                  {classesForStudent(user.id).length === 0 && <span className="muted">None yet. You can still explore objects on your own.</span>}
                </div>
                <JoinClass user={user} />
              </section>
              <section className="card">
                <h2 style={{ fontSize: 26 }}>Family link</h2>
                <p>Give this to your parent. When they add it to their account, they can see your progress and chats, and you can send each other notes.</p>
                <span className="code">{user.parentLinkCode}</span>
                <div className="field">
                  <label htmlFor="link">Or share this link</label>
                  <input id="link" className="input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                </div>
                <span className="label">Linked parents</span>
                {parents.length ? parents.map((p) => <span key={p.id}>{p.name}</span>) : <span className="muted">No one yet.</span>}
              </section>
            </div>
          </main>
        );
      }}
    </RoleGate>
  );
}
