import { prisma } from '../../db/prisma/client';
import { NotFoundError } from '../../utils/errors';
import type { CreateDocumentInput } from './documents.schema';

export async function listDocuments(vehicleId?: string) {
  const where: any = {};
  if (vehicleId) where.vehicleId = vehicleId;
  return prisma.vehicleDocument.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function getDocumentById(id: string) {
  const doc = await prisma.vehicleDocument.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

export async function createDocument(input: CreateDocumentInput) {
  return prisma.vehicleDocument.create({
    data: {
      vehicleId: input.vehicleId,
      name: input.name,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
    },
  });
}

export async function deleteDocument(id: string) {
  const doc = await prisma.vehicleDocument.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError('Document not found');
  await prisma.vehicleDocument.delete({ where: { id } });
  return { id };
}
