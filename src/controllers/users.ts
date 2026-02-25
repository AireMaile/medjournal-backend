import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import * as UsersService from '../services/users'

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UsersService.createUser(req.body)
    res.status(201).json(user)
  } catch (err) { next(err) }
}

export async function getUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UsersService.getUserById(req.params.user_id)
    res.json(user)
  } catch (err) { next(err) }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UsersService.updateUser(req.params.user_id, req.body)
    res.json(user)
  } catch (err) { next(err) }
}
