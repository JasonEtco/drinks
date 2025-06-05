import { z } from "zod";
import { GlassType } from "./types.js";

// Zod schema for Ingredient
export const IngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  amount: z.number().positive("Ingredient amount must be positive"),
  unit: z.string().min(1, "Ingredient unit is required"),
});

// Zod schema for GlassType enum
export const GlassTypeSchema = z.nativeEnum(GlassType);

// Zod schema for Recipe creation (without id, createdAt, updatedAt)
export const CreateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  ingredients: z.array(IngredientSchema).min(1, "At least one ingredient is required"),
  instructions: z.string().min(1, "Instructions are required"),
  glass: GlassTypeSchema.optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).default([]),
}).required({
  name: true,
  ingredients: true,
  instructions: true,
  tags: true,
}).strict();

// Zod schema for Recipe update (all fields optional)
export const UpdateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").optional(),
  description: z.string().optional(),
  ingredients: z.array(IngredientSchema).min(1, "At least one ingredient is required").optional(),
  instructions: z.string().min(1, "Instructions are required").optional(),
  glass: GlassTypeSchema.optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).partial();

// Zod schema for chat message history item
export const ChatHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// Zod schema for chat message request
export const ChatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
  history: z.array(ChatHistoryItemSchema).optional().default([]),
});

// Type exports for convenience
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ChatHistoryItem = z.infer<typeof ChatHistoryItemSchema>;