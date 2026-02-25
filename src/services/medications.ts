import prisma from '../lib/prisma'

export async function getMedications(search?: string, category?: string) {
  return prisma.medication.findMany({
    where: {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(category && { category: { equals: category, mode: 'insensitive' } }),
    },
    orderBy: { name: 'asc' },
  })
}
