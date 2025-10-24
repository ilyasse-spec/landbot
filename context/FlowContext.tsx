import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Block, BlockType, Connection, Position, ButtonOption, ContextMenuState } from '../types';

interface FlowHistory {
    blocks: Block[];
    connections: Connection[];
}

interface FlowContextType {
    blocks: Block[];
    connections: Connection[];
    selectedBlockIds: string[];
    activePropertiesBlock: Block | undefined;
    addBlock: (type: BlockType, position: Position) => void;
    dragBlocks: (draggedBlockId: string, delta: Position) => void;
    startBlockDrag: (blockId: string) => void;
    endBlockDrag: (blockId: string) => void;
    updateBlockData: (blockId: string, data: any) => void;
    setActivePropertiesBlockId: (blockId: string | null) => void;
    removeBlock: (blockId: string) => void;
    toggleBlockSelection: (blockId: string) => void;
    clearSelection: () => void;
    removeSelectedBlocks: () => void;
    executeRemoveSelectedBlocks: () => void;
    cancelRemoveSelectedBlocks: () => void;
    isConfirmingMultiDelete: boolean;
    duplicateSelectedBlocks: () => void;
    addConnection: (connection: Omit<Connection, 'id'>) => void;
    removeConnection: (connectionId: string) => void;
    startConnecting: (blockId: string, handleId: string) => void;
    connectingFrom: { blockId: string, handleId: string } | null;
    completeConnection: (targetBlockId: string, targetHandleId: string) => void;
    cancelConnection: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    contextMenuState: ContextMenuState;
    openContextMenu: (payload: NonNullable<ContextMenuState>) => void;
    closeContextMenu: () => void;
    createBlockAndConnect: (type: BlockType) => void;
    insertBlockBetween: (type: BlockType) => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

const initialBlocks: Block[] = [
    {
        id: 'start',
        type: BlockType.Welcome,
        position: { x: 150, y: 150 },
        data: { message: 'Welcome to our chatbot!' },
    },
];

export const FlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
    const [activePropertiesBlockId, setActivePropertiesBlockId] = useState<string | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<{ blockId: string; handleId: string } | null>(null);
    const [contextMenuState, setContextMenuState] = useState<ContextMenuState>(null);
    const [isConfirmingMultiDelete, setIsConfirmingMultiDelete] = useState(false);

    // Undo/Redo State
    const [history, setHistory] = useState<FlowHistory[]>([{ blocks: initialBlocks, connections: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [dragStartPos, setDragStartPos] = useState<Record<string, Position>>({});

    const takeSnapshot = useCallback((newBlocks: Block[], newConnections: Connection[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, { blocks: newBlocks, connections: newConnections }]);
        setHistoryIndex(newHistory.length);
    }, [history, historyIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                 e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history]);


    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setBlocks(history[newIndex].blocks);
            setConnections(history[newIndex].connections);
            setHistoryIndex(newIndex);
            clearSelection();
            setActivePropertiesBlockId(null);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setBlocks(history[newIndex].blocks);
            setConnections(history[newIndex].connections);
            setHistoryIndex(newIndex);
            clearSelection();
            setActivePropertiesBlockId(null);
        }
    };
    
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const addBlock = useCallback((type: BlockType, position: Position) => {
        if (type === BlockType.Welcome && blocks.some(b => b.type === BlockType.Welcome)) {
            return;
        }

        const id = `${type.toLowerCase()}-${Date.now()}`;
        let newBlock: Block;
        switch (type) {
            case BlockType.Welcome:
                newBlock = { id, type, position, data: { message: 'Welcome message' } };
                break;
            case BlockType.Message:
                newBlock = { id, type, position, data: { message: 'Informational message' } };
                break;
            case BlockType.Goodbye:
                newBlock = { id, type, position, data: { message: 'Goodbye!' } };
                break;
            case BlockType.Question:
                newBlock = { id, type, position, data: { message: 'Your question here...' } };
                break;
            case BlockType.Buttons:
                newBlock = { id, type, position, data: { message: 'Choose an option', options: [{id: 'btn-1', text: 'Option 1'}, {id: 'btn-2', text: 'Option 2'}] } };
                break;
            case BlockType.Field:
                newBlock = { id, type, position, data: { variableName: 'my_variable' } };
                break;
            default:
                return;
        }
        const newBlocks = [...blocks, newBlock];
        setBlocks(newBlocks);
        takeSnapshot(newBlocks, connections);
    }, [blocks, connections, takeSnapshot]);

