# MedJournal API Documentation

**Base URL:** `https://api.medjournal.app/v1`  
**Auth:** All routes except `/medications` (master list) require a valid Supabase JWT in the `Authorization` header.

```
Authorization: Bearer <supabase_jwt>
```

---

## Auth

Handled entirely by **Supabase Auth** on the client side. The iOS app uses the Supabase Swift SDK to register, log in, and obtain a JWT. The backend verifies that JWT on every protected request using Supabase's public key.

No auth endpoints are needed in this backend.

---

## Users

### `POST /users`
Create a user profile after Supabase registration. Called once on first app launch after sign-up.

**Body:**
```json
{
  "id": "supabase-uuid",
  "name": "Chris Cordero",
  "email": "chris@example.com",
  "notificationTime": "08:00"
}
```

**Response `201`:**
```json
{
  "id": "supabase-uuid",
  "name": "Chris Cordero",
  "email": "chris@example.com",
  "notificationTime": "08:00",
  "createdAt": "2026-02-25T00:00:00Z"
}
```

---

### `GET /users/:user_id`
Fetch user profile and preferences.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Chris Cordero",
  "email": "chris@example.com",
  "notificationTime": "08:00"
}
```

---

### `PATCH /users/:user_id`
Update user profile or notification preference.

**Body (all fields optional):**
```json
{
  "name": "Christopher Cordero",
  "notificationTime": "09:00"
}
```

**Response `200`:** Updated user object.

---

## Medications (Master List)

### `GET /medications`
Returns the pre-seeded list of known medications for the app's dropdown/autocomplete. No auth required.

**Query Params:**
- `search` — filter by name, e.g. `?search=sert`
- `category` — filter by type, e.g. `?category=SSRI`

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Sertraline",
    "category": "SSRI",
    "commonDosages": ["25mg", "50mg", "100mg"]
  },
  {
    "id": "uuid",
    "name": "Fluoxetine",
    "category": "SSRI",
    "commonDosages": ["10mg", "20mg", "40mg"]
  }
]
```

---

## User Medications (Prescription History)

### `GET /users/:user_id/medications`
Returns the user's full medication history, ordered by start date descending.

**Query Params:**
- `active=true` — returns only the currently active prescription (no endDate)

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "medicationId": "uuid",
    "customName": null,
    "name": "Sertraline",
    "dosage": "100mg",
    "startDate": "2026-01-15",
    "endDate": null,
    "notes": "Dosage increased from 50mg"
  },
  {
    "id": "uuid",
    "medicationId": "uuid",
    "customName": null,
    "name": "Sertraline",
    "dosage": "50mg",
    "startDate": "2025-11-01",
    "endDate": "2026-01-15",
    "notes": null
  }
]
```

---

### `POST /users/:user_id/medications`
Add a new prescription.

**Body:**
```json
{
  "medicationId": "uuid",
  "dosage": "50mg",
  "startDate": "2026-02-01",
  "notes": "Starting sertraline"
}
```

For a custom medication not in the master list:
```json
{
  "medicationId": null,
  "customName": "Mirtazapine",
  "dosage": "15mg",
  "startDate": "2026-02-01"
}
```

**Response `201`:** Created UserMedication object.

---

### `PATCH /users/:user_id/medications/:medication_id`
Edit a prescription's dosage, notes, or start date.

**Body (all fields optional):**
```json
{
  "dosage": "75mg",
  "notes": "Corrected dosage entry"
}
```

**Response `200`:** Updated UserMedication object.

---

### `PATCH /users/:user_id/medications/:medication_id/end`
End an active prescription. Sets the endDate to today (or a provided date).

**Body (optional):**
```json
{
  "endDate": "2026-02-20",
  "notes": "Dosage increased to 100mg"
}
```

**Response `200`:** Updated UserMedication object with endDate set.

---

### `DELETE /users/:user_id/medications/:medication_id`
Hard delete. Only for entries added by mistake — not for regular medication changes.

**Response `204`:** No content.

---

## Mood Logs

### `GET /users/:user_id/logs`
Fetch mood logs for a user.

**Query Params:**
- `from` — start date e.g. `?from=2026-01-01`
- `to` — end date e.g. `?to=2026-01-31`
- `logDate` — fetch a single day e.g. `?logDate=2026-02-14`

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "logDate": "2026-02-25",
    "logType": "DETAILED",
    "moodScore": 4,
    "energyScore": 3,
    "quickNote": null,
    "sleepQuality": 4,
    "sleepHours": 7.5,
    "anxietyScore": 2,
    "appetiteScore": 4,
    "socialMotivation": 3,
    "detailedNote": "Feeling steadier today.",
    "userMedication": {
      "name": "Sertraline",
      "dosage": "100mg"
    }
  }
]
```

---

### `POST /users/:user_id/logs`
Create a new mood log. Returns `409` if a log already exists for that date.

**Body (Quick Log):**
```json
{
  "logDate": "2026-02-25",
  "logType": "QUICK",
  "moodScore": 3,
  "energyScore": 2,
  "quickNote": "Tired but okay"
}
```

**Body (Detailed Log):**
```json
{
  "logDate": "2026-02-25",
  "logType": "DETAILED",
  "moodScore": 4,
  "energyScore": 3,
  "sleepQuality": 3,
  "sleepHours": 6.5,
  "anxietyScore": 2,
  "appetiteScore": 4,
  "socialMotivation": 3,
  "detailedNote": "Had a good morning. Afternoon felt heavy."
}
```

**Response `201`:** Created MoodLog object.

---

### `PATCH /users/:user_id/logs/:log_id`
Edit a past log. Can upgrade a QUICK log to DETAILED by adding the extra fields.

**Body (all fields optional):**
```json
{
  "moodScore": 4,
  "logType": "DETAILED",
  "sleepHours": 7,
  "detailedNote": "Updated reflection"
}
```

**Response `200`:** Updated MoodLog object.

---

### `GET /users/:user_id/logs/summary`
Aggregated trend data for the chart view. Core insights endpoint.

**Query Params:**
- `from` — required
- `to` — required
- `groupBy` — `day` (default) or `week`

**Response `200`:**
```json
{
  "from": "2026-01-01",
  "to": "2026-02-25",
  "medicationChanges": [
    {
      "date": "2026-01-15",
      "from": "Sertraline 50mg",
      "to": "Sertraline 100mg"
    }
  ],
  "data": [
    {
      "date": "2026-02-25",
      "moodScore": 4.0,
      "energyScore": 3.0,
      "anxietyScore": 2.0,
      "sleepQuality": 3.5,
      "appetiteScore": 4.0,
      "socialMotivation": 3.0
    }
  ]
}
```

---

## Error Responses

```json
{
  "error": {
    "code": "LOG_ALREADY_EXISTS",
    "message": "A log already exists for this date.",
    "status": 409
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated user does not own this resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `LOG_ALREADY_EXISTS` | 409 | Duplicate log for date |
| `VALIDATION_ERROR` | 422 | Missing or invalid fields |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
