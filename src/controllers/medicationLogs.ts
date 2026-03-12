import { Response, NextFunction } from 'express'
import { AuthenticatedRequest, AppError } from '../types'
import * as MedicationLogsService from '../services/medicationLogs'

/**
 * GET /users/:user_id/medication-logs
 *
 * Two modes depending on query params:
 *   ?date=YYYY-MM-DD           → checklist view (active meds merged with that day's entries)
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD → raw log entries for a date range
 *
 * Returns 422 if neither is provided.
 */
export async function getMedicationLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, from, to } = req.query as Record<string, string>

    if (date) {
      const result = await MedicationLogsService.getMedicationLogsForDate(req.params.user_id, date)
      res.json(result)
      return
    }

    if (from && to) {
      const result = await MedicationLogsService.getMedicationLogs(req.params.user_id, from, to)
      res.json(result)
      return
    }

    throw new AppError('VALIDATION_ERROR', 'Provide either ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD', 422)
  } catch (err) { next(err) }
}

export async function createMedicationLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await MedicationLogsService.createMedicationLog(req.params.user_id, req.body)
    res.status(201).json(log)
  } catch (err) { next(err) }
}

export async function updateMedicationLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await MedicationLogsService.updateMedicationLog(req.params.user_id, req.params.log_id, req.body)
    res.json(log)
  } catch (err) { next(err) }
}

export async function deleteMedicationLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await MedicationLogsService.deleteMedicationLog(req.params.user_id, req.params.log_id)
    res.status(204).send()
  } catch (err) { next(err) }
}
