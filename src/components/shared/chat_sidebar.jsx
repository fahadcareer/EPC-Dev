import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, User, Mic, MicOff, Paperclip, ClipboardList, Shield, Layers, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/logic/user';

export default function ChatSidebar({ messages, onSendMessage, onClear, onUploadFile, loading, externalInput, setExternalInput, nodes = [] }) {
    const { user } = useAuthStore();
    const [input, setInput] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [aiStateIndex, setAiStateIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const aiStates = ["Thinking...", "Analyzing layout...", "Building nodes...", "Generating process...", "Finalizing..."];

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, aiStateIndex]);

    useEffect(() => {
        let interval;
        if (loading) {
            setAiStateIndex(0);
            interval = setInterval(() => {
                setAiStateIndex(prev => (prev + 1) % aiStates.length);
            }, 2500);
        } else {
            setAiStateIndex(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        if (externalInput) {
            setInput(externalInput);
            if (setExternalInput) setExternalInput("");
        }
    }, [externalInput, setExternalInput]);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // Handle @ mention detection
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInput(value);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            if (!textAfterAt.includes(' ')) {
                setMentionFilter(textAfterAt.toLowerCase());
                setShowMentions(true);
                setSelectedMentionIndex(0);
                if (textareaRef.current) {
                    const rect = textareaRef.current.getBoundingClientRect();
                    setMentionPosition({
                        top: rect.top - 200,
                        left: rect.left
                    });
                }
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const filteredNodes = nodes.filter(node =>
        node.data?.label?.toLowerCase().includes(mentionFilter)
    );

    const selectMention = (nodeLabel) => {
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = input.substring(0, cursorPosition);
        const textAfterCursor = input.substring(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const newText =
                textBeforeCursor.substring(0, lastAtIndex) +
                `@${nodeLabel} ` +
                textAfterCursor;
            setInput(newText);
            setShowMentions(false);
            setMentionFilter("");

            setTimeout(() => {
                textareaRef.current?.focus();
            }, 0);
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev + (prev ? " " : "") + transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            e.target.value = null;
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((input.trim() || selectedFile) && !loading) {
            onSendMessage(input, selectedFile);
            setInput("");
            setSelectedFile(null);
            setShowMentions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (showMentions && filteredNodes.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex(prev => prev < filteredNodes.length - 1 ? prev + 1 : prev);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectMention(filteredNodes[selectedMentionIndex].data.label);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
            {/* Minimal Command Header */}
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-20 pointer-events-none">
                <div className="bg-theme-surface/60 backdrop-blur-xl px-4 py-2 rounded-full shadow-md pointer-events-auto">
                    <span className="text-[10px] font-bold text-theme-primary tracking-[0.15em] uppercase">
                        Command Center
                    </span>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={onClear}
                        className="pointer-events-auto bg-theme-surface/60 backdrop-blur-xl px-4 py-2 rounded-full shadow-md text-[10px] uppercase font-bold tracking-widest text-theme-tertiary hover:text-theme-primary hover:bg-theme-surface transition-all"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            {/* We add pb-32 to give space for the floating input pill */}
            <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32 space-y-6 scroll-smooth chat-scroll">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col h-full justify-center pb-10"
                        >
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-center mb-10"
                            >
                                <h3 className="text-theme-primary font-bold mb-3 text-3xl tracking-tight">What shall we build?</h3>
                                <p className="text-theme-tertiary text-sm leading-relaxed max-w-sm mx-auto">
                                    Instantly construct workflows, audit architectures, or visualize new processes.
                                </p>
                            </motion.div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Create EPC", desc: "HR recruitment flow", prompt: "Create an EPC diagram for HR recruitment", icon: <Layers className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { label: "Update Process", desc: "Add approval steps", prompt: "Update the diagram to include an approval step before finalization", icon: <ClipboardList className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/10" },
                                    { label: "Generate BPMN", desc: "User onboarding", prompt: "Design a BPMN model for user onboarding", icon: <Shield className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { label: "Analyze", desc: "Find bottlenecks", prompt: "Analyze this process and explain potential bottlenecks", icon: <FileText className="w-5 h-5" />, color: "text-amber-500", bg: "bg-amber-500/10" },
                                ].map((item, idx) => (
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 + 0.2, type: "spring", stiffness: 300, damping: 20 }}
                                        key={item.label}
                                        onClick={() => onSendMessage(item.prompt)}
                                        className="group relative flex flex-col items-center justify-center p-5 rounded-[24px] bg-theme-surface/60 hover:bg-theme-surface shadow-lg hover:shadow-xl transition-all duration-300 border-none"
                                    >
                                        <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                            <div className={`${item.color}`}>
                                                {item.icon}
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-semibold text-theme-primary mb-1">{item.label}</span>
                                        <span className="text-[11px] text-theme-tertiary text-center">{item.desc}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((msg, i) => (
                        <motion.div
                            key={`msg-${i}`}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'user' ? (
                                <div className="max-w-[85%] px-5 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-md">
                                    <p className="text-[14px] leading-relaxed">{msg.content}</p>
                                </div>
                            ) : (
                                <div className="max-w-[95%] px-5 py-4 rounded-2xl rounded-tl-sm bg-theme-surface/80 shadow-md">
                                    <div className="text-[14px] text-theme-primary leading-relaxed space-y-2">
                                        {msg.content}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center max-w-[90%]"
                        >
                            <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-theme-surface/80 flex items-center gap-3 shadow-md">
                                <div className="flex gap-1.5">
                                    <motion.div className="w-1.5 h-1.5 rounded-full bg-theme-tertiary" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                    <motion.div className="w-1.5 h-1.5 rounded-full bg-theme-tertiary" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                                    <motion.div className="w-1.5 h-1.5 rounded-full bg-theme-tertiary" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.span 
                                        key={aiStateIndex}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="text-[11px] font-medium tracking-wide text-theme-tertiary uppercase ml-2"
                                    >
                                        {aiStates[aiStateIndex]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Floating Command Bar */}
            <div className="absolute bottom-6 left-6 right-6 z-30">
                {/* Mention Dropdown */}
                <AnimatePresence>
                    {showMentions && filteredNodes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 left-0 right-0 bg-theme-surface/95 backdrop-blur-xl border border-theme-border/50 rounded-2xl shadow-xl overflow-y-auto"
                            style={{ maxHeight: '200px' }}
                        >
                            <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-theme-tertiary border-b border-theme-border/30">
                                Target Node
                            </div>
                            {filteredNodes.map((node, index) => (
                                <button
                                    key={node.id}
                                    onClick={() => selectMention(node.data.label)}
                                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-theme-secondary/10 transition-colors flex items-center gap-3 ${index === selectedMentionIndex ? 'bg-theme-secondary/10' : ''}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    <span className="text-theme-primary font-medium">{node.data.label}</span>
                                    <span className="text-theme-tertiary text-[10px] ml-auto font-light">{node.type}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.form 
                    onSubmit={handleSubmit} 
                    className="relative"
                    animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                    <div className={`relative bg-theme-surface/90 backdrop-blur-2xl rounded-[28px] flex flex-col overflow-hidden transition-all duration-300 ${isFocused ? 'shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-theme-surface' : 'shadow-xl'}`}>
                        
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-5 py-3 border-b border-theme-border/30 flex items-center justify-between bg-indigo-500/5"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                                        </div>
                                        <span className="text-[12px] font-medium text-theme-primary truncate max-w-[150px]">{selectedFile.name}</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={clearFile}
                                        className="p-1.5 bg-red-500/10 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col p-2">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Message..."
                                rows={1}
                                className="w-full px-4 pt-3 pb-2 bg-transparent border-none focus:ring-0 text-[15px] text-theme-primary placeholder:text-theme-tertiary resize-none chat-scroll min-h-[56px] max-h-[160px] leading-relaxed"
                                disabled={loading}
                            />
                            
                            <div className="flex items-center justify-between px-2 pb-1 pt-1">
                                <div className="flex items-center gap-1">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={isListening ? stopListening : startListening}
                                        className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/10 text-red-400' : 'text-theme-tertiary hover:bg-theme-secondary/10 hover:text-theme-primary'}`}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                                    </motion.button>
                                    
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.bmp"
                                        disabled={loading}
                                    />
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={loading}
                                        className="p-2 text-theme-tertiary hover:bg-theme-secondary/10 hover:text-theme-primary rounded-full transition-colors"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </motion.button>
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={loading || (!input.trim() && !selectedFile)}
                                    className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${(input.trim() || selectedFile) && !loading ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-theme-secondary/10 text-theme-tertiary'}`}
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
