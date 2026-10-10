"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/ui";
import { DEMO_PARENT, DEMO_TEACHER, seedDemo, type DemoInfo } from "@/lib/demo";
import { logInStudent, logInWithPassword, resetAll } from "@/lib/store";

export default function Demo() {
  const router = useRouter();
  const [info, setInfo] = useState<DemoInfo | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setInfo(await seedDemo());
    setBusy(false);
  }

  return (
    <>
      <TopBar user={null} />
      <main className="page">
        <div className="card" style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          <span className="eyebrow">Demo class</span>
          <h1 style={{ fontSize: 34 }}>Try every account</h1>
          <p>
            This adds a sample class to this browser: a teacher, three students (one with a flagged log) and a parent linked to Maya, with notes between them.
          </p>
          {!info ? (
            <button className="btn" onClick={load} disabled={busy} style={{ alignSelf: "flex-start" }}>
              {busy ? "Setting up…" : "Set up the demo class"}
            </button>
          ) : (
            <div className="stack">
              <div className="tile spread">
                <span><strong>Teacher</strong> · {DEMO_TEACHER.email} / {DEMO_TEACHER.password}</span>
                <button className="btn small" onClick={async () => { await logInWithPassword(DEMO_TEACHER.email, DEMO_TEACHER.password); router.push("/teacher"); }}>Log in as teacher</button>
              </div>
              {info.students.map((s) => (
                <div key={s.code} className="tile spread">
                  <span><strong>{s.name}</strong> · login code {s.code}</span>
                  <button className="btn small" onClick={() => { logInStudent(s.code); router.push("/student"); }}>Log in as {s.name}</button>
                </div>
              ))}
              <div className="tile spread">
                <span><strong>Parent of Maya</strong> · {DEMO_PARENT.email} / {DEMO_PARENT.password}</span>
                <button className="btn small" onClick={async () => { await logInWithPassword(DEMO_PARENT.email, DEMO_PARENT.password); router.push("/parent"); }}>Log in as parent</button>
              </div>
              <p className="small muted">Class code for new students: {info.classCode}</p>
            </div>
          )}
          <hr style={{ border: 0, borderTop: "1px solid var(--line)", width: "100%" }} />
          <button
            className="btn ghost small"
            style={{ alignSelf: "flex-start" }}
            onClick={() => {
              if (confirm("Delete every account and investigation saved in this browser?")) {
                resetAll();
                setInfo(null);
              }
            }}
          >
            Clear all data in this browser
          </button>
        </div>
      </main>
    </>
  );
}
