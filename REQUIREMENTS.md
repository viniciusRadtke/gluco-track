# Insulin Tracker — Requirements Specification

> Project context document. Single source of truth for **what** the system does and **why**.
> Implementation details (component names, folder structure) do not belong here.

| Field | Value |
| --- | --- |
| Project | Insulin Tracker (working name — see [Open questions](#12-open-questions)) |
| Document version | 1.3 |
| Date | 2026-09-08 |
| Source | Requirements interview with the project owner (2 rounds) |
| Status | Requirements approved for MVP; development not started |

> **Language policy.** All engineering artifacts — documentation, code, comments, commit messages,
> branch names and pull request descriptions — are written in technical English. The **application
> interface is written in Brazilian Portuguese**, because the end user is a Brazilian Portuguese
> speaker (see [RNF-LOC-01](#73-localization--rnf-loc)). UI copy quoted in this document therefore
> appears in Portuguese by design.

---

## 1. Overview

Personal web application for **recording and tracking daily blood glucose readings**, complemented by
blood pressure, weight and lab exam attachments.

The end user is the **project owner's father**, diagnosed with diabetes roughly 2 years ago and treated
with **daily oral medication** (no insulin). Today he keeps **no record at all** of his readings — the
history is lost between medical appointments.

**Core problem:** absence of history. Without records there is no way to observe trends or bring
structured information to appointments.

**Value proposition:**

1. Record the daily reading in seconds, with no friction.
2. Turn isolated readings into a visible trend (week, month, quarter).
3. Produce a PDF report ready for the medical appointment.

**Success criterion:** the user records his morning reading on most days, unassisted, and brings a
report covering the period to his next appointment.

---

## 2. Personas and roles

### 2.1 Primary persona — "The Patient"

| Attribute | Value |
| --- | --- |
| Age | 40+ |
| Technical proficiency | Moderate — uses a smartphone and a laptop, but does not explore complex interfaces |
| Condition | Diabetes (type unconfirmed — see [Open questions](#12-open-questions)) |
| Time since diagnosis | ~2 years |
| Treatment | Daily oral medication |
| Measuring device | Fingerstick glucose meter (no continuous glucose monitor) |
| Measuring routine | One reading per day, in the morning, **fasting** |
| Impairments | None visual or motor; prefers slightly larger type |
| Devices | Laptop and mobile phone, through the browser |

**Design implication:** the path to recording a reading must be the most visible and the shortest flow
in the system. Nothing essential may depend on discovery or on nested menus.

### 2.2 Secondary persona — "The Caregiver"

The project owner (the patient's son). Builds and maintains the application. Wants to **be able to
review the data when needed**, but is not an active user: he does not record readings day to day and
does not receive alerts.

### 2.3 Role model

| Role | Permissions |
| --- | --- |
| `patient` | Read and write all of his own data; configures preferences and target ranges |
| `caregiver` | **Read-only** access to the linked patient's data; generates reports |

Both roles see **the same dataset** (the patient's). There are no per-user separate datasets.

---

## 3. Scope

### 3.1 In scope (MVP)

- Email and password authentication with a persistent session.
- Create, edit and delete blood glucose readings.
- Record blood pressure and weight.
- Dashboard with key indicators and a shortcut to record a reading.
- Browsable, filterable history.
- Trend charts by period (7 days, 30 days, 90 days, 12 months).
- Visual alert for values outside the configured range.
- Configurable target ranges and alert thresholds.
- "Lab exams" section for file attachments.
- PDF report export by period.
- Light and dark theme toggle.
- Responsive layout (phone, tablet, laptop).

### 3.2 Out of scope (MVP)

| Item | Rationale / destination |
| --- | --- |
| Carb counting and meal logging | Not needed now; reassess in the long term |
| Reminders and notifications | Declared low priority → Phase 2 |
| Offline support with synchronization | Desirable, not essential → Phase 2 |
| Installable PWA (home screen icon) | "Browser access is enough for now" → Phase 2 |
| Insulin dose logging | The patient does not use insulin |
| Extracting values from exam PDFs | Attachments are files only; no value entry |
| Importing historical records | Confirmed: start from scratch |
| Glucose meter or CGM integration | The device has no connectivity |
| Multiple patients / third-party use | Family-scale system, two accounts |
| Medical disclaimer screen | Explicitly waived by the project owner |

---

## 4. Glossary

| Term | Definition |
| --- | --- |
| **Blood glucose** | Glucose concentration in the blood, measured in **mg/dL** (Brazilian standard) |
| **Fasting** | Reading taken on waking, before the first meal. The default context in this app |
| **Target range** | Blood glucose interval considered adequate. Configurable. Initial default: **100–150 mg/dL** |
| **Hypoglycemia** | Blood glucose below the lower alert threshold. Initial default: **< 70 mg/dL** |
| **Hyperglycemia** | Blood glucose above the upper alert threshold. Initial default: **> 180 mg/dL** |
| **Time in range** | Percentage of a period's readings that fell inside the target range |
| **HbA1c** | Glycated hemoglobin — periodic lab exam. In this app, an attachment only |
| **Reading context** | When the reading was taken (fasting, pre-meal, post-meal, bedtime, random) |

> **Note on ranges:** the defaults above are *factory defaults* only. The system prescribes no clinical
> values — all of them are editable in settings so they can reflect the physician's guidance.

---

## 5. Domain model

```
user (patient | caregiver)
   │
   ├── glucose_reading    (value, context, timestamp, note)
   ├── blood_pressure     (systolic, diastolic, pulse, timestamp, note)
   ├── weight_entry       (weight, timestamp, note)
   ├── exam_attachment    (file, name, exam date)
   └── settings           (target ranges, alert thresholds, theme)
```

### 5.1 Entities

**`glucose_reading`**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | integer (mg/dL) | yes | Accepted input range: 20–600 |
| `context` | enum | yes | Default: `fasting` |
| `measured_at` | timestamp | yes | Auto-filled with the current time; editable |
| `note` | text | no | Short free-form field |

**`blood_pressure`**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `systolic` | integer (mmHg) | yes | Accepted range: 60–260 |
| `diastolic` | integer (mmHg) | yes | Accepted range: 30–160 |
| `pulse` | integer (bpm) | no | Accepted range: 30–220 |
| `measured_at` | timestamp | yes | Default: now, editable |
| `note` | text | no | |

**`weight_entry`**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `weight_kg` | decimal (1 dp) | yes | Accepted range: 20.0–300.0 |
| `measured_at` | timestamp | yes | Default: now, editable |
| `note` | text | no | |

**`exam_attachment`**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | PDF or image | yes | 10 MB limit per file |
| `name` | text | yes | Defaults to the uploaded file name; editable |
| `exam_date` | date | yes | Defaults to the upload date; editable |

**`settings`** (single record per patient)

| Field | Default |
| --- | --- |
| `glucose_target_min` / `glucose_target_max` | 100 / 150 mg/dL |
| `alert_low` / `alert_high` | 70 / 180 mg/dL |
| `bp_target_systolic` / `bp_target_diastolic` | 130 / 80 mmHg |
| `theme` | Follows the operating system |

---

## 6. Functional requirements

MoSCoW priority: **M** = must have in the MVP, **S** = should have, **C** = could have, **W** = out of MVP.

### 6.1 Authentication and accounts — `RF-AUT`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-AUT-01 | Sign in with email and password | M |
| RF-AUT-02 | Persistent session: the user stays signed in across visits and browser restarts, without re-authenticating on every access | M |
| RF-AUT-03 | Password recovery by email | M |
| RF-AUT-04 | Explicit sign-out | M |
| RF-AUT-05 | Accounts are **provisioned manually** by the administrator; there is no public sign-up | M |
| RF-AUT-06 | The `caregiver` role has read-only access, enforced in the database and not merely in the interface | M |

### 6.2 Glucose logging — `RF-GLI`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-GLI-01 | Record a reading by entering the value in mg/dL | M |
| RF-GLI-02 | Context is pre-selected as **fasting**, switchable between fasting, pre-meal, post-meal, bedtime and random | M |
| RF-GLI-03 | Date and time are auto-filled with the current moment and remain editable for backdated entries | M |
| RF-GLI-04 | Optional note field | M |
| RF-GLI-05 | Recording must be completable in **at most 3 interactions** from the dashboard: open → type value → save | M |
| RF-GLI-06 | While the value is being typed, the interface immediately indicates its classification (low / in range / high) through color and text, **before** saving | M |
| RF-GLI-07 | Validate the input range and ask for confirmation on physiologically implausible values, without blocking the entry | S |
| RF-GLI-08 | Edit and delete existing readings, with confirmation on delete | M |
| RF-GLI-09 | Flag when a reading already exists for the same day and context, without preventing the new entry | C |

### 6.3 Blood pressure and weight — `RF-BIO`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-BIO-01 | Record blood pressure with systolic, diastolic and optional pulse, as shown on the device | M |
| RF-BIO-02 | Record weight in kg | M |
| RF-BIO-03 | Edit and delete blood pressure and weight entries | M |
| RF-BIO-04 | Both are recorded sporadically: nothing in the system may assume a daily cadence or nag for entries | M |
| RF-BIO-05 | Track weight and blood pressure variation on a chart over time | M |
| RF-BIO-06 | Visually flag blood pressure above the configured target | S |

### 6.4 Dashboard — `RF-DSH`

Landing screen after sign-in. It must answer "how am I doing?" at a glance and offer the day's entry.

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-DSH-01 | Primary **record a reading** action visually prominent and above the fold on any device | M |
| RF-DSH-02 | Latest glucose reading: value, color-coded classification and how long ago it was taken | M |
| RF-DSH-03 | Glucose average over the last 7 and last 30 days | M |
| RF-DSH-04 | Time in range over the last 30 days, as a percentage | M |
| RF-DSH-05 | Sparkline of the last 30 days | M |
| RF-DSH-06 | Latest weight and blood pressure entries with their dates | M |
| RF-DSH-07 | Discreet notice when no glucose reading has been recorded for more than 2 days | C |
| RF-DSH-08 | Empty state: guide the first entry instead of rendering empty cards | M |

### 6.5 History — `RF-HIS`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-HIS-01 | List all entries in reverse chronological order | M |
| RF-HIS-02 | Filter by period and by entry type (glucose, blood pressure, weight) | M |
| RF-HIS-03 | Each item shows value, color-coded classification, context, timestamp and note | M |
| RF-HIS-04 | Edit or delete an entry directly from the list | M |
| RF-HIS-05 | Pagination or incremental loading for long histories | S |

### 6.6 Charts and trends — `RF-GRA`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-GRA-01 | Line chart of blood glucose over time | M |
| RF-GRA-02 | Period selection: 7 days, 30 days, 90 days (quarter) and 12 months | M |
| RF-GRA-03 | Render the target range as a shaded band behind the chart | M |
| RF-GRA-04 | Period summary statistics: average, minimum, maximum, reading count and time in range | M |
| RF-GRA-05 | For long periods, aggregate by week or month to keep the chart legible | S |
| RF-GRA-06 | Weight and blood pressure charts with the same period selection | M |
| RF-GRA-07 | Compare the current period's average against the previous period, indicating trend direction | C |

### 6.7 Lab exams — `RF-EXA`

A **file** section, not structured data. No exam values are typed in.

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-EXA-01 | Upload exam files as PDF or image | S |
| RF-EXA-02 | Each attachment has an editable name and an exam date | S |
| RF-EXA-03 | List attachments ordered by exam date, most recent first | S |
| RF-EXA-04 | View and download an attachment | S |
| RF-EXA-05 | Delete an attachment, with confirmation | S |
| RF-EXA-06 | Uploading must be simple and forgiving: file picker or phone camera, with clear progress and error feedback | S |

### 6.8 PDF report — `RF-REL`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-REL-01 | Generate a PDF report for a chosen period, with 30, 90 and 180-day shortcuts | M |
| RF-REL-02 | Header with patient name, period covered and generation date | M |
| RF-REL-03 | Glucose summary: average, minimum, maximum, total readings and time in range | M |
| RF-REL-04 | Glucose trend chart for the period | M |
| RF-REL-05 | Full table of the period's glucose readings | M |
| RF-REL-06 | Blood pressure and weight history for the period | M |
| RF-REL-07 | List of lab exams attached within the period, with name and date — as a reference index, without values | M |
| RF-REL-08 | Suitable for A4 printing and legible on paper | M |

### 6.9 Settings — `RF-CFG`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-CFG-01 | Configure the glucose target range (minimum and maximum) | M |
| RF-CFG-02 | Configure the hypo and hyperglycemia alert thresholds | M |
| RF-CFG-03 | Configure the blood pressure target range | S |
| RF-CFG-04 | Toggle between light and dark theme, with the preference persisted | M |
| RF-CFG-05 | Every configurable range shows its default value and can be reset to it | C |

### 6.10 Alerts — `RF-ALE`

| ID | Requirement | Prio |
| --- | --- | --- |
| RF-ALE-01 | When a value outside the alert thresholds is recorded, show an immediate on-screen visual warning | M |
| RF-ALE-02 | The thresholds that trigger the alert are the ones configured in RF-CFG-02 | M |
| RF-ALE-03 | The alert **informs and never blocks** the entry, and suggests no course of action or dosage | M |
| RF-ALE-04 | Out-of-range values are highlighted in the history, in charts and in the report | M |

---

## 7. Non-functional requirements

### 7.1 Usability and accessibility — `RNF-USA`

| ID | Requirement |
| --- | --- |
| RNF-USA-01 | Base font size of **17–18px**, above the 16px default, per the user's stated preference |
| RNF-USA-02 | Minimum WCAG 2.1 level AA contrast (4.5:1 for text) in both themes |
| RNF-USA-03 | Touch targets of at least 44×44px on touch screens |
| RNF-USA-04 | Numeric fields open the numeric keypad on mobile |
| RNF-USA-05 | Color is never the sole indicator of state — always paired with text or an icon |
| RNF-USA-06 | Flat primary navigation: no essential function more than 2 levels from the dashboard |
| RNF-USA-07 | Error messages in plain language, free of technical jargon and error codes |
| RNF-USA-08 | Every destructive action requires confirmation |

### 7.2 Responsiveness — `RNF-RES`

| ID | Requirement |
| --- | --- |
| RNF-RES-01 | Functional layout from 320px to 2560px wide |
| RNF-RES-02 | Mobile-first approach; the phone is the most frequent context for the daily entry |
| RNF-RES-03 | Charts and tables adapt to the available space; wide tables scroll horizontally within their own container, never the page itself |
| RNF-RES-04 | Bottom navigation on mobile, side or top navigation on large screens |

### 7.3 Localization — `RNF-LOC`

| ID | Requirement |
| --- | --- |
| RNF-LOC-01 | Single interface language: **Brazilian Portuguese**. No translation infrastructure |
| RNF-LOC-02 | Blood glucose unit: **mg/dL** only |
| RNF-LOC-03 | Dates as `DD/MM/YYYY`, times in 24-hour format |
| RNF-LOC-04 | `America/Sao_Paulo` timezone; decimal comma |

### 7.4 Performance — `RNF-DES`

| ID | Requirement |
| --- | --- |
| RNF-DES-01 | Dashboard interactive within 2.5s on a 4G connection |
| RNF-DES-02 | Saving a reading responds within 1s perceived, using optimistic UI feedback |
| RNF-DES-03 | Charts stay smooth with up to 5 years of daily entries (~1800 points) |

### 7.5 Security and privacy — `RNF-SEG`

| ID | Requirement |
| --- | --- |
| RNF-SEG-01 | Health data: access restricted to the two authorized accounts |
| RNF-SEG-02 | Isolation enforced in the database through Row Level Security, not only in the interface |
| RNF-SEG-03 | Exam files in a private bucket, served through signed, expiring URLs |
| RNF-SEG-04 | HTTPS required for all traffic |
| RNF-SEG-05 | Service keys never bundled into the front-end; only the public anonymous key |
| RNF-SEG-06 | Aligned with LGPD principles: specific purpose, data minimization and deletion on request |

### 7.6 Reliability — `RNF-CON`

| ID | Requirement |
| --- | --- |
| RNF-CON-01 | No recorded data may be lost silently: a failed save always surfaces an error and preserves what was typed |
| RNF-CON-02 | Database backups per the hosting plan in use |
| RNF-CON-03 | CSV data export as an emergency exit and a guarantee against lock-in |

### 7.7 Cost and maintenance — `RNF-CUS`

| ID | Requirement |
| --- | --- |
| RNF-CUS-01 | Operate entirely within free tiers |
| RNF-CUS-02 | Stack maintainable by a single person, using technologies the maintainer already knows |
| RNF-CUS-03 | No paid or restrictively licensed dependencies |

---

## 8. Technical decisions

Decisions grounded in the interview answers. Each records the alternative that was ruled out.

### 8.1 Stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Front-end | **React** with Vite and TypeScript | Explicitly requested; the maintainer can support it |
| Styling | **Tailwind CSS** | Explicitly requested |
| Back-end and database | **Supabase** (PostgreSQL, Auth, Storage) | Requested; the free tier covers auth, database and files with no server of our own |
| Charts | React charting library (e.g. Recharts) | Native responsiveness and a modest data volume |
| PDF | Client-side generation | Avoids a dedicated server; keeps the cost at zero |
| Hosting | **Vercel** | Chosen by the project owner. Free tier, continuous deployment from Git, HTTPS and a subdomain included |
| Version control | **Git, repository on GitHub** | Chosen by the project owner. Integrates directly with Vercel's automatic deployments |

> **TypeScript** was not requested but is adopted as a technical decision. Clinical values, units and
> ranges benefit from explicit types, and the maintenance cost is low for anyone already using React.

### 8.2 Architecture

- **No back-end of our own.** The front-end talks directly to Supabase; security lives in the database's
  RLS policies. This removes a server to maintain and brings the cost to zero.
- **A single patient.** The caregiver is linked to the patient through a link table. The model does not
  attempt to be multi-tenant.
- **Timezone and dates.** Timestamps stored in UTC and displayed in `America/Sao_Paulo`. Daily
  aggregations use the local day, not the UTC day — otherwise a morning reading can land on the wrong
  date.

### 8.3 Authentication

Email and password, with the session persisted in the browser and automatic token refresh (RF-AUT-02).
Magic links were ruled out on request: they would require opening an email on every access.

There is no public sign-up screen. Both accounts are created manually by the administrator.

### 8.4 Decisions awaiting input

| Topic | Status |
| --- | --- |
| Domain (DNS) | Undefined. The app runs on the `.vercel.app` subdomain until a custom domain exists |

### 8.5 Version control and workflow

Repository: `viniciusRadtke/insulin-tracker` on GitHub. Default branch: **`main`**.

#### Branching flow

Nothing is committed directly to `main`. All work follows this cycle:

```
main ──┬── feature/glucose-reading-form ──→ PR ──→ review ──→ merge ──→ main
       └── fix/timezone-daily-aggregation ──→ PR ──→ review ──→ merge ──→ main
```

1. Branch off an up-to-date `main`.
2. Commit incrementally on the branch.
3. Open a pull request with a clear description.
4. **Review by the maintainer is mandatory** before merging.
5. Merge into `main`, which triggers the production deployment on Vercel.

`main` is protected by convention: it represents what is in production and must always be stable.

#### Branch naming

`<type>/<kebab-case-description>`, in English. The type matches the dominant tag of its commits:

```
feature/glucose-reading-form
fix/timezone-daily-aggregation
refactor/extract-chart-period-selector
docs/requirements-document
chore/setup-supabase-client
```

#### Pull requests

- **Title:** same format as a commit message — `[TAG] Short imperative description`.
- **Description**, in English, covering:
  - **What changes** — an objective summary of the change.
  - **Why** — the problem solved or the requirement met, referencing its ID (e.g. `RF-GLI-05`).
  - **How to test** — steps for the reviewer to validate.
  - **Open items** — what was left out and why, when applicable.
- One PR addresses **one subject**. PRs mixing a feature, a refactor and a visual tweak get split.
- Keep PRs small: the smaller the diff, the more effective the review.
- Vercel builds a preview deployment per PR; its link should be used to validate before merging.

#### Commits

- **Small and frequent.** Each commit is a coherent unit of work that leaves the application in a
  working state. Days of work are never bundled into a single commit.
- **Language:** every commit message in technical English, imperative mood.
- **Format:** `[TAG] Short imperative description`

| Tag | Use |
| --- | --- |
| `[FEATURE]` | New user-facing functionality |
| `[FIX]` | Defect correction |
| `[REFACTOR]` | Structural change with no behavior change |
| `[STYLE]` | Layout, spacing and appearance adjustments |
| `[DOCUMENTATION]` | Documentation, README, comments |
| `[CHORE]` | Dependencies, configuration, build tasks |
| `[TEST]` | Test creation or adjustment |
| `[PERFORMANCE]` | Performance optimizations |

Examples:

```
[FEATURE] Add glucose reading form with target range validation
[FIX] Correct daily aggregation to use local timezone instead of UTC
[DOCUMENTATION] Fix one misspelling on README.md
[CHORE] Configure Supabase client and environment variables
```

Message rules:

1. Subject of at most 72 characters, no trailing period.
2. Imperative mood: `Add`, `Fix`, `Remove`, `Update` — never `Added` or `Adding`.
3. State **what** changed and, when not self-evident, **why** — in the commit body, separated from the
   subject by a blank line.
4. No emojis in commit messages.

---

## 9. Interface guidelines

### 9.1 Navigation structure

Destination labels below are the Portuguese UI copy the patient sees (per RNF-LOC-01):

```
Dashboard  (landing)
├── Registrar          → glucose | blood pressure | weight
├── Histórico          → filterable list
├── Gráficos           → glucose | blood pressure | weight, by period
├── Exames             → lab attachments
├── Relatório          → PDF generation
└── Configurações      → ranges, alerts, theme, account
```

On mobile: bottom navigation with the four most-used destinations (Dashboard, Registrar, Histórico,
Gráficos); the rest live under "Mais". On large screens: persistent side navigation.

### 9.2 Visual language for values

| State | Condition | Treatment |
| --- | --- | --- |
| Low | below `alert_low` | Alert color + "Baixo" label + icon |
| Below target | between `alert_low` and `glucose_target_min` | Caution color + "Abaixo do alvo" label |
| In range | inside the target range | Positive color + "Na faixa" label |
| Above target | between `glucose_target_max` and `alert_high` | Caution color + "Acima do alvo" label |
| High | above `alert_high` | Alert color + "Alto" label + icon |

Colors must work in both themes and stay distinguishable under common forms of color blindness — which
is why the text label is mandatory in every state (RNF-USA-05).

### 9.3 Principles

1. **Recording is the primary function.** Everything else is consultation. Visual hierarchy must reflect
   that.
2. **Large numbers, small labels.** The value is the content; the label is context.
3. **No jargon.** "Tempo na faixa", not "TIR". "Média dos últimos 30 dias", not "moving average".
4. **Inform, never prescribe.** The app shows what was measured and classifies it against the range the
   user configured. It recommends no course of action, dosage or treatment change.
5. **Restraint.** This is a health record reviewed at medical appointments, not an entertainment
   product. The interface should read as a discreet, trustworthy instrument.

### 9.4 Visual restraint — mandatory constraints

The interface **must not** exhibit the visual mannerisms typical of automatically generated work. This
is an acceptance constraint, not an aesthetic preference: material with that look reads as careless and
undermines trust in a health application.

**Prohibited:**

| Element | Rule |
| --- | --- |
| Emojis in the interface | **Prohibited** — in headings, buttons, labels, cards, empty states and messages |
| Emojis used as icons | **Prohibited** — use a consistent vector icon library (e.g. Lucide), monochrome and aligned to the text |
| Decorative gradients | Prohibited, especially purple/violet to indigo and vivid background gradients |
| Gradient-filled text | Prohibited |
| Glowing cards or colored shadows | Prohibited — neutral, subtle shadows, and only where they signal real elevation |
| Patterned, mesh or "blob" backgrounds | Prohibited |
| Entrance animations on content elements | Prohibited — transitions only in response to user action |
| Icons or emojis inline in body copy | Prohibited |
| Promotional or enthusiastic copy | Prohibited — no exclamation marks, no "Parabéns!", no praising the user for recording readings |

**Positive guidance:**

- Neutral, restricted palette: grays as the base; color reserved **exclusively** for the clinical
  classification of values (§9.2) and for the primary action.
- A single type family, with hierarchy built from size and weight rather than color.
- Generous whitespace instead of borders, boxes and dividers.
- High information density, low ornamentation: every element on screen must carry data or enable an
  action.
- Short, direct, descriptive copy. "Nenhuma medição registrada" rather than "Ops! Nada por aqui ainda".

> This constraint applies to the interface. Commit messages and documentation follow the same rule on
> emojis.

---

## 10. Roadmap

### Phase 1 — MVP

Every requirement at priority **M**. Delivers an application that is already complete in itself: record,
review, visualize trends and generate the appointment report.

1. Foundation: project setup, Supabase, database schema, RLS, authentication
2. Glucose logging and history
3. Dashboard
4. Blood pressure and weight
5. Charts and settings
6. PDF report

### Phase 2 — Post-MVP

Priorities **S** and **C**, plus what was deferred:

- Lab exams (attachments) — **first item of the phase**
- Reading and medication reminders
- Installable PWA with a home screen icon
- Offline support with synchronization
- Period-over-period comparison and trend aggregation
- CSV export

### Phase 3 — To be assessed

Only if real usage demands them:

- Meal logging and carb counting
- HbA1c estimation from readings — **with a caveat:** the estimate assumes readings spread across the
  whole day. With a single fasting morning reading the number would be misleading and is better left
  unshown
- Caregiver notifications for out-of-range values

---

## 11. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Daily logging abandoned after the first weeks | High — with no data the app loses its reason to exist | Three-interaction entry (RF-GLI-05); a dashboard that returns value immediately; reminders in Phase 2 |
| Default target ranges do not match actual medical guidance | Medium — misleading classification | All ranges configurable (RF-CFG); defaults presented as a starting point, never as a recommendation |
| Diabetes type unconfirmed | Low for the MVP | Current scope does not depend on it; confirm before Phase 3 |
| Data loss from a network failure during entry | High — breaks trust in the app | RNF-CON-01: visible error and the form preserved |
| Supabase free tier limits | Low | Estimated volume: ~400 records/year and a few MB of attachments, far below the limits |
| Project paused for inactivity on the Supabase free tier | Medium | Check the current plan's inactivity policy before deploying |

---

## 12. Open questions

| # | Question | Owner | Blocks |
| --- | --- | --- | --- |
| P-01 | Confirm the diabetes type with the patient or his physician | Project owner | Nothing in the MVP |
| P-02 | Confirm the target ranges prescribed by the physician | Project owner | Nothing — they are configurable |
| P-03 | Define the domain (DNS) | Project owner | Deploying on a custom domain |
| ~~P-04~~ | ~~Choose the hosting provider~~ — resolved 2026-09-08: Vercel | — | — |
| P-05 | Define the product name shown in the interface (currently "Insulin Tracker", the repository name — inaccurate, since the patient does not use insulin) | Project owner | Interface and report |
| P-06 | Confirm whether the report should list exam attachments as an index of names and dates (the adopted decision) or in some other form | Project owner | RF-REL-07 |

---

## 13. Revision history

| Version | Date | Changes |
| --- | --- | --- |
| 1.0 | 2026-09-08 | Initial version, consolidating both rounds of the requirements interview |
| 1.1 | 2026-09-08 | Vercel and GitHub settled as decisions (§8.1); commit convention and versioning workflow (§8.5); visual restraint constraints (§9.4) |
| 1.2 | 2026-09-08 | Branching flow, naming and pull request rules with mandatory review (§8.5) |
| 1.3 | 2026-09-08 | Document translated to technical English and renamed to `REQUIREMENTS.md`; language policy recorded; PR descriptions now written in English (§8.5) |
