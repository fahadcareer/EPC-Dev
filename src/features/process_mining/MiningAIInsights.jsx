import React from 'react';
import { 
    AlertTriangle, Clock, RefreshCw, Lightbulb, 
    Sparkles, BarChart3, Loader2
} from 'lucide-react';

const InsightCard = ({ icon: Icon, title, text, colorClass }) => {
    // Robustly handle cases where AI returns an object instead of a string
    const renderText = () => {
        if (!text) return "No specific data point identified yet.";
        if (typeof text === 'string') return text;
        if (typeof text === 'object') {
            // Try to find a human-readable field
            return text.analysis || text.insight || text.summary || text.text || text.suggestion || JSON.stringify(text);
        }
        return String(text);
    };

    return (
        <div className="p-3 border rounded-xl shadow-sm hover:shadow-md transition-all group"
             style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-glass)' }}>
            <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${colorClass}`}>
                    <Icon size={14} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-wider leading-none" style={{ color: 'var(--text-primary)' }}>{title}</h4>
            </div>
            <p className="text-[11px] leading-relaxed italic pl-0.5" style={{ color: 'var(--text-primary)' }}>
                {renderText()}
            </p>
        </div>
    );
};

export default function MiningAIInsights({ insights, onGenerate, generating }) {
    
    // Simple parser for the backend markdown response
    const parseInsights = (text) => {
        if (!text) return null;

        const categories = {
            bottleneck: null,
            delay: null,
            rework: null,
            suggestions: null
        };

        // 1. Try to find and parse a JSON code block
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/^[\s\S]*(\{[\s\S]*\})[\s\S]*$/);
        if (jsonMatch) {
            try {
                const parsedJson = JSON.parse(jsonMatch[1].trim());
                // Normalize keys to lowercase for mapping
                Object.keys(parsedJson).forEach(key => {
                    const lowKey = key.toLowerCase();
                    if (categories.hasOwnProperty(lowKey)) {
                        categories[lowKey] = parsedJson[key];
                    }
                });
                
                // If we got at least one valid key, return the JSON results
                if (Object.values(categories).some(v => v !== null)) return categories;
            } catch (e) {
                console.warn("AI Insight JSON parse failed, falling back to keyword search", e);
            }
        }

        // 2. Fallback to keyword-driven line parsing (the old method)
        const lines = text.split('\n');
        let currentCat = null;

        lines.forEach(line => {
            const upLine = line.trim().toUpperCase();
            let foundHeader = false;
            
            if (upLine.includes('BOTTLENECK')) { currentCat = 'bottleneck'; foundHeader = true; }
            else if (upLine.includes('DELAY')) { currentCat = 'delay'; foundHeader = true; }
            else if (upLine.includes('REWORK')) { currentCat = 'rework'; foundHeader = true; }
            else if (upLine.includes('SUGGESTION')) { currentCat = 'suggestions'; foundHeader = true; }
            
            if (foundHeader) {
                const content = line.replace(/.*(BOTTLENECK|DELAY|REWORK|SUGGESTION[S]?)[*\s:]*[-—]*/i, '').trim();
                categories[currentCat] = content || "";
            } else if (currentCat && line.trim()) {
                const cleanLine = line.replace(/^\s*[-*#]\s*/, '').trim();
                if (cleanLine) {
                    categories[currentCat] = (categories[currentCat] || "") + (categories[currentCat] ? " " : "") + cleanLine;
                }
            }
        });

        // Final cleanup for fallback results
        Object.keys(categories).forEach(key => {
            if (categories[key] === "") categories[key] = null;
        });

        return (categories.bottleneck || categories.delay || categories.rework || categories.suggestions) ? categories : null;
    };

    const parsed = parseInsights(insights);

    return (
        <div className="flex flex-col h-full border rounded-2xl shadow-sm p-4 overflow-hidden"
             style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-glass)' }}>
            <button 
                onClick={onGenerate}
                disabled={generating}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg mb-6 ${
                    generating 
                        ? 'bg-indigo-600/50 text-white/70 cursor-wait shadow-none' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
            >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generating ? "Analyzing Data..." : "Generate Insights"}
            </button>

            <div className="flex items-center gap-2 mb-4 px-1">
                <BarChart3 size={16} className="text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest pr-1" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {parsed ? (
                    <>
                        <InsightCard 
                            icon={AlertTriangle} 
                            title="Bottleneck" 
                            text={parsed.bottleneck} 
                            colorClass="bg-red-500/10 text-red-500"
                        />
                        <InsightCard 
                            icon={Clock} 
                            title="Delay" 
                            text={parsed.delay} 
                            colorClass="bg-blue-500/10 text-blue-500"
                        />
                        <InsightCard 
                            icon={RefreshCw} 
                            title="Rework" 
                            text={parsed.rework} 
                            colorClass="bg-indigo-500/10 text-indigo-500"
                        />
                        <InsightCard 
                            icon={Lightbulb} 
                            title="Suggestions" 
                            text={parsed.suggestions} 
                            colorClass="bg-yellow-500/10 text-yellow-500"
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 opacity-40 text-center px-4">
                        <Sparkles size={32} className="mb-3 text-indigo-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            No insights generated yet. Click above to begin AI analysis.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
