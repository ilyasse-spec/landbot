import React from 'react';
import { BlockType } from '../types';
import { WelcomeIcon } from './icons/WelcomeIcon';
import { MessageIcon } from './icons/MessageIcon';
import { QuestionIcon } from './icons/QuestionIcon';
import { MousePointerClickIcon } from './icons/MousePointerClickIcon';
import { FieldIcon } from './icons/FieldIcon';
import { GoodbyeIcon } from './icons/GoodbyeIcon';

const Sidebar: React.FC = () => {
    const onDragStart = (event: React.DragEvent, nodeType: BlockType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const blockTypes = [
        { type: BlockType.Welcome, icon: <WelcomeIcon />, label: 'Welcome' },
        { type: BlockType.Message, icon: <MessageIcon />, label: 'Message' },
        { type: BlockType.Question, icon: <QuestionIcon />, label: 'Question' },
        { type: BlockType.Buttons, icon: <MousePointerClickIcon />, label: 'Buttons' },
        { type: BlockType.Field, icon: <FieldIcon />, label: 'Field' },
        { type: BlockType.Goodbye, icon: <GoodbyeIcon />, label: 'Goodbye' },
    ];

    return (
        <aside className="absolute top-0 left-0 h-full z-10 p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-lg p-4 w-64 pointer-events-auto">
                 <h1 className="text-xl font-bold mb-1 text-gray-800">Flow Blocks</h1>
                <p className="text-sm text-gray-500 mb-6">Drag these to the canvas.</p>
                <div className="space-y-3">
                    {blockTypes.map(({ type, icon, label }) => (
                        <div
                            key={type}
                            onDragStart={(event) => onDragStart(event, type)}
                            draggable
                            className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-grab transition-all duration-200 ease-in-out hover:shadow-lg hover:border-indigo-500 hover:scale-105"
                        >
                            <div className="mr-3 text-indigo-600">{icon}</div>
                            <span className="font-semibold text-gray-700">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;