import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorizeUser } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as MedicationLogsController from '../controllers/medicationLogs'

const router = Router({ mergeParams: true })

const timeOfDay = z.enum(['MORNING', 'AFTERNOON', 'EVENING'])

const createMedicationLogSchema = z.object({
  userMedicationId: z.string().uuid(),
  logDate: z.string().date(),
  timeOfDay,
  taken: z.boolean(),
  notes: z.string().optional(),
})

const updateMedicationLogSchema = z.object({
  timeOfDay: timeOfDay.optional(),
  taken: z.boolean().optional(),
  notes: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
})

const auth = [authenticate as any, authorizeUser as any]

// GET ?date=YYYY-MM-DD           → checklist view: active meds merged with that day's entries
// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD → raw log entries for a date range
// Returns 422 if neither is provided
router.get('/', ...auth, MedicationLogsController.getMedicationLogs as any)
router.post('/', ...auth, validate(createMedicationLogSchema), MedicationLogsController.createMedicationLog as any)
router.patch('/:log_id', ...auth, validate(updateMedicationLogSchema), MedicationLogsController.updateMedicationLog as any)
router.delete('/:log_id', ...auth, MedicationLogsController.deleteMedicationLog as any)

export default router
