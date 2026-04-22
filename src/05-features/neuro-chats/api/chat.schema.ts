import { z } from 'zod';

// 실제 shape: chat.controller.ts 7행 확인 — { message, groupId }
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  groupId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

// 실제 shape: chat.controller.ts 32행 확인 — { message, email }
export const chatAskSchema = z.object({
  email: z.email(),
  message: z.string().min(1).max(2000),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ChatAskInput = z.infer<typeof chatAskSchema>;
