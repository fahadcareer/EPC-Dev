import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, Plus, Search, Trash2, Edit, Loader2, Database, List
} from 'lucide-react';
import { dictionaryService } from './api/dictionaryService';
import DictionaryItemModal from './components/DictionaryItemModal';
import Toast from '../../components/ui/Toast';
import api from '../../services/api_service';
import NETWORK_URLS from '../../config/network_string';
import useAuthStore from '../../store/logic/user';

export default function DictionaryManagement({ organizationId }) {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { user } = useAuthStore();
    const [orgAttributes, setOrgAttributes] = useState([]);

    useEffect(() => {
        fetchItems();
        fetchOrgAttributes();
    }, [user, organizationId]);

    const fetchOrgAttributes = async () => {
        const orgId = organizationId || (user ? (user.organization_id || user.organization) : null);
        if (!orgId) return;
        try {
            const res = await api.get(NETWORK_URLS.Organization(orgId));
            setOrgAttributes(res.data.organization?.custom_attributes || res.data.custom_attributes || []);
        } catch (error) {
            console.error("Failed to fetch org attributes", error);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await dictionaryService.getAllRequest(organizationId);
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch dictionary items", error);
            setToast({ show: true, message: 'Failed to load dictionary items', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await dictionaryService.deleteRequest(id);
            setItems(items.filter(i => i._id !== id));
            setToast({ show: true, message: 'Item deleted', type: 'success' });
        } catch (error) {
            setToast({ show: true, message: 'Failed to delete item', type: 'error' });
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

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="text-theme-primary">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

            <div className="w-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-primary to-theme-tertiary bg-clip-text text-transparent">
                            Dictionary Library
                        </h1>
                        <p className="text-theme-tertiary mt-2">Manage standard definitions and attributes for your organization</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg"
                    >
                        <Plus size={20} />
                        Add Item
                    </button>
                </div>

                {/* Stats / Header Cards could go here similar to Roles page */}

                <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-theme-border bg-app-bg/50 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                            <input
                                type="text"
                                placeholder="Search definitions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-theme-input border border-theme-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-theme-accent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Name & Description</th>
                                    <th className="px-6 py-4">Attributes</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-theme-tertiary">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-theme-accent" size={32} />
                                            <p className="text-sm animate-pulse">Loading dictionary...</p>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-theme-tertiary">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <Book size={48} className="mb-4" />
                                                <p className="text-lg font-medium">No items found</p>
                                                <p className="text-sm">Create your first dictionary definition</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {filteredItems.map((item, index) => (
                                            <motion.tr
                                                key={item._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-theme-bg-tertiary/30 transition-all group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-theme-bg-tertiary border border-theme-border flex items-center justify-center text-theme-secondary">
                                                            <Database size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-theme-primary text-base">{item.name}</span>
                                                            <p className="text-sm text-theme-tertiary line-clamp-2 max-w-md">{item.description || 'No description provided.'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2 max-w-sm">
                                                        {item.metadata && item.metadata.length > 0 ? (
                                                            item.metadata.map((meta, i) => (
                                                                <span key={i} className="px-2 py-1 rounded text-xs font-medium bg-theme-bg-tertiary border border-theme-border text-theme-secondary">
                                                                    {meta.key}: {meta.value}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-theme-tertiary italic">No attributes</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="p-2 text-theme-tertiary hover:text-theme-accent hover:bg-theme-accent/10 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="p-2 text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <DictionaryItemModal
                show={showModal}
                onClose={() => setShowModal(false)}
                itemToEdit={editingItem}
                onSuccess={fetchItems}
                orgAttributes={orgAttributes}
            />
        </div>
    );
}
