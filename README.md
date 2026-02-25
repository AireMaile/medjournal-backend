# MedJournal Backend

Backend API for MedJournal — a mood and medication tracking app for people managing depression.

**Stack:** Node.js · TypeScript · Express · Prisma · PostgreSQL (Supabase) · Jest

---

## Project Structure

```
medjournal-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Medication master list seed data
├── src/
│   ├── app.ts                 # Express app setup (no server.listen — for testability)
│   ├── server.ts              # Entry point — starts the server
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── supabase.ts        # Supabase admin client
│   ├── middleware/
│   │   ├── auth.ts            # Supabase JWT verification
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── validate.ts        # Request body validation (Zod)
│   ├── routes/
│   │   ├── index.ts
│   │   ├── users.ts
│   │   ├── medications.ts
│   │   ├── userMedications.ts
│   │   └── logs.ts
│   ├── controllers/
│   │   ├── users.ts
│   │   ├── medications.ts
│   │   ├── userMedications.ts
│   │   └── logs.ts
│   ├── services/
│   │   ├── users.ts
│   │   ├── medications.ts
│   │   ├── userMedications.ts
│   │   └── logs.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── setup.ts
│   ├── helpers/
│   │   ├── auth.ts            # Mock JWT generation for tests
│   │   └── factories.ts       # Test data factories
│   ├── users/
│   │   ├── createUser.test.ts
│   │   ├── getUser.test.ts
│   │   └── updateUser.test.ts
│   ├── medications/
│   │   └── getMedications.test.ts
│   ├── userMedications/
│   │   ├── getUserMedications.test.ts
│   │   ├── addUserMedication.test.ts
│   │   ├── endUserMedication.test.ts
│   │   └── deleteUserMedication.test.ts
│   └── logs/
│       ├── createLog.test.ts
│       ├── getLogs.test.ts
│       ├── updateLog.test.ts
│       └── getLogsSummary.test.ts
├── .env.example
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## Test-Driven Development

This project enforces TDD. **Tests are written before implementation.**

```
1. Write the test → it fails (red)
2. Write the minimum code to pass the test (green)
3. Refactor without breaking tests (refactor)
```

### Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
npm test -- tests/logs/createLog.test.ts
```

### Coverage Requirements

Enforced in CI — PRs cannot merge below these thresholds:

```
Branches:   80%
Functions:  90%
Lines:      90%
Statements: 90%
```

---

## Getting Started

```bash
# Install
npm install

# Configure environment
cp .env.example .env

# Run migrations
npx prisma migrate dev

# Seed medications master list
npx prisma db seed

# Start dev server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
PORT=3000
NODE_ENV=development
```

---

## API

Full route documentation: [`docs/API.md`](./docs/API.md)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled build |
| `npm test` | Run test suite |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint |
| `npm run migrate` | Run Prisma migrations |
| `npm run seed` | Seed medication master list |

---

## Conventions

**Controllers** are thin — parse request, call service, return response.  
**Services** contain all business logic and DB calls.  
**Unit tests** target services directly. **Integration tests** use Supertest against the full Express app.

Errors are always structured and caught by the global `errorHandler`. Score fields (mood, energy, etc.) are validated as integers 1–5 at the Zod layer before reaching controllers.
