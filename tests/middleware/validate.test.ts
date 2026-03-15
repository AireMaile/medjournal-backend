/**
 * tests/middleware/validate.test.ts
 *
 * Unit tests for the validate middleware.
 * No database or supertest — uses mock req/res/next objects.
 */

import { z } from 'zod'
import { validate } from '../../src/middleware/validate'
import { AppError } from '../../src/types'

const testSchema = z.object({ name: z.string() })

function mockReq(body: unknown): any {
  return { body }
}

function mockRes(): any {
  return {}
}

describe('validate middleware', () => {
  it('calls next() with no args when body matches schema', done => {
    const req = mockReq({ name: 'test' })
    const middleware = validate(testSchema)

    middleware(req, mockRes(), (err?: any) => {
      expect(err).toBeUndefined()
      done()
    })
  })

  it('replaces req.body with the validated (parsed) data', done => {
    const req = mockReq({ name: 'test' })
    const middleware = validate(testSchema)

    middleware(req, mockRes(), () => {
      expect(req.body).toEqual({ name: 'test' })
      done()
    })
  })

  it('strips extra fields not in the schema', done => {
    const req = mockReq({ name: 'test', extra: 'should be removed' })
    const middleware = validate(testSchema)

    middleware(req, mockRes(), () => {
      expect(req.body).toEqual({ name: 'test' })
      expect(req.body.extra).toBeUndefined()
      done()
    })
  })

  it('calls next with 422 AppError when a required field is missing', done => {
    const req = mockReq({})
    const middleware = validate(testSchema)

    middleware(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(422)
      expect(err.code).toBe('VALIDATION_ERROR')
      done()
    })
  })

  it('calls next with 422 AppError when a field has the wrong type', done => {
    const req = mockReq({ name: 123 })
    const middleware = validate(testSchema)

    middleware(req, mockRes(), (err?: any) => {
      expect(err).toBeInstanceOf(AppError)
      expect(err.status).toBe(422)
      done()
    })
  })
})
