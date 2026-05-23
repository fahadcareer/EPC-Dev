import React, { useState, useEffect } from 'react';
import { Upload, BarChart3, FlaskConical, Filter, Download, Play, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadLogs from '../process_mining/UploadLogs';
import MiningDashboard from '../process_mining/MiningDashboard';
import { toast } from 'react-toastify';

/**
 * MiningView Component
 * -------------------
 * Provides a dedicated Process Mining canvas within the Process Explorer.
 * Scoped to a specific processId.
 */
export default function MiningView({ processId, activeTab = 0 }) {
    // Tab mapping: 0 -> Discovery, 1 -> Analysis, 2 -> Configuration
    const [uploadedPid, setUploadedPid] = useState(processId);

    useEffect(() => {
        setUploadedPid(processId);
    }, [processId]);

    const handleUploaded = (pid) => {
        // pid returned from upload might be the same as processId or a sub-id
        // In our new architecture, it should be associated with the processId
        toast.success("Logs uploaded and processed successfully!", {
             position: "bottom-right",
             autoClose: 3000
        });
        // We might want to force a refresh of the dashboard
    };

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in">
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
                 <MiningDashboard processId={processId} viewMode="all" />
            </div>
        </div>
    );
}
