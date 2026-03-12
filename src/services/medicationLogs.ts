import prisma from '../lib/prisma'
import { AppError, CreateMedicationLogBody, UpdateMedicationLogBody } from '../types'

/**
 * Returns all active medications for the user merged with their log entries
 * for a given date. Medications with no log entry that day get an empty
 * logEntries array — this is the "checklist" the frontend renders.
 */
export async function getMedicationLogsForDate(userId: string, date: string) {
  const logDate = new Date(date)

  const [activeMedications, existingLogs] = await Promise.all([
    prisma.userMedication.findMany({
      where: {
        userId,
        startDate: { lte: logDate },
        OR: [{ endDate: null }, { endDate: { gte: logDate } }],
      },
      orderBy: { startDate: 'asc' },
    }),
    prisma.medicationLog.findMany({
      where: { userId, logDate },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const logsByMedId = existingLogs.reduce<Record<string, typeof existingLogs>>((acc, log) => {
    if (!acc[log.userMedicationId]) acc[log.userMedicationId] = []
    acc[log.userMedicationId].push(log)
    return acc
  }, {})

  return activeMedications.map(med => ({
    userMedicationId: med.id,
    customName: med.customName,
    dosage: med.dosage,
    logEntries: logsByMedId[med.id] ?? [],
  }))
}

/**
 * Returns raw medication log entries for a date range, used by summary/history views.
 */
export async function getMedicationLogs(userId: string, from?: string, to?: string, logDate?: string) {
  return prisma.medicationLog.findMany({
    where: {
      userId,
      ...(logDate && { logDate: new Date(logDate) }),
      ...(!logDate && from && to && { logDate: { gte: new Date(from), lte: new Date(to) } }),
    },
    include: {
      userMedication: { select: { customName: true, dosage: true } },
    },
    orderBy: [{ logDate: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function createMedicationLog(userId: string, data: CreateMedicationLogBody) {
  // Verify the medication belongs to this user
  const medication = await prisma.userMedication.findUnique({
    where: { id: data.userMedicationId },
  })
  if (!medication || medication.userId !== userId) {
    throw new AppError('NOT_FOUND', 'Medication not found', 404)
  }

  return prisma.medicationLog.create({
    data: {
      userId,
      userMedicationId: data.userMedicationId,
      logDate: new Date(data.logDate),
      timeOfDay: data.timeOfDay,
      taken: data.taken,
      notes: data.notes ?? null,
    },
    include: {
      userMedication: { select: { customName: true, dosage: true } },
    },
  })
}

export async function updateMedicationLog(userId: string, logId: string, data: UpdateMedicationLogBody) {
  const log = await prisma.medicationLog.findUnique({ where: { id: logId } })
  if (!log || log.userId !== userId) throw new AppError('NOT_FOUND', 'Medication log not found', 404)

  return prisma.medicationLog.update({
    where: { id: logId },
    data: {
      ...(data.timeOfDay !== undefined && { timeOfDay: data.timeOfDay }),
      ...(data.taken !== undefined && { taken: data.taken }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      userMedication: { select: { customName: true, dosage: true } },
    },
  })
}

export async function deleteMedicationLog(userId: string, logId: string) {
  const log = await prisma.medicationLog.findUnique({ where: { id: logId } })
  if (!log || log.userId !== userId) throw new AppError('NOT_FOUND', 'Medication log not found', 404)

  await prisma.medicationLog.delete({ where: { id: logId } })
}
