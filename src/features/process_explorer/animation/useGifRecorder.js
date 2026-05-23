import { useState, useCallback } from 'react';
import GIF from 'gif.js/dist/gif';
import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from 'reactflow';

export const useGifRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [progress, setProgress] = useState(0);

    const recordGif = useCallback(async ({ nodes, duration = 3000, fps = 5, fileName = 'process.gif' }) => {
        setIsRecording(true);
        setProgress(0);

        const viewport = document.querySelector(".react-flow__viewport");
        if (!viewport) {
            console.error("Viewport not found");
            setIsRecording(false);
            return;
        }

        // Calculate Bounds (standardized with PDF export)
        const nodesBounds = getNodesBounds(nodes);
        const padding = 100; // Standardized padding with PDF (was 150)
        const width = nodesBounds.width + padding * 2;
        const height = nodesBounds.height + padding * 2;

        // Ensure even integer dimensions (important for some decoders/WhatsApp)
        const pixelRatio = 1;
        let gifWidth = Math.round(width * pixelRatio);
        let gifHeight = Math.round(height * pixelRatio);
        if (gifWidth % 2 !== 0) gifWidth++;
        if (gifHeight % 2 !== 0) gifHeight++;

        // Setup GIF
        const gif = new GIF({
            workers: navigator.hardwareConcurrency || 4,
            quality: 10,
            width: gifWidth,
            height: gifHeight,
            workerScript: '/gif.worker.js',
            background: '#ffffff',
            repeat: 0 // Infinite loop (Crucial for WhatsApp to recognize as GIF)
        });

        // 5 FPS = 200ms delay per frame
        const intervalMs = 1000 / fps;
        const framesToCapture = (duration / 1000) * fps;

        // Center the view for capture
        // Use 0.5 minZoom to match PDF logic exactly
        const transform = getViewportForBounds(nodesBounds, width, height, 0.5, 2);

        try {
            // Apply Recording Styles
            viewport.classList.add('gif-recording-mode');

            // Force the viewport to the calculated transform
            // We save the original transform style to restore it later
            const originalTransform = viewport.style.transform;
            viewport.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`;

            // WARMUP: Give browser time to layout/paint
            await new Promise(r => setTimeout(r, 500));

            const edgePaths = viewport.querySelectorAll('.react-flow__edge-path');

            for (let i = 0; i < framesToCapture; i++) {
                // Wait for animation to progress
                // Wait removed for faster recording - frames are captured as fast as possible
                // await new Promise(r => setTimeout(r, intervalMs));

                // Manual Edge Animation on LIVE viewport
                const t = i / framesToCapture;
                const totalDistance = 100; // Move 100 pixels over the duration
                const currentOffset = totalDistance * (1 - t);

                edgePaths.forEach(path => {
                    // FORCE inline styles on the edges
                    path.style.setProperty('stroke-dasharray', '10', 'important');
                    path.style.setProperty('stroke-dashoffset', `${currentOffset}`, 'important');
                });

                // Capture from the LIVE Viewport
                const dataUrl = await toPng(viewport, {
                    backgroundColor: "#ffffff",
                    width: width,
                    height: height,
                    style: {
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
                    },
                    pixelRatio: pixelRatio,
                });

                const img = new Image();
                img.src = dataUrl;
                await new Promise(resolve => img.onload = resolve);

                gif.addFrame(img, { delay: intervalMs });
                // Phase 1: Capturing (0% -> 30%)
                setProgress(Math.round(((i + 1) / framesToCapture) * 30));
            }

            gif.on('start', () => console.log("GIF: Render started"));
            gif.on('progress', (p) => {
                // Phase 2: Rendering (30% -> 100%)
                console.log(`GIF: Progress ${p}`);
                setProgress(30 + Math.round(p * 70));
            });
            gif.on('abort', () => console.error("GIF: Render aborted"));

            gif.on('finished', (blobData) => {
                console.log("GIF: Finished! Blob size:", blobData.size);
                // Explicitly set type to image/gif to ensure compatibility
                const blob = new Blob([blobData], { type: 'image/gif' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setIsRecording(false);
                // Delay progress reset to allow UI to detect completion
                setTimeout(() => setProgress(0), 1500);

                // Cleanup
                viewport.classList.remove('gif-recording-mode');
                viewport.style.transform = originalTransform;
                // Remove inline styles from edges
                edgePaths.forEach(path => {
                    path.style.removeProperty('stroke-dasharray');
                    path.style.removeProperty('stroke-dashoffset');
                });
            });

            console.log("GIF: Calling render()...");
            gif.render();
        } catch (error) {
            console.error("GIF Recording failed in catch block", error);
            setIsRecording(false);

            // Cleanup on error
            viewport.classList.remove('gif-recording-mode');
            // We might not be able to easily restore the exact previous react-flow state if it wasn't saved, 
            // but removing our override lets React Flow take over again on next render/interaction.
            if (viewport) {
                viewport.style.removeProperty('transform');
            }
        }

    }, []);

    return { recordGif, isRecording, progress };
};
