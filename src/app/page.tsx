import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DashboardClient from '@/components/dashboard-client'

export default async function DashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: { flows: { orderBy: { updatedAt: 'desc' } } },
  })

  if (!user) redirect('/sign-in')

  return <DashboardClient user={user!} flows={user!.flows} />
}