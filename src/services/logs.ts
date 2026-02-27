import prisma from '../lib/prisma'
import { AppError, CreateLogBody, UpdateLogBody } from '../types'
import { getActiveUserMedication } from './userMedications'

export async function getLogs(userId: string, from?: string, to?: string, logDate?: string) {
  return prisma.moodLog.findMany({
    where: {
      userId,
      ...(logDate && { logDate: new Date(logDate) }),
      ...(!logDate && from && to && { logDate: { gte: new Date(from), lte: new Date(to) } }),
    },
    include: {
      userMedication: { select: { name: true } },
    },
    orderBy: { logDate: 'desc' },
  })
}

export async function createLog(userId: string, data: CreateLogBody) {
  const activeMedication = await getActiveUserMedication(userId)
  return prisma.moodLog.create({
    data: {
      userId,
      userMedicationId: activeMedication.id,
      logDate: new Date(data.logDate),
      dosage: data.dosage,
      moodScore: data.moodScore,
      energyScore: data.energyScore,
      note: data.note ?? null,
    },
    include: {
      userMedication: { select: { name: true } },
    },
  })
}

export async function updateLog(userId: string, logId: string, data: UpdateLogBody) {
  const log = await prisma.moodLog.findUnique({ where: { id: logId } })
  if (!log || log.userId !== userId) throw new AppError('NOT_FOUND', 'Log not found', 404)
  return prisma.moodLog.update({
    where: { id: logId },
    data: {
      ...(data.dosage !== undefined && { dosage: data.dosage }),
      ...(data.moodScore !== undefined && { moodScore: data.moodScore }),
      ...(data.energyScore !== undefined && { energyScore: data.energyScore }),
      ...(data.note !== undefined && { note: data.note }),
    },
  })
}

export async function getLogsSummary(userId: string, from: string, to: string, groupBy: 'day' | 'week' = 'day') {
  const logs = await prisma.moodLog.findMany({
    where: { userId, logDate: { gte: new Date(from), lte: new Date(to) } },
    include: { userMedication: { select: { name: true } } },
    orderBy: { logDate: 'asc' },
  })

  // Detect medication/dosage changes across logs for chart annotations
  const medicationChanges: { date: string; from: string; to: string }[] = []
  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1]
    const curr = logs[i]
    const prevLabel = `${prev.userMedication.name} ${prev.dosage}`
    const currLabel = `${curr.userMedication.name} ${curr.dosage}`
    if (prevLabel !== currLabel) {
      medicationChanges.push({
        date: curr.logDate.toISOString().split('T')[0],
        from: prevLabel,
        to: currLabel,
      })
    }
  }

  const aggregated = logs.reduce<Record<string, { mood: number[]; energy: number[] }>>((acc, log) => {
    const key = log.logDate.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = { mood: [], energy: [] }
    acc[key].mood.push(log.moodScore)
    acc[key].energy.push(log.energyScore)
    return acc
  }, {})

  const avg = (arr: number[]) => Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10

  const data = Object.entries(aggregated).map(([date, scores]) => ({
    date,
    moodScore: avg(scores.mood),
    energyScore: avg(scores.energy),
  }))

  return { from, to, medicationChanges, data }
}
