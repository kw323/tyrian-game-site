import { useEffect, useState } from 'react';
import {
    CONTROL_DEFINITIONS,
    ControlAction,
    ControlBindings,
    FlightControlMode,
    formatControlCode,
    loadControlBindings,
    rebindControl,
    resetControlBindings,
} from '@/game/systems/ControlSettings';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onBindingsChanged?: (bindings: ControlBindings) => void;
    flightControlMode: FlightControlMode;
    onFlightControlModeChange: (mode: FlightControlMode) => void;
}

export function ControlsSettingsModal({ isOpen, onClose, onBindingsChanged, flightControlMode, onFlightControlModeChange }: Props) {
    const [bindings, setBindings] = useState<ControlBindings>(() => loadControlBindings());
    const [capturing, setCapturing] = useState<ControlAction | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setBindings(loadControlBindings());
        setCapturing(null);
        setError(null);
    }, [isOpen]);

    useEffect(() => {
        if (!capturing) return;

        const captureKey = (event: KeyboardEvent): void => {
            event.preventDefault();
            event.stopPropagation();
            if (event.code === 'Escape') {
                setCapturing(null);
                return;
            }
            if (event.repeat) return;

            const result = rebindControl(bindings, capturing, event.code);
            if (result.error) {
                setError(result.error);
                return;
            }
            setBindings(result.bindings);
            onBindingsChanged?.(result.bindings);
            setError(null);
            setCapturing(null);
        };

        window.addEventListener('keydown', captureKey, true);
        return () => window.removeEventListener('keydown', captureKey, true);
    }, [bindings, capturing, onBindingsChanged]);

    if (!isOpen) return null;

    const restoreDefaults = (): void => {
        const defaults = resetControlBindings();
        setBindings(defaults);
        setCapturing(null);
        setError(null);
        onBindingsChanged?.(defaults);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="control-settings-title">
            <section className="w-full max-w-xl rounded-xl border border-cyan-400/40 bg-slate-950 p-5 text-white shadow-2xl shadow-cyan-950/50 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4 border-b border-cyan-500/20 pb-4">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">Flight deck // input profile</p>
                        <h2 id="control-settings-title" className="mt-1 text-xl font-bold text-cyan-200">Flight controls</h2>
                        <p className="mt-1 text-sm text-slate-400">Choose one flight mode. Keyboard bindings remain available for menus, weapons, and tactical commands.</p>
                    </div>
                    <button type="button" onClick={onClose} className="console-button console-button--muted">CLOSE</button>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Flight control mode">
                    <button
                        type="button"
                        onClick={() => onFlightControlModeChange('keyboard')}
                        className={`rounded-lg border p-4 text-left transition-colors ${flightControlMode === 'keyboard' ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100' : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-500/60'}`}
                        aria-pressed={flightControlMode === 'keyboard'}
                    >
                        <span className="block font-mono text-xs font-bold tracking-[0.15em]">KEYBOARD FLIGHT</span>
                        <span className="mt-1 block text-xs leading-relaxed opacity-80">Arrow keys move. Space fires. The mouse cannot steer or fire during combat.</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onFlightControlModeChange('mouse')}
                        className={`rounded-lg border p-4 text-left transition-colors ${flightControlMode === 'mouse' ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100' : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-500/60'}`}
                        aria-pressed={flightControlMode === 'mouse'}
                    >
                        <span className="block font-mono text-xs font-bold tracking-[0.15em]">MOUSE FLIGHT</span>
                        <span className="mt-1 block text-xs leading-relaxed opacity-80">Pointer steers inside the battlefield. Hold the left button to fire. Arrow keys do not steer during combat.</span>
                    </button>
                </div>

                <div className="space-y-2">
                    {CONTROL_DEFINITIONS.map((definition) => {
                        const isCapturing = capturing === definition.action;
                        return (
                            <div key={definition.action} className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${isCapturing ? 'border-cyan-300 bg-cyan-400/10' : 'border-slate-700 bg-slate-900/70'}`}>
                                <div>
                                    <p className="font-bold text-slate-100">{definition.label}</p>
                                    <p className="text-xs text-slate-400">{definition.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setCapturing(definition.action); setError(null); }}
                                    className={`min-w-28 rounded border px-3 py-2 font-mono text-sm font-bold tracking-wide transition-colors ${isCapturing ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-cyan-500/50 bg-slate-950 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-950/50'}`}
                                    aria-label={`Change ${definition.label}, currently ${formatControlCode(bindings[definition.action])}`}
                                >
                                    {isCapturing ? 'PRESS KEY…' : formatControlCode(bindings[definition.action])}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs leading-relaxed text-emerald-100">
                    <b>ACTIVE MODE:</b> {flightControlMode === 'keyboard' ? 'KEYBOARD FLIGHT — only the selected movement and fire keys control the ship in combat.' : 'MOUSE FLIGHT — pointer movement and left-click control the ship in combat.'}
                </div>
                {error && <p role="alert" className="mt-3 rounded border border-red-500/40 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

                <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-800 pt-4">
                    <button type="button" onClick={restoreDefaults} className="console-button console-button--muted">RESTORE DEFAULTS</button>
                    <button type="button" onClick={onClose} className="console-button console-button--cyan">DONE</button>
                </div>
            </section>
        </div>
    );
}
