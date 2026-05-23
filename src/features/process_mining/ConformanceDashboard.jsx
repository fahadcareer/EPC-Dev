import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, AlertTriangle, Activity, Target,
  TrendingDown, ChevronRight, Download, Filter, Eye,
  ArrowRight, ShieldCheck, Zap, BarChart3, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../../layouts/MainLayout";
import ProcessMapGraph from "./ProcessMapGraph";
import * as miningService from "../../services/miningService";
import { toast } from "react-toastify";
import { useTheme } from "../../contexts/ThemeContext";

const ConformanceDashboard = () => {
  const { id, approvedId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState("side-by-side");
  const [selectedDeviation, setSelectedDeviation] = useState(null);
  const [activeTab, setActiveTab] = useState("deviations");
  const [direction, setDirection] = useState("LR");

  useEffect(() => {
    if (id && approvedId) {
      loadConformanceData(id, approvedId);
    }
  }, [id, approvedId]);

  const loadConformanceData = async (processId, refId) => {
    try {
      setLoading(true);
      const results = await miningService.runConformanceCheck(processId, refId);
      // If the response is wrapped in 'data', unwrap it; otherwise use it directly.
      const actualData = results.data || results;
      console.log("Extracted Data:", actualData);
      setData(actualData);
    } catch (err) {
      toast.error("Failed to load conformance analysis");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, subtitle, icon: Icon, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-500/[0.02] rounded-3xl blur-sm group-hover:blur-md transition-all" />
      <div className="relative h-full bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-glass)] p-5 rounded-3xl flex flex-col justify-between overflow-hidden shadow-2xl">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />

        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-2xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
            <Icon size={20} />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="w-1 h-1 rounded-full bg-slate-600" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{value ?? "---"}</h3>
            {title.includes("Score") && <span className="text-[10px] font-bold text-[var(--text-secondary)]">fitness</span>}
          </div>
          <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-2 line-clamp-1">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );

  const handleDownloadReport = async () => {
    if (!id || !approvedId) return;
    try {
      const api = (await import("../../services/api_service.jsx")).apiGet;
      const NETWORK_URLS = (await import("../../config/network_string.jsx")).default;

      const res = await api(NETWORK_URLS.MiningConformanceReport(id, approvedId), {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Conformance_Report_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report");
    }
  };

  return (
    <MainLayout showSidebar={false} showHeader={false}>
      <div className="absolute inset-0 overflow-hidden flex flex-col bg-transparent">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -ml-64 -mb-64" />
        </div>

        {/* Global Header */}
        <header className="px-8 py-6 flex items-center justify-between relative z-20 bg-[var(--bg-surface)] backdrop-blur-md border-b border-[var(--border-glass)]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-[var(--bg-app)] hover:bg-indigo-500/10 rounded-2xl border border-[var(--border-glass)] transition-all active:scale-95 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck size={18} className="text-indigo-500" />
                <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Conformance Center</h1>
              </div>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-7">Policy Audit & Compliance Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-[var(--bg-app)] p-1.5 rounded-2xl border border-[var(--border-glass)] shadow-inner">
              <button
                onClick={() => setDirection("LR")}
                className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${direction === 'LR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}
              >H</button>
              <button
                onClick={() => setDirection("TB")}
                className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${direction === 'TB' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}
              >V</button>
            </div>

            <div className="flex bg-[var(--bg-app)] p-1.5 rounded-2xl border border-[var(--border-glass)] shadow-inner">
              <button
                onClick={() => setViewMode("side-by-side")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'side-by-side' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}
              >Side Map</button>
              <button
                onClick={() => setViewMode("single")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'single' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}
              >Unified</button>
            </div>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 text-indigo-500"
            >
              <Download size={14} /> Report
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pt-10 pb-10 space-y-10 relative z-10 custom-scrollbar">

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            <KPICard
              title="Global Fitness"
              value={data?.summary ? `${data.summary.conformance_percentage}%` : "---%"}
              subtitle="Model alignment accuracy"
              icon={Target} color="indigo" delay={0.1}
            />
            <KPICard
              title="Risk Exposure"
              value={data?.summary?.risk_cases}
              subtitle="Critical process violations"
              icon={AlertTriangle} color="rose" delay={0.2}
            />
            <KPICard
              title="Deviations"
              value={data?.summary?.total_deviations}
              subtitle="Transitions missing or extra"
              icon={Zap} color="amber" delay={0.3}
            />
            <KPICard
              title="Audit Sample"
              value={data?.case_analysis?.length}
              subtitle="Individual traces analyzed"
              icon={BarChart3} color="slate" delay={0.4}
            />
            <KPICard
              title="Compliance"
              value={data?.summary ? `${data.summary.weighted_fitness}%` : "---%"}
              subtitle="Priority-weighted index"
              icon={CheckCircle} color="emerald" delay={0.5}
            />
          </div>

          {/* Visualization Section */}
          <section className="group relative">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-[40px] blur-sm border border-[var(--border-glass)]" />
            <div className="relative bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-[40px] overflow-hidden shadow-2xl">
              <div className="px-8 py-5 border-b border-[var(--border-glass)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Process Differential Map</h3>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-bold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Conformant</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> Missing</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Extra Path</div>
                </div>
              </div>

              <div className="h-[550px] flex">
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-app)]/50">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Processing Differential Data...</p>
                  </div>
                ) : data ? (
                  viewMode === "side-by-side" ? (
                    <>
                      <div className="flex-1 border-r border-[var(--border-glass)] relative group/side">
                        <div className="absolute top-6 left-6 z-10 px-3 py-1 bg-[var(--bg-app)] border border-[var(--border-glass)] rounded-lg text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest backdrop-blur-md shadow-sm">Gold Standard (Approved)</div>
                        <ProcessMapGraph
                          nodes={data.approved_map?.nodes}
                          edges={data.approved_map?.edges}
                          height="100%"
                          direction={direction}
                        />
                      </div>
                      <div className="flex-1 relative bg-[var(--bg-app)]/30">
                        <div className="absolute top-6 left-6 z-10 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-500 uppercase tracking-widest backdrop-blur-md shadow-sm">Mined Reality (Active)</div>
                        <ProcessMapGraph
                          nodes={data.mined_map?.nodes}
                          edges={data.mined_map?.edges}
                          conformanceData={data}
                          height="100%"
                          direction={direction}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 text-[var(--text-primary)]">
                      <ProcessMapGraph
                        nodes={data.mined_map?.nodes}
                        edges={data.mined_map?.edges}
                        conformanceData={data}
                        height="100%"
                        direction={direction}
                      />
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                    <Activity size={40} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest italic opacity-40">No Visualization Data Available</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Analysis Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Component Violations */}
            <div className="lg:col-span-1 flex flex-col space-y-4">
              <div className="flex items-center gap-3 px-2">
                <TrendingDown size={18} className="text-rose-500" />
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Structural Deviations</h3>
              </div>

              <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-[32px] p-4 min-h-[400px] max-h-[600px] overflow-hidden flex flex-col shadow-xl">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {data?.deviations?.length > 0 ? data.deviations.map((dev, idx) => (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={idx}
                      onClick={() => setSelectedDeviation(dev)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedDeviation === dev
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-[var(--text-primary)] shadow-lg'
                        : 'bg-[var(--bg-app)] border-[var(--border-glass)] text-[var(--text-secondary)] hover:border-indigo-500/30'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${dev.severity === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>
                          {dev.severity}
                        </span>
                        <span className="text-[10px] font-black text-[var(--text-secondary)]">{dev.frequency || 0} hits</span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed mb-3 text-[var(--text-primary)]">{dev.label}</p>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter text-[var(--text-secondary)]">
                        <Clock size={10} />
                        {dev.impact}
                      </div>
                    </motion.button>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-xs">
                      No structural violations detected.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Traces Intelligence */}
            <div className="lg:col-span-2 flex flex-col space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} className="text-emerald-500" />
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Trace Diagnostics</h3>
                </div>
                <div className="flex gap-1 bg-[var(--bg-app)] p-1 rounded-xl border border-[var(--border-glass)] shadow-sm">
                  <button onClick={() => setActiveTab('deviations')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'deviations' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}>Violations</button>
                  <button onClick={() => setActiveTab('cases')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'cases' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}>Variants</button>
                </div>
              </div>
 
              <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-[32px] overflow-hidden shadow-xl min-h-[450px]">
                <div className="overflow-x-auto h-full custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border-glass)] sticky top-0 z-20">
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{activeTab === 'cases' ? 'Frequency' : 'Trace ID'}</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{activeTab === 'cases' ? 'Prevalence' : 'Health'}</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sequence Matrix</th>
                        <th className="px-6 py-4 text-right pr-8 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{activeTab === 'cases' ? 'Variant ID' : 'Devs'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-glass)]">
                      {activeTab === 'deviations' ? (
                        (data?.case_analysis || [])
                          .filter(c => c.status !== 'conformant')
                          .map((caseData, idx) => (
                          <tr key={idx} className="hover:bg-rose-500/[0.03] transition-colors group">
                            <td className="px-6 py-5 text-xs font-black text-[var(--text-primary)]">#{caseData.case_id}</td>
                            <td className="px-6 py-5">
                              <span className="px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border bg-rose-500/10 text-rose-500 border-rose-500/20">
                                {caseData.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-1.5">
                                {caseData.path?.slice(0, 5).map((p, pIdx) => (
                                  <React.Fragment key={pIdx}>
                                    <div className={`px-2 py-1 text-[8px] font-black rounded border transition-all ${p.is_deviation ? 'bg-rose-500 text-white border-rose-400 shadow-sm' : 'bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border-glass)]'}`}>
                                      {p.activity}
                                    </div>
                                    {pIdx < 4 && pIdx < caseData.path.length - 1 && <ArrowRight size={8} className="text-[var(--text-tertiary)] opacity-30" />}
                                  </React.Fragment>
                                ))}
                                {caseData.path?.length > 5 && <span className="text-[9px] font-black text-[var(--text-tertiary)] ml-1">+{caseData.path.length - 5}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right pr-8 text-xs font-black text-rose-500">{caseData.deviation_count || 0}</td>
                          </tr>
                        ))
                      ) : (
                        (data?.variants || data?.kpis?.variants || []).map((v, idx) => (
                          <tr key={idx} className="hover:bg-indigo-500/[0.03] transition-colors group">
                            <td className="px-6 py-5 text-xs font-black text-[var(--text-primary)]">{v.count} Cases</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden w-16 border border-[var(--border-glass)]">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${v.percentage}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-[var(--text-secondary)]">{v.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-1.5">
                                {v.path?.split(' -> ').slice(0, 5).map((step, sIdx) => (
                                  <React.Fragment key={sIdx}>
                                    <div className="px-2 py-1 text-[8px] font-black rounded border bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border-glass)] whitespace-nowrap">
                                      {step}
                                    </div>
                                    {sIdx < 4 && sIdx < v.path.split(' -> ').length - 1 && <ArrowRight size={8} className="text-[var(--text-tertiary)] opacity-30" />}
                                  </React.Fragment>
                                ))}
                                {v.path?.split(' -> ').length > 5 && <span className="text-[9px] font-black text-[var(--text-tertiary)] ml-1">+{v.path.split(' -> ').length - 5}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right pr-8 text-[10px] font-black text-[var(--text-tertiary)]">V-{idx + 1}</td>
                          </tr>
                        ))
                      )}

                      {((activeTab === 'deviations' && (!data?.case_analysis || data.case_analysis.filter(c => c.status !== 'conformant').length === 0)) ||
                        (activeTab === 'cases' && (!data?.variants && !data?.kpis?.variants))) && (
                        <tr>
                          <td colSpan="4" className="py-20 text-center text-[var(--text-tertiary)] italic text-xs">
                            No {activeTab} data available for the selected analysis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ConformanceDashboard;
