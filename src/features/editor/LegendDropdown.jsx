import React, { useState, useRef, useEffect } from 'react';
import { Info, ChevronDown, Square, Circle, Diamond, ArrowRight, Type, Layout, Hexagon, Box, User, Users, Building2, Globe, Server, Database, Timer, MessageCircle, AlertCircle, GitMerge, Rows, Columns, FileText, Trash2, Plus, Search, HelpCircle, Triangle, MousePointer2, ChevronLeft, ChevronRight, SidebarClose, SidebarOpen, Eraser, Mail, Clock, Zap, Heart } from 'lucide-react';
import { symbolService } from '../../services/symbolService';
import { FALLBACK_SHAPE_SETS, ShapePreview } from '../../components/shared/slide_bar';

const ICON_MAP = {
    Eraser, ChevronDown, ChevronRight, Circle, Square, Diamond, ArrowRight,
    Type, Layout, Hexagon, Box, User, Users, Building2, Globe, Server,
    Database, Timer, MessageCircle, AlertCircle, GitMerge, Rows, Columns,
    FileText, Trash2, Plus, Search, HelpCircle, Info, Triangle, MousePointer2, ChevronLeft,
    SidebarClose, SidebarOpen, Mail, Clock, Zap, Heart
};

const LegendDropdown = ({ selectedShapeSet = 'common' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [shapeSets, setShapeSets] = useState(FALLBACK_SHAPE_SETS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchSymbols();
        }
    }, [isOpen]);

    const fetchSymbols = async () => {
        try {
            const symbols = await symbolService.getAll();
            if (symbols && symbols.length > 0) {
                const transformedSets = transformSymbolsToSets(symbols);
                setShapeSets(transformedSets);
            }
        } catch (error) {
            console.error("Failed to fetch symbols for legend", error);
        } finally {
            setLoading(false);
        }
    };

    const transformSymbolsToSets = (symbols) => {
        // Start with a shallow copy of fallback sets
        const sets = { ...FALLBACK_SHAPE_SETS };

        // Function to ensure a shape has an Icon component
        const ensureIcon = (shape) => ({
            ...shape,
            icon: ICON_MAP[shape.iconName] || Square
        });

        // Pre-process all fallback shapes to attach Icon components
        Object.keys(sets).forEach(setKey => {
            sets[setKey] = {
                ...sets[setKey],
                categories: sets[setKey].categories.map(cat => ({
                    ...cat,
                    shapes: cat.shapes.map(ensureIcon)
                }))
            };
        });

        // Group by set and merge symbols from DB
        if (symbols && symbols.length > 0) {
            symbols.forEach(symbol => {
                const setKey = symbol.set;
                if (!sets[setKey]) {
                    sets[setKey] = {
                        label: setKey.charAt(0).toUpperCase() + setKey.slice(1) + (setKey === 'bpmn' ? ' Shapes' : ''),
                        categories: []
                    };
                }

                let category = sets[setKey].categories.find(c => c.label === symbol.category);
                if (!category) {
                    category = { label: symbol.category, shapes: [] };
                    sets[setKey].categories.push(category);
                }

                // Attach Icon Component based on iconName
                const shapeWithIcon = ensureIcon({
                    ...symbol,
                    label: symbol.name // Map name from DB to label for UI
                });

                // Avoid duplicates if a shape with same type and label already exists
                if (!category.shapes.find(s => s.type === shapeWithIcon.type && s.label === shapeWithIcon.label)) {
                    category.shapes.push(shapeWithIcon);
                }
            });
        }

        return sets;
    };


    // Get the current set of shapes based on the selected prop
    // Fallback to 'common' if the key doesn't exist
    const currentShapeSet = shapeSets[selectedShapeSet] || shapeSets['common'];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-2 rounded-full transition-all flex items-center gap-2 border ${isOpen
                    ? 'bg-theme-accent text-white border-theme-accent'
                    : 'text-theme-tertiary hover:text-theme-primary bg-theme-surface/50 hover:bg-theme-surface border-theme-border backdrop-blur-sm'
                    }`}
                title="Legend"
            >
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Legend</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-72 app-glass-panel rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 border border-theme-border max-h-[80vh] overflow-y-auto custom-scrollbar"
                >
                    <h3 className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">
                        {currentShapeSet?.label || 'Legend'}
                    </h3>

                    <div className="space-y-4">
                        {currentShapeSet?.categories.map((category) => (
                            <div key={category.label}>
                                <h4 className="text-[10px] font-bold text-theme-tertiary/70 uppercase tracking-widest mb-2 border-b border-theme-border/30 pb-1">
                                    {category.label}
                                </h4>
                                <div className="space-y-2">
                                    {category.shapes.map((item, idx) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={`${category.label}-${idx}`} className="flex items-start gap-3 group">
                                                <div className="shrink-0 rounded bg-theme-surface/50 border border-theme-border group-hover:bg-theme-surface transition-colors flex items-center justify-center p-1 w-10 h-10">
                                                    <ShapePreview type={item.type} Icon={Icon} symbol={item.symbol} borderClass={item.borderClass} iconName={item.iconName} activityType={item.activityType} dataType={item.dataType} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-medium text-theme-secondary group-hover:text-theme-primary transition-colors">
                                                        {item.label}
                                                    </span>
                                                    {item.description && (
                                                        <span className="text-[10px] text-theme-tertiary/70 leading-tight">
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LegendDropdown;
