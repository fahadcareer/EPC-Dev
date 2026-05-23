/**
 * FAD (Function Allocation Diagram) Layout Engine
 * 
 * This module handles the layout of group-based FAD structures where:
 * - A central process node is surrounded by groups on 4 sides
 * - TOP: Strategy & Risk
 * - LEFT: Context & Inputs
 * - RIGHT: Accountability
 * - BOTTOM: Execution & Operations
 */

// Extended Side Mapping - Maps group categories to sides
const EXTENDED_SIDE_MAP = {
    // TOP — Strategy & Risk
    strategic_objectives: "top",
    strategic_kpis: "top",
    risk_management: "top",
    risks_controls: "top",
    objective: "top",
    goal: "top",

    // LEFT — Inputs
    input: "left",
    inputs: "left",
    sipoc_inputs: "left",
    sipoc_analysis: "left",
    input_event_streams: "left",
    related_documents_input: "left",
    it_systems: "left",
    resource: "left",
    information: "left", // Added explicit mapping
    data: "left",
    document: "left",

    // RIGHT — Outputs + Accountability
    output: "right",
    outputs: "right",
    sipoc_outputs: "right",
    output_event_streams: "right",
    related_documents_output: "right",
    accountability: "right",
    raci: "right",
    raci_matrix: "right",
    roles: "right",
    organizational_units: "right",
    role: "right",

    // BOTTOM — Execution & Ops
    operational_kpis: "bottom",
    sla_kpis: "bottom",
    operating_procedures: "bottom",
    work_instructions: "bottom",
    related_documents_reference: "bottom",
    cost: "bottom",
    metric: "bottom",
    kpi: "bottom",
    requirement: "bottom", // Added
};



/**
 * Layout FAD diagram with group-based structure
 * @param {Object} process - Central process node
 * @param {Array} groups - Array of groups with side and nodes
 * @param {Array} edges - Array of edges (process <-> group connections)
 * @returns {Array} - Array of positioned nodes
 */
