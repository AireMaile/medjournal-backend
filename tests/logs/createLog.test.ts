/**
 * tests/logs/createLog.test.ts
 *
 * Integration tests for POST /v1/users/:user_id/logs.
 *
 * Log shape:
 *   - logDate      (required)
 *   - logType      (required: QUICK | DETAILED)
 *   - moodScore    (required, 1–5)
 *   - energyScore  (required, 1–5)
 *   - quickNote    (optional)
 *   + detailed fields (optional, for DETAILED logs)
 */

import request from 'supertest'
import app from '../../src/app'
import { createTestUser, clearDatabase } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'

describe('POST /v1/users/:user_id/logs', () => {
  let userId: string
  let authToken: string

  beforeEach(async () => {
    await clearDatabase()
    const user = await createTestUser()
    userId = user.id
    authToken = generateMockJwt(userId)
  })

  // ─── Happy Paths ────────────────────────────────────────────────

  it('creates a QUICK log with required fields and returns 201', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 3,
        energyScore: 4,
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      moodScore: 3,
      energyScore: 4,
      logType: 'QUICK',
    })
    expect(res.body.id).toBeDefined()
  })

  it('creates a log with an optional quickNote', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 4,
        energyScore: 3,
        quickNote: 'Felt steadier today.',
      })

    expect(res.status).toBe(201)
    expect(res.body.quickNote).toBe('Felt steadier today.')
  })

  it('creates a log without a quickNote and quickNote is null', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(201)
    expect(res.body.quickNote).toBeNull()
  })

  it('creates a log without a medication and userMedicationId is null', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(201)
    expect(res.body.userMedicationId).toBeNull()
  })

  it('creates a DETAILED log with all fields', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'DETAILED',
        moodScore: 4,
        energyScore: 3,
        quickNote: 'Overall okay',
        sleepQuality: 3,
        sleepHours: 7.5,
        anxietyScore: 2,
        appetiteScore: 4,
        socialMotivation: 3,
        detailedNote: 'Noticed more energy in the morning.',
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      logType: 'DETAILED',
      sleepQuality: 3,
      sleepHours: 7.5,
      anxietyScore: 2,
      appetiteScore: 4,
      socialMotivation: 3,
      detailedNote: 'Noticed more energy in the morning.',
    })
  })

  // ─── Conflict ───────────────────────────────────────────────────

  it('returns 409 if a log already exists for the same date', async () => {
    const payload = {
      logDate: '2026-02-25',
      logType: 'QUICK',
      moodScore: 3,
      energyScore: 3,
    }

    await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)

    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('LOG_ALREADY_EXISTS')
  })

  // ─── Validation ─────────────────────────────────────────────────

  it('returns 422 if logType is missing', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if moodScore is missing', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        energyScore: 3,
      })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if energyScore is missing', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 3,
      })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if moodScore is out of range (> 5)', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 6,
        energyScore: 3,
      })

    expect(res.status).toBe(422)
  })

  it('returns 422 if moodScore is out of range (< 1)', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 0,
        energyScore: 3,
      })

    expect(res.status).toBe(422)
  })

  it('returns 422 if logDate is not a valid date', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: 'not-a-date',
        logType: 'QUICK',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(422)
  })

  // ─── Auth ────────────────────────────────────────────────────────

  it('returns 401 if no auth token is provided', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)

    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'QUICK',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(403)
  })
})
