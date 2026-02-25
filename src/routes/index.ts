import { Router } from 'express'
import usersRouter from './users'
import medicationsRouter from './medications'
import userMedicationsRouter from './userMedications'
import logsRouter from './logs'

const router = Router()

router.use('/users', usersRouter)
router.use('/medications', medicationsRouter)
router.use('/users/:user_id/medications', userMedicationsRouter)
router.use('/users/:user_id/logs', logsRouter)

export default router
