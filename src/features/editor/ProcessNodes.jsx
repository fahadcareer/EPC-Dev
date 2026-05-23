import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Handle, Position } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Zap, FileText, User, Info, Target, Settings, HelpCircle, Paperclip, ExternalLink, Plus, Layout } from 'lucide-react';

/* ---------- SHARED COMPONENTS ---------- */

const NodeAttachments = ({ id, data, themeColor, hideUploadTrigger }) => {
    const attachments = data.attachments || [];
    const onUpload = data.onUpload;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0 && onUpload) {
            Array.from(e.target.files).forEach((file) => {
                onUpload(id, file);
            });
        }
    };

    if (attachments.length === 0 && !onUpload) return null;

    return (
        <div className="absolute bottom-2 left-0 right-0 w-full px-2 flex flex-col items-center gap-1 z-50 pointer-events-none" onClick={(e) => e.stopPropagation()}>
            <div className="pointer-events-auto flex flex-col items-center w-full gap-1">
                {/* Attachment List - Visible Meta Tags */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center w-full max-h-[60px] overflow-y-auto no-scrollbar">
                        {attachments.map((file, index) => (
                            <a
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/file flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md bg-blue-100 border border-blue-200 shadow-sm hover:bg-blue-600 hover:border-blue-700 hover:text-white transition-colors duration-200 active:scale-95 cursor-pointer"
                                title={file.name}
                            >
                                <Paperclip className="w-3 h-3 text-blue-600 group-hover:text-white" />
                                <span className="text-[10px] font-bold text-blue-700 group-hover:text-white max-w-[80px] truncate leading-none">
                                    {file.name}
                                </span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Minimalist Upload Trigger */}
                {onUpload && !hideUploadTrigger && (
                    <label className="relative cursor-pointer group/upload-btn">
                        <input id={`upload-${id}`} type="file" multiple className="hidden" onChange={handleFileChange} />
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-slate-300 bg-white/80 backdrop-blur hover:opacity-100 transition-all duration-300 hover:border-blue-500 hover:bg-white hover:shadow-sm">
                            <Plus className="w-3 h-3 text-slate-500 group-hover/upload-btn:text-blue-600" />
                            <span className="text-[9px] font-bold text-slate-500 group-hover/upload-btn:text-blue-600 uppercase tracking-tighter">Attach</span>
                        </div>
                    </label>
                )}
            </div>
        </div>
    );
};

const LinkedProcessIcon = ({ data, color }) => {
    if (!data.linkedProcessId) return null;
    const tooltipText = `Linked to: ${data.linkedProcessName}${data.linkedProcessDepartment ? ` (${data.linkedProcessDepartment})` : ''}`;

    const handleClick = (e) => {
        e.stopPropagation();
        // Open in new tab to preserve current work
        window.open(`/workspace?id=${data.linkedProcessId}`, '_blank');
    };

    return (
        <div
            className="absolute -top-3 left-0 z-10 cursor-pointer group/link"
            title={tooltipText}
            onClick={handleClick}
        >
            <div className="bg-white rounded-full p-1 shadow-md border border-blue-200 hover:border-blue-500 hover:scale-110 transition-all duration-200">
                <ExternalLink className="w-3 h-3 text-blue-500 group-hover/link:text-blue-600" />
            </div>
        </div>
    );
};

const SimpleAttachmentIcon = ({ data, color }) => {
    if (!data.attachments || data.attachments.length === 0) return null;
    return (
        <div className="absolute -top-3 right-0 z-10" title="Has attachments">
            <div className="bg-white rounded-full p-0.5 shadow-sm border border-slate-200">
                <Paperclip className="w-3 h-3" style={{ color: color }} />
            </div>
        </div>
    );
};

/* ---------- UTILS ---------- */
const getIcon = (iconData, DefaultIcon) => {
    if (!iconData) return DefaultIcon;
    if (typeof iconData === 'string') {
        const cleanName = iconData.replace(/icon/gi, '').replace(/[^a-zA-Z0-9]/g, '');
        // Capitalize first letter
        const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

        // Debugging
        // console.log(`Icon Lookup: '${iconData}' -> '${pascalName}' Found:`, !!LucideIcons[pascalName]);

        return LucideIcons[pascalName] || LucideIcons[iconData] || DefaultIcon;
    }
    return iconData;
};

const Editable = ({ value, onChange, readOnly, className = "" }) => {
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

/* ---------- NODE COMPONENTS ---------- */

const FADSupportHandles = () => (
    <>
        {/* Additional Handles for FAD Layout Support */}
        <Handle type="source" position={Position.Bottom} id="b-in" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Top} id="t-out" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Left} id="l-out" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Right} id="r-in" className="!w-2 !h-2 !opacity-0 pointer-events-none" />
    </>
);

