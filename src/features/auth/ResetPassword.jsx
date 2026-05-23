import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api_service';
import { toast } from 'react-toastify';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const reset_token = location.state?.reset_token;

    useEffect(() => {
        if (!email || !reset_token) {
            navigate('/forgot-password-email');
        }
    }, [email, reset_token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', { email, reset_token, password });
            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-app-glass backdrop-blur-xl border border-theme-border rounded-2xl p-8 shadow-2xl">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                        <CheckCircle className="text-green-400" size={24} />
                    </div>
                    
                    <h2 className="text-2xl font-semibold text-theme-primary mb-2">Create New Password</h2>
                    <p className="text-theme-tertiary text-sm mb-8">
                        Your identity is verified. Please choose a strong new password.
                    </p>

                    {error && (
                        <div className="mb-6 p-3 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-theme-tertiary uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-theme-input border border-theme-input-border rounded-xl pl-10 pr-10 py-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-indigo-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-theme-tertiary uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-theme-input border border-theme-input-border rounded-xl pl-10 pr-4 py-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-theme-primary text-app-bg hover:bg-indigo-500 hover:text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
