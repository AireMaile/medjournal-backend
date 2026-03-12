/**
 * tests/logs/createLog.test.ts
 *
 * Integration tests for POST /v1/users/:user_id/logs.
 *
 * All scored fields are optional — a user can submit a log with just a date.
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

  it('creates a log with only logDate and returns 201', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25' })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.moodScore).toBeNull()
    expect(res.body.energyScore).toBeNull()
    expect(res.body.logType).toBeNull()
  })

  it('creates a log with mood and energy scores', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25', moodScore: 3, energyScore: 4 })

    expect(res.status).toBe(201)
    expect(res.body.moodScore).toBe(3)
    expect(res.body.energyScore).toBe(4)
    expect(res.body.overallScore).not.toBeNull()
  })

  it('creates a log with only a quickNote and no scores', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25', quickNote: 'Hard day, could not do much.' })

    expect(res.status).toBe(201)
    expect(res.body.quickNote).toBe('Hard day, could not do much.')
    expect(res.body.moodScore).toBeNull()
  })

  it('creates a log with all optional fields', async () => {
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

  it('returns overallScore as null when no scores are provided', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25' })

    expect(res.status).toBe(201)
    expect(res.body.overallScore).toBeNull()
  })

  it('computes overallScore from a single score when only one is provided', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25', moodScore: 4 })

    expect(res.status).toBe(201)
    expect(res.body.overallScore).toBe(4)
  })

  it('does not include userMedicationId or medicationAdherence fields', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25', moodScore: 3, energyScore: 3 })

    expect(res.status).toBe(201)
    expect(res.body.userMedicationId).toBeUndefined()
    expect(res.body.medicationAdherence).toBeUndefined()
  })

  // ─── Conflict ───────────────────────────────────────────────────

  it('returns 409 if a log already exists for the same date', async () => {
    await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25' })

    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25' })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('LOG_ALREADY_EXISTS')
  })

  // ─── Validation ─────────────────────────────────────────────────

  it('returns 422 if logDate is missing', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 3 })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if logDate is not a valid date', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: 'not-a-date' })

    expect(res.status).toBe(422)
  })

  it('returns 422 if moodScore is out of range (> 5)', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25', moodScore: 6 })

    expect(res.status).toBe(422)
  })

  it('returns 422 if moodScore is out of range (< 1)', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ logDate: '2026-02-25', moodScore: 0 })

    expect(res.status).toBe(422)
  })

  // ─── Auth ────────────────────────────────────────────────────────

  it('returns 401 if no auth token is provided', async () => {
    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .send({ logDate: '2026-02-25' })

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)

    const res = await request(app)
      .post(`/v1/users/${userId}/logs`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ logDate: '2026-02-25' })

    expect(res.status).toBe(403)
  })
})
