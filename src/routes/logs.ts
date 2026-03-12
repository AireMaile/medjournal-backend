import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorizeUser } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as LogsController from '../controllers/logs'

const router = Router({ mergeParams: true })

const scoreField = z.number().int().min(1).max(5)

const createLogSchema = z.object({
  logDate: z.string().date(),
  logType: z.enum(['QUICK', 'DETAILED']).optional(),
  moodScore: scoreField.optional(),
  energyScore: scoreField.optional(),
  quickNote: z.string().optional(),
  anhedonia: scoreField.optional(),
  sleepQuality: scoreField.optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  anxietyScore: scoreField.optional(),
  appetiteScore: scoreField.optional(),
  socialMotivation: scoreField.optional(),
  concentrationScore: scoreField.optional(),
  functionalImpairment: scoreField.optional(),
  detailedNote: z.string().optional(),
})

const updateLogSchema = createLogSchema.partial()

const auth = [authenticate as any, authorizeUser as any]

router.get('/summary', ...auth, LogsController.getLogsSummary as any)
router.get('/', ...auth, LogsController.getLogs as any)
router.post('/', ...auth, validate(createLogSchema), LogsController.createLog as any)
router.patch('/:log_id', ...auth, validate(updateLogSchema), LogsController.updateLog as any)

export default router
