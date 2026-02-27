/**
 * tests/logs/createLog.test.ts
 *
 * Integration tests for POST /v1/users/:user_id/logs.
 *
 * Log shape (MVP):
 *   - logDate    (required)
 *   - dosage     (required)
 *   - moodScore  (required, 1–5)
 *   - energyScore (required, 1–5)
 *   - note       (optional)
 */

import request from 'supertest'
import app from '../../src/app'
import { createTestUser, createTestUserMedication, clearDatabase } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'

describe('POST /v1/users/:user_id/logs', () => {
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

  it('creates a log with required fields and returns 201', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        dosage: '50mg',
        moodScore: 3,
        energyScore: 4,
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      moodScore: 3,
      energyScore: 4,
      dosage: '50mg',
    })
    expect(res.body.id).toBeDefined()
  })

  it('creates a log with an optional note', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        dosage: '50mg',
        moodScore: 4,
        energyScore: 3,
        note: 'Felt steadier today.',
      })

    expect(res.status).toBe(201)
    expect(res.body.note).toBe('Felt steadier today.')
  })

  it('creates a log without a note and note is null', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        dosage: '50mg',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(201)
    expect(res.body.note).toBeNull()
  })

  it('stores the active userMedicationId on the log', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        dosage: '50mg',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(201)
    expect(res.body.userMedicationId).toBe(userMedicationId)
  })

  it('stores the dosage on the log', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        logDate: '2026-02-25',
        dosage: '100mg',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(201)
    expect(res.body.dosage).toBe('100mg')
  })

  // ─── Conflict ───────────────────────────────────────────────────

  it('returns 409 if a log already exists for the same date', async () => {
    const payload = {
      logDate: '2026-02-25',
      dosage: '50mg',
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

  it('returns 422 if dosage is missing', async () => {
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
        dosage: '50mg',
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
        dosage: '50mg',
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
        dosage: '50mg',
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
        dosage: '50mg',
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
        dosage: '50mg',
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
        dosage: '50mg',
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
        dosage: '50mg',
        moodScore: 3,
        energyScore: 3,
      })

    expect(res.status).toBe(403)
  })
})
