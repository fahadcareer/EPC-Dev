import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { useParams } from 'react-router-dom';
import { NodeResizeControl, NodeResizer, ResizeControlVariant } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import * as LucideIcons from 'lucide-react';
import { Circle, Square, MessageCircle, Timer, User, Server, Plus } from 'lucide-react';
import socketService from '../../services/socketService';

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

const Editable = ({ value, onChange, readOnly, className = "", placeholder = "" }) => {
    const [editing, setEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value || "");

    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    const commit = () => {
        setEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    if (readOnly) return <span className={`text-center whitespace-pre-wrap ${className}`}>{value || placeholder}</span>;

    if (!editing) {
        return (
            <div
                className={`text-center cursor-text min-h-[1.5em] py-1 px-2 hover:bg-black/5 rounded transition-colors whitespace-pre-wrap nodrag nopan ${className} ${!value ? 'text-slate-400 italic' : ''}`}
                onDoubleClick={() => setEditing(true)}
            >
                {value || placeholder || "-"}
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
            placeholder={placeholder}
        />
    );
};

/* ---------- NODE COMPONENTS ---------- */

export const BPMNEventNode = ({ id, data, selected }) => {
    // 1. Semantic Prop Extraction + Legacy Fallbacks
    let eventType = data.eventType;
    if (!eventType) {
        const lowerLabel = (data.label || "").toLowerCase();
        if (lowerLabel.includes('end')) eventType = 'end';
        else if (lowerLabel.includes('intermediate')) eventType = 'intermediate';
        else eventType = 'start';
    }

    let isInterrupting = data.isInterrupting;
    if (isInterrupting === undefined) {
        // Default true unless label explicitly says non-interrupting
        isInterrupting = !(data.label || "").toLowerCase().includes("non-interrupt");
    }

    let triggerType = data.triggerType;
    if (!triggerType || triggerType === 'none') {
        const iconInfo = data.iconName || data.icon;
        if (iconInfo === 'Mail' || iconInfo === 'MessageCircle') triggerType = 'message';
        else if (iconInfo === 'Timer' || iconInfo === 'Clock') triggerType = 'timer';
        else if (iconInfo === 'FileText') triggerType = 'conditional';
        else if (iconInfo === 'Link') triggerType = 'link';
        else if (iconInfo === 'Zap') triggerType = 'error';
        else triggerType = 'none';
    }

    // Determine Interrupting state strictly based on BPMN matrix rules
    if (eventType === 'end') {
        isInterrupting = true;
    } else {
        const allowedInterruptingTriggers = ['message', 'timer', 'escalation', 'conditional', 'signal', 'multiple', 'multiple_parallel'];
        if (!allowedInterruptingTriggers.includes(triggerType)) {
            isInterrupting = true;
        }
    }

    // Determine Throwing state strictly based on BPMN matrix rules
    let isThrowing = false;
    if (eventType === 'end') {
        isThrowing = true;
    } else if (eventType === 'intermediate') {
        const validThrowingTriggers = ['none', 'message', 'escalation', 'link', 'compensation', 'signal', 'multiple'];
        if (validThrowingTriggers.includes(triggerType)) {
            isThrowing = data.isThrowing !== undefined ? data.isThrowing : (data.label || "").toLowerCase().includes("throw");
        }
    }

    const label = data.label || "";
    const themeColor = data.customColor || '#334155'; // Slate 700

    // 2. SVG Metrics
    const size = 56;
    const center = size / 2;
    const radius = 24;

    // 3. Conditional Styles
    const strokeDash = !isInterrupting ? "6,4" : "none";
    const triggerFill = isThrowing ? themeColor : '#ffffff';
    const triggerStroke = themeColor;

    // 4. Trigger Inline Renderers
    const renderTrigger = () => {
        if (triggerType === 'none') return null;

        const props = {
            fill: triggerFill,
            stroke: triggerStroke,
            strokeWidth: 1.5,
            strokeLinejoin: "round",
            strokeLinecap: "round"
        };

        switch (triggerType) {
            case 'message':
                if (isThrowing) {
                    return (
                        <g>
                            <path d="M 18 20 L 38 20 L 38 34 L 18 34 Z" fill={themeColor} stroke={themeColor} strokeWidth="1.5" strokeLinejoin="round" />
                            <polyline points="18,20 28,27 38,20" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
                        </g>
                    );
                }
                return <path {...props} d="M 18 20 L 38 20 L 38 34 L 18 34 Z M 18 20 L 28 27 L 38 20" />;
            case 'timer':
                return (
                    <g {...props}>
                        <circle cx={center} cy={center} r={10} fill={triggerFill} stroke={triggerStroke} />
                        <path d="M 28 20 L 28 28 L 32 28" fill="none" stroke={triggerStroke} strokeWidth={2} />
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                            <line key={deg} x1={center} y1={center - 10} x2={center} y2={center - 8} stroke={triggerStroke} transform={`rotate(${deg} ${center} ${center})`} />
                        ))}
                    </g>
                );
            case 'conditional':
                return (
                    <g {...props}>
                        <rect x="20" y="18" width="16" height="20" fill={triggerFill} stroke={triggerStroke} />
                        <line x1="24" y1="22" x2="32" y2="22" stroke={triggerStroke} fill="none" />
                        <line x1="24" y1="26" x2="32" y2="26" stroke={triggerStroke} fill="none" />
                        <line x1="24" y1="30" x2="32" y2="30" stroke={triggerStroke} fill="none" />
                        <line x1="24" y1="34" x2="32" y2="34" stroke={triggerStroke} fill="none" />
                    </g>
                );
            case 'link':
                return <polygon {...props} points="17,26 27,26 27,22 35,28 27,34 27,30 17,30" />;
            case 'signal':
                return <polygon {...props} points="28,15 39,34 17,34" />;
            case 'error':
                return <polygon {...props} points="29,16 22,26 28,26 27,38 36,25 29,25" />;
            case 'escalation':
                return <polygon {...props} points="28,18 36,32 28,28 20,32" />;
            case 'termination':
                return <circle cx={center} cy={center} r={11} fill={themeColor} stroke="none" />;
            case 'compensation':
                return (
                    <g {...props}>
                        <polygon points="27,28 35,22 35,34" />
                        <polygon points="19,28 27,22 27,34" />
                    </g>
                );
            case 'cancel':
                return <path {...props} d="M 21 21 L 35 35 M 35 21 L 21 35" stroke={themeColor} strokeWidth="4" fill="none" />;
            case 'multiple':
                return <polygon {...props} points="28,16 38,23 34,35 22,35 18,23" />;
            case 'multiple_parallel':
                return <path {...props} d="M 28 17 L 28 39 M 17 28 L 39 28" strokeWidth="3" fill="none" />;
            default:
                return null;
        }
    };

    return (
        <div className="relative group flex flex-col items-center">
            {/* The SVG Circle Base */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`overflow-visible ${selected ? 'drop-shadow-lg' : 'drop-shadow-sm'}`}>
                {/* START EVENT */}
                {eventType === 'start' && (
                    <circle cx={center} cy={center} r={radius} fill="#ffffff" stroke={themeColor} strokeWidth="2" strokeDasharray={strokeDash} />
                )}

                {/* INTERMEDIATE EVENT */}
                {eventType === 'intermediate' && (
                    <g>
                        <circle cx={center} cy={center} r={radius} fill="#ffffff" stroke={themeColor} strokeWidth="1.5" strokeDasharray={strokeDash} />
                        <circle cx={center} cy={center} r={radius - 4} fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray={strokeDash} />
                    </g>
                )}

                {/* END EVENT */}
                {eventType === 'end' && (
                    <circle cx={center} cy={center} r={radius} fill="#ffffff" stroke={themeColor} strokeWidth="5" strokeDasharray={strokeDash} />
                )}

                {/* INTERNAL TRIGGER (Message, Timer, etc) */}
                {renderTrigger()}
            </svg>

            {/* Label Below */}
            <div className="mt-1 text-xs font-semibold text-slate-800 absolute top-full pt-0.5 w-[140px] text-center">
                <Editable value={label} onChange={(v) => data.onEdit && data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>

            <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
        </div>
    );
};

