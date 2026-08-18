import { useEffect, useMemo, useState } from 'react';
import { Github } from 'lucide-react';
import { GameContainer } from '@/components/GameContainer';
import { EnemyDatabaseModal } from '@/components/EnemyDatabaseModal';
import { PlayerSystemsModal } from '@/components/PlayerSystemsModal';
import { MissionArchiveModal } from '@/components/MissionArchiveModal';
import { SaveLoadModal } from '@/components/SaveLoadModal';
import { ControlsSettingsModal } from '@/components/ControlsSettingsModal';
import { SaveData, SaveSystem } from '@/game/core/SaveSystem';
import { SoundSystem } from '@/game/core/SoundSystem';

const RESUME_CHECKPOINT_KEY = 'tyrian_resume_checkpoint';
type LaunchMode = 'new' | 'continue' | null;

interface ResumePreview {
    level: number;
    score: number;
    savedAt: number;
}

function readResumePreview(): ResumePreview | null {
    const raw = window.localStorage.getItem(RESUME_CHECKPOINT_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as ResumePreview;
        return typeof parsed.level === 'number' && typeof parsed.score === 'number' ? parsed : null;
    } catch {
        window.localStorage.removeItem(RESUME_CHECKPOINT_KEY);
        return null;
    }
}

// The title screen is deliberately the first thing players see: save selection is a game action,
// not a secondary utility hidden below an already-running canvas.
export default function Home() {
    const [launchMode, setLaunchMode] = useState<LaunchMode>(null);
    const [showDatabase, setShowDatabase] = useState(false);
    const [showSystemsDatabase, setShowSystemsDatabase] = useState(false);
    const [showMissionArchive, setShowMissionArchive] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showControlsModal, setShowControlsModal] = useState(false);
    const [saveRevision, setSaveRevision] = useState(0);
    const [musicEnabled, setMusicEnabled] = useState(() => SoundSystem.isMusicEnabled());
    const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem('tyrian_touch_controls_enabled');
        if (stored !== null) return stored === 'true';
        return window.matchMedia('(max-width: 767px)').matches;
    });
    const [mouseControlsEnabled, setMouseControlsEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem('tyrian_mouse_controls_enabled');
        return stored === null ? true : stored === 'true';
    });

    const resumePreview = useMemo(() => readResumePreview(), [saveRevision]);
    const manualSaveCount = useMemo(() => SaveSystem.getSlots().filter(Boolean).length, [saveRevision]);
    const autoSave = useMemo(() => SaveSystem.loadAutoSave(), [saveRevision]);

    useEffect(() => {
        window.localStorage.setItem('tyrian_touch_controls_enabled', String(touchControlsEnabled));
    }, [touchControlsEnabled]);

    useEffect(() => {
        window.localStorage.setItem('tyrian_mouse_controls_enabled', String(mouseControlsEnabled));
    }, [mouseControlsEnabled]);

    const startNewMission = () => {
        window.localStorage.removeItem(RESUME_CHECKPOINT_KEY);
        setSaveRevision((revision) => revision + 1);
        setLaunchMode('new');
    };

    const continueMission = () => {
        if (!resumePreview) {
            setShowLoadModal(true);
            return;
        }
        setLaunchMode('continue');
    };

    const clearCheckpoint = () => {
        if (!window.confirm('Delete the current checkpoint? This cannot be undone.')) return;
        window.localStorage.removeItem(RESUME_CHECKPOINT_KEY);
        setSaveRevision((revision) => revision + 1);
    };

    const loadSelectedSave = (data: SaveData) => {
        window.localStorage.setItem(RESUME_CHECKPOINT_KEY, JSON.stringify({
            level: data.level,
            score: data.score,
            reason: `SAVE SLOT ${data.slotId} LOADED`,
            savedAt: data.timestamp,
            shipId: data.shipId,
            generatorLevel: data.generatorLevel,
            shieldLevel: data.shieldLevel,
            weaponState: {
                weaponLevels: data.weaponLevels,
                currentWeapon: data.currentWeapon,
            },
        }));
        setSaveRevision((revision) => revision + 1);
        setLaunchMode('continue');
    };

    const titleScreen = (
        <main className="command-main">
            <section className="launch-console hud-frame" aria-labelledby="game-title">
                <div className="launch-console__signal-row">
                    <span>ARK-9 DEFENSE NETWORK // READY</span>
                    <span>{resumePreview ? `CHECKPOINT // STAGE ${resumePreview.level}` : 'NO ACTIVE CHECKPOINT'}</span>
                </div>
                <div className="launch-console__core">
                    <p className="launch-console__eyebrow">PROGRAM ZERO // STARSHIP DEFENSE COMMAND</p>
                    <h2 id="game-title">PROTECT <span>THE STARSHIP</span></h2>
                    <p className="launch-console__briefing">
                        Break the pursuit, hold the line, and protect Ark-9 from raiders, military hunters, and the alien fleet.
                    </p>
                    <div className="launch-console__telemetry" aria-label="Save telemetry">
                        <span><b>{resumePreview ? `STAGE ${resumePreview.level}` : 'NEW'}</b>MISSION STATUS</span>
                        <span><b>{manualSaveCount}</b>MANUAL SAVES</span>
                        <span><b>{autoSave ? 'READY' : 'EMPTY'}</b>AUTOSAVE</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <button type="button" onClick={startNewMission} className="launch-command">NEW MISSION</button>
                        <button type="button" onClick={continueMission} className="launch-command">
                            {resumePreview ? `CONTINUE // STAGE ${resumePreview.level}` : 'LOAD SAVED MISSION'}
                        </button>
                        <button type="button" onClick={() => setShowLoadModal(true)} className="console-button console-button--cyan">
                            MANAGE SAVES // LOAD OR DELETE
                        </button>
                        {resumePreview && (
                            <button type="button" onClick={clearCheckpoint} className="console-button console-button--muted">
                                CLEAR CURRENT CHECKPOINT
                            </button>
                        )}
                    </div>
                    <p className="launch-console__hint">SAVES AVAILABLE BEFORE LAUNCH // MOUSE {mouseControlsEnabled ? 'ARMED' : 'HIDDEN'} // TOUCH {touchControlsEnabled ? 'ARMED' : 'HIDDEN'}</p>
                </div>
                <div className="launch-console__footer">
                    <span>FULL CAMPAIGN BUILD 1.1.0 // OFFLINE READY</span>
                    <span>{resumePreview ? `LAST CHECKPOINT ${new Date(resumePreview.savedAt).toLocaleString()}` : 'SELECT NEW MISSION OR LOAD A SAVE'}</span>
                </div>
            </section>

            <section className="telemetry-grid" aria-label="Title screen utilities">
                <article className="telemetry-module hud-frame">
                    <span className="module-index">01 // ARCHIVE</span>
                    <h3>Know the threat.</h3>
                    <button type="button" onClick={() => setShowDatabase(true)} className="console-button console-button--muted">Enemy database</button>
                </article>
                <article className="telemetry-module hud-frame">
                    <span className="module-index">02 // LOADOUT</span>
                    <h3>Review systems.</h3>
                    <button type="button" onClick={() => setShowSystemsDatabase(true)} className="console-button console-button--cyan">Player systems codex</button>
                </article>
                <article className="telemetry-module hud-frame">
                    <span className="module-index">03 // SETTINGS</span>
                    <h3>Prepare controls.</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setMusicEnabled(SoundSystem.toggleMusic())}
                            className={`console-button ${musicEnabled ? 'console-button--green' : 'console-button--muted'}`}
                        >
                            Music: {musicEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMouseControlsEnabled((enabled) => !enabled)}
                            className={`console-button ${mouseControlsEnabled ? 'console-button--cyan' : 'console-button--muted'}`}
                        >
                            Mouse flight: {mouseControlsEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTouchControlsEnabled((enabled) => !enabled)}
                            className={`console-button ${touchControlsEnabled ? 'console-button--magenta' : 'console-button--muted'}`}
                        >
                            Touch: {touchControlsEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button type="button" onClick={() => setShowControlsModal(true)} className="console-button console-button--green">
                            Keyboard map
                        </button>
                    </div>
                </article>
            </section>
        </main>
    );

    return (
        <div className="tyrian-shell">
            <header className="command-header">
                <div className="command-header__inner">
                    <div className="brand-lockup">
                        <div className="brand-emblem" aria-hidden="true"><span /><i /></div>
                        <div>
                            <p className="brand-eyebrow">PROGRAM ZERO // FLIGHT NETWORK</p>
                            <h1 className="brand-wordmark">PROTECT <span>THE STARSHIP</span></h1>
                        </div>
                    </div>
                    <div className="header-readout">
                        <span className="signal-dot" />
                        <span>ARK-9 LINK // ONLINE</span>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="Open project source on GitHub"><Github size={19} /></a>
                    </div>
                </div>
            </header>

            {launchMode ? (
                <main className="command-main">
                    <div className="flex justify-between items-center gap-3 mb-3">
                        <span className="status-tag">{launchMode === 'new' ? 'NEW MISSION // STAGE 1' : `CONTINUE MISSION // STAGE ${resumePreview?.level ?? 1}`}</span>
                        <button type="button" onClick={() => setLaunchMode(null)} className="console-button console-button--muted">RETURN TO TITLE</button>
                    </div>
                    <section className="launch-frame hud-frame">
                        <div className="launch-frame__topline"><span>FLIGHT DECK // PILOT LINKED</span><span>INPUT: KEYBOARD // MOUSE {mouseControlsEnabled ? 'ARMED' : 'HIDDEN'} // TOUCH {touchControlsEnabled ? 'ARMED' : 'HIDDEN'}</span></div>
                        <div className="game-window">
                            <GameContainer
                                key={launchMode}
                                touchControlsEnabled={touchControlsEnabled}
                                mouseControlsEnabled={mouseControlsEnabled}
                                launchMode={launchMode}
                                onReturnToTitle={() => setLaunchMode(null)}
                            />
                        </div>
                    </section>
                </main>
            ) : titleScreen}

            {showControlsModal && <ControlsSettingsModal isOpen={showControlsModal} onClose={() => setShowControlsModal(false)} />}
            {showDatabase && <EnemyDatabaseModal onClose={() => setShowDatabase(false)} />}
            {showSystemsDatabase && <PlayerSystemsModal onClose={() => setShowSystemsDatabase(false)} />}
            {showMissionArchive && <MissionArchiveModal onClose={() => setShowMissionArchive(false)} />}
            {showLoadModal && (
                <SaveLoadModal
                    isOpen={showLoadModal}
                    mode="load"
                    onClose={() => setShowLoadModal(false)}
                    onLoadGame={loadSelectedSave}
                    onDeleteSave={() => setSaveRevision((revision) => revision + 1)}
                />
            )}

            <footer className="command-footer">
                <span>PROTECT THE STARSHIP // PROGRAM ZERO</span>
                <span>ARK-9 FLIGHT NETWORK © 2026</span>
            </footer>
        </div>
    );
}
