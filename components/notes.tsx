"use client";

import { useState } from "react";
import { fmtDate } from "./ui";
import { addNote, getUser, notesFor } from "@/lib/store";
import type { User } from "@/lib/schema";

/**
 * A two-way thread between a student and their parents. Either side can
 * reply, so a busy student can tell a parent they need to make a plan.
 */
export function NotesThread({ student, me }: { student: User; me: User }) {
  const [text, setText] = useState("");
  const [share, setShare] = useState(false);
  const notes = notesFor(student.id);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addNote(student.id, me.id, text, me.role === "parent" && share);
    setText("");
  }

  const placeholder = me.role === "parent" ? `Write a note to ${student.name}…` : "Reply to your parent…";
  return (
    <div className="stack">
      {notes.length === 0 && <p className="small muted">No notes yet.</p>}
      <ol className="stack" style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 320, overflowY: "auto" }}>
        {notes.map((n) => {
          const author = getUser(n.authorId);
          const mine = n.authorId === me.id;
          return (
            <li key={n.id} className="tile" style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "90%", background: mine ? "#fff" : "var(--chat)" }}>
              <p style={{ fontSize: 15 }}>{n.text}</p>
              <span className="small muted">
                {mine ? "You" : author?.name ?? "Someone"} · {fmtDate(n.at)}
                {n.shareWithTeacher ? " · shared with teacher" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="stack">
        <label htmlFor={`note-${student.id}`} className="sr-only">{placeholder}</label>
        <textarea id={`note-${student.id}`} className="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
        <div className="spread">
          {me.role === "parent" ? (
            <label className="row small" style={{ gap: 6 }}>
              <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> Also share with the teacher
            </label>
          ) : (
            <span />
          )}
          <button className="btn small" disabled={!text.trim()}>Send</button>
        </div>
      </form>
    </div>
  );
}
