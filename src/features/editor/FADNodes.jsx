import React from 'react';
import { Handle, Position } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Target, FileText, Hexagon, Shield, Database, Cpu, Paperclip, ExternalLink, Plus } from 'lucide-react';

/* ---------- SHARED COMPONENTS ---------- */

const NodeAttachments = ({ id, data, themeColor }) => {
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
                {onUpload && (
                    <label className="relative cursor-pointer group/upload-btn">
                        <input type="file" multiple className="hidden" onChange={handleFileChange} />
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-slate-300 bg-white/60 backdrop-blur opacity-50 hover:opacity-100 transition-all duration-300 hover:border-blue-500 hover:bg-white hover:shadow-sm">
                            <Plus className="w-3 h-3 text-slate-500 group-hover/upload-btn:text-blue-600" />
                            <span className="text-[9px] font-bold text-slate-500 group-hover/upload-btn:text-blue-600 uppercase tracking-tighter">Attach</span>
                        </div>
                    </label>
                )}
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
        const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        return LucideIcons[pascalName] || LucideIcons[iconData] || DefaultIcon;
    }
    return iconData;
};

const Editable = ({ value, onChange, readOnly }) => {
    if (readOnly) return <span className="text-center">{value}</span>;
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 w-full text-center"
            onClick={(e) => e.stopPropagation()}
        />
    );
};

/* ---------- NODE COMPONENTS ---------- */

export const FADProcessNode = ({ id, data }) => {
    const DefaultIcon = data.is_central ? Target : FileText;
    const Icon = getIcon(data.icon, DefaultIcon);
    const template = data.template || 'classic';
    const mainColor = data.customColor || '#0ea5e9'; // Professional Sky Blue

    const renderClassic = () => (
        <div
            className="w-[300px] min-h-[120px] h-auto bg-white border-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center overflow-hidden"
            style={{ borderColor: mainColor }}
        >
            <div className="w-4 min-h-[120px] shrink-0" style={{ backgroundColor: mainColor }}></div>
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <Icon className="w-8 h-8 mb-2" style={{ color: mainColor }} />
                <div className="text-sm font-black text-slate-800 text-center leading-tight uppercase tracking-wide">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderModern = () => (
        <div className="w-[280px] min-h-[160px] h-auto bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group flex flex-col items-center">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: mainColor }}></div>
            <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 opacity-20" style={{ backgroundColor: mainColor }}>
                </div>
                <div className="absolute top-0">
                    <Icon className="w-7 h-7" style={{ color: mainColor }} />
                </div>

                <div className="text-sm font-bold text-white text-center leading-relaxed mt-4 mb-4">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="w-[250px] p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: mainColor + '20' }}>
                    <Icon className="w-6 h-6" style={{ color: mainColor }} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Core Function</div>
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-[320px] min-h-[130px] h-auto p-[2px] rounded-[2rem] shadow-2xl" style={{ background: `linear-gradient(to top right, ${mainColor}, #6366f1)` }}>
            <div className="w-full h-full bg-white/90 backdrop-blur-xl rounded-[1.9rem] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, ${mainColor}, #6366f1)` }}></div>
                <Icon className="w-10 h-10 mb-2 opacity-80" style={{ color: mainColor }} />
                <div className="text-[13px] font-black text-slate-800 text-center uppercase tracking-wider mb-2">
                    <Editable value={data.label} onChange={(v) => data.onEdit(id, v)} readOnly={data.readOnly} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative group">
            {/* Central nodes have 8 handles traditionally in FADs here */}
            <Handle type="source" position={Position.Top} id="t" className="!w-2.5 !h-2.5 !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Top} id="t-in" className="!w-2.5 !h-2.5 !opacity-0" style={{ backgroundColor: mainColor }} />

            <Handle type="source" position={Position.Bottom} id="b" className="!w-2.5 !h-2.5 !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Bottom} id="b-in" className="!w-2.5 !h-2.5 !opacity-0" style={{ backgroundColor: mainColor }} />

            <Handle type="source" position={Position.Left} id="l" className="!w-2.5 !h-2.5 !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Left} id="l-in" className="!w-2.5 !h-2.5 !opacity-0" style={{ backgroundColor: mainColor }} />

            <Handle type="source" position={Position.Right} id="r" className="!w-2.5 !h-2.5 !opacity-0 group-hover:!opacity-100" style={{ backgroundColor: mainColor }} />
            <Handle type="source" position={Position.Right} id="r-in" className="!w-2.5 !h-2.5 !opacity-0" style={{ backgroundColor: mainColor }} />

            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}
            <SimpleAttachmentIcon data={data} color={mainColor} />
        </div>
    );
};
