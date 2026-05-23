import React, { useState, useRef, useEffect } from 'react';
import { Layout, Check, ChevronDown } from 'lucide-react';

const OrgTemplateSwitcher = ({ currentTemplate, onTemplateChange, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const templates = [
        { id: 'classic', name: 'Classic Card', description: 'Horizontal layout with side avatar' },
        { id: 'modern', name: 'Modern Profile', description: 'Vertical stack with circular avatar' },
        { id: 'minimal', name: 'Minimal Row', description: 'Compact list-style with small icon' },
        { id: 'glass', name: 'Glassmorphic', description: 'Premium translucent design' },
    ];

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
                className={`p-2 rounded-full transition-all flex items-center gap-1 ${isOpen ? 'bg-theme-accent text-white' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary'
                    }`}
                title="Change Org Chart Template"
            >
                <Layout className="w-5 h-5" />
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-theme-surface border border-theme-border rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-theme-border">
                        <h3 className="text-sm font-bold text-theme-primary">Select Template</h3>
                        <p className="text-[10px] text-theme-tertiary">Choose a UI style for organization chart</p>
                    </div>
                    <div className="p-2 space-y-1">
                        {templates.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => {
                                    onTemplateChange(tpl.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 p-2 rounded-lg transition-colors text-left ${currentTemplate === tpl.id ? 'bg-theme-accent/10 border border-theme-accent/20' : 'hover:bg-theme-bg-tertiary border border-transparent'
                                    }`}
                            >
                                <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${currentTemplate === tpl.id ? 'bg-theme-accent' : 'bg-theme-border'}`}>
                                    {currentTemplate === tpl.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <div className={`text-xs font-semibold ${currentTemplate === tpl.id ? 'text-theme-accent' : 'text-theme-primary'}`}>
                                        {tpl.name}
                                    </div>
                                    <div className="text-[10px] text-theme-tertiary">
                                        {tpl.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgTemplateSwitcher;
