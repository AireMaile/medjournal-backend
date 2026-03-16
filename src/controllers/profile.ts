import { Request, Response, NextFunction } from 'express'
import * as ProfileService from '../services/profile'

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await ProfileService.getProfile(req.userId!)
    res.json(profile)
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await ProfileService.updateProfile(req.userId!, req.body)
    res.json(profile)
  } catch (err) {
    next(err)
  }
}
