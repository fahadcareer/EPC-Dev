import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, AlertTriangle, Calendar, Clock, CheckCircle, Link2, TrendingUp, Sparkles, Info, Bot, Activity, Zap, ShieldCheck } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import NETWORK_URLS from "../../config/network_string";
import { useTheme } from "../../contexts/ThemeContext";
import { fetchMiningAnalysis, generateMiningInsights } from "../../services/miningService";
import { useTranslation } from "react-i18next";

export default function InsightsView({ process }) {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState(null);
    const [miningInsights, setMiningInsights] = useState(null);
    const [error, setError] = useState(null);

    const isMining = process?.diagram_type === 'mining';

    const fetchStandardInsights = async (force = false) => {
        setLoading(true);
        setError(null);
        setInsights(null); // Clear previous
        try {
            const api = (await import("../../services/api_service")).default;
            const url = force
                ? `${NETWORK_URLS.GetEPCInsights(process._id)}?recheck=true`
                : NETWORK_URLS.GetEPCInsights(process._id);

            const res = await api.get(url);
            if (res.data.generated_at) {
                res.data.formattedDate = formatInsightDate(res.data.generated_at);
            }
            setInsights(res.data);
        } catch (err) {
            setError(err?.response?.data?.error || "Failed to fetch Tasree3 insights");
        } finally {
            setLoading(false);
        }
    };

    const fetchMiningInsightsData = async (force = false) => {
        setLoading(true);
        setError(null);
        setMiningInsights(null); // Clear previous
        try {
            if (force) {
                const { data } = await generateMiningInsights(process._id);
                setMiningInsights(data.insights);
            } else {
                const { data } = await fetchMiningAnalysis(process._id);
                setMiningInsights(data.insights);
            }
        } catch (err) {
            setError("Failed to fetch mining insights");
        } finally {
            setLoading(false);
        }
    };

    const formatInsightDate = (dateStr) => {
        const generatedDate = new Date(dateStr);
        return {
            dateTime: generatedDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            relative: getRelativeTime(generatedDate)
        };
    };

    const getRelativeTime = (date) => {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        return `${diffDay}d ago`;
    };

    useEffect(() => {
        const isApprovedStatus = process?.status?.toLowerCase() === "approved" || process?.is_approved === true;
        if (isMining) {
            fetchMiningInsightsData(false);
        } else if (isApprovedStatus) {
            fetchStandardInsights(false);
        }
    }, [process?._id, isMining, process?.status, process?.is_approved]);

    // Mining Mode UI
    if (isMining) {
        return (
            <div className="p-6 max-w-5xl mx-auto animate-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-500/10 rounded-xl">
                            <Bot className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                             <h2 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
                                {t('aiProcessAnalyst', 'AI Process Analyst')}
                                <span className="px-2 py-0.5 bg-violet-700/10 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-[9px] font-black uppercase rounded border border-violet-700/20 dark:border-violet-500/20 tracking-widest">{t('miningEngine', 'Mining Engine')}</span>
                            </h2>
                            <p className="text-sm text-theme-secondary font-medium">Data-driven optimization suggestions and bottleneck analysis.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchMiningInsightsData(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all text-sm font-bold shadow-lg shadow-violet-600/20"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        {miningInsights ? t('refreshAnalysis', 'Refresh Analysis') : t('generateInsights', 'Generate Insights')}
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 animate-ping bg-violet-500/20 rounded-full" />
                            <Bot size={48} className="text-violet-500 relative z-10" />
                        </div>
                        <p className="text-sm font-bold text-theme-secondary animate-pulse uppercase tracking-[0.3em]">Crunching Log Patterns...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-400 flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : !miningInsights ? (
                    <div className="p-16 text-center border-2 border-dashed border-theme-border rounded-3xl">
                        <div className="w-16 h-16 bg-theme-border/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-theme-tertiary">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-theme-primary mb-2">No Analysis Found</h3>
                        <p className="text-sm text-theme-tertiary max-w-sm mx-auto mb-8">Click the button above to have our AI Analyst examine your process logs for efficiency gaps.</p>
                        <button onClick={() => fetchMiningInsightsData(true)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:scale-105 transition-all">
                            Initialize AI Analysis
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            let data = miningInsights;
                            if (typeof miningInsights === 'string') {
                                try {
                                    // Strip markdown code blocks if present
                                    const cleaned = miningInsights.replace(/```json/g, '').replace(/```/g, '').trim();
                                    data = JSON.parse(cleaned);
                                } catch (e) {
                                    return (
                                        <div className="app-glass-panel rounded-3xl p-8 border border-theme-border/50 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                                <Sparkles size={200} />
                                            </div>
                                            <div className="relative z-10 prose prose-invert max-w-none prose-p:text-theme-secondary prose-headings:text-theme-primary prose-strong:text-indigo-400 prose-li:text-theme-secondary prose-blockquote:border-violet-500/50 prose-blockquote:bg-violet-500/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-black text-theme-primary mb-6" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-theme-primary mt-10 mb-4 border-b border-theme-border pb-2" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-indigo-400 mt-8 mb-3" {...props} />,
                                                        p: ({ node, ...props }) => <p className="text-sm text-theme-secondary leading-relaxed mb-4" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 space-y-2 mb-6" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-theme-primary" {...props} />,
                                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-violet-500/40 pl-4 py-1 italic text-theme-tertiary mb-6" {...props} />
                                                    }}
                                                >
                                                    {miningInsights}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                }
                            }

                             return (
                                <div className="space-y-8 animate-enter">
                                    {(() => {
                                        // Dynamic Key Mapping (Handles highly inconsistent backend keys)
                                        const bottleneckData = data.bottleneck || data.bottleneck_analysis || data.bottleneck_report;
                                        const delayData = data.delay || data.cycle_time || data.duration_analysis;
                                        const reworkData = data.rework || data.inefficiency_report || data.loops;
                                        const suggestionsData = data.suggestions || data.recommendations || data.optimization_strategy;

                                        return (
                                            <>
                                                {/* Top Level KPIs / Summary if available */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {bottleneckData && (
                                                        <div className="app-card p-4 flex items-center gap-4 bg-rose-500/5 dark:bg-rose-500/[0.03] border border-rose-500/10 dark:border-rose-500/20">
                                                            <div className="p-2 bg-rose-500/20 dark:bg-rose-500/10 rounded-lg">
                                                                <Activity className="text-rose-500 dark:text-rose-400" size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest">Status</p>
                                                                <p className="text-sm font-bold text-rose-500 dark:text-rose-400">{t('bottleneck', 'Bottleneck')}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {delayData && (
                                                        <div className="app-card p-4 flex items-center gap-4 bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/10 dark:border-amber-500/20">
                                                            <div className="p-2 bg-amber-500/20 dark:bg-amber-500/10 rounded-lg">
                                                                <Clock className="text-amber-500 dark:text-amber-400" size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest">Focus</p>
                                                                <p className="text-sm font-bold text-amber-500 dark:text-amber-400">{t('cycleTime', 'Cycle Time')}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {reworkData && (
                                                        <div className="app-card p-4 flex items-center gap-4 bg-indigo-500/5 dark:bg-indigo-500/[0.03] border border-indigo-500/10 dark:border-indigo-500/20">
                                                            <div className="p-2 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-lg">
                                                                <RefreshCw className="text-indigo-500 dark:text-indigo-400" size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest">Flow</p>
                                                                <p className="text-sm font-bold text-indigo-500 dark:text-indigo-400">{t('rework', 'Rework')}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Bottleneck Card */}
                                                    {bottleneckData && (
                                                        <div className="app-card border-t-4 border-rose-500 dark:border-rose-500/40 p-6 hover:shadow-2xl transition-all bg-gradient-to-b from-rose-500/[0.02] to-transparent dark:from-rose-500/[0.05]">
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <Activity className="text-rose-500 dark:text-rose-400" size={24} />
                                                                    <h3 className="text-xl font-black text-theme-primary tracking-tight">{t('bottleneck', 'Bottleneck')}</h3>
                                                                </div>
                                                                <span className="px-2 py-1 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase rounded border border-rose-500/20">High Impact</span>
                                                            </div>
                                                            
                                                            {typeof bottleneckData === 'object' ? (
                                                                <div className="space-y-4">
                                                                    <div className="p-4 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                        <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Impacted Transition</p>
                                                                        <p className="text-base font-bold text-theme-primary">{bottleneckData.activity_transition}</p>
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="flex-1 p-4 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                            <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Avg Delay</p>
                                                                            <p className="text-2xl font-black text-rose-500">{(bottleneckData.average_delay_minutes || bottleneckData.average_delay || 0).toFixed(1)} <span className="text-xs font-normal text-theme-tertiary">mins</span></p>
                                                                        </div>
                                                                        <div className="flex-1 p-4 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                            <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Cases</p>
                                                                            <p className="text-2xl font-black text-theme-primary">{bottleneckData.cases_affected}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-theme-secondary leading-relaxed bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 italic">
                                                                        "{bottleneckData.insight || bottleneckData.analysis}"
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="p-5 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                    <p className="text-sm text-theme-primary leading-relaxed font-medium">
                                                                        {bottleneckData}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Cycle Time / Delay Card */}
                                                    {delayData && (
                                                        <div className="app-card border-t-4 border-amber-500 dark:border-amber-500/40 p-6 hover:shadow-2xl transition-all bg-gradient-to-b from-amber-500/[0.02] to-transparent dark:from-amber-500/[0.05]">
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <Clock className="text-amber-500 dark:text-amber-400" size={24} />
                                                                    <h3 className="text-xl font-black text-theme-primary tracking-tight">{t('cycleTime', 'Cycle Time')}</h3>
                                                                </div>
                                                                <span className="px-2 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded border border-amber-500/20">Efficiency</span>
                                                            </div>

                                                            {typeof delayData === 'object' ? (
                                                                <div className="space-y-4">
                                                                    <div className="flex gap-4">
                                                                        <div className="flex-1 p-4 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                            <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Actual</p>
                                                                            <p className="text-2xl font-black text-amber-600">{(delayData.average_duration_minutes || delayData.average_duration || 0).toFixed(0)} <span className="text-xs font-normal text-theme-tertiary">mins</span></p>
                                                                        </div>
                                                                        <div className="flex-1 p-4 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                            <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Expected</p>
                                                                            <p className="text-2xl font-black text-theme-primary">{delayData.expected_duration_minutes || delayData.maximum_duration || '--'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                                                        <p className="text-sm text-theme-secondary leading-relaxed">
                                                                            {delayData.insight || delayData.analysis}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-5 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                    <p className="text-sm text-theme-primary leading-relaxed font-medium">
                                                                        {delayData}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Rework Card */}
                                                    {reworkData && (
                                                        <div className="app-card border-t-4 border-indigo-500 dark:border-indigo-500/40 p-6 hover:shadow-2xl transition-all lg:col-span-2 bg-gradient-to-b from-indigo-500/[0.01] to-transparent">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <RefreshCw className="text-indigo-500 dark:text-indigo-400" size={24} />
                                                                <h3 className="text-xl font-black text-theme-primary tracking-tight">{t('rework', 'Rework')}</h3>
                                                            </div>

                                                            {typeof reworkData === 'object' ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    <div className="md:col-span-1 space-y-4">
                                                                        <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20">
                                                                            <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Status</p>
                                                                            <div className={`px-3 py-1.5 rounded-xl font-black text-xs inline-block ${(reworkData.loops_detected || reworkData.activity_loop) ? 'bg-rose-500 dark:bg-rose-500/60 text-white' : 'bg-emerald-500 dark:bg-emerald-500/60 text-white'}`}>
                                                                                {(reworkData.loops_detected || reworkData.activity_loop) ? 'Loop Detected' : 'No Loops'}
                                                                            </div>
                                                                        </div>
                                                                        {reworkData.activity_loop && (
                                                                            <div className="p-4 bg-theme-input/40 dark:bg-theme-input/20 rounded-2xl border border-theme-border/50 dark:border-theme-border/30">
                                                                                <p className="text-[10px] text-theme-tertiary uppercase font-black tracking-widest mb-1">Top Loop</p>
                                                                                <p className="text-sm font-bold text-indigo-400 dark:text-indigo-300">{reworkData.activity_loop}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="md:col-span-2 p-6 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] rounded-3xl border border-indigo-500/10 dark:border-indigo-500/20 flex items-center">
                                                                        <p className="text-base text-theme-secondary leading-relaxed italic">
                                                                            "{reworkData.insight || reworkData.analysis}"
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-5 bg-theme-input/40 rounded-2xl border border-theme-border/50">
                                                                    <p className="text-sm text-theme-primary leading-relaxed font-medium">
                                                                        {reworkData}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Suggestions Section */}
                                                    {suggestionsData && (
                                                        <div className="lg:col-span-2 app-glass-panel rounded-[40px] p-10 border border-violet-500/20 bg-gradient-to-br from-violet-600/5 to-transparent relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-12 opacity-[0.08] pointer-events-none rotate-12">
                                                                <Sparkles size={160} className="text-violet-500" />
                                                            </div>
                                                            
                                                            <div className="relative z-10">
                                                                <div className="flex items-center gap-4 mb-8">
                                                                    <div className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-600/20">
                                                                        <Zap className="text-white" size={28} fill="currentColor" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-2xl font-black text-theme-primary uppercase tracking-tighter">{t('suggestions', 'Suggestions')}</h3>
                                                                        <p className="text-sm text-theme-tertiary font-medium">AI-generated recommendations for process improvement.</p>
                                                                    </div>
                                                                </div>

                                                                {Array.isArray(suggestionsData) ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {suggestionsData.map((item, idx) => (
                                                                            <div key={idx} className="group flex flex-col gap-3 p-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-8 w-8 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center text-xs font-black text-violet-400">
                                                                                        {idx + 1}
                                                                                    </div>
                                                                                    <p className="text-xs font-black text-violet-500 uppercase tracking-widest">{item.issue || "Recommendation"}</p>
                                                                                </div>
                                                                                <p className="text-sm text-theme-primary leading-relaxed">
                                                                                    {item.recommendation || item.insight || (typeof item === 'string' ? item : JSON.stringify(item))}
                                                                                </p>
                                                                                {item.root_cause && (
                                                                                    <div className="mt-2 p-3 rounded-xl bg-violet-500/5 border border-dashed border-violet-500/20">
                                                                                        <p className="text-[10px] text-violet-400 font-bold uppercase mb-1">Root Cause</p>
                                                                                        <p className="text-xs text-theme-secondary italic">{item.root_cause}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : typeof suggestionsData === 'object' ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {Object.entries(suggestionsData).map(([key, value], idx) => (
                                                                            <div key={idx} className="group flex gap-5 p-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300">
                                                                                <div className="h-10 w-10 shrink-0 rounded-2xl bg-violet-500/10 flex items-center justify-center text-sm font-black text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                                                                                    {idx + 1}
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <p className="text-xs font-black text-violet-500 uppercase tracking-widest opacity-70">{key.replace(/_/g, ' ')}</p>
                                                                                    <p className="text-sm text-theme-secondary leading-relaxed group-hover:text-theme-primary transition-colors">
                                                                                        {value}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                                                        <p className="text-lg text-theme-primary leading-relaxed font-medium">
                                                                            {suggestionsData}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    }

    // Standard EPC Mode
    const isApproved = process?.status?.toLowerCase() === "approved" || process?.is_approved === true;

    if (!isApproved) {
        return (
            <div className="p-20 text-center">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-theme-primary mb-2">Governance Lock</h3>
                <p className="text-sm text-theme-tertiary max-w-sm mx-auto">
                    Structural AI insights are only available for fully **Approved** process models to ensure compliance integrity.
                </p>
            </div>
        );
    }

    // ... Rest of standard insights rendering ...
    return (
        <div className="p-6 max-w-5xl mx-auto animate-enter">
            {/* Standard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-theme-primary">{t('insights', 'Insights')}</h2>
                        <p className="text-sm text-theme-tertiary">Optimization recommendations for this approved EPC model.</p>
                    </div>
                </div>
                <button onClick={() => fetchStandardInsights(true)} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-theme-border bg-theme-input hover:bg-theme-bg-secondary transition-all text-sm whitespace-nowrap">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Re-check Model
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-theme-tertiary">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    Analyzing structure…
                </div>
            ) : error ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
            ) : (
                <div className="space-y-6">
                    {(insights?.insights || []).map((item, idx) => (
                        <div key={idx} className="group relative overflow-hidden rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-surface)] p-6 hover:border-[var(--accent-primary)]/30 transition-all shadow-sm">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.severity === 'High' ? 'bg-rose-500' : item.severity === 'Medium' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">{item.title || "Observation"}</h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">{item.description}</p>
                            {item.recommendation && (
                                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-indigo-500/20 rounded-md">
                                        <Lightbulb size={12} className="text-indigo-500" />
                                    </div>
                                    <p className="text-xs italic font-medium text-[var(--text-secondary)] leading-relaxed">
                                        {item.recommendation}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                    {(!insights || insights.insights?.length === 0) && (
                        <div className="p-16 text-center border-2 border-dashed border-[var(--border-glass)] rounded-[32px] opacity-40">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Compliance Verified</p>
                            <p className="text-[10px] uppercase tracking-widest mt-1 text-[var(--text-tertiary)]">No structural deviations found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
