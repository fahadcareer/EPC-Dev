import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Folder, ChevronRight, ChevronDown, FileText, Edit, FolderPlus, FilePlus, Trash2, FolderOpen, Search, Home, LogOut, Globe, Sun, Moon, User, Layers, Target, LayoutGrid, File, Info, Download, Pin, PinOff, Book, FlaskConical } from "lucide-react";
import EPCPreview from "./view_diagram";
import EditableOverview from "./EditableOverview";
import HistoryView from "./HistoryView";
import TableView from "./TableView";
import ProcessCatalogueModal from "./ProcessCatalogueModal";
import VersionChangelogModal from "../../components/VersionChangelogModal";
import FolderAttachmentsBox from "./FolderAttachmentsBox";
import "reactflow/dist/style.css";
import { executeAICommand, sendChatToAssistant } from "../../components/utils/aiCommandHandler";
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NETWORK_URLS from "../../config/network_string";
import { useTheme } from "../../contexts/ThemeContext";
import MainLayout from "../../layouts/MainLayout";
import useAuthStore from "../../store/logic/user";
import MiningView from "./MiningView";
import MiningOverview from "../process_mining/MiningOverview";
import InsightsView from "./InsightsView";
import ShareModal from "./ShareModal";
import api from "../../services/api_service";
import Dashboard from "../dashboard/index";

// Simple Tab Component
function Tabs({ children, selectedIndex, onChange }) {
    return <div>{children({ selectedIndex, onChange })}</div>;
}

