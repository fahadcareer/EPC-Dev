import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Database, X } from 'lucide-react';
import { dictionaryService } from '../api/dictionaryService';

export default function DictionaryPicker({ onSelect, onCancel, selectedId }) {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await dictionaryService.getAllRequest();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch dictionary items", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-app-surface border border-theme-border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-3 border-b border-theme-border flex items-center gap-2">
                <Search className="w-4 h-4 text-theme-tertiary" />
                <input
                    type="text"
                    autoFocus
                    placeholder="Search dictionary..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-theme-primary focus:outline-none"
                />
                <button onClick={onCancel} className="text-theme-tertiary hover:text-theme-primary">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                {loading ? (
                    <div className="p-4 text-center text-theme-tertiary">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <span className="text-xs">Loading...</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-4 text-center text-theme-tertiary text-xs">
                        No items found.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredItems.map(item => (
                            <button
                                key={item._id}
                                onClick={() => onSelect(item)}
                                className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${selectedId === item._id
                                        ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/30'
                                        : 'hover:bg-theme-bg-tertiary text-theme-secondary hover:text-theme-primary'
                                    }`}
                            >
                                <Database className="w-4 h-4 shrink-0 opacity-70" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{item.name}</div>
                                    {item.description && (
                                        <div className="text-xs text-theme-tertiary truncate">{item.description}</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
