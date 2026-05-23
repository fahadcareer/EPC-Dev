import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, RefreshCw, Key, ChevronDown, Check, Search, 
    Eye, EyeOff, Cpu, Trash2, HelpCircle
} from 'lucide-react';
import api from '../../services/api_service';
import { toast } from 'react-toastify';

export default function AISettings({ organization }) {
    const [configs, setConfigs] = useState([]);
    const [configData, setConfigData] = useState({
        api_key: '',
        model_name: '',
        provider: 'openrouter',
        is_enabled: true,
        is_fallback_enabled: true
    });
    
    const [selectedProvider, setSelectedProvider] = useState('openrouter');
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [models, setModels] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null); // { provider, model_name }
    const [testingModel, setTestingModel] = useState(null); // { provider, model_name }
    const [isEditing, setIsEditing] = useState(false);
    
    const dropdownRef = useRef(null);
    const desktopMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const providers = [
        { id: 'openrouter', name: 'OpenRouter', placeholder: 'Enter OpenRouter API key (sk-or-v1-...)', active: true },
        { id: 'openai', name: 'OpenAI', placeholder: 'Enter OpenAI API key (sk-...)', active: true },
        { id: 'anthropic', name: 'Anthropic', placeholder: 'Enter Anthropic API key (sk-ant-...)', active: true }
    ];

    useEffect(() => {
        if (organization?._id) {
            fetchAllConfigs();
        }
    }, [organization?._id]);

    // Handle outside clicks to close the dropdowns
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            const clickedDesktopMenu = desktopMenuRef.current && desktopMenuRef.current.contains(event.target);
            const clickedMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(event.target);
            if (!clickedDesktopMenu && !clickedMobileMenu) {
                setActiveMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Load models whenever the provider or config list changes
    useEffect(() => {
        if (organization?._id) {
            const providerConfig = configs.find(c => c.provider === selectedProvider);
            const keyToUse = providerConfig ? providerConfig.api_key : '';
            loadModelsForProvider(selectedProvider, keyToUse, false);
        }
    }, [selectedProvider, organization?._id, configs.length]);

    const fetchAllConfigs = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/organizations/${organization._id}/ai-configs`);
            if (response.data && Array.isArray(response.data)) {
                setConfigs(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch AI configurations:", error);
            toast.error("Failed to load AI configurations");
        } finally {
            setIsLoading(false);
        }
    };

    const loadModelsForProvider = async (provider, keyToUse = '', showToast = false) => {
        setIsValidating(true);
        try {
            const response = await api.post(`/organizations/${organization._id}/ai-config/load-models`, {
                provider: provider,
                api_key: keyToUse
            });
            if (response.data && Array.isArray(response.data)) {
                setModels(response.data);
                if (showToast) {
                    toast.success(`Loaded ${response.data.length} models for ${providers.find(p => p.id === provider)?.name}.`);
                }
            }
        } catch (error) {
            console.error("Failed to load models:", error);
            if (showToast) {
                const errorMsg = error.response?.data?.error || "Failed to load models.";
                toast.error(errorMsg);
            }
        } finally {
            setIsValidating(false);
        }
    };

    const handleProviderChange = (newProvider) => {
        setSelectedProvider(newProvider);
        const providerConfig = configs.find(c => c.provider === newProvider);
        setConfigData(prev => ({
            ...prev,
            provider: newProvider,
            model_name: '',
            api_key: providerConfig ? providerConfig.api_key : ''
        }));
    };

    const validateKeyFormat = (key, provider) => {
        if (!key) return false;
        const isMasked = key.includes('••••') || key.includes('****');
        if (provider === 'openrouter') {
            if (isMasked) return key.startsWith('sk-or-v1-');
            return key.startsWith('sk-or-v1-') && key.length > 15;
        } else if (provider === 'openai') {
            if (isMasked) return key.startsWith('sk-') && !key.startsWith('sk-or-v1-') && !key.startsWith('sk-ant-');
            return key.startsWith('sk-') && !key.startsWith('sk-or-v1-') && !key.startsWith('sk-ant-') && key.length > 10;
        } else if (provider === 'anthropic') {
            if (isMasked) return key.startsWith('sk-ant-');
            return key.startsWith('sk-ant-') && key.length > 10;
        }
        return false;
    };

    const handleConnect = async () => {
        if (!configData.api_key) {
            toast.error("API Key is required");
            return;
        }
        if (!configData.model_name) {
            toast.error("Please select a model");
            return;
        }
        if (!validateKeyFormat(configData.api_key, selectedProvider)) {
            toast.error(`Invalid API key format for ${providers.find(p => p.id === selectedProvider)?.name}.`);
            return;
        }
        
        setIsSaving(true);
        try {
            const isFirst = configs.length === 0;
            await api.put(`/organizations/${organization._id}/ai-config`, {
                provider: selectedProvider,
                api_key: configData.api_key,
                model_name: configData.model_name,
                is_enabled: true,
                is_fallback_enabled: true,
                is_default: isFirst ? true : undefined
            });
            toast.success(isEditing ? "AI Connection updated successfully!" : "AI Connection saved successfully!");
            resetForm();
            fetchAllConfigs();
        } catch (error) {
            console.error("Failed to save AI configuration:", error);
            const errorMsg = error.response?.data?.error || "Failed to save AI configuration";
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async (config) => {
        setTestingModel({ provider: config.provider, model_name: config.model_name });
        setActiveMenu(null);
        try {
            const response = await api.post(`/organizations/${organization._id}/ai-configs/test`, {
                provider: config.provider,
                model_name: config.model_name,
                api_key: config.api_key
            });
            toast.success(response.data.message || "Connection test successful!");
            fetchAllConfigs();
        } catch (error) {
            console.error("Test connection failed:", error);
            const errorMsg = error.response?.data?.error || "Connection test failed.";
            toast.error(errorMsg);
            fetchAllConfigs();
        } finally {
            setTestingModel(null);
        }
    };

    const handleSetAsDefault = async (config) => {
        setActiveMenu(null);
        try {
            await api.post(`/organizations/${organization._id}/ai-configs/set-default`, {
                provider: config.provider,
                model_name: config.model_name
            });
            toast.success(`Set ${config.model_name.split('/').pop() || config.model_name} as default.`);
            fetchAllConfigs();
        } catch (error) {
            console.error("Failed to set default model:", error);
            toast.error(error.response?.data?.error || "Failed to set default model.");
        }
    };

    const handleEditConnection = (config) => {
        setActiveMenu(null);
        setIsEditing(true);
        setSelectedProvider(config.provider);
        setConfigData({
            api_key: config.api_key || '',
            model_name: config.model_name || '',
            provider: config.provider,
            is_enabled: config.is_enabled !== false,
            is_fallback_enabled: config.is_fallback_enabled !== false
        });
        
        const formElement = document.getElementById("add-connection-form");
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDisconnectConfig = async (config) => {
        setActiveMenu(null);
        const modelLabel = config.model_name.split('/').pop() || config.model_name;
        if (!window.confirm(`Are you sure you want to disconnect ${modelLabel} (${config.provider})?`)) {
            return;
        }
        
        try {
            await api.delete(`/organizations/${organization._id}/ai-configs/${config.provider}/${encodeURIComponent(config.model_name)}`);
            toast.success(`Disconnected ${modelLabel} successfully.`);
            fetchAllConfigs();
        } catch (error) {
            console.error("Failed to disconnect configuration:", error);
            toast.error(error.response?.data?.error || "Failed to disconnect configuration.");
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setConfigData({
            api_key: '',
            model_name: '',
            provider: 'openrouter',
            is_enabled: true,
            is_fallback_enabled: true
        });
        setSelectedProvider('openrouter');
    };

    const toggleActionsMenu = (config) => {
        if (activeMenu && activeMenu.provider === config.provider && activeMenu.model_name === config.model_name) {
            setActiveMenu(null);
        } else {
            setActiveMenu({ provider: config.provider, model_name: config.model_name });
        }
    };

    const renderProviderLogo = (provider, className = "w-8 h-8 rounded-lg") => {
        let bg = "bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400";
        let initials = "OR";
        
        if (provider === "openai") {
            bg = "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
            initials = "OA";
        } else if (provider === "anthropic") {
            bg = "bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400";
            initials = "AN";
        }
        
        return (
            <div className={`${className} ${bg} flex items-center justify-center font-bold font-mono tracking-tight shrink-0`}>
                {initials}
            </div>
        );
    };

    const renderStatusBadge = (status) => {
        let dotColor = "bg-gray-400";
        let textColor = "text-theme-secondary";
        let bg = "bg-theme-input border border-theme-border";
        let label = "Unknown";
        
        if (status === "active") {
            dotColor = "bg-emerald-500 dark:bg-emerald-400";
            textColor = "text-emerald-700 dark:text-emerald-400";
            bg = "bg-emerald-500/10 border border-emerald-500/20";
            label = "Active";
        } else if (status === "disabled") {
            dotColor = "bg-gray-500 dark:bg-gray-400";
            textColor = "text-theme-secondary";
            bg = "bg-theme-input border border-theme-border";
            label = "Disabled";
        } else if (status === "validation_failed" || status === "error") {
            dotColor = "bg-rose-500 dark:bg-rose-400";
            textColor = "text-rose-700 dark:text-rose-400";
            bg = "bg-rose-500/10 border border-rose-500/20";
            label = "Failed";
        } else if (status === "rate_limited") {
            dotColor = "bg-amber-500 dark:bg-amber-400";
            textColor = "text-amber-700 dark:text-amber-400";
            bg = "bg-amber-500/10 border border-amber-500/20";
            label = "Rate Limited";
        }
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${bg} ${textColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === 'active' ? 'animate-pulse' : ''}`} />
                {label}
            </span>
        );
    };

    const filteredModels = models.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedModels = filteredModels.reduce((acc, model) => {
        const provider = model.provider || 'Other';
        if (!acc[provider]) {
            acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
    }, {});

    const selectedModelInfo = models.find(m => m.id === configData.model_name);

    const formatContextLength = (length) => {
        if (!length) return 'N/A';
        if (length >= 1000000) {
            return `${(length / 1000000).toFixed(1).replace('.0', '')}M`;
        }
        if (length >= 1000) {
            return `${(length / 1000).toFixed(0)}k`;
        }
        return `${length}`;
    };

    const renderBadges = (model) => {
        const badges = [];
        if (model.supports_vision) {
            badges.push(
                <span key="vision" className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Vision
                </span>
            );
        }
        if (model.supports_tools) {
            badges.push(
                <span key="tools" className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Tools
                </span>
            );
        }
        const isFlash = model.name.toLowerCase().includes('flash') || model.id.toLowerCase().includes('flash');
        const isFast = model.name.toLowerCase().includes('fast') || model.id.toLowerCase().includes('fast');
        if (isFlash || isFast) {
            badges.push(
                <span key="fast" className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Fast
                </span>
            );
        }
        if (badges.length === 0) return null;
        return (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
                {badges}
            </div>
        );
    };

    if (isLoading && configs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin h-8 w-8 text-indigo-500" />
                    <span className="text-theme-tertiary text-xs">Loading AI settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1100px] mx-auto px-8 py-6 text-theme-primary transition-all duration-300">
            
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold text-theme-primary tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        AI Settings
                    </h1>
                    <p className="text-xs text-theme-secondary mt-1">
                        Connect and manage AI models used across assistants, workflows, and automations.
                    </p>
                </div>
                
                {configs.length > 0 && (
                    <button
                        onClick={fetchAllConfigs}
                        disabled={isLoading}
                        className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface border border-theme-border hover:bg-theme-input text-theme-secondary hover:text-theme-primary rounded-lg text-xs font-semibold transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                )}
            </div>
            
            {/* Connected Models Section */}
            <div className="bg-theme-surface border border-theme-border rounded-xl shadow-theme-card mb-8">
                <div className="p-5 border-b border-theme-border bg-gray-50/50 dark:bg-neutral-900/30 rounded-t-xl flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-theme-primary">Connected Models</h2>
                        <p className="text-[11px] text-theme-secondary">Configured and authorized AI models available for workflows</p>
                    </div>
                </div>
                {configs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Cpu className="w-8 h-8 text-theme-tertiary mx-auto mb-3 opacity-60" />
                        <h3 className="text-xs font-bold text-theme-secondary">No AI connections found</h3>
                        <p className="text-[11px] text-theme-tertiary mt-1 max-w-[280px] mx-auto">
                            To use custom models in your assistants and workflows, connect a model below.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto min-h-[240px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-theme-border text-[10px] font-bold text-theme-secondary uppercase tracking-wider bg-gray-50/30 dark:bg-neutral-900/20">
                                        <th className="px-6 py-4">Model / Provider</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Default</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme-border">
                                    {configs.map((config) => {
                                        const modelId = config.model_name;
                                        const modelLabel = modelId.split('/').pop() || modelId;
                                        const isTesting = testingModel && testingModel.provider === config.provider && testingModel.model_name === config.model_name;
                                        const isMenuOpen = activeMenu && activeMenu.provider === config.provider && activeMenu.model_name === config.model_name;
                                        
                                        return (
                                            <tr key={`${config.provider}-${modelId}`} className="hover:bg-gray-100/50 dark:hover:bg-neutral-800/30 transition-colors text-xs text-theme-primary">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {renderProviderLogo(config.provider, "w-8 h-8 rounded-lg text-xs")}
                                                        <div>
                                                            <span className="font-bold block text-sm">{modelLabel}</span>
                                                            <span className="text-[10px] text-theme-tertiary font-mono block mt-0.5">{modelId}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {renderStatusBadge(config.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {config.is_default ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                            <Check className="w-3 h-3" /> Default
                                                        </span>
                                                    ) : (
                                                        <span className="text-theme-tertiary text-[11px]">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleActionsMenu(config);
                                                        }}
                                                        disabled={isTesting}
                                                        className="p-1.5 hover:bg-theme-input rounded-lg text-theme-secondary hover:text-theme-primary transition-all inline-flex items-center justify-center"
                                                    >
                                                        {isTesting ? (
                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <span className="font-bold tracking-widest text-[10px] block px-1">•••</span>
                                                        )}
                                                    </button>
                                                    
                                                    {isMenuOpen && (
                                                        <div 
                                                            ref={desktopMenuRef}
                                                            className="absolute right-6 top-10 z-50 w-44 bg-theme-surface border border-theme-border shadow-theme-card rounded-xl overflow-hidden py-1 text-left"
                                                        >
                                                            <button
                                                                onClick={() => handleTestConnection(config)}
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 text-xs font-semibold text-theme-secondary hover:text-theme-primary flex items-center gap-2"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                                                                Test Connection
                                                            </button>
                                                            {!config.is_default && (
                                                                <button
                                                                    onClick={() => handleSetAsDefault(config)}
                                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 text-xs font-semibold text-theme-secondary hover:text-theme-primary flex items-center gap-2"
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                                                    Set as Default
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleEditConnection(config)}
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 text-xs font-semibold text-theme-secondary hover:text-theme-primary flex items-center gap-2"
                                                            >
                                                                <Key className="w-3.5 h-3.5 text-amber-500" />
                                                                Edit Connection
                                                            </button>
                                                            <div className="border-t border-theme-border my-1" />
                                                            <button
                                                                onClick={() => handleDisconnectConfig(config)}
                                                                className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Disconnect
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Grid */}
                        <div className="block sm:hidden divide-y divide-theme-border">
                            {configs.map((config) => {
                                const modelId = config.model_name;
                                const modelLabel = modelId.split('/').pop() || modelId;
                                const isTesting = testingModel && testingModel.provider === config.provider && testingModel.model_name === config.model_name;
                                const isMenuOpen = activeMenu && activeMenu.provider === config.provider && activeMenu.model_name === config.model_name;
                                
                                return (
                                    <div key={`${config.provider}-${modelId}`} className="p-4 space-y-3 relative hover:bg-gray-100/30 dark:hover:bg-neutral-800/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {renderProviderLogo(config.provider, "w-8 h-8 rounded-lg text-xs")}
                                                <div>
                                                    <span className="font-bold text-sm block">{modelLabel}</span>
                                                    <span className="text-[9px] text-theme-tertiary font-mono block">{modelId}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleActionsMenu(config);
                                                    }}
                                                    disabled={isTesting}
                                                    className="p-1 hover:bg-theme-input rounded text-theme-secondary hover:text-theme-primary"
                                                >
                                                    {isTesting ? (
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <span className="font-bold block px-1">•••</span>
                                                    )}
                                                </button>
                                                
                                                {isMenuOpen && (
                                                    <div 
                                                        ref={mobileMenuRef}
                                                        className="absolute right-0 top-6 z-50 w-44 bg-theme-surface border border-theme-border shadow-theme-card rounded-xl overflow-hidden py-1 text-left"
                                                    >
                                                        <button
                                                            onClick={() => handleTestConnection(config)}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 text-xs font-semibold text-theme-secondary hover:text-theme-primary flex items-center gap-2"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                                                            Test Connection
                                                        </button>
                                                        {!config.is_default && (
                                                            <button
                                                                onClick={() => handleSetAsDefault(config)}
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 text-xs font-semibold text-theme-secondary hover:text-theme-primary flex items-center gap-2"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                                                Set as Default
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditConnection(config)}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 text-xs font-semibold text-theme-secondary hover:text-theme-primary flex items-center gap-2"
                                                        >
                                                            <Key className="w-3.5 h-3.5 text-amber-500" />
                                                            Edit Connection
                                                        </button>
                                                        <div className="border-t border-theme-border my-1" />
                                                        <button
                                                            onClick={() => handleDisconnectConfig(config)}
                                                            className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Disconnect
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {renderStatusBadge(config.status)}
                                            {config.is_default && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            
            {/* Add/Edit Connection Form Card */}
            <div id="add-connection-form" className="bg-theme-surface border border-theme-border rounded-xl shadow-theme-card overflow-hidden">
                <div className="p-5 border-b border-theme-border bg-gray-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-theme-primary">{isEditing ? "Edit AI Connection" : "Add AI Connection"}</h2>
                        <p className="text-[11px] text-theme-secondary">Configure a new model for workflows and assistants</p>
                    </div>
                    {isEditing && (
                        <button
                            onClick={resetForm}
                            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
                
                <div className="p-6 space-y-6">
                    
                    {/* 1. Choose Provider */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">
                            1. Choose Provider
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {providers.map((p) => {
                                const isSelected = selectedProvider === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleProviderChange(p.id)}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                            isSelected 
                                                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 text-theme-primary shadow-sm'
                                                : 'border-theme-border bg-theme-input text-theme-secondary hover:border-theme-border hover:bg-gray-100/50 dark:hover:bg-neutral-800/20'
                                        }`}
                                    >
                                        {renderProviderLogo(p.id, "w-8 h-8 rounded-lg shrink-0")}
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold block text-theme-primary">{p.name}</span>
                                            <span className="text-[10px] text-theme-tertiary truncate block mt-0.5">
                                                {p.id === 'openrouter' ? 'Multi-provider' : p.id === 'openai' ? 'OpenAI models' : 'Anthropic models'}
                                            </span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-auto shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* 2. Choose Model */}
                    <div className="space-y-2" ref={dropdownRef}>
                        <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">
                            2. Select Model
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                disabled={isValidating}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="w-full bg-theme-input border border-theme-input-border hover:border-theme-highlight disabled:opacity-40 disabled:hover:border-theme-input-border text-theme-primary rounded-xl px-3.5 py-2.5 text-left text-xs focus:outline-none transition-all flex items-center justify-between"
                            >
                                {isValidating ? (
                                    <span className="text-theme-secondary flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                        Loading models from {providers.find(p => p.id === selectedProvider)?.name}...
                                    </span>
                                ) : selectedModelInfo ? (
                                    <div className="flex items-center justify-between w-full pr-1.5">
                                        <span className="font-semibold text-theme-primary">{selectedModelInfo.name}</span>
                                        <span className="text-[9px] bg-theme-surface border border-theme-border text-theme-secondary px-1.5 py-0.5 rounded font-mono">
                                            {selectedModelInfo.provider}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-theme-tertiary">
                                        Select a model...
                                    </span>
                                )}
                                <ChevronDown className={`w-3.5 h-3.5 text-theme-secondary transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && models.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-50 w-full mt-1.5 bg-theme-surface border border-theme-border shadow-theme-card rounded-xl overflow-hidden max-h-[260px] flex flex-col"
                                    >
                                        <div className="p-2 border-b border-theme-border bg-theme-surface flex items-center gap-2">
                                            <Search className="w-3.5 h-3.5 text-theme-tertiary" />
                                            <input
                                                type="text"
                                                placeholder="Search models..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-transparent border-0 text-xs focus:outline-none text-theme-primary placeholder:text-theme-tertiary"
                                            />
                                            {searchTerm && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setSearchTerm('')}
                                                    className="text-[10px] text-theme-secondary hover:text-theme-primary px-1"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>

                                        <div className="overflow-y-auto flex-1 divide-y divide-theme-border chat-scroll">
                                            {Object.keys(groupedModels).length > 0 ? (
                                                Object.entries(groupedModels).map(([provider, providerModels]) => (
                                                    <div key={provider} className="py-1">
                                                        <div className="px-3.5 py-1 text-[9px] font-bold text-theme-tertiary uppercase tracking-wider">
                                                            {provider}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {providerModels.map((model) => (
                                                                <button
                                                                    key={model.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setConfigData(prev => ({ ...prev, model_name: model.id }));
                                                                        setDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-3.5 py-2.5 hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 flex items-center justify-between group transition-colors ${
                                                                        configData.model_name === model.id ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-theme-secondary'
                                                                    }`}
                                                                >
                                                                    <div className="flex flex-col gap-0.5 max-w-[75%]">
                                                                        <span className={`text-xs font-semibold truncate ${
                                                                            configData.model_name === model.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-theme-primary'
                                                                        }`}>{model.name}</span>
                                                                        <span className="text-[9px] text-theme-tertiary font-mono truncate">{model.id}</span>
                                                                        {renderBadges(model)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <span className="text-[9px] bg-theme-input border border-theme-input-border text-theme-secondary px-1.5 py-0.5 rounded font-mono">
                                                                            {formatContextLength(model.context_length)} ctx
                                                                        </span>
                                                                        {configData.model_name === model.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-1" />}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-xs text-theme-tertiary">
                                                    No matching models found
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {selectedModelInfo && (
                            <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-theme-secondary">
                                <div className="flex items-center gap-1.5">
                                    <span>{formatContextLength(selectedModelInfo.context_length)} context</span>
                                    {selectedModelInfo.supports_vision && <span className="w-1 h-1 rounded-full bg-theme-border" />}
                                    {selectedModelInfo.supports_vision && <span>Vision</span>}
                                    {selectedModelInfo.supports_tools && <span className="w-1 h-1 rounded-full bg-theme-border" />}
                                    {selectedModelInfo.supports_tools && <span>Tools</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. API Key */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">
                            3. API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={configData.api_key}
                                onChange={(e) => setConfigData({ ...configData, api_key: e.target.value })}
                                placeholder={providers.find(p => p.id === selectedProvider)?.placeholder}
                                className="w-full bg-theme-input border border-theme-input-border focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none transition-all font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-theme-primary transition-colors"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-theme-tertiary px-1">
                            Your key is securely encrypted at rest. If already saved, you can leave this field masked to keep the existing key.
                        </p>
                    </div>
                    
                </div>

                {/* Form Footer Action */}
                <div className="p-5 pt-3 border-t border-theme-border bg-gray-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
                    <div className="text-[10px] text-theme-tertiary flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Models must pass a connectivity test before being saved.</span>
                    </div>
                    
                    <button
                        type="button"
                        onClick={handleConnect}
                        disabled={isSaving || !configData.api_key || !configData.model_name}
                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-500 disabled:border disabled:border-gray-300 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                {isEditing ? "Update Connection" : "Connect & Save"}
                            </>
                        )}
                    </button>
                </div>
                
            </div>
            
        </div>
    );
}
