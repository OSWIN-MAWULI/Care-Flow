import { z } from 'zod';
import { ConversationType } from '@hms/shared';

export const createConversationSchema = z.object({
  type: z.nativeEnum(ConversationType).default(ConversationType.DIRECT),
  participantIds: z.array(z.string().uuid()).min(1),
  relatedPatientId: z.string().uuid().optional(),
  relatedReferralId: z.string().uuid().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachmentUrl: z.string().url().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
