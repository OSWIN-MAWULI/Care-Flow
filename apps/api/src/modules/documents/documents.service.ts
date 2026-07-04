import prisma from '../../prisma.js';

export class DocumentsService {
  async upload(medicalRecordId: string, fileUrl: string, fileType: string, userId: string) {
    const doc = await prisma.document.create({
      data: {
        medicalRecordId,
        fileUrl,
        fileType,
        uploadedById: userId,
      },
      include: {
        medicalRecord: {
          include: {
            patient: { include: { user: { select: { email: true } } } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPLOAD',
        entityType: 'documents',
        entityId: doc.id,
      },
    });

    return doc;
  }

  async findByMedicalRecord(medicalRecordId: string) {
    return prisma.document.findMany({
      where: { medicalRecordId },
      include: { uploadedBy: { select: { email: true } } },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
