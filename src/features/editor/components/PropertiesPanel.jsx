import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Database, Unlink, ExternalLink, Info, Book, Settings } from 'lucide-react';
import DictionaryPicker from '../../dictionary/components/DictionaryPicker';
import { dictionaryService } from '../../dictionary/api/dictionaryService';

export default function PropertiesPanel({ selectedNode, onChange, onClose, readOnly = false, orgAttributes = [], processId, defaultTab }) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const [customAttributesData, setCustomAttributesData] = useState({});
    const [dictionaryOptions, setDictionaryOptions] = useState({});

    const isBpmnNode = selectedNode?.type?.startsWith('bpmn_');
    const [activeTab, setActiveTab] = useState(defaultTab || (isBpmnNode ? 'configuration' : 'properties'));

    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        } else if (!isBpmnNode && activeTab === 'configuration') {
            setActiveTab('properties');
        }
    }, [selectedNode?.id, isBpmnNode, defaultTab]);

    useEffect(() => {
        if (selectedNode) {
            setCustomAttributesData(selectedNode.data?.custom_attributes || {});
            setShowPicker(false);
        }
    }, [selectedNode]);


    const handleCustomAttributeChange = (attrId, value) => {
        const newData = { ...customAttributesData, [attrId]: value };
        setCustomAttributesData(newData);
        onChange(selectedNode.id, { ...selectedNode.data, custom_attributes: newData });
    };

    const getNodeElementTypeName = (type) => {
        const mapping = {
            'function': 'Function',
            'event': 'Event',
            'role': 'Role',
            'process': 'Process Path',
            'xor': 'XOR',
            'or': 'OR',
            'and': 'AND',
            'rule': 'Rule',
            'system': 'System',
            'document': 'Document',
            'database': 'Database',
            'info': 'Info',
            'org_element': 'Organizational unit',
            'person': 'Person',
            'department': 'Department',
            'risk': 'Risk',
            'control': 'Control'
        };
        return mapping[type] || null;
    };

    const relevantAttributes = orgAttributes?.filter(attr => {
        if (!attr.is_active) return false;
        if (attr.scope?.type !== 'Notation Element') return false;

        // Diagram-specific filter: only show if we're in the right process
        if (attr.is_diagram_specific) {
            if (!processId || attr.process_id !== processId) return false;
        }

        const attrSet = attr.scope.symbolSet || attr.scope.notationType || 'common';
        const attrName = attr.scope.symbolName || attr.scope.elementType || 'All';

        if (selectedNode.data?.symbolSet) {
            // New nodes with symbol metadata (case-insensitive for legacy mismatches like EPC vs epc)
            if (attrSet.toLowerCase() !== selectedNode.data.symbolSet.toLowerCase()) return false;
            return attrName === 'All' || attrName === selectedNode.data.symbolName;
        } else {
            // Legacy nodes without symbol metadata
            const mappedType = getNodeElementTypeName(selectedNode.type);
            return attrName === 'All' || attrName === mappedType || attr.scope.elementType === mappedType;
        }
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

        fetchDictionaryOptions();
    }, [relevantAttributes.length]);

    if (!selectedNode) return null;

    return (
        <div className="absolute right-4 top-24 bottom-6 w-80 z-40 animate-slide-in-right">
            <div
                className="h-full bg-theme-surface backdrop-blur-3xl border border-theme-border rounded-2xl overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.4)] flex flex-col"
            >
                {/* Isolated Header */}
                <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg-secondary/30 h-14">
                    <h3 className="font-bold text-theme-primary flex items-center gap-2">
                        {activeTab === 'configuration' ? (
                            <>
                                <Settings className="w-5 h-5 text-theme-accent" />
                                Configuration
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-5 bg-theme-accent rounded-full"></span>
                                Attribute
                            </>
                        )}
                    </h3>
                    <button onClick={onClose} className="text-theme-tertiary hover:text-theme-primary transition-colors">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {/* --- CONFIGURATION TAB --- */}
                    <div style={{ display: activeTab === 'configuration' ? 'block' : 'none' }} className="space-y-6">
                        {/* BPMN Event Configurator */}
                        {selectedNode.type === 'bpmn_event' && (
                            <div className="bg-theme-bg-tertiary/20 p-3 rounded-lg border border-theme-border mb-4 shadow-sm">
                                <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-primary mb-3">Event Configuration</h4>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-theme-secondary mb-1">State (Border Type)</label>
                                    <select
                                        value={selectedNode.data?.eventType || ''}
                                        onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, eventType: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-theme-input border border-theme-border rounded px-2 py-1.5 text-xs text-theme-primary outline-none focus:border-theme-accent"
                                    >
                                        <option value="" disabled>Auto-detect from label</option>
                                        <option value="start">Start (Thin)</option>
                                        <option value="intermediate">Intermediate (Double)</option>
                                        <option value="end">End (Thick)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-theme-secondary mb-1">Trigger (Inner Icon)</label>
                                    <select
                                        value={selectedNode.data?.triggerType || ''}
                                        onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, triggerType: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-theme-input border border-theme-border rounded px-2 py-1.5 text-xs text-theme-primary outline-none focus:border-theme-accent"
                                    >
                                        <option value="" disabled>Auto-detect from properties</option>
                                        <option value="none">None</option>
                                        <option value="message">Message (Envelope)</option>

                                        {(() => {
                                            let actualEventType = selectedNode.data?.eventType;
                                            if (!actualEventType) {
                                                const lowerLabel = (selectedNode.data?.label || "").toLowerCase();
                                                if (lowerLabel.includes('start')) actualEventType = 'start';
                                                else if (lowerLabel.includes('end')) actualEventType = 'end';
                                                else actualEventType = 'intermediate';
                                            }

                                            return (
                                                <>
                                                    {actualEventType !== 'end' && <option value="timer">Timer (Clock)</option>}
                                                    {actualEventType !== 'end' && <option value="conditional">Conditional (Document)</option>}
                                                    {actualEventType === 'intermediate' && <option value="link">Link (Arrow)</option>}

                                                    <option value="signal">Signal (Triangle)</option>
                                                    <option value="error">Error (Lightning)</option>
                                                    <option value="escalation">Escalation (Up Chevron)</option>

                                                    {actualEventType !== 'start' && <option value="cancel">Cancel (X Cross)</option>}
                                                    <option value="compensation">Compensation (Rewind)</option>
                                                    <option value="multiple">Multiple (Pentagon)</option>
                                                    {actualEventType !== 'end' && <option value="multiple_parallel">Multiple Parallel (Plus)</option>}

                                                    {actualEventType === 'end' && <option value="termination">Termination (Filled Circle)</option>}
                                                </>
                                            );
                                        })()}
                                    </select>
                                </div>

                                {(() => {
                                    let actualEventType = selectedNode.data?.eventType;
                                    if (!actualEventType) {
                                        const lowerLabel = (selectedNode.data?.label || "").toLowerCase();
                                        if (lowerLabel.includes('start')) actualEventType = 'start';
                                        else if (lowerLabel.includes('end')) actualEventType = 'end';
                                        else actualEventType = 'intermediate';
                                    }
                                    const actualTriggerType = selectedNode.data?.triggerType || 'none';

                                    // Only certain triggers actually support switching to a non-interrupting (dashed) state
                                    const allowedInterruptingTriggers = ['message', 'timer', 'escalation', 'conditional', 'signal', 'multiple', 'multiple_parallel'];

                                    if (actualEventType !== 'end' && allowedInterruptingTriggers.includes(actualTriggerType)) {
                                        return (
                                            <div className="mb-3 flex items-center justify-between">
                                                <label className="text-xs font-medium text-theme-secondary">Interrupting (Solid)</label>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNode.data?.isInterrupting !== false}
                                                    onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, isInterrupting: e.target.checked })}
                                                    disabled={readOnly}
                                                    className="w-3.5 h-3.5 rounded border-theme-border text-theme-accent focus:ring-theme-accent/20 bg-theme-input"
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {(() => {
                                    let actualEventType = selectedNode.data?.eventType;
                                    if (!actualEventType) {
                                        const lowerLabel = (selectedNode.data?.label || "").toLowerCase();
                                        if (lowerLabel.includes('start')) actualEventType = 'start';
                                        else if (lowerLabel.includes('end')) actualEventType = 'end';
                                        else actualEventType = 'intermediate';
                                    }
                                    const actualTriggerType = selectedNode.data?.triggerType || 'none';
                                    const validThrowingTriggers = ['none', 'message', 'escalation', 'link', 'compensation', 'signal', 'multiple'];

                                    // Throwing toggle only makes sense for Intermediate events that support it
                                    if (actualEventType === 'intermediate' && validThrowingTriggers.includes(actualTriggerType)) {
                                        return (
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-medium text-theme-secondary" title="Makes the intermediate event a Throwing event">Throwing (Filled Icon)</label>
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedNode.data?.isThrowing}
                                                    onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, isThrowing: e.target.checked })}
                                                    disabled={readOnly}
                                                    className="w-3.5 h-3.5 rounded border-theme-border text-theme-accent focus:ring-theme-accent/20 bg-theme-input"
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}

                        {/* BPMN Task Configurator */}
                        {selectedNode.type === 'bpmn_task' && (
                            <div className="bg-theme-bg-tertiary/20 p-3 rounded-lg border border-theme-border mb-4 shadow-sm">
                                <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-primary mb-3">Activity Configuration</h4>

                                {/* Task Type — only meaningful for plain Tasks */}
                                {(() => {
                                    let actualActivityType = selectedNode.data?.activityType;
                                    if (!actualActivityType) {
                                        const lowerLabel = (selectedNode.data?.label || "").toLowerCase();
                                        const innerIconName = selectedNode.data?.iconName || selectedNode.data?.icon;
                                        if (lowerLabel.includes("transaction")) actualActivityType = 'transaction';
                                        else if (lowerLabel.includes("call")) actualActivityType = 'call_activity';
                                        else if (lowerLabel.includes("sub-process") || innerIconName === 'Box') actualActivityType = 'subprocess';
                                        else actualActivityType = 'task';
                                    }
                                    return actualActivityType === 'task';
                                })() && (
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-theme-secondary mb-1">Task Type (Top-Left Icon)</label>
                                            <select
                                                value={selectedNode.data?.taskType || 'none'}
                                                onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, taskType: e.target.value })}
                                                disabled={readOnly}
                                                className="w-full bg-theme-input border border-theme-border rounded px-2 py-1.5 text-xs text-theme-primary outline-none focus:border-theme-accent"
                                            >
                                                <option value="none">None (Plain Task)</option>
                                                <option value="send">Send Task (Filled Envelope ✉)</option>
                                                <option value="receive">Receive Task (Open Envelope)</option>
                                                <option value="user">User Task (Person)</option>
                                                <option value="manual">Manual Task (Hand)</option>
                                                <option value="business_rule">Business Rule Task (Table)</option>
                                                <option value="service">Service Task (Gear)</option>
                                                <option value="script">Script Task (Scroll)</option>
                                            </select>
                                        </div>
                                    )}

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-theme-secondary mb-1">Activity Type (Border)</label>
                                    <select
                                        value={selectedNode.data?.activityType || ''}
                                        onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, activityType: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-theme-input border border-theme-border rounded px-2 py-1.5 text-xs text-theme-primary outline-none focus:border-theme-accent"
                                    >
                                        <option value="" disabled>Auto-detect from label</option>
                                        <option value="task">Task (Solid)</option>
                                        <option value="subprocess">Sub-Process (Dashed)</option>
                                        <option value="transaction">Transaction (Double)</option>
                                        <option value="call_activity">Call Activity (Thick)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-theme-secondary mb-1">Marker</label>
                                    <select
                                        value={
                                            selectedNode.data?.loopType && selectedNode.data.loopType !== 'none'
                                                ? selectedNode.data.loopType
                                                : selectedNode.data?.isAdHoc
                                                    ? 'adhoc'
                                                    : selectedNode.data?.isCompensation
                                                        ? 'compensation'
                                                        : 'none'
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            onChange(selectedNode.id, {
                                                ...selectedNode.data,
                                                loopType: ['loop', 'parallel', 'sequential'].includes(val) ? val : 'none',
                                                isAdHoc: val === 'adhoc',
                                                isCompensation: val === 'compensation'
                                            });
                                        }}
                                        disabled={readOnly}
                                        className="w-full bg-theme-input border border-theme-border rounded px-2 py-1.5 text-xs text-theme-primary outline-none focus:border-theme-accent"
                                    >
                                        <option value="none">None</option>
                                        <option value="loop">Loop (↻ marker)</option>
                                        <option value="parallel">Parallel Multi-Instance (III marker)</option>
                                        <option value="sequential">Sequential Multi-Instance (☰ marker)</option>
                                        <option value="adhoc">Ad Hoc (~ marker)</option>
                                        <option value="compensation">Compensation (&lt;&lt; marker)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* BPMN Gateway Configurator */}
                        {selectedNode.type === 'bpmn_gateway' && (
                            <div className="bg-theme-bg-tertiary/20 p-3 rounded-lg border border-theme-border mb-4 shadow-sm">
                                <h4 className="text-[11px] uppercase tracking-wider font-bold text-theme-primary mb-3">Gateway Configuration</h4>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-theme-secondary mb-1">Type (Inner Symbol)</label>
                                    <select
                                        value={selectedNode.data?.gatewayType || ''}
                                        onChange={(e) => onChange(selectedNode.id, { ...selectedNode.data, gatewayType: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-theme-input border border-theme-border rounded px-2 py-1.5 text-xs text-theme-primary outline-none focus:border-theme-accent"
                                    >
                                        <option value="" disabled>Auto-detect from title</option>
                                        <option value="exclusive">Exclusive (X)</option>
                                        <option value="parallel">Parallel (+)</option>
                                        <option value="inclusive">Inclusive (O)</option>
                                        <option value="complex">Complex (*)</option>
                                        <option value="event_based">Event-Based (Double Circle)</option>
                                        <option value="exclusive_event_based">Exclusive Event-Based (Single Circle)</option>
                                        <option value="parallel_event_based">Parallel Event-Based (Circle +)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- PROPERTIES TAB --- */}
                    <div style={{ display: activeTab === 'properties' ? 'block' : 'none' }} className="space-y-6">
                        {/* Attributes */}
                        <>
                            {relevantAttributes.length === 0 && (
                                <div className="text-center text-sm text-theme-tertiary italic p-4 bg-theme-bg-tertiary/30 rounded border border-theme-border border-dashed">
                                    No custom attributes defined for this element.
                                </div>
                            )}
                            {relevantAttributes.map(attr => (
                                <div key={attr.id}>
                                    {attr.type !== 'Boolean' && (
                                        <label className="block text-xs font-medium text-theme-secondary mb-1.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                {attr.name}
                                                {attr.description && (
                                                    <span title={attr.description} className="flex">
                                                        <Info size={12} className="text-theme-tertiary transition-colors hover:text-theme-secondary" />
                                                    </span>
                                                )}
                                            </div>
                                            {attr.read_only && <span className="text-[9px] uppercase bg-theme-bg-tertiary px-1 rounded text-theme-tertiary">Read Only</span>}
                                        </label>
                                    )}

                                    {attr.type === 'Single-line Text' && (
                                        <input
                                            type="text"
                                            value={customAttributesData[attr.id] || ''}
                                            onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                            readOnly={readOnly || attr.read_only}
                                            className={`w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors ${(readOnly || attr.read_only) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            placeholder={attr.description || ''}
                                        />
                                    )}

                                    {attr.type === 'Multi-line text' && (
                                        <textarea
                                            value={customAttributesData[attr.id] || ''}
                                            onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                            readOnly={readOnly || attr.read_only}
                                            rows={3}
                                            className={`w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors resize-none ${(readOnly || attr.read_only) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            placeholder={attr.description || ''}
                                        />
                                    )}

                                    {attr.type === 'Date' && (
                                        <input
                                            type="date"
                                            value={customAttributesData[attr.id] || ''}
                                            onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                            readOnly={readOnly || attr.read_only}
                                            className={`w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors ${(readOnly || attr.read_only) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                                {attr.read_only && <span className="text-[9px] uppercase bg-theme-bg-tertiary px-1 rounded text-theme-tertiary">Read Only</span>}
                                            </span>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!customAttributesData[attr.id]}
                                                    onChange={(e) => handleCustomAttributeChange(attr.id, e.target.checked)}
                                                    disabled={readOnly || attr.read_only}
                                                    className="w-4 h-4 rounded border-theme-border text-theme-accent focus:ring-theme-accent/20 bg-theme-input"
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {attr.type === 'List' && (
                                        <select
                                            value={customAttributesData[attr.id] || ''}
                                            onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                                            disabled={readOnly || attr.read_only}
                                            className={`w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors appearance-none ${(readOnly || attr.read_only) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                            disabled={readOnly || attr.read_only}
                                            className={`w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-theme-accent transition-colors appearance-none ${(readOnly || attr.read_only) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                        </>
                    </div>

                </div>
            </div>
        </div>
    );
}
