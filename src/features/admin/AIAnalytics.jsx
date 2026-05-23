import React, { useEffect, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Activity, Cpu, Wallet, Zap, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';
import useAnalyticsStore from '../../store/analyticsStore';
import { motion } from 'framer-motion';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const EXCHANGE_RATES = {
    INR: 83.5,
    AED: 3.67
};

const KPICard = ({ title, value, icon: Icon, trend, subtext, colorClass }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-surface p-6 rounded-2xl border border-theme-border shadow-sm transition-all hover:shadow-md"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-theme-tertiary text-xs font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold mt-2 text-theme-primary">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass} shadow-lg shadow-current/10`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            {trend && (
                <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </span>
            )}
            <span className="text-theme-tertiary text-xs font-medium">{subtext}</span>
        </div>
    </motion.div>
);

const AIAnalytics = ({ organizationId }) => {
    const { stats, trends, features, topUsers, isLoading, fetchAIAnalytics, downloadOpsReport } = useAnalyticsStore();
    const [timeRange, setTimeRange] = React.useState(30);
    const [currency, setCurrency] = React.useState('USD');

    const conversionRate = useMemo(() => {
        if (currency === 'INR') return EXCHANGE_RATES.INR;
        if (currency === 'AED') return EXCHANGE_RATES.AED;
        return 1;
    }, [currency]);

    const currencySymbol = useMemo(() => {
        if (currency === 'INR') return '₹';
        if (currency === 'AED') return 'د.إ';
        return '$';
    }, [currency]);

    useEffect(() => {
        fetchAIAnalytics(organizationId, timeRange);
    }, [organizationId, timeRange]);

    const formattedTrends = useMemo(() => {
        return trends.map(t => ({
            name: t._id,
            tokens: t.tokens,
            cost: parseFloat((t.cost * conversionRate).toFixed(4)),
            requests: t.requests
        }));
    }, [trends, conversionRate]);

    const formattedFeatures = useMemo(() => {
        const nameMap = {
            'metadata_rules': 'Process Validation',
            'text_to_process': 'Diagram Generation'
        };
        return features.map(f => ({
            ...f,
            name: nameMap[String(f._id).toLowerCase()] || f._id
        }));
    }, [features]);

    const rangeLabel = useMemo(() => {
        if (timeRange === 1) return "today";
        if (timeRange === 7) return "vs previous 7 days";
        if (timeRange === 90) return "vs last quarter";
        return "vs last month";
    }, [timeRange]);

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-theme-primary tracking-tight">AI USAGE ANALYTICS</h1>
                    <p className="text-theme-tertiary text-sm mt-1">Real-time observability and cost intelligence for GPT-4o.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select 
                            value={timeRange}
                            onChange={(e) => setTimeRange(Number(e.target.value))}
                            className="appearance-none bg-app-surface border border-theme-border pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold text-theme-secondary focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
                        >
                            <option value={1}>TODAY</option>
                            <option value={7}>LAST 7 DAYS</option>
                            <option value={30}>LAST 30 DAYS</option>
                            <option value={90}>LAST 90 DAYS</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-tertiary">
                            <Activity size={14} />
                        </div>
                    </div>
                    <div className="relative">
                        <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="appearance-none bg-app-surface border border-theme-border pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold text-theme-secondary focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="AED">AED (د.إ)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-tertiary">
                            <DollarSign size={14} />
                        </div>
                    </div>
                    <button 
                        onClick={() => downloadOpsReport(organizationId, timeRange)}
                        className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span>EXPORT</span>
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Tokens"
                    value={stats?.total_tokens?.toLocaleString() || '0'}
                    icon={Cpu}
                    trend={12.5}
                    subtext={rangeLabel}
                    colorClass="bg-blue-600"
                />
                <KPICard
                    title="Estimated Cost"
                    value={`${currencySymbol}${(stats?.total_cost * conversionRate || 0).toFixed(currency === 'USD' ? 3 : 2)}`}
                    icon={Wallet}
                    trend={8.2}
                    subtext={rangeLabel}
                    colorClass="bg-emerald-600"
                />
                <KPICard
                    title="Total Requests"
                    value={stats?.total_requests?.toLocaleString() || '0'}
                    icon={Zap}
                    trend={-2.4}
                    subtext={rangeLabel}
                    colorClass="bg-amber-600"
                />
                <KPICard
                    title="Avg Latency"
                    value={`${Math.round(stats?.avg_latency || 0)}ms`}
                    icon={Activity}
                    subtext="Response time"
                    colorClass="bg-indigo-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Usage Over Time */}
                <div className="lg:col-span-2 bg-app-surface p-6 rounded-2xl border border-theme-border shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-sm font-black text-theme-primary uppercase tracking-widest">Usage Trends</h2>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                <span className="text-[10px] font-bold text-theme-tertiary uppercase">Tokens</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-theme-tertiary uppercase">Cost</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formattedTrends}>
                                <defs>
                                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600 }} 
                                    dy={15} 
                                />
                                <YAxis 
                                    yAxisId="left"
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600 }} 
                                />
                                <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600 }} 
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-surface)', 
                                        border: '1px solid var(--border-glass)', 
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="tokens" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                                <Area yAxisId="right" type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feature Breakdown */}
                <div className="bg-app-surface p-6 rounded-2xl border border-theme-border shadow-sm">
                    <h2 className="text-sm font-black text-theme-primary uppercase tracking-widest mb-8">Feature Load</h2>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={formattedFeatures}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="name"
                                >
                                    {formattedFeatures.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-surface)', 
                                        border: '1px solid var(--border-glass)', 
                                        borderRadius: '12px' 
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={40} 
                                    iconType="circle" 
                                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Users & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                <div className="bg-app-surface p-6 rounded-2xl border border-theme-border shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Users size={18} className="text-indigo-600" />
                        </div>
                        <h2 className="text-sm font-black text-theme-primary uppercase tracking-widest">Power Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-theme-border">
                                    <th className="pb-4 text-[10px] font-black text-theme-tertiary uppercase tracking-widest">Identiy</th>
                                    <th className="pb-4 text-[10px] font-black text-theme-tertiary uppercase tracking-widest text-center">Reqs</th>
                                    <th className="pb-4 text-[10px] font-black text-theme-tertiary uppercase tracking-widest text-center">Tokens</th>
                                    <th className="pb-4 text-[10px] font-black text-theme-tertiary uppercase tracking-widest text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border">
                                {topUsers.map((user, idx) => (
                                    <tr key={idx} className="group hover:bg-theme-input/5 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-theme-primary">{user.full_name || 'Anonymous'}</p>
                                                    <p className="text-[10px] font-bold text-theme-tertiary opacity-70 uppercase tracking-tighter">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-theme-secondary text-center font-bold">{user.request_count}</td>
                                        <td className="py-4 text-xs font-black text-theme-secondary text-center opacity-80">{user.total_tokens?.toLocaleString()}</td>
                                        <td className="py-4 text-sm font-black text-emerald-600 text-right tracking-tight">${user.total_cost?.toFixed(3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-8 rounded-2xl text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                <Info size={20} className="text-indigo-100" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-widest">Cost Efficiency</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                                <h4 className="text-xs font-black text-indigo-200 uppercase mb-1">PRO TIP</h4>
                                <p className="text-sm leading-relaxed text-indigo-50/90 font-medium">Switch lightweight metadata tasks to GPT-4o-mini to reduce operational expenditure by up to 85%.</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                                <h4 className="text-xs font-black text-indigo-200 uppercase mb-1">STRATEGY</h4>
                                <p className="text-sm leading-relaxed text-indigo-50/90 font-medium">Implement token caching for recurring process mining templates to improve response times by 30%.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => downloadOpsReport(organizationId, timeRange)}
                            className="mt-10 bg-white text-indigo-700 px-8 py-3 rounded-xl font-black text-xs tracking-widest uppercase hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                        >
                            Download Ops Report
                        </button>
                    </div>
                    {/* Abstract design elements */}
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mt-20 -mr-20 blur-2xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                </div>
            </div>
        </div>
    );
};

export default AIAnalytics;
