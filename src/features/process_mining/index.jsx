/**
 * Process Mining — Page Wrapper (index.jsx)
 * -----------------------------------------
 * Two-tab layout: Upload | Dashboard
 * Consistent with the EPC platform's dark glass-morphism aesthetic.
 */
import React, { useState } from 'react';
import { Upload, BarChart3, FlaskConical } from 'lucide-react';
import UploadLogs from './UploadLogs';
import MiningDashboard from './MiningDashboard';

const TABS = [
    { id: 'upload',    label: 'Upload Logs',  icon: Upload },
    { id: 'dashboard', label: 'Dashboard',    icon: BarChart3 },
];

export default function ProcessMining() {
    const [activeTab, setActiveTab] = useState('upload');
    // When logs are uploaded successfully, auto-switch to dashboard with that ID
    const [uploadedPid, setUploadedPid] = useState('');

    const handleUploaded = (pid) => {
        setUploadedPid(pid);
        setActiveTab('dashboard');
    };

    return (
        <div className="min-h-screen bg-[#0f1117] text-slate-200">
            {/* ── Page Header ──────────────────────────────────────── */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm px-8 py-5">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20">
                        <FlaskConical className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-100">Process Mining</h1>
                        <p className="text-xs text-slate-500">
                            Discover patterns, detect bottlenecks, and compute KPIs from event logs
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-6">
                {/* ── Tab Bar ──────────────────────────────────────── */}
                <div className="flex gap-1 mb-6 bg-slate-900 rounded-xl p-1 border border-slate-800 w-fit">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeTab === id
                                    ? 'bg-slate-700 text-slate-100 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ───────────────────────────────────── */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    {activeTab === 'upload' && (
                        <UploadLogs onUploaded={handleUploaded} />
                    )}
                    {activeTab === 'dashboard' && (
                        <MiningDashboard initialProcessId={uploadedPid} />
                    )}
                </div>
            </div>
        </div>
    );
}
