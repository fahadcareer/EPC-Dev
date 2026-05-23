/**
 * MiningDashboard.jsx
 * -------------------
 * Displays KPI cards, bottleneck table, process map graph,
 * and AI insights for a given process ID.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    Search, BarChart3, Clock, AlertTriangle, Activity,
    Sparkles, ChevronDown, ChevronUp, Loader2, Bot, Calendar,
    CheckCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { fetchMiningAnalysis, generateMiningAnalysis, generateMiningInsights, runConformanceCheck } from '../../services/miningService';
import { apiGet } from '../../services/api_service.jsx';
import NETWORK_URLS from '../../config/network_string.jsx';
import ProcessMapGraph from './ProcessMapGraph';

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, unit = '', color = 'violet' }) {
    const colorMap = {
        violet: 'from-violet-600/10 to-violet-500/5 border-violet-500/20 text-violet-400',
        blue: 'from-blue-600/10 to-blue-500/5 border-blue-500/20 text-blue-400',
        emerald: 'from-emerald-600/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
        amber: 'from-amber-600/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    };
    return (
        <div className={`rounded-xl border bg-gradient-to-br p-4 ${colorMap[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
                {value ?? '—'}{unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
            </p>
        </div>
    );
}

// ── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
    return (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MiningDashboard({ processId, viewMode = 'all' }) {
    // UI states
    const [fetching, setFetching] = useState(false);
    const [generatingDashboard, setGeneratingDashboard] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [direction, setDirection] = useState('LR');

    // Data states
    const [kpis, setKpis] = useState(null);
    const [bottlenecks, setBottlenecks] = useState(null);
    const [processMap, setProcessMap] = useState(null);
    const [insights, setInsights] = useState(null);
    const [lastGenerated, setLastGenerated] = useState(null);
    const [showInsights, setShowInsights] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Conformance states
    const [conformanceResult, setConformanceResult] = useState(null);
    const [approvedProcesses, setApprovedProcesses] = useState([]);
    const [selectedApprovedId, setSelectedApprovedId] = useState('');
    const [runningConformance, setRunningConformance] = useState(false);

    const handleFetchAnalysis = async () => {
        const pid = processId.trim();
        if (!pid) return;

        setFetching(true);
        setKpis(null);
        setBottlenecks(null);
        setProcessMap(null);
        setInsights(null);
        setLastGenerated(null);
        setShowInsights(false);

        try {
            // Fetch persisted full dashboard analysis
            const { data } = await fetchMiningAnalysis(pid);
            
            if (data && data.kpis) {
                setKpis(data.kpis);
                setBottlenecks(data.bottlenecks);
                setProcessMap(data.process_map);
                setInsights(data.insights);
                setLastGenerated(data.generated_at);
                setShowInsights(!!data.insights);
            } else {
                setKpis(null);
                setBottlenecks(null);
                setProcessMap(null);
                setInsights(null);
                setLastGenerated(null);
                setShowInsights(false);
            }
        } catch (err) {
            const msg = err?.response?.data?.error || 'Failed to fetch analysis state';
            toast.error(msg);
            setKpis(null);
            setBottlenecks(null);
            setProcessMap(null);
            setInsights(null);
            setLastGenerated(null);
            setShowInsights(false);
        } finally {
            setFetching(false);
        }
    };

    React.useEffect(() => {
        if (processId) {
            handleFetchAnalysis();
        }
    }, [processId]);

    // Auto-apply filter when both dates are provided
    React.useEffect(() => {
        if (startDate && endDate) {
            handleGenerateDashboard(true);
        }
    }, [startDate, endDate]);

    const handleGenerateDashboard = async (useFilters = false) => {
        const pid = processId.trim();
        if (!pid) return;
        setGeneratingDashboard(true);
        try {
            const filters = useFilters === true ? { start_date: startDate || undefined, end_date: endDate || undefined } : {};
            const { data } = await generateMiningAnalysis(pid, filters);
            setKpis(data.kpis);
            setBottlenecks(data.bottlenecks);
            setProcessMap(data.process_map);
            setInsights(data.insights);
            setLastGenerated(data.generated_at);
            
            if (useFilters) {
                toast.success("Filters applied successfully!");
            } else {
                setShowInsights(false);
                toast.success("Dashboard generated successfully!");
            }
        } catch (err) {
            const msg = err?.response?.data?.error || err.message || 'Dashboard generation failed';
            if (err.response?.status === 404 && useFilters) {
                toast.info("No events found for this date range.");
            } else {
                toast.error(msg);
            }
        } finally {
            setGeneratingDashboard(false);
        }
    };

    const handleGenerateInsights = async () => {
        if (!processId.trim()) return;
        setGeneratingAI(true);
        setShowInsights(true);
        try {
            const { data } = await generateMiningInsights(processId.trim());
            setInsights(data.insights);
            setLastGenerated(data.generated_at);
            toast.success("AI Insights generated successfully!");
        } catch (err) {
            const msg = err?.response?.data?.error || err.message || 'AI insights failed';
            toast.error(msg);
        } finally {
            setGeneratingAI(false);
        }
    };

    const fetchApprovedProcesses = async () => {
        try {
            const { data } = await apiGet(NETWORK_URLS.GetProcesses);
            // Filter only files that are in an "Approved" folder or have status "Approved"
            // Actually, based on codebase, status is "Approved".
            const approved = data.filter(p => p.type === 'file' && p.status === 'Approved');
            setApprovedProcesses(approved);
        } catch (err) {
            console.error("Failed to fetch approved processes", err);
        }
    };

    React.useEffect(() => {
        fetchApprovedProcesses();
    }, []);

    const handleRunConformance = async () => {
        if (!selectedApprovedId) {
            toast.warn("Please select an approved process for comparison.");
            return;
        }
        setRunningConformance(true);
        try {
            const { data } = await runConformanceCheck(processId, selectedApprovedId);
            setConformanceResult(data);
            toast.success("Conformance analysis complete!");
        } catch (err) {
            toast.error(err?.response?.data?.error || "Conformance check failed");
        } finally {
            setRunningConformance(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-base font-bold text-slate-100">Mining Dashboard</h2>
                    <p className="text-xs text-slate-500">
                        Analyze uploaded event logs by process
                        {lastGenerated && <span className="ml-2 text-violet-400">• Last updated: {new Date(lastGenerated).toLocaleString()}</span>}
                    </p>
                </div>

                <div className="flex items-center gap-2 border pr-1.5 pl-3 py-1 rounded-xl bg-slate-800/20 border-slate-700/50 shadow-inner mr-2">
                    <div className="flex items-center px-1">
                        <Calendar size={13} className="text-indigo-400 mr-2 opacity-70" />
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-transparent text-[10px] font-bold uppercase outline-none w-[100px] text-slate-300"
                            title="Start Date"
                        />
                        <span className="text-[9px] font-bold opacity-40 mx-2 text-slate-500">TO</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-transparent text-[10px] font-bold uppercase outline-none w-[100px] text-slate-300"
                            title="End Date"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button 
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                handleGenerateDashboard(false);
                            }}
                            className="ml-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest border border-indigo-500/20 active:scale-95"
                            title="Reset Date Filter"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {kpis && (
                    <button
                        onClick={() => handleGenerateDashboard(false)}
                        disabled={generatingDashboard || generatingAI}
                        className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-600/10 backdrop-blur-md border border-violet-500/30 text-violet-300 font-medium transition-all duration-300 hover:bg-violet-600/20 hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] shadow-violet-500/10 disabled:opacity-50 hover:-translate-y-0.5 disabled:hover:translate-y-0 text-sm"
                    >
                        {generatingDashboard ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating Dashboard&hellip; </>
                        ) : (
                            <><BarChart3 className="w-3.5 h-3.5" /> Regenerate Dashboard </>
                        )}
                    </button>
                )}
            </div>

            {/* Results */}
            {kpis && (
                <div className="space-y-6 animate-fade-in">
                    {/* ── KPI Cards ────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard icon={Activity} label="Total Cases"          value={kpis.total_cases}              color="violet" />
                        <KpiCard icon={Activity} label="Total Events"         value={kpis.total_events}             color="blue" />
                        <KpiCard icon={Clock}    label="Average Process Time" value={kpis.avg_duration_minutes} unit="min" color="emerald" />
                        <KpiCard icon={Clock}    label="Max Process Time"     value={kpis.max_duration_minutes} unit="min" color="amber" />
                    </div>

                    {/* Activities banner */}
                    {kpis.activities_involved?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {kpis.activities_involved.map((a) => (
                                <span key={a} className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
                                    {a}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ── Process Map ───────────────────────────────── */}
                    {processMap && (viewMode === 'all' || viewMode === 'discovery') && (
                        <Section title={conformanceResult ? "Conformance Map (Diff Mode)" : "Process Map"} icon={Activity}>
                            <div className="flex justify-end mb-2">
                                <div className="flex border p-1 rounded-xl shadow-inner bg-slate-800/40 border-slate-700/50">
                                    <button 
                                        onClick={() => setDirection('LR')}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${direction === 'LR' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Horizontal
                                    </button>
                                    <button 
                                        onClick={() => setDirection('TB')}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${direction === 'TB' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Vertical
                                    </button>
                                </div>
                            </div>
                            <div className="h-[500px] w-full mt-2 relative border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                                <ProcessMapGraph 
                                    nodes={processMap.nodes} 
                                    edges={processMap.edges} 
                                    conformanceData={conformanceResult}
                                    direction={direction}
                                />
                            </div>
                            <div className="flex gap-6 mt-3 text-xs text-slate-500">
                                <span>Activities: <strong className="text-slate-300">{processMap.unique_activities}</strong></span>
                                <span>Transitions: <strong className="text-slate-300">{processMap.total_transitions}</strong></span>
                            </div>
                        </Section>
                    )}

                    {/* ── Conformance Controls ─────────────────────────── */}
                    {(viewMode === 'all' || viewMode === 'analysis') && (
                        <Section title="Conformance Checking" icon={CheckCircle2}>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Select Reference Model (Approved)</label>
                                    <select 
                                        value={selectedApprovedId}
                                        onChange={(e) => setSelectedApprovedId(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-violet-500"
                                    >
                                        <option value="">— Select an Approved Process —</option>
                                        {approvedProcesses.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} (v{p.version || '1.0'})</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleRunConformance}
                                    disabled={runningConformance || !selectedApprovedId}
                                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    {runningConformance ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Conformance Check"}
                                </button>
                            </div>

                            {conformanceResult && (
                                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                                    {/* Summary Stats */}
                                    <div className="lg:col-span-1 space-y-4">
                                        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                                            <div className="text-center mb-6">
                                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-violet-500/20 relative">
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-3xl font-black text-slate-100">{conformanceResult.summary.conformance_percentage}%</span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Fitness</span>
                                                    </div>
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle
                                                            cx="48" cy="48" r="44"
                                                            fill="transparent"
                                                            stroke="currentColor" strokeWidth="4"
                                                            className="text-violet-500/10"
                                                        />
                                                        <circle
                                                            cx="48" cy="48" r="44"
                                                            fill="transparent"
                                                            stroke="currentColor" strokeWidth="4"
                                                            strokeDasharray={276}
                                                            strokeDashoffset={276 - (276 * conformanceResult.summary.conformance_percentage) / 100}
                                                            className="text-violet-500 transition-all duration-1000"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/5">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Non-Conforming</span>
                                                    <span className="text-sm font-black text-rose-400">{conformanceResult.summary.non_conformant_cases} Cases</span>
                                                </div>
                                                <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/5">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Compliance Risk</span>
                                                    <span className="text-sm font-black text-amber-400">{conformanceResult.summary.risk_cases} Cases</span>
                                                </div>
                                                <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/5">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Deviations</span>
                                                    <span className="text-sm font-black text-slate-200">{conformanceResult.summary.total_deviations}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deviations List */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="rounded-2xl bg-slate-800/20 border border-slate-700/50 overflow-hidden">
                                            <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-700/50 flex justify-between items-center">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deviation Log</h4>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[9px] font-bold text-slate-500 uppercase">Extra</span></div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-[9px] font-bold text-slate-500 uppercase">Missing</span></div>
                                                </div>
                                            </div>
                                            <div className="max-h-[350px] overflow-auto custom-scrollbar">
                                                <div className="divide-y divide-white/5">
                                                    {conformanceResult.node_differences.missing.map((node, i) => (
                                                        <div key={`ms-node-${i}`} className="p-4 hover:bg-amber-500/5 transition-colors flex items-center gap-3">
                                                            <div className="p-1.5 rounded-lg bg-amber-500/10"><Activity size={14} className="text-amber-500" /></div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">{node}</p>
                                                                <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">Activity present in approved model but never executed in logs</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {conformanceResult.edge_differences.extra.map((e, i) => (
                                                        <div key={`ex-${i}`} className="p-4 hover:bg-rose-500/5 transition-colors flex justify-between items-center">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 rounded-lg bg-rose-500/10"><AlertTriangle size={14} className="text-rose-500" /></div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">{e.from} → {e.to}</p>
                                                                    <p className="text-[9px] font-bold text-rose-500/70 uppercase tracking-widest">Extra transition not in approved model</p>
                                                                </div>
                                                            </div>
                                                            <div className="px-2 py-0.5 rounded-md bg-rose-500/20 text-[10px] font-black text-rose-400">{e.count}x</div>
                                                        </div>
                                                    ))}
                                                    {conformanceResult.edge_differences.missing.map((e, i) => (
                                                        <div key={`ms-${i}`} className="p-4 hover:bg-amber-500/5 transition-colors flex items-center gap-3">
                                                            <div className="p-1.5 rounded-lg bg-amber-500/10"><Clock size={14} className="text-amber-500" /></div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">{e.from} → {e.to}</p>
                                                                <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">Missing transition expected by approved model</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Case Drill-down */}
                                    <div className="lg:col-span-3 space-y-4">
                                        <div className="rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-900/40">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-800/40">
                                                    <tr>
                                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Case ID</th>
                                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Path Length</th>
                                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Deviation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {conformanceResult.case_analysis.map((c, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-300 font-mono italic">{c.case_id}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-400">{c.path_length} Nodes</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                                                                    c.status === 'conformant' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                    c.status === 'risk' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-[10px] font-medium text-slate-500 truncate max-w-[200px]">
                                                                {c.deviations[0] || 'None'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* ── Bottlenecks Table ─────────────────────────── */}
                    {bottlenecks?.bottlenecks?.length > 0 && (viewMode === 'all' || viewMode === 'analysis') && (
                        <Section title="Bottleneck Analysis" icon={AlertTriangle}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="pb-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transition</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Process Time</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Max Process Time</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cases</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bottlenecks.bottlenecks.map((b, i) => (
                                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="py-2.5 text-slate-300 font-medium font-mono text-xs">
                                                    {b.transition_label || `${b.from_activity} → ${b.to_activity}`}
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    <span className={`font-semibold ${b.avg_delay_minutes > 120 ? 'text-red-400' : b.avg_delay_minutes > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {b.avg_delay_minutes} min
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right text-slate-400">{b.max_delay_minutes} min</td>
                                                <td className="py-2.5 text-right text-slate-400">{b.occurrences}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    )}

                    {/* ── AI Insights ───────────────────────────────── */}
                    {(viewMode === 'all' || viewMode === 'analysis') && (
                        <Section title="AI Insights" icon={Bot}>
                            <div className="flex items-center gap-3">
                                {!insights ? (
                                    <button
                                        onClick={handleGenerateInsights}
                                        disabled={generatingAI || generatingDashboard}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {generatingAI ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating AI Analysis... </>
                                        ) : (
                                            <><Sparkles className="w-4 h-4" /> Generate AI Insights </>
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowInsights(!showInsights)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
                                        >
                                            {showInsights ? <><ChevronUp className="w-4 h-4" />Hide Insights</> : <><ChevronDown className="w-4 h-4" />Show Insights</>}
                                        </button>
                                        <button
                                            onClick={handleGenerateInsights}
                                            disabled={generatingAI || generatingDashboard}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {generatingAI ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating... </>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" /> Regenerate Insights </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {showInsights && insights && (
                                <div className="mt-5 p-6 rounded-xl bg-slate-900/50 border border-slate-700/50 shadow-inner max-h-[500px] overflow-auto custom-scrollbar">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-100 mt-6 mb-3 first:mt-0" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-200 mt-6 mb-3 border-b border-slate-700/50 pb-1" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-base font-semibold text-violet-300 mt-5 mb-2" {...props} />,
                                            p: ({node, ...props}) => <p className="text-sm text-slate-400 leading-relaxed mb-4" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 text-sm text-slate-400 mb-4 space-y-1.5 marker:text-slate-500" {...props} />,
                                            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 text-sm text-slate-400 mb-4 space-y-1.5 marker:text-slate-500" {...props} />,
                                            strong: ({node, ...props}) => <strong className="font-semibold text-slate-200" {...props} />,
                                            code: ({node, inline, className, children, ...props}) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return inline ? (
                                                    <code className="px-1.5 py-0.5 rounded-md bg-slate-800 text-violet-300 font-mono text-xs" {...props}>{children}</code>
                                                ) : (
                                                    <code className="block p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto mb-4" {...props}>{children}</code>
                                                );
                                            },
                                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-violet-500/50 pl-4 py-2 italic text-slate-400 mb-4 bg-violet-500/5 rounded-r-lg" {...props} />
                                        }}
                                    >
                                        {insights}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </Section>
                    )}
                </div>
            )}

            {/* ⭐ Full loading skeleton while fetching */}
            {fetching && (
                <div className="space-y-4 animate-pulse">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-slate-800/60 border border-slate-700/50" />
                        ))}
                    </div>
                    <div className="h-64 rounded-2xl bg-slate-800/60 border border-slate-700/50" />
                    <div className="h-48 rounded-2xl bg-slate-800/60 border border-slate-700/50" />
                </div>
            )}

            {/* ⭐ Minimal empty state with Generate Action */}
            {!fetching && !kpis && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-5">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Process Analysis Ready</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mb-7">
                        Click below to compute the Process Map, Bottlenecks, and KPIs from your uploaded event logs.
                    </p>
                    <button
                        onClick={handleGenerateDashboard}
                        disabled={generatingDashboard}
                        className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-violet-600/10 backdrop-blur-xl border border-violet-500/30 text-violet-300 font-semibold transition-all duration-300 hover:bg-violet-600/20 hover:border-violet-400/50 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-violet-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/0 via-violet-400/10 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        {generatingDashboard ? (
                            <><Loader2 className="w-4 h-4 animate-spin relative z-10" /> <span className="relative z-10 text-sm tracking-wide">Crunching Data...</span> </>
                        ) : (
                            <><BarChart3 className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform" /> <span className="relative z-10 text-sm tracking-wide">Generate Full Dashboard</span> </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
