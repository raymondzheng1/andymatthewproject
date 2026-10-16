"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/ui";
import { GuestButton } from "@/components/guest";
import { AccountError, logInStudent, logInWithPassword } from "@/lib/store";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"student" | "adult">("student");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const user = mode === "student" ? logInStudent(code) : await logInWithPassword(email, password);
      router.push(`/${user.role}`);
    } catch (err) {
      setError(err instanceof AccountError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <TopBar user={null} />
      <main className="page">
        <form className="card" onSubmit={submit} style={{ maxWidth: 460, margin: "24px auto", width: "100%" }}>
          <h1 style={{ fontSize: 32 }}>Log in</h1>
          <div className="row" role="tablist" aria-label="Account type">
            <button type="button" role="tab" aria-selected={mode === "student"} className={`btn small ${mode === "student" ? "" : "ghost"}`} onClick={() => setMode("student")}>
              Student
            </button>
            <button type="button" role="tab" aria-selected={mode === "adult"} className={`btn small ${mode === "adult" ? "" : "ghost"}`} onClick={() => setMode("adult")}>
              Teacher or parent
            </button>
          </div>
          {mode === "student" ? (
            <div className="field">
              <label htmlFor="code">Your login code</label>
              <input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. KILN-OCHRE-4821" autoCapitalize="characters" />
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="pw">Password</label>
                <input id="pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
            </>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn">Log in</button>
          <GuestButton />
          <p className="small muted">
            New here? <Link href="/#signup">Create an account</Link>. Accounts are saved in this browser for now, so log in on the same device you signed up on.
          </p>
        </form>
      </main>
    </>
  );
}
