import React from 'react';
import { useFlow } from '../context/FlowContext';
import { CopyIcon } from './icons/CopyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';

interface SelectionToolbarProps {
    count: number;
    position: { top: number; left: number };
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ count, position }) => {
    const { duplicateSelectedBlocks, removeSelectedBlocks, clearSelection } = useFlow();

    return (
        <div 
            className="absolute z-20 bg-white rounded-lg shadow-lg flex items-center p-1 space-x-1 transition-all duration-150"
            style={{ 
                ...position, 
                transform: 'translateX(-50%)' 
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas panning
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <span className="font-bold text-sm text-gray-700 px-3">{count} selected</span>
            <div className="h-6 w-px bg-gray-200" />
            <button 
                onClick={duplicateSelectedBlocks} 
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 rounded-md"
                title="Duplicate"
            >
                <CopyIcon />
            </button>
            <button 
                onClick={removeSelectedBlocks} 
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-md"
                title="Delete"
            >
                <TrashIcon />
            </button>
            <button 
                onClick={clearSelection} 
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md"
                title="Deselect"
            >
                <XIcon />
            </button>
        </div>
    );
};

export default SelectionToolbar;