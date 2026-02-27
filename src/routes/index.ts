import { Router } from 'express'
import usersRouter from './users'
import userMedicationsRouter from './userMedications'
import logsRouter from './logs'

const router = Router()

router.use('/users', usersRouter)
router.use('/users/:user_id/medications', userMedicationsRouter)
router.use('/users/:user_id/logs', logsRouter)

export default router
