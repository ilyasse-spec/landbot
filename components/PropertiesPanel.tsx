import React, { useState, useEffect, useCallback } from 'react';
import { useFlow } from '../context/FlowContext';
import { BlockType, ButtonOption, ButtonsBlock } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { isEqual } from 'lodash-es';

const PropertiesPanel: React.FC = () => {
    const { activePropertiesBlock, updateBlockData, removeBlock, setActivePropertiesBlockId } = useFlow();
    const [draftData, setDraftData] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (activePropertiesBlock) {
            setDraftData(activePropertiesBlock.data);
        } else {
            setDraftData(null);
        }
    }, [activePropertiesBlock]);

    const handleDataChange = (newData: Partial<any>) => {
        setDraftData((prev: any) => ({ ...prev, ...newData }));
    };

    const handleSaveChanges = () => {
        if (activePropertiesBlock && draftData) {
            updateBlockData(activePropertiesBlock.id, draftData);
            setActivePropertiesBlockId(null);
        }
    };
    
    const handleClose = () => {
        setActivePropertiesBlockId(null);
    }

    const handleDelete = () => {
        if (!activePropertiesBlock) return;
        const blockIdToDelete = activePropertiesBlock.id;
        setActivePropertiesBlockId(null);
        setTimeout(() => {
            removeBlock(blockIdToDelete);
        }, 300); 
        setShowDeleteConfirm(false);
    };

    const isDirty = activePropertiesBlock && !isEqual(activePropertiesBlock.data, draftData);

    const renderProperties = () => {
        if (!activePropertiesBlock || !draftData) return null;

        switch (activePropertiesBlock.type) {
            case BlockType.Welcome:
            case BlockType.Message:
            case BlockType.Goodbye:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
                            <textarea
                                value={draftData.message}
                                onChange={(e) => handleDataChange({ message: e.target.value })}
                                className="w-full p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                                rows={4}
                            />
                        </div>
                    </div>
                );
            case BlockType.Question:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Question Text</label>
                            <textarea
                                value={draftData.message}
                                onChange={(e) => handleDataChange({ message: e.target.value })}
                                className="w-full p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Save Answer to Variable</label>
                            <input
                                type="text"
                                value={draftData.variableName || ''}
                                onChange={(e) => handleDataChange({ variableName: e.target.value })}
                                placeholder="e.g., user_name"
                                className="w-full p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                            />
                        </div>
                    </div>
                );
            case BlockType.Field:
                return (
                     <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Variable Name</label>
                        <input
                            type="text"
                            value={draftData.variableName || ''}
                            onChange={(e) => handleDataChange({ variableName: e.target.value })}
                            placeholder="e.g., user_email"
                            className="w-full p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                        />
                    </div>
                );
            case BlockType.Buttons: {
                const block = activePropertiesBlock as ButtonsBlock;

                const handleOptionChange = (index: number, text: string) => {
                    const newOptions = [...draftData.options];
                    newOptions[index] = { ...newOptions[index], text };
                    handleDataChange({ options: newOptions });
                };
                
                const addOption = () => {
                    if (draftData.options.length >= 5) return;
                    const newOption: ButtonOption = {
                        id: `btn-${Date.now()}`,
                        text: `New Option`
                    };
                     handleDataChange({ options: [...draftData.options, newOption] });
                };

                const removeOption = (index: number) => {
                    if (draftData.options.length <= 1) return;
                    const newOptions = draftData.options.filter((_: any, i: number) => i !== index);
                    handleDataChange({ options: newOptions });
                };

                return (
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Message Text</label>
                            <textarea
                                value={draftData.message}
                                onChange={(e) => handleDataChange({ message: e.target.value })}
                                className="w-full p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                                rows={4}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Save Selection to Variable</label>
                            <input
                                type="text"
                                value={draftData.variableName || ''}
                                onChange={(e) => handleDataChange({ variableName: e.target.value })}
                                placeholder="e.g., user_choice"
                                className="w-full p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                            />
                        </div>
                        <div className="pt-2">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Buttons</h3>
                            <div className="space-y-3">
                            {draftData.options.map((option: ButtonOption, index: number) => (
                                <div key={option.id || index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="flex-1 p-2 border bg-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                                    />
                                    <button 
                                        onClick={() => removeOption(index)} 
                                        className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={draftData.options.length <= 1}
                                        aria-label="Remove option"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                            </div>
                            {draftData.options.length < 5 && (
                                <button onClick={addOption} className="mt-3 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
                                + Add Option
                            </button>
                            )}
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <>
            <aside 
                className={`absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-20 transform transition-transform duration-300 ease-in-out ${activePropertiesBlock ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {activePropertiesBlock && (
                    <div className="flex flex-col h-full">
                        <header className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                 <div>
                                    <h2 className="text-lg font-bold text-gray-800">Properties</h2>
                                    <p className="text-sm text-gray-500">{activePropertiesBlock.type}</p>
                                </div>
                                <button 
                                    onClick={handleClose}
                                    className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </header>
                        <main className="flex-1 overflow-y-auto p-4">
                            {renderProperties()}
                        </main>
                         <footer className="p-4 border-t border-gray-200 bg-gray-50/50">
                            <div className="flex justify-between items-center">
                                {activePropertiesBlock.type !== BlockType.Welcome ? (
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors"
                                        aria-label="Delete block"
                                    >
                                        <TrashIcon /> Delete Block
                                    </button>
                                ) : <div />}
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={!isDirty}
                                    className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </footer>
                    </div>
                )}
            </aside>
            {showDeleteConfirm && activePropertiesBlock && (
                <ConfirmationModal 
                    message={`Are you sure you want to delete this ${activePropertiesBlock.type} block?`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>
    );
};

export default PropertiesPanel;
