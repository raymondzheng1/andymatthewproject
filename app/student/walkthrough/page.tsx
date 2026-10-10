"use client";

import Link from "next/link";
import { RoleGate } from "@/components/ui";
import { markWalkthroughDone } from "@/lib/store";

const EXAMPLES: [string, string][] = [
  ["Is it a spoon?", "What wear or marks are on the edges?"],
  ["What is this thing?", "Which layer was it found in, and what was next to it?"],
  ["So is it a tool or a weapon?", "What does the excavation record say about the site?"],
];

export default function Walkthrough() {
  return (
    <RoleGate role="student">
      {(user) => (
        <main className="page">
          <div className="card" style={{ gap: 22 }}>
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Before your first object</span>
              <h1 style={{ fontSize: 38 }}>Learn to ask like an archaeologist</h1>
            </div>
            <div className="grid cols-2" style={{ gap: 32 }}>
              <div className="stack">
                <h2 style={{ fontSize: 24 }}>How it works</h2>
                <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
                  <li>You get an object and its sources. You don&apos;t know what it is.</li>
                  <li>You have <strong>7 questions</strong>. Questions that ask what the object is are turned down, and they still use one of your 7.</li>
                  <li>Every answer is labeled: fact, historical record, scholarly inference or cultural interpretation, and tells you which source it came from.</li>
                  <li>Hard words are explained in a dictionary under each answer. Rewrite them in your own words.</li>
                  <li>Then you write your Interpretation Log: material, location, time period and reasoning, in your own words.</li>
                </ol>
              </div>
              <div className="stack">
                <h2 style={{ fontSize: 24 }}>Make every question count</h2>
                {EXAMPLES.map(([weak, strong]) => (
                  <div key={weak} className="grid cols-2" style={{ gap: 10 }}>
                    <div className="tile" style={{ background: "#f6e6e0" }}>
                      <span className="eyebrow" style={{ color: "var(--terra-dk)" }}>Guessing</span>
                      <p>“{weak}”</p>
                    </div>
                    <div className="tile" style={{ background: "#e0eae3" }}>
                      <span className="eyebrow" style={{ color: "var(--sage-dk)" }}>Investigating</span>
                      <p>“{strong}”</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
              <span className="muted">Next: a practice object with no marks and no pressure.</span>
              <Link className="btn" href="/student/investigate/p-001" onClick={() => markWalkthroughDone(user.id)}>
                Start practice round
              </Link>
            </div>
          </div>
        </main>
      )}
    </RoleGate>
  );
}
