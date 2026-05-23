import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, X } from 'lucide-react';
import useAuthStore from '../../store/logic/user';
import { motion, AnimatePresence } from 'framer-motion';

const LicenseBanner = () => {
    const user = useAuthStore((state) => state.user);
    const [dismissed, setDismissed] = React.useState(false);

    if (!user || !user.organization || !user.organization.license || dismissed) return null;

    const license = user.organization.license;
    const { is_active, expiry_date } = license;

    // Superadmins don't need the banner usually, or maybe they do to fix it.
    // Let's show it to everyone.

    let bannerType = null; // 'expired', 'expiring_soon', 'disabled'
    let daysLeft = null;

    if (!is_active) {
        bannerType = 'disabled';
    } else if (expiry_date) {
        const exp = new Date(expiry_date);
        const now = new Date();
        const diffTime = exp - now;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            bannerType = 'expired';
        } else if (daysLeft <= 14) { // Show warning if less than 14 days
            bannerType = 'expiring_soon';
        }
    }

    if (!bannerType) return null;

    const configs = {
        disabled: {
            bg: 'bg-red-600',
            icon: <ShieldAlert className="w-5 h-5" />,
            text: 'Your organization account has been disabled. Please contact support.',
            showDismiss: false
        },
        expired: {
            bg: 'bg-red-500',
            icon: <AlertTriangle className="w-5 h-5" />,
            text: 'Your license has expired. Please renew to maintain full access to all features.',
            showDismiss: false
        },
        expiring_soon: {
            bg: 'bg-amber-500',
            icon: <Clock className="w-5 h-5" />,
            text: `Your license will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Please renew soon.`,
            showDismiss: true
        }
    };

    const config = configs[bannerType];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className={`fixed top-0 left-0 right-0 z-[100] ${config.bg} text-white shadow-lg`}
            >
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-white/20 rounded-lg">
                            {config.icon}
                        </div>
                        <p className="text-sm font-semibold tracking-wide">
                            {config.text}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition-colors whitespace-nowrap"
                            onClick={() => window.open('https://tasree3.com/renew', '_blank')}
                        >
                            Renew Now
                        </button>
                        {config.showDismiss && (
                            <button 
                                onClick={() => setDismissed(true)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LicenseBanner;
