import { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  userId: string
}

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'LOG_ALREADY_EXISTS'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly status: number

  constructor(code: ErrorCode, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
    this.name = 'AppError'
  }
}

export interface CreateUserBody {
  id: string
  name: string
  email: string
  notificationTime?: string
}

export interface UpdateUserBody {
  name?: string
  notificationTime?: string
}

export interface CreateUserMedicationBody {
  name: string
  startDate: string
  notes?: string
}

export interface EndUserMedicationBody {
  endDate?: string
  notes?: string
}

export interface CreateLogBody {
  logDate: string
  dosage: string
  moodScore: number
  energyScore: number
  note?: string
}

export interface UpdateLogBody extends Partial<CreateLogBody> {}
