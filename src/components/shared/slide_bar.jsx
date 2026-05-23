import React, { useState, useEffect } from 'react';
import {
    Eraser, ChevronDown, ChevronRight, Circle, Square, Diamond, ArrowRight,
    Type, Layout, Hexagon, Box, User, Users, Building2, Globe, Server, Settings,
    Database, Timer, MessageCircle, AlertCircle, GitMerge, Rows, Columns,
    FileText, Trash2, Plus, Search, HelpCircle, Info, Triangle, MousePointer2, ChevronLeft,
    SidebarClose, SidebarOpen, Mail, Clock, Zap, Heart
} from 'lucide-react';
import { symbolService } from '../../services/symbolService';
import useAuthStore from '../../store/logic/user';

// Fallback static sets if API fails or during loading
export const FALLBACK_SHAPE_SETS = {
    common: {
        label: "Common / Core Shapes",
        categories: [
            {
                label: "General",
                shapes: [
                    { type: 'event', label: 'Start Event', description: 'Indicates the start of a process.', iconName: 'Circle' },
                    { type: 'event', label: 'End Event', description: 'Indicates the end of a process.', iconName: 'Circle', borderClass: 'border-2' },
                    { type: 'function', label: 'Process / Function', description: 'Represents a task or activity.', iconName: 'Square' },
                    { type: 'rule', label: 'Decision / Gateway', description: 'Controls process flow based on conditions.', iconName: 'Diamond' },
                    { type: 'group', label: 'Group / Container', description: 'Groups related elements together.', iconName: 'Layout' },
                ]
            }
        ]
    },
    bpmn: {
        label: "BPMN 2.0",
        categories: [
            {
                label: "Events",
                shapes: [
                    { type: 'bpmn_event', label: 'Start Event', description: 'Indicates where a process begins.', iconName: 'Circle' },
                    { type: 'bpmn_event', label: 'Intermediate Event', description: 'Occurs between a Start and End Event.', iconName: 'Circle', borderClass: 'border-4 border-double' },
                    { type: 'bpmn_event', label: 'End Event', description: 'Indicates where a process ends.', iconName: 'Circle', borderClass: 'border-[3px]' },
                ]
            },
            {
                label: "Activities",
                shapes: [
                    { type: 'bpmn_task', label: 'Task', description: 'A unit of work or activity.', iconName: 'Square', activityType: 'task' },
                    { type: 'bpmn_task', label: 'Transaction', description: 'A transactional subprocess — double border.', iconName: 'Square', activityType: 'transaction' },
                    { type: 'bpmn_task', label: 'Sub-Process', description: 'A compound activity with internal details — dashed border.', iconName: 'Box', activityType: 'subprocess' },
                    { type: 'bpmn_task', label: 'Call Activity', description: 'A call to a reusable global process — thick border.', iconName: 'Square', activityType: 'call_activity' },
                ]
            },
            {
                label: "Gateways",
                shapes: [
                    { type: 'bpmn_gateway', label: 'Exclusive Gateway', description: 'Diverges flow based on a choice (XOR).', iconName: 'Diamond', symbol: 'x' },
                    { type: 'bpmn_gateway', label: 'Parallel Gateway', description: 'Splits flow into parallel paths (AND).', iconName: 'Diamond', symbol: '+' },
                    { type: 'bpmn_gateway', label: 'Inclusive Gateway', description: 'Splits flow based on multiple conditions (OR).', iconName: 'Diamond', symbol: 'o' },
                    { type: 'bpmn_gateway', label: 'Complex Gateway', description: 'Complex merging/branching conditions.', iconName: 'Diamond', symbol: '*' },
                    { type: 'bpmn_gateway', label: 'Event-Based Gateway', description: 'Branching based on events.', iconName: 'Diamond', symbol: 'e' },
                    { type: 'bpmn_gateway', label: 'Exclusive Event-Based Gateway', description: 'Exclusive branching based on events.', iconName: 'Diamond', symbol: 'ee' },
                    { type: 'bpmn_gateway', label: 'Parallel Event-Based Gateway', description: 'Parallel branching based on events.', iconName: 'Diamond', symbol: 'pe' },
                ]
            },
            {
                label: "Data",
                shapes: [
                    { type: 'bpmn_data', label: 'Data Object', description: 'Data object representing information.', iconName: 'FileText', dataType: 'object' },
                    { type: 'bpmn_data', label: 'Data Input', description: 'Data input to a process.', iconName: 'FileText', dataType: 'input' },
                    { type: 'bpmn_data', label: 'Data Output', description: 'Data output from a process.', iconName: 'FileText', dataType: 'output' },
                    { type: 'bpmn_data', label: 'Data Store', description: 'A persistent data store.', iconName: 'Database', dataType: 'store' },
                ]
            },
            {
                label: "Swimlanes",
                shapes: [
                    { type: 'bpmn_pool', label: 'Pool', description: 'Participant pool for process separation.', iconName: 'Layout' },
                    { type: 'bpmn_empty_lane', label: 'EMPTY LANE', description: 'Plain lane container without the left-side label strip.', iconName: 'Rows' },
                ]
            }
        ]
    },
    epc: {
        label: "EPC (Event-driven Process Chain)",
        categories: [
            {
                label: "Core",
                shapes: [
                    { type: 'event', label: 'Event', description: 'Describes a state or condition.', iconName: 'Hexagon', shapeType: 'hexagon' },
                    { type: 'function', label: 'Function', description: 'Represents an activity or task.', iconName: 'Square', borderClass: 'rounded-lg' },
                    { type: 'rule', label: 'XOR', description: 'Exclusive decision or merge.', iconName: 'Circle', symbol: 'x' },
                    { type: 'rule', label: 'OR', description: 'Inclusive decision or merge.', iconName: 'Circle', symbol: 'v' },
                    { type: 'rule', label: 'AND', description: 'Parallel fork or join.', iconName: 'Circle', symbol: '∧' },
                ]
            },
            {
                label: "Resources",
                shapes: [
                    { type: 'org_element', label: 'Organizational Unit', description: 'Department or team responsible.', iconName: 'Building2' },
                    { type: 'role', label: 'Role', description: 'Specific role or person responsible.', iconName: 'User' },
                    { type: 'system', label: 'System / App', description: 'IT system used in the function.', iconName: 'Server' },
                    { type: 'data', label: 'Data Object', description: 'Document or data used/produced.', iconName: 'FileText' },
                ]
            }
        ]
    },
    vacd: {
        label: "VACD (Value Added Chain Diagram)",
        categories: [
            {
                label: "Containers",
                shapes: [
                    { type: 'vacd_lane', label: 'Main Lane', description: 'Primary container for value chains.', iconName: 'Rows' },
                    { type: 'vacd_sub_lane', label: 'Sub-Lane', description: 'Secondary container within a lane.', iconName: 'Columns' },
                ]
            },
            {
                label: "Processes",
                shapes: [
                    { type: 'management_process', label: 'Management Process', description: 'Directs and controls the organization.', iconName: 'Settings' },
                    { type: 'valueaddedchain', label: 'Value Added Chain', description: 'Sequence of value-adding activities.', iconName: 'ArrowRight', shapeType: 'chevron' },
                    { type: 'processgroup', label: 'Process Group', description: 'Collection of related processes.', iconName: 'Box' },
                    { type: 'vacd', label: 'Value Added Activity', description: 'Core activity that adds value.', iconName: 'ArrowRight', shapeType: 'chevron' },
                    { type: 'support_process', label: 'Support Process', description: 'Supports the core value chain.', iconName: 'HelpCircle' },
                ]
            },
            {
                label: "Boundaries",
                shapes: [
                    { type: 'chevron_left', label: 'Customer Request', description: 'Input trigger for the value chain.', iconName: 'ChevronLeft', shapeType: 'chevron_left' },
                    { type: 'chevron_right', label: 'Customer Satisfaction', description: 'Output result of the value chain.', iconName: 'ChevronRight', shapeType: 'chevron_right' },
                ]
            }
        ]
    },
    humancentric: {
        label: "Human Centric / Journey",
        categories: [
            {
                label: "Touchpoints",
                shapes: [
                    { type: 'action', label: 'User Action', description: 'An action taken by the user.', iconName: 'MousePointer2' },
                    { type: 'emotion', label: 'Pain Point', description: 'Problem or frustration point.', iconName: 'AlertCircle' },
                    { type: 'emotion', label: 'Delight Point', description: 'Positive experience or moment.', iconName: 'Heart' }, // Note: Heart not imported, using AlertCircle fallback if needed or update imports
                ]
            }
        ]
    }
};