export default function ProcessExplorer() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [tree, setTree] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });
    const [activeTab, setActiveTab] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSelectedId = searchParams.get('id');
    const urlTab = searchParams.get('tab');


    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [isRunningCommand, setIsRunningCommand] = useState(false);

    // Custom Modal States
    const [createModal, setCreateModal] = useState({ show: false, parentId: null, type: 'folder' });
    const [renameModal, setRenameModal] = useState({ show: false, nodeId: null, currentName: '' });
    const [deleteModal, setDeleteModal] = useState({ show: false, nodeId: null, nodeName: '' });
    const [descriptionModal, setDescriptionModal] = useState({ show: false, nodeId: null, currentDesc: '', type: 'process' });
    const [selectedChangelog, setSelectedChangelog] = useState(null);
    const [catalogueModalOpen, setCatalogueModalOpen] = useState(false);
    const [shareModal, setShareModal] = useState({ show: false, node: null });
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [orgAttributes, setOrgAttributes] = useState([]);


    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('org_logo_url') || null);
    const [orgName, setOrgName] = useState(() => localStorage.getItem('org_name') || '');
    const [userRole, setUserRole] = useState(null);
    const [accessLevel, setAccessLevel] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reloadedForId, setReloadedForId] = useState(null); // To prevent infinite reloads

    // Departments logic
    const [departments, setDepartments] = useState([]);
    const [userAllowedDepts, setUserAllowedDepts] = useState([]);
    const [selectedDeptId, setSelectedDeptId] = useState("");
    const [selectedLevel, setSelectedLevel] = useState(""); // For Level Selection
    const [userAllowedLevels, setUserAllowedLevels] = useState([]);
    const [pinnedItems, setPinnedItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pinned_processes') || '[]');
        } catch {
            return [];
        }
    });

    const togglePin = (id) => {
        setPinnedItems(prev => {
            const newPinned = prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id];
            localStorage.setItem('pinned_processes', JSON.stringify(newPinned));
            // Fire event so the Dashboard Quick Access strip updates instantly
            window.dispatchEvent(new Event('pinned_processes_updated'));
            // Clear cached data when unpinning so it re-fetches if re-pinned later
            if (prev.includes(id)) {
                setPinnedProcessesData(d => { const n = { ...d }; delete n[id]; return n; });
            }
            return newPinned;
        });
    };

    // Listen for pin changes made from other components (like the Dashboard strip)
    useEffect(() => {
        const onPinsChanged = () => {
            try {
                setPinnedItems(JSON.parse(localStorage.getItem('pinned_processes') || '[]'));
            } catch {
                setPinnedItems([]);
            }
        };
        window.addEventListener('pinned_processes_updated', onPinsChanged);
        return () => window.removeEventListener('pinned_processes_updated', onPinsChanged);
    }, []);

    const [pinnedProcessesData, setPinnedProcessesData] = useState({});
    useEffect(() => {
        let isMounted = true;
        const fetchPinnedData = async () => {
            if (pinnedItems.length === 0) return;
            
            for (const id of pinnedItems) {
                try {
                    const res = await api.get(`${NETWORK_URLS.GetProcesses}${id}`);
                    if (res.data && isMounted) {
                        setPinnedProcessesData(prev => {
                            if (prev[id]) return prev; // Avoid setting if already exists to prevent unnecessary renders
                            return { ...prev, [id]: res.data };
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch pinned process", id, e);
                    // If it fails (e.g. process was deleted), we should stop loading anyway
                    if (isMounted) {
                        setPinnedProcessesData(prev => ({ ...prev, [id]: { _error: true } }));
                    }
                }
            }
        };
        fetchPinnedData();
        return () => { 
            isMounted = false; 
        };
    }, [pinnedItems]);

    /* ---------- Smart Logo Inversion Logic ---------- */
    const [shouldInvertLogo, setShouldInvertLogo] = useState(false);

    const handleLogoLoad = (e) => {
        const img = e.target;
        if (!img.complete || img.naturalWidth === 0) return;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let totalBrightness = 0;
            let count = 0;

            for (let i = 0; i < data.length; i += 16) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a > 20) {
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    totalBrightness += brightness;
                    count++;
                }
            }

            if (count > 0) {
                const avgBrightness = totalBrightness / count;
                setShouldInvertLogo(avgBrightness > 200);
            }
        } catch (err) {
            console.warn('Unable to analyze logo colors (CORS likely). Defaulting to no inversion.', err);
            if (img.src.includes('/logo.png')) {
                setShouldInvertLogo(true);
            }
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
            } catch (e) {
                console.error("Error parsing token", e);
            }
        }
    }, []);

    useEffect(() => {
        load();
        fetchProfile();
        fetchOrgAttributes();
    }, []);

    const fetchOrgAttributes = async () => {
        const user = useAuthStore.getState().user;
        const orgId = user?.organization_id;
        if (!orgId) return;

        try {
            const res = await api.get(`/admin/organizations/${orgId}`);
            setOrgAttributes(res.data.organization?.custom_attributes || []);
        } catch (error) {
            console.error("Failed to fetch org attributes", error);
        }
    };

    const fetchProfile = async () => {
        try {
            const api = (await import("../../services/api_service")).default;
            const res = await api.get(NETWORK_URLS.GetProfile);

            console.log("Fetch Profile Response:", res.data); // DEBUG LOG

            // Hydrate global store with user details
            if (res.data) {
                // Check what ID field we actually have
                const { name, email, role, _id, user_id, id, organization_id, access_level, allowed_departments, allowed_levels } = res.data;
                const token = localStorage.getItem('token');

                // Use whatever ID is available
                const finalId = _id || user_id || id;
                console.log("Hydrating User with ID:", finalId); // DEBUG LOG

                setUserRole(role);
                if (access_level) {
                    setAccessLevel(access_level);
                }

                // Capture allowed departments
                if (res.data.allowed_departments) {
                    setUserAllowedDepts(res.data.allowed_departments);
                }
                if (res.data.allowed_levels) {
                    setUserAllowedLevels(res.data.allowed_levels);
                }

                // Fetch all departments for everyone so they can be selected in dropdowns
                fetchAllDepartments();

                // We update the store with full user details
                useAuthStore.getState().setAuth(token, { id: finalId, role, name, email, username: name, organization_id, access_level, allowed_departments, allowed_levels, enabled_features: res.data.enabled_features });

                if (res.data.organization) {
                    const { logo_url, name } = res.data.organization;
                    setLogoUrl(logo_url);
                    setOrgName(name);
                    // Cache for consistency
                    if (logo_url) localStorage.setItem('org_logo_url', logo_url);
                    if (name) localStorage.setItem('org_name', name);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchAllDepartments = async () => {
        try {
            const api = (await import("../../services/api_service")).default;
            const res = await api.get('/admin/departments');
            setDepartments(res.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }
        };

        if (contextMenu.visible) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.visible]);

    useEffect(() => {
        // Auto-expand folders when searching
        if (searchQuery.trim()) {
            const expandAll = (nodes) => {
                const newExpanded = { ...expanded };
                nodes.forEach((node) => {
                    if (node.type === "folder") {
                        newExpanded[node._id] = true;
                        if (node.children) {
                            Object.assign(newExpanded, expandAll(node.children));
                        }
                    }
                });
                return newExpanded;
            };
            setExpanded(expandAll(tree));
        }
    }, [searchQuery, tree]);

    const fetchFullProcess = async (id) => {
        try {
            const res = await api.get(`${NETWORK_URLS.GetProcesses}${id}`);
            if (res.data) {
                setSelected(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch full process details", error);
        }
    };

    useEffect(() => {
        if (selected && selected.type === 'file' && !selected.nodes && !selected.as_is_nodes) {
            fetchFullProcess(selected._id);
        }
    }, [selected?._id]);

    const load = async () => {
        const api = (await import("../../services/api_service")).default;
        const res = await api.get(NETWORK_URLS.GetProcessTree);
        const newTree = res.data;
        setTree(newTree);

        // If we have a selected node, we need to update it with the fresh data from the new tree
        if (selected) {
            const findNodeById = (nodes, id) => {
                for (const node of nodes) {
                    if (node._id === id) return node;
                    if (node.children) {
                        const found = findNodeById(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };
            const updatedNode = findNodeById(newTree, selected._id);
            if (updatedNode) {
                // Merge to preserve heavy data if we already fetched it
                setSelected(prev => ({ ...prev, ...updatedNode }));
            }
        }
    };

    useEffect(() => {
        if (urlSelectedId && tree.length > 0) {
            const findNodeById = (nodes, id) => {
                for (const node of nodes) {
                    if (node._id === id) return node;
                    if (node.children) {
                        const found = findNodeById(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const node = findNodeById(tree, urlSelectedId);
            if (node) {
                if (!selected || selected._id !== node._id) {
                    setSelected(node);

                    // Deep expand to find the node
                    const newExpanded = { ...expanded };
                    const expandParentsTo = (nodes, targetId) => {
                        for (const n of nodes) {
                            if (n._id === targetId) return true;
                            if (n.children && n.children.length > 0) {
                                if (expandParentsTo(n.children, targetId)) {
                                    newExpanded[n._id] = true;
                                    return true;
                                }
                            }
                        }
                        return false;
                    };
                    expandParentsTo(tree, urlSelectedId);
                    setExpanded(prev => ({ ...prev, ...newExpanded }));
                }

                const tabIndex = urlTab ? parseInt(urlTab) : 0;
                if (!isNaN(tabIndex) && activeTab !== tabIndex) {
                    setActiveTab(tabIndex);
                }
            } else {
                // Node not found in current tree. 
                // It might be a newly shared file that we haven't loaded yet.
                // Try reloading ONLY if we haven't already tried for this ID.
                if (urlSelectedId !== reloadedForId) {
                    console.log(`Target node ${urlSelectedId} not found, reloading tree...`);
                    setReloadedForId(urlSelectedId);
                    load();
                }
            }
        }
    }, [urlSelectedId, urlTab, tree]);

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const isFeatureEnabled = useAuthStore.getState().isFeatureEnabled;

    // Helper to check if user has 'edit' access to a node
    // Admins/Superadmins/Owner always have edit access
    // Shared users check the 'access' field
    const hasEditAccess = (node) => {
        if (!node) return false;
        const user = useAuthStore.getState().user; // Get user from store
        if (!user) return false; // If no user, no access

        const role = user.role;
        const userId = user.user_id || user.id || user._id;

        // 1. Admin/Superadmin/System Admin -> Always allowed
        if (role === 'admin' || role === 'superadmin' || role === 'system_admin') return true;

        // 2. System files -> Read-only for others (non-admins)
        if (node.is_system) return false;

        // 3. Owner -> Always allowed
        if (String(node.created_by) === String(userId)) {
            return true;
        }

        // 4. Check Shared Permissions (Overrides global editor role)
        if (node.shared_with) {
            const share = node.shared_with.find(s => {
                if (typeof s === 'string') return String(s) === String(userId);
                return String(s.user_id) === String(userId);
            });

            if (share) {
                // If found in share list, use specific access
                if (typeof share === 'object' && share.access === 'edit') {
                    return true;
                }
                // If shared as 'view' (or legacy string), explicit DENY
                return false;
            }
        }

        // 5. Global Editor Access (Only if not explicitly restricted by share matches above)
        if (user.access_level === 'editor') {
            return true;
        }

        // If explicitly set to viewer, deny edit
        if (user.access_level === 'viewer' || role === 'viewer') {
            return false;
        }

        return false;
    };

    // Helper to check if user can create content inside a node
    const canCreateContent = (node) => {
        if (!node) return false;

        const storeUser = useAuthStore.getState().user;
        const resolvedRole = storeUser?.role || userRole;
        const resolvedAccessLevel = storeUser?.access_level || accessLevel;

        // Admins/Superadmins can always create anywhere that is not restricted
        if (resolvedRole === 'admin' || resolvedRole === 'superadmin' || resolvedRole === 'system_admin') return true;

        // Deny creation if role or access_level explicitly says viewer
        if (resolvedRole === 'viewer' || resolvedAccessLevel === 'viewer') return false;

        // EXCEPTION: Workspace folder (and its children)
        // Users MUST be able to create content inside their Workspace branches.
        if (node.name === "Workspace" || node.is_workspace_branch) {
            return true;
        }

        // If user can edit the node, they can create content
        if (hasEditAccess(node)) return true;

        return false;
    };

    const handleSelect = (node) => {
        setSelected(node);
        // If it's a file, we might want to keep the current tab or default to 0
        // If it's a folder, tabs are different (Overview, Subgroups, Models)
        // Let's reset to 0 for now as default behavior, or keep it if it's within range
        // However, I previously modified this block in thought process but maybe I should stick to the existing structure
        // The existing structure in view_file shows logic about setting setActiveTab(0)

        setActiveTab(0);
        if (node?._id) {
            setSearchParams({ id: node._id, tab: 0 });
        }
    };

    const validateName = (name, parentId, currentId = null) => {
        if (!name || !name.trim()) return "Name cannot be empty.";
        if (name.length > 255) return "Name cannot exceed 255 characters.";

        // Restricted characters: / \ : * ? " < > |
        const restrictedChars = /[\\/:*?"<>|]/;
        if (restrictedChars.test(name)) {
            return "Name contains restricted characters ( / \\ : * ? \" < > | )";
        }

        // Check for uniqueness
        // We need to find the children of the parent node
        let children = [];
        if (!parentId) {
            // Root level check - filter tree for root nodes
            children = tree;
        } else {
            const findNode = (nodes, id) => {
                for (const node of nodes) {
                    if (node._id === id) return node;
                    if (node.children) {
                        const found = findNode(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };
            const parentNode = findNode(tree, parentId);
            if (parentNode) {
                children = parentNode.children || [];
            }
        }

        const exists = children.some(child =>
            child.name.toLowerCase() === name.trim().toLowerCase() &&
            child._id !== currentId
        );

        if (exists) return "A file or folder with this name already exists in this location.";

        return null;
    };

    const createItem = async (parentId = null, type, forcedName = null) => {
        if (forcedName) {
            // Direct creation from AI command
            const api = (await import("../../services/api_service")).default;
            await api.post(NETWORK_URLS.GetProcesses, { name: forcedName, type, parent: parentId || null });
            load();
        } else {
            // Show modal for user input
            setCreateModal({ show: true, parentId, type, error: '' });
        }
    };

    const handleCreateConfirm = async (name) => {
        const error = validateName(name, createModal.parentId);
        if (error) {
            setCreateModal(prev => ({ ...prev, error }));
            return;
        }

        try {
            // Helper to check if a node or its parents is 'Process Mining'
            const isMiningNode = (nodes, targetId) => {
                const findAndCheck = (list, id, path = []) => {
                    for (const node of list) {
                        if (node._id === id) return [...path, node];
                        if (node.children) {
                            const found = findAndCheck(node.children, id, [...path, node]);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                const path = findAndCheck(nodes, targetId);
                return path?.some(n => n.name === "Process Mining");
            };

            const isMining = createModal.parentId && isMiningNode(tree, createModal.parentId);

            const api = (await import("../../services/api_service")).default;
            await api.post(NETWORK_URLS.GetProcesses, {
                name: name.trim(),
                type: createModal.type,
                parent: createModal.parentId || null,
                department_id: selectedDeptId || null,
                process_level: selectedLevel ? parseInt(selectedLevel) : null, // Send level
                diagram_type: isMining && createModal.type === 'file' ? 'mining' : 'process'
            });
            setCreateModal({ show: false, parentId: null, type: 'folder', error: '' });
            setSelectedDeptId(""); // Reset
            setSelectedLevel(""); // Reset
            load();
        } catch (e) {
            console.error("Creation failed", e);
            setCreateModal(prev => ({ ...prev, error: e.response?.data?.error || "Creation failed" }));
        }
    };

    const moveNode = async (draggedId, newParentId) => {
        try {
            const api = (await import("../../services/api_service")).default;
            await api.put(`${NETWORK_URLS.GetProcesses}${draggedId}`, { parent: newParentId });
            load();
        } catch (e) {
            console.error("Failed to move node", e);
            alert("Failed to move item.");
        }
    };

    const isDescendant = (draggedId, targetId, nodes) => {
        // If target is the same as dragged, it's a descendant (itself)
        if (draggedId === targetId) return true;

        let draggedNode = null;

        const findNode = (id, treeNodes) => {
            for (const n of treeNodes) {
                if (n._id === id) return n;
                if (n.children) {
                    const found = findNode(id, n.children);
                    if (found) return found;
                }
            }
            return null;
        };

        draggedNode = findNode(draggedId, nodes);
        if (!draggedNode || !draggedNode.children) return false;

        const checkChildren = (children) => {
            for (const c of children) {
                if (c._id === targetId) return true;
                if (c.children && checkChildren(c.children)) return true;
            }
            return false;
        };

        return checkChildren(draggedNode.children);
    };

    const [dragTargetId, setDragTargetId] = useState(null);
    const [invalidDragTargetId, setInvalidDragTargetId] = useState(null);
    const [draggedScopeId, setDraggedScopeId] = useState(null);

    const checkMobile = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const renameNode = async (id, newName) => {
        const api = (await import("../../services/api_service")).default;
        await api.put(`${NETWORK_URLS.GetProcesses}${id}`, { name: newName.trim() });
        load();
    };

    const handleRenameConfirm = async (newName) => {
        const error = validateName(newName, null, renameModal.nodeId); // Pass nodeId to ignore self

        let parentId = null;
        const findParent = (nodes, childId) => {
            for (const node of nodes) {
                if (node.children) {
                    if (node.children.some(c => c._id === childId)) return node._id;
                    const found = findParent(node.children, childId);
                    if (found) return found;
                }
            }
            return null;
        };
        parentId = findParent(tree, renameModal.nodeId);

        const validationError = validateName(newName, parentId, renameModal.nodeId);
        if (validationError) {
            setRenameModal(prev => ({ ...prev, error: validationError }));
            return;
        }

        try {
            await renameNode(renameModal.nodeId, newName.trim());
            setRenameModal({ show: false, nodeId: null, currentName: '', error: '' });
        } catch (e) {
            setRenameModal(prev => ({ ...prev, error: e.response?.data?.error || "Rename failed" }));
        }
    };



    const updateDescription = async (id, description) => {
        const api = (await import("../../services/api_service")).default;
        // Assuming the backend accepts description in the generic PUT endpoint or specific one
        await api.put(`${NETWORK_URLS.GetProcesses}${id}`, { description: description });
        load();
    };

    const handleDescriptionConfirm = async (newDesc) => {
        if (descriptionModal.type === 'node') {
            // Updating a node inside the currently selected process
            if (!selected) return;

            const updatedNodes = selected.nodes.map(n => {
                if (n.id === descriptionModal.nodeId) {
                    return {
                        ...n,
                        data: { ...n.data, description: newDesc },
                        description: newDesc // For backward compatibility if stored at top level
                    };
                }
                return n;
            });

            const api = (await import("../../services/api_service")).default;
            await api.put(`${NETWORK_URLS.GetProcesses}${selected._id}`, { nodes: updatedNodes });
            load(); // Reload to refresh
        } else {
            // Updating a process/folder description
            await updateDescription(descriptionModal.nodeId, newDesc);
        }
        setDescriptionModal({ show: false, nodeId: null, currentDesc: '', type: 'process' });
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim()) return;

        const text = chatInput.trim();
        setChatInput("");
        setChatMessages(prev => [...prev, { from: "user", text }]);
        setIsRunningCommand(true);

        try {
            const cmd = await sendChatToAssistant(text, selected, chatMessages, tree);
            setChatMessages(prev => [...prev, { from: "bot", text: cmd.summary }]);
            await executeAICommand(cmd, tree, selected, createItem, renameNode, deleteNode, load);
        } catch {
            setChatMessages(prev => [...prev, { from: "bot", text: "❌ Sorry, I couldn't process that." }]);
        }
        setIsRunningCommand(false);
    };

    const deleteNode = async (id) => {
        const api = (await import("../../services/api_service")).default;
        await api.delete(`${NETWORK_URLS.GetProcesses}${id}`);
        if (selected?._id === id) setSelected(null);
        load();
    };

    const handleDownloadReport = async () => {
        if (!selected || selected.type !== 'folder') return;
        setIsDownloadingReport(true);
        try {
            const api = (await import("../../services/api_service")).default;
            const res = await api.get(NETWORK_URLS.FolderReport(selected._id), {
                responseType: 'blob'
            });

            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `${selected.name}_Details.xlsx`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download report", error);
            alert("Failed to download report. Please try again.");
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const handleDeleteConfirm = async () => {
        await deleteNode(deleteModal.nodeId);
        setDeleteModal({ show: false, nodeId: null, nodeName: '' });
    };

    const navigateToEditor = (id) => {
        window.location.href = `/editor/${id}`;
    };

    const handleContextMenu = (e, node) => {
        e.preventDefault();
        // Estimate menu height ~200px. If click is too close to bottom, show above cursor.
        const menuHeight = 220;
        let y = e.clientY;
        if (e.clientY + menuHeight > window.innerHeight) {
            y = e.clientY - menuHeight;
        }

        setContextMenu({ visible: true, x: e.clientX, y, node });
    };

    const isNodeRestricted = (targetId, nodes, parentRestricted = false) => {
        for (const node of nodes) {
            // Check if this node is "Approved" folder or status
            const isApprovedFolder = node.type === 'folder' && node.name === "Approved";
            const isApprovedStatus = node.status === 'Approved';

            const currentRestricted = parentRestricted || isApprovedFolder || isApprovedStatus;

            if (node._id === targetId) {
                // If we found the target, checks if it is restricted itself or mainly by parent
                // User said: "models that are approved and inside approved folders"
                // So if currentRestricted is true, we block.
                return currentRestricted;
            }

            if (node.children) {
                if (isNodeRestricted(targetId, node.children, currentRestricted)) return true;
            }
        }
        return false;
    };

    const isCreationAllowed = (targetId, nodes, insideWorkspace = false) => {
        for (const node of nodes) {
            const isWorkspace = (node.name === "Workspace" || node.is_workspace_branch) && node.type === 'folder';
            const currentInside = insideWorkspace || isWorkspace;

            if (node._id === targetId) {
                return currentInside;
            }

            if (node.children) {
                const result = isCreationAllowed(targetId, node.children, currentInside);
                if (result !== null) return result;
            }
        }
        return null;
    };

    const filterTree = (nodes, query) => {
        if (!query.trim()) return nodes;

        const lowerQuery = query.toLowerCase();

        const filterNode = (node) => {
            const nameMatch = node.name.toLowerCase().includes(lowerQuery);
            const codeMatch = node.code?.toLowerCase().includes(lowerQuery);

            if (node.type === "folder" && node.children) {
                const filteredChildren = node.children
                    .map(filterNode)
                    .filter(Boolean);

                if (nameMatch || codeMatch || filteredChildren.length > 0) {
                    return {
                        ...node,
                        children: filteredChildren
                    };
                }
            } else if (nameMatch || codeMatch) {
                return node;
            }

            return null;
        };

        return nodes.map(filterNode).filter(Boolean);
    };

    const handleCatalogueNavigation = (id) => {
        // Find node recursively
        const findNode = (nodes, targetId) => {
            for (const node of nodes) {
                if (node._id === targetId) return node;
                if (node.children) {
                    const found = findNode(node.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        const node = findNode(tree, id);
        if (node) {
            setSelected(node);
            setActiveTab(1); // Set to Overview tab
            setSearchParams({ id: node._id, tab: 1 });
            setCatalogueModalOpen(false);

            // Expand tree to show this node
            const newExpanded = { ...expanded };
            const expandParentsTo = (nodes, targetId) => {
                for (const n of nodes) {
                    if (n._id === targetId) return true;
                    if (n.children && n.children.length > 0) {
                        if (expandParentsTo(n.children, targetId)) {
                            newExpanded[n._id] = true;
                            return true;
                        }
                    }
                }
                return false;
            };
            expandParentsTo(tree, node._id);
            setExpanded(prev => ({ ...prev, ...newExpanded }));
        }
    };

    const renderTree = (nodes, level = 0, currentScopeId = null) =>
        nodes.map((node) => {
            const isAsIs = node.name === "As-Is";
            const isToBe = node.name === "To-Be";
            const isSpecialFolder = isAsIs || isToBe;
            const isSelected = selected?._id === node._id;
            const hasChildren = node.children && node.children.length > 0;

            const isScopeBoundary = node.type === "folder" && (node.name === "Workspace" || node.name === "Approved");
            const nextScopeId = isScopeBoundary ? node._id : currentScopeId;

            const unDraggableNames = [
                "As-Is", "To-Be", "Organization Structure", "Process", "Process Mining",
                "Approved", "Workspace", "Organization Chart Model"
            ];
            // Block dragging for default system folders/files explicitly
            const isUnDraggable = unDraggableNames.includes(node.name) || node.is_system;

            // Feature Gating
            if (node.name === "Organization Structure" && !isFeatureEnabled('organization_structure')) return null;
            if (node.name === "Process Mining" && !isFeatureEnabled('process_mining')) return null;
            if (node.name === "Process" && !isFeatureEnabled('process')) return null;
            if (node.name === "Approved" && node.type === 'folder' && !isFeatureEnabled('governance')) return null;

            return (
                <div
                    key={node._id}
                    className="select-none relative"
                    draggable={!isUnDraggable}
                    onDragStart={(e) => {
                        e.stopPropagation();
                        if (isUnDraggable) return;
                        e.dataTransfer.setData("application/process-explorer-id", node._id);
                        setDraggedScopeId(nextScopeId);

                        // Synthesize a highly readable dynamic UI pill for the drag preview
                        const dragPreview = document.createElement("div");
                        dragPreview.className = "flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white shadow-xl pointer-events-none z-[9999]";
                        dragPreview.style.position = "absolute";
                        dragPreview.style.top = "-1000px";
                        dragPreview.innerHTML = `
                            <div class="w-5 h-5 flex-shrink-0">
                                ${node.type === "folder"
                                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>'
                                : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'}
                            </div>
                            <span class="text-sm font-medium whitespace-nowrap">${node.name}</span>
                        `;
                        document.body.appendChild(dragPreview);
                        e.dataTransfer.setDragImage(dragPreview, 15, 15);
                        setTimeout(() => {
                            if (document.body.contains(dragPreview)) {
                                document.body.removeChild(dragPreview);
                            }
                        }, 0);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Only allow dropping on folders, and not special ones
                        if (node.type === "folder" && !isSpecialFolder) {
                            if (draggedScopeId === nextScopeId) {
                                setDragTargetId(node._id);
                                setInvalidDragTargetId(null);
                            } else {
                                setInvalidDragTargetId(node._id);
                                setDragTargetId(null);
                            }
                        }
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragTargetId === node._id) {
                            setDragTargetId(null);
                        }
                        if (invalidDragTargetId === node._id) {
                            setInvalidDragTargetId(null);
                        }
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragTargetId(null);
                        setInvalidDragTargetId(null);
                        setDraggedScopeId(null);

                        const draggedId = e.dataTransfer.getData("application/process-explorer-id");

                        if (!draggedId || draggedId === node._id || isSpecialFolder || node.type !== "folder") return;

                        // Enforce Scope boundaries
                        if (draggedScopeId !== nextScopeId) {
                            toast.error("Cannot move files across different Workspace or Approved folders.", {
                                autoClose: 3000,
                                theme: theme === 'dark' ? 'dark' : 'light'
                            });
                            return;
                        }

                        // Check if dropping a folder into its own descendant
                        if (isDescendant(draggedId, node._id, tree)) {
                            toast.error(`Cannot move a folder into itself or its subfolders.`, {
                                autoClose: 3000,
                                theme: theme === 'dark' ? 'dark' : 'light'
                            });
                            return;
                        }

                        moveNode(draggedId, node._id);
                    }}
                >
                    <div
                        onClick={() => handleSelect(node)}
                        onContextMenu={(e) => handleContextMenu(e, node)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 group ${isSelected
                            ? (theme === 'dark' 
                                ? "bg-indigo-600/20 text-indigo-300 shadow-sm border border-indigo-500/10" 
                                : "bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200")
                            : (theme === 'dark' ? "text-theme-tertiary hover:bg-theme-input hover:text-theme-primary" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")
                            } ${isSpecialFolder ? "my-1 py-3" : ""} ${dragTargetId === node._id ? "ring-2 ring-indigo-500 bg-indigo-500/10" : ""} ${invalidDragTargetId === node._id ? "ring-2 ring-red-500 bg-red-500/10 opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {/* Indentation */}
                        <div style={{ width: `${level * 12}px` }}></div>

                        {/* Expand Icon - Only if children exist */}
                        {hasChildren ? (
                            expanded[node._id] ? (
                                <ChevronDown
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(node._id);
                                    }}
                                    className="w-4 h-4 hover:text-theme-primary transition-colors"
                                />
                            ) : (
                                <ChevronRight
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(node._id);
                                    }}
                                    className="w-4 h-4 hover:text-theme-primary transition-colors"
                                />
                            )
                        ) : (
                            // Placeholder for alignment
                            <div className="w-4 h-4"></div>
                        )}

                        {/* Icon Logic */}
                        {node.type === "folder" ? (
                            isAsIs ? (
                                <Layers className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                            ) : isToBe ? (
                                <Target className="w-6 h-6 text-blue-400 flex-shrink-0" />
                            ) : expanded[node._id] ? (
                                <FolderOpen className="w-5 h-5 text-amber-500/80 flex-shrink-0" />
                            ) : (
                                <Folder className="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 flex-shrink-0 transition-colors" />
                            )
                        ) : (
                            <FileText className={`w-5 h-5 flex-shrink-0 transition-colors ${theme === 'dark' ? 'text-blue-400/50 group-hover:text-blue-400' : 'text-blue-600/40 group-hover:text-blue-600'}`} />
                        )}

                        {/* Label */}
                        <span className={`truncate font-medium ${isSpecialFolder ? "text-base font-bold tracking-wide text-theme-primary" : "text-sm"}`}>{node.name}</span>

                        {/* Version Badge - Only show for approved files */}
                        {node.type === "file" && node.status === "Approved" && node.version && (
                            <div className="flex items-center gap-1 ml-1">
                                <span className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                                    theme === 'dark' 
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                        : 'bg-green-100 text-green-700 border-green-200'
                                }`}>
                                    v{node.version}
                                </span>
                            </div>
                        )}

                        {/* Level Badge */}
                        {node.type === "file" && node.process_level && (
                            <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded border font-mono transition-colors ${
                                theme === 'dark' 
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                                    : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}>
                                L{node.process_level}
                            </span>
                        )}
                    </div>
                    {expanded[node._id] && hasChildren && (
                        <div className="mt-1 border-l border-white/5 ml-3">
                            {/* Pass level + 1, but we handled visual indentation above manually via div width, 
                                wait, the previous code didn't use explicit level padding, it used nesting. 
                                Let's revert to nesting if that was the original behavior or double check.
                                Original code: <div className="mt-1 border-l border-white/5 ml-3">{renderTree(node.children, level + 1)}</div>
                                It seems it relies on margin-left for nesting?
                                Ah, checking lines 308: yes it nests.
                                I'll keep the nesting div, but I added specific indentation logic which might double it. 
                                Let's remove my manual `level * 12` div if relying on flex nesting structure, 
                                BUT looking at the original code, `renderTree(node.children, level + 1)` implies it might be using level?
                                Original Lines 262: `const renderTree = (nodes, level = 0)`
                                But the original code DOES NOT use `level` inside the return JSX for padding. 
                                It relies on the recursive rendering putting the Children in a div with `ml-3` (line 308).
                                So I should NOT add the padding div.
                                I will remove `<div style={{ width: `${level * 12}px` }}></div>` from my replacement.
                            */}
                            {renderTree(node.children, level + 1, nextScopeId)}
                        </div>
                    )}
                </div>
            );
        });

    const folderTabs = ["Overview", "Subgroups", "Models"];
    const fileTabs = ["Diagram", "Overview", "Table", "History", "Insights"];
    const miningTabs = ["Overview", "Table", "History", "Insights"];
    
    let tabs = folderTabs;
    if (selected?.type === "file") {
        tabs = selected.diagram_type === "mining" ? miningTabs : fileTabs;
    }

    return (
        <MainLayout
            Sidebar={
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-theme-border flex items-center justify-center">
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                                setSelected(null);
                                setSearchParams({});
                            }}
                            title="Home"
                        >
                            {logoUrl ? (
                                <img
                                    src={logoUrl.startsWith('http') ? logoUrl : `${NETWORK_URLS.BASE_URL}${logoUrl}`}
                                    alt="Org Logo"
                                    className="h-[40px] max-w-[120px] object-contain transition-all duration-300"
                                    crossOrigin="anonymous"
                                    onLoad={handleLogoLoad}
                                    style={{ filter: (theme === 'light' && shouldInvertLogo) ? 'invert(1) brightness(0)' : 'none', transition: 'filter 0.3s' }}
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                />
                            ) : null}
                            <Home size={28} className={`text-indigo-400 ${logoUrl ? 'hidden' : ''}`} />
                        </div>

                    </div>

                    {/* Search */}
                    <div className="px-4 py-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary group-focus-within:text-indigo-400 transition-colors" size={14} />
                            <input
                                value={searchQuery}
                                placeholder={t('search') || "Search structure..."}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        const lowerQuery = searchQuery.toLowerCase();
                                        const filtered = filterTree(tree, searchQuery);

                                        let bestMatch = null;
                                        let bestScore = -1;

                                        const traverse = (nodes) => {
                                            for (const node of nodes) {
                                                const name = node.name.toLowerCase();
                                                let score = 0;

                                                if (name === lowerQuery) score = 100;
                                                else if (name.startsWith(lowerQuery)) score = 80;
                                                else if (name.includes(lowerQuery)) score = 50;
                                                else if (node.code?.toLowerCase().includes(lowerQuery)) score = 40;

                                                if (score > bestScore && score > 0) {
                                                    bestScore = score;
                                                    bestMatch = node;
                                                }

                                                if (node.children) {
                                                    traverse(node.children);
                                                }
                                            }
                                        };

                                        traverse(filtered);

                                        if (bestMatch) {
                                            handleSelect(bestMatch);
                                        }
                                    }
                                }}
                                className="w-full bg-black/20 border border-theme-border rounded-lg py-2 pl-9 pr-3 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 focus:bg-theme-input transition-all placeholder:text-theme-tertiary focus:shadow-lg focus:shadow-indigo-500/5"
                            />
                        </div>
                    </div>

                    {/* Tree */}
                    <div
                        className="flex-1 overflow-y-auto px-2 pb-10"
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggedScopeId) {
                                setDragTargetId('root');
                                setInvalidDragTargetId(null);
                            } else {
                                setInvalidDragTargetId('root');
                                setDragTargetId(null);
                            }
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            if (dragTargetId === 'root') {
                                setDragTargetId(null);
                            }
                            if (invalidDragTargetId === 'root') {
                                setInvalidDragTargetId(null);
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragTargetId(null);
                            setInvalidDragTargetId(null);
                            const draggedId = e.dataTransfer.getData("application/process-explorer-id");

                            if (draggedScopeId) {
                                toast.error(`Cannot move files out of a Workspace or Approved folder to the root.`, {
                                    autoClose: 3000,
                                    theme: theme === 'dark' ? 'dark' : 'light'
                                });
                                setDraggedScopeId(null);
                                return;
                            }
                            setDraggedScopeId(null);

                            if (draggedId) {
                                // Find current parent
                                const findParent = (nodes, childId) => {
                                    for (const node of nodes) {
                                        if (node.children) {
                                            if (node.children.some(c => c._id === childId)) return node._id;
                                            const found = findParent(node.children, childId);
                                            if (found) return found;
                                        }
                                    }
                                    return null;
                                };
                                const currentParentId = findParent(tree, draggedId);

                                // Only move if it's not already at root (i.e., has a parent)
                                if (currentParentId) {
                                    moveNode(draggedId, null);
                                }
                            }
                        }}
                    >
                        {renderTree(useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]))}

                        {/* Dropzone hint at the bottom when dragging to root */}
                        {dragTargetId === 'root' && (
                            <div className="mt-4 border-2 border-dashed border-indigo-500/50 rounded-lg p-4 flex items-center justify-center text-indigo-400 bg-indigo-500/5 animate-pulse pointer-events-none">
                                Drop here to move to root level
                            </div>
                        )}
                        {invalidDragTargetId === 'root' && (
                            <div className="mt-4 border-2 border-dashed border-red-500/50 rounded-lg p-4 flex flex-col items-center justify-center text-red-400 bg-red-500/5 cursor-not-allowed pointer-events-none text-center">
                                <span>Cannot move restricted files</span>
                                <span>to root level</span>
                            </div>
                        )}
                    </div>

                    {/* AI Chat */}
                    {isFeatureEnabled('ai_assistant') && (
                        <div className="border-t border-theme-border bg-app-surface/50">
                        <button
                            onClick={() => setChatOpen(!chatOpen)}
                            className="w-full p-4 text-sm font-medium text-theme-tertiary hover:text-theme-primary hover:bg-theme-input flex justify-between items-center transition-all group"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                {t('aiAssistant') || "AI Companion"}
                            </span>
                            {chatOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} className="text-theme-tertiary group-hover:text-theme-secondary" />}
                        </button>

                        {chatOpen && (
                            <div className="bg-app-surface p-2 h-48 flex flex-col border-t border-theme-border">
                                <div className="flex-1 overflow-y-auto text-xs space-y-1">
                                    {chatMessages.map((m, i) => (
                                        <div key={i} className={m.from === "user" ? "text-indigo-400" : "text-green-400"}>
                                            <b>{m.from === "user" ? "You" : "Bot"}:</b> {m.text}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <input
                                        className="flex-1 p-2 rounded bg-theme-input text-xs text-theme-primary border border-theme-border focus:outline-none focus:border-indigo-500"
                                        placeholder="Type a command..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                                    />
                                    <button
                                        disabled={isRunningCommand}
                                        onClick={sendChatMessage}
                                        className="px-3 py-1 bg-indigo-600 rounded text-xs text-white"
                                    >
                                        {isRunningCommand ? "..." : "Send"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>
            }
        >
            {!selected ? (
                urlSelectedId ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full border-4 border-theme-border border-t-indigo-500 animate-spin"></div>
                            <p className="text-theme-tertiary text-sm font-medium">Loading process...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 h-full w-full overflow-hidden bg-transparent relative"><Dashboard onOpenCatalogue={() => setCatalogueModalOpen(true)} /></div>
                )
            ) : (
                <div className="flex-1 overflow-y-auto p-8 pb-32 custom-scrollbar relative z-10">
                    <div className="w-full max-w-[95%] mx-auto animate-fade-in">
                        {/* Breadcrumbs / Header */}
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/10">
                                    {selected.type === "folder" ? (
                                        <FolderOpen className="w-8 h-8 text-indigo-400" />
                                    ) : (
                                        <FileText className="w-8 h-8 text-blue-400" />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-light text-theme-primary tracking-tight">{selected.name}</h1>
                                    <p className="text-sm text-theme-tertiary flex items-center gap-2 mt-1">
                                        <span className="uppercase tracking-wider font-bold text-[10px] bg-theme-input px-2 py-0.5 rounded text-theme-secondary">
                                            {selected.type}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-theme-tertiary"></span>
                                        {(() => {
                                            if (selected.history && selected.history.length > 0) {
                                                const latest = [...selected.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                                                return `Updated ${new Date(latest.timestamp).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}`;
                                            }
                                            if (selected.updated_at) {
                                                return `Updated ${new Date(selected.updated_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}`;
                                            }
                                            return "Updated recently";
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {selected.type === 'file' && selected.diagram_type !== 'mining' && !isNodeRestricted(selected._id, tree) && hasEditAccess(selected) && (
                                    <button
                                        onClick={() => navigateToEditor(selected._id)}
                                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Model
                                    </button>
                                )}
                                {selected.type === 'file' && selected.diagram_type === 'mining' && hasEditAccess(selected) && (
                                    <button
                                        onClick={() => navigate(`/mining-canvas/${selected._id}`)}
                                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 text-sm font-medium"
                                    >
                                        <FlaskConical className="w-4 h-4" />
                                        Open Mining Canvas
                                    </button>
                                )}
                                {tabs.length > 0 && (
                                    <div className="flex bg-app-surface border border-theme-border rounded-lg p-1 gap-1">
                                        {tabs.map((tab, idx) => (
                                            <button
                                                key={tab}
                                                onClick={() => {
                                                    setActiveTab(idx);
                                                    setSearchParams({ id: selected._id, tab: idx });
                                                }}
                                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === idx
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                                    : "text-theme-tertiary hover:text-theme-primary hover:bg-theme-input"
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1">
                            {selected.type === "folder" ? (
                                <>
                                    {/* Folder Overview */}
                                    {activeTab === 0 && (
                                        <div className="p-6 space-y-6">
                                            {/* Folder Stats Header */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="app-card p-4 rounded-xl flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                                                        <FolderOpen size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-theme-tertiary uppercase font-bold">Contains</p>
                                                        <p className="text-xl font-bold text-theme-primary">
                                                            {(selected.children?.filter(c => c.type === 'folder').length || 0)} <span className="text-sm font-normal text-theme-tertiary">Folders</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="app-card p-4 rounded-xl flex items-center gap-4">
                                                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-theme-tertiary uppercase font-bold">Contains</p>
                                                        <p className="text-xl font-bold text-theme-primary">
                                                            {(selected.children?.filter(c => c.type === 'file').length || 0)} <span className="text-sm font-normal text-theme-tertiary">Models</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Actions Card */}
                                                {/* Actions Card */}
                                                <div className="app-card p-4 rounded-xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-theme-tertiary uppercase font-bold mb-1">Quick Actions</p>
                                                        <p className="text-xs text-theme-tertiary">Manage this folder</p>
                                                    </div>
                                                    {userRole !== 'viewer' && !isNodeRestricted(selected._id, tree) && isCreationAllowed(selected._id, tree) && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleDownloadReport}
                                                                disabled={isDownloadingReport}
                                                                className="p-2 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-primary rounded-lg transition-colors border border-theme-border flex items-center gap-2 group"
                                                                title="Download Excel Report"
                                                            >
                                                                <Download size={18} className={isDownloadingReport ? "animate-bounce" : "group-hover:translate-y-0.5 transition-transform"} />
                                                                <span className="text-xs font-medium mr-1">{isDownloadingReport ? "Generating..." : "Report"}</span>
                                                            </button>
                                                            <button onClick={() => createItem(selected._id, "folder")} className="p-2 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-primary rounded-lg transition-colors border border-theme-border" title="New Subfolder">
                                                                <FolderPlus size={18} />
                                                            </button>
                                                            <button onClick={() => createItem(selected._id, "file")} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20" title="New Process">
                                                                <FilePlus size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Folder Attachments Box */}
                                            <FolderAttachmentsBox 
                                                folderId={selected._id} 
                                                onProcessClick={(id) => {
                                                    setActiveTab(0);
                                                    setSearchParams({ id, tab: 0 });
                                                }} 
                                            />

                                            {/* About Section */}

                                        </div>
                                    )}

                                    {/* Subfolders */}
                                    {activeTab === 1 && (
                                        <div className="p-6">
                                            {selected.children?.filter((c) => c.type === "folder").length === 0 ? (
                                                <div className="text-center text-theme-tertiary mt-12 animate-fade-in">
                                                    <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p className="text-sm font-light">{t('noSubfolders')}</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                                                    {selected.children
                                                        .filter((c) => c.type === "folder")
                                                        .map((child) => (
                                                            <div
                                                                key={child._id}
                                                                onClick={() => handleSelect(child)}
                                                                className="app-glass-panel p-4 rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-theme-input/50 transition-all duration-300 group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                                                        <Folder className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                                                    </div>
                                                                    <span className="font-medium text-theme-primary truncate">{child.name}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Models */}
                                    {activeTab === 2 && (
                                        <div className="p-6">
                                            {selected.children?.filter((c) => c.type === "file").length === 0 ? (
                                                <div className="text-center text-theme-tertiary mt-12 animate-fade-in">
                                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p className="text-sm font-light">{t('noModels')}</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                                                    {selected.children
                                                        .filter((c) => c.type === "file")
                                                        .map((child) => (
                                                            <div
                                                                key={child._id}
                                                                onClick={() => handleSelect(child)}
                                                                className="app-glass-panel p-4 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-theme-input/50 transition-all duration-300 group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                                                        <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-theme-primary truncate block">{child.name}</span>
                                                                        {child.code && (
                                                                            <span className="text-[10px] text-theme-tertiary uppercase tracking-wider">{child.code}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {selected.diagram_type === "mining" ? (
                                        <>
                                            {activeTab === 0 && (
                                                <div className="flex flex-col gap-8 pb-20">
                                                    <MiningOverview processId={selected._id} onEdit={() => navigate(`/mining-canvas/${selected._id}`)} />
                                                    <div className="border-t border-theme-border/50 pt-8 mt-4">
                                                        <EditableOverview process={selected} onUpdate={load} />
                                                    </div>
                                                </div>
                                            )}
                                            {activeTab === 1 && <TableView process={selected} orgName={orgName} logoUrl={logoUrl} />}
                                            {activeTab === 2 && <HistoryView process={selected} />}
                                            {activeTab === 3 && <InsightsView process={selected} />}
                                        </>
                                    ) : (
                                        <>
                                            {/* Diagram - Now Tab 0 */}
                                            {activeTab === 0 && (
                                                <div className="p-6">
                                                    <div className="bg-gray-800 rounded-lg h-[600px] overflow-hidden">
                                                        <EPCPreview model={selected} logoUrl={logoUrl} orgName={orgName} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* File Overview - Now Tab 1 */}
                                            {activeTab === 1 && (
                                                <EditableOverview process={selected} onUpdate={load} />
                                            )}

                                            {/* Table - Now Tab 2 */}
                                            {activeTab === 2 && (
                                                <TableView
                                                    process={selected}
                                                    orgName={orgName}
                                                    logoUrl={logoUrl}
                                                />
                                            )}

                                            {/* History - Now Tab 3 */}
                                            {activeTab === 3 && (
                                                <div className="p-6">
                                                    <HistoryView process={selected} />
                                                </div>
                                            )}

                                            {/* Insights - Now Tab 4 */}
                                            {activeTab === 4 && (
                                                <div className="px-6 pb-6">
                                                    <InsightsView process={selected} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* DESCRIPTION MODAL */}
            {/* DESCRIPTION MODAL */}
            {descriptionModal.show && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDescriptionModal({ show: false, nodeId: null, currentDesc: '', type: 'process' })}>
                    <div className="app-glass-panel p-6 rounded-xl w-96 shadow-2xl border border-theme-border animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-theme-primary mb-4">Edit Description</h3>
                        <textarea
                            autoFocus
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            className="w-full bg-theme-input border border-theme-border rounded-lg p-3 text-theme-primary mb-6 focus:outline-none focus:border-indigo-500/50 min-h-[100px] resize-none overflow-hidden"
                            placeholder="Enter description..."
                            value={descriptionModal.currentDesc}
                            onChange={(e) => {
                                setDescriptionModal({ ...descriptionModal, currentDesc: e.target.value });
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDescriptionModal({ show: false, nodeId: null, currentDesc: '', type: 'process' })}
                                className="px-4 py-2 text-sm text-theme-tertiary hover:text-theme-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDescriptionConfirm(descriptionModal.currentDesc)}
                                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* CONTEXT MENU */}
            {contextMenu.visible && createPortal(
                <div
                    className="fixed z-[9999] app-glass-panel border border-theme-border rounded-xl shadow-2xl py-2 w-48 animate-scale-in origin-top-left backdrop-blur-xl"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-theme-border mb-1">
                        <p className="text-xs font-bold text-theme-tertiary uppercase tracking-wider">{contextMenu.node?.name}</p>
                    </div>

                    <button
                        onClick={() => {
                            togglePin(contextMenu.node._id);
                            setContextMenu({ ...contextMenu, visible: false });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-input hover:text-theme-primary flex items-center gap-2 transition-colors"
                    >
                        {pinnedItems.includes(contextMenu.node._id) ? (
                            <>
                                <PinOff className="w-4 h-4" /> Unpin from Home
                            </>
                        ) : (
                            <>
                                <Pin className="w-4 h-4" /> Pin to Home
                            </>
                        )}
                    </button>

                    {/* Share Access for Admins (Only for User-Created Content) */}
                    {(userRole === 'admin' || userRole === 'superadmin') && !contextMenu.node?.is_system && (
                        <button
                            onClick={() => {
                                console.log("Share Access clicked", contextMenu.node);
                                setShareModal({ show: true, node: contextMenu.node });
                                setContextMenu({ ...contextMenu, visible: false });
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-input hover:text-theme-primary flex items-center gap-2 transition-colors mb-1"
                        >
                            <User className="w-4 h-4" />
                            Share Access
                        </button>
                    )}

                    {hasEditAccess(contextMenu.node) && (
                        <>
                            <button
                                onClick={() => {
                                    setDeleteModal({ show: true, nodeId: contextMenu.node._id, nodeName: contextMenu.node.name });
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('delete')}
                            </button>

                            <button
                                onClick={() => {
                                    setRenameModal({ show: true, nodeId: contextMenu.node._id, currentName: contextMenu.node.name });
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-input hover:text-theme-primary flex items-center gap-2 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                {t('rename')}
                            </button>
                        </>
                    )}

                    {contextMenu.node?.type === "folder" && !isNodeRestricted(contextMenu.node._id, tree) && isCreationAllowed(contextMenu.node._id, tree) && canCreateContent(contextMenu.node) && (
                        <div className="mt-1 pt-1 border-t border-theme-border">
                            <button
                                onClick={() => {
                                    createItem(contextMenu.node._id, "folder");
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-input hover:text-theme-primary flex items-center gap-2 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4" />
                                New Folder
                            </button>
                            <button
                                onClick={() => {
                                    createItem(contextMenu.node._id, "file");
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-theme-input hover:text-theme-primary flex items-center gap-2 transition-colors"
                            >
                                <FilePlus className="w-4 h-4" />
                                New Process
                            </button>
                        </div>
                    )}
                </div>,
                document.body
            )}

            {/* CREATE MODAL */}
            {
                createModal.show && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setCreateModal({ show: false, parentId: null, type: 'folder' })}>
                        <div className="bg-app-surface border border-theme-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-theme-border">
                                <h2 className="text-xl font-bold text-theme-primary">
                                    {createModal.type === 'folder' ? t('addSubfolder') : t('addModel')}
                                </h2>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-theme-tertiary mb-2">
                                    {createModal.type === 'folder' ? 'Folder Name' : 'Model Name'}
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder={`Enter ${createModal.type === 'folder' ? 'folder' : 'model'} name...`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateConfirm(e.target.value);
                                        } else if (e.key === 'Escape') {
                                            setCreateModal({ show: false, parentId: null, type: 'folder' });
                                        }
                                    }}
                                />

                                {/* Department Selector */}
                                {(departments.length > 0 || userAllowedDepts.length > 0) && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-theme-tertiary mb-2">
                                            Department (Optional)
                                        </label>
                                        <select
                                            value={selectedDeptId}
                                            onChange={(e) => setSelectedDeptId(e.target.value)}
                                            className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="">None</option>
                                            {/* If user has specific allowed departments, show only those. Otherwise show all. */}
                                            {(userAllowedDepts.length > 0 ? userAllowedDepts : departments).map(dept => (
                                                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Level Selector (Only for Model) */}
                                {createModal.type === 'file' && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-theme-tertiary mb-2">
                                            Process Level (Optional)
                                        </label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(lvl => {
                                                // Check if user is allowed to select this level
                                                const isAllowed = (userRole === 'admin' || userRole === 'superadmin' || userRole === 'manager' || userRole === 'system_admin' || accessLevel === 'editor')
                                                    || (userAllowedLevels.length === 0 || userAllowedLevels.includes(lvl));

                                                if (!isAllowed) return null;

                                                return (
                                                    <button
                                                        key={lvl}
                                                        onClick={() => setSelectedLevel(selectedLevel === lvl ? "" : lvl)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedLevel === lvl
                                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                                                            : 'bg-theme-input text-theme-secondary border-theme-border hover:border-theme-secondary'
                                                            }`}
                                                    >
                                                        Level {lvl}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {createModal.error && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in">
                                        <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            {createModal.error}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setCreateModal({ show: false, parentId: null, type: 'folder', error: '' })}
                                        className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-input rounded-lg transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            const input = e.target.closest('.bg-app-surface').querySelector('input');
                                            handleCreateConfirm(input.value);
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* RENAME MODAL */}
            {
                renameModal.show && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setRenameModal({ show: false, nodeId: null, currentName: '' })}>
                        <div className="bg-app-surface border border-theme-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-theme-border">
                                <h2 className="text-xl font-bold text-theme-primary">Rename</h2>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-theme-tertiary mb-2">
                                    New Name
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    defaultValue={renameModal.currentName}
                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="Enter new name..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRenameConfirm(e.target.value);
                                        } else if (e.key === 'Escape') {
                                            setRenameModal({ show: false, nodeId: null, currentName: '' });
                                        }
                                    }}
                                />
                                {renameModal.error && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in">
                                        <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            {renameModal.error}
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setRenameModal({ show: false, nodeId: null, currentName: '', error: '' })}
                                        className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-input rounded-lg transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            const input = e.target.closest('.bg-app-surface').querySelector('input');
                                            handleRenameConfirm(input.value);
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Rename
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DELETE CONFIRMATION MODAL */}
            {
                deleteModal.show && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setDeleteModal({ show: false, nodeId: null, nodeName: '' })}>
                        <div className="bg-app-surface border border-theme-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 text-red-500 mb-4">
                                    <Trash2 className="w-8 h-8" />
                                    <h2 className="text-xl font-bold text-theme-primary">Confirm Delete</h2>
                                </div>
                                <p className="text-theme-tertiary mb-6">
                                    Are you sure you want to delete <span className="text-theme-primary font-semibold">"{deleteModal.nodeName}"</span>? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setDeleteModal({ show: false, nodeId: null, nodeName: '' })}
                                        className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-input rounded-lg transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={handleDeleteConfirm}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Version Changelog Modal */}
            <VersionChangelogModal
                isOpen={selectedChangelog !== null}
                onClose={() => setSelectedChangelog(null)}
                versionChanges={selectedChangelog?.version_changes}
                processId={selectedChangelog?._id}
            />

            {/* Process Catalogue Modal */}
            <ProcessCatalogueModal
                isOpen={catalogueModalOpen}
                onClose={() => setCatalogueModalOpen(false)}
                tree={tree}
                navigateToEditor={navigateToEditor}
                departments={departments}
                orgAttributes={orgAttributes}
            />

            {/* Share Modal */}
            <ShareModal
                isOpen={shareModal.show}
                onClose={() => setShareModal({ show: false, node: null })}
                process={shareModal.node}
                onSave={(users) => {
                    setShareModal({ show: false, node: null });
                }}
            />
        </MainLayout>
    );
}

