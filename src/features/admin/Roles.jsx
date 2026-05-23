import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Plus, Search, Trash2, Edit, X, Save,
    ChevronRight, Loader2, Users, Building2, Check
} from 'lucide-react';
import api from '../../services/api_service';
import Toast from '../../components/ui/Toast';

export default function RolesManagement() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const handleSelectOneRole = (roleId) => {
        setSelectedRoles(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    const handleSelectAllRoles = (e, rolesList) => {
        if (e.target.checked) {
            setSelectedRoles(rolesList.map(r => r._id));
        } else {
            setSelectedRoles([]);
        }
    };

    // Form state
    const [newRole, setNewRole] = useState({
        name: '',
        description: '',
        allowed_departments: [], // List of department IDs
        allowed_levels: [],
        access_level: 'viewer',
        is_global: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, deptsRes] = await Promise.all([
                api.get('/roles'),
                api.get('/admin/departments') // Ensure this route matches
            ]);
            setRoles(rolesRes.data);
            setDepartments(deptsRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            // Fallback for depts if route fails while we are building it
            if (error?.response?.config?.url?.includes('departments')) {
                setDepartments([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const roleData = {
                name: newRole.name, // Allow name editing? Maybe. Standardize only on creation if needed.
                description: newRole.description,
                allowed_departments: newRole.allowed_departments,
                allowed_levels: newRole.allowed_levels || [],
                access_level: newRole.access_level || 'viewer',
                is_global: newRole.is_global || false
            };

            // Standardize name only if creating new, or let backend handle it?
            // If editing, we might Keep name as is or allow change.
            // For now, let's just send the data.

            if (isEditing) {
                await api.put(`/roles/${editingId}`, roleData);
                setRoles(roles.map(r => r._id === editingId ? { ...r, ...roleData } : r));
                setToast({ show: true, message: 'Role updated successfully', type: 'success' });
            } else {
                // Determine system ID style name on create
                roleData.name = roleData.name.toLowerCase().replace(/\s+/g, '');
                const res = await api.post('/roles', roleData);
                setRoles([...roles, { ...roleData, _id: res.data.id }]);
                setToast({ show: true, message: 'Role created successfully', type: 'success' });
            }

            setNewRole({ name: '', description: '', allowed_departments: [], allowed_levels: [], access_level: 'viewer', is_global: false });
            setShowCreateModal(false);
            setIsEditing(false);
            setEditingId(null);
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to save role';
            setToast({ show: true, message: msg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (role) => {
        let defaultAccess = role.access_level || 'viewer';
        if (!role.access_level && ['admin', 'system_admin', 'designer', 'manager'].includes(role.name)) {
            defaultAccess = 'editor';
        }
        let defaultGlobal = role.is_global || false;
        if (['admin', 'system_admin', 'manager'].includes(role.name)) {
            defaultGlobal = true; // System admins are global by default usually
        }

        setNewRole({
            name: role.name,
            description: role.description || '',
            allowed_departments: role.allowed_departments || [],
            allowed_levels: role.allowed_levels || [],
            access_level: defaultAccess,
            is_global: defaultGlobal
        });
        setIsEditing(true);
        setEditingId(role._id);
        setShowCreateModal(true);
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;

        try {
            await api.delete(`/roles/${roleId}`);
            setRoles(roles.filter(r => r._id !== roleId));
            setToast({ show: true, message: 'Role deleted', type: 'success' });
        } catch (error) {
            setToast({ show: true, message: 'Failed to delete role', type: 'error' });
        }
    };

    const toggleDepartment = (deptId) => {
        setNewRole(prev => {
            const current = prev.allowed_departments || [];
            if (current.includes(deptId)) {
                return { ...prev, allowed_departments: current.filter(id => id !== deptId) };
            } else {
                return { ...prev, allowed_departments: [...current, deptId] };
            }
        });
    };

    const filteredRoles = roles.filter(role =>
        role.name !== 'superadmin' && // explicit hide for safety
        (role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-app-bg text-theme-primary p-8">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

            <div className="w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-primary to-theme-tertiary bg-clip-text text-transparent">
                            Role Management
                        </h1>
                        <p className="text-theme-tertiary mt-2">Define and manage user roles and permissions</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} />
                        Create Role
                    </button>
                </div>

                {/* KPI/Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={64} className="text-indigo-500" />
                        </div>
                        <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Total Roles</p>
                        <h3 className="text-3xl font-bold mt-1 text-theme-primary">
                            {roles.filter(r => r.name !== 'superadmin').length}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Active in Organization
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield size={64} className="text-amber-500" />
                        </div>
                        <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Global Roles</p>
                        <h3 className="text-3xl font-bold mt-1 text-theme-primary">
                            {roles.filter(r => r.name !== 'superadmin' && (r.is_global || ['admin', 'system_admin'].includes(r.name))).length}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-xs text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Full Organization Access
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building2 size={64} className="text-emerald-500" />
                        </div>
                        <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Department Roles</p>
                        <h3 className="text-3xl font-bold mt-1 text-theme-primary">
                            {roles.filter(r => r.name !== 'superadmin' && !r.is_global && !['admin', 'system_admin'].includes(r.name)).length}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Department Specific Access
                        </div>
                    </motion.div>
                </div>

                {/* Content */}
                <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden shadow-xl">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-theme-border bg-app-bg/50 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-theme-input border border-theme-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent transition-all duration-300 cursor-pointer ${
                                                selectedRoles.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                                            }`}
                                            checked={filteredRoles.length > 0 && selectedRoles.length === filteredRoles.length}
                                            onChange={(e) => handleSelectAllRoles(e, filteredRoles)}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Role Details</th>
                                    <th className="px-6 py-4">Access Scope</th>
                                    <th className="px-6 py-4">Departments</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-theme-tertiary">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={32} />
                                            <p className="text-sm animate-pulse">Loading access roles...</p>
                                        </td>
                                    </tr>
                                ) : filteredRoles.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-theme-tertiary">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <Search size={48} className="mb-4" />
                                                <p className="text-lg font-medium">No roles found</p>
                                                <p className="text-sm">Try adjusting your search criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {filteredRoles.map((role, index) => (
                                            <motion.tr
                                                key={role._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => handleSelectOneRole(role._id)}
                                                className={`transition-all duration-300 cursor-pointer group ${
                                                    selectedRoles.includes(role._id) 
                                                        ? 'bg-indigo-500/[0.08] shadow-[inset_3px_0_0_0_#6366f1]' 
                                                        : 'hover:bg-theme-bg-tertiary hover:shadow-[inset_3px_0_0_0_rgba(99,102,241,0.3)] shadow-[inset_3px_0_0_0_transparent]'
                                                }`}
                                            >
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent pointer-events-none transition-all duration-300 ${
                                                            selectedRoles.includes(role._id) ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-40 group-hover:scale-100'
                                                        }`}
                                                        checked={selectedRoles.includes(role._id)}
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${['admin', 'system_admin'].includes(role.name) ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' :
                                                            role.is_global ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                                                                'bg-theme-bg-tertiary text-theme-secondary border border-theme-border'
                                                            }`}>
                                                            {['admin', 'system_admin'].includes(role.name) ? <Shield size={18} /> :
                                                                role.is_global ? <Users size={18} /> : <Building2 size={18} />}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-theme-primary capitalize text-base">{role.name}</span>
                                                            <p className="text-sm text-theme-tertiary line-clamp-2 max-w-xs">{role.description || 'No description provided.'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        {(role.access_level === 'editor' || ['admin', 'system_admin', 'designer', 'manager'].includes(role.name)) ? (
                                                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                <Edit size={12} />
                                                                Editor Access
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                <Users size={12} />
                                                                View Only
                                                            </span>
                                                        )}

                                                        {(role.is_global || ['admin', 'system_admin'].includes(role.name)) && (
                                                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                <Shield size={12} />
                                                                Global Scope
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(role.is_global || ['admin', 'system_admin'].includes(role.name)) ? (
                                                        <span className="text-sm text-theme-tertiary italic">All Departments (Global)</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2 max-w-xs">
                                                            {role.allowed_departments && role.allowed_departments.length > 0 ? (
                                                                role.allowed_departments.map(deptId => {
                                                                    const dept = departments.find(d => d._id === deptId);
                                                                    return dept ? (
                                                                        <span key={deptId} className="px-2.5 py-1 rounded-md text-xs font-medium bg-theme-bg-tertiary border border-theme-border text-theme-secondary hover:border-indigo-500/50 hover:text-indigo-400 transition-colors cursor-default">
                                                                            {dept.name}
                                                                        </span>
                                                                    ) : null;
                                                                })
                                                            ) : (
                                                                <span className="text-xs text-theme-tertiary italic">No departments assigned</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {/* Edit Button Removed as per User Request */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role._id); }}
                                                        className="p-2 text-theme-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
                                                        title="Delete Role"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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

            {/* Create Role Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-app-surface w-full max-w-lg rounded-2xl border border-theme-border shadow-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{isEditing ? 'Edit Role' : 'Create New Role'}</h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setIsEditing(false);
                                        setNewRole({ name: '', description: '', allowed_departments: [], allowed_levels: [], access_level: 'viewer', is_global: false });
                                    }}
                                    className="text-theme-tertiary hover:text-theme-primary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newRole.name}
                                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. Sales Manager"
                                    />
                                    <p className="text-xs text-theme-tertiary mt-1">System ID: {newRole.name.toLowerCase().replace(/\s+/g, '')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Description</label>
                                    <textarea
                                        value={newRole.description}
                                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                                        placeholder="Describe permission level..."
                                    />
                                </div>

                                <div className="p-3 bg-theme-bg-tertiary rounded-lg border border-theme-border flex items-start gap-3">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            id="isGlobal"
                                            checked={newRole.is_global}
                                            onChange={(e) => setNewRole({ ...newRole, is_global: e.target.checked })}
                                            className="w-4 h-4 rounded border-theme-border text-indigo-600 focus:ring-indigo-500 bg-theme-input"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="isGlobal" className="block text-sm font-medium text-theme-primary cursor-pointer select-none">
                                            Global Organization Access
                                        </label>
                                        <p className="text-xs text-theme-tertiary mt-0.5">
                                            If enabled, this role can access <strong>ALL</strong> processes and departments in the organization, bypassing specific restrictions.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">

                                    <div>
                                        <label className="block text-sm font-medium text-theme-secondary mb-2">Access Rights</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => setNewRole({ ...newRole, access_level: 'viewer' })}
                                                className={`p-3 rounded-lg border cursor-pointer border-theme-border flex items-center gap-3 transition-colors ${newRole.access_level !== 'editor'
                                                    ? 'bg-indigo-500/10 border-indigo-500/30'
                                                    : 'bg-theme-input opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                                                    {newRole.access_level !== 'editor' && <div className="w-2 h-2 rounded-full bg-indigo-400"></div>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-theme-primary">Viewer (Read Only)</p>
                                                    <p className="text-[10px] text-theme-tertiary">Can only view processes</p>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => setNewRole({ ...newRole, access_level: 'editor' })}
                                                className={`p-3 rounded-lg border cursor-pointer border-theme-border flex items-center gap-3 transition-colors ${newRole.access_level === 'editor'
                                                    ? 'bg-amber-500/10 border-amber-500/30'
                                                    : 'bg-theme-input opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                                                    {newRole.access_level === 'editor' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-theme-primary">Designer (Editor)</p>
                                                    <p className="text-[10px] text-theme-tertiary">Can create and edit processes</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!newRole.is_global && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-theme-secondary mb-2">Allowed Departments</label>
                                                <div className="bg-theme-input border border-theme-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                                    {departments.length === 0 ? (
                                                        <p className="text-sm text-theme-tertiary text-center py-2">No departments found. Create some first.</p>
                                                    ) : (
                                                        departments.map(dept => (
                                                            <div
                                                                key={dept._id}
                                                                onClick={() => toggleDepartment(dept._id)}
                                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${newRole.allowed_departments.includes(dept._id)
                                                                    ? 'bg-indigo-500/10 border border-indigo-500/30'
                                                                    : 'hover:bg-theme-bg-tertiary'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Building2 size={14} className={newRole.allowed_departments.includes(dept._id) ? "text-indigo-400" : "text-theme-tertiary"} />
                                                                    <span className={newRole.allowed_departments.includes(dept._id) ? "text-indigo-300 font-medium" : "text-theme-secondary"}>
                                                                        {dept.name}
                                                                    </span>
                                                                </div>
                                                                {newRole.allowed_departments.includes(dept._id) && (
                                                                    <Check size={14} className="text-indigo-400" />
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                <p className="text-xs text-theme-tertiary mt-1">Users with this role can ONLY access processes in these departments.</p>
                                            </div>

                                            {/* Level Picker */}
                                            <div>
                                                <label className="block text-sm font-medium text-theme-secondary mb-2">Allowed Process Levels</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[1, 2, 3, 4, 5].map(level => (
                                                        <button
                                                            type="button"
                                                            key={level}
                                                            onClick={() => {
                                                                setNewRole(prev => {
                                                                    const levels = prev.allowed_levels || [];
                                                                    if (levels.includes(level)) {
                                                                        return { ...prev, allowed_levels: levels.filter(l => l !== level) };
                                                                    } else {
                                                                        return { ...prev, allowed_levels: [...levels, level].sort((a, b) => a - b) };
                                                                    }
                                                                });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${(newRole.allowed_levels || []).includes(level)
                                                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                                                                : 'bg-theme-input text-theme-secondary border-theme-border hover:border-theme-secondary'
                                                                }`}
                                                        >
                                                            Level {level}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-theme-tertiary mt-2">
                                                    {(newRole.allowed_levels || []).length === 0
                                                        ? "No specific levels selected. Access might be restricted."
                                                        : `Users will only see processes tagged with: Level ${(newRole.allowed_levels || []).join(', ')}`}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-theme-secondary hover:bg-theme-input rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving && <Loader2 size={16} className="animate-spin" />}
                                        {isEditing ? 'Save Changes' : 'Create Role'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </div >
    );
}
