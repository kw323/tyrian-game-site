import { GameContainer } from '@/components/GameContainer';
import { Github } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
            {/* Header */}
            <header className="border-b border-green-500/20 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center font-bold text-black">
                            T
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                            Tyrian 2000
                        </h1>
                    </div>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                        <Github size={24} />
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-6xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <section className="mb-16 text-center">
                    <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent">
                        Modular Game Engine
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        A professional, scalable space shooter built with vanilla JavaScript, Canvas API, and Object-Oriented Programming principles. Play now and experience the classic Tyrian 2000 style gameplay.
                    </p>
                </section>

                {/* Game Canvas */}
                <section className="mb-16 flex justify-center">
                    <div className="w-full max-w-2xl">
                        <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-8">
                            <GameContainer />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 border border-green-500/20 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-green-400 mb-3">Modular Architecture</h3>
                        <p className="text-gray-300">
                            Built with Object-Oriented Programming principles for easy expansion. Add new entities, systems, and features without breaking existing code.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 border border-green-500/20 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-green-400 mb-3">High Performance</h3>
                        <p className="text-gray-300">
                            Optimized Canvas rendering with delta-time based movement ensures smooth 60 FPS gameplay across all devices.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 border border-green-500/20 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-green-400 mb-3">Scalable Design</h3>
                        <p className="text-gray-300">
                            Extensible system for adding enemies, weapons, power-ups, and complex game mechanics. Foundation ready for Tyrian 2000 complexity.
                        </p>
                    </div>
                </section>

                {/* How to Play */}
                <section className="bg-gradient-to-r from-green-900/10 to-green-950/10 border border-green-500/20 rounded-lg p-8 mb-16">
                    <h3 className="text-2xl font-bold text-green-400 mb-6">How to Play</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold text-green-300 mb-3">Controls</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li><span className="text-green-400 font-mono">↑ ↓ ← →</span> - Move your ship</li>
                                <li><span className="text-green-400 font-mono">SPACE</span> - Fire weapons</li>
                                <li><span className="text-green-400 font-mono">ESC</span> - Pause (coming soon)</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-green-300 mb-3">Objective</h4>
                            <p className="text-gray-300">
                                Survive the incoming waves of enemies by moving and shooting. Destroy all enemies to progress to the next level. Collect power-ups to enhance your weapons and shields.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Technical Details */}
                <section className="bg-gradient-to-r from-slate-900/50 to-slate-950/50 border border-slate-700/50 rounded-lg p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">Technical Stack</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold text-green-400 mb-3">Frontend</h4>
                            <ul className="space-y-2 text-gray-300 text-sm">
                                <li>• React 19 with TypeScript</li>
                                <li>• HTML5 Canvas API</li>
                                <li>• Vanilla JavaScript Game Engine</li>
                                <li>• Tailwind CSS for UI</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-green-400 mb-3">Architecture</h4>
                            <ul className="space-y-2 text-gray-300 text-sm">
                                <li>• Entity-Component-System (ECS) Pattern</li>
                                <li>• Object-Oriented Programming</li>
                                <li>• Modular System Design</li>
                                <li>• Delta-Time Based Movement</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-green-500/20 bg-black/50 mt-16 py-8">
                <div className="container max-w-6xl mx-auto px-4 text-center text-gray-400">
                    <p>Built with ❤️ using Vanilla JavaScript and Canvas API</p>
                    <p className="text-sm mt-2">Tyrian 2000 Modular Game Engine © 2026</p>
                </div>
            </footer>
        </div>
    );
}