export function fadLayout(process, groups, edges, direction = 'TB') {
    console.log('🚀 FAD Group Layout Starting', {
        process: process?.label,
        groupCount: groups?.length,
        edgeCount: edges?.length,
        direction
    });

    const CX = 1000; // Center X
    const CY = 800;  // Center Y
    const SIDE_OFFSET = 750; // Distance from center to group (increased for better spacing)
    const GROUP_SPACING = 300; // Space between groups on same side
    const NODE_SPACING = 140; // Space between nodes within group

    const nodes = [];

    // 1. Position center process node
    nodes.push({
        id: process.id,
        type: 'fad_process', // Use custom large FAD process node
        position: { x: CX, y: CY },
        data: {
            label: process.label,
            is_central: true,
            icon: process.icon, // Persist Icon
            template: process.template, // Persist Template
            customColor: process.customColor, // Pass custom color
            description: process.description,
            attachments: process.attachments, // Persist Attachments
            onEdit: () => { }, // Will be set later
            readOnly: false
        }
    });

    // 2. Group nodes by side (use extended mapping if side not provided)
    const groupsBySide = {
        top: groups.filter(g => {
            const side = g.side || EXTENDED_SIDE_MAP[g.group_category];
            return side === 'top';
        }),
        left: groups.filter(g => {
            const side = g.side || EXTENDED_SIDE_MAP[g.group_category];
            return side === 'left';
        }),
        bottom: groups.filter(g => {
            const side = g.side || EXTENDED_SIDE_MAP[g.group_category];
            return side === 'bottom';
        }),
        // Fallback: Anything not Top, Left, or Bottom goes to Right
        right: groups.filter(g => {
            const side = g.side || EXTENDED_SIDE_MAP[g.group_category];
            // Fix: Include unknowns in Right by default to match legacy behavior
            return side === 'right' || (!side && g.group_category !== 'input' && g.group_category !== 'inputs');
        })
    };

    console.log('📊 Groups by side:', {
        top: groupsBySide.top.length,
        left: groupsBySide.left.length,
        right: groupsBySide.right.length,
        bottom: groupsBySide.bottom.length
    });

    // Helper to position nodes within a group based on direction
    const positionNodesInGroup = (group, groupX, groupY) => {
        group.nodes.forEach((node, nIdx) => {
            let nodeX = groupX;
            let nodeY = groupY;

            // Spacing Configuration
            const VERTICAL_SPACING = 140;
            const HORIZONTAL_SPACING = 280; // Increased horizontal gap substantially

            if (direction === 'LR') {
                // Horizontal Flow: Nodes placed in a ROW
                // Center the row around groupX
                const totalWidth = (group.nodes.length - 1) * HORIZONTAL_SPACING;
                const startX = groupX - (totalWidth / 2);
                nodeX = startX + (nIdx * HORIZONTAL_SPACING);
            } else {
                // Vertical Flow (TB): Nodes placed in a COLUMN
                // Center the column around groupY
                const totalHeight = (group.nodes.length - 1) * VERTICAL_SPACING;
                const startY = groupY - (totalHeight / 2);
                nodeY = startY + (nIdx * VERTICAL_SPACING);
            }

            nodes.push({
                id: node.id,
                type: node.type || 'info',
                data: {
                    label: node.label,
                    category: node.category,
                    icon: node.icon, // Persist Icon
                    template: node.template, // Persist Template
                    // Persist FAD Structure Data
                    group_id: group.group_id,
                    group_category: group.group_category,
                    side: group.side || EXTENDED_SIDE_MAP[group.group_category],

                    relationship: node.relationship,
                    customColor: node.customColor, // Pass custom color
                    attachments: node.attachments, // Persist Attachments
                    onEdit: () => { }, // Will be set later
                    readOnly: false
                },
                position: { x: nodeX, y: nodeY }
            });
        });
    };

    // 3. Layout each side

    // TOP SIDE - Spread groups horizontally above center
    const topGroups = groupsBySide.top;
    const topStartX = CX - ((topGroups.length - 1) * GROUP_SPACING) / 2;
    topGroups.forEach((group, gIdx) => {
        const groupX = topStartX + (gIdx * GROUP_SPACING);
        const groupY = CY - SIDE_OFFSET;
        positionNodesInGroup(group, groupX, groupY);
    });

    // LEFT SIDE - Spread groups vertically left of center
    const leftGroups = groupsBySide.left;
    const leftStartY = CY - ((leftGroups.length - 1) * GROUP_SPACING) / 2;
    leftGroups.forEach((group, gIdx) => {
        const groupX = CX - SIDE_OFFSET;
        const groupY = leftStartY + (gIdx * GROUP_SPACING);
        positionNodesInGroup(group, groupX, groupY);
    });

    // RIGHT SIDE - Spread groups vertically right of center
    const rightGroups = groupsBySide.right;
    const rightStartY = CY - ((rightGroups.length - 1) * GROUP_SPACING) / 2;
    rightGroups.forEach((group, gIdx) => {
        const groupX = CX + SIDE_OFFSET;
        const groupY = rightStartY + (gIdx * GROUP_SPACING);
        positionNodesInGroup(group, groupX, groupY);
    });

    // BOTTOM SIDE - Spread groups horizontally below center
    const bottomGroups = groupsBySide.bottom;
    const bottomStartX = CX - ((bottomGroups.length - 1) * GROUP_SPACING) / 2;
    bottomGroups.forEach((group, gIdx) => {
        const groupX = bottomStartX + (gIdx * GROUP_SPACING);
        const groupY = CY + SIDE_OFFSET;
        positionNodesInGroup(group, groupX, groupY);
    });

    console.log(`✅ FAD Layout Complete: ${nodes.length} nodes across ${groups.length} groups`);
    return nodes;
}

/**
 * Convert group-based edges to node-based edges
 * Expands edges from "process -> group" to "process -> each node in group"
 * 
 * @param {Array} groupEdges - Edges connecting process to groups
 * @param {Object} process - Central process node
 * @param {Array} groups - Array of groups
 * @returns {Array} - Expanded node-to-node edges
 */
