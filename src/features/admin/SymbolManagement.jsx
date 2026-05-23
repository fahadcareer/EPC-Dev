import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, Edit, Loader2, Database, List, Check, X,
    Circle, Square, Diamond, ArrowRight, Type, Layout, Hexagon, Box, User, Users,
    Building2, Globe, Server, Timer, MessageCircle, AlertCircle, GitMerge, Rows, Columns,
    FileText, HelpCircle, Info, Triangle, MousePointer2, ChevronLeft, ChevronRight, ChevronDown, Mail, Clock, Zap, Heart
} from 'lucide-react';
import { symbolService } from '../../services/symbolService';
import Toast from '../../components/ui/Toast';
import { FALLBACK_SHAPE_SETS } from '../../components/shared/slide_bar';

// Map of icon names to Lucide components for preview
const ICON_MAP = {
    Circle, Square, Diamond, ArrowRight, Type, Layout, Hexagon, Box, User, Users,
    Building2, Globe, Server, Timer, MessageCircle, AlertCircle, GitMerge, Rows, Columns,
    FileText, HelpCircle, Info, Triangle, MousePointer2, ChevronLeft, ChevronRight, Database, Mail, Clock, Zap, Heart
};

export default function SymbolManagement() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSet, setFilterSet] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await symbolService.getAll();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch symbols", error);
            setToast({ show: true, message: 'Failed to load symbols', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this symbol? This might affect existing diagrams if they rely on this definition.')) return;
        try {
            await symbolService.delete(id);
            setItems(items.filter(i => i._id !== id));
            setToast({ show: true, message: 'Symbol deleted', type: 'success' });
        } catch (error) {
            setToast({ show: true, message: 'Failed to delete symbol', type: 'error' });
        }
    };

    const handleSeed = async () => {
        if (!window.confirm('This will overwrite all existing symbols with the default set. Are you sure?')) return;
        setProcessing(true);
        try {
            // Flatten FALLBACK_SHAPE_SETS to array
            const seedData = [];
            Object.entries(FALLBACK_SHAPE_SETS).forEach(([setKey, setVal]) => {
                setVal.categories.forEach(cat => {
                    cat.shapes.forEach(shape => {
                        seedData.push({
                            ...shape,
                            name: shape.label, // Map label to name for backend model
                            set: setKey,
                            category: cat.label,
                            iconName: shape.iconName || (shape.icon ? shape.icon.displayName : 'Square'), // Fallback
                            // Remove actual component reference before sending to backend
                            icon: undefined
                        });
                    });
                });
            });

            await symbolService.seed(seedData);
            await fetchItems();
            setToast({ show: true, message: 'Database seeded successfully', type: 'success' });
        } catch (error) {
            console.error("Seed error", error);
            setToast({ show: true, message: 'Failed to seed database', type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const uniqueSets = ['all', ...new Set(items.map(i => i.set))];
    const uniqueTypes = ['all', ...new Set(items.map(i => i.type))];

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSet = filterSet === 'all' || item.set === filterSet;
        const matchesType = filterType === 'all' || item.type === filterType;

        return matchesSearch && matchesSet && matchesType;
    });

    return (
        <div className="text-theme-primary">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

            <div className="w-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-primary to-theme-tertiary bg-clip-text text-transparent">
                            Symbol Management
                        </h1>
                        <p className="text-theme-tertiary mt-2">Manage diagram symbols, icons, and legend descriptions</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSeed}
                            disabled={processing}
                            className="px-4 py-2 border border-theme-border hover:bg-theme-bg-tertiary text-theme-primary rounded-lg flex items-center gap-2 transition-colors font-medium"
                            title="Reset to defaults"
                        >
                            {processing ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                            Reset / Seed DB
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg"
                        >
                            <Plus size={20} />
                            Add Symbol
                        </button>
                    </div>
                </div>

                <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-theme-border bg-app-bg/50 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                            <input
                                type="text"
                                placeholder="Search symbols..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-theme-input border border-theme-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-theme-accent transition-colors"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={filterSet}
                                onChange={(e) => setFilterSet(e.target.value)}
                                className="bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-theme-accent"
                            >
                                {uniqueSets.map(set => (
                                    <option key={set} value={set}>{set === 'all' ? 'All Sets' : set}</option>
                                ))}
                            </select>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-theme-accent"
                            >
                                {uniqueTypes.map(type => (
                                    <option key={type} value={type}>{type === 'all' ? 'All Types' : type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs text-theme-tertiary ml-auto">
                            Total: {items.length} symbols
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Icon</th>
                                    <th className="px-6 py-4">Name & Description</th>
                                    <th className="px-6 py-4">Set / Category</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-theme-tertiary">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-theme-accent" size={32} />
                                            <p className="text-sm animate-pulse">Loading symbols...</p>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-theme-tertiary">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <Box size={48} className="mb-4" />
                                                <p className="text-lg font-medium">No symbols found</p>
                                                <p className="text-sm">Seed the database or add a new symbol</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {filteredItems.map((item, index) => {
                                            const IconComponent = ICON_MAP[item.iconName] || Box;
                                            return (
                                                <motion.tr
                                                    key={item._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    className="hover:bg-theme-bg-tertiary/30 transition-all group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className={`w-10 h-10 rounded-lg bg-theme-bg-tertiary border border-theme-border flex items-center justify-center text-theme-primary ${item.borderClass || ''}`}>
                                                            {item.symbol ? (
                                                                <span className="font-bold text-xs">{item.symbol}</span>
                                                            ) : (
                                                                <IconComponent size={20} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <span className="font-bold text-theme-primary text-sm">{item.name}</span>
                                                            <p className="text-xs text-theme-tertiary line-clamp-2 max-w-md mt-0.5">{item.description || 'No description provided.'}</p>
                                                            {/* ID Removed */}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-medium text-theme-secondary bg-theme-bg-tertiary px-2 py-0.5 rounded w-fit border border-theme-border">
                                                                {item.set}
                                                            </span>
                                                            <span className="text-xs text-theme-tertiary px-2">
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-mono text-theme-tertiary bg-theme-input px-2 py-1 rounded">
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-2 text-theme-tertiary hover:text-theme-accent hover:bg-theme-accent/10 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item._id)}
                                                                className="p-2 text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <SymbolModal
                show={showModal}
                onClose={() => setShowModal(false)}
                itemToEdit={editingItem}
                onSuccess={fetchItems}
                existingSets={uniqueSets.filter(s => s !== 'all')}
                existingCategories={[...new Set(items.map(i => i.category))]}
            />
        </div>
    );
}

function SymbolModal({ show, onClose, itemToEdit, onSuccess, existingSets, existingCategories }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        iconName: 'Square',
        type: 'function', // event, function, etc.
        set: '',
        category: '',
        symbol: '',
        borderClass: '',
        shapeType: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                name: itemToEdit.name,
                description: itemToEdit.description || '',
                iconName: itemToEdit.iconName || 'Square',
                type: itemToEdit.type || 'function',
                set: itemToEdit.set || 'common',
                category: itemToEdit.category || 'General',
                symbol: itemToEdit.symbol || '',
                borderClass: itemToEdit.borderClass || '',
                shapeType: itemToEdit.shapeType || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                iconName: 'Square',
                type: 'function',
                set: '',
                category: '',
                symbol: '',
                borderClass: '',
                shapeType: ''
            });
        }
    }, [itemToEdit, show]);

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (itemToEdit) {
                await symbolService.update(itemToEdit._id, formData);
            } else {
                await symbolService.create(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save symbol");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-app-surface border border-theme-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-theme-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-theme-primary">
                        {itemToEdit ? 'Edit Symbol' : 'Add New Symbol'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-theme-bg-tertiary rounded-lg text-theme-tertiary hover:text-theme-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="symbolForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-tertiary mb-1">Name</label>
                                <input
                                    required
                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:border-theme-accent outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-tertiary mb-1">Icon Name (Lucide)</label>
                                <IconPicker
                                    value={formData.iconName}
                                    onChange={iconName => setFormData({ ...formData, iconName })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-theme-tertiary mb-1">Description (for Legend)</label>
                            <textarea
                                className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:border-theme-accent outline-none min-h-[80px]"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-tertiary mb-1">Set (Group)</label>
                                <input
                                    required
                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:border-theme-accent outline-none"
                                    value={formData.set}
                                    placeholder="e.g., common, bpmn"
                                    list="set-options"
                                    onChange={e => setFormData({ ...formData, set: e.target.value })}
                                />
                                <datalist id="set-options">
                                    {existingSets?.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-tertiary mb-1">Category</label>
                                <input
                                    required
                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:border-theme-accent outline-none"
                                    value={formData.category}
                                    placeholder="e.g., General, Events"
                                    list="category-options"
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                                <datalist id="category-options">
                                    {existingCategories?.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-tertiary mb-1">Type (System)</label>
                                <select
                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:border-theme-accent outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="event">Event</option>
                                    <option value="function">Function</option>
                                    <option value="rule">Rule / Gateway</option>
                                    <option value="bpmn_event">BPMN Event</option>
                                    <option value="bpmn_task">BPMN Task</option>
                                    <option value="bpmn_gateway">BPMN Gateway</option>
                                    <option value="org_element">Org Element</option>
                                    <option value="system">System</option>
                                    <option value="data">Data / Info</option>
                                    <option value="group">Group</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-theme-border flex justify-end gap-3 bg-theme-bg-tertiary/20">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        form="symbolForm"
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                        {itemToEdit ? 'Save Changes' : 'Create Symbol'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function IconPicker({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const SelectedIcon = ICON_MAP[value] || Box;

    const filteredIcons = Object.keys(ICON_MAP).filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    ).sort();

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:border-theme-accent outline-none flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2">
                    <SelectedIcon size={18} />
                    <span>{value}</span>
                </div>
                <ChevronDown size={16} className="text-theme-tertiary" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 top-full mt-1 w-full bg-app-surface border border-theme-border rounded-lg shadow-xl overflow-hidden max-h-60 flex flex-col">
                        <div className="p-2 border-b border-theme-border sticky top-0 bg-app-surface">
                            <input
                                autoFocus
                                placeholder="Search icons..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-theme-input border border-theme-border rounded px-2 py-1 text-xs focus:border-theme-accent outline-none"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-2 custom-scrollbar">
                            {filteredIcons.map(iconName => {
                                const Icon = ICON_MAP[iconName];
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => {
                                            onChange(iconName);
                                            setIsOpen(false);
                                        }}
                                        className={`flex flex-col items-center justify-center p-2 rounded hover:bg-theme-bg-tertiary transition-colors ${value === iconName ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-secondary'}`}
                                        title={iconName}
                                    >
                                        <Icon size={20} />
                                        <div className="text-[10px] mt-1 w-full truncate text-center">{iconName}</div>
                                    </button>
                                );
                            })}
                            {filteredIcons.length === 0 && (
                                <div className="col-span-4 text-center py-4 text-xs text-theme-tertiary">
                                    No icons found
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