const ICON_MAP = {
    Eraser, ChevronDown, ChevronRight, Circle, Square, Diamond, ArrowRight,
    Type, Layout, Hexagon, Box, User, Users, Building2, Globe, Server, Settings,
    Database, Timer, MessageCircle, AlertCircle, GitMerge, Rows, Columns,
    FileText, Trash2, Plus, Search, HelpCircle, Info, Triangle, MousePointer2, ChevronLeft,
    SidebarClose, SidebarOpen, Mail, Clock, Zap, Heart
};

export const ShapePreview = ({ type, Icon, symbol, borderClass, iconName, activityType, dataType }) => {
    if (type === 'bpmn_data') {
        const renderDataSVG = () => {
            if (dataType === 'store') {
                return (
                    <svg width="28" height="28" viewBox="0 0 56 56" className="overflow-visible stroke-[currentColor] text-theme-tertiary group-hover:text-theme-primary transition-colors">
                        <path d="M 12 16 L 12 42 C 12 50, 44 50, 44 42 L 44 16" fill="none" strokeWidth="2.5" />
                        <ellipse cx="28" cy="16" rx="16" ry="6" fill="none" strokeWidth="2.5" />
                    </svg>
                );
            }
            const docPath = "M 14 6 L 34 6 L 42 14 L 42 50 L 14 50 Z M 34 6 L 34 14 L 42 14";
            const arrowPoints = "14,10 24,10 24,7 32,13 24,19 24,16 14,16";
            return (
                <svg width="28" height="28" viewBox="0 0 56 56" className="overflow-visible stroke-[currentColor] text-theme-tertiary group-hover:text-theme-primary transition-colors">
                    <path d={docPath} fill="none" strokeWidth="2.5" strokeLinejoin="round" />
                    {dataType === 'input' && <polygon points={arrowPoints} fill="currentColor" strokeWidth="1.5" strokeLinejoin="round" />}
                    {dataType === 'output' && <polygon points={arrowPoints} fill="currentColor" strokeWidth="1.5" strokeLinejoin="round" />}
                </svg>
            );
        };
        return <div className="w-8 h-8 flex items-center justify-center">{renderDataSVG()}</div>;
    }

    if (type === 'bpmn_event') {
        const isTriggger = iconName !== 'Circle';

        // Force minimum border width for 'border-double' to render correctly in Tailwind CSS
        let computedBorder = borderClass || 'border';
        if (computedBorder.includes('border-double')) {
            computedBorder = computedBorder.replace('border-2', 'border-4').replace('border-[3px]', 'border-4');
            if (!computedBorder.includes('border-4')) computedBorder += ' border-4';
        }

        return (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-theme-border text-theme-tertiary group-hover:text-theme-primary transition-colors ${computedBorder}`}>
                {isTriggger && Icon ? <Icon className="w-4 h-4" /> : null}
            </div>
        );
    }
    if (type === 'bpmn_task') {
        const at = activityType || 'task';
        let borderStyle = 'border border-theme-border';
        if (at === 'transaction') borderStyle = 'border-[3px] border-double border-theme-border';
        else if (at === 'subprocess') borderStyle = 'border border-dashed border-theme-border';
        else if (at === 'call_activity') borderStyle = 'border-[3px] border-solid border-theme-border';
        return (
            <div className={`w-8 h-7 rounded bg-theme-surface/30 ${borderStyle} flex items-center justify-center relative text-theme-tertiary group-hover:text-theme-primary transition-colors`}>
                {at === 'subprocess' && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 border border-theme-tertiary/50 rounded-[1px] flex items-center justify-center"><span className="text-[5px] font-bold leading-none">+</span></div>}
            </div>
        );
    }
    if (type === 'bpmn_gateway') {
        const renderInner = () => {
            const props = { stroke: 'currentColor', fill: 'none', strokeWidth: '2' };
            switch (symbol?.toLowerCase()) {
                case 'x': return <path d="M 4 4 L 16 16 M 16 4 L 4 16" {...props} />;
                case '+': return <path d="M 10 2 L 10 18 M 2 10 L 18 10" {...props} />;
                case 'o': return <circle cx="10" cy="10" r="5" {...props} />;
                case '*': return <path d="M 10 2 L 10 18 M 2 10 L 18 10 M 4 4 L 16 16 M 16 4 L 4 16" strokeWidth="1.5" stroke="currentColor" fill="none" />;
                case 'e': return (
                    <g strokeWidth="0.8" stroke="currentColor" fill="none">
                        <circle cx="10" cy="10" r="6" />
                        <circle cx="10" cy="10" r="4.5" />
                        <polygon points="10,6.5 12.5,8.5 11.5,12 8.5,12 7.5,8.5" />
                    </g>
                );
                case 'ee': return (
                    <g strokeWidth="0.8" stroke="currentColor" fill="none">
                        <circle cx="10" cy="10" r="6" />
                        <polygon points="10,6 13,8.5 12,12.5 8,12.5 7,8.5" />
                    </g>
                );
                case 'pe': return (
                    <g fill="none">
                        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="0.8" />
                        <path d="M 10 5.5 L 10 14.5 M 5.5 10 L 14.5 10" stroke="currentColor" strokeWidth="1.2" />
                    </g>
                );
                default: return <path d="M 4 4 L 16 16 M 16 4 L 4 16" {...props} />;
            }
        };
        return (
            <div className="w-8 h-8 flex items-center justify-center text-theme-tertiary group-hover:text-theme-primary transition-colors">
                <svg width="28" height="28" viewBox="0 0 28 28" className="overflow-visible">
                    <polygon points="14,2 26,14 14,26 2,14" fill="transparent" stroke="currentColor" strokeWidth="1.5" />
                    <g transform="translate(4, 4)">
                        {renderInner()}
                    </g>
                </svg>
            </div>
        );
    }

    if (type === 'bpmn_pool') {
        return (
            <div className="w-8 h-8 flex items-center justify-center text-theme-tertiary group-hover:text-theme-primary transition-colors">
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="1.5" y="2" width="13" height="12" rx="1" />
                    <line x1="4.5" y1="2" x2="4.5" y2="14" />
                </svg>
            </div>
        );
    }

    if (type === 'bpmn_empty_lane') {
        return (
            <div className="w-10 h-6 border-2 border-theme-border bg-transparent flex items-center justify-center text-[7px] font-medium text-theme-tertiary group-hover:text-theme-primary transition-colors">
                Lane
            </div>
        );
    }

    // Default Icon Render (EPC & Others)
    return (
        <div className={`flex items-center justify-center shrink-0 w-8 h-8 ${symbol ? 'bg-theme-bg-tertiary rounded-full border border-theme-border text-[10px] font-bold' : ''}`}>
            {Icon ? <Icon className={`w-5 h-5 text-theme-tertiary group-hover:text-theme-primary transition-colors ${borderClass || ''}`} /> : symbol}
        </div>
    );
};

export default function Sidebar({ onDelete, isEraserActive, toggleEraser, onClose, selectedSet, onSetChange, isCollapsed = false }) {
    const isFeatureEnabled = useAuthStore(state => state.isFeatureEnabled);
    const [localSelectedSet, setLocalSelectedSet] = useState('common');
    const [shapeSets, setShapeSets] = useState(FALLBACK_SHAPE_SETS);
    const [loading, setLoading] = useState(true);

    // Use prop if available, otherwise local state
    const currentSetKey = selectedSet || localSelectedSet;
    const currentSet = shapeSets[currentSetKey] || shapeSets['common'];

    const handleSetChange = (val) => {
        if (onSetChange) {
            onSetChange(val);
        } else {
            setLocalSelectedSet(val);
        }
    };
    const [openCategories, setOpenCategories] = useState(['General', 'Events', 'Core', 'Entities', 'Geometric', 'Process Chain']);

    useEffect(() => {
        fetchSymbols();
    }, []);

    const fetchSymbols = async () => {
        try {
            const symbols = await symbolService.getAll();
            if (symbols && symbols.length > 0) {
                const transformedSets = transformSymbolsToSets(symbols);
                setShapeSets(transformedSets);
            }
        } catch (error) {
            console.error("Failed to fetch symbols", error);
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

                // STRICT FILTER: Keep the sidebar lean. If this is a BPMN event from the DB,
                const ALLOWED_BPMN_EVENTS = ['Start Event', 'Intermediate Event', 'End Event'];
                if (shapeWithIcon.type === 'bpmn_event' && setKey === 'bpmn' && !ALLOWED_BPMN_EVENTS.includes(shapeWithIcon.label)) {
                    return; // skip disallowed event variants loaded from DB
                }

                // Avoid duplicates if a shape with same type and label already exists
                if (!category.shapes.find(s => s.type === shapeWithIcon.type && s.label === shapeWithIcon.label)) {
                    category.shapes.push(shapeWithIcon);
                }
            });
        }

        return sets;
    };

    const toggleCategory = (label) => {
        setOpenCategories(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    const onDragStart = (event, nodeType, label, shapeType, iconName, symbolSet, symbolName) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        if (shapeType) {
            event.dataTransfer.setData('application/reactflow-shape', shapeType);
        }
        if (iconName) {
            event.dataTransfer.setData('application/reactflow-icon', iconName);
        }
        if (symbolSet) {
            event.dataTransfer.setData('application/reactflow-set', symbolSet);
        }
        if (symbolName) {
            event.dataTransfer.setData('application/reactflow-name', symbolName);
        }
        event.dataTransfer.effectAllowed = 'move';

        // Customize the native drag appearance to only show the shape preview (not the full list item + text)
        if (event.currentTarget) {
            const previewEl = event.currentTarget.querySelector('.shape-preview-container');
            if (previewEl) {
                // The standard icon is 32x32 (w-8 h-8), we center the click on it (16, 16)
                event.dataTransfer.setDragImage(previewEl, 16, 16);
            }
        }
    };

    const SidebarItem = ({ type, label, description, icon: Icon, iconName, shapeType, symbol, borderClass, set, name, activityType, dataType }) => (
        <div
            onDragStart={(event) => onDragStart(event, type, label, shapeType, iconName, set, name)}
            draggable
            title={isCollapsed ? label : ''}
            className={`group relative flex items-center w-full cursor-grab transition-all duration-300 rounded-lg ${isCollapsed ? 'justify-center p-2 hover:bg-white/5' : 'px-3 py-2 gap-3 hover:bg-white/5 hover:translate-x-1'}`}
        >
            <div className="shape-preview-container pointer-events-none">
                <ShapePreview type={type} Icon={Icon} symbol={symbol} borderClass={borderClass} iconName={iconName} activityType={activityType} dataType={dataType} />
            </div>
            {!isCollapsed && (
                <div className="flex-1 flex flex-col min-w-0 animate-fade-in pointer-events-none">
                    <span className="text-[11px] font-medium text-theme-secondary group-hover:text-theme-primary truncate transition-colors">
                        {label}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <aside className={`h-full flex flex-col bg-transparent backdrop-blur-sm overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isCollapsed ? 'w-full items-center' : 'w-full'}`}>
            {/* Header */}
            <div className={`border-b border-theme-border flex items-center transition-all duration-300 relative ${isCollapsed ? 'p-3 justify-center flex-col gap-2' : 'p-4'}`}>
                {!isCollapsed && (
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="text-xs font-bold text-theme-primary uppercase tracking-wider animate-fade-in">Shapes</span>
                    </div>
                )}

                {!isCollapsed ? (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 text-theme-tertiary hover:text-theme-primary hover:bg-white/10 rounded-lg transition-all z-10"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                ) : (
                    // Collapsed Header Icon - Cleaner Look
                    <div className="text-theme-tertiary/50" title="Expand to see details">
                        <Layout className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Shape Set Dropdown */}
            <div className={`transition-all duration-300 ${isCollapsed ? 'p-2 opacity-50' : 'p-3 opacity-100'}`}>
                {!isCollapsed ? (
                    <div className="relative group animate-fade-in">
                        <select
                            value={currentSetKey}
                            onChange={(e) => handleSetChange(e.target.value)}
                            className="w-full bg-theme-bg-tertiary border border-theme-border rounded-lg px-3 py-2 text-xs font-semibold text-theme-primary appearance-none focus:outline-none focus:border-theme-accent cursor-pointer hover:bg-theme-bg-secondary transition-all"
                        >
                            {Object.entries(shapeSets).map(([key, set]) => {
                                // Feature Gating for Shape Sets
                                if (key === 'vacd' && !isFeatureEnabled('fad')) return null;
                                if (key === 'humancentric' && !isFeatureEnabled('process')) return null; // Assuming journey maps are part of process
                                if (key === 'bpmn' && !isFeatureEnabled('process')) return null;
                                
                                return (
                                    <option key={key} value={key} className="bg-theme-surface text-theme-primary">
                                        {set.label}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary pointer-events-none group-hover:text-theme-primary transition-colors" />
                    </div>
                ) : (
                    // Collapsed: Minimal divider or indicator
                    <div className="w-full h-px bg-theme-border/30 rounded" />
                )}
            </div>

            {/* Categories and Shapes */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${isCollapsed ? 'p-2 space-y-2' : 'p-2 space-y-1'}`}>
                {currentSet?.categories?.length > 0 ? (
                    currentSet.categories.map((category) => (
                        <div key={category.label} className="space-y-1 w-full">
                            {!isCollapsed ? (
                                <button
                                    onClick={() => toggleCategory(category.label)}
                                    className="w-full flex items-center justify-between p-2 text-[10px] font-bold text-theme-tertiary uppercase tracking-widest hover:text-theme-primary transition-colors group animate-fade-in"
                                >
                                    <div className="flex items-center gap-2">
                                        {openCategories.includes(category.label) ?
                                            <ChevronDown className="w-3 h-3 text-theme-accent" /> :
                                            <ChevronRight className="w-3 h-3" />
                                        }
                                        {category.label}
                                    </div>
                                    <div className="h-px flex-1 bg-theme-border ml-2 opacity-30"></div>
                                </button>
                            ) : (
                                // Collapsed: Show a separator
                                <div className="w-full h-px bg-theme-border/10 my-1" />
                            )}

                            {(openCategories.includes(category.label) || isCollapsed) && (
                                <div className={`space-y-0.5 ${isCollapsed ? 'flex flex-col items-center gap-1' : 'pl-1 animate-fade-in'}`}>
                                    {category.shapes.map((shape, idx) => (
                                        <SidebarItem key={`${category.label}-${idx}`} {...shape} set={shape.set || currentSetKey} name={shape.name || shape.label} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-xs text-theme-tertiary">
                        {loading ? 'Loading shapes...' : 'No shapes found.'}
                    </div>
                )}
            </div>

            {/* Eraser Tool */}
            <div className={`border-t border-theme-border w-full transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'}`}>
                <button
                    onClick={toggleEraser}
                    title="Eraser"
                    className={`flex items-center justify-center w-full py-2.5 rounded-xl border transition-all duration-300 gap-2 ${isEraserActive
                        ? 'bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-theme-bg-tertiary/50 border-theme-border text-theme-tertiary hover:bg-theme-bg-tertiary hover:text-theme-primary'
                        }`}
                >
                    <Eraser className={`w-4 h-4 ${isEraserActive ? 'animate-pulse' : ''}`} />
                    {!isCollapsed && <span className="text-[11px] font-bold uppercase tracking-wider animate-fade-in">Eraser</span>}
                </button>
                {!isCollapsed && (
                    <p className="mt-2 text-[10px] text-theme-tertiary text-center font-medium italic animate-fade-in">
                        Drag shapes to canvas
                    </p>
                )}
            </div>
        </aside>
    );
}
