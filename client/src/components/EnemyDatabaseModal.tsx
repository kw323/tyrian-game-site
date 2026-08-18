import { EnemyDatabase } from '@/game/story/EnemyDatabase';

interface Props {
    onClose: () => void;
}

export function EnemyDatabaseModal({ onClose }: Props) {
    const enemies = EnemyDatabase.getEnemies();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-teal-500/40 rounded-xl max-w-2xl w-full p-6 shadow-2xl shadow-teal-950/50 text-white">
                <div className="flex items-center justify-between mb-6 border-b border-teal-500/30 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-400">Ship AI // Enemy Database</h2>
                        <p className="text-xs text-gray-400 mt-1">Tactical reconnaissance files compiled by Program Zero navigation.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-teal-500/30 text-sm font-semibold transition-colors"
                    >
                        CLOSE
                    </button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {enemies.map((enemy, idx) => (
                        <div key={idx} className="bg-slate-950/70 border border-teal-900/40 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-teal-300">{enemy.name}</h3>
                                <span className="px-2 py-0.5 bg-teal-950 text-teal-400 border border-teal-500/30 text-xs rounded font-mono">
                                    {enemy.reward}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-300 mb-2 font-mono">
                                <div><span className="text-gray-500">Class:</span> {enemy.type}</div>
                                <div><span className="text-gray-500">Durability:</span> {enemy.health}</div>
                                <div><span className="text-gray-500">Armament:</span> {enemy.weapon}</div>
                            </div>
                            <p className="text-sm text-gray-400">{enemy.description}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-teal-500/30 text-center text-xs text-gray-500">
                    Bosses appear every 3 stages. Defeat them or survive the 60-second timer to claim sector clearance.
                </div>
            </div>
        </div>
    );
}
