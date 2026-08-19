import { useEffect, useMemo, useState } from 'react';
import { Github } from 'lucide-react';
import { GameContainer } from '@/components/GameContainer';
import { CommandCenter, GameplayLanguage } from '@/components/CommandCenter';
import { EnemyDatabaseModal } from '@/components/EnemyDatabaseModal';
import { PlayerSystemsModal } from '@/components/PlayerSystemsModal';
import { MissionArchiveModal } from '@/components/MissionArchiveModal';
import { SaveLoadModal } from '@/components/SaveLoadModal';
import { ControlsSettingsModal } from '@/components/ControlsSettingsModal';
import { StageSelectModal } from '@/components/StageSelectModal';
import { SaveData, SaveSystem } from '@/game/core/SaveSystem';
import { DifficultyId, DifficultySystem } from '@/game/core/DifficultySystem';
import { SoundSystem } from '@/game/core/SoundSystem';
import { VoicePlaybackManager } from '@/game/core/VoicePlaybackManager';
import { Capacitor } from '@capacitor/core';

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

function readGameplayLanguage(): GameplayLanguage {
    const stored = window.localStorage.getItem('tyrian_gameplay_lang');
    return stored === 'he' || stored === 'en' || stored === 'ja' || stored === 'zh' ? stored : 'he';
}

