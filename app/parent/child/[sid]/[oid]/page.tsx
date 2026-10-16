"use client";

import Link from "next/link";
import { use } from "react";
import { ChatView } from "@/components/chat";
import { ObjectPicture, RoleGate } from "@/components/ui";
import { getObject } from "@/lib/objects";
import { LOG_SECTIONS, SECTION_TEXT } from "@/lib/schema";
import { childrenOf, findInvestigation } from "@/lib/store";

export default function Page({ params }: { params: Promise<{ sid: string; oid: string }> }) {
  const { sid, oid } = use(params);
  return (
    <RoleGate role="parent">
      {(parent) => {
        const child = childrenOf(parent.id).find((c) => c.id === sid);
        const obj = getObject(oid);
        const inv = child && obj ? findInvestigation(child.id, obj.id) : undefined;
        if (!child || !obj || !inv) return <main className="page"><div className="card"><h1>Not found</h1><Link href="/parent">Back</Link></div></main>;
        return (
          <main className="page">
            <Link href="/parent" style={{ color: "var(--paper)" }}>← Back to {child.name}&apos;s progress</Link>
            <div className="grid cols-2">
              <section className="card">
                <span className="row"><ObjectPicture obj={obj} size="thumb" /><span className="eyebrow">{obj.code}</span></span>
                <h1 style={{ fontSize: 28 }}>{child.name}&apos;s conversation</h1>
                <p className="small muted">Read-only. Questions that ask what the object is are turned down, and count toward the 7.</p>
                <div className="chat"><ChatView messages={inv.messages} obj={obj} /></div>
              </section>
              <section className="card">
                <h2 style={{ fontSize: 26 }}>Interpretation Log</h2>
                {!inv.log.submittedAt && <p className="small muted">Not submitted yet. This is the current draft.</p>}
                {LOG_SECTIONS.map((s) => (
                  <div key={s} className="tile">
                    <strong>{SECTION_TEXT[s]}</strong>
                    <p>{inv.log[s] || <span className="muted">Empty</span>}</p>
                  </div>
                ))}
                {inv.log.review?.feedback && (
                  <div className="banner ok"><span><strong>Teacher:</strong> “{inv.log.review.feedback}”</span></div>
                )}
              </section>
            </div>
          </main>
        );
      }}
    </RoleGate>
  );
}
