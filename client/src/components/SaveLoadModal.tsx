import { useEffect, useMemo, useState } from 'react';
import { SaveSystem, SaveData } from '@/game/core/SaveSystem';

interface Props {
    isOpen: boolean;
    mode: 'save' | 'load';
    currentState?: Omit<SaveData, 'slotId' | 'slotName' | 'timestamp'>;
    onClose: () => void;
    onLoadGame?: (data: SaveData) => void;
    onDeleteSave?: () => void;
}

type DeleteTarget = number | 'auto';

function formatSaveTime(timestamp: number): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(timestamp));
}

export function SaveLoadModal({ isOpen, mode, currentState, onClose, onLoadGame, onDeleteSave }: Props) {
    const [pageIndex, setPageIndex] = useState(0);
    const [revision, setRevision] = useState(0);
    const [focusedSlotId, setFocusedSlotId] = useState(1);
    const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);

    const slotIds = useMemo(() => SaveSystem.getSlotIdsForPage(pageIndex), [pageIndex]);
    const slots = useMemo(() => SaveSystem.getSlots(pageIndex), [pageIndex, revision]);
    const autoSave = useMemo(() => SaveSystem.loadAutoSave(), [revision]);
    const pageLabel = `PAGE ${String(pageIndex + 1).padStart(2, '0')} // SLOTS ${slotIds[0]}–${slotIds[slotIds.length - 1]}`;

    const moveToPage = (nextPage: number): void => {
        const safePage = Math.max(0, nextPage);
        setPageIndex(safePage);
        setFocusedSlotId(SaveSystem.getSlotIdsForPage(safePage)[0]);
    };

    const handleAction = (slotId: number): void => {
        if (mode === 'save' && currentState) {
            SaveSystem.saveGame(slotId, {
                ...currentState,
                slotId: String(slotId),
                slotName: `Command Slot ${slotId} (Stage ${currentState.level})`
            });
            setRevision((value) => value + 1);
            onClose();
            return;
        }

        if (mode === 'load' && onLoadGame) {
            const data = SaveSystem.loadGame(slotId);
            if (data) {
                onLoadGame(data);
                onClose();
            }
        }
    };

    const confirmDelete = (): void => {
        if (pendingDelete === null) return;
        if (pendingDelete === 'auto') SaveSystem.deleteAutoSave();
        else SaveSystem.deleteSlot(pendingDelete);
        setPendingDelete(null);
        setRevision((value) => value + 1);
        onDeleteSave?.();
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (pendingDelete !== null) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setPendingDelete(null);
                } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    confirmDelete();
                }
                return;
            }

            const focusedIndex = Math.max(0, slotIds.indexOf(focusedSlotId));
            const selectOffset = (offset: number): void => {
                const nextIndex = Math.max(0, Math.min(slotIds.length - 1, focusedIndex + offset));
                setFocusedSlotId(slotIds[nextIndex]);
            };

            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
                event.preventDefault();
                selectOffset(1);
            } else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
                event.preventDefault();
                selectOffset(-1);
            } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
                event.preventDefault();
                selectOffset(2);
            } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
                event.preventDefault();
                selectOffset(-2);
            } else if (event.key === 'PageDown' || event.key.toLowerCase() === 'e') {
                event.preventDefault();
                moveToPage(pageIndex + 1);
            } else if ((event.key === 'PageUp' || event.key.toLowerCase() === 'q') && pageIndex > 0) {
                event.preventDefault();
                moveToPage(pageIndex - 1);
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const slot = SaveSystem.loadGame(focusedSlotId);
                if (mode === 'save' || slot) handleAction(focusedSlotId);
            } else if ((event.key === 'Delete' || event.key === 'Backspace') && mode === 'load') {
                const slot = SaveSystem.loadGame(focusedSlotId);
                if (slot) {
                    event.preventDefault();
                    setPendingDelete(focusedSlotId);
                }
            } else if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedSlotId, isOpen, mode, pageIndex, pendingDelete, slotIds]);

    useEffect(() => {
        if (!isOpen) return;
        moveToPage(0);
        setPendingDelete(null);
    }, [isOpen]);

    if (!isOpen) return null;

    const selectedSlot = slots[slotIds.indexOf(focusedSlotId)];
    const deleteLabel = pendingDelete === 'auto' ? 'AUTOSAVE' : `SLOT ${pendingDelete}`;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020611]/90 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="save-console-title">
            <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden border border-cyan-300/45 bg-[#071426] text-white shadow-2xl shadow-cyan-950/70">
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(84,215,255,.20) 0 1px, transparent 1.4px), radial-gradient(circle at 75% 28%, rgba(94,228,157,.18) 0 1px, transparent 1.4px)', backgroundSize: '46px 46px, 63px 63px' }} />
                <header className="relative flex flex-col gap-3 border-b border-cyan-300/25 bg-[#08192f]/95 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div>
                        <p className="text-xs font-bold tracking-[0.28em] text-cyan-200">ARK-9 // SECURE STORAGE</p>
                        <h2 id="save-console-title" className="mt-1 text-3xl font-black tracking-wide text-white sm:text-4xl">
                            {mode === 'save' ? 'SAVE COMMAND' : 'LOAD COMMAND'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-300">{pageLabel} • {SaveSystem.SLOTS_PER_PAGE} SLOTS PER PAGE</p>
                    </div>
                    <button type="button" onClick={onClose} className="min-h-12 border border-slate-500/60 bg-slate-950/70 px-5 text-base font-bold text-slate-100 transition hover:border-cyan-200 hover:bg-cyan-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">
                        ESC // CLOSE
                    </button>
                </header>

                <div className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
                    {autoSave && mode === 'load' && (
                        <section className="mb-5 grid gap-4 border border-emerald-300/35 bg-emerald-950/25 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div>
                                <p className="text-xs font-bold tracking-[0.22em] text-emerald-200">AUTOSAVE // LAST FLIGHT STATE</p>
                                <p className="mt-1 text-xl font-bold text-white">STAGE {autoSave.level} <span className="text-emerald-200">•</span> {autoSave.score.toLocaleString()} CREDITS</p>
                                <p className="mt-1 text-sm text-slate-300">{formatSaveTime(autoSave.timestamp)}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="button" onClick={() => { onLoadGame?.(autoSave); onClose(); }} className="min-h-12 bg-emerald-300 px-5 text-base font-black text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-100">LOAD AUTOSAVE</button>
                                <button type="button" onClick={() => setPendingDelete('auto')} className="min-h-12 border border-red-300/55 bg-red-950/25 px-5 text-base font-bold text-red-100 transition hover:bg-red-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-200">DELETE</button>
                            </div>
                        </section>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        {slotIds.map((slotId, index) => {
                            const slot = slots[index];
                            const isSelected = focusedSlotId === slotId;
                            const disabled = mode === 'load' && !slot;
                            return (
                                <button
                                    key={slotId}
                                    type="button"
                                    aria-label={`Slot ${slotId}${slot ? `, stage ${slot.level}` : ', empty'}`}
                                    aria-selected={isSelected}
                                    disabled={disabled}
                                    onFocus={() => setFocusedSlotId(slotId)}
                                    onClick={() => handleAction(slotId)}
                                    className={`group min-h-28 border p-4 text-left transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${isSelected ? 'border-cyan-200 bg-cyan-950/55 shadow-[0_0_22px_rgba(84,215,255,.18)]' : slot ? 'border-slate-600/70 bg-slate-950/50 hover:border-cyan-300/75 hover:bg-cyan-950/30' : 'border-slate-700/50 bg-slate-950/25'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-sm font-black tracking-[0.16em] text-cyan-200">SLOT {String(slotId).padStart(2, '0')}</span>
                                        <span className={`text-xs font-bold tracking-wider ${slot ? 'text-emerald-200' : 'text-slate-500'}`}>{slot ? 'ONLINE' : 'EMPTY'}</span>
                                    </div>
                                    {slot ? (
                                        <>
                                            <p className="mt-3 text-xl font-bold text-white">STAGE {slot.level} <span className="text-cyan-200">//</span> {slot.score.toLocaleString()} CREDITS</p>
                                            <p className="mt-1 text-sm text-slate-300">{formatSaveTime(slot.timestamp)}</p>
                                        </>
                                    ) : (
                                        <p className="mt-4 text-lg font-medium text-slate-400">{mode === 'save' ? 'CREATE NEW COMMAND SAVE' : 'NO SIGNAL RECORDED'}</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <footer className="relative flex flex-col gap-3 border-t border-cyan-300/20 bg-[#08192f]/95 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p className="text-sm font-medium text-slate-300"><span className="text-cyan-200">↑↓←→ / WASD</span> SELECT  •  <span className="text-cyan-200">ENTER</span> {mode === 'save' ? 'SAVE' : 'LOAD'}  •  <span className="text-cyan-200">Q/E</span> PAGE  •  <span className="text-cyan-200">ESC</span> BACK</p>
                    <div className="flex gap-3">
                        <button type="button" disabled={pageIndex === 0} onClick={() => moveToPage(pageIndex - 1)} className="min-h-12 border border-slate-500/70 bg-slate-950/70 px-5 text-base font-bold text-white transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">Q // PREVIOUS</button>
                        <button type="button" onClick={() => moveToPage(pageIndex + 1)} className="min-h-12 border border-cyan-300/70 bg-cyan-950/45 px-5 text-base font-bold text-cyan-100 transition hover:bg-cyan-900/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">E // NEXT</button>
                    </div>
                </footer>

                {pendingDelete !== null && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#020611]/85 p-5" role="alertdialog" aria-modal="true" aria-labelledby="delete-save-title">
                        <div className="w-full max-w-md border border-red-300/60 bg-[#1a0b17] p-6 shadow-2xl shadow-red-950/60">
                            <p className="text-xs font-bold tracking-[0.22em] text-red-200">DESTRUCTIVE COMMAND</p>
                            <h3 id="delete-save-title" className="mt-2 text-2xl font-black text-white">DELETE {deleteLabel}?</h3>
                            <p className="mt-3 text-base leading-relaxed text-slate-200">This save cannot be recovered. Press Enter to confirm deletion or Esc to cancel.</p>
                            <div className="mt-6 flex gap-3">
                                <button type="button" onClick={confirmDelete} className="min-h-12 flex-1 bg-red-300 px-4 text-base font-black text-red-950 transition hover:bg-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-100">ENTER // DELETE</button>
                                <button type="button" onClick={() => setPendingDelete(null)} className="min-h-12 flex-1 border border-slate-400/60 bg-slate-950/70 px-4 text-base font-bold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-100">ESC // CANCEL</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