export const BPMNTaskNode = ({ id, data, selected }) => {
    // BPMN Activities are simple rounded rectangles.
    // Badges (User, Service, Script) go in top-left corner.
    const innerIconName = data.iconName || data.icon;
    const InnerIcon = getIcon(innerIconName, null) || Square;
    const themeColor = data.customColor || '#334155';

    // Check for activity specific type
    let activityType = data.activityType;
    if (!activityType) {
        const lowerLabel = (data.label || "").toLowerCase();
        if (lowerLabel.includes("transaction")) activityType = 'transaction';
        else if (lowerLabel.includes("call")) activityType = 'call_activity';
        else if (lowerLabel.includes("sub-process") || innerIconName === 'Box') activityType = 'subprocess';
        else activityType = 'task';
    }

    let borderStyles = "border border-2";
    if (activityType === 'transaction') borderStyles = "border-4 border-double";
    else if (activityType === 'subprocess') borderStyles = "border-2 border-dashed";
    else if (activityType === 'call_activity') borderStyles = "border-[4px] border-solid";

    // Bottom marker logic
    const isSubProcessMarker = activityType === 'subprocess' || activityType === 'transaction';
    const isLoop = data.loopType === 'loop';
    const isParallel = data.loopType === 'parallel';
    const isSequential = data.loopType === 'sequential';
    const isAdHoc = !!data.isAdHoc;
    const isCompensation = !!data.isCompensation;

    const showMarkers = isSubProcessMarker || isLoop || isParallel || isSequential || isAdHoc || isCompensation;

    return (
        <div className={`group w-[160px] min-h-[70px] bg-[#f8fafc] rounded-xl relative hover:cursor-move transition-all flex items-center justify-center p-2 shadow-sm ${borderStyles} ${selected ? 'ring-4 ring-blue-500' : ''}`} style={{ borderColor: themeColor }}>
            {/* Top-Left Task Type Icon */}
            {(() => {
                // Task icons should ONLY render for standard 'task' activities
                if (activityType !== 'task') return null;

                const tt = data.taskType;
                if (!tt || tt === 'none') return null;
                const cls = 'w-3.5 h-3.5';
                const s = { color: themeColor };
                let icon = null;
                if (tt === 'send') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="currentColor" style={s}>
                        <path d="M2 2h12l-2 6H4L2 2zm0 0l7 5.5L16 2" stroke="currentColor" strokeWidth="1" fill="currentColor" />
                        <rect x="1" y="1" width="14" height="10" rx="1" fill="currentColor" stroke="none" />
                        <polyline points="1,1 8,7 15,1" fill="none" stroke="white" strokeWidth="1.5" />
                    </svg>
                );
                else if (tt === 'receive') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.4" style={s}>
                        <rect x="1" y="2" width="14" height="10" rx="1" />
                        <polyline points="1,2 8,8 15,2" />
                    </svg>
                );
                else if (tt === 'user') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.4" style={s}>
                        <circle cx="8" cy="5" r="3" />
                        <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                    </svg>
                );
                else if (tt === 'manual') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.3" style={s}>
                        <path d="M5 12V7m0 0c0-1 1.5-1 1.5 0v2m0-2c0-1 1.5-1 1.5 0v2m0-2c0-1 1.5-1 1.5 0v2M5 7V4a1 1 0 0 1 2 0v3" />
                        <path d="M5 11c0 2 6 3 6 0V9" />
                    </svg>
                );
                else if (tt === 'business_rule') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.3" style={s}>
                        <rect x="1" y="2" width="14" height="12" rx="1" />
                        <line x1="1" y1="6" x2="15" y2="6" />
                        <line x1="6" y1="2" x2="6" y2="14" />
                    </svg>
                );
                else if (tt === 'service') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.3" style={s}>
                        <circle cx="8" cy="8" r="2.5" />
                        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
                    </svg>
                );
                else if (tt === 'script') icon = (
                    <svg viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.3" style={s}>
                        <path d="M4 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
                        <line x1="5" y1="5" x2="11" y2="5" />
                        <line x1="5" y1="8" x2="9" y2="8" />
                        <line x1="5" y1="11" x2="10" y2="11" />
                    </svg>
                );
                return icon ? (
                    <div className="absolute top-1.5 left-1.5 opacity-80">{icon}</div>
                ) : null;
            })()}

            {/* Center Label */}
            <div className="w-full text-xs font-semibold text-slate-800 text-center leading-tight z-10 break-words mt-1 mb-1">
                <Editable value={data.label} onChange={(v) => data.onEdit && data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>

            {/* Bottom + marker for Sub-process variants */}
            {showMarkers && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-[2px] bg-transparent">
                    {/* Loop */}
                    {isLoop && (
                        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-slate-800">
                            <path d="M 6 10 C 3.8 10 2 8.2 2 6 C 2 3.8 3.8 2 6 2 C 7.5 2 8.8 2.8 9.5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M 10 1.5 L 10 4.5 L 7 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                    )}
                    {/* Parallel MI */}
                    {isParallel && (
                        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-slate-800">
                            <line x1="3" y1="2" x2="3" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="9" y1="2" x2="9" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    )}
                    {/* Sequential MI */}
                    {isSequential && (
                        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-slate-800">
                            <line x1="2" y1="3" x2="10" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="2" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    )}
                    {/* Compensation */}
                    {isCompensation && (
                        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-slate-800">
                            <polygon points="6.5,6 10,3.5 10,8.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                            <polygon points="2.5,6 6,3.5 6,8.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                        </svg>
                    )}
                    {/* Ad Hoc */}
                    {isAdHoc && (
                        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-slate-800" style={{ marginTop: '2px' }}>
                            <path d="M 1 6 Q 3.5 3 6 6 T 11 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    )}
                    {/* Sub-Process Plus Marker */}
                    {isSubProcessMarker && (
                        <div className="w-[11px] h-[11px] border border-slate-700 rounded-[1px] flex items-center justify-center bg-transparent shrink-0">
                            <span className="text-[10px] font-bold leading-none text-slate-800 relative -top-[0.5px]">+</span>
                        </div>
                    )}
                </div>
            )}

            <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 !opacity-0 group-hover:!opacity-100 transition-opacity" />
        </div>
    );
};

export const BPMNGatewayNode = ({ id, data, selected }) => {
    // 1. Semantic Prop Extraction + Legacy Fallbacks
    let gatewayType = data.gatewayType;
    let label = data.label || "";

    if (!gatewayType) {
        let symbol = data.symbol || '';
        const upperLabel = label.toUpperCase();

        if (upperLabel.includes('EVENT-BASED') && upperLabel.includes('PARALLEL')) {
            gatewayType = 'parallel_event_based';
        } else if (upperLabel.includes('EVENT-BASED') && upperLabel.includes('EXCLUSIVE')) {
            gatewayType = 'exclusive_event_based';
        } else if (upperLabel.includes('EVENT-BASED')) {
            gatewayType = 'event_based';
        } else if (!symbol) {
            if (upperLabel.includes('AND') || upperLabel.includes('PARALLEL')) gatewayType = 'parallel';
            else if ((upperLabel.includes('OR') || upperLabel.includes('INCLUSIVE')) && !upperLabel.includes('XOR') && !upperLabel.includes('EXCLUSIVE')) gatewayType = 'inclusive';
            else if (upperLabel.includes('COMPLEX')) gatewayType = 'complex';
            else if (upperLabel.includes('XOR') || upperLabel.includes('EXCLUSIVE')) gatewayType = 'exclusive';
            else gatewayType = 'exclusive'; // default
        } else {
            symbol = symbol.toUpperCase();
            if (symbol === '+') gatewayType = 'parallel';
            else if (symbol === 'O') gatewayType = 'inclusive';
            else if (symbol === '*') gatewayType = 'complex';
            else gatewayType = 'exclusive';
        }
    }

    const themeColor = data.customColor || '#334155'; // Slate 700
    const size = 56;
    const center = size / 2;

    const renderInnerIcon = () => {
        const props = { stroke: themeColor, fill: "none" };

        switch (gatewayType) {
            case 'exclusive':
                // Thick X
                return <path d="M 17 17 L 39 39 M 39 17 L 17 39" strokeWidth="4" {...props} />;
            case 'parallel':
                // Thick Plus
                return <path d="M 28 18 L 28 38 M 18 28 L 38 28" strokeWidth="4" {...props} />;
            case 'inclusive':
                // Thick Circle
                return <circle cx={center} cy={center} r={9} strokeWidth="4" {...props} />;
            case 'complex':
                // Thick Asterisk
                return <path d="M 28 17 L 28 39 M 17 28 L 39 28 M 20 20 L 36 36 M 36 20 L 20 36" strokeWidth="3" {...props} />;
            case 'event_based':
                // Double thin circle + pentagon
                return (
                    <g {...props} strokeWidth="1">
                        <circle cx={center} cy={center} r={12} />
                        <circle cx={center} cy={center} r={9} />
                        <polygon points="28,21 33,26 31,33 25,33 23,26" />
                    </g>
                );
            case 'exclusive_event_based':
                // Single thin circle + pentagon
                return (
                    <g {...props} strokeWidth="1">
                        <circle cx={center} cy={center} r={12} />
                        <polygon points="28,20 34,26 32,34 24,34 22,26" />
                    </g>
                );
            case 'parallel_event_based':
                // Single thin circle + cross
                return (
                    <g fill="none">
                        <circle cx={center} cy={center} r={12} stroke={themeColor} strokeWidth="1" />
                        <path d="M 28 19 L 28 37 M 19 28 L 37 28" stroke={themeColor} strokeWidth="2" />
                    </g>
                );
            default:
                // Fallback exclusive
                return <path d="M 21 21 L 35 35 M 35 21 L 21 35" strokeWidth="4" {...props} />;
        }
    };

    return (
        <div className="relative group flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`overflow-visible ${selected ? 'drop-shadow-lg scale-[1.05] transition-transform' : 'drop-shadow-sm'}`}>
                {/* The Diamond Frame */}
                <polygon
                    points="28,4 52,28 28,52 4,28"
                    fill="#fefce8"
                    stroke={themeColor}
                    strokeWidth="2"
                />

                {/* Inner Symbol */}
                {renderInnerIcon()}
            </svg>

            {/* Label Text Floating Below */}
            <div className="mt-1 text-[10px] font-semibold text-slate-700 absolute top-full pt-1 w-[120px] text-center">
                <Editable value={label} onChange={(v) => data.onEdit && data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>

            {/* Standard React Flow Handles */}
            <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        </div>
    );
};

export const BPMNDataNode = ({ id, data, selected }) => {
    const label = data.label || "";
    const themeColor = data.customColor || '#334155'; // Slate 700

    // Auto-detect type based on user request (no config panel dropdown)
    let dataType = data.dataType || 'object';
    if (!data.dataType) {
        const lower = label.toLowerCase();
        if (lower.includes('store') || lower.includes('database')) dataType = 'store';
        else if (lower.includes('input')) dataType = 'input';
        else if (lower.includes('output')) dataType = 'output';
    }

    const size = 56;

    const renderSVG = () => {
        if (dataType === 'store') {
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`overflow-visible ${selected ? 'drop-shadow-lg scale-[1.05] transition-transform' : 'drop-shadow-sm'}`}>
                    <path d="M 12 16 L 12 42 C 12 50, 44 50, 44 42 L 44 16" fill="#ffffff" stroke={themeColor} strokeWidth="1.5" />
                    <ellipse cx="28" cy="16" rx="16" ry="6" fill="#ffffff" stroke={themeColor} strokeWidth="1.5" />
                </svg>
            );
        }

        // The Document base shape
        const documentPath = "M 14 6 L 34 6 L 42 14 L 42 50 L 14 50 Z M 34 6 L 34 14 L 42 14";
        const arrowPoints = "14,10 24,10 24,7 32,13 24,19 24,16 14,16";

        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`overflow-visible ${selected ? 'drop-shadow-lg scale-[1.05] transition-transform' : 'drop-shadow-sm'}`}>
                <path d={documentPath} fill="#ffffff" stroke={themeColor} strokeWidth="1.5" strokeLinejoin="round" />

                {dataType === 'input' && (
                    <polygon points={arrowPoints} fill="#ffffff" stroke={themeColor} strokeWidth="1.5" strokeLinejoin="round" />
                )}

                {dataType === 'output' && (
                    <polygon points={arrowPoints} fill={themeColor} stroke={themeColor} strokeWidth="1.5" strokeLinejoin="round" />
                )}
            </svg>
        );
    };

    return (
        <div className="relative group flex flex-col items-center">
            {renderSVG()}

            {/* Label Text Floating Below */}
            <div className="mt-1 text-[10px] font-semibold text-slate-700 absolute top-full pt-1 w-[120px] text-center">
                <Editable value={label} onChange={(v) => data.onEdit && data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>

            {/* Standard React Flow Handles */}
            <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        </div>
    );
};