export default function Home() {
    const isNativeAndroid = Capacitor.isNativePlatform();
    const [launchMode, setLaunchMode] = useState<LaunchMode>(null);
    const [initialStage, setInitialStage] = useState<number | null>(null);
    const [showDatabase, setShowDatabase] = useState(false);
    const [showSystemsDatabase, setShowSystemsDatabase] = useState(false);
    const [showMissionArchive, setShowMissionArchive] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showControlsModal, setShowControlsModal] = useState(false);
    const [showStageMapModal, setShowStageMapModal] = useState(false);
    const [saveRevision, setSaveRevision] = useState(0);
    const [musicEnabled, setMusicEnabled] = useState(() => SoundSystem.isMusicEnabled());
    const [gameplayLanguage, setGameplayLanguage] = useState<GameplayLanguage>(readGameplayLanguage);
    const [difficultyId, setDifficultyId] = useState<DifficultyId>(() => DifficultySystem.load());
    const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem('tyrian_touch_controls_enabled');
        if (stored !== null) return stored === 'true';
        return Capacitor.isNativePlatform() || window.matchMedia('(max-width: 767px)').matches;
    });
    const [mouseControlsEnabled, setMouseControlsEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem('tyrian_mouse_controls_enabled');
        return stored === null ? true : stored === 'true';
    });

    const resumePreview = useMemo(() => readResumePreview(), [saveRevision]);
    const manualSaveCount = useMemo(() => SaveSystem.getManualSaveCount(), [saveRevision]);
    const autoSave = useMemo(() => SaveSystem.loadAutoSave(), [saveRevision]);

    useEffect(() => {
        if (isNativeAndroid && !touchControlsEnabled) {
            setTouchControlsEnabled(true);
            return;
        }
        window.localStorage.setItem('tyrian_touch_controls_enabled', String(touchControlsEnabled));
    }, [isNativeAndroid, touchControlsEnabled]);

    useEffect(() => {
        window.localStorage.setItem('tyrian_mouse_controls_enabled', String(mouseControlsEnabled));
    }, [mouseControlsEnabled]);

    useEffect(() => {
        window.localStorage.setItem('tyrian_gameplay_lang', gameplayLanguage);
    }, [gameplayLanguage]);

    useEffect(() => {
        DifficultySystem.save(difficultyId);
    }, [difficultyId]);

    const startNewMission = () => {
        VoicePlaybackManager.primeFromGesture();
        window.localStorage.removeItem(RESUME_CHECKPOINT_KEY);
        setInitialStage(null);
        setSaveRevision((revision) => revision + 1);
        setLaunchMode('new');
    };

    const continueMission = () => {
        VoicePlaybackManager.primeFromGesture();
        if (!resumePreview) {
            setShowLoadModal(true);
            return;
        }
        setInitialStage(null);
        setLaunchMode('continue');
    };

    const launchTestStage = (stage: number): void => {
        VoicePlaybackManager.primeFromGesture();
        setShowStageMapModal(false);
        setInitialStage(stage);
        setLaunchMode('new');
    };

    const loadSelectedSave = (data: SaveData) => {
        VoicePlaybackManager.primeFromGesture();
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
            tacticalAbilityState: data.tacticalAbilityState,
        }));
        setInitialStage(null);
        setSaveRevision((revision) => revision + 1);
        setLaunchMode('continue');
    };

    const commandCenter = (
        <CommandCenter
            resumePreview={resumePreview}
            manualSaveCount={manualSaveCount}
            autoSave={autoSave}
            musicEnabled={musicEnabled}
            gameplayLanguage={gameplayLanguage}
            difficultyId={difficultyId}
            onStartNewMission={startNewMission}
            onContinueMission={continueMission}
            onOpenStageMap={() => setShowStageMapModal(true)}
            onOpenSaves={() => setShowLoadModal(true)}
            onOpenSystems={() => setShowSystemsDatabase(true)}
            onOpenControls={() => setShowControlsModal(true)}
            onOpenDatabase={() => setShowDatabase(true)}
            onOpenArchive={() => setShowMissionArchive(true)}
            onToggleMusic={() => setMusicEnabled(SoundSystem.toggleMusic())}
            onChangeLanguage={setGameplayLanguage}
            onChangeDifficulty={setDifficultyId}
        />
    );

    const androidTitleScreen = (
        <main className="android-title-deck" aria-labelledby="android-game-title">
            <header className="android-title-deck__header"><span>ARK-9 // FLIGHT DECK</span><span className="signal-dot" /><span>OFFLINE READY</span></header>
            <section className="android-title-deck__hero">
                <p>PROGRAM ZERO // STARSHIP DEFENSE COMMAND</p>
                <h2 id="android-game-title">PROTECT <span>THE STARSHIP</span></h2>
                <div className="android-title-deck__save-status"><span>{resumePreview ? `CHECKPOINT: STAGE ${resumePreview.level}` : 'NO ACTIVE CHECKPOINT'}</span><span>{autoSave ? 'AUTOSAVE: READY' : 'AUTOSAVE: EMPTY'}</span></div>
            </section>
            <section className="android-launch-actions" aria-label="Android mission commands">
                <button type="button" className="android-launch-actions__primary" onClick={startNewMission}>NEW MISSION</button>
                <button type="button" className="android-launch-actions__continue" onClick={continueMission}>{resumePreview ? `CONTINUE STAGE ${resumePreview.level}` : 'LOAD SAVED MISSION'}</button>
                <button type="button" className="android-launch-actions__utility" onClick={() => setShowLoadModal(true)}>SAVES</button>
            </section>
            <section className="android-title-utilities" aria-label="Android game settings">
                <button type="button" onClick={() => setShowDatabase(true)}>ENEMY INTEL</button>
                <button type="button" onClick={() => setShowSystemsDatabase(true)}>SHIP SYSTEMS</button>
                <button type="button" onClick={() => setMusicEnabled(SoundSystem.toggleMusic())}>MUSIC: {musicEnabled ? 'ON' : 'OFF'}</button>
                <button type="button" onClick={() => setShowControlsModal(true)}>CONTROL GUIDE</button>
            </section>
        </main>
    );

    return (
        <div className={`tyrian-shell ${isNativeAndroid ? 'tyrian-shell--android' : ''}`}>
            {!isNativeAndroid && <header className="command-header"><div className="command-header__inner"><div className="brand-lockup"><div className="brand-emblem" aria-hidden="true"><span /><i /></div><div><p className="brand-eyebrow">PROGRAM ZERO // FLIGHT NETWORK</p><h1 className="brand-wordmark">PROTECT <span>THE STARSHIP</span></h1></div></div><div className="header-readout"><span className="signal-dot" /><span>ARK-9 LINK // ONLINE</span><a href="https://github.com/kw323/tyrian-game-site" target="_blank" rel="noopener noreferrer" aria-label="Open project source on GitHub"><Github size={19} /></a></div></div></header>}

            {launchMode ? (
                <main className={isNativeAndroid ? 'android-mission-shell' : 'command-main'}>
                    {!isNativeAndroid && <div className="flex justify-between items-center gap-3 mb-3"><span className="status-tag">{initialStage ? `TEST STAGE // ${initialStage}` : launchMode === 'new' ? 'NEW MISSION // STAGE 1' : `CONTINUE MISSION // STAGE ${resumePreview?.level ?? 1}`}</span><button type="button" onClick={() => { setInitialStage(null); setLaunchMode(null); }} className="console-button console-button--muted">RETURN TO COMMAND CENTER</button></div>}
                    <section className={`launch-frame hud-frame ${isNativeAndroid ? 'launch-frame--android' : ''}`}>
                        {!isNativeAndroid && <div className="launch-frame__topline"><span>FLIGHT DECK // PILOT LINKED</span><span>INPUT: KEYBOARD // MOUSE {mouseControlsEnabled ? 'ARMED' : 'HIDDEN'} // TOUCH {touchControlsEnabled ? 'ARMED' : 'HIDDEN'}</span></div>}
                        <div className="game-window"><GameContainer key={`${launchMode}-${initialStage ?? 'standard'}`} touchControlsEnabled={touchControlsEnabled} mouseControlsEnabled={mouseControlsEnabled} launchMode={launchMode} initialStage={initialStage ?? undefined} onReturnToTitle={() => { setInitialStage(null); setLaunchMode(null); }} /></div>
                    </section>
                </main>
            ) : (isNativeAndroid ? androidTitleScreen : commandCenter)}

            {showControlsModal && <ControlsSettingsModal isOpen={showControlsModal} onClose={() => setShowControlsModal(false)} />}
            {showDatabase && <EnemyDatabaseModal onClose={() => setShowDatabase(false)} />}
            {showSystemsDatabase && <PlayerSystemsModal onClose={() => setShowSystemsDatabase(false)} />}
            {showMissionArchive && <MissionArchiveModal onClose={() => setShowMissionArchive(false)} />}
            {showStageMapModal && <StageSelectModal maxUnlockedLevel={1} allowAllStages onSelectStage={launchTestStage} onClose={() => setShowStageMapModal(false)} />}
            {showLoadModal && <SaveLoadModal isOpen={showLoadModal} mode="load" onClose={() => setShowLoadModal(false)} onLoadGame={loadSelectedSave} onDeleteSave={() => setSaveRevision((revision) => revision + 1)} />}

            {!isNativeAndroid && <footer className="command-footer"><span>PROTECT THE STARSHIP // PROGRAM ZERO</span><span>ARK-9 FLIGHT NETWORK © 2026</span></footer>}
        </div>
    );
}
