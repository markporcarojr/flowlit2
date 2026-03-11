'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createFlowSchema, CreateFlowInput } from '@/lib/schemas'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CreateFlowFormProps {
  onSuccess?: () => void
}

export default function CreateFlowForm({ onSuccess }: CreateFlowFormProps) {
  const router = useRouter()

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CreateFlowInput>({
    resolver: zodResolver(createFlowSchema),
    defaultValues: { title: '' },
  })

  async function onSubmit(values: CreateFlowInput) {
    const res = await fetch('/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      setError('title', { message: 'Failed to create flow' })
      return
    }

    const flow = await res.json()
    onSuccess?.()
    router.push(`/flow/${flow.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Flow Name
        </label>
        <Input
          {...register('title')}
          placeholder="e.g. Onboarding Process"
          className="font-mono border-2 border-slate-200 focus:border-blue-500 rounded-xl"
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl py-5"
      >
        {isSubmitting ? 'Creating...' : 'Create Flow'}
      </Button>
    </form>
  )
}