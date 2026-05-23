import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, Mail, Settings, Plus, Save, Trash2, Send, 
    Code, Info, CheckCircle, AlertCircle, ChevronRight, X,
    Search, Hash, Braces, Copy, Variable, HelpCircle, Edit2
} from 'lucide-react';
import api from '../../services/api_service';
import { toast } from 'react-toastify';

export default function NotificationManagement() {
    const [activeTab, setActiveTab] = useState('templates');
    const [templates, setTemplates] = useState([]);
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Template Edit State
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    
    // Rule Edit State
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [newRule, setNewRule] = useState({
        event_name: '',
        template_slug: '',
        recipient_keys: [],
        is_active: true
    });

    const [testEmail, setTestEmail] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tRes, rRes] = await Promise.all([
                api.get('/admin/notifications/templates'),
                api.get('/admin/notifications/rules')
            ]);
            setTemplates(tRes.data || []);
            setRules(rRes.data || []);
        } catch (error) {
            console.error("Failed to fetch notifications data:", error);
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async (template) => {
        setIsSavingTemplate(true);
        try {
            if (templates.find(t => t.slug === template.slug && !editingTemplate?._id)) {
                // If editing existing by slug but it's actually new
                await api.post('/admin/notifications/templates', template);
            } else {
                await api.put(`/admin/notifications/templates/${template.slug}`, template);
            }
            toast.success("Template saved successfully");
            setEditingTemplate(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to save template");
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleSaveRule = async () => {
        try {
            if (newRule._id) {
                await api.put(`/admin/notifications/rules/${newRule._id}`, newRule);
                toast.success("Rule updated successfully");
            } else {
                await api.post('/admin/notifications/rules', newRule);
                toast.success("Rule added successfully");
            }
            setIsAddingRule(false);
            setNewRule({ event_name: '', template_slug: '', recipient_keys: [], is_active: true });
            fetchData();
        } catch (error) {
            toast.error("Failed to save rule");
        }
    };

    const toggleRuleStatus = async (rule) => {
        try {
            await api.put(`/admin/notifications/rules/${rule._id}`, { is_active: !rule.is_active });
            fetchData();
        } catch (error) {
            toast.error("Failed to update rule");
        }
    };

    const deleteRule = async (id) => {
        if (!window.confirm("Are you sure you want to delete this rule?")) return;
        try {
            await api.delete(`/admin/notifications/rules/${id}`);
            toast.success("Rule deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete rule");
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) return toast.warning("Enter an email");
        setIsSendingTest(true);
        try {
            await api.post('/admin/notifications/templates/test', {
                email: testEmail,
                subject: editingTemplate.subject,
                body_html: editingTemplate.body_html,
                slug: editingTemplate.slug,
                context: {
                    user_name: "Test User",
                    link: "#",
                    // The template will automatically hide rows for missing variables
                    // (like process_name, requester, etc.)
                }
            });
            toast.success("Test email dispatched");
            setShowTestModal(false);
        } catch (error) {
            toast.error("Test send failed");
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-theme-primary flex items-center gap-3">
                    <Bell className="w-8 h-8 text-indigo-500" />
                    Notification Management
                </h1>
                <p className="text-theme-tertiary mt-1">Configure automated emails, templates, and event triggers.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-theme-border pb-px">
                <button 
                    onClick={() => setActiveTab('templates')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                        activeTab === 'templates' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Templates
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                        activeTab === 'rules' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Trigger Rules
                    </div>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'templates' ? (
                    <motion.div 
                        key="templates"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {editingTemplate ? (
                            <TemplateEditor 
                                template={editingTemplate} 
                                onCancel={() => setEditingTemplate(null)}
                                onSave={handleSaveTemplate}
                                isSaving={isSavingTemplate}
                                onTest={() => setShowTestModal(true)}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button 
                                    onClick={() => setEditingTemplate({ slug: '', name: '', subject: '', body_html: '' })}
                                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-theme-border rounded-xl hover:border-indigo-500/50 hover:bg-theme-input transition-all group"
                                >
                                    <div className="w-12 h-12 bg-theme-input rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6 text-theme-tertiary group-hover:text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-bold text-theme-secondary">Create New Template</span>
                                </button>
                                
                                {templates.map(template => (
                                    <div key={template._id} className="bg-app-surface border border-theme-border rounded-xl p-6 hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-theme-input rounded text-theme-tertiary">
                                                {template.slug}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-theme-primary mb-1">{template.name}</h3>
                                        <p className="text-xs text-theme-tertiary line-clamp-2 mb-4">{template.subject}</p>
                                        <button 
                                            onClick={() => setEditingTemplate(template)}
                                            className="w-full py-2 bg-theme-input hover:bg-indigo-500/10 text-theme-secondary hover:text-indigo-400 border border-theme-border hover:border-indigo-500/30 rounded-lg text-xs font-bold transition-all"
                                        >
                                            Edit Template
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="rules"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="bg-app-surface border border-theme-border rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary/20">
                                <div>
                                    <h3 className="font-bold text-theme-primary">Event Mapping Rules</h3>
                                    <p className="text-xs text-theme-tertiary">Map system events to templates and dynamic recipients.</p>
                                </div>
                                <button 
                                    onClick={() => setIsAddingRule(true)}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Rule
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-theme-border bg-theme-input/30">
                                            <th className="px-6 py-4 text-xs font-bold text-theme-tertiary uppercase tracking-wider">Event Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-theme-tertiary uppercase tracking-wider">Template</th>
                                            <th className="px-6 py-4 text-xs font-bold text-theme-tertiary uppercase tracking-wider">Recipients</th>
                                            <th className="px-6 py-4 text-xs font-bold text-theme-tertiary uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-theme-tertiary uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-theme-border">
                                        {rules.map(rule => (
                                            <tr key={rule._id} className="hover:bg-theme-input/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-theme-primary text-sm">{rule.event_name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 font-medium">
                                                        {rule.template_slug}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {rule.recipient_keys.map(k => (
                                                            <span key={k} className="text-[10px] px-1.5 py-0.5 bg-theme-input text-theme-tertiary rounded border border-theme-border">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button 
                                                        onClick={() => toggleRuleStatus(rule)}
                                                        className={`text-xs font-bold ${rule.is_active ? 'text-green-500' : 'text-theme-tertiary'} flex items-center gap-1`}
                                                    >
                                                        {rule.is_active ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                        {rule.is_active ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setNewRule(rule);
                                                            setIsAddingRule(true);
                                                        }}
                                                        className="p-2 text-theme-tertiary hover:text-indigo-500 transition-colors"
                                                        title="Edit Rule"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteRule(rule._id)}
                                                        className="p-2 text-theme-tertiary hover:text-red-500 transition-colors"
                                                        title="Delete Rule"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {isAddingRule && (
                    <RuleModal 
                        onClose={() => setIsAddingRule(false)} 
                        onSave={handleSaveRule} 
                        rule={newRule} 
                        setRule={setNewRule} 
                        templates={templates}
                    />
                )}
                {showTestModal && (
                    <TestModal 
                        onClose={() => setShowTestModal(false)}
                        email={testEmail}
                        setEmail={setTestEmail}
                        onSend={handleSendTest}
                        isSending={isSendingTest}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

const PLACEHOLDERS = [
    { key: 'user_name', label: 'Recipient Name', desc: 'Full name of the person receiving the email.', category: 'User' },
    { key: 'requester', label: 'Requester Name', desc: 'Name of the person who initiated this action.', category: 'Workflow' },
    { key: 'process_name', label: 'Process Name', desc: 'The title of the workflow or task.', category: 'Workflow' },
    { key: 'status', label: 'Item Status', desc: 'The current status (e.g., Pending, Approved).', category: 'Workflow' },
    { key: 'link', label: 'Action Link', desc: 'A secure URL to view the record in the app.', category: 'Links' },
    { key: 'date', label: 'Current Date', desc: 'Today\'s date in a readable format.', category: 'System' },
];

const SNIPPETS = [
    { 
        label: 'If Condition', 
        code: '{% if variable_name %}\n  Content goes here...\n{% endif %}',
        desc: 'Show content only if variable exists.'
    },
    { 
        label: 'Default Value', 
        code: '{{ variable_name|default("User") }}',
        desc: 'Fallback if variable is empty.'
    },
    { 
        label: 'Date Format', 
        code: '{{ date|format_date }}',
        desc: 'Format timestamp to readable date.'
    }
];

function TemplateEditor({ template, onCancel, onSave, isSaving, onTest }) {
    const [data, setData] = useState({ ...template });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLibTab, setActiveLibTab] = useState('variables');
    const [lastFocused, setLastFocused] = useState({ field: 'body_html', selection: 0 });
    const [isLibVisible, setIsLibVisible] = useState(true);

    const subjectRef = React.useRef(null);
    const bodyRef = React.useRef(null);

    const handleInsert = (textToInsert) => {
        const field = lastFocused.field;
        const input = field === 'subject' ? subjectRef.current : bodyRef.current;
        
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentVal = data[field] || '';
        const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
        
        setData({ ...data, [field]: newVal });
        
        // Return focus and set cursor after the inserted text
        setTimeout(() => {
            input.focus();
            const newPos = start + textToInsert.length;
            input.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const filteredPlaceholders = PLACEHOLDERS.filter(p => 
        p.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSnippets = SNIPPETS.filter(s => 
        s.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-app-surface border border-theme-border rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-theme-border bg-theme-bg-tertiary/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 hover:bg-theme-input rounded-lg text-theme-tertiary">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-theme-border mx-1"></div>
                    <button 
                        onClick={() => setIsLibVisible(!isLibVisible)}
                        className={`p-2 rounded-lg transition-all ${isLibVisible ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-theme-input text-theme-tertiary'}`}
                        title="Toggle Variable Library"
                    >
                        <Braces className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="font-bold text-theme-primary">
                            {template._id ? 'Edit Template' : 'Create New Template'}
                        </h3>
                        <p className="text-[10px] text-theme-tertiary uppercase tracking-widest">{data.slug || 'New Slug'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={onTest}
                        className="flex items-center gap-2 px-4 py-2 bg-theme-input hover:bg-theme-border text-theme-secondary rounded-lg text-xs font-bold transition-all"
                    >
                        <Send className="w-4 h-4" /> Send Test
                    </button>
                    <button 
                        onClick={() => onSave(data)}
                        disabled={isSaving || !data.slug}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>

            <div className="flex h-[750px] divide-x divide-theme-border">
                {/* Left Pane: Variable Library */}
                <AnimatePresence initial={false}>
                    {isLibVisible && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 300, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-theme-bg-tertiary/5 flex flex-col overflow-hidden border-r border-theme-border"
                        >
                            <div className="p-5 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-theme-secondary font-bold text-xs">
                                        <Variable className="w-4 h-4 text-indigo-400" /> Library
                                    </div>
                                    <div className="flex bg-theme-input rounded-md p-0.5">
                                        <button 
                                            onClick={() => setActiveLibTab('variables')}
                                            className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${activeLibTab === 'variables' ? 'bg-indigo-500 text-white shadow-sm' : 'text-theme-tertiary'}`}
                                        >
                                            Variables
                                        </button>
                                        <button 
                                            onClick={() => setActiveLibTab('snippets')}
                                            className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${activeLibTab === 'snippets' ? 'bg-indigo-500 text-white shadow-sm' : 'text-theme-tertiary'}`}
                                        >
                                            Snippets
                                        </button>
                                    </div>
                                </div>

                                <div className="relative mb-4">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary" />
                                    <input 
                                        type="text"
                                        placeholder={`Search ${activeLibTab}...`}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-theme-input border border-theme-border rounded-lg pl-9 pr-4 py-2 text-xs text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                    {activeLibTab === 'variables' ? (
                                        ['User', 'Workflow', 'Links', 'System'].map(category => {
                                            const items = filteredPlaceholders.filter(p => p.category === category);
                                            if (items.length === 0) return null;
                                            return (
                                                <div key={category}>
                                                    <h4 className="text-[10px] uppercase tracking-wider text-theme-tertiary font-bold mb-2 flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-indigo-500/50"></div> {category}
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {items.map(p => (
                                                            <button 
                                                                key={p.key}
                                                                onClick={() => handleInsert(`{{ ${p.key} }}`)}
                                                                className="flex flex-col items-start p-3 bg-theme-input hover:bg-indigo-500/10 border border-theme-border hover:border-indigo-500/30 rounded-xl transition-all group text-left relative overflow-hidden"
                                                            >
                                                                <div className="flex justify-between items-center w-full mb-1">
                                                                    <span className="text-xs font-bold text-theme-secondary group-hover:text-indigo-400 transition-colors">{p.label}</span>
                                                                    <Plus className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-125" />
                                                                </div>
                                                                <p className="text-[10px] text-theme-tertiary font-medium leading-relaxed mb-3 line-clamp-2">{p.desc}</p>
                                                                <code className="text-[9px] bg-indigo-500/10 px-2 py-1 rounded-md text-indigo-400 font-mono self-end border border-indigo-500/20">{`{{${p.key}}}`}</code>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {filteredSnippets.map(s => (
                                                <button 
                                                    key={s.label}
                                                    onClick={() => handleInsert(s.code)}
                                                    className="flex flex-col items-start p-3 bg-theme-input hover:bg-indigo-500/10 border border-theme-border hover:border-indigo-500/30 rounded-xl transition-all group text-left"
                                                >
                                                    <div className="flex justify-between items-center w-full mb-1">
                                                        <span className="text-xs font-bold text-theme-secondary group-hover:text-indigo-400 transition-colors">{s.label}</span>
                                                        <Braces className="w-3 h-3 text-theme-tertiary group-hover:text-indigo-400" />
                                                    </div>
                                                    <p className="text-[10px] text-theme-tertiary font-medium leading-tight mb-3">{s.desc}</p>
                                                    <div className="w-full bg-[#1a1b26] p-2.5 rounded-lg text-[9px] text-indigo-300/70 font-mono border border-white/5 group-hover:border-indigo-500/20 shadow-inner">
                                                        {s.code.split('\n')[0]}...
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-theme-border flex items-start gap-2 text-[9px] text-theme-tertiary leading-relaxed italic">
                                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span>Tip: Focus on a field then click any item to insert at your cursor position.</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Middle Pane: Editor */}
                <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-widest mb-2">Display Name</label>
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={e => setData({...data, name: e.target.value})}
                                className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                placeholder="e.g. Workflow Approval"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-widest mb-2">Unique Slug</label>
                            <input 
                                type="text" 
                                value={data.slug} 
                                onChange={e => setData({...data, slug: e.target.value})}
                                disabled={!!template._id}
                                className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 transition-all"
                                placeholder="e.g. workflow-approval"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-widest mb-2">Email Subject</label>
                        <input 
                            ref={subjectRef}
                            type="text" 
                            value={data.subject} 
                            onChange={e => setData({...data, subject: e.target.value})}
                            onFocus={(e) => setLastFocused({ field: 'subject', selection: e.target.selectionStart })}
                            className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            placeholder="Hello {{ user_name }}, your item is ready"
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-[400px]">
                        <label className="flex justify-between items-center text-[10px] font-bold text-theme-tertiary uppercase tracking-widest mb-2">
                            <span>HTML Body Content</span>
                            <div className="flex items-center gap-2 text-[9px] lowercase font-normal opacity-60">
                                <Code className="w-3 h-3" /> use Jinja2 syntax
                            </div>
                        </label>
                        <textarea 
                            ref={bodyRef}
                            value={data.body_html} 
                            onChange={e => setData({...data, body_html: e.target.value})}
                            onFocus={(e) => setLastFocused({ field: 'body_html', selection: e.target.selectionStart })}
                            className="flex-1 w-full bg-[#0d0e12] border border-theme-border rounded-xl px-5 py-4 text-indigo-100 font-mono text-xs focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none shadow-inner custom-scrollbar"
                            placeholder="<html>...</html>"
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Right Pane: Live Preview */}
                <div className="w-96 lg:w-[450px] bg-theme-bg-tertiary/10 p-6 flex flex-col border-l border-theme-border">
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-[10px] font-bold text-theme-tertiary uppercase tracking-widest">Real-time Preview</label>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-theme-border overflow-hidden shadow-2xl relative group">
                        <iframe 
                            title="preview"
                            className="w-full h-full"
                            srcDoc={`
                                <html>
                                    <head>
                                        <style>
                                            body { font-family: 'Inter', sans-serif; margin: 0; padding: 24px; color: #1e293b; line-height: 1.6; }
                                            .subject-box { color: #64748b; font-size: 11px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; font-weight: 500; }
                                            .subject-box b { color: #0f172a; margin-right: 8px; }
                                            .variable { color: #6366f1; font-weight: 600; background: rgba(99, 102, 241, 0.05); padding: 0 2px; border-radius: 2px; }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="subject-box">
                                            <b>Subject:</b> ${data.subject ? data.subject.replace(/{{/g, '<span class="variable">').replace(/}}/g, '</span>') : '(No Subject)'}
                                        </div>
                                        ${data.body_html || '<div style="color:#94a3b8; display:flex; flex-direction:column; justify-content:center; align-items:center; height:300px; gap:12px;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg><span style="font-size:12px; font-weight:500;">Template preview will appear here</span></div>'}
                                    </body>
                                </html>
                            `}
                        />
                    </div>
                    <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                        <p className="text-[9px] text-indigo-400 text-center font-medium">Preview ignores logic tags and shows raw placeholder names.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RuleModal({ onClose, onSave, rule, setRule, templates }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-app-surface border border-theme-border rounded-xl p-8 max-w-md w-full shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-theme-primary">
                        {rule._id ? 'Edit Event Rule' : 'Add Event Rule'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-theme-input rounded-full text-theme-tertiary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-theme-tertiary uppercase mb-2">Trigger Event</label>
                        <input 
                            type="text" 
                            value={rule.event_name} 
                            onChange={e => setRule({...rule, event_name: e.target.value})}
                            className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. workflow.submitted"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-theme-tertiary uppercase mb-2">Select Template</label>
                        <select 
                            value={rule.template_slug} 
                            onChange={e => setRule({...rule, template_slug: e.target.value})}
                            className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">-- Choose Template --</option>
                            {templates.map(t => <option key={t.slug} value={t.slug}>{t.name} ({t.slug})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-theme-tertiary uppercase mb-2">Recipients (keys from context)</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                placeholder="Add key (e.g. approver_id)"
                                className="flex-1 bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary text-sm focus:outline-none"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        setRule({...rule, recipient_keys: [...rule.recipient_keys, e.target.value]});
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {rule.recipient_keys.map(k => (
                                <span key={k} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-xs">
                                    {k}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setRule({...rule, recipient_keys: rule.recipient_keys.filter(x => x !== k)})} />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-theme-secondary font-bold text-sm">Cancel</button>
                    <button 
                        onClick={onSave}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm"
                    >
                        {rule._id ? 'Update Rule' : 'Create Rule'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function TestModal({ onClose, email, setEmail, onSend, isSending }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-app-surface border border-theme-border rounded-xl p-8 max-w-sm w-full shadow-2xl"
            >
                <h3 className="text-xl font-bold text-theme-primary mb-4">Send Test Email</h3>
                <p className="text-sm text-theme-tertiary mb-6">Enter an email address to send a rendered preview of this template.</p>
                
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500 mb-6"
                    placeholder="your-email@example.com"
                />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-theme-secondary font-bold text-sm">Cancel</button>
                    <button 
                        onClick={onSend}
                        disabled={isSending}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                    >
                        {isSending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Test</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
