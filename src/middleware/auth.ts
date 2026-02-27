import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { AuthenticatedRequest, AppError } from '../types'

const jwksClient = jwksRsa({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
})

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    callback(null, key?.getPublicKey())
  })
}

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

  jwt.verify(token, getKey, { algorithms: ['ES256'] }, (err, decoded: any) => {
    if (err || !decoded?.sub) {
      return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401))
    }
    req.userId = decoded.sub
    next()
  })
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