export const EventNode = ({ id, data, selected }) => {
    const Icon = getIcon(data.icon, Zap);
    const template = data.template || 'classic';

    const status = (data.status || '').toLowerCase();
    const label = (data.label || '').toLowerCase();

    // Default: Grey (Restored Semantic Logic: Normal Start/End)
    let themeColor = data.customColor || '#607d8b'; // Blue Grey (or Custom)
    let darkColor = data.customColor || '#455a64';

    // Red: Rejection / Failure
    if (!data.customColor && (
        status === 'rejected' ||
        label.includes('reject') ||
        label.includes('decline') ||
        label.includes('fail') ||
        label.includes('error') ||
        label.includes('cancel') ||
        label.includes('no')
    )) {
        themeColor = '#c62828'; // Red
        darkColor = '#b71c1c';
    }
    // Green: Approval / Success
    else if (
        status === 'approved' ||
        status === 'success' ||
        label.includes('approv') ||
        label.includes('success') ||
        label.includes('accept') ||
        label.includes('yes') ||
        label.includes('confirm') ||
        label.includes('complete') ||
        label.includes('done')
    ) {
        themeColor = '#2e7d32'; // Green
        darkColor = '#1b5e20';
    }

    if (data.isMeta || id.includes('-meta-')) {
        themeColor = '#1565c0';
        darkColor = '#0d47a1';
    }

    const renderClassic = () => (
        <div className={`w-[220px] min-h-[90px] h-auto hover:cursor-move relative ${selected ? 'ring-4 ring-blue-500 rounded-sm z-50' : ''}`}>
            <div
                className="w-full h-full min-h-[90px] bg-white flex overflow-hidden border-2 border-slate-200"
                style={{ clipPath: "polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0% 50%)" }}
            >
                <div
                    className="w-14 min-h-[90px] flex items-center justify-center text-white shrink-0 pl-1"
                    style={{ backgroundColor: themeColor }}
                >
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 text-xs font-bold text-black leading-tight bg-white">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />

                </div>
            </div>


            <Handle type="target" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="source" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="target" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1 !left-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="source" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1 !left-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="target" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1 !left-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1 !left-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="target" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
            <Handle type="source" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: themeColor }} />
        </div>
    );

    const renderModern = () => (
        <div className={`w-[200px] min-h-[80px] h-auto bg-white rounded-2xl shadow-xl border-t-4 overflow-hidden group ${selected ? 'ring-4 ring-blue-500 z-50' : ''}`} style={{ borderTopColor: themeColor }}>
            <div className="p-3 flex flex-col items-center gap-1">
                <Icon className="w-5 h-5" style={{ color: themeColor }} />
                <div className="text-[11px] font-bold text-slate-800 text-center uppercase tracking-tight">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>

            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className={`w-[180px] p-2 bg-white rounded-lg shadow-sm border flex flex-col items-center gap-1 transition-all ${selected ? 'ring-4 ring-blue-500 border-blue-600 z-50' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: themeColor }} />
                </div>
                <div className="text-[10px] font-bold text-slate-700 leading-none flex-1">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>

        </div>
    );

    const renderGlass = () => (
        <div className="w-[180px] p-[2px] rounded-2xl bg-gradient-to-br from-white/40 to-white/10 shadow-xl backdrop-blur-md border border-white/30">
            <div className="bg-white/90 rounded-[14px] p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative overflow-hidden" style={{ backgroundColor: themeColor }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <Icon className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter text-center leading-tight">
                </div>
            </div>
        </div>
    );

    return (
        <div className={`relative group transition-all duration-300 node-appear hover-float ${selected ? 'ring-4 ring-indigo-500 rounded-lg z-50 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : ''}`}>
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            {template !== 'classic' && (
                <>
                    <Handle type="target" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
                </>
            )}
            <FADSupportHandles />
            <SimpleAttachmentIcon data={data} color={themeColor} />
            <LinkedProcessIcon data={data} color={themeColor} />
        </div>
    );
};

export const FunctionNode = ({ id, data, selected }) => {
    const Icon = getIcon(data.icon, FileText);
    const template = data.template || 'classic';
    const mainColor = data.customColor || ((data.isMeta || id.includes('-meta-')) ? '#1565c0' : '#d4a373'); // Custom or Light Brown
    const hoverColor = data.customColor || ((data.isMeta || id.includes('-meta-')) ? '#0d47a1' : '#a98056');


    const renderClassic = () => (
        <div className="relative w-[200px] min-h-[90px] h-auto hover:cursor-move">
            <div
                className="w-full h-full flex overflow-hidden bg-white border-2 rounded-2xl shadow-sm"
                style={{ borderColor: mainColor }}
            >
                <div className="w-12 min-h-[90px] flex items-center justify-center text-white shrink-0" style={{ backgroundColor: mainColor }}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 text-xs font-bold text-black leading-tight bg-white">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>

            <Handle type="target" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1.5 !left-1/2 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1.5 !left-1/2 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1.5 !left-1/2 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1.5 !left-1/2 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
        </div>
    );

    const renderModern = () => (
        <div className="w-[190px] min-h-[80px] h-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden group">
            <div className="h-1.5 w-full" style={{ backgroundColor: mainColor }}></div>
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: mainColor + '10' }}>
                        <Icon className="w-5 h-5" style={{ color: mainColor }} />
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 uppercase flex-1">
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="w-[180px] p-2 bg-slate-50 rounded-lg border-l-4 shadow-sm flex flex-col gap-1" style={{ borderLeftColor: mainColor }}>
            <div className="flex items-center gap-2">
                <Icon className="w-3 h-3 text-slate-400" />
                <div className="text-[10px] font-black text-slate-700 uppercase flex-1">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-[180px] p-[2px] rounded-2xl bg-gradient-to-br from-blue-400/20 to-indigo-500/10 shadow-xl backdrop-blur-md border border-white/30 group">
            <div className="bg-white/90 rounded-[14px] p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative overflow-hidden" style={{ backgroundColor: mainColor }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <Icon className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tighter text-center leading-tight">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
                <SimpleAttachmentIcon data={data} color={mainColor} />
            </div>
        </div>
    );

    return (
        <div className={`relative group transition-all duration-300 node-appear hover-float ${selected ? 'ring-4 ring-indigo-500 rounded-lg z-50 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : ''}`}>
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            {template !== 'classic' && (
                <>
                    <Handle type="target" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
                </>
            )}
            <FADSupportHandles />
            <SimpleAttachmentIcon data={data} color={mainColor} />
            <LinkedProcessIcon data={data} color={mainColor} />
        </div>
    );
};

