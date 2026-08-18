import { useEffect, useState } from 'react';
import { PlayerSystemsDatabase } from '@/game/story/PlayerSystemsDatabase';
import { X, Zap, Shield, Rocket, Crosshair } from 'lucide-react';

interface PlayerSystemsModalProps {
    onClose: () => void;
    secretWeaponUnlocked?: boolean;
}

export function PlayerSystemsModal({ onClose, secretWeaponUnlocked = false }: PlayerSystemsModalProps) {
    const [activeTab, setActiveTab] = useState<'weapons' | 'generator' | 'shield' | 'ships'>('weapons');
    const [isSecretWeaponUnlocked, setIsSecretWeaponUnlocked] = useState(() => secretWeaponUnlocked || localStorage.getItem('tyrian_secret_weapon_unlocked') === 'true');

    useEffect(() => {
        const handleSecretUnlock = () => setIsSecretWeaponUnlocked(true);
        window.addEventListener('tyrian:secret-weapon-unlocked', handleSecretUnlock);
        return () => window.removeEventListener('tyrian:secret-weapon-unlocked', handleSecretUnlock);
    }, []);

    const weapons = PlayerSystemsDatabase.getWeapons();
    const visibleWeapons = weapons.map((weapon, index) => index === weapons.length - 1 && !isSecretWeaponUnlocked
        ? {
            ...weapon,
            name: 'UNKNOWN',
            type: 'Secret / Unidentified',
            description: 'No usable telemetry. Dr. Naomi cannot determine what this system does until the evasive hunter is destroyed.',
            powerConsumption: 'UNKNOWN',
            upgradeScale: 'UNKNOWN — calibration data unavailable.'
        }
        : weapon);
    const generator = PlayerSystemsDatabase.getGenerator();
    const shield = PlayerSystemsDatabase.getShield();
    const ships = PlayerSystemsDatabase.getShips();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-lg shadow-2xl shadow-cyan-950/40 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 border border-cyan-400/40 text-cyan-400">
                            <Crosshair size={20} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Program Zero // AI Tech Codex</p>
                            <h2 className="text-xl font-bold text-white">Player Systems & Armament Database</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-cyan-500/20 transition-colors"
                        aria-label="Close database"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-cyan-500/30 bg-slate-900/50 px-6 gap-2 pt-2">
                    <button
                        onClick={() => setActiveTab('weapons')}
                        className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'weapons'
                                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <Crosshair size={15} /> Weapons (6)
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'generator'
                                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <Zap size={15} /> Generator
                    </button>
                    <button
                        onClick={() => setActiveTab('shield')}
                        className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'shield'
                                ? 'border-teal-400 text-teal-300 bg-teal-950/30'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <Shield size={15} /> Shield System
                    </button>
                    <button
                        onClick={() => setActiveTab('ships')}
                        className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'ships'
                                ? 'border-green-400 text-green-300 bg-green-950/30'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <Rocket size={15} /> Ship Hulls (4)
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeTab === 'weapons' && (
                        <div className="grid gap-4">
                            <p className="text-xs text-gray-400 font-mono mb-2">
                                Known weapons feature 25 upgradable levels. The recovered sixth signature remains UNKNOWN until the evasive hunter is destroyed. Buying a weapon equips it and preserves previously invested scores.
                            </p>
                            {visibleWeapons.map((w, index) => (
                                <div key={index} className="p-4 bg-slate-900/80 border border-cyan-500/20 rounded hover:border-cyan-400/40 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-cyan-300 font-rajdhani tracking-wide">{w.name}</h3>
                                        <div className="flex items-center gap-3 text-xs font-mono">
                                            <span className="text-amber-400">Max Level: {w.name === 'UNKNOWN' ? '??' : w.maxLevel}</span>
                                            <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 border border-cyan-500/30">Draw: {w.powerConsumption}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2 leading-relaxed">{w.description}</p>
                                    <p className="text-xs text-cyan-200/70 font-mono"><span className="text-cyan-400">Progression:</span> {w.upgradeScale}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'generator' && (
                        <div className="space-y-4">
                            <div className="p-5 bg-slate-900/80 border border-amber-500/30 rounded">
                                <div className="flex items-center gap-3 mb-3">
                                    <Zap className="text-amber-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-amber-300 font-rajdhani">Antimatter Power Core (Generator)</h3>
                                        <p className="text-xs font-mono text-amber-400/80">{generator.levelRange}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed mb-4">{generator.description}</p>
                                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-500/20 text-xs font-mono">
                                    <div className="p-3 bg-amber-950/20 border border-amber-500/20">
                                        <span className="text-amber-400 block mb-1">RECHARGE FORMULA</span>
                                        <span className="text-white text-sm">{generator.outputFormula}</span>
                                    </div>
                                    <div className="p-3 bg-amber-950/20 border border-amber-500/20">
                                        <span className="text-amber-400 block mb-1">CAPACITY NOTE</span>
                                        <span className="text-gray-300">{generator.capacityNote}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shield' && (
                        <div className="space-y-4">
                            <div className="p-5 bg-slate-900/80 border border-teal-500/30 rounded">
                                <div className="flex items-center gap-3 mb-3">
                                    <Shield className="text-teal-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-teal-300 font-rajdhani">Energy Shield Matrix</h3>
                                        <p className="text-xs font-mono text-teal-400/80">{shield.levelRange}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed mb-4">{shield.description}</p>
                                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-teal-500/20 text-xs font-mono">
                                    <div className="p-3 bg-teal-950/20 border border-teal-500/20">
                                        <span className="text-teal-400 block mb-1">BASE STATS</span>
                                        <span className="text-white">{shield.baseStats}</span>
                                    </div>
                                    <div className="p-3 bg-teal-950/20 border border-teal-500/20">
                                        <span className="text-teal-400 block mb-1">MAX STATS (LVL 10)</span>
                                        <span className="text-white">{shield.maxStats}</span>
                                    </div>
                                    <div className="p-3 bg-teal-950/20 border border-teal-500/20">
                                        <span className="text-teal-400 block mb-1">UPGRADE NOTE</span>
                                        <span className="text-gray-300">{shield.upgradeNote}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ships' && (
                        <div className="grid gap-4">
                            <p className="text-xs text-gray-400 font-mono mb-2">
                                Upgrading your hull unlocks higher weapon level caps and generator capacity limits. Purchase ships using combat points in the level-complete shop or shortcut keys.
                            </p>
                            {ships.map((s) => (
                                <div key={s.id} className="p-4 bg-slate-900/80 border border-green-500/20 rounded hover:border-green-400/40 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-green-300 font-rajdhani tracking-wide">Tier {s.id + 1}: {s.name}</h3>
                                        <div className="flex items-center gap-3 text-xs font-mono">
                                            <span className="text-amber-400">Cost: {s.cost === 0 ? 'FREE (Starter)' : `${s.cost} PTS`}</span>
                                            <span className="text-green-400 bg-green-950/60 px-2 py-0.5 border border-green-500/30">Cap: Lvl {s.weaponCapacity}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2 leading-relaxed">{s.description}</p>
                                    <div className="text-xs font-mono text-gray-400">
                                        Max Generator Level Cap: <span className="text-amber-300 font-bold">{s.generatorCapacity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-cyan-500/30 bg-slate-900/90 flex justify-between items-center text-xs text-gray-400 font-mono">
                    <span>PROGRAM ZERO // TACTICAL ARCHIVE</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold transition-colors"
                    >
                        CLOSE CODEX
                    </button>
                </div>
            </div>
        </div>
    );
}
