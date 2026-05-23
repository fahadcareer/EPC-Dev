import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { User, Mail, Lock, Building2, ArrowRight, Loader2, Hash } from 'lucide-react';
import api from '../../services/api_service';
import { useTranslation } from 'react-i18next';
import NETWORK_URLS from "../../config/network_string";

export default function Register() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        organization_name: '',
        organization_id: ''
    });
    const [mode, setMode] = useState('create'); // 'create' or 'join'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Mouse position state for parallax
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation for mouse movement
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const xPos = (clientX / innerWidth - 0.5) * 2;
            const yPos = (clientY / innerHeight - 0.5) * 2;
            x.set(xPos);
            y.set(yPos);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [x, y]);

    // Parallax transforms
    const layer1X = useTransform(mouseX, [-1, 1], [-20, 20]);
    const layer1Y = useTransform(mouseY, [-1, 1], [-20, 20]);
    const layer2X = useTransform(mouseX, [-1, 1], [40, -40]);
    const layer2Y = useTransform(mouseY, [-1, 1], [40, -40]);
    const layer3X = useTransform(mouseX, [-1, 1], [-60, 60]);
    const layer3Y = useTransform(mouseY, [-1, 1], [-60, 60]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password
        };

        if (mode === 'create') {
            payload.organization_name = formData.organization_name;
        } else {
            payload.organization_id = formData.organization_id;
        }

        try {
            await api.post(NETWORK_URLS.Register, payload);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || t('registrationFailed') || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#050505] overflow-hidden flex items-center justify-center font-sans selection:bg-indigo-500/30">

            {/* Physics/Parallax Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-black to-purple-900/10" />

                <motion.div style={{ x: layer1X, y: layer1Y }} className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
                </motion.div>

                <motion.div style={{ x: layer2X, y: layer2Y }} className="absolute inset-0">
                    <div className="absolute top-20 right-20 w-4 h-4 bg-indigo-500/30 rounded-full blur-[1px]" />
                    <div className="absolute bottom-40 left-20 w-6 h-6 bg-purple-500/30 rounded-full blur-[1px]" />
                    <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-500/30 rounded-full blur-[1px]" />
                </motion.div>

                <motion.div style={{ x: layer3X, y: layer3Y }} className="absolute inset-0">
                    <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/20 rounded-full" />
                    <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full" />
                </motion.div>
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[440px] px-6"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex flex-col items-center gap-1 relative z-10 py-2">
                        <h1 className="text-4xl font-black tracking-[0.2em] text-white font-outfit uppercase translate-x-[0.1em]">
                            Tasree3
                        </h1>
                        <p className="text-[10px] font-bold tracking-[0.4em] text-theme-tertiary uppercase opacity-80">
                            Process Reengineering
                        </p>
                    </div>
                    <motion.h1
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-2xl font-semibold tracking-tight text-white"
                    >
                        {t('createAccount')}
                    </motion.h1>
                </div>

                {/* Glassmorphism Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-8 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-3 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {error}
                        </motion.div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-black/20 rounded-xl mb-6 border border-white/5 relative">
                        <motion.div
                            className="absolute top-1 bottom-1 bg-white/10 rounded-lg shadow-sm"
                            initial={false}
                            animate={{
                                left: mode === 'create' ? '4px' : '50%',
                                width: 'calc(50% - 4px)'
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg relative z-10 transition-colors ${mode === 'create' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            {t('createOrganization')}
                        </button>
                        <button
                            onClick={() => setMode('join')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg relative z-10 transition-colors ${mode === 'join' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            {t('joinOrganization')}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest ml-1">{t('fullName')}</label>
                            <div className="relative group/input">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                <input
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                                    placeholder="Enter your Name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest ml-1">{t('email')}</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest ml-1">{t('password')}</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-1 overflow-hidden"
                        >
                            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest ml-1">
                                {mode === 'create' ? t('organizationName') : t('organizationId')}
                            </label>
                            <div className="relative group/input">
                                {mode === 'create' ? (
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                ) : (
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                )}
                                <input
                                    name={mode === 'create' ? "organization_name" : "organization_id"}
                                    type="text"
                                    value={mode === 'create' ? formData.organization_name : formData.organization_id}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                                    placeholder={mode === 'create' ? "My Company Ltd." : "Enter Org ID"}
                                    required
                                />
                            </div>
                        </motion.div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-4 bg-white text-black hover:bg-indigo-50 rounded-xl font-medium text-sm shadow-lg shadow-white/5 hover:shadow-white/20 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {t('createAccount')}
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-neutral-500">
                            {t('alreadyHaveAccount')}{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
                                {t('loginHere')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
