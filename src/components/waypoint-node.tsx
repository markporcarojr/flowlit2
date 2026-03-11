import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

const WaypointNode = ({ selected }: NodeProps) => {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center group cursor-move">
      <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
        selected ? 'bg-blue-600 scale-125' : 'bg-blue-400 opacity-0 group-hover:opacity-100'
      }`} />

      <Handle type="target" position={Position.Top} id="t" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Top} id="t-src" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />

      <Handle type="target" position={Position.Bottom} id="b" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} id="b-src" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />

      <Handle type="target" position={Position.Left} id="l" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Left} id="l-src" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />

      <Handle type="target" position={Position.Right} id="r" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right} id="r-src" isConnectable={false} style={{ top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}

export default memo(WaypointNode)