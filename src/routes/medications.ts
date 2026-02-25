import { Router } from 'express'
import * as MedicationsController from '../controllers/medications'

const router = Router()

router.get('/', MedicationsController.getMedications)

export default router
