import FlowCanvas from "@/components/flow-canvas"

export default async function FlowPage({ params }: { params: { id: string } }) {
  return <FlowCanvas flowId={params.id} />
}