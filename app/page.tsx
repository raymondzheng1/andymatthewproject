"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, TopBar, useApp } from "@/components/ui";
import { GuestButton } from "@/components/guest";
import { AccountError, currentUser, signUpStudent, signUpWithPassword } from "@/lib/store";
import type { Role } from "@/lib/schema";

const ROLES: { role: Role; title: string; hint: string }[] = [
  { role: "student", title: "Student", hint: "No email needed" },
  { role: "teacher", title: "Teacher", hint: "Set tasks, review reasoning" },
  { role: "parent", title: "Parent", hint: "Follow your child" },
];

function SignUp() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    setBusy(true);
    try {
      if (role === "student") {
        signUpStudent(name, classCode || undefined);
        router.push("/welcome");
      } else {
        await signUpWithPassword(role, name, email, password);
        router.push(role === "teacher" ? "/teacher" : "/parent");
      }
    } catch (err) {
      setError(err instanceof AccountError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form id="signup" className="card" onSubmit={submit} style={{ width: "100%", maxWidth: 480 }}>
      <div className="stack" style={{ gap: 4 }}>
        <h2 style={{ fontSize: 30 }}>Create your account</h2>
        <span className="small muted">
          Already have one? <Link href="/login">Log in</Link>
        </span>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>I am a…</legend>
        <div className="role-pick">
          {ROLES.map((r) => (
            <label key={r.role} className="tile" style={{ cursor: "pointer", padding: "10px 12px", border: role === r.role ? "2px solid var(--terra)" : undefined }}>
              <span className="row" style={{ gap: 6, fontWeight: 700 }}>
                <input type="radio" name="role" checked={role === r.role} onChange={() => setRole(r.role)} style={{ accentColor: "var(--terra)" }} />
                {r.title}
              </span>
              <span className="small muted">{r.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="su-name">{role === "student" ? "Your first name" : "Full name"}</label>
        <input id="su-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>
      {role === "student" ? (
        <div className="field">
          <label htmlFor="su-class">Class code <span className="muted">(optional)</span></label>
          <input id="su-class" className="input" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="e.g. KILN-482" />
          <span className="small muted">No class? You can still explore objects on your own. You&apos;ll get a login code to sign back in with.</span>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="su-email">Email</label>
            <input id="su-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="su-pw">Password</label>
            <input id="su-pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" required />
          </div>
          {role === "parent" && <span className="small muted">After signing up, add your child with the family link from their account page.</span>}
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={busy} style={{ minHeight: 50, fontSize: 16 }}>
        Create {role} account
      </button>
      <GuestButton />
    </form>
  );
}

export default function Home() {
  const ready = useApp();
  const user = ready ? currentUser() : null;
  return (
    <>
      <TopBar user={user} />
      <main>
        <section className="page" style={{ paddingTop: 48, paddingBottom: 64 }}>
          <div className="grid cols-hero">
            <div className="stack" style={{ gap: 22 }}>
              <span className="eyebrow" style={{ color: "var(--sage)" }}>For history &amp; archaeology classrooms</span>
              <h1 className="dark-title" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>Work out the past for yourself.</h1>
              <p style={{ fontSize: 19, color: "#ede5d6", maxWidth: 560 }}>
                Students investigate ancient objects by asking questions and following sources. The answer is never handed over, so the reasoning is all theirs.
              </p>
              <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, color: "#ede5d6" }}>
                <li><strong style={{ color: "var(--paper)" }}>Never gives the answer away.</strong> It points to sources instead.</li>
                <li><strong style={{ color: "var(--paper)" }}>Every answer is labeled and sourced.</strong></li>
                <li><strong style={{ color: "var(--paper)" }}>Teachers and parents see how students think,</strong> not just what they conclude.</li>
              </ul>
              {user && (
                <Link className="btn" href={`/${user.role}`} style={{ alignSelf: "flex-start" }}>
                  Go to my {user.role} page
                </Link>
              )}
            </div>
            <SignUp />
          </div>
        </section>

        <section style={{ background: "var(--paper)" }}>
          <div className="page" style={{ paddingTop: 56, paddingBottom: 56, gap: 28 }}>
            <div className="spread">
              <div className="stack" style={{ gap: 6 }}>
                <span className="eyebrow">How it works</span>
                <h2 style={{ fontSize: 40 }}>Reasoning first, answers never</h2>
              </div>
              <Link className="btn ghost" href="/demo">Try the demo class</Link>
            </div>
            <div className="grid cols-3">
              {[
                ["Ask up to 7 questions", "Students question the evidence about one object. A walkthrough and practice round teach them to ask focused questions instead of guessing."],
                ["Log the reasoning", "The Interpretation Log records their thinking on material, location, time period and overall reasoning, each linked to a source."],
                ["Get feedback", "Students get suggestions and see how this investigation compares with their past ones."],
              ].map(([t, d], i) => (
                <div key={t} className="tile stack" style={{ padding: 22 }}>
                  <span className="eyebrow">Step {i + 1}</span>
                  <h3 style={{ fontSize: 24 }}>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 26 }}>Every answer comes labeled</h3>
            <div className="grid cols-4">
              <div className="tile stack"><Chip label="fact" /><p className="small">Directly observable or measured: material, size, weight, colour.</p></div>
              <div className="tile stack"><Chip label="record" /><p className="small">Documented in texts, inscriptions or excavation records.</p></div>
              <div className="tile stack"><Chip label="inference" /><p className="small">Archaeologists&apos; best interpretation from indirect evidence. Not certain.</p></div>
              <div className="tile stack"><Chip label="cultural" /><p className="small">Meaning given by a specific culture or tradition. Can vary by source.</p></div>
            </div>
          </div>
        </section>

        <section className="page" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="grid cols-3">
            <div className="card">
              <h2>For students</h2>
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Sign up with just your name, with or without a class</li>
                <li>Start with a walkthrough and a no-pressure practice object</li>
                <li>A dictionary under every answer</li>
                <li>Personal suggestions for next time</li>
              </ul>
            </div>
            <div className="card">
              <h2>For teachers</h2>
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Create classes and assign objects</li>
                <li>Review chats and Interpretation Logs</li>
                <li>See what the class does well and where it needs work</li>
                <li>Get teaching ideas for the next lesson</li>
              </ul>
            </div>
            <div className="card">
              <h2>For parents</h2>
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Link to your child with their family link</li>
                <li>See their progress and read their chats</li>
                <li>Read the teacher&apos;s feedback</li>
                <li>Send notes back and forth with your child</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
