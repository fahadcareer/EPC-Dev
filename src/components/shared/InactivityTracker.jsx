import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogOut, Clock, Activity, Shield } from 'lucide-react';
import useAuthStore from '../../store/logic/user';
import api from '../../services/api_service';
import socketService from '../../services/socketService';

const InactivityTracker = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, securityConfig, setSecurityConfig } = useAuthStore();
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // seconds left in warning modal
    
    const lastActiveAtRef = useRef(Date.now());
    const checkIntervalRef = useRef(null);

    const fetchConfig = useCallback(async () => {
        if (!user?.organization_id) return;
        try {
            const res = await api.get(`/admin/organizations/${user.organization_id}`);
            const org = res.data.organization || res.data;
            if (org.security_config) {
                setSecurityConfig(org.security_config);
            }
        } catch (error) {
            console.error("Failed to fetch security config:", error);
        }
    }, [user?.organization_id, setSecurityConfig]);

    useEffect(() => {
        if (isAuthenticated && user?.organization_id && !securityConfig) {
            fetchConfig();
        }
    }, [isAuthenticated, user?.organization_id, securityConfig, fetchConfig]);

    useEffect(() => {
        if (isAuthenticated && user?.organization_id) {
            socketService.connect();
            socketService.joinOrg(user.organization_id);

            const handleSecurityUpdate = (newConfig) => {
                setSecurityConfig(newConfig);
            };

            socketService.onSecurityConfigUpdate(handleSecurityUpdate);

            return () => {
                socketService.offSecurityConfigUpdate();
                socketService.leaveOrg(user.organization_id);
            };
        }
    }, [isAuthenticated, user?.organization_id, setSecurityConfig]);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/login');
    }, [logout, navigate]);

    const startTimers = useCallback(() => {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        
        if (!securityConfig?.auto_logout?.enabled) return;

        const hours = securityConfig.auto_logout.timeout_hours || 0;
        const minutes = securityConfig.auto_logout.timeout_minutes || 0;
        const totalMs = (hours * 3600 + minutes * 60) * 1000;

        if (totalMs <= 0) return;

        const warningMsFromEnd = Math.min(60000, totalMs / 2);

        checkIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const inactiveMs = now - lastActiveAtRef.current;
            
            if (inactiveMs >= totalMs) {
                // Logout right away
                clearInterval(checkIntervalRef.current);
                handleLogout();
            } else if (inactiveMs >= totalMs - warningMsFromEnd) {
                // Warning phase
                setShowWarning(true);
                const remaining = Math.max(0, Math.ceil((totalMs - inactiveMs) / 1000));
                setTimeLeft(remaining);
            } else {
                // Not in warning phase
                setShowWarning(false);
            }
        }, 1000);
        
    }, [securityConfig, handleLogout]);

    const resetTimers = useCallback(() => {
        lastActiveAtRef.current = Date.now();
        setShowWarning(false);
    }, []);

    useEffect(() => {
        if (isAuthenticated && securityConfig?.auto_logout?.enabled) {
            lastActiveAtRef.current = Date.now();
            const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
            
            let lastReset = 0;
            const throttledReset = () => {
                const now = Date.now();
                if (now - lastReset > 1000) {
                    resetTimers();
                    lastReset = now;
                }
            };

            events.forEach(event => window.addEventListener(event, throttledReset));
            
            // Check immediately when tab becomes visible
            const handleVisibility = () => {
                if (document.visibilityState === 'visible') {
                    const hours = securityConfig.auto_logout.timeout_hours || 0;
                    const minutes = securityConfig.auto_logout.timeout_minutes || 0;
                    const totalMs = (hours * 3600 + minutes * 60) * 1000;
                    
                    if (totalMs > 0) {
                        const inactiveMs = Date.now() - lastActiveAtRef.current;
                        if (inactiveMs >= totalMs) {
                            handleLogout();
                        } else if (inactiveMs >= totalMs - Math.min(60000, totalMs / 2)) {
                            setShowWarning(true);
                        }
                    }
                }
            };
            window.addEventListener('visibilitychange', handleVisibility);

            startTimers();

            return () => {
                events.forEach(event => window.removeEventListener(event, throttledReset));
                window.removeEventListener('visibilitychange', handleVisibility);
                if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            };
        }
    }, [isAuthenticated, securityConfig, resetTimers, startTimers, handleLogout]);

    if (!showWarning) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="w-full max-w-md bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Interior Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                    
                    <div className="p-8 relative z-10 text-center">
                        <div className="mx-auto w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 relative group">
                             <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                             <ShieldAlert className="w-10 h-10 text-indigo-400 relative z-10 animate-pulse" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-theme-primary mb-2 tracking-tight">Session Expiring</h2>
                        <p className="text-theme-secondary text-sm leading-relaxed mb-6">
                            Your session will automatically end in <span className="text-indigo-400 font-bold font-mono text-lg">{timeLeft}s</span> due to inactivity. Move your mouse or press any key to stay logged in.
                        </p>
                    </div>
                    
                    {/* Bottom Progress Bar */}
                    <div className="h-1.5 w-full bg-theme-bg-tertiary relative">
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: timeLeft, ease: "linear" }}
                            className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InactivityTracker;
