import FlowCanvas from '@/components/flow-canvas'

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FlowCanvas flowId={id} />
}