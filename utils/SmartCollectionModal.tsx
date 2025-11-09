
import React, { useState } from 'react';
import { SmartPlaylist, RuleCondition, RuleField, RuleOperator } from '../types';

interface SmartCollectionModalProps {
    onClose: () => void;
    onSave: (playlist: SmartPlaylist) => void;
    playlistToEdit?: SmartPlaylist;
    allGenres: string[];
    allKeys: string[];
}

const fieldOptions: { value: RuleField; label: string; type: 'text' | 'number' | 'select' }[] = [
    { value: 'title', label: 'Tytuł', type: 'text' },
    { value: 'artist', label: 'Artysta', type: 'text' },
    { value: 'genre', label: 'Gatunek', type: 'select' },
    { value: 'bpm', label: 'BPM', type: 'number' },
    { value: 'key', label: 'Tonacja', type: 'select' },
    { value: 'year', label: 'Rok', type: 'number' },
];

const operatorOptions: { value: RuleOperator; label: string; types: ('text' | 'number' | 'select')[] }[] = [
    { value: 'contains', label: 'zawiera', types: ['text'] },
    { value: 'not_contains', label: 'nie zawiera', types: ['text'] },
    { value: 'is', label: 'jest', types: ['text', 'select'] },
    { value: 'is_not', label: 'nie jest', types: ['text', 'select'] },
    { value: 'eq', label: 'jest równe', types: ['number'] },
    { value: 'neq', label: 'nie jest równe', types: ['number'] },
    { value: 'gt', label: 'jest większe niż', types: ['number'] },
    { value: 'lt', label: 'jest mniejsze niż', types: ['number'] },
];

const SmartCollectionModal: React.FC<SmartCollectionModalProps> = ({ onClose, onSave, playlistToEdit, allGenres, allKeys }) => {
    const [name, setName] = useState(playlistToEdit?.name || '');
    const [rules, setRules] = useState<RuleCondition[]>(playlistToEdit?.rules || [{ id: crypto.randomUUID(), field: 'genre', operator: 'is', value: '' }]);
    const [matchType, setMatchType] = useState<'all' | 'any'>(playlistToEdit?.matchType || 'all');

    const handleRuleChange = (id: string, field: keyof RuleCondition, value: any) => {
        setRules(rules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
    };

    const addRule = () => {
        setRules([...rules, { id: crypto.randomUUID(), field: 'bpm', operator: 'gt', value: 120 }]);
    };
    
    const removeRule = (id: string) => {
        setRules(rules.filter(rule => rule.id !== id));
    };

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            id: playlistToEdit?.id || `smart-${crypto.randomUUID()}`,
            name,
            rules,
            matchType
        });
    };
    
    const getFieldType = (field: RuleField) => fieldOptions.find(f => f.value === field)?.type || 'text';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]">
            <div className="bg-[#16213e] rounded-2xl border border-cyan-400/30 p-6 w-full max-w-2xl flex flex-col gap-4 max-h-[90vh]">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-yellow-400">Edytor Inteligentnej Kolekcji</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Nazwa kolekcji</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="np. Energetyczny House"
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-sm font-bold text-gray-300">Dopasuj</label>
                                <select value={matchType} onChange={e => setMatchType(e.target.value as 'all' | 'any')} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500">
                                    <option value="all">wszystkie</option>
                                    <option value="any">dowolne</option>
                                </select>
                                <label className="text-sm font-bold text-gray-300">z poniższych reguł:</label>
                            </div>
                            
                            <div className="space-y-2 p-3 bg-black/30 rounded-lg border border-gray-700">
                                {rules.map((rule, index) => (
                                    <div key={rule.id} className="flex items-center gap-2">
                                        <select value={rule.field} onChange={e => handleRuleChange(rule.id, 'field', e.target.value as RuleField)} className="flex-shrink-0 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm">
                                            {fieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <select value={rule.operator} onChange={e => handleRuleChange(rule.id, 'operator', e.target.value as RuleOperator)} className="flex-shrink-0 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm">
                                            {operatorOptions.filter(op => op.types.includes(getFieldType(rule.field))).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        
                                        {getFieldType(rule.field) === 'select' && rule.field === 'genre' && (
                                            <select value={String(rule.value)} onChange={e => handleRuleChange(rule.id, 'value', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm">
                                                 {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        )}
                                        {getFieldType(rule.field) === 'select' && rule.field === 'key' && (
                                            <select value={String(rule.value)} onChange={e => handleRuleChange(rule.id, 'value', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm">
                                                 {allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        )}
                                        {getFieldType(rule.field) === 'text' && (
                                            <input type="text" value={String(rule.value)} onChange={e => handleRuleChange(rule.id, 'value', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm" />
                                        )}
                                        {getFieldType(rule.field) === 'number' && (
                                            <input type="number" value={Number(rule.value)} onChange={e => handleRuleChange(rule.id, 'value', Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm" />
                                        )}

                                        <button onClick={() => removeRule(rule.id)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><i className="fa-solid fa-trash-can"></i></button>
                                    </div>
                                ))}
                                <button onClick={addRule} className="text-sm text-green-400 hover:text-green-300 mt-2"><i className="fa-solid fa-plus mr-1"></i> Dodaj regułę</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Anuluj</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                        Zapisz
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartCollectionModal;