import prisma from '../../src/lib/prisma'
import { v4 as uuid } from 'uuid'

export async function clearDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase() refused to run — NODE_ENV is not "test". Aborting to protect production data.')
  }
  await prisma.medicationLog.deleteMany()
  await prisma.moodLog.deleteMany()
  await prisma.userMedication.deleteMany()
  await prisma.profile.deleteMany()
}

export async function createTestUser(overrides?: Partial<{
  id: string
  name: string
  notificationTime: string
}>) {
  return prisma.profile.create({
    data: {
      id: overrides?.id ?? uuid(),
      name: overrides?.name ?? 'Test User',
      notificationTime: overrides?.notificationTime ?? null,
    },
  })
}

export async function createTestUserMedication(
  userId: string,
  overrides?: Partial<{
    customName: string
    dosage: string
    startDate: Date
    endDate: Date | null
    notes: string
  }>
) {
  return prisma.userMedication.create({
    data: {
      userId,
      customName: overrides?.customName ?? 'Sertraline',
      dosage: overrides?.dosage ?? '50mg',
      startDate: overrides?.startDate ?? new Date('2026-01-01'),
      endDate: overrides?.endDate ?? null,
      notes: overrides?.notes ?? null,
    },
  })
}

export async function createTestLog(
  userId: string,
  overrides?: Partial<{
    logDate: string
    logType: string
    moodScore: number
    energyScore: number
    quickNote: string
  }>
) {
  return prisma.moodLog.create({
    data: {
      userId,
      logDate: new Date(overrides?.logDate ?? '2026-02-25'),
      logType: overrides?.logType ?? null,
      moodScore: overrides?.moodScore ?? null,
      energyScore: overrides?.energyScore ?? null,
      quickNote: overrides?.quickNote ?? null,
    },
  })
}

export async function createTestMedicationLog(
  userId: string,
  userMedicationId: string,
  overrides?: Partial<{
    logDate: string
    timeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING'
    taken: boolean
    notes: string
  }>
) {
  return prisma.medicationLog.create({
    data: {
      userId,
      userMedicationId,
      logDate: new Date(overrides?.logDate ?? '2026-02-25'),
      timeOfDay: overrides?.timeOfDay ?? 'MORNING',
      taken: overrides?.taken ?? false,
      notes: overrides?.notes ?? null,
    },
  })
}
