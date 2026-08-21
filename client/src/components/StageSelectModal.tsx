import { useState } from 'react';
import { CampaignStages, StageDefinition } from '@/game/story/CampaignStages';

interface Props {
    maxUnlockedLevel: number;
    allowAllStages?: boolean;
    onSelectStage: (stageNum: number) => void;
    onClose: () => void;
}

export function StageSelectModal({ maxUnlockedLevel, allowAllStages = false, onSelectStage, onClose }: Props) {
    const [selectedChapter, setSelectedChapter] = useState(1);
    const stages = CampaignStages.getAllStages();
    const chapterStages = stages.filter((s) => s.chapter === selectedChapter);
    const chapters = Array.from(new Set(stages.map((stage) => stage.chapter)));

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-teal-500/50 rounded-xl max-w-4xl w-full p-6 shadow-2xl shadow-teal-950/60 text-white flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between mb-6 border-b border-teal-500/30 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-400">Campaign Star Map // 101 Stages</h2>
                        <p className="text-xs text-gray-400 mt-1">{allowAllStages ? 'TEST MODE: select any campaign stage to launch immediately. Progress and autosaves remain unchanged.' : 'Select any unlocked sector stage to launch your campaign mission.'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-teal-500/30 text-sm font-semibold transition-colors"
                    >
                        CLOSE
                    </button>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {chapters.map((ch) => (
                        <button
                            key={ch}
                            onClick={() => setSelectedChapter(ch)}
                            className={`px-4 py-2 rounded text-xs font-mono font-bold transition-colors whitespace-nowrap ${
                                selectedChapter === ch
                                    ? 'bg-teal-600 text-black border border-teal-300'
                                    : 'bg-slate-950 text-gray-400 border border-slate-800 hover:text-white'
                            }`}
                        >
                            {ch === 11 ? 'FINAL STAGE' : `CHAPTER ${ch}`}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-6">
                    {chapterStages.map((stage: StageDefinition) => {
                        const isUnlocked = allowAllStages || stage.stageNumber <= maxUnlockedLevel;
                        return (
                            <div
                                key={stage.stageNumber}
                                onClick={() => {
                                    if (isUnlocked) {
                                        onSelectStage(stage.stageNumber);
                                        onClose();
                                    }
                                }}
                                className={`p-4 rounded-lg border transition-all ${
                                    isUnlocked
                                        ? 'bg-slate-950/80 border-teal-900/60 hover:border-teal-400 cursor-pointer group'
                                        : 'bg-slate-950/30 border-slate-900 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`text-base font-bold ${isUnlocked ? 'text-teal-300 group-hover:text-teal-200' : 'text-gray-500'}`}>
                                        {stage.title}
                                    </h3>
                                    <span className={`px-2 py-0.5 text-xs rounded font-mono ${stage.isBossStage ? 'bg-red-950 text-red-400 border border-red-500/40' : 'bg-teal-950 text-teal-400 border border-teal-500/30'}`}>
                                        {stage.isBossStage ? 'BOSS STAGE' : `STAGE ${stage.stageNumber}`}
                                    </span>
                                </div>
                                <p className="text-xs text-teal-400 font-mono mb-1">{stage.region}</p>
                                <p className="text-xs text-gray-400 mb-3">{stage.description}</p>
                                <div className="flex justify-between items-center text-[11px] font-mono text-gray-500 pt-2 border-t border-slate-900">
                                    <span>Goal: {stage.objective}</span>
                                    <span>{allowAllStages ? 'TEST ACCESS' : isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
