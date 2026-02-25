import { Request, Response, NextFunction } from 'express'
import { AppError } from '../types'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, status: err.status },
    })
    return
  }

  if ((err as any).code === 'P2002') {
    res.status(409).json({
      error: { code: 'LOG_ALREADY_EXISTS', message: 'A log already exists for this date.', status: 409 },
    })
    return
  }

  if ((err as any).code === 'P2025') {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Resource not found.', status: 404 },
    })
    return
  }

  console.error('[Unhandled Error]', err)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
  })
}