export const BPMNPoolNode = ({ id, data, selected }) => {
    const label = data.label || "Participant / Pool";
    const theme = getSwimlaneTheme(data.customColor);
    const themeColor = theme.stroke;
    const { setNodes, getNodes } = useReactFlow();

    const handlePoolResize = (_event, { width: newPoolWidth, height: newPoolHeight }) => {
        setNodes((nds) => {
            const poolLanes = nds
                .filter((n) => n.parentNode === id && n.type === 'bpmn_lane')
                .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));

            const newLaneWidth = Math.max(200, newPoolWidth - SWIMLANE_INNER_OFFSET_X);

            if (poolLanes.length === 0) {
                return nds.map(n => n.id === id ? { ...n, width: newPoolWidth, height: newPoolHeight, style: { ...n.style, width: newPoolWidth, height: newPoolHeight } } : n);
            }

            const totalOldHeight = poolLanes.reduce((sum, l) => sum + Number(l.height ?? l.style?.height ?? 160), 0);

            const laneUpdates = {};
            let nextY = 0;
            poolLanes.forEach((lane, idx) => {
                const oldH = Number(lane.height ?? lane.style?.height ?? 160);
                // Proportional resizing: distribute the newPoolHeight based on old proportional heights
                let newH = totalOldHeight > 0 ? (oldH / totalOldHeight) * newPoolHeight : newPoolHeight / poolLanes.length;
                newH = Math.max(MIN_SWIMLANE_HEIGHT, newH);

                // Final lane must fill to the bottom exactly
                if (idx === poolLanes.length - 1) {
                    newH = Math.max(MIN_SWIMLANE_HEIGHT, newPoolHeight - nextY);
                }

                laneUpdates[lane.id] = { y: nextY, h: newH };
                nextY += newH;
            });

            return nds.map((node) => {
                if (node.id === id) {
                    return { ...node, width: newPoolWidth, height: newPoolHeight, style: { ...node.style, width: newPoolWidth, height: newPoolHeight } };
                }

                const update = laneUpdates[node.id];
                if (!update) return node;

                return {
                    ...node,
                    width: newLaneWidth,
                    height: update.h,
                    position: { ...node.position, y: update.y, x: SWIMLANE_INNER_OFFSET_X },
                    style: { ...node.style, width: newLaneWidth, height: update.h },
                };
            });
        });
    };

    useSwimlaneActions(id, 'bpmn_pool');

    return (
        <div className="relative w-full h-full group">
            <SwimlaneHandles />

            <NodeResizer
                color={selected ? '#007bff' : themeColor}
                isVisible={selected}
                minWidth={300}
                minHeight={Math.max(150, getNodes().filter(n => n.parentNode === id && n.type === 'bpmn_lane').length * MIN_SWIMLANE_HEIGHT)}
                handleStyle={{ width: 8, height: 8, borderRadius: 0, border: '1px solid white' }}
                onResize={handlePoolResize}
            />
            <div className="w-full h-full flex box-border" style={{ borderWidth: '1.5px', borderColor: selected ? '#007bff' : themeColor, backgroundColor: theme.bodyFill }}>
                <div className="w-[30px] h-full shrink-0 flex items-center justify-center" style={{ backgroundColor: theme.labelFill, borderRight: `1.5px solid ${selected ? '#007bff' : themeColor}` }}>
                    <div className="transform -rotate-90 whitespace-nowrap text-xs font-bold tracking-wider" style={{ color: theme.textColor }}>
                        <Editable value={label} onChange={(v) => data.onEdit && data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <div className="flex-1 h-full relative" />
            </div>


        </div>
    );
};

