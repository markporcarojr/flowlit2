interface TipsWindowProps {
  onClose: () => void
}

const tips = [
  "Drag your first node onto the canvas (typically a Start / End node).",
  "Drag off of a node pin and release to place a new node auto-connected.",
  "Left-click and drag on the canvas to select multiple nodes.",
  "Double-click on a wire to add a waypoint to organize your wires.",
  "Click on a node to select it, edit details in properties panel on right side of screen.",
  "Nodes will auto-align, center-to-center, horizontally & vertically when dragged close enough to center-line of another node.",
]

export default function TipsWindow({ onClose }: TipsWindowProps) {
  return (
    <div className="absolute top-2.5 left-2.5 w-150 bg-white border border-black rounded-[21px] p-4 shadow-[0_0_20px_0_rgba(0,0,255,0.4)] z-10 font-[Tahoma]">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-[28px] text-[#333] m-0.5">Tips</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-none text-[36px] cursor-pointer text-[#999] leading-none"
        >
          &times;
        </button>
      </div>

      <ul className="m-0 pl-4 text-base leading-tight text-[#555]">
        {tips.map((tip, index) => (
          <li key={index} className="mb-4">{tip}</li>
        ))}
      </ul>
    </div>
  )
}