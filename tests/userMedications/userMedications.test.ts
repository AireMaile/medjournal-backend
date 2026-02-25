/**
 * tests/userMedications/userMedications.test.ts
 *
 * Integration tests for user medication routes.
 * All tests use customName to avoid dependency on the medications master list.
 *
 * Covers:
 *   GET    /v1/users/:user_id/medications
 *   POST   /v1/users/:user_id/medications
 *   PATCH  /v1/users/:user_id/medications/:id
 *   PATCH  /v1/users/:user_id/medications/:id/end
 *   DELETE /v1/users/:user_id/medications/:id
 */

import request from 'supertest'
import app from '../../src/app'
import { clearDatabase, createTestUser, createTestUserMedication } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'
import { v4 as uuid } from 'uuid'

beforeEach(async () => {
  await clearDatabase()
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/users/:user_id/medications
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /v1/users/:user_id/medications', () => {

  it('returns all medications for a user', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })
    await createTestUserMedication(user.id, { customName: 'Fluoxetine', dosage: '20mg', endDate: new Date() })

    const res = await request(app)
      .get(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(2)
  })

  it('returns an empty array if the user has no medications', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .get(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('filters to active medications only with ?active=true', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })
    await createTestUserMedication(user.id, { customName: 'Fluoxetine', dosage: '20mg', endDate: new Date() })

    const res = await request(app)
      .get(`/v1/users/${user.id}/medications?active=true`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].customName).toBe('Sertraline')
    expect(res.body[0].endDate).toBeNull()
  })

  it('does not return medications belonging to another user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const token = generateMockJwt(user.id)

    await createTestUserMedication(otherUser.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .get(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .get(`/v1/users/${user.id}/medications`)

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)

    const res = await request(app)
      .get(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/users/:user_id/medications
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /v1/users/:user_id/medications', () => {

  it('creates a medication with a customName and returns 201', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customName: 'Sertraline',
        dosage: '50mg',
        startDate: '2026-01-01',
        notes: 'Starting low',
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      customName: 'Sertraline',
      dosage: '50mg',
      notes: 'Starting low',
    })
    expect(res.body.endDate).toBeNull()
    expect(res.body.id).toBeDefined()
  })

  it('creates a medication without optional notes', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customName: 'Sertraline',
        dosage: '50mg',
        startDate: '2026-01-01',
      })

    expect(res.status).toBe(201)
    expect(res.body.notes).toBeNull()
  })

  it('returns 422 if neither customName nor medicationId is provided', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        dosage: '50mg',
        startDate: '2026-01-01',
      })

    expect(res.status).toBe(422)
  })

  it('returns 422 if dosage is missing', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customName: 'Sertraline',
        startDate: '2026-01-01',
      })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if startDate is missing', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customName: 'Sertraline',
        dosage: '50mg',
      })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if startDate is not a valid date', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customName: 'Sertraline',
        dosage: '50mg',
        startDate: 'not-a-date',
      })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .send({ customName: 'Sertraline', dosage: '50mg', startDate: '2026-01-01' })

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)

    const res = await request(app)
      .post(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ customName: 'Sertraline', dosage: '50mg', startDate: '2026-01-01' })

    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /v1/users/:user_id/medications/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /v1/users/:user_id/medications/:id', () => {

  it('updates the dosage', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dosage: '100mg' })

    expect(res.status).toBe(200)
    expect(res.body.dosage).toBe('100mg')
  })

  it('updates the notes', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Tolerating well' })

    expect(res.status).toBe(200)
    expect(res.body.notes).toBe('Tolerating well')
  })

  it('returns 404 if the medication does not exist', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dosage: '100mg' })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 404 if the medication belongs to another user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(otherUser.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dosage: '100mg' })

    expect(res.status).toBe(404)
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()
    const med = await createTestUserMedication(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}`)
      .send({ dosage: '100mg' })

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)
    const med = await createTestUserMedication(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ dosage: '100mg' })

    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /v1/users/:user_id/medications/:id/end
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /v1/users/:user_id/medications/:id/end', () => {

  it('ends an active medication with a provided endDate', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({ endDate: '2026-02-25' })

    expect(res.status).toBe(200)
    expect(res.body.endDate).not.toBeNull()
  })

  it('defaults endDate to today if not provided', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.endDate).not.toBeNull()

    const endDate = new Date(res.body.endDate)
    const today = new Date()
    expect(endDate.toDateString()).toBe(today.toDateString())
  })

  it('returns 422 if the medication is already ended', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, {
      customName: 'Sertraline',
      dosage: '50mg',
      endDate: new Date('2026-01-15'),
    })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 if the medication does not exist', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${uuid()}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(404)
  })

  it('returns 404 if the medication belongs to another user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(otherUser.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}/end`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(404)
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()
    const med = await createTestUserMedication(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}/end`)
      .send({})

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)
    const med = await createTestUserMedication(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}/medications/${med.id}/end`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({})

    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /v1/users/:user_id/medications/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /v1/users/:user_id/medications/:id', () => {

  it('deletes a medication and returns 204', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })

    const res = await request(app)
      .delete(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('the medication is gone after deletion', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(user.id, { customName: 'Sertraline', dosage: '50mg' })

    await request(app)
      .delete(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${token}`)

    const check = await request(app)
      .get(`/v1/users/${user.id}/medications`)
      .set('Authorization', `Bearer ${token}`)

    expect(check.body).toHaveLength(0)
  })

  it('returns 404 if the medication does not exist', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .delete(`/v1/users/${user.id}/medications/${uuid()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 404 if the medication belongs to another user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const token = generateMockJwt(user.id)
    const med = await createTestUserMedication(otherUser.id)

    const res = await request(app)
      .delete(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()
    const med = await createTestUserMedication(user.id)

    const res = await request(app)
      .delete(`/v1/users/${user.id}/medications/${med.id}`)

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)
    const med = await createTestUserMedication(user.id)

    const res = await request(app)
      .delete(`/v1/users/${user.id}/medications/${med.id}`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })
})