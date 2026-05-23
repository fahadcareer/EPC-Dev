import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from 'reactflow';
import api from '../../../services/api_service';
import NETWORK_URLS from '../../../config/network_string';

export const useHtmlDownloader = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    const generateHtmlContent = useCallback(async ({ nodes, logoUrl, orgName, processName, watermarkEnabled }) => {
        const viewport = document.querySelector(".react-flow__viewport");
        if (!viewport) return null;

        const nodesBounds = getNodesBounds(nodes);
        const padding = 50;
        const width = nodesBounds.width + padding * 2;
        const height = nodesBounds.height + padding * 2;
        const transform = getViewportForBounds(nodesBounds, width, height, 0.5, 2);

        const dataUrl = await toPng(viewport, {
            backgroundColor: "#ffffff",
            width: width,
            height: height,
            style: {
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
            },
            pixelRatio: 2, // Sufficient quality for sharing
        });

        // Ensure logoUrl is absolute for the shared link
        let absoluteLogoUrl = logoUrl;
        if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
            const host = window.location.host;
            const protocol = window.location.protocol;
            if (host.includes('localhost:5173')) {
                absoluteLogoUrl = `${protocol}//${window.location.hostname}:8443/epc${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
            } else {
                absoluteLogoUrl = `${window.location.origin}/epc${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
            }
        }

        const dateStr = new Date().toLocaleDateString();
        const watermarkHtml = watermarkEnabled ?
            `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-family: Helvetica, Arial, sans-serif; font-size: 150px; color: rgba(150, 150, 150, 0.4); z-index: 9999; pointer-events: none; white-space: nowrap; user-select: none;">TASREE3</div>` : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${processName || 'Diagram'}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
        .container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 95vw; max-height: 90vh; overflow: auto; position: relative; }
        .header { display: flex; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; }
        .logo { max-height: 40px; margin-right: 1rem; }
        .info-stack { display: flex; flex-direction: column; text-align: left; }
        .org-name { font-weight: 700; font-size: 1.1rem; color: #111; }
        .diagram-name { font-size: 0.9rem; color: #444; }
        .generated-date { font-size: 0.75rem; color: #888; margin-top: 0.25rem; }
        .diagram-wrapper { display: flex; justify-content: center; }
        img.diagram { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    ${watermarkHtml}
    <div class="container">
        <div class="header">
            ${absoluteLogoUrl ? `<img src="${absoluteLogoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'"/>` : ''}
            <div class="info-stack">
                <div class="org-name">${orgName || 'Organization'}</div>
                <div class="diagram-name">${processName || 'EPC Diagram'}</div>
                <div class="generated-date">Generated: ${dateStr}</div>
            </div>
        </div>
        <div class="diagram-wrapper">
            <img src="${dataUrl}" alt="Process Diagram" class="diagram" />
        </div>
    </div>
</body>
</html>`;
    }, []);

    const downloadHtml = useCallback(async ({ nodes, fileName = 'diagram.html', logoUrl, orgName, processName, watermarkEnabled }) => {
        setIsDownloading(true);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + 2 : 90));
        }, 100);

        try {
            const htmlContent = await generateHtmlContent({ nodes, logoUrl, orgName, processName, watermarkEnabled });
            if (!htmlContent) return;

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            clearInterval(progressInterval);
            setProgress(100);
        } catch (error) {
            console.error("HTML Download failed", error);
            clearInterval(progressInterval);
        } finally {
            setIsDownloading(false);
            setTimeout(() => setProgress(0), 1500);
        }
    }, [generateHtmlContent]);

    const shareFile = useCallback(async ({ file, title, text }) => {
        setIsDownloading(true);
        setProgress(30);

        let fileUrl;
        try {
            // 1. Upload to backend
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(NETWORK_URLS.ShareDiagram, formData);

            const serverUrl = response?.data?.share_url;
            if (!serverUrl) throw new Error("Upload failed - no URL returned from server.");

            // Build absolute URL. 
            // If on localhost, use the host IP so it's accessible from other devices if shared.
            const urlOrigin = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? `${window.location.protocol}//${window.location.host}`
                : window.location.origin;

            fileUrl = `${urlOrigin}/epc${serverUrl}`;

            const shareTitle = title || 'Tasree3 Diagram';
            const shareText = `${text}\n\nLink: ${fileUrl}`;

            // Finalize progress BEFORE opening the share dialog
            // navigator.share is a blocking call that waits for the user to finish sharing.
            setProgress(100);
            setIsDownloading(false);

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText
                    });
                } catch (shareErr) {
                    // If user cancelled, just stop
                    if (shareErr.name === 'AbortError') return;

                    // Browser security blocks 'share' if generation/upload takes > 1sec (gesture loss)
                    // We silently fallback to clipboard without cluttering console with warnings.
                    await navigator.clipboard.writeText(fileUrl);
                    throw new Error("link_ready_copied");
                }
            } else {
                // Not supported (e.g. desktop) -> Copy to clipboard
                await navigator.clipboard.writeText(fileUrl);
                throw new Error("link_ready_copied");
            }

            return fileUrl;
        } catch (error) {
            // Re-throw special signals without logging them as "errors"
            if (error.message === "link_ready_copied" || error.message === "fallback_copied") throw error;

            console.error("File sharing failed:", error);

            try {
                // Determine best fallback
                const finalFallback = fileUrl || window.location.href;
                await navigator.clipboard.writeText(finalFallback);
                throw new Error("fallback_copied");
            } catch (copyErr) {
                if (copyErr.message === "fallback_copied") throw copyErr;
                throw new Error("Sharing failed. Please try downloading as PDF instead.");
            }
        } finally {
            setIsDownloading(false);
            setTimeout(() => setProgress(0), 1500);
        }
    }, []);

    const shareHtml = useCallback(async ({ nodes, fileName = 'diagram.html', logoUrl, orgName, processName }) => {
        try {
            const htmlContent = await generateHtmlContent({ nodes, logoUrl, orgName, processName });
            if (!htmlContent) throw new Error("Could not generate diagram content.");

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const file = new File([blob], fileName, { type: 'text/html' });

            await shareFile({
                file,
                title: processName || 'Tasree3 Diagram',
                text: `Check out this business process diagram generated by Tasree3 Process Reengineering.`
            });
        } catch (error) {
            // Error handling is handled in shareFile, or re-thrown
            throw error;
        }
    }, [generateHtmlContent, shareFile]);

    return { downloadHtml, shareHtml, shareFile, isDownloading, progress };
};
