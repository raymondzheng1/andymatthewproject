"use client";

import { useState } from "react";
import { Chip } from "./ui";
import type { ObjectCase } from "@/lib/objects";
import { sourceTitle } from "@/lib/objects";
import type { ChatMessage, DictionaryEntry, GuideMessage, User } from "@/lib/schema";
import { addWord, wordsFor } from "@/lib/store";

function Dictionary({ entries, student, msgKey }: { entries: DictionaryEntry[]; student?: User; msgKey: string }) {
  const saved = student ? wordsFor(student.id) : [];
  const first = entries[0];
  const [text, setText] = useState(() => (first ? saved.find((w) => w.term === first.term)?.paraphrase ?? "" : ""));
  const [done, setDone] = useState(false);
  if (!first) return null;
  return (
    <div className="dict">
      <span className="eyebrow" style={{ fontSize: 11 }}>Dictionary</span>
      {entries.map((d) => (
        <div key={d.term}>
          <strong>{d.term}</strong> <em className="muted">{d.pos}</em> — {d.definition}
        </div>
      ))}
      {student && (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            addWord(student.id, first.term, text.trim());
            setDone(true);
          }}
        >
          <label htmlFor={`para-${msgKey}`} className="small" style={{ fontWeight: 600 }}>In my own words</label>
          <input
            id={`para-${msgKey}`}
            className="input"
            style={{ flex: 1, minWidth: 160, minHeight: 36, fontSize: 14 }}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setDone(false);
            }}
            placeholder={`Rewrite “${first.term}” your way…`}
          />
          <button className="btn small" disabled={!text.trim()}>{done ? "Saved" : "Save"}</button>
        </form>
      )}
    </div>
  );
}

function GuideBubble({ m, obj, student, msgKey }: { m: GuideMessage; obj: ObjectCase; student?: User; msgKey: string }) {
  const blocked = m.kind === "blocked";
  return (
    <div className={`bubble-guide${blocked ? " blocked" : ""}`}>
      {blocked && <strong style={{ color: "var(--sage-dk)" }}>That one&apos;s yours to work out</strong>}
      {m.kind === "answer" && m.label && <div><Chip label={m.label} /></div>}
      <p>{m.text}</p>
      {m.sourceId && (
        <div className="source-note">
          <span>
            <strong style={{ color: "var(--ink)" }}>{sourceTitle(obj, m.sourceId)}</strong>
            {m.contribution ? ` — ${m.contribution}` : ""}
          </span>
        </div>
      )}
      <Dictionary entries={m.dictionary} student={student} msgKey={msgKey} />
    </div>
  );
}

export function ChatView({ messages, obj, student }: { messages: ChatMessage[]; obj: ObjectCase; student?: User }) {
  if (messages.length === 0) return <p className="muted">No questions asked yet.</p>;
  return (
    <>
      {messages.map((m, i) =>
        m.from === "student" ? (
          <div key={i} className="bubble-me">{m.text}</div>
        ) : (
          <GuideBubble key={i} m={m} obj={obj} student={student} msgKey={`${i}`} />
        ),
      )}
    </>
  );
}
