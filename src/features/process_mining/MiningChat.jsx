import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMiningChat } from '../../services/miningService';

export default function MiningChat({ processId }) {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your AI Process Analyst. I've reviewed your process map and performance metrics. Ask me anything about bottlenecks, cycle times, or optimization strategies."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // We pass ALL messages to the backend to maintain short-term context.
            // Exclude the placeholder welcome message if we want to save tokens, 
            // but it's fine to pass it. Wait, the API expects array of { role, content }.
            const payload = messages.concat(userMsg).map(m => ({
                role: m.role,
                content: m.content
            }));
            
            const { data } = await sendMiningChat(processId, payload);
            
            setMessages(prev => [
                ...prev, 
                { id: `ai-${Date.now()}`, role: 'assistant', content: data.reply || "No response received." }
            ]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [
                ...prev, 
                { 
                    id: `err-${Date.now()}`, 
                    role: 'assistant', 
                    content: "Sorry, I had trouble analyzing the data. Please try again or check your connection."
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative font-sans animate-fade-in">
            {/* Header omitted since the Segmented Control acts as the title */}

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5 mb-4 pb-2">
                {messages.map((msg) => {
                    const isAi = msg.role === 'assistant';
                    return (
                        <div key={msg.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                            {/* Top Minimal Indicator */}
                            <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                {isAi ? (
                                    <>
                                        <Bot size={10} className="text-indigo-500" strokeWidth={2.5} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500/80">AI Analyst</span>
                                    </>
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">You</span>
                                )}
                            </div>

                            {/* Wider Message Bubble */}
                            <div className={`max-w-[96%] rounded-2xl px-4 py-3 shadow-sm transition-all ${
                                isAi 
                                    ? 'bg-black/5 dark:bg-white/5 rounded-tl-sm text-theme-primary' 
                                    : 'rounded-tr-sm bg-indigo-600 text-white'
                            }`}>
                                <div className={`text-xs leading-relaxed ${isAi ? 'market-markdown react-md' : 'font-medium font-sans'}`}>
                                    {isAi ? (
                                        <ReactMarkdown
                                            components={{
                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                                li: ({node, ...props}) => <li className="" {...props} />,
                                                strong: ({node, ...props}) => <strong className="font-bold font-sans text-indigo-600 dark:text-indigo-300" {...props} />,
                                                code: ({node, inline, className, children, ...props}) => 
                                                    inline 
                                                    ? <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono" {...props}>{children}</code>
                                                    : <code className="block bg-black/10 dark:bg-slate-900 border border-black/5 dark:border-white/10 p-2 rounded max-w-full overflow-x-auto text-[10px] font-mono my-2" {...props}>{children}</code>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex flex-col items-start animate-fade-in">
                        <div className="flex items-center gap-1.5 mb-1.5 px-1">
                            <Bot size={10} className="text-indigo-500 animate-pulse" strokeWidth={2.5} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500/80">AI Analyst</span>
                        </div>
                        <div className="bg-black/5 dark:bg-white/5 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm">
                            <div className="flex items-center gap-1.5 opacity-60">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 pt-3 relative z-10">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about bottlenecks..."
                        disabled={isLoading}
                        className="w-full bg-black/5 dark:bg-black/20 outline-none hover:bg-black/10 dark:hover:bg-black/40 focus:bg-black/10 dark:focus:bg-black/40 text-xs rounded-2xl pl-4 pr-12 py-3 transition-all font-medium placeholder-opacity-50 ring-1 ring-black/5 dark:ring-white/5 focus:ring-indigo-500/50"
                        style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-1.5 p-2 rounded-xl transition-all ${
                            isLoading || !input.trim() 
                                ? 'opacity-0 scale-90 pointer-events-none' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm opacity-100 scale-100'
                        }`}
                    >
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} className="ml-[1px]" />}
                    </button>
                </form>
            </div>
            
        </div>
    );
}
