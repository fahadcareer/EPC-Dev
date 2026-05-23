import { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';

export default function NotificationPanel() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const api = (await import("../../services/api_service")).default;
            const res = await api.get('/notifications/');
            setNotifications(res.data || []);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const api = (await import("../../services/api_service")).default;
            await api.put(`/notifications/${notificationId}/read`);
            // Update local state
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    useEffect(() => {
        // Load notifications on mount
        loadNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIconColor = (type) => {
        switch (type) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Notifications"
            >
                <Bell size={20} className="text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-700 rounded"
                            >
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-400">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification._id}
                                            className={`p-3 hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-gray-700/30' : ''
                                                }`}
                                            onClick={() => !notification.read && markAsRead(notification._id)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`mt-0.5 flex-shrink-0 ${getIconColor(notification.type)}`}>
                                                    {notification.type === 'success' ? (
                                                        <Check size={14} />
                                                    ) : notification.type === 'error' ? (
                                                        <X size={14} />
                                                    ) : (
                                                        <Bell size={14} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-200 break-words leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        {new Date(notification.created_at).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
