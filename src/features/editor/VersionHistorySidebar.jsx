import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    ChevronLeft,
    History,
    Eye,
    RotateCcw,
    User,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    ShieldCheck,
    Archive,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import api from '../../services/api_service';
import ReactMarkdown from 'react-markdown';

const VersionHistorySidebar = ({ processId, onClose, onPreview, onRestore, currentVersionId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [panelWidth, setPanelWidth] = useState(380);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = panelWidth;

        const handleMouseMove = (moveEvent) => {
            const deltaX = startX - moveEvent.clientX;
            setPanelWidth(Math.max(300, Math.min(startWidth + deltaX, 800)));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
    }, [panelWidth]);

    // Sync selected card when a new item is previewed externally (e.g. initial load)
    useEffect(() => {
        if (currentVersionId && history.length > 0 && !selectedVersion) {
            const active = history.find(h => h._id === currentVersionId);
            if (active) setSelectedVersion(active);
        }
    }, [currentVersionId, history]);

    const getSummary = (item) => {
        const summary = item.version_changes?.summary || item.name || "Checkpoint snapshot";
        let displaySummary = "";

        if (typeof summary === 'string') {
            displaySummary = summary;
        } else if (summary && typeof summary === 'object') {
            displaySummary = summary.summary || summary.changes || JSON.stringify(summary);
        } else {
            displaySummary = "Checkpoint snapshot";
        }

        // Strip [Archived] or [Restored] prefixes for cleaner look
        return displaySummary.replace(/^\[Archived\]\s*/i, "").replace(/^\[Restored\]\s*/i, "");
    };

    const getFullDetails = (item) => {
        const analysis = item.version_changes?.ai_analysis;
        if (analysis) {
            if (typeof analysis === 'string') return analysis;
            if (typeof analysis === 'object') {
                return analysis.analysis || analysis.text || analysis.summary || JSON.stringify(analysis, null, 2);
            }
        }
        return getSummary(item);
    };

    useEffect(() => {
        fetchHistory();
    }, [processId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/processes/${processId}/snapshots`);
            setHistory(res.data || []);
        } catch (error) {
            console.error("Failed to fetch version history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId) => {
        if (!window.confirm("This will create a new draft from this version. Continue?")) return;

        try {
            const res = await api.post(`/processes/${versionId}/restore`);
            onRestore(res.data.process_id);
        } catch (error) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Restoration failed";
            window.alert(errorMsg);
            console.error("Restoration failed:", error);
        }
    };

    const filteredHistory = [...history]
        .filter(v => {
            const status = String(v.status || '').toLowerCase();
            return status === 'approved' || status === 'archived';
        })
        .filter(v => {
            const term = searchTerm.toLowerCase();
            const safeVersion = String(v.version || '').toLowerCase();
            const safeSummary = String(v.version_changes?.summary || '').toLowerCase();
            const safeStatus = String(v.status || '').toLowerCase();
            return safeVersion.includes(term) || safeSummary.includes(term) || safeStatus.includes(term);
        })
        .sort((a, b) => {
            // Sort by semantic version number (descending)
            if (a.version && b.version) {
                const partsA = String(a.version).split('.').map(Number);
                const partsB = String(b.version).split('.').map(Number);
                if (partsA[0] !== partsB[0]) return (partsB[0] || 0) - (partsA[0] || 0);
                return (partsB[1] || 0) - (partsA[1] || 0);
            }
            // Fallback to sorting by creation date (descending)
            return new Date(b.created_at) - new Date(a.created_at);
        });

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed top-20 right-4 bottom-4 bg-app-glass backdrop-blur-xl border border-theme-border rounded-3xl shadow-theme-card z-[100] flex flex-col overflow-hidden transition-[width] duration-0"
            style={{ width: `${panelWidth}px` }}
        >
            {/* Drag Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-theme-primary/10 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={handleMouseDown}
            >
                <div className="w-0.5 h-8 bg-theme-primary/20 group-hover:bg-theme-primary/50 rounded-full" />
            </div>

            {/* Header */}
            <div className="p-6 border-b border-theme-border/50 bg-theme-primary/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-theme-accent/20 rounded-xl flex items-center justify-center">
                            <History className="w-5 h-5 text-theme-accent" />
                        </div>
                        <div>
                            <h3 className="font-bold text-theme-primary tracking-tight">Timeline History</h3>
                            <p className="text-xs text-theme-tertiary uppercase tracking-widest font-semibold mt-0.5">Process Lifecycle</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-theme-primary/10 rounded-full transition-colors text-theme-tertiary hover:text-theme-primary"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary group-focus-within:text-theme-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="Search versions, changes..."
                        className="w-full bg-theme-input border border-theme-input-border rounded-2xl py-2.5 pl-10 pr-4 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-all placeholder:text-theme-tertiary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List or Details */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {selectedVersion ? (
                        <motion.div
                            key="details"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col h-full space-y-6"
                        >
                            {/* Back Button */}
                            <button
                                onClick={() => setSelectedVersion(null)}
                                className="inline-flex items-center gap-2 px-2 py-1 text-sm text-theme-tertiary hover:text-theme-primary transition-colors group self-start"
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back to versions
                            </button>

                            {/* Header Info */}
                            <div className="flex flex-col gap-4 border-b border-theme-border pb-6">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${selectedVersion.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                        selectedVersion.status === 'Draft' ? 'bg-theme-accent/20 text-theme-accent' :
                                            'bg-theme-tertiary/20 text-theme-tertiary'
                                        }`}>
                                        {selectedVersion.status}
                                    </span>
                                    {selectedVersion.version && (
                                        <span className="text-xl font-bold text-theme-primary">v{selectedVersion.version}</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-theme-secondary text-sm font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(selectedVersion.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-theme-secondary text-sm font-medium">
                                        <User className="w-4 h-4" />
                                        <span>{selectedVersion.created_by_name || "System"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRestore(selectedVersion._id)}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors w-fit border border-emerald-500/30"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restore As Draft
                                </button>
                            </div>

                            {/* Full Scrollable Summary */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                                <div>
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-3xl font-black mb-6 mt-8 first:mt-0 tracking-tight text-theme-primary" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 mt-8 first:mt-0 border-b border-theme-border pb-2 text-theme-primary/90" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-6 text-theme-accent" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-sm text-theme-secondary" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-6 space-y-2 ml-4 text-sm text-theme-secondary" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside mb-6 space-y-2 ml-4 text-sm text-theme-secondary" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-sm text-theme-secondary" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-bold text-theme-primary" {...props} />,
                                            blockquote: ({ node, ...props }) => (
                                                <blockquote className="border-l-4 border-theme-accent pl-6 py-2 italic my-6 bg-theme-accent/5 rounded-r-xl" {...props} />
                                            ),
                                            hr: ({ node, ...props }) => <hr className="my-8 border-theme-border" {...props} />,
                                            code: ({ node, inline, ...props }) => (
                                                <code className={`rounded px-1.5 py-0.5 font-mono text-sm ${inline
                                                        ? 'bg-theme-input text-theme-accent'
                                                        : 'block bg-theme-input p-4 border border-theme-input-border rounded-xl my-4'
                                                    }`} {...props} />
                                            )
                                        }}
                                    >
                                        {getFullDetails(selectedVersion)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="space-y-3"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 text-theme-tertiary gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
                                    <span className="text-sm font-medium">Scanning snapshots...</span>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="text-center py-12 text-theme-tertiary">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">No historical snapshots found</p>
                                </div>
                            ) : (
                                filteredHistory.map((item, index) => (
                                    <motion.button
                                        key={item._id}
                                        onClick={() => {
                                            onPreview(item);
                                            setSelectedVersion(item);
                                        }}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-theme-accent/50 ${item._id === currentVersionId
                                            ? "bg-theme-accent/10 border-theme-accent/50 shadow-glow-indigo"
                                            : "bg-theme-bg-tertiary border-theme-border hover:border-theme-highlight hover:bg-theme-surface"
                                            }`}
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex items-start justify-between relative z-10 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    item.status === 'Draft' ? 'bg-theme-accent/20 text-theme-accent' :
                                                        'bg-theme-tertiary/20 text-theme-tertiary'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                                {item.version && (
                                                    <span className="text-xs font-bold text-theme-primary/60">v{item.version}</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-theme-tertiary font-medium">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-1.5 text-theme-tertiary">
                                                <User className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-medium max-w-[100px] truncate">
                                                    {item.created_by_name || "System"}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 bg-theme-primary/5 text-[10px] text-theme-tertiary text-center leading-relaxed">
                Click a version card to preview it. Restoration creates a new draft in your Workspace.
            </div>
        </motion.div>
    );
};

export default VersionHistorySidebar;
