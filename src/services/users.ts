import prisma from '../lib/prisma'
import { AppError, CreateUserBody, UpdateUserBody } from '../types'

export async function createUser(data: CreateUserBody) {
  return prisma.user.create({
    data: {
      id: data.id,
      name: data.name,
      email: data.email,
      notificationTime: data.notificationTime ?? null,
    },
  })
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404)
  return user
}

export async function updateUser(userId: string, data: UpdateUserBody) {
  await getUserById(userId)
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.notificationTime !== undefined && { notificationTime: data.notificationTime }),
    },
  })
}