export const BPMNLaneNode = ({ id, data, selected, width }) => {
    const theme = getSwimlaneTheme(data.customColor || '#64748b');
    const themeColor = theme.stroke;
    const { getNode, getNodes, setNodes } = useReactFlow();

    // Get latest dimensions from the node itself to prevent "retracting" during resize
    const laneNode = getNode(id);
    const currentWidth = Number(laneNode?.width ?? laneNode?.style?.width ?? width ?? 600);

    // Derive sibling lanes sorted by Y (top to bottom)
    const siblingLanes = laneNode?.parentNode ? sortPoolLanes(
        getNodes().filter((node) => node.parentNode === laneNode.parentNode && node.type === 'bpmn_lane')
    ) : [];
    const laneIndex = siblingLanes.findIndex((node) => node.id === id);
    const hasPreviousLane = laneIndex > 0;
    const isLastLane = laneIndex === siblingLanes.length - 1;

    /**
     * TOP handle dragged: the current lane grows/shrinks from its top edge.
     * Adjust the lane ABOVE so it ends where this lane now begins.
     * Formula: new top of current lane = oldY + oldH - newH (since bottom is fixed)
     */
    const handleTopResize = (_event, { height: newHeight }) => {
        if (!laneNode?.parentNode || !hasPreviousLane) return;
        const prevLane = siblingLanes[laneIndex - 1];
        if (!prevLane) return;

        const currentH = Number(laneNode.height ?? laneNode.style?.height ?? 160);
        const currentY = Number(laneNode.position?.y ?? 0);
        const prevY = Number(prevLane.position?.y ?? 0);

        // New top edge of this lane (bottom stays fixed, top moves)
        let newLaneY = currentY + currentH - newHeight;
        // Lane above stretches/shrinks to fill the gap
        let newPrevH = newLaneY - prevY;
        let clampedHeight = newHeight;

        if (newPrevH < 80) {
            newPrevH = 80;
            newLaneY = prevY + 80;
            clampedHeight = currentY + currentH - newLaneY;
        }

        setNodes((nds) => nds.map((node) => {
            if (node.id === prevLane.id) {
                return { ...node, height: newPrevH, style: { ...node.style, height: newPrevH } };
            }
            if (node.id === laneNode.id) {
                return {
                    ...node,
                    position: { ...node.position, y: newLaneY },
                    height: clampedHeight,
                    style: { ...node.style, height: clampedHeight }
                };
            }
            return node;
        }));
    };

    /**
     * BOTTOM handle dragged: the current lane grows/shrinks from its bottom edge.
     * - If not last lane: push the lane below (move its Y, shrink its height).
     * - If last lane: expand the pool to fit.
     */
    const handleBottomResize = (_event, { height: newHeight }) => {
        if (!laneNode?.parentNode) return;
        const laneY = Number(laneNode.position?.y ?? 0);
        let newBottom = laneY + newHeight;
        let clampedHeight = newHeight;

        if (isLastLane) {
            // Grow pool to accommodate if needed
            setNodes((nds) => nds.map((node) => {
                if (node.id === laneNode.id) {
                    return { ...node, height: clampedHeight, style: { ...node.style, height: clampedHeight } };
                }
                if (node.id !== laneNode.parentNode) return node;
                const poolH = Number(node.height ?? node.style?.height ?? 0);
                if (newBottom <= poolH) return node;
                return { ...node, height: newBottom, style: { ...node.style, height: newBottom } };
            }));
        } else {
            // Push the next lane: its top moves to newBottom, height shrinks
            const nextLane = siblingLanes[laneIndex + 1];
            if (!nextLane) return;
            const nextY = Number(nextLane.position?.y ?? 0);
            const nextH = Number(nextLane.height ?? nextLane.style?.height ?? 160);
            const nextBottom = nextY + nextH; // fixed bottom of the next lane

            let newNextH = nextBottom - newBottom;

            if (newNextH < 80) {
                newNextH = 80;
                newBottom = nextBottom - 80;
                clampedHeight = newBottom - laneY;
            }

            setNodes((nds) => nds.map((node) => {
                if (node.id === nextLane.id) {
                    return {
                        ...node,
                        position: { ...node.position, y: newBottom },
                        height: newNextH,
                        style: { ...node.style, height: newNextH },
                    };
                }
                if (node.id === laneNode.id) {
                    return {
                        ...node,
                        height: clampedHeight,
                        style: { ...node.style, height: clampedHeight },
                    };
                }
                return node;
            }));
        }
    };

    const currentH = Number(laneNode?.height ?? laneNode?.style?.height ?? 160);
    
    let maxHeightTop = undefined;
    if (hasPreviousLane) {
        const prevLane = siblingLanes[laneIndex - 1];
        const prevH = Number(prevLane?.height ?? prevLane?.style?.height ?? 160);
        maxHeightTop = currentH + Math.max(0, prevH - 80);
    }

    let maxHeightBottom = undefined;
    if (!isLastLane) {
        const nextLane = siblingLanes[laneIndex + 1];
        const nextH = Number(nextLane?.height ?? nextLane?.style?.height ?? 160);
        maxHeightBottom = currentH + Math.max(0, nextH - 80);
    }

    useSwimlaneActions(id, 'bpmn_lane');

    return (
        <div className="relative w-full h-full group">
            <SwimlaneHandles />
            {selected && (
                <>
                    {hasPreviousLane && (
                        <NodeResizeControl
                            nodeId={id}
                            position="top"
                            variant={ResizeControlVariant.Line}
                            color={selected ? '#007bff' : themeColor}
                            minWidth={currentWidth}
                            maxWidth={currentWidth}
                            minHeight={80}
                            maxHeight={maxHeightTop}
                            className="!border-t-2 !border-x-0 !border-b-0"
                            style={{ opacity: 0, height: 12, top: -6 }}
                            onResize={handleTopResize}
                        />
                    )}
                    <NodeResizeControl
                        nodeId={id}
                        position="bottom"
                        variant={ResizeControlVariant.Line}
                        color={selected ? '#007bff' : themeColor}
                        minWidth={currentWidth}
                        maxWidth={currentWidth}
                        minHeight={80}
                        maxHeight={maxHeightBottom}
                        className="!border-b-2 !border-x-0 !border-t-0"
                        style={{ opacity: 0, height: 12, bottom: -6 }}
                        onResize={handleBottomResize}
                    />
                </>
            )}
            <div
                className="w-full h-full box-border pointer-events-auto"
                style={{
                    borderColor: selected ? '#007bff' : themeColor,
                    borderWidth: '1.5px',
                    backgroundColor: 'transparent',
                }}
            >
                <div className="w-full h-full" />
            </div>
        </div>
    );
};

