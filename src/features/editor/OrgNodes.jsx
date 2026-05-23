import React from 'react';
import { Handle, Position } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Paperclip, ExternalLink, Plus } from 'lucide-react';

/* ---------- SHARED COMPONENTS ---------- */

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

/* ---------- AVATARS ---------- */
export const MaleAvatar = ({ color = "#1e40af" }) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <circle cx="32" cy="32" r="30" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M19 32C19 23 24 16 32 16C40 16 45 23 45 32" stroke="#3D2B1F" strokeWidth="6" strokeLinecap="round" />
        <path d="M18 34C18 20 25 14 32 14C39 14 46 20 46 34" fill="#3D2B1F" />
        <path d="M32 44C38.6274 44 44 38.6274 44 32C44 25.3726 38.6274 20 32 20C25.3726 20 20 25.3726 20 32C20 38.6274 25.3726 44 32 44Z" fill="#FFDBB5" />
        <path d="M14 58C14 50 20 45 32 45C44 45 50 50 50 58V60H14V58Z" fill="#334155" />
        <path d="M32 45L28 52H36L32 45Z" fill="#FFFFFF" />
        <path d="M32 52L30 60H34L32 52Z" fill={color} />
    </svg>
);

export const FemaleAvatar = ({ color = "#BE185D" }) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <circle cx="32" cy="32" r="30" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M32 40C37.5228 40 42 35.5228 42 30C42 24.4772 37.5228 20 32 20C26.4772 20 22 24.4772 22 30C22 35.5228 26.4772 40 32 40Z" fill="#FFDBB5" />
        <path d="M32 18C25 18 20 24 20 32C20 40 23 46 23 46C23 46 25 41 25 37C25 37 27 41 32 41C37 41 39 37 39 37C39 41 41 46 41 46C41 46 44 40 44 32C44 24 39 18 32 18Z" fill="#78350F" />
        <path d="M14 58C14 50 20 45 32 45C44 45 50 50 50 58V60H14V58Z" fill={color} />
        <path d="M32 45L29 52H35L32 45Z" fill="#FDF2F8" />
    </svg>
);

export const TeamAvatar = ({ color }) => (
    <div className="w-full h-full relative">
        <div className="absolute left-[10%] bottom-[15%] w-[45%] h-[45%] opacity-90 z-0"><MaleAvatar color={color} /></div>
        <div className="absolute right-[10%] bottom-[15%] w-[45%] h-[45%] opacity-90 z-0"><FemaleAvatar color={color} /></div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[50%] h-[50%] z-10 shadow-sm rounded-full bg-white ring-1 ring-slate-100 overflow-hidden"><MaleAvatar color={color} /></div>
    </div>
);

export const CompanyAvatar = () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-slate-700 p-1">
            <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 21V7L13 3V21" stroke="currentColor" strokeWidth="1.5" />
            <path d="M19 21V11L13 7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 11H10M9 15H10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    </div>
);

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

