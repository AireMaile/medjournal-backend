import prisma from '../../src/lib/prisma'
import { v4 as uuid } from 'uuid'

export async function clearDatabase(): Promise<void> {
  await prisma.moodLog.deleteMany()
  await prisma.userMedication.deleteMany()
  await prisma.user.deleteMany()
  await prisma.medication.deleteMany()
}

export async function createTestUser(overrides?: Partial<{ id: string; name: string; email: string; notificationTime: string }>) {
  return prisma.user.create({
    data: {
      id: overrides?.id ?? uuid(),
      name: overrides?.name ?? 'Test User',
      email: overrides?.email ?? `test-${uuid()}@example.com`,
      notificationTime: overrides?.notificationTime ?? '08:00',
    },
  })
}

export async function createTestMedication(overrides?: Partial<{ name: string; category: string; commonDosages: string[] }>) {
  return prisma.medication.create({
    data: {
      name: overrides?.name ?? `Medication-${uuid()}`,
      category: overrides?.category ?? 'SSRI',
      commonDosages: overrides?.commonDosages ?? ['50mg', '100mg'],
    },
  })
}

export async function createTestUserMedication(
  userId: string,
  overrides?: Partial<{ medicationId: string; customName: string; dosage: string; startDate: Date; endDate: Date | null; notes: string }>
) {
  return prisma.userMedication.create({
    data: {
      userId,
      medicationId: overrides?.medicationId ?? null,
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
  userMedicationId: string,
  overrides?: Partial<{ logDate: string; moodScore: number; energyScore: number }>
) {
  return prisma.moodLog.create({
    data: {
      userId,
      userMedicationId,
      logDate: new Date(overrides?.logDate ?? '2026-02-25'),
      logType: 'QUICK',
      moodScore: overrides?.moodScore ?? 3,
      energyScore: overrides?.energyScore ?? 3,
    },
  })
}
