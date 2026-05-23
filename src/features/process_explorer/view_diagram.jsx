import React, { useCallback, useRef } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, Panel, getNodesBounds, getViewportForBounds, MarkerType, ConnectionMode } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { nodeTypes } from "../editor/epc_builder"; // shared rendering types
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, LayoutGrid } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import MovableEdge from "../editor/components/MovableEdge";

const edgeTypes = { smoothstep: MovableEdge };

const NODE_W = 200;
const NODE_H = 60;

function layoutGraph(nodes, edges, direction = "TB") {
    // If no nodes, return empty arrays to avoid dagre errors
    if (!nodes || nodes.length === 0) return [];

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((n) => {
        let w = 200, h = 60;
        if (["rule", "xor", "or", "and"].includes(n.type)) {
            w = 40;
            h = 40;
        }
        g.setNode(n.id, { width: w, height: h });
    });

    edges.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);

    return nodes.map((n) => {
        const pos = g.node(n.id);
        // Fallback if dagre fails to position a node
        const x = pos ? pos.x : 0;
        const y = pos ? pos.y : 0;

        return {
            ...n,
            position: { x: x - NODE_W / 2, y: y - NODE_H / 2 },
            draggable: false,
            selectable: false,
        };
    });
}

export default function EPCPreview({ model, logoUrl, orgName, height = "600px", className = "", showControls = true, showMiniMap = true, showExternalLink = true, tree = [], departments = [], isLoading = false }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const flowWrapper = useRef(null);

    if (isLoading && model.type !== 'folder') {
        return (
            <div className={`w-full flex items-center justify-center border rounded-lg transition-all duration-300 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-700'} ${className}`} style={{ height }}>
                <div className="flex flex-col items-center gap-3 animate-pulse">
                     <div className="w-8 h-8 rounded-full border-4 border-theme-border border-t-indigo-500 animate-spin"></div>
                     <span className="text-sm text-theme-tertiary">Loading preview...</span>
                </div>
            </div>
        );
    }

    // Helper to find department name by process ID
    const findDeptName = (targetId) => {
        const findNode = (nodes) => {
            for (const n of nodes) {
                if (n._id === targetId) return n;
                if (n.children) {
                    const found = findNode(n.children);
                    if (found) return found;
                }
            }
            return null;
        };
        const node = findNode(tree);
        if (!node) return null;
        return departments.find(d => d._id === node.department_id)?.name;
    };

   
   
    const normalizedNodes = (model?.nodes || [])
        .filter(n => !n.data?.isMeta && !n.isMeta)
        .map((n) => {
            let linkedDept = n.data?.linkedProcessDepartment;
            if (n.data?.linkedProcessId && (!linkedDept || linkedDept === "Unknown Department") && tree.length > 0) {
                linkedDept = findDeptName(n.data.linkedProcessId) || "Other";
            }

            return {
                ...n,
                data: {
                    ...n.data, // 🔥 FIX: Preserve existing data (template, color, etc.)
                    label: n.label || n.data?.label || t('unnamed'),
                    icon: n.icon || n.data?.icon || null,  // <-- prevent undefined icon crash
                    linkedProcessDepartment: linkedDept,
                    onEdit: () => { } // preview mode: no editing
                }
            };
        });

    const visibleNodeIds = new Set(normalizedNodes.map(n => n.id));
    const filteredEdges = (model?.edges || []).filter(e =>
        visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target) && !e.isMeta
    );

    // Get layout direction from model or default to TB
    const layoutDirection = model.layout_direction || 'TB';

  
    // If we have saved positions, use them. Only auto-layout if it looks like a raw/new diagram.
    const hasSavedPositions = normalizedNodes.length > 0 &&
        (normalizedNodes[0].position?.x !== undefined || normalizedNodes[0].positionAbsolute?.x !== undefined);

    const nodes = hasSavedPositions
        ? normalizedNodes.map(n => ({ ...n, draggable: false, selectable: false }))
        : layoutGraph(normalizedNodes, filteredEdges, layoutDirection);

    const edges = filteredEdges.map((e) => {
        // Strict handle resolution
        let sourceHandle = e.sourceHandle;
        let targetHandle = e.targetHandle;

        // Filter out bad data ("undefined" strings)
        if (sourceHandle === "undefined" || sourceHandle === "null") sourceHandle = undefined;
        if (targetHandle === "undefined" || targetHandle === "null") targetHandle = undefined;

        // Fallback defaults ONLY if undefined (matches editor logic)
        if (!sourceHandle) sourceHandle = (layoutDirection === 'LR' ? 'r' : 'b');
        if (!targetHandle) targetHandle = (layoutDirection === 'LR' ? 'l' : 't');

        return {
            ...e,
            sourceHandle,
            targetHandle,
            type: e.type || 'smoothstep',
            data: { ...e.data, readOnly: true },
            animated: true,
            style: { stroke: theme === 'light' ? '#94a3b8' : "#64748b", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: theme === 'light' ? '#94a3b8' : "#64748b" },
            selectable: false,
        };
    });

    // Output logic moved to Canvas View

    return (
        <div className={`w-full border rounded-lg overflow-hidden relative transition-all duration-300 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-700'} ${className}`} style={{ height }} ref={flowWrapper}>
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.5}
                    connectionMode={ConnectionMode.Loose} // 🔥 FIX: Allow Source-Source connections (FAD nodes)
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnScroll
                    zoomOnScroll
                >
                    <Background color={theme === 'light' ? '#cbd5e1' : "#262626"} gap={20} size={1} />
                    {showControls && (
                        <Controls showInteractive={false} className={`!border-theme-border ${theme === 'light' ? '!bg-white !fill-slate-600 !shadow-sm' : '!bg-neutral-800 !fill-white'}`} />
                    )}
                    {showMiniMap && (
                        <MiniMap
                            pannable
                            zoomable
                            nodeColor={(n) => {
                                if (n.type === 'event') return '#ec4899'; // pink/red
                                if (n.type === 'function') return '#eab308'; // yellow
                                if (n.type === 'role') return '#3b82f6'; // blue
                                return '#64748b';
                            }}
                            maskColor={theme === 'light' ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"}
                            className={`border border-theme-border rounded-lg shadow-xl ${theme === 'light' ? '!bg-white' : '!bg-neutral-900'}`}
                            style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#171717' }}
                        />
                    )}
                    {showExternalLink && (
                        <Panel position="top-right">
                            <button
                                onClick={() => window.location.href = `/editor/${model._id}?mode=view`}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-colors text-sm font-medium ${theme === 'light' ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-neutral-800 hover:bg-indigo-600 text-white border-neutral-700'}`}
                                title={t('viewInCanvas') || "View in Canvas"}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                {t('viewInCanvas') || "View in Canvas"}
                            </button>
                        </Panel>
                    )}
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
