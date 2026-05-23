import { useState, useEffect } from "react";
import { Save, X, Plus, Trash2, Edit2, Check, Clock, AlertTriangle, UserCheck, Shield, FileText, Info, ChevronDown, ChevronUp, Layers, ExternalLink, Activity, FlaskConical, Settings } from "lucide-react";
import NETWORK_URLS from "../../config/network_string";
import VersionChangelogModal from "../../components/VersionChangelogModal";
import useAuthStore from "../../store/logic/user";

export default function EditableOverview({ process, onUpdate, tree = [], departments = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({});

    // Formatting Dates
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        // Parse the date and ensure it's displayed in the user's local timezone
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    useEffect(() => {
        if (process && process._id) {
            setFormData({
                name: process.name || "",
                description: process.description || "",
                process_owner: process.process_owner || "",
                process_scope: process.process_scope || "",
                process_objective: process.process_objective || "",
                raci: process.raci || { activities: [] },
                strategic_objectives: process.strategic_objectives || [],
                strategic_kpis: process.strategic_kpis || [],
                operational_kpis: process.operational_kpis || [],
                sla_kpis: process.sla_kpis || [],
                sipoc: process.sipoc || { suppliers: [], inputs: [], process: "", outputs: [], customers: [] },
                risks: process.risks || [],
                related_documents: process.related_documents || [],
                reviewer_ids: process.reviewers || [],
                approver_id: process.approver_id || "",
                process_level: process.process_level || "",
                department_id: process.department_id || "",
                mining_stats: process.mining_stats || null
            });
        }
    }, [process?._id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const api = (await import("../../services/api_service")).default;
            await api.put(`${NETWORK_URLS.GetProcesses}${process._id}`, formData);
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save changes");
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        // Reset form data logic here (same as before or simplified)
        setIsEditing(false);
    };

    const addListItem = (field, defaultValue) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), defaultValue]
        }));
    };

    const removeListItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const updateListItem = (field, index, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [workflowActionLoading, setWorkflowActionLoading] = useState(false);

    useEffect(() => {
        async function loadUsers() {
            try {
                const api = (await import("../../services/api_service")).default;
                const res = await api.get(NETWORK_URLS.WorkflowUsers);
                if (Array.isArray(res.data)) setUsers(res.data);

                const token = localStorage.getItem('token');
                if (token) setCurrentUser(JSON.parse(atob(token.split('.')[1])));
            } catch (err) { console.error(err); }
        }
        loadUsers();
    }, []);

    const [notification, setNotification] = useState(null);
    const [rejectionModal, setRejectionModal] = useState({ show: false, action: null });
    const [rejectionReason, setRejectionReason] = useState("");
    const [showChangelogModal, setShowChangelogModal] = useState(false);

    const { user: authUser } = useAuthStore();
    const isGovernanceEnabled = authUser?.enabled_features?.includes('governance');

    // Updated canEdit logic for granular permissions
    // Owner/Admin: Always Allow
    // Shared: Check access == 'edit'
    const canEdit = (() => {
        if (!currentUser) return false;
        if (currentUser.role === 'viewer') return false;
        
        // If governance is enabled, we lock approved processes
        if (isGovernanceEnabled && process.status === "Approved") return false;

        // Owner/Admin
        if (process.created_by === (currentUser.user_id || currentUser.id) ||
            currentUser.role === 'admin' ||
            currentUser.role === 'superadmin') {
            return true;
        }

        // Shared Permissions
        if (process.shared_with) {
            const userId = currentUser.user_id || currentUser.id;
            const share = process.shared_with.find(s => {
                if (typeof s === 'string') return s === userId;
                return s.user_id === userId;
            });

            if (share) {
                if (typeof share === 'string') return false; // Legacy/Default is View-Only if strictly enforcing
                return share.access === 'edit';
            }
        }

        return false;
    })();

    const handleWorkflowAction = async (action, extraData = {}) => {
        setWorkflowActionLoading(true);
        try {
            const api = (await import("../../services/api_service")).default;
            let url = "", body = { process_id: process._id, ...extraData };

            if (action === "submit") {
                url = NETWORK_URLS.WorkflowSubmit;
                body.reviewer_ids = formData.reviewer_ids;
                body.approver_id = formData.approver_id;
            } else if (action.includes("_review")) {
                url = NETWORK_URLS.WorkflowReview;
                body.action = action.includes("approve") ? "approve" : "reject";
            } else if (action.includes("_final")) {
                url = NETWORK_URLS.WorkflowApprove;
                body.action = action.includes("approve") ? "approve" : "reject";
            }

            await api.post(url, body);
            if (onUpdate) onUpdate();
            setNotification({ type: 'success', message: "Action successful!" });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error("Workflow action error:", err);
            console.error("Error response:", err.response?.data);
            const errorMessage = err.response?.data?.error || "Action failed.";
            setNotification({ type: 'error', message: errorMessage });
        } finally {
            setWorkflowActionLoading(false);
            setRejectionModal({ show: false, action: null });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Approved": return "bg-green-500/20 text-green-500 border-green-500/20";
            case "In Approval": return "bg-orange-500/20 text-orange-500 border-orange-500/20";
            case "In Review": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
            case "Rejected": return "bg-red-500/20 text-red-500 border-red-500/20";
            default: return "bg-theme-bg-tertiary text-theme-tertiary border-theme-border";
        }
    }

    const currentUserId = currentUser?.user_id || currentUser?.id;
    const isReviewerTurn = isGovernanceEnabled && process.status === 'In Review' && (process.reviewers || [])[process.current_reviewer_index] === currentUserId;
    const isApproverTurn = isGovernanceEnabled && process.status === 'In Approval' && process.approver_id === currentUserId;
    const showActionCard = isReviewerTurn || isApproverTurn;

    const filteredUsersForProcess = users.filter(u => {
        if (['admin', 'superadmin', 'system_admin'].includes(u.role)) return true;
        if (formData.department_id && !u.allowed_departments?.includes(formData.department_id)) return false;
        if (formData.process_level && !u.allowed_levels?.includes(Number(formData.process_level))) return false;
        return true;
    });

    const [isReviewerDropdownOpen, setIsReviewerDropdownOpen] = useState(false);
    const [reviewerSearchQuery, setReviewerSearchQuery] = useState("");
    const [isApproverDropdownOpen, setIsApproverDropdownOpen] = useState(false);
    const [approverSearchQuery, setApproverSearchQuery] = useState("");

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">

            {/* SUBMIT WORKFLOW CARD */}
            {isGovernanceEnabled && (process.status === 'Draft' || process.status === 'Rejected') && canEdit && (
                <div className="app-card p-6 rounded-2xl border-l-4 border-indigo-500 animate-slide-down relative z-20">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-xl font-bold text-theme-primary mb-2">Submit for Approval</h2>
                            <p className="text-theme-secondary text-sm">Define the approval chain. The process will be reviewed sequentially by the selected reviewers, then finally approved by the approver.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Reviewer Chain Builder */}
                            <div className="space-y-3">
                                <label className="text-xs text-theme-tertiary uppercase font-semibold block">Reviewer Chain (Ordered)</label>
                                <div className="space-y-2">
                                    {(formData.reviewer_ids || []).map((rId, idx) => {
                                        const user = users.find(u => u.value === rId);
                                        return (
                                            <div key={idx} className="flex items-center gap-3 bg-theme-input p-2 rounded-lg border border-theme-border animate-fade-in-right">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">{idx + 1}</div>
                                                <span className="text-theme-primary text-sm flex-1">{user?.label || "Unknown User"}</span>
                                                <button onClick={() => {
                                                    const newReviewers = [...formData.reviewer_ids];
                                                    newReviewers.splice(idx, 1);
                                                    setFormData({ ...formData, reviewer_ids: newReviewers });
                                                }} className="text-theme-tertiary hover:text-red-400 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div
                                                onClick={() => setIsReviewerDropdownOpen(!isReviewerDropdownOpen)}
                                                className={`w-full bg-theme-input border ${isReviewerDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-theme-border hover:border-indigo-500/50'} rounded-lg px-4 py-2.5 text-theme-primary text-sm transition-all cursor-pointer flex justify-between items-center z-10`}
                                                id="custom-reviewer-select"
                                                data-value=""
                                            >
                                                <span className="text-theme-tertiary" id="custom-reviewer-select-text">Select User to Add...</span>
                                                {isReviewerDropdownOpen ? <ChevronUp size={16} className="text-indigo-400" /> : <ChevronDown size={16} className="text-theme-tertiary" />}
                                            </div>

                                            {isReviewerDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-theme-surface border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-down flex flex-col max-h-[250px]">
                                                    <div className="sticky top-0 bg-theme-surface z-10 p-2 border-b border-theme-border">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50"
                                                            placeholder="Search users..."
                                                            value={reviewerSearchQuery}
                                                            onChange={(e) => setReviewerSearchQuery(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="p-1 overflow-y-auto custom-scrollbar">
                                                        {filteredUsersForProcess.filter(u => !formData.reviewer_ids?.includes(u.value) && u.value !== formData.approver_id && (!reviewerSearchQuery || u.label?.toLowerCase().includes(reviewerSearchQuery.toLowerCase()))).length === 0 ? (
                                                            <div className="px-4 py-3 text-sm text-theme-tertiary text-center">No available users found</div>
                                                        ) : (
                                                            filteredUsersForProcess.filter(u => !formData.reviewer_ids?.includes(u.value) && u.value !== formData.approver_id && (!reviewerSearchQuery || u.label?.toLowerCase().includes(reviewerSearchQuery.toLowerCase()))).map(u => (
                                                                <div
                                                                    key={u.value}
                                                                    className="px-4 py-2.5 text-sm text-theme-primary hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg cursor-pointer transition-colors flex items-center gap-2 group"
                                                                    onClick={() => {
                                                                        const val = u.value;
                                                                        setFormData(prev => ({ 
                                                                            ...prev, 
                                                                            reviewer_ids: [...(prev.reviewer_ids || []), val] 
                                                                        }));
                                                                        setIsReviewerDropdownOpen(false);
                                                                        // Reset the select display
                                                                        const selectText = document.getElementById('custom-reviewer-select-text');
                                                                        if (selectText) {
                                                                            selectText.innerText = "Select User to Add...";
                                                                            selectText.classList.add('text-theme-tertiary');
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="w-6 h-6 rounded-full bg-theme-input flex items-center justify-center text-[10px] font-bold text-theme-secondary group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                                                        {u.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {u.label}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Approver Selection */}
                            <div className="space-y-3">
                                <label className="text-xs text-theme-tertiary uppercase font-semibold block">Final Approver</label>
                                <div className="bg-theme-input/50 p-4 rounded-xl border border-theme-border text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-3">
                                        <Shield size={24} />
                                    </div>
                                    <div className="relative w-full mb-2">
                                        <div
                                            onClick={() => setIsApproverDropdownOpen(!isApproverDropdownOpen)}
                                            className={`w-full bg-theme-input border ${isApproverDropdownOpen ? 'border-green-500 ring-2 ring-green-500/20' : 'border-theme-border hover:border-green-500/50'} rounded-lg px-4 py-3 text-theme-primary text-sm transition-all cursor-pointer flex justify-between items-center z-10 font-medium`}
                                        >
                                            <span className={formData.approver_id ? 'text-theme-primary' : 'text-theme-tertiary'}>
                                                {formData.approver_id
                                                    ? users.find(u => u.value === formData.approver_id)?.label || "Select Final Approver..."
                                                    : "Select Final Approver..."}
                                            </span>
                                            {isApproverDropdownOpen ? <ChevronUp size={18} className="text-green-400" /> : <ChevronDown size={18} className="text-theme-tertiary" />}
                                        </div>

                                        {isApproverDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-theme-surface border border-theme-border rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-down max-h-[250px] flex flex-col">
                                                <div className="sticky top-0 bg-theme-surface z-10 p-2 border-b border-theme-border">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-green-500/50"
                                                        placeholder="Search final approver..."
                                                        value={approverSearchQuery}
                                                        onChange={(e) => setApproverSearchQuery(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="p-1 overflow-y-auto custom-scrollbar">
                                                    <div
                                                        className="px-4 py-2.5 text-sm text-theme-tertiary hover:bg-theme-input rounded-lg cursor-pointer transition-colors shrink-0"
                                                        onClick={() => {
                                                            setFormData({ ...formData, approver_id: "" });
                                                            setIsApproverDropdownOpen(false);
                                                        }}
                                                    >
                                                        Clear Selection
                                                    </div>
                                                    {filteredUsersForProcess.filter(u => !formData.reviewer_ids?.includes(u.value) && (!approverSearchQuery || u.name?.toLowerCase().includes(approverSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(approverSearchQuery.toLowerCase()))).map(u => (
                                                        <div
                                                            key={u.value}
                                                            className="px-4 py-2.5 text-sm text-theme-primary hover:bg-green-500/10 hover:text-green-400 rounded-lg cursor-pointer transition-colors flex items-center gap-3 group"
                                                            onClick={() => {
                                                                setFormData({ ...formData, approver_id: u.value });
                                                                setIsApproverDropdownOpen(false);
                                                            }}
                                                        >
                                                            <div className="w-7 h-7 rounded-full bg-theme-input flex items-center justify-center text-xs font-bold text-theme-secondary group-hover:bg-green-500/20 group-hover:text-green-400 transition-colors border border-theme-border group-hover:border-green-500/30">
                                                                {u.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <span className="font-semibold">{u.name}</span>
                                                                <span className="text-[10px] text-theme-tertiary group-hover:text-green-500/70">{u.email}</span>
                                                            </div>
                                                            {formData.approver_id === u.value && <Check size={16} className="text-green-500 ml-auto" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-theme-tertiary">The final authority who approves the process for release.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-theme-border">
                            <button
                                onClick={() => handleWorkflowAction('submit')}
                                disabled={workflowActionLoading || !formData.approver_id}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {workflowActionLoading ? "Submitting..." : <>Submit for Approval <Check size={18} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION CARD (For Reviewers/Approvers) */}
            {showActionCard && (
                <div className="app-glass-panel p-6 rounded-2xl border-l-4 border-orange-500 animate-slide-down sticky top-4 z-50 shadow-2xl shadow-orange-900/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                                <AlertTriangle className="text-orange-500" /> Action Required
                            </h2>
                            <p className="text-theme-primary text-sm mt-1">
                                {isReviewerTurn ? "You have been assigned to review this process." : "Final approval is pending your decision."}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectionModal({ show: true, action: isReviewerTurn ? 'reject_review' : 'reject_final' })}
                                className="px-5 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all font-semibold"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleWorkflowAction(isReviewerTurn ? 'approve_review' : 'approve_final')}
                                className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all font-semibold"
                            >
                                {isReviewerTurn ? "Complete Review" : "Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 max-w-md w-full animate-scale-in shadow-2xl">
                        <h3 className="text-lg font-bold text-theme-primary mb-4">Reject Process</h3>
                        <textarea
                            className="w-full bg-theme-input rounded-lg p-3 text-theme-primary text-sm min-h-[100px] mb-4 focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="Please provide a reason for rejection..."
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRejectionModal({ show: false, action: null })} className="text-neutral-400 hover:text-white px-4 py-2">Cancel</button>
                            <button
                                onClick={() => handleWorkflowAction(rejectionModal.action, { rejection_reason: rejectionReason })}
                                disabled={!rejectionReason.trim()}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WORKFLOW STATUS CARD */}
            {isGovernanceEnabled && (
                <div className="app-glass-panel rounded-2xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                                Workflow Status:
                                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(process.status)}`}>
                                    {process.status || "Draft"}
                                </span>
                                {/* Version Badge - Only show for approved diagrams */}
                                {process.status === "Approved" && process.version && (
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-lg text-sm font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                            Version {process.version}
                                        </span>
                                        {process.version !== "1.0" && (
                                            <button
                                                onClick={() => setShowChangelogModal(true)}
                                                className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all hover:scale-110"
                                                title="View version changes"
                                            >
                                                <Info size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </h2>
                            <div className="flex gap-6 text-sm text-theme-tertiary mt-2">
                                <p>Created by <span className="text-theme-primary font-medium">{users.find(u => u.value === process.created_by)?.label || "Unknown"}</span> on {formatDate(process.created_at)}</p>
                                <p>Last modified on {formatDate(process.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PROCESS DETAIL */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-theme-primary tracking-tight">Process Detail</h2>
                        {process.diagram_type === 'mining' && (
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                <FlaskConical size={12} /> Data-Driven Discovery Mode
                            </p>
                        )}
                    </div>
                    {canEdit && (
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">Cancel</button>
                                    <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">{isSaving ? "Saving..." : "Save Changes"}</button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-white/5 transition-colors flex items-center gap-2">
                                    <Edit2 size={16} /> Edit Details
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {process.diagram_type === 'mining' && (
                    <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <div className="app-glass-panel p-5 rounded-2xl border border-indigo-500/20 relative group">
                            <div className="absolute top-3 right-3 text-indigo-500/30 group-hover:text-indigo-500/50 transition-colors"><Activity size={16} /></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-secondary mb-2">Discovery Volume</p>
                            <h4 className="text-xl font-bold text-theme-primary">{process.mining_stats?.total_cases || '---'} <span className="text-[10px] font-medium text-theme-secondary">Cases</span></h4>
                        </div>
                        <div className="app-glass-panel p-5 rounded-2xl border border-emerald-500/20 relative group">
                            <div className="absolute top-3 right-3 text-emerald-500/30 group-hover:text-emerald-500/50 transition-colors"><Clock size={16} /></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-secondary mb-2">Cycle Performance</p>
                            <h4 className="text-xl font-bold text-theme-primary">{process.mining_stats?.avg_duration_minutes || '---'} <span className="text-[10px] font-medium text-theme-secondary">Min Avg</span></h4>
                        </div>
                        <div className="app-glass-panel p-5 rounded-2xl border border-amber-500/20 relative group">
                            <div className="absolute top-3 right-3 text-amber-500/30 group-hover:text-amber-500/50 transition-colors"><Layers size={16} /></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-secondary mb-2">Flow Complexity</p>
                            <h4 className="text-xl font-bold text-theme-primary">{process.mining_stats?.total_variants || '---'} <span className="text-[10px] font-medium text-theme-secondary">Unique Paths</span></h4>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="app-glass-panel p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-theme-primary mb-4 border-b border-theme-border pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField label="Process Name" value={formData.name} isEditing={isEditing} onChange={v => setFormData({ ...formData, name: v })} />
                            <InfoField label="Process Owner" value={formData.process_owner} isEditing={isEditing} onChange={v => setFormData({ ...formData, process_owner: v })} />



                            <InfoField label="Process Scope" value={formData.process_scope} isEditing={isEditing} onChange={v => setFormData({ ...formData, process_scope: v })} />

                            {/* Department Selector */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Department</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <select
                                            className="w-full bg-theme-input border border-theme-input-border rounded-lg px-4 py-2.5 text-theme-primary focus:outline-none focus:border-indigo-500/50 appearance-none"
                                            value={formData.department_id || ""}
                                            onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                        >
                                            <option value="">None</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary pointer-events-none" />
                                    </div>
                                ) : (
                                    <p className="text-theme-primary font-medium bg-theme-surface/20 px-4 py-2.5 rounded-lg border border-transparent">
                                        {departments.find(d => d._id === (process.department_id || formData.department_id))?.name || "-"}
                                    </p>
                                )}
                            </div>

                            {/* Process Level */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Process Level</label>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => setFormData({ ...formData, process_level: lvl })}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${Number(formData.process_level) === lvl
                                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                                                    : 'bg-theme-input text-theme-secondary border-theme-border hover:border-theme-secondary'
                                                    }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-theme-primary font-medium bg-theme-surface/20 px-4 py-2.5 rounded-lg border border-transparent">
                                        {process.process_level ? `Level ${process.process_level}` : "-"}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-6">
                            <TextAreaField label="Description" value={formData.description} isEditing={isEditing} onChange={v => setFormData({ ...formData, description: v })} />
                            <TextAreaField label="Process Objective" value={formData.process_objective} isEditing={isEditing} onChange={v => setFormData({ ...formData, process_objective: v })} />
                        </div>
                    </div>

                    {/* Node Attachments Table - Stacked Below */}
                    <NodeAttachmentsTable process={process} />


                    {/* RACI Matrix - Only show if not mining or if it has data */}
                    {(process.diagram_type !== 'mining' || (formData.raci?.activities && formData.raci.activities.length > 0)) && (
                        <div className="app-glass-panel p-6 rounded-xl overflow-hidden">
                            <div className="flex justify-between items-center mb-4 border-b border-theme-border pb-2">
                                <h3 className="text-lg font-semibold text-theme-primary">RACI Matrix</h3>
                                {isEditing && (
                                    <button onClick={() => setFormData(p => ({ ...p, raci: { ...p.raci, activities: [...(p.raci.activities || []), { name: "", responsible: "", accountable: "", consulted: "", informed: "" }] } }))} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30">+ Add Activity</button>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-theme-secondary">
                                    <thead className="text-xs text-theme-tertiary uppercase bg-theme-surface/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Activity</th>
                                            <th className="px-4 py-3">R</th>
                                            <th className="px-4 py-3">A</th>
                                            <th className="px-4 py-3">C</th>
                                            <th className="px-4 py-3 rounded-r-lg">I</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(formData.raci?.activities || []).map((activity, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                {isEditing ? (
                                                    <>
                                                        <td className="p-2"><input className="bg-neutral-800 rounded px-2 py-1 w-full text-white" value={activity.name} onChange={e => {
                                                            const newArr = [...formData.raci.activities]; newArr[idx].name = e.target.value; setFormData({ ...formData, raci: { ...formData.raci, activities: newArr } });
                                                        }} /></td>
                                                        <td className="p-2"><input className="bg-neutral-800 rounded px-2 py-1 w-full text-white" value={activity.responsible} onChange={e => {
                                                            const newArr = [...formData.raci.activities]; newArr[idx].responsible = e.target.value; setFormData({ ...formData, raci: { ...formData.raci, activities: newArr } });
                                                        }} /></td>
                                                        <td className="p-2"><input className="bg-neutral-800 rounded px-2 py-1 w-full text-white" value={activity.accountable} onChange={e => {
                                                            const newArr = [...formData.raci.activities]; newArr[idx].accountable = e.target.value; setFormData({ ...formData, raci: { ...formData.raci, activities: newArr } });
                                                        }} /></td>
                                                        <td className="p-2"><input className="bg-neutral-800 rounded px-2 py-1 w-full text-white" value={activity.consulted} onChange={e => {
                                                            const newArr = [...formData.raci.activities]; newArr[idx].consulted = e.target.value; setFormData({ ...formData, raci: { ...formData.raci, activities: newArr } });
                                                        }} /></td>
                                                        <td className="p-2"><input className="bg-neutral-800 rounded px-2 py-1 w-full text-white" value={activity.informed} onChange={e => {
                                                            const newArr = [...formData.raci.activities]; newArr[idx].informed = e.target.value; setFormData({ ...formData, raci: { ...formData.raci, activities: newArr } });
                                                        }} /></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-medium text-white">{activity.name}</td>
                                                        <td className="px-4 py-3">{activity.responsible}</td>
                                                        <td className="px-4 py-3">{activity.accountable}</td>
                                                        <td className="px-4 py-3">{activity.consulted}</td>
                                                        <td className="px-4 py-3">{activity.informed}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- NEW SECTIONS --- */}

                    {/* Strategic Objectives */}
                    <ListSection
                        title="Strategic Objectives"
                        data={formData.strategic_objectives || []}
                        isEditing={isEditing}
                        onAdd={() => addListItem('strategic_objectives', "")}
                        onRemove={(i) => removeListItem('strategic_objectives', i)}
                        onUpdate={(i, v) => updateListItem('strategic_objectives', i, v)}
                        placeholder="Enter strategic objective..."
                    />

                    {/* KPIs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <KPISection
                            title="Strategic KPIs"
                            kpis={formData.strategic_kpis || []}
                            isEditing={isEditing}
                            onChange={v => setFormData({ ...formData, strategic_kpis: v })}
                        />
                        <KPISection
                            title="Operational KPIs"
                            kpis={formData.operational_kpis || []}
                            isEditing={isEditing}
                            onChange={v => setFormData({ ...formData, operational_kpis: v })}
                        />
                    </div>
                    <KPISection
                        title="SLA & KPIs"
                        kpis={formData.sla_kpis || []}
                        isEditing={isEditing}
                        onChange={v => setFormData({ ...formData, sla_kpis: v })}
                        isSLA={true}
                    />

                    {/* SIPOC - Hide for mining if empty */}
                    {(process.diagram_type !== 'mining' || (formData.sipoc?.suppliers?.length > 0)) && (
                        <SIPOCTable
                            data={formData.sipoc || { suppliers: [], inputs: [], process: [], outputs: [], customers: [] }}
                            isEditing={isEditing}
                            onChange={v => setFormData({ ...formData, sipoc: v })}
                        />
                    )}

                    {/* Risks */}
                    <RiskTable
                        risks={formData.risks || []}
                        isEditing={isEditing}
                        onChange={v => setFormData({ ...formData, risks: v })}
                    />

                    {/* Cross-Department Relationships */}
                    <RelatedProcessesSection process={process} tree={tree} departments={departments} />
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-8 right-8 z-[100] bg-neutral-900 border border-white/10 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-up-fade flex items-center gap-3">
                    {notification.type === 'success' ? <Check className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
                    <p>{notification.message}</p>
                </div>
            )}

            {/* Version Changelog Modal */}
            <VersionChangelogModal
                isOpen={showChangelogModal}
                onClose={() => setShowChangelogModal(false)}
                versionChanges={process.version_changes}
                processId={process._id}
            />

        </div>
    );
}

function InfoField({ label, value, isEditing, onChange }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">{label}</label>
            {isEditing ? (
                <input
                    className="w-full bg-theme-input border border-theme-input-border rounded-lg px-4 py-2.5 text-theme-primary focus:outline-none focus:border-indigo-500/50 focus:bg-theme-surface transition-all"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={`Enter ${label}...`}
                />
            ) : (
                <p className="text-theme-primary font-medium bg-theme-surface/20 px-4 py-2.5 rounded-lg border border-transparent">{value || "-"}</p>
            )}
        </div>
    );
}

function TextAreaField({ label, value, isEditing, onChange }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">{label}</label>
            {isEditing ? (
                <textarea
                    className="w-full bg-theme-input border border-theme-input-border rounded-lg px-4 py-2.5 text-theme-primary focus:outline-none focus:border-indigo-500/50 focus:bg-theme-surface transition-all min-h-[100px]"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={`Enter ${label}...`}
                />
            ) : (
                <p className="text-theme-secondary bg-theme-surface/20 px-4 py-3 rounded-lg leading-relaxed whitespace-pre-wrap">{value || "No description provided."}</p>
            )}
        </div>
    );
}

// --- HELPER COMPONENTS ---

function ListSection({ title, data, isEditing, onAdd, onRemove, onUpdate, placeholder }) {
    return (
        <div className="app-glass-panel p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4 border-b border-theme-border pb-2">
                <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
                {isEditing && (
                    <button onClick={onAdd} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30">
                        <Plus size={12} className="inline mr-1" /> Add
                    </button>
                )}
            </div>
            <ul className="space-y-2">
                {data.map((item, i) => (
                    <li key={i} className="flex gap-2 items-start group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        {isEditing ? (
                            <div className="flex-1 flex gap-2">
                                <input
                                    className="flex-1 bg-theme-input border border-theme-border rounded px-2 py-1 text-sm text-theme-primary"
                                    value={item}
                                    onChange={(e) => onUpdate(i, e.target.value)}
                                    placeholder={placeholder}
                                />
                                <button onClick={() => onRemove(i)} className="text-red-400 hover:bg-red-500/10 p-1 rounded"><Trash2 size={14} /></button>
                            </div>
                        ) : (
                            <span className="text-theme-secondary text-sm">{item}</span>
                        )}
                    </li>
                ))}
                {data.length === 0 && !isEditing && <li className="text-theme-tertiary text-sm italic">No items listed.</li>}
            </ul>
        </div>
    );
}

function KPISection({ title, kpis, isEditing, onChange, isSLA = false }) {
    const addKPI = () => onChange([...kpis, { name: "", target: "", current: "" }]);
    const updateKPI = (i, field, val) => {
        const newKpis = [...kpis];
        newKpis[i][field] = val;
        onChange(newKpis);
    };
    const removeKPI = (i) => onChange(kpis.filter((_, idx) => idx !== i));

    return (
        <div className="app-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4 border-b border-theme-border pb-2">
                <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
                {isEditing && <button onClick={addKPI} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30"><Plus size={12} className="inline mr-1" /> Add</button>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-theme-secondary">
                    <thead className="text-xs text-theme-tertiary uppercase bg-theme-bg-tertiary">
                        <tr>
                            <th className="px-3 py-2 rounded-l-lg">{isSLA ? "SLA Name" : "KPI Name"}</th>
                            <th className="px-3 py-2">Target</th>
                            <th className="px-3 py-2 rounded-r-lg">{isSLA ? "Performance" : "Current"}</th>
                            {isEditing && <th className="px-1 py-1"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {kpis.map((kpi, i) => (
                            <tr key={i} className="hover:bg-theme-bg-tertiary transition-colors">
                                {isEditing ? (
                                    <>
                                        <td className="p-1"><input className="w-full bg-theme-input rounded px-2 py-1 text-theme-primary" value={kpi.name} onChange={e => updateKPI(i, 'name', e.target.value)} /></td>
                                        <td className="p-1"><input className="w-full bg-theme-input rounded px-2 py-1 text-theme-primary" value={kpi.target} onChange={e => updateKPI(i, 'target', e.target.value)} /></td>
                                        <td className="p-1"><input className="w-full bg-theme-input rounded px-2 py-1 text-theme-primary" value={kpi.current} onChange={e => updateKPI(i, 'current', e.target.value)} /></td>
                                        <td className="p-1"><button onClick={() => removeKPI(i)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button></td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2 font-medium">{kpi.name}</td>
                                        <td className="px-3 py-2 text-neutral-400">{kpi.target}</td>
                                        <td className="px-3 py-2 text-indigo-300 font-medium">{kpi.current}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {kpis.length === 0 && !isEditing && <p className="text-neutral-500 text-sm italic mt-2">No records found.</p>}
            </div>
        </div>
    );
}

function SIPOCTable({ data, isEditing, onChange }) {
    const updateSIPOC = (field, idx, val) => {
        const newData = { ...data };
        const arr = [...(newData[field] || [])];
        while (arr.length <= idx) arr.push("");
        arr[idx] = val;
        newData[field] = arr;
        onChange(newData);
    };

    const maxRows = Math.max(
        data.suppliers?.length || 0,
        data.inputs?.length || 0,
        data.process?.length || 0,
        data.outputs?.length || 0,
        data.customers?.length || 0,
        1
    );
    const rows = Array.from({ length: isEditing ? maxRows + 1 : maxRows });

    return (
        <div className="app-glass-panel p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4 border-b border-theme-border pb-2">
                <h3 className="text-lg font-semibold text-theme-primary">SIPOC Analysis</h3>
                {isEditing && <span className="text-xs text-theme-tertiary">Edit cells directly. Add new items in the last empty row.</span>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-theme-secondary border-collapse table-fixed min-w-[800px]">
                    <thead className="text-xs text-center text-theme-tertiary uppercase bg-theme-surface/50">
                        <tr>
                            <th className="p-2 w-[20%] border border-theme-border">Suppliers</th>
                            <th className="p-2 w-[20%] border border-theme-border">Inputs</th>
                            <th className="p-2 w-[20%] border border-theme-border bg-indigo-500/10 text-indigo-400">Process</th>
                            <th className="p-2 w-[20%] border border-theme-border">Outputs</th>
                            <th className="p-2 w-[20%] border border-theme-border">Customers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((_, i) => (
                            <tr key={i} className="hover:bg-theme-surface/50">
                                {['suppliers', 'inputs', 'process', 'outputs', 'customers'].map((col) => (
                                    <td key={col} className={`p-1 border border-theme-border ${col === 'process' ? 'bg-indigo-500/5' : ''}`}>
                                        {isEditing ? (
                                            <textarea
                                                className="w-full bg-transparent resize-none overflow-hidden focus:outline-none focus:bg-theme-input rounded px-2 py-1 text-center text-theme-primary"
                                                rows={1}
                                                value={data[col]?.[i] || ""}
                                                onChange={e => updateSIPOC(col, i, e.target.value)}
                                                placeholder="-"
                                            />
                                        ) : (
                                            <div className="px-2 py-1 text-center whitespace-pre-wrap">{data[col]?.[i]}</div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RiskTable({ risks, isEditing, onChange }) {
    const addRisk = () => onChange([...risks, { description: "", mitigation: "", severity: "Low" }]);
    const updateRisk = (i, field, val) => {
        const newRisks = [...risks];
        newRisks[i][field] = val;
        onChange(newRisks);
    };
    const removeRisk = (i) => onChange(risks.filter((_, idx) => idx !== i));

    return (
        <div className="app-glass-panel p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4 border-b border-theme-border pb-2">
                <h3 className="text-lg font-semibold text-theme-primary">Risk Management</h3>
                {isEditing && <button onClick={addRisk} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"><Plus size={12} className="inline mr-1" /> Add Risk</button>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-theme-secondary">
                    <thead className="text-xs text-theme-tertiary uppercase bg-theme-surface/50">
                        <tr>
                            <th className="px-3 py-2 w-[40%] rounded-l-lg">Risk Description</th>
                            <th className="px-3 py-2 w-[40%]">Mitigation Plan</th>
                            <th className="px-3 py-2 w-[20%] rounded-r-lg">Severity</th>
                            {isEditing && <th className="w-8"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                        {risks.map((risk, i) => (
                            <tr key={i} className="hover:bg-theme-surface/50">
                                {isEditing ? (
                                    <>
                                        <td className="p-1"><textarea className="w-full bg-theme-input rounded px-2 py-1 text-theme-primary resize-none" rows={1} value={risk.description} onChange={e => updateRisk(i, 'description', e.target.value)} /></td>
                                        <td className="p-1"><textarea className="w-full bg-theme-input rounded px-2 py-1 text-theme-primary resize-none" rows={1} value={risk.mitigation} onChange={e => updateRisk(i, 'mitigation', e.target.value)} /></td>
                                        <td className="p-1">
                                            <select className="bg-theme-input rounded px-2 py-1 text-theme-primary w-full" value={risk.severity} onChange={e => updateRisk(i, 'severity', e.target.value)}>
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </td>
                                        <td className="p-1 text-center"><button onClick={() => removeRisk(i)} className="text-red-400"><Trash2 size={14} /></button></td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2">{risk.description}</td>
                                        <td className="px-3 py-2">{risk.mitigation}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${risk.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                                                risk.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-green-500/20 text-green-500'
                                                }`}>{risk.severity}</span>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {risks.length === 0 && !isEditing && <p className="text-theme-tertiary text-sm italic mt-2">No risks identified.</p>}
            </div>
        </div>
    );
}

function DocSection({ docs, isEditing, onChange }) {
    const addDoc = () => onChange([...docs, { name: "", url: "" }]);
    const updateDoc = (i, field, val) => {
        const newDocs = [...docs];
        newDocs[i][field] = val;
        onChange(newDocs);
    };
    const removeDoc = (i) => onChange(docs.filter((_, idx) => idx !== i));

    return (
        <div className="app-glass-panel p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4 border-b border-theme-border pb-2">
                <h3 className="text-lg font-semibold text-theme-primary">Related Documents</h3>
                {isEditing && <button onClick={addDoc} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30"><Plus size={12} className="inline mr-1" /> Add Link</button>}
            </div>
            <ul className="space-y-3">
                {docs.map((doc, i) => (
                    <li key={i} className="group flex items-center gap-3">
                        <div className="p-2 bg-theme-bg-tertiary rounded text-theme-tertiary"><Edit2 size={14} /></div>
                        {isEditing ? (
                            <div className="flex-1 flex gap-2">
                                <input className="flex-1 bg-theme-input rounded px-2 py-1 text-sm text-theme-primary border border-theme-border" placeholder="Document Name" value={doc.name} onChange={e => updateDoc(i, 'name', e.target.value)} />
                                <input className="flex-1 bg-theme-input rounded px-2 py-1 text-sm text-theme-secondary border border-theme-border" placeholder="URL / Link" value={doc.url} onChange={e => updateDoc(i, 'url', e.target.value)} />
                                <button onClick={() => removeDoc(i)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                            </div>
                        ) : (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-indigo-500 hover:text-indigo-400 hover:underline">{doc.name || doc.url}</a>
                        )}
                    </li>
                ))}
                {docs.length === 0 && !isEditing && <p className="text-theme-tertiary text-sm italic">No documents attached.</p>}
            </ul>
        </div>
    );
}

function NodeAttachmentsTable({ process }) {
    const [nodeGroups, setNodeGroups] = useState([]);

    useEffect(() => {
        if (!process) return;
        const allNodes = process.nodes || process.as_is_nodes || [];
        const groups = [];

        allNodes.forEach(node => {
            if (node.data && node.data.attachments && node.data.attachments.length > 0) {
                groups.push({
                    nodeId: node.id,
                    nodeLabel: node.data.label || "Unnamed Node",
                    attachments: node.data.attachments
                });
            }
        });
        setNodeGroups(groups);
    }, [process]);

    if (nodeGroups.length === 0) return null;

    return (
        <div className="app-glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-theme-primary mb-4 border-b border-theme-border pb-2">
                Related Documents
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-theme-secondary">
                    <thead className="text-xs text-theme-tertiary uppercase bg-theme-surface/50">
                        <tr>
                            <th className="px-3 py-2 w-16 rounded-l-lg text-center">S.No</th>
                            <th className="px-3 py-2 w-1/4">Node Name</th>
                            <th className="px-3 py-2 rounded-r-lg">Documents</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {nodeGroups.map((group, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-center text-theme-tertiary">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium text-theme-primary">{group.nodeLabel}</td>
                                <td className="px-3 py-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {group.attachments.map((att, i) => (
                                            <a
                                                key={i}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 rounded-full bg-theme-bg-tertiary border border-theme-border hover:bg-neutral-800 hover:border-blue-500/50 transition-colors group/file text-xs px-4"
                                                title={att.name}
                                            >
                                                <FileText size={14} className="text-blue-400 shrink-0" />
                                                <span className="truncate text-theme-primary group-hover/file:text-blue-400">{att.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RelatedProcessesSection({ process, tree = [], departments = [] }) {
    const [relatedProcesses, setRelatedProcesses] = useState([]);

    useEffect(() => {
        if (!process) return;
        const allNodes = process.nodes || process.as_is_nodes || [];
        const links = [];

        const findDeptName = (targetId) => {
            const findNode = (nodes) => {
                for (const n of nodes) {
                    if (n._id === targetId) return n;
                    if (n.children) {
                        const found = findNode(n.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            const node = findNode(tree);
            if (!node) return null;
            return departments.find(d => d._id === node.department_id)?.name;
        };

        allNodes.forEach(node => {
            if (node.data && node.data.linkedProcessId) {
                const resolvedDept = node.data.linkedProcessDepartment || findDeptName(node.data.linkedProcessId) || "Other";
                links.push({
                    id: node.data.linkedProcessId,
                    name: node.data.linkedProcessName || "Unnamed Process",
                    department: resolvedDept,
                    nodeLabel: node.data.label || "Unnamed Step"
                });
            }
        });
        setRelatedProcesses(links);
    }, [process, tree, departments]);

    if (relatedProcesses.length === 0) return null;

    return (
        <div className="app-glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-theme-primary mb-4 border-b border-theme-border pb-2">
                Cross-Department Subprocesses
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-theme-secondary">
                    <thead className="text-xs text-theme-tertiary uppercase bg-theme-surface/50">
                        <tr>
                            <th className="px-3 py-2 w-16 rounded-l-lg text-center">S.No</th>
                            <th className="px-3 py-2 w-1/4">Source Step</th>
                            <th className="px-3 py-2">Linked Process</th>
                            <th className="px-3 py-2 rounded-r-lg">Department</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {relatedProcesses.map((proc, idx) => (
                            <tr key={idx} className="hover:bg-white/5 group transition-colors cursor-pointer" onClick={() => window.open(`/workspace?id=${proc.id}`, '_blank')}>
                                <td className="px-3 py-2 text-center text-theme-tertiary">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium text-theme-primary">{proc.nodeLabel}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300">
                                        <Layers size={14} />
                                        <span>{proc.name}</span>
                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="text-[10px] bg-theme-bg-tertiary px-2 py-0.5 rounded text-theme-tertiary uppercase font-bold tracking-wider">
                                        {proc.department}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
