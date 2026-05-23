import React, { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, Download } from 'lucide-react';

const PdfDropdown = ({ onDownload, t }) => {
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

    const handleDownload = (format) => {
        onDownload(format);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all flex items-center gap-1 ${isOpen ? 'bg-theme-accent text-white' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-accent shadow-sm border border-transparent'
                    }`}
                title={t('exportPDF')}
            >
                <div className="relative">
                    <Download className="w-5 h-5" />
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-theme-surface border border-theme-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] animate-in fade-in zoom-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="p-3 bg-gradient-to-br from-theme-accent/10 to-transparent border-b border-theme-border">
                        <h3 className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Download</h3>
                    </div>
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => handleDownload('a4')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group"
                        >
                            <span className="font-bold">A4 Format</span>
                        </button>
                        <button
                            onClick={() => handleDownload('a3')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group"
                        >
                            <span className="font-bold">A3 Format</span>
                        </button>
                        <div className="h-px bg-theme-border/50 my-1 mx-2"></div>
                        <button
                            onClick={() => handleDownload('auto')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group"
                        >
                            <span className="font-bold">Original Size</span>
                        </button>
                        <div className="h-px bg-theme-border/50 my-1 mx-2"></div>
                        <button
                            onClick={() => handleDownload('gif')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group"
                        >
                            <span className="font-bold">GIF Format</span>
                        </button>
                        <div className="h-px bg-theme-border/50 my-1 mx-2"></div>
                        <button
                            onClick={() => handleDownload('html')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-theme-secondary hover:bg-theme-bg-tertiary hover:text-theme-primary rounded-xl transition-all group"
                        >
                            <span className="font-bold">HTML Format</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PdfDropdown;