const SWIMLANE_ELEMENT_OPTIONS = [
    { type: 'bpmn_pool', label: 'Pool' },
    { type: 'bpmn_lane', label: 'Lane' },
    { type: 'bpmn_empty_lane', label: 'Empty Lane' }
];

const SWIMLANE_COLOR_OPTIONS = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Default', value: '#111827' }
];

export const SWIMLANE_INNER_OFFSET_X = 30;
const MIN_SWIMLANE_HEIGHT = 80;

const getDefaultSwimlaneStyle = (type, currentStyle = {}) => {
    const defaults = {
        bpmn_pool: { width: 1000, height: 500 },
        bpmn_lane: { width: 600, height: 150 },
        bpmn_empty_lane: { width: 1000, height: 120 }
    };

    return {
        ...defaults[type],
        ...currentStyle
    };
};

const getSwimlaneNodeSize = (node, fallback = {}) => ({
    width: Number(node?.width ?? node?.style?.width ?? fallback.width ?? 0),
    height: Number(node?.height ?? node?.style?.height ?? fallback.height ?? 0),
});

const isInnerSwimlaneType = (type) => ['bpmn_lane', 'bpmn_empty_lane'].includes(type);

const sortPoolLanes = (lanes) => [...lanes].sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));

const hexToRgb = (hex) => {
    if (!hex) return null;
    const normalized = hex.replace('#', '');
    const expanded = normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized;

    if (expanded.length !== 6) return null;

    const int = Number.parseInt(expanded, 16);
    if (Number.isNaN(int)) return null;

    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

const colorWithAlpha = (hex, alpha) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(15, 23, 42, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const getSwimlaneTheme = (customColor) => {
    const stroke = customColor || '#22242a';
    const isDefaultDark = !customColor || stroke === '#111827' || stroke === '#22242a';

    return {
        stroke,
        bodyFill: isDefaultDark ? 'rgba(255, 255, 255, 0.95)' : colorWithAlpha(stroke, 0.10),
        labelFill: isDefaultDark ? 'rgba(255, 255, 255, 0.95)' : colorWithAlpha(stroke, 0.06),
        textColor: '#22242a',
    };
};

const SwimlaneTypeIcon = ({ type }) => {
    if (type === 'bpmn_pool') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="1.5" y="2" width="13" height="12" rx="1" />
                <line x1="4.5" y1="2" x2="4.5" y2="14" />
            </svg>
        );
    }

    if (type === 'bpmn_lane') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="1.5" y="2" width="13" height="12" rx="1" />
                <line x1="4.5" y1="2" x2="4.5" y2="14" />
            </svg>
        );
    }

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="1.5" y="4" width="13" height="8" rx="1" />
        </svg>
    );
};

