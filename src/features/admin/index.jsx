import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../../layouts/MainLayout';
import {
    Layout, ArrowLeft, Shield, Check, Activity, Search,
    MoreVertical, ChevronDown, CheckCircle, AlertTriangle, FileText,
    Settings, Users, Layers, ExternalLink, Calendar, Filter, LogOut, Building2, ChevronRight,
    Edit, Trash2, Save, X, Plus, Loader2, Database, Rows, ShieldAlert, Clock,
    Settings2, Monitor, LayoutGrid, List, Maximize2,
    Info, User, Mail, Lock, Bell, Cpu
} from 'lucide-react';
import api from '../../services/api_service';
import useAuthStore from '../../store/logic/user';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RolesManagement from './Roles';
import DepartmentsView from './DepartmentsView';
import DictionaryManagement from '../dictionary/index';
import SymbolManagement from './SymbolManagement';
import AttributesManagement from './AttributesManagement';
import AIAnalytics from './AIAnalytics';
import LicenseManagement from './LicenseManagement';
import NotificationManagement from './NotificationManagement';
import AISettings from './AISettings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { orgId: urlOrgId } = useParams();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'processes', 'roles', 'departments', 'dictionary', 'pdf_settings', 'ai_analytics'
    const [processViewMode, setProcessViewMode] = useState('grid'); // 'grid' or 'table'
    const [userRole, setUserRole] = useState(null);

    // Create Organization Modal
    const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
    const [createOrgData, setCreateOrgData] = useState({ name: '', organization_id: '', description: '' });
    const [creatingOrg, setCreatingOrg] = useState(false);

    // Create User Modal
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [createUserData, setCreateUserData] = useState({ name: '', email: '', password: '', role: 'viewer', roleId: '' });
    const [creatingUser, setCreatingUser] = useState(false);
    const [formError, setFormError] = useState('');

    const [availableRoles, setAvailableRoles] = useState([]);
    const lastClickRef = useRef({ id: null, time: 0 });

    const handleUserClick = (user) => {
        const now = Date.now();
        const THRESHOLD = 250; // fast!
        
        if (lastClickRef.current.id === user._id && (now - lastClickRef.current.time) < THRESHOLD) {
            startEditUser(user);
            lastClickRef.current = { id: null, time: 0 };
        } else {
            handleSelectOneUser(user._id);
            lastClickRef.current = { id: user._id, time: now };
        }
    };

    const [pdfConfig, setPdfConfig] = useState({
        header: { left: '[org_name]', center: '[process_name]', right: '[date]' },
        footer: { left: '', center: 'Page [page_number]', right: '' },
        show_logo: true,
        watermark_enabled: true,
        header_height: 30,
        footer_height: 20
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [lastFocusedPdfField, setLastFocusedPdfField] = useState({ section: 'header', pos: 'left' });

    const handleSavePdfSettings = async () => {
        setSavingSettings(true);
        try {
            await api.put(`/admin/organizations/${selectedOrg.organization._id}`, { pdf_config: pdfConfig });
            toast.success("PDF Configuration saved successfully");
            fetchOrgDetails(selectedOrg.organization._id);
        } catch (err) {
            console.error("Failed to save PDF settings:", err);
            toast.error("Failed to save settings");
        } finally {
            setSavingSettings(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
            } catch (e) {
                console.error("Error parsing token", e);
            }
        }
        fetchOrganizations();
        fetchRoles();
    }, []);

    // Watch for URL changes and sync selectedOrg
    useEffect(() => {
        if (urlOrgId) {
            fetchOrgDetails(urlOrgId);
        } else {
            setSelectedOrg(null);
        }
    }, [urlOrgId]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setAvailableRoles(res.data);
        } catch (error) {
            console.error("Failed to fetch roles", error);
            // Fallback to default roles if API fails or for first run
            setAvailableRoles([
                { name: 'viewer', _id: 'viewer', description: 'Read only access' },
                { name: 'designer', _id: 'designer', description: 'Can edit diagrams' },
                { name: 'admin', _id: 'admin', description: 'Organization Admin' }
            ]);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await api.get('/admin/organizations');
            setOrganizations(res.data);

            // If manager and has exactly one organization, auto-select it
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isAdmin = ['admin', 'system_admin'].includes(payload.role);

                if (isAdmin && res.data.length >= 1 && !urlOrgId) {
                    // Navigate to the first available org if not already in an org view
                    navigate(`/admin/${res.data[0]._id}`);
                }
            }
        } catch (err) {
            console.error("Failed to fetch organizations:", err);
            if (err.response?.status === 403) {
                navigate('/'); // Redirect non-superadmins/admins
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgDetails = async (orgId) => {
        try {
            const res = await api.get(`/admin/organizations/${orgId}`);
            setSelectedOrg(res.data);
        } catch (err) {
            console.error("Failed to fetch org details:", err);
        }
    };

    const handleOrgClick = (org) => {
        navigate(`/admin/${org._id}`);
    };

    // --- CRUD Handlers ---

    // Organization CRUD
    const [editingOrgId, setEditingOrgId] = useState(null);
    const [orgFormData, setOrgFormData] = useState({});

    const startEditOrg = (org) => {
        setEditingOrgId(org._id);
        setOrgFormData({ name: org.name || org.organization?.name });
    };

    const cancelEditOrg = () => {
        setEditingOrgId(null);
        setOrgFormData({});
    };

    const saveOrg = async (orgId) => {
        try {
            await api.put(`/admin/organizations/${orgId}`, orgFormData);
            setEditingOrgId(null);
            fetchOrganizations();
            if (selectedOrg && selectedOrg.organization._id === orgId) {
                fetchOrgDetails(orgId);
            }
            toast.success("Organization updated");
        } catch (err) {
            console.error("Failed to update org:", err);
            toast.error("Failed to update organization");
        }
    };

    const deleteOrg = async (orgId) => {
        if (!window.confirm("Are you sure you want to delete this organization? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/organizations/${orgId}`);
            if (selectedOrg && selectedOrg.organization._id === orgId) {
                setSelectedOrg(null);
            }
            fetchOrganizations();
            toast.success("Organization deleted");
        } catch (err) {
            console.error("Failed to delete org:", err);
            toast.error("Failed to delete organization");
        }
    };

    // User CRUD
    const [editingUserId, setEditingUserId] = useState(null);
    const [userFormData, setUserFormData] = useState({});
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleSelectOneUser = (userId) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSelectAllUsers = (e, usersList) => {
        if (e.target.checked) {
            setSelectedUsers(usersList.map(u => u._id));
        } else {
            setSelectedUsers([]);
        }
    };

    const startEditUser = (user) => {
        setEditingUserId(user._id);
        setUserFormData({ role: user.role });
    };

    const cancelEditUser = () => {
        setEditingUserId(null);
        setUserFormData({});
    };

    const saveUser = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}`, userFormData);
            setEditingUserId(null);
            if (selectedOrg) {
                fetchOrgDetails(selectedOrg.organization._id);
            }
            toast.success("User updated");
        } catch (err) {
            console.error("Failed to update user:", err);
            toast.error("Failed to update user");
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            if (selectedOrg) {
                fetchOrgDetails(selectedOrg.organization._id);
            }
            toast.success("User deleted");
        } catch (err) {
            console.error("Failed to delete user:", err);
            toast.error("Failed to delete user");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/login');
    };

    // Create Organization Handler
    const handleCreateOrg = async () => {
        if (!createOrgData.name.trim()) {
            alert('Organization name is required');
            return;
        }

        setCreatingOrg(true);
        try {
            // Auto-generate ID from name
            const generatedId = createOrgData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

            await api.post('/admin/organizations', {
                ...createOrgData,
                organization_id: generatedId
            });
            setShowCreateOrgModal(false);
            setCreateOrgData({ name: '', organization_id: '', description: '' });
            fetchOrganizations();
            toast.success("Organization created");
        } catch (err) {
            console.error('Failed to create organization:', err);
            toast.error(err.response?.data?.error || 'Failed to create organization');
        } finally {
            setCreatingOrg(false);
        }
    };

    // Create User Handler
    const handleCreateUser = async () => {
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

        if (!createUserData.name.trim()) {
            setFormError('Name is required');
            return;
        }
        if (!emailRegex.test(createUserData.email)) {
            setFormError('Please enter a valid email address');
            return;
        }
        if (createUserData.password.length < 8) {
            setFormError('Password must be at least 8 characters');
            return;
        }
        if (!createUserData.roleId) {
            setFormError('Please select a role');
            return;
        }

        setFormError('');
        setCreatingUser(true);
        try {
            await api.post('/admin/users', {
                ...createUserData,
                roleId: createUserData.roleId, // Send roleId
                // Fallback for legacy backend or if simple string role is selected from defaults
                role: createUserData.roleName || 'viewer',
                organization_id: selectedOrg.organization._id
            });
            setShowCreateUserModal(false);
            setCreateUserData({ name: '', email: '', password: '', roleId: '', roleName: 'viewer' });
            setFormError('');
            fetchOrgDetails(selectedOrg.organization._id);
            toast.success("User created successfully");
        } catch (err) {
            console.error('Failed to create user:', err);
            setFormError(err.response?.data?.error || 'Failed to create user');
        } finally {
            setCreatingUser(false);
        }
    };

    const adminTabs = [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'processes', label: 'Processes', icon: Layers },
        ...(userRole === 'superadmin' ? [{ id: 'features', label: 'Feature Control', icon: Settings }] : []),
        ...(userRole === 'superadmin' ? [{ id: 'license', label: 'License & Access', icon: ShieldAlert }] : []),
        { id: 'roles', label: 'Roles', icon: Shield },
        { id: 'departments', label: 'Departments', icon: Building2 },
        ...((selectedOrg?.organization?.enabled_features || []).includes('dictionary') ? [{ id: 'dictionary', label: 'Dictionary', icon: Database }] : []),
        { id: 'symbols', label: 'Symbol Management', icon: Layout },
        { id: 'attributes', label: 'Attributes Setup', icon: Rows },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'pdf_settings', label: 'PDF Settings', icon: FileText },
        { id: 'security', label: 'Settings', icon: Settings2 },
        ...((userRole === 'admin' || userRole === 'system_admin' || userRole === 'superadmin') ? [{ id: 'ai_settings', label: 'AI Settings', icon: Cpu }] : []),
        { id: 'ai_analytics', label: 'AI Analytics', icon: Activity },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const SidebarContent = (
        <div className="flex flex-col h-full text-theme-secondary">
            <div className="p-6 border-b border-theme-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-theme-primary tracking-tight">Admin Portal</h1>
                        <p className="text-[10px] text-theme-tertiary uppercase tracking-widest font-semibold">{selectedOrg?.organization?.name || 'Organization'}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {selectedOrg ? (
                    adminTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (tab.id === 'pdf_settings' && selectedOrg) {
                                    setPdfConfig(selectedOrg.organization.pdf_config || {
                                        header: { left: '[org_name]', center: '[process_name]', right: '[date]' },
                                        footer: { left: '', center: 'Page [page_number]', right: '' },
                                        show_logo: true,
                                        header_height: 30,
                                        footer_height: 20
                                    });
                                }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'hover:bg-theme-bg-tertiary hover:text-theme-primary'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-theme-tertiary group-hover:text-theme-primary'}`} />
                            {tab.label}
                        </button>
                    ))
                ) : (
                    <div className="px-4 py-8 text-center">
                        <Building2 className="w-12 h-12 text-theme-tertiary/20 mx-auto mb-3" />
                        <p className="text-xs text-theme-tertiary font-medium">Select an organization to manage settings</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-theme-border space-y-2">
                <button
                    onClick={() => navigate('/workspace')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Workspace
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    const interpolatePdfText = (text) => {
        if (!text) return '';
        const orgName = selectedOrg?.organization?.name || 'Organization';
        const date = new Date().toLocaleDateString();
        const processName = 'Sample Process Flow';
        const pageNum = '1';

        return text
            .replace(/(\{\{|\[)org_name(\}\}|\])/g, orgName)
            .replace(/(\{\{|\[)date(\}\}|\])/g, date)
            .replace(/(\{\{|\[)process_name(\}\}|\])/g, processName)
            .replace(/(\{\{|\[)page_number(\}\}|\])/g, pageNum);
    };

    return (
        <MainLayout Sidebar={SidebarContent} variant="navy">
            <div className="w-full px-4 md:px-8 lg:px-12">
                <AnimatePresence mode="wait">
                    {!urlOrgId ? (
                        /* Organizations Grid */
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-theme-primary">
                                    {['admin', 'system_admin'].includes(userRole) ? 'Your Organization' : 'Organizations'}
                                </h2>
                                <div className="flex items-center gap-3">
                                    {userRole === 'superadmin' && (
                                        <button
                                            onClick={() => setShowCreateOrgModal(true)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Building2 className="w-4 h-4" />
                                            Create Organization
                                        </button>
                                    )}
                                    {userRole === 'superadmin' && (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                                            <input
                                                type="text"
                                                placeholder="Search organizations..."
                                                className="pl-10 pr-4 py-2 bg-app-surface border border-theme-border rounded-lg focus:outline-none focus:border-indigo-500 transition-colors w-64 text-sm text-theme-primary placeholder-theme-tertiary"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {organizations.map((org) => (
                                    <motion.div
                                        key={org._id}
                                        layoutId={`org-${org._id}`}
                                        onClick={() => handleOrgClick(org)}
                                        className="group bg-app-surface border border-theme-border rounded-xl p-6 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-theme-input rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                                <Building2 className="w-6 h-6 text-theme-secondary group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {org.license && org.license.is_active === false ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-wider border border-red-500/20">Disabled</span>
                                                ) : org.license && org.license.expiry_date && new Date() > new Date(org.license.expiry_date) ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-500 uppercase tracking-wider border border-orange-500/20">Expired</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase tracking-wider border border-emerald-500/20">Active</span>
                                                )}
                                                <ChevronRight className="w-5 h-5 text-theme-tertiary group-hover:text-theme-primary transition-colors" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1 text-theme-primary">{org.name}</h3>
                                        <p className="text-sm text-theme-tertiary mb-4 truncate">{org._id}</p>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-theme-border">
                                            <div>
                                                <p className="text-xs text-theme-tertiary mb-1">Users</p>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-indigo-400" />
                                                    <span className="font-medium text-theme-primary">{org.stats?.user_count || 0}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-theme-tertiary mb-1">Processes</p>
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-emerald-400" />
                                                    <span className="font-medium text-theme-primary">{org.stats?.process_count || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditOrg(org); }}
                                                className="p-2 text-theme-secondary hover:text-indigo-400 hover:bg-theme-input rounded-lg transition-colors"
                                                title="Edit Organization"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {userRole === 'superadmin' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteOrg(org._id); }}
                                                    className="p-2 text-theme-secondary hover:text-red-400 hover:bg-theme-input rounded-lg transition-colors"
                                                    title="Delete Organization"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : !selectedOrg ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
                        >
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-theme-tertiary text-sm animate-pulse">Loading organization details...</p>
                        </motion.div>
                    ) : (
                        /* Organization Details */
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {userRole === 'superadmin' && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors mb-4"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Organizations
                                </button>
                            )}

                            <div className="">
                                {activeTab === 'users' ? (
                                    <>
                                        <div className="mb-8">
                                            <h1 className="text-3xl font-bold text-theme-primary">User Management</h1>
                                            <p className="text-theme-tertiary mt-1">Manage platform users, roles, and organizational access</p>
                                        </div>
                                        {/* User Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-app-surface border border-theme-border p-4 rounded-xl shadow-sm flex items-center gap-4">
                                                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                                                    <Users size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-theme-tertiary uppercase font-bold">Total Users</p>
                                                    <h3 className="text-2xl font-bold text-theme-primary">{selectedOrg.users.length}</h3>
                                                </div>
                                            </div>
                                            <div className="bg-app-surface border border-theme-border p-4 rounded-xl shadow-sm flex items-center gap-4">
                                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                                    <Shield size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-theme-tertiary uppercase font-bold">Admins</p>
                                                    <h3 className="text-2xl font-bold text-theme-primary">{selectedOrg.users.filter(u => ['admin', 'superadmin', 'system_admin'].includes(u.role)).length}</h3>
                                                </div>
                                            </div>
                                            <div className="bg-app-surface border border-theme-border p-4 rounded-xl shadow-sm flex items-center gap-4">
                                                <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400">
                                                    <Edit size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-theme-tertiary uppercase font-bold">Designers</p>
                                                    <h3 className="text-2xl font-bold text-theme-primary">{selectedOrg.users.filter(u => u.role === 'designer').length}</h3>
                                                </div>
                                            </div>
                                            <div className="bg-app-surface border border-theme-border p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => setShowCreateUserModal(true)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                                                        <Plus size={24} />
                                                    </div>
                                                    <span className="font-bold text-theme-primary">Add User</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-hidden rounded-xl border border-theme-border shadow-lg bg-app-surface">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4 w-12 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent transition-all duration-300 cursor-pointer ${
                                                                    selectedUsers.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                                                                }`}
                                                                checked={selectedOrg.users.length > 0 && selectedUsers.length === selectedOrg.users.length}
                                                                onChange={(e) => handleSelectAllUsers(e, selectedOrg.users)}
                                                            />
                                                        </th>
                                                        <th className="px-6 py-4">User Details</th>
                                                        <th className="px-6 py-4">Email Address</th>
                                                        <th className="px-6 py-4">Role & Access</th>
                                                        <th className="px-6 py-4">Joined Date</th>
                                                        <th className="px-6 py-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-theme-border">
                                                    <AnimatePresence>
                                                        {selectedOrg.users.map((user, index) => (
                                                            <motion.tr
                                                                key={user._id}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                                onClick={() => handleUserClick(user)}
                                                                className={`transition-all duration-300 cursor-pointer group ${
                                                                    selectedUsers.includes(user._id) 
                                                                        ? 'bg-indigo-500/[0.08] shadow-[inset_3px_0_0_0_#6366f1]' 
                                                                        : 'hover:bg-theme-bg-tertiary hover:shadow-[inset_3px_0_0_0_rgba(99,102,241,0.3)] shadow-[inset_3px_0_0_0_transparent]'
                                                                }`}
                                                            >
                                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className={`w-4.5 h-4.5 rounded border-2 border-theme-tertiary text-indigo-500 focus:ring-0 bg-transparent pointer-events-none transition-all duration-300 ${
                                                                            selectedUsers.includes(user._id) ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-40 group-hover:scale-100'
                                                                        }`}
                                                                        checked={selectedUsers.includes(user._id)}
                                                                        readOnly
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${['admin', 'superadmin', 'system_admin'].includes(user.role) ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                                                                            user.role === 'designer' ? 'bg-gradient-to-r from-teal-400 to-emerald-500' :
                                                                                'bg-gradient-to-r from-gray-500 to-gray-600'
                                                                            }`}>
                                                                            {user.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span className="font-bold text-theme-primary">{user.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-theme-secondary text-sm font-mono">{user.email}</td>
                                                                <td className="px-6 py-4">
                                                                    {editingUserId === user._id ? (
                                                                        <select
                                                                            value={userFormData.role}
                                                                            onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="bg-theme-input border border-theme-input-border rounded px-2 py-1 text-sm text-theme-primary focus:outline-none focus:border-indigo-500"
                                                                        >
                                                                            {availableRoles.filter(r => r.name !== 'superadmin').map(role => (
                                                                                <option key={role._id} value={role.name}>
                                                                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    ) : (
                                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${['admin', 'superadmin', 'system_admin'].includes(user.role) ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                            user.role === 'designer' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                                                                'bg-app-bg text-theme-secondary border-theme-border'
                                                                            }`}>
                                                                            {user.role}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-theme-tertiary">
                                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {editingUserId === user._id ? (
                                                                        <div className="flex justify-end gap-2">
                                                                            <button onClick={(e) => { e.stopPropagation(); saveUser(user._id); }} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors"><Check size={18} /></button>
                                                                            <button onClick={(e) => { e.stopPropagation(); cancelEditUser(); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"><X size={18} /></button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={(e) => { e.stopPropagation(); startEditUser(user); }} className="p-1.5 text-theme-secondary hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors" title="Edit User"><Edit size={16} /></button>
                                                                            <button onClick={(e) => { e.stopPropagation(); deleteUser(user._id); }} className="p-1.5 text-theme-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Delete User"><Trash2 size={16} /></button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : activeTab === 'processes' ? (
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h1 className="text-3xl font-bold text-theme-primary">Process Management</h1>
                                                <p className="text-theme-tertiary mt-1">Monitor and manage all business processes and workflows</p>
                                            </div>
                                            <button
                                                onClick={() => setProcessViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
                                                className="p-2.5 bg-theme-input border border-theme-border text-theme-secondary hover:text-indigo-400 hover:border-indigo-500/30 rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-indigo-500/10"
                                                title="Toggle View Mode"
                                            >
                                                {processViewMode === 'grid' ? (
                                                    <>
                                                        <Layout size={18} />
                                                        <span className="hidden sm:inline">Grid View</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Rows size={18} />
                                                        <span className="hidden sm:inline">Table View</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {/* Process Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                            <div className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Activity size={64} className="text-emerald-500" />
                                                </div>
                                                <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Total Processes</p>
                                                <h3 className="text-3xl font-bold mt-1 text-theme-primary">{selectedOrg.processes.length}</h3>
                                                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Active Workflows
                                                </div>
                                            </div>
                                            <div className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Layers size={64} className="text-indigo-500" />
                                                </div>
                                                <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Avg. Complexity</p>
                                                <h3 className="text-3xl font-bold mt-1 text-theme-primary">
                                                    {selectedOrg.processes.length > 0
                                                        ? Math.round(selectedOrg.processes.reduce((acc, p) => acc + (p.nodes?.length || 0), 0) / selectedOrg.processes.length)
                                                        : 0}
                                                    <span className="text-lg text-theme-tertiary font-normal ml-2">nodes</span>
                                                </h3>
                                                <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                    Average nodes per process
                                                </div>
                                            </div>
                                            <div className="bg-app-surface border border-theme-border p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Calendar size={64} className="text-purple-500" />
                                                </div>
                                                <p className="text-theme-tertiary text-sm font-medium uppercase tracking-wider">Most Recent</p>
                                                <h3 className="text-xl font-bold mt-1 text-theme-primary line-clamp-1">
                                                    {selectedOrg.processes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]?.name || 'N/A'}
                                                </h3>
                                                <div className="mt-4 flex items-center gap-2 text-xs text-purple-400">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                    Last updated
                                                </div>
                                            </div>
                                        </div>

                                        {processViewMode === 'grid' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <AnimatePresence>
                                                    {selectedOrg.processes.map((process, index) => (
                                                        <motion.div
                                                            key={process._id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="group bg-app-surface border border-theme-border rounded-xl hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col overflow-hidden"
                                                        >
                                                            <div className="p-6 flex-1">
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-colors">
                                                                        <Activity className="w-6 h-6 text-indigo-400" />
                                                                    </div>
                                                                    <span className="px-2.5 py-1 rounded-full bg-theme-input text-xs font-mono text-theme-secondary border border-theme-border flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                                        {process.nodes?.length || 0} nodes
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-bold text-lg text-theme-primary mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{process.name}</h4>
                                                                <p className="text-xs text-theme-tertiary flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Updated {process.updated_at ? new Date(process.updated_at).toLocaleDateString() : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div className="p-4 bg-theme-input/30 border-t border-theme-border flex gap-3">
                                                                <button
                                                                    onClick={() => navigate(`/editor/${process._id}`)}
                                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                                                                >
                                                                    <Edit className="w-4 h-4" /> Open Editor
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden shadow-xl">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-theme-bg-tertiary/50 text-xs uppercase text-theme-tertiary font-bold tracking-wider">
                                                            <tr>
                                                                <th className="px-6 py-4">Process Name</th>
                                                                <th className="px-6 py-4">Complexity</th>
                                                                <th className="px-6 py-4">Last Updated</th>
                                                                <th className="px-6 py-4 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-theme-border">
                                                            <AnimatePresence>
                                                                {selectedOrg.processes.map((process, index) => (
                                                                    <motion.tr
                                                                        key={process._id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: index * 0.05 }}
                                                                        className="hover:bg-theme-bg-tertiary transition-colors group"
                                                                    >
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg">
                                                                                    <Activity className="w-4 h-4 text-indigo-400" />
                                                                                </div>
                                                                                <span className="font-bold text-theme-primary">{process.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <span className="px-2.5 py-1 rounded-full bg-theme-input text-xs font-mono text-theme-secondary border border-theme-border flex items-center gap-1.5 w-fit">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                                                {process.nodes?.length || 0} nodes
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-theme-tertiary text-sm">
                                                                            {process.updated_at ? new Date(process.updated_at).toLocaleDateString() : 'N/A'}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={() => navigate(`/editor/${process._id}`)}
                                                                                    className="p-1.5 text-theme-secondary hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
                                                                                    title="Open Editor"
                                                                                >
                                                                                    <Edit size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </motion.tr>
                                                                ))}
                                                            </AnimatePresence>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : activeTab === 'features' ? (
                                    <FeaturesManagement
                                        organization={selectedOrg.organization}
                                        onUpdate={() => fetchOrgDetails(selectedOrg.organization._id)}
                                    />
                                ) : activeTab === 'license' ? (
                                    <LicenseManagement
                                        organization={selectedOrg.organization}
                                        onUpdate={() => fetchOrgDetails(selectedOrg.organization._id)}
                                    />
                                ) : activeTab === 'roles' ? (
                                    <RolesManagement />
                                ) : activeTab === 'departments' ? (
                                    <DepartmentsView />
                                ) : activeTab === 'dictionary' ? (
                                    <DictionaryManagement organizationId={selectedOrg.organization._id} />
                                ) : activeTab === 'symbols' ? (
                                    <SymbolManagement />
                                ) : activeTab === 'attributes' ? (
                                    <AttributesManagement organizationId={selectedOrg.organization._id} />
                                ) : activeTab === 'pdf_settings' ? (
                                    <div className="w-full">
                                        <div className="mb-8">
                                            <h1 className="text-3xl font-bold text-theme-primary">PDF Configuration</h1>
                                            <p className="text-theme-tertiary mt-1">Customize the header, footer, and branding of exported documents</p>
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                            <div className="xl:col-span-7 bg-app-surface border border-theme-border rounded-xl p-8 shadow-lg">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-theme-primary flex items-center gap-3">
                                                            <FileText className="w-6 h-6 text-indigo-500" />
                                                            Export Template Settings
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="mb-8 p-6 bg-app-bg rounded-xl border border-theme-border/50">
                                                    <h4 className="text-sm font-bold text-theme-tertiary uppercase tracking-wider mb-4">Available Variables</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {[
                                                            { tag: '[org_name]', label: 'Organization', icon: Building2 },
                                                            { tag: '[process_name]', label: 'Process Name', icon: Activity },
                                                            { tag: '[date]', label: 'Current Date', icon: Calendar },
                                                            { tag: '[page_number]', label: 'Page Number', icon: FileText },
                                                        ].map((v) => (
                                                            <button
                                                                key={v.tag}
                                                                onClick={() => {
                                                                    const { section, pos } = lastFocusedPdfField;
                                                                    const currentVal = pdfConfig[section][pos];
                                                                    setPdfConfig({
                                                                        ...pdfConfig,
                                                                        [section]: {
                                                                            ...pdfConfig[section],
                                                                            [pos]: currentVal + v.tag
                                                                        }
                                                                    });
                                                                }}
                                                                className="group flex items-center gap-2 px-4 py-2 bg-app-surface border border-theme-border rounded-lg hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-95"
                                                            >
                                                                <div className="p-1.5 bg-theme-input rounded group-hover:bg-indigo-500/10 transition-colors">
                                                                    <v.icon className="w-3.5 h-3.5 text-theme-secondary group-hover:text-indigo-400" />
                                                                </div>
                                                                <div className="flex flex-col items-start">
                                                                    <span className="text-xs font-semibold text-theme-primary">{v.label}</span>
                                                                    <span className="text-[10px] text-theme-tertiary font-mono">{v.tag}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    {/* Header Config */}
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent rounded-xl pointer-events-none" />
                                                        <div className="relative p-6 border border-indigo-500/20 rounded-xl">
                                                            <h4 className="text-sm font-bold text-indigo-400 mb-6 flex items-center gap-2">
                                                                <Layers className="w-4 h-4" />
                                                                HEADER SECTIONS
                                                                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 rounded-full ml-auto">Top of page</span>
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {['left', 'center', 'right'].map((pos) => (
                                                                    <div key={pos} className="space-y-2">
                                                                        <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider pl-1">{pos}</label>
                                                                        <div className="relative group">
                                                                            <input
                                                                                type="text"
                                                                                value={pdfConfig.header[pos]}
                                                                                onFocus={() => setLastFocusedPdfField({ section: 'header', pos })}
                                                                                onChange={(e) => setPdfConfig({ ...pdfConfig, header: { ...pdfConfig.header, [pos]: e.target.value } })}
                                                                                className={`w-full bg-app-surface border rounded-lg px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:ring-2 transition-all ${lastFocusedPdfField.section === 'header' && lastFocusedPdfField.pos === pos
                                                                                    ? 'border-indigo-500 ring-indigo-500/20'
                                                                                    : 'border-theme-border group-hover:border-indigo-500/50'
                                                                                    }`}
                                                                                placeholder="..."
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer Config */}
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-xl pointer-events-none" />
                                                        <div className="relative p-6 border border-emerald-500/20 rounded-xl">
                                                            <h4 className="text-sm font-bold text-emerald-400 mb-6 flex items-center gap-2">
                                                                <Layers className="w-4 h-4" />
                                                                FOOTER SECTIONS
                                                                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 rounded-full ml-auto">Bottom of page</span>
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {['left', 'center', 'right'].map((pos) => (
                                                                    <div key={pos} className="space-y-2">
                                                                        <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider pl-1">{pos}</label>
                                                                        <div className="relative group">
                                                                            <input
                                                                                type="text"
                                                                                value={pdfConfig.footer[pos]}
                                                                                onFocus={() => setLastFocusedPdfField({ section: 'footer', pos })}
                                                                                onChange={(e) => setPdfConfig({ ...pdfConfig, footer: { ...pdfConfig.footer, [pos]: e.target.value } })}
                                                                                className={`w-full bg-app-surface border rounded-lg px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:ring-2 transition-all ${lastFocusedPdfField.section === 'footer' && lastFocusedPdfField.pos === pos
                                                                                    ? 'border-emerald-500 ring-emerald-500/20'
                                                                                    : 'border-theme-border group-hover:border-emerald-500/50'
                                                                                    }`}
                                                                                placeholder="..."
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Display Options */}
                                                    <div className="flex items-center justify-between p-6 bg-theme-input/20 border border-theme-border rounded-xl">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-app-surface border border-theme-border rounded-lg shadow-sm">
                                                                <Building2 className="w-6 h-6 text-theme-primary" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-theme-primary">Organization Styling</h4>
                                                                <p className="text-sm text-theme-tertiary">Include the organization logo and brand colors in the PDF export.</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={pdfConfig.show_logo}
                                                                onChange={() => setPdfConfig({ ...pdfConfig, show_logo: !pdfConfig.show_logo })}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-theme-input rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-theme-input/30 rounded-lg mt-4">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-theme-primary">Enable Watermark</h4>
                                                            <p className="text-xs text-theme-tertiary">Add "Tasree" watermark to exported documents</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setPdfConfig({ ...pdfConfig, watermark_enabled: !pdfConfig.watermark_enabled })}
                                                            className={`w-12 h-6 rounded-full transition-colors relative ${pdfConfig.watermark_enabled ? 'bg-indigo-600' : 'bg-theme-border'}`}
                                                        >
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pdfConfig.watermark_enabled ? 'left-7' : 'left-1'}`} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={handleSavePdfSettings}
                                                        disabled={savingSettings}
                                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                                                    >
                                                        {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                        {savingSettings ? 'Saving Configuration...' : 'Save PDF Configuration'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="xl:col-span-5">
                                                <div className="sticky top-8 bg-app-surface border border-theme-border rounded-xl p-8 shadow-lg">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h3 className="text-xl font-bold text-theme-primary flex items-center gap-3">
                                                            <Activity className="w-6 h-6 text-emerald-500" />
                                                            Live Preview
                                                        </h3>
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            <span className="text-xs font-mono text-emerald-500">Active</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full aspect-[1/1.414] bg-white rounded shadow-sm border border-gray-200 relative overflow-hidden flex flex-col text-gray-800 font-sans text-[8px] sm:text-[10px] sm:leading-relaxed">
                                                        {pdfConfig.watermark_enabled && (
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
                                                                <span className="text-7xl font-black -rotate-45 select-none tracking-[0.2em] text-gray-900">TASREE</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-start justify-between p-6 border-b border-gray-100 z-10 relative bg-white/80">
                                                            <div className="flex-1 text-left break-words pr-2">
                                                                {pdfConfig.show_logo && (
                                                                    <div className="mb-3 w-12 h-4 bg-indigo-500/20 rounded-sm border border-indigo-500/30 flex items-center justify-center text-[5px] text-indigo-500 font-bold">LOGO</div>
                                                                )}
                                                                {interpolatePdfText(pdfConfig.header.left)}
                                                            </div>
                                                            <div className="flex-1 text-center font-bold break-words px-2">
                                                                {interpolatePdfText(pdfConfig.header.center)}
                                                            </div>
                                                            <div className="flex-1 text-right text-gray-500 break-words pl-2">
                                                                {interpolatePdfText(pdfConfig.header.right)}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 p-8 flex flex-col gap-4 z-10 relative">
                                                            <div className="w-3/4 h-3 bg-gray-100 rounded-sm"></div>
                                                            <div className="w-full h-2 bg-gray-100 rounded-sm"></div>
                                                            <div className="w-5/6 h-2 bg-gray-100 rounded-sm"></div>
                                                            <div className="mt-auto w-full flex-1 max-h-[160px] border border-dashed border-indigo-500/20 rounded-lg flex items-center justify-center bg-indigo-50/30">
                                                                <Layers className="w-8 h-8 text-indigo-200" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-end justify-between p-6 border-t border-gray-100 mt-auto z-10 relative bg-white/80 text-gray-500">
                                                            <div className="flex-1 text-left break-words pr-2">{interpolatePdfText(pdfConfig.footer.left)}</div>
                                                            <div className="flex-1 text-center break-words px-2">{interpolatePdfText(pdfConfig.footer.center)}</div>
                                                            <div className="flex-1 text-right break-words pl-2">{interpolatePdfText(pdfConfig.footer.right)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === 'security' ? (
                                    <div className="space-y-8">
                                        <SecurityManagement
                                            organization={selectedOrg.organization}
                                            onUpdate={() => fetchOrgDetails(selectedOrg.organization._id)}
                                        />
                                        <PinnedViewManagement />
                                    </div>
                                ) : activeTab === 'ai_settings' ? (
                                    <AISettings organization={selectedOrg.organization} />
                                ) : activeTab === 'ai_analytics' ? (
                                    <AIAnalytics organizationId={selectedOrg.organization._id} />
                                ) : activeTab === 'notifications' ? (
                                    <NotificationManagement />
                                ) : null
                                }
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Organization Modal */}
                <AnimatePresence>
                    {showCreateOrgModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowCreateOrgModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-app-surface border border-theme-border rounded-xl p-6 max-w-md w-full"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-theme-primary">Create Organization</h3>
                                    <button
                                        onClick={() => setShowCreateOrgModal(false)}
                                        className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-input rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                                            Organization Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createOrgData.name}
                                            onChange={(e) => setCreateOrgData({ ...createOrgData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-theme-input border border-theme-input-border rounded-lg focus:outline-none focus:border-indigo-500 text-theme-primary"
                                            placeholder="Enter organization name"
                                        />
                                    </div>



                                    <div>
                                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={createOrgData.description}
                                            onChange={(e) => setCreateOrgData({ ...createOrgData, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-theme-input border border-theme-input-border rounded-lg focus:outline-none focus:border-indigo-500 text-theme-primary resize-none"
                                            rows={3}
                                            placeholder="Enter organization description (optional)"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setShowCreateOrgModal(false)}
                                            className="flex-1 px-4 py-2 bg-theme-input hover:bg-theme-input/80 text-theme-primary rounded-lg transition-colors"
                                            disabled={creatingOrg}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateOrg}
                                            disabled={creatingOrg}
                                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {creatingOrg ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create Organization'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create User Modal */}
                <AnimatePresence>
                    {showCreateUserModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowCreateUserModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.98, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-theme-surface border border-theme-border rounded-[24px] p-10 max-w-lg w-full shadow-2xl relative"
                            >
                                <div className="flex items-start justify-between mb-10">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold tracking-tight text-theme-primary">New User</h3>
                                        <p className="text-[13px] text-theme-secondary font-medium opacity-80">Add a new member to your organization.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCreateUserModal(false);
                                            setFormError('');
                                        }}
                                        className="p-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-input/20 rounded-full transition-all duration-200"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
                                    >
                                        <ShieldAlert className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-medium">{formError}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-7">
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-theme-tertiary">Full Name</label>
                                            {createUserData.name && createUserData.name.trim().length < 2 && (
                                                <span className="text-[10px] font-semibold text-amber-500 animate-pulse">Min. 2 characters</span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                                <User className="w-4 h-4 text-theme-tertiary group-focus-within:text-indigo-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={createUserData.name}
                                                onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3.5 bg-theme-input border border-theme-input-border rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-theme-primary placeholder:text-theme-tertiary transition-all text-sm outline-none shadow-sm"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-theme-tertiary">Email Address</label>
                                            {createUserData.email && !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(createUserData.email) && (
                                                <span className="text-[10px] font-semibold text-amber-500 animate-pulse">Invalid format</span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                                <Mail className="w-4 h-4 text-theme-tertiary group-focus-within:text-indigo-500" />
                                            </div>
                                            <input
                                                type="email"
                                                value={createUserData.email}
                                                onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3.5 bg-theme-input border border-theme-input-border rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-theme-primary placeholder:text-theme-tertiary transition-all text-sm outline-none shadow-sm"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-theme-tertiary">Password</label>
                                            {createUserData.password && createUserData.password.length < 8 && (
                                                <span className="text-[10px] font-semibold text-amber-500 animate-pulse">8+ characters required</span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                                <Lock className="w-4 h-4 text-theme-tertiary group-focus-within:text-indigo-500" />
                                            </div>
                                            <input
                                                type="password"
                                                value={createUserData.password}
                                                onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3.5 bg-theme-input border border-theme-input-border rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-theme-primary placeholder:text-theme-tertiary transition-all text-sm outline-none shadow-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] px-1 text-theme-tertiary">Platform Role</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                                <Shield className="w-4 h-4 text-theme-tertiary group-focus-within:text-indigo-500" />
                                            </div>
                                            <select
                                                value={createUserData.roleId}
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    const selectedRole = availableRoles.find(r => r._id === selectedId);
                                                    setCreateUserData({
                                                        ...createUserData,
                                                        roleId: selectedId,
                                                        roleName: selectedRole ? selectedRole.name : 'viewer'
                                                    });
                                                }}
                                                className="w-full pl-11 pr-10 py-3.5 bg-theme-input border border-theme-input-border rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-theme-primary appearance-none cursor-pointer text-sm outline-none shadow-sm transition-all"
                                            >
                                                <option value="" disabled className="bg-theme-surface text-theme-primary">Select role</option>
                                                {availableRoles.filter(r => r.name !== 'superadmin').map(role => (
                                                    <option key={role._id} value={role._id} className="bg-theme-surface text-theme-primary">
                                                        {role.name ? role.name.charAt(0).toUpperCase() + role.name.slice(1) : 'Unknown'}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-theme-tertiary group-focus-within:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => {
                                                setShowCreateUserModal(false);
                                                setFormError('');
                                            }}
                                            className="flex-1 py-4 text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-input/20 rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateUser}
                                            disabled={creatingUser}
                                            className="flex-[1.5] py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25"
                                        >
                                            {creatingUser ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Create User'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MainLayout>
    );
}

function FeaturesManagement({ organization, onUpdate }) {
    const [saving, setSaving] = useState(false);
    const [enabledFeatures, setEnabledFeatures] = useState(organization.enabled_features || []);

    const allFeatures = [
        { id: 'organization_structure', name: 'Organization Structure', description: 'Enable/Disable organization chart and hierarchy management.' },
        { id: 'process', name: 'Process Designer', description: 'Standard process mapping and designing tools.' },
        { id: 'process_mining', name: 'Process Mining', description: 'AI-driven process analysis from event logs.' },
        { id: 'ai_assistant', name: 'AI Assistant', description: 'AI Companion for queries and automated insights.' },
        { id: 'dictionary', name: 'Business Dictionary', description: 'Glossary of terms and business metadata.' },
        { id: 'fad', name: 'Framework Analysis Diagram (FAD)', description: 'Advanced framework-level analysis views.' },
        { id: 'governance', name: 'Governance Workflow', description: 'Enable/Disable the Review and Approval workflow for processes and organizations.' },
    ];

    const toggleFeature = (id) => {
        setEnabledFeatures(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/organizations/${organization._id}`, {
                enabled_features: enabledFeatures
            });
            onUpdate();
            
            // If updating current organization, refresh profile to sync features in store
            const { user } = useAuthStore.getState();
            if (user && (user.organization_id === organization._id || user.organization?._id === organization._id)) {
                try {
                    const profileRes = await api.get(NETWORK_URLS.GetProfile);
                    useAuthStore.getState().updateUser(profileRes.data);
                } catch (profileErr) {
                    console.error("Failed to refresh profile after feature update", profileErr);
                }
            }
            
            toast.success("Features updated successfully");
        } catch (error) {
            console.error("Failed to update features:", error);
            toast.error("Error saving features");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-app-surface border border-theme-border rounded-xl p-8 shadow-xl w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
                        <Settings className="w-8 h-8 text-indigo-500" />
                        Feature Control
                    </h3>
                    <p className="text-theme-tertiary mt-2">Enable or disable specific modules for <b>{organization.name}</b></p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFeatures.map((feature) => (
                    <div
                        key={feature.id}
                        onClick={() => toggleFeature(feature.id)}
                        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${enabledFeatures.includes(feature.id)
                            ? "bg-indigo-600/5 border-indigo-500/30"
                            : "bg-theme-bg/50 border-theme-border opacity-70 hover:opacity-100"
                            }`}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                                <h4 className={`font-bold text-lg ${enabledFeatures.includes(feature.id) ? "text-theme-primary" : "text-theme-secondary"}`}>{feature.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${enabledFeatures.includes(feature.id) ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-theme-input text-theme-tertiary border-theme-border"}`}>
                                    {enabledFeatures.includes(feature.id) ? "Enabled" : "Disabled"}
                                </span>
                            </div>
                            <p className="text-sm text-theme-tertiary leading-relaxed pr-4">{feature.description}</p>
                        </div>
                        <div className="shrink-0 mt-2">
                            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                                <input
                                    type="checkbox"
                                    checked={enabledFeatures.includes(feature.id)}
                                    readOnly
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-slate-300 dark:bg-neutral-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:shadow-[0_2px_5px_rgba(0,0,0,0.3)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7" />
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-3 text-indigo-300/80 text-sm italic">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Note: Disabling a feature will hide it from all users in this organization immediately.
            </div>
        </div>
    );
}

function PinnedViewManagement() {
    const DISPLAY_MODES = [
        { value: 'cards',      label: 'Default View (Cards)',    desc: 'Grid of info cards — click to open process',          icon: LayoutGrid },
        { value: 'split',      label: 'Split View (Dual)',       desc: 'Master-detail layout: list on left, live canvas on right', icon: List },
        { value: 'fullscreen', label: 'Fullscreen View (Canvas)', desc: 'Thumbnail cards + full-screen interactive canvas view', icon: Maximize2 },
    ];

    const [config, setConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('pinned_view_config');
            return saved ? JSON.parse(saved) : { displayMode: 'cards', autoCenter: true, fullscreenDefault: false };
        } catch {
            return { displayMode: 'cards', autoCenter: true, fullscreenDefault: false };
        }
    });

    const updateConfig = (patch) => {
        const next = { ...config, ...patch };
        setConfig(next);
        localStorage.setItem('pinned_view_config', JSON.stringify(next));
        window.dispatchEvent(new Event('pinned_view_config_updated'));
    };

    const Toggle = ({ value, onChange, label, desc }) => (
        <div className="flex items-center justify-between py-4 border-b border-theme-border last:border-0">
            <div>
                <p className="text-sm font-semibold text-theme-primary">{label}</p>
                <p className="text-xs text-theme-tertiary mt-0.5">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
                <div className="w-12 h-6 bg-slate-300 dark:bg-neutral-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-md after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
            </label>
        </div>
    );

    return (
        <div className="bg-app-surface border border-theme-border rounded-xl p-8 shadow-xl w-full">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <Monitor className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-theme-primary">Pinned Model View Settings</h3>
                    <p className="text-theme-tertiary mt-1 text-sm">Control how pinned processes appear in the Command Center.</p>
                </div>
            </div>

            {/* Display Mode Selection */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-3">
                    Pinned Model Display Mode
                </label>

                {/* Mode Preview Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {DISPLAY_MODES.map(m => (
                        <button
                            key={m.value}
                            onClick={() => updateConfig({ displayMode: m.value })}
                            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                                config.displayMode === m.value
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-theme-border hover:border-indigo-500/40 opacity-60 hover:opacity-100'
                            }`}
                        >
                            <m.icon className={`w-5 h-5 ${config.displayMode === m.value ? 'text-indigo-400' : 'text-theme-tertiary'}`} />
                            <span className={`text-xs font-bold ${config.displayMode === m.value ? 'text-indigo-300' : 'text-theme-secondary'}`}>{m.label}</span>
                            <span className="text-[10px] text-theme-tertiary leading-relaxed">{m.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}


function SecurityManagement({ organization, onUpdate }) {
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState(organization.security_config || {
        auto_logout: { enabled: false, timeout_hours: 0, timeout_minutes: 30 }
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/organizations/${organization._id}`, {
                security_config: config
            });

            // Also update the global store if this is the current user's org
            const currentOrgId = useAuthStore.getState().user?.organization_id;
            if (currentOrgId === organization._id) {
                useAuthStore.getState().setSecurityConfig(config);
            }

            onUpdate();
            toast.success("Security settings updated successfully");
        } catch (error) {
            console.error("Failed to update security settings:", error);
            toast.error("Error saving security settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-app-surface border border-theme-border rounded-xl p-8 shadow-xl w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-500" />
                        Security Orchestration
                    </h3>
                    <p className="text-theme-tertiary mt-2">Configure organization-wide security protocols and access controls.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save
                </button>
            </div>

            <div className="space-y-6">
                {/* Auto Logout Card */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${config.auto_logout.enabled ? "bg-indigo-600/5 border-indigo-500/30" : "bg-theme-bg/50 border-theme-border opacity-70"}`}>
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.auto_logout.enabled ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-theme-input text-theme-tertiary"}`}>
                                <LogOut className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-theme-primary">Automatic Session Termination</h4>
                                <p className="text-sm text-theme-tertiary mt-1 max-w-xl">
                                    Enhance security by automatically signing out users after a specified period of inactivity. This affects all users in <b>{organization.name}</b>.
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.auto_logout.enabled}
                                onChange={(e) => setConfig({
                                    ...config,
                                    auto_logout: { ...config.auto_logout, enabled: e.target.checked }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-300 dark:bg-neutral-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:shadow-[0_2px_5px_rgba(0,0,0,0.3)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7" />
                        </label>
                    </div>

                    <AnimatePresence>
                        {config.auto_logout.enabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 border-t border-theme-border flex flex-wrap items-center gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest pl-1">Hours</label>
                                        <div className="relative group">
                                            <select
                                                value={config.auto_logout.timeout_hours}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    auto_logout: { ...config.auto_logout, timeout_hours: parseInt(e.target.value) }
                                                })}
                                                className="bg-app-surface border border-theme-border rounded-xl px-4 py-3 text-theme-primary focus:outline-none focus:border-indigo-500 transition-all appearance-none pr-10 cursor-pointer min-w-[120px]"
                                            >
                                                {[...Array(25)].map((_, i) => (
                                                    <option key={i} value={i}>{i} hr{i !== 1 ? 's' : ''}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary pointer-events-none group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest pl-1">Minutes</label>
                                        <div className="relative group">
                                            <select
                                                value={config.auto_logout.timeout_minutes}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    auto_logout: { ...config.auto_logout, timeout_minutes: parseInt(e.target.value) }
                                                })}
                                                className="bg-app-surface border border-theme-border rounded-xl px-4 py-3 text-theme-primary focus:outline-none focus:border-indigo-500 transition-all appearance-none pr-10 cursor-pointer min-w-[120px]"
                                            >
                                                {[...Array(60)].map((_, i) => (
                                                    <option key={i} value={i}>{i} min{i !== 1 ? 's' : ''}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary pointer-events-none group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="ml-auto pt-6">
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm font-medium text-indigo-300">
                                                Total Timeout: <b>{config.auto_logout.timeout_hours}h {config.auto_logout.timeout_minutes}m</b>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
