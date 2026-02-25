import jwt from 'jsonwebtoken'

const TEST_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? 'test-secret-key'

export function generateMockJwt(userId: string, expiresIn = '1h'): string {
  return jwt.sign({ sub: userId, role: 'authenticated' }, TEST_JWT_SECRET, { expiresIn })
}

export function generateExpiredJwt(userId: string): string {
  return jwt.sign({ sub: userId }, TEST_JWT_SECRET, { expiresIn: '-1s' })
}
