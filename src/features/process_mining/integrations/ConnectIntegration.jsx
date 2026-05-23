import React, { useState } from 'react';
import { ArrowLeft, Link2, Key, Globe, Play } from 'lucide-react';

export default function ConnectIntegration({ integration, onBack, onFetch }) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Call the parent's fetch handler
    onFetch({ api_url: apiUrl, api_key: apiKey });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-xl transition-all border group active:scale-95"
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-glass)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className={`p-3 rounded-2xl shadow-sm ${integration.bg || 'bg-slate-800'} ${integration.color} group-hover:scale-105 transition-transform`}>
          <integration.icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Connect <span className="text-indigo-500">{integration.name}</span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-glass)' }}>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Connect your {integration.name} to automatically ingest event logs. 
                All data will be normalized to the standard process mining format.
            </p>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] opacity-50" style={{ color: 'var(--text-secondary)' }}>
            API Endpoint URL
          </label>
          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${apiUrl ? 'text-indigo-500' : 'text-slate-500'}`}>
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.yourservice.com/v1/logs"
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:opacity-30"
              style={{ 
                backgroundColor: 'var(--bg-app)', 
                borderColor: 'var(--border-glass)',
                color: 'var(--text-primary)'
              }}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] opacity-50" style={{ color: 'var(--text-secondary)' }}>
            API Key / Authentication Token
          </label>
          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${apiKey ? 'text-indigo-500' : 'text-slate-500'}`}>
              <Key className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your secret key"
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:opacity-30"
              style={{ 
                backgroundColor: 'var(--bg-app)', 
                borderColor: 'var(--border-glass)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <div className="pt-4 space-y-4">
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-[0.1em] transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Fetching Logs...
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4 fill-white" />
                        Fetch & Normalize Logs
                    </>
                )}
            </button>
            <p className="text-[10px] text-center uppercase tracking-widest font-black opacity-30" style={{ color: 'var(--text-secondary)' }}>
                Your credentials are never stored permanently
            </p>
        </div>
      </form>
    </div>
  );
}
