import React, { useState, useEffect } from "react";
import { Clock, User as UserIcon, Activity, Calendar, Database, ShieldCheck, ArrowRight } from "lucide-react";
import NETWORK_URLS from "../../config/network_string";
import { fetchMiningAnalysis } from "../../services/miningService";
import { useTranslation } from "react-i18next";

export default function HistoryView({ process }) {
    const { t } = useTranslation();
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [miningHistory, setMiningHistory] = useState([]);

    const isMining = process.diagram_type === 'mining';

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Load Users
                const api = (await import("../../services/api_service")).default;
                const res = await api.get(NETWORK_URLS.WorkflowUsers);
                if (Array.isArray(res.data)) {
                    const userMap = {};
                    res.data.forEach(u => {
                        userMap[u.value] = u.email || u.label;
                    });
                    setUsers(userMap);
                }

                // If Mining, fetch specialized mining history/stats
                if (isMining) {
                    const { data } = await fetchMiningAnalysis(process._id);
                    const syntheticEvents = [];

                    if (process.created_at) {
                        syntheticEvents.push({
                            user_name: "System Intake",
                            action: "LOG_INGESTION",
                            timestamp: process.created_at,
                            details: `Event logs ingested. Scope: ${data.kpis?.total_cases || '---'} cases.`,
                            icon: Database,
                            color: "blue"
                        });
                    }

                    if (data.generated_at) {
                        syntheticEvents.push({
                            user_name: "Mining Engine",
                            action: "DISCOVERY_COMPLETED",
                            timestamp: data.generated_at,
                            details: "Heuristic discovery completed. Baseline generated.",
                            icon: Activity,
                            color: "indigo"
                        });
                    }

                    setMiningHistory(syntheticEvents);
                }
            } catch (err) {
                console.error("Failed to load history data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [process._id, isMining]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const standardHistory = (process.history || []).map(item => ({
        ...item,
        icon: UserIcon,
        color: "slate"
    }));

    const allHistory = [...standardHistory, ...miningHistory].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    if (loading) {
        return (
            <div className="p-20 text-center animate-pulse">
                <Clock className="w-10 h-10 text-indigo-500/20 mx-auto mb-4 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-theme-tertiary">Loading Audit Trail...</p>
            </div>
        );
    }

    if (allHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-theme-tertiary">
                <div className="p-4 bg-theme-border/10 rounded-full mb-6">
                    <Clock className="w-12 h-12 opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-theme-primary mb-1">{t('noActivityHistory', 'No Activity History')}</h3>
                <p className="text-sm max-w-xs text-center">{t('noHistoryPrompt', "We couldn't find any historical events for this process.")}</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-enter">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                    <Activity className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-theme-primary tracking-tight">{t('workflowHistory', 'Workflow History')}</h2>
                    <p className="text-sm text-theme-tertiary">{t('trackChanges', 'Track all changes and updates aimed at this model')}</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#cacaca] dark:bg-[#2d3139]">
                                <th className="px-8 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-start">{t('user', 'User')}</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-start">{t('action', 'Action')}</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-start">{t('dateTime', 'Date & Time')}</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-start">{t('details', 'Details')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-glass)]">
                            {allHistory.map((item, idx) => {
                                const userName = users[item.user_id] || item.user_name || "System Analyst";
                                return (
                                    <tr key={idx} className="hover:bg-indigo-500/[0.02] transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-500 shadow-sm">
                                                    {getInitials(userName)}
                                                </div>
                                                <span className="text-sm font-medium text-theme-primary">{userName}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                item.action === 'LOG_INGESTION' ? 'bg-blue-500/10 text-blue-500' :
                                                item.action === 'DISCOVERY_COMPLETED' ? 'bg-indigo-500/10 text-indigo-500' :
                                                'bg-indigo-500/5 text-indigo-500'
                                            }`}>
                                                {item.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-medium text-theme-secondary">
                                                <Calendar size={14} className="text-theme-tertiary" />
                                                {formatDate(item.timestamp)}
                                            </div>
                                        </td>

                                        <td className="px-8 py-4">
                                            <p className="text-xs text-theme-tertiary leading-relaxed max-w-md">
                                                {typeof item.details === 'object' ? JSON.stringify(item.details) : item.details}
                                            </p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
