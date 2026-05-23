import React, { useState } from 'react';
import { Upload, Link2, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import UploadLogs from './UploadLogsContent'; // I will rename old UploadLogs to this
import IntegrationList from './integrations/IntegrationList';
import ConnectIntegration from './integrations/ConnectIntegration';
import { fetchIntegrationLogs } from './integrations/integrationService';
import { uploadLogs } from '../../services/miningService';

export default function DataSourceSelector({ onUploaded, processId, compact = false }) {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'integrations'
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleIntegrationSelect = (integration) => {
        setSelectedIntegration(integration);
    };

    const handleFetchLogs = async (config) => {
        setLoading(true);
        try {
            const { data } = await fetchIntegrationLogs(selectedIntegration.id, config);

            if (data.logs && data.logs.length > 0) {
                // Now send normalized logs to the mining engine
                const uploadRes = await uploadLogs(processId, data.logs);
                toast.success(`Successfully fetched ${data.logs.length} logs and sent to engine!`);
                if (onUploaded) onUploaded(processId);
                // Go back to list or show success
                setSelectedIntegration(null);
            } else {
                toast.warn('Integration returned no logs.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to fetch integration logs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`overflow-hidden transition-all border ${compact ? 'rounded-2xl' : 'rounded-3xl'}`}
            style={{ backgroundColor: 'transparent', borderColor: 'var(--border-glass)' }}>

            {/* Tab Selector */}
            <div className="flex border-b backdrop-blur-md" style={{ backgroundColor: 'rgba(var(--bg-rgb), 0.8)', borderColor: 'var(--border-glass)' }}>
                <button
                    onClick={() => { setActiveTab('upload'); setSelectedIntegration(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 ${compact ? 'py-3' : 'py-4'} text-[11px] font-bold uppercase tracking-[0.05em] transition-all relative overflow-hidden group ${activeTab === 'upload'
                            ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white/5'
                            : 'text-slate-500 hover:text-indigo-400'
                        }`}
                >
                    <Upload className={`${activeTab === 'upload' ? 'w-3.5 h-3.5' : 'w-3 h-3'} transition-all`} />
                    Upload Logs
                </button>
                <button
                    onClick={() => { setActiveTab('integrations'); setSelectedIntegration(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 ${compact ? 'py-3' : 'py-4'} text-[11px] font-bold uppercase tracking-[0.05em] transition-all relative overflow-hidden group ${activeTab === 'integrations'
                            ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white/5'
                            : 'text-slate-500 hover:text-indigo-400'
                        }`}
                >
                    <Link2 className={`${activeTab === 'integrations' ? 'w-3.5 h-3.5' : 'w-3 h-3'} transition-all`} />
                    Connect Apps
                </button>
            </div>

            {/* Content Area */}
            <div className={`${compact ? 'p-5' : 'p-6 md:p-8'}`}>
                {activeTab === 'upload' ? (
                    <UploadLogs onUploaded={onUploaded} processId={processId} compact={compact} />
                ) : (
                    !selectedIntegration ? (
                        <div className="space-y-6">
                            <IntegrationList onSelect={handleIntegrationSelect} compact={compact} />
                        </div>
                    ) : (
                        <ConnectIntegration
                            integration={selectedIntegration}
                            onBack={() => setSelectedIntegration(null)}
                            onFetch={handleFetchLogs}
                            compact={compact}
                        />
                    )
                )}
            </div>

            {/* Footer / Tip */}
            {!compact && (
                <div className="px-8 py-4 border-t flex items-center gap-3" style={{ backgroundColor: 'rgba(var(--bg-rgb), 0.3)', borderColor: 'var(--border-glass)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60" style={{ color: 'var(--text-secondary)' }}>
                        Standardized Input: case_id, activity, timestamp
                    </p>
                </div>
            )}
        </div>
    );
}
