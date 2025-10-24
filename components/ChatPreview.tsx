import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Block, BlockType, Connection, ButtonsBlock, ButtonOption } from '../types';

type ChatMessage = {
    author: 'bot' | 'user' | 'system';
    content: React.ReactNode;
};

type AwaitingInputType = 'button' | 'text' | false;

interface ChatPreviewProps {
    blocks: Block[];
    connections: Connection[];
    onClose: () => void;
    isStandalone?: boolean;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ blocks, connections, onClose, isStandalone = false }) => {
    const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [awaitingInput, setAwaitingInput] = useState<AwaitingInputType>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processBlockRef = useRef<((block: Block | null, inputValue?: any) => void) | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    const findNextBlock = useCallback((sourceBlockId: string, sourceHandleId: string): Block | null => {
        const connection = connections.find(c => c.source.blockId === sourceBlockId && c.source.handleId === sourceHandleId);
        if (connection) {
            return blocks.find(b => b.id === connection.target.blockId) || null;
        }
        return null;
    }, [connections, blocks]);
    
    const handleButtonSelect = useCallback((block: ButtonsBlock, option: ButtonOption) => {
        // Use a functional update to get the latest state and prevent stale closures.
        setAwaitingInput(currentAwaitingInput => {
            if (currentAwaitingInput !== 'button') {
                return currentAwaitingInput; // Not expecting a button click, do nothing.
            }

            // Update history to replace buttons with the user's choice.
            setHistory(h => {
                // FIX: Explicitly type `newHistory` as `ChatMessage[]` to prevent type widening.
                const newHistory: ChatMessage[] = [
                    ...h.slice(0, -1), // Remove the message containing the button options.
                    { author: 'bot', content: block.data.message }, // Add back the plain message from the bot.
                    { author: 'user', content: option.text } // Add the user's selected option as their reply.
                ];
                return newHistory;
            });
            
            const nextBlock = findNextBlock(block.id, option.id);
            setTimeout(() => processBlockRef.current?.(nextBlock, option.text), 500);
            
            return false; // Set awaitingInput to false as we've received the input.
        });
    }, [findNextBlock]);

    const processBlock = (block: Block | null, inputValue?: any) => {
        if (!block) {
            setAwaitingInput(false);
            return;
        }

        setCurrentBlock(block);

        switch (block.type) {
            case BlockType.Welcome:
            case BlockType.Message:
                setHistory(h => [...h, { author: 'bot', content: block.data.message }]);
                const nextFromMessage = findNextBlock(block.id, 'output');
                setTimeout(() => processBlockRef.current?.(nextFromMessage), 1000);
                break;
            
            case BlockType.Goodbye:
                setHistory(h => [...h, { author: 'bot', content: block.data.message }]);
                // This is a terminal block, so we end the conversation.
                setTimeout(() => processBlockRef.current?.(null), 1000);
                break;

            case BlockType.Field:
                // Field block now processes silently
                const nextFromField = findNextBlock(block.id, 'output');
                processBlockRef.current?.(nextFromField, inputValue);
                break;

            case BlockType.Question:
                setHistory(h => [...h, { author: 'bot', content: block.data.message }]);
                setAwaitingInput('text');
                break;

            case BlockType.Buttons:
                 setHistory(h => [...h, { author: 'bot', content: (
                    <div>
                        <p className="mb-2">{block.data.message}</p>
                        <div className="flex flex-wrap gap-2">
                            {block.data.options.map(option => (
                                <button key={option.id} onClick={() => handleButtonSelect(block as ButtonsBlock, option)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                                    {option.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}]);
                setAwaitingInput('button');
                break;
        }
    };
    
    useEffect(() => {
        processBlockRef.current = processBlock;
    });

    useEffect(() => {
        const startBlock = blocks.find(b => b.type === BlockType.Welcome);
        processBlockRef.current?.(startBlock || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTextSubmit = useCallback((text: string) => {
        if (!currentBlock || awaitingInput !== 'text') return;
        
        setHistory(h => {
            const newHistory: ChatMessage[] = [...h, { author: 'user', content: text }];
            return newHistory;
        });

        setAwaitingInput(false);
        const nextBlock = findNextBlock(currentBlock.id, 'output');
        setTimeout(() => processBlockRef.current?.(nextBlock, text), 500);
    }, [currentBlock, awaitingInput, findNextBlock]);

    return (
        <div
            className={
                isStandalone
                    ? "bg-gray-100 w-screen h-screen flex items-center justify-center"
                    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            }
            onClick={isStandalone ? undefined : onClose}
        >
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold">{isStandalone ? "Chatbot" : "Chatbot Preview"}</h2>
                    {isStandalone ? (
                        <button 
                            onClick={onClose} 
                            className="text-sm font-semibold bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Back to Editor
                        </button>
                    ) : (
                        <button onClick={onClose} className="text-2xl">&times;</button>
                    )}
                </header>
                <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex mb-4 ${msg.author === 'user' ? 'justify-end' : msg.author === 'system' ? 'justify-center' : 'justify-start'}`}>
                           {msg.author === 'system' ? (
                                <div className="text-xs text-gray-400 italic px-4 py-1 bg-gray-100 rounded-full">
                                    {msg.content}
                                </div>
                           ) : (
                             <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.author === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.content}
                            </div>
                           )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>
                {awaitingInput === 'text' && (
                    <TextInputForm onSubmit={handleTextSubmit} />
                )}
            </div>
        </div>
    );
};


const TextInputForm: React.FC<{onSubmit: (text: string) => void}> = ({ onSubmit }) => {
    const [input, setInput] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSubmit(input.trim());
            setInput('');
        }
    };
    
    return (
        <footer className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 p-2 border rounded-md bg-white text-black"
                    placeholder="Type your message..."
                    autoFocus
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Send</button>
            </form>
        </footer>
    )
}

export default ChatPreview;