import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Save, Info, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dictionaryService } from '../api/dictionaryService';

export default function DictionaryItemModal({ show, onClose, itemToEdit, onSuccess, orgAttributes = [] }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        metadata: [] // Array of { key: '', value: '' }
    });
    const [customAttributesData, setCustomAttributesData] = useState({});
    const [dictionaryOptions, setDictionaryOptions] = useState({});

    // Excel Column Mapping State
    const [excelData, setExcelData] = useState(null);
    const [excelColumns, setExcelColumns] = useState([]);
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [mappingForm, setMappingForm] = useState({ keyCol: '', valCol: '' });

    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                name: itemToEdit.name || '',
                description: itemToEdit.description || '',
                metadata: Array.isArray(itemToEdit.metadata) ? itemToEdit.metadata : []
            });
            setCustomAttributesData(itemToEdit.custom_attributes || {});
        } else {
            setFormData({
                name: '',
                description: '',
                metadata: []
            });
            setCustomAttributesData({});
        }

        // Reset mapping state on modal open/close
        setExcelData(null);
        setExcelColumns([]);
        setShowColumnMapping(false);
        setMappingForm({ keyCol: '', valCol: '' });
    }, [itemToEdit, show]);

    const handleCustomAttributeChange = (attrId, value) => {
        setCustomAttributesData(prev => ({ ...prev, [attrId]: value }));
    };

    const relevantAttributes = orgAttributes?.filter(attr => {
        return attr.is_active && attr.scope?.type === 'Dictionary';
    }) || [];

    useEffect(() => {
        const fetchDictionaryOptions = async () => {
            const dictionaryAttrs = relevantAttributes.filter(attr => attr.type === 'Dictionary' && attr.options?.[0]);

            if (dictionaryAttrs.length === 0) return;

            const newOptions = {};
            try {
                const allDictItems = await dictionaryService.getAllRequest();

                dictionaryAttrs.forEach(attr => {
                    const dictId = attr.options[0];
                    const foundItem = allDictItems.find(item => item._id === dictId);
                    if (foundItem && foundItem.metadata) {
                        newOptions[attr.id] = foundItem.metadata;
                    }
                });

                setDictionaryOptions(newOptions);
            } catch (error) {
                console.error("Failed to fetch dictionaries for custom attributes", error);
            }
        };

        if (show) {
            fetchDictionaryOptions();
        }
    }, [relevantAttributes.length, show]);

    const handleMetadataChange = (index, field, value) => {
        const newMetadata = [...formData.metadata];
        newMetadata[index][field] = value;
        setFormData({ ...formData, metadata: newMetadata });
    };

    const addMetadataField = () => {
        setFormData({
            ...formData,
            metadata: [...formData.metadata, { key: '', value: '' }]
        });
    };

    const removeMetadataField = (index) => {
        const newMetadata = formData.metadata.filter((_, i) => i !== index);
        setFormData({ ...formData, metadata: newMetadata });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Read as array of objects to get column headers easily
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (data.length > 0) {
                    const columns = Object.keys(data[0]);
                    setExcelColumns(columns);
                    setExcelData(data);

                    // Auto-guess 'key' and 'value' columns if possible
                    const lowerCols = columns.map(c => c.toLowerCase());
                    const defaultKey = columns[lowerCols.findIndex(c => c.includes('key') || c.includes('name'))] || columns[0] || '';
                    const defaultVal = columns[lowerCols.findIndex(c => c.includes('value') || c.includes('val'))] || columns[1] || '';

                    setMappingForm({ keyCol: defaultKey, valCol: defaultVal });
                    setShowColumnMapping(true);
                } else {
                    alert("The Excel sheet appears to be empty.");
                }

            } catch (err) {
                console.error("Error parsing Excel file", err);
                alert("Failed to parse the Excel file. Please ensure it is a valid format.");
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const confirmExcelImport = () => {
        if (!mappingForm.keyCol || !mappingForm.valCol) {
            alert("Please select both a Key column and a Value column.");
            return;
        }

        const importedMetadata = [];

        excelData.forEach((row) => {
            const keyStr = String(row[mappingForm.keyCol] || '').trim();
            const valStr = String(row[mappingForm.valCol] || '').trim();

            if (keyStr) {  // Only add if key is non-empty
                importedMetadata.push({ key: keyStr, value: valStr });
            }
        });

        if (importedMetadata.length > 0) {
            setFormData(prev => ({
                ...prev,
                metadata: [...prev.metadata, ...importedMetadata]
            }));
        }

        cancelExcelImport();
    };

    const cancelExcelImport = () => {
        setExcelData(null);
        setExcelColumns([]);
        setShowColumnMapping(false);
        setMappingForm({ keyCol: '', valCol: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Filter out empty metadata keys
            const cleanMetadata = formData.metadata.filter(m => m.key.trim() !== '');
            const payload = { ...formData, metadata: cleanMetadata, custom_attributes: customAttributesData };

            if (itemToEdit) {
                await dictionaryService.updateRequest(itemToEdit._id, payload);
            } else {
                await dictionaryService.createRequest(payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save item:", error);
            // Ideally show toast here via parent helper or context
            alert("Failed to save item: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-app-surface w-full max-w-lg rounded-2xl border border-theme-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-theme-primary">
                            {itemToEdit ? 'Edit Dictionary Item' : 'Add New Item'}
                        </h3>
                        <button onClick={onClose} className="text-theme-tertiary hover:text-theme-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-accent text-theme-primary"
                                placeholder="e.g. Server X-1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 focus:outline-none focus:border-theme-accent text-theme-primary min-h-[80px]"
                                placeholder="Brief description..."
                            />
                        </div>

                        {/* Dynamic Custom Attributes */}
                        {relevantAttributes.length > 0 && (
                            <div className="space-y-4 pt-2 border-t border-theme-border">
                                <h4 className="text-sm font-bold text-theme-primary">Custom Attributes</h4>
                                {relevantAttributes.map(attr => (
                                    <div key={attr.id}>
                                        {attr.type !== 'Boolean' && (
                                            <label className="block text-sm font-medium text-theme-secondary mb-1 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    {attr.name}
                                                    {attr.description && (
                                                        <span title={attr.description} className="flex">
                                                            <Info size={12} className="text-theme-tertiary transition-colors hover:text-theme-secondary" />
                                                        </span>
                                                    )}
                                                </div>
                                                {attr.read_only && <span className="text-[10px] uppercase bg-theme-bg-tertiary px-1.5 rounded text-theme-tertiary">Read Only</span>}
                                            </label>
                                        )}

                                        {attr.type === 'Single-line Text' && (
                                            <input
                                                type="text"
                                                value={customAttributesData[attr.id] || ''}
                                                onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                                disabled={itemToEdit && attr.read_only && customAttributesData[attr.id] !== undefined}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                placeholder={attr.description || ''}
                                            />
                                        )}

                                        {attr.type === 'Multi-line text' && (
                                            <textarea
                                                value={customAttributesData[attr.id] || ''}
                                                onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                                disabled={itemToEdit && attr.read_only && customAttributesData[attr.id] !== undefined}
                                                rows={3}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                                placeholder={attr.description || ''}
                                            />
                                        )}

                                        {attr.type === 'Date' && (
                                            <input
                                                type="date"
                                                value={customAttributesData[attr.id] || ''}
                                                onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                                disabled={itemToEdit && attr.read_only && customAttributesData[attr.id] !== undefined}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            />
                                        )}

                                        {attr.type === 'Boolean' && (
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs font-medium text-theme-secondary flex items-center gap-1.5">
                                                    {attr.name}
                                                    {attr.description && (
                                                        <span title={attr.description} className="flex">
                                                            <Info size={12} className="text-theme-tertiary transition-colors hover:text-theme-secondary" />
                                                        </span>
                                                    )}
                                                    {attr.read_only && <span className="text-[10px] uppercase bg-theme-bg-tertiary px-1.5 rounded text-theme-tertiary">Read Only</span>}
                                                </span>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!customAttributesData[attr.id]}
                                                        onChange={(e) => handleCustomAttributeChange(attr.id, e.target.checked)}
                                                        disabled={itemToEdit && attr.read_only && customAttributesData[attr.id] !== undefined}
                                                        className="w-4 h-4 rounded border-theme-border text-theme-accent focus:ring-theme-accent/20 bg-theme-input"
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        {attr.type === 'List' && (
                                            <select
                                                value={customAttributesData[attr.id] || ''}
                                                onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                                disabled={itemToEdit && attr.read_only && customAttributesData[attr.id] !== undefined}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                            >
                                                <option value="">Select an option...</option>
                                                {(attr.options || []).map((opt, idx) => (
                                                    <option key={idx} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {attr.type === 'Dictionary' && (
                                            <select
                                                value={customAttributesData[attr.id] || ''}
                                                onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                                disabled={itemToEdit && attr.read_only && customAttributesData[attr.id] !== undefined}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                            >
                                                <option value="">Select an option...</option>
                                                {(dictionaryOptions[attr.id] || []).map((meta, idx) => (
                                                    <option key={idx} value={meta.value}>{meta.key}: {meta.value}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Metadata Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-theme-secondary">Custom Attributes</label>
                                <div className="flex gap-3 items-center">
                                    <label className="text-xs flex items-center gap-1 text-theme-tertiary cursor-pointer hover:text-theme-accent transition-colors">
                                        <Upload size={14} /> Import Excel
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls, .csv"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addMetadataField}
                                        className="text-xs flex items-center gap-1 text-theme-accent hover:text-theme-accent/80 transition-colors"
                                    >
                                        <Plus size={14} /> Add Attribute
                                    </button>
                                </div>
                            </div>

                            {showColumnMapping && (
                                <div className="mb-4 bg-theme-bg-tertiary p-3 rounded-lg border border-theme-border/50 animate-fade-in">
                                    <h5 className="text-sm font-semibold text-theme-primary mb-2">Map Excel Columns</h5>
                                    <div className="flex gap-3 mb-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-theme-secondary mb-1">Key Column</label>
                                            <select
                                                value={mappingForm.keyCol}
                                                onChange={(e) => setMappingForm(prev => ({ ...prev, keyCol: e.target.value }))}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-2 py-1.5 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                                            >
                                                <option value="">Select a column...</option>
                                                {excelColumns.map((col, idx) => (
                                                    <option key={idx} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-theme-secondary mb-1">Value Column</label>
                                            <select
                                                value={mappingForm.valCol}
                                                onChange={(e) => setMappingForm(prev => ({ ...prev, valCol: e.target.value }))}
                                                className="w-full bg-theme-input border border-theme-border rounded-lg px-2 py-1.5 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                                            >
                                                <option value="">Select a column...</option>
                                                {excelColumns.map((col, idx) => (
                                                    <option key={idx} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={cancelExcelImport} className="px-3 py-1.5 text-xs text-theme-secondary hover:bg-theme-bg-secondary rounded-lg transition-colors">Cancel</button>
                                        <button type="button" onClick={confirmExcelImport} className="px-3 py-1.5 text-xs bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg transition-colors">Import {excelData?.length || 0} Rows</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {formData.metadata.length === 0 && (
                                    <p className="text-xs text-theme-tertiary italic text-center py-2 bg-theme-bg-tertiary rounded-lg border border-theme-border border-dashed">
                                        No custom attributes defined.
                                    </p>
                                )}
                                {formData.metadata.map((meta, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            value={meta.key}
                                            onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                                            className="flex-1 bg-theme-input border border-theme-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-theme-accent"
                                            placeholder="Key (e.g. Cost)"
                                        />
                                        <input
                                            type="text"
                                            value={meta.value}
                                            onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                                            className="flex-1 bg-theme-input border border-theme-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-theme-accent"
                                            placeholder="Value (e.g. $500)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMetadataField(index)}
                                            className="p-1.5 text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-theme-border mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-theme-secondary hover:bg-theme-bg-tertiary rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                <Save size={16} />
                                {itemToEdit ? 'Save Changes' : 'Create Item'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
