import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api_service';

export default function ForgotEmail() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            // Navigate to OTP page and pass email in state
            navigate('/forgot-password-otp', { state: { email } });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
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
                <Link to="/login" className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary mb-8 transition-colors text-sm">
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>

                <div className="bg-app-glass backdrop-blur-xl border border-theme-border rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-semibold text-theme-primary mb-2">Forgot Password</h2>
                    <p className="text-theme-tertiary text-sm mb-8">Enter your email and we'll send you a 6-digit OTP to reset your password.</p>

                    {error && (
                        <div className="mb-6 p-3 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-theme-tertiary uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-theme-input border border-theme-input-border rounded-xl pl-10 pr-4 py-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-theme-primary text-app-bg hover:bg-indigo-500 hover:text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
