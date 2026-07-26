import { z } from "zod";

export const generateListingSchema = z.object({
  titles: z
    .array(
      z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters long")
        .max(300, "Title must not exceed 300 characters")
    )
    .min(2, "At least 2 existing Daraz product titles are required")
    .max(5, "Maximum 5 titles allowed"),
});

export type GenerateListingInput = z.infer<typeof generateListingSchema>;

export const saveListingSchema = z.object({
  inputTitles: z.array(z.string().min(1)).min(2).max(5),
  seoTitle: z.string().min(1, "SEO Title is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  longDescription: z.string().min(1, "Long description is required"),
});

export type SaveListingInput = z.infer<typeof saveListingSchema>;

export interface GenerationResult {
  seoTitle: string;
  shortDescription: string;
  longDescription: string;
}
