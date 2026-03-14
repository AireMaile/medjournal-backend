import prisma from '../lib/prisma'
import { AppError, CreateLogBody, UpdateLogBody } from '../types'

export async function getLogs(userId: string, from?: string, to?: string, logDate?: string) {
  const dateFilter = {
    ...(logDate && { logDate: new Date(logDate) }),
    ...(!logDate && from && to && { logDate: { gte: new Date(from), lte: new Date(to) } }),
  }

  const [moodLogs, medicationLogs] = await Promise.all([
    prisma.moodLog.findMany({
      where: { userId, ...dateFilter },
      orderBy: { logDate: 'desc' },
    }),
    prisma.medicationLog.findMany({
      where: { userId, ...dateFilter },
      include: { userMedication: { select: { customName: true, dosage: true } } },
      orderBy: { logDate: 'desc' },
    }),
  ])

  // Group medication logs by date so each mood log carries its day's med entries
  const medsByDate = medicationLogs.reduce<Record<string, typeof medicationLogs>>((acc, medLog) => {
    const key = medLog.logDate.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(medLog)
    return acc
  }, {})

  return moodLogs.map(log => ({
    ...log,
    medicationLogs: medsByDate[log.logDate.toISOString().split('T')[0]] ?? [],
  }))
}

function computeOverallScore(data: CreateLogBody): number | null {
  // Normalize all fields to higher = better before averaging.
  // anxietyScore and functionalImpairment run higher = worse, so invert them.
  const fields: number[] = []

  if (data.moodScore !== undefined)            fields.push(data.moodScore)
  if (data.energyScore !== undefined)          fields.push(data.energyScore)
  if (data.anhedonia !== undefined)            fields.push(data.anhedonia)
  if (data.sleepQuality !== undefined)         fields.push(data.sleepQuality)
  if (data.appetiteScore !== undefined)        fields.push(data.appetiteScore)
  if (data.socialMotivation !== undefined)     fields.push(data.socialMotivation)
  if (data.concentrationScore !== undefined)   fields.push(data.concentrationScore)
  if (data.anxietyScore !== undefined)         fields.push(data.anxietyScore)
  if (data.functionalImpairment !== undefined) fields.push(data.functionalImpairment)

  if (fields.length === 0) return null

  const sum = fields.reduce((acc, v) => acc + v, 0)
  return Math.round((sum / fields.length) * 10) / 10
}

export async function createLog(userId: string, data: CreateLogBody) {
  const overallScore = computeOverallScore(data)

  return prisma.moodLog.create({
    data: {
      userId,
      logDate: new Date(data.logDate),
      logType: data.logType ?? null,
      moodScore: data.moodScore ?? null,
      energyScore: data.energyScore ?? null,
      quickNote: data.quickNote ?? null,
      anhedonia: data.anhedonia ?? null,
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
  })
}

export async function updateLog(userId: string, logId: string, data: UpdateLogBody) {
  const log = await prisma.moodLog.findUnique({ where: { id: logId } })
  if (!log || log.userId !== userId) throw new AppError('NOT_FOUND', 'Log not found', 404)

  // Merge existing values with incoming updates to recompute overallScore
  const merged: CreateLogBody = {
    logDate: log.logDate.toISOString(),
    moodScore: data.moodScore ?? log.moodScore ?? undefined,
    energyScore: data.energyScore ?? log.energyScore ?? undefined,
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

  const [moodLogs, medicationLogs] = await Promise.all([
    prisma.moodLog.findMany({
      where: { userId, logDate: { gte: fromDate, lte: toDate } },
      orderBy: { logDate: 'asc' },
    }),
    prisma.medicationLog.findMany({
      where: { userId, logDate: { gte: fromDate, lte: toDate } },
      include: { userMedication: { select: { customName: true, dosage: true } } },
      orderBy: { logDate: 'asc' },
    }),
  ])

  // Build per-day set of taken medication labels, then diff consecutive days for chart annotations
  const medLabelsByDate = medicationLogs.reduce<Record<string, Set<string>>>((acc, log) => {
    const key = log.logDate.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = new Set()
    if (log.taken) {
      const label = `${log.userMedication.customName ?? ''} ${log.userMedication.dosage}`.trim()
      acc[key].add(label)
    }
    return acc
  }, {})

  const sortedDates = Object.keys(medLabelsByDate).sort()
  const medicationChanges: { date: string; from: string; to: string }[] = []
  for (let i = 1; i < sortedDates.length; i++) {
    const prevLabels = [...(medLabelsByDate[sortedDates[i - 1]] ?? [])].sort().join(', ')
    const currLabels = [...(medLabelsByDate[sortedDates[i]] ?? [])].sort().join(', ')
    if (prevLabels !== currLabels) {
      medicationChanges.push({
        date: sortedDates[i],
        from: prevLabels || 'None',
        to: currLabels || 'None',
      })
    }
  }

  // Aggregate mood/energy scores by date (skip nulls — user may not have scored that day)
  const aggregated = moodLogs.reduce<Record<string, { mood: number[]; energy: number[] }>>((acc, log) => {
    const key = log.logDate.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = { mood: [], energy: [] }
    if (log.moodScore !== null)   acc[key].mood.push(log.moodScore)
    if (log.energyScore !== null) acc[key].energy.push(log.energyScore)
    return acc
  }, {})

  const avg = (arr: number[]) =>
    arr.length === 0 ? null : Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10

  const data = Object.entries(aggregated).map(([date, scores]) => ({
    date,
    moodScore: avg(scores.mood),
    energyScore: avg(scores.energy),
  }))

  return {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0],
    medicationChanges,
    data,
  }
}
