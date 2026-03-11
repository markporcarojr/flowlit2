import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { updateFlowSchema } from "@/lib/schemas"

async function getAuthedFlow(clerkId: string, id: string) {
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return null
  const flow = await db.flow.findFirst({ where: { id, userId: user.id } })
  return flow
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const flow = await getAuthedFlow(clerkId, params.id)
  if (!flow) return new Response("Not found", { status: 404 })

  return Response.json(flow)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const flow = await getAuthedFlow(clerkId, params.id)
  if (!flow) return new Response("Not found", { status: 404 })

  const body = await req.json()
  const parsed = updateFlowSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const updated = await db.flow.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const flow = await getAuthedFlow(clerkId, params.id)
  if (!flow) return new Response("Not found", { status: 404 })

  await db.flow.delete({ where: { id: params.id } })

  return new Response(null, { status: 204 })
}