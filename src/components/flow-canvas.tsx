/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import AuthPanel from '@/components/auth-panel'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  Node,
  NodeChange,
  ReactFlowInstance,
  ReactFlowProvider,
  StepEdge,
  addEdge,
  applyNodeChanges,
  getRectOfNodes,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import DecisionNode from './decision-node'
import TipsWindow from './tips-window'
import WaypointNode from './waypoint-node'

const nodeTypes = { decision: DecisionNode, waypoint: WaypointNode }
const edgeTypes = { step: StepEdge }

const COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light Green', value: '#dcfce7' },
  { name: 'Light Red', value: '#fee2e2' },
  { name: 'Light Yellow', value: '#fef9c3' },
  { name: 'Sky Blue', value: '#e0f2fe' },
]

interface MenuState {
  top: number
  left: number
  projectedPosition: { x: number; y: number }
}

interface FlowCanvasProps {
  flowId: string
}

export default function FlowCanvas({ flowId }: FlowCanvasProps) {
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(true)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [saving, setSaving] = useState(false)
  const [flowTitle, setFlowTitle] = useState('Untitled Flow')
  const connectingNodeId = useRef<string | null>(null)
  const connectingHandleId = useRef<string | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  // --- LOAD FLOW ON MOUNT ---
  useEffect(() => {
    fetch(`/api/flows/${flowId}`)
      .then(res => res.json())
      .then(flow => {
        if (flow.nodes) setNodes(flow.nodes)
        if (flow.edges) setEdges(flow.edges)
        if (flow.title) setFlowTitle(flow.title)
      })
  }, [flowId])

  // --- AUTO-SAVE ---
  const save = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      await fetch(`/api/flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
      })
      setSaving(false)
    }, 1000)
  }, [flowId])

  const onNodesChangeInternal = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds)
        save(updated, edges)
        return updated
      })
    },
    [setNodes, edges, save]
  )

  const onConnectStart = useCallback((_: any, { nodeId, handleId }: { nodeId: string | null, handleId: string | null }) => {
    connectingNodeId.current = nodeId
    connectingHandleId.current = handleId
  }, [])

  const onConnectEnd = useCallback((event: any) => {
    if (!connectingNodeId.current || !reactFlowInstance) return
    const targetIsPane = event.target.classList.contains('react-flow__pane')
    if (targetIsPane) {
      const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event
      setTimeout(() => {
        setMenu({
          top: clientY,
          left: clientX,
          projectedPosition: reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY }),
        })
      }, 10)
    }
  }, [reactFlowInstance])

  const createNodeAndConnect = (type: string) => {
    if (!menu || !connectingNodeId.current) return
    const newNodeId = `node_${Date.now()}`
    const nodeWidth = type === 'decision' ? 120 : 150
    const position = {
      x: menu.projectedPosition.x - nodeWidth / 2,
      y: menu.projectedPosition.y,
    }

    const newNode: Node = {
      id: newNodeId,
      type: type === 'decision' ? 'decision' : 'default',
      position,
      data: { label: `New ${type}`, color: '#ffffff' },
      style: type === 'decision' ? {} : {
        backgroundColor: '#ffffff',
        borderRadius: type === 'start-end' ? '40px' : '8px',
        border: '2px solid #94a3b8',
        width: 150,
        minHeight: 40,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '9px',
        textTransform: 'uppercase',
      },
    }

    const isYes = connectingHandleId.current === 'yes'
    const isNo = connectingHandleId.current === 'no'
    const edgeColor = isYes ? '#22c55e' : isNo ? '#ef4444' : '#64748b'

    const newEdge: Edge = {
      id: `e-${connectingNodeId.current}-${newNodeId}`,
      source: connectingNodeId.current,
      sourceHandle: connectingHandleId.current,
      target: newNodeId,
      type: 'step',
      label: isYes ? 'YES' : isNo ? 'NO' : '',
      labelStyle: { fill: edgeColor, fontWeight: 900, fontSize: '10px' },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
      animated: true,
      style: { strokeWidth: 2, stroke: edgeColor },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 20, height: 20 },
    }

    const updatedNodes = nodes.concat(newNode)
    const updatedEdges = edges.concat(newEdge)
    setNodes(updatedNodes)
    setEdges(updatedEdges)
    save(updatedNodes, updatedEdges)
    setMenu(null)
    connectingNodeId.current = null
  }

  const onConnect = useCallback((params: Connection) => {
    const isYes = params.sourceHandle === 'yes'
    const isNo = params.sourceHandle === 'no'
    const edgeColor = isYes ? '#22c55e' : isNo ? '#ef4444' : '#64748b'
    setEdges((eds) => {
      const updated = addEdge({
        ...params,
        type: 'step',
        label: isYes ? 'YES' : isNo ? 'NO' : '',
        labelStyle: { fill: edgeColor, fontWeight: 900, fontSize: '10px' },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        animated: true,
        style: { strokeWidth: 2, stroke: edgeColor },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 20, height: 20 },
      }, eds)
      save(nodes, updated)
      return updated
    })
  }, [setEdges, nodes, save])

  const onNodeDragStop = useCallback((_: any, draggedNode: Node) => {
    const snapDistance = 30
    const getGeometry = (node: Node) => {
      const isDecision = node.type === 'decision'
      const isWaypoint = node.type === 'waypoint'
      const w = node.width || (isDecision ? 112 : isWaypoint ? 1 : 150)
      const h = node.height || (isDecision ? 112 : isWaypoint ? 1 : 40)
      return { centerX: node.position.x + w / 2, centerY: node.position.y + h / 2, w, h }
    }

    const dGeo = getGeometry(draggedNode)
    let finalX = draggedNode.position.x
    let finalY = draggedNode.position.y
    let snapped = false

    nodes.forEach((other) => {
      if (other.id === draggedNode.id) return
      const oGeo = getGeometry(other)
      if (Math.abs(dGeo.centerX - oGeo.centerX) < snapDistance) { finalX = oGeo.centerX - dGeo.w / 2; snapped = true }
      if (Math.abs(dGeo.centerY - oGeo.centerY) < snapDistance) { finalY = oGeo.centerY - dGeo.h / 2; snapped = true }
    })

    if (snapped) {
      setNodes((nds) => {
        const updated = nds.map((n) => n.id === draggedNode.id ? { ...n, position: { x: finalX, y: finalY } } : n)
        save(updated, edges)
        return updated
      })
    }
  }, [nodes, setNodes, edges, save])

  const onEdgeDoubleClick = useCallback((_: any, edge: Edge) => {
    if (!reactFlowInstance) return
    const position = reactFlowInstance.screenToFlowPosition({ x: _.clientX, y: _.clientY })
    const sourceNode = nodes.find(n => n.id === edge.source)
    if (!sourceNode) return

    const dx = position.x - (sourceNode.position.x + 75)
    const dy = position.y - (sourceNode.position.y + 20)
    const entrySide = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'l' : 'r') : (dy > 0 ? 't' : 'b')
    const exitMap: Record<string, string> = { l: 'r-src', r: 'l-src', t: 'b-src', b: 't-src' }
    const waypointId = `waypoint-${Date.now()}`

    const edgeA: Edge = { id: `eA-${waypointId}`, source: edge.source, sourceHandle: edge.sourceHandle, target: waypointId, targetHandle: entrySide, type: 'step', animated: true, style: { strokeWidth: 2, stroke: '#64748b' } }
    const edgeB: Edge = { id: `eB-${waypointId}`, source: waypointId, sourceHandle: exitMap[entrySide], target: edge.target, targetHandle: edge.targetHandle, type: 'step', label: edge.label, labelStyle: edge.labelStyle, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }, style: edge.style }

    setNodes((nds) => [...nds, { id: waypointId, type: 'waypoint', position, data: {}, width: 1, height: 1 }])
    setEdges((eds) => [...eds.filter((e) => e.id !== edge.id), edgeA, edgeB])
  }, [reactFlowInstance, nodes, setNodes, setEdges])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/reactflow')
    if (!type || !reactFlowInstance) return
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })

    const newNode = {
      id: `node_${Date.now()}`,
      type: type === 'decision' ? 'decision' : 'default',
      position,
      data: { label: `New ${type}`, color: '#ffffff' },
      style: type === 'decision' ? {} : {
        backgroundColor: '#ffffff',
        borderRadius: type === 'start-end' ? '40px' : '8px',
        border: '2px solid #94a3b8',
        width: 150,
        minHeight: 40,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '9px',
        textTransform: 'uppercase',
      },
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      save(updated, edges)
      return updated
    })
  }, [reactFlowInstance, setNodes, edges, save])

  const exportToPdf = useCallback(() => {
    if (nodes.length === 0) return
    setSelectedNodeId(null)
    setTimeout(() => {
      const nodesRect = getRectOfNodes(nodes)
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement
      const padding = 50
      const width = nodesRect.width + padding * 2
      const height = nodesRect.height + padding * 2

      toPng(viewport, {
        backgroundColor: '#f8fafc',
        width, height, pixelRatio: 3, skipFonts: true,
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${-nodesRect.x + padding}px, ${-nodesRect.y + padding}px) scale(1)` },
      }).then((dataUrl) => {
        const pdf = new jsPDF({ orientation: width > height ? 'l' : 'p', unit: 'px', format: [width, height] })
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
        pdf.save('flowlit-document.pdf')
      })
    }, 100)
  }, [nodes])

  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  return (
    <div className="flex w-screen h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ReactFlowProvider>

        {/* LEFT SIDEBAR */}
        <aside className="w-64 h-full bg-white border-r border-slate-200 p-6 z-30 shadow-xl flex flex-col gap-4">
          
          {/* BACK + LOGO */}
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => router.push('/')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">F</div>
            <h1 className="text-xl font-black tracking-tighter text-blue-600 uppercase">Flowlit</h1>
          </div>

          {/* FLOW TITLE + SAVE STATUS */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 truncate">{flowTitle}</p>
            <span className={`text-[9px] uppercase tracking-widest font-bold transition-opacity ${saving ? 'text-blue-400 opacity-100' : 'text-slate-300 opacity-60'}`}>
              {saving ? 'Saving...' : 'Saved'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-5 border-2 border-slate-200 rounded-[40px] cursor-grab font-black text-[13px] uppercase hover:border-blue-400 transition-all text-center" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'start-end')} draggable>Start / End</div>
            <div className="p-5 border-2 border-slate-200 rounded-[15px] cursor-grab font-black text-[13px] uppercase hover:border-blue-400 transition-all text-center" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'default')} draggable>Process Step</div>
            <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-xl cursor-grab font-black text-[13px] uppercase text-black text-center" onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'decision')} draggable>Decision</div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={() => setShowTips(prev => !prev)}
              className={`py-4 border-2 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${showTips ? 'border-blue-200 bg-blue-800 text-blue-100' : 'border-blue-200 text-blue-400 hover:bg-blue-800'}`}
            >
              {showTips ? 'Hide Tips' : 'Show Tips'}
            </button>
            <button
              onClick={exportToPdf}
              className="py-4 bg-slate-950 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-black"
            >
              Export as PDF
            </button>

            <AuthPanel />
          </div>
        </aside>

        {/* MAIN CANVAS */}
        <main className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChangeInternal}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onNodeClick={(_, node) => node.type !== 'waypoint' && setSelectedNodeId(node.id)}
            onPaneClick={() => { setSelectedNodeId(null); setMenu(null) }}
            onMoveStart={() => setMenu(null)}
            onNodeDragStop={onNodeDragStop}
            panOnDrag={[1, 2]}
            selectionOnDrag
            panOnScroll
            fitView
          >
            <Background color="#cbd5e1" gap={24}  />
            <Controls />
          </ReactFlow>

          {showTips && <TipsWindow onClose={() => setShowTips(false)} />}

          {menu && (
            <div
              className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 flex flex-col gap-1 min-w-[140px]"
              style={{ top: menu.top, left: menu.left - 256 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="text-[8px] font-black text-slate-400 uppercase px-2 py-1 tracking-widest">Connect to:</p>
              <button onClick={() => createNodeAndConnect('start-end')} className="text-[10px] font-bold uppercase p-2 hover:bg-blue-50 rounded-lg text-left transition-colors">Start / End</button>
              <button onClick={() => createNodeAndConnect('default')} className="text-[10px] font-bold uppercase p-2 hover:bg-blue-50 rounded-lg text-left transition-colors">Process Step</button>
              <button onClick={() => createNodeAndConnect('decision')} className="text-[10px] font-bold uppercase p-2 hover:bg-yellow-50 rounded-lg text-left text-yellow-700 transition-colors">Decision</button>
            </div>
          )}
        </main>

        {/* RIGHT PROPERTIES PANEL */}
        <aside className={`w-80 h-full bg-white border-l border-slate-600 p-8 z-30 shadow-2xl transition-transform duration-700 ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}>
          <h2 className="text-[18px] font-bold text-slate-800 uppercase tracking-widest mb-8">Node Properties</h2>
          {selectedNode ? (
            <div className="space-y-4">
              <input
                className="w-full p-3 border-2 border-slate-500 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                value={selectedNode.data.label}
                onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
              />
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, color: c.value }, style: { ...n.style, backgroundColor: c.value } } : n))}
                    className={`h-8 rounded-lg border-2 ${selectedNode.data.color === c.value ? 'border-blue-500 scale-110 shadow-md' : 'border-black'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <button
                onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNodeId)); setSelectedNodeId(null) }}
                className="w-full py-3 border border-black bg-red-100 text-red-400 rounded-xl text-[14px] font-black uppercase tracking-widest mt-10 hover:bg-red-800 hover:text-red-200 transition-colors"
              >
                Delete Node
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <div className="w-12 h-12 border-4 border-dashed border-slate-200 rounded-full mb-4" />
              <p className="text-xs italic font-medium text-center">Select a node to edit properties</p>
            </div>
          )}
        </aside>

      </ReactFlowProvider>
    </div>
  )
}