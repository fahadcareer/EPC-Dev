import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Panel,
    MarkerType,
    Handle,
    Position,
    useReactFlow,
    getRectOfNodes,
    getTransformForBounds,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider
} from 'reactflow';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useTheme } from '../../contexts/ThemeContext';
import { useGifRecorder } from '../process_explorer/animation/useGifRecorder';
import { Loader2 } from 'lucide-react';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 48;

/**
 * Custom Dashboard Node Component
 */
const DashboardNode = ({ data, id }) => {
    const isStart = data.label?.toLowerCase() === 'start';
    const isComplete = data.label?.toLowerCase() === 'complete';
    const isReview = data.label?.toLowerCase().includes('review');
    const isApprove = data.label?.toLowerCase().includes('approve');
    const isRework = data.label?.toLowerCase().includes('rework');

    const [isEditing, setIsEditing] = React.useState(false);
    const [label, setLabel] = React.useState(data.label);
    const { setNodes } = useReactFlow();

    // Sync local label with incoming data.label
    React.useEffect(() => {
        setLabel(data.label);
    }, [data.label]);

    const baseStyle = "flex items-center justify-center p-3 border-2 transition-all text-[11px] font-bold uppercase tracking-tight relative group cursor-pointer";

    let colorStyle = "bg-[var(--bg-surface)] border-[var(--border-glass)] text-[var(--text-primary)] rounded-lg"; // Default
    if (isStart || isComplete) {
        colorStyle = "bg-slate-800 border-slate-800 text-white rounded-full w-12 h-12";
    } else if (isReview) {
        colorStyle = "bg-[var(--bg-surface)] border-indigo-500 text-[var(--text-primary)] rounded-lg shadow-sm";
    } else if (isApprove) {
        colorStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 rounded-lg";
    } else if (isRework) {
        colorStyle = "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 rounded-lg";
    }

    const handleStyle = { width: 8, height: 8, background: 'var(--indigo-500)', border: '2px solid var(--bg-surface)' };

    const onDoubleClick = (e) => {
        if (!data.isEditable) return;
        e.stopPropagation();
        setIsEditing(true);
    };

    const onBlur = () => {
        setIsEditing(false);
        if (label.trim() && label !== data.label) {
            setNodes((nds) =>
                nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: label.trim() } } : n)
            );
        } else {
            setLabel(data.label);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') onBlur();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setLabel(data.label);
        }
    };

    return (
        <div className={`${baseStyle} ${colorStyle} ${isStart || isComplete ? 'min-w-0' : 'min-w-[100px] shadow-lg'}`}
            onDoubleClick={onDoubleClick}
            title={data.isEditable ? "Double-click to rename" : undefined}>

            {isEditing ? (
                <input
                    autoFocus
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className="bg-transparent border-none text-center focus:ring-0 w-full text-[11px] font-bold uppercase text-[var(--text-primary)]"
                />
            ) : (
                <span className="text-center leading-tight px-2 select-none">{data.label}</span>
            )}

            <Handle type="target" position={data.direction === 'TB' ? Position.Top : Position.Left} style={handleStyle} className={data.isEditable ? "opacity-100" : "opacity-0"} />
            <Handle type="source" position={data.direction === 'TB' ? Position.Bottom : Position.Right} style={handleStyle} className={data.isEditable ? "opacity-100" : "opacity-0"} />
        </div>
    );
};

const nodeTypes = {
    dashboard: DashboardNode,
};

/**
 * Horizontal Dagre Layout (LR)
 */
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: direction === 'TB' ? 220 : 160, ranksep: direction === 'TB' ? 160 : 220 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - (NODE_WIDTH / 2),
            y: nodeWithPosition.y - (NODE_HEIGHT / 2),
        };
    });

    return { nodes, edges };
};


const ProcessMapGraphInner = forwardRef(({
    nodes: rawNodes,
    edges: rawEdges,
    mode = 'performance',
    isEditable = false,
    conformanceData = null,
    height = "100%",
    direction = 'LR',
    onUpdate
}, ref) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const flowRef = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const { fitView, getNodes } = useReactFlow();
    const { recordGif, isRecording, progress } = useGifRecorder();

    // ... (All existing logic from ProcessMapGraph stays here)
    // ── Export & Ref Logic ──────────
    useImperativeHandle(ref, () => ({
        getData: () => ({ nodes, edges }),
        exportGif: async () => {
             const currentNodes = getNodes();
             await recordGif({ 
                 nodes: currentNodes, 
                 fileName: `process_mining_${Date.now()}.gif`,
                 duration: 2500,
                 fps: 5
             });
        },
        exportPng: async () => {
            if (!flowRef.current) return;
            const currentNodes = getNodes();
            const bounds = getRectOfNodes(currentNodes);
            const transform = getTransformForBounds(bounds, 1200, 800, 0.05, 2);

            const dataUrl = await toPng(document.querySelector('.react-flow__viewport'), {
                backgroundColor: isDark ? '#16181d' : '#ffffff',
                width: 1200,
                height: 800,
                pixelRatio: 4,
                style: {
                    width: '1200px',
                    height: '800px',
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                },
            });

            const link = document.createElement('a');
            link.download = `process_mining_diagram_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        },
        exportPdf: async () => {
            if (!flowRef.current) return;
            const currentNodes = getNodes();
            const bounds = getRectOfNodes(currentNodes);
            const transform = getTransformForBounds(bounds, 1200, 800, 0.05, 2);

            const dataUrl = await toJpeg(document.querySelector('.react-flow__viewport'), {
                backgroundColor: isDark ? '#16181d' : '#ffffff',
                quality: 0.92,
                width: 1200,
                height: 800,
                pixelRatio: 3,
                style: {
                    width: '1200px',
                    height: '800px',
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                },
            });

            const pdf = new jsPDF('landscape', 'px', [1200, 800], true);
            pdf.addImage(dataUrl, 'JPEG', 0, 0, 1200, 800, undefined, 'FAST');
            pdf.save(`process_mining_diagram_${Date.now()}.pdf`);
        }
    }));

    useEffect(() => {
        if (!rawNodes?.length) return;
        const hasPositions = rawNodes.some(n => n.position && (n.position.x !== 0 || n.position.y !== 0));
        const rfNodes = rawNodes.map((n) => ({
            id: n.id,
            type: 'dashboard',
            data: { label: n.label, isEditable },
            position: n.position || { x: 0, y: 0 },
            draggable: isEditable,
        }));

        if (conformanceData?.node_differences?.missing) {
            conformanceData.node_differences.missing.forEach((m) => {
                if (!rfNodes.find(n => n.id === m)) {
                    rfNodes.push({
                        id: m,
                        type: 'dashboard',
                        data: { label: m, isEditable: false },
                        position: { x: 0, y: 0 },
                        style: { opacity: 0.6, borderStyle: 'dashed', borderColor: '#f59e0b' }
                    });
                }
            });
        }

        const rfEdges = (rawEdges || []).map((e, idx) => {
            const source = e.from || e.source;
            const target = e.to || e.target;
            if (!source || !target) return null;

            const labelContent = mode === 'frequency'
                ? (e.count || '').toString()
                : `${e.count || ''} ${e.performance ? '/ ' + e.performance : ''}`;

            let strokeColor = isDark ? '#4b5563' : '#94a3b8';
            if (e.performance_score > 0.7) strokeColor = '#f43f5e';

            if (conformanceData) {
                const isExtra = conformanceData.edge_differences.extra.some(
                    ex => ex.from === source && ex.to === target
                );
                if (isExtra) strokeColor = '#f43f5e';
            }

            return {
                id: e.id || `e-${idx}`,
                source: source,
                target: target,
                label: labelContent.trim() ? labelContent : undefined,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
                labelStyle: { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 },
                labelBgPadding: [6, 4],
                labelBgBorderRadius: 4,
                labelBgStyle: { fill: isDark ? '#1e293b' : '#fff', fillOpacity: 0.8 },
                style: {
                    stroke: strokeColor,
                    strokeWidth: 2 + (e.frequency_score ? e.frequency_score * 4 : 0),
                    animationDuration: '3s',
                },
            };
        }).filter(Boolean);

        if (conformanceData?.edge_differences?.missing) {
            conformanceData.edge_differences.missing.forEach((msg, midx) => {
                rfEdges.push({
                    id: `missing-${midx}`,
                    source: msg.from,
                    target: msg.to,
                    label: 'MISSING',
                    animated: false,
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
                    labelStyle: { fill: '#f59e0b', fontSize: 9, fontWeight: 900 },
                    style: {
                        stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5'
                    }
                });
            });
        }

        if (hasPositions) {
            setNodes(rfNodes.map(n => ({ ...n, data: { ...n.data, direction } })));
            setEdges(rfEdges);
        } else {
            const layouted = getLayoutedElements(rfNodes, rfEdges, direction);
            setNodes(layouted.nodes.map(n => ({ ...n, data: { ...n.data, direction } })));
            setEdges(layouted.edges);
            setTimeout(() => fitView({ padding: 0.2 }), 50);
        }
    }, [rawNodes, rawEdges, mode, isDark, isEditable, fitView, setNodes, setEdges, conformanceData, direction]);

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    }, [setEdges]);

    const onReactFlowInit = useCallback((instance) => {
        instance.fitView({ padding: 0.2 });
    }, []);

    if (!nodes.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <p className="text-xs font-bold uppercase tracking-widest">No visualization data</p>
            </div>
        );
    }

    return (
        <div ref={flowRef} className="w-full h-full relative overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={onReactFlowInit}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodesDraggable={isEditable}
                nodesConnectable={isEditable}
                zoomOnScroll={true}
                panOnDrag={true}
                minZoom={0.05}
                maxZoom={2}
                style={{ background: 'transparent' }}
            >
                <Background color={isDark ? "#334155" : "#f1f5f9"} gap={20} size={1} />
                <Controls showInteractive={isEditable} className="!bg-[var(--bg-app)] !border-[var(--border-glass)] !fill-[var(--text-primary)]" />
            </ReactFlow>
            {isRecording && (
                <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-fade-in">
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-[240px] w-full">
                        <div className="relative">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-400">
                                {progress < 31 ? 'REC' : 'GEN'}
                            </div>
                        </div>
                        <div className="w-full space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {progress < 31 ? 'Capturing Frames' : 'Generating GIF'}
                                </span>
                                <span className="text-[10px] font-black text-indigo-500">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-500/10 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

const ProcessMapGraph = forwardRef((props, ref) => {
    return (
        <ReactFlowProvider>
            <ProcessMapGraphInner {...props} ref={ref} />
        </ReactFlowProvider>
    );
});

export default ProcessMapGraph;
