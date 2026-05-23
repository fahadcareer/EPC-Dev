import React, { useState, useEffect } from "react";
import { Table, FileText, Type, AlignLeft, Edit, Activity, Clock, ArrowRight, FlaskConical, Search, Filter, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchMiningAnalysis } from "../../services/miningService";
import { useTheme } from "../../contexts/ThemeContext";

export default function TableView({ process, onEdit }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [miningData, setMiningData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const isMining = process.diagram_type === 'mining';

    useEffect(() => {
        if (isMining && process._id) {
            const loadMiningData = async () => {
                setLoading(true);
                try {
                    const { data } = await fetchMiningAnalysis(process._id);
                    setMiningData(data);
                } catch (err) {
                    console.error("Failed to load mining table data", err);
                } finally {
                    setLoading(false);
                }
            };
            loadMiningData();
        }
    }, [isMining, process._id]);

    // Filter out meta nodes same as diagram view (Standard Mode)
    const nodes = (process.nodes || []).filter(n => !n.data?.isMeta && !n.isMeta);

    // Identify which data source to use for Mining Table
    // Preference 1: Detailed Case Analysis (if conformance was run)
    // Preference 2: Discovered Variants (Standard mining result)
    const caseAnalysis = miningData?.case_analysis || miningData?.kpis?.case_analysis || [];
    const variants = miningData?.variants || miningData?.kpis?.variants || [];
    
    const hasDetailedCases = caseAnalysis.length > 0;
    const hasVariants = variants.length > 0;

    // Filter logic
    const filteredCases = caseAnalysis.filter(c => 
        c.case_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredVariants = variants.filter(v => 
        v.path?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-12 space-y-4 animate-pulse">
                <div className="h-8 w-48 bg-theme-border/30 rounded-lg" />
                <div className="h-64 bg-theme-border/20 rounded-xl border border-theme-border/30" />
            </div>
        );
    }

    if (isMining) {
        return (
            <div className="p-6 max-w-7xl mx-auto animate-enter pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                                {hasDetailedCases ? "Trace Intelligence Explorer" : "Process Variant Explorer"}
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase rounded border border-indigo-500/20">Mined</span>
                            </h2>
                            <p className="text-sm text-theme-tertiary">
                                {hasDetailedCases 
                                    ? "Inspecting individual case lifecycles and compliance deviations." 
                                    : "Analyzing unique process paths and frequency distribution."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary" />
                            <input 
                                type="text"
                                placeholder="Search traces or paths..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`pl-9 pr-4 py-2 border rounded-xl text-xs text-theme-primary focus:outline-none focus:border-indigo-500/50 w-64 transition-all ${
                                    theme === 'dark' 
                                        ? 'bg-black/20 border-theme-border' 
                                        : 'bg-gray-100 border-gray-200'
                                }`}
                            />
                        </div>
                    </div>
                </div>

                <div className="app-glass-panel rounded-2xl overflow-hidden border border-theme-border/50 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-[var(--bg-app)]/50 border-b border-theme-border">
                                    <th className="px-6 py-4 font-black text-theme-secondary uppercase tracking-widest">{hasDetailedCases ? "Trace ID" : "Frequency"}</th>
                                    <th className="px-6 py-4 font-black text-theme-secondary uppercase tracking-widest">{hasDetailedCases ? "Conformance" : "Prevalence"}</th>
                                    <th className="px-6 py-4 font-black text-theme-secondary uppercase tracking-widest">Sequence Pattern</th>
                                    <th className="px-6 py-4 font-black text-theme-secondary uppercase tracking-widest text-right">{hasDetailedCases ? "Cycle Time" : "Variant ID"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border/30">
                                {hasDetailedCases ? (
                                    filteredCases.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-500/5 transition-all group">
                                            <td className="px-6 py-5 font-black text-theme-primary">#{c.case_id}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${c.status === 'conformant' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 overflow-hidden max-w-md">
                                                    {c.path?.slice(0, 5).map((step, sIdx) => (
                                                        <React.Fragment key={sIdx}>
                                                            <div className={`px-2 py-1 rounded text-[9px] font-bold border whitespace-nowrap ${step.is_deviation ? 'bg-rose-500 text-white border-rose-400' : 'bg-theme-surface/50 text-theme-secondary border-theme-border'}`}>
                                                                {step.activity}
                                                            </div>
                                                            {sIdx < 4 && sIdx < c.path.length - 1 && <ArrowRight size={10} className="text-theme-tertiary opacity-30 shrink-0" />}
                                                        </React.Fragment>
                                                    ))}
                                                    {c.path?.length > 5 && <span className="text-[10px] font-black text-theme-tertiary">+{c.path.length - 5}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-theme-primary font-bold">
                                                <div className="flex flex-col items-end">
                                                    <span>{c.duration || '---'}</span>
                                                    <span className="text-[9px] text-theme-tertiary uppercase font-black tracking-tighter">Minutes</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredVariants.map((v, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-500/5 transition-all group">
                                            <td className="px-6 py-5 font-black text-theme-primary">{v.count} Cases</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-theme-border/30 rounded-full overflow-hidden w-20">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${v.percentage}%` }} />
                                                    </div>
                                                    <span className="font-bold text-theme-secondary">{v.percentage}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 overflow-hidden max-w-xl">
                                                    {v.path?.split(' -> ').slice(0, 6).map((step, sIdx) => (
                                                        <React.Fragment key={sIdx}>
                                                            <div className="px-2 py-1 rounded text-[9px] font-bold border bg-theme-surface/50 text-theme-secondary border-theme-border whitespace-nowrap">
                                                                {step}
                                                            </div>
                                                            {sIdx < 5 && sIdx < v.path.split(' -> ').length - 1 && <ArrowRight size={10} className="text-theme-tertiary opacity-30 shrink-0" />}
                                                        </React.Fragment>
                                                    ))}
                                                    {v.path?.split(' -> ').length > 6 && <span className="text-[10px] font-black text-theme-tertiary">+{v.path.split(' -> ').length - 6}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-theme-primary font-bold opacity-50">
                                                V-{idx + 1}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {(filteredCases.length === 0 && filteredVariants.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <FlaskConical size={40} className="mb-4" />
                                                <p className="text-sm italic">No trace intelligence or variants found. Please initialize mining for this process.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Standard EPC Mode
    if (!nodes || nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-theme-tertiary">
                <Table className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('noStepsOrNodes', 'No steps or nodes defined for this process.')}</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-enter">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Table className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-theme-primary">{t('processSteps', 'Process Steps')}</h2>
                    <p className="text-sm text-theme-tertiary">{t('processStepsDesc', 'Detailed list of all steps and nodes in this model.')}</p>
                </div>
            </div>

            <div className="app-glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm table-fixed">
                        <thead className="bg-black/20 text-theme-secondary font-medium">
                            <tr>
                                <th className="px-6 py-4 w-16">
                                    <div className="flex items-center gap-2">#</div>
                                </th>
                                <th className="px-6 py-4 w-1/4">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} />
                                        {t('stepName', 'Step Name')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-1/4">
                                    <div className="flex items-center gap-2">
                                        <Type size={14} />
                                        {t('type', 'Type')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-1/2">
                                    <div className="flex items-center gap-2">
                                        <AlignLeft size={14} />
                                        {t('details', 'Description')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {nodes.map((node, index) => (
                                <tr key={node.id || index} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-theme-tertiary">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-theme-primary">
                                        {node.data?.label || node.label || t('unnamed', 'Unnamed Node')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border shadow-sm capitalize ${node.type === 'event' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                            node.type === 'function' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                node.type === 'role' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            {node.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-theme-tertiary">
                                        <div className="flex items-start justify-between gap-2 group/cell">
                                            <span className="flex-1 min-w-0 whitespace-pre-wrap break-words">{node.data?.description || node.description || "-"}</span>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(node.id, node.data?.description || node.description || "")}
                                                    className="p-1.5 hover:bg-white/10 rounded-md text-theme-tertiary hover:text-indigo-400 transition-all"
                                                    title={t('editDescription', 'Edit Description')}
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
