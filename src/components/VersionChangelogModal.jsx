import { X, Info, Sparkles, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function VersionChangelogModal({ isOpen, onClose, versionChanges, processId }) {
    const { theme } = useTheme();
    const [history, setHistory] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && processId) {
            setLoading(true);
            const fetchHistory = async () => {
                try {
                    const api = (await import("../services/api_service")).default;
                    const NETWORK_URLS = (await import("../config/network_string")).default;
                    // Construct URL manually since it's a new endpoint not in config yet
                    const res = await api.get(`${NETWORK_URLS.GetProcesses}${processId}/version-history`);
                    if (Array.isArray(res.data)) {
                        // Dedup based on to_version to fix potential duplicate entries
                        const uniqueMap = new Map();
                        res.data.forEach(item => {
                            if (!uniqueMap.has(item.to_version)) {
                                uniqueMap.set(item.to_version, item);
                            }
                        });
                        const uniqueHistory = Array.from(uniqueMap.values());

                        // Sort by version descending (newest first)
                        const sorted = uniqueHistory.sort((a, b) => {
                            const vA = parseFloat(a.to_version);
                            const vB = parseFloat(b.to_version);
                            return vB - vA;
                        });
                        setHistory(sorted);

                        // Default to the first one (latest) or the one passed in
                        if (sorted.length > 0) {
                            setSelectedVersion(sorted[0]);
                        } else if (versionChanges) {
                            setSelectedVersion(versionChanges);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch version history", err);
                    // Fallback to passed versionChanges
                    if (versionChanges) setSelectedVersion(versionChanges);
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        } else if (isOpen && versionChanges) {
            // Fallback if no processId provided
            setSelectedVersion(versionChanges);
        }
    }, [isOpen, processId, versionChanges]);



    if (!isOpen || !selectedVersion) return null;

    // Handle clicks outside modal
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const displayData = selectedVersion;
    let aiAnalysis = displayData.ai_analysis || displayData.summary || "No summary available";
    
    // Intelligent extraction: handle if the data is an object or a stringified object
    if (typeof aiAnalysis === 'object' && aiAnalysis !== null) {
        aiAnalysis = aiAnalysis.ai_analysis || aiAnalysis.summary || JSON.stringify(aiAnalysis, null, 2);
    }

    if (typeof aiAnalysis === 'string' && aiAnalysis.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(aiAnalysis);
            aiAnalysis = parsed.ai_analysis || parsed.summary || aiAnalysis;
        } catch (e) {
            // Keep as is if parsing fails
        }
    }

    const isAI = displayData.method === "ai";

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade-in p-4"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className={`rounded-3xl w-full max-w-4xl mx-auto shadow-2xl animate-scale-in flex flex-col border ${theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-neutral-900 border-white/10'
                }`}>
                {/* Header */}
                <div className={`border-b p-6 flex justify-between items-center flex-shrink-0 ${theme === 'light'
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-gray-200 rounded-t-3xl'
                    : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-white/10 rounded-t-3xl'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                            isAI ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                            {isAI ? <Sparkles size={24} /> : <Info size={24} />}
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Version Changes
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                {history.length > 1 ? (
                                    <select
                                        className={`rounded-lg px-2 py-0.5 border text-xs focus:outline-none transition-all font-bold ${theme === 'light'
                                            ? 'bg-white border-gray-300 text-gray-700'
                                            : 'bg-neutral-800 border-white/5 text-gray-300'
                                            }`}
                                        onChange={(e) => {
                                            const ver = history.find(h => h.to_version === e.target.value);
                                            if (ver) setSelectedVersion(ver);
                                        }}
                                        value={displayData?.to_version}
                                    >
                                        {history.map((ver, idx) => (
                                            <option key={idx} value={ver.to_version}>
                                                v{ver.from_version} → v{ver.to_version}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-xs font-bold text-neutral-500 bg-neutral-500/10 px-2 py-0.5 rounded-md">
                                        v{displayData.from_version} → v{displayData.to_version}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2.5 rounded-xl transition-all ${theme === 'light'
                            ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
                            : 'hover:bg-white/10 text-neutral-500 hover:text-white'
                            }`}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar min-h-[300px] max-h-[70vh]">
                    <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-3xl font-black mb-6 mt-8 first:mt-0 tracking-tight" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 mt-8 first:mt-0 border-b border-current pb-2 opacity-90" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-6 text-indigo-400" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-base opacity-80" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-6 space-y-2 ml-4" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside mb-6 space-y-2 ml-4" {...props} />,
                                li: ({ node, ...props }) => <li className="text-base opacity-80" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-indigo-500 pl-6 py-2 italic my-6 bg-indigo-500/5 rounded-r-xl" {...props} />
                                ),
                                hr: ({ node, ...props }) => <hr className="my-8 border-white/5" {...props} />,
                                code: ({ node, inline, ...props }) => (
                                    <code className={`rounded px-1.5 py-0.5 font-mono text-sm ${
                                        inline 
                                        ? 'bg-neutral-800 text-indigo-300' 
                                        : 'block bg-neutral-950 p-4 border border-white/5 rounded-xl my-4'
                                    }`} {...props} />
                                )
                            }}
                        >
                            {aiAnalysis}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Footer */}
                <div className={`border-t p-6 backdrop-blur-sm flex justify-between items-center flex-shrink-0 ${theme === 'light'
                    ? 'bg-gray-50/80 border-gray-200'
                    : 'bg-neutral-950/50 border-white/5'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                             <Clock size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Archived Date</span>
                            <span className={`text-xs font-bold ${theme === 'light' ? 'text-gray-700' : 'text-neutral-300'}`}>
                                {new Date(displayData.timestamp).toLocaleString('en-US', {
                                    month: 'long', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-95"
                    >
                        Success
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
