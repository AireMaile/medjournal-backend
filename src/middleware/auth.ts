import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthenticatedRequest, AppError } from '../types'

// Decode the token header without verifying to check the algorithm
function getTokenAlgorithm(token: string): string | null {
  try {
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString())
    return header.alg ?? null
  } catch {
    return null
  }
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
  const alg = getTokenAlgorithm(token)

  // HS256 — mock token from tests or manual generation
  if (alg === 'HS256') {
    const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string }
      if (!decoded.sub) return next(new AppError('UNAUTHORIZED', 'Invalid token payload', 401))
      req.userId = decoded.sub
      return next()
    } catch {
      return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401))
    }
  }

  // ES256 — real Supabase token, verify using JWKS
  if (alg === 'ES256') {
    const supabaseUrl = process.env.SUPABASE_URL!
    const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`

    // Decode header to get kid
    let kid: string | undefined
    try {
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString())
      kid = header.kid
    } catch {
      return next(new AppError('UNAUTHORIZED', 'Invalid token header', 401))
    }

    // Fetch the public key from Supabase JWKS endpoint
    fetch(jwksUri)
      .then(res => res.json())
      .then((jwks: any) => {
        const key = jwks.keys?.find((k: any) => k.kid === kid)
        if (!key) return next(new AppError('UNAUTHORIZED', 'Signing key not found', 401))

        // Convert JWK to PEM using Node crypto
        const { createPublicKey } = require('crypto')
        const publicKey = createPublicKey({ key, format: 'jwk' })

        try {
          const decoded = jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as { sub: string }
          if (!decoded.sub) return next(new AppError('UNAUTHORIZED', 'Invalid token payload', 401))
          req.userId = decoded.sub
          next()
        } catch {
          next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401))
        }
      })
      .catch(() => next(new AppError('UNAUTHORIZED', 'Could not verify token', 401)))
    return
  }

  next(new AppError('UNAUTHORIZED', 'Unsupported token algorithm', 401))
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
