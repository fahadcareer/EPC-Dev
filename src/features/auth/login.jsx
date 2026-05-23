import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, HelpCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api_service';
import useAuthStore from '../../store/logic/user';
import { useTranslation } from 'react-i18next';
import NETWORK_URLS from "../../config/network_string";

export default function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Mouse position state for parallax
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Mouse position for glow effect (pixels)
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);

    // Smooth spring animation for mouse movement
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    // Smooth spring for glow (slightly delayed for elegance)
    const glowX = useSpring(cursorX, { stiffness: 100, damping: 25 });
    const glowY = useSpring(cursorY, { stiffness: 100, damping: 25 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            // Calculate normalized position (-1 to 1)
            const xPos = (clientX / innerWidth - 0.5) * 2;
            const yPos = (clientY / innerHeight - 0.5) * 2;
            x.set(xPos);
            y.set(yPos);

            // Update raw coordinates for glow
            cursorX.set(clientX);
            cursorY.set(clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [x, y, cursorX, cursorY]);

    // Parallax transforms for different layers
    const layer1X = useTransform(mouseX, [-1, 1], [-20, 20]);
    const layer1Y = useTransform(mouseY, [-1, 1], [-20, 20]);

    const layer2X = useTransform(mouseX, [-1, 1], [40, -40]);
    const layer2Y = useTransform(mouseY, [-1, 1], [40, -40]);

    const layer3X = useTransform(mouseX, [-1, 1], [-60, 60]);
    const layer3Y = useTransform(mouseY, [-1, 1], [-60, 60]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post(NETWORK_URLS.Login, { email, password });
            const { token, user_id, role, organization_id, name, email: userEmail } = response.data;

            // Update store
            useAuthStore.getState().setAuth(token, { id: user_id, role, organization_id, name, email: userEmail });

            // Legacy local storage for compatibility if needed elsewhere
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', user_id);
            localStorage.setItem('role', role);

            navigate('/workspace');
        } catch (err) {
            setError(err.response?.data?.error || t('loginFailed') || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-app-bg overflow-hidden flex items-center justify-center font-sans selection:bg-indigo-500/30">

            {/* Physics/Parallax Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Deep Space Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-app-bg to-purple-900/10" />

                {/* Interactive Cursor Glow */}
                <motion.div
                    style={{
                        x: glowX,
                        y: glowY,
                        translateX: '-50%',
                        translateY: '-50%'
                    }}
                    className="fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none z-0"
                />

                {/* Floating Orbs - Layer 1 (Slow) */}
                <motion.div style={{ x: layer1X, y: layer1Y }} className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
                </motion.div>

                {/* Dynamic Particles */}
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={`p1-${i}`}
                        style={{
                            x: useTransform(mouseX, [-1, 1], [Math.random() * 60 - 30, Math.random() * -60 + 30]),
                            y: useTransform(mouseY, [-1, 1], [Math.random() * 60 - 30, Math.random() * -60 + 30]),
                        }}
                        className="absolute rounded-full bg-indigo-500/20 blur-[1px]"
                        initial={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: Math.random() * 6 + 2,
                            height: Math.random() * 6 + 2,
                            opacity: Math.random() * 0.5 + 0.1,
                        }}
                        animate={{
                            y: [0, Math.random() * -40 - 20],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={`p2-${i}`}
                        style={{
                            x: useTransform(mouseX, [-1, 1], [Math.random() * 100 - 50, Math.random() * -100 + 50]),
                            y: useTransform(mouseY, [-1, 1], [Math.random() * 100 - 50, Math.random() * -100 + 50]),
                        }}
                        className="absolute rounded-full bg-purple-400/30"
                        initial={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: Math.random() * 4 + 1,
                            height: Math.random() * 4 + 1,
                            opacity: Math.random() * 0.6 + 0.2,
                        }}
                        animate={{
                            x: [0, Math.random() * 40 - 20],
                            y: [0, Math.random() * 40 - 20],
                        }}
                        transition={{
                            duration: Math.random() * 7 + 5,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Interactive Fireflies - Layer 3 (Fast & Bright) */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`p3-${i}`}
                        style={{
                            x: useTransform(mouseX, [-1, 1], [Math.random() * 150 - 75, Math.random() * -150 + 75]),
                            y: useTransform(mouseY, [-1, 1], [Math.random() * 150 - 75, Math.random() * -150 + 75]),
                        }}
                        className="absolute rounded-full bg-theme-primary/40 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        initial={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: Math.random() * 3 + 1,
                            height: Math.random() * 3 + 1,
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[400px] px-6"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="mb-6 relative group"
                    >
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img src="/logo.png" alt="Tasree3 Process Reengineering" className="h-24 w-auto object-contain relative z-10 drop-shadow-2xl" />
                    </motion.div>
                    <motion.p
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-theme-secondary mt-2 text-sm font-light"
                    >
                        {t('signInToContinue')}
                    </motion.p>
                </div>

                {/* Glassmorphism Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="bg-app-glass backdrop-blur-xl border border-theme-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group"
                >
                    {/* Card Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-theme-highlight to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

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

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-theme-tertiary uppercase tracking-widest ml-1">{t('email')}</label>
                            <div className="relative group/input">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-theme-input border border-theme-input-border rounded-xl pl-10 pr-4 py-3 text-sm text-theme-primary placeholder-theme-tertiary focus:outline-none focus:border-indigo-500/50 focus:bg-app-bg focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-theme-tertiary uppercase tracking-widest ml-1">{t('password')}</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary group-focus-within/input:text-indigo-400 transition-colors duration-300" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-theme-input border border-theme-input-border rounded-xl pl-10 pr-10 py-3 text-sm text-theme-primary placeholder-theme-tertiary focus:outline-none focus:border-indigo-500/50 focus:bg-app-bg focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-indigo-400 transition-colors duration-300 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 bg-theme-primary text-app-bg hover:bg-indigo-500 hover:text-white rounded-xl font-medium text-sm shadow-lg shadow-white/5 hover:shadow-white/20 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {t('signIn')}
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-theme-border/50 text-center space-y-4">
                        <Link to="/forgot-password-email" className="text-xs text-theme-secondary hover:text-indigo-400 transition-colors">
                            Forgot your password?
                        </Link>
                        <Link to="/help" className="text-xs text-theme-tertiary hover:text-theme-accent transition-colors flex items-center justify-center gap-2">
                            <HelpCircle size={14} />
                            Need help? Visit the Help Center
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div >
    );
}
