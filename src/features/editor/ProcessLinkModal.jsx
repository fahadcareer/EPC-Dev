import React, { useState, useEffect, useMemo } from "react";
import {
    X, Search, Folder, FolderOpen, FileText, ChevronRight, ChevronDown,
    Layers, Target, Check
} from "lucide-react";
import api from "../../services/api_service";
import NETWORK_URLS from "../../config/network_string";

export default function ProcessLinkModal({ onClose, onSelect, t }) {
    const [tree, setTree] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expanded, setExpanded] = useState({});
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [treeRes, deptRes] = await Promise.all([
                api.get(NETWORK_URLS.GetProcessTree),
                api.get(NETWORK_URLS.GetDepartments)
            ]);
            setTree(treeRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error("Failed to fetch process tree or departments:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic similar to dashboard
    const filteredTree = useMemo(() => {
        if (!searchTerm.trim()) return tree;

        const lowerQuery = searchTerm.toLowerCase();
        const filterNode = (node) => {
            const nameMatch = node.name.toLowerCase().includes(lowerQuery);
            // If folder, check children
            if (node.type === "folder" && node.children) {
                const filteredChildren = node.children
                    .map(filterNode)
                    .filter(Boolean);

                if (nameMatch || filteredChildren.length > 0) {
                    return { ...node, children: filteredChildren };
                }
            } else if (nameMatch) {
                // Return file if it matches
                return node;
            }
            return null;
        };

        return tree.map(filterNode).filter(Boolean);
    }, [tree, searchTerm]);

    // Auto-expand when searching
    useEffect(() => {
        if (searchTerm.trim()) {
            const expandAll = (nodes) => {
                const newExpanded = {};
                const traverse = (n) => {
                    if (n.type === "folder") {
                        newExpanded[n._id] = true;
                        if (n.children) n.children.forEach(traverse);
                    }
                };
                nodes.forEach(traverse);
                return newExpanded;
            };
            setExpanded(prev => ({ ...prev, ...expandAll(filteredTree) }));
        }
    }, [searchTerm, filteredTree]);

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNodeClick = (node) => {
        if (node.type === 'folder') {
            toggleExpand(node._id);
        } else {
            setSelectedNode(node);
        }
    };

    const handleConfirm = () => {
        if (selectedNode && selectedNode.type === 'file') {
            const deptName = departments.find(d => d._id === selectedNode.department_id)?.name;
            onSelect({ ...selectedNode, department_name: deptName });
        }
    };

    const renderTree = (nodes, level = 0) => {
        return nodes.map((node) => {
            const isFolder = node.type === 'folder';
            const isExpanded = expanded[node._id];
            const isSelected = selectedNode?._id === node._id;
            const hasChildren = node.children && node.children.length > 0;

            // Special folders logic
            const isAsIs = node.name === "As-Is";
            const isToBe = node.name === "To-Be";
            const isSpecialFolder = isAsIs || isToBe;

            return (
                <div key={node._id} className="select-none">
                    <div
                        onClick={() => handleNodeClick(node)}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-transparent
                            ${isSelected
                                ? "bg-theme-accent/20 text-theme-accent border-theme-accent/20"
                                : "text-theme-secondary hover:bg-theme-bg-secondary hover:text-theme-primary"
                            }
                            ${isSpecialFolder ? "py-3 font-semibold text-theme-primary" : ""}
                        `}
                        style={{ paddingLeft: `${level * 16 + 12}px` }}
                        onDoubleClick={() => {
                            if (!isFolder) {
                                onSelect(node);
                            }
                        }}
                    >
                        {/* Folder Arrow or Spacer */}
                        {isFolder ? (
                            <span
                                onClick={(e) => { e.stopPropagation(); toggleExpand(node._id); }}
                                className="opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-white/10"
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                        ) : (
                            <span className="w-4" />
                        )}

                        {/* Icon */}
                        {isFolder ? (
                            isAsIs ? <Layers className="w-4 h-4 text-emerald-400" /> :
                                isToBe ? <Target className="w-4 h-4 text-blue-400" /> :
                                    isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500/80" /> :
                                        <Folder className="w-4 h-4 text-amber-500/50" />
                        ) : (
                            <FileText className={`w-4 h-4 ${isSelected ? "text-theme-accent" : "text-theme-secondary"}`} />
                        )}

                        <span className={`truncate text-sm ${isSelected ? "font-medium" : ""}`}>
                            {node.name}
                        </span>

                        {!isFolder && node.department_id && (
                            <span className="ml-auto text-[9px] bg-theme-bg-tertiary px-1.5 py-0.5 rounded text-theme-tertiary uppercase tracking-tighter shrink-0 border border-theme-border/50">
                                {departments.find(d => d._id === node.department_id)?.name || 'Other'}
                            </span>
                        )}

                        {isSelected && <Check className="w-3 h-3 ml-2 text-theme-accent shrink-0" />}
                    </div>

                    {/* Children */}
                    {isFolder && isExpanded && hasChildren && (
                        <div>
                            {renderTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-theme-surface border border-theme-border w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-bg-secondary/50">
                    <div>
                        <h2 className="text-lg font-semibold text-theme-primary">Select Process to Link</h2>
                        <p className="text-xs text-theme-secondary mt-1">Navigate folders to find the target process</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-theme-bg-secondary rounded-full text-theme-tertiary hover:text-theme-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-3 border-b border-theme-border bg-theme-bg-tertiary/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary" size={16} />
                        <input
                            type="text"
                            placeholder="Search processes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-theme-input border border-theme-border rounded-lg py-2 pl-10 pr-4 text-sm text-theme-primary placeholder-theme-tertiary focus:outline-none focus:border-theme-accent transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Tree View */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-theme-surface">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-theme-secondary gap-3">
                                <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Loading process tree...</span>
                            </div>
                        ) : filteredTree.length > 0 ? (
                            <div className="py-2">
                                {renderTree(filteredTree)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-theme-tertiary">
                                <Search size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">No processes found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-theme-border bg-theme-bg-secondary/50 flex justify-between items-center">
                    <div className="text-xs text-theme-secondary">
                        {selectedNode ? (
                            <span>Selected: <span className="text-theme-accent font-medium">{selectedNode.name}</span></span>
                        ) : (
                            <span>Select a process file to link</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!selectedNode || selectedNode.type !== 'file'}
                            onClick={handleConfirm}
                            className={`
                                px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all
                                ${selectedNode && selectedNode.type === 'file'
                                    ? "bg-theme-accent hover:bg-theme-accent/90 text-white shadow-lg shadow-theme-accent/20"
                                    : "bg-theme-bg-secondary text-theme-tertiary cursor-not-allowed border border-theme-border"
                                }
                            `}
                        >
                            Link Process
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