export function expandGroupEdges(groupEdges, process, groups) {
    const nodeEdges = [];
    let edgeId = 0;

    console.log('🔗 expandGroupEdges called with:', {
        groupEdgesCount: groupEdges.length,
        groupsCount: groups.length,
        processId: process.id
    });

    // Helper to shorten relationship labels
    const shortenLabel = (label) => {
        const replacements = {
            'is governed by': 'governed by',
            'is supported by': 'supports',
            'is executed by': 'executes',
            'is measured by': 'measures',
            'is owned by': 'owns',
            'is exposed to': 'exposed to',
            'is threatened by': 'threatens',
            'is constrained by': 'constrained by'
        };
        return replacements[label?.toLowerCase()] || label;
    };

    // Category-based color mapping
    const getCategoryColor = (category) => {
        const colors = {
            governance: '#b91c1c',     // Deep Red
            risk: '#ea580c',           // Orange
            control: '#0d9488',        // Teal
            system: '#1e40af',         // Deep Blue
            input: '#7c3aed',          // Purple
            output: '#7c3aed',         // Purple
            role: '#15803d',           // Green
            procedure: '#ca8a04',      // Yellow/Gold
            metric: '#ca8a04',         // Yellow/Gold
            kpi: '#ca8a04',            // Yellow/Gold
            requirement: '#9333ea'     // Purple
        };
        return colors[category?.toLowerCase()] || '#64748b'; // Default gray
    };

    // Explicit Side Detection
    const getSide = (group) => {
        const category = group.group_category?.toLowerCase();
        let side = group.side || EXTENDED_SIDE_MAP[category];

        // If still not found, try stripping spaces or underscores just in case
        if (!side && category) {
            side = EXTENDED_SIDE_MAP[category.replace(/[\s_]/g, '')];
        }

        return (side || 'right').toLowerCase();
    };

    groupEdges.forEach(edge => {
        // 1. Try to find if this is a GROUP edge (connects Process <-> Group)
        let targetGroup = groups.find(g => g.group_id === edge.target || g.group_id === edge.source);
        let targetNodeId = null;

        // 2. If not a group edge, check if it's a DIRECT NODE edge (connects Process <-> Node)
        if (!targetGroup) {
            for (const g of groups) {
                const foundNode = g.nodes.find(n => n.id === edge.target || n.id === edge.source);
                if (foundNode) {
                    targetGroup = g;
                    targetNodeId = foundNode.id;
                    break;
                }
            }
        }

        if (!targetGroup) {
            console.warn('⚠️ No group or node found for edge:', edge);
            return;
        }

        const side = getSide(targetGroup);
        const groupColor = getCategoryColor(targetGroup.group_category);
        const isProcessSource = edge.source === process.id || (targetNodeId && edge.source === process.id);

        // Define which nodes to create edges for:
        const nodesToConnect = targetNodeId
            ? targetGroup.nodes.filter(n => n.id === targetNodeId)
            : targetGroup.nodes;

        nodesToConnect.forEach(node => {
            const edgeColor = getCategoryColor(node.category) || groupColor || '#64748b';

            // Explicit Handle Mapping for FAD Structure
            let centerHandle, surroundingHandle;

            if (side === 'left') {
                // Group Left: Node (Right Handle) <-> Process (Left Handle)
                if (isProcessSource) {
                    centerHandle = 'l';
                    surroundingHandle = 'r-in';
                } else {
                    surroundingHandle = 'r'; // Node Source
                    centerHandle = 'l-in'; // Process Target
                }
            } else if (side === 'right') {
                // Group Right: Process (Right Handle) <-> Node (Left Handle)
                if (isProcessSource) {
                    centerHandle = 'r';
                    surroundingHandle = 'l';
                } else {
                    surroundingHandle = 'l-out'; // Node Source
                    centerHandle = 'r-in';
                }
            } else if (side === 'top') {
                // Group Top: Node (Bottom Handle) <-> Process (Top Handle)
                if (isProcessSource) {
                    centerHandle = 't';
                    surroundingHandle = 'b-in';
                } else {
                    surroundingHandle = 'b'; // Node Source
                    centerHandle = 't-in';
                }
            } else if (side === 'bottom') {
                // Group Bottom: Process (Bottom Handle) <-> Node (Top Handle)
                if (isProcessSource) {
                    centerHandle = 'b';
                    surroundingHandle = 't';
                } else {
                    surroundingHandle = 't-out'; // Node Source
                    centerHandle = 'b-in';
                }
            } else {
                // Fallback for unknown sides (Treat as Right)
                if (isProcessSource) {
                    centerHandle = 'r';
                    surroundingHandle = 'l';
                } else {
                    surroundingHandle = 'l-out';
                    centerHandle = 'r-in';
                }
            }

            // Determine label
            let edgeLabel;
            if (node.category === 'input' || targetGroup.group_category === 'inputs' || targetGroup.group_category === 'sipoc_inputs') {
                edgeLabel = 'Input';
            } else if (node.category === 'output' || targetGroup.group_category === 'outputs' || targetGroup.group_category === 'sipoc_outputs') {
                edgeLabel = 'Output';
            } else {
                edgeLabel = shortenLabel(edge.label);
            }

            const newEdge = {
                id: `edge_${edgeId++}_${Date.now()}`,
                source: isProcessSource ? process.id : node.id,
                target: isProcessSource ? node.id : process.id,
                sourceHandle: isProcessSource ? centerHandle : surroundingHandle,
                targetHandle: isProcessSource ? surroundingHandle : centerHandle,
                type: 'default',
                animated: false,
                label: edgeLabel,
                labelStyle: { fontSize: 11, fontWeight: 500, fill: '#fff' },
                labelBgStyle: { fill: 'rgba(15, 23, 42, 0.75)', fillOpacity: 0.75, rx: 6, ry: 6 },
                labelBgPadding: [4, 6],
                labelBgBorderRadius: 6,
                markerEnd: { type: 'arrowclosed', width: 16, height: 16, color: edgeColor },
                style: { stroke: edgeColor, strokeWidth: 2, strokeLinecap: 'round' }
            };

            nodeEdges.push(newEdge);
        });
    });

    console.log(`✅ expandGroupEdges complete: ${nodeEdges.length} edges created`);
    return nodeEdges;
}
