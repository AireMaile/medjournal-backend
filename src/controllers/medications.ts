import { Request, Response, NextFunction } from 'express'
import * as MedicationsService from '../services/medications'

export async function getMedications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, category } = req.query as Record<string, string>
    const medications = await MedicationsService.getMedications(search, category)
    res.json(medications)
  } catch (err) { next(err) }
}
