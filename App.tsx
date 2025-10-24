import React, { useState } from 'react';
import { FlowProvider, useFlow } from './context/FlowContext';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import ChatPreview from './components/ChatPreview';
import ConfirmationModal from './components/ConfirmationModal';

const AppContent: React.FC = () => {
    const { 
        activePropertiesBlock, 
        blocks, 
        connections, 
        undo, 
        redo, 
        canUndo, 
        canRedo,
        selectedBlockIds,
        isConfirmingMultiDelete,
        executeRemoveSelectedBlocks,
        cancelRemoveSelectedBlocks,
    } = useFlow();
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isStandalonePreview, setIsStandalonePreview] = useState(false);

    if (isStandalonePreview) {
        return (
            <ChatPreview
                blocks={blocks}
                connections={connections}
                onClose={() => setIsStandalonePreview(false)}
                isStandalone={true}
            />
        );
    }

    const baseButtonClass = "font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const undoRedoButtonClass = `bg-white text-gray-700 hover:bg-gray-100 ${baseButtonClass}`;

    return (
        <div className="flex h-screen w-screen font-sans text-gray-800">
            <Sidebar />
            <main className="flex-1 relative bg-gray-200/50 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px]">
                <Canvas />
                 <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button onClick={undo} disabled={!canUndo} className={undoRedoButtonClass}>Undo</button>
                    <button onClick={redo} disabled={!canRedo} className={undoRedoButtonClass}>Redo</button>
                    <button
                        onClick={() => setIsPreviewing(true)}
                        className={`${baseButtonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                    >
                        Preview Chatbot
                    </button>
                    <button
                        onClick={() => setIsStandalonePreview(true)}
                        className={`${baseButtonClass} bg-green-600 text-white hover:bg-green-700`}
                    >
                        Generate Chatbot
                    </button>
                 </div>
            </main>
            {activePropertiesBlock && <PropertiesPanel />}
            {isPreviewing && (
                <ChatPreview
                    blocks={blocks}
                    connections={connections}
                    onClose={() => setIsPreviewing(false)}
                />
            )}
            {isConfirmingMultiDelete && (
                <ConfirmationModal 
                    message={`Are you sure you want to delete these ${selectedBlockIds.length} blocks?`}
                    onConfirm={executeRemoveSelectedBlocks}
                    onCancel={cancelRemoveSelectedBlocks}
                />
            )}
        </div>
    );
};


const App: React.FC = () => {
  return (
    <FlowProvider>
      <AppContent />
    </FlowProvider>
  );
};

export default App;