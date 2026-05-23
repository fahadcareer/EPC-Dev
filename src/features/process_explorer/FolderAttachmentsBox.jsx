import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Loader2, Link } from 'lucide-react';
import api from '../../services/api_service';
import NETWORK_URLS from '../../config/network_string';

export default function FolderAttachmentsBox({ folderId, onProcessClick }) {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttachments = async () => {
            if (!folderId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(NETWORK_URLS.FolderAttachments(folderId));
                if (response.data) {
                    setAttachments(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch folder attachments:", err);
                setError("Failed to load attached documents.");
            } finally {
                setLoading(false);
            }
        };

        fetchAttachments();
    }, [folderId]);

    if (loading) {
        return (
            <div className="app-glass-panel p-6 rounded-xl flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-glass-panel p-6 rounded-xl border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (attachments.length === 0) {
        return (
            <div className="app-glass-panel p-6 rounded-xl animate-fade-in mt-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-theme-tertiary" />
                <p className="text-sm font-light text-theme-tertiary">No attached documents found in this folder.</p>
            </div>
        );
    }

    return (
        <div className="app-glass-panel p-6 rounded-xl animate-fade-in mt-6">
            <h3 className="text-lg font-semibold text-theme-primary mb-4 border-b border-theme-border pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Attached Documents
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-theme-secondary">
                    <thead className="text-xs text-theme-tertiary uppercase bg-theme-surface/50">
                        <tr>
                            <th className="px-3 py-2 w-16 rounded-l-lg text-center">S.No</th>
                            <th className="px-3 py-2">Document Name</th>
                            <th className="px-3 py-2">Source Process</th>
                            <th className="px-3 py-2 rounded-r-lg">Attached To</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {attachments.map((att, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-3 py-2 text-center text-theme-tertiary">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium">
                                    <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 hover:underline group"
                                    >
                                        <Link size={14} />
                                        <span>{att.name}</span>
                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </td>
                                <td className="px-3 py-2">
                                    <button
                                        onClick={() => onProcessClick(att.process_id)}
                                        className="text-theme-primary hover:text-indigo-400 font-medium text-left underline decoration-dotted underline-offset-2"
                                    >
                                        {att.process_name}
                                    </button>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="text-[10px] bg-theme-bg-tertiary px-2 py-0.5 rounded text-theme-tertiary uppercase font-bold tracking-wider">
                                        {att.source}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
