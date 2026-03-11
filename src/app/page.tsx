import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import DashboardClient from '@/components/dashboard-client'

export default async function DashboardPage() {
  const { userId: clerkId } = await auth.protect()

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { flows: { orderBy: { updatedAt: 'desc' } } },
  })

  if (!user) return <div>Setting up your account...</div>

  return <DashboardClient user={user} flows={user.flows} />
}