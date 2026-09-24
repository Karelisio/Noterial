# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # install dependencies
npm run dev               # start Vite dev server
npm run build              # tsc -b type-check, then vite build to dist/
npm run preview            # preview the production build
npm run lint                # eslint on .ts/.tsx

# Capacitor / Android
npx cap sync android        # copy web build + sync native deps into android/
npx cap open android         # open the Android project in Android Studio
```

There is no test suite configured in this repository yet.

## Architecture

Noterial is an offline-first notes app: **SQLite on-device is the source of truth**; Supabase is a sync target, not the primary store. Every read/write in the UI goes through the local DB first, and sync happens asynchronously afterward. Keep this direction when adding features — never make the UI wait on a network round-trip for a local mutation.

### Data flow

`src/db/sqlite.service.ts` (`sqliteService`) owns the local SQLite schema (via `@capacitor-community/sqlite`) and is the only place that touches SQL directly. It exposes CRUD (`createNote`, `updateNote`, `softDelete`, `restore`, `hardDelete`), read paths (`listActive`, `listTrash`, `search` — FTS5-backed), and two sync primitives: `getDirty` (rows where `updated_at > synced_at`, i.e. not yet pushed) and `upsertFromRemote` (last-write-wins merge of a row pulled from Supabase, compared by `updated_at`).

`src/sync/sync.service.ts` (`syncService`) drives synchronization: `push` sends dirty local rows to Supabase and stamps `synced_at`; `pull` fetches rows from Supabase newer than a cursor persisted in `@capacitor/preferences` and upserts them locally. Sync is triggered on network reconnect (`@capacitor/network` listener), on app init, and after local mutations via `scheduleSync()` (debounced ~800ms) — it is never called synchronously from a component. `useSync()` (`src/hooks/useSync.ts`) exposes the current `SyncStatus` (`synced`/`pending`/`error`) to the UI, consumed by `SyncBadge`.

`src/hooks/useNotes.ts` is the bridge between components and `sqliteService`/`syncService`: every mutation (`createNote`, `updateNote`, `deleteNote`) writes locally first, then calls `syncService.scheduleSync()`.

### Account is optional

The app never gates the UI behind login. `src/hooks/useAuth.ts` resolves a `userId` that is either the real Supabase account id (once logged in) or a stable per-device id from `src/lib/localUser.ts` (`getOrCreateLocalUserId`, persisted via `@capacitor/preferences`) — `App.tsx` renders `HomePage` as soon as either is available, never blocking on auth. `syncService.syncNow()` independently checks `supabase.auth.getUser()` and silently no-ops when nobody is logged in, so notes owned by the local id simply stay local. Logging in (from `SettingsPage`, not a full-screen gate) fires `sqliteService.reassignOwner(localId, realUserId)` in `useAuth`'s `onAuthStateChange` handler, which reassigns locally-owned notes to the account and clears their `synced_at` so the next `scheduleSync()` pushes them.

The local `notes` table and the Supabase `public.notes` table share the same shape (`id`, `user_id`, `title`, `content`, `created_at`, `updated_at`, `deleted_at`, `synced_at` — see `supabase/migrations/0001_notes.sql`). `id` is a client-generated UUID so creates never round-trip through the server. Deletion is soft (`deleted_at`); the trash view and hard delete live in `Trash.tsx`.

### Supabase project

This app currently shares its Supabase project (`xssochyjgxwwmvtweusv`, named "mago" in the dashboard) with an unrelated app called mago, because the organization's free-project quota was full. `public.notes` is isolated by RLS (`auth.uid() = user_id`) and does not touch mago's tables — see the note in `supabase/migrations/0001_notes.sql` and in `README.md` before assuming this project is dedicated to Noterial.

### Theming

`src/theme/ThemeProvider.tsx` wraps MUI's `ThemeProvider`/`createTheme` and resolves a `light`/`dark`/`auto` mode (persisted via `@capacitor/preferences`) against `window.matchMedia('(prefers-color-scheme: dark)')` when `auto` is selected. `useThemeMode()` is the only way components should read/set theme — don't read `Preferences` or `matchMedia` directly elsewhere.

On Android 12+, the primary/secondary colors and background/surface/text roles follow the device wallpaper (Material You) instead of the fixed violet palette: `DynamicColorPlugin.java` (a native Capacitor plugin, registered in `MainActivity.java`) reads the system's `android.R.color.system_accent*`/`system_neutral*` resources and returns both light and dark variants; `src/lib/dynamicColor.ts` wraps it (`getSystemDynamicColors()`, resolving to `null` below Android 12 or off-Android) and `ThemeProvider` feeds the result into `createTheme()`, falling back to the fixed palette when unavailable. This was ported from the sibling apps Orbit/Mago specifically so a future widget could read the exact same native plugin and never visually diverge from the app — keep that shape (role names, hex format) in sync if you touch either side.

### Responsive layout

`src/pages/HomePage.tsx` switches between a mobile (list OR detail, with back navigation) and tablet (list AND detail side by side) layout based on a single `useMediaQuery('(min-width:900px)')` check. There is no separate router for this — it's conditional rendering driven by that breakpoint.

### CI / release

`.github/workflows/android-release.yml` builds and signs a release APK on any `v*` tag push, using secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (configured manually in the repo's Actions secrets — there is no tooling in this environment to write them programmatically). `src/components/UpdateChecker.tsx` checks the GitHub releases API at launch and should stay in sync with the version tagging scheme this workflow uses.

## Path alias

`@/*` resolves to `src/*` (see `tsconfig.json` and mirrored in Vite via `@vitejs/plugin-react`). Use it instead of relative `../../` imports.
