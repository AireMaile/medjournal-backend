import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as ProfileController from '../controllers/profile'

const router = Router()

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  notificationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

// All profile routes use the token's own userId — no :user_id param needed
router.get('/', authenticate, ProfileController.getProfile)
router.patch('/', authenticate, validate(updateProfileSchema), ProfileController.updateProfile)

export default router
