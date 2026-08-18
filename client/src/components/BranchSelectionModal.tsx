import { BranchRoute } from '@/game/story/BranchSystem';

interface Props {
    chapter: number;
    routes: BranchRoute[];
    onSelectRoute: (route: BranchRoute) => void;
}

export function BranchSelectionModal({ chapter, routes, onSelectRoute }: Props) {
    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-teal-500/50 rounded-xl max-w-xl w-full p-6 shadow-2xl shadow-teal-950/60 text-white text-center">
                <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-mono">Chapter {chapter} Cleared</span>
                <h2 className="text-3xl font-bold text-teal-300 mt-2 mb-2">Choose Your Next Sector Route</h2>
                <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
                    Your choice will determine enemy composition, reward multipliers, and tactical hazards for the upcoming 10 stages.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {routes.map((route) => (
                        <div
                            key={route.id}
                            className="bg-slate-950 border border-teal-900/60 hover:border-teal-400 rounded-lg p-5 flex flex-col justify-between transition-all group cursor-pointer"
                            onClick={() => onSelectRoute(route)}
                        >
                            <div>
                                <h3 className="text-lg font-bold text-teal-200 group-hover:text-teal-300 mb-2">{route.title}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed mb-4">{route.description}</p>
                            </div>
                            <div className="space-y-1 pt-3 border-t border-teal-900/40 text-xs font-mono">
                                <div className="flex justify-between text-yellow-400">
                                    <span>Reward Multiplier:</span>
                                    <span>+{Math.round((route.rewardMultiplier - 1) * 100)}%</span>
                                </div>
                                <div className="flex justify-between text-red-400">
                                    <span>Difficulty:</span>
                                    <span>{Math.round(route.difficultyMultiplier * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
