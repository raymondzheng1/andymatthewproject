"use client";

import { useRouter } from "next/navigation";
import { signInAsGuest } from "@/lib/store";

/** One click into a student account that can only use practice objects. */
export function GuestButton() {
  const router = useRouter();
  return (
    <div className="stack" style={{ gap: 4, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          signInAsGuest();
          router.push("/student");
        }}
      >
        Try it as a guest
      </button>
      <span className="small muted">No sign-up. Practice objects only, and nothing is kept after you leave.</span>
    </div>
  );
}
