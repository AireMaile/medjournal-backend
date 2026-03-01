import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthenticatedRequest, AppError } from '../types'

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Missing or malformed authorization header', 401))
  }

  const token = authHeader.split(' ')[1]
  const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string }
    if (!decoded.sub) {
      return next(new AppError('UNAUTHORIZED', 'Invalid token payload', 401))
    }
    req.userId = decoded.sub
    next()
  } catch {
    next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401))
  }
}

export function authorizeUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { user_id } = req.params
  if (req.userId !== user_id) {
    return next(new AppError('FORBIDDEN', 'You do not have access to this resource', 403))
  }
  next()
}
