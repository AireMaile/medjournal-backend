/**
 * tests/profile/profile.test.ts
 *
 * Integration tests for the profile routes.
 * Profile rows are created automatically by a Supabase trigger on signup —
 * in tests we create them directly via the factory.
 *
 * Covers:
 *   GET   /v1/profile
 *   PATCH /v1/profile
 */

import request from 'supertest'
import app from '../../src/app'
import { clearDatabase, createTestUser } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'
import { v4 as uuid } from 'uuid'

beforeEach(async () => {
  await clearDatabase()
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /v1/profile', () => {

  it('returns the profile for the authenticated user', async () => {
    const user = await createTestUser({ name: 'Chris Cordero', notificationTime: '08:00' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .get('/v1/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: user.id,
      name: 'Chris Cordero',
      notificationTime: '08:00',
    })
    expect(res.body.createdAt).toBeDefined()
  })

  it('returns 404 if no profile exists for the token user', async () => {
    const token = generateMockJwt(uuid()) // valid token but no profile row

    const res = await request(app)
      .get('/v1/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 401 if no token is provided', async () => {
    const res = await request(app).get('/v1/profile')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 if the token is expired', async () => {
    const user = await createTestUser()
    const expiredToken = require('jsonwebtoken').sign(
      { sub: user.id },
      process.env.SUPABASE_JWT_SECRET ?? 'test-secret-key',
      { expiresIn: '-1s' }
    )

    const res = await request(app)
      .get('/v1/profile')
      .set('Authorization', `Bearer ${expiredToken}`)

    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /v1/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /v1/profile', () => {

  it('updates the name', async () => {
    const user = await createTestUser({ name: 'Chris Cordero' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Christopher Cordero' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Christopher Cordero')
  })

  it('updates the notification time', async () => {
    const user = await createTestUser({ notificationTime: '08:00' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationTime: '09:30' })

    expect(res.status).toBe(200)
    expect(res.body.notificationTime).toBe('09:30')
  })

  it('only updates provided fields, leaving others unchanged', async () => {
    const user = await createTestUser({ name: 'Chris Cordero', notificationTime: '08:00' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationTime: '21:00' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Chris Cordero')
    expect(res.body.notificationTime).toBe('21:00')
  })

  it('returns 404 if no profile exists for the token user', async () => {
    const token = generateMockJwt(uuid())

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' })

    expect(res.status).toBe(404)
  })

  it('returns 422 if name is an empty string', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if name is only whitespace', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if notificationTime format is invalid', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch('/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationTime: '9pm' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 if no token is provided', async () => {
    const res = await request(app)
      .patch('/v1/profile')
      .send({ name: 'No Auth' })

    expect(res.status).toBe(401)
  })
})
