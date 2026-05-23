import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import { useState, useRef, useEffect } from 'react';

export default function EditableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    style = {},
    markerEnd,
    data
}) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(label || '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (data?.isEditing) {
            setIsEditing(true);
            setEditValue(label || '');
        }
    }, [data?.isEditing, label]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (data?.onLabelChange) {
            data.onLabelChange(id, editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(label || '');
            setIsEditing(false);
            if (data?.onLabelChange) {
                data.onLabelChange(id, label);
            }
        }
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 11,
                        fontWeight: 500,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="px-2 py-1 text-xs border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ minWidth: '60px', maxWidth: '150px' }}
                            placeholder="Enter label..."
                        />
                    ) : label ? (
                        <span
                            className="px-2 py-1 rounded text-white"
                            style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            {label}
                        </span>
                    ) : null}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
