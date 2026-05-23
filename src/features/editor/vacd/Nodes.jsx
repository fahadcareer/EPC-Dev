import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const SAP_BLUE = '#1565c0';
const SAP_LIGHT_BLUE = '#e3f2fd'; // Blue block color
const SAP_LANE_BG = '#ffffff';

// Theme Color Palettes
const THEME_COLORS = {
    classic: {
        primary: '#1565c0',      // Blue
        secondary: '#e3f2fd',    // Light Blue
        accent: '#0d47a1',       // Dark Blue
        text: '#2d3748'
    },
    modern: {
        primary: '#0ea5e9',      // Sky Blue
        secondary: '#e0f2fe',    // Light Blue
        accent: '#0284c7',       // Dark Blue
        text: '#1e293b'
    },
    minimal: {
        primary: '#8b5cf6',      // Purple
        secondary: '#f3e8ff',    // Light Purple
        accent: '#7c3aed',       // Dark Purple
        text: '#374151'
    },
    glass: {
        primary: '#06b6d4',      // Cyan
        secondary: '#ecfeff',    // Light Cyan
        accent: '#0891b2',       // Dark Cyan
        text: '#0f172a'
    },
    porter: {
        // Porter's Value Chain colors
        supportBg: '#FFF4D6',      // Yellow/beige for support activities
        supportHeader: '#FFE8B3',
        supportBorder: '#E6D5A8',
        primaryBg: '#D4E8ED',      // Blue/teal for primary activities
        primaryHeader: '#A8CDD8',
        primaryBorder: '#9CBCC7',
        marginBg: '#8BBCC7',       // Teal for margin chevron
        text: '#333',
        primary: '#8BBCC7',        // For compatibility
        secondary: '#FFF4D6',
        accent: '#A8CDD8'
    }
};

