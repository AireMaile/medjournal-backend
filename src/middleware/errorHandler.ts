import { Request, Response, NextFunction } from 'express'
import { AppError } from '../types'
import { logger } from '../lib/logger'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const reqId = res.locals.reqId as string | undefined

  if (err instanceof AppError) {
    logger.warn({ reqId, code: err.code, status: err.status }, 'app error')
    res.status(err.status).json({
      error: { code: err.code, message: err.message, status: err.status },
    })
    return
  }

  // Prisma does not export a stable typed error class for these codes at v5
  if ((err as any).code === 'P2002') {
    logger.warn({ reqId, code: 'LOG_ALREADY_EXISTS', status: 409 }, 'app error')
    res.status(409).json({
      error: { code: 'LOG_ALREADY_EXISTS', message: 'A log already exists for this date.', status: 409 },
    })
    return
  }

  if ((err as any).code === 'P2025') {
    logger.warn({ reqId, code: 'NOT_FOUND', status: 404 }, 'app error')
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Resource not found.', status: 404 },
    })
    return
  }

  logger.error({ reqId, err, status: 500 }, 'unhandled error')
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
  })
}
