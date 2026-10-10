"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { currentUser, getVersion, setSession, subscribe } from "@/lib/store";
import type { EvidenceLabel, Role, User } from "@/lib/schema";
import { LABEL_TEXT, MAX_QUESTIONS } from "@/lib/schema";

/** Re-render when app data or the signed-in user changes. Returns false until mounted in the browser. */
export function useApp(): boolean {
  const v = useSyncExternalStore(subscribe, getVersion, () => -1);
  return v >= 0;
}

export function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4l6 6-7 7-6-6z" />
        <path d="M7 11l-4 4 3 3 4-4" />
      </svg>
    </span>
  );
}

const NAV: Record<Role, { href: string; label: string }[]> = {
  student: [
    { href: "/student", label: "My investigations" },
    { href: "/student/walkthrough", label: "Walkthrough" },
    { href: "/student/account", label: "Account & family link" },
  ],
  teacher: [
    { href: "/teacher", label: "Classes" },
    { href: "/teacher/ideas", label: "Teaching ideas" },
  ],
  parent: [
    { href: "/parent", label: "My children" },
    { href: "/parent/guide", label: "How it works" },
  ],
};

export function TopBar({ user }: { user: User | null }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <header className="topbar">
      <Link href={user ? `/${user.role}` : "/"} className="brand">
        <Mark />
        <span>
          <span className="brand-name">Ancient Object Investigation</span>
          {user && <span className="brand-role">{user.role}</span>}
        </span>
      </Link>
      <nav className="topbar-mid" aria-label="Main">
        {user &&
          NAV[user.role].map((n) => (
            <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
      </nav>
      {user ? (
        <div className="row">
          <span style={{ fontSize: 14 }}>{user.name}</span>
          <button
            className="btn dark small"
            onClick={() => {
              setSession(null);
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      ) : (
        <div className="row">
          <Link className="btn dark small" href="/login">Log in</Link>
          <Link className="btn small" href="/#signup">Sign up</Link>
        </div>
      )}
    </header>
  );
}

/** Wraps a signed-in page: shows the top bar and checks the account type. */
export function RoleGate({ role, children }: { role: Role; children: (user: User) => ReactNode }) {
  const ready = useApp();
  if (!ready) return <TopBar user={null} />;
  const user = currentUser();
  if (!user || user.role !== role) {
    return (
      <>
        <TopBar user={user} />
        <main className="page">
          <div className="card" style={{ maxWidth: 520 }}>
            <h1>Please log in</h1>
            <p>This page is for {role} accounts.</p>
            <div className="row">
              <Link className="btn" href="/login">Log in</Link>
              <Link className="btn ghost" href="/#signup">Create an account</Link>
            </div>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <TopBar user={user} />
      {children(user)}
    </>
  );
}

const LABEL_ICON: Record<EvidenceLabel, string> = {
  fact: "M3 17L17 3l4 4L7 21z M7 13l2 2M10 10l2 2M13 7l2 2",
  record: "M6 3h9l4 4v14H6z M9 11h7M9 15h7M9 7h4",
  inference: "M9 18h6M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  cultural: "M9 5a3 3 0 1 1 0 6a3 3 0 1 1 0-6 M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 14.2c2.9.4 5 2.8 5 5.8",
};

export function Chip({ label }: { label: EvidenceLabel }) {
  return (
    <span className={`chip ${label}`}>
      <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={LABEL_ICON[label]} />
      </svg>
      {LABEL_TEXT[label]}
    </span>
  );
}

export function Dots({ used, total = MAX_QUESTIONS }: { used: number; total?: number }) {
  return (
    <span className="dots" role="img" aria-label={`${used} of ${total} questions used`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`dot${i < used ? " on" : ""}`} />
      ))}
    </span>
  );
}

export function Strength({ value }: { value: "strong" | "developing" | "missing" | "none" }) {
  const map = { strong: ["good", "Strong"], developing: ["warn", "Developing"], missing: ["bad", "Not yet"], none: ["neutral", "Not started"] } as const;
  const [cls, text] = map[value];
  return <span className={`pill ${cls}`}>{text}</span>;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
