import pino from 'pino'

// PHI redaction — HIPAA Safe Harbor
// This list is defence-in-depth only. The primary rule is: never pass objects
// containing PHI directly to log calls. Redaction here catches accidental
// leakage; it is not a substitute for careful log-call hygiene.
// Fields listed cover Safe Harbor identifiers and sensitive free-text authored
// by users. Wildcard variants (*.field) catch the same keys when nested.
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
  // Wildcard variants for free-text PHI fields that may appear nested
  '*.notes',
  '*.quickNote',
  '*.detailedNote',
  '*.customName',
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
