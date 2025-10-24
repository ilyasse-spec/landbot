import React, { useRef, useState, DragEvent, WheelEvent, MouseEvent, useCallback, useEffect, useMemo } from 'react';
import { useFlow } from '../context/FlowContext';
import { BlockType, Position } from '../types';
import BlockComponent from './Block';
import CreationContextMenu from './CreationContextMenu';
import SelectionToolbar from './SelectionToolbar';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { MouseIcon } from './icons/MouseIcon';
import { TrackpadIcon } from './icons/TrackpadIcon';

const Canvas: React.FC = () => {
    const { 
        blocks, 
        connections, 
        addBlock, 
        selectedBlockIds,
        connectingFrom,
        removeConnection,
        openContextMenu,
        contextMenuState,
        setBlockSelection,
        clearSelection,
    } = useFlow();
    const canvasRef = useRef<HTMLDivElement>(null);
    
    // State and Ref for transform to prevent stale closures
    const [transform, _setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const transformRef = useRef(transform);
    const setTransform = (data: React.SetStateAction<{ x: number, y: number, scale: number }>) => {
        const newTransform = typeof data === 'function' ? data(transformRef.current) : data;
        transformRef.current = newTransform;
        _setTransform(newTransform);
    };

    const targetTransform = useRef({ x: 0, y: 0, scale: 1 });
    const animationFrameId = useRef<number | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);
    const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
    const [controlMode, setControlMode] = useState<'mouse' | 'trackpad'>('mouse');
    const [selectionRect, setSelectionRect] = useState<{ start: Position; end: Position } | null>(null);

    const animate = useCallback(() => {
        const current = transformRef.current;
        const target = targetTransform.current;

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const speed = 0.2; // Animation speed, smaller is slower/smoother

        const nextX = lerp(current.x, target.x, speed);
        const nextY = lerp(current.y, target.y, speed);
        const nextScale = lerp(current.scale, target.scale, speed);

        const isCloseEnough =
            Math.abs(target.x - nextX) < 0.1 &&
            Math.abs(target.y - nextY) < 0.1 &&
            Math.abs(target.scale - nextScale) < 0.0001;

        if (isCloseEnough) {
            setTransform(target);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        } else {
            setTransform({ x: nextX, y: nextY, scale: nextScale });
            animationFrameId.current = requestAnimationFrame(animate);
        }
    }, []);

    const startAnimation = useCallback(() => {
        if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(animate);
        }
    }, [animate]);

    useEffect(() => {
        setIsMounted(true);
        targetTransform.current = transformRef.current;
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [startAnimation]);


    const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Position => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const currentTransform = transformRef.current;
        return {
            x: (clientX - rect.left - currentTransform.x) / currentTransform.scale,
            y: (clientY - rect.top - currentTransform.y) / currentTransform.scale,
        };
    }, []);

    const onDragOver = (event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow') as BlockType;
        if (type) {
            const position = getCanvasCoordinates(event.clientX, event.clientY);
            addBlock(type, position);
        }
    };
    
    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const handleWheel = (event: globalThis.WheelEvent) => {
            event.preventDefault();

            if (controlMode === 'trackpad') {
                if (event.ctrlKey) { // Pinch to zoom on trackpad
                    const scaleAmount = -event.deltaY * 0.005; // Faster sensitivity for trackpad zoom
                    const target = targetTransform.current;
                    const newScale = Math.max(0.2, Math.min(2, target.scale + scaleAmount));

                    if (newScale === target.scale) return;

                    const newX = target.x * (newScale / target.scale);
                    const newY = target.y * (newScale / target.scale);
                    
                    targetTransform.current = { x: newX, y: newY, scale: newScale };
                    startAnimation();
                } else { // Two-finger pan on trackpad
                    const target = targetTransform.current;
                    targetTransform.current = {
                        ...target,
                        x: target.x - event.deltaX,
                        y: target.y - event.deltaY,
                    };
                    startAnimation();
                }
            } else { // Mouse mode: scroll wheel to zoom
                const scaleAmount = -event.deltaY * 0.0005; // Original sensitivity for mouse wheel
                const target = targetTransform.current;
                const newScale = Math.max(0.2, Math.min(2, target.scale + scaleAmount));

                if (newScale === target.scale) return;
                
                const newX = target.x * (newScale / target.scale);
                const newY = target.y * (newScale / target.scale);
                
                targetTransform.current = { x: newX, y: newY, scale: newScale };
                startAnimation();
            }
        };

        canvasEl.addEventListener('wheel', handleWheel, { passive: false });
        return () => canvasEl.removeEventListener('wheel', handleWheel);
    }, [controlMode, startAnimation]);

    const updateSelectionFromRect = useCallback((rect: { start: Position, end: Position }) => {
        const selectedIds: string[] = [];
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;
    
        const canvasRect = canvasEl.getBoundingClientRect();
        const currentTransform = transformRef.current;
    
        const selectionRectWorld = {
            x1: Math.min(rect.start.x, rect.end.x),
            y1: Math.min(rect.start.y, rect.end.y),
            x2: Math.max(rect.start.x, rect.end.x),
            y2: Math.max(rect.start.y, rect.end.y),
        };
    
        blocks.forEach(block => {
            if (block.type === BlockType.Welcome) return;
    
            const checkboxEl = document.getElementById(`block-checkbox-${block.id}`);
            if (!checkboxEl) return;
    
            const checkboxScreenRect = checkboxEl.getBoundingClientRect();
            
            const checkboxWorld = {
                x1: (checkboxScreenRect.left - canvasRect.left - currentTransform.x) / currentTransform.scale,
                y1: (checkboxScreenRect.top - canvasRect.top - currentTransform.y) / currentTransform.scale,
                x2: (checkboxScreenRect.right - canvasRect.left - currentTransform.x) / currentTransform.scale,
                y2: (checkboxScreenRect.bottom - canvasRect.top - currentTransform.y) / currentTransform.scale,
            };
    
            if (
                checkboxWorld.x1 >= selectionRectWorld.x1 &&
                checkboxWorld.x2 <= selectionRectWorld.x2 &&
                checkboxWorld.y1 >= selectionRectWorld.y1 &&
                checkboxWorld.y2 <= selectionRectWorld.y2
            ) {
                selectedIds.push(block.id);
            }
        });
        setBlockSelection(selectedIds);
    }, [blocks, setBlockSelection]);


    const onMouseDown = (event: MouseEvent) => {
        if (event.target !== event.currentTarget) return;

        if (controlMode === 'mouse' && event.button === 2) {
            setIsPanning(true);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            targetTransform.current = transformRef.current;
        } else if (event.button === 0) { // Left-click for selection
            clearSelection();
            const startPos = getCanvasCoordinates(event.clientX, event.clientY);
            setSelectionRect({ start: startPos, end: startPos });
        }
    };

    const onMouseMove = (event: MouseEvent) => {
        if (isPanning) {
            const currentTransform = transformRef.current;
            const newTransform = {
                ...currentTransform,
                x: currentTransform.x + event.movementX,
                y: currentTransform.y + event.movementY,
            };
            setTransform(newTransform);
            targetTransform.current = newTransform;
        } else if (selectionRect) {
            const currentPos = getCanvasCoordinates(event.clientX, event.clientY);
            const newRect = { ...selectionRect, end: currentPos };
            setSelectionRect(newRect);
            updateSelectionFromRect(newRect);
        }
        setPointerPosition({ x: event.clientX, y: event.clientY });
    };

    const onMouseUp = (event: MouseEvent) => {
        if (isPanning) {
            setIsPanning(false);
        }
        if (selectionRect) {
            const selectedIdsAfterDrag = selectedBlockIds;
            setSelectionRect(null);
            // Only update selection if it's not empty, to allow simple clicks to deselect
            if(selectedIdsAfterDrag.length > 0) {
                 setBlockSelection(selectedIdsAfterDrag);
            }
        }
        if (connectingFrom && event.target === event.currentTarget) {
            const position = getCanvasCoordinates(event.clientX, event.clientY);
            openContextMenu({ type: 'create', position, source: connectingFrom });
        }
    };

    const getHandleWorldPosition = (blockId: string, handleId: string): Position | null => {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return null;

        const el = document.getElementById(`handle-${blockId}-${handleId}`);
        if (!el) return null;

        const handleRect = el.getBoundingClientRect();
        const handleCenterX = handleRect.left + handleRect.width / 2;
        const handleCenterY = handleRect.top + handleRect.height / 2;

        const currentTransform = transformRef.current;
        const worldX = (handleCenterX - canvasRect.left - currentTransform.x) / currentTransform.scale;
        const worldY = (handleCenterY - canvasRect.top - currentTransform.y) / currentTransform.scale;
        
        return { x: worldX, y: worldY };
    }

    const selectionToolbarPosition = useMemo(() => {
        if (selectedBlockIds.length === 0) return null;

        const selectedBlocks = blocks.filter(b => selectedBlockIds.includes(b.id));
        if (selectedBlocks.length === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity;
        selectedBlocks.forEach(b => {
            minX = Math.min(minX, b.position.x);
            minY = Math.min(minY, b.position.y);
            maxX = Math.max(maxX, b.position.x + 256); // 256 is w-64
        });
        
        const canvasX = (minX + maxX) / 2;
        const canvasY = minY - 60; // 60px above the top of the selection box

        return {
            left: canvasX,
            top: canvasY
        };
    }, [selectedBlockIds, blocks]);

    const connectingToPosition = getCanvasCoordinates(pointerPosition.x, pointerPosition.y);

    return (
        <div
            ref={canvasRef}
            className={`w-full h-full overflow-hidden relative ${isPanning ? 'cursor-grabbing' : (controlMode === 'mouse' ? 'cursor-grab' : '')} ${selectionRect ? 'cursor-crosshair' : ''}`}
            style={{ touchAction: 'none' }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
                    {isMounted && connections.map(conn => {
                        const sourcePos = getHandleWorldPosition(conn.source.blockId, conn.source.handleId);
                        const targetPos = getHandleWorldPosition(conn.target.blockId, conn.target.handleId);
                        if (!sourcePos || !targetPos) return null;

                        const isHovered = hoveredConnectionId === conn.id;

                        const d = `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + 50} ${sourcePos.y}, ${targetPos.x - 50} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;

                        const p0 = sourcePos;
                        const p1 = { x: sourcePos.x + 50, y: sourcePos.y };
                        const p2 = { x: targetPos.x - 50, y: targetPos.y };
                        const p3 = targetPos;
                        const t = 0.5;
                        const midX = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
                        const midY = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;


                        return (
                            <g 
                                key={conn.id}
                                onMouseEnter={() => setHoveredConnectionId(conn.id)}
                                onMouseLeave={() => setHoveredConnectionId(null)}
                            >
                                <path
                                    d={d}
                                    stroke="transparent"
                                    strokeWidth="15"
                                    fill="none"
                                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                                />
                                <path
                                    d={d}
                                    stroke={isHovered ? '#4f46e5' : '#a1a1aa'}
                                    strokeWidth="2"
                                    fill="none"
                                    style={{ pointerEvents: 'none' }}
                                />
                                {isHovered && (
                                    <foreignObject x={midX - 28} y={midY - 14} width="56" height="28" style={{ pointerEvents: 'all' }}>
                                        <div className="flex items-center justify-center bg-white rounded-full shadow-md gap-1 p-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openContextMenu({ type: 'insert', connectionId: conn.id, position: {x: midX, y: midY} })
                                                }}
                                                className="w-6 h-6 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-gray-800 focus:outline-none"
                                                aria-label="Insert block"
                                            >
                                                <PlusIcon />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeConnection(conn.id)
                                                }}
                                                className="w-6 h-6 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-red-500 focus:outline-none"
                                                aria-label="Delete connection"
                                            >
                                                <MinusIcon />
                                            </button>
                                        </div>
                                    </foreignObject>
                                )}
                            </g>
                        );
                    })}
                    {isMounted && connectingFrom && (() => {
                        const sourcePos = getHandleWorldPosition(connectingFrom.blockId, connectingFrom.handleId);
                        if (!sourcePos) return null;

                        return (
                            <path
                                d={`M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + 50} ${sourcePos.y}, ${connectingToPosition.x - 50} ${connectingToPosition.y}, ${connectingToPosition.x} ${connectingToPosition.y}`}
                                stroke="#6366f1"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="5 5"
                            />
                        );
                    })()}
                </g>
            </svg>
            <div
                className="transform-origin-top-left noselect"
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
            >
                {selectionToolbarPosition && !selectionRect && (
                     <SelectionToolbar
                        count={selectedBlockIds.length}
                        position={selectionToolbarPosition}
                    />
                )}
                {blocks.map(block => (
                    <BlockComponent key={block.id} block={block} />
                ))}

                {selectionRect && (
                    <div
                        className="absolute bg-indigo-500/20 border-2 border-indigo-600 pointer-events-none"
                        style={{
                            left: Math.min(selectionRect.start.x, selectionRect.end.x),
                            top: Math.min(selectionRect.start.y, selectionRect.end.y),
                            width: Math.abs(selectionRect.start.x - selectionRect.end.x),
                            height: Math.abs(selectionRect.start.y - selectionRect.end.y),
                        }}
                    />
                )}
            </div>
            
            {contextMenuState && (
                <CreationContextMenu
                    position={contextMenuState.position}
                    transform={transform}
                />
            )}

            <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-lg flex p-1 space-x-1">
                <button
                    onClick={() => setControlMode('mouse')}
                    className={`p-2 rounded-md transition-colors ${controlMode === 'mouse' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Mouse Controls"
                >
                    <MouseIcon />
                </button>
                <button
                    onClick={() => setControlMode('trackpad')}
                    className={`p-2 rounded-md transition-colors ${controlMode === 'trackpad' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Trackpad Controls"
                >
                    <TrackpadIcon />
                </button>
            </div>
        </div>
    );
};

export default Canvas;