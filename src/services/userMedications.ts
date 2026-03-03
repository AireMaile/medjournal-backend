import prisma from '../lib/prisma'
import { CreateUserMedicationBody, EndUserMedicationBody, AppError } from '../types'

export async function getUserMedications(userId: string, activeOnly?: boolean) {
  return prisma.userMedication.findMany({
    where: { userId, ...(activeOnly && { endDate: null }) },
    orderBy: { startDate: 'desc' },
  })
}

export async function addUserMedication(userId: string, data: CreateUserMedicationBody) {
  return prisma.userMedication.create({
    data: {
      userId,
      customName: data.customName ?? null,
      dosage: data.dosage,
      startDate: new Date(data.startDate),
      notes: data.notes ?? null,
    },
  })
}

export async function updateUserMedication(
  userId: string,
  medicationId: string,
  data: Partial<CreateUserMedicationBody>
) {
  const record = await prisma.userMedication.findUnique({ where: { id: medicationId } })
  if (!record || record.userId !== userId) throw new AppError('NOT_FOUND', 'Medication record not found', 404)

  return prisma.userMedication.update({
    where: { id: medicationId },
    data: {
      ...(data.customName && { customName: data.customName }),
      ...(data.dosage && { dosage: data.dosage }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
    },
  })
}

export async function endUserMedication(
  userId: string,
  medicationId: string,
  data: EndUserMedicationBody
) {
  const record = await prisma.userMedication.findUnique({ where: { id: medicationId } })
  if (!record || record.userId !== userId) throw new AppError('NOT_FOUND', 'Medication record not found', 404)
  if (record.endDate) throw new AppError('VALIDATION_ERROR', 'This medication has already been ended', 422)

  return prisma.userMedication.update({
    where: { id: medicationId },
    data: {
      endDate: data.endDate ? new Date(data.endDate) : new Date(),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })
}

export async function deleteUserMedication(userId: string, medicationId: string) {
  const record = await prisma.userMedication.findUnique({ where: { id: medicationId } })
  if (!record || record.userId !== userId) throw new AppError('NOT_FOUND', 'Medication record not found', 404)
  await prisma.userMedication.delete({ where: { id: medicationId } })
}
