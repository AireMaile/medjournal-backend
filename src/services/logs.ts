import prisma from '../lib/prisma'
import { AppError, CreateLogBody, UpdateLogBody } from '../types'

export async function getLogs(userId: string, from?: string, to?: string, logDate?: string) {
  return prisma.moodLog.findMany({
    where: {
      userId,
      ...(logDate && { logDate: new Date(logDate) }),
      ...(!logDate && from && to && { logDate: { gte: new Date(from), lte: new Date(to) } }),
    },
    include: {
      userMedication: { select: { customName: true, dosage: true } },
    },
    orderBy: { logDate: 'desc' },
  })
}

function computeOverallScore(data: CreateLogBody): number {
  // Normalize all fields to higher = better before averaging.
  // anxiety and functionalImpairment run higher = worse, so invert them.
  const fields: number[] = [
    data.moodScore,
    data.energyScore,
  ]
  if (data.anhedonia !== undefined)           fields.push(data.anhedonia)
  if (data.sleepQuality !== undefined)        fields.push(data.sleepQuality)
  if (data.appetiteScore !== undefined)       fields.push(data.appetiteScore)
  if (data.socialMotivation !== undefined)    fields.push(data.socialMotivation)
  if (data.concentrationScore !== undefined)  fields.push(data.concentrationScore)
  if (data.anxietyScore !== undefined)        fields.push(6 - data.anxietyScore)
  if (data.functionalImpairment !== undefined) fields.push(6 - data.functionalImpairment)

  const sum = fields.reduce((acc, v) => acc + v, 0)
  return Math.round((sum / fields.length) * 10) / 10
}

export async function createLog(userId: string, data: CreateLogBody) {
  const overallScore = computeOverallScore(data)

  return prisma.moodLog.create({
    data: {
      userId,
      logDate: new Date(data.logDate),
      logType: data.logType,
      moodScore: data.moodScore,
      energyScore: data.energyScore,
      quickNote: data.quickNote ?? null,
      anhedonia: data.anhedonia ?? null,
      medicationAdherence: data.medicationAdherence ?? null,
      sleepQuality: data.sleepQuality ?? null,
      sleepHours: data.sleepHours ?? null,
      anxietyScore: data.anxietyScore ?? null,
      appetiteScore: data.appetiteScore ?? null,
      socialMotivation: data.socialMotivation ?? null,
      concentrationScore: data.concentrationScore ?? null,
      functionalImpairment: data.functionalImpairment ?? null,
      detailedNote: data.detailedNote ?? null,
      overallScore,
    },
    include: {
      userMedication: { select: { customName: true, dosage: true } },
    },
  })
}

export async function updateLog(userId: string, logId: string, data: UpdateLogBody) {
  const log = await prisma.moodLog.findUnique({ where: { id: logId } })
  if (!log || log.userId !== userId) throw new AppError('NOT_FOUND', 'Log not found', 404)

  // Merge existing log values with incoming updates to recompute overallScore
  const merged: CreateLogBody = {
    logDate: log.logDate.toISOString(),
    logType: log.logType as 'QUICK' | 'DETAILED',
    moodScore: data.moodScore ?? log.moodScore,
    energyScore: data.energyScore ?? log.energyScore,
    anhedonia: data.anhedonia ?? log.anhedonia ?? undefined,
    sleepQuality: data.sleepQuality ?? log.sleepQuality ?? undefined,
    appetiteScore: data.appetiteScore ?? log.appetiteScore ?? undefined,
    socialMotivation: data.socialMotivation ?? log.socialMotivation ?? undefined,
    concentrationScore: data.concentrationScore ?? log.concentrationScore ?? undefined,
    anxietyScore: data.anxietyScore ?? log.anxietyScore ?? undefined,
    functionalImpairment: data.functionalImpairment ?? log.functionalImpairment ?? undefined,
  }
  const overallScore = computeOverallScore(merged)

  return prisma.moodLog.update({
    where: { id: logId },
    data: {
      ...(data.logType !== undefined && { logType: data.logType }),
      ...(data.moodScore !== undefined && { moodScore: data.moodScore }),
      ...(data.energyScore !== undefined && { energyScore: data.energyScore }),
      ...(data.quickNote !== undefined && { quickNote: data.quickNote }),
      ...(data.anhedonia !== undefined && { anhedonia: data.anhedonia }),
      ...(data.medicationAdherence !== undefined && { medicationAdherence: data.medicationAdherence }),
      ...(data.sleepQuality !== undefined && { sleepQuality: data.sleepQuality }),
      ...(data.sleepHours !== undefined && { sleepHours: data.sleepHours }),
      ...(data.anxietyScore !== undefined && { anxietyScore: data.anxietyScore }),
      ...(data.appetiteScore !== undefined && { appetiteScore: data.appetiteScore }),
      ...(data.socialMotivation !== undefined && { socialMotivation: data.socialMotivation }),
      ...(data.concentrationScore !== undefined && { concentrationScore: data.concentrationScore }),
      ...(data.functionalImpairment !== undefined && { functionalImpairment: data.functionalImpairment }),
      ...(data.detailedNote !== undefined && { detailedNote: data.detailedNote }),
      overallScore,
    },
  })
}

export async function getLogsSummary(userId: string, from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date()
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  const logs = await prisma.moodLog.findMany({
    where: { userId, logDate: { gte: fromDate, lte: toDate } },
    include: { userMedication: { select: { customName: true, dosage: true } } },
    orderBy: { logDate: 'asc' },
  })

  // Detect medication/dosage changes across consecutive logs for chart annotations
  const medicationChanges: { date: string; from: string; to: string }[] = []
  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1]
    const curr = logs[i]
    const prevLabel = prev.userMedication ? `${prev.userMedication.customName} ${prev.userMedication.dosage}` : null
    const currLabel = curr.userMedication ? `${curr.userMedication.customName} ${curr.userMedication.dosage}` : null
    if (prevLabel !== currLabel) {
      medicationChanges.push({
        date: curr.logDate.toISOString().split('T')[0],
        from: prevLabel || 'None',
        to: currLabel || 'None',
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

  return { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0], medicationChanges, data }
}
