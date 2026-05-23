// A simple snap distance threshold (in pixels)
const SNAP_DISTANCE = 8;

// gets the bounding box of a node including center coordinates (Relative to Parent)
export const getNodeBounds = (node) => {
    const width = node.width || node.style?.width || 200;
    const height = node.height || node.style?.height || 90;
    return {
        x: node.position.x,
        y: node.position.y,
        width,
        height,
        centerX: node.position.x + width / 2,
        centerY: node.position.y + height / 2,
        right: node.position.x + width,
        bottom: node.position.y + height,
    };
};

// gets the absolute bounding box of a node for rendering helper lines globally
export const getAbsoluteNodeBounds = (node) => {
    const width = node.width || node.style?.width || 200;
    const height = node.height || node.style?.height || 90;
    const x = node.positionAbsolute?.x ?? node.position.x;
    const y = node.positionAbsolute?.y ?? node.position.y;
    return {
        x,
        y,
        width,
        height,
        centerX: x + width / 2,
        centerY: y + height / 2,
        right: x + width,
        bottom: y + height,
    };
};

/**
 * Calculates alignment lines and potential snap position for a dragged node.
 */
export const getHelperLines = (draggedNode, nodes, distance = SNAP_DISTANCE) => {
    const draggedBounds = getNodeBounds(draggedNode);
    const draggedBoundsAbs = getAbsoluteNodeBounds(draggedNode);
    let horizontal = null;
    let vertical = null;
    let snapPosition = { x: undefined, y: undefined };
    let isSnapped = false;

    // The offset of the dragged node within its parent (if any)
    const parentOffsetX = draggedBoundsAbs.x - draggedBounds.x;
    const parentOffsetY = draggedBoundsAbs.y - draggedBounds.y;

    for (const node of nodes) {
        if (node.id === draggedNode.id) continue;
        
        // Skip nodes without defined positions
        if (!node.position || node.position.x === undefined || node.position.y === undefined) continue;
        if (node.data?.isExpandedNode && !draggedNode.data?.isExpandedNode) continue; // Optional: avoid aligning to internals

        const boundsAbs = getAbsoluteNodeBounds(node);

        // check vertical alignments (X-axis snap)
        if (Math.abs(draggedBoundsAbs.centerX - boundsAbs.centerX) < distance) {
            vertical = boundsAbs.centerX;   // use Absolute X for rendering SVG lines globally
            
            // Map the absolute target coordinate back to dragged node's relative parent context
            const targetAbsX = boundsAbs.centerX - draggedBoundsAbs.width / 2;
            snapPosition.x = targetAbsX - parentOffsetX;
            
            isSnapped = true;
        }

        // check horizontal alignments (Y-axis snap)
        if (Math.abs(draggedBoundsAbs.centerY - boundsAbs.centerY) < distance) {
            horizontal = boundsAbs.centerY; // use Absolute Y for rendering SVG lines globally
            
            // Map the absolute target coordinate back to dragged node's relative parent context
            const targetAbsY = boundsAbs.centerY - draggedBoundsAbs.height / 2;
            snapPosition.y = targetAbsY - parentOffsetY;

            isSnapped = true;
        }

        // Once we find an alignment for both axes, we can break early
        if (horizontal !== null && vertical !== null) {
            break;
        }
    }

    return { horizontal, vertical, snapPosition, isSnapped };
};
