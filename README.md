# Ancient Object Investigation

A web app that helps students work out what ancient objects are **without ever being told**. Students ask up to 7 questions, get answers labeled and sourced from the object's records, and write their reasoning in an Interpretation Log. Teachers review the work and get class analysis and teaching ideas. Parents follow their child's progress, read their chats and send notes back and forth.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Open `/demo` and press **Set up the demo class** to try every account type: a teacher, three students (one with a flagged log) and a parent linked to Maya.

```bash
npm run verify       # typecheck + tests + production build
```

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Needed? | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes, for AI answers | The guide's replies (including turned-down questions), feedback on students' Interpretation Log reasoning, and teaching ideas are written by Claude (`claude-opus-5-5`). Without a key, the app still works but quotes the source passages directly and uses built-in lesson templates, and every reply says so. |

### Turning AI on in Vercel

1. Project → **Settings → Environment Variables** → add `ANTHROPIC_API_KEY` (Production, and Preview if you use it).
2. **Redeploy.** New variables only reach a deployment made after they were added (Deployments → ⋯ → Redeploy).
3. Open `https://<your-site>/api/status?check=1`. You should see `"aiConfigured": true` and `"check": {"ok": true}`. If not, `detail` says why (missing key, rejected key, model not available, out of credit).

Each answer in the app also shows "Written by the AI guide" or "Quoted from the sources (AI unavailable)", and the investigation page shows the reason when AI is off.

## Accounts

| Role | Signs up with | Signs back in with |
|---|---|---|
| Student | First name, plus an optional class code. Anyone can sign up without a class. | The login code they are shown at sign-up (e.g. `KILN-OCHRE-4821`). |
| Teacher | Name, email, password | Email and password |
| Parent | Name, email, password, then adds a child with the child's family link (`FAMILY-123456`) | Email and password |
| Guest student | One click ("Try it as a guest") | Nothing to remember: guest work is deleted when the guest session ends. Guests can use every practice object, but can't join a class, be linked by a parent, send notes or open non-practice objects. |

## How the rules are enforced

- **Never gives the answer away.** Identity questions ("what is it?", "is it a tool or a weapon?") are refused before any model call (`lib/guide.ts`). Every reply then passes `checkReply`, which swaps out anything that names the object or cites a passage outside that object's sources.
- **Blocked questions count.** Each question uses one of the 7, including refused ones.
- **Every answer is labeled.** The label (fact, historical record, scholarly inference, cultural interpretation) and the "what this source contributed" note come from the source passage, never from the model.
- **Own words.** On submit, the log is compared with the guide's replies (`lib/insights.ts`). If 30% or more of its 6-word phrases repeat the chat, the log is flagged and the teacher sees the copied text highlighted.
- **Two-way notes.** Parents and their child share one thread, and either can reply. A parent can also share a note with the teacher.

## What's not built yet

- **Data is saved in the browser only** (`lib/store.ts`). There is no server or database yet. Accounts exist only on the device they were made on, and a teacher, student and parent must use the same browser to see each other's work. Swapping `lib/store.ts` for a real backend is the next step.
- Because everything runs in the browser, the hidden object identities are in the page code. A student who opens developer tools could find them. This goes away once there is a server.
- The objects in `lib/objects.ts` (three practice objects and two class objects) are sample teaching material written for this app, not real excavation records. Teachers can't add their own objects yet.
- Object pictures are drawn illustrations (`public/objects/`), not photographs.
- "Help me connect the dots" for hard sources, and the walkthrough video, are placeholders.
