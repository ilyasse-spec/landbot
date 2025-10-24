import React from 'react';
import { BlockType, Position } from '../types';
import { useFlow } from '../context/FlowContext';
import { MessageIcon } from './icons/MessageIcon';
import { QuestionIcon } from './icons/QuestionIcon';
import { MousePointerClickIcon } from './icons/MousePointerClickIcon';
import { FieldIcon } from './icons/FieldIcon';
import { GoodbyeIcon } from './icons/GoodbyeIcon';

interface CreationContextMenuProps {
    position: Position;
    transform: { x: number, y: number, scale: number };
}

const CreationContextMenu: React.FC<CreationContextMenuProps> = ({ position, transform }) => {
    const { createBlockAndConnect, closeContextMenu, contextMenuState, insertBlockBetween } = useFlow();

    const menuX = position.x * transform.scale + transform.x;
    const menuY = position.y * transform.scale + transform.y;
    
    const blockTypes = [
        { type: BlockType.Message, icon: <MessageIcon />, label: 'Message' },
        { type: BlockType.Question, icon: <QuestionIcon />, label: 'Question' },
        { type: BlockType.Buttons, icon: <MousePointerClickIcon />, label: 'Buttons' },
        { type: BlockType.Field, icon: <FieldIcon />, label: 'Field' },
        { type: BlockType.Goodbye, icon: <GoodbyeIcon />, label: 'Goodbye' },
    ];
    
    const handleSelect = (type: BlockType) => {
        if (contextMenuState?.type === 'create') {
            createBlockAndConnect(type);
        } else if (contextMenuState?.type === 'insert') {
            insertBlockBetween(type);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-20" onClick={closeContextMenu} />
            <div
                className="absolute bg-white rounded-xl shadow-lg p-2 w-56 z-30"
                style={{ left: menuX, top: menuY }}
            >
                <p className="px-2 py-1 text-xs text-gray-400 font-semibold uppercase">Create Block</p>
                <div className="space-y-1">
                    {blockTypes.map(({ type, icon, label }) => (
                        <button
                            key={type}
                            onClick={() => handleSelect(type)}
                            className="w-full flex items-center p-2 text-left bg-white rounded-md transition-colors hover:bg-indigo-50"
                        >
                            <div className="mr-3 text-indigo-600">{icon}</div>
                            <span className="font-semibold text-sm text-gray-700">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default CreationContextMenu;