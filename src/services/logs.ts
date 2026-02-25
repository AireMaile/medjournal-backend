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
      userMedication: { include: { medication: { select: { name: true } } } },
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
      logType: data.logType,
      moodScore: data.moodScore,
      energyScore: data.energyScore,
      quickNote: data.quickNote ?? null,
      sleepQuality: data.sleepQuality ?? null,
      sleepHours: data.sleepHours ?? null,
      anxietyScore: data.anxietyScore ?? null,
      appetiteScore: data.appetiteScore ?? null,
      socialMotivation: data.socialMotivation ?? null,
      detailedNote: data.detailedNote ?? null,
    },
    include: {
      userMedication: { include: { medication: { select: { name: true } } } },
    },
  })
}

export async function updateLog(userId: string, logId: string, data: UpdateLogBody) {
  const log = await prisma.moodLog.findUnique({ where: { id: logId } })
  if (!log || log.userId !== userId) throw new AppError('NOT_FOUND', 'Log not found', 404)
  return prisma.moodLog.update({
    where: { id: logId },
    data: {
      ...(data.logType && { logType: data.logType }),
      ...(data.moodScore !== undefined && { moodScore: data.moodScore }),
      ...(data.energyScore !== undefined && { energyScore: data.energyScore }),
      ...(data.quickNote !== undefined && { quickNote: data.quickNote }),
      ...(data.sleepQuality !== undefined && { sleepQuality: data.sleepQuality }),
      ...(data.sleepHours !== undefined && { sleepHours: data.sleepHours }),
      ...(data.anxietyScore !== undefined && { anxietyScore: data.anxietyScore }),
      ...(data.appetiteScore !== undefined && { appetiteScore: data.appetiteScore }),
      ...(data.socialMotivation !== undefined && { socialMotivation: data.socialMotivation }),
      ...(data.detailedNote !== undefined && { detailedNote: data.detailedNote }),
    },
  })
}

export async function getLogsSummary(userId: string, from: string, to: string, groupBy: 'day' | 'week' = 'day') {
  const logs = await prisma.moodLog.findMany({
    where: { userId, logDate: { gte: new Date(from), lte: new Date(to) } },
    include: { userMedication: { include: { medication: { select: { name: true } } } } },
    orderBy: { logDate: 'asc' },
  })

  const allMedications = await prisma.userMedication.findMany({
    where: { userId, startDate: { gte: new Date(from), lte: new Date(to) }, NOT: { endDate: null } },
    include: { medication: { select: { name: true } } },
    orderBy: { startDate: 'asc' },
  })

  const medicationChanges = allMedications.map((m, i) => {
    const prev = allMedications[i - 1]
    const prevName = prev ? `${prev.medication?.name ?? prev.customName} ${prev.dosage}` : 'Unknown'
    return {
      date: m.startDate.toISOString().split('T')[0],
      from: prevName,
      to: `${m.medication?.name ?? m.customName} ${m.dosage}`,
    }
  })

  const aggregated = logs.reduce<Record<string, number[][]>>((acc, log) => {
    const key = log.logDate.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push([log.moodScore, log.energyScore, log.anxietyScore ?? 0, log.sleepQuality ?? 0, log.appetiteScore ?? 0, log.socialMotivation ?? 0])
    return acc
  }, {})

  const data = Object.entries(aggregated).map(([date, scores]) => {
    const avg = (idx: number) => Math.round((scores.reduce((s, row) => s + row[idx], 0) / scores.length) * 10) / 10
    return { date, moodScore: avg(0), energyScore: avg(1), anxietyScore: avg(2), sleepQuality: avg(3), appetiteScore: avg(4), socialMotivation: avg(5) }
  })

  return { from, to, medicationChanges, data }
}
