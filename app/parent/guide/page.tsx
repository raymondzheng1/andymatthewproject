"use client";

import { Chip, RoleGate } from "@/components/ui";

export default function Guide() {
  return (
    <RoleGate role="parent">
      {() => (
        <main className="page">
          <div className="stack" style={{ maxWidth: 820 }}>
            <span className="eyebrow" style={{ color: "var(--sage)" }}>Parent guide</span>
            <h1 className="dark-title" style={{ fontSize: 44 }}>How the investigations work</h1>
            <p style={{ fontSize: 18, color: "#ede5d6" }}>
              Your child is given an ancient object and has to work out what it is themselves. They have two tools: a conversation that points them to evidence, and an Interpretation Log where they write their own reasoning.
            </p>
          </div>
          <div className="grid cols-2">
            <section className="card">
              <h2 style={{ fontSize: 28 }}>The conversations</h2>
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                <li><strong>Up to 7 questions per object.</strong> This teaches them to ask focused questions rather than guess.</li>
                <li><strong>It never says what the object is.</strong> If they ask “is it a tool or a weapon?”, it points them to a source instead. That question still uses one of the 7.</li>
                <li><strong>Every answer is labeled and sourced,</strong> so they learn the difference between:</li>
              </ul>
              <div className="row"><Chip label="fact" /><Chip label="record" /><Chip label="inference" /><Chip label="cultural" /></div>
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                <li><strong>A dictionary under every answer.</strong> Hard words are explained, and they rewrite them in their own words.</li>
                <li><strong>You can read every conversation</strong> from your dashboard.</li>
              </ul>
            </section>
            <section className="card">
              <h2 style={{ fontSize: 28 }}>The Interpretation Log</h2>
              <p>After asking questions, your child writes what they think in four parts, linking each claim to a source: material, location, time period and reasoning.</p>
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
                <li><strong>It must be in their own words.</strong> If the log copies the conversation too closely, it is flagged for the teacher.</li>
                <li><strong>They get feedback</strong> compared with their past logs, so you can see progress over time.</li>
                <li><strong>The teacher reviews it,</strong> and their recommendations appear on your dashboard.</li>
              </ul>
            </section>
          </div>
          <section className="card" style={{ background: "rgba(33,26,22,0.9)", color: "var(--paper)" }}>
            <h2 style={{ fontSize: 28 }}>How you can help at home</h2>
            <div className="grid cols-3">
              <div><strong>Ask “how do you know?”</strong><p style={{ color: "var(--on-dark)" }}>Asking what evidence they used helps more than asking what the object is.</p></div>
              <div><strong>Don&apos;t give the answer</strong><p style={{ color: "var(--on-dark)" }}>Even if you recognise the object, let them work it out from the sources.</p></div>
              <div><strong>Use the notes</strong><p style={{ color: "var(--on-dark)" }}>Send a note. Your child can reply, for example if they&apos;re too busy and you need to make a plan together.</p></div>
            </div>
          </section>
        </main>
      )}
    </RoleGate>
  );
}
