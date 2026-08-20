import { useEffect, useMemo, useState } from 'react';
import { SaveData } from '@/game/core/SaveSystem';
import { DifficultyId, DifficultySystem } from '@/game/core/DifficultySystem';
import { GRAPHICS_QUALITY_PROFILES, GraphicsQuality } from '@/game/core/GraphicsSettings';
import { getInterfaceText } from '@/game/story/InterfaceLocalization';

export type CommandSectionId = 'game' | 'upgrades' | 'saves' | 'settings' | 'intel' | 'exit';
export type GameplayLanguage = 'he' | 'en' | 'ja' | 'zh';

interface ResumePreview {
    level: number;
    score: number;
    savedAt: number;
}

interface Props {
    resumePreview: ResumePreview | null;
    manualSaveCount: number;
    autoSave: SaveData | null;
    musicEnabled: boolean;
    gameplayLanguage: GameplayLanguage;
    difficultyId: DifficultyId;
    graphicsQuality: GraphicsQuality;
    onStartNewMission: () => void;
    onContinueMission: () => void;
    onOpenStageMap: () => void;
    onOpenTestStageMap: () => void;
    onOpenSaves: () => void;
    onOpenSystems: () => void;
    onOpenControls: () => void;
    onOpenDatabase: () => void;
    onOpenArchive: () => void;
    onToggleMusic: () => void;
    onChangeLanguage: (language: GameplayLanguage) => void;
    onChangeDifficulty: (difficulty: DifficultyId) => void;
    onChangeGraphicsQuality: (quality: GraphicsQuality) => void;
}

const SECTIONS: Array<{ id: CommandSectionId; index: string; label: string; description: string }> = [
    { id: 'game', index: '01', label: 'GAME', description: 'Launch, continue, or test the campaign.' },
    { id: 'upgrades', index: '02', label: 'UPGRADES', description: 'Review weapons, systems, and pilot growth.' },
    { id: 'saves', index: '03', label: 'SAVE / LOAD', description: 'Secure command records across unlimited pages.' },
    { id: 'settings', index: '04', label: 'SETTINGS', description: 'Display, sound, language, difficulty, and controls.' },
    { id: 'intel', index: '05', label: 'INTEL', description: 'Review enemies and completed mission records.' },
    { id: 'exit', index: '06', label: 'EXIT', description: 'Leave the current command terminal.' }
];

const LANGUAGE_OPTIONS: Array<{ id: GameplayLanguage; label: string; detail: string }> = [
    { id: 'he', label: 'עברית', detail: 'Hebrew' },
    { id: 'en', label: 'English', detail: 'English' },
    { id: 'ja', label: '日本語', detail: 'Japanese' },
    { id: 'zh', label: '简体中文', detail: 'Simplified Chinese' }
];

function formatTime(timestamp: number): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
}

function ActionButton({ label, hint, tone = 'cyan', onClick, disabled = false }: { label: string; hint: string; tone?: 'cyan' | 'green' | 'amber' | 'muted' | 'red'; onClick: () => void; disabled?: boolean }) {
    return (
        <button type="button" disabled={disabled} onClick={onClick} className={`command-center__action command-center__action--${tone}`}>
            <span>{label}</span>
            <small>{hint}</small>
        </button>
    );
}

