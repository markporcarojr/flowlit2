/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import AuthPanel from "@/components/auth-panel";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Circle,
  Download,
  Square,
  TriangleRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
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
} from "reactflow";
import "reactflow/dist/style.css";
import DecisionNode from "./decision-node";
import TipsWindow from "./tips-window";
import WaypointNode from "./waypoint-node";

const nodeTypes = { decision: DecisionNode, waypoint: WaypointNode };
const edgeTypes = { step: StepEdge };

// const COLORS = [
//   { name: "White", value: "#ffffff" },
//   { name: "Green", value: "#dcfce7" },
//   { name: "Red", value: "#fee2e2" },
//   { name: "Yellow", value: "#fef9c3" },
//   { name: "Blue", value: "#e0f2fe" },
// ];

const COMPONENTS = [
  {
    type: "start-end",
    label: "Start / End",
    icon: <Circle className="w-3.5 h-3.5" />,
    style: "rounded-full",
  },
  {
    type: "default",
    label: "Process",
    icon: <Square className="w-3.5 h-3.5" />,
    style: "rounded-md",
  },
  {
    type: "decision",
    label: "Decision",
    icon: <TriangleRight className="w-3.5 h-3.5 rotate-45" />,
    style: "rounded-md",
  },
];

interface MenuState {
  top: number;
  left: number;
  projectedPosition: { x: number; y: number };
}

interface FlowCanvasProps {
  flowId: string;
}

