import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Info, Filter, Search, Tag, Settings, Database, Server, Type, ToggleLeft, Calendar, List, Book } from 'lucide-react';
import api from '../../services/api_service';
import { dictionaryService } from '../dictionary/api/dictionaryService';
import { symbolService } from '../../services/symbolService';

export default function AttributesManagement({ organizationId }) {
    const [attributes, setAttributes] = useState([]);
    const [dictionaryItems, setDictionaryItems] = useState([]);
    const [symbols, setSymbols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const lastClickRef = useRef({ id: null, time: 0 });

    const handleAttributeClick = (attr) => {
        const now = Date.now();
        const THRESHOLD = 250;
        
        if (lastClickRef.current.id === attr.id && (now - lastClickRef.current.time) < THRESHOLD) {
            handleOpenModal(attr);
            lastClickRef.current = { id: null, time: 0 };
        } else {
            handleSelectOne(attr.id);
            lastClickRef.current = { id: attr.id, time: now };
        }
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Single-line Text',
        scope: 'Notation Element',
        symbolSet: 'common', // Replaced notationType
        symbolName: 'All', // Replaced elementType
        options: [], // For List and Date types
        readOnly: false,
        isDiagramSpecific: false,
        processId: null
    });

    const [orgProcesses, setOrgProcesses] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [newOption, setNewOption] = useState('');

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        type: 'All',
        category: 'All', // All, Normal, Diagram Specific
        symbolSet: 'All'
    });

    const DATA_TYPES = [
        { id: 'Single-line Text', icon: <Type size={16} /> },
        { id: 'Multi-line text', icon: <Type size={16} /> },
        { id: 'List', icon: <Database size={16} /> },
        { id: 'Dictionary', icon: <Book size={16} /> },
        { id: 'Date', icon: <Calendar size={16} /> },
        { id: 'Boolean', icon: <ToggleLeft size={16} /> }
    ];

    const SCOPE_OPTIONS = ['Notation Element'];
    const NOTATION_TYPES = ['EPC', 'BPMN'];
    const EPC_ELEMENTS = ['Function', 'Event', 'Role', 'Process Path', 'XOR', 'OR', 'AND', 'Rule', 'System', 'Document', 'Database', 'Info', 'Organizational unit', 'Person', 'Department', 'Risk', 'Control'];

    useEffect(() => {
        if (organizationId) {
            fetchAttributes();
            fetchDictionaryItems();
            fetchSymbols();
            fetchOrgProcesses();
        }
    }, [organizationId]);

    const fetchSymbols = async () => {
        try {
            const data = await symbolService.getAll();
            setSymbols(data);
        } catch (error) {
            console.error("Failed to fetch symbols", error);
        }
    };

    const fetchDictionaryItems = async () => {
        try {
            const data = await dictionaryService.getAllRequest(organizationId);
            setDictionaryItems(data);
        } catch (error) {
            if (error?.response?.status === 403 || error?.message?.includes('403')) {
                console.info("Dictionary module is disabled for this organization. Skipping dictionary fetch.");
                setDictionaryItems([]);
            } else {
                console.error("Failed to fetch dictionary items", error);
            }
        }
    };

    const fetchAttributes = async () => {
        try {
            const res = await api.get(`/admin/organizations/${organizationId}`);
            // Extracted from the organization data directly since we fetch the full org details
            setAttributes(res.data.organization?.custom_attributes || []);
            setOrgProcesses(res.data.processes || []);
        } catch (error) {
            console.error("Failed to fetch attributes", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgProcesses = async () => {
        try {
            // This is actually redundant if we fetch org details in fetchAttributes, 
            // but keeping it as a standalone function for clarity or if fetchAttributes changes.
            const res = await api.get(`/admin/organizations/${organizationId}`);
            setOrgProcesses(res.data.processes || []);
        } catch (error) {
            console.error("Failed to fetch processes", error);
        }
    };

    const handleOpenModal = (attr = null) => {
        if (attr) {
            setEditingId(attr.id);
            setFormData({
                name: attr.name,
                description: attr.description || '',
                type: attr.type,
                scope: attr.scope?.type || 'Notation Element',
                symbolSet: attr.scope?.symbolSet || attr.scope?.notationType || 'common',
                symbolName: attr.scope?.symbolName || attr.scope?.elementType || 'All',
                options: attr.options || [],
                readOnly: attr.read_only || false,
                isDiagramSpecific: attr.is_diagram_specific || false,
                processId: attr.process_id || null
            });
            setNewOption('');
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                type: 'Single-line Text',
                scope: 'Notation Element',
                symbolSet: 'common',
                symbolName: 'All',
                options: [],
                readOnly: false,
                isDiagramSpecific: false,
                processId: null
            });
            setNewOption('');
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert("Attribute name is required");
            return;
        }

        if (formData.type === 'List' && formData.options.length === 0) {
            alert("Please add at least one option for the List.");
            return;
        }

        if (formData.type === 'Dictionary' && formData.options.length === 0) {
            alert("Please select a Dictionary Item.");
            return;
        }

        if (formData.isDiagramSpecific && !formData.processId) {
            alert("Please select a process for the diagram-specific attribute.");
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            scope: {
                type: formData.scope,
                symbolSet: formData.scope === 'Notation Element' ? formData.symbolSet : null,
                symbolName: formData.scope === 'Notation Element' ? formData.symbolName : null,
            },
            options: formData.options,
            read_only: formData.readOnly,
            is_diagram_specific: formData.isDiagramSpecific,
            process_id: formData.isDiagramSpecific ? formData.processId : null
        };

        try {
            if (editingId) {
                await api.put(`/admin/organizations/${organizationId}/attributes/${editingId}`, payload);
            } else {
                await api.post(`/admin/organizations/${organizationId}/attributes`, payload);
            }
            setShowModal(false);
            fetchAttributes();
        } catch (error) {
            console.error("Failed to save attribute", error);
            alert("Failed to save attribute");
        }
    };

    const addOption = () => {
        if (newOption.trim() && !formData.options.includes(newOption.trim())) {
            setFormData(prev => ({
                ...prev,
                options: [...prev.options, newOption.trim()]
            }));
            setNewOption('');
        }
    };

    const removeOption = (index) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this attribute?")) return;
        try {
            await api.delete(`/admin/organizations/${organizationId}/attributes/${id}`);
            setSelectedAttributes(prev => prev.filter(attrId => attrId !== id));
            fetchAttributes();
        } catch (error) {
            console.error("Failed to delete attribute", error);
            alert("Failed to delete attribute");
        }
    };

    const handleSelectAll = (e, currentFiltered) => {
        if (e.target.checked) {
            setSelectedAttributes(currentFiltered.map(attr => attr.id));
        } else {
            setSelectedAttributes([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedAttributes(prev => 
            prev.includes(id) ? prev.filter(attrId => attrId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedAttributes.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedAttributes.length} selected attribute(s)?`)) return;
        
        try {
            await api.post(`/admin/organizations/${organizationId}/attributes/bulk-delete`, { 
                attr_ids: selectedAttributes 
            });
            setSelectedAttributes([]);
            fetchAttributes();
        } catch (error) {
            console.error("Failed to bulk delete attributes", error);
            alert("Failed to bulk delete attributes");
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-theme-tertiary">Loading attributes...</div>;
    }

    const uniqueSets = [...new Set(symbols.map(s => s.set))];

    const filteredAttributes = attributes.filter(attr => {
        const matchesSearch = attr.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'All' || attr.type === filters.type;
        const matchesCategory = filters.category === 'All' ||
            (filters.category === 'Normal' && !attr.is_diagram_specific) ||
            (filters.category === 'Diagram Specific' && attr.is_diagram_specific);
        const matchesSet = filters.symbolSet === 'All' || (attr.scope?.symbolSet || attr.scope?.notationType) === filters.symbolSet;
        return matchesSearch && matchesType && matchesCategory && matchesSet;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-theme-primary">Custom Attributes</h3>
                    <p className="text-theme-tertiary text-sm mt-1">Define dynamic data fields for notation elements.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedAttributes.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 size={16} /> Delete Selected ({selectedAttributes.length})
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={16} /> New Attribute
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-app-surface border border-theme-border p-4 rounded-xl shadow-sm">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        placeholder="Search by name..."
                        className="w-full bg-theme-input border border-theme-border rounded-lg pl-10 pr-4 py-2 text-sm text-theme-primary outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-theme-tertiary" />
                    <select
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                        className="bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="All">All Categories</option>
                        <option value="Normal">Normal (Org-wide)</option>
                        <option value="Diagram Specific">Diagram Specific</option>
                    </select>

                    <select
                        value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                        className="bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="All">All Types</option>
                        {DATA_TYPES.map(dt => (
                            <option key={dt.id} value={dt.id}>{dt.id}</option>
                        ))}
                    </select>

                    <select
                        value={filters.symbolSet}
                        onChange={e => setFilters({ ...filters, symbolSet: e.target.value })}
                        className="bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="All">All Symbol Sets</option>
                        {uniqueSets.map(set => (
                            <option key={set} value={set}>{set}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List Attributes */}
            <div className="bg-app-surface border border-theme-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent transition-all duration-300 cursor-pointer ${
                                        selectedAttributes.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                                    }`}
                                    checked={filteredAttributes.length > 0 && selectedAttributes.length === filteredAttributes.length}
                                    onChange={(e) => handleSelectAll(e, filteredAttributes)}
                                />
                            </th>
                            <th className="px-6 py-4">Attribute Details</th>
                            <th className="px-6 py-4">Data Type</th>
                            <th className="px-6 py-4">Scope</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                        {filteredAttributes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-theme-tertiary">
                                    {attributes.length === 0 ? "No custom attributes defined yet." : "No attributes match your filters."}
                                </td>
                            </tr>
                        ) : (
                            filteredAttributes.map((attr) => (
                                <tr 
                                    key={attr.id} 
                                    onClick={() => handleAttributeClick(attr)}
                                    className={`transition-all duration-300 cursor-pointer group ${
                                        selectedAttributes.includes(attr.id) 
                                            ? 'bg-indigo-500/[0.08] shadow-[inset_3px_0_0_0_#6366f1]' 
                                            : 'hover:bg-theme-bg-tertiary hover:shadow-[inset_3px_0_0_0_rgba(99,102,241,0.3)] shadow-[inset_3px_0_0_0_transparent]'
                                    }`}
                                >
                                    <td className="px-6 py-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent pointer-events-none transition-all duration-300 ${
                                                selectedAttributes.includes(attr.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-40 group-hover:scale-100'
                                            }`}
                                            checked={selectedAttributes.includes(attr.id)}
                                            readOnly
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-theme-input rounded-lg group-hover:bg-indigo-500/10 transition-colors">
                                                <Tag className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-theme-primary flex items-center gap-2">
                                                    {attr.name}
                                                    {attr.read_only && (
                                                        <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">Read Only</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-theme-tertiary mt-0.5" title={attr.id}>
                                                    ID: <span className="font-mono">{attr.id.substring(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-theme-input border border-theme-border text-theme-secondary">
                                            {attr.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-theme-secondary">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{attr.scope?.type || 'Notation Element'}</span>
                                            {attr.scope?.type === 'Notation Element' && (
                                                <span className="text-xs text-theme-tertiary">
                                                    {attr.scope.symbolSet || attr.scope.notationType} / {attr.scope.symbolName || attr.scope.elementType}
                                                </span>
                                            )}
                                            {attr.is_diagram_specific && (
                                                <span className="text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 w-fit">
                                                    Diagram: {orgProcesses.find(p => p._id === attr.process_id)?.name || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenModal(attr); }} 
                                                className="p-1.5 text-theme-secondary hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors" 
                                                title="Edit Attribute"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(attr.id); }} 
                                                className="p-1.5 text-theme-secondary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" 
                                                title="Delete Attribute"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-app-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary/50">
                                <h3 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-400" />
                                    {editingId ? 'Edit Custom Attribute' : 'New Custom Attribute'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-theme-tertiary hover:text-theme-primary transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Attribute Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="e.g. Cost Center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Data Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                let initialOptions = [];
                                                if (newType === 'List') {
                                                    initialOptions = formData.options;
                                                } else if (newType === 'Dictionary' && dictionaryItems.length > 0) {
                                                    initialOptions = [dictionaryItems[0]._id];
                                                }

                                                setFormData({
                                                    ...formData,
                                                    type: newType,
                                                    options: initialOptions
                                                });
                                            }}
                                            disabled={!!editingId} // Cannot change type after creation
                                            className={`w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {DATA_TYPES.map(dt => (
                                                <option key={dt.id} value={dt.id}>{dt.id}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors resize-none h-20"
                                        placeholder="Optional description for tooltip..."
                                    />
                                </div>

                                {/* Scope Configuration */}
                                <div className="border border-theme-border rounded-lg p-4 bg-theme-bg-tertiary/20 space-y-4">
                                    <h4 className="text-sm font-bold text-theme-primary flex items-center gap-2">
                                        <Database size={14} className="text-indigo-400" />
                                        Scope Configuration
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Symbol Management Set</label>
                                            <select
                                                value={formData.symbolSet}
                                                onChange={e => setFormData({ ...formData, symbolSet: e.target.value, symbolName: 'All' })}
                                                disabled={!!editingId}
                                                className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {uniqueSets.map(set => (
                                                    <option key={set} value={set}>{set}</option>
                                                ))}
                                                {uniqueSets.length === 0 && <option value="common">common</option>}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Name</label>
                                            <select
                                                value={formData.symbolName}
                                                onChange={e => setFormData({ ...formData, symbolName: e.target.value })}
                                                disabled={!!editingId}
                                                className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="All">All Elements</option>
                                                {symbols.filter(s => s.set === formData.symbolSet).map(s => (
                                                    <option key={s._id || s.name} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Diagram-Specific Toggle */}
                                <div className="border border-theme-border rounded-lg p-4 bg-theme-bg-tertiary/20 space-y-4">
                                    <h4 className="text-sm font-bold text-theme-primary flex items-center gap-2">
                                        <Filter size={14} className="text-indigo-400" />
                                        Diagram Scope
                                    </h4>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isDiagramSpecific}
                                            onChange={e => setFormData({
                                                ...formData,
                                                isDiagramSpecific: e.target.checked,
                                                processId: e.target.checked ? formData.processId : null
                                            })}
                                            disabled={!!editingId}
                                            className="w-4 h-4 rounded border-theme-border text-indigo-500"
                                        />
                                        <span className="text-sm text-theme-secondary">
                                            Diagram Specific
                                        </span>
                                    </label>

                                    {formData.isDiagramSpecific && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">
                                                Select Process
                                            </label>
                                            <select
                                                value={formData.processId || ''}
                                                onChange={e => setFormData({ ...formData, processId: e.target.value })}
                                                disabled={!!editingId}
                                                className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                <option value="" disabled>Select a process...</option>
                                                {orgProcesses
                                                    .filter(p => p.type === 'file' && p.diagram_type === 'process')
                                                    .map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* List Options Configuration */}
                                {formData.type === 'List' && (
                                    <div className="bg-theme-bg-tertiary/30 p-4 rounded-lg border border-theme-border/50">
                                        <h4 className="text-sm font-bold text-theme-primary mb-4 flex items-center gap-2">
                                            <List size={14} className="text-indigo-400" />
                                            List Options
                                        </h4>

                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newOption}
                                                onChange={(e) => setNewOption(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                                                className="flex-1 bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent"
                                                placeholder="Add an option..."
                                            />
                                            <button
                                                type="button"
                                                onClick={addOption}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            {formData.options.map((opt, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-theme-input px-3 py-2 rounded-md border border-theme-border">
                                                    <span className="text-sm text-theme-primary">{opt}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOption(idx)}
                                                        className="text-theme-tertiary hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.options.length === 0 && (
                                                <p className="text-xs text-theme-tertiary italic text-center py-2">No options added yet.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Dictionary Configuration */}
                                {formData.type === 'Dictionary' && (
                                    <div className="bg-theme-bg-tertiary/30 p-4 rounded-lg border border-theme-border/50">
                                        <h4 className="text-sm font-bold text-theme-primary mb-4 flex items-center gap-2">
                                            <Book size={14} className="text-indigo-400" />
                                            Select Dictionary
                                        </h4>
                                        <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Dictionary Item</label>
                                        <select
                                            value={formData.options && formData.options[0] ? formData.options[0] : ''}
                                            onChange={(e) => setFormData({ ...formData, options: [e.target.value] })}
                                            disabled={!!editingId}
                                            className={`w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="" disabled>Select a dictionary item...</option>
                                            {dictionaryItems.map(item => (
                                                <option key={item._id} value={item._id}>{item.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-theme-tertiary mt-2">
                                            The node properties will display a dropdown showing the key-value pairs of the selected dictionary.
                                        </p>
                                    </div>
                                )}

                                {/* Date Format Configuration (Moved outside Settings Box) */}
                                {formData.type === 'Date' && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-wider mb-1">Date Format</label>
                                        <select
                                            value={formData.options && formData.options[0] ? formData.options[0] : 'd/m/y'}
                                            onChange={(e) => setFormData({ ...formData, options: [e.target.value] })}
                                            className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="d/m/y">DD/MM/YYYY (e.g. 15/02/2025)</option>
                                            <option value="m/d/y">MM/DD/YYYY (e.g. 02/15/2025)</option>
                                            <option value="Y-m-d">YYYY-MM-DD (e.g. 2025-02-15)</option>
                                        </select>
                                    </div>
                                )}

                                {/* Settings & Constraints */}
                                <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 space-y-3">
                                    <h4 className="text-sm font-bold text-theme-primary flex items-center gap-2">
                                        <Info size={16} className="text-theme-tertiary" />
                                        Settings & Constraints
                                    </h4>

                                    <div className="pl-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.readOnly}
                                                onChange={e => !editingId && setFormData({ ...formData, readOnly: e.target.checked })}
                                                disabled={!!editingId} // Disable change on edit
                                                className="w-4 h-4 rounded border-theme-border text-indigo-500 focus:ring-indigo-500/20 bg-theme-bg-secondary disabled:opacity-50"
                                            />
                                            <span className="text-sm text-theme-secondary">Read-only (Irreversible once created)</span>
                                        </label>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-theme-border bg-theme-bg-tertiary/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    <Save size={16} />
                                    {editingId ? 'Save Changes' : 'Create Attribute'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