const SwimlaneHandles = () => (
    <>
        <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
    </>
);

export const BPMNEmptyLaneNode = ({ id, data, selected }) => {
    const label = data.label; // Don't default to "Empty Lane" here
    const borderColor = selected ? '#007bff' : '#b8c2cc';

    useSwimlaneActions(id, 'bpmn_empty_lane');

    return (
        <div className="relative w-full h-full group">
            <SwimlaneHandles />
            <NodeResizer
                color={selected ? '#007bff' : '#94a3b8'}
                isVisible={selected}
                minWidth={500}
                minHeight={100}
                lineStyle={{ opacity: 0 }}
                handleStyle={{ width: 8, height: 8, borderRadius: 0, border: '1px solid white' }}
            />
            <div
                className="w-full h-full flex items-center justify-center box-border transition-colors"
                style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: selected
                        ? '0 0 0 1px rgba(0, 123, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.95)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.95)',
                }}
            >
                <div
                    className="w-full px-8 text-[20px] font-medium text-center tracking-tight"
                    style={{ color: '#223a5e' }}
                >
                    <Editable
                        value={label}
                        onChange={(v) => data.onEdit && data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="tracking-tight"
                        placeholder="EMPTY LANE"
                    />
                </div>
            </div>
        </div>
    );
};

