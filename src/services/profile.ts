import prisma from '../lib/prisma'
import { AppError, UpdateProfileBody } from '../types'

export async function getProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } })

  if (!profile) {
    throw new AppError('NOT_FOUND', 'Profile not found', 404)
  }

  return profile
}

export async function updateProfile(userId: string, data: UpdateProfileBody) {
  await getProfile(userId) // ensure exists

  return prisma.profile.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.notificationTime !== undefined && { notificationTime: data.notificationTime }),
    },
  })
}
