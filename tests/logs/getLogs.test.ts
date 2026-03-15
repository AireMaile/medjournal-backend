/**
 * tests/logs/getLogs.test.ts
 *
 * Integration tests for GET /v1/users/:user_id/logs
 */

import request from 'supertest'
import app from '../../src/app'
import {
  createTestUser,
  createTestLog,
  createTestUserMedication,
  createTestMedicationLog,
  clearDatabase,
} from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'

describe('GET /v1/users/:user_id/logs', () => {
  let userId: string
  let authToken: string

  beforeEach(async () => {
    await clearDatabase()
    const user = await createTestUser()
    userId = user.id
    authToken = generateMockJwt(userId)
  })

  // ─── Happy Paths ────────────────────────────────────────────────

  it('returns all logs with no date filter when no query params provided', async () => {
    await createTestLog(userId, { logDate: '2026-01-01' })
    await createTestLog(userId, { logDate: '2025-06-15' })
    await createTestLog(userId, { logDate: '2024-03-10' })

    const res = await request(app)
      .get(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(3)
  })

  it('returns empty array when user has no logs', async () => {
    const res = await request(app)
      .get(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('filters logs by date range when from and to are provided', async () => {
    await createTestLog(userId, { logDate: '2026-01-10' })
    await createTestLog(userId, { logDate: '2026-02-15' })
    await createTestLog(userId, { logDate: '2026-03-20' })

    const res = await request(app)
      .get(`/v1/users/${userId}/logs?from=2026-01-01&to=2026-02-28`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('returns a single log when logDate param matches', async () => {
    await createTestLog(userId, { logDate: '2026-02-25' })
    await createTestLog(userId, { logDate: '2026-02-26' })

    const res = await request(app)
      .get(`/v1/users/${userId}/logs?logDate=2026-02-25`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].medicationLogs).toBeDefined()
  })

  it('each log includes a medicationLogs array', async () => {
    await createTestLog(userId, { logDate: '2026-02-25' })

    const res = await request(app)
      .get(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body[0].medicationLogs).toEqual([])
  })

  it('medicationLogs array is populated when medication logs exist for the same date', async () => {
    await createTestLog(userId, { logDate: '2026-02-25' })
    const med = await createTestUserMedication(userId)
    await createTestMedicationLog(userId, med.id, { logDate: '2026-02-25', taken: true })

    const res = await request(app)
      .get(`/v1/users/${userId}/logs?logDate=2026-02-25`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body[0].medicationLogs).toHaveLength(1)
    expect(res.body[0].medicationLogs[0].taken).toBe(true)
  })

  // ─── Auth ────────────────────────────────────────────────────────

  it('returns 401 if no auth token is provided', async () => {
    const res = await request(app).get(`/v1/users/${userId}/logs`)
    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const other = await createTestUser()
    const otherToken = generateMockJwt(other.id)

    const res = await request(app)
      .get(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })
})

describe('GET /v1/users/:user_id/logs/summary', () => {
  let userId: string
  let authToken: string

  beforeEach(async () => {
    await clearDatabase()
    const user = await createTestUser()
    userId = user.id
    authToken = generateMockJwt(userId)
  })

  // ─── Happy Paths ────────────────────────────────────────────────

  it('returns correct shape with from, to, data, and medicationChanges keys', async () => {
    const res = await request(app)
      .get(`/v1/users/${userId}/logs/summary`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('from')
    expect(res.body).toHaveProperty('to')
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('medicationChanges')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(Array.isArray(res.body.medicationChanges)).toBe(true)
  })

  it('returns empty data and medicationChanges arrays when no logs exist', async () => {
    const res = await request(app)
      .get(`/v1/users/${userId}/logs/summary`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.medicationChanges).toEqual([])
  })

  it('returns from and to matching the provided date range params', async () => {
    const res = await request(app)
      .get(`/v1/users/${userId}/logs/summary?from=2026-01-01&to=2026-01-31`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body.from).toBe('2026-01-01')
    expect(res.body.to).toBe('2026-01-31')
  })

  it('data entries include date, moodScore, and energyScore fields', async () => {
    await createTestLog(userId, { logDate: '2026-01-15', moodScore: 3, energyScore: 4 })

    const res = await request(app)
      .get(`/v1/users/${userId}/logs/summary?from=2026-01-01&to=2026-01-31`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toMatchObject({
      date: '2026-01-15',
      moodScore: 3,
      energyScore: 4,
    })
  })

  // ─── Auth ────────────────────────────────────────────────────────

  it('returns 401 if no auth token is provided', async () => {
    const res = await request(app).get(`/v1/users/${userId}/logs/summary`)
    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const other = await createTestUser()
    const otherToken = generateMockJwt(other.id)

    const res = await request(app)
      .get(`/v1/users/${userId}/logs/summary`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })
})
