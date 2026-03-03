# MedJournal Backend

Backend API for MedJournal — a mood and medication tracking app for people managing depression.

**Stack:** Node.js · TypeScript · Express · Prisma · PostgreSQL (Supabase)

---

## Local Setup

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

For tests, create a separate Supabase project and configure `.env.test`:

```bash
cp .env.test.example .env.test
# Update DATABASE_URL to point to your test database
npm test
```

---

## Routes

All routes require a Supabase JWT in the `Authorization: Bearer <token>` header unless noted.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server health check. No auth required. |

### Profile

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/profile` | Returns the authenticated user's profile. |
| `PATCH` | `/v1/profile` | Updates `name` and/or `notificationTime` (HH:MM). |

### User Medications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/users/:user_id/medications` | Returns all medications for the user. Add `?active=true` to return only active (no end date). |
| `POST` | `/v1/users/:user_id/medications` | Adds a new medication. Required: `customName`, `dosage`, `startDate`. |
| `PATCH` | `/v1/users/:user_id/medications/:medication_id` | Updates a medication record. All fields optional. |
| `PATCH` | `/v1/users/:user_id/medications/:medication_id/end` | Ends an active medication. Sets `endDate` to today if not provided. |
| `DELETE` | `/v1/users/:user_id/medications/:medication_id` | Permanently deletes a medication record. |

Medication history is preserved by ending records rather than overwriting them — this keeps trend analysis accurate across medication changes.

### Mood Logs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/users/:user_id/logs/summary` | Aggregated trend data. Defaults to last 30 days. Accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD`. |
| `GET` | `/v1/users/:user_id/logs` | Returns all logs. Accepts `?from`, `?to`, and `?logDate` filters. |
| `POST` | `/v1/users/:user_id/logs` | Creates a log. One log per day per user. |
| `PATCH` | `/v1/users/:user_id/logs/:log_id` | Updates an existing log. All fields optional. |

**Log types:**
- `QUICK` — requires `logDate`, `logType`, `moodScore`, `energyScore`
- `DETAILED` — same as QUICK plus optional: `sleepQuality`, `sleepHours`, `anxietyScore`, `appetiteScore`, `socialMotivation`, `detailedNote`

All scores are integers 1–5. `sleepHours` is a float 0–24.

---

## Database Schema

### `profiles`
Linked to Supabase `auth.users` by UUID. Rows are created automatically via a database trigger on signup.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` | Primary key — Supabase auth UUID |
| `name` | `String` | Defaults to `""` |
| `notificationTime` | `String?` | HH:MM format |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### `user_medications`
A user's personal prescription history. Free-text — no master list.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` | UUID |
| `userId` | `String` | FK → `profiles.id` (cascade delete) |
| `customName` | `String?` | Free-text medication name |
| `dosage` | `String` | e.g. `"50mg"` |
| `startDate` | `DateTime` | |
| `endDate` | `DateTime?` | Null means currently active |
| `notes` | `String?` | |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### `mood_logs`
One log per user per day.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` | UUID |
| `userId` | `String` | FK → `profiles.id` (cascade delete) |
| `userMedicationId` | `String?` | FK → `user_medications.id` (set null on delete) |
| `logDate` | `DateTime` | Unique per user |
| `logType` | `String` | `QUICK` or `DETAILED` |
| `moodScore` | `Int` | 1–5 |
| `energyScore` | `Int` | 1–5 |
| `quickNote` | `String?` | |
| `sleepQuality` | `Int?` | 1–5, DETAILED only |
| `sleepHours` | `Float?` | 0–24, DETAILED only |
| `anxietyScore` | `Int?` | 1–5, DETAILED only |
| `appetiteScore` | `Int?` | 1–5, DETAILED only |
| `socialMotivation` | `Int?` | 1–5, DETAILED only |
| `detailedNote` | `String?` | DETAILED only |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |
