import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Activity, Zap, FileText, Calendar, Database, ArrowRight, FlaskConical } from 'lucide-react';
import { fetchMiningAnalysis } from '../../services/miningService';

export default function MiningOverview({ processId, onEdit }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (!processId) return;
            setLoading(true);
            setStats(null);
            try {
                const { data } = await fetchMiningAnalysis(processId);
                if (data && data.kpis) {
                    setStats(data);
                } else {
                    setStats(null);
                }
            } catch (err) {
                console.error("Failed to fetch mining stats", err);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [processId]);

    if (loading) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-2xl bg-[var(--glass-button-bg)] border border-theme-border" />
                    ))}
                </div>
                <div className="h-64 rounded-2xl bg-[var(--glass-button-bg)] border border-theme-border" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-6">
                    <FlaskConical size={32} />
                </div>
                <h3 className="text-xl font-bold text-theme-primary mb-2">Initialize Process Mining</h3>
                <p className="text-theme-secondary max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                    This process has no mining data yet. Click the edit button to upload logs and start your analysis.
                </p>
                <button 
                    onClick={onEdit}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium"
                >
                    Get Started <ArrowRight size={18} />
                </button>
            </div>
        );
    }

    const { kpis } = stats;

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="app-glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-theme-secondary uppercase tracking-widest font-bold mb-1">Total Case Volume</p>
                            <p className="text-2xl font-bold text-theme-primary">{kpis.total_cases}</p>
                        </div>
                    </div>
                </div>

                <div className="app-glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-theme-secondary uppercase tracking-widest font-bold mb-1">Cycle Time (Avg)</p>
                            <p className="text-2xl font-bold text-theme-primary">{kpis.avg_duration_minutes} <span className="text-xs font-normal text-theme-secondary ml-1">min</span></p>
                        </div>
                    </div>
                </div>

                <div className="app-glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-theme-secondary uppercase tracking-widest font-bold mb-1">Variant Complexity</p>
                            <p className="text-2xl font-bold text-theme-primary">{kpis.total_variants || kpis.activities_involved?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mining Intelligence Summary */}
            <div className="app-glass-panel rounded-2xl overflow-hidden border border-theme-border/50 shadow-xl">
                <div className="px-6 py-5 border-b border-theme-border bg-[var(--glass-button-bg)] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 size={16} className="text-indigo-400" />
                            Mined Process Intelligence
                        </h3>
                        <p className="text-[9px] text-theme-secondary uppercase tracking-widest mt-1">Data-Driven Discovery Metadata</p>
                    </div>
                    {stats.generated_at && (
                        <div className="text-right">
                            <span className="text-[9px] text-theme-secondary font-black uppercase tracking-tighter block">Snapshot Sync</span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                                {new Date(stats.generated_at).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Column 1: Activities */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Database size={14} className="text-indigo-400" />
                                <h4 className="text-xs font-black text-theme-secondary uppercase tracking-[0.2em]">Activity Inventory</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {kpis.activities_involved?.map((act, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] font-bold text-theme-primary hover:border-indigo-500/30 transition-all">
                                        {act}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Flow Dynamics */}
                        <div className="lg:col-span-1 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity size={14} className="text-emerald-400" />
                                    <h4 className="text-xs font-black text-theme-secondary uppercase tracking-[0.2em]">Flow Dynamics</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="group">
                                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                                            <span className="text-theme-secondary font-bold uppercase">Events per Trace</span>
                                            <span className="text-theme-primary font-mono bg-theme-border/30 px-1.5 rounded">{kpis.events_per_case}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-theme-border/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full group-hover:shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all" style={{ width: '65%' }} />
                                        </div>
                                    </div>
                                    
                                    <div className="group">
                                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                                            <span className="text-theme-secondary font-bold uppercase">Peak Duration</span>
                                            <span className="text-theme-primary font-mono bg-theme-border/30 px-1.5 rounded">{kpis.max_duration_minutes} min</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-theme-border/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full group-hover:shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all" style={{ width: '85%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Data Quality & Scope */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={14} className="text-blue-400" />
                                <h4 className="text-xs font-black text-theme-secondary uppercase tracking-[0.2em]">Log Context</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-theme-border/10 border border-theme-border/20">
                                    <span className="text-[10px] font-bold text-theme-secondary uppercase">Total Events</span>
                                    <span className="text-xs font-black text-theme-primary">{kpis.total_events}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-theme-border/10 border border-theme-border/20">
                                    <span className="text-[10px] font-bold text-theme-secondary uppercase">Unique Paths</span>
                                    <span className="text-xs font-black text-theme-primary">{kpis.total_variants || '---'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-theme-border/10 border border-theme-border/20">
                                    <span className="text-[10px] font-bold text-theme-secondary uppercase">Resource Load</span>
                                    <span className="text-xs font-black text-theme-primary">{kpis.total_resources || '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
