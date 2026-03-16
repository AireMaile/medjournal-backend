// ─── API Error ───────────────────────────────────────────────────────────────

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

// ─── Enums ───────────────────────────────────────────────────────────────────

export type LogType = 'QUICK' | 'DETAILED'
export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING'

// ─── Request Body Types ──────────────────────────────────────────────────────

export interface UpdateProfileBody {
  name?: string
  notificationTime?: string
}

export interface CreateUserMedicationBody {
  customName?: string
  dosage: string
  startDate: string
  notes?: string
}

export interface EndUserMedicationBody {
  endDate?: string
  notes?: string
}

// All scored fields are optional — users are not required to
// answer every question on a given day.
export interface CreateLogBody {
  logDate: string
  logType?: LogType
  moodScore?: number
  energyScore?: number
  quickNote?: string
  anhedonia?: number
  sleepQuality?: number
  sleepHours?: number
  anxietyScore?: number
  appetiteScore?: number
  socialMotivation?: number
  concentrationScore?: number
  functionalImpairment?: number
  detailedNote?: string
}

export interface UpdateLogBody extends Partial<CreateLogBody> {}

export interface CreateMedicationLogBody {
  userMedicationId: string
  logDate: string
  timeOfDay: TimeOfDay
  taken: boolean
  notes?: string
}

export interface UpdateMedicationLogBody {
  timeOfDay?: TimeOfDay
  taken?: boolean
  notes?: string
}
