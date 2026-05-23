import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layout, Database, Activity, RefreshCw, BarChart3,
    Clock, Layers, Plus, FileText, ChevronDown, CheckCircle2,
    ArrowLeft, Send, Search, Filter, Maximize2, MoreHorizontal,
    Sparkles, Upload, FileUp, MoreVertical, Paperclip, ChevronRight,
    Zap, AlertTriangle, Lightbulb, Settings, Moon, Sun, PenLine,
    Download, FileDown, Image, Film, Calendar, Target, ShieldCheck, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

import UploadLogs from './UploadLogs';
import MainLayout from '../../layouts/MainLayout';
import { apiGet } from '../../services/api_service.jsx';
import { runConformanceCheck } from '../../services/miningService';
import ProcessMapGraph from './ProcessMapGraph';
import MiningAIInsights from './MiningAIInsights';
import MiningChat from './MiningChat';
import { useTheme } from '../../contexts/ThemeContext';
import {
    uploadLogs,
    generateMiningInsights,
    fetchMiningAnalysis,
    generateMiningAnalysis,
    updateMiningMap
} from '../../services/miningService';

// ── Dashboard Components ──────────────────────────────────────────────────

const KPIBox = ({ label, value, unit }) => (
    <div className="p-5 border rounded-2xl shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>{label}</h4>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
            {unit && <span className="text-[10px] font-black uppercase tracking-tighter opacity-40" style={{ color: 'var(--text-primary)' }}>{unit}</span>}
        </div>
    </div>
);