export const RuleNode = ({ id, data, selected }) => {
    const label = (data.label || "XOR").toUpperCase();
    const symbol = label.includes("AND") || label === "+" ? "∧" : (label.includes("OR") && !label.includes("X")) || label === "O" ? "∨" : "X";
    const template = data.template || 'classic';

    const renderClassic = () => (
        <div
            className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center text-base font-bold text-black shadow-sm group-hover:scale-110 transition-transform"
            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        >
            {symbol}
        </div>
    );

    const renderModern = () => (
        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg group-hover:scale-110 transition-transform">
            {label.slice(0, 3)}
        </div>
    );

    const renderGlass = () => (
        <div className="w-11 h-11 bg-white/20 backdrop-blur-md border border-white/40 rounded-xl flex items-center justify-center text-black font-black shadow-inner group-hover:rotate-12 transition-transform">
            {symbol}
        </div>
    );

    return (
        <div className={`relative group transition-all duration-300 node-appear hover-float ${selected ? 'ring-4 ring-indigo-500 rounded-lg z-50 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : ''}`}>
            <Handle type="target" position={Position.Top} id="t" className="!w-2 !h-2 !-top-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 !-top-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="target" position={Position.Left} id="l" className="!w-2 !h-2 !-left-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 !-left-1 opacity-0 group-hover:opacity-100 transition-opacity" />

            {template === 'minimal' ? renderModern() : template === 'modern' ? renderModern() : template === 'glass' ? renderGlass() : renderClassic()}

            <Handle type="target" position={Position.Bottom} id="b" className="!w-2 !h-2 !-bottom-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 !-bottom-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="target" position={Position.Right} id="r" className="!w-2 !h-2 !-right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 !-right-1 opacity-0 group-hover:opacity-100 transition-opacity" />

            <FADSupportHandles />

            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 transition-opacity z-50">
                <div className="text-[9px] font-bold text-black bg-white/95 px-1.5 py-0.5 rounded shadow-md border border-slate-200 min-w-[40px]">
                    <Editable value={label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );
};

export const RoleNode = ({ id, data, selected }) => {
    const Icon = getIcon(data.icon, User);
    const template = data.template || 'classic';
    const mainColor = data.customColor || ((data.isMeta || id.includes('-meta-')) ? '#1565c0' : '#e65100');


    const renderClassic = () => (
        <div className="relative w-[200px] min-h-[80px] h-auto hover:cursor-move">
            <div
                className="w-full h-full flex overflow-hidden bg-white border-2 rounded shadow-sm"
                style={{ borderColor: mainColor }}
            >
                <div className="w-12 min-h-[80px] flex items-center justify-center text-white shrink-0" style={{ backgroundColor: mainColor }}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 text-xs font-bold text-black leading-tight bg-white">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>

            <Handle type="target" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
        </div>
    );

    const renderModern = () => (
        <div className="w-[180px] bg-white rounded-full shadow-md border border-orange-100 p-2 flex flex-col items-center group">
            <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: mainColor }}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 pr-2 text-[10px] font-black text-slate-700 uppercase truncate">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="w-[140px] text-center flex flex-col items-center gap-1">
            <div className="text-[11px] font-black text-slate-800 uppercase mb-1 border-b-2 inline-block" style={{ borderBottomColor: mainColor }}>
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Role</div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-[180px] p-[2px] rounded-2xl bg-gradient-to-br from-orange-400/20 to-amber-500/10 shadow-xl backdrop-blur-md border border-white/30 group">
            <div className="bg-white/90 rounded-[14px] p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg transform group-hover:rotate-12 transition-all duration-300 relative overflow-hidden" style={{ backgroundColor: mainColor }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <Icon className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tighter text-center leading-tight">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
                <SimpleAttachmentIcon data={data} color={mainColor} />
            </div>
        </div>
    );

    return (
        <div className={`relative group transition-all ${selected ? 'ring-4 ring-blue-500 rounded-lg z-50' : ''}`}>
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            {template !== 'classic' && (
                <>
                    <Handle type="target" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
                </>
            )}
            <FADSupportHandles />
            <SimpleAttachmentIcon data={data} color={mainColor} />
            <LinkedProcessIcon data={data} color={mainColor} />
        </div>
    );
};

