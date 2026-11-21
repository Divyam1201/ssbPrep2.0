# AGENTS.md: SSB Prep App

Read this file fully before making any change. These rules apply to every task in this repo.

## 1. Project summary

A web app for practicing SSB (Services Selection Board) psychology tests under timed conditions.

- Modules: **TAT, WAT, SRT, Lecturette**. All are timed.
- The app is a pure practice environment. It does **not** score, critique, or capture answers.
- Authentication: **Single admin** configured via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`). No public user signup or user accounts.
- Access model: Public candidates are anonymous and have read-only access to the shared pool. Only the verified admin can upload files to UploadThing or publish shared sets to MongoDB.
- Custom sets: Candidates' own custom uploads stay on their device in IndexedDB (24-hour TTL) and never touch UploadThing or MongoDB.
- Hobby project. Keep everything on free tiers and avoid paid services.

## 2. Tech stack (fixed, do not change without asking)

- **Next.js (App Router)** only. Frontend and backend both live here, using Route Handlers. No separate Express server.
- **Tailwind CSS**, strictly. No CSS modules, no styled-components, no inline style objects except for dynamic values Tailwind cannot express.
- **MongoDB** for data.
- **UploadThing** for file storage (PDFs, Word docs, images). Do not use Multer, local disk storage, S3, or R2.
- **Claude/GPT API** for AI steps (see section 5).
- TypeScript if the project already uses it. Match whatever the repo currently uses.

## 3. Theme

Dark ink / parchment / olive / gold, matching the existing `index.html` Lecturette prototype. Reuse its color values as Tailwind theme tokens (in the Tailwind config or CSS theme block) instead of hardcoding hex values in components.

## 4. Architecture rules

- **Modular by feature.** Each test module (tat, wat, srt, lecturette) is independent and owns its own components, hooks, and logic. One module must never import from another module.
- **Shared code lives in a shared layer.** Timer logic, flashcard/session UI, set-list UI, upload UI, DB connection, UploadThing helpers, AI client, and common types go there. WAT, SRT, and future modules must be able to reuse them without copy-paste.
- Route Handlers stay thin. Put logic in service functions, not inside `route.ts`.
- Validate all input on the server. Never trust the client.
- No secrets in client code. Only `NEXT_PUBLIC_` variables may reach the browser.
- No dead code, no unused dependencies, no leftover test files. Remove what you replace.

Layout (matching repo architecture):

```
src/
  app/
    api/
      uploadthing/{core.ts,route.ts}
      sets/route.ts
    modules/[moduleId]/page.tsx
  modules/                         # features (independent modules: tat, wat, srt, lecturette)
    registry.ts
    tat/ wat/ srt/ lecturette/     # each: components, hooks, phases, session, config
  core/                            # shared layer
    components/                    # UploadDropzone, ModuleHost, FullScreenStage, etc.
    timer/                         # useCountdown, usePhaseSequence
    session/                       # useTestSession
    audio/                         # useBeep
    uploadthing.ts                 # UploadThing client helpers
    types.ts                       # common shared types
  server/
    db.ts                          # Mongoose connection
    models/                        # Mongoose models (Set, etc.)
    services/                      # setService, extractionService, tatImageValidator
```

## 5. Product rules (do not violate)

**Sets**
- Shared sets are created exclusively by the admin and saved to MongoDB with UploadThing assets.
- Custom sets are stored locally on the candidate's device in IndexedDB (24-hour TTL) with zero server uploads.
- Per-module limits are maximums. A set may have fewer, never more:
  - WAT: up to 60 words
  - SRT: up to 60 situations
  - Lecturette: up to 4 topics
  - TAT: 1 image, or up to 11 images
  - GD: scenario document (max items not yet capped)
- A full-size set is labeled **Complete Set**. A smaller one is labeled **Partial Set**. (For GD, the label is omitted until a max is defined).
- If a Partial Set is started, the timer scales proportionally to item count (e.g. WAT: 60 words = 15 min, so 10 words = 2.5 min).

**AI usage (only these places)**
- Extraction: the user uploads any PDF/Word/image regardless of formatting, and AI pulls out words, situations, topics, or images.
- Lecturette: AI curates topics by difficulty (hard, moderate, easy, very easy) from whatever count is submitted.
- TAT: AI checks uploaded images at upload time to reject blank or invalid ones.
- **No AI during a running test.** The test run is deterministic timer and flashcard logic.

**Test run behavior**
- TAT: 30 seconds image view, then 4 minutes writing with a hidden background timer.
- SRT: the whole set is shown on one page with a single countdown in the top right.
- WAT: one word at a time.
- Lecturette: prep timer, then narrate timer, with a bell/chime.

## 6. UploadThing rules

- Always check the **current** docs at https://docs.uploadthing.com before writing integration code. The API changes between versions. Do not rely on memory.
- File routes are defined in one place (`app/api/uploadthing/core.ts`) and enforce file type, size, and count limits server-side.
- Use separate routes per use case (e.g. TAT images vs. document uploads).
- Store the **file key** and the file URL returned by the installed version in MongoDB, not the file itself.
- Use `UTApi` for server-side operations such as deleting orphaned files.
- Set `UPLOADTHING_TOKEN` in `.env.local`. Never commit it. Keep `.env.example` updated with variable names only.
- If Tailwind styling for UploadThing components is needed, follow the setup that matches the installed Tailwind version (v3 and v4 differ).

## 7. Working style

1. **Plan first.** Before editing, write a short plan of what you will change and why. For destructive actions (deleting files, moving folders, renaming many files), list them and wait for approval.
2. **Small, reviewable steps.** Do not refactor unrelated code.
3. **Do not start building features beyond the current task.** If something is out of scope, note it in your summary instead of building it.
4. **Verify.** Run the type check, lint, and build. Fix what you broke. Report anything that was already failing before you touched it.
5. **Report honestly.** End each task with: what changed, what was tested and how, what is still broken or unverified, and what needs the user's input (env vars, dashboard setup).
6. Never invent API names or options. If unsure, read the docs or the installed package's types.