const ChartBar = ({ label, value, colorClass, percentage }) => (
    <div className="flex flex-col gap-2 w-full group">
        <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>{label}</span>
            <span className="text-[10px] font-bold opacity-80" style={{ color: 'var(--text-primary)' }}>{percentage}%</span>
        </div>
        <div className="flex-1 h-6 rounded-lg overflow-hidden relative border shadow-inner" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-glass)' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`h-full ${colorClass} shadow-[0_0_15px_rgba(99,102,241,0.2)]`}
            />
        </div>
    </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function MiningCanvas() {
    const { id: processId } = useParams();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const graphRef = useRef(null);

    // Data States
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [viewMode, setViewMode] = useState('performance'); // 'frequency' or 'performance'
    const [isEditingMap, setIsEditingMap] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' or 'log'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [direction, setDirection] = useState('LR');

    // Conformance States
    const [conformanceResult, setConformanceResult] = useState(null);
    const [approvedProcesses, setApprovedProcesses] = useState([]);
    const [selectedApprovedId, setSelectedApprovedId] = useState('');
    const [runningConformance, setRunningConformance] = useState(false);

    // Status Log State (The left-hand system log)
    const [logs, setLogs] = useState([
        { id: '1', from: 'System', text: 'Welcome. Awaiting log file upload to begin process mining.', status: 'info' }
    ]);

    const fileInputRef = useRef(null);

    const fetchAnalysisData = useCallback(async (isSilently = false) => {
        if (!isSilently) setLoading(true);
        try {
            const { data } = await fetchMiningAnalysis(processId);
            if (data && data.kpis) {
                setAnalysis(data);
                setLogs(prev => [...prev, { id: Date.now().toString(), from: 'System', text: 'Fetched persisted analysis data.', status: 'success' }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [processId]);

    useEffect(() => {
        fetchAnalysisData();
    }, [fetchAnalysisData]);

    // Auto-apply filter when both dates are provided
    useEffect(() => {
        if (startDate && endDate) {
            handleGenerate(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    const handleGenerate = async (useFilters = false) => {
        setGenerating(true);
        const logId = `gen-${Date.now()}`;
        setLogs(prev => [...prev, { id: logId, from: 'System', text: useFilters === true ? 'Computing filtered process map...' : 'Computing process map...', status: 'loading' }]);
        try {
            const filters = useFilters === true ? { start_date: startDate || undefined, end_date: endDate || undefined } : {};
            const { data } = await generateMiningAnalysis(processId, filters);
            
            setAnalysis(data);
            setLogs(prev => [...prev.filter(l => l.id !== logId), { id: `success-${Date.now()}`, from: 'System', text: 'Process map generated successfully.', status: 'success' }]);
            
            if (useFilters) {
                toast.success("Filters applied successfully!");
            } else {
                toast.success("Analysis complete!");
            }
        } catch (err) {
            const msg = err.response?.data?.error || "Analysis failed";
            // If it's a 404 meaning no events for the filter, it's not a 'failure' per se
            if (err.response?.status === 404) {
                 toast.info("No events found for this date range.");
            } else {
                 toast.error(msg);
            }
            // Ensure we clear the loading log
            setLogs(prev => prev.filter(l => l.id !== logId));
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateInsights = async () => {
        if (!analysis) {
            toast.info("Generate the process map first!");
            return;
        }
        setGenerating(true);
        try {
            const { data } = await generateMiningInsights(processId);
            setAnalysis(prev => ({ ...prev, insights: data.insights }));
            toast.success("AI insights ready.");
        } catch (err) {
            toast.error("Failed to generate AI insights");
        } finally {
            setGenerating(false);
        }
    };

    const fetchApprovedProcesses = async () => {
        try {
            const { data } = await apiGet('/processes/'); // Generic way to get all
            const approved = data.filter(p => p.type === 'file' && p.status === 'Approved');
            setApprovedProcesses(approved);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchApprovedProcesses();
    }, []);

    const handleRunConformance = () => {
        if (!selectedApprovedId) return;
        // Navigation with both IDs in the URL for persistence
        navigate(`/mining/conformance/${processId}/${selectedApprovedId}`);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogs(prev => [...prev, { id: `user-log-${Date.now()}`, from: 'User', text: `Attempting upload of ${file.name}` }]);
        try {
            const text = await file.text();
            let events;
            if (file.name.endsWith('.csv')) {
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                events = lines.slice(1).filter(l => l.trim()).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    return headers.reduce((obj, header, i) => {
                        obj[header] = values[i];
                        return obj;
                    }, {});
                });
            } else {
                events = JSON.parse(text);
            }
            const sysUplId = `sys-upl-${Date.now()}`;
            setLogs(prev => [...prev, { id: sysUplId, from: 'System', text: 'Uploading and parsing data...', status: 'loading' }]);
            const { data } = await uploadLogs(processId, Array.isArray(events) ? events : [events]);
            setLogs(prev => [...prev.filter(l => l.id !== sysUplId), { id: `done-upl-${Date.now()}`, from: 'System', text: 'Logs parsed successfully!', status: 'success' }]);
            await handleGenerate();
        } catch (err) {
            setLogs(prev => [...prev, { id: `err-upl-${Date.now()}`, from: 'System', text: `Error: ${err.message}`, status: 'error' }]);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <MainLayout showSidebar={false} showHeader={false}>
            <div className="flex h-screen overflow-hidden font-sans transition-colors duration-500"
                style={{ color: 'var(--text-primary)' }}>

                {/* ── Left Sidebar: Interactive AI & Data ─────────────── */}
                <aside className="w-[380px] border-r flex flex-col z-50 overflow-hidden backdrop-blur-3xl shrink-0"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>

                    {/* Sidebar Header */}
                    <div className="p-5 border-b flex items-center justify-between h-[70px] shrink-0" style={{ borderColor: 'var(--border-glass)' }}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/workspace?id=${processId}`)}
                                className="p-2 -ml-1 text-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/15 rounded-lg transition-all border border-indigo-500/20"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div>
                                <h2 className="text-base font-black tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>Process Mining</h2>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Live Intelligence</span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Tabs - Higher Position for Visibility */}
                    <div className="px-5 pt-5 pb-2 shrink-0">
                        <div className="flex p-1.5 border rounded-2xl shadow-inner w-full" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-glass)' }}>
                            <button
                                onClick={() => setSidebarTab('chat')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${sidebarTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95' : 'text-slate-500 hover:text-indigo-400'}`}
                            >
                                <Sparkles size={13} className={sidebarTab === 'chat' ? 'animate-pulse' : ''} />
                                AI Analyst
                            </button>
                            <button
                                onClick={() => setSidebarTab('log')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${sidebarTab === 'log' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95' : 'text-slate-500 hover:text-indigo-400'}`}
                            >
                                <Database size={13} />
                                Data
                            </button>
                            <button
                                onClick={() => setSidebarTab('conformance')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${sidebarTab === 'conformance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95' : 'text-slate-500 hover:text-indigo-400'}`}
                            >
                                <CheckCircle2 size={13} />
                                Check
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Content Area */}
                    <div className="flex-1 min-h-0 flex flex-col p-5 pt-2 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {sidebarTab === 'chat' ? (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="flex-1 min-h-0">
                                        <MiningChat processId={processId} />
                                    </div>
                                </motion.div>
                            ) : sidebarTab === 'conformance' ? (
                                <motion.div
                                    key="conformance"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="h-full flex flex-col space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Run Comparison</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <select 
                                                value={selectedApprovedId}
                                                onChange={(e) => setSelectedApprovedId(e.target.value)}
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500"
                                            >
                                                <option value="">Select Reference Model...</option>
                                                {approvedProcesses.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <div className="p-4 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 text-center">
                                                <div className="p-3 bg-indigo-600/10 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                                                   <ShieldCheck size={20} className="text-indigo-400" />
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400 mb-4 px-2">
                                                   Comparing your discovered process against the approved model will open the complete Audit & Intelligence center.
                                                </p>
                                                <button
                                                    onClick={handleRunConformance}
                                                    disabled={!selectedApprovedId}
                                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 active:scale-95"
                                                >
                                                    Start Global Audit <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="data"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="h-full flex flex-col space-y-8 overflow-y-auto custom-scrollbar pr-1"
                                >
                                    {/* Data Ingestion Section */}
                                    <div className="space-y-4 shrink-0">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ingest Data</h3>
                                        </div>
                                        <UploadLogs
                                            processId={processId}
                                            compact={true}
                                            onUploaded={() => {
                                                setLogs(prev => [...prev, { id: `upl-${Date.now()}`, from: 'System', text: 'Data ingested successfully.', status: 'success' }]);
                                                handleGenerate();
                                            }}
                                        />
                                    </div>

                                    {/* System History Logs */}
                                    <div className="flex-1 flex flex-col space-y-4 min-h-0">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Activity System</h3>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            {logs.length === 0 ? (
                                                <div className="p-8 text-center border-2 border-dashed border-slate-500/10 rounded-3xl opacity-30">
                                                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">No recent operations</p>
                                                </div>
                                            ) : (
                                                logs.map(log => (
                                                    <div key={log.id} className="flex gap-4 group p-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all">
                                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 shadow-sm ${log.status === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : log.status === 'error' ? 'bg-rose-500 shadow-rose-500/20' : log.status === 'loading' ? 'bg-indigo-500 animate-pulse shadow-indigo-500/20' : 'bg-slate-300'}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{log.from}</p>
                                                                <span className="text-[8px] opacity-30 font-bold">JUST NOW</span>
                                                            </div>
                                                            <p className="text-xs font-medium leading-relaxed opacity-80" style={{ color: 'var(--text-primary)' }}>{log.text}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* ── Main Activity Area ────────────────────────── */}
                <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8 space-y-6">

                    {/* Top Row: Visualization Card */}
                    <section className="border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[450px] shrink-0"
                        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
                        <header className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-glass)' }}>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <h3 className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isEditingMap ? 'text-amber-500' : 'opacity-60'}`}
                                        style={{ color: isEditingMap ? undefined : 'var(--text-secondary)' }}>
                                        {isEditingMap ? 'Editor Mode' : 'Visualization Engine'}
                                    </h3>
                                    <span className="text-sm font-black tracking-tight mt-0.5"
                                        style={{ color: 'var(--text-primary)' }}>
                                        {isEditingMap ? 'Syncing Node Positions...' : 'Process Map Graph'}
                                    </span>
                                </div>

                                <div className="h-8 w-px mx-2" style={{ backgroundColor: 'var(--border-glass)' }} />

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => graphRef.current?.exportPng()}
                                        className="h-9 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20"
                                        title="Download PNG"
                                        disabled={isEditingMap}
                                    >
                                        <Image size={14} /> PNG
                                    </button>
                                    <button
                                        onClick={() => graphRef.current?.exportPdf()}
                                        className="h-9 px-4 rounded-xl bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-rose-500/20"
                                        title="Download PDF"
                                        disabled={isEditingMap}
                                    >
                                        <FileDown size={14} /> PDF
                                    </button>
                                    <button 
                                        onClick={() => graphRef.current?.exportGif()}
                                        className="h-9 px-4 rounded-xl bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-violet-500/20"
                                        title="Download GIF"
                                        disabled={isEditingMap}
                                    >
                                        <Film size={14} /> GIF
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2.5 rounded-xl transition-all border hover:scale-105 active:scale-95"
                                    style={{
                                        backgroundColor: 'var(--bg-app)',
                                        borderColor: 'var(--border-glass)',
                                        color: 'var(--text-secondary)'
                                    }}
                                    title="Toggle Theme"
                                >
                                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                                </button>

                                <div className="h-8 w-px mx-1" style={{ backgroundColor: 'var(--border-glass)' }} />

                                {isEditingMap ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsEditingMap(false)}
                                            className="px-5 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border active:scale-95"
                                            style={{
                                                backgroundColor: 'var(--bg-app)',
                                                borderColor: 'var(--border-glass)',
                                                color: 'var(--text-secondary)'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (graphRef.current) {
                                                    const { nodes, edges } = graphRef.current.getData();
                                                    const newProcessMap = {
                                                        ...analysis.process_map,
                                                        nodes: nodes.map(n => ({
                                                            id: n.id,
                                                            label: n.data.label,
                                                            position: n.position
                                                        })),
                                                        edges: edges.map(e => ({
                                                            id: e.id,
                                                            from: e.source,
                                                            to: e.target,
                                                            count: parseInt(e.label?.split(' / ')[0]) || 0,
                                                            performance: e.label?.split(' / ')[1] || ""
                                                        }))
                                                    };
                                                    updateMiningMap(processId, newProcessMap)
                                                        .catch(err => console.error("Failed to persist map:", err));
                                                    setAnalysis(prev => ({ ...prev, process_map: newProcessMap }));
                                                }
                                                setIsEditingMap(false);
                                            }}
                                            className="px-5 h-9 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {/* Date Filter */}
                                        <div className="flex items-center gap-2 border pr-1.5 pl-3 py-1 rounded-xl shadow-inner mr-2 bg-slate-800/20" style={{ borderColor: 'var(--border-glass)' }}>
                                            <div className="flex items-center px-1">
                                                <Calendar size={13} className="text-indigo-500 mr-2 opacity-70" />
                                                <input 
                                                    type="date" 
                                                    value={startDate} 
                                                    onChange={e => setStartDate(e.target.value)}
                                                    className="bg-transparent text-[10px] font-black uppercase outline-none w-[100px]"
                                                    style={{ color: 'var(--text-primary)', colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                                                    title="Start Date"
                                                />
                                                <span className="text-[9px] font-black opacity-40 mx-2" style={{ color: 'var(--text-secondary)' }}>TO</span>
                                                <input 
                                                    type="date" 
                                                    value={endDate} 
                                                    onChange={e => setEndDate(e.target.value)}
                                                    className="bg-transparent text-[10px] font-black uppercase outline-none w-[100px]"
                                                    style={{ color: 'var(--text-primary)', colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                                                    title="End Date"
                                                />
                                            </div>
                                            {(startDate || endDate) && (
                                                <button 
                                                    onClick={() => {
                                                        setStartDate('');
                                                        setEndDate('');
                                                        handleGenerate(false);
                                                    }}
                                                    className="ml-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 active:scale-95"
                                                    title="Reset Date Filter"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setIsEditingMap(true)}
                                            className="p-2.5 rounded-xl transition-all border group active:scale-95"
                                            style={{
                                                backgroundColor: 'var(--bg-app)',
                                                borderColor: 'var(--border-glass)',
                                                color: 'var(--text-secondary)'
                                            }}
                                            title="Edit Map"
                                        >
                                            <PenLine size={15} className="group-hover:rotate-12 transition-transform" />
                                        </button>
                                        <div className="flex border p-1 rounded-xl shadow-inner mr-2" style={{ backgroundColor: 'rgba(var(--bg-rgb), 0.5)', borderColor: 'var(--border-glass)' }}>
                                            <button
                                                onClick={() => setDirection('LR')}
                                                className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${direction === 'LR' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-400'}`}
                                                title="Horizontal View"
                                            >
                                                Horizontal
                                            </button>
                                            <button
                                                onClick={() => setDirection('TB')}
                                                className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${direction === 'TB' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-400'}`}
                                                title="Vertical View"
                                            >
                                                Vertical
                                            </button>
                                        </div>

                                        <div className="flex border p-1 rounded-xl shadow-inner" style={{ backgroundColor: 'rgba(var(--bg-rgb), 0.5)', borderColor: 'var(--border-glass)' }}>
                                            <button
                                                onClick={() => setViewMode('frequency')}
                                                className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'frequency' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-400'}`}
                                            >
                                                Frequency
                                            </button>
                                            <button
                                                onClick={() => setViewMode('performance')}
                                                className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'performance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-400'}`}
                                            >
                                                Performance
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </header>
                        <div className="flex-1 min-h-0 relative">
                            <div className="h-full bg-black/20 rounded-2xl border" style={{ borderColor: 'var(--border-glass)' }}>
                                <ProcessMapGraph 
                                    nodes={analysis?.process_map?.nodes} 
                                    edges={analysis?.process_map?.edges} 
                                    viewMode={viewMode}
                                    conformanceData={null}
                                    ref={graphRef}
                                    height="100%"
                                    direction={direction}
                                    isEditable={isEditingMap}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Middle Row: KPI Row */}
                    <section className="grid grid-cols-4 gap-6 shrink-0">
                        <KPIBox
                            label="Total Cases"
                            value={analysis?.kpis.total_cases?.toLocaleString() || '0'}
                        />
                        <KPIBox
                            label="Avg Throughput Time"
                            value={analysis?.kpis.avg_duration_minutes > 1440
                                ? (analysis.kpis.avg_duration_minutes / 1440).toFixed(1)
                                : (analysis?.kpis.avg_duration_minutes / 60 || 0).toFixed(1)}
                            unit={analysis?.kpis.avg_duration_minutes > 1440 ? "days" : "hours"}
                        />
                        <KPIBox
                            label="Total Variants"
                            value={analysis?.variants?.length?.toString() || '0'}
                        />
                        <div className="border rounded-2xl flex flex-col justify-center p-5 relative overflow-hidden group"
                            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>Primary Bottleneck</h4>
                            <div className="w-full flex items-center text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                                <span className="truncate">
                                    {(Array.isArray(analysis?.bottlenecks?.bottlenecks) && analysis?.bottlenecks?.bottlenecks?.[0]?.transition_label) || "No Delay Detected"}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Bottom Row: Analytics & Insights */}
                    <div className="grid grid-cols-3 gap-6 shrink-0 pb-8">
                        {/* Analytic Blocks */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">

                            <div className="border rounded-2xl shadow-sm space-y-6 flex flex-col h-fit lg:h-[320px]"
                                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
                                <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2 px-6 pt-6" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-glass)' }}>Top Variants</h4>
                                <div className="space-y-4 overflow-y-auto px-6 pb-6 flex-1 custom-scrollbar">
                                    {analysis?.variants?.slice(0, 5).map((v, i) => (
                                        <ChartBar
                                            key={i}
                                            label={`#${i + 1} Variant`}
                                            percentage={v.percentage}
                                            colorClass={i === 0 ? "bg-indigo-600" : "bg-indigo-400/60"}
                                        />
                                    )) || (
                                            <p className="text-[10px] opacity-40 text-center py-10" style={{ color: 'var(--text-tertiary)' }}>No variant data available</p>
                                        )}
                                </div>
                            </div>

                            <div className="border rounded-2xl shadow-sm flex flex-col h-[320px]"
                                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
                                <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2 px-6 pt-6 mb-4" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-glass)' }}>Throughput Time</h4>
                                <div className="flex-1 flex items-end gap-2 px-8 pb-4">
                                    {analysis?.kpis.duration_distribution?.map((d, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${d.percentage}%` }}
                                            className="grow bg-indigo-500 rounded-t-sm hover:bg-indigo-400 transition-colors relative group"
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {d.bucket}: {d.count} cases
                                            </div>
                                        </motion.div>
                                    )) || (
                                            <div className="w-full text-center text-[10px] opacity-30 pb-10" style={{ color: 'var(--text-tertiary)' }}>Waiting for data...</div>
                                        )}
                                </div>
                                <div className="flex justify-between text-[9px] font-black uppercase px-8 pb-6" style={{ color: 'var(--text-primary)' }}>
                                    <span>Fast</span> <span>Slow</span>
                                </div>
                            </div>

                            {/* Heatmap & Progress Section */}
                            <div className="border rounded-2xl shadow-sm overflow-hidden h-[300px]"
                                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
                                <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2 px-6 pt-6 mb-4" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-glass)' }}>Bottleneck Heatmap</h4>
                                <div className="relative h-full flex px-6 pt-2 overflow-y-auto pr-1 custom-scrollbar">
                                    <div className="w-full space-y-3">
                                        {(Array.isArray(analysis?.bottlenecks?.bottlenecks) && analysis?.bottlenecks?.bottlenecks.length > 0) ? (
                                            analysis.bottlenecks.bottlenecks.slice(0, 5).map((bn, i) => (
                                                <div key={i} className="flex flex-col gap-1.5 pb-2 border-b last:border-0 border-white/5 dark:border-white/5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-[10px] font-black tracking-tight" style={{ color: 'var(--text-secondary)' }}>
                                                            {bn.transition_label}
                                                        </div>
                                                        <div className="text-[10px] font-black" style={{ color: 'var(--text-primary)' }}>
                                                            {bn.avg_delay_minutes > 60 ? (bn.avg_delay_minutes / 60).toFixed(1) + 'h' : bn.avg_delay_minutes + 'm'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
                                                            <div
                                                                className="h-full bg-rose-500 transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                                                style={{ width: `${Math.min(100, (bn.avg_delay_minutes / (analysis.kpis.avg_duration_minutes || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] opacity-30 text-center pt-10" style={{ color: 'var(--text-tertiary)' }}>No bottlenecks detected</p>
                                        )}
                                        <p className="text-[9px] font-bold pt-2 pb-10 text-center uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Percentage of total cycle time consumed by delay</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-2xl shadow-sm h-[300px] flex flex-col items-center"
                                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
                                <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2 w-full px-6 pt-6 mb-6" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-glass)' }}>Process Status</h4>
                                <div className="relative w-36 h-36">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--bg-app)" strokeWidth="4" />
                                        {analysis?.kpis.status_counts && (
                                            <>
                                                <circle
                                                    cx="18" cy="18" r="16" fill="transparent" stroke="#3b82f6" strokeWidth="4"
                                                    strokeDasharray={`${(analysis.kpis.status_counts.active / analysis.kpis.total_cases) * 100} 100`}
                                                />
                                                <circle
                                                    cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="4"
                                                    strokeDasharray={`${(analysis.kpis.status_counts.completed / analysis.kpis.total_cases) * 100} 100`}
                                                    strokeDashoffset={-((analysis.kpis.status_counts.active / analysis.kpis.total_cases) * 100)}
                                                />
                                            </>
                                        )}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
                                        <span className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                                            {analysis?.kpis.status_counts ? Math.round((analysis.kpis.status_counts.completed / analysis.kpis.total_cases) * 100) : '0'}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-2 w-full px-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-tight" style={{ color: 'var(--text-secondary)' }}>Completed</span>
                                        </div>
                                        <span className="text-[10px] font-black" style={{ color: 'var(--text-primary)' }}>{analysis?.kpis.status_counts?.completed || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-tight" style={{ color: 'var(--text-secondary)' }}>Active</span>
                                        </div>
                                        <span className="text-[10px] font-black" style={{ color: 'var(--text-primary)' }}>{analysis?.kpis.status_counts?.active || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content AI Side Panel */}
                        <div className="h-full">
                            <MiningAIInsights insights={analysis?.insights} onGenerate={handleGenerateInsights} generating={generating} />
                        </div>
                    </div>
                </main>
            </div>
        </MainLayout>
    );
}
