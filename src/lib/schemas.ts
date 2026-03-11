import { z } from "zod"

export const createFlowSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
})

export const updateFlowSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
})

export type CreateFlowInput = z.infer<typeof createFlowSchema>
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>