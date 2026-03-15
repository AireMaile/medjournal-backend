import pino from 'pino'

const PHI_REDACT_PATHS = [
  'name',
  'customName',
  'quickNote',
  'detailedNote',
  'moodScore',
  'energyScore',
  'anhedonia',
  'sleepQuality',
  'sleepHours',
  'anxietyScore',
  'appetiteScore',
  'socialMotivation',
  'concentrationScore',
  'functionalImpairment',
  'overallScore',
  'notes',
  'dosage',
  'taken',
  'timeOfDay',
  'logDate',
  'body',
  'err.message',
]

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  redact: {
    paths: PHI_REDACT_PATHS,
    censor: '[redacted]',
  },
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
})

export function createChildLogger(context: { reqId: string; userId?: string }) {
  return logger.child(context)
}

export default logger
