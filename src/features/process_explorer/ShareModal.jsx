import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, User, Shield } from 'lucide-react';
import useAuthStore from '../../store/logic/user';
import api from '../../services/api_service';

const ShareModal = ({ isOpen, onClose, process, onSave }) => {
    const user = useAuthStore((state) => state.user);
    // const [activeTab, setActiveTab] = useState('users'); // Removed Users tab
    // const [users, setUsers] = useState([]); // Removed Users list
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]); // Array of { _id, access: 'view', name }
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && user?.organization_id) {
            // fetchUsers(); // Removed user fetching
            fetchDepartments();
            // Initialize selected IDs from the process.shared_with list
            setSelectedUserIds(process?.shared_with || []);
            setSelectedDepartments([]); // Reset departments on open
        }
    }, [isOpen, user, process]);

    // Removed fetchUsers

    const fetchDepartments = async () => {
        try {
            const res = await api.get(`/admin/departments`);
            setDepartments(res.data || []);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const toggleDepartment = (dept) => {
        const existingIndex = selectedDepartments.findIndex(d => d._id === dept._id);
        if (existingIndex >= 0) {
            // Remove
            const newSelection = [...selectedDepartments];
            newSelection.splice(existingIndex, 1);
            setSelectedDepartments(newSelection);
        } else {
            // Add
            setSelectedDepartments([...selectedDepartments, { _id: dept._id, name: dept.name, access: 'view' }]);
        }
    };

    const updateDepartmentAccess = (deptId, accessLevel) => {
        setSelectedDepartments(prev => prev.map(item =>
            item._id === deptId ? { ...item, access: accessLevel } : item
        ));
    };

    // Removed toggleUser and updateUserAccess

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalUserList = [...selectedUserIds];

            // If departments are selected, fetch their users and override permissions
            if (selectedDepartments.length > 0) {
                for (const dept of selectedDepartments) {
                    try {
                        const res = await api.get(`/admin/departments/${dept._id}/users`);
                        const deptUsers = res.data || [];

                        deptUsers.forEach(deptUser => {
                            if (deptUser._id === user._id) return; // Skip self

                            const existingIndex = finalUserList.findIndex(s => s.user_id === deptUser._id);
                            if (existingIndex >= 0) {
                                // OVERRIDE existing
                                finalUserList[existingIndex] = {
                                    ...finalUserList[existingIndex],
                                    access: dept.access
                                };
                            } else {
                                // ADD new
                                finalUserList.push({
                                    user_id: deptUser._id,
                                    access: dept.access
                                });
                            }
                        });
                    } catch (err) {
                        console.error(`Failed to handle department ${dept.name}`, err);
                    }
                }
            }

            // Remove duplicates just in case (though logic above handles it)
            // Ensure unique by user_id
            const uniqueMap = new Map();
            finalUserList.forEach(item => uniqueMap.set(item.user_id, item));
            const uniqueList = Array.from(uniqueMap.values());

            await api.post(`/processes/${process._id}/permissions`, {
                shared_with: uniqueList
            });
            onSave(uniqueList);
            onClose();
        } catch (error) {
            console.error("Failed to update permissions", error);
        } finally {
            setSaving(false);
        }
    };

    // Initialize selectedUserIds from process.shared_with (handling legacy)
    useEffect(() => {
        if (process && process.shared_with) {
            const normalized = process.shared_with.map(item => {
                if (typeof item === 'string') return { user_id: item, access: 'view' };
                return item;
            });
            setSelectedUserIds(normalized);
        } else {
            setSelectedUserIds([]);
        }
    }, [process]);

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-app-surface border border-theme-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-bg shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-theme-primary">Share "{process?.name}"</h3>
                                <p className="text-sm text-theme-tertiary">Manage access permissions</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-theme-tertiary hover:text-white rounded-lg hover:bg-theme-input transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs - Removed Users tab, defaulting to Departments */}
                        <div className="flex border-b border-theme-border shrink-0">
                            <button
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 border-indigo-500 text-indigo-400`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Shield size={16} />
                                    Departments
                                </div>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-theme-border shrink-0 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-theme-input border border-theme-input-border rounded-lg text-theme-primary focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>
                            {selectedDepartments.length > 0 && (
                                <div className="flex items-center gap-2 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                                    <Shield size={14} className="text-indigo-400" />
                                    <span className="text-xs text-indigo-300">
                                        Selected departments will overwrite permissions for their members.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-2 min-h-0">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredDepartments.length === 0 ? (
                                        <div className="text-center py-8 text-theme-tertiary text-sm">No departments found</div>
                                    ) : (
                                        filteredDepartments.map(dept => {
                                            const selectedItem = selectedDepartments.find(item => item._id === dept._id);
                                            const isSelected = !!selectedItem;

                                            return (
                                                <div key={dept._id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-theme-input border border-transparent'}`}>
                                                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleDepartment(dept)}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white' : 'bg-theme-bg-tertiary text-theme-secondary'}`}>
                                                            <Shield className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-theme-primary'}`}>{dept.name}</p>
                                                            <p className="text-xs text-theme-tertiary">{dept.description || 'No description'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isSelected && (
                                                            <select
                                                                value={selectedItem.access}
                                                                onChange={(e) => updateDepartmentAccess(dept._id, e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-xs bg-theme-bg border border-theme-border rounded px-2 py-1 text-theme-primary focus:outline-none focus:border-indigo-500"
                                                            >
                                                                <option value="view">Can View</option>
                                                                <option value="edit">Can Edit</option>
                                                            </select>
                                                        )}

                                                        <div onClick={() => toggleDepartment(dept)} className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer ${isSelected ? 'bg-indigo-500 text-white' : 'border border-theme-tertiary hover:border-theme-primary'}`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-theme-border bg-theme-bg flex justify-between items-center shrink-0">
                            <div className="text-xs text-theme-tertiary">
                                {selectedUserIds.length} users currently shared
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="px-4 py-2 text-sm text-theme-secondary hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2">
                                    {saving ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Access'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
