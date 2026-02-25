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

export type LogType = 'QUICK' | 'DETAILED'

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
  medicationId?: string
  customName?: string
  dosage: string
  startDate: string
  notes?: string
}

export interface EndUserMedicationBody {
  endDate?: string
  notes?: string
}

export interface CreateLogBody {
  logDate: string
  logType: LogType
  moodScore: number
  energyScore: number
  quickNote?: string
  sleepQuality?: number
  sleepHours?: number
  anxietyScore?: number
  appetiteScore?: number
  socialMotivation?: number
  detailedNote?: string
}

export interface UpdateLogBody extends Partial<CreateLogBody> {}
