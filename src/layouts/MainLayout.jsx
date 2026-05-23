import React, { useState } from 'react';
import Header from '../components/Header';
import InactivityTracker from '../components/shared/InactivityTracker';
import LicenseBanner from '../components/shared/LicenseBanner';

const MainLayout = ({ children, Sidebar, showSidebar = true, showHeader = true, variant = 'default' }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const isNavy = variant === 'navy';
    
    return (
        <div className={`flex h-screen w-full overflow-hidden bg-transparent ${isNavy ? 'text-theme-primary' : ''}`}>
            <LicenseBanner />
            <InactivityTracker />
            {/* Sidebar Shell */}
            {showSidebar && (
                <aside
                    className={`
                        z-50 transition-all duration-300 ease-in-out
                        ${isNavy 
                            ? 'fixed inset-y-0 left-0 w-80 bg-theme-surface/20 backdrop-blur-2xl border-r border-theme-border shadow-2xl' 
                            : 'fixed inset-y-4 left-4 w-80 app-floating-dock rounded-2xl shadow-xl'
                        }
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}
                        ${!isNavy && 'lg:relative lg:translate-x-0 lg:ml-4 lg:my-4 lg:h-[calc(100vh-2rem)]'}
                    `}
                >
                    <div className="h-full overflow-hidden">
                        {Sidebar}
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col relative min-w-0 h-full transition-all duration-300 ${isNavy && isSidebarOpen ? 'lg:pl-80' : ''}`}>
                {showHeader && (
                    <Header variant={variant} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                )}

                {/* Content Scroll Area */}
                <div className={`flex-1 flex flex-col overflow-y-auto relative z-0 ${showHeader || showSidebar ? 'px-4 pb-4 pt-24' : 'p-0'}`}>
                    {children}
                </div>
            </main>

            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;
