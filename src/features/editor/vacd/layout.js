/**
 * VACD Layout Logic - Supports Multiple Themes
 * 
 * Classic Theme (Original SAP VACD):
 * 1. Management Lane (Top) - Horizontal lane with process boxes
 * 2. Core Lane (Middle) - Large lane with:
 *    - Left/Right Chevron Boundaries
 *    - Sub-Lanes (pink containers)
 *    - Core Process Chevrons inside sub-lanes
 * 3. Support Lane (Bottom) - Horizontal lane with process boxes
 * 
 * Porter Theme (Porter's Value Chain):
 * 1. Support Activities (Top) - Horizontal bars stacked vertically
 * 2. Primary Activities (Bottom) - Vertical columns side-by-side
 * 3. Margin (Right Side) - Large chevron spanning full height
 */

// Classic Theme Dimensions (Original SAP VACD)
const CLASSIC_CANVAS_WIDTH = 1800;
const CLASSIC_NODE_WIDTH = 220;
const CLASSIC_NODE_HEIGHT = 60;
const CLASSIC_HORIZONTAL_GAP = 60;
const CLASSIC_LANE_MANAGEMENT_Y = 0;
const CLASSIC_LANE_CORE_Y = 250;
const CLASSIC_SUB_LANE_HEIGHT = 180;

// Porter Theme Dimensions
const PORTER_CANVAS_WIDTH = 1400;
const PORTER_SUPPORT_START_X = 50;
const PORTER_SUPPORT_START_Y = 50;
const PORTER_SUPPORT_BAR_WIDTH = 1100;
const PORTER_SUPPORT_BAR_HEIGHT = 60;
const PORTER_SUPPORT_BAR_GAP = 10;
const PORTER_PRIMARY_START_X = 50;
const PORTER_PRIMARY_START_Y = 360;
const PORTER_PRIMARY_COLUMN_WIDTH = 200;
const PORTER_PRIMARY_COLUMN_HEIGHT = 380;
const PORTER_PRIMARY_COLUMN_GAP = 20;
const PORTER_MARGIN_X = 1180;
const PORTER_MARGIN_Y = 50;
const PORTER_MARGIN_WIDTH = 170;
const PORTER_MARGIN_HEIGHT = 690;

export const vacdLayout = (nodes, edges, template = 'classic') => {
    if (template === 'porter') {
        return porterLayout(nodes, edges);
    }
    return classicLayout(nodes, edges);
};

