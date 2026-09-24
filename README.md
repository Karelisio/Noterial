# Noterial

App de notes minimaliste offline-first (React 18 + TypeScript + Vite, Capacitor Android, Material 3).

## Stack

- **Stockage local** : `@capacitor-community/sqlite` (source de vérité), FTS5 pour la recherche
- **Sync** : Supabase (auth email/mdp + Postgres, RLS par `user_id`), last-write-wins sur `updated_at`
- **Config/thème** : `@capacitor/preferences`
- **UI** : Material 3 / Material You (MUI)
- **CI** : GitHub Actions → APK signé en release

## Arborescence

```
Noterial/
├── .github/workflows/
│   └── android-release.yml       # build + signature APK à chaque tag vX.Y.Z
├── supabase/migrations/
│   └── 0001_notes.sql            # table notes + RLS
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # auth guard + routage racine
│   ├── lib/
│   │   ├── supabase.ts           # client Supabase
│   │   └── types.ts              # type Note, SyncStatus
│   ├── theme/
│   │   └── ThemeProvider.tsx     # clair/sombre/auto, persisté via Preferences
│   ├── db/
│   │   └── sqlite.service.ts     # CRUD local, FTS5, dirty rows, upsert remote
│   ├── sync/
│   │   └── sync.service.ts       # push/pull, debounce, retry au retour réseau
│   ├── hooks/
│   │   ├── useNotes.ts
│   │   └── useSync.ts
│   ├── components/
│   │   ├── NoteList.tsx          # liste + états vide/chargement/erreur
│   │   ├── NoteEditor.tsx        # markdown, toggles gras/italique/titre/liste, preview live
│   │   ├── SearchBar.tsx         # debounce 200ms
│   │   ├── SyncBadge.tsx         # ✓ / ⏱ / ⚠
│   │   ├── ThemeToggle.tsx
│   │   ├── Trash.tsx             # corbeille : restaurer / supprimer définitivement
│   │   ├── ImportExport.tsx      # export .md/.txt + partage, import multi-fichiers
│   │   └── UpdateChecker.tsx     # check release GitHub au lancement
│   └── pages/
│       └── HomePage.tsx          # liste/détail responsive (mobile vs tablette)
├── capacitor.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev

# Android
npx cap add android
npx cap sync android
npx cap open android
```

## Modèle de données

Identique en local (SQLite) et distant (Supabase Postgres) :

```
notes: id (UUID client), user_id, title, content, created_at, updated_at, deleted_at, synced_at
```

## Sync

Déclenchée au lancement, au retour en ligne (`Network.addListener`) et après chaque modification
(debounce 800 ms). `push` envoie les lignes où `synced_at is null or updated_at > synced_at` ;
`pull` récupère les lignes distantes plus récentes que le curseur stocké (`Preferences`). Le conflit
se résout par `updated_at` le plus récent (last-write-wins), appliqué dans `upsertFromRemote`.

## CI Android

Le workflow `.github/workflows/android-release.yml` se déclenche sur un tag `v*` : build web,
`cap sync android`, puis assemblage et signature de l'APK avec un keystore décodé depuis les
secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`), et publication en release GitHub.
