import { Router } from 'express'
import profileRouter from './profile'
import userMedicationsRouter from './userMedications'
import logsRouter from './logs'
import medicationLogsRouter from './medicationLogs'

const router = Router()

router.use('/profile', profileRouter)
router.use('/users/:user_id/medications', userMedicationsRouter)
router.use('/users/:user_id/logs', logsRouter)
router.use('/users/:user_id/medication-logs', medicationLogsRouter)

export default router
