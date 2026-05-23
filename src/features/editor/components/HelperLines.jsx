import React from 'react';
import { useStore } from 'reactflow';

export default function HelperLines({ horizontal, vertical }) {
    // Get the current zoom and pan from React Flow store
    const transform = useStore((store) => store.transform);
    const [tx, ty, tZoom] = transform;

    // Don't render anything if no lines are needed
    if (horizontal === null && vertical === null) {
        return null;
    }

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
            }}
            className="react-flow__helper-lines"
        >
            {horizontal !== null && (
                <line
                    x1="0"
                    y1={horizontal * tZoom + ty}
                    x2="100%"
                    y2={horizontal * tZoom + ty}
                    stroke="#00AEEF"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                />
            )}
            {vertical !== null && (
                <line
                    x1={vertical * tZoom + tx}
                    y1="0"
                    x2={vertical * tZoom + tx}
                    y2="100%"
                    stroke="#00AEEF"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                />
            )}
        </svg>
    );
}