export const OrganizationalElementNode = ({ id, data, selected }) => {
    const labelText = data.label || "";
    const lowerLabel = labelText.toLowerCase();
    const template = data.template || 'classic'; // Default to classic

    // Check for Custom Icon first
    const CustomIcon = getIcon(data.icon, null);

    // Avatar Logic
    let Avatar = MaleAvatar;
    let isTeam = false;
    let isCompany = false;
    let gender = 'male';

    const isPerson =
        lowerLabel.includes('lead') || lowerLabel.includes('manager') || lowerLabel.includes('director') ||
        lowerLabel.includes('ceo') || lowerLabel.includes('coo') || lowerLabel.includes('riyaz') ||
        lowerLabel.includes('matar') || lowerLabel.includes('essa') || lowerLabel.includes('thulkarnain') ||
        lowerLabel.includes('ahmed') || lowerLabel.includes('imran') || lowerLabel.includes('fahad') || lowerLabel.includes('designer');

    const iconName = (data.icon || "").toLowerCase();

    // 1. Check for Rich Avatar Keywords (Prioritize rich SVGs)
    if (['team', 'users', 'group', 'staff', 'people', 'department'].some(k => iconName.includes(k))) {
        Avatar = TeamAvatar;
        isTeam = true;
    } else if (['company', 'building', 'office', 'org', 'business'].some(k => iconName.includes(k))) {
        Avatar = CompanyAvatar;
        isCompany = true;
    } else if (['female', 'woman', 'girl', 'lady', 'mrs', 'ms'].some(k => iconName.includes(k))) {
        Avatar = FemaleAvatar;
        gender = 'female';
    } else if (['male', 'man', 'user', 'person', 'guy', 'profile', 'account', 'admin', 'manager', 'lead', 'head', 'principal', 'director'].some(k => iconName.includes(k))) {
        Avatar = MaleAvatar;
        gender = 'male';
    } else if (CustomIcon) {
        // 2. If no rich avatar match, check for Lucide Icon (Token Style)
        Avatar = ({ color }) => (
            <div className="w-full h-full flex items-center justify-center p-[2px]">
                <div className="w-full h-full rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center drop-shadow-sm p-1">
                    <CustomIcon className="w-1/2 h-1/2" style={{ color: color }} strokeWidth={1.5} />
                </div>
            </div>
        );
    } else if (lowerLabel.includes('meerana') || lowerLabel.includes('company') || lowerLabel.includes('limited')) {
        if (isPerson) { Avatar = MaleAvatar; gender = 'male'; }
        else { Avatar = CompanyAvatar; isCompany = true; }
    } else if (
        (lowerLabel.includes('team') || lowerLabel.includes('group') || lowerLabel.includes('staff') ||
            lowerLabel.includes('technologies') || lowerLabel.includes('ecommerce') || lowerLabel.includes('division')) &&
        !isPerson
    ) {
        Avatar = TeamAvatar;
        isTeam = true;
    } else if (
        lowerLabel.includes('women') || lowerLabel.includes('woman') || lowerLabel.includes('female') ||
        lowerLabel.includes('naseeha') || lowerLabel.includes('rafiya') || lowerLabel.includes('sahla') ||
        lowerLabel.includes('ms.') || lowerLabel.includes('mrs.')
    ) {
        Avatar = FemaleAvatar;
        gender = 'female';
    } else {
        Avatar = MaleAvatar;
        gender = 'male';
    }

    const categoryColors = {
        director: { main: '#003366', light: '#f8f9fa', text: '#ffffff' },
        deputy: { main: '#76e1cc', light: '#e0fcf7', text: '#2d6a4f' },
        education: { main: '#f39c12', light: '#fdf3e7', text: '#a04000' },
        admin: { main: '#e91e63', light: '#fce4ec', text: '#ad1457' },
        superadmin: { main: '#7c4dff', light: '#ede7f6', text: '#512da8' }, // Added superadmin just in case
        designer: { main: '#0d9488', light: '#ccfbf1', text: '#115e59' },
        technical: { main: '#3b82f6', light: '#eff6ff', text: '#1e40af' },
        advisory: { main: '#64748b', light: '#f8fafc', text: '#334155' },
        male: { main: '#2563eb', light: '#eff6ff', text: '#1e40af' },
        female: { main: '#db2777', light: '#fdf2f8', text: '#9d174d' },
        default: { main: '#0ea5e9', light: '#f0f9ff', text: '#0369a1' }
    };

    let cat = data.category?.toLowerCase() || 'default';
    if (isPerson && !isCompany) cat = gender === 'male' ? 'male' : 'female';
    else {
        if ((lowerLabel.includes('director') || lowerLabel.includes('ceo') || lowerLabel.includes('meerana')) && !lowerLabel.includes('deputy')) cat = 'director';
        else if (lowerLabel.includes('deputy')) cat = 'deputy';
        else if (lowerLabel.includes('education') || lowerLabel.includes('lectures') || lowerLabel.includes('student')) cat = 'education';
        else if (lowerLabel.includes('designer')) cat = 'designer';
        else if (lowerLabel.includes('manager') || lowerLabel.includes('accounting') || lowerLabel.includes('operational') || lowerLabel.includes('admin')) cat = 'admin';
        else if (lowerLabel.includes('technician') || lowerLabel.includes('maintenance')) cat = 'technical';
        else if (lowerLabel.includes('committee')) cat = 'advisory';
    }

    const theme = data.customColor
        ? { main: data.customColor, light: '#f8f9fa', text: data.customColor }
        : (categoryColors[cat] || categoryColors['default']);
    const parts = labelText.split('\n');
    const roleDisplay = parts.length > 1 ? parts[1] : (data.role || cat.toUpperCase());
    const nameDisplay = parts[0];

    const onEditLabel = (v) => {
        const rest = parts.slice(1).join('\n');
        data.onEdit(id, v + (rest ? '\n' + rest : ''));
    };

    // --- RENDERING STRATEGY BASED ON TEMPLATE ---

    const renderClassic = () => (
        <div className="flex w-[280px] min-h-[90px] h-auto bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
            <Handle type="source" position={Position.Top} id="t" className="!w-2 !h-2 !-top-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: theme.main }} />

            {/* Avatar Section (Left) */}
            <div className="w-[90px] min-h-[90px] bg-slate-50/50 flex items-center justify-center border-r border-slate-100 p-3 shrink-0 relative">
                <div className="absolute inset-y-0 left-0 w-1 h-full" style={{ backgroundColor: theme.main }}></div>
                <div className="w-full h-full relative z-10 flex items-center justify-center">
                    {CustomIcon ? <CustomIcon className="w-10 h-10" style={{ color: theme.main }} /> : <Avatar color={theme.main} />}
                </div>
            </div>

            {/* Content Section (Right) */}
            <div className="flex-1 flex flex-col min-h-full overflow-hidden">
                {/* Role Header */}
                <div
                    className="min-h-[36px] w-full flex items-center px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] shadow-sm relative leading-tight"
                    style={{
                        backgroundColor: theme.main,
                        color: '#ffffff',
                        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)'
                    }}
                >
                    {roleDisplay}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5"></div>
                </div>

                {/* Name Body */}
                <div className="flex-1 w-full flex flex-col items-center px-4 py-2 bg-white overflow-hidden italic text-center justify-center relative gap-1">
                    <div className="text-[12px] font-semibold text-slate-700 leading-tight tracking-wide">
                        <Editable value={nameDisplay} onChange={onEditLabel} readOnly={data.readOnly} />
                    </div>
                </div>
            </div>

            {/* Sideways Handles */}
            <Handle type="source" position={Position.Right} id="r" className="!w-2.5 !h-2.5 !-right-1 opacity-0 group-hover:opacity-100 transition-all" />
            <Handle type="source" position={Position.Left} id="l" className="!w-2.5 !h-2.5 !-left-1 opacity-0 group-hover:opacity-100 transition-all" />
        </div>
    );

    const renderModern = () => (
        <div className="flex flex-col w-[220px] min-h-[200px] h-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="h-2 w-full" style={{ backgroundColor: theme.main }}></div>
            <div className="p-4 flex flex-col items-center gap-3 h-full">
                <div className="w-16 h-16 rounded-full bg-slate-50 border-2 flex items-center justify-center p-2" style={{ borderColor: theme.main }}>
                    {CustomIcon ? <CustomIcon className="w-8 h-8" style={{ color: theme.main }} /> : <Avatar color={theme.main} />}
                </div>
                <div className="text-center flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.main }}>{roleDisplay}</div>
                    <div className="text-sm font-bold text-slate-800">
                        <Editable value={nameDisplay} onChange={onEditLabel} readOnly={data.readOnly} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="flex flex-col w-[240px] bg-white/80 backdrop-blur-md rounded-lg shadow-sm border-l-4 p-3 hover:shadow-md transition-shadow group" style={{ borderLeftColor: theme.main }}>
            <div className="flex items-center w-full">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center p-1.5 mr-3 shrink-0">
                    {CustomIcon ? <CustomIcon className="w-6 h-6" style={{ color: theme.main }} /> : <Avatar color={theme.main} />}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">
                        <Editable value={nameDisplay} onChange={onEditLabel} readOnly={data.readOnly} />
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase font-medium">{roleDisplay}</div>
                </div>
            </div>
        </div>
    );

    const renderGlass = () => (
        <div className="w-[260px] p-[2px] rounded-2xl bg-gradient-to-br from-white/40 to-white/10 shadow-lg backdrop-blur-xl border border-white/20 group">
            <div className="bg-white/90 rounded-[14px] overflow-hidden">
                <div className="h-24 relative overflow-hidden flex items-center justify-center bg-slate-900">
                    <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{ backgroundColor: theme.main }}></div>
                    <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 shadow-inner">
                        {CustomIcon ? <CustomIcon className="w-8 h-8" style={{ color: theme.main }} /> : <Avatar color={theme.main} />}
                    </div>
                </div>
                <div className="p-4 text-center">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                        <Editable value={nameDisplay} onChange={onEditLabel} readOnly={data.readOnly} />
                    </h4>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mt-1" style={{ backgroundColor: theme.light, color: theme.main }}>
                        {roleDisplay}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col items-center group relative transition-all ${selected ? 'ring-4 ring-blue-500 rounded-2xl z-50' : ''}`}>
            <Handle type="source" position={Position.Top} id="t" className="!opacity-0 group-hover:!opacity-100 transition-opacity" />

            {template === 'classic' && renderClassic()}
            {template === 'modern' && renderModern()}
            {template === 'minimal' && renderMinimal()}
            {template === 'glass' && renderGlass()}

            {/* Collapse/Expand Pivot (Matches Reference Image style) */}
            <div className="w-full flex justify-center mt-[-1px] relative h-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-slate-300"></div>
                <div
                    className="mt-3 w-5 h-5 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-50 transition-colors z-20 group-hover:border-slate-400"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onToggleCollapse) data.onToggleCollapse(id);
                    }}
                >
                    <div className="w-2.5 h-[1.5px] bg-slate-500"></div>
                </div>
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="b"
                    className="!w-2 !h-2 !bottom-0 !opacity-0"
                    style={{ background: theme.main }}
                />
            </div>

            <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0 group-hover:!opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Right} id="r" className="!opacity-0 group-hover:!opacity-100" />
            <Handle type="source" position={Position.Left} id="l" className="!opacity-0 group-hover:!opacity-100" />

            {/* Expansion Badge (Floating) */}
            {data.hasChildren && data.isCollapsed && (
                <div
                    className="absolute -bottom-2 -right-2 w-6 h-6 text-white rounded-full flex items-center justify-center text-[11px] font-bold shadow-lg z-30 animate-bounce-in border-2 border-white"
                    style={{ backgroundColor: theme.main }}
                >
                    +
                </div>
            )}

            <SimpleAttachmentIcon data={data} color={theme.main} />
        </div>
    );
};