function useSwimlaneActions(nodeId, currentType) {
    const { setNodes, getNode, getNodes } = useReactFlow();
    const isLaneSelection = isInnerSwimlaneType(currentType);

    useEffect(() => {
        const handleAction = (e) => {
            if (e.detail?.nodeId !== nodeId) return;

            const handleSplitLane = (direction) => {
                const laneNode = getNode(nodeId);
                if (!laneNode?.parentNode) return;

                const poolNode = getNode(laneNode.parentNode);
                if (!poolNode) return;

                const laneSize = getSwimlaneNodeSize(laneNode, { width: 600, height: 160 });
                if (laneSize.height < MIN_SWIMLANE_HEIGHT * 2) return;

                const leadingHeight = Math.max(MIN_SWIMLANE_HEIGHT, Math.floor(laneSize.height / 2));
                const trailingHeight = Math.max(MIN_SWIMLANE_HEIGHT, laneSize.height - leadingHeight);
                const laneWidth = Math.max(220, getSwimlaneNodeSize(poolNode, { width: 1000 }).width - SWIMLANE_INNER_OFFSET_X);
                const currentY = laneNode.position?.y ?? 0;

                const newLane = {
                    id: `bpmn_lane_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    type: 'bpmn_lane',
                    parentNode: poolNode.id,
                    extent: 'parent',
                    draggable: false,
                    position: { x: SWIMLANE_INNER_OFFSET_X, y: direction === 'above' ? currentY : currentY + leadingHeight },
                    style: { width: laneWidth, height: direction === 'above' ? leadingHeight : trailingHeight },
                    zIndex: -1,
                    data: {
                        label: '',
                        customColor: laneNode.data?.customColor,
                        onEdit: poolNode.data?.onEdit,
                        onUpload: poolNode.data?.onUpload,
                        readOnly: poolNode.data?.readOnly,
                    }
                };

                setNodes((nds) => nds.map((node) => {
                    if (node.id !== nodeId) return node;

                    return {
                        ...node,
                        position: {
                            ...(node.position || {}),
                            x: SWIMLANE_INNER_OFFSET_X,
                            y: direction === 'above' ? currentY + leadingHeight : currentY,
                        },
                        style: {
                            ...(node.style || {}),
                            width: laneWidth,
                            height: direction === 'above' ? trailingHeight : leadingHeight,
                        }
                    };
                }).concat(newLane));
            };

            const handleAddLaneToPool = (direction) => {
                const poolNode = getNode(nodeId);
                if (!poolNode) return;

                const allNodes = getNodes();
                const existingLanes = sortPoolLanes(allNodes.filter((node) => node.parentNode === poolNode.id && isInnerSwimlaneType(node.type)));
                const poolSize = getSwimlaneNodeSize(poolNode, { width: 1000, height: 500 });
                const laneWidth = Math.max(220, poolSize.width - SWIMLANE_INNER_OFFSET_X);

                const createLaneNode = (y, height, color) => ({
                    id: `bpmn_lane_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    type: 'bpmn_lane',
                    parentNode: poolNode.id,
                    extent: 'parent',
                    draggable: false,
                    position: { x: SWIMLANE_INNER_OFFSET_X, y },
                    style: { width: laneWidth, height },
                    zIndex: -1,
                    data: {
                        label: '',
                        customColor: color,
                        onEdit: poolNode.data?.onEdit,
                        onUpload: poolNode.data?.onUpload,
                        readOnly: poolNode.data?.readOnly,
                    }
                });

                setNodes((nds) => {
                    if (existingLanes.length === 0) {
                        const topHeight = Math.max(MIN_SWIMLANE_HEIGHT, Math.floor(poolSize.height / 2));
                        const bottomHeight = Math.max(MIN_SWIMLANE_HEIGHT, poolSize.height - topHeight);

                        return nds.concat([
                            createLaneNode(0, topHeight),
                            createLaneNode(topHeight, bottomHeight),
                        ]);
                    }

                    const targetLane = direction === 'below' ? existingLanes[existingLanes.length - 1] : existingLanes[0];
                    const targetHeight = getSwimlaneNodeSize(targetLane, { height: 160 }).height;
                    const leadingHeight = Math.max(MIN_SWIMLANE_HEIGHT, Math.floor(targetHeight / 2));
                    const trailingHeight = Math.max(MIN_SWIMLANE_HEIGHT, targetHeight - leadingHeight);
                    const targetY = targetLane.position?.y ?? 0;

                    const newLane = createLaneNode(
                        direction === 'below' ? targetY + leadingHeight : targetY,
                        direction === 'below' ? trailingHeight : leadingHeight,
                        targetLane.data?.customColor
                    );

                    return nds.map((node) => {
                        if (node.id !== targetLane.id) return node;
                        return {
                            ...node,
                            position: { ...node.position, x: SWIMLANE_INNER_OFFSET_X, y: direction === 'below' ? targetY : targetY + leadingHeight },
                            style: { ...(node.style || {}), width: laneWidth, height: direction === 'below' ? leadingHeight : trailingHeight },
                        };
                    }).concat(newLane);
                });
            };

            if (e.detail.action === 'add-above') {
                if (isLaneSelection) handleSplitLane('above');
                else handleAddLaneToPool('above');
            } else if (e.detail.action === 'add-below') {
                if (isLaneSelection) handleSplitLane('below');
                else handleAddLaneToPool('below');
            }
        };
        window.addEventListener('bpmn-swimlane-add-lane', handleAction);
        return () => window.removeEventListener('bpmn-swimlane-add-lane', handleAction);
    }, [nodeId, isLaneSelection, setNodes, getNode, getNodes]);
}
