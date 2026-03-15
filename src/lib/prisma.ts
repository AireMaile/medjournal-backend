import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const isDevelopment = process.env.NODE_ENV === 'development'

function createPrismaClient() {
  if (isDevelopment) {
    const client = new PrismaClient({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'query' },
      ],
    })

    client.$on('error', (e) => {
      logger.error({ target: e.target }, 'prisma error')
    })

    client.$on('warn', (e) => {
      logger.warn({ target: e.target }, 'prisma warning')
    })

    // WARNING: query events include full SQL with parameter values.
    // Only use against synthetic/seed data — never real user data.
    client.$on('query', (e) => {
      logger.debug({ durationMs: e.duration }, 'prisma query')
    })

    return client
  }

  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  })

  client.$on('error', (e) => {
    logger.error({ target: e.target }, 'prisma error')
  })

  client.$on('warn', (e) => {
    logger.warn({ target: e.target }, 'prisma warning')
  })

  return client
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
