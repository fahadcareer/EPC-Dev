import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Save, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api_service';
import { toast } from 'react-toastify';

export default function LicenseManagement({ organization, onUpdate }) {
    const [licenseData, setLicenseData] = useState({
        type: 'unlimited',
        is_active: true,
        expiry_date: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (organization?.license) {
            setLicenseData({
                type: organization.license.type || 'unlimited',
                is_active: organization.license.is_active !== false,
                expiry_date: organization.license.expiry_date ? new Date(organization.license.expiry_date).toISOString().split('T')[0] : ''
            });
        }
    }, [organization]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                license: {
                    type: licenseData.type,
                    is_active: licenseData.is_active,
                    expiry_date: licenseData.type === 'unlimited' ? null : (licenseData.expiry_date ? new Date(licenseData.expiry_date).toISOString() : null)
                }
            };
            await api.put(`/admin/organizations/${organization._id}`, payload);
            toast.success("License updated successfully");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to update license:", error);
            toast.error("Failed to update license");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-theme-primary">License & Access</h1>
                <p className="text-theme-tertiary mt-1">Manage organization access, license type, and expiry dates.</p>
            </div>

            <div className="bg-app-surface border border-theme-border rounded-xl p-8 shadow-lg max-w-2xl">
                <div className="flex items-center justify-between mb-8 border-b border-theme-border pb-6">
                    <div>
                        <h3 className="text-xl font-bold text-theme-primary flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-indigo-500" />
                            License Configuration
                        </h3>
                        <p className="text-sm text-theme-tertiary mt-2">
                            Changes here will immediately affect all users within this organization.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-theme-bg-tertiary/30 rounded-lg border border-theme-border">
                        <div>
                            <h4 className="text-sm font-bold text-theme-primary mb-1">Organization Status</h4>
                            <p className="text-xs text-theme-tertiary">Enable or disable access for all users in this organization.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={licenseData.is_active}
                                onChange={(e) => setLicenseData({ ...licenseData, is_active: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-theme-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                    </div>

                    {/* License Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">License Type</label>
                        <div className="grid grid-cols-3 gap-4">
                            {['unlimited', 'yearly', 'trial'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setLicenseData({ ...licenseData, type })}
                                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                                        licenseData.type === type 
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                                        : 'border-theme-border bg-theme-input text-theme-secondary hover:border-indigo-500/50'
                                    }`}
                                >
                                    <div className="flex justify-center mb-2">
                                        {type === 'unlimited' && <CheckCircle className="w-6 h-6" />}
                                        {type === 'yearly' && <Calendar className="w-6 h-6" />}
                                        {type === 'trial' && <Clock className="w-6 h-6" />}
                                    </div>
                                    <div className="text-sm font-bold uppercase tracking-wider">{type}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Expiry Date */}
                    {licenseData.type !== 'unlimited' && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <label className="block text-sm font-medium text-theme-secondary mb-2">Expiry Date</label>
                            <input
                                type="date"
                                value={licenseData.expiry_date}
                                onChange={(e) => setLicenseData({ ...licenseData, expiry_date: e.target.value })}
                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </motion.div>
                    )}

                    {/* Save Button */}
                    <div className="pt-6 mt-6 border-t border-theme-border flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
