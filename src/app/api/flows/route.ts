import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createFlowSchema } from "@/lib/schemas"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return new Response("User not found", { status: 404 })

  const flows = await db.flow.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  })

  return Response.json(flows)
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return new Response("User not found", { status: 404 })

  const body = await req.json()
  const parsed = createFlowSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const flow = await db.flow.create({
    data: {
      title: parsed.data.title,
      nodes: [],
      edges: [],
      userId: user.id,
    },
  })

  return Response.json(flow, { status: 201 })
}