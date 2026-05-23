import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid, User, Shield, Briefcase, Activity,
    FileText, CheckCircle, AlertCircle, Clock,
    XCircle, ChevronRight, FileEdit, FolderLock, Users,
    UserX, Building2, FolderSearch, Layers as LayersIcon, ArrowRight,
    Pin, PinOff, Eye, Edit3, Maximize2, X, List, Monitor,
    ChevronLeft, Link, ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api_service';
import NETWORK_URLS from '../../config/network_string';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/logic/user';
import EPCPreview from '../process_explorer/view_diagram';

export default function Dashboard({ onOpenCatalogue }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const isFeatureEnabled = useAuthStore((state) => state.isFeatureEnabled);
    const { theme } = useTheme();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI state
    const [activeQueue, setActiveQueue] = useState('my_drafts');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
    const [adminTab, setAdminTab] = useState('models');

    // ── Pinned Models State ──────────────────────────────────────────
    const [pinnedItems, setPinnedItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pinned_processes') || '[]'); }
        catch { return []; }
    });
    const [pinnedData, setPinnedData] = useState({});
    const [pinnedViewConfig, setPinnedViewConfig] = useState(() => {
        try {
            const s = localStorage.getItem('pinned_view_config');
            return s ? JSON.parse(s) : { displayMode: 'fullscreen', autoCenter: true, fullscreenDefault: false };
        } catch { return { displayMode: 'fullscreen', autoCenter: true, fullscreenDefault: false }; }
    });
    const pinnedViewMode = pinnedViewConfig.displayMode || 'fullscreen';

    // Modal state for Fullscreen canvas
    const [canvasModalIndex, setCanvasModalIndex] = useState(null); // index into pinnedItems

    // Split View state
    const [splitActiveIdx, setSplitActiveIdx] = useState(0);

    const togglePin = (id) => {
        setPinnedItems(prev => {
            const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
            localStorage.setItem('pinned_processes', JSON.stringify(next));
            window.dispatchEvent(new Event('pinned_processes_updated'));
            if (prev.includes(id)) setPinnedData(d => { const n = { ...d }; delete n[id]; return n; });
            return next;
        });
    };

    const openCanvas = (idx) => setCanvasModalIndex(idx);
    const closeCanvas = () => setCanvasModalIndex(null);

    const handlePinnedOpen = (proc, idx) => {
        if (pinnedViewMode === 'fullscreen') {
            openCanvas(idx);
        } else if (proc.status === 'Approved') {
            navigate(`/workspace?id=${proc._id}&tab=0`);
        } else {
            navigate(`/editor/${proc._id}`);
        }
    };

    const getPinStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { accent: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', glow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]' };
            case 'In Review': return { accent: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400', glow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.15)]' };
            case 'In Approval': return { accent: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400', glow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]' };
            default: return { accent: 'bg-theme-primary', badge: 'bg-theme-primary/10 text-theme-primary border-theme-primary/20', dot: 'bg-theme-primary', glow: 'hover:shadow-[0_0_24px_var(--theme-glow)]' };
        }
    };

    // Listen for pin + config changes
    useEffect(() => {
        const onPinsChanged = () => {
            try { setPinnedItems(JSON.parse(localStorage.getItem('pinned_processes') || '[]')); }
            catch { setPinnedItems([]); }
        };
        const onConfigChanged = () => {
            try {
                const s = localStorage.getItem('pinned_view_config');
                if (s) setPinnedViewConfig(JSON.parse(s));
            } catch { }
        };
        window.addEventListener('pinned_processes_updated', onPinsChanged);
        window.addEventListener('pinned_view_config_updated', onConfigChanged);
        return () => {
            window.removeEventListener('pinned_processes_updated', onPinsChanged);
            window.removeEventListener('pinned_view_config_updated', onConfigChanged);
        };
    }, []);

    // Fetch pinned process data
    useEffect(() => {
        if (pinnedItems.length === 0) return;
        let alive = true;
        (async () => {
            for (const id of pinnedItems) {
                if (pinnedData[id]) continue;
                try {
                    const res = await api.get(`${NETWORK_URLS.GetProcesses}${id}`);
                    if (alive && res.data) setPinnedData(prev => ({ ...prev, [id]: res.data }));
                } catch {
                    if (alive) setPinnedData(prev => ({ ...prev, [id]: { _error: true } }));
                }
            }
        })();
        return () => { alive = false; };
    }, [pinnedItems]);

    // ESC closes canvas modal
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') closeCanvas(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    const fetchDashboardSummary = async () => {
        try {
            setLoading(true);
            const res = await api.get(NETWORK_URLS.DashboardSummary);
            setSummary(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProcesses = useMemo(() => {
        if (!summary?.recent_processes) return [];
        let sortableItems = [...summary.recent_processes];

        if (searchQuery) {
            sortableItems = sortableItems.filter(p =>
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.status?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        sortableItems.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (!aVal) aVal = '';
            if (!bVal) bVal = '';

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortableItems;
    }, [summary, sortConfig, searchQuery]);

    const navigateToEditor = (id) => {
        navigate(`/editor/${id}`);
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-theme-primary/30 border-t-theme-primary rounded-full animate-spin" />
                    <p className="text-theme-secondary">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-theme-primary mb-2">Error Loading Dashboard</h3>
                    <p className="text-theme-secondary text-sm">{error}</p>
                    <button
                        onClick={fetchDashboardSummary}
                        className="mt-6 px-4 py-2 bg-theme-primary text-app-bg rounded-lg text-sm font-medium hover:opacity-90"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const { current_user, process_metrics, workflow_queues, role_config_metrics } = summary;
    const isAdmin = ['admin', 'superadmin', 'system_admin'].includes(current_user.role);

    return (
        <div className="h-full w-full overflow-y-auto bg-transparent custom-scrollbar p-6 space-y-6">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-theme-primary uppercase tracking-widest mb-1">Welcome back, {user?.name || 'User'}</p>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-theme-primary via-theme-primary to-theme-tertiary">
                        Command Center
                    </h1>
                    <div className="mt-2 h-px w-24 bg-gradient-to-r from-theme-primary to-transparent rounded-full" />
                </div>
            </div>

            {/* ── QUICK ACCESS STRIP — visible only when there are pins ── */}
            {pinnedItems.length > 0 && (
                <div className="space-y-3">
                    {/* Strip Header */}
                    <div className="flex items-center gap-2">
                        <Pin className="w-3.5 h-3.5 text-theme-primary" />
                        <span className="text-[10px] font-bold text-theme-tertiary uppercase tracking-widest">Quick Access</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary font-bold border border-theme-primary/20">{pinnedItems.length} pinned</span>
                        <div className="ml-auto flex items-center gap-1 bg-theme-input/50 p-0.5 rounded-lg border border-theme-border">
                            <button
                                onClick={() => {
                                    const newConfig = { ...pinnedViewConfig, displayMode: 'cards' };
                                    setPinnedViewConfig(newConfig);
                                    localStorage.setItem('pinned_view_config', JSON.stringify(newConfig));
                                }}
                                className={`p-1.5 rounded-md transition-all ${pinnedViewMode === 'cards' ? 'bg-theme-primary text-app-bg shadow-sm' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-primary/10'}`}
                                title="Cards View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    const newConfig = { ...pinnedViewConfig, displayMode: 'split' };
                                    setPinnedViewConfig(newConfig);
                                    localStorage.setItem('pinned_view_config', JSON.stringify(newConfig));
                                }}
                                className={`p-1.5 rounded-md transition-all ${pinnedViewMode === 'split' ? 'bg-theme-primary text-app-bg shadow-sm' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-primary/10'}`}
                                title="Split View"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    const newConfig = { ...pinnedViewConfig, displayMode: 'fullscreen' };
                                    setPinnedViewConfig(newConfig);
                                    localStorage.setItem('pinned_view_config', JSON.stringify(newConfig));
                                }}
                                className={`p-1.5 rounded-md transition-all ${pinnedViewMode === 'fullscreen' ? 'bg-theme-primary text-app-bg shadow-sm' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-primary/10'}`}
                                title="Fullscreen View"
                            >
                                <Monitor className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* ── SPLIT VIEW MODE (MASTER-DETAIL) ── */}
                    {pinnedViewMode === 'split' && pinnedItems.length > 0 && (
                        <div className="flex bg-app-surface border border-theme-border rounded-2xl overflow-hidden shadow-lg h-[550px]">
                            {/* Master List (Left Pane) */}
                            <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-theme-border flex flex-col bg-theme-bg/30">
                                <div className="px-4 py-3 border-b border-theme-border bg-theme-background/50 flex items-center gap-2">
                                    <LayersIcon className="w-4 h-4 text-theme-primary" />
                                    <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Pinned Processes</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {pinnedItems.map((id, idx) => {
                                        const proc = pinnedData[id];
                                        const style = proc ? getPinStatusStyle(proc.status) : {};
                                        const isActive = splitActiveIdx === idx;
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => setSplitActiveIdx(idx)}
                                                className={`group relative p-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-theme-primary/10 shadow-sm border border-theme-primary/20' : 'hover:bg-theme-input/50 border border-transparent'
                                                    }`}
                                            >
                                                {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-theme-primary rounded-r-full" />}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0 pl-1">
                                                        <h4 className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-theme-primary' : 'text-theme-primary group-hover:text-theme-primary/80'}`}>
                                                            {proc?.name || 'Loading...'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot || 'bg-theme-primary'}`} />
                                                            <span className="text-[10px] text-theme-tertiary truncate">{proc?.department_name || 'Org Wide'}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); togglePin(id); }}
                                                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isActive ? 'text-theme-primary hover:bg-theme-primary/20' : 'opacity-0 group-hover:opacity-100 text-theme-tertiary hover:bg-rose-500/10 hover:text-rose-400'}`}
                                                        title="Unpin"
                                                    >
                                                        <PinOff className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Detail Canvas (Right Pane) */}
                            <div className="flex-1 relative bg-app-surface flex flex-col">
                                {(() => {
                                    const activeId = pinnedItems[splitActiveIdx];
                                    if (!activeId) return null;
                                    const activeProc = pinnedData[activeId];

                                    return (
                                        <>
                                            {/* Canvas Header */}
                                            <div className="px-6 py-3 border-b border-theme-border flex items-center justify-between bg-theme-background/30 backdrop-blur-sm z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-theme-primary/10 rounded-lg">
                                                        <Monitor className="w-4 h-4 text-theme-primary" />
                                                    </div>
                                                    <span className="text-sm font-bold text-theme-primary">{activeProc?.name || 'Loading...'}</span>
                                                </div>
                                                {activeProc && !activeProc._error && (
                                                    <button
                                                        onClick={() => activeProc.status === 'Approved' ? navigate(`/workspace?id=${activeProc._id}&tab=0`) : navigate(`/editor/${activeProc._id}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-primary/10 hover:bg-theme-primary text-theme-primary hover:text-white rounded-lg text-xs font-bold transition-all border border-theme-primary/20"
                                                    >
                                                        {activeProc.status === 'Approved' ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                                                        {activeProc.status === 'Approved' ? 'Full View' : 'Editor'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Canvas Area */}
                                            <div className="flex-1 relative">
                                                {activeProc && !activeProc._error && activeProc._id ? (
                                                    <EPCPreview key={activeProc._id} model={activeProc} height="100%" className="!border-none !rounded-none !bg-transparent" showControls={true} showMiniMap={true} showExternalLink={false} />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                                                        <div className="w-8 h-8 border-2 border-theme-border border-t-indigo-500 rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ── FULLSCREEN CANVAS MODE ── Large inline canvases ── */}
                    {pinnedViewMode === 'fullscreen' && (
                        <div className="space-y-6">
                            {pinnedItems.map((id, idx) => {
                                const proc = pinnedData[id];
                                const style = proc ? getPinStatusStyle(proc.status) : {};
                                return (
                                    <div
                                        key={id}
                                        className={`relative bg-app-surface border border-theme-border rounded-2xl overflow-hidden shadow-lg flex flex-col h-[70vh] max-h-[800px] min-h-[500px] ${style.glow || ''}`}
                                    >
                                        {/* Header */}
                                        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-background/50 backdrop-blur-sm z-10 relative">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                                    <Monitor className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-theme-primary flex items-center gap-3">
                                                        {proc?.name || 'Loading...'}
                                                        {proc?.status && (
                                                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border ${style.badge || ''}`}>
                                                                {proc.status}
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-theme-tertiary mt-0.5">{proc?.department_name || 'Organization Wide'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePin(id); }}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-theme-tertiary hover:text-rose-500 transition-colors"
                                                    title="Unpin from Command Center"
                                                >
                                                    <PinOff className="w-4 h-4" />
                                                    <span className="text-xs font-bold hidden sm:block">Unpin</span>
                                                </button>
                                                {proc && !proc._error && (
                                                    <button
                                                        onClick={() => proc.status === 'Approved' ? navigate(`/workspace?id=${proc._id}&tab=0`) : navigate(`/editor/${proc._id}`)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20 transition-all"
                                                    >
                                                        {proc.status === 'Approved' ? <><Eye className="w-4 h-4" /> View Full</> : <><Edit3 className="w-4 h-4" /> Open Editor</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Canvas Area */}
                                        <div className="flex-1 relative bg-app-surface z-0">
                                            {proc && !proc._error && proc._id ? (
                                                <EPCPreview model={proc} height="100%" className="!border-none !rounded-none !bg-transparent" showControls={true} showMiniMap={true} showExternalLink={false} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-theme-background to-app-surface gap-4">
                                                    <div className="w-10 h-10 border-4 border-theme-border border-t-indigo-500 rounded-full animate-spin" />
                                                    <span className="text-sm font-bold text-theme-tertiary uppercase tracking-widest">Loading Diagram</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── CARDS MODE (default) ── */}
                    {(pinnedViewMode === 'cards' || !['split', 'fullscreen'].includes(pinnedViewMode)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pinnedItems.map((id, idx) => {
                                const proc = pinnedData[id];
                                if (!proc || proc._error) {
                                    return (
                                        <div key={id} className="bg-app-surface border border-theme-border rounded-xl p-4 opacity-50">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-3 w-3/4 bg-theme-border rounded animate-pulse" />
                                                    <div className="h-2.5 w-1/2 bg-theme-border rounded animate-pulse" />
                                                </div>
                                                <button onClick={e => { e.stopPropagation(); togglePin(id); }} className="p-1.5 rounded hover:bg-rose-500/10 text-theme-tertiary hover:text-rose-400 transition-colors ml-2" title="Remove">
                                                    <PinOff className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-rose-400 mt-3">Could not load — click × to remove</p>
                                        </div>
                                    );
                                }
                                if (!proc.name) {
                                    return (
                                        <div key={id} className="bg-app-surface border border-theme-border rounded-xl p-4">
                                            <div className="space-y-3">
                                                <div className="h-3 w-2/3 bg-theme-border rounded animate-pulse" />
                                                <div className="h-2.5 w-1/3 bg-theme-border rounded animate-pulse" />
                                            </div>
                                        </div>
                                    );
                                }
                                const style = getPinStatusStyle(proc.status);
                                return (
                                    <div
                                        key={id}
                                        onClick={() => handlePinnedOpen(proc, idx)}
                                        className={`group relative bg-app-surface border border-theme-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${style.glow}`}
                                    >
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${style.accent} rounded-t-xl`} />
                                        <div className="p-4 pt-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                    {proc.status || 'Draft'}
                                                </span>
                                                <button onClick={e => { e.stopPropagation(); togglePin(id); }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-theme-tertiary hover:text-rose-400 transition-all" title="Unpin">
                                                    <PinOff className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <h3 className="text-sm font-bold text-theme-primary group-hover:text-theme-primary transition-colors leading-snug line-clamp-2 mb-1.5">{proc.name}</h3>
                                            <p className="text-[11px] text-theme-tertiary flex items-center gap-1.5">
                                                {proc.department_name && <span>{proc.department_name}</span>}
                                                {proc.department_name && proc.process_level && <span className="opacity-40">·</span>}
                                                {proc.process_level && <span>L{proc.process_level}</span>}
                                                {!proc.department_name && !proc.process_level && <span className="italic opacity-50">No metadata</span>}
                                            </p>
                                        </div>
                                        <div className="px-4 pb-3 flex items-center justify-between border-t border-theme-border/50 pt-3">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-theme-secondary group-hover:text-theme-primary transition-colors">
                                                {proc.status === 'Approved' ? <><Eye className="w-3.5 h-3.5" /> View Canvas</> : <><Edit3 className="w-3.5 h-3.5" /> Open Editor</>}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-theme-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── FULLSCREEN CANVAS MODAL ── */}
            {canvasModalIndex !== null && (() => {
                const id = pinnedItems[canvasModalIndex];
                const proc = pinnedData[id];
                const style = proc ? getPinStatusStyle(proc.status) : {};
                const canGoBack = canvasModalIndex > 0;
                const canGoNext = canvasModalIndex < pinnedItems.length - 1;
                return (
                    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col" onClick={closeCanvas}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-theme-primary/20 rounded-xl border border-theme-primary/30">
                                    <Monitor className="w-5 h-5 text-theme-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white leading-tight">{proc?.name || 'Loading…'}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {proc?.status && (
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge || ''}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot || ''}`} />
                                                {proc.status}
                                            </span>
                                        )}
                                        {proc?.department_name && (
                                            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{proc.department_name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Prev / Next */}
                                <div className="flex items-center gap-1">
                                    <button disabled={!canGoBack} onClick={() => setCanvasModalIndex(i => i - 1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-xs text-white/40 font-mono px-2">{canvasModalIndex + 1} / {pinnedItems.length}</span>
                                    <button disabled={!canGoNext} onClick={() => setCanvasModalIndex(i => i + 1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                                {/* Open in editor/preview */}
                                {proc && (
                                    <button
                                        onClick={() => { closeCanvas(); proc.status === 'Approved' ? navigate(`/workspace?id=${proc._id}&tab=0`) : navigate(`/editor/${proc._id}`); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-theme-primary hover:bg-theme-primary/80 text-white rounded-xl text-sm font-bold shadow-lg shadow-theme-primary/30 transition-all"
                                    >
                                        {proc.status === 'Approved' ? <><Eye className="w-4 h-4" /> Full View</> : <><Edit3 className="w-4 h-4" /> Open Editor</>}
                                    </button>
                                )}
                                <button onClick={closeCanvas} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 transition-all" title="Close (ESC)">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 relative bg-app-surface" onClick={e => e.stopPropagation()}>
                            {proc && !proc._error && proc._id ? (
                                <EPCPreview key={proc._id} model={proc} height="100%" className="!border-none !rounded-none !bg-transparent" showControls={true} showMiniMap={true} showExternalLink={false} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-theme-tertiary">
                                    <div className="w-12 h-12 border-4 border-theme-border border-t-theme-primary rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Loading diagram…</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Processes Card - Replaces Active Role */}
                <div
                    onClick={onOpenCatalogue}
                    className="bg-app-surface border border-theme-border rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-theme-primary/50 hover:shadow-[0_0_24px_var(--theme-glow)] transition-all duration-300"
                >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-theme-primary to-theme-primary/0 rounded-t-xl" />
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-theme-primary/10 rounded-full blur-2xl group-hover:bg-theme-primary/20 transition-colors" />
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-1">Total Processes</p>
                            <h3 className="text-3xl font-bold text-theme-primary mt-2">
                                {process_metrics.total_org_processes || process_metrics.total || 0}
                            </h3>
                        </div>
                        <div className="p-3 bg-theme-primary/10 rounded-xl group-hover:scale-110 transition-transform border border-theme-primary/20">
                            <FileText className="w-5 h-5 text-theme-primary" />
                        </div>
                    </div>
                    <div className="mt-4 relative z-10 flex items-center gap-1.5 text-xs text-theme-primary font-semibold">
                        <span>Open Catalogue</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>



                {/* Action Items — only show when governance (workflow) is enabled */}
                {isFeatureEnabled('governance') && (
                    <div className="bg-app-surface border border-theme-border rounded-xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-500/0 rounded-t-xl" />
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-1">Pending Actions</p>
                                <h3 className="text-3xl font-bold text-theme-primary mt-2">
                                    {workflow_queues.pending_my_review.length + workflow_queues.pending_my_final_approval.length}
                                </h3>
                                <div className="mt-3 space-y-1">
                                    <p className="text-xs text-theme-secondary">Reviews: <span className="text-theme-primary font-semibold">{workflow_queues.pending_my_review.length}</span></p>
                                    <p className="text-xs text-theme-secondary">Approvals: <span className="text-theme-primary font-semibold">{workflow_queues.pending_my_final_approval.length}</span></p>
                                </div>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <Activity className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Drafts & Rejections — only show when governance (workflow) is enabled */}
                {isFeatureEnabled('governance') && (
                    <div className="bg-app-surface border border-theme-border rounded-xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-rose-500/0 rounded-t-xl" />
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-1">My Work In Progress</p>
                                <h3 className="text-3xl font-bold text-theme-primary mt-2">
                                    {workflow_queues.my_drafts.length + workflow_queues.rejected_back_to_me.length}
                                </h3>
                                <div className="mt-3 space-y-1">
                                    <p className="text-xs text-theme-secondary">Drafts: <span className="text-theme-primary font-semibold">{workflow_queues.my_drafts.length}</span></p>
                                    <p className="text-xs text-rose-400">Needs Revision: <span className="font-semibold">{workflow_queues.rejected_back_to_me.length}</span></p>
                                </div>
                            </div>
                            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <FileEdit className="w-5 h-5 text-rose-400" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Config Health (Only for Admins) */}
            {isAdmin && role_config_metrics && (() => {
                const issues = [];

                if (role_config_metrics.unassigned_users > 0)
                    issues.push({
                        key: 'unassigned_users',
                        severity: 'critical',
                        icon: UserX,
                        label: 'Unassigned Users',
                        count: role_config_metrics.unassigned_users,
                        description: `${role_config_metrics.unassigned_users} user${role_config_metrics.unassigned_users > 1 ? 's have' : ' has'} no role assigned and cannot access any processes.`,
                        action: 'Manage Users',
                        link: '/admin'
                    });

                if (role_config_metrics.depts_without_coverage > 0)
                    issues.push({
                        key: 'uncovered_depts',
                        severity: 'warning',
                        icon: Building2,
                        label: 'Uncovered Departments',
                        count: role_config_metrics.depts_without_coverage,
                        description: `${role_config_metrics.depts_without_coverage} department${role_config_metrics.depts_without_coverage > 1 ? 's are' : ' is'} not included in any role scope — only admins can see them.`,
                        action: 'Manage Roles',
                        link: '/admin'
                    });

                if (role_config_metrics.processes_missing_dept > 0)
                    issues.push({
                        key: 'missing_dept',
                        severity: 'warning',
                        icon: FolderSearch,
                        label: 'Processes Without Department',
                        count: role_config_metrics.processes_missing_dept,
                        description: `${role_config_metrics.processes_missing_dept} process${role_config_metrics.processes_missing_dept > 1 ? 'es bypass' : ' bypasses'} role-based access filtering due to missing department.`,
                        action: 'View Catalogue',
                        onClick: 'catalogue'
                    });

                if (role_config_metrics.processes_missing_level > 0)
                    issues.push({
                        key: 'missing_level',
                        severity: 'info',
                        icon: LayersIcon,
                        label: 'Processes Without Level',
                        count: role_config_metrics.processes_missing_level,
                        description: `${role_config_metrics.processes_missing_level} process${role_config_metrics.processes_missing_level > 1 ? 'es are' : ' is'} missing a process level — level-based filtering won't apply.`,
                        action: 'View Catalogue',
                        onClick: 'catalogue'
                    });

                if (role_config_metrics.empty_scope_roles > 0)
                    issues.push({
                        key: 'empty_scopes',
                        severity: 'warning',
                        icon: Shield,
                        label: 'Roles With Empty Scope',
                        count: role_config_metrics.empty_scope_roles,
                        description: `${role_config_metrics.empty_scope_roles} scoped role${role_config_metrics.empty_scope_roles > 1 ? 's have' : ' has'} no departments or levels configured.`,
                        action: 'Manage Roles',
                        link: '/admin'
                    });

                const severityOrder = { critical: 0, warning: 1, info: 2 };
                issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

                const severityStyle = {
                    critical: { border: 'border-rose-500/40', bg: 'bg-rose-500/5', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: 'text-rose-400', btn: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20' },
                    warning: { border: 'border-amber-500/40', bg: 'bg-amber-500/5', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'text-amber-400', btn: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20' },
                    info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'text-blue-400', btn: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20' },
                };

                return (
                    <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-indigo-500" />
                                <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider">Configuration Health</h2>
                            </div>
                            {issues.length === 0 ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5" /> All Clear
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                                    <AlertCircle className="w-3.5 h-3.5" /> {issues.length} Issue{issues.length > 1 ? 's' : ''} Found
                                </span>
                            )}
                        </div>

                        {issues.length === 0 ? (
                            <div className="flex items-center gap-4 px-5 py-6 text-emerald-400">
                                <CheckCircle className="w-8 h-8 opacity-60" />
                                <div>
                                    <p className="font-semibold">Everything looks good!</p>
                                    <p className="text-xs text-theme-tertiary mt-0.5">All users have roles, all departments are covered, and all processes have metadata.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-theme-border">
                                {issues.map(issue => {
                                    const style = severityStyle[issue.severity];
                                    const Icon = issue.icon;
                                    return (
                                        <div key={issue.key} className={`flex items-center gap-4 px-5 py-4 ${style.bg} transition-colors`}>
                                            <div className={`p-2.5 rounded-xl border ${style.border} ${style.bg} flex-shrink-0`}>
                                                <Icon className={`w-5 h-5 ${style.icon}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-theme-primary">{issue.label}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>{issue.count}</span>
                                                </div>
                                                <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">{issue.description}</p>
                                            </div>
                                            {issue.link ? (
                                                <a href={issue.link} className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${style.btn}`}>
                                                    {issue.action} <ArrowRight className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <button onClick={onOpenCatalogue} className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${style.btn}`}>
                                                    {issue.action} <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* My Process Work Queues — gated behind 'governance' (workflow module) */}
            {isFeatureEnabled('governance') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Area: My Process Work Queues */}
                    <div className="lg:col-span-2 bg-app-surface border border-theme-border rounded-xl overflow-hidden flex flex-col h-[500px]">
                        <div className="p-5 border-b border-theme-border">
                            <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-theme-primary" />
                                My Process Work
                            </h2>
                        </div>

                        <div className="flex border-b border-theme-border overflow-x-auto hide-scrollbar">
                            {[
                                { id: 'my_drafts', label: 'Drafts', count: workflow_queues.my_drafts.length, icon: FileEdit, activeColor: 'border-indigo-500 text-indigo-400', badgeColor: 'bg-indigo-500/10 text-indigo-400', desc: 'Processes you created but have not submitted for review yet' },
                                { id: 'rejected_back_to_me', label: 'Needs Revision', count: workflow_queues.rejected_back_to_me.length, icon: XCircle, activeColor: 'border-rose-500 text-rose-400', badgeColor: 'bg-rose-500/10 text-rose-400', desc: 'Processes you submitted that were returned for fixes' },
                                { id: 'pending_my_review', label: 'To Review', count: workflow_queues.pending_my_review.length, icon: Clock, activeColor: 'border-amber-500 text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-400', desc: 'Processes waiting for your technical review' },
                                { id: 'pending_my_final_approval', label: 'To Approve', count: workflow_queues.pending_my_final_approval.length, icon: Shield, activeColor: 'border-emerald-500 text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-400', desc: 'Processes waiting for your final managerial sign-off' },
                                { id: 'submitted_by_me', label: 'Waiting', count: workflow_queues.submitted_by_me.length, icon: Activity, activeColor: 'border-blue-500 text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-400', desc: 'Processes you submitted that are currently being reviewed by others' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveQueue(tab.id)}
                                    title={tab.desc}
                                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all duration-200 ${activeQueue === tab.id
                                            ? `${tab.activeColor} bg-theme-primary/5`
                                            : 'border-transparent text-theme-secondary hover:text-theme-primary hover:bg-theme-input'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${activeQueue === tab.id ? tab.badgeColor : 'bg-theme-border text-theme-tertiary'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                            {workflow_queues[activeQueue].length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3 text-theme-tertiary">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
                                        <CheckCircle className="w-7 h-7 text-indigo-400/30" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-theme-secondary">All clear</p>
                                        <p className="text-xs text-theme-tertiary mt-0.5">Nothing in this queue right now</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {workflow_queues[activeQueue].map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => navigateToEditor(item.id)}
                                            className="group flex items-center justify-between p-3 rounded-lg hover:bg-theme-input cursor-pointer border-l-2 border-l-transparent hover:border-l-indigo-500 border border-transparent hover:border-theme-border transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-theme-primary/5 border border-theme-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-theme-primary/10 transition-colors">
                                                    <FileText className="w-4 h-4 text-theme-primary/60 group-hover:text-theme-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-theme-primary group-hover:text-theme-primary transition-colors">{item.name}</h4>
                                                    <p className="text-[11px] text-theme-tertiary mt-0.5">
                                                        {new Date(item.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-theme-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Area: Role Access Info & Recently Approved */}
                    <div className="space-y-6">
                        <div className="bg-app-surface border border-theme-border rounded-xl p-5">
                            <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Your Access Context
                            </h2>
                            {current_user.is_global ? (
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-sm font-medium text-emerald-400">Organization-wide Access</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-theme-tertiary mb-1.5">Departments</p>
                                        <div className="flex flex-wrap gap-1">
                                            {current_user.allowed_departments.length === 0 ? (
                                                <span className="px-2 py-1 text-xs rounded-md bg-theme-input text-theme-secondary">All Departments</span>
                                            ) : (
                                                current_user.allowed_departments.map(d => (
                                                    <span key={d.id} className="px-2 py-1 text-[10px] uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        {d.name}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-theme-tertiary mb-1.5">Levels</p>
                                        <div className="flex flex-wrap gap-1">
                                            {current_user.allowed_levels.length === 0 ? (
                                                <span className="px-2 py-1 text-xs rounded-md bg-theme-input text-theme-secondary">All Levels</span>
                                            ) : (
                                                current_user.allowed_levels.map(l => (
                                                    <span key={l} className="px-2 py-1 text-xs rounded-md bg-theme-surface text-theme-primary border border-theme-border">
                                                        L{l}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-app-surface border border-theme-border rounded-xl p-5">
                            <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Recently Approved
                            </h2>
                            {workflow_queues.recently_approved.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-5 gap-2 text-theme-tertiary">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-emerald-400/30" />
                                    </div>
                                    <p className="text-xs text-theme-tertiary">No recently approved models</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {workflow_queues.recently_approved.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => navigate(`/workspace?id=${item.id}&tab=0`)}
                                            className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-theme-input cursor-pointer border-l-2 border-l-emerald-500/40 hover:border-l-emerald-500 border border-transparent hover:border-theme-border transition-all duration-200"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-theme-primary group-hover:text-emerald-400 transition-colors truncate">{item.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">v{item.version || '1.0'}</span>
                                                    <span className="text-[10px] text-theme-tertiary">{new Date(item.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-theme-tertiary opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )} {/* end governance gate */}

            {/* Process Overview Table - Admin Only */}
            {isAdmin && <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setAdminTab('models')}
                            className={`text-lg font-bold flex items-center gap-2 pb-1 ${adminTab === 'models' ? 'text-theme-primary border-b-2 border-indigo-500' : 'text-theme-tertiary hover:text-theme-secondary'}`}
                        >
                            <Activity className={`w-5 h-5 ${adminTab === 'models' ? 'text-indigo-500' : ''}`} />
                            All Accessible Models
                        </button>
                        <button
                            onClick={() => setAdminTab('documents')}
                            className={`text-lg font-bold flex items-center gap-2 pb-1 ${adminTab === 'documents' ? 'text-theme-primary border-b-2 border-indigo-500' : 'text-theme-tertiary hover:text-theme-secondary'}`}
                        >
                            <FileText className={`w-5 h-5 ${adminTab === 'documents' ? 'text-indigo-500' : ''}`} />
                            Documents
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary text-xs">{summary?.documents?.length || 0}</span>
                        </button>
                    </div>
                    {adminTab === 'models' && (
                        <input
                            type="text"
                            placeholder="Search models..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 bg-theme-input border border-theme-border rounded-lg text-sm text-theme-primary focus:outline-none focus:border-indigo-500 w-full md:w-64"
                        />
                    )}
                </div>

                    {adminTab === 'models' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-theme-input text-theme-tertiary text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium cursor-pointer" onClick={() => handleSort('name')}>
                                            Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 font-medium cursor-pointer" onClick={() => handleSort('status')}>
                                            Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 font-medium">Department</th>
                                        <th className="px-6 py-4 font-medium">Level</th>
                                        <th className="px-6 py-4 font-medium cursor-pointer" onClick={() => handleSort('updated_at')}>
                                            Updated {sortConfig.key === 'updated_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme-border">
                                    {sortedProcesses.map(item => (
                                        <tr key={item.id} className="hover:bg-theme-input/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-theme-primary">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs rounded-full border ${item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        item.status === 'In Review' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            item.status === 'In Approval' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                'bg-theme-surface text-theme-secondary border-theme-border'
                                                    }`}>
                                                    {item.status || 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-theme-secondary">{item.department_name || item.department_id || '-'}</td>
                                            <td className="px-6 py-4 text-theme-secondary">{item.process_level ? `L${item.process_level}` : '-'}</td>
                                            <td className="px-6 py-4 text-theme-tertiary">{new Date(item.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        if (item.status === 'Approved') {
                                                            navigate(`/workspace?id=${item.id}&tab=0`);
                                                        } else {
                                                            navigateToEditor(item.id);
                                                        }
                                                    }}
                                                    className="text-theme-primary hover:text-theme-primary/80 font-medium"
                                                >
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedProcesses.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-theme-tertiary">
                                                No models found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {adminTab === 'documents' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-theme-input text-theme-tertiary text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Document Name</th>
                                        <th className="px-6 py-4 font-medium">Source Process</th>
                                        <th className="px-6 py-4 font-medium">Attached To</th>
                                        <th className="px-6 py-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme-border">
                                    {summary?.documents?.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-theme-input/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-theme-primary">
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 hover:underline">
                                                    <Link size={14} /> {doc.name}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => navigateToEditor(doc.process_id)} className="text-theme-primary hover:text-indigo-400 font-medium text-left underline decoration-dotted underline-offset-2">
                                                    {doc.process_name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] bg-theme-surface px-2 py-0.5 rounded text-theme-tertiary border border-theme-border uppercase font-bold tracking-wider">
                                                    {doc.source}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-theme-primary bg-theme-surface border border-theme-border hover:bg-theme-input transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" /> View
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!summary?.documents || summary.documents.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-theme-tertiary">
                                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                No documents found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>}
        </div>
    );
}
