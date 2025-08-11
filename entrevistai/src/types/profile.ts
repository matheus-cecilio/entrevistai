import { z } from "zod";

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  updated_at: z.string(),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50, "Nome muito longo"),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
