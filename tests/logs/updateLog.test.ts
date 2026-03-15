/**
 * tests/logs/updateLog.test.ts
 *
 * Integration tests for PATCH /v1/users/:user_id/logs/:log_id
 */

import request from 'supertest'
import app from '../../src/app'
import { createTestUser, createTestLog, clearDatabase } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'

describe('PATCH /v1/users/:user_id/logs/:log_id', () => {
  let userId: string
  let authToken: string

  beforeEach(async () => {
    await clearDatabase()
    const user = await createTestUser()
    userId = user.id
    authToken = generateMockJwt(userId)
  })

  // ─── Happy Paths ────────────────────────────────────────────────

  it('updates a mood score field and returns the updated log', async () => {
    const log = await createTestLog(userId, { logDate: '2026-02-25', moodScore: 2 })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 5 })

    expect(res.status).toBe(200)
    expect(res.body.moodScore).toBe(5)
  })

  it('partial update leaves other fields unchanged', async () => {
    const log = await createTestLog(userId, { logDate: '2026-02-25', moodScore: 3, energyScore: 4 })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 5 })

    expect(res.status).toBe(200)
    expect(res.body.moodScore).toBe(5)
    expect(res.body.energyScore).toBe(4)
  })

  it('recomputes overallScore after update', async () => {
    // createTestLog does not compute overallScore — seed a log with moodScore only,
    // then verify PATCH changes overallScore to match the new value
    const log = await createTestLog(userId, { logDate: '2026-02-25', moodScore: 2 })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 4 })

    expect(res.status).toBe(200)
    expect(res.body.overallScore).toBe(4)
  })

  it('updates a note field', async () => {
    const log = await createTestLog(userId, { logDate: '2026-02-25' })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quickNote: 'Feeling better today' })

    expect(res.status).toBe(200)
    expect(res.body.quickNote).toBe('Feeling better today')
  })

  // ─── Error Cases ─────────────────────────────────────────────────

  it('returns 404 if log does not exist', async () => {
    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 3 })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 404 if log belongs to a different user', async () => {
    const other = await createTestUser()
    const log = await createTestLog(other.id, { logDate: '2026-02-25' })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 3 })

    expect(res.status).toBe(404)
  })

  it('returns 422 if a score is out of range', async () => {
    const log = await createTestLog(userId, { logDate: '2026-02-25' })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ moodScore: 6 })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  // ─── Auth ────────────────────────────────────────────────────────

  it('returns 401 if no auth token is provided', async () => {
    const log = await createTestLog(userId, { logDate: '2026-02-25' })

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .send({ moodScore: 3 })

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const log = await createTestLog(userId, { logDate: '2026-02-25' })
    const other = await createTestUser()
    const otherToken = generateMockJwt(other.id)

    const res = await request(app)
      .patch(`/v1/users/${userId}/logs/${log.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ moodScore: 3 })

    expect(res.status).toBe(403)
  })
})
