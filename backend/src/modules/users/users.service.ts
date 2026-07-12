import { prisma } from '../../db/prisma/client';
import { NotFoundError } from '../../utils/errors';
import type { UpdateProfileInput } from './users.schema';

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name: input.name },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}
