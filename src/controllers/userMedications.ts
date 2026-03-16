import { Request, Response, NextFunction } from 'express'
import * as UserMedicationsService from '../services/userMedications'

export async function getUserMedications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activeOnly = req.query.active === 'true'
    const medications = await UserMedicationsService.getUserMedications(req.params.user_id, activeOnly)
    res.json(medications)
  } catch (err) { next(err) }
}

export async function addUserMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medication = await UserMedicationsService.addUserMedication(req.params.user_id, req.body)
    res.status(201).json(medication)
  } catch (err) { next(err) }
}

export async function updateUserMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medication = await UserMedicationsService.updateUserMedication(req.params.user_id, req.params.medication_id, req.body)
    res.json(medication)
  } catch (err) { next(err) }
}

export async function endUserMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medication = await UserMedicationsService.endUserMedication(req.params.user_id, req.params.medication_id, req.body)
    res.json(medication)
  } catch (err) { next(err) }
}

export async function deleteUserMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await UserMedicationsService.deleteUserMedication(req.params.user_id, req.params.medication_id)
    res.status(204).send()
  } catch (err) { next(err) }
}
