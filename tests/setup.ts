import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

const envTestPath = resolve(__dirname, '../.env.test')

if (!existsSync(envTestPath)) {
  console.error(`
❌  No .env.test file found.

Tests require a separate test database so they never touch production data.
Copy .env.test.example and fill in your test database credentials:

  cp .env.test.example .env.test

Then edit .env.test with your test Supabase project credentials.
`)
  process.exit(1)
}

config({ path: envTestPath })

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set in .env.test')
  process.exit(1)
}

console.log('🧪 Test environment loaded')
