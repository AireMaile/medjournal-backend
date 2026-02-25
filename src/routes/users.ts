import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorizeUser } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as UsersController from '../controllers/users'

const router = Router()

const createUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  notificationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  notificationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

router.post('/', validate(createUserSchema), UsersController.createUser as any)
router.get('/:user_id', authenticate as any, authorizeUser as any, UsersController.getUser as any)
router.patch('/:user_id', authenticate as any, authorizeUser as any, validate(updateUserSchema), UsersController.updateUser as any)

export default router
