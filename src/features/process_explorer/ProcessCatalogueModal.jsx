import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, ArrowRight, LayoutGrid, FileText, Target, Filter, ArrowUp, ArrowDown, ChevronDown, Check, Columns, Settings2, Download, FileSpreadsheet, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useAuthStore from "../../store/logic/user";

export default function ProcessCatalogueModal({ show, isOpen, onClose, tree, navigateToEditor, departments = [], orgAttributes = [] }) {
    const isVisible = show || isOpen;
    const governanceEnabled = useAuthStore((state) => state.isFeatureEnabled('governance'));

    const [step, setStep] = useState("select"); // 'select' | 'table'
    const [scope, setScope] = useState(null); // 'As-Is' | 'To-Be'
    const [search, setSearch] = useState("");

    // Filter & Sort State
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterLevel, setFilterLevel] = useState(""); // Changed default to empty string for text input
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" }); // Default sort by newest

    const [catalogueAttributes, setCatalogueAttributes] = useState({});
    const [attrFilter, setAttrFilter] = useState({ id: 'All', value: '' });

    // UI State
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterMenuRef = useRef(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef(null);
    const [showColumnsMenu, setShowColumnsMenu] = useState(false);
    const columnsMenuRef = useRef(null);

    // Column Visibility — 'status' hidden when governance (workflow) feature is disabled
    const [visibleColumns, setVisibleColumns] = useState({
        division: true,
        department: true,
        level: true,
        name: true,
        owner: true,
        description: true,
        status: governanceEnabled,
        updated_at: true
    });

    const [orderedColumns, setOrderedColumns] = useState([
        { key: 'division', label: 'Division', width: 'w-32', sortable: true },
        { key: 'department', label: 'Department', width: 'w-40', sortable: true },
        { key: 'level', label: 'Level', width: 'w-24', align: 'text-center', sortable: true },
        { key: 'name', label: 'Process Name', width: 'min-w-[200px]', sortable: true },
        { key: 'owner', label: 'Owner', width: 'w-40', sortable: true },
        { key: 'description', label: 'Description', width: 'min-w-[250px]', sortable: false },
        { key: 'status', label: 'Status', width: 'w-28', sortable: true },
        { key: 'updated_at', label: 'Date', width: 'w-32', sortable: true },
    ]);

    const [draggedColKey, setDraggedColKey] = useState(null);
    const [dragOverColKey, setDragOverColKey] = useState(null);

    const handleColumnDragStart = (e, key) => {
        setDraggedColKey(key);
        e.dataTransfer.effectAllowed = "move";
        // Create a transparent drag image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleColumnDragOver = (e, targetKey) => {
        e.preventDefault();
        if (draggedColKey === targetKey) return;
        setDragOverColKey(targetKey);
    };

    const handleColumnDrop = (e, targetKey) => {
        e.preventDefault();
        if (draggedColKey === targetKey) {
            setDraggedColKey(null);
            setDragOverColKey(null);
            return;
        }

        const newOrder = [...orderedColumns];
        const draggedIdx = newOrder.findIndex(c => c.key === draggedColKey);
        const targetIdx = newOrder.findIndex(c => c.key === targetKey);

        const [removed] = newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, removed);

        setOrderedColumns(newOrder);
        setDraggedColKey(null);
        setDragOverColKey(null);
    };

    // Debug log
    console.log("Modal Render:", { show, step, scope, treeLength: tree?.length });

    // Handle click outside to close filter menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
                setShowFilterMenu(false);
            }
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
                setShowDownloadMenu(false);
            }
            if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target)) {
                setShowColumnsMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            fetchCatalogueAttributes();
        }
    }, [isVisible]);

    const fetchCatalogueAttributes = async () => {
        const user = useAuthStore.getState().user;
        const orgId = user?.organization_id;
        if (!orgId) return;

        try {
            const api = (await import("../../services/api_service")).default;
            const res = await api.get(`/admin/organizations/${orgId}/catalogue-attributes`);
            setCatalogueAttributes(res.data);
        } catch (error) {
            console.error("Failed to fetch catalogue attributes", error);
        }
    };

    const handleScopeSelect = (selectedScope) => {
        setScope(selectedScope);
        setStep("table");
    };

    const handleClose = () => {
        setStep("select");
        setScope(null);
        setSearch("");
        setFilterStatus("All");
        setFilterLevel("");
        setAttrFilter({ id: 'All', value: '' });
        setSortConfig({ key: "date", direction: "desc" });
        setShowFilterMenu(false);
        setShowDownloadMenu(false);
        setShowColumnsMenu(false);
        // Reset columns — respect governance flag on reset
        setVisibleColumns({
            division: true,
            department: true,
            level: true,
            name: true,
            owner: true,
            description: true,
            status: governanceEnabled,
            updated_at: true
        });
        onClose();
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (key) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Flatten logic
    const flattenedData = useMemo(() => {
        // Safety check to ensure tree is array
        if (!tree || !Array.isArray(tree) || !scope) return [];

        const rows = [];

        // Find the root node for the scope (As-Is or To-Be)
        const rootNode = tree.find(n => n.name === scope);

        if (!rootNode) return [];

        const traverse = (node, path = []) => {
            if (node.type === "file") {
                // Infer columns
                const reversedPath = [...path].reverse();

                // Division: Parent Folder
                const division = reversedPath[0]?.name || "-";

                // Department: Map from ID
                let department = "-";
                if (node.department_id) {
                    const foundDept = departments.find(d => String(d._id || d.id) === String(node.department_id));
                    if (foundDept) department = foundDept.name;
                }

                rows.push({
                    id: node._id,
                    division,
                    department,
                    level: node.process_level || "-",
                    name: node.name,
                    description: node.description || "",
                    owner: node.process_owner || "-",
                    status: node.status || "Draft",
                    // Keep raw date for sorting, format for display
                    updated_at: node.updated_at || node.created_at,
                    formattedDate: new Date(node.updated_at || node.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
                    node: node
                });
            } else if (node.children) {
                node.children.forEach(child => traverse(child, [...path, node]));
            }
        };

        if (rootNode.children) {
            rootNode.children.forEach(child => traverse(child, [rootNode]));
        }

        return rows;
    }, [tree, scope, departments]);

    const processedRows = useMemo(() => {
        let data = [...flattenedData];

        // 1. Filter
        data = data.filter(row => {
            const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase()) ||
                row.description.toLowerCase().includes(search.toLowerCase()) ||
                row.owner.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = filterStatus === "All" || row.status === filterStatus;
            const matchesLevel = filterLevel === "" || row.level.toString().toLowerCase().includes(filterLevel.toLowerCase());

            // 1.1 Custom Attribute Filter
            let matchesAttr = true;
            if (attrFilter.id !== 'All') {
                const procAttrData = catalogueAttributes[row.id] || {};
                const attrValues = procAttrData[attrFilter.id] || [];

                // Check if it's diagram-specific and if it belongs to this process
                const attrDef = orgAttributes.find(a => a.id === attrFilter.id);
                if (attrDef?.is_diagram_specific) {
                    if (attrDef.process_id !== row.id) {
                        matchesAttr = false;
                    }
                }

                if (matchesAttr) {
                    if (attrFilter.value.trim() === "") {
                        // If no value specified, just check if the attribute exists on any node in this process
                        matchesAttr = attrValues.length > 0;
                    } else {
                        // Check if any node has the value (case-insensitive contains)
                        matchesAttr = attrValues.some(v =>
                            String(v).toLowerCase().includes(attrFilter.value.toLowerCase())
                        );
                    }
                }
            }

            return matchesSearch && matchesStatus && matchesLevel && matchesAttr;
        });

        // 2. Sort
        data.sort((a, b) => {
            if (!sortConfig.key) return 0;

            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Handle "-" as lowest priority usually, or just string compare
            if (valA === "-") valA = "";
            if (valB === "-") valB = "";

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [flattenedData, search, filterStatus, filterLevel, sortConfig, attrFilter, catalogueAttributes, orgAttributes]);

    const handleExportCSV = () => {
        const activeColumns = orderedColumns.filter(col => visibleColumns[col.key]);
        const headers = activeColumns.map(col => col.label).join(",");
        const rows = processedRows.map(row => {
            return activeColumns.map(col => {
                let cellData = row[col.key] || "";
                if (col.key === 'updated_at') cellData = row.formattedDate;
                // Escape quotes and wrap in quotes for CSV safety
                const stringData = String(cellData).replace(/"/g, '""');
                return `"${stringData}"`;
            }).join(",");
        }).join("\n");

        const user = useAuthStore.getState().user;
        const userName = user?.name || "Unknown";
        const userRole = user?.role || "Unknown";
        const generationDateStr = new Date().toLocaleString();

        const reportInfo = `"Report Name:","Process Catalogue - ${scope}"\n"Generated By:","${userName}"\n"Role:","${userRole}"\n"Generated Date:","${generationDateStr}"\n\n`;
        const csvContent = `${reportInfo}${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `process_catalogue_${scope}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        const activeColumns = orderedColumns.filter(col => visibleColumns[col.key]);
        // Prepare data for Excel
        const exportData = processedRows.map(row => {
            const rowData = {};
            activeColumns.forEach(col => {
                let cellData = row[col.key] || "";
                if (col.key === 'updated_at') cellData = row.formattedDate;
                rowData[col.label] = cellData;
            });
            return rowData;
        });

        // Create workbook and worksheet
        const wb = utils.book_new();
        const ws = utils.json_to_sheet(exportData, { origin: "A6" });

        const user = useAuthStore.getState().user;
        const userName = user?.name || "Unknown";
        const userRole = user?.role || "Unknown";
        const generationDateStr = new Date().toLocaleString();

        // Add header info explicitly
        utils.sheet_add_aoa(ws, [
            ["Report Name:", `Process Catalogue - ${scope}`],
            ["Generated By:", userName],
            ["Role:", userRole],
            ["Generated Date:", generationDateStr]
        ], { origin: "A1" });

        // Adjust column widths (auto-width roughly)
        const colWidths = activeColumns.map(col => ({ wch: 20 })); // Default width
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, "Processes");

        // Generate file
        writeFile(wb, `process_catalogue_${scope}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Get Logo
        const logoUrl = localStorage.getItem('org_logo_url');
        const orgName = localStorage.getItem('org_name') || 'Organization';
        const logoImg = new Image();

        // If logo exists, try to load it. Otherwise just generate text.
        if (logoUrl) {
            logoImg.crossOrigin = "Anonymous";
            logoImg.src = logoUrl.startsWith('http') ? logoUrl : `${window.location.protocol}//${window.location.host}${logoUrl}`;

            logoImg.onload = () => {
                const imgWidth = 30;
                const imgHeight = (logoImg.height * imgWidth) / logoImg.width;
                const pageWidth = doc.internal.pageSize.getWidth();
                const x = (pageWidth - imgWidth) / 2;

                try {
                    doc.addImage(logoImg, 'PNG', x, 10, imgWidth, imgHeight);
                    generatePDFContent(doc, imgHeight + 20);
                } catch (e) {
                    console.warn("Could not add logo to PDF", e);
                    generatePDFContent(doc, 20);
                }
            };

            logoImg.onerror = () => {
                generatePDFContent(doc, 20);
            };
        } else {
            generatePDFContent(doc, 20);
        }
    };

    const generatePDFContent = (doc, startY) => {
        const user = useAuthStore.getState().user;
        const userName = user?.name || "Unknown";
        const userRole = user?.role || "Unknown";

        // Add Title (Centered, Smaller Font)
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(14); // Reduced from 18
        doc.text(`Process Catalogue - ${scope}`, pageWidth / 2, startY, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, startY + 6, { align: 'center' });

        doc.setFontSize(9);
        doc.text(`Generated By: ${userName}`, pageWidth / 2, startY + 12, { align: 'center' });
        doc.text(`Role: ${userRole}`, pageWidth / 2, startY + 17, { align: 'center' });

        // Prepare Data
        const activeColumns = orderedColumns.filter(col => visibleColumns[col.key]);
        const tableColumn = activeColumns.map(col => col.label);
        const tableRows = processedRows.map(row => {
            return activeColumns.map(col => {
                let cellData = row[col.key] || "";
                if (col.key === 'updated_at') cellData = row.formattedDate;
                return cellData;
            });
        });

        // Generate Table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY + 22,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
            headStyles: { fillColor: [79, 70, 229], halign: 'center' }, // Indigo-600
        });

        doc.save(`process_catalogue_${scope}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (!isVisible) return null;

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ChevronDown size={14} className="opacity-30 ml-2" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-indigo-400 ml-2" />
            : <ArrowDown size={14} className="text-indigo-400 ml-2" />;
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-theme-surface w-full max-w-7xl h-[90vh] rounded-2xl border border-theme-border shadow-2xl flex flex-col overflow-hidden text-theme-primary relative">
                {/* Decorative Background Gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

                {/* Header */}
                <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-surface/50 backdrop-blur-xl z-10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <LayoutGrid size={24} className="text-indigo-400" />
                            </div>
                            <span className="bg-clip-text text-theme-primary font-bold">
                                Process Catalogue
                            </span>
                            {scope && (
                                <>
                                    <span className="text-neutral-600 text-lg">/</span>
                                    <span className="text-indigo-300 text-lg font-medium">{scope}</span>
                                </>
                            )}
                        </h2>
                        <p className="text-theme-secondary text-sm mt-1 ml-12">
                            {step === 'select'
                                ? "Select the environment scope to view processes"
                                : `Viewing all processes in ${scope} environment`}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-theme-bg-tertiary rounded-full transition-colors text-theme-tertiary hover:text-theme-primary"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative z-10">
                    {step === 'select' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full items-center max-w-5xl mx-auto p-12">
                            <button
                                onClick={() => handleScopeSelect('As-Is')}
                                className="group relative p-10 rounded-3xl bg-theme-surface border border-theme-border hover:border-indigo-500/50 hover:bg-theme-bg-tertiary transition-all text-left flex flex-col gap-6 h-80 justify-center hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] shadow-lg"
                            >
                                <div className="p-5 rounded-2xl bg-indigo-500/20 w-fit group-hover:scale-110 transition-transform shadow-inner border border-indigo-500/20">
                                    <FileText size={40} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold mb-3 text-theme-primary group-hover:text-indigo-400 transition-colors">As-Is Processes</h3>
                                    <p className="text-theme-secondary text-lg">View currently implemented processes and their documentation.</p>
                                </div>
                                <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-4 group-hover:translate-x-0">
                                    <ArrowRight className="text-indigo-400 w-8 h-8" />
                                </div>
                            </button>

                            {/* To-Be Card */}
                            <button
                                onClick={() => handleScopeSelect('To-Be')}
                                className="group relative p-10 rounded-3xl bg-theme-surface border border-theme-border hover:border-emerald-500/50 hover:bg-theme-bg-tertiary transition-all text-left flex flex-col gap-6 h-80 justify-center hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] shadow-lg"
                            >
                                <div className="p-5 rounded-2xl bg-emerald-500/20 w-fit group-hover:scale-110 transition-transform shadow-inner border border-emerald-500/20">
                                    <Target size={40} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold mb-3 text-theme-primary group-hover:text-emerald-400 transition-colors">To-Be Processes</h3>
                                    <p className="text-theme-secondary text-lg">Explore proposed future state processes and improvements.</p>
                                </div>
                                <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-4 group-hover:translate-x-0">
                                    <ArrowRight className="text-emerald-400 w-8 h-8" />
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Toolbar */}
                            <div className="flex gap-4 p-4 px-6 border-b border-theme-border bg-theme-bg-tertiary/20 flex-wrap items-center">
                                {/* Search */}
                                <div className="relative w-72 group flex-shrink-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary group-focus-within:text-indigo-400 transition-colors" size={18} />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search processes..."
                                        className="w-full bg-theme-input border border-theme-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-theme-tertiary"
                                    />
                                </div>



                                <div className="flex-1"></div>

                                {/* Consolidated Filter Button & Menu */}
                                <div className="relative" ref={filterMenuRef}>
                                    <button
                                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${showFilterMenu || filterStatus !== 'All' || filterLevel !== 'All'
                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50'
                                            : 'bg-theme-input text-theme-secondary border-theme-border hover:bg-theme-bg-tertiary hover:text-theme-primary'
                                            }`}
                                    >
                                        <Settings2 size={18} />
                                        <span>Filters & View</span>
                                        {(filterStatus !== 'All' || filterLevel !== '' || attrFilter.id !== 'All') && (
                                            <div className="ml-1 w-2 h-2 rounded-full bg-indigo-500"></div>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {showFilterMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute right-0 top-full mt-2 w-80 bg-theme-surface border border-theme-border rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
                                            >
                                                {/* Heading */}
                                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-border">
                                                    <h4 className="font-semibold text-theme-primary">View Settings</h4>
                                                    <button onClick={() => {
                                                        setFilterStatus("All");
                                                        setFilterLevel("");
                                                        setAttrFilter({ id: 'All', value: '' });
                                                        setVisibleColumns(Object.fromEntries(orderedColumns.map(c => [c.key, true])));
                                                    }} className="text-xs text-indigo-400 hover:text-indigo-300">
                                                        Reset Defaults
                                                    </button>
                                                </div>

                                                <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                                    {/* Section: Filters */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider flex items-center gap-2">
                                                            <Filter size={12} /> Filtering
                                                        </h5>

                                                        {/* Status filter — only shown when governance (workflow) is enabled */}
                                                        {governanceEnabled && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs text-theme-secondary block ml-1">Process Status</label>
                                                            <select
                                                                value={filterStatus}
                                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50"
                                                            >
                                                                <option value="All">All Statuses</option>
                                                                <option value="Draft">Draft</option>
                                                                <option value="In Review">In Review</option>
                                                                <option value="Approved">Approved</option>
                                                            </select>
                                                        </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <label className="text-xs text-theme-secondary block ml-1">Process Level</label>
                                                            <input
                                                                type="text"
                                                                value={filterLevel}
                                                                onChange={(e) => setFilterLevel(e.target.value)}
                                                                placeholder="e.g. 1, 2, L1..."
                                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 placeholder:text-theme-tertiary"
                                                            />
                                                        </div>

                                                        {/* Section: Custom Attributes */}
                                                        <div className="pt-4 border-t border-theme-border space-y-3">
                                                            <h5 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider flex items-center gap-2">
                                                                <Database size={12} /> Node Attributes
                                                            </h5>

                                                            <div className="space-y-2">
                                                                <label className="text-xs text-theme-secondary block ml-1">Attribute Name</label>
                                                                <select
                                                                    value={attrFilter.id}
                                                                    onChange={(e) => setAttrFilter({ id: e.target.value, value: '' })}
                                                                    className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50"
                                                                >
                                                                    <option value="All">No Attribute Filter</option>
                                                                    {orgAttributes
                                                                        .filter(a => a.is_active)
                                                                        .map(attr => (
                                                                            <option key={attr.id} value={attr.id}>
                                                                                {attr.name} {attr.is_diagram_specific ? `(Diagram Specific)` : ''}
                                                                            </option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>

                                                            {attrFilter.id !== 'All' && (() => {
                                                                const attrDef = orgAttributes.find(a => a.id === attrFilter.id);
                                                                const commonClasses = "w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-indigo-500/50 transition-all";

                                                                if (attrDef?.type === 'Boolean') {
                                                                    return (
                                                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                            <label className="text-xs text-theme-secondary block ml-1">Select Status</label>
                                                                            <select
                                                                                value={attrFilter.value}
                                                                                onChange={(e) => setAttrFilter(prev => ({ ...prev, value: e.target.value }))}
                                                                                className={commonClasses}
                                                                            >
                                                                                <option value="">Any</option>
                                                                                <option value="true">Yes / True</option>
                                                                                <option value="false">No / False</option>
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (attrDef?.type === 'List' && attrDef.options?.length > 0) {
                                                                    return (
                                                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                            <label className="text-xs text-theme-secondary block ml-1">Select Option</label>
                                                                            <select
                                                                                value={attrFilter.value}
                                                                                onChange={(e) => setAttrFilter(prev => ({ ...prev, value: e.target.value }))}
                                                                                className={commonClasses}
                                                                            >
                                                                                <option value="">Any</option>
                                                                                {attrDef.options.map(opt => (
                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (attrDef?.type === 'Dictionary' && attrDef.options?.length > 0) {
                                                                    // For Dictionary, options usually contains the label or key
                                                                    return (
                                                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                            <label className="text-xs text-theme-secondary block ml-1">Select Item</label>
                                                                            <select
                                                                                value={attrFilter.value}
                                                                                onChange={(e) => setAttrFilter(prev => ({ ...prev, value: e.target.value }))}
                                                                                className={commonClasses}
                                                                            >
                                                                                <option value="">Any</option>
                                                                                {attrDef.options.map(opt => (
                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (attrDef?.type === 'Date') {
                                                                    return (
                                                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                            <label className="text-xs text-theme-secondary block ml-1">Select Date</label>
                                                                            <input
                                                                                type="date"
                                                                                value={attrFilter.value}
                                                                                onChange={(e) => setAttrFilter(prev => ({ ...prev, value: e.target.value }))}
                                                                                className={commonClasses}
                                                                            />
                                                                        </div>
                                                                    );
                                                                }

                                                                // Default to text search
                                                                return (
                                                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                        <label className="text-xs text-theme-secondary block ml-1">Contains Value</label>
                                                                        <input
                                                                            type="text"
                                                                            value={attrFilter.value}
                                                                            onChange={(e) => setAttrFilter(prev => ({ ...prev, value: e.target.value }))}
                                                                            placeholder="Search value..."
                                                                            className={commonClasses}
                                                                        />
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Columns Menu */}
                                <div className="relative" ref={columnsMenuRef}>
                                    <button
                                        onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-input text-theme-secondary border border-theme-border hover:bg-theme-bg-tertiary hover:text-theme-primary transition-all text-sm font-medium"
                                    >
                                        <Columns size={18} />
                                        <span>Visible Columns</span>
                                        <ChevronDown size={14} className={`transition-transform ${showColumnsMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showColumnsMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute right-0 top-full mt-2 w-64 bg-theme-surface border border-theme-border rounded-xl shadow-2xl p-4 z-50 overflow-hidden"
                                            >
                                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-border">
                                                    <h4 className="font-semibold text-theme-primary text-sm flex items-center gap-2">
                                                        <Columns size={14} /> Visible Columns
                                                    </h4>
                                                    <button onClick={() => {
                                                        setVisibleColumns(Object.fromEntries(orderedColumns.map(c => [c.key, true])));
                                                    }} className="text-xs text-indigo-400 hover:text-indigo-300">
                                                        Show All
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3">
                                                    {orderedColumns
                                                        .filter(col => governanceEnabled || col.key !== 'status')
                                                        .map(col => (
                                                        <label key={col.key} className="flex items-center gap-3 py-1.5 px-2 hover:bg-theme-bg-tertiary rounded-lg cursor-pointer group transition-colors">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${visibleColumns[col.key] ? 'bg-indigo-500 border-indigo-500' : 'border-theme-tertiary bg-transparent'}`}>
                                                                {visibleColumns[col.key] && <Check size={10} className="text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={visibleColumns[col.key]}
                                                                onChange={() => toggleColumn(col.key)}
                                                            />
                                                            <span className="text-xs text-theme-secondary truncate">{col.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>



                                <div className="flex gap-2 border-l border-theme-border pl-4 ml-2 relative" ref={downloadMenuRef}>
                                    <button
                                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-input text-theme-secondary border border-theme-border hover:bg-theme-bg-tertiary hover:text-theme-primary transition-all text-sm font-medium"
                                    >
                                        <Download size={18} />
                                        <span>Download</span>
                                        <ChevronDown size={14} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showDownloadMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-theme-surface border border-theme-border rounded-xl shadow-2xl p-1 z-50 overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => { handleExportPDF(); setShowDownloadMenu(false); }}
                                                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="p-1.5 bg-red-500/10 rounded-md text-red-500">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span>PDF Document</span>
                                                </button>
                                                <button
                                                    onClick={() => { handleExportExcel(); setShowDownloadMenu(false); }}
                                                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-500">
                                                        <FileSpreadsheet size={16} />
                                                    </div>
                                                    <span>Excel Sheet</span>
                                                </button>
                                                <button
                                                    onClick={() => { handleExportCSV(); setShowDownloadMenu(false); }}
                                                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-500">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span>CSV File</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="w-px h-8 bg-theme-border mx-2"></div>

                                <button
                                    onClick={() => { setStep('select'); setScope(null); }}
                                    className="px-4 py-2 rounded-lg text-sm text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary transition-colors border border-transparent hover:border-theme-border"
                                >
                                    Change Scope
                                </button>
                            </div>

                            {/* Table Container - Ensure flex-1 and overflow-hidden specifically for this area */}
                            <div className="flex-1 overflow-hidden p-6 relative">
                                <div className="absolute inset-x-6 inset-y-6 rounded-xl border border-theme-border overflow-auto custom-scrollbar bg-theme-surface/50">
                                    <table className="w-full text-left text-sm text-theme-secondary">
                                        <thead className="bg-theme-surface text-theme-tertiary sticky top-0 z-20 font-medium border-b border-theme-border">
                                            <tr className="relative">
                                                {orderedColumns.map((col, idx) => (
                                                    visibleColumns[col.key] && (
                                                        <th
                                                            key={col.key}
                                                            draggable
                                                            onDragStart={(e) => handleColumnDragStart(e, col.key)}
                                                            onDragOver={(e) => handleColumnDragOver(e, col.key)}
                                                            onDrop={(e) => handleColumnDrop(e, col.key)}
                                                            onClick={() => col.sortable && handleSort(col.key)}
                                                            className={`p-4 font-semibold ${col.width} ${col.align || ''} cursor-grab active:cursor-grabbing hover:bg-theme-bg-tertiary hover:text-theme-primary transition-all select-none group relative
                                                                ${draggedColKey === col.key ? 'opacity-30' : ''}
                                                                ${dragOverColKey === col.key ? 'border-l-2 border-indigo-500' : ''}
                                                            `}
                                                        >
                                                            <div className={`flex items-center ${col.align === 'text-center' ? 'justify-center' : ''}`}>
                                                                {col.label}
                                                                {col.sortable && <SortIcon column={col.key} />}
                                                            </div>

                                                            {/* Drag Handle Indicator */}
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-30 transition-opacity">
                                                                <LayoutGrid size={10} />
                                                            </div>
                                                        </th>
                                                    )
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {processedRows.length > 0 ? (
                                                processedRows.map((row, rowIdx) => (
                                                    <tr
                                                        key={row.id}
                                                        onClick={() => navigateToEditor(row.id)}
                                                        className="border-b border-theme-border/50 hover:bg-theme-bg-tertiary/30 cursor-pointer transition-colors group animate-slide-up-fade"
                                                        style={{ animationDelay: `${rowIdx * 30}ms` }}
                                                    >
                                                        {orderedColumns.map(col => (
                                                            visibleColumns[col.key] && (
                                                                <td key={col.key} className={`p-4 ${col.align || ''}`}>
                                                                    {(() => {
                                                                        if (col.key === 'status') {
                                                                            return (
                                                                                <div className={`px-2 py-1 rounded-md text-xs border w-fit font-medium ${row.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                                    row.status === 'In Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                                        'bg-theme-bg-tertiary text-theme-tertiary border-theme-border'
                                                                                    }`}>
                                                                                    {row.status}
                                                                                </div>
                                                                            );
                                                                        }
                                                                        if (col.key === 'updated_at') {
                                                                            return <span className="text-theme-tertiary font-mono text-xs">{row.formattedDate}</span>;
                                                                        }
                                                                        if (col.key === 'name') {
                                                                            return <span className="font-medium text-indigo-400 group-hover:text-indigo-500 transition-colors">{row.name}</span>;
                                                                        }
                                                                        if (col.key === 'description') {
                                                                            return <span className="text-theme-tertiary truncate max-w-xs">{row.description || "-"}</span>;
                                                                        }
                                                                        if (col.key === 'level') {
                                                                            return (
                                                                                <span className={`px-2 py-1 rounded-md text-xs font-mono border border-theme-border ${row.level !== '-' ? 'bg-indigo-500/10 text-indigo-400' : 'text-theme-tertiary bg-theme-bg-tertiary'}`}>
                                                                                    {row.level}
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return <span className="text-theme-secondary">{row[col.key] || "-"}</span>;
                                                                    })()}
                                                                </td>
                                                            )
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={orderedColumns.filter(c => visibleColumns[c.key]).length} className="p-24 text-center text-theme-tertiary">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Search size={48} className="text-theme-tertiary/50" />
                                                            <p className="text-lg font-medium">No processes found</p>
                                                            <p className="text-sm">Try adjusting your filters or search</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Stats */}
                                <div className="absolute bottom-2 left-6 right-6 text-[10px] text-theme-tertiary flex justify-between uppercase tracking-wider font-semibold">
                                    <span>{processedRows.length} Processes Found</span>
                                    <span>Scope: {scope}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >,

        document.body
    );
}
