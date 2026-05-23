import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../services/api_service';

export default function OtpVerification() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password-email');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/verify-otp', { email, otp });
            const { reset_token } = response.data;
            navigate('/forgot-password-reset', { state: { email, reset_token } });
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setError('New OTP sent successfully');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend');
        }
        setResendLoading(false);
    };

    return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link to="/forgot-password-email" className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary mb-8 transition-colors text-sm">
                    <ArrowLeft size={16} />
                    Back to Email
                </Link>

                <div className="bg-app-glass backdrop-blur-xl border border-theme-border rounded-2xl p-8 shadow-2xl">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                        <ShieldCheck className="text-indigo-400" size={24} />
                    </div>
                    
                    <h2 className="text-2xl font-semibold text-theme-primary mb-2">Verify OTP</h2>
                    <p className="text-theme-tertiary text-sm mb-8">
                        We've sent a code to <span className="text-theme-primary font-medium">{email}</span>.
                    </p>

                    {error && (
                        <div className={`mb-6 p-3 text-sm rounded-lg ${error.includes('sent') ? 'bg-green-500/10 text-green-200 border border-green-500/20' : 'bg-red-500/10 text-red-200 border border-red-500/20'}`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-theme-tertiary uppercase tracking-widest ml-1 text-center block">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-theme-input border border-theme-input-border rounded-xl px-4 py-4 text-3xl text-center tracking-[0.5em] font-mono text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all"
                                placeholder="000000"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3.5 bg-theme-primary text-app-bg hover:bg-indigo-500 hover:text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify Code <ArrowRight size={16} /></>}
                        </button>

                        <div className="text-center">
                            <button 
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-xs text-theme-tertiary hover:text-theme-primary flex items-center justify-center gap-2 mx-auto transition-colors"
                            >
                                {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw size={12} />}
                                Didn't receive code? Resend
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
