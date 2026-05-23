import React, { memo } from 'react';
import { useStore } from 'reactflow';

const Cursor = ({ x, y, color, name }) => {
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translate(${x}px, ${y}px)`,
                pointerEvents: 'none',
                zIndex: 1000,
                transition: 'transform 0.1s linear', // smooth movement
            }}
        >
            <svg
                width="24"
                height="36"
                viewBox="0 0 24 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19138L11.7841 12.3673H5.65376Z"
                    fill={color}
                    stroke="white"
                />
            </svg>
            <div
                style={{
                    backgroundColor: color,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    color: 'white',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    marginTop: '4px',
                    marginLeft: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                {name}
            </div>
        </div>
    );
};



const CursorLayer = ({ remoteUsers }) => {
    // We don't need to use flow store transform here if we put this inside the viewport
    // But usually standard HTML overlay needs transform.
    // However, if we put this inside <ReactFlow> as a child, it will move with the viewport IF we don't scale it?
    // Wait, standard way is to put it outside and use project/project, or inside viewport.
    // If inside viewport, it scales with zoom. Cursors SHOULD scale with zoom? No, usually they stay same size but move position.
    // If they stay same size, they should be an overlay.
    // But their POSITION is relative to flow. 
    // Let's use the standard approach: Inside ReactFlow but handled via useStore to map coordinates?
    // Actually, if we put divs inside the viewport, they zoom. We don't want the cursor pointer to get giant.
    // So we usually render them in an overlay and project the coordinates.

    // BUT! For simplicity in ReactFlow, if we just render them absolutely positioned in the flow pane, they track well, just scale issues.
    // Let's try rendering them in a dedicated portal or overlay layer that uses useStore to get transform.

    // Better approach for ReactFlow:
    // Render a component that uses `useStore` to get `transform`.
    // Then project the flow coordinates (x,y) to screen/container pixels.

    const [tX, tY, tScale] = useStore((s) => s.transform);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 9999
            }}
        >


            {Object.entries(remoteUsers).map(([userId, user]) => {
                if (!user.cursor) return null;

                // Project flow coordinates to screen
                const screenX = user.cursor.x * tScale + tX;
                const screenY = user.cursor.y * tScale + tY;

                return (
                    <Cursor
                        key={userId}
                        x={screenX}
                        y={screenY}
                        color={user.color || '#ff0000'}
                        name={user.name || 'Anonymous'}
                    />
                );
            })}
        </div>
    );
};

export default memo(CursorLayer);