    const dragBlocks = useCallback((draggedBlockId: string, delta: Position) => {
        setBlocks(prevBlocks => {
            const isSelected = selectedBlockIds.includes(draggedBlockId);
            const blocksToMove = isSelected && selectedBlockIds.length > 1 ? selectedBlockIds : [draggedBlockId];

            return prevBlocks.map(b => {
                if (blocksToMove.includes(b.id)) {
                    return { ...b, position: { x: b.position.x + delta.x, y: b.position.y + delta.y } };
                }
                return b;
            });
        });
    }, [selectedBlockIds]);
    
    const startBlockDrag = useCallback((blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            setDragStartPos(prev => ({ ...prev, [blockId]: block.position }));
        }
    }, [blocks]);
    
    const endBlockDrag = useCallback((blockId: string) => {
        const startPos = dragStartPos[blockId];
        const endBlock = blocks.find(b => b.id === blockId);

        if (startPos && endBlock && (startPos.x !== endBlock.position.x || startPos.y !== endBlock.position.y)) {
             takeSnapshot(blocks, connections);
        }

        setDragStartPos(prev => {
            const newPos = { ...prev };
            delete newPos[blockId];
            return newPos;
        });
    }, [dragStartPos, blocks, connections, takeSnapshot]);


    const updateBlockData = useCallback((blockId: string, data: any) => {
        const newBlocks = blocks.map((block) => {
            if (block.id === blockId) {
                if (block.type === BlockType.Buttons && data.options) {
                    const newOptions = data.options.map((opt: ButtonOption) => opt.id ? opt : {...opt, id: `btn-${Date.now()}-${Math.random()}`});
                    return { ...block, data: { ...block.data, ...data, options: newOptions } };
                }
                return { ...block, data: { ...block.data, ...data } };
            }
            return block;
        });
        setBlocks(newBlocks);
        takeSnapshot(newBlocks, connections);
    }, [blocks, connections, takeSnapshot]);

    const toggleBlockSelection = useCallback((blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (block?.type === BlockType.Welcome) {
            return;
        }
        
        setSelectedBlockIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(blockId)) {
                newSet.delete(blockId);
            } else {
                newSet.add(blockId);
            }
            return Array.from(newSet);
        });
    }, [blocks]);

    const clearSelection = useCallback(() => {
        setSelectedBlockIds([]);
    }, []);

    const removeBlock = useCallback((blockId: string) => {
        if (activePropertiesBlockId === blockId) {
            setActivePropertiesBlockId(null);
        }
        const newBlocks = blocks.filter((b) => b.id !== blockId);
        const newConnections = connections.filter((c) => c.source.blockId !== blockId && c.target.blockId !== blockId);
        setBlocks(newBlocks);
        setConnections(newConnections);
        setSelectedBlockIds(ids => ids.filter(id => id !== blockId));
        takeSnapshot(newBlocks, newConnections);
    }, [blocks, connections, takeSnapshot, activePropertiesBlockId]);

    const removeSelectedBlocks = useCallback(() => {
        if (selectedBlockIds.length > 0) {
            setIsConfirmingMultiDelete(true);
        }
    }, [selectedBlockIds]);

    const executeRemoveSelectedBlocks = useCallback(() => {
        if (selectedBlockIds.length === 0) return;
        
        const newBlocks = blocks.filter(b => !selectedBlockIds.includes(b.id));
        const newConnections = connections.filter(c => !selectedBlockIds.includes(c.source.blockId) && !selectedBlockIds.includes(c.target.blockId));

        setBlocks(newBlocks);
        setConnections(newConnections);

        if (activePropertiesBlockId && selectedBlockIds.includes(activePropertiesBlockId)) {
            setActivePropertiesBlockId(null);
        }
        clearSelection();
        takeSnapshot(newBlocks, newConnections);
        setIsConfirmingMultiDelete(false);
    }, [blocks, connections, selectedBlockIds, activePropertiesBlockId, clearSelection, takeSnapshot]);
    
    const cancelRemoveSelectedBlocks = useCallback(() => {
        setIsConfirmingMultiDelete(false);
    }, []);

    const duplicateSelectedBlocks = useCallback(() => {
        const selectedBlocks = blocks.filter(b => selectedBlockIds.includes(b.id));
        if (selectedBlocks.length === 0) return;

        const idMap: Record<string, string> = {};
        const newBlocks: Block[] = selectedBlocks.map(block => {
            const newId = `${block.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            idMap[block.id] = newId;
            return {
                ...block,
                id: newId,
                position: { x: block.position.x + 40, y: block.position.y + 40 },
            };
        });

        const newConnections = connections
            .filter(conn => selectedBlockIds.includes(conn.source.blockId) && selectedBlockIds.includes(conn.target.blockId))
            .map(conn => ({
                ...conn,
                id: `conn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                source: { ...conn.source, blockId: idMap[conn.source.blockId] },
                target: { ...conn.target, blockId: idMap[conn.target.blockId] },
            }));

        const updatedBlocks = [...blocks, ...newBlocks];
        const updatedConnections = [...connections, ...newConnections];
        
        setBlocks(updatedBlocks);
        setConnections(updatedConnections);
        setSelectedBlockIds(newBlocks.map(b => b.id));
        takeSnapshot(updatedBlocks, updatedConnections);
    }, [blocks, connections, selectedBlockIds, takeSnapshot]);

    const addConnection = useCallback((connection: Omit<Connection, 'id'>) => {
        const { source, target } = connection;
        if (source.blockId === target.blockId) return;

        const connectionExists = connections.some(c =>
            c.source.blockId === source.blockId &&
            c.source.handleId === source.handleId &&
            c.target.blockId === target.blockId &&
            c.target.handleId === target.handleId
        );
        if (connectionExists) return;
        
        const newConnection = { ...connection, id: `conn-${Date.now()}` };
        const newConnections = [...connections, newConnection];
        setConnections(newConnections);
        takeSnapshot(blocks, newConnections);
    }, [blocks, connections, takeSnapshot]);

    const removeConnection = useCallback((connectionId: string) => {
        const newConnections = connections.filter(c => c.id !== connectionId);
        setConnections(newConnections);
        takeSnapshot(blocks, newConnections);
    }, [blocks, connections, takeSnapshot]);

    const startConnecting = useCallback((blockId: string, handleId: string) => {
        setConnectingFrom({ blockId, handleId });
    }, []);

    const cancelConnection = useCallback(() => {
        setConnectingFrom(null);
    }, []);

    const completeConnection = useCallback((targetBlockId: string, targetHandleId: string) => {
        if (connectingFrom) {
            addConnection({ source: connectingFrom, target: { blockId: targetBlockId, handleId: targetHandleId } });
        }
        cancelConnection();
    }, [connectingFrom, addConnection, cancelConnection]);

    const openContextMenu = useCallback((payload: NonNullable<ContextMenuState>) => {
        setContextMenuState(payload);
        cancelConnection();
    }, [cancelConnection]);

    const closeContextMenu = useCallback(() => {
        setContextMenuState(null);
    }, []);

    const createBlockAndConnect = useCallback((type: BlockType) => {
        if (!contextMenuState || contextMenuState.type !== 'create') return;
        const { position, source } = contextMenuState;

        const id = `${type.toLowerCase()}-${Date.now()}`;
        let newBlock: Block;
        switch (type) {
            case BlockType.Message:
                newBlock = { id, type, position, data: { message: 'Informational message' } };
                break;
            case BlockType.Goodbye:
                newBlock = { id, type, position, data: { message: 'Goodbye!' } };
                break;
            case BlockType.Question:
                newBlock = { id, type, position, data: { message: 'Your question here...' } };
                break;
            case BlockType.Buttons:
                newBlock = { id, type, position, data: { message: 'Choose an option', options: [{id: 'btn-1', text: 'Option 1'}, {id: 'btn-2', text: 'Option 2'}] } };
                break;
            case BlockType.Field:
                newBlock = { id, type, position, data: { variableName: 'my_variable' } };
                break;
            default:
                setContextMenuState(null);
                return;
        }

        const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            source,
            target: { blockId: id, handleId: 'input' }
        };

        const newBlocks = [...blocks, newBlock];
        const newConnections = [...connections, newConnection];
        setBlocks(newBlocks);
        setConnections(newConnections);
        takeSnapshot(newBlocks, newConnections);
        setContextMenuState(null);

    }, [contextMenuState, blocks, connections, takeSnapshot]);
    
    const insertBlockBetween = useCallback((type: BlockType) => {
        if (!contextMenuState || contextMenuState.type !== 'insert') return;
        const { position, connectionId } = contextMenuState;
        
        const originalConnection = connections.find(c => c.id === connectionId);
        if (!originalConnection) {
            closeContextMenu();
            return;
        }

        // 1. Create the new block
        const id = `${type.toLowerCase()}-${Date.now()}`;
        let newBlock: Block;
        switch (type) {
             case BlockType.Message:
                newBlock = { id, type, position, data: { message: 'Informational message' } };
                break;
            case BlockType.Goodbye:
                newBlock = { id, type, position, data: { message: 'Goodbye!' } };
                break;
            case BlockType.Question:
                newBlock = { id, type, position, data: { message: 'Your question here...' } };
                break;
            case BlockType.Buttons:
                newBlock = { id, type, position, data: { message: 'Choose an option', options: [{id: 'btn-1', text: 'Option 1'}, {id: 'btn-2', text: 'Option 2'}] } };
                break;
            case BlockType.Field:
                newBlock = { id, type, position, data: { variableName: 'my_variable' } };
                break;
            default:
                 closeContextMenu();
                return;
        }
        
        // 2. Create new connections
        const newConnection1: Connection = {
            id: `conn-${Date.now()}-a`,
            source: originalConnection.source,
            target: { blockId: newBlock.id, handleId: 'input' },
        };
        
        const hasSingleOutput = [BlockType.Question, BlockType.Field, BlockType.Message].includes(newBlock.type);
        const newConnectionsList = [newConnection1];
        if (hasSingleOutput) {
             const newConnection2: Connection = {
                id: `conn-${Date.now()}-b`,
                source: { blockId: newBlock.id, handleId: 'output' },
                target: originalConnection.target,
            };
            newConnectionsList.push(newConnection2);
        }

        // 3. Update state: add new block, add new connections, remove old one
        const newBlocks = [...blocks, newBlock];
        const newConnections = connections.filter(c => c.id !== connectionId).concat(newConnectionsList);

        setBlocks(newBlocks);
        setConnections(newConnections);
        takeSnapshot(newBlocks, newConnections);
        closeContextMenu();

    }, [contextMenuState, blocks, connections, takeSnapshot, closeContextMenu]);

    const activePropertiesBlock = useMemo(() => blocks.find(b => b.id === activePropertiesBlockId), [blocks, activePropertiesBlockId]);

    const value = {
        blocks,
        connections,
        selectedBlockIds,
        activePropertiesBlock,
        addBlock,
        dragBlocks,
        startBlockDrag,
        endBlockDrag,
        updateBlockData,
        setActivePropertiesBlockId,
        removeBlock,
        toggleBlockSelection,
        clearSelection,
        removeSelectedBlocks,
        executeRemoveSelectedBlocks,
        cancelRemoveSelectedBlocks,
        isConfirmingMultiDelete,
        duplicateSelectedBlocks,
        addConnection,
        removeConnection,
        startConnecting,
        connectingFrom,
        completeConnection,
        cancelConnection,
        undo,
        redo,
        canUndo,
        canRedo,
        contextMenuState,
        openContextMenu,
        closeContextMenu,
        createBlockAndConnect,
        insertBlockBetween,
    };

    return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (context === undefined) {
        throw new Error('useFlow must be used within a FlowProvider');
    }
    return context;
};