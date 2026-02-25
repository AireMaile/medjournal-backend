/**
 * tests/logs/createLog.test.ts
 *
 * Written BEFORE the implementation.
 * These tests define the expected behaviour of POST /users/:user_id/logs.
 */

import request from 'supertest'
import app from '../../src/app'
import { createTestUser, createTestUserMedication, clearDatabase } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'

describe('POST /users/:user_id/logs', () => {
  let userId: string
  let userMedicationId: string
  let authToken: string

  beforeEach(async () => {
    await clearDatabase()
    const user = await createTestUser()
    const med = await createTestUserMedication(user.id)
    userId = user.id
    userMedicationId = med.id
    authToken = generateMockJwt(userId)
  })

  // ─── Happy Paths ────────────────────────────────────────────────

  it('creates a quick log with required fields', async () => {
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
      logDate: '2026-02-25',
      logType: 'QUICK',
      moodScore: 3,
      energyScore: 4,
    })
    expect(res.body.id).toBeDefined()
  })

  it('creates a detailed log with all optional fields', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        logType: 'DETAILED',
        moodScore: 4,
        energyScore: 3,
        sleepQuality: 4,
        sleepHours: 7.5,
        anxietyScore: 2,
        appetiteScore: 4,
        socialMotivation: 3,
        detailedNote: 'Felt steadier today.',
      })

    expect(res.status).toBe(201)
    expect(res.body.logType).toBe('DETAILED')
    expect(res.body.sleepHours).toBe(7.5)
    expect(res.body.detailedNote).toBe('Felt steadier today.')
  })

  it('stores the active userMedicationId on the log', async () => {
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
    expect(res.body.userMedicationId).toBe(userMedicationId)
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
