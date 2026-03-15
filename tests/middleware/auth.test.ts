/**
 * tests/middleware/auth.test.ts
 *
 * Unit tests for authenticate and authorizeUser middleware.
 * No database or supertest — uses mock req/res/next objects.
 */

import { generateKeyPairSync } from 'crypto'
import jwt from 'jsonwebtoken'
import { authenticate, authorizeUser } from '../../src/middleware/auth'
import { AppError } from '../../src/types'
import { generateMockJwt, generateExpiredJwt } from '../helpers/auth'

const TEST_SECRET = process.env.SUPABASE_JWT_SECRET ?? 'test-secret-key'

function mockReq(overrides: Record<string, any> = {}): any {
  return { headers: {}, params: {}, ...overrides }
}

function mockRes(): any {
  return {}
}

describe('authenticate middleware', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000'

  it('sets req.userId and calls next() for a valid HS256 token', done => {
    const token = generateMockJwt(userId)
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })

    authenticate(req, mockRes(), (err?: any) => {
      expect(err).toBeUndefined()
      expect(req.userId).toBe(userId)
      done()
    })
  })

  it('calls next with 401 AppError when Authorization header is missing', done => {
    const req = mockReq()

    authenticate(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(401)
      done()
    })
  })

  it('calls next with 401 when header has no Bearer prefix', done => {
    const token = generateMockJwt(userId)
    const req = mockReq({ headers: { authorization: token } })

    authenticate(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(401)
      done()
    })
  })

  it('calls next with 401 when token is expired', done => {
    const token = generateExpiredJwt(userId)
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })

    authenticate(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(401)
      done()
    })
  })

  it('calls next with 401 when token has an invalid signature', done => {
    const token = jwt.sign({ sub: userId }, 'wrong-secret', { algorithm: 'HS256' })
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })

    authenticate(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(401)
      done()
    })
  })

  it('calls next with 401 when token has no sub claim', done => {
    const token = jwt.sign({ role: 'authenticated' }, TEST_SECRET, { algorithm: 'HS256' })
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })

    authenticate(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(401)
      expect(err.message).toBe('Invalid token payload')
      done()
    })
  })
})

describe('authenticate middleware — ES256 JWKS fetch', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000'
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('passes an AbortSignal to the JWKS fetch so requests cannot hang indefinitely', async () => {
    let capturedSignal: AbortSignal | null | undefined
    global.fetch = jest.fn().mockImplementation((_url: string, options?: RequestInit) => {
      capturedSignal = options?.signal
      return Promise.reject(new Error('test'))
    }) as any

    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const token = jwt.sign({ sub: userId }, privateKey, { algorithm: 'ES256' } as any)
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })

    await new Promise<void>(resolve => authenticate(req, mockRes(), () => resolve()))

    expect(capturedSignal).toBeInstanceOf(AbortSignal)
  })
})

describe('authorizeUser middleware', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000'

  it('calls next() when req.userId matches req.params.user_id', done => {
    const req = mockReq({ userId, params: { user_id: userId } })

    authorizeUser(req, mockRes(), (err?: any) => {
      expect(err).toBeUndefined()
      done()
    })
  })

  it('calls next with 403 AppError when userId does not match', done => {
    const req = mockReq({ userId, params: { user_id: 'different-id' } })

    authorizeUser(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(403)
      done()
    })
  })

  it('calls next with 403 when req.userId is undefined', done => {
    const req = mockReq({ params: { user_id: userId } })

    authorizeUser(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(403)
      done()
    })
  })
})
