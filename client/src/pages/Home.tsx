import { useEffect, useState } from 'react';
import { Github } from 'lucide-react';
import { GameContainer } from '@/components/GameContainer';
import { EnemyDatabaseModal } from '@/components/EnemyDatabaseModal';
import { PlayerSystemsModal } from '@/components/PlayerSystemsModal';
import { MissionArchiveModal } from '@/components/MissionArchiveModal';
import { SaveLoadModal } from '@/components/SaveLoadModal';
import { SaveSystem } from '@/game/core/SaveSystem';
import { SoundSystem } from '@/game/core/SoundSystem';
import { StageSelectModal } from '@/components/StageSelectModal';

// Style: retro-futurist arcade command console; this page is the launch bay, not a SaaS landing page.
export default function Home() {
    const [showDatabase, setShowDatabase] = useState(false);
    const [showSystemsDatabase, setShowSystemsDatabase] = useState(false);
    const [showMissionArchive, setShowMissionArchive] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showStageSelect, setShowStageSelect] = useState(false);
    const [musicEnabled, setMusicEnabled] = useState(() => SoundSystem.isMusicEnabled());
    const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem('tyrian_touch_controls_enabled');
        if (stored !== null) return stored === 'true';
        return window.matchMedia('(max-width: 767px)').matches;
    });

    useEffect(() => {
        window.localStorage.setItem('tyrian_touch_controls_enabled', String(touchControlsEnabled));
    }, [touchControlsEnabled]);

    const saveGame = () => {
        SaveSystem.saveGame(1, {
            slotId: '1',
            slotName: 'Quick Manual Save',
            level: 1,
            score: 0,
            shipId: 0,
            weaponLevels: { '0': 1 },
            generatorLevel: 1,
            shieldLevel: 1,
            currentWeapon: 'straight',
            tacticalAbilityLevels: {},
            selectedTacticalAbility: 'time_lock'
        });
        alert('Game progress saved successfully to Slot 1!');
    };

    return (
        <div className="tyrian-shell">
            <header className="command-header">
                <div className="command-header__inner">
                    <div className="brand-lockup">
                        <div className="brand-emblem" aria-hidden="true">
                            <span />
                            <i />
                        </div>
                        <div>
                            <p className="brand-eyebrow">PROGRAM ZERO // FLIGHT NETWORK</p>
                            <h1 className="brand-wordmark">TYRIAN <span>2000</span></h1>
                        </div>
                    </div>
                    <div className="header-readout">
                        <span className="signal-dot" />
                        <span>ARK-9 LINK // ONLINE</span>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="Open project source on GitHub">
                            <Github size={19} />
                        </a>
                    </div>
                </div>
            </header>

            <main className="command-main">


                <section className="launch-section" aria-labelledby="launch-title">
                    <div className="section-heading-row">
                        <div>
                            <p className="section-kicker">FLIGHT DECK // READY ROOM</p>
                            <h2 id="launch-title">Select command.</h2>
                        </div>
                        <span className="status-tag">LIVE BUILD / CANVAS 60 FPS // TOUCH {touchControlsEnabled ? 'ARMED' : 'HIDDEN'}</span>
                    </div>
                    <div className="action-rail" aria-label="Game command actions">
                        <button type="button" onClick={() => setShowLoadModal(true)} className="console-button console-button--cyan">Load slot</button>
                        <button type="button" onClick={saveGame} className="console-button console-button--green">Save slot</button>
                        <button type="button" onClick={() => setShowDatabase(true)} className="console-button console-button--muted">Enemy database</button>
                        <button type="button" onClick={() => setShowSystemsDatabase(true)} className="console-button console-button--cyan">Player systems codex</button>
                        <button type="button" onClick={() => setShowMissionArchive(true)} className="console-button console-button--amber">Mission archive log</button>
                        <button type="button" onClick={() => setShowStageSelect(true)} className="console-button console-button--magenta">Stage map 01—100</button>
                        <button
                            type="button"
                            onClick={() => setMusicEnabled(SoundSystem.toggleMusic())}
                            className={`console-button ${musicEnabled ? 'console-button--green' : 'console-button--muted'}`}
                            aria-pressed={musicEnabled}
                        >
                            Music: {musicEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTouchControlsEnabled((enabled) => !enabled)}
                            className={`console-button ${touchControlsEnabled ? 'console-button--magenta' : 'console-button--muted'}`}
                            aria-pressed={touchControlsEnabled}
                            aria-label={`${touchControlsEnabled ? 'Hide' : 'Show'} touch controls`}
                        >
                            Touch controls: {touchControlsEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <div className="launch-frame hud-frame">
                        <div className="launch-frame__topline"><span>LAUNCH WINDOW // PILOT LINKED</span><span>INPUT: KEYBOARD + POINTER // TOUCH {touchControlsEnabled ? 'ARMED' : 'HIDDEN'}</span></div>
                        <div className="game-window">
                            <GameContainer touchControlsEnabled={touchControlsEnabled} />
                        </div>
                    </div>
                </section>

                {showDatabase && <EnemyDatabaseModal onClose={() => setShowDatabase(false)} />}
                {showSystemsDatabase && <PlayerSystemsModal onClose={() => setShowSystemsDatabase(false)} />}
                {showMissionArchive && <MissionArchiveModal onClose={() => setShowMissionArchive(false)} />}
                {showLoadModal && (
                    <SaveLoadModal
                        isOpen={showLoadModal}
                        mode="load"
                        onClose={() => setShowLoadModal(false)}
                        onLoadGame={() => setShowLoadModal(false)}
                    />
                )}
                {showStageSelect && (
                    <StageSelectModal
                        maxUnlockedLevel={100}
                        onSelectStage={() => setShowStageSelect(false)}
                        onClose={() => setShowStageSelect(false)}
                    />
                )}

                <section className="telemetry-grid" aria-label="Campaign systems">
                    <article className="telemetry-module hud-frame">
                        <span className="module-index">01 // SYSTEM</span>
                        <h3>Build the loadout.</h3>
                        <p>Five weapon families, fifteen levels, shield recharge, generator strain, and four experimental hulls that change what you can carry.</p>
                    </article>
                    <article className="telemetry-module hud-frame">
                        <span className="module-index">02 // THREAT</span>
                        <h3>Read the formation.</h3>
                        <p>Scout chains, orbiters, sentinels, heavy armor, bosses, and projectile signatures that demand different answers.</p>
                    </article>
                    <article className="telemetry-module hud-frame">
                        <span className="module-index">03 // SIGNAL</span>
                        <h3>Choose the route.</h3>
                        <p>Every ten stages the campaign branches. Rewards, pressure, and the people speaking in your comms all change with the decision.</p>
                    </article>
                </section>

                <section className="flight-panel hud-frame" aria-labelledby="flight-title">
                    <div>
                        <p className="section-kicker">PILOT MANUAL // QUICK READ</p>
                        <h2 id="flight-title">Keep the prototype alive.</h2>
                        <p>Destroy the boss or survive the timed stage, then press Enter to reach the upgrade bay. Space fires; the arrow keys move; E activates or stops the fully charged tactical module. On mobile, drag the left joystick, hold FIRE, and tap TACTICAL to start or stop the ability.</p>
                        <p className="mt-2 text-amber-300/80">TEST LINK: hold M for 8 seconds for credits; press L and enter a stage from 1 to 100.</p>
                    </div>
                    <div className="control-readout">
                        <span><b>↑ ↓ ← →</b> MOVE</span>
                        <span><b>SPACE</b> FIRE</span>
                        <span><b>E</b> TACTICAL</span>
                        <span><b>ENTER</b> NEXT STAGE</span>
                        <span><b>ESC</b> PAUSE / RESERVED</span>
                        <span className="mobile-manual-control"><b>TOUCH {touchControlsEnabled ? 'ON' : 'OFF'}</b> JOYSTICK · FIRE · TACTICAL</span>
                    </div>
                </section>

                <section className="developer-log hud-frame" aria-labelledby="developer-log-title">
                    <div>
                        <p className="section-kicker">ENGINE LOG // SECONDARY READOUT</p>
                        <h2 id="developer-log-title">Built to keep expanding.</h2>
                    </div>
                    <div className="developer-log__columns">
                        <p><b>FRONTEND</b><br />React 19 / TypeScript / HTML5 Canvas / Web Audio API</p>
                        <p><b>ARCHITECTURE</b><br />OOP entity modules / delta-time movement / campaign data systems</p>
                        <p><b>RENDERING</b><br />Layered vector-style silhouettes / regional backgrounds / particle effects</p>
                    </div>
                </section>
            </main>

            <footer className="command-footer">
                <span>TYRIAN 2000 // PROGRAM ZERO</span>
                <span>ARK-9 FLIGHT NETWORK © 2026</span>
            </footer>
        </div>
    );
}
