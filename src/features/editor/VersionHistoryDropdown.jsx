import React, { useState } from 'react';
import { History, Eye, Clock, User, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VersionHistoryDropdown = ({ snapshots, onPreview, onOpenSidebar, currentVersionId, t }) => {
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 transition-all rounded-full flex items-center gap-1 ${
                    isOpen 
                    ? 'bg-indigo-500/20 text-indigo-400' 
                    : 'text-theme-tertiary hover:text-indigo-400 hover:bg-theme-bg-tertiary'
                }`}
                title={t ? t('versionHistory') : "Version History"}
            >
                <History className="w-5 h-5" />
                {snapshots?.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-[10px] text-white rounded-full flex items-center justify-center font-bold border-2 border-theme-surface">
                        {snapshots.length}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-[100]" 
                            onClick={() => setIsOpen(false)} 
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-theme-surface border border-theme-border rounded-2xl shadow-2xl z-[101] overflow-hidden"
                        >
                            <div className="p-4 border-b border-theme-border bg-theme-bg-tertiary/30">
                                <h3 className="text-sm font-bold text-theme-primary flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    Version Snapshots
                                </h3>
                                <p className="text-[10px] text-theme-tertiary uppercase tracking-widest font-semibold mt-1">Historically Approved Models</p>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                                {snapshots?.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <History className="w-8 h-8 text-theme-tertiary mx-auto mb-2 opacity-20" />
                                        <p className="text-xs text-theme-tertiary">No history available</p>
                                    </div>
                                ) : (
                                    snapshots.map((snapshot) => (
                                        <button
                                            key={snapshot._id}
                                            onClick={() => {
                                                onPreview(snapshot);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left p-3 rounded-xl transition-all mb-1 flex flex-col gap-1 group ${
                                                snapshot._id === currentVersionId
                                                ? 'bg-indigo-500/10 border border-indigo-500/30'
                                                : 'hover:bg-theme-bg-tertiary border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-theme-primary flex items-center gap-1">
                                                        v{snapshot.version || '1.0'}
                                                        {snapshot._id === currentVersionId && (
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        )}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase">Approved</span>
                                                </div>
                                                <span className="text-[9px] text-theme-tertiary font-medium">
                                                    {new Date(snapshot.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <p className="text-[11px] text-theme-secondary line-clamp-1 italic">
                                                "{getSummary(snapshot)}"
                                            </p>

                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-1 text-theme-tertiary">
                                                    <User className="w-2.5 h-2.5" />
                                                    <span className="text-[9px] truncate max-w-[100px]">{snapshot.created_by_name || "System"}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[9px] text-indigo-400 font-bold flex items-center gap-1">
                                                        <Eye className="w-2.5 h-2.5" /> View
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="p-2 bg-theme-bg-tertiary/20 border-t border-theme-border flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        onOpenSidebar();
                                        setIsOpen(false);
                                    }}
                                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    <Clock className="w-3 h-3" />
                                    View Full Timeline
                                </button>
                                <p className="text-[9px] text-theme-tertiary text-center leading-relaxed italic">
                                    Preview mode is read-only.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VersionHistoryDropdown;