export default function FlowCanvas({ flowId }: FlowCanvasProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savedRecently, setSavedRecently] = useState(false);
  const [flowTitle, setFlowTitle] = useState("Untitled Flow");
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/flows/${flowId}`)
      .then((res) => res.json())
      .then((flow) => {
        if (flow.nodes) setNodes(flow.nodes);
        if (flow.edges) setEdges(flow.edges);
        if (flow.title) setFlowTitle(flow.title);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  const save = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        setSaving(true);
        setSavedRecently(false);
        await fetch(`/api/flows/${flowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
        });
        setSaving(false);
        setSavedRecently(true);
        setTimeout(() => setSavedRecently(false), 2000);
      }, 1000);
    },
    [flowId],
  );

  const onNodesChangeInternal = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        save(updated, edges);
        return updated;
      });
    },
    [setNodes, edges, save],
  );

  const onConnectStart = useCallback(
    (
      _: any,
      { nodeId, handleId }: { nodeId: string | null; handleId: string | null },
    ) => {
      connectingNodeId.current = nodeId;
      connectingHandleId.current = handleId;
    },
    [],
  );

  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingNodeId.current || !reactFlowInstance) return;
      const targetIsPane = event.target.classList.contains("react-flow__pane");
      if (targetIsPane) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        setTimeout(() => {
          setMenu({
            top: clientY,
            left: clientX,
            projectedPosition: reactFlowInstance.screenToFlowPosition({
              x: clientX,
              y: clientY,
            }),
          });
        }, 10);
      }
    },
    [reactFlowInstance],
  );

  const createNodeAndConnect = (type: string) => {
    if (!menu || !connectingNodeId.current) return;
    const newNodeId = `node_${Date.now()}`;
    const nodeWidth = type === "decision" ? 120 : 150;
    const position = {
      x: menu.projectedPosition.x - nodeWidth / 2,
      y: menu.projectedPosition.y,
    };

    const newNode: Node = {
      id: newNodeId,
      type: type === "decision" ? "decision" : "default",
      position,
      data: { label: `New ${type}`, color: "#ffffff" },
      style:
        type === "decision"
          ? {}
          : ({
              backgroundColor: "#ffffff",
              borderRadius: type === "start-end" ? "40px" : "8px",
              border: "2px solid #94a3b8",
              width: 150,
              minHeight: 40,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center" as const,
              fontWeight: "700",
              fontSize: "9px",
              textTransform: "uppercase" as const,
            } as CSSProperties),
    };

    const isYes = connectingHandleId.current === "yes";
    const isNo = connectingHandleId.current === "no";
    const edgeColor = isYes ? "#22c55e" : isNo ? "#ef4444" : "#64748b";

    const newEdge: Edge = {
      id: `e-${connectingNodeId.current}-${newNodeId}`,
      source: connectingNodeId.current,
      sourceHandle: connectingHandleId.current,
      target: newNodeId,
      type: "step",
      label: isYes ? "YES" : isNo ? "NO" : "",
      labelStyle: { fill: edgeColor, fontWeight: 900, fontSize: "10px" },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
      animated: true,
      style: { strokeWidth: 2, stroke: edgeColor },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 20,
        height: 20,
      },
    };

    const updatedNodes = nodes.concat(newNode);
    const updatedEdges = edges.concat(newEdge);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    save(updatedNodes, updatedEdges);
    setMenu(null);
    connectingNodeId.current = null;
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const isYes = params.sourceHandle === "yes";
      const isNo = params.sourceHandle === "no";
      const edgeColor = isYes ? "#22c55e" : isNo ? "#ef4444" : "#64748b";
      setEdges((eds) => {
        const updated = addEdge(
          {
            ...params,
            type: "step",
            label: isYes ? "YES" : isNo ? "NO" : "",
            labelStyle: { fill: edgeColor, fontWeight: 900, fontSize: "10px" },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
            animated: true,
            style: { strokeWidth: 2, stroke: edgeColor },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeColor,
              width: 20,
              height: 20,
            },
          },
          eds,
        );
        save(nodes, updated);
        return updated;
      });
    },
    [setEdges, nodes, save],
  );

  const onNodeDragStop = useCallback(
    (_: any, draggedNode: Node) => {
      const snapDistance = 30;
      const getGeometry = (node: Node) => {
        const isDecision = node.type === "decision";
        const isWaypoint = node.type === "waypoint";
        const w = node.width || (isDecision ? 112 : isWaypoint ? 1 : 150);
        const h = node.height || (isDecision ? 112 : isWaypoint ? 1 : 40);
        return {
          centerX: node.position.x + w / 2,
          centerY: node.position.y + h / 2,
          w,
          h,
        };
      };

      const dGeo = getGeometry(draggedNode);
      let finalX = draggedNode.position.x;
      let finalY = draggedNode.position.y;
      let snapped = false;

      nodes.forEach((other) => {
        if (other.id === draggedNode.id) return;
        const oGeo = getGeometry(other);
        if (Math.abs(dGeo.centerX - oGeo.centerX) < snapDistance) {
          finalX = oGeo.centerX - dGeo.w / 2;
          snapped = true;
        }
        if (Math.abs(dGeo.centerY - oGeo.centerY) < snapDistance) {
          finalY = oGeo.centerY - dGeo.h / 2;
          snapped = true;
        }
      });

      if (snapped) {
        setNodes((nds) => {
          const updated = nds.map((n) =>
            n.id === draggedNode.id
              ? { ...n, position: { x: finalX, y: finalY } }
              : n,
          );
          save(updated, edges);
          return updated;
        });
      }
    },
    [nodes, setNodes, edges, save],
  );

  const onEdgeDoubleClick = useCallback(
    (_: any, edge: Edge) => {
      if (!reactFlowInstance) return;
      const position = reactFlowInstance.screenToFlowPosition({
        x: _.clientX,
        y: _.clientY,
      });
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return;

      const dx = position.x - (sourceNode.position.x + 75);
      const dy = position.y - (sourceNode.position.y + 20);
      const entrySide =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "l" : "r") : dy > 0 ? "t" : "b";
      const exitMap: Record<string, string> = {
        l: "r-src",
        r: "l-src",
        t: "b-src",
        b: "t-src",
      };
      const waypointId = `waypoint-${Date.now()}`;

      const edgeA: Edge = {
        id: `eA-${waypointId}`,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: waypointId,
        targetHandle: entrySide,
        type: "step",
        animated: true,
        style: { strokeWidth: 2, stroke: "#64748b" },
      };
      const edgeB: Edge = {
        id: `eB-${waypointId}`,
        source: waypointId,
        sourceHandle: exitMap[entrySide],
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: "step",
        label: edge.label,
        labelStyle: edge.labelStyle,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
        style: edge.style,
      };

      setNodes((nds) => [
        ...nds,
        {
          id: waypointId,
          type: "waypoint",
          position,
          data: {},
          width: 1,
          height: 1,
        },
      ]);
      setEdges((eds) => [...eds.filter((e) => e.id !== edge.id), edgeA, edgeB]);
    },
    [reactFlowInstance, nodes, setNodes, setEdges],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type: type === "decision" ? "decision" : "default",
        position,
        data: { label: `New ${type}`, color: "#ffffff" },
        style:
          type === "decision"
            ? {}
            : ({
                backgroundColor: "#ffffff",
                borderRadius: type === "start-end" ? "40px" : "8px",
                border: "2px solid #94a3b8",
                width: 150,
                minHeight: 40,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center" as const,
                fontWeight: "700",
                fontSize: "9px",
                textTransform: "uppercase" as const,
              } as CSSProperties),
      };
      setNodes((nds) => {
        const updated = [...nds, newNode];
        save(updated, edges);
        return updated;
      });
    },
    [reactFlowInstance, setNodes, edges, save],
  );

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  label,
                },
              }
            : n,
        );

        save(updated, edges);
        return updated;
      });
    },
    [setNodes, edges, save],
  );

  const updateNodeColor = useCallback(
    (nodeId: string, color: string) => {
      setNodes((nds) => {
        const updated = nds.map((n) => {
          if (n.id !== nodeId) return n;

          // Decision nodes must NOT get wrapper backgroundColor,
          // otherwise React Flow paints the square bounding box.
          if (n.type === "decision") {
            return {
              ...n,
              data: {
                ...n.data,
                color,
              },
              style: {
                ...n.style,
                backgroundColor: "transparent",
              },
            };
          }

          // Default / start-end nodes use wrapper styling.
          return {
            ...n,
            data: {
              ...n.data,
              color,
            },
            style: {
              ...n.style,
              backgroundColor: color,
            },
          };
        });

        save(updated, edges);
        return updated;
      });
    },
    [setNodes, edges, save],
  );

  const exportToPdf = useCallback(() => {
    if (nodes.length === 0) return;
    setSelectedNodeId(null);
    setTimeout(() => {
      const nodesRect = getRectOfNodes(nodes);
      const viewport = document.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement;
      const padding = 50;
      const width = nodesRect.width + padding * 2;
      const height = nodesRect.height + padding * 2;

      toPng(viewport, {
        backgroundColor: "#f8fafc",
        width,
        height,
        pixelRatio: 3,
        skipFonts: true,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${-nodesRect.x + padding}px, ${-nodesRect.y + padding}px) scale(1)`,
        },
      }).then((dataUrl) => {
        const pdf = new jsPDF({
          orientation: width > height ? "l" : "p",
          unit: "px",
          format: [width, height],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
        pdf.save("flowlit-document.pdf");
      });
    }, 100);
  }, [nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <TooltipProvider>
      <div className="flex w-screen h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 uppercase">
        <ReactFlowProvider>
          {/* LEFT SIDEBAR */}
          <aside className="w-64 h-full bg-white border-r border-slate-200 p-6 z-30 shadow-xl flex flex-col gap-4">
            {/* Header */}
            <div className=" flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => router.push("/")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Back to dashboard</TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-black italic text-xl shrink-0">
                  F
                </div>
                <h1 className="text-xl font-black tracking-tighter text-blue-600 uppercase">
                  Flowlit
                </h1>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 truncate">
                {flowTitle}
              </p>
              <span
                className={`text-[9px] uppercase tracking-widest font-bold transition-opacity ${saving ? "text-blue-400 opacity-100" : "text-slate-300 opacity-60"}`}
              >
                {saving ? "Saving..." : "Saved"}
              </span>
            </div>

            <Separator />

            {/* Components */}
            <div className=" flex flex-col gap-2">
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow", "start-end");
                  const node = e.currentTarget.cloneNode(true) as HTMLElement;
                  node.style.position = "absolute";
                  node.style.top = "-1000px";
                  node.style.left = "-1000px";
                  document.body.appendChild(node);
                  e.dataTransfer.setDragImage(
                    node,
                    node.offsetWidth / 2,
                    node.offsetHeight / 2,
                  );
                  setTimeout(() => document.body.removeChild(node), 0);
                }}
                className="flex items-center justify-center px-3 py-2.5 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 cursor-grab transition-all rounded-full"
              >
                <span className="text-xs font-medium text-slate-600">
                  Start / End
                </span>
              </div>

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow", "default");
                  const clone = e.currentTarget.cloneNode(true) as HTMLElement;
                  clone.style.position = "absolute";
                  clone.style.top = "-1000px";
                  document.body.appendChild(clone);
                  e.dataTransfer.setDragImage(
                    clone,
                    clone.offsetWidth / 2,
                    clone.offsetHeight / 2,
                  );
                  setTimeout(() => document.body.removeChild(clone), 0);
                }}
                className="flex items-center justify-center px-3 py-2.5 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 cursor-grab transition-all rounded-md"
              >
                <span className="text-xs font-medium text-slate-600">
                  Process
                </span>
              </div>

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow", "decision");
                  const clone = e.currentTarget.cloneNode(true) as HTMLElement;
                  clone.style.position = "absolute";
                  clone.style.top = "-1000px";
                  document.body.appendChild(clone);
                  e.dataTransfer.setDragImage(
                    clone,
                    clone.offsetWidth / 2,
                    clone.offsetHeight / 2,
                  );
                  setTimeout(() => document.body.removeChild(clone), 0);
                }}
                onDragEnd={(e) => {
                  // reset after drag
                  e.currentTarget.style.transform = "";
                }}
                className="flex items-center justify-center px-3 py-2.5 border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-300 cursor-grab transition-all rounded-md"
              >
                <span className="text-xs font-medium text-yellow-700">
                  Decision
                </span>
              </div>
            </div>

            {/* Bottom actions */}
            <div className=" mt-auto flex flex-col gap-2 ">
              <Button
                variant="outline"
                color="blue"
                className="w-full gap-2 font-bold text-center cursor-pointer bg-blue-800 hover:bg-blue-600 text-white"
                onClick={() => setShowTips((prev) => !prev)}
              >
                {showTips ? "Hide Tips" : "Show Tips"}
              </Button>
              <Button
                className="w-full gap-2 font-bold hover:bg-[#2d2d2d] cursor-pointer"
                onClick={exportToPdf}
              >
                <Download className="w-3.5 h-3.5 " />
                Export PDF
              </Button>
              <Separator className="my-1" />
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
              onNodeClick={(_, node) =>
                node.type !== "waypoint" && setSelectedNodeId(node.id)
              }
              onPaneClick={() => {
                setSelectedNodeId(null);
                setMenu(null);
              }}
              onMoveStart={() => setMenu(null)}
              onNodeDragStop={onNodeDragStop}
              panOnDrag={[1, 2]}
              selectionOnDrag
              panOnScroll
              fitView
            >
              <Background
                color="#e2e8f0"
                gap={20}
                variant={BackgroundVariant.Dots}
                size={1}
              />
              <Controls className="shadow-sm" />
            </ReactFlow>

            {showTips && <TipsWindow onClose={() => setShowTips(false)} />}

            {/* Context menu */}
            {menu && (
              <div
                className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-37.5"
                style={{ top: menu.top, left: menu.left - 224 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest px-2 py-1">
                  Add node
                </p>
                {COMPONENTS.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => createNodeAndConnect(type)}
                    className="flex items-center gap-2 text-xs text-slate-700 px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
                  >
                    <span className="text-slate-400">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </main>

          {/* RIGHT PROPERTIES PANEL */}
          <aside
            className={`w-64 h-full bg-white border-l border-slate-100 flex flex-col z-30 shadow-sm transition-transform duration-300 ${selectedNodeId ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Properties
              </h2>
            </div>

            <div className="flex-1 px-5 py-4">
              {selectedNode ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Label
                    </label>
                    <input
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                      value={selectedNode.data.label}
                      onChange={(e) => {
                        if (!selectedNodeId) return;
                        updateNodeLabel(selectedNodeId, e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Color
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        "#ffffff",
                        "#dcfce7",
                        "#fee2e2",
                        "#fef9c3",
                        "#e0f2fe",
                        "#f3e8ff",
                        "#ffedd5",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            selectedNodeId && updateNodeColor(selectedNodeId, c)
                          }
                          className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${
                            selectedNode.data.color === c
                              ? "border-blue-500 scale-110 shadow-md"
                              : "border-slate-200"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-6 h-6 rounded-md border-2 border-dashed border-slate-300 hover:border-slate-400 flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              backgroundColor:
                                selectedNode.data.color || "#ffffff",
                            }}
                          />
                        </PopoverTrigger>
                        <PopoverContent side="left" className="w-auto p-3">
                          <HexColorPicker
                            color={selectedNode.data.color || "#ffffff"}
                            onChange={(color) =>
                              selectedNodeId &&
                              updateNodeColor(selectedNodeId, color)
                            }
                          />
                          <input
                            className="mt-2 w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono outline-none focus:border-blue-400"
                            value={selectedNode.data.color || "#ffffff"}
                            onChange={(e) =>
                              selectedNodeId &&
                              updateNodeColor(selectedNodeId, e.target.value)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setNodes((nds) =>
                        nds.filter((n) => n.id !== selectedNodeId),
                      );
                      setSelectedNodeId(null);
                    }}
                  >
                    Delete Node
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="w-8 h-8 border-2 border-dashed border-slate-200 rounded-lg" />
                  <p className="text-xs text-slate-300 text-center">
                    Select a node to edit
                  </p>
                </div>
              )}
            </div>
          </aside>
        </ReactFlowProvider>
      </div>
    </TooltipProvider>
  );
}