export const InfoNode = ({ id, data, selected }) => {
    const Icon = getIcon(data.icon, Info);
    const template = data.template || 'classic';
    const mainColor = data.customColor || '#1565c0'; // Support custom color

    const renderClassic = () => (
        <div className="relative w-[200px] min-h-[80px] h-auto hover:cursor-move">
            <div
                className="w-full h-full flex overflow-hidden bg-white border-2 rounded shadow-sm"
                style={{ borderColor: mainColor, backgroundColor: '#ffffff' }}
            >
                <div className="w-12 min-h-[80px] flex items-center justify-center text-white shrink-0" style={{ backgroundColor: mainColor }}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 text-xs font-bold leading-tight text-black bg-white">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>

            {/* Standard Handles */}
            <Handle type="target" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1.5 transition-all duration-200 rounded-full border border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
        </div>
    );

    const renderModern = () => (
        <div className="w-[180px] min-h-[90px] h-auto bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-md group-hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-3 mb-2">
                <Icon className="w-4 h-4" style={{ color: mainColor }} />
                <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-[10px] font-bold text-slate-700">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="flex flex-col gap-0.5 group">
            <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded shadow-sm">
                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: mainColor }}></div>
                <div className="text-[9px] font-bold text-slate-600 flex-1">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-[180px] p-[2px] rounded-2xl bg-gradient-to-br from-sky-400/20 to-blue-500/10 shadow-xl backdrop-blur-md border border-white/30 group">
            <div className="bg-white/90 rounded-[14px] p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 relative overflow-hidden" style={{ backgroundColor: mainColor }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <Icon className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tighter text-center leading-tight">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>

            </div>
        </div>
    );

    return (
        <div className={`relative group transition-all duration-300 node-appear hover-float ${selected ? 'ring-4 ring-indigo-500 rounded-lg z-50 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : ''}`}>
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            {template !== 'classic' && (
                <>
                    <Handle type="target" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
                </>
            )}
            <FADSupportHandles />
            <SimpleAttachmentIcon data={data} color={mainColor} />
        </div>
    );
};

