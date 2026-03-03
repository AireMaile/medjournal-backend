import { Router } from 'express'
import profileRouter from './profile'
import userMedicationsRouter from './userMedications'
import logsRouter from './logs'

const router = Router()

router.use('/profile', profileRouter)
router.use('/users/:user_id/medications', userMedicationsRouter)
router.use('/users/:user_id/logs', logsRouter)

export default router