// Original SAP VACD Layout
const classicLayout = (nodes, edges) => {
    const managementNodes = nodes.filter(n => n.type === 'management_process' || n.data.category === 'management' || n.category === 'management');
    const coreNodes = nodes.filter(n => n.type === 'vacd' || n.data.category === 'core' || n.category === 'core');
    const supportNodes = nodes.filter(n => n.type === 'support_process' || n.data.category === 'support' || n.category === 'support');
    const boundaryNodes = nodes.filter(n => ['chevron_left', 'chevron_right'].includes(n.type) || n.data.category === 'core_boundary' || n.category === 'core_boundary');

    const leftBoundary = boundaryNodes.find(n => n.type === 'chevron_left');
    const rightBoundary = boundaryNodes.find(n => n.type === 'chevron_right');

    const resultNodes = [];
    const laneWidth = CLASSIC_CANVAS_WIDTH;

    // Group Core Nodes by group_label
    const coreGroups = {};
    coreNodes.forEach(node => {
        const groupLabel = node.data.group_label || node.group_label || 'Core Processes';
        if (!coreGroups[groupLabel]) coreGroups[groupLabel] = [];
        coreGroups[groupLabel].push(node);
    });

    const groupLabels = Object.keys(coreGroups);
    const coreContentHeight = Math.max(500, groupLabels.length * (CLASSIC_SUB_LANE_HEIGHT + 20) + 120);

    // 1. Management Lane
    resultNodes.push({
        id: 'lane_management',
        type: 'vacd_lane',
        position: { x: 0, y: CLASSIC_LANE_MANAGEMENT_Y },
        data: { label: 'Management Processes', category: 'management' },
        style: { width: laneWidth, height: 180 },
        zIndex: -10,
        selectable: true,
        draggable: true
    });

    managementNodes.forEach((node, index) => {
        const totalNodesWidth = managementNodes.length * CLASSIC_NODE_WIDTH + (managementNodes.length - 1) * CLASSIC_HORIZONTAL_GAP;
        const startX = (laneWidth - totalNodesWidth) / 2;
        resultNodes.push({
            ...node,
            position: {
                x: startX + index * (CLASSIC_NODE_WIDTH + CLASSIC_HORIZONTAL_GAP),
                y: CLASSIC_LANE_MANAGEMENT_Y + 70
            },
            zIndex: 10
        });
    });

    // 2. Core Lane (Outer Container)
    resultNodes.push({
        id: 'lane_core',
        type: 'vacd_lane',
        position: { x: 0, y: CLASSIC_LANE_CORE_Y },
        data: { label: 'Core Processes', category: 'core' },
        style: { width: laneWidth, height: coreContentHeight + 100 },
        zIndex: -11,
        selectable: true,
        draggable: true
    });

    const contentAreaX = 150;
    const contentAreaWidth = laneWidth - 300;

    // Position Boundaries (Full height vertical chevrons)
    if (leftBoundary) {
        resultNodes.push({
            ...leftBoundary,
            position: { x: 30, y: CLASSIC_LANE_CORE_Y + 70 },
            style: { width: 90, height: coreContentHeight },
            zIndex: 5
        });
    }

    if (rightBoundary) {
        resultNodes.push({
            ...rightBoundary,
            position: { x: laneWidth - 120, y: CLASSIC_LANE_CORE_Y + 70 },
            style: { width: 90, height: coreContentHeight },
            zIndex: 5
        });
    }

    // Stack Sub-Lanes vertically
    groupLabels.forEach((label, gIndex) => {
        const subY = CLASSIC_LANE_CORE_Y + 90 + gIndex * (CLASSIC_SUB_LANE_HEIGHT + 20);
        resultNodes.push({
            id: `sub_lane_${label.replace(/\s+/g, '_')}`,
            type: 'vacd_sub_lane',
            position: { x: contentAreaX, y: subY },
            data: { label: label },
            style: { width: contentAreaWidth, height: CLASSIC_SUB_LANE_HEIGHT },
            zIndex: -5,
            selectable: true,
            draggable: true
        });

        const subNodes = coreGroups[label];
        subNodes.forEach((node, nIndex) => {
            resultNodes.push({
                ...node,
                position: {
                    x: contentAreaX + 80 + nIndex * (CLASSIC_NODE_WIDTH + 40),
                    y: subY + 70
                },
                zIndex: 10
            });
        });
    });

    // 3. Support Lane
    const supportLaneY = CLASSIC_LANE_CORE_Y + coreContentHeight + 150;
    resultNodes.push({
        id: 'lane_support',
        type: 'vacd_lane',
        position: { x: 0, y: supportLaneY },
        data: { label: 'Support Processes', category: 'support' },
        style: { width: laneWidth, height: 180 },
        zIndex: -10,
        selectable: true,
        draggable: true
    });

    supportNodes.forEach((node, index) => {
        const totalNodesWidth = supportNodes.length * CLASSIC_NODE_WIDTH + (supportNodes.length - 1) * CLASSIC_HORIZONTAL_GAP;
        const startX = (laneWidth - totalNodesWidth) / 2;
        resultNodes.push({
            ...node,
            position: {
                x: startX + index * (CLASSIC_NODE_WIDTH + CLASSIC_HORIZONTAL_GAP),
                y: supportLaneY + 70
            },
            zIndex: 10
        });
    });

    return resultNodes;
};

// Porter's Value Chain Layout
const porterLayout = (nodes, edges) => {
    const resultNodes = [];

    // Categorize nodes
    const supportNodes = nodes.filter(n =>
        n.type === 'management_process' ||
        n.type === 'support_process' ||
        (n.data && (n.data.category === 'support' || n.data.category === 'management'))
    );

    const primaryNodes = nodes.filter(n =>
        n.type === 'vacd' ||
        (n.data && n.data.category === 'core')
    );

    const marginNode = nodes.find(n => n.type === 'chevron_right');

    // 1. Position Support Activities (Horizontal bars at top)
    supportNodes.forEach((node, index) => {
        resultNodes.push({
            ...node,
            position: {
                x: PORTER_SUPPORT_START_X,
                y: PORTER_SUPPORT_START_Y + index * (PORTER_SUPPORT_BAR_HEIGHT + PORTER_SUPPORT_BAR_GAP)
            },
            style: {
                width: PORTER_SUPPORT_BAR_WIDTH,
                height: PORTER_SUPPORT_BAR_HEIGHT
            },
            zIndex: 10
        });
    });

    // 2. Position Primary Activities (Vertical columns at bottom)
    primaryNodes.forEach((node, index) => {
        resultNodes.push({
            ...node,
            position: {
                x: PORTER_PRIMARY_START_X + index * (PORTER_PRIMARY_COLUMN_WIDTH + PORTER_PRIMARY_COLUMN_GAP),
                y: PORTER_PRIMARY_START_Y
            },
            style: {
                width: PORTER_PRIMARY_COLUMN_WIDTH,
                height: PORTER_PRIMARY_COLUMN_HEIGHT
            },
            zIndex: 10
        });
    });

    // 3. Position Margin Chevron (Right side)
    if (marginNode) {
        resultNodes.push({
            ...marginNode,
            position: {
                x: PORTER_MARGIN_X,
                y: PORTER_MARGIN_Y
            },
            style: {
                width: PORTER_MARGIN_WIDTH,
                height: PORTER_MARGIN_HEIGHT
            },
            zIndex: 5
        });
    }

    return resultNodes;
};

export const expandVACDEdges = () => [];
