import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from '../types'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const zodError = result.error as ZodError
      const firstIssue = zodError.issues[0]
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Validation failed'
      return next(new AppError('VALIDATION_ERROR', message, 422))
    }
    req.body = result.data
    next()
  }
}
