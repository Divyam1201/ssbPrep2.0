# SSB Practice Platform

A modular practice platform for SSB psychology tests, built with Next.js (App
Router), TypeScript and Tailwind CSS.

**Implemented today:** TAT (Theme Appreciation Test). **Ready for later:** WAT,
SRT, Lecturette or anything else — each is a folder plus one registry line,
with no changes to the shared core or existing modules.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build + type check
npm run lint
```

## Structure

```
src/
  app/
    page.tsx                     # home: lists every registered module
    modules/[moduleId]/page.tsx  # loads only from the registry
  core/                          # module-agnostic, zero TAT knowledge
    timer/
      useCountdown.ts            # timestamp-based countdown (no UI)
      usePhaseSequence.ts        # runs Phase[] in order
    session/
      useTestSession.ts          # idle -> running -> complete
    components/
      ModuleHost.tsx             # setup -> runner lifecycle
      FullScreenStage.tsx        # dark distraction-free wrapper
      UploadDropzone.tsx         # multi-file upload + previews
      ConfirmEndDialog.tsx
    audio/
      useBeep.ts                 # optional tone + mute toggle
    files/
      useObjectUrl.ts            # object URLs with revoke on cleanup
    types.ts                     # ModuleDefinition, Phase, SessionConfig, ...
  modules/
    registry.ts                  # the only list of modules
    tat/
      index.ts                   # exports TatModule: ModuleDefinition
      config.ts                  # VIEW_SECONDS, WRITE_SECONDS, cap, images
      phases.ts                  # buildTatPhases(items, config)
      session.ts                 # setup choices -> PreparedSession
      hooks/useTatSession.ts     # core hooks + TAT phase list
      components/
        SetupScreen.tsx
        Runner.tsx
        ImageViewer.tsx
        WritingScreen.tsx
        CompleteScreen.tsx
```

`public/tat/standard-01.svg … standard-11.svg` are the built-in placeholder
images. Replace them with real practice images using the same file names, or
change `STANDARD_IMAGES` in `src/modules/tat/config.ts`.

## The module contract

Every module exports a `ModuleDefinition` (`src/core/types.ts`):

```ts
interface ModuleDefinition {
  id: string;                     // URL: /modules/<id>
  title: string;
  description: string;
  SetupComponent: ComponentType<ModuleSetupProps>;
  RunnerComponent: ComponentType<ModuleRunnerProps>;
  buildPhases(items: readonly SessionItem[], config: SessionConfig): Phase[];
}
```

- `ModuleHost` renders `SetupComponent`; when setup calls `onStart(session)` it
  swaps to `RunnerComponent` with that `session` and an `onSetup` callback.
- A `Phase` is `{ id, durationSec, showTimer, onStart?, onEnd? }`. `showTimer`
  is per phase, which is why TAT can hide every timer while SRT can show one
  visible countdown for the whole page.
- `useCountdown` stores an absolute end timestamp (via `performance.now()`),
  recomputes remaining time on every tick, reschedules against that timestamp
  and re-reads it on `visibilitychange`. It never counts interval ticks, cleans
  up on unmount/restart and guards against Strict Mode double effects.
- `usePhaseSequence` advances through phases, calling each phase's `onStart`
  once and `onEnd` on completion. Rebuilding the `phases` array does not
  restart the current phase.

## Adding a module (example: WAT)

1. Create `src/modules/wat/` with `config.ts`, `phases.ts`, `session.ts`,
   `hooks/useWatSession.ts`, `components/SetupScreen.tsx`,
   `components/Runner.tsx` and `index.ts`.
2. Put every duration and limit in `config.ts`.
3. Build the timeline in `buildWatPhases(items)` using core `Phase`s. WAT is a
   display-only test:

   ```ts
   // src/modules/wat/config.ts
   export const WORD_SECONDS = 15;
   export const MAX_STANDARD_WORDS = 60;

   // src/modules/wat/phases.ts
   export function buildWatPhases(items: readonly SessionItem[]): Phase[] {
     return items.map((item, index) => ({
       id: `${item.id}:display`,
       durationSec: WORD_SECONDS,
       showTimer: false,
       onStart: () => console.log("word", index),
     }));
   }

   // src/modules/wat/hooks/useWatSession.ts
   export function useWatSession({ session }: { session: PreparedSession }) {
     const test = useTestSession();
     const phases = useMemo(
       () => buildWatPhases(session.items),
       [session.items],
     );
     const sequence = usePhaseSequence({ phases, onComplete: test.complete });
     // expose status, current item, start/restart/endTest
   }
   ```

4. Export the definition from `src/modules/wat/index.ts`:

   ```ts
   export const WatModule: ModuleDefinition = {
     id: "wat",
     title: "WAT Practice",
     description: "Word Association Test — one word every 15 seconds.",
     SetupComponent: WatSetupScreen,
     RunnerComponent: WatRunner,
     buildPhases: (items) => buildWatPhases(items),
   };
   ```

5. Add one line to `src/modules/registry.ts`:

   ```ts
   import { WatModule } from "./wat";

   export const modules: readonly ModuleDefinition[] = [TatModule, WatModule];
   ```

Nothing else changes: the home page and `/modules/wat` discover it through the
registry.

## TAT behaviour

- **Standard & Public mode** runs either the built-in placeholder set (`MAX_STANDARD_IMAGES = 11`) or public sets published by the admin to the shared pool.
- **Custom mode (Device-only)** keeps images on the candidate's device in IndexedDB for 24 hours. Zero network requests, zero cloud storage.
- Per image: 30s full-screen view (`object-contain`), then a blank
  "Start writing" screen for 240s, then the next image automatically.
- No countdown, clock or progress bar is ever rendered (`showTimer: false` on
  both phases).
- An optional beep marks the start and end of each writing phase; it can be
  muted in the corner. The next image is preloaded during writing. "End test"
  asks for confirmation.
- The last phase ends on a "Test Complete" screen with Restart and Change setup.

## Admin & uploads

The application has a **single-admin access model** with no public signup or database accounts. Public candidates are anonymous and have read-only access to shared sets. Only the verified admin can upload files to UploadThing and publish sets to MongoDB.

### 1. Generate Admin Password Hash
Run the generator script with your chosen password:
```bash
node scripts/hash-password.mjs yourSecurePassword123
```
This generates a salted bcrypt hash.

### 2. Configure Environment Variables
Add the following to `.env.local` (never commit this file):
```env
# UploadThing Token
UPLOADTHING_TOKEN=your_uploadthing_token_here

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Admin Authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$...your_bcrypt_hash_here...
SESSION_SECRET=your_long_random_session_secret_at_least_32_characters
```

### 3. How the Admin Flow Works
- Anonymous visitors see a **"Login as admin"** button at the bottom of the set selection screen.
- Successful authentication issues an `httpOnly`, `sameSite=lax`, signed JWT cookie (`ssb_admin_session`) valid for 7 days.
- Rate-limiting in MongoDB restricts failed login attempts to 5 per 15 minutes per IP.
- After logging in, the button becomes **"Upload new set"** and **"Log out"**.
- Admins can upload:
  - **TAT**: up to 11 images (8MB max each).
  - **WAT, SRT, Lecturette, GD**: 1 document or image (16MB max).
- UploadThing routes and `POST /api/sets` enforce admin authentication on the server; unauthenticated requests are rejected with 401 Unauthorized.
- Newly published sets appear immediately in the public recent sets list (`GET /api/sets?module=...`).


