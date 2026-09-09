# Insulin Tracker

Web application for recording and tracking daily blood glucose readings, blood pressure, weight and
lab exam attachments.

Requirements, scope, technical decisions and the contribution workflow live in
[`REQUIREMENTS.md`](./REQUIREMENTS.md). Read it before opening a pull request.

## Stack

| Layer | Technology |
| --- | --- |
| Front-end | React 19, Vite 8, TypeScript |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Icons | Lucide |
| Back-end | Supabase (not wired up yet) |
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

Markdown files are excluded from Prettier: its reflow fights the hand-formatted tables in
`REQUIREMENTS.md`.

## Project structure

```
src/
├── app/
│   ├── navigation.ts      Navigation destinations shared by both navs
│   ├── routes.tsx         Route table
│   └── theme/             Light/dark preference, persisted
├── components/
│   ├── layout/            App shell, side nav, bottom nav
│   ├── page-placeholder.tsx
│   └── theme-toggle.tsx
├── lib/                   Framework-agnostic helpers
├── pages/                 One component per route
├── index.css              Tailwind entry point and design tokens
└── main.tsx               Application entry point
```

`@/` is aliased to `src/`.

## Conventions

- Engineering artifacts — code, comments, documentation, commit messages, branch names and pull
  request descriptions — are written in technical English.
- The application interface is written in Brazilian Portuguese, because that is the end user's
  language. Route paths are in Portuguese for the same reason: the address bar is part of the
  interface.
- The interface follows the visual restraint constraints in `REQUIREMENTS.md` section 9.4. In short:
  no emojis, no decorative gradients, no glow, and color reserved for the clinical classification of
  values and for the primary action.
