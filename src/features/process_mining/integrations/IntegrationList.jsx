import { Database, Globe, Share2, Layers, Cloud, ShieldCheck } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'crm', name: 'CRM Integration', desc: 'Sync data from Salesforce, HubSpot, or Dynamics.', icon: Database, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'erp', name: 'ERP Integration', desc: 'Connect with SAP, Oracle, or Odoo workflows.', icon: Layers, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'bayanati', name: 'Bayanati / HRMIS', desc: 'Securely sync HR process logs from UAE Gov systems.', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'api', name: 'Custom API / JSON', desc: 'Fetch event logs from any REST API endpoint.', icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'webhook', name: 'Cloud Storage', desc: 'Import CSV/JSON from Google Drive or Azure Blob.', icon: Cloud, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

export default function IntegrationList({ onSelect, compact = false }) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      {INTEGRATIONS.map((app) => (
        <button
          key={app.id}
          onClick={() => onSelect(app)}
          className={`flex ${compact ? 'flex-col items-center text-center' : 'flex-row items-start text-left'} gap-3 ${compact ? 'p-3' : 'p-5'} rounded-2xl border transition-all group relative overflow-hidden`}
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-glass)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className={`p-2.5 rounded-xl ${app.bg} ${app.color} group-hover:scale-110 transition-transform shrink-0 relative z-10`}>
            <app.icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </div>
          
          <div className="relative z-10 flex flex-col gap-1 min-w-0 w-full">
            <h3 className={`font-black tracking-tight group-hover:text-indigo-500 transition-colors truncate w-full ${compact ? 'text-[10px]' : 'text-sm'}`}
                style={{ color: 'var(--text-primary)' }}>
              {app.name}
            </h3>
            <p className={`leading-tight ${compact ? 'text-[9px] line-clamp-3' : 'text-xs'}`}
               style={{ color: 'var(--text-secondary)' }}>
              {app.desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
