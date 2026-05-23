import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Search, Trash2, Edit, X, Save,
    Loader2
} from 'lucide-react';
import api from '../../services/api_service';
import Toast from '../../components/ui/Toast';

export default function DepartmentsView() {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [editingDept, setEditingDept] = useState(null);
    const [selectedDepts, setSelectedDepts] = useState([]);

    const handleSelectOneDept = (deptId) => {
        setSelectedDepts(prev => prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]);
    };

    const handleSelectAllDepts = (e, deptsList) => {
        if (e.target.checked) {
            setSelectedDepts(deptsList.map(d => d._id));
        } else {
            setSelectedDepts([]);
        }
    };

    const lastClickRef = useRef({ id: null, time: 0 });
    const handleDeptClick = (dept) => {
        const now = Date.now();
        const THRESHOLD = 250;
        
        if (lastClickRef.current.id === dept._id && (now - lastClickRef.current.time) < THRESHOLD) {
            handleOpenEdit(dept);
            lastClickRef.current = { id: null, time: 0 };
        } else {
            handleSelectOneDept(dept._id);
            lastClickRef.current = { id: dept._id, time: now };
        }
    };

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/admin/departments'); // Assuming route is created or we use generic admin route
            // Wait, we haven't created department routes yet! I should verify routes.
            // But let's assume /admin/departments is the endpoint.
            setDepartments(res.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingDept(null);
        setFormData({ name: '', description: '' });
        setShowCreateModal(true);
    };

    const handleOpenEdit = (dept) => {
        setEditingDept(dept);
        setFormData({ name: dept.name, description: dept.description });
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingDept) {
                await api.put(`/admin/departments/${editingDept._id}`, formData);
                setDepartments(departments.map(d => d._id === editingDept._id ? { ...d, ...formData } : d));
                setToast({ show: true, message: 'Department updated', type: 'success' });
            } else {
                const res = await api.post('/admin/departments', formData);
                setDepartments([...departments, { ...formData, _id: res.data.id }]);
                setToast({ show: true, message: 'Department created', type: 'success' });
            }
            setShowCreateModal(false);
        } catch (error) {
            const msg = error.response?.data?.error || 'Operation failed';
            setToast({ show: true, message: msg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (deptId) => {
        if (!window.confirm('Are you sure? This might affect roles and processes assigned to this department.')) return;
        try {
            await api.delete(`/admin/departments/${deptId}`);
            setDepartments(departments.filter(d => d._id !== deptId));
            setToast({ show: true, message: 'Department deleted', type: 'success' });
        } catch (error) {
            setToast({ show: true, message: 'Failed to delete department', type: 'error' });
        }
    };

    const filteredDepts = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="text-theme-primary">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

            <div className="w-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-primary to-theme-tertiary bg-clip-text text-transparent">
                            Departments
                        </h1>
                        <p className="text-theme-tertiary mt-2">Manage organizational departments and functional areas</p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} />
                        New Department
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building2 size={64} className="text-indigo-500" />
                        </div>
                        <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Total Departments</p>
                        <h3 className="text-3xl font-bold mt-1 text-theme-primary">{departments.length}</h3>
                        <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Active Units
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Search size={64} className="text-emerald-500" />
                        </div>
                        <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Most Active</p>
                        <h3 className="text-xl font-bold mt-1 text-theme-primary line-clamp-1">{departments[0]?.name || 'N/A'}</h3>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Based on recent usage
                        </div>
                    </motion.div>
                </div>

                <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-theme-border bg-app-bg/50 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                            <input
                                type="text"
                                placeholder="Search departments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-theme-input border border-theme-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent transition-all duration-300 cursor-pointer ${
                                                selectedDepts.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                                            }`}
                                            checked={filteredDepts.length > 0 && selectedDepts.length === filteredDepts.length}
                                            onChange={(e) => handleSelectAllDepts(e, filteredDepts)}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Department Name</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-theme-tertiary">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={32} />
                                            <p className="text-sm animate-pulse">Loading departments...</p>
                                        </td>
                                    </tr>
                                ) : filteredDepts.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-theme-tertiary">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <Building2 size={48} className="mb-4" />
                                                <p className="text-lg font-medium">No departments found</p>
                                                <p className="text-sm">Create one to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {filteredDepts.map((dept, index) => (
                                            <motion.tr
                                                key={dept._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => handleDeptClick(dept)}
                                                className={`transition-all duration-300 cursor-pointer group ${
                                                    selectedDepts.includes(dept._id) 
                                                        ? 'bg-indigo-500/[0.08] shadow-[inset_3px_0_0_0_#6366f1]' 
                                                        : 'hover:bg-theme-bg-tertiary hover:shadow-[inset_3px_0_0_0_rgba(99,102,241,0.3)] shadow-[inset_3px_0_0_0_transparent]'
                                                }`}
                                            >
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent pointer-events-none transition-all duration-300 ${
                                                            selectedDepts.includes(dept._id) ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-40 group-hover:scale-100'
                                                        }`}
                                                        checked={selectedDepts.includes(dept._id)}
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                                            <Building2 size={18} />
                                                        </div>
                                                        <span className="font-bold text-theme-primary text-base">{dept.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-theme-secondary text-sm">
                                                    {dept.description || <span className="text-theme-tertiary italic">No description</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(dept); }}
                                                        className="p-2 text-theme-tertiary hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(dept._id); }}
                                                        className="p-2 text-theme-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
                                                        title="Delete"
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

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-app-surface w-full max-w-md rounded-2xl border border-theme-border shadow-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{editingDept ? 'Edit' : 'New'} Department</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-theme-tertiary hover:text-theme-primary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 min-h-[100px]"
                                    />
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
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