export function CommandCenter({ resumePreview, manualSaveCount, autoSave, musicEnabled, gameplayLanguage, difficultyId, graphicsQuality, onStartNewMission, onContinueMission, onOpenStageMap, onOpenTestStageMap, onOpenSaves, onOpenSystems, onOpenControls, onOpenDatabase, onOpenArchive, onToggleMusic, onChangeLanguage, onChangeDifficulty, onChangeGraphicsQuality }: Props) {
    const [activeSection, setActiveSection] = useState<CommandSectionId>('game');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const activeIndex = useMemo(() => SECTIONS.findIndex((section) => section.id === activeSection), [activeSection]);
    const activeProfile = DifficultySystem.get(difficultyId);
    const text = getInterfaceText(gameplayLanguage);

    useEffect(() => {
        const handleKeyboardNavigation = (event: KeyboardEvent): void => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (showExitConfirm) {
                if (event.code === 'Escape') {
                    event.preventDefault();
                    setShowExitConfirm(false);
                } else if (event.code === 'Enter' || event.code === 'Space') {
                    event.preventDefault();
                    window.close();
                }
                return;
            }
            if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest('button, a, input, select, textarea')) return;
            const sectionDigit = /^Digit([1-6])$/.exec(event.code);
            if (sectionDigit) {
                event.preventDefault();
                setActiveSection(SECTIONS[Number(sectionDigit[1]) - 1].id);
            } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
                event.preventDefault();
                setActiveSection(SECTIONS[Math.max(0, activeIndex - 1)].id);
            } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
                event.preventDefault();
                setActiveSection(SECTIONS[Math.min(SECTIONS.length - 1, activeIndex + 1)].id);
            } else if (event.code === 'Enter' || event.code === 'Space') {
                event.preventDefault();
                if (activeSection === 'game') (resumePreview ? onContinueMission : onStartNewMission)();
                else if (activeSection === 'upgrades') onOpenSystems();
                else if (activeSection === 'saves') onOpenSaves();
                else if (activeSection === 'settings') onOpenControls();
                else if (activeSection === 'intel') onOpenDatabase();
                else setShowExitConfirm(true);
            }
        };
        window.addEventListener('keydown', handleKeyboardNavigation);
        return () => window.removeEventListener('keydown', handleKeyboardNavigation);
    }, [activeIndex, activeSection, onContinueMission, onOpenControls, onOpenDatabase, onOpenSaves, onOpenSystems, onStartNewMission, resumePreview, showExitConfirm]);

    const renderContent = () => {
        if (activeSection === 'game') {
            return (
                <>
                    <div className="command-center__content-heading">
                        <p>{text.gameHeading}</p>
                        <h2>{resumePreview ? text.resumeStage(resumePreview.level) : text.newCampaign}</h2>
                        <span>{resumePreview ? `${resumePreview.score.toLocaleString()} ${text.savedCheckpoint} • ${formatTime(resumePreview.savedAt)}` : text.noCheckpoint}</span>
                    </div>
                    <div className="command-center__action-grid">
                        <ActionButton label={resumePreview ? text.continueMission : text.newMission} hint={resumePreview ? `ENTER // ${text.savedCheckpoint}` : 'ENTER // STAGE 1'} tone="green" onClick={resumePreview ? onContinueMission : onStartNewMission} />
                        <ActionButton label={text.newMission} hint="STAGE 1" onClick={onStartNewMission} />
                        <ActionButton label={text.stageMap} hint="UNLOCKED CAMPAIGN STAGES" tone="amber" onClick={onOpenStageMap} />
                        <ActionButton label="TEST CONSOLE" hint="ALL 101 STAGES // NO PROGRESS CHANGE" tone="red" onClick={onOpenTestStageMap} />
                    </div>
                </>
            );
        }

        if (activeSection === 'upgrades') {
            return (
                <>
                    <div className="command-center__content-heading">
                        <p>SHIP DEVELOPMENT</p>
                        <h2>UPGRADE INTELLIGENCE</h2>
                        <span>Review weapon paths, generator requirements, tactical abilities, pilot skills, and equipment before the next launch.</span>
                    </div>
                    <div className="command-center__action-grid">
                        <ActionButton label="SHIP SYSTEMS" hint="WEAPONS // GENERATOR // SHIELD" onClick={onOpenSystems} />
                        <ActionButton label="CONTROL MAP" hint="REMAP KEYS // MOUSE FLIGHT" tone="green" onClick={onOpenControls} />
                    </div>
                    <p className="command-center__note">Upgrades are purchased in the Ready Room between stages. This station provides a clear tactical reference before launch.</p>
                </>
            );
        }

        if (activeSection === 'saves') {
            return (
                <>
                    <div className="command-center__content-heading">
                        <p>SECURE COMMAND ARCHIVE</p>
                        <h2>{manualSaveCount} MANUAL SAVE{manualSaveCount === 1 ? '' : 'S'} ONLINE</h2>
                        <span>Ten large save slots per page with unlimited additional pages. Autosave remains separate and protected.</span>
                    </div>
                    <div className="command-center__telemetry-row">
                        <div><small>MANUAL RECORDS</small><b>{manualSaveCount}</b></div>
                        <div><small>AUTOSAVE</small><b>{autoSave ? `STAGE ${autoSave.level}` : 'EMPTY'}</b></div>
                        <div><small>LAST SIGNAL</small><b>{autoSave ? formatTime(autoSave.timestamp) : '—'}</b></div>
                    </div>
                    <div className="command-center__action-grid">
                        <ActionButton label="MANAGE SAVES" hint="ENTER // LOAD OR DELETE" tone="green" onClick={onOpenSaves} />
                    </div>
                </>
            );
        }

        if (activeSection === 'settings') {
            return (
                <>
                    <div className="command-center__content-heading">
                        <p>FLIGHT SYSTEM CONFIGURATION</p>
                        <h2>SETTINGS</h2>
                        <span>All choices apply immediately. Mission difficulty is used the next time a stage is prepared.</span>
                    </div>
                    <div className="command-center__settings-stack">
                        <section className="command-center__setting-card">
                            <div><p>DISPLAY</p><h3>{text.standardDisplay}</h3><span>{text.graphicsDescription}</span></div>
                            <b>1080P+</b>
                        </section>
                        <section className="command-center__setting-card command-center__setting-card--difficulty">
                            <div><p>{text.graphics}</p><h3>{text.quality[graphicsQuality].label}</h3><span>{text.graphicsDescription}</span></div>
                            <div className="command-center__choice-row">
                                {(Object.keys(GRAPHICS_QUALITY_PROFILES) as GraphicsQuality[]).map((quality) => <button key={quality} type="button" onClick={() => onChangeGraphicsQuality(quality)} className={quality === graphicsQuality ? 'is-active' : ''}>{text.quality[quality].label}<small>{text.quality[quality].detail}</small></button>)}
                            </div>
                        </section>
                        <section className="command-center__setting-card">
                            <div><p>{text.music}</p><h3>MUSIC CHANNEL</h3><span>Toggle the tactical soundtrack without changing other game systems.</span></div>
                            <button type="button" onClick={onToggleMusic} className={musicEnabled ? 'command-center__toggle is-on' : 'command-center__toggle'}>{musicEnabled ? 'ON' : 'OFF'}</button>
                        </section>
                        <section className="command-center__setting-card command-center__setting-card--languages">
                            <div><p>{text.language}</p><h3>CAMPAIGN COMMUNICATIONS</h3><span>Dialogue and briefings switch at the next active display.</span></div>
                            <div className="command-center__choice-row">
                                {LANGUAGE_OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => onChangeLanguage(option.id)} className={option.id === gameplayLanguage ? 'is-active' : ''}>{option.label}<small>{option.detail}</small></button>)}
                            </div>
                        </section>
                        <section className="command-center__setting-card command-center__setting-card--difficulty">
                            <div><p>{text.difficulty}</p><h3>{activeProfile.label}</h3><span>{activeProfile.description}</span></div>
                            <div className="command-center__choice-row">
                                {DifficultySystem.PROFILES.map((profile) => <button key={profile.id} type="button" onClick={() => onChangeDifficulty(profile.id)} className={profile.id === difficultyId ? 'is-active' : ''}>{profile.label}</button>)}
                            </div>
                        </section>
                        <section className="command-center__setting-card">
                            <div><p>{text.controls}</p><h3>KEYBOARD AND MOUSE</h3><span>Open the complete control map to remap flight, fire, tactical ability, and menus.</span></div>
                            <button type="button" onClick={onOpenControls} className="command-center__inline-button">{text.openControls}</button>
                        </section>
                    </div>
                </>
            );
        }

        if (activeSection === 'intel') {
            return (
                <>
                    <div className="command-center__content-heading">
                        <p>ARK-9 INFORMATION NETWORK</p>
                        <h2>TACTICAL INTELLIGENCE</h2>
                        <span>Study hostile factions, review the ship reference, and revisit recovered mission communications.</span>
                    </div>
                    <div className="command-center__action-grid">
                        <ActionButton label="ENEMY DATABASE" hint="RAIDERS // MILITARY // ALIENS" onClick={onOpenDatabase} />
                        <ActionButton label="MISSION ARCHIVE" hint="BRIEFINGS // INTERCEPTS // HISTORY" tone="green" onClick={onOpenArchive} />
                        <ActionButton label="SHIP SYSTEMS" hint="TACTICAL REFERENCE" tone="muted" onClick={onOpenSystems} />
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="command-center__content-heading">
                    <p>COMMAND TERMINAL</p>
                    <h2>EXIT TO DESKTOP</h2>
                    <span>Your manual saves and autosave remain stored locally. You can safely close this window after returning to the title terminal.</span>
                </div>
                <div className="command-center__action-grid">
                    <ActionButton label="CLOSE GAME WINDOW" hint="CONFIRM DESKTOP EXIT" tone="red" onClick={() => setShowExitConfirm(true)} />
                </div>
                <p className="command-center__note">Some browser environments block direct window closing. In that case, use the normal window close button.</p>
            </>
        );
    };

    return (
        <main className="command-center" dir={gameplayLanguage === 'he' ? 'rtl' : 'ltr'} aria-label="Protect The Starship command center">
            <div className="command-center__stars" aria-hidden="true" />
            <header className="command-center__masthead">
                <div>
                    <p>ARK-9 // DEFENSE COMMAND // SECURE LINK</p>
                    <h1>PROTECT <span>THE STARSHIP</span></h1>
                </div>
                <div className="command-center__status"><i /> <span>{resumePreview ? `CHECKPOINT: STAGE ${resumePreview.level}` : 'NO ACTIVE CHECKPOINT'}</span></div>
            </header>
            <div className="command-center__frame">
                <aside className="command-center__sidebar" aria-label="Command center navigation">
                    <p className="command-center__sidebar-label">COMMAND MENU</p>
                    <nav>
                        {SECTIONS.map((section) => (
                            <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} aria-current={activeSection === section.id ? 'page' : undefined} className={activeSection === section.id ? 'is-active' : ''}>
                                <span>{section.index}</span><b>{text.sections[section.id]}</b><small>{section.description}</small>
                            </button>
                        ))}
                    </nav>
                    <p className="command-center__sidebar-help">↑↓ / W S SELECT CATEGORY<br />1–6 QUICK SELECT<br />ENTER ACTIVATE • ESC BACK</p>
                </aside>
                <section className="command-center__content" aria-live="polite">
                    <div className="command-center__section-number">{SECTIONS[activeIndex].index} // {text.sections[SECTIONS[activeIndex].id]}</div>
                    {renderContent()}
                </section>
            </div>
            <footer className="command-center__footer"><span>FULL CAMPAIGN // 101 STAGES // OFFLINE READY</span><span>COMMAND CENTER v1.2</span></footer>
            {showExitConfirm && (
                <div className="command-center__exit-confirm" role="dialog" aria-modal="true" aria-labelledby="exit-confirm-title">
                    <section>
                        <p>COMMAND TERMINAL</p>
                        <h2 id="exit-confirm-title">CLOSE THE GAME?</h2>
                        <span>Manual saves and autosave remain stored locally. Press Enter to exit or Escape to stay in command.</span>
                        <div><button type="button" onClick={() => window.close()}>ENTER // EXIT</button><button type="button" onClick={() => setShowExitConfirm(false)}>ESC // STAY</button></div>
                    </section>
                </div>
            )}
        </main>
    );
}
