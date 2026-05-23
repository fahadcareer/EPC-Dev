import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building, Save, Languages, Moon, Sun, Loader2, Upload, Camera, LogOut, ArrowLeft, Layout, Plus, Trash2, Edit2, X } from 'lucide-react';
import api from '../../services/api_service';
import NETWORK_URLS from '../../config/network_string';
import useAuthStore from '../../store/logic/user';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from '../../components/ui/Toast';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'organization', 'templates'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        language: 'en',
        theme: 'dark',
        orgName: '',
        orgId: '',
        logo_url: '',
        templates: []
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get(NETWORK_URLS.GetProfile);
            const data = res.data;
            setFormData({
                name: data.name || '',
                email: data.email || '',
                language: data.language || 'en',
                theme: data.theme || 'dark',
                orgName: data.organization_name || '',
                orgId: data.organization_id || '',
                logo_url: data.organization?.logo_url || '',
                templates: []
            });

            // Fetch templates from separate collection
            if (data.organization_id) {
                const templRes = await api.get(NETWORK_URLS.Templates(data.organization_id));
                setFormData(prev => ({ ...prev, templates: templRes.data }));
            }
            // Update i18n and theme from fetched preferences if needed
            if (data.language && data.language !== i18n.language) {
                i18n.changeLanguage(data.language);
            }
            // Logic to sync theme would ideally be here if ThemeContext listens to it
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSavePersonal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(NETWORK_URLS.UpdateProfile, {
                name: formData.name,
                language: formData.language,
                theme: theme // Save current theme context state
            });
            // Update language immediately
            i18n.changeLanguage(formData.language);
            document.documentElement.dir = formData.language === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = formData.language;

            setToast({ show: true, message: t('profileUpdated') || 'Profile updated successfully', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: 'Failed to update profile', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveOrganization = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update Org Name
            if (formData.orgId) {
                await api.put(NETWORK_URLS.Organization(formData.orgId), {
                    name: formData.orgName
                });

                // Upload Logo if changed
                if (logoFile) {
                    const uploadData = new FormData();
                    uploadData.append('file', logoFile);
                    const res = await api.post(NETWORK_URLS.UploadLogo(formData.orgId), uploadData);
                    setFormData(prev => ({ ...prev, logo_url: res.data.logo_url }));
                }

                setToast({ show: true, message: 'Organization settings updated', type: 'success' });
            }
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: 'Failed to update organization settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTemplates = async (updatedTemplates) => {
        // This is a dummy for now since we'll use individual CRUD
    };

    const handleAddTemplate = async () => {
        if (!formData.orgId) return;
        setSaving(true);
        try {
            const newTemplate = {
                organization_id: formData.orgId,
                nodeLabel: 'New Template',
                metaNodes: [
                    { label: 'Field 1', type: 'info' }
                ]
            };
            const res = await api.post(NETWORK_URLS.CreateTemplate, newTemplate);
            const savedTemplate = { ...newTemplate, _id: res.data.id };
            setFormData(prev => ({ ...prev, templates: [...prev.templates, savedTemplate] }));
            setToast({ show: true, message: 'Template created', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: 'Failed to create template', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTemplate = async (templateId, updatedData) => {
        try {
            await api.put(NETWORK_URLS.Template(templateId), updatedData);
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: 'Failed to sync template', type: 'error' });
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        setSaving(true);
        try {
            await api.delete(NETWORK_URLS.Template(templateId));
            setFormData(prev => ({
                ...prev,
                templates: prev.templates.filter(t => t._id !== templateId)
            }));
            setToast({ show: true, message: 'Template deleted', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: 'Failed to delete template', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-transparent text-theme-primary flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === id ? 'border-indigo-500 text-theme-primary' : 'border-transparent text-theme-tertiary hover:text-theme-primary'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-transparent text-theme-primary p-8">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-input rounded-full transition-colors"
                            title={t('back') || 'Back'}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-3xl font-bold">{t('settings') || 'Settings'}</h1>
                    </div>

                </div>

                <div className="flex border-b border-theme-border mb-8">
                    <TabButton id="personal" label={t('personalSettings') || 'Personal Settings'} icon={User} />
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <>
                            <TabButton id="organization" label={t('organizationSettings') || 'Organization Settings'} icon={Building} />
                            <TabButton id="templates" label="Meta Templates" icon={Layout} />
                        </>
                    )}
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'personal' ? (
                        <div className="bg-app-surface rounded-xl p-8 border border-theme-border">
                            <form onSubmit={handleSavePersonal} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-theme-tertiary">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-theme-tertiary"
                                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', borderColor: 'var(--input-border)' }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-theme-tertiary">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-theme-input/50 border border-theme-border/50 rounded-lg px-4 py-3 text-theme-tertiary cursor-not-allowed"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-theme-tertiary flex items-center gap-2">
                                            <Languages size={16} /> Language
                                        </label>
                                        <select
                                            value={formData.language}
                                            onChange={e => setFormData({ ...formData, language: e.target.value })}
                                            className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', borderColor: 'var(--input-border)' }}
                                        >
                                            <option value="en">English</option>
                                            <option value="ar">Arabic</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-theme-tertiary flex items-center gap-2">
                                            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Theme
                                        </label>
                                        <button
                                            type="button"
                                            onClick={toggleTheme}
                                            className="w-full flex items-center justify-between bg-theme-input border border-theme-border rounded-lg px-4 py-3 hover:bg-theme-input/80 transition-colors text-theme-primary"
                                        >
                                            <span className="capitalize">{theme} Mode</span>
                                            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Click to Toggle</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors disabled:opacity-50 text-white"
                                    >
                                        {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : activeTab === 'templates' ? (
                        <div className="bg-app-surface rounded-xl p-8 border border-theme-border">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">Global Meta Node Templates</h2>
                                    <p className="text-sm text-theme-tertiary mt-1">Define common nodes and their internal structure for the entire organization.</p>
                                </div>
                                <button
                                    onClick={handleAddTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors text-white"
                                >
                                    <Plus size={16} />
                                    Add Template
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.templates.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-theme-border rounded-xl">
                                        <Layout className="mx-auto text-theme-tertiary mb-3" size={48} />
                                        <p className="text-theme-tertiary">No templates defined yet.</p>
                                    </div>
                                ) : (
                                    formData.templates.map((template, tIdx) => (
                                        <div key={template._id || template.id} className="border border-theme-border rounded-xl p-6 bg-app-bg/30">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-1 block">Trigger Node Label</label>
                                                    <input
                                                        type="text"
                                                        value={template.nodeLabel}
                                                        onChange={(e) => {
                                                            const updated = [...formData.templates];
                                                            updated[tIdx].nodeLabel = e.target.value;
                                                            setFormData({ ...formData, templates: updated });
                                                        }}
                                                        onBlur={() => handleUpdateTemplate(template._id, { nodeLabel: template.nodeLabel })}
                                                        className="text-lg font-bold bg-transparent border-b border-transparent hover:border-theme-border focus:border-indigo-500 focus:outline-none w-full"
                                                        placeholder="e.g. Approved"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template._id)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="space-y-3 pl-4 border-l-2 border-indigo-500/30">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-theme-tertiary uppercase">Injected Meta Nodes</span>
                                                    <button
                                                        onClick={() => {
                                                            const updated = [...formData.templates];
                                                            updated[tIdx].metaNodes.push({ label: 'New Field', type: 'info' });
                                                            setFormData({ ...formData, templates: updated });
                                                            handleUpdateTemplate(template._id, { metaNodes: updated[tIdx].metaNodes });
                                                        }}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                    >
                                                        <Plus size={12} /> Add Field
                                                    </button>
                                                </div>
                                                {template.metaNodes.map((mNode, mIdx) => (
                                                    <div key={mIdx} className="flex gap-4 items-center">
                                                        <input
                                                            type="text"
                                                            value={mNode.label}
                                                            onChange={(e) => {
                                                                const updated = [...formData.templates];
                                                                updated[tIdx].metaNodes[mIdx].label = e.target.value;
                                                                setFormData({ ...formData, templates: updated });
                                                            }}
                                                            onBlur={() => handleUpdateTemplate(template._id, { metaNodes: template.metaNodes })}
                                                            className="flex-1 bg-theme-input border border-theme-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <select
                                                            value={mNode.type}
                                                            onChange={(e) => {
                                                                const updated = [...formData.templates];
                                                                updated[tIdx].metaNodes[mIdx].type = e.target.value;
                                                                setFormData({ ...formData, templates: updated });
                                                                handleUpdateTemplate(template._id, { metaNodes: updated[tIdx].metaNodes });
                                                            }}
                                                            className="bg-theme-input border border-theme-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                                                        >
                                                            <option value="info">Info</option>
                                                            <option value="role">Role</option>
                                                            <option value="system">System</option>
                                                            <option value="document">Document</option>
                                                            <option value="risk">Risk</option>
                                                            <option value="control">Control</option>
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                const updated = [...formData.templates];
                                                                updated[tIdx].metaNodes.splice(mIdx, 1);
                                                                setFormData({ ...formData, templates: updated });
                                                                handleUpdateTemplate(template._id, { metaNodes: updated[tIdx].metaNodes });
                                                            }}
                                                            className="text-theme-tertiary hover:text-red-400"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-app-surface rounded-xl p-8 border border-theme-border">
                            <form onSubmit={handleSaveOrganization} className="space-y-8">
                                <div className="flex items-start gap-8">
                                    {/* Logo Upload */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative group w-32 h-32 rounded-full overflow-hidden bg-theme-input border-2 border-dashed border-theme-tertiary flex items-center justify-center">
                                            {logoPreview || formData.logo_url ? (
                                                <img
                                                    src={logoPreview || (formData.logo_url.startsWith('http') ? formData.logo_url : `${NETWORK_URLS.BASE_URL}${formData.logo_url}`)}
                                                    alt="Logo"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }} // Fallback
                                                />
                                            ) : (
                                                <Upload className="text-theme-tertiary" />
                                            )}

                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                <Camera className="text-white" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-xs text-theme-tertiary">Click to upload logo</span>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-tertiary">Organization Name</label>
                                            <input
                                                type="text"
                                                value={formData.orgName}
                                                onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-theme-tertiary"
                                                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', borderColor: 'var(--input-border)' }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-tertiary">Organization ID (Read Only)</label>
                                            <input
                                                type="text"
                                                value={formData.orgId}
                                                disabled
                                                className="w-full bg-theme-input/50 border border-theme-border/50 rounded-lg px-4 py-3 text-theme-tertiary font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-theme-border">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors disabled:opacity-50 text-white"
                                    >
                                        {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Update Organization
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </div >
    );
}
