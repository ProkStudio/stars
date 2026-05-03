import { z } from "zod";

export const createOrderSchema = z.object({
  skuId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(500),
  telegramUsername: z.string().min(3),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, { message: "Нужно согласие с условиями" }),
  guestEmail: z.string().email().optional().or(z.literal("")),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
