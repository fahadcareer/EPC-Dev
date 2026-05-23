import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Upload, Download, ChevronDown } from 'lucide-react';

const XmlDropdown = ({ onImport, onExport, t, isViewMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all flex items-center gap-1 ${isOpen ? 'bg-theme-accent text-white' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-accent border border-transparent'
                    }`}
                title="XML Operations"
            >
                <div className="relative">
                    <FileCode className="w-5 h-5" />
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-theme-surface border border-theme-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] animate-in fade-in zoom-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="p-3 bg-gradient-to-br from-theme-accent/10 to-transparent border-b border-theme-border">
                        <h3 className="text-[10px] font-black text-theme-primary uppercase tracking-widest">XML Actions</h3>
                    </div>
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => {
                                onExport('native');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group border border-transparent hover:border-theme-border/50"
                        >
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Download className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold">Export Native XML</span>
                        </button>
                        <button
                            onClick={() => {
                                onExport('bpmn');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group border border-transparent hover:border-theme-border/50"
                        >
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <Download className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold">Export BPMN 2.0</span>
                        </button>

                        {!isViewMode && (
                            <>
                                <button
                                    onClick={() => {
                                        onImport('native');
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group border border-transparent hover:border-theme-border/50"
                                >
                                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                        <Upload className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold">Import Native XML</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onImport('bpmn');
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group border border-transparent hover:border-theme-border/50"
                                >
                                    <div className="p-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 group-hover:bg-fuchsia-500 group-hover:text-white transition-all">
                                        <Upload className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold">Import BPMN 2.0</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default XmlDropdown;
