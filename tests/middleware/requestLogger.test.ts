import request from 'supertest'
import express, { Request, Response } from 'express'
import { requestLogger } from '../../src/middleware/requestLogger'

function buildApp() {
  const app = express()
  app.use(requestLogger)
  app.get('/test', (req: Request, res: Response) => {
    res.json({ reqId: res.locals.reqId })
  })
  return app
}

describe('requestLogger middleware', () => {
  it('attaches a reqId to res.locals', async () => {
    const app = buildApp()
    const response = await request(app).get('/test')
    expect(response.status).toBe(200)
    expect(response.body.reqId).toBeDefined()
    expect(typeof response.body.reqId).toBe('string')
    expect(response.body.reqId.length).toBeGreaterThan(0)
  })

  it('generates a unique reqId per request', async () => {
    const app = buildApp()
    const [r1, r2] = await Promise.all([
      request(app).get('/test'),
      request(app).get('/test'),
    ])
    expect(r1.body.reqId).not.toBe(r2.body.reqId)
  })
})
