import { Request, Response, NextFunction } from 'express'
import * as LogsService from '../services/logs'

export async function getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to, logDate } = req.query as Record<string, string>
    const logs = await LogsService.getLogs(req.params.user_id, from, to, logDate)
    res.json(logs)
  } catch (err) { next(err) }
}

export async function createLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await LogsService.createLog(req.params.user_id, req.body)
    res.status(201).json(log)
  } catch (err) { next(err) }
}

export async function updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await LogsService.updateLog(req.params.user_id, req.params.log_id, req.body)
    res.json(log)
  } catch (err) { next(err) }
}

export async function getLogsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as Record<string, string>
    const summary = await LogsService.getLogsSummary(req.params.user_id, from, to)
    res.json(summary)
  } catch (err) { next(err) }
}
