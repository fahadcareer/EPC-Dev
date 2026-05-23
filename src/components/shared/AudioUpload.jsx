import React, { useRef, useState } from 'react';
import { Mic, Music, Loader2, AlertCircle } from 'lucide-react';
import NETWORK_URLS from '../../config/network_string';
import api from '../../services/api_service';

const AudioUpload = ({ onTranscribe, loading: parentLoading }) => {
    const fileInputRef = useRef(null);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if it's an audio file
        const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/flac'];
        if (!audioTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
            alert("Please upload a valid audio file (MP3, WAV, M4A, etc.)");
            return;
        }

        try {
            setIsTranscribing(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/audio/transcribe', formData);

            if (response.data.text) {
                onTranscribe(response.data.text);
            } else if (response.data.error) {
                alert(`Transcription Error: ${response.data.error}`);
            }
        } catch (error) {
            console.error("Audio Upload Error:", error);
            alert("Failed to transcribe audio. Please check your connection and try again.");
        } finally {
            setIsTranscribing(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex items-center">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="audio/*"
                disabled={isTranscribing || parentLoading}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTranscribing || parentLoading}
                className={`p-1.5 rounded-lg transition-all duration-200 ${isTranscribing
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-input'
                    }`}
                title="Upload audio for transcription"
            >
                {isTranscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Music className="w-4 h-4" />
                )}
            </button>
        </div>
    );
};

export default AudioUpload;
