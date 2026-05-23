import React, { memo, useRef, useLayoutEffect } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import * as LucideIcons from 'lucide-react';

/* ---------- UTILS ---------- */
const getIcon = (iconData, DefaultIcon) => {
    if (!iconData) return DefaultIcon;
    if (typeof iconData === 'string') {
        const cleanName = iconData.replace(/icon/gi, '').replace(/[^a-zA-Z0-9]/g, '');
        const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        return LucideIcons[pascalName] || LucideIcons[iconData] || DefaultIcon;
    }
    return iconData;
};

const Editable = ({ value, onChange, readOnly, className = "" }) => {
    const [editing, setEditing] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value || "");

    React.useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    const commit = () => {
        setEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    if (readOnly) return <span className={`text-center whitespace-pre-wrap ${className}`}>{value}</span>;

    if (!editing) {
        return (
            <div
                className={`text-center cursor-text min-h-[1.5em] py-1 px-2 hover:bg-black/5 rounded transition-colors whitespace-pre-wrap ${className}`}
                onDoubleClick={() => setEditing(true)}
            >
                {value || "-"}
            </div>
        );
    }

    return (
        <textarea
            autoFocus
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    commit();
                }
                e.stopPropagation();
            }}
            className={`bg-white/90 border border-blue-500 focus:outline-none w-full text-center resize-none overflow-hidden font-medium rounded shadow-sm nodrag text-black ${className}`}
            rows={2}
            onClick={(e) => e.stopPropagation()}
        />
    );
};

const ShapeNode = ({ id, data, selected, type }) => {
    const strokeWidth = 2;
    const fillColor = data.customColor || (type === 'group' ? 'transparent' : '#f8fafc');
    const strokeColor = data.strokeColor || '#64748b';
    const Icon = getIcon(data.icon, null);

    const isPool = type === 'pool';
    const isLane = type === 'lane';
    const isGroup = type === 'group';
    const isStructural = isPool || isLane || isGroup;

    const renderShape = () => {
        switch (data.shapeType) {
            case 'circle':
                return <circle cx="50" cy="50" r="48" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />;
            case 'triangle':
                return <polygon points="50,2 98,98 2,98" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />;
            case 'rounded':
                return <rect x="2" y="2" width="96" height="96" rx="15" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />;
            default: // rectangle
                return (
                    <rect
                        x="2" y="2" width="96" height="96"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={isGroup ? "5,5" : "none"}
                        vectorEffect="non-scaling-stroke"
                    />
                );
        }
    };

    const isDesignShape = type === 'shape';

    return (
        <div className={`w-full h-full relative group min-w-[50px] min-h-[50px] transition-all ${selected ? 'ring-2 ring-blue-500 rounded-sm z-50' : ''}`}>
            <NodeResizer
                minWidth={50}
                minHeight={50}
                isVisible={selected}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />

            {/* Main Shape Container */}
            <div className={`w-full h-full relative flex ${isPool || isLane ? 'flex-row' : 'flex-col items-center justify-center'}`}>
                {/* Structural Header (Pool/Lane) */}
                {(isPool || isLane) && (
                    <div
                        className="w-10 h-full flex items-center justify-center border-r shrink-0 overflow-hidden"
                        style={{ backgroundColor: strokeColor + '20', borderColor: strokeColor }}
                    >
                        <div className="rotate-[-90deg] whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-600 w-max min-w-[100px] flex justify-center">
                            <Editable
                                value={data.label || type.toUpperCase()}
                                onChange={(v) => data.onEdit ? data.onEdit(id, v) : null}
                                readOnly={data.readOnly}
                            />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center p-2">
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{ overflow: 'visible', display: 'block', pointerEvents: 'none' }}
                    >
                        {renderShape()}
                    </svg>

                    {/* Icon and Label Overlay (Only for non-design shapes) */}
                    {!isDesignShape && (
                        <div className="relative z-10 flex flex-col items-center gap-1 max-w-full">
                            {Icon && <Icon className="w-5 h-5" style={{ color: strokeColor }} />}
                            {!isPool && !isLane && (
                                <div className="text-[10px] font-bold text-slate-700 text-center leading-tight w-full">
                                    <Editable
                                        value={data.label}
                                        onChange={(v) => data.onEdit ? data.onEdit(id, v) : null}
                                        readOnly={data.readOnly}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Connection Handles (Only for non-design shapes) */}
            {!isDesignShape && (
                <>
                    <Handle type="target" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
                </>
            )}
        </div>
    );
};

export default memo(ShapeNode);
