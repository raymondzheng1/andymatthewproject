"use client";

import Link from "next/link";
import { RoleGate } from "@/components/ui";
import { classesForStudent } from "@/lib/store";

/** Shown once after a student signs up: their login code is the only way back in. */
export default function Welcome() {
  return (
    <RoleGate role="student">
      {(user) => {
        const classes = classesForStudent(user.id);
        return (
          <main className="page">
            <div className="card" style={{ maxWidth: 620, margin: "0 auto" }}>
              <span className="eyebrow">Welcome, {user.name}</span>
              <h1 style={{ fontSize: 36 }}>Here is your login code</h1>
              <p>You&apos;ll type this code to get back into your account. Write it down or take a photo of it now.</p>
              <span className="code" aria-label="Your login code">{user.loginCode}</span>
              {classes.length > 0 ? (
                <p className="banner ok">You&apos;ve joined {classes.map((c) => c.name).join(", ")}.</p>
              ) : (
                <p className="muted">You&apos;re not in a class yet. You can still explore objects, and join a class later from your account page.</p>
              )}
              <Link className="btn" href="/student/walkthrough" style={{ alignSelf: "flex-start" }}>
                Start the walkthrough
              </Link>
            </div>
          </main>
        );
      }}
    </RoleGate>
  );
}
