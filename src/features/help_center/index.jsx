import React, { useState, useEffect } from 'react';
import HelpSidebar from './HelpSidebar';
import HelpContent from './HelpContent';
import { HelpCircle, ChevronLeft, Home, ChevronRight, Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const TOPIC_GROUPS = {
    'welcome': 'Welcome & Access', 'sign-up': 'Welcome & Access', 'login': 'Welcome & Access',
    'user-roles': 'Getting Started', 'nav-bar': 'Getting Started', 'workspace-overview': 'Getting Started',
    'explorer-menu': 'Explorer Overview', 'diagram-details': 'Explorer Overview', 'folder-mgmt': 'Explorer Overview',
    'create-diagram': 'Modeling', 'ai-assisted': 'Modeling', 'editor-overview': 'Modeling',
    'shortcuts': 'Canvas Operations', 'add-connect': 'Canvas Operations', 'move-change': 'Canvas Operations', 'format': 'Canvas Operations',
    'hierarchies': 'Advanced & Governance', 'subprocesses': 'Advanced & Governance', 'conventions': 'Advanced & Governance', 'workflow': 'Advanced & Governance', 'reporting-export': 'Advanced & Governance', 'audit': 'Advanced & Governance',
    'org-mgmt': 'Administration & Settings', 'meta-templates': 'Administration & Settings', 'profile-settings': 'Administration & Settings'
};

const TOPIC_LABELS = {
    'welcome': 'Welcome to Tasree3 Process Reengineering', 'sign-up': 'Signing Up', 'login': 'Logging In',
    'user-roles': 'Understanding User Roles', 'nav-bar': 'Navigation Bar', 'workspace-overview': 'Workspace Overview',
    'explorer-menu': 'The Explorer Menu', 'diagram-details': 'Viewing Diagram Details', 'folder-mgmt': 'Working with Folders',
    'create-diagram': 'Create a Diagram', 'ai-assisted': 'AI-Assisted Modeler', 'editor-overview': 'Editor Overview',
    'shortcuts': 'Shortcuts', 'add-connect': 'Add and Connect', 'move-change': 'Move and Change', 'format': 'Format Diagrams',
    'hierarchies': 'Process Hierarchies', 'subprocesses': 'Sub-processes & FADs', 'conventions': 'Modeling Conventions', 'workflow': 'Review Workflow', 'reporting-export': 'Reporting & Export', 'audit': 'Audit Trail',
    'org-mgmt': 'Organization Management', 'meta-templates': 'Meta Templates', 'profile-settings': 'Profile Preferences'
};

export default function HelpCenter() {
    const { theme, toggleTheme } = useTheme();
    const [activeTopic, setActiveTopic] = useState('welcome');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("token");

    // Close sidebar on topic change for mobile
    const handleSelectTopic = (topic) => {
        setActiveTopic(topic);
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-transparent font-sans text-theme-primary overflow-hidden transition-colors duration-300">
            {/* Standalone Minimal Header */}
            <header className="h-16 border-b border-theme-border flex items-center justify-between px-4 md:px-6 bg-app-surface z-50">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 lg:hidden hover:bg-theme-input rounded-lg text-theme-tertiary transition-all"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <button
                        onClick={() => navigate(isAuthenticated ? "/workspace" : "/login")}
                        className="p-2 hover:bg-theme-input rounded-lg text-theme-tertiary hover:text-theme-primary transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <ChevronLeft size={18} className="hidden sm:block" />
                        <span className="hidden sm:inline">{isAuthenticated ? "Back to Workspace" : "Login to Tasree3"}</span>
                        <Home size={18} className="sm:hidden" />
                    </button>

                    <div className="h-4 w-[1px] bg-theme-border mx-1 md:mx-2" />

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shrink-0">
                            <HelpCircle size={18} />
                        </div>
                        <span className="font-black text-lg tracking-tighter truncate">HELP CENTER</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-input rounded-lg transition-all"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Neat Sidebar Container */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-72 bg-app-surface border-r border-theme-border transform transition-transform duration-300 lg:relative lg:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <HelpSidebar
                        activeTopic={activeTopic}
                        onSelectTopic={handleSelectTopic}
                        isMobile={true}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </aside>

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content Scroll Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
                    {/* Secondary Breadcrumb bar */}
                    <div className="h-10 md:h-12 flex items-center px-6 md:px-12 gap-2 text-[10px] md:text-[11px] font-bold text-theme-tertiary uppercase tracking-widest bg-app-surface border-b border-theme-border overflow-hidden whitespace-nowrap">
                        <Home size={12} className="shrink-0" />
                        <ChevronRight size={12} className="shrink-0" />
                        <span className="hidden sm:inline">Documentation</span>
                        <ChevronRight size={12} className="hidden sm:block shrink-0" />
                        <span className="truncate">{TOPIC_GROUPS[activeTopic] || 'General'}</span>
                        <ChevronRight size={12} className="shrink-0" />
                        <span className="text-theme-accent truncate">{TOPIC_LABELS[activeTopic] || 'Topic'}</span>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="max-w-4xl mx-auto py-8 md:py-12 px-6 md:px-12 pb-24">
                                <HelpContent activeTopic={activeTopic} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