export const VACDNode = ({ id, data, selected }) => {
    const Icon = getIcon(data.icon, Layout); // Default to Layout/List icon for VACD
    const template = data.template || 'classic';
    const mainColor = data.customColor || '#1565c0'; // Process Chain Blue

    const renderClassic = () => (
        <div className="w-[240px] min-h-[100px] h-auto hover:cursor-move relative group">
            <div
                className="w-full h-full min-h-[100px] bg-white flex overflow-hidden border-2 border-slate-600 shadow-md"
                style={{
                    clipPath: "polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)",
                    borderColor: mainColor // Note: Border on clip-path is tricky, standard div border works best with SVG or drop-shadow filter, but for now using solid div
                }}
            >
                {/* Simulated Border Layer due to clip-path cutting off standard borders */}
                <div className="absolute inset-0 bg-white" style={{ clipPath: "polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)" }}>
                    <div className="absolute inset-0 bg-slate-100" style={{ clipPath: "polygon(1px 1px, 84.5% 1px, 99.5% 50%, 84.5% 99%, 1px 99%)" }}>
                        <div className="flex w-full h-full">
                            <div
                                className="w-16 min-h-[100px] flex items-center justify-center text-white shrink-0 pl-1"
                                style={{ backgroundColor: mainColor }}
                            >
                                <Icon className="w-8 h-8" />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 pr-8 text-sm font-bold text-black leading-tight bg-white">
                                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Handle type="target" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Left} id="l" className="!w-3 !h-3 !-left-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1 !left-[45%] transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Top} id="t" className="!w-3 !h-3 !-top-1 !left-[45%] transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1 !left-[45%] transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Bottom} id="b" className="!w-3 !h-3 !-bottom-1 !left-[45%] transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="target" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Right} id="r" className="!w-3 !h-3 !-right-1 !top-1/2 transition-all duration-200 z-50 rounded-full border-2 border-white !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            {/* Right handle is visually hidden as the point is the connector, but we keep it for functionality */}
        </div>
    );

    const renderModern = () => (
        <div className="w-[220px] min-h-[90px] h-auto bg-white rounded-r-full rounded-l-lg border-l-8 shadow-lg overflow-hidden group hover:scale-[1.02] transition-transform" style={{ borderLeftColor: mainColor }}>
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Icon className="w-5 h-5" style={{ color: mainColor }} />
                    </div>
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex-1">
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">Process Chain</span>
                    {data.linkedProcessId && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Linked</span>}
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="w-[200px] bg-white border border-slate-300 shadow-sm p-2 flex items-center gap-3"
            style={{ clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)" }}
        >
            <div className="w-8 h-8 flex items-center justify-center rounded bg-slate-100">
                <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 pr-6 text-[11px] font-bold text-slate-800">
                <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-[220px] p-[2px] rounded-2xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 shadow-xl backdrop-blur-md border border-white/40 group">
            <div className="bg-white/80 rounded-[14px] p-4 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8"></div>

                <div className="flex items-center gap-3 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-xs font-black text-slate-800 uppercase tracking-tight">
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                </div>

                {data.linkedProcessId && (
                    <div className="mt-2 text-[9px] font-bold text-blue-700 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        Sub-process Linked
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`relative group transition-all duration-300 node-appear hover-float ${selected ? 'ring-4 ring-indigo-500 rounded-lg z-50 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : ''}`}>
            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}

            {template !== 'classic' && template !== 'minimal' && (
                <>
                    <Handle type="target" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100" />
                    <Handle type="target" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100" />
                </>
            )}
            {/* Minimal handles for minimal template */}
            {template === 'minimal' && (
                <>
                    <Handle type="target" position={Position.Left} id="l" className="!w-2 !h-2 -left-1 opacity-0 group-hover:opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2 !h-2 -left-1 opacity-0 group-hover:opacity-100" />
                    <Handle type="target" position={Position.Right} id="r" className="!w-2 !h-2 -right-1 opacity-0 group-hover:opacity-100" />
            <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 -right-1 opacity-0 group-hover:opacity-100" />
                </>
            )}

            <FADSupportHandles />
            <SimpleAttachmentIcon data={data} color={mainColor} />
            <LinkedProcessIcon data={data} color={mainColor} />
        </div>
    );
};
