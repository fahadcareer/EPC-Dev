import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen, Layers, Cpu, HelpCircle, Activity, Info, Shield, X } from 'lucide-react';

const TOC = [
    {
        id: 'welcome-access',
        label: 'Welcome & Access',
        icon: <Info size={18} />,
        children: [
            { id: 'welcome', label: 'Welcome to Tasree3 Process Reengineering' },
            { id: 'sign-up', label: 'Signing Up' },
            { id: 'login', label: 'Logging In' },
        ]
    },
    {
        id: 'getting-started',
        label: 'Getting Started',
        icon: <Activity size={18} />,
        children: [
            { id: 'user-roles', label: 'Understanding User Roles' },
            { id: 'nav-bar', label: 'Navigation Bar' },
            { id: 'workspace-overview', label: 'Workspace Overview' },
        ]
    },
    {
        id: 'explorer',
        label: 'Explorer Overview',
        icon: <BookOpen size={18} />,
        children: [
            { id: 'explorer-menu', label: 'The Explorer Menu' },
            { id: 'diagram-details', label: 'Viewing Diagram Details' },
            { id: 'folder-mgmt', label: 'Working with Folders' },
        ]
    },
    {
        id: 'modeling',
        label: 'Modeling',
        icon: <Layers size={18} />,
        children: [
            { id: 'create-diagram', label: 'Create a Diagram' },
            { id: 'ai-assisted', label: 'AI-Assisted Modeler' },
            { id: 'bpmn-modeling', label: 'BPMN 2.0 Modeling' },
            { id: 'smart-layout', label: 'Smart Layout Engine' },
            { id: 'editor-overview', label: 'Editor Overview' },
        ]
    },
    {
        id: 'process-mining',
        label: 'Process Mining',
        icon: <Activity size={18} />,
        children: [
            { id: 'mining-overview', label: 'Mining Overview' },
            { id: 'log-upload', label: 'Uploading Event Logs' },
            { id: 'process-discovery', label: 'Discovery & Maps' },
            { id: 'conformance-checking', label: 'Conformance Checking' },
            { id: 'ai-mining-insights', label: 'AI Mining Insights' },
        ]
    },
    {
        id: 'canvas-ops',
        label: 'Canvas Operations',
        icon: <Activity size={18} />,
        children: [
            { id: 'shortcuts', label: 'Shortcuts' },
            { id: 'add-connect', label: 'Add and Connect' },
            { id: 'move-change', label: 'Move and Change' },
            { id: 'format', label: 'Format Diagrams' },
        ]
    },
    {
        id: 'advanced-governance',
        label: 'Advanced & Governance',
        icon: <Shield size={18} />,
        children: [
            { id: 'hierarchies', label: 'Process Hierarchies' },
            { id: 'subprocesses', label: 'Sub-processes & FADs' },
            { id: 'conventions', label: 'Modeling Conventions' },
            { id: 'workflow', label: 'Review Workflow' },
            { id: 'reporting-export', label: 'Reporting & Export' },
            { id: 'audit', label: 'Audit Trail' },
        ]
    },
    {
        id: 'admin-settings',
        label: 'Administration & Settings',
        icon: <Shield size={18} />,
        children: [
            { id: 'org-mgmt', label: 'Organization Management' },
            { id: 'custom-attributes', label: 'Custom Attributes' },
            { id: 'ai-analytics-admin', label: 'AI Usage & Analytics' },
            { id: 'pdf-branding', label: 'PDF Branding Control' },
            { id: 'meta-templates', label: 'Meta Templates' },
            { id: 'profile-settings', label: 'Profile Preferences' },
        ]
    }
];



export default function HelpSidebar({ activeTopic, onSelectTopic, isMobile, onClose }) {
    const [expanded, setExpanded] = useState({ modeling: true, 'canvas-ops': true, 'advanced-governance': true });
    const [searchQuery, setSearchQuery] = useState('');

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelect = (topicId) => {
        onSelectTopic(topicId);
        if (isMobile && onClose) onClose();
    };

    const filteredTOC = TOC.map(group => ({
        ...group,
        children: group.children.filter(child =>
            child.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.children.length > 0 || group.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-app-surface border-r border-theme-border transition-colors duration-300">
            {/* Minimal Search */}
            <div className="p-6 pb-2">
                <div className="relative group">
                    <Search className={`absolute left-0 top-1/2 -translate-y-1/2 text-theme-tertiary transition-colors ${searchQuery ? 'text-theme-accent' : 'group-focus-within:text-theme-accent'}`} size={14} />
                    <input
                        type="text"
                        placeholder="Search manuals..."
                        className="w-full pl-6 pr-8 py-2 bg-transparent border-b border-theme-border focus:border-theme-accent text-sm focus:outline-none transition-all placeholder:text-theme-tertiary font-medium text-theme-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-theme-tertiary hover:text-rose-500 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Neat Navigation Tree */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
                {filteredTOC.map(group => (
                    <div key={group.id} className="mb-6">
                        <button
                            onClick={() => toggleExpand(group.id)}
                            className="w-full flex items-center justify-between px-2 py-2 text-theme-tertiary hover:text-theme-primary transition-colors text-[10px] font-black uppercase tracking-widest text-left"
                        >
                            <span className="flex items-center gap-2">
                                {group.label}
                            </span>
                            <span className="opacity-50 text-theme-tertiary">
                                {expanded[group.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </span>
                        </button>

                        {expanded[group.id] && (
                            <div className="mt-1 space-y-0.5">
                                {group.children.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => handleSelect(child.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all ${activeTopic === child.id
                                            ? 'bg-theme-accent/10 text-theme-accent font-bold shadow-sm shadow-indigo-500/5'
                                            : 'text-theme-secondary hover:bg-theme-input/50 hover:text-theme-primary'
                                            }`}
                                    >
                                        {child.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
