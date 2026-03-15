import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../lib/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const reqId = uuidv4()
  res.locals.reqId = reqId

  const startTime = Date.now()
  const child = logger.child({ reqId })

  child.info({ method: req.method, url: req.path }, 'request received')

  res.on('finish', () => {
    const durationMs = Date.now() - startTime
    const status = res.statusCode

    const logData = { method: req.method, url: req.path, status, durationMs, reqId }

    if (status >= 500) {
      child.error(logData, 'request completed')
    } else if (status >= 400) {
      child.warn(logData, 'request completed')
    } else {
      child.info(logData, 'request completed')
    }
  })

  next()
}
