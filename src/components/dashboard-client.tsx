'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import CreateFlowForm from '@/components/forms/create-flow-form'
import { Plus, GitBranch, Clock, ArrowRight } from 'lucide-react'

interface Flow {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

interface User {
  name: string | null
  email: string
}

interface DashboardClientProps {
  user: User
  flows: Flow[]
}

export default function DashboardClient({ user, flows }: DashboardClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const firstName = user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-[#f0efe8] font-mono">

      {/* HEADER */}
      <header className="border-b border-black/10 bg-white/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic text-sm">F</div>
            <span className="font-black text-lg tracking-tighter uppercase text-blue-600">FlowLit</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 uppercase tracking-widest hidden sm:block">{user.email}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">

        {/* HERO */}
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">Dashboard</p>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none mb-4">
            Hey, {firstName}.
          </h1>
          <p className="text-slate-500 text-sm">
            {flows.length === 0
              ? 'No flows yet. Create your first one.'
              : `${flows.length} flow${flows.length === 1 ? '' : 's'} — pick up where you left off.`}
          </p>
        </div>

        {/* FLOW GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* CREATE NEW */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="group h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                <div className="w-10 h-10 rounded-full border-2 border-slate-300 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">New Flow</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-black tracking-tight uppercase text-lg">Create Flow</DialogTitle>
              </DialogHeader>
              <CreateFlowForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* FLOW CARDS */}
          {flows.map((flow) => (
            <Card
              key={flow.id}
              onClick={() => router.push(`/flow/${flow.id}`)}
              className="group h-48 p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <GitBranch className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <h3 className="font-black text-slate-900 tracking-tight truncate mb-2">{flow.title}</h3>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-widest">
                    {new Date(flow.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* EMPTY STATE */}
        {flows.length === 0 && (
          <div className="mt-8 text-center py-24 border border-dashed border-slate-200 rounded-2xl">
            <GitBranch className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-xs uppercase tracking-widest text-slate-300 font-bold">No flows yet</p>
          </div>
        )}
      </main>
    </div>
  )
}