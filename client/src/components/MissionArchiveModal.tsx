import { useEffect, useMemo, useState } from 'react';
import { BookOpen, LockKeyhole, Radio, X } from 'lucide-react';
import { CampaignSystem } from '@/game/story/CampaignSystem';
import { MissionArchiveEntry, MissionArchiveSystem } from '@/game/story/MissionArchiveSystem';

interface MissionArchiveModalProps {
    onClose: () => void;
}

// Style: recovered command archive — dense, high-contrast, and explicit about what remains classified.
export function MissionArchiveModal({ onClose }: MissionArchiveModalProps) {

    const [entries, setEntries] = useState<MissionArchiveEntry[]>(() => MissionArchiveSystem.getEntries());
    const [selectedStage, setSelectedStage] = useState(() => MissionArchiveSystem.getEntries()[0]?.stage ?? 1);
    const [activeTab, setActiveTab] = useState<'briefing' | 'intercepts'>('briefing');

    useEffect(() => {
        const refresh = () => setEntries(MissionArchiveSystem.getEntries());
        window.addEventListener(MissionArchiveSystem.updateEventName, refresh);
        return () => window.removeEventListener(MissionArchiveSystem.updateEventName, refresh);
    }, []);

    const selectedEntry = entries.find((entry) => entry.stage === selectedStage) ?? null;
    const selectedBriefing = CampaignSystem.getStageBriefing(selectedStage);
    const archivedCount = entries.filter((entry) => entry.briefingSeen).length;
    const interceptCount = entries.filter((entry) => entry.inMissionCommsRevealed).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-2xl shadow-cyan-950/40">
                <header className="flex items-center justify-between border-b border-cyan-500/30 bg-slate-900/95 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="border border-cyan-400/50 bg-cyan-500/10 p-2 text-cyan-300"><BookOpen size={21} /></div>
                        <div>
                            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">Program Zero // Recovered Intelligence</p>
                            <h2 className="text-xl font-bold uppercase tracking-wide text-white">Mission Archive Log</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="border border-cyan-500/20 bg-slate-900 p-2 text-gray-400 transition-colors hover:bg-slate-800 hover:text-white" aria-label="Close mission archive">
                        <X size={20} />
                    </button>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
                    <aside className="min-h-0 overflow-y-auto border-b border-cyan-500/20 bg-slate-900/60 p-4 md:border-b-0 md:border-r">
                        <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wider">
                            <div className="border border-cyan-500/20 bg-cyan-950/20 p-2 text-cyan-300"><b className="block text-lg text-white">{archivedCount}</b>Briefings logged</div>
                            <div className="border border-amber-500/20 bg-amber-950/20 p-2 text-amber-300"><b className="block text-lg text-white">{interceptCount}</b>Intercepts logged</div>
                        </div>
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Campaign records // 01—100</p>
                        <div className="space-y-1">
                            {Array.from({ length: CampaignSystem.TOTAL_STAGES }, (_, index) => index + 1).map((stage) => {
                                const entry = entries.find((item) => item.stage === stage);
                                const isSelected = stage === selectedStage;
                                return (
                                    <button
                                        key={stage}
                                        onClick={() => setSelectedStage(stage)}
                                        className={`flex w-full items-center justify-between border px-3 py-2 text-left font-mono text-xs transition-colors ${isSelected ? 'border-cyan-300 bg-cyan-950/50 text-white' : 'border-transparent text-slate-400 hover:border-cyan-500/30 hover:bg-slate-800/70 hover:text-cyan-200'}`}
                                    >
                                        <span>STAGE {String(stage).padStart(2, '0')}</span>
                                        {entry ? <span className="text-emerald-400">LOGGED</span> : <LockKeyhole size={13} className="text-slate-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <main className="min-h-0 overflow-y-auto p-6">
                        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-cyan-500/20 pb-4 md:flex-row md:items-start">
                            <div>
                                <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">{selectedEntry?.operationCode ?? `STAGE-${String(selectedStage).padStart(2, '0')} // ARCHIVE SEALED`}</p>
                                <h3 className="mt-1 text-2xl font-bold uppercase tracking-wide text-white">{selectedEntry?.title ?? 'Unrecovered mission record'}</h3>
                                <p className="mt-1 font-mono text-xs uppercase text-slate-400">{selectedEntry?.location ?? selectedBriefing.location} // {selectedEntry?.missionType?.toUpperCase() ?? 'CLASSIFIED'}</p>
                            </div>
                            <div className="border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 font-mono text-[10px] uppercase text-emerald-300">{selectedEntry?.briefingCompleted ? 'Briefing complete' : selectedEntry?.briefingSeen ? 'Briefing viewed' : 'No access record'}</div>
                        </div>

                        <div className="mb-5 flex gap-2 border-b border-cyan-500/20">
                            <button onClick={() => setActiveTab('briefing')} className={`flex items-center gap-2 border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-wider ${activeTab === 'briefing' ? 'border-cyan-300 text-cyan-200' : 'border-transparent text-slate-500 hover:text-slate-200'}`}><BookOpen size={14} /> Pre-flight briefing</button>
                            <button onClick={() => setActiveTab('intercepts')} className={`flex items-center gap-2 border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-wider ${activeTab === 'intercepts' ? 'border-amber-300 text-amber-200' : 'border-transparent text-slate-500 hover:text-slate-200'}`}><Radio size={14} /> In-mission intercept</button>
                        </div>

                        {!selectedEntry && (
                            <div className="flex min-h-[300px] items-center justify-center border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
                                <div>
                                    <LockKeyhole className="mx-auto mb-3 text-slate-600" size={32} />
                                    <p className="font-mono text-sm uppercase tracking-wider text-slate-400">Record sealed</p>
                                    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">Complete or view this stage briefing to recover the command record. Classified surprise data will remain hidden until it is transmitted during the mission.</p>
                                </div>
                            </div>
                        )}

                        {selectedEntry && activeTab === 'briefing' && (
                            <article className="border border-cyan-500/30 bg-slate-900/70 p-5">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">{selectedEntry.speakerName} // Secure briefing</p>
                                </div>
                                <p className="text-lg leading-relaxed text-slate-100">“{selectedEntry.briefingMessage}”</p>
                                <div className="mt-5 border-t border-cyan-500/20 pt-4">
                                    <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400">Primary order</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{selectedEntry.objective}</p>
                                </div>
                            </article>
                        )}

                        {selectedEntry && activeTab === 'intercepts' && (
                            selectedEntry.inMissionCommsRevealed && selectedEntry.inMissionComms ? (
                                <article className="border border-amber-500/35 bg-amber-950/10 p-5">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Radio className="text-amber-300" size={18} />
                                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300">{selectedEntry.inMissionComms.name} // Emergency intercept</p>
                                    </div>
                                    <p className="text-lg leading-relaxed text-slate-100">“{selectedEntry.inMissionComms.message}”</p>
                                    <p className="mt-5 border-t border-amber-500/20 pt-4 font-mono text-xs uppercase text-amber-200/70">Recovered during stage {String(selectedEntry.stage).padStart(2, '0')}</p>
                                </article>
                            ) : (
                                <div className="flex min-h-[300px] items-center justify-center border border-dashed border-amber-900/60 bg-amber-950/5 p-8 text-center">
                                    <div>
                                        <LockKeyhole className="mx-auto mb-3 text-amber-800" size={28} />
                                        <p className="font-mono text-sm uppercase tracking-wider text-amber-300/70">Intercept not yet recovered</p>
                                        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">This channel will unlock only when the mission transmits an unexpected tactical development.</p>
                                    </div>
                                </div>
                            )
                        )}
                    </main>
                </div>

                <footer className="flex items-center justify-between border-t border-cyan-500/30 bg-slate-900/95 px-6 py-3 font-mono text-xs text-slate-500">
                    <span>ARCHIVE INTEGRITY: {archivedCount > 0 ? 'PARTIAL / RECOVERING' : 'NO RECOVERED RECORDS'}</span>
                    <button onClick={onClose} className="border border-cyan-500/40 bg-cyan-600 px-4 py-2 font-bold uppercase text-slate-950 transition-colors hover:bg-cyan-400">Close archive</button>
                </footer>
            </div>
        </div>
    );
}
