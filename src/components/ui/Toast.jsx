import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, Info, Download, AlertTriangle, Loader2, Trash2 } from 'lucide-react';

const Toast = ({ show, onClose, message, type = 'success', duration }) => {
    // Resolve effective duration: timeline type always 2500ms, others default 3000ms
    const effectiveDuration = duration ?? (type === 'timeline' ? 2500 : 3000);

    useEffect(() => {
        if (show && effectiveDuration && type !== 'info' && type !== 'loading') { // Continuous toasts shouldn't auto-dismiss
            const timer = setTimeout(() => {
                onClose();
            }, effectiveDuration);
            return () => clearTimeout(timer);
        }
    }, [show, effectiveDuration, onClose, type]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-500 w-5 h-5 shrink-0" />;
            case 'error':
                return <XCircle className="text-red-500 w-5 h-5 shrink-0" />;
            case 'loading':
                return <Loader2 className="text-indigo-500 w-5 h-5 shrink-0 animate-spin" />;
            case 'info':
                return <Download className="text-blue-500 w-5 h-5 shrink-0 animate-bounce" />;
            case 'warning':
                return <AlertTriangle className="text-yellow-500 w-5 h-5 shrink-0" />;
            case 'delete':
                return <Trash2 className="text-red-500 w-5 h-5 shrink-0" />;
            case 'timeline':
                return null; // No icon for timeline history toasts
            default:
                return <Info className="text-blue-500 w-5 h-5 shrink-0" />;
        }
    };

    const icon = getIcon();

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-theme-surface border border-theme-border text-theme-primary px-4 py-3 rounded-lg shadow-2xl min-w-[300px]"
                >
                    {icon}
                    <span className="flex-1 text-sm font-medium">{message}</span>
                    <button onClick={onClose} className="text-theme-tertiary hover:text-theme-primary transition-colors">
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
