/**
 * tests/medicationLogs/medicationLogs.test.ts
 *
 * Integration tests for the /v1/users/:user_id/medication-logs endpoints.
 *
 * GET    /medication-logs?date=YYYY-MM-DD  → checklist view (active meds + log entries)
 * POST   /medication-logs                  → create a log entry
 * PATCH  /medication-logs/:log_id          → update taken / timeOfDay / notes
 * DELETE /medication-logs/:log_id          → remove an entry
 */

import request from 'supertest'
import app from '../../src/app'
import {
  createTestUser,
  createTestUserMedication,
  createTestMedicationLog,
  clearDatabase,
} from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'

describe('Medication Logs', () => {
  let userId: string
  let authToken: string
  let medicationId: string

  beforeEach(async () => {
    await clearDatabase()
    const user = await createTestUser()
    userId = user.id
    authToken = generateMockJwt(userId)
    const med = await createTestUserMedication(userId, {
      customName: 'Adderall',
      dosage: '10mg',
      startDate: new Date('2026-01-01'),
    })
    medicationId = med.id
  })

  // ─── GET (checklist view) ────────────────────────────────────────

  describe('GET /medication-logs?date=YYYY-MM-DD', () => {
    it('returns active medications with empty logEntries when none are logged', async () => {
      const res = await request(app)
        .get(`/v1/users/${userId}/medication-logs?date=2026-02-25`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].userMedicationId).toBe(medicationId)
      expect(res.body[0].customName).toBe('Adderall')
      expect(res.body[0].logEntries).toEqual([])
    })

    it('includes existing log entries for the date', async () => {
      await createTestMedicationLog(userId, medicationId, {
        logDate: '2026-02-25',
        timeOfDay: 'MORNING',
        taken: true,
      })

      const res = await request(app)
        .get(`/v1/users/${userId}/medication-logs?date=2026-02-25`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body[0].logEntries).toHaveLength(1)
      expect(res.body[0].logEntries[0].timeOfDay).toBe('MORNING')
      expect(res.body[0].logEntries[0].taken).toBe(true)
    })

    it('supports multiple log entries for the same medication on one day', async () => {
      await createTestMedicationLog(userId, medicationId, {
        logDate: '2026-02-25',
        timeOfDay: 'MORNING',
        taken: true,
      })
      await createTestMedicationLog(userId, medicationId, {
        logDate: '2026-02-25',
        timeOfDay: 'AFTERNOON',
        taken: false,
      })

      const res = await request(app)
        .get(`/v1/users/${userId}/medication-logs?date=2026-02-25`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body[0].logEntries).toHaveLength(2)
    })

    it('does not return medications that have ended before the requested date', async () => {
      await createTestUserMedication(userId, {
        customName: 'Lexapro',
        dosage: '20mg',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      })

      const res = await request(app)
        .get(`/v1/users/${userId}/medication-logs?date=2026-02-25`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      // Only Adderall (active) — Lexapro ended before this date
      expect(res.body).toHaveLength(1)
      expect(res.body[0].customName).toBe('Adderall')
    })

    it('returns 401 if no auth token is provided', async () => {
      const res = await request(app)
        .get(`/v1/users/${userId}/medication-logs?date=2026-02-25`)

      expect(res.status).toBe(401)
    })

    it('returns 403 if the token belongs to a different user', async () => {
      const other = await createTestUser()
      const otherToken = generateMockJwt(other.id)

      const res = await request(app)
        .get(`/v1/users/${userId}/medication-logs?date=2026-02-25`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })
  })

  // ─── POST ────────────────────────────────────────────────────────

  describe('POST /medication-logs', () => {
    it('creates a medication log entry and returns 201', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: medicationId,
          logDate: '2026-02-25',
          timeOfDay: 'MORNING',
          taken: true,
        })

      expect(res.status).toBe(201)
      expect(res.body.userMedicationId).toBe(medicationId)
      expect(res.body.timeOfDay).toBe('MORNING')
      expect(res.body.taken).toBe(true)
    })

    it('creates an entry with taken: false (skipped medication)', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: medicationId,
          logDate: '2026-02-25',
          timeOfDay: 'EVENING',
          taken: false,
        })

      expect(res.status).toBe(201)
      expect(res.body.taken).toBe(false)
    })

    it('creates an entry with an optional note', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: medicationId,
          logDate: '2026-02-25',
          timeOfDay: 'MORNING',
          taken: true,
          notes: 'Took with food.',
        })

      expect(res.status).toBe(201)
      expect(res.body.notes).toBe('Took with food.')
    })

    it('allows multiple entries for the same medication on the same day', async () => {
      const first = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userMedicationId: medicationId, logDate: '2026-02-25', timeOfDay: 'MORNING', taken: true })

      const second = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userMedicationId: medicationId, logDate: '2026-02-25', timeOfDay: 'AFTERNOON', taken: false })

      expect(first.status).toBe(201)
      expect(second.status).toBe(201)
      expect(first.body.id).not.toBe(second.body.id)
    })

    it('returns 404 if the medication does not belong to the user', async () => {
      const otherUser = await createTestUser()
      const otherMed = await createTestUserMedication(otherUser.id)

      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: otherMed.id,
          logDate: '2026-02-25',
          timeOfDay: 'MORNING',
          taken: true,
        })

      expect(res.status).toBe(404)
    })

    it('returns 422 if timeOfDay is invalid', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: medicationId,
          logDate: '2026-02-25',
          timeOfDay: 'MIDNIGHT',
          taken: true,
        })

      expect(res.status).toBe(422)
    })

    it('returns 422 if taken is missing', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: medicationId,
          logDate: '2026-02-25',
          timeOfDay: 'MORNING',
        })

      expect(res.status).toBe(422)
    })

    it('returns 422 if userMedicationId is not a valid UUID', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userMedicationId: 'not-a-uuid',
          logDate: '2026-02-25',
          timeOfDay: 'MORNING',
          taken: true,
        })

      expect(res.status).toBe(422)
    })

    it('returns 401 if no auth token is provided', async () => {
      const res = await request(app)
        .post(`/v1/users/${userId}/medication-logs`)
        .send({ userMedicationId: medicationId, logDate: '2026-02-25', timeOfDay: 'MORNING', taken: true })

      expect(res.status).toBe(401)
    })
  })

  // ─── PATCH ───────────────────────────────────────────────────────

  describe('PATCH /medication-logs/:log_id', () => {
    it('updates taken to true', async () => {
      const log = await createTestMedicationLog(userId, medicationId, { taken: false })

      const res = await request(app)
        .patch(`/v1/users/${userId}/medication-logs/${log.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ taken: true })

      expect(res.status).toBe(200)
      expect(res.body.taken).toBe(true)
    })

    it('updates timeOfDay', async () => {
      const log = await createTestMedicationLog(userId, medicationId, { timeOfDay: 'MORNING' })

      const res = await request(app)
        .patch(`/v1/users/${userId}/medication-logs/${log.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ timeOfDay: 'AFTERNOON' })

      expect(res.status).toBe(200)
      expect(res.body.timeOfDay).toBe('AFTERNOON')
    })

    it('updates notes', async () => {
      const log = await createTestMedicationLog(userId, medicationId)

      const res = await request(app)
        .patch(`/v1/users/${userId}/medication-logs/${log.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Took late.' })

      expect(res.status).toBe(200)
      expect(res.body.notes).toBe('Took late.')
    })

    it('returns 404 if log does not exist', async () => {
      const res = await request(app)
        .patch(`/v1/users/${userId}/medication-logs/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ taken: true })

      expect(res.status).toBe(404)
    })

    it('returns 404 if log belongs to a different user', async () => {
      const otherUser = await createTestUser()
      const otherMed = await createTestUserMedication(otherUser.id)
      const otherLog = await createTestMedicationLog(otherUser.id, otherMed.id)

      const res = await request(app)
        .patch(`/v1/users/${userId}/medication-logs/${otherLog.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ taken: true })

      expect(res.status).toBe(404)
    })

    it('returns 401 if no auth token is provided', async () => {
      const log = await createTestMedicationLog(userId, medicationId)

      const res = await request(app)
        .patch(`/v1/users/${userId}/medication-logs/${log.id}`)
        .send({ taken: true })

      expect(res.status).toBe(401)
    })
  })

  // ─── DELETE ──────────────────────────────────────────────────────

  describe('DELETE /medication-logs/:log_id', () => {
    it('deletes a medication log and returns 204', async () => {
      const log = await createTestMedicationLog(userId, medicationId)

      const res = await request(app)
        .delete(`/v1/users/${userId}/medication-logs/${log.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })

    it('returns 404 if log does not exist', async () => {
      const res = await request(app)
        .delete(`/v1/users/${userId}/medication-logs/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })

    it('returns 404 if log belongs to a different user', async () => {
      const otherUser = await createTestUser()
      const otherMed = await createTestUserMedication(otherUser.id)
      const otherLog = await createTestMedicationLog(otherUser.id, otherMed.id)

      const res = await request(app)
        .delete(`/v1/users/${userId}/medication-logs/${otherLog.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })

    it('returns 401 if no auth token is provided', async () => {
      const log = await createTestMedicationLog(userId, medicationId)

      const res = await request(app)
        .delete(`/v1/users/${userId}/medication-logs/${log.id}`)

      expect(res.status).toBe(401)
    })
  })
})
