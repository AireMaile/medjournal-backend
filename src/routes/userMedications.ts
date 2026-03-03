import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorizeUser } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as UserMedicationsController from '../controllers/userMedications'

const router = Router({ mergeParams: true })

const addMedicationSchema = z.object({
  customName: z.string().trim().min(1),
  dosage: z.string().min(1),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  notes: z.string().optional(),
})

const updateMedicationSchema = z.object({
  customName: z.string().trim().min(1).optional(),
  dosage: z.string().min(1).optional(),
  notes: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
})

const endMedicationSchema = z.object({
  endDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  notes: z.string().optional(),
})

const auth = [authenticate as any, authorizeUser as any]

router.get('/', ...auth, UserMedicationsController.getUserMedications as any)
router.post('/', ...auth, validate(addMedicationSchema), UserMedicationsController.addUserMedication as any)
router.patch('/:medication_id', ...auth, validate(updateMedicationSchema), UserMedicationsController.updateUserMedication as any)
router.patch('/:medication_id/end', ...auth, validate(endMedicationSchema), UserMedicationsController.endUserMedication as any)
router.delete('/:medication_id', ...auth, UserMedicationsController.deleteUserMedication as any)

export default router
