import prisma from '../../prisma.js';
import { CreateConversationInput } from './messaging.schema.js';

export class MessagingService {
  async createConversation(input: CreateConversationInput) {
    // Ensure all participant IDs exist
    const users = await prisma.user.findMany({
      where: { id: { in: input.participantIds } },
    });
    if (users.length !== input.participantIds.length) {
      throw new Error('One or more participants not found');
    }

    return prisma.conversation.create({
      data: {
        type: input.type,
        relatedPatientId: input.relatedPatientId,
        relatedReferralId: input.relatedReferralId,
        participants: {
          createMany: {
            data: input.participantIds.map((userId: string) => ({ userId })),
          },
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        messages: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, email: true } } },
        },
        relatedPatient: { include: { user: { select: { email: true } } } },
        _count: {
          select: {
            messages: {
              where: {
                readReceipts: { none: { userId } },
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new Error('Not a participant of this conversation');

    // Mark unread messages as read
    await prisma.messageReadReceipt.createMany({
      data: (
        await prisma.message.findMany({
          where: {
            conversationId,
            senderId: { not: userId },
            readReceipts: { none: { userId } },
          },
          select: { id: true },
        })
      ).map((m: any) => ({ messageId: m.id, userId })),
      skipDuplicates: true,
    });

    return prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, email: true, role: true } },
        readReceipts: { include: { user: { select: { id: true, email: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, userId: string, content: string, attachmentUrl?: string) {
    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new Error('Not a participant of this conversation');

    return prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        attachmentUrl,
      },
      include: {
        sender: { select: { id: true, email: true, role: true } },
        readReceipts: { include: { user: { select: { id: true, email: true } } } },
      },
    });
  }
}