const Editable = ({ value, onChange, readOnly, className = "" }) => {
    const [editing, setEditing] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value || "");

    React.useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    if (readOnly) return <span className={`text-center py-1 ${className}`}>{value}</span>;

    const commit = () => {
        setEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    if (!editing) {
        return (
            <div
                className={`text-center cursor-text min-h-[1.5em] py-1 px-2 hover:bg-black/5 rounded transition-colors ${className}`}
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
            className={`bg-white/90 border border-blue-500 focus:outline-none w-full text-center resize-none overflow-hidden font-medium rounded shadow-sm nodrag ${className}`}
            rows={2}
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export const ManagementProcessNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeBorderColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`w-full h-full bg-white border flex items-center justify-center text-center shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 border-blue-600 z-50' : ''}`} style={{ borderColor: selected ? '#2563eb' : activeBorderColor, borderStyle: 'solid', borderWidth: '1px' }}>
            <div className="text-[12px] font-semibold px-4" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderPorter = () => {
        const bg = userColor ? userColor + '20' : THEME_COLORS.porter.supportBg;
        const border = userColor || THEME_COLORS.porter.supportBorder;
        const header = userColor ? userColor + '40' : THEME_COLORS.porter.supportHeader;

        return (
            <div className={`w-full h-full flex flex-col border shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ backgroundColor: bg, borderColor: border, borderWidth: '1px' }}>
                <div className="h-8 flex items-center px-4 border-b" style={{ backgroundColor: header, borderBottomColor: border }}>
                    <div className="text-[11px] font-bold uppercase w-full flex items-center justify-center" style={{ color: '#333' }}>
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <div className="flex-1 px-4 py-2">
                    <div className="text-[10px] w-full" style={{ color: '#555' }}>
                        <Editable value={data.description || '• Details here'} onChange={(v) => data.onEditDescription && data.onEditDescription(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <Handle type="target" position={Position.Top} className="!opacity-0" />
                <Handle type="source" position={Position.Bottom} className="!opacity-0" />
            </div>
        );
    };

    const renderModern = () => (
        <div className={`w-full h-full bg-white rounded-xl shadow-lg border-t-4 flex items-center justify-center px-4 hover:shadow-xl transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ borderTopColor: colors.primary }}>
            <div className="text-[12px] font-bold text-center w-full" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderMinimal = () => (
        <div className={`w-full h-full bg-white rounded-md border flex items-center justify-center px-3 shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ borderColor: colors.primary + '40' }}>
            <div className="text-[11px] font-semibold text-center w-full" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderGlass = () => (
        <div className={`w-full h-full p-[2px] rounded-2xl bg-gradient-to-br shadow-xl backdrop-blur-md border border-white/30 transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}20)` }}>
            <div className="w-full h-full bg-white/90 rounded-[14px] flex items-center justify-center px-4">
                <div className="text-[12px] font-black text-center uppercase tracking-tight w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={40}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'porter' && renderPorter()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};

export const SupportProcessNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeBorderColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`w-full h-full bg-white border flex items-center justify-center text-center shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 border-blue-600 z-50' : ''}`} style={{ borderColor: selected ? '#2563eb' : activeBorderColor, borderStyle: 'solid', borderWidth: '1px' }}>
            <div className="text-[12px] font-semibold px-4" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderPorter = () => {
        const bg = userColor ? userColor + '20' : THEME_COLORS.porter.supportBg;
        const border = userColor || THEME_COLORS.porter.supportBorder;
        const header = userColor ? userColor + '40' : THEME_COLORS.porter.supportHeader;

        return (
            <div className={`w-full h-full flex flex-col border shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ backgroundColor: bg, borderColor: border, borderWidth: '1px' }}>
                <div className="h-8 flex items-center px-4 border-b" style={{ backgroundColor: header, borderBottomColor: border }}>
                    <div className="text-[11px] font-bold uppercase w-full flex items-center justify-center" style={{ color: '#333' }}>
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <div className="flex-1 px-4 py-2">
                    <div className="text-[10px] w-full" style={{ color: '#555' }}>
                        <Editable value={data.description || '• Details here'} onChange={(v) => data.onEditDescription && data.onEditDescription(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <Handle type="target" position={Position.Top} className="!opacity-0" />
                <Handle type="source" position={Position.Bottom} className="!opacity-0" />
            </div>
        );
    };

    const renderModern = () => (
        <div className={`w-full h-full bg-white rounded-xl shadow-lg border-t-4 flex items-center justify-center px-4 hover:shadow-xl transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ borderTopColor: colors.primary }}>
            <div className="text-[12px] font-bold text-center w-full" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderMinimal = () => (
        <div className={`w-full h-full bg-white rounded-md border flex items-center justify-center px-3 shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ borderColor: selected ? '#2563eb' : colors.primary + '40' }}>
            <div className="text-[11px] font-semibold text-center w-full" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderGlass = () => (
        <div className={`w-full h-full p-[2px] rounded-2xl bg-gradient-to-br shadow-xl backdrop-blur-md border border-white/30 transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}20)` }}>
            <div className="w-full h-full bg-white/90 rounded-[14px] flex items-center justify-center px-4">
                <div className="text-[12px] font-black text-center uppercase tracking-tight w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={40}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'porter' && renderPorter()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};

export const CoreProcessNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-2 ring-blue-500 rounded-sm z-50' : ''}`}>
            <div className="absolute inset-0" style={{
                clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)",
                backgroundColor: selected ? '#2563eb' : activeColor,
                zIndex: 0
            }} />
            <div
                className="absolute inset-[1.5px] bg-white flex items-center justify-center pr-4 pl-6"
                style={{
                    clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)",
                }}
            >
                <div className="text-[12px] font-bold text-center leading-tight" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    const renderPorter = () => {
        const bg = userColor ? userColor + '20' : THEME_COLORS.porter.primaryBg;
        const border = userColor || THEME_COLORS.porter.primaryBorder;
        const header = userColor ? userColor + '40' : THEME_COLORS.porter.primaryHeader;

        return (
            <div className={`w-full h-full flex flex-col border shadow-md transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ backgroundColor: bg, borderColor: border, borderWidth: '1px' }}>
                <div className="h-10 flex items-center justify-center px-3 border-b" style={{ backgroundColor: header, borderBottomColor: border }}>
                    <div className="text-[11px] font-bold uppercase text-center w-full" style={{ color: '#1a5a6e' }}>
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <div className="flex-1 px-3 py-3 overflow-auto">
                    <div className="text-[10px] leading-relaxed w-full font-medium" style={{ color: '#2d4a54' }}>
                        <Editable value={data.description || '• Key activities\n• Details here'} onChange={(v) => data.onEditDescription && data.onEditDescription(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
                <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
            </div>
        );
    };

    const renderModern = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-2xl' : ''}`}>
            <div className="absolute inset-0 rounded-2xl shadow-xl" style={{
                backgroundColor: colors.primary,
                clipPath: "polygon(5% 0%, 90% 0%, 100% 50%, 90% 100%, 5% 100%, 15% 50%)",
            }} />
            <div
                className="absolute inset-[2px] bg-white flex items-center justify-center pr-4 pl-6 rounded-2xl"
                style={{
                    clipPath: "polygon(5% 0%, 90% 0%, 100% 50%, 90% 100%, 5% 100%, 15% 50%)",
                }}
            >
                <div className="text-[12px] font-black text-center uppercase tracking-tight w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    const renderMinimal = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-lg border-2 border-blue-600' : ''}`}>
            <div className="absolute inset-0 border-2 rounded-lg" style={{
                borderColor: selected ? 'transparent' : colors.primary,
                backgroundColor: 'white'
            }}>
                <div className="w-full h-full flex items-center justify-center px-4">
                    <div className="text-[11px] font-semibold text-center w-full" style={{ color: colors.text }}>
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    const renderGlass = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-3xl' : ''}`}>
            <div className="absolute inset-0 p-[2px] rounded-3xl bg-gradient-to-br shadow-2xl" style={{
                backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                clipPath: "polygon(3% 0%, 92% 0%, 100% 50%, 92% 100%, 3% 100%, 12% 50%)",
            }} />
            <div
                className="absolute inset-[3px] bg-white/95 backdrop-blur-sm flex items-center justify-center pr-4 pl-6 rounded-3xl"
                style={{
                    clipPath: "polygon(3% 0%, 92% 0%, 100% 50%, 92% 100%, 3% 100%, 12% 50%)",
                }}
            >
                <div className="text-[12px] font-black text-center uppercase tracking-widest w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={40}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'porter' && renderPorter()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};

export const ChevronLeftNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`w-full h-full flex items-center justify-center transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-sm' : ''}`}>
            <div
                className="w-full h-full flex items-center justify-center text-white text-[14px] font-black text-center px-4 shadow-xl"
                style={{
                    backgroundColor: activeColor,
                    clipPath: "polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%, 20% 50%)",
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-widest w-full">
                    <Editable
                        value={data.label || 'Customer Request'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    const renderPorter = () => (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: activeColor }}>
            <div
                className="w-full h-full flex items-center justify-center text-white text-[18px] font-black text-center shadow-lg"
                style={{
                    backgroundColor: activeColor,
                    clipPath: "polygon(0% 0%, 70% 0%, 100% 50%, 70% 100%, 0% 100%)",
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-[0.3em]">
                    <Editable
                        value={data.label || 'Input'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    const renderModern = () => (
        <div className={`w-full h-full flex items-center justify-center p-2 transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-3xl' : ''}`}>
            <div
                className="w-full h-full flex items-center justify-center text-white text-[13px] font-bold text-center px-3 rounded-3xl shadow-2xl"
                style={{
                    background: userColor ? `linear-gradient(180deg, ${userColor}, ${userColor}dd)` : `linear-gradient(180deg, ${colors.primary}, ${colors.accent})`,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-wider w-full">
                    <Editable
                        value={data.label || 'Customer Request'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="w-full h-full flex items-center justify-center p-1">
            <div
                className="w-full h-full flex items-center justify-center text-[12px] font-semibold text-center px-2 border-2 rounded-lg"
                style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-wide">
                    <Editable
                        value={data.label || 'Customer Request'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                    />
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-full h-full flex items-center justify-center p-1">
            <div
                className="w-full h-full flex items-center justify-center text-white text-[13px] font-black text-center px-3 rounded-3xl shadow-2xl backdrop-blur-md border border-white/30"
                style={{
                    background: `linear-gradient(180deg, ${colors.primary}dd, ${colors.accent}dd)`,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-widest">
                    <Editable
                        value={data.label || 'Customer Request'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={40}
                minHeight={200}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'porter' && renderPorter()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};

export const ChevronRightNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`w-full h-full flex items-center justify-center transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-sm' : ''}`}>
            <div
                className="w-full h-full flex items-center justify-center text-white text-[14px] font-black text-center px-4 shadow-xl"
                style={{
                    backgroundColor: activeColor,
                    clipPath: "polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%, 20% 50%)",
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-widest w-full">
                    <Editable
                        value={data.label || 'Customer Satisfaction'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    const renderPorter = () => {
        const bg = userColor || THEME_COLORS.porter.marginBg;

        return (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                <div
                    className="w-full h-full flex items-center justify-center text-white text-[18px] font-black text-center shadow-lg"
                    style={{
                        backgroundColor: bg,
                        clipPath: "polygon(0% 0%, 70% 0%, 100% 50%, 70% 100%, 0% 100%)",
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                    }}
                >
                    <div className="rotate-180 uppercase tracking-[0.3em]">
                        <Editable
                            value={data.label || 'Margin'}
                            onChange={(v) => data.onEdit(id, v)}
                            readOnly={data.readOnly}
                            className="text-white"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderModern = () => (
        <div className="w-full h-full flex items-center justify-center p-2">
            <div
                className="w-full h-full flex items-center justify-center text-white text-[13px] font-bold text-center px-3 rounded-3xl shadow-2xl"
                style={{
                    background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})`,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-wider">
                    <Editable
                        value={data.label || 'Customer Satisfaction'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="w-full h-full flex items-center justify-center p-1">
            <div
                className="w-full h-full flex items-center justify-center text-[12px] font-semibold text-center px-2 border-2 rounded-lg"
                style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-wide">
                    <Editable
                        value={data.label || 'Customer Satisfaction'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                    />
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-full h-full flex items-center justify-center p-1">
            <div
                className="w-full h-full flex items-center justify-center text-white text-[13px] font-black text-center px-3 rounded-3xl shadow-2xl backdrop-blur-md border border-white/30"
                style={{
                    background: `linear-gradient(180deg, ${colors.primary}dd, ${colors.accent}dd)`,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
            >
                <div className="rotate-180 uppercase tracking-widest">
                    <Editable
                        value={data.label || 'Customer Satisfaction'}
                        onChange={(v) => data.onEdit(id, v)}
                        readOnly={data.readOnly}
                        className="text-white"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={40}
                minHeight={200}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'porter' && renderPorter()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};

export const LaneNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeBorderColor = userColor || colors.primary;

    const renderClassic = () => (
        <div
            className={`w-full h-full flex flex-col transition-all ${selected ? 'ring-4 ring-blue-500 border-blue-600 z-50' : ''}`}
            style={{
                border: `2px solid ${selected ? '#2563eb' : activeBorderColor}`,
                backgroundColor: 'white',
                borderRadius: '4px'
            }}
        >
            <div className="h-10 flex items-center justify-center border-b bg-slate-50" style={{ borderBottomColor: activeBorderColor + '20' }}>
                <div className="text-[11px] font-black uppercase tracking-widest w-full px-4" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderModern = () => (
        <div
            className={`w-full h-full flex flex-col rounded-2xl shadow-xl overflow-hidden transition-all ${selected ? 'ring-4 ring-blue-500 z-50' : ''}`}
            style={{
                border: `3px solid ${selected ? '#2563eb' : activeBorderColor}`,
                backgroundColor: 'white'
            }}
        >
            <div className="h-12 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${activeBorderColor}, ${userColor ? userColor + 'dd' : colors.accent})` }}>
                <div className="text-[12px] font-black uppercase tracking-wider text-white w-full px-4">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} className="text-white" />
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div
            className={`w-full h-full flex flex-col rounded-lg transition-all ${selected ? 'ring-4 ring-blue-500 z-50 border-blue-600' : ''}`}
            style={{
                border: `2px solid ${selected ? '#2563eb' : activeBorderColor + '40'}`,
                backgroundColor: 'white'
            }}
        >
            <div className="h-8 flex items-center justify-center border-b" style={{ borderBottomColor: activeBorderColor + '30', backgroundColor: userColor ? userColor + '10' : colors.secondary + '40' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide w-full px-4" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div
            className={`w-full h-full flex flex-col rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md border transition-all ${selected ? 'ring-4 ring-blue-500 border-blue-600 z-50' : 'border-white/40'}`}
            style={{
                background: `linear-gradient(135deg, ${userColor ? userColor + '88' : colors.secondary + 'cc'}, ${userColor ? userColor + '44' : colors.secondary + '88'})`
            }}
        >
            <div className="h-14 flex items-center justify-center border-b border-white/30" style={{ background: `linear-gradient(135deg, ${activeBorderColor}dd, ${userColor ? userColor + 'cc' : colors.accent + 'dd'})` }}>
                <div className="text-[12px] font-black uppercase tracking-widest text-white w-full px-4">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} className="text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={300}
                minHeight={150}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};

export const ProcessGroupNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeBorderColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`w-full h-full bg-white border-2 flex items-center justify-center text-center shadow-md relative transition-all ${selected ? 'ring-2 ring-blue-500 border-blue-600 z-50' : ''}`} style={{ borderColor: selected ? '#2563eb' : activeBorderColor, borderStyle: 'solid' }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: activeBorderColor }} />
            <div className="text-[12px] font-bold px-4 leading-tight" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderModern = () => (
        <div className={`w-full h-full bg-slate-50 border-2 rounded-2xl flex items-center justify-center text-center shadow-lg group hover:bg-white transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ borderColor: selected ? '#2563eb' : activeBorderColor }}>
            <div className="text-[12px] font-black uppercase tracking-wider px-4 w-full" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderMinimal = () => (
        <div className={`w-full h-full bg-white border-l-8 flex items-center justify-center text-center shadow-sm transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : ''}`} style={{ borderLeftColor: activeBorderColor, borderLeftWidth: '8px' }}>
            <div className="text-[11px] font-semibold px-4 w-full" style={{ color: colors.text }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    const renderGlass = () => (
        <div className={`w-full h-full p-[2px] rounded-3xl bg-gradient-to-br shadow-2xl backdrop-blur-lg border transition-all ${selected ? 'ring-2 ring-blue-500 z-50' : 'border-white/40'}`} style={{ backgroundImage: `linear-gradient(135deg, ${activeBorderColor}dd, ${colors.accent}66)` }}>
            <div className="w-full h-full bg-white/80 rounded-[22px] flex items-center justify-center p-4">
                <div className="text-[12px] font-black text-center uppercase tracking-widest w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={160}
                minHeight={60}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            {template === 'porter' && renderClassic()}
        </>
    );
};

export const ValueAddedChainNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeColor = userColor || colors.primary;

    const renderClassic = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-2 ring-blue-500 rounded-sm z-50' : ''}`}>
            <div className="absolute inset-0" style={{
                clipPath: "polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)",
                backgroundColor: selected ? '#2563eb' : activeColor,
                zIndex: 0
            }} />
            <div
                className="absolute inset-[1.5px] bg-white flex items-center justify-center pr-6 pl-4"
                style={{
                    clipPath: "polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)",
                }}
            >
                <div className="text-[12px] font-bold text-center leading-tight" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    const renderModern = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-2xl' : ''}`}>
            <div className="absolute inset-0 rounded-2xl shadow-xl" style={{
                backgroundColor: activeColor,
                clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)",
            }} />
            <div
                className="absolute inset-[2px] bg-white flex items-center justify-center pr-6 pl-4 rounded-2xl"
                style={{
                    clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)",
                }}
            >
                <div className="text-[12px] font-black text-center uppercase tracking-tight w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    const renderMinimal = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-lg border-2 border-blue-600' : ''}`}>
            <div className="absolute inset-0 border-2 rounded-lg" style={{
                borderColor: selected ? 'transparent' : activeColor,
                backgroundColor: 'white',
                clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)"
            }}>
                <div className="w-full h-full flex items-center justify-center pr-6 pl-4">
                    <div className="text-[11px] font-semibold text-center w-full" style={{ color: colors.text }}>
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    const renderGlass = () => (
        <div className={`relative w-full h-full transition-all ${selected ? 'ring-4 ring-blue-500 z-50 rounded-3xl' : ''}`}>
            <div className="absolute inset-0 p-[2px] rounded-3xl bg-gradient-to-br shadow-2xl" style={{
                backgroundImage: `linear-gradient(135deg, ${activeColor}, ${colors.accent})`,
                clipPath: "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%)",
            }} />
            <div
                className="absolute inset-[3px] bg-white/95 backdrop-blur-sm flex items-center justify-center pr-6 pl-4 rounded-3xl"
                style={{
                    clipPath: "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%)",
                }}
            >
                <div className="text-[12px] font-black text-center uppercase tracking-widest w-full" style={{ color: colors.text }}>
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!opacity-0" id="l" />
            <Handle type="source" position={Position.Right} className="!opacity-0" id="r" />
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={60}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            {template === 'porter' && renderClassic()}
        </>
    );
};

export const SubLaneNode = ({ id, data, selected }) => {
    const template = data.template || 'classic';
    const colors = THEME_COLORS[template] || THEME_COLORS.classic;
    const userColor = data.customColor || data.nodeColor;
    const activeBgColor = userColor || colors.secondary;

    const renderClassic = () => (
        <div
            className={`w-full h-full flex flex-col shadow-sm transition-all ${selected ? 'ring-4 ring-blue-500 border-2 border-blue-600 z-50' : ''}`}
            style={{
                backgroundColor: activeBgColor,
                borderRadius: '0px',
                border: selected ? 'none' : 'none',
                opacity: 0.9
            }}
        >
            <div className="p-4 text-[12px] font-bold uppercase tracking-tighter w-full">
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} style={{ color: colors.text }} />
            </div>
        </div>
    );

    const renderModern = () => (
        <div
            className={`w-full h-full flex flex-col rounded-xl shadow-lg p-4 transition-all ${selected ? 'ring-4 ring-blue-500 border-2 border-blue-600 z-50' : ''}`}
            style={{
                background: `linear-gradient(135deg, ${activeBgColor}, ${userColor ? userColor + 'cc' : colors.secondary + 'cc'})`,
                border: selected ? 'none' : `2px solid ${userColor ? userColor : colors.primary}40`
            }}
        >
            <div className="text-[12px] font-bold uppercase tracking-tight w-full">
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} style={{ color: colors.text }} />
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div
            className={`w-full h-full flex flex-col rounded-md p-3 transition-all ${selected ? 'ring-4 ring-blue-500 border-2 border-blue-600 z-50' : ''}`}
            style={{
                backgroundColor: userColor ? userColor + '40' : colors.secondary + '60',
                border: selected ? 'none' : `1px solid ${userColor ? userColor : colors.primary}30`
            }}
        >
            <div className="text-[11px] font-semibold uppercase tracking-tight w-full">
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} style={{ color: colors.text }} />
            </div>
        </div>
    );

    const renderGlass = () => (
        <div
            className={`w-full h-full flex flex-col rounded-2xl shadow-xl p-4 backdrop-blur-sm transition-all ${selected ? 'ring-4 ring-blue-500 border-2 border-blue-600 z-50' : 'border border-white/30'}`}
            style={{
                background: `linear-gradient(135deg, ${userColor ? userColor + 'dd' : colors.secondary + 'dd'}, ${userColor ? userColor + '99' : colors.secondary + '99'})`
            }}
        >
            <div className="text-[12px] font-black uppercase tracking-tight w-full">
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} style={{ color: colors.text }} />
            </div>
        </div>
    );

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={100}
                lineStyle={{ border: '2px solid #6366f1' }}
                handleStyle={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', border: '2px solid #6366f1' }}
            />
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
        </>
    );
};
