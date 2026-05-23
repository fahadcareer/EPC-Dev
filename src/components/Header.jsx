import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, ChevronDown, LogOut, Menu, Bell, Check, Trash2, Shield, HelpCircle, FlaskConical, Layout } from 'lucide-react';
import useAuthStore from '../store/logic/user';
import { useNavigate } from 'react-router-dom';
import NETWORK_URLS from '../config/network_string';
import api from '../services/api_service';

const Header = ({ toggleSidebar, variant = 'default' }) => {
    const isNavy = variant === 'navy';
    const { user, logout } = useAuthStore();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    // --- Notifications Logic ---
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get(NETWORK_URLS.GetNotifications);
            setNotifications(res.data);
            const count = res.data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Fetch profile if name/email or organization info is missing
            if (!user.name || !user.email || !user.organization) {
                api.get(NETWORK_URLS.GetProfile).then(res => {
                    useAuthStore.getState().updateUser(res.data);
                }).catch(err => console.error("Failed to fetch profile", err));
            }
            // Poll every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkRead = async (id, link) => {
        try {
            await api.put(NETWORK_URLS.MarkNotificationRead(id));
            // Update local state
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (link) {
                // If link is a relative path starting with /process, append parent param if needed or let router handle it
                // For now, assume link is navigable
                navigate(link);
                setShowNotifications(false);
            }
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    const handleMarkAllRead = async () => {
        // Optimistic update
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        if (unreadIds.length === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await Promise.all(unreadIds.map(id => api.put(NETWORK_URLS.MarkNotificationRead(id))));
        } catch (error) {
            console.error("Error marking all read", error);
            fetchNotifications(); // Revert on error
        }
    };

    const handleClearAll = async () => {
        // Optimistic update
        setNotifications([]);
        setUnreadCount(0);

        try {
            await api.delete(NETWORK_URLS.ClearNotifications);
        } catch (error) {
            console.error("Error clearing notifications", error);
            fetchNotifications(); // Revert on error
        }
    };

    return (
        <header className={`fixed top-0 right-0 left-0 ${isNavy ? 'lg:left-80' : 'lg:left-80'} h-20 bg-transparent flex items-center justify-between pointer-events-none px-4 lg:px-8 z-[60]`}>
            {/* Left Section (Mobile Toggle) */}
            <div className="pointer-events-auto">
                <button
                    className="lg:hidden p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-full transition-colors"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Right Section - Floating Controls */}
            <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">



                {/* Help Center Link */}
                <button
                    onClick={() => navigate('/help')}
                    className="p-2 text-theme-secondary hover:text-blue-500 transition-colors rounded-lg hover:bg-theme-bg-tertiary"
                    title="Help Center"
                >
                    <HelpCircle size={20} />
                </button>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-theme-secondary hover:text-theme-primary transition-colors rounded-lg hover:bg-theme-bg-tertiary relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-theme-bg"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div
                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-theme-surface border border-theme-border rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50"
                            style={{ backgroundColor: 'var(--bg-surface)' }}
                        >
                            <div className="px-4 py-3 border-b border-theme-border flex justify-between items-center bg-theme-bg-tertiary">
                                <h3 className="text-sm font-semibold text-theme-primary">{t('notifications') || 'Notifications'}</h3>
                                {notifications.length > 0 && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-medium"
                                        >
                                            <Check size={12} />
                                            {t('Read All') || 'Mark all read'}
                                        </button>
                                        <button
                                            onClick={handleClearAll}
                                            className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-medium"
                                        >
                                            <Trash2 size={12} />
                                            {t('Clear') || 'Clear'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                className={`p-4 hover:bg-theme-bg-tertiary transition-colors cursor-pointer ${!notif.read ? 'bg-theme-primary/5' : ''}`}
                                                onClick={() => handleMarkRead(notif._id, notif.meta?.link)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className={`text-sm leading-snug ${!notif.read ? 'text-theme-primary font-medium' : 'text-theme-secondary'}`}>
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-[10px] text-theme-tertiary">
                                                            {new Date(notif.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                                        <Bell size={32} className="opacity-20" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>



                <div className="h-6 w-px bg-theme-border mx-1"></div>

                {/* Language Selector */}
                <div className="relative group">
                    <button className="flex items-center gap-2 p-2 text-theme-secondary hover:text-theme-primary transition-colors rounded-lg hover:bg-theme-bg-tertiary">
                        <Globe size={18} />
                        <span className="text-sm font-medium uppercase">{i18n.language}</span>
                        <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Dropdown */}
                    <div
                        className="absolute right-0 top-full mt-1 w-32 bg-theme-surface border border-theme-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right py-1"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-theme-bg-tertiary flex items-center justify-between ${i18n.language === 'en' ? 'text-indigo-500' : 'text-theme-secondary'}`}
                        >
                            <span>English</span>
                            {i18n.language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                        </button>
                        <button
                            onClick={() => changeLanguage('ar')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-theme-bg-tertiary flex items-center justify-between ${i18n.language === 'ar' ? 'text-indigo-500' : 'text-theme-secondary'}`}
                        >
                            <span>العربية</span>
                            {i18n.language === 'ar' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-theme-border mx-1"></div>

                <div className="group relative">
                    <button className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-theme-bg-tertiary transition-colors border border-transparent hover:border-theme-border">
                        {/* Profile Image / Logo */}
                        <div className="w-8 h-8 rounded-full bg-theme-bg-tertiary flex items-center justify-center overflow-hidden border border-theme-border">
                            {user?.organization?.logo_url || user?.logo_url ? (
                                <img
                                    src={user.organization?.logo_url || user.logo_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                />
                            ) : null}
                            <User size={16} className={`text-theme-secondary ${user?.organization?.logo_url || user?.logo_url ? 'hidden' : 'block'}`} />
                        </div>

                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-theme-primary leading-none">{user?.username || user?.name || 'User'}</p>
                            <p className="text-[10px] text-theme-tertiary mt-1 uppercase tracking-wider">{user?.role || 'Viewer'}</p>
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    <div
                        className="absolute right-0 top-full mt-2 w-48 bg-theme-surface border border-theme-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                        <div className="px-4 py-3 border-b border-theme-border">
                            <p className="text-sm text-theme-primary font-medium truncate">{user?.username || user?.name || 'Guest User'}</p>
                            <p className="text-xs text-theme-tertiary truncate">{user?.email || 'guest@example.com'}</p>
                        </div>
                        <div className="p-1">
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <User size={16} />
                                {t('profile') || 'Profile'}
                            </button>
                            <button
                                onClick={() => navigate('/workspace')}
                                className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Layout size={16} />
                                {t('Workspace') || 'Workspace'}
                            </button>
                            {['superadmin', 'admin'].includes(user?.role) && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Shield size={16} className="text-indigo-400" />
                                    Admin Panel
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={16} />
                                {t('logout') || 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </header >
    );
};

export default Header;
