import { SaveSystem, SaveData } from '@/game/core/SaveSystem';

interface Props {
    isOpen: boolean;
    mode: 'save' | 'load';
    currentState?: Omit<SaveData, 'slotId' | 'slotName' | 'timestamp'>;
    onClose: () => void;
    onLoadGame?: (data: SaveData) => void;
    onDeleteSave?: () => void;
}

export function SaveLoadModal({ isOpen, mode, currentState, onClose, onLoadGame, onDeleteSave }: Props) {
    if (!isOpen) return null;

    const slots = SaveSystem.getSlots();
    const autoSave = SaveSystem.loadAutoSave();

    const handleAction = (slotId: number) => {
        if (mode === 'save' && currentState) {
            SaveSystem.saveGame(slotId, {
                ...currentState,
                slotId: String(slotId),
                slotName: `Slot ${slotId} (Level ${currentState.level})`
            });
            onClose();
        } else if (mode === 'load' && onLoadGame) {
            const data = SaveSystem.loadGame(slotId);
            if (data) {
                onLoadGame(data);
                onClose();
            }
        }
    };

    const handleLoadAuto = () => {
        if (autoSave && onLoadGame) {
            onLoadGame(autoSave);
            onClose();
        }
    };

    const deleteSave = (slotId: number | 'auto') => {
        const label = slotId === 'auto' ? 'the autosave' : `Slot ${slotId}`;
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
        if (slotId === 'auto') SaveSystem.deleteAutoSave();
        else SaveSystem.deleteSlot(slotId);
        onDeleteSave?.();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-teal-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl shadow-teal-950/50 text-white">
                <div className="flex items-center justify-between mb-6 border-b border-teal-500/30 pb-4">
                    <h2 className="text-2xl font-bold text-teal-400">
                        {mode === 'save' ? 'Save Game' : 'Load Game'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-teal-500/30 text-sm font-semibold transition-colors"
                    >
                        CLOSE
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {autoSave && mode === 'load' && (
                        <div className="bg-teal-950/40 border border-teal-500/40 rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs uppercase text-teal-300 font-mono tracking-wider">AutoSave</span>
                                <div className="text-sm font-bold text-white mt-1">Level {autoSave.level} • Score: {autoSave.score}</div>
                                <div className="text-xs text-gray-400">{new Date(autoSave.timestamp).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleLoadAuto}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-black font-bold rounded text-sm transition-colors"
                                >
                                    LOAD
                                </button>
                                <button
                                    onClick={() => deleteSave('auto')}
                                    className="px-3 py-2 bg-slate-800 hover:bg-red-950 text-red-300 border border-red-500/30 font-bold rounded text-sm transition-colors"
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                    )}

                    {[1, 2, 3].map((slotId) => {
                        const slot = slots[slotId - 1];
                        return (
                            <div key={slotId} className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-xs uppercase text-gray-400 font-mono tracking-wider">Slot {slotId}</span>
                                    {slot ? (
                                        <>
                                            <div className="text-sm font-bold text-white mt-1">Level {slot.level} • Score: {slot.score}</div>
                                            <div className="text-xs text-gray-400">{new Date(slot.timestamp).toLocaleString()}</div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic mt-1">Empty Slot</div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(slotId)}
                                        disabled={mode === 'load' && !slot}
                                        className={`px-4 py-2 font-bold rounded text-sm transition-colors ${
                                            mode === 'load' && !slot
                                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                : mode === 'save'
                                                ? 'bg-teal-600 hover:bg-teal-500 text-black'
                                                : 'bg-green-600 hover:bg-green-500 text-black'
                                        }`}
                                    >
                                        {mode === 'save' ? 'SAVE' : 'LOAD'}
                                    </button>
                                    {mode === 'load' && slot && (
                                        <button
                                            onClick={() => deleteSave(slotId)}
                                            className="px-3 py-2 bg-slate-800 hover:bg-red-950 text-red-300 border border-red-500/30 font-bold rounded text-sm transition-colors"
                                        >
                                            DELETE
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
