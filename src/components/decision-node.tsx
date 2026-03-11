import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

interface DecisionNodeData {
  label: string
  color?: string
}

const DecisionNode = ({ data, selected }: NodeProps<DecisionNodeData>) => {
  const label = data.label || ''
  const fontSize = label.length > 20 ? '8px' : label.length > 12 ? '9px' : '10px'

  return (
    <div className={`relative w-30 h-30 flex items-center justify-center overflow-visible transition-all ${selected ? 'scale-105' : ''}`}>
      <div
        className="absolute w-21.5 h-21.5 border-2 border-slate-400 rotate-45 shadow-sm"
        style={{ backgroundColor: data.color || '#fefce8' }}
      />

      <div className="relative z-20 flex items-center justify-center w-15 h-15">
        <div
          className="font-black leading-tight uppercase tracking-tighter text-center wrap-break-word text-slate-800 transition-all duration-200"
          style={{ fontSize }}
        >
          {label}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ top: '17px', backgroundColor: '#64748b' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        style={{ left: '17px', backgroundColor: '#ef4444' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{ right: '17px', backgroundColor: '#22c55e' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-exit"
        style={{ bottom: '17px', backgroundColor: '#64748b' }}
      />
    </div>
  )
}

export default memo(DecisionNode)