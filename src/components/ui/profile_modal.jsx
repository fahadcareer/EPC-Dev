import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Save, Edit2, Building2 } from 'lucide-react';
import api from '../../services/api_service';
import NETWORK_URLS from "../../config/network_string";

export default function ProfileModal({ onClose }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        organization_name: '',
        role: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get(NETWORK_URLS.GetProfile);
            setProfile(res.data);
            setFormData({
                name: res.data.name,
                email: res.data.email,
                password: ''
            });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const updateData = {};
            if (formData.name !== profile.name) updateData.name = formData.name;
            if (formData.email !== profile.email) updateData.email = formData.email;
            if (formData.password) updateData.password = formData.password;

            if (Object.keys(updateData).length === 0) {
                setIsEditing(false);
                setSaving(false);
                return;
            }

            await api.put(NETWORK_URLS.UpdateProfile, updateData);
            setMessage({ type: 'success', text: 'Profile updated successfully' });

            // Refresh profile data
            setProfile(prev => ({ ...prev, ...updateData }));
            setFormData(prev => ({ ...prev, password: '' }));
            setIsEditing(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={onClose}>
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-400" />
                        {isEditing ? 'Edit Profile' : 'My Profile'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="p-6">
                    {message.text && (
                        <div className={`p-3 mb-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {!isEditing ? (
                        /* View Mode */
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-800">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-400">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                                    <p className="text-sm text-neutral-400 capitalize">{profile.role}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</label>
                                    <div className="flex items-center gap-2 text-neutral-300 mt-1">
                                        <Mail className="w-4 h-4 text-neutral-500" />
                                        {profile.email}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Organization</label>
                                    <div className="flex items-center gap-2 text-neutral-300 mt-1">
                                        <Building2 className="w-4 h-4 text-neutral-500" />
                                        {profile.organization_name}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-800 flex justify-end">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Edit Mode */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Enter name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Enter email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
