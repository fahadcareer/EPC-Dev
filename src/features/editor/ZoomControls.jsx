import React from 'react';
import { useReactFlow, useViewport } from 'reactflow';
import { Plus, Minus, Maximize, Map as MapIcon, Hand } from 'lucide-react';

const ZoomControls = ({ showMiniMap, onToggleMiniMap, isHandMode, onToggleHandMode }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { zoom } = useViewport();

    const percentage = Math.round(zoom * 100);

    return (
        <div
            className="flex flex-col items-center app-glass-panel rounded-full shadow-lg border border-theme-border p-1.5 gap-2 w-10"
        >
            <button
                onClick={() => fitView()}
                className="p-1.5 text-theme-tertiary hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Fit to Screen"
            >
                <Maximize className="w-4 h-4" />
            </button>

            <div className="text-[10px] font-medium text-theme-secondary select-none py-1">
                {percentage}%
            </div>

            <button
                onClick={() => zoomIn()}
                className="p-1.5 text-theme-tertiary hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Zoom In"
            >
                <Plus className="w-4 h-4" />
            </button>

            <button
                onClick={() => zoomOut()}
                className="p-1.5 text-theme-tertiary hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Zoom Out"
            >
                <Minus className="w-4 h-4" />
            </button>

            <div className="w-6 h-px bg-white/10 my-0.5"></div>

            <button
                onClick={onToggleHandMode}
                className={`p-1.5 rounded-full transition-colors ${isHandMode ? 'text-blue-400 bg-white/10' : 'text-theme-tertiary hover:text-white hover:bg-white/10'}`}
                title="Hand Tool (Pan)"
            >
                <Hand className="w-4 h-4" />
            </button>

            <button
                onClick={onToggleMiniMap}
                className={`p-1.5 rounded-full transition-colors ${showMiniMap ? 'text-blue-400 bg-white/10' : 'text-theme-tertiary hover:text-white hover:bg-white/10'}`}
                title="Map"
            >
                <MapIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ZoomControls;
