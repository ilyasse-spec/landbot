import React, { useState, useEffect, useRef } from 'react';
import { Block, BlockType, WelcomeBlock, QuestionBlock, ButtonsBlock, FieldBlock, ButtonOption, MessageBlock, GoodbyeBlock } from '../types';
import { useFlow } from '../context/FlowContext';
import { MessageIcon } from './icons/MessageIcon';
import { QuestionIcon } from './icons/QuestionIcon';
import { MousePointerClickIcon } from './icons/MousePointerClickIcon';
import { FieldIcon } from './icons/FieldIcon';
import { GoodbyeIcon } from './icons/GoodbyeIcon';
import { WelcomeIcon } from './icons/WelcomeIcon';


const Handle: React.FC<{
    type: 'input' | 'output';
    blockId: string;
    handleId: string;
}> = ({ type, blockId, handleId }) => {
    const { startConnecting, completeConnection, connectingFrom } = useFlow();

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (type === 'output') {
            startConnecting(blockId, handleId);
        }
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (type === 'input' && connectingFrom) {
            completeConnection(blockId, handleId);
        }
    };

    const positionClass = type === 'input' ? '-left-2.5' : '-right-2.5';

    return (
        <div
            id={`handle-${blockId}-${handleId}`}
            className={`absolute top-1/2 -translate-y-1/2 ${positionClass} w-5 h-5 bg-white border-2 border-gray-400 rounded-full hover:bg-indigo-500 hover:border-indigo-500 transition-colors z-10`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        />
    );
};

const WelcomeBlockContent: React.FC<{ block: WelcomeBlock }> = ({ block }) => (
    <div className="p-4 bg-white">{block.data.message}</div>
);

const MessageBlockContent: React.FC<{ block: MessageBlock }> = ({ block }) => (
    <div className="p-4 bg-white">{block.data.message}</div>
);

const GoodbyeBlockContent: React.FC<{ block: GoodbyeBlock }> = ({ block }) => (
    <div className="p-4 bg-white">{block.data.message}</div>
);

const QuestionBlockContent: React.FC<{ block: QuestionBlock }> = ({ block }) => (
     <div className="p-4 bg-white">{block.data.message}</div>
);

const ButtonsBlockContent: React.FC<{ block: ButtonsBlock }> = ({ block }) => (
    <>
      <div className="p-4 bg-white border-b border-gray-200">{block.data.message}</div>
      <div className="p-2 space-y-1 bg-gray-50/50">
        {block.data.options.map((opt) => (
          <div key={opt.id} className="relative bg-white border border-gray-200 rounded-md p-2 text-sm text-center">
            {opt.text}
            <Handle type="output" blockId={block.id} handleId={opt.id} />
          </div>
        ))}
      </div>
    </>
);

const FieldBlockContent: React.FC<{ block: FieldBlock }> = ({ block }) => (
    <div className="p-4 bg-white">
      <div className="p-2 border border-dashed border-gray-300 rounded-md text-gray-500 text-sm">
        Save input to: @{block.data.variableName}
      </div>
    </div>
);


const BlockComponent: React.FC<{ block: Block }> = ({ block }) => {
    const { dragBlocks, setActivePropertiesBlockId, selectedBlockIds, toggleBlockSelection, startBlockDrag, endBlockDrag } = useFlow();
    const [isDragging, setIsDragging] = useState(false);
    const blockRef = useRef<HTMLDivElement>(null);
    
    const isSelected = selectedBlockIds.includes(block.id);

    const onMouseDown = (e: React.MouseEvent) => {
        if((e.target as HTMLElement).closest('.block-header') && !(e.target as HTMLElement).closest('input[type="checkbox"]')) {
            startBlockDrag(block.id);
            setIsDragging(true);
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const onDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePropertiesBlockId(block.id);
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDragging && blockRef.current) {
                const parentStyle = window.getComputedStyle(blockRef.current.parentElement!);
                const parentTransform = parentStyle.transform;
                const scaleMatch = parentTransform.match(/matrix\(([^,]+),/);
                const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

                const delta = {
                    x: e.movementX / scale,
                    y: e.movementY / scale,
                };
                dragBlocks(block.id, delta);
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                endBlockDrag(block.id);
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, block.id, dragBlocks, endBlockDrag]);
    
    const getBlockIcon = (type: BlockType) => {
        switch(type) {
            case BlockType.Welcome: return <WelcomeIcon />;
            case BlockType.Message: return <MessageIcon />;
            case BlockType.Goodbye: return <GoodbyeIcon />;
            case BlockType.Question: return <QuestionIcon />;
            case BlockType.Buttons: return <MousePointerClickIcon />;
            case BlockType.Field: return <FieldIcon />;
        }
    }

    const getBlockColorClasses = (type: BlockType): { headerBg: string, border: string, text: string } => {
        switch (type) {
            case BlockType.Welcome: return { headerBg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' };
            case BlockType.Message: return { headerBg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' };
            case BlockType.Question: return { headerBg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' };
            case BlockType.Buttons: return { headerBg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800' };
            case BlockType.Field: return { headerBg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-800' };
            case BlockType.Goodbye: return { headerBg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800' };
            default: return { headerBg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-800' };
        }
    };

    const colors = getBlockColorClasses(block.type);
    
    const renderContent = () => {
        switch (block.type) {
            case BlockType.Welcome: return <WelcomeBlockContent block={block} />;
            case BlockType.Message: return <MessageBlockContent block={block} />;
            case BlockType.Goodbye: return <GoodbyeBlockContent block={block} />;
            case BlockType.Question: return <QuestionBlockContent block={block} />;
            case BlockType.Buttons: return <ButtonsBlockContent block={block} />;
            case BlockType.Field: return <FieldBlockContent block={block} />;
            default: return null;
        }
    };
    
    const hasInput = block.type !== BlockType.Welcome;
    const hasSingleOutput = [BlockType.Welcome, BlockType.Question, BlockType.Field, BlockType.Message].includes(block.type);

    return (
        <div
            ref={blockRef}
            className={`absolute w-64 bg-gray-50 rounded-lg shadow-lg border-2 transition-colors noselect ${isSelected ? 'border-indigo-500' : 'border-transparent'}`}
            style={{ transform: `translate(${block.position.x}px, ${block.position.y}px)` }}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
        >
            <div className={`block-header flex items-center p-2 rounded-t-lg cursor-move border-b ${colors.headerBg} ${colors.border}`}>
                {block.type !== BlockType.Welcome ? (
                    <input 
                        type="checkbox"
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-white checked:bg-indigo-500"
                        checked={isSelected}
                        onChange={() => toggleBlockSelection(block.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="w-4 h-4 mr-2" />
                )}
                <div className={`mr-2 ${colors.text}`}>{getBlockIcon(block.type)}</div>
                <span className={`font-bold text-sm ${colors.text}`}>{block.type}</span>
            </div>
            
            {renderContent()}

            {hasInput && <Handle type="input" blockId={block.id} handleId="input" />}
            {hasSingleOutput && <Handle type="output" blockId={block.id} handleId="output" />}

        </div>
    );
};

export default BlockComponent;