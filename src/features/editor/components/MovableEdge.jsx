import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { useReactFlow } from 'reactflow';

export default function MovableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    markerStart,
    data,
    selected,
}) {
    const { setEdges, screenToFlowPosition } = useReactFlow();

    // Custom bend point saved in the edge data
    const bendPoint = data?.bendPoint;

    const [isDragging, setIsDragging] = useState(false);
    const edgeRef = useRef(null);

    // Label editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(data?.label || '');
    const inputRef = useRef(null);

    // Sync external data.isEditing
    useEffect(() => {
        if (data?.isEditing) {
            setIsEditing(true);
            setEditValue(data?.label || '');
        }
    }, [data?.isEditing, data?.label]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // If a bend point exists, draw a simple V-shaped line (source -> bend -> target)
    // Otherwise, use the standard smoothstep
    let path = '';
    let labelX = 0;
    let labelY = 0;

    if (bendPoint) {
        // Generate a simple polyline or bezier curve
        // We'll use a simple quadratic curve for smoothness through the bend point
        // M source Q bend target
        path = `M ${sourceX},${sourceY} Q ${bendPoint.x},${bendPoint.y} ${targetX},${targetY}`;
        // For a quadratic bezier curve, the midpoint is roughly halfway between the curve and the chord
        labelX = (sourceX + targetX) / 2 * 0.5 + bendPoint.x * 0.5;
        labelY = (sourceY + targetY) / 2 * 0.5 + bendPoint.y * 0.5;
    } else {
        const [p, lX, lY] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            borderRadius: 15,
        });
        path = p;
        labelX = lX;
        labelY = lY;
    }

    const handlePointerDown = (evt) => {
        evt.stopPropagation();
        setIsDragging(true);

        const onPointerMove = (e) => {
            e.preventDefault();
            const position = screenToFlowPosition({
                x: e.clientX,
                y: e.clientY,
            });

            setEdges((eds) =>
                eds.map((edge) => {
                    if (edge.id === id) {
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                bendPoint: position,
                            },
                        };
                    }
                    return edge;
                })
            );
        };

        const onPointerUp = () => {
            setIsDragging(false);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        // Reset path
        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === id) {
                    const newData = { ...edge.data };
                    delete newData.bendPoint;
                    return { ...edge, data: newData };
                }
                return edge;
            })
        );
    };

    const handleSave = () => {
        if (data?.onLabelChange) {
            data.onLabelChange(id, editValue.trim());
        } else {
            // Fallback to updating edges locally if callback is not provided
            setEdges((eds) =>
                eds.map((edge) => {
                    if (edge.id === id) {
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                label: editValue.trim(),
                                isEditing: false
                            },
                        };
                    }
                    return edge;
                })
            );
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(data?.label || '');
            setIsEditing(false);
            if (data?.onLabelChange) {
                data.onLabelChange(id, data.label);
            }
            setEdges((eds) =>
                eds.map((edge) => {
                    if (edge.id === id) {
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                isEditing: false
                            },
                        };
                    }
                    return edge;
                })
            );
        }
    };


    return (
        <g
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            ref={edgeRef}
            className="cursor-move"
        >
            {/* Embed defs directly in the edge SVG to prevent SPA url(#id) resolution bug */
                (data?.bpmnConnectorType === 'message' || data?.bpmnConnectorType === 'association') && (
                    <defs>
                        <marker id={`message-start-${id}`} markerWidth="20" markerHeight="20" refX="10" refY="10" orient="auto" markerUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="4" fill="white" stroke={isDragging ? '#3b82f6' : (selected ? '#64748b' : '#64748b')} strokeWidth={isDragging || selected ? 3 : 2} />
                        </marker>
                        <marker id={`message-end-${id}`} markerWidth="20" markerHeight="20" refX="16" refY="10" orient="auto" markerUnits="userSpaceOnUse">
                            <path d="M 4 4 L 14 10 L 4 16" fill="none" stroke={isDragging ? '#3b82f6' : (selected ? '#64748b' : '#64748b')} strokeWidth={isDragging || selected ? 3 : 2} />
                        </marker>
                    </defs>
                )
            }
            <BaseEdge
                path={path}
                markerStart={data?.bpmnConnectorType === 'message' ? `url(#message-start-${id})` : markerStart}
                markerEnd={(data?.bpmnConnectorType === 'message' || data?.bpmnConnectorType === 'association') ? `url(#message-end-${id})` : markerEnd}
                className="path-draw-animated"
                style={{
                    ...style,
                    strokeWidth: isDragging || selected ? 3 : 2,
                    stroke: isDragging ? '#3b82f6' : (selected ? '#64748b' : '#64748b'),
                    transition: 'stroke-width 0.2s, stroke 0.2s',
                }}
            />

            {/* Invisible interaction layer to make the edge highly draggable anywhere */}
            <path
                d={path}
                fill="none"
                strokeOpacity={0}
                strokeWidth={30}
                className="react-flow__edge-interaction hover:stroke-black/5 transition-all"
                title="Drag to bend line (Double click to reset)"
            />

            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan flex items-center justify-center"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent dragging edge when interacting with label
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="px-2 py-1 text-xs border border-theme-border rounded bg-theme-bg-secondary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                            style={{ minWidth: '60px', maxWidth: '150px' }}
                            placeholder="Enter label..."
                            autoFocus
                        />
                    ) : data?.label ? (
                        <span
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (data?.readOnly) return;
                                setIsEditing(true);
                                setEdges((eds) =>
                                    eds.map((edge) => {
                                        if (edge.id === id) {
                                            return {
                                                ...edge,
                                                data: {
                                                    ...edge.data,
                                                    isEditing: true
                                                },
                                            };
                                        }
                                        return edge;
                                    })
                                );
                            }}
                            className="px-2 py-1 rounded text-theme-primary cursor-text border border-theme-border hover:border-theme-accent transition-colors shadow-sm text-[11px] font-medium"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                backdropFilter: 'blur(4px)',
                            }}
                            title={data?.readOnly ? undefined : "Double click to edit label"}
                        >
                            {data.label}
                        </span>
                    ) : selected ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                                setEdges((eds) =>
                                    eds.map((edge) => {
                                        if (edge.id === id) {
                                            return {
                                                ...edge,
                                                data: {
                                                    ...edge.data,
                                                    isEditing: true
                                                },
                                            };
                                        }
                                        return edge;
                                    })
                                );
                            }}
                            className="px-2 py-1 ml-1 rounded text-theme-tertiary hover:text-theme-primary cursor-pointer bg-theme-surface/80 border border-theme-border flex items-center gap-1 hover:border-theme-accent transition-colors shadow-sm text-[10px] uppercase font-bold tracking-wider"
                            title="Add Label"
                        >
                            Label
                        </button>
                    ) : null}
                </div>
            </EdgeLabelRenderer>
        </g>
    );
}
