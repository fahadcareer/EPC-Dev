import React, { useState } from "react";
import { useServerStore } from "../../store/serverStore";
import { RefreshCw, CheckCircle2, AlertTriangle, WifiOff, Globe } from "lucide-react";
import { toast } from "react-toastify";

const ServerOffline = () => {
    const { isChecking, checkServerHealth } = useServerStore();
    const [shake, setShake] = useState(false);

    const handleRetry = async () => {
        const isOnline = await checkServerHealth();
        if (isOnline) {
            toast.success("✨ Reconnected! System services are fully online.", {
                toastId: "reconnect-success"
            });
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            toast.error("🛠️ Systems are still undergoing maintenance.", {
                toastId: "reconnect-failed"
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col md:flex-row bg-[#f1f5f9] select-none overflow-y-auto">
            
            {/* LEFT COLUMN: Light Blue Gradient Background with Custom Mascot SVG Graphics */}
            <div className="w-full md:w-[45%] lg:w-[42%] bg-gradient-to-br from-[#cbe2fc] via-[#abd2fe] to-[#8dbefe] flex items-center justify-center p-8 relative min-h-[360px] md:min-h-screen overflow-hidden">
                
                {/* SVG Mascot Graphics Layer */}
                <div className={`relative z-20 w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] transition-all duration-500 ${shake ? 'animate-shake' : ''}`}>
                    <svg 
                        viewBox="0 0 400 400" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="w-full h-auto drop-shadow-[0_20px_40px_rgba(13,37,102,0.25)]"
                    >
                        <defs>
                            {/* Gradients */}
                            <linearGradient id="earLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fd79a8" />
                                <stop offset="100%" stopColor="#e84393" />
                            </linearGradient>
                            <linearGradient id="earRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0984e3" />
                                <stop offset="100%" stopColor="#74b9ff" />
                            </linearGradient>
                            <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ff007f" />
                                <stop offset="100%" stopColor="#d63031" />
                            </linearGradient>
                            
                            {/* Hazard Stripe Pattern for Caution Barrier */}
                            <pattern id="hazardPattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="10" height="20" fill="#f1c40f" />
                                <rect x="10" width="10" height="20" fill="#1e272e" />
                            </pattern>
                        </defs>

                        {/* 1. Background dark blue circle */}
                        <circle cx="160" cy="180" r="100" fill="#0d2566" />

                        {/* 2. Cute Mascot (Rendered behind the monitor for peeking effect) */}
                        <g id="mascot">
                            {/* Left Pink Ear */}
                            <rect x="90" y="45" width="22" height="60" rx="11" fill="url(#earLeftGrad)" transform="rotate(-15, 101, 75)" />
                            {/* Right Blue Ear */}
                            <rect x="125" y="45" width="22" height="60" rx="11" fill="url(#earRightGrad)" transform="rotate(15, 136, 75)" />
                            
                            {/* Antenna */}
                            <line x1="118" y1="80" x2="118" y2="60" stroke="#f1c40f" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="118" cy="56" r="6" fill="#f1c40f" />

                            {/* Headphone Band */}
                            <path d="M82,90 C82,50 154,50 154,90" fill="none" stroke="#2d3436" strokeWidth="8" strokeLinecap="round" />

                            {/* Head/Face */}
                            <circle cx="118" cy="100" r="32" fill="url(#faceGrad)" />
                            
                            {/* Face Screen Inner */}
                            <rect x="94" y="85" width="48" height="30" rx="15" fill="#1e272e" />
                            
                            {/* Target eye left */}
                            <circle cx="106" cy="100" r="7" stroke="white" strokeWidth="2.5" fill="none" />
                            <line x1="106" y1="94" x2="106" y2="106" stroke="white" strokeWidth="2" />
                            <line x1="100" y1="100" x2="112" y2="100" stroke="white" strokeWidth="2" />
                            
                            {/* Wink eye right */}
                            <path d="M124,103 C124,97 132,97 132,103" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Headphones Cups */}
                            <rect x="76" y="86" width="12" height="24" rx="6" fill="#2d3436" />
                            <rect x="150" y="86" width="12" height="24" rx="6" fill="#2d3436" />
                        </g>

                        {/* 3. Computer Monitor */}
                        <g id="monitor">
                            {/* Monitor Stand Base & Stand */}
                            <path d="M140,250 L130,300 L190,300 L180,250 Z" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2.5" />
                            <rect x="105" y="300" width="110" height="12" rx="4" fill="#7f8c8d" />

                            {/* Monitor Frame */}
                            <rect x="60" y="120" width="200" height="132" rx="10" fill="#d2d7db" stroke="#7f8c8d" strokeWidth="3" />
                            {/* Inner Screen */}
                            <rect x="68" y="128" width="184" height="106" rx="6" fill="#adb5bd" />
                            
                            {/* Shadow under monitor frame */}
                            <rect x="68" y="228" width="184" height="6" fill="#868e96" />
                        </g>

                        {/* 4. Warning Exclamation Triangle (Layered in front of monitor) */}
                        <g id="warning-sign">
                            {/* Outer Glow Shadow effect */}
                            <path d="M210,95 L320,270 C325,278 319,288 308,288 L112,288 C101,288 95,278 100,270 L210,95 Z" fill="rgba(235,47,6,0.15)" />
                            
                            {/* White filled triangle with thick red border */}
                            <path d="M210,105 L310,270 C314,277 309,284 300,284 L120,284 C111,284 106,277 110,270 L210,105 Z" fill="white" stroke="#eb2f06" strokeWidth="16" strokeLinejoin="round" />
                            
                            {/* Exclamation point */}
                            <rect x="202" y="160" width="16" height="60" rx="8" fill="#eb2f06" />
                            <circle cx="210" cy="242" r="9" fill="#eb2f06" />
                        </g>

                        {/* 5. Caution Barriers / Barricades (Layered on top in bottom-left) */}
                        <g id="barrier">
                            {/* Wood Legs */}
                            <rect x="74" y="255" width="10" height="70" fill="#d35400" rx="2" />
                            <rect x="156" y="255" width="10" height="70" fill="#d35400" rx="2" />
                            
                            {/* Striped Rail 1 */}
                            <rect x="46" y="260" width="128" height="15" fill="url(#hazardPattern)" rx="2" stroke="#2c3e50" strokeWidth="1.5" />
                            {/* Striped Rail 2 */}
                            <rect x="46" y="284" width="128" height="15" fill="url(#hazardPattern)" rx="2" stroke="#2c3e50" strokeWidth="1.5" />
                        </g>
                    </svg>
                </div>

                {/* Sweeping Separation Wave (Blends left light-blue side beautifully into right off-white side) */}
                <svg 
                    className="hidden md:block absolute top-0 -right-24 h-full w-28 text-[#f8fafc] fill-current z-10" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                >
                    <path d="M0,0 L0,100 L100,100 C100,60 35,20 0,0 Z" />
                </svg>
            </div>

            {/* RIGHT COLUMN: Clean Off-White Content Area with Exact Copywriting & Retry Capabilities */}
            <div className="w-full md:w-[55%] lg:w-[58%] bg-[#f8fafc] flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-24 py-12 md:py-20 relative z-20">
                
                {/* Visual indicator of live environment status */}
                <div className="flex items-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-[#1b3b8f] font-bold">EPC Production Status</span>
                </div>

                {/* Main Heading styled exactly like the screenshot */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1a2f64] leading-[1.05] font-sans">
                    WEBSITE <br />
                    DOWN FOR <br />
                    MAINTENANCE
                </h1>

                {/* Precise Subtext description */}
                <p className="mt-6 text-slate-500 text-base sm:text-lg max-w-md font-medium leading-relaxed font-sans">
                    Our website is entering maintenance mode until further notice, we'll keep you posted on any further updates.
                </p>

                {/* Divider */}
                <div className="h-px bg-slate-200/80 max-w-md my-8"></div>

                {/* Systems Reconnect Diagnostics Checklist */}
                <div className="max-w-md mb-8 p-5 bg-slate-100/50 border border-slate-200/50 rounded-2xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#1a2f64] mb-3">
                        Service Gateway Diagnostics
                    </div>
                    <div className="space-y-2.5 text-sm font-semibold">
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-sky-500" /> Client Domain Gateway</span>
                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-4.5 h-4.5" /> ONLINE</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-2"><WifiOff className="w-4 h-4 text-rose-500" /> Backend Cluster Proxy</span>
                            <span className="text-rose-500 flex items-center gap-1"><AlertTriangle className="w-4.5 h-4.5 animate-pulse" /> OFFLINE</span>
                        </div>
                    </div>
                </div>

                {/* Action button triggers a ping to health endpoint to reconnect automatically */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md">
                    <button
                        onClick={handleRetry}
                        disabled={isChecking}
                        className={`flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold tracking-wider uppercase text-white shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer ${
                            isChecking 
                            ? "bg-[#1a2f64]/50 cursor-not-allowed" 
                            : "bg-[#1b3b8f] hover:bg-[#112760] hover:shadow-[#1b3b8f]/20 shadow-[0_8px_25px_rgba(27,59,143,0.3)]"
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
                        {isChecking ? "Reconnecting..." : "Retry Connection"}
                    </button>
                </div>
            </div>

            {/* Custom Animations Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                    20%, 40%, 60%, 80% { transform: translateX(6px); }
                }
                .animate-shake {
                    animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}} />
        </div>
    );
};

export default ServerOffline;
