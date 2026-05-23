import React, { useState, useRef, useEffect } from 'react';
import { Layout, Check, ChevronDown, Package, Activity, Share2, Layers } from 'lucide-react';

const DiagramTemplateSwitcher = ({ currentTemplate, onTemplateChange, diagramType, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const getTemplateInfo = () => {
        switch (diagramType) {
            case 'organization':
                return {
                    title: 'Org Chart Styles',
                    subtitle: 'Choose UI for organizational structure',
                    icon: <Share2 className="w-5 h-5" />,
                    templates: [
                        { id: 'classic', name: 'Classic Card', description: 'Horizontal layout with side avatar' },
                        { id: 'modern', name: 'Modern Profile', description: 'Vertical stack with circular avatar' },
                        { id: 'minimal', name: 'Minimal Row', description: 'Compact list-style with small icon' },
                        { id: 'glass', name: 'Glassmorphic', description: 'Premium translucent design' },
                    ]
                };
            case 'fad':
                return {
                    title: 'FAD Layouts',
                    subtitle: 'Choose UI for function allocation',
                    icon: <Layers className="w-5 h-5" />,
                    templates: [
                        { id: 'classic', name: 'Standard FAD', description: 'Traditional blue-bordered nodes' },
                        { id: 'modern', name: 'Dark Central', description: 'Modern dark theme for central process' },
                        { id: 'minimal', name: 'Lite Connection', description: 'Clean and compact node design' },
                        { id: 'glass', name: 'Crystal Flow', description: 'Reflective gradients and glass UI' },
                    ]
                };
            case 'vacd':
                return {
                    title: 'VACD Themes',
                    subtitle: 'Choose UI for value added chains',
                    icon: <Share2 className="w-5 h-5" />,
                    templates: [
                        { id: 'classic', name: 'Standard VACD', description: 'Original SAP design with lanes & chevrons' },
                        { id: 'porter', name: "Porter's Value Chain", description: 'PowerPoint-style horizontal/vertical layout' },
                        { id: 'modern', name: 'Modern Flow', description: 'Soft corners and clean lines' },
                        { id: 'minimal', name: 'Technical VACD', description: 'Compact and focused' },
                        { id: 'glass', name: 'Luminous Chain', description: 'Premium glassmorphic effect' },
                    ]
                };
            default: // process
                return {
                    title: 'Process Themes',
                    subtitle: 'Choose UI for EPC diagrams',
                    icon: <Activity className="w-5 h-5" />,
                    templates: [
                        { id: 'classic', name: 'ARIS Default', description: 'Standard industrial EPC symbols' },
                        { id: 'modern', name: 'Soft Edge', description: 'Modern rounded corners and shadows' },
                        { id: 'minimal', name: 'Technical Flat', description: 'Clean flat colors and compact icons' },
                        { id: 'glass', name: 'Luminous', description: 'Blur effects and glowing strokes' },
                    ]
                };
        }
    };

    const info = getTemplateInfo();

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
                className={`p-2 rounded-full transition-all flex items-center gap-1.5 ${isOpen ? 'bg-theme-accent text-white' : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-accent border border-transparent'
                    }`}
                title="Change Diagram Template"
            >
                {info.icon}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-theme-surface border border-theme-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] animate-in fade-in zoom-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-theme-accent/10 to-transparent border-b border-theme-border">
                        <h3 className="text-sm font-black text-theme-primary uppercase tracking-widest">{info.title}</h3>
                        <p className="text-[10px] text-theme-tertiary font-medium mt-0.5">{info.subtitle}</p>
                    </div>
                    <div className="p-2.5 space-y-1.5">
                        {info.templates.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => {
                                    onTemplateChange(tpl.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3.5 p-3 rounded-xl transition-all text-left group ${currentTemplate === tpl.id ? 'bg-theme-accent/20 border border-theme-accent/30' : 'hover:bg-theme-bg-tertiary border border-transparent'
                                    }`}
                            >
                                <div className={`h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${currentTemplate === tpl.id ? 'bg-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.5)]' : 'bg-theme-border'}`}>
                                    {currentTemplate === tpl.id && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-bold ${currentTemplate === tpl.id ? 'text-theme-accent' : 'text-theme-primary opacity-90'}`}>
                                        {tpl.name}
                                    </div>
                                    <div className="text-[10px] text-theme-tertiary mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
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

export default DiagramTemplateSwitcher;
