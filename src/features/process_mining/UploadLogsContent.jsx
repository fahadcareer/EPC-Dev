/**
 * UploadLogs.jsx
 * --------------
 * Upload event logs as JSON (paste) or CSV file.
 * Calls POST /epc/mining/<processId>/upload via miningService.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, FileText, AlertCircle, CheckCircle2, RotateCcw, File as FileIcon, Zap } from 'lucide-react';
import { uploadLogs, uploadMiningFile } from '../../services/miningService';

// ── CSV parser helper ──────────────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const required = ['case_id', 'activity', 'timestamp'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length) throw new Error(`CSV missing columns: ${missing.join(', ')}`);

    return lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
        return obj;
    });
}

// ── Sample JSON shown in the textarea hint ─────────────────────────────────
const SAMPLE_JSON = `[
  { "case_id": "c1", "activity": "Start",   "timestamp": "2026-01-01T08:00:00Z" },
  { "case_id": "c1", "activity": "Review",  "timestamp": "2026-01-01T09:30:00Z" },
  { "case_id": "c1", "activity": "Approve", "timestamp": "2026-01-01T11:00:00Z" },
  { "case_id": "c2", "activity": "Start",   "timestamp": "2026-01-02T08:00:00Z" },
  { "case_id": "c2", "activity": "Approve", "timestamp": "2026-01-02T12:00:00Z" }
]`;

// ── Component ──────────────────────────────────────────────────────────────
export default function UploadLogs({ onUploaded, processId }) {
    const [jsonText, setJsonText] = useState(SAMPLE_JSON);       // ⭐ demo pre-filled
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null); // { inserted, warnings }
    const [mode, setMode] = useState('json'); // 'json' | 'csv' | 'document'
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const name = file.name.toLowerCase();
        if (name.endsWith('.pdf') || name.endsWith('.docx')) {
            setSelectedFile(file);
            setJsonText(`[Document Selected: ${file.name}]\n\nAI will analyze this document and extract process events automatically when you click "Push Events".`);
            setMode('document');
            toast.info(`${file.name} selected for AI analysis`);
        } else if (name.endsWith('.csv')) {
            try {
                const text = await file.text();
                const events = parseCSV(text);
                setJsonText(JSON.stringify(events, null, 2));
                setMode('json');
                setSelectedFile(null);
                toast.info(`CSV parsed: ${events.length} rows loaded`);
            } catch (err) {
                toast.error(`CSV parse error: ${err.message}`);
            }
        } else if (name.endsWith('.json')) {
            try {
                const text = await file.text();
                JSON.parse(text); // validate
                setJsonText(text);
                setMode('json');
                setSelectedFile(null);
                toast.info('JSON file loaded');
            } catch (err) {
                toast.error(`JSON parse error: ${err.message}`);
            }
        } else {
            toast.error('Unsupported file format. Please use CSV, JSON, PDF, or DOCX.');
        }

        // Reset file input
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const pid = processId?.trim();
        if (!pid) { toast.error('Please enter a Process ID'); return; }

        setLoading(true);
        setLastResult(null);

        try {
            let res;
            if (mode === 'document' && selectedFile) {
                // AI extraction from file
                res = await uploadMiningFile(pid, selectedFile);
            } else {
                // Standard JSON upload
                if (!jsonText.trim()) { toast.error('Please paste event data or upload a file'); setLoading(false); return; }
                let events;
                try {
                    const parsed = JSON.parse(jsonText);
                    events = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    toast.error('Invalid JSON — please check your input');
                    setLoading(false);
                    return;
                }
                res = await uploadLogs(pid, events);
            }

            const { data } = res;
            setLastResult({ 
                inserted: data.inserted, 
                warnings: data.warnings,
                message: data.message 
            });
            toast.success(data.message || `${data.inserted} events uploaded!`);
            if (onUploaded) onUploaded(pid);
        } catch (err) {
            const msg = err?.response?.data?.error || err.message || 'Upload failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setJsonText(SAMPLE_JSON);
        setLastResult(null);
        setSelectedFile(null);
        setMode('json');
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-[0.05em] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                        Source File (CSV / JSON / PDF / DOCX)
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all text-[10px] font-bold uppercase tracking-wider group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5"
                             style={{ 
                                 backgroundColor: 'var(--bg-app)', 
                                 borderColor: 'var(--border-glass)',
                                 color: 'var(--text-secondary)' 
                             }}>
                            {mode === 'document' ? (
                                <FileIcon className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <FileText className="w-4 h-4 text-indigo-500" />
                            )}
                            <span>{selectedFile ? selectedFile.name : "Select Document Source"}</span>
                        </div>
                        <input type="file" accept=".json,.csv,.pdf,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>

                {/* JSON Textarea */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-[0.05em] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                        Data Payload (JSON) <span className="text-rose-500 opacity-100">*</span>
                    </label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            rows={6}
                            readOnly={mode === 'document'}
                            placeholder={SAMPLE_JSON}
                            spellCheck={false}
                            className={`w-full relative z-10 rounded-xl px-4 py-3 text-[11px] font-mono transition-all resize-y border focus:outline-none focus:shadow-[0_0_25px_rgba(99,102,241,0.1)] custom-scrollbar ${mode === 'document' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                            style={{ 
                                backgroundColor: 'var(--bg-app)', 
                                borderColor: 'var(--border-glass)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                            {mode === 'document' ? "AI Analysis Active" : "Required Schema:"}
                        </p>
                        {mode === 'document' ? (
                             <p className="text-[9px] font-bold text-amber-500 uppercase">Document mode: Manual edits disabled until reset</p>
                        ) : (
                            <div className="flex gap-2">
                                <code className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">case_id</code>
                                <code className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">activity</code>
                                <code className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">timestamp</code>
                            </div>
                        )}
                    </div>
                </div>

                {/* Success banner */}
                {lastResult && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs animate-in zoom-in-95 duration-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-emerald-500 font-black uppercase tracking-widest">{lastResult.inserted} event(s) synced</p>
                            {lastResult.warnings && (
                                <p className="text-amber-500 text-[10px] mt-1 font-bold">⚠ {lastResult.warnings}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-5 border-t" style={{ borderColor: 'var(--border-glass)' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-[0.05em] transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {mode === 'document' ? 'AI Extracting...' : 'Synchronizing...'}
                            </>
                        ) : (
                            <>
                                {mode === 'document' ? <Zap className="w-4 h-4 text-amber-300" /> : <Upload className="w-4 h-4" />}
                                {mode === 'document' ? 'Extract Events with AI' : 'Push Events'}
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold uppercase tracking-[0.05em] text-[10px] transition-all hover:bg-white/5 active:scale-95"
                        style={{ borderColor: 'var(--border-glass)', color: 'var(--text-secondary)' }}
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
            </form>
        </div>
    );
}
