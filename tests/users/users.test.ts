/**
 * tests/users/users.test.ts
 *
 * Integration tests for all user routes.
 * Written before implementation is verified — TDD style.
 *
 * Covers:
 *   POST   /v1/users
 *   GET    /v1/users/:user_id
 *   PATCH  /v1/users/:user_id
 */

import request from 'supertest'
import app from '../../src/app'
import { clearDatabase, createTestUser } from '../helpers/factories'
import { generateMockJwt } from '../helpers/auth'
import { v4 as uuid } from 'uuid'

beforeEach(async () => {
  await clearDatabase()
})

// ───────────────────────────────────────────────────────────────────────────────
// POST /v1/users
// ───────────────────────────────────────────────────────────────────────────────

describe('POST /v1/users', () => {

  // ─── Happy Path ───────────────────────────────────────────────────────────

  it('creates a user and returns 201 with the user object', async () => {
    const id = uuid()

    const res = await request(app)
      .post('/v1/users')
      .send({
        id,
        name: 'Chris Cordero',
        email: 'chris@example.com',
        notificationTime: '08:00',
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id,
      name: 'Chris Cordero',
      email: 'chris@example.com',
      notificationTime: '08:00',
    })
    expect(res.body.createdAt).toBeDefined()
  })

  it('creates a user without an optional notificationTime', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({
        id: uuid(),
        name: 'Chris Cordero',
        email: 'chris@example.com',
      })

    expect(res.status).toBe(201)
    expect(res.body.notificationTime).toBeNull()
  })

  // ─── Already Exists ──────────────────────────────────────────────────────────

  it('returns an error if the email already exists', async () => {
    const payload = {
      id: uuid(),
      name: 'Chris Cordero',
      email: 'chris@example.com',
    }

    await request(app).post('/v1/users').send(payload)

    const res = await request(app)
      .post('/v1/users')
      .send({ ...payload, id: uuid() })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('returns an error if the id already exists', async () => {
    const id = uuid()
    const payload = { id, name: 'Chris Cordero', email: 'chris@example.com' }

    await request(app).post('/v1/users').send(payload)

    const res = await request(app)
      .post('/v1/users')
      .send({ ...payload, email: 'other@example.com' })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  // ─── Missing Required Fields ───────────────────────────────────────────────────────

  it('returns 422 if id is missing', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ name: 'Chris Cordero', email: 'chris@example.com' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if name is missing', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), email: 'chris@example.com' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if email is missing', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), name: 'Chris Cordero' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  // ─── Invalid Field Values ──────────────────────────────────────────────────────────

  it('returns 422 if id is not a valid UUID', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: 'not-a-uuid', name: 'Chris Cordero', email: 'chris@example.com' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if email is not a valid email address', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), name: 'Chris Cordero', email: 'not-an-email' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if name is an empty string', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), name: '', email: 'chris@example.com' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if name is only whitespace', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), name: '   ', email: 'chris@example.com' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if notificationTime is in an invalid format', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), name: 'Chris Cordero', email: 'chris@example.com', notificationTime: '8am' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('accepts a name with special characters', async () => {
    const res = await request(app)
      .post('/v1/users')
      .send({ id: uuid(), name: "María José O'Brien", email: 'maria@example.com' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe("María José O'Brien")
  })
})

// ───────────────────────────────────────────────────────────────────────────────
// GET /v1/users/:user_id
// ───────────────────────────────────────────────────────────────────────────────

describe('GET /v1/users/:user_id', () => {

  it('returns the user profile', async () => {
    const user = await createTestUser({ name: 'Chris Cordero', email: 'chris@example.com' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .get(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: user.id,
      name: 'Chris Cordero',
      email: 'chris@example.com',
    })
  })

  it('returns 404 if the user does not exist', async () => {
    const fakeId = uuid()
    const token = generateMockJwt(fakeId)

    const res = await request(app)
      .get(`/v1/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .get(`/v1/users/${user.id}`)

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)

    const res = await request(app)
      .get(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('returns 401 if the token is expired', async () => {
    const user = await createTestUser()

    const expiredToken = require('jsonwebtoken').sign(
      { sub: user.id },
      process.env.SUPABASE_JWT_SECRET ?? 'test-secret-key',
      { expiresIn: '-1s' }
    )

    const res = await request(app)
      .get(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${expiredToken}`)

    expect(res.status).toBe(401)
  })
})

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /v1/users/:user_id
// ───────────────────────────────────────────────────────────────────────────────

describe('PATCH /v1/users/:user_id', () => {

  it('updates the user name', async () => {
    const user = await createTestUser({ name: 'Chris Cordero' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Christopher Cordero' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Christopher Cordero')
  })

  it('updates the notification time', async () => {
    const user = await createTestUser({ notificationTime: '08:00' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationTime: '09:30' })

    expect(res.status).toBe(200)
    expect(res.body.notificationTime).toBe('09:30')
  })

  it('only updates provided fields, leaving others unchanged', async () => {
    const user = await createTestUser({ name: 'Chris Cordero', notificationTime: '08:00' })
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationTime: '21:00' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Chris Cordero')
    expect(res.body.notificationTime).toBe('21:00')
  })

  it('returns 404 if the user does not exist', async () => {
    const fakeId = uuid()
    const token = generateMockJwt(fakeId)

    const res = await request(app)
      .patch(`/v1/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' })

    expect(res.status).toBe(404)
  })

  it('returns 422 if name is an empty string', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if notificationTime format is invalid', async () => {
    const user = await createTestUser()
    const token = generateMockJwt(user.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationTime: '9pm' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 if no token is provided', async () => {
    const user = await createTestUser()

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .send({ name: 'No Auth' })

    expect(res.status).toBe(401)
  })

  it('returns 403 if the token belongs to a different user', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const otherToken = generateMockJwt(otherUser.id)

    const res = await request(app)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hacker' })

    expect(res.status).toBe(403)
  })
})
