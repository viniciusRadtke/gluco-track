# GlucoTrack

Web application for recording and tracking daily blood glucose readings, blood pressure, weight and
lab exam attachments.

Requirements, scope, technical decisions and the contribution workflow live in
`docs/REQUIREMENTS.md`. That directory is deliberately outside version control, so ask the maintainer
for a copy. Read it before opening a pull request.

## Stack

| Layer | Technology |
| --- | --- |
| Front-end | React 19, Vite 8, TypeScript |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Icons | Lucide |
| Back-end | Supabase (Postgres, Auth, row level security) |
| Hosting | Vercel |

## Requirements

Node `>=22.12.0`. The exact version is pinned in [`.nvmrc`](./.nvmrc).

```bash
nvm use
```

Native build dependencies (Rolldown and oxlint bindings) declare `^20.19.0 || >=22.12.0` in their
`engines` field. On an older Node, npm silently skips them as unmet optional dependencies and the
build fails at runtime with a missing-binding error rather than at install time.

## Getting started

```bash
npm install
npm run dev
```

The dev server prints the local URL, by default <http://localhost:5173>.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with hot module replacement |
| `npm run build` | Type-check and produce the production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Run oxlint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Verify formatting without writing |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the linked project |
| `npm run db:push` | Apply pending migrations to the linked project |
| `npm run db:test` | Run the row level security checks against the local stack |

Markdown files are excluded from Prettier: its reflow fights the hand-formatted tables in the
requirements document.

## Project structure

```
src/
├── app/
│   ├── navigation.ts      Navigation destinations shared by both navs
│   ├── routes.tsx         Route table
│   ├── session/           Supabase session, the signed-in role and patient link
│   ├── settings/          Patient thresholds used to classify a value
│   └── theme/             Light/dark preference, persisted
├── components/
│   ├── layout/            App shell, side nav, bottom nav
│   ├── record/            Tabs and forms of the Registrar screen
│   ├── ui/                Shared field and button primitives
│   ├── page-placeholder.tsx
│   └── theme-toggle.tsx
├── lib/                   Framework-agnostic helpers, Supabase client, generated types
├── pages/                 One component per route
├── index.css              Tailwind entry point and design tokens
└── main.tsx               Application entry point

supabase/
├── config.toml            Supabase CLI configuration
├── migrations/            Schema, applied in filename order
└── tests/                 Row level security checks
```

`@/` is aliased to `src/`.

## Supabase

Copy [`.env.example`](./.env.example) to `.env.local` and fill it in with the project URL and the
publishable key. The file is git-ignored.

```bash
cp .env.example .env.local
```

Every table is behind row level security keyed to the signed-in user, so no screen reads or writes
anything without a session. Until the sign-in screen exists, the development build signs in with the
`VITE_DEV_PATIENT_*` credentials from `.env.local`. That code is behind `import.meta.env.DEV` and is
dropped from the production bundle.

The schema lives in `supabase/migrations/` and is the only source of truth for it. Link the CLI to
the project once, then use the scripts:

```bash
npx supabase link --project-ref <project-ref>
npm run db:push    # apply pending migrations
npm run db:types   # regenerate src/lib/database.types.ts
```

`src/lib/database.types.ts` is generated. Change the schema in a migration and regenerate it; never
edit it by hand.

## Conventions

- Engineering artifacts — code, comments, documentation, commit messages, branch names and pull
  request descriptions — are written in technical English.
- The application interface is written in Brazilian Portuguese, because that is the end user's
  language. Route paths are in Portuguese for the same reason: the address bar is part of the
  interface.
- The interface follows the visual restraint constraints in the requirements document, section 9.4.
  In short: no emojis, no decorative gradients, no glow, and color reserved for the clinical
  classification of values and for the primary action.
