import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useIsMobile } from '@/hooks/useMobile';
import { Game } from '@/game/core/Game';
import { GameState } from '@/game/core/GameState';
import { Player } from '@/game/entities/Player';
import { Bullet } from '@/game/entities/Bullet';
import { HomingBullet } from '@/game/entities/HomingBullet';
import { HeavyBullet } from '@/game/entities/HeavyBullet';
import { LaserBullet } from '@/game/entities/LaserBullet';
import { BlackHoleBullet } from '@/game/entities/BlackHoleBullet';
import { ChainLightningBullet } from '@/game/entities/ChainLightningBullet';
import { Enemy } from '@/game/entities/Enemy';
import { EnemyAdvanced, EnemyShot } from '@/game/entities/EnemyAdvanced';
import { EnemyBullet } from '@/game/entities/EnemyBullet';
import { Explosion } from '@/game/entities/Explosion';
import { WeaponUpgradeSystem, WeaponType } from '@/game/core/WeaponUpgradeSystem';
import { ElementalCoreSystem, ElementalCoreSaveState, ElementalCoreType, ELEMENTAL_CORE_ORDER } from '@/game/core/ElementalCoreSystem';
import { CombatVisualEffects, VisualFaction } from '@/game/core/CombatVisualEffects';
import { getHeavyFragmentAngles, getWeaponRuntimeProfile } from '@/game/core/WeaponRuntimeProfile';
import { StarField } from '@/game/systems/StarField';
import { InputManager } from '@/game/systems/InputManager';
import { formatControlCode, loadControlBindings } from '@/game/systems/ControlSettings';
import { CollisionSystem } from '@/game/systems/CollisionSystem';
import { EnemySpawner, StageCombatEvent } from '@/game/systems/EnemySpawner';
import { PowerSystem } from '@/game/core/PowerSystem';
import { EngineUpgradeSystem } from '@/game/core/EngineUpgradeSystem';
import type { GraphicsQuality } from '@/game/core/GraphicsSettings';
import { Boss } from '@/game/entities/Boss';
import { SeraDuelEntity, SeraMirrorLoadout, SeraShot } from '@/game/entities/SeraDuelEntity';
import { SeraAllyShipEntity, SeraAllyLoadout } from '@/game/entities/SeraAllyShipEntity';
import { ShipUpgradeSystem } from '@/game/core/ShipUpgradeSystem';
import { AEGIS_MASTERY_CAPACITY, AEGIS_MASTERY_REGEN, getShipDefenseProfile, SHIELD_UPGRADE_CAPACITY, SHIELD_UPGRADE_REGEN } from '@/game/core/ShipDefenseProfile';
import { TacticalAbilitySystem, TacticalAbilityType, TacticalAbilitySaveState } from '@/game/core/TacticalAbilitySystem';
import { PilotSkillSystem } from '@/game/core/PilotSkillSystem';
import { EquipmentSystem, EquipmentPartType } from '@/game/core/EquipmentSystem';
import { CampaignSystem, CharacterId, GameplayLanguage, UpgradeBriefing } from '@/game/story/CampaignSystem';
import { getNaomiTutorialStorageKey, getNaomiUpgradeTutorial, NaomiTutorialTopic } from '@/game/story/NaomiUpgradeTutorials';
import { SoundSystem } from '@/game/core/SoundSystem';
import { BranchSystem, BranchRoute } from '@/game/story/BranchSystem';
import { BackgroundRenderer } from '@/game/story/BackgroundRenderer';
import { StageMasteryResult, StageMasterySystem } from '@/game/core/StageMasterySystem';
import { calculateStagePerformanceXP, StagePerformanceXPResult } from '@/game/core/StagePerformanceXP';
import { MissionTargetEntity } from '@/game/entities/MissionTargetEntity';
import { GravityWell } from '@/game/entities/GravityWell';
import { EquipmentDropEntity } from '@/game/entities/EquipmentDropEntity';
import { AsteroidBeltEntity } from '@/game/entities/AsteroidBeltEntity';
import { StageHazard, StageHazardKind } from '@/game/entities/StageHazard';
import { MissionArchiveSystem } from '@/game/story/MissionArchiveSystem';
import { DifficultySystem, DifficultyId, DifficultyProfile } from '@/game/core/DifficultySystem';
import { FinalBossAssembly, FinalBossPart } from '@/game/entities/FinalBossPart';
import { VoicePlaybackManager } from '@/game/core/VoicePlaybackManager';
import { EpilogueCharacterId, getEpilogueInterfaceCopy, getEpilogueScenes } from '@/game/story/EpilogueSystem';
import { StageSelectModal } from '@/components/StageSelectModal';
import { SaveLoadModal } from '@/components/SaveLoadModal';
import { SaveData, SaveSystem } from '@/game/core/SaveSystem';
import { Capacitor } from '@capacitor/core';

interface NaomiTutorialDialog {
    title: string;
    message: string;
}

interface ResumeCheckpoint {
    level: number;
    score: number;
    reason: string;
    savedAt: number;
    shipId?: number;
    generatorLevel?: number;
    shieldLevel?: number;
    engineUpgradeLevel?: number;
    weaponState?: {
        weaponLevels?: Record<string, number>;
        currentWeapon?: string;
        secretWeaponUnlocked?: boolean;
        secretWeaponFragments?: number;
    };
    pilotSkillsState?: any;
    tacticalAbilityState?: TacticalAbilitySaveState;
    equipmentState?: any;
    elementalCoreState?: ElementalCoreSaveState;
}

const RESUME_CHECKPOINT_KEY = 'tyrian_resume_checkpoint';
const GAME_CANVAS_HEIGHT = 900;
const SHOP_CANVAS_HEIGHT = 1150;
const COMBAT_REWARD_MULTIPLIER = 0.75;
type ShopScreen = 'hub' | 'weapons' | 'elements' | 'systems' | 'abilities' | 'pilot_skills' | 'equipment' | 'finale_victory';

const LANGUAGE_OPTIONS: Array<{ id: GameplayLanguage; label: string; menuLabel: string }> = [
    { id: 'he', label: 'עברית', menuLabel: 'עברית / Hebrew' },
    { id: 'en', label: 'English', menuLabel: 'English / אנגלית' },
    { id: 'ja', label: '日本語', menuLabel: '日本語 / Japanese' },
    { id: 'zh', label: '简体中文', menuLabel: '简体中文 / Chinese' }
];

function isGameplayLanguage(value: string | null): value is GameplayLanguage {
    return LANGUAGE_OPTIONS.some((option) => option.id === value);
}

// Style: the game viewport is an armed retro-futurist flight console, with operational copy, signal strips, and no generic demo language.
interface GameContainerProps {
    touchControlsEnabled?: boolean;
    mouseControlsEnabled?: boolean;
    launchMode?: 'new' | 'continue';
    initialStage?: number;
    onReturnToTitle?: () => void;
    graphicsQuality?: GraphicsQuality;
}

export function GameContainer({ touchControlsEnabled = true, mouseControlsEnabled = true, launchMode = 'continue', initialStage, onReturnToTitle, graphicsQuality = 'standard' }: GameContainerProps) {
    const isMobile = useIsMobile();
    const isNativeAndroid = Capacitor.isNativePlatform();
    // Android runs in landscape, where viewport width is usually larger than the mobile CSS breakpoint.
    // Native detection keeps the dedicated thumb controls active in that orientation.
    const showTouchControls = touchControlsEnabled && (isMobile || isNativeAndroid);
    const showDirectTouchFlight = isNativeAndroid && touchControlsEnabled;
    const [touchFireActive, setTouchFireActive] = useState(false);
    const [touchAbilityPulse, setTouchAbilityPulse] = useState(false);
    const [gameplayLang, setGameplayLang] = useState<GameplayLanguage>(() => {
        const stored = localStorage.getItem('tyrian_gameplay_lang');
        return isGameplayLanguage(stored) ? stored : 'he';
    });
    const gameplayLangRef = useRef<GameplayLanguage>(gameplayLang);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const languageRefreshActionRef = useRef<((language: GameplayLanguage) => void) | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const touchInputRef = useRef({ moveX: 0, moveY: 0, targetX: null as number | null, targetY: null as number | null, fire: false });
    const mouseInputRef = useRef<{ targetX: number | null; targetY: number | null; fire: boolean }>({ targetX: null, targetY: null, fire: false });
    const touchActionsRef = useRef<{ toggleAbility?: () => void; advanceMission?: () => void }>({});
    const gameRef = useRef<Game | null>(null);

    const selectGameplayLanguage = (language: GameplayLanguage): void => {
        setIsLanguageMenuOpen(false);
        if (gameplayLangRef.current === language) return;
        gameplayLangRef.current = language;
        localStorage.setItem('tyrian_gameplay_lang', language);
        setGameplayLang(language);
        languageRefreshActionRef.current?.(language);
        SoundSystem.startMusic();
    };

    useEffect(() => {
        if (!showTouchControls) {
            touchInputRef.current.moveX = 0;
            touchInputRef.current.moveY = 0;
            touchInputRef.current.targetX = null;
            touchInputRef.current.targetY = null;
            touchInputRef.current.fire = false;
        }
    }, [showTouchControls]);

    useEffect(() => {
        if (!mouseControlsEnabled) {
            mouseInputRef.current.targetX = null;
            mouseInputRef.current.targetY = null;
            mouseInputRef.current.fire = false;
        }
    }, [mouseControlsEnabled]);
    // The title screen chooses whether this mounted play session starts new or restores its checkpoint.
    const [gameStarted, setGameStarted] = useState(true);
    const [startFromResume, setStartFromResume] = useState(launchMode === 'continue');
    const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
        const stored = localStorage.getItem('tyrian_max_unlocked_level');
        return stored ? Math.max(1, parseInt(stored, 10)) : 1;
    });
    const [showStageMapModal, setShowStageMapModal] = useState<boolean>(false);
    const [naomiTutorial, setNaomiTutorial] = useState<NaomiTutorialDialog | null>(null);
    const [showManualSaveModal, setShowManualSaveModal] = useState<boolean>(false);
    const [manualSaveState, setManualSaveState] = useState<Omit<SaveData, 'slotId' | 'slotName' | 'timestamp'> | undefined>(undefined);
    const [resumeCheckpoint, setResumeCheckpoint] = useState<ResumeCheckpoint | null>(() => {
        const raw = localStorage.getItem(RESUME_CHECKPOINT_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as ResumeCheckpoint;
        } catch {
            localStorage.removeItem(RESUME_CHECKPOINT_KEY);
            return null;
        }
    });
    let shieldLevel = 1;
    const returnToTitle = (): void => {
        setGameStarted(false);
        onReturnToTitle?.();
    };

    useEffect(() => {
        let currentLangForBriefing = gameplayLang;
        if (!canvasRef.current || !gameStarted) return;

        try {
            // Initialize game
            const game = new Game('gameCanvas', 1200, GAME_CANVAS_HEIGHT);
            gameRef.current = game;

            // Initialize game state
            const gameState = new GameState();
            const resumeData = startFromResume ? resumeCheckpoint : null;
            if (resumeData) {
                gameState.level = Math.max(1, Math.min(CampaignSystem.TOTAL_STAGES, Math.floor(resumeData.level)));
                gameState.score = Math.max(0, Math.floor(resumeData.score));
            }

            // Initialize systems
            const inputManager = new InputManager();
            const starField = new StarField(game.getCanvas().width, GAME_CANVAS_HEIGHT, 150);
            const combatVisualEffects = new CombatVisualEffects(graphicsQuality);
            const collisionSystem = new CollisionSystem();
            const enemySpawner = new EnemySpawner();
            let difficultyId: DifficultyId = DifficultySystem.load();
            let difficultyProfile: DifficultyProfile = DifficultySystem.get(difficultyId);
            enemySpawner.setDifficultyProfile(difficultyProfile);
            const weaponSystem = new WeaponUpgradeSystem();
            const elementalCoreSystem = new ElementalCoreSystem();
            const powerSystem = new PowerSystem();
            const engineUpgradeSystem = new EngineUpgradeSystem();
            const shipSystem = new ShipUpgradeSystem();
            if (resumeData?.weaponState) weaponSystem.loadSaveState(resumeData.weaponState);
            if (resumeData?.elementalCoreState) elementalCoreSystem.loadSaveState(resumeData.elementalCoreState);
            if (typeof resumeData?.generatorLevel === 'number') powerSystem.loadSaveState(resumeData.generatorLevel);
            engineUpgradeSystem.loadSaveState(resumeData?.engineUpgradeLevel);
            if (typeof resumeData?.shipId === 'number') shipSystem.loadSaveState(resumeData.shipId);
            if (typeof resumeData?.shieldLevel === 'number') shieldLevel = Math.max(1, Math.min(10, Math.floor(resumeData.shieldLevel)));
            const tacticalAbilitySystem = new TacticalAbilitySystem();
            if (resumeData?.tacticalAbilityState) tacticalAbilitySystem.loadSaveState(resumeData.tacticalAbilityState);
            const pilotSkillSystem = new PilotSkillSystem();
            if (resumeData?.pilotSkillsState) pilotSkillSystem.loadSaveState(resumeData.pilotSkillsState);
            const equipmentSystem = new EquipmentSystem(resumeData?.equipmentState);
            const stageMasterySystem = new StageMasterySystem();
            const storedMasteryState = localStorage.getItem('tyrian_stage_mastery');
            if (storedMasteryState) {
                try {
                    stageMasterySystem.loadSaveState(JSON.parse(storedMasteryState));
                } catch {
                    localStorage.removeItem('tyrian_stage_mastery');
                }
            }
            const shopHitboxes: Array<{ id: string; x: number; y: number; width: number; height: number; action: () => void }> = [];
            let hoveredShopItem: string | null = null;
            const generatorCosts = (() => {
                const costs = [0];
                let base = 500;
                for (let i = 1; i < 50; i++) {
                    costs.push(base);
                    base = Math.round(base * 1.18);
                }
                return costs;
            })();
            const portraitImages: Partial<Record<CharacterId, HTMLImageElement>> = {};
            const portraitCharacters: CharacterId[] = ['naomi', 'protagonist', 'elena', 'sera', 'ghost'];
            portraitCharacters.forEach((character) => {
                const image = new Image();
                image.src = CampaignSystem.getPortraitUrl(character);
                portraitImages[character] = image;
            });
            const epilogueImages: Partial<Record<EpilogueCharacterId, HTMLImageElement>> = {};
            getEpilogueScenes('he').forEach((scene) => {
                const image = new Image();
                image.src = scene.imageUrl;
                epilogueImages[scene.id] = image;
            });
            let stageBriefing = CampaignSystem.getStageBriefing(gameState.level, currentLangForBriefing);
            let commVisibleUntil = performance.now() + 9000;
            let inMissionCommsTriggered = false;
            let activeContactLine = stageBriefing.contact;
            const refreshBriefingLanguage = (language: GameplayLanguage): void => {
                currentLangForBriefing = language;
                stageBriefing = CampaignSystem.getStageBriefing(gameState.level, language);
                activeContactLine = stageBriefing.contact;
                commVisibleUntil = performance.now() + 9000;
            };
            languageRefreshActionRef.current = refreshBriefingLanguage;

            const resolveStageCombatEvent = (stage: number, missionType: string): StageCombatEvent => {
                if (stage % 3 === 0) return 'standard';
                if (missionType === 'bounty') return 'ambush';
                if (missionType === 'escort') return 'swarm';
                if (missionType === 'recovery') return 'single';
                if (missionType === 'defense') return 'swarm';
                if (missionType === 'singularity') return 'swarm';
                return stage % 5 === 0 ? 'single' : 'standard';
            };

            const getStageHazardBrief = (stage: number, missionType: string): { name: string; detail: string } => {
                if (stage < 70) return { name: 'CLEAR FLIGHT LANE', detail: 'No persistent environmental blocker detected.' };
                if (stage % 5 === 0 || missionType === 'singularity') {
                    return { name: 'MICRO SINGULARITY', detail: 'A drifting gravity well bends player and hostile fire for the entire stage.' };
                }
                if (stage % 2 === 0) {
                    return { name: 'ASTEROID FIELD', detail: 'Rock bodies block movement and destroy projectiles that strike them.' };
                }
                return { name: 'DERELICT WRECKAGE', detail: 'Large abandoned hulls form solid cover and interrupt both flight paths and fire.' };
            };

            const configureStageCombat = (stage: number): void => {
                enemySpawner.setDifficultyProfile(difficultyProfile);
                enemySpawner.configureStage(resolveStageCombatEvent(stage, stageBriefing.missionType), stage);
            };
            let upgradeBriefing: UpgradeBriefing = CampaignSystem.getUpgradeBriefing('weapon', 'Straight Shot', 1);
            let bossSpawnedForLevel = false;
            let currentMissionTarget: MissionTargetEntity | null = null;
            let gravityWell: GravityWell | null = null;
            let stageHazards: StageHazard[] = [];
            let stageHazardKind: StageHazardKind | 'singularity' | null = null;
            let missionEventSpawned = false;
            let stageFailureReason: string | null = null;
            let shopScreen: ShopScreen = 'hub';
            let finaleSceneIndex = 0;
            let initialLaunchPending = true;
            let showCommsModal = false;
            let showAfterActionModal = false;
            let commsParagraphIndex = 0;
            let showBranchModal = false;
            let currentBranchRoute: BranchRoute | null = null;
            let bossDefeatedAt: number | null = null;
            const defeatedBosses = new Set<Boss>();
            let finalBossAssembly: FinalBossAssembly | null = null;
            let seraDuelOutcome: 'win' | 'loss' | null = null;
            let seraAlly: SeraAllyShipEntity | null = null;
            let lastStageMasteryResult: StageMasteryResult | null = null;
            let stageTelemetryFinalized = false;
            let lastStagePerformanceXp: StagePerformanceXPResult | null = null;
            let sectorSealed = false;
            let isTestSession = false;
            let mCheatStartedAt: number | null = null;
            let mCheatLastGrantAt: number | null = null;
            let testNoticeUntil = 0;
            let testNoticeText = '';

            const selectDifficulty = (id: DifficultyId): void => {
                difficultyId = id;
                difficultyProfile = DifficultySystem.get(id);
                DifficultySystem.save(id);
                enemySpawner.setDifficultyProfile(difficultyProfile);
                testNoticeText = `DIFFICULTY SET // ${difficultyProfile.label}`;
                testNoticeUntil = performance.now() + 3500;
            };

            stageMasterySystem.beginStage(gameState.level);
            configureStageCombat(gameState.level);
            for (let difficultyStep = 1; difficultyStep < gameState.level; difficultyStep++) {
                enemySpawner.increaseDifficulty();
            }

            // Open every fresh game in the same Control Deck used between stages.
            // The first launch is armed, but combat waits for pilot confirmation.
            gameState.levelComplete = true;
            gameState.showLevelScreen = true;

            const drawPortrait = (ctx: CanvasRenderingContext2D, character: CharacterId, x: number, y: number, size: number): void => {
                const image = portraitImages[character];
                ctx.save();
                ctx.fillStyle = '#081a28';
                ctx.fillRect(x, y, size, size);

                // Pulsing glow effect for speaking portrait
                const pulse = Math.sin(performance.now() * 0.008) * 0.4 + 0.6;
                ctx.strokeStyle = character === 'sera' ? `rgba(255, 107, 107, ${0.6 + pulse * 0.4})` : character === 'ghost' ? `rgba(197, 156, 255, ${0.6 + pulse * 0.4})` : `rgba(0, 217, 181, ${0.6 + pulse * 0.4})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, size, size);

                if (image?.complete && image.naturalWidth > 0) {
                    ctx.drawImage(image, x, y, size, size);
                } else {
                    ctx.fillStyle = '#8ea6b2';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(character.toUpperCase(), x + size / 2, y + size / 2 + 4);
                }
                ctx.restore();
            };

            const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number): void => {
                const usesCjkScript = /[\u3040-\u30FF\u3400-\u9FFF]/.test(text);
                const segments = usesCjkScript ? Array.from(text) : text.split(/\s+/);
                const separator = usesCjkScript ? '' : ' ';
                let line = '';
                let lineNumber = 0;
                for (const segment of segments) {
                    const candidate = line ? `${line}${separator}${segment}` : segment;
                    if (ctx.measureText(candidate).width > maxWidth && line) {
                        ctx.fillText(line, x, y + lineNumber * lineHeight);
                        lineNumber++;
                        line = segment;
                        if (lineNumber >= maxLines - 1) break;
                    } else {
                        line = candidate;
                    }
                }
                if (lineNumber < maxLines) ctx.fillText(line, x, y + lineNumber * lineHeight);
            };

            const drawContactPanel = (ctx: CanvasRenderingContext2D): void => {
                if (gameState.showLevelScreen || gameState.gameOver || performance.now() > commVisibleUntil) return;
                const panelX = game.getCanvas().width - 315;
                const panelY = 18;
                const panelWidth = 295;
                const panelHeight = 104;
                const contact = activeContactLine;
                ctx.save();
                ctx.fillStyle = 'rgba(4, 14, 28, 0.94)';
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                ctx.strokeStyle = contact.speaker === 'sera' ? '#ff6b6b' : '#00d9b5';
                ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
                drawPortrait(ctx, contact.speaker, panelX + 10, panelY + 12, 58);
                ctx.textAlign = 'left';
                ctx.fillStyle = contact.speaker === 'sera' ? '#ff9b9b' : '#72ffe1';
                ctx.font = 'bold 11px Arial';
                ctx.fillText(`${contact.name}  •  COMMS`, panelX + 78, panelY + 27);
                ctx.fillStyle = '#f0b84e';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(stageBriefing.operationCode, panelX + 78, panelY + 42);
                ctx.fillStyle = '#dbe9ee';
                ctx.font = '10px Arial';
                drawWrappedText(ctx, contact.message, panelX + 78, panelY + 59, 202, 13, 3);
                ctx.restore();
            };

            const syncPlayerWeapon = (type: WeaponType): void => {
                const stats = weaponSystem.getCurrentWeaponStats();
                if (!stats) return;
                const playerWeapon = type === WeaponType.STRAIGHT
                    ? 'straight'
                    : type === WeaponType.SPREAD
                        ? 'spread'
                        : type === WeaponType.HOMING
                            ? 'homing'
                            : type === WeaponType.LASER
                                ? 'laser'
                                : type === WeaponType.ARC
                                    ? 'arc'
                                    : type === WeaponType.VOID_LANCE
                                        ? 'void_lance'
                                        : 'heavy';
                const damageBonus = pilotSkillSystem.getBonusMultiplier('weapon_damage');
                const fireRateBonus = pilotSkillSystem.getBonusMultiplier('fire_rate');
                const finalDamage = Math.round(stats.damage * damageBonus);
                const finalFireRate = Math.max(0.04, stats.fireRate * fireRateBonus);
                player.setWeapon(playerWeapon, weaponSystem.getCurrentLevel(type), finalFireRate, finalDamage);
                player.setCriticalProfile(
                    pilotSkillSystem.getCriticalChance(),
                    pilotSkillSystem.getCriticalDamageMultiplier()
                );
            };

            const findNearestHomingTarget = (x: number, y: number): Enemy | EnemyAdvanced | Boss | MissionTargetEntity | null => {
                let nearestTarget: Enemy | EnemyAdvanced | Boss | MissionTargetEntity | null = null;
                let nearestDistance = Infinity;
                game['entities'].forEach((entity: any) => {
                    if ((entity instanceof Enemy || entity instanceof EnemyAdvanced || entity instanceof Boss || entity instanceof MissionTargetEntity) && entity.isActive) {
                        const targetX = entity.x + entity.width / 2;
                        const targetY = entity.y + entity.height / 2;
                        const distance = Math.hypot(targetX - x, targetY - y);
                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestTarget = entity;
                        }
                    }
                });
                return nearestTarget;
            };

            const getWeaponDisplayName = (type: WeaponType): string => {
                if (type === WeaponType.STRAIGHT) return 'Straight Shot';
                if (type === WeaponType.SPREAD) return 'Spread Shot';
                if (type === WeaponType.HOMING) return 'Homing Missiles';
                if (type === WeaponType.HEAVY) return 'Heavy Cannon';
                if (type === WeaponType.LASER) return 'Pulse Laser';
                if (type === WeaponType.ARC) return 'Chain Lightning';
                return weaponSystem.isSecretWeaponUnlocked() ? 'Black Hole Projectile' : 'UNKNOWN';
            };

            const getExpectedEventInfo = (stage: number, missionType: string, combatEvent: StageCombatEvent): { name: string; desc: string } => {
                if (stage === 31) {
                    return { name: 'SERA KANE // PILOT DUEL', desc: 'Experimental rival craft. Win the private flight trial against Sera Kane.' };
                }
                if (stage >= 71 && stage <= 80) {
                    return { name: 'SERA KANE // ALLIED WING', desc: 'Sera joins the flight as a friendly prototype. Protect the alliance while both craft share the front.' };
                }
                if (stage % 3 === 0) {
                    return { name: 'BOUNTY TARGET // FLAGSHIP', desc: 'High-value pirate flagship. Eliminate the wanted target at the end of the hunt.' };
                }
                if (stage >= 70 && missionType === 'singularity') {
                    return { name: 'BLACK HOLE SINGULARITY', desc: 'Gravitational distortion; projectile paths curve near center.' };
                }
                if (combatEvent === 'ambush') {
                    return { name: 'BOUNTY HUNT & AMBUSH', desc: 'Moving target with escort wing; aggressive flankers arrive early.' };
                }
                if (combatEvent === 'swarm') {
                    return { name: 'MASS SWARM WAVE', desc: 'Dense waves of fast identical interceptors sweeping the lane.' };
                }
                if (combatEvent === 'single') {
                    return { name: 'SINGLE-TYPE WING ASSAULT', desc: 'Specialized strike wing of one enemy classification.' };
                }
                return { name: 'STANDARD SECTOR PATROL', desc: 'Balanced squadron patrol with mixed scout formations.' };
            };

            const setWeaponHoverBriefing = (type: WeaponType): void => {
                const locked = type === WeaponType.VOID_LANCE && !weaponSystem.isSecretWeaponUnlocked();
                const currentLevel = weaponSystem.getCurrentLevel(type);
                const levels = weaponSystem.getWeaponLevels(type);
                const nextLevel = locked ? null : currentLevel < 0 ? (levels[0] ?? null) : (levels[currentLevel + 1] ?? null);
                upgradeBriefing = CampaignSystem.getWeaponHoverBriefing('weapon', getWeaponDisplayName(type), currentLevel);
            };

            const selectWeapon = (type: WeaponType): void => {
                if (weaponSystem.setCurrentWeapon(type)) syncPlayerWeapon(type);
                setWeaponHoverBriefing(type);
            };

            const upgradeWeapon = (type: WeaponType): void => {
                const result = weaponSystem.upgradeWeapon(type, gameState.score, shipSystem.getCurrentShipId());
                if (!result) return;
                gameState.score = Math.max(0, gameState.score - result.cost + result.refund);
                weaponSystem.setCurrentWeapon(type);
                syncPlayerWeapon(type);
                setWeaponHoverBriefing(type);
                showNaomiUpgradeTutorial('weapon');
            };

            const upgradeElementalCore = (core: ElementalCoreType): void => {
                const cost = elementalCoreSystem.upgrade(core, gameState.score);
                if (cost === null) return;
                gameState.score -= cost;
                elementalCoreSystem.selectCore(core);
                const profile = elementalCoreSystem.getProfile(core);
                testNoticeText = `ELEMENT CORE // ${profile.name} // RANK ${profile.rank}`;
                testNoticeUntil = performance.now() + 3000;
                SoundSystem.playUpgrade();
                showNaomiUpgradeTutorial('elemental_core');
            };

            const downgradeWeapon = (type: WeaponType): void => {
                const result = weaponSystem.downgradeWeapon(type);
                if (!result) return;
                gameState.score += result.refund;
                if (weaponSystem.getCurrentWeapon() === type) syncPlayerWeapon(type);
                testNoticeText = `${getWeaponDisplayName(type)} DOWNGRADED // +${result.refund} CREDITS REFUNDED`;
                testNoticeUntil = performance.now() + 4500;
                SoundSystem.playUpgrade();
            };

            const upgradeGenerator = (): void => {
                const nextLevel = powerSystem.generatorLevel + 1;
                const nextCost = generatorCosts[nextLevel] ?? 0;
                const shipAllowsLevel = shipSystem.canUpgradeGenerator(nextLevel);
                if (!powerSystem.canUpgradeGenerator() || !shipAllowsLevel || gameState.score < nextCost) return;
                gameState.score -= nextCost;
                powerSystem.upgradeGenerator();
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('generator', 'Generator', powerSystem.generatorLevel + 1);
                showNaomiUpgradeTutorial('generator');
            };

            const upgradeEngine = (): void => {
                const cost = engineUpgradeSystem.upgrade(gameState.score);
                if (cost === null) return;
                gameState.score -= cost;
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('generator', 'Engine Thrusters', engineUpgradeSystem.getRank());
                testNoticeText = `ENGINE THRUSTERS // RANK ${engineUpgradeSystem.getRank()} // +${engineUpgradeSystem.getBonusPercent()}% PROPULSION`;
                testNoticeUntil = performance.now() + 3000;
                SoundSystem.playUpgrade();
                showNaomiUpgradeTutorial('engine');
            };

            const upgradeShield = (): void => {
                const shieldCost = (shieldLevel + 1) * 2500;
                if (shieldLevel >= 10 || gameState.score < shieldCost) return;
                gameState.score -= shieldCost;
                shieldLevel++;
                applyPlayerDefenseProfile(false, true);
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('generator', 'Shield System', shieldLevel);
                SoundSystem.playUpgrade();
                showNaomiUpgradeTutorial('shield');
            };

            const purchaseShip = (shipId: number): void => {
                if (shipId !== shipSystem.getCurrentShipId() + 1) return;
                const ship = shipSystem.getShip(shipId);
                if (!ship || gameState.score < ship.cost) return;
                const result = shipSystem.upgradeShip(gameState.score);
                if (result) {
                    gameState.score -= result.cost;
                    player.shipTier = result.newShip.id;
                    player.width = result.newShip.width;
                    player.height = result.newShip.height;
                    applyPlayerDefenseProfile(true, true);
                    upgradeBriefing = CampaignSystem.getUpgradeBriefing('ship', result.newShip.name, result.newShip.id + 1);
                    showNaomiUpgradeTutorial('ship');
                }
            };

            const selectTacticalAbility = (type: TacticalAbilityType): void => {
                tacticalAbilitySystem.selectAbility(type, shipSystem.getCurrentShipId());
            };

            const upgradeTacticalAbility = (type: TacticalAbilityType): void => {
                const nextLevel = tacticalAbilitySystem.getNextAbilityLevel(type);
                if (!nextLevel || gameState.score < nextLevel.cost) return;
                const result = tacticalAbilitySystem.upgradeAbility(type, gameState.score, shipSystem.getCurrentShipId());
                if (!result) return;
                gameState.score -= result.cost;
                const abilityName = type === TacticalAbilityType.TIME_LOCK
                    ? 'TIME LOCK'
                    : type === TacticalAbilityType.VOID_ARMOR
                        ? 'VOID ARMOR'
                        : type === TacticalAbilityType.OVER_POWER
                            ? 'OVER POWER'
                            : 'PHASE CLOAK';
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('generator', abilityName, result.level);
                SoundSystem.playUpgrade();
                const tutorialTopic: NaomiTutorialTopic = type === TacticalAbilityType.TIME_LOCK
                    ? 'time_lock'
                    : type === TacticalAbilityType.VOID_ARMOR
                        ? 'void_armor'
                        : type === TacticalAbilityType.OVER_POWER
                            ? 'over_power'
                            : 'phase_cloak';
                showNaomiUpgradeTutorial(tutorialTopic);
            };

            const purchaseTacticalMagazine = (): void => {
                const result = tacticalAbilitySystem.purchaseMagazine(gameState.score, shipSystem.getCurrentShipId());
                if (!result) return;
                gameState.score -= result.cost;
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('generator', `TACTICAL MAGAZINE // ${result.capacity} CARTRIDGES`, result.capacity);
                SoundSystem.playUpgrade();
                showNaomiUpgradeTutorial('tactical_magazine');
            };

            const toggleTacticalAbility = (): void => {
                const ability = tacticalAbilitySystem.getCurrentAbility();
                if (gameState.gameOver || gameState.showLevelScreen || showCommsModal || showAfterActionModal || showBranchModal) return;
                if (tacticalAbilitySystem.isActive()) {
                    tacticalAbilitySystem.deactivate();
                    SoundSystem.playAbility(ability, false);
                } else if (tacticalAbilitySystem.activate(shipSystem.getCurrentShipId())) {
                    SoundSystem.playAbility(ability, true);
                }
            };
            touchActionsRef.current.toggleAbility = toggleTacticalAbility;

            // Create player with dimensions matching active ship tier
            const activeShip = shipSystem.getCurrentShip();
            const player = new Player(
                game.getCanvas().width / 2 - activeShip.width / 2,
                GAME_CANVAS_HEIGHT - 110,
                activeShip.width,
                activeShip.height,
                7.5
            );
            player.shipTier = shipSystem.getCurrentShipId();

            /** Rebuild defense from ship class, permanent shield upgrades, skills, and equipped shield hardware. */
            const applyPlayerDefenseProfile = (refillHull = false, refillShield = false): void => {
                const profile = getShipDefenseProfile(shipSystem.getCurrentShipId());
                const previousMaxHull = Math.max(1, player.maxHealth);
                const previousMaxShield = Math.max(1, player.maxShield);
                const hullRatio = Math.max(0, Math.min(1, player.health / previousMaxHull));
                const shieldRatio = Math.max(0, Math.min(1, player.shield / previousMaxShield));
                const hullMultiplier = pilotSkillSystem.getBonusMultiplier('hull_integrity');
                const shieldSkillMultiplier = pilotSkillSystem.getBonusMultiplier('aegis_protocol');
                const shieldRegenMultiplier = pilotSkillSystem.getBonusMultiplier('aegis_protocol');
                const equipmentShieldMultiplier = 1 + (equipmentSystem.getActiveBonuses().shieldCap / 100);
                const permanentShieldCapacity = Math.max(0, shieldLevel - 1) * SHIELD_UPGRADE_CAPACITY;
                const permanentShieldRegen = Math.max(0, shieldLevel - 1) * SHIELD_UPGRADE_REGEN;
                const masteryCapacity = stageMasterySystem.hasAegisMastery() ? AEGIS_MASTERY_CAPACITY : 0;
                const masteryRegen = stageMasterySystem.hasAegisMastery() ? AEGIS_MASTERY_REGEN : 0;

                player.maxHealth = Math.round(profile.hullHealth * hullMultiplier);
                player.maxShield = Math.round((profile.shieldCapacity + permanentShieldCapacity + masteryCapacity) * shieldSkillMultiplier * equipmentShieldMultiplier);
                player.baseShieldRegenRate = (profile.shieldRegenRate + permanentShieldRegen + masteryRegen) * shieldRegenMultiplier;
                player.shieldRegenRate = player.baseShieldRegenRate;
                player.health = refillHull ? player.maxHealth : Math.min(player.maxHealth, Math.round(player.maxHealth * hullRatio));
                player.shield = refillShield ? player.maxShield : Math.min(player.maxShield, Math.round(player.maxShield * shieldRatio));
            };
            applyPlayerDefenseProfile(true, true);

            player.weaponMasteryUnlocked = stageMasterySystem.hasWeaponMastery();
            player.setWeapon('straight', 0, 6, 10);
            game.addEntity(player);
            syncPlayerWeapon(weaponSystem.getCurrentWeapon());

            const getSeraMirrorLoadout = (): SeraMirrorLoadout => {
                const selectedWeapon = weaponSystem.getCurrentWeapon();
                const weaponStats = weaponSystem.getCurrentWeaponStats();
                // Sera's duel craft is aggressive rather than controlling: it uses the
                // current OVER POWER module, never TIME LOCK, when the pilot has unlocked it.
                const selectedAbility = TacticalAbilityType.OVER_POWER;
                const abilityLevel = tacticalAbilitySystem.getCurrentLevel(selectedAbility);
                const abilityData = tacticalAbilitySystem.getAbilityLevel(selectedAbility);
                return {
                    shipTier: shipSystem.getCurrentShipId(),
                    weaponType: selectedWeapon,
                    weaponLevel: Math.max(0, weaponSystem.getCurrentLevel(selectedWeapon)),
                    // Sera mirrors the pilot's arsenal pattern, but not its full endgame
                    // damage-per-second. She must survive a high-rank duel without deleting
                    // the player in one short salvo.
                    weaponFireRate: Math.max(2.8, (weaponStats?.fireRate ?? 6) * 0.52),
                    weaponDamage: Math.max(6, Math.round((weaponStats?.damage ?? 10) * 0.42)),
                    weaponCost: powerSystem.getWeaponCost(selectedWeapon, Math.max(0, weaponSystem.getCurrentLevel(selectedWeapon))),
                    maxShield: player.maxShield,
                    shieldRegenRate: player.baseShieldRegenRate,
                    generatorLevel: powerSystem.generatorLevel,
                    generatorOutput: powerSystem.getGeneratorOutput(pilotSkillSystem.getBonusMultiplier('generator_output')),
                    maxPower: powerSystem.getMaxPower(),
                    ability: abilityLevel > 0 ? selectedAbility : null,
                    abilityLevel,
                    abilityDuration: abilityData?.duration ?? 0,
                    abilityFireMultiplier: Math.min(1.22, abilityData?.fireMultiplier ?? 1),
                    abilityShieldRegenMultiplier: abilityData?.shieldRegenMultiplier ?? 1
                };
            };

            const getSeraAllyLoadout = (): SeraAllyLoadout => {
                const shipInvestment = shipSystem.getAllShips()
                    .slice(0, shipSystem.getCurrentShipId() + 1)
                    .reduce<number>((total, ship) => total + ship.cost, 0);
                const shieldInvestment = Array.from({ length: Math.max(0, shieldLevel - 1) })
                    .reduce<number>((total, _, index) => total + (index + 2) * 2500, 0);
                const pilotInvestmentBudget = Math.max(0, Math.floor(gameState.score))
                    + shipInvestment
                    + powerSystem.getGeneratorInvestment()
                    + weaponSystem.getTotalInvestment()
                    + tacticalAbilitySystem.getTotalInvestment()
                    + shieldInvestment
                    + engineUpgradeSystem.getTotalInvestment();
                // Sera enters only in stages 81–90. Her assault laser advances through
                // the late-game ranks with the chapter instead of using the old rank-12–14 escort loadout.
                const laserLevel = Math.min(22, 18 + Math.floor(Math.max(0, gameState.level - 81) / 2));
                const laserStats = weaponSystem.getWeaponLevels(WeaponType.LASER)[laserLevel];
                return {
                    shipTier: 3,
                    shipName: shipSystem.getShip(3)?.name ?? 'Battleship',
                    weaponType: 'laser',
                    weaponLevel: laserLevel,
                    weaponDamage: laserStats?.damage ?? 44,
                    weaponFireRate: laserStats?.fireRate ?? 10,
                    // Her reactor is tuned for an aggressive support beam, but not unlimited fire.
                    // OVER POWER creates the short sustained spike; normal fire still consumes power.
                    weaponCost: Math.max(7, Math.round(powerSystem.getWeaponCost(WeaponType.LASER, laserLevel) * 0.4 * 10) / 10),
                    maxShield: 50 + (10 - 1) * 30,
                    shieldRegenRate: 5 + (10 - 1) * 2,
                    generatorLevel: 36,
                    generatorOutput: 15 + 36 * 8.5,
                    maxPower: Math.round(200 + 36 * 13.25),
                    ability: 'over_power',
                    abilityLevel: 5,
                    abilityDuration: 3.0,
                    pilotInvestmentBudget
                };
            };

            const deploySeraAlly = (): void => {
                if (gameState.level < 81 || gameState.level > 90 || seraAlly) return;
                const canvasWidth = game.getCanvas().width;
                seraAlly = new SeraAllyShipEntity(
                    canvasWidth * 0.72,
                    GAME_CANVAS_HEIGHT - 260,
                    getSeraAllyLoadout()
                );
                seraAlly.setEscortAnchor(player.x + player.width / 2, player.y + player.height / 2);
                game.addEntity(seraAlly);
                testNoticeText = 'ALLIANCE LINK // SERA ASSAULT WING ONLINE';
                testNoticeUntil = performance.now() + 4200;
                SoundSystem.playCriticalComms('sera', 'warning');
            };

            const spawnSeraMirrorShots = (entity: SeraDuelEntity, friendly: boolean): void => {
                const mirrorShots = entity.shootMirror() as SeraShot[];
                mirrorShots.forEach((shot) => {
                    const damage = entity.getMirrorShotDamage(shot.type, Boolean(shot.isSecondary));
                    const dirX = Math.sin(shot.angle);
                    const dirY = Math.cos(shot.angle);
                    if (shot.type === 'laser') {
                        game.addEntity(new LaserBullet(
                            shot.x,
                            shot.y,
                            damage,
                            entity.getMirrorLoadout()?.weaponLevel ?? 0,
                            friendly,
                            shot.angle,
                            Boolean(shot.isSecondary)
                        ));
                    } else if (shot.type === 'void_lance') {
                        const singularity = new BlackHoleBullet(
                            shot.x - 7,
                            shot.y,
                            damage,
                            entity.getMirrorLoadout()?.weaponLevel ?? 0,
                            Math.PI - shot.angle
                        );
                        singularity.isFriendly = friendly;
                        game.addEntity(singularity);
                    } else {
                        const speed = shot.type === 'heavy' ? 2.6 : shot.type === 'homing' ? 2.35 : shot.type === 'arc' ? 4.2 : 3.05;
                        const style = shot.type === 'heavy' ? 'heavy' : shot.type === 'homing' ? 'plasma' : shot.type === 'arc' ? 'needle' : 'orb';
                        const color = shot.type === 'arc' ? '#f8ff79' : friendly ? '#63f5ff' : '#ff668f';
                        const mirrorBullet = new EnemyBullet(
                            shot.x,
                            shot.y,
                            shot.type === 'heavy' ? 12 : shot.type === 'arc' ? 5 : 7,
                            shot.type === 'heavy' ? 12 : shot.type === 'arc' ? 16 : 7,
                            speed,
                            damage,
                            dirX,
                            dirY,
                            color,
                            style
                        );
                        mirrorBullet.isFriendly = friendly;
                        game.addEntity(mirrorBullet);
                    }
                });
            };

            const spawnSeraAllyShots = (entity: SeraAllyShipEntity): void => {
                const shots = entity.shoot();
                const loadout = entity.getLoadout();
                shots.forEach((shot) => {
                    if (shot.type !== 'laser') return;
                    game.addEntity(new LaserBullet(
                        shot.x,
                        shot.y,
                        entity.getShotDamage(Boolean(shot.isSecondary)),
                        loadout.weaponLevel,
                        true,
                        shot.angle,
                        Boolean(shot.isSecondary)
                    ));
                });
            };

            const applyPlayerDamage = (damage: number, isCollision = false): boolean => {
                const collisionMultiplier = isCollision
                    ? Math.max(0.5, 1 - pilotSkillSystem.getDamageReduction('collision_resist'))
                    : 1;
                const adjustedDamage = Math.max(0, damage * collisionMultiplier);
                const shieldBefore = player.shield;
                const isDead = player.takeDamage(adjustedDamage);
                const absorbed = Math.min(shieldBefore, adjustedDamage);
                stageMasterySystem.recordPlayerDamage(adjustedDamage, absorbed);
                return isDead;
            };

            const buildResumeCheckpoint = (reason: string): ResumeCheckpoint => ({
                level: gameState.level,
                score: Math.max(0, Math.floor(gameState.score)),
                reason,
                savedAt: Date.now(),
                shipId: shipSystem.getCurrentShipId(),
                generatorLevel: powerSystem.generatorLevel,
                shieldLevel,
                engineUpgradeLevel: engineUpgradeSystem.getRank(),
                weaponState: weaponSystem.getSaveState(),
                elementalCoreState: elementalCoreSystem.getSaveState(),
                tacticalAbilityState: tacticalAbilitySystem.getSaveState(),
                pilotSkillsState: pilotSkillSystem.getSaveState(),
                equipmentState: equipmentSystem.getState()
            });

            const persistAutosave = (reason: string): ResumeCheckpoint => {
                const checkpoint = buildResumeCheckpoint(reason);
                if (isTestSession) return checkpoint;
                localStorage.setItem(RESUME_CHECKPOINT_KEY, JSON.stringify(checkpoint));
                setResumeCheckpoint(checkpoint);

                const weaponState = checkpoint.weaponState ?? {};
                SaveSystem.autoSave({
                    score: checkpoint.score,
                    level: checkpoint.level,
                    shipId: checkpoint.shipId ?? 0,
                    generatorLevel: checkpoint.generatorLevel ?? 1,
                    shieldLevel: checkpoint.shieldLevel ?? 1,
                    engineUpgradeLevel: checkpoint.engineUpgradeLevel ?? 0,
                    weaponLevels: weaponState.weaponLevels ?? {},
                    currentWeapon: weaponState.currentWeapon ?? 'straight',
                    secretWeaponUnlocked: weaponState.secretWeaponUnlocked ?? false,
                    secretWeaponFragments: weaponState.secretWeaponFragments ?? 0,
                    elementalCoreState: checkpoint.elementalCoreState,
                    pilotSkillsState: checkpoint.pilotSkillsState,
                    equipmentState: checkpoint.equipmentState,
                    tacticalAbilityState: checkpoint.tacticalAbilityState,
                    maxUnlockedLevel: Math.max(maxUnlockedLevel, checkpoint.level)
                });

                return checkpoint;
            };

            const openBetweenStageSave = (): void => {
                // Manual save is intentionally available only in the Ready Room. Combat always
                // resumes from the last safe checkpoint, so a failed dodge cannot be retried.
                if (!gameState.showLevelScreen || showAfterActionModal || showBranchModal) return;
                const checkpoint = buildResumeCheckpoint('MANUAL SAVE // READY ROOM');
                const weaponState = checkpoint.weaponState ?? {};
                setManualSaveState({
                    score: checkpoint.score,
                    level: checkpoint.level,
                    shipId: checkpoint.shipId ?? 0,
                    generatorLevel: checkpoint.generatorLevel ?? 1,
                    shieldLevel: checkpoint.shieldLevel ?? 1,
                    engineUpgradeLevel: checkpoint.engineUpgradeLevel ?? 0,
                    weaponLevels: weaponState.weaponLevels ?? {},
                    currentWeapon: weaponState.currentWeapon ?? 'straight',
                    secretWeaponUnlocked: weaponState.secretWeaponUnlocked ?? false,
                    secretWeaponFragments: weaponState.secretWeaponFragments ?? 0,
                    elementalCoreState: checkpoint.elementalCoreState,
                    pilotSkillsState: checkpoint.pilotSkillsState,
                    equipmentState: checkpoint.equipmentState,
                    tacticalAbilityState: checkpoint.tacticalAbilityState,
                    maxUnlockedLevel: Math.max(maxUnlockedLevel, checkpoint.level),
                });
                setShowManualSaveModal(true);
            };

            const showNaomiUpgradeTutorial = (topic: NaomiTutorialTopic): void => {
                const storageKey = getNaomiTutorialStorageKey(topic);
                if (localStorage.getItem(storageKey)) return;
                localStorage.setItem(storageKey, 'seen');
                const abilityKey = formatControlCode(loadControlBindings().tacticalAbility);
                setNaomiTutorial(getNaomiUpgradeTutorial(topic, gameplayLangRef.current, abilityKey));
            };

            const saveResumeCheckpoint = (reason: string): void => {
                stageFailureReason = reason;
                shopScreen = 'hub';
                gameState.gameOver = false;
                gameState.levelComplete = true;
                gameState.showLevelScreen = true;
                currentMissionTarget = null;
                finalizeStageTelemetry();
                testNoticeText = reason;
                testNoticeUntil = performance.now() + 5000;
                SoundSystem.playCriticalComms('elena', 'warning');
                SoundSystem.stopMusic();
            };

            const resolveSeraDuelOutcome = (outcome: 'win' | 'loss'): void => {
                if (gameState.level !== 31 || seraDuelOutcome) return;
                seraDuelOutcome = outcome;
                const sera = game['entities'].find((entity: any) => entity instanceof SeraDuelEntity) as SeraDuelEntity | undefined;
                if (sera) sera.isActive = false;
                bossDefeatedAt = performance.now() / 1000;
                gameState.gameOver = false;
                if (outcome === 'loss') {
                    player.isActive = true;
                    player.health = Math.max(1, player.health);
                    player.shield = 0;
                } else {
                    stageMasterySystem.recordEnemyDefeat();
                }
                const duelReward = Math.floor(stageBriefing.bountyReward * COMBAT_REWARD_MULTIPLIER);
                gameState.addScore(duelReward);
                stageBriefing.afterAction = outcome === 'win'
                    ? { speaker: 'sera', name: 'Sera Kane', message: 'You won the trial. I was ordered to stop you, but the flight data says something else: the two prototypes are being tested against a threat neither of us was briefed on.', reward: duelReward }
                    : { speaker: 'naomi', name: 'Dr. Naomi Ren', message: 'Sera won the trial, but the result is not a failure. Your systems survived the full mirror test, and now we know exactly how her prototype moves. We continue to the next stage.', reward: duelReward };
                testNoticeText = outcome === 'win' ? 'SERA DUEL // PILOT SUPERIORITY CONFIRMED' : 'SERA DUEL // TRIAL COMPLETE // NO PENALTY';
                testNoticeUntil = performance.now() + 5500;
                SoundSystem.playCriticalComms(stageBriefing.afterAction.speaker, 'briefing');
            };

            const handlePlayerDefeat = (): void => {
                if (gameState.level === 31) resolveSeraDuelOutcome('loss');
                else saveResumeCheckpoint('HULL LOST // RETURN TO COMMAND');
            };

            const failMission = (reason: string): void => {
                if (!currentMissionTarget) return;
                currentMissionTarget.isActive = false;
                saveResumeCheckpoint(`MISSION FAILED // ${reason}`);
            };

            const finalizeStageTelemetry = (awardPerformanceXp = false): void => {
                if (stageTelemetryFinalized) return;
                lastStageMasteryResult = stageMasterySystem.finalizeStage();
                stageTelemetryFinalized = true;
                localStorage.setItem('tyrian_stage_mastery', JSON.stringify(stageMasterySystem.getSaveState()));
                if (!lastStageMasteryResult) return;
                if (awardPerformanceXp) {
                    lastStagePerformanceXp = calculateStagePerformanceXP(lastStageMasteryResult.telemetry, player.maxHealth, player.maxShield);
                    awardPilotXp(lastStagePerformanceXp.totalXp, `STAGE XP +${lastStagePerformanceXp.totalBonusPercent}%`);
                }
                if (lastStageMasteryResult.rewards.aegisMasteryUnlocked) {
                    applyPlayerDefenseProfile(false, true);
                    testNoticeText = 'MASTERY UNLOCKED // AEGIS MATRIX';
                    testNoticeUntil = performance.now() + 5500;
                    SoundSystem.playUpgrade();
                }
                if (lastStageMasteryResult.rewards.weaponMasteryUnlocked) {
                    player.weaponMasteryUnlocked = true;
                    syncPlayerWeapon(weaponSystem.getCurrentWeapon());
                    testNoticeText = 'MASTERY UNLOCKED // WEAPON OVERKILL MATRIX';
                    testNoticeUntil = performance.now() + 5500;
                    SoundSystem.playUpgrade();
                }
            };

            // Stage resources are runtime state; upgrades remain on their dedicated systems.
            let lastAsteroidSpawnTime = 0;

            const deployStageHazards = (): void => {
                stageHazards = [];
                stageHazardKind = null;
                lastAsteroidSpawnTime = 0;
                const cWidth = game.getCanvas().width;
                const b = stageBriefing;

                // Stages 41-50: Escape chapter asteroid belt hazards
                if (gameState.level >= 41 && gameState.level <= 50) {
                    stageHazardKind = 'asteroid';
                    return;
                }

                if (gameState.level < 70) return;
                if (gameState.level % 5 === 0 || b.missionType === 'singularity') {
                    stageHazardKind = 'singularity';
                    // A compact singularity with a serious pull: it creates an escape
                    // challenge without dominating the visual playfield.
                    gravityWell = new GravityWell(cWidth / 2, 390, 32, 3.8);
                    missionEventSpawned = true;
                    game.addEntity(gravityWell);
                    return;
                }
                stageHazardKind = gameState.level % 2 === 0 ? 'asteroid' : 'wreck';
                const positions = stageHazardKind === 'asteroid'
                    ? [[112, 278, 88, 74], [520, 430, 106, 82], [285, 620, 76, 64]]
                    : [[80, 330, 190, 86], [520, 560, 220, 96]];
                stageHazards = positions.map(([x, y, width, height], index) => new StageHazard(x, y, width, height, stageHazardKind as StageHazardKind, gameState.level + index * 1.7));
                stageHazards.forEach((hazard) => game.addEntity(hazard));
            };

            const spawnAsteroidBeltHazardIfNeeded = (currentTime: number, deltaTime: number): void => {
                if (gameState.level < 41 || gameState.level > 50) return;
                if (currentTime - lastAsteroidSpawnTime < 1.75) return;
                lastAsteroidSpawnTime = currentTime;

                const canvasWidth = game.getCanvas().width;
                const roll = Math.random();
                let kind: 'massive' | 'fragile' | 'debris' = 'debris';
                let size = 48;
                if (roll < 0.28) {
                    kind = 'massive';
                    size = 128 + Math.round(Math.random() * 24);
                } else if (roll < 0.68) {
                    kind = 'fragile';
                    size = 82 + Math.round(Math.random() * 18);
                } else {
                    kind = 'debris';
                    size = 42 + Math.round(Math.random() * 14);
                }

                // Asteroids enter from the top, left or right and cross the arena on a
                // genuine vector. Their apparent speed falls as their size rises.
                const entryEdge = Math.floor(Math.random() * 3);
                let startX: number;
                let startY: number;
                let destinationX: number;
                let destinationY: number;
                if (entryEdge === 0) {
                    startX = Math.random() * canvasWidth;
                    startY = -size - 42;
                    destinationX = 90 + Math.random() * (canvasWidth - 180);
                    destinationY = GAME_CANVAS_HEIGHT + size + 90;
                } else if (entryEdge === 1) {
                    startX = -size - 42;
                    startY = 90 + Math.random() * (GAME_CANVAS_HEIGHT - 270);
                    destinationX = canvasWidth + size + 90;
                    destinationY = 80 + Math.random() * (GAME_CANVAS_HEIGHT - 180);
                } else {
                    startX = canvasWidth + size + 42;
                    startY = 90 + Math.random() * (GAME_CANVAS_HEIGHT - 270);
                    destinationX = -size - 90;
                    destinationY = 80 + Math.random() * (GAME_CANVAS_HEIGHT - 180);
                }
                const directionX = destinationX - startX;
                const directionY = destinationY - startY;
                const directionMagnitude = Math.max(1, Math.hypot(directionX, directionY));
                const speed = Math.max(1.8, 6.3 - size * 0.028) + Math.random() * 0.45;
                const vx = directionX / directionMagnitude * speed;
                const vy = directionY / directionMagnitude * speed;

                const asteroid = new AsteroidBeltEntity(
                    startX,
                    startY,
                    size,
                    vx,
                    vy,
                    kind,
                    (splitX: number, splitY: number) => {
                        // Fragile split into 2 smaller debris pieces
                        for (let i = 0; i < 2; i++) {
                            const subVx = (Math.random() - 0.5) * 4;
                            const subVy = (Math.random() - 0.5) * 4;
                            const subAsteroid = new AsteroidBeltEntity(splitX, splitY, 26, subVx, subVy, 'debris');
                            game.addEntity(subAsteroid);
                        }
                    }
                );
                game.addEntity(asteroid);
            };

            const resolveStageHazardCollisions = (): void => {
                if (!stageHazards.length) return;
                const projectiles = (entity: any): boolean => entity instanceof Bullet || entity instanceof HomingBullet || entity instanceof HeavyBullet || entity instanceof EnemyBullet || entity instanceof LaserBullet || entity instanceof BlackHoleBullet;
                    const movers = (entity: any): boolean => entity instanceof Player || entity instanceof Enemy || entity instanceof EnemyAdvanced || entity instanceof Boss || entity instanceof SeraAllyShipEntity || entity instanceof MissionTargetEntity;
                stageHazards.forEach((hazard) => {
                    if (!hazard.isActive) return;
                    game['entities'].forEach((entity: any) => {
                        if (entity === hazard || !entity.isActive) return;
                        if (!hazard.collidesWith(entity)) return;
                        if (projectiles(entity)) {
                            if (entity instanceof HeavyBullet) {
                                const hBullet = entity as any;
                                if (hBullet.onSplit && !hBullet.hasSplit) {
                                    hBullet.hasSplit = true;
                                    hBullet.onSplit(hBullet.x, hBullet.y, hBullet.level, hBullet.damage);
                                }
                            }
                            entity.isActive = false;
                            return;
                        }
                        if (!movers(entity)) return;
                        const overlapX = Math.min(hazard.x + hazard.width - entity.x, entity.x + entity.width - hazard.x);
                        const overlapY = Math.min(hazard.y + hazard.height - entity.y, entity.y + entity.height - hazard.y);
                        if (overlapX <= 0 || overlapY <= 0) return;
                        if (overlapX < overlapY) {
                            const entityCenter = entity.x + entity.width / 2;
                            const hazardCenter = hazard.x + hazard.width / 2;
                            entity.x += entityCenter < hazardCenter ? -overlapX : overlapX;
                        } else {
                            const entityCenter = entity.y + entity.height / 2;
                            const hazardCenter = hazard.y + hazard.height / 2;
                            entity.y += entityCenter < hazardCenter ? -overlapY : overlapY;
                        }
                        entity.x = Math.max(0, Math.min(game.getCanvas().width - entity.width, entity.x));
                        entity.y = Math.max(0, Math.min(GAME_CANVAS_HEIGHT - entity.height, entity.y));
                    });
                });
            };

            const spawnMissionTarget = (): void => {
                if (missionEventSpawned || gameState.level === 31 || gameState.level === 101 || gameState.levelTimeElapsed < 45) return;
                currentMissionTarget = null;
                gravityWell = null;
                missionEventSpawned = true;
                const briefing = stageBriefing;
                if (!briefing || gameState.level % 3 === 0) return;
                const canvasWidth = game.getCanvas().width;
                if (briefing.missionType === 'bounty' && gameState.level % 9 !== 0) {
                    currentMissionTarget = new MissionTargetEntity(
                        canvasWidth / 2 - 28,
                        148,
                        56,
                        44,
                        briefing.missionTargetName,
                        'bounty',
                        Math.floor(briefing.bountyReward * COMBAT_REWARD_MULTIPLIER)
                    );
                    currentMissionTarget.applyDifficulty(difficultyProfile);
                    game.addEntity(currentMissionTarget);
                } else if (briefing.missionType === 'escort') {
                    const convoyCount = 3;
                    for (let convoyIndex = 0; convoyIndex < convoyCount; convoyIndex++) {
                        const convoyUnit = new MissionTargetEntity(
                            -84 - convoyIndex * 74,
                            154 + convoyIndex * 56,
                            62,
                            36,
                            `${briefing.missionTargetName} // UNIT ${convoyIndex + 1}`,
                            'escort',
                            Math.floor((briefing.bountyReward * COMBAT_REWARD_MULTIPLIER) / convoyCount),
                            convoyIndex
                        );
                        convoyUnit.applyDifficulty(difficultyProfile);
                        if (convoyIndex === 0) currentMissionTarget = convoyUnit;
                        game.addEntity(convoyUnit);
                    }
                } else if (briefing.missionType === 'singularity' && gameState.level >= 70) {
                    gravityWell = new GravityWell(canvasWidth / 2, 360, 48, 2.8);
                    game.addEntity(gravityWell);
                }
            };

            const resetStageRuntime = (): void => {
                currentMissionTarget = null;
                gravityWell = null;
                stageHazards = [];
                stageHazardKind = null;
                missionEventSpawned = false;
                sectorSealed = false;
                lastStagePerformanceXp = null;
                powerSystem.refillForStage();
                tacticalAbilitySystem.resetStage();
                player.resetForStage(
                    game.getCanvas().width / 2 - player.width / 2,
                    GAME_CANVAS_HEIGHT - 100
                );
            };

            const getBriefingLines = () => stageBriefing.dialogueSequence ?? [stageBriefing.contact];

            const getBriefingVoiceLineId = (index: number): string => {
                const lines = getBriefingLines();
                const line = lines[Math.min(index, lines.length - 1)];
                // Authored sequences carry an exact manifest key. The legacy fallback
                // keeps older bespoke briefings operational while they are migrated.
                if (line.voiceLineId) return line.voiceLineId;
                const segment = index === 0 ? 'contact-0' : `after-${index}`;
                return `stage-${gameState.level}-${segment}`;
            };

            const playBriefingLine = (index: number): void => {
                const lines = getBriefingLines();
                const line = lines[Math.min(index, lines.length - 1)];
                activeContactLine = line;
                SoundSystem.playCriticalComms(line.speaker, 'briefing');
                VoicePlaybackManager.playVoiceLine(getBriefingVoiceLineId(index), gameplayLangRef.current);
            };

            const openStageBriefing = (): void => {
                // Campaign dialogue and voice-over are an authored part of every stage. They
                // appear only before launch, where the player can advance or skip them; no
                // separate transmission interrupts the actual fight.
                commsParagraphIndex = 0;
                showCommsModal = true;
                commVisibleUntil = 0;
                VoicePlaybackManager.stop();
                playBriefingLine(commsParagraphIndex);
            };

            const advanceBriefing = (): void => {
                const lines = getBriefingLines();
                if (commsParagraphIndex < lines.length - 1) {
                    commsParagraphIndex++;
                    playBriefingLine(commsParagraphIndex);
                    return;
                }
                startStagePlay();
            };

            const startStagePlay = (): void => {
                VoicePlaybackManager.stop();
                MissionArchiveSystem.recordBriefing(stageBriefing, true);
                initialLaunchPending = false;
                showCommsModal = false;
                stageFailureReason = null;
                touchInputRef.current.moveX = 0;
                touchInputRef.current.moveY = 0;
                touchInputRef.current.fire = false;
                gameState.gameOver = false;
                gameState.levelComplete = false;
                gameState.showLevelScreen = false;
                gameState.levelStartTime = 0;
                gameState.levelTimeElapsed = 0;
                gameState.enemiesDefeated = 0;
                stageMasterySystem.beginStage(gameState.level);
                lastStageMasteryResult = null;
                stageTelemetryFinalized = false;
                bossSpawnedForLevel = false;
                bossDefeatedAt = null;
                defeatedBosses.clear();
                finalBossAssembly = null;
                seraDuelOutcome = null;
                seraAlly = null;
                enemySpawner.reset();
                enemySpawner.setDifficultyProfile(difficultyProfile);
                configureStageCombat(gameState.level);
                for (let difficultyStep = 1; difficultyStep < gameState.level; difficultyStep++) enemySpawner.increaseDifficulty();
                resetStageRuntime();
                game['entities'] = [player];
                deploySeraAlly();
                deployStageHazards();
                // No automatic opening transmission: missions now begin directly from the Ready Room.
                commVisibleUntil = 0;
                SoundSystem.toggleSound(true);
                SoundSystem.toggleMusic(true);
                SoundSystem.startMusic();
                persistAutosave('AUTOSAVE // MISSION ENGAGED');
                setTimeout(() => {
                    SoundSystem.startMusic();
                }, 100);
            };

            const advanceFromShop = (): void => {
                if (gameState.level >= CampaignSystem.TOTAL_STAGES) {
                    finaleSceneIndex = 0;
                    shopScreen = 'finale_victory';
                    gameState.levelComplete = true;
                    gameState.showLevelScreen = true;
                    return;
                }
                if (initialLaunchPending || stageFailureReason) {
                    MissionArchiveSystem.recordBriefing(stageBriefing, false);
                    openStageBriefing();
                    return;
                }
                if (gameState.level % 10 === 0 && !showBranchModal) {
                    showBranchModal = true;
                    return;
                }
                gameState.nextLevel();
                persistAutosave('AUTOSAVE // NEXT STAGE READY');
                shopScreen = 'hub';
                stageFailureReason = null;
                stageBriefing = CampaignSystem.getStageBriefing(gameState.level, gameplayLangRef.current);
                inMissionCommsTriggered = false;
                activeContactLine = stageBriefing.contact;
                MissionArchiveSystem.recordBriefing(stageBriefing, false);
                openStageBriefing();
                stageMasterySystem.beginStage(gameState.level);
                lastStageMasteryResult = null;
                stageTelemetryFinalized = false;
                bossSpawnedForLevel = false;
                bossDefeatedAt = null;
                defeatedBosses.clear();
                finalBossAssembly = null;
                seraDuelOutcome = null;
                seraAlly = null;
            };



            touchActionsRef.current.advanceMission = () => {
                if (showCommsModal) {
                    advanceBriefing();
                    return;
                }
                if (gameState.showLevelScreen || showBranchModal) advanceFromShop();
            };

            const jumpToStage = (requestedStage: number): void => {
                const targetStage = Math.max(1, Math.min(CampaignSystem.TOTAL_STAGES, Math.floor(requestedStage)));
                isTestSession = true;
                gameState.level = targetStage;
                initialLaunchPending = false;
                shopScreen = 'hub';
                gameState.levelComplete = false;
                gameState.showLevelScreen = false;
                gameState.gameOver = false;
                gameState.isPaused = false;
                gameState.enemiesDefeated = 0;
                gameState.levelStartTime = 0;
                gameState.levelTimeElapsed = 0;
                gameState.levelDuration = 60;
                stageBriefing = CampaignSystem.getStageBriefing(targetStage, gameplayLangRef.current);
                inMissionCommsTriggered = false;
                activeContactLine = stageBriefing.contact;
                commVisibleUntil = performance.now() + 9000;
                SoundSystem.playCriticalComms(stageBriefing.contact.speaker, 'briefing');
                VoicePlaybackManager.playVoiceLine(`stage-${gameState.level}-contact-0`, gameplayLangRef.current);
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('weapon', 'Straight Shot', 1);
                bossSpawnedForLevel = false;
                bossDefeatedAt = null;
                defeatedBosses.clear();
                finalBossAssembly = null;
                seraDuelOutcome = null;
                stageBriefing = CampaignSystem.getStageBriefing(targetStage, gameplayLangRef.current);
                stageMasterySystem.beginStage(targetStage);
                lastStageMasteryResult = null;
                stageTelemetryFinalized = false;
                enemySpawner.reset();
                enemySpawner.setDifficultyProfile(difficultyProfile);
                configureStageCombat(targetStage);
                for (let difficultyStep = 1; difficultyStep < targetStage; difficultyStep++) {
                    enemySpawner.increaseDifficulty();
                }
                resetStageRuntime();
                game['entities'] = [player];
                deploySeraAlly();
                testNoticeText = `TEST MODE // STAGE ${targetStage} LOADED`;
                testNoticeUntil = performance.now() + 5000;
            };

            const handleStageJumpEvent = (event: Event) => {
                const customEvent = event as CustomEvent<number>;
                if (customEvent.detail) {
                    jumpToStage(customEvent.detail);
                }
            };
            window.addEventListener('tyrian:jump-to-stage', handleStageJumpEvent as EventListener);
            const initialStageTimer = initialStage
                ? window.setTimeout(() => jumpToStage(initialStage), 0)
                : null;

            const awardPilotXp = (amount: number, source: string): void => {
                const result = pilotSkillSystem.addXP(amount);
                if (!result.rankedUp) return;
                testNoticeText = `PILOT RANK UP // ${source} // RANK ${pilotSkillSystem.getRank()} // +${result.ranksGained} SKILL POINT${result.ranksGained === 1 ? '' : 'S'}`;
                testNoticeUntil = performance.now() + 4500;
                SoundSystem.playUpgrade();
            };

            const registerEnemyDefeat = (enemy: Enemy | EnemyAdvanced): void => {
                if (!enemy.isActive && !enemy.rewardGranted) {
                    enemy.rewardGranted = true;
                    gameState.enemyDefeated(enemy.points ?? 100);
                    stageMasterySystem.recordEnemyDefeat();
                    tacticalAbilitySystem.addKillCharge(enemy.points ?? 100, shipSystem.getCurrentShipId());
                    // Kills give only a small XP contribution; the main reward is stage performance.
                    const enemyXp = Math.max(1, Math.floor((enemy.points ?? 100) * 0.03));
                    awardPilotXp(enemyXp, 'COMBAT XP');
                    const isSpecialEnemy = enemy instanceof EnemyAdvanced && enemy.isSpecial;
                    if (isSpecialEnemy) {
                        const recovery = weaponSystem.collectSecretWeaponFragment();
                        if (recovery.unlocked) {
                            upgradeBriefing = CampaignSystem.getUpgradeBriefing('weapon', 'Black Hole Projectile', 1);
                            localStorage.setItem('tyrian_secret_weapon_unlocked', 'true');
                            window.dispatchEvent(new CustomEvent('tyrian:secret-weapon-unlocked'));
                            testNoticeText = 'SINGULARITY CORE ASSEMBLED // BLACK HOLE PROJECTILE UNLOCKED';
                            testNoticeUntil = performance.now() + 6000;
                            SoundSystem.playUpgrade();
                        } else {
                            testNoticeText = `RESEARCH FRAGMENT RECOVERED // ${recovery.fragments}/${WeaponUpgradeSystem.SECRET_WEAPON_FRAGMENT_REQUIREMENT}`;
                            testNoticeUntil = performance.now() + 5200;
                            SoundSystem.playUpgrade();
                        }
                    }

                    // Equipment Drop System: Spawn physical EquipmentDropEntity in the battlefield (Always Tier 1)
                    const dropRoll = Math.random();
                    const dropChance = isSpecialEnemy ? 0.08 : 0.0075;
                    if (dropRoll < dropChance) {
                        const types: EquipmentPartType[] = ['engine', 'shield', 'generator', 'weapon', 'computer'];
                        const chosenType = types[Math.floor(Math.random() * types.length)];
                        const dropTier = 1; // All discovered drops are Tier 1; upgrading is done via fusion and calibration in the Bay
                        const dropEntity = new EquipmentDropEntity(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, chosenType, dropTier);
                        game.addEntity(dropEntity);
                        testNoticeText = `COMPONENT COMPASS // SALVAGE DROP DETECTED`;
                        testNoticeUntil = performance.now() + 3000;
                    }
                    const explosionX = enemy.x + enemy.width / 2;
                    const explosionY = enemy.y + enemy.height / 2;
                    const faction: VisualFaction = enemy instanceof EnemyAdvanced ? enemy.faction : 'raiders';
                    combatVisualEffects.spawnFactionExplosion(explosionX, explosionY, faction, isSpecialEnemy ? 32 : 20);
                    game.addEntity(new Explosion(explosionX, explosionY, isSpecialEnemy ? 32 : 20));
                }
            };

            const elementalBurns = new Map<Enemy | EnemyAdvanced | Boss, { remaining: number; tick: number; damage: number }>();

            const applyElementalCore = (target: Enemy | EnemyAdvanced | Boss, baseDamage: number, sourceX: number, sourceY: number): void => {
                // The two fixed-identity weapons deliberately ignore switchable cores.
                if (player.weaponType === 'arc' || player.weaponType === 'void_lance') return;
                const core = elementalCoreSystem.getActiveCore();
                const rank = elementalCoreSystem.getRank(core);
                const targetX = target.x + target.width / 2;
                const targetY = target.y + target.height / 2;
                const deltaX = targetX - sourceX;
                const deltaY = targetY - sourceY;
                const distance = Math.max(1, Math.hypot(deltaX, deltaY));
                combatVisualEffects.spawnElementImpact(targetX, targetY, core, rank);

                if (core === 'cryo') {
                    const multiplier = Math.max(0.5, 0.82 - rank * 0.055);
                    const duration = 1.2 + rank * 0.45;
                    if (target instanceof EnemyAdvanced) target.slowDown(multiplier, duration);
                    else target.applySlow(multiplier, duration);
                    return;
                }

                if (core === 'fire') {
                    const existing = elementalBurns.get(target);
                    elementalBurns.set(target, {
                        remaining: Math.max(existing?.remaining ?? 0, 2.4 + rank * 0.45),
                        tick: Math.min(existing?.tick ?? 0.45, 0.45),
                        damage: Math.max(existing?.damage ?? 0, baseDamage * (0.09 + rank * 0.025))
                    });
                    return;
                }

                if (core === 'corrosion') {
                    // Corrosion is a direct armor breach: it adds a small portion of the
                    // trigger damage, making sustained fire effective against tough targets.
                    target.takeDamage(baseDamage * (0.08 + rank * 0.028));
                    return;
                }

                if (core === 'kinetic') {
                    const force = 1.4 + rank * 0.7;
                    const knockX = (deltaX / distance) * force;
                    const knockY = (deltaY / distance) * force;
                    if (target instanceof EnemyAdvanced) target.applyKnockback(knockX, knockY);
                    else target.applyKnockback(knockX, knockY, target instanceof Boss ? 0.18 : 1);
                    return;
                }

                // Plasma creates a short-range rupture around the struck target. It is
                // intentionally burst-oriented rather than another damage-over-time effect.
                const radius = 42 + rank * 11;
                const splashDamage = baseDamage * (0.12 + rank * 0.025);
                game['entities'].forEach((nearby: any) => {
                    if (nearby === target || !(nearby instanceof Enemy || nearby instanceof EnemyAdvanced) || !nearby.isActive) return;
                    const nearX = nearby.x + nearby.width / 2;
                    const nearY = nearby.y + nearby.height / 2;
                    if (Math.hypot(nearX - targetX, nearY - targetY) <= radius) {
                        nearby.takeDamage(splashDamage);
                        registerEnemyDefeat(nearby);
                    }
                });
            };

            const updateElementalBurns = (deltaTime: number): void => {
                elementalBurns.forEach((burn, target) => {
                    if (!target.isActive) {
                        elementalBurns.delete(target);
                        return;
                    }
                    burn.remaining -= deltaTime;
                    burn.tick -= deltaTime;
                    if (burn.tick <= 0 && burn.remaining > 0) {
                        target.takeDamage(burn.damage);
                        burn.tick += 0.45;
                        if (target instanceof Enemy || target instanceof EnemyAdvanced) registerEnemyDefeat(target);
                        else registerBossDefeat(target);
                    }
                    if (burn.remaining <= 0) elementalBurns.delete(target);
                });
            };

            const registerBossDefeat = (boss: Boss): void => {
                // Every damage path (including Chain Lightning and elemental burn) reaches
                // this gate. A boss may be declared only once, even if several projectiles land
                // in the same frame after its hull reaches zero.
                if (boss.isAlive() || defeatedBosses.has(boss)) return;
                defeatedBosses.add(boss);
                boss.isActive = false;
                {
                    if (boss instanceof FinalBossPart) {
                        stageMasterySystem.recordEnemyDefeat();
                        game.addEntity(new Explosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 58));
                        if (boss.role === 'reactor' && finalBossAssembly?.isMeltdownActive()) {
                            testNoticeText = 'VOID REACTOR DESTROYED // MELTDOWN INITIATED // SURVIVE 18 SECONDS';
                            testNoticeUntil = performance.now() + 6500;
                            SoundSystem.playCriticalComms('naomi', 'warning');
                        } else if (finalBossAssembly?.isReactorExposed()) {
                            testNoticeText = 'ARCHON DEFENSE GRID BROKEN // VOID REACTOR EXPOSED';
                            testNoticeUntil = performance.now() + 4200;
                        }
                        return;
                    }
                    if (boss instanceof SeraDuelEntity) {
                        stageMasterySystem.recordEnemyDefeat();
                        resolveSeraDuelOutcome('win');
                        game.addEntity(new Explosion(boss.x, boss.y, 30));
                        awardPilotXp(45, 'SERA DUEL');
                        return;
                    }
                    gameState.addScore(Math.floor(boss.getReward() * COMBAT_REWARD_MULTIPLIER));
                    stageMasterySystem.recordEnemyDefeat();
                    awardPilotXp(60, 'BOSS DEFEAT');

                    // Guaranteed Boss Equipment Drop Drop Entity (Always Tier 1)
                    const types: EquipmentPartType[] = ['engine', 'shield', 'generator', 'weapon', 'computer'];
                    const chosenType = types[Math.floor(Math.random() * types.length)];
                    const bossTier = 1; // Bosses also drop Tier 1 parts; fusion/calibration handles the rest
                    const dropEntity = new EquipmentDropEntity(boss.x + boss.width / 2, boss.y + boss.height / 2, chosenType, bossTier);
                    game.addEntity(dropEntity);
                    testNoticeText = `BOSS SALVAGE DROP // CAPTURE THE COMPONENT`;
                    testNoticeUntil = performance.now() + 4000;

                    bossDefeatedAt = performance.now() / 1000;
                    game.addEntity(new Explosion(boss.x, boss.y, 30));
                }
            };

            // Add systems
            game.addSystem(starField);
            game.addSystem(collisionSystem);

            // Store original methods
            const originalUpdate = game.update.bind(game);
            const originalRender = game.render.bind(game);

            // Override update
            game.update = function(deltaTime: number) {
                const now = performance.now();
                if (mCheatStartedAt !== null && now - mCheatStartedAt >= 700) {
                    const grantInterval = 200;
                    if (mCheatLastGrantAt === null || now - mCheatLastGrantAt >= grantInterval) {
                        isTestSession = true;
                        gameState.score = Math.min(999_999_999, gameState.score + 250_000);
                        mCheatLastGrantAt = now;
                        testNoticeText = 'TEST MODE // M HELD // +250,000 CREDITS';
                        testNoticeUntil = now + 900;
                        SoundSystem.playUpgrade();
                    }
                }
                const stageIsActive = !gameState.gameOver && !gameState.showLevelScreen;
                if (!stageIsActive) {
                    SoundSystem.stopMusic();
                    return;
                }

                SoundSystem.startMusic();
                SoundSystem.setMusicDucked(gameState.isPaused || now < commVisibleUntil);
                if (gameState.isPaused) return;

                tacticalAbilitySystem.update(deltaTime);
                const isTimeLocked = tacticalAbilitySystem.isTimeLocked();
                const hasUnlimitedPower = tacticalAbilitySystem.hasUnlimitedPower();
                player.setCombatMultipliers(
                    tacticalAbilitySystem.getFireMultiplier(),
                    tacticalAbilitySystem.getShieldRegenMultiplier()
                );

                const keys = inputManager.getKeys();
                const touchInput = touchInputRef.current;
                const mouseInput = mouseInputRef.current;
                const keyboardFlightEnabled = !mouseControlsEnabled;
                const mouseMoveX = mouseControlsEnabled && mouseInput.targetX !== null
                    ? Math.max(-1, Math.min(1, (mouseInput.targetX - (player.x + player.width / 2)) / 120))
                    : 0;
                const mouseMoveY = mouseControlsEnabled && mouseInput.targetY !== null
                    ? Math.max(-1, Math.min(1, (mouseInput.targetY - (player.y + player.height / 2)) / 120))
                    : 0;
                const directTouchMoveX = touchInput.targetX === null
                    ? 0
                    : Math.max(-1, Math.min(1, (touchInput.targetX - (player.x + player.width / 2)) / 120));
                const directTouchMoveY = touchInput.targetY === null
                    ? 0
                    : Math.max(-1, Math.min(1, (touchInput.targetY - (player.y + player.height / 2)) / 120));
                const activeSeraForInput = game['entities'].find((entity: any) =>
                    entity instanceof SeraDuelEntity && !(entity instanceof SeraAllyShipEntity) && entity.isActive
                ) as SeraDuelEntity | undefined;
                const keyboardMoveX = keyboardFlightEnabled ? (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0) : 0;
                const keyboardMoveY = keyboardFlightEnabled ? (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) : 0;
                const pilotKeys = activeSeraForInput?.isTimeLockingPlayer()
                    ? {}
                    : {
                        ...keys,
                        moveX: Math.max(-1, Math.min(1, keyboardMoveX + touchInput.moveX + mouseMoveX + directTouchMoveX)),
                        moveY: Math.max(-1, Math.min(1, keyboardMoveY + touchInput.moveY + mouseMoveY + directTouchMoveY))
                    };

                // Flight mode is exclusive: keyboard or pointer steers the ship, while touch remains mobile-only.
                player.updateWithInput(deltaTime, pilotKeys, game.getCanvas().width, GAME_CANVAS_HEIGHT);
                const visualMoveX = typeof (pilotKeys as any).moveX === 'number' ? (pilotKeys as any).moveX : 0;
                const visualMoveY = typeof (pilotKeys as any).moveY === 'number' ? (pilotKeys as any).moveY : 0;
                combatVisualEffects.spawnPlayerEngineTrail(
                    player.x,
                    player.y,
                    player.width,
                    player.height,
                    elementalCoreSystem.getActiveCore(),
                    visualMoveX,
                    visualMoveY,
                    powerSystem.currentPower < 20 ? 0.72 : 1,
                );

                // Generate power; OVER POWER keeps the reactor at maximum output for its duration.
                powerSystem.setPilotModifiers(
                    pilotSkillSystem.getBonusMultiplier('capacitor_reserve'),
                    pilotSkillSystem.getBonusMultiplier('weapon_efficiency')
                );
                powerSystem.generatePower(deltaTime, pilotSkillSystem.getBonusMultiplier('generator_output'));
                if (hasUnlimitedPower) powerSystem.forceReactorOnline();

                // A depleted reactor keeps movement available, but with a small recovery penalty.
                const engineEquipmentMultiplier = 1 + (equipmentSystem.getActiveBonuses().moveSpeed / 100);
                const propulsionSpeed = 7.5 * engineUpgradeSystem.getSpeedMultiplier() * engineEquipmentMultiplier;
                if (powerSystem.isReactorRecovering()) {
                    player.speed = propulsionSpeed * 0.8;
                } else if (powerSystem.currentPower < 20) {
                    player.speed = propulsionSpeed * 0.7;
                } else {
                    player.speed = propulsionSpeed;
                }

                // Flight mode also controls firing: Space for keyboard mode, left click for mouse mode.
                const flightFireActive = mouseControlsEnabled ? mouseInput.fire : keys.Space;
                if ((flightFireActive || touchInput.fire) && player.canShoot(performance.now() / 1000) && (hasUnlimitedPower || powerSystem.canShoot(player.weaponType, player.weaponLevel))) {
                    const bulletPositions = player.shoot(performance.now() / 1000);
                    const criticalSalvo = player.rollCriticalSalvo();
                    const shotDamage = criticalSalvo
                        ? Math.round(player.weaponDamage * player.criticalDamageMultiplier)
                        : player.weaponDamage;
                    const weaponCost = powerSystem.getWeaponCost(player.weaponType, player.weaponLevel);
                    if (!hasUnlimitedPower) powerSystem.consumeWeaponPower(weaponCost);
                    
                    bulletPositions.forEach((bulletData: any) => {
                        const cloaked = tacticalAbilitySystem.isPhaseCloaked();
                        if (bulletData.type === 'straight') {
                            const bullet = new Bullet(bulletData.x, bulletData.y, 8, 8, 25, shotDamage, criticalSalvo ? '#ff77e8' : '#FFD700', bulletData.angle || 0);
                            (bullet as any).isCloaked = cloaked;
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'spread') {
                            const bullet = new Bullet(bulletData.x, bulletData.y, 8, 8, 25, shotDamage, criticalSalvo ? '#ff77e8' : '#FFD700', bulletData.angle || 0);
                            (bullet as any).isCloaked = cloaked;
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'homing') {
                            const target = findNearestHomingTarget(bulletData.x, bulletData.y);
                            const targetX = target ? target.x + target.width / 2 : bulletData.x;
                            const targetY = target ? target.y + target.height / 2 : bulletData.y - 100;
                            // Slower missiles and reacquisition make homing useful without making it dominant.
                            const bullet = new HomingBullet(
                                bulletData.x,
                                bulletData.y,
                                6,
                                6,
                                bulletData.speed ?? 11,
                                shotDamage,
                                targetX,
                                targetY,
                                target,
                                bulletData.turnSpeed ?? 2.6
                            );
                            (bullet as any).isCloaked = cloaked;
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'heavy') {
                            const hLevel = player.weaponLevel;
                            const profile = getWeaponRuntimeProfile('heavy', hLevel);
                            const hSize = profile.heavyShellSize ?? 14;
                            const fragmentCount = profile.heavyFragmentCount ?? 4;
                            const fragmentSpeed = profile.heavyFragmentSpeed ?? 11;
                            const cascadePellets = profile.heavyCascadePellets ?? 0;
                            const hBullet = new HeavyBullet(
                                bulletData.x,
                                bulletData.y,
                                hSize,
                                hSize,
                                14,
                                shotDamage,
                                bulletData.angle || 0,
                                hLevel,
                                (splitX, splitY, level, baseDamage) => {
                                    const subDmg = Math.max(5, baseDamage * (0.38 + level * 0.022));
                                    const fragmentAngles = getHeavyFragmentAngles(fragmentCount, bulletData.angle || 0);
                                    for (const dAng of fragmentAngles) {
                                        const smallBombCallback = cascadePellets > 0 ? (sx: number, sy: number, _sl: number, sd: number) => {
                                            for (let pelletIndex = 0; pelletIndex < cascadePellets; pelletIndex++) {
                                                const pelletOffset = cascadePellets === 1 ? 0 : ((pelletIndex / (cascadePellets - 1)) - 0.5) * 0.7;
                                                const regularBullet = new HeavyBullet(sx, sy, 5, 5, fragmentSpeed, sd * 0.28, dAng + pelletOffset, 1, undefined, true);
                                                game.addEntity(regularBullet);
                                            }
                                        } : undefined;
                                        const smallBomb = new HeavyBullet(splitX, splitY, 9, 9, fragmentSpeed, subDmg, dAng, Math.max(1, level - 5), smallBombCallback, true);
                                        game.addEntity(smallBomb);
                                    }
                                }
                            );
                            game.addEntity(hBullet);
                        } else if (bulletData.type === 'arc') {
                            game.addEntity(new ChainLightningBullet(
                                bulletData.x,
                                bulletData.y,
                                shotDamage,
                                player.weaponLevel,
                                bulletData.angle || 0
                            ));
                        } else if (bulletData.type === 'void_lance') {
                            const bullet = new BlackHoleBullet(
                                bulletData.x,
                                bulletData.y,
                                shotDamage,
                                player.weaponLevel,
                                bulletData.angle || 0
                            );
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'laser') {
                            const beam = new LaserBullet(
                                bulletData.x,
                                bulletData.y,
                                shotDamage,
                                player.weaponLevel,
                                true,
                                bulletData.angle ?? 0,
                                Boolean(bulletData.isSecondary)
                            );
                            game.addEntity(beam);
                        }
                    });
                }

                // TIME LOCK freezes enemy motion and salvos, but stage timing and scheduled spawns continue.
                if ((gameState.level % 3 === 0 || gameState.level === 31 || gameState.level === 101) && !bossSpawnedForLevel && gameState.levelTimeElapsed < 1) {
                    if (gameState.level === 101) {
                        finalBossAssembly = new FinalBossAssembly(difficultyProfile);
                        const finalParts = finalBossAssembly.createParts();
                        finalParts.forEach((part) => game.addEntity(part));
                        stageMasterySystem.recordEnemySpawn(finalParts.length);
                    } else {
                        const boss: Boss = gameState.level === 31
                            ? new SeraDuelEntity(game.getCanvas().width / 2, 150, gameState.level)
                            : new Boss(game.getCanvas().width / 2, 100, gameState.level);
                        if (boss instanceof SeraDuelEntity) boss.setMirrorLoadout(getSeraMirrorLoadout());
                        boss.applyDifficulty(difficultyProfile);
                        stageMasterySystem.recordEnemySpawn();
                        game.addEntity(boss);
                    }
                    bossSpawnedForLevel = true;
                    bossDefeatedAt = null;
                    defeatedBosses.clear();
                }

                if (!bossDefeatedAt && !missionEventSpawned && gameState.levelTimeElapsed >= 45) spawnMissionTarget();

                const bossStageForSpawns = gameState.level % 3 === 0 || gameState.level === 31 || gameState.level === 101;
                const waveWindowOpen = bossStageForSpawns || gameState.levelTimeElapsed < gameState.levelDuration;
                if (!bossStageForSpawns && !waveWindowOpen && !sectorSealed) {
                    sectorSealed = true;
                    testNoticeText = 'SECTOR SEALED // CLEAR REMAINING HOSTILES';
                    testNoticeUntil = performance.now() + 5500;
                    SoundSystem.playCriticalComms('elena', 'warning');
                }
                // Once a boss dies, no reinforcement wave or new bounty target may enter.
                // The player clears the remaining escorts, then the stage resolves immediately.
                const newEnemies = bossDefeatedAt !== null || gameState.level === 31 || !waveWindowOpen
                    ? []
                    : enemySpawner.update(deltaTime, game['entities'], gameState.level, gameState.levelTimeElapsed);
                stageMasterySystem.recordEnemySpawn(newEnemies.length);
                newEnemies.forEach(enemy => game.addEntity(enemy));

                const seraDuel = game['entities'].find((entity: any) =>
                    entity instanceof SeraDuelEntity && !(entity instanceof SeraAllyShipEntity) && entity.isActive
                ) as SeraDuelEntity | undefined;
                // Tactical charge is always generated passively: one full cartridge every 20 seconds.
                // Enemy defeats add a small bonus on top, while an active ability pauses charging.
                tacticalAbilitySystem.addTimeCharge(deltaTime, shipSystem.getCurrentShipId());
                const seraTimeLock = Boolean(seraDuel?.isTimeLockingPlayer());
                const canHostileFire = !isTimeLocked && !seraTimeLock;
                // Sera's allied fire is independent of the pilot's TIME LOCK. Only hostile
                // entities are gated by the player's or Sera's time-freeze state.
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof SeraAllyShipEntity) {
                        spawnSeraAllyShots(entity);
                        return;
                    }
                    if (!canHostileFire) return;
                    if ((entity instanceof Enemy || entity instanceof EnemyAdvanced) && entity.canShoot(performance.now() / 1000)) {
                            const aimX = tacticalAbilitySystem.isPhaseCloaked() ? entity.x : (player.x + player.width / 2);
                            const aimY = tacticalAbilitySystem.isPhaseCloaked() ? entity.y + 400 : (player.y + player.height / 2);
                            const shotResult = entity.shoot(performance.now() / 1000, aimX, aimY);
                            if (!shotResult) return;
                            const shots: EnemyShot[] = Array.isArray(shotResult)
                                ? (shotResult as EnemyShot[])
                                : [shotResult as EnemyShot];
                            shots.forEach((shot) => {
                                const enemyBullet = new EnemyBullet(shot.x, shot.y, 6, 6, shot.speed, shot.damage, shot.dirX, shot.dirY, shot.color, shot.style);
                                game.addEntity(enemyBullet);
                            });
                        } else if (entity instanceof SeraDuelEntity) {
                            entity.setPilotTarget(player.x + player.width / 2, player.y + player.height / 2);
                            spawnSeraMirrorShots(entity, false);
                        } else if (entity instanceof Boss) {
                            const bossBullets = entity.shoot();
                            bossBullets.forEach(bullet => game.addEntity(bullet));
                        } else if (entity instanceof MissionTargetEntity && entity.canShoot()) {
                            const aimX = tacticalAbilitySystem.isPhaseCloaked() ? entity.x : (player.x + player.width / 2);
                            const aimY = tacticalAbilitySystem.isPhaseCloaked() ? entity.y + 400 : (player.y + player.height / 2);
                            const shot = entity.shootAt(aimX, aimY);
                            game.addEntity(new EnemyBullet(shot.x, shot.y, 6, 6, shot.speed, shot.damage, shot.dirX, shot.dirY, shot.color, shot.style));
                        }
                    });

                // Reacquire a target after an enemy is destroyed or leaves the field.
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof HomingBullet && !entity.hasValidTarget()) {
                        entity.setTarget(findNearestHomingTarget(entity.x, entity.y));
                    }
                });

                // Sera reads only a lightweight snapshot of player fire so the duel feels evasive without cheating.
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof SeraAllyShipEntity) {
                        entity.setEscortAnchor(player.x + player.width / 2, player.y + player.height / 2);
                        const targets = game['entities']
                            .filter((candidate: any) => candidate.isActive && (
                                candidate instanceof Boss
                                || candidate instanceof MissionTargetEntity
                                || candidate instanceof Enemy
                                || candidate instanceof EnemyAdvanced
                            ))
                            .map((candidate: any) => ({
                                x: candidate.x + (candidate.width ?? 0) / 2,
                                y: candidate.y + (candidate.height ?? 0) / 2,
                                priority: candidate instanceof Boss
                                    ? 'boss' as const
                                    : candidate instanceof MissionTargetEntity
                                        ? 'mission' as const
                                        : candidate instanceof EnemyAdvanced && candidate.isSpecial
                                            ? 'threat' as const
                                            : 'enemy' as const,
                                healthRatio: typeof candidate.health === 'number' && typeof candidate.maxHealth === 'number'
                                    ? candidate.health / Math.max(1, candidate.maxHealth)
                                    : undefined
                            }));
                        const hostileShots = game['entities']
                            .filter((candidate: any) => candidate instanceof EnemyBullet && !candidate.isFriendly && candidate.isActive)
                            .map((candidate: any) => ({ x: candidate.x, y: candidate.y }));
                        entity.setCombatSnapshot(targets, hostileShots);
                    } else if (entity instanceof SeraDuelEntity) {
                        entity.setPilotTarget(player.x + player.width / 2, player.y + player.height / 2);
                        entity.setThreatSnapshot(game['entities'].filter((candidate: any) =>
                            candidate instanceof Bullet || candidate instanceof HomingBullet || candidate instanceof HeavyBullet || candidate instanceof LaserBullet
                        ));
                    }
                });

                // Give the evasive hunter a read-only snapshot of current threats for dodging.
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof EnemyAdvanced && entity.isSpecial) {
                        entity.setThreatSnapshot(game['entities']);
                    }
                    entity.isTimeFrozen = isTimeLocked && (
                        entity instanceof Enemy ||
                        entity instanceof EnemyAdvanced ||
                        (entity instanceof Boss && !(entity instanceof SeraAllyShipEntity)) ||
                        entity instanceof EnemyBullet ||
                        entity instanceof MissionTargetEntity
                    );
                });

                if (gravityWell?.isActive) {
                    game['entities'].forEach((entity: any) => {
                        const isProjectile = entity instanceof Bullet || entity instanceof HomingBullet || entity instanceof HeavyBullet || entity instanceof EnemyBullet || entity instanceof LaserBullet;
                        if (isProjectile && !(entity instanceof BlackHoleBullet)) {
                            gravityWell?.deflectProjectile(entity, deltaTime, entity instanceof EnemyBullet ? 0.78 : 1);
                        }
                    });
                }

                spawnAsteroidBeltHazardIfNeeded(now / 1000, deltaTime);

                // Call original update
                originalUpdate(deltaTime);
                combatVisualEffects.update(deltaTime);

                // Enemy pilots read the nearby asteroid field and steer away before impact.
                // This is deliberate flight behavior, not an immunity: sharp crossings and
                // close spawns can still catch an enemy that reacts too late.
                const activeAsteroids = game['entities'].filter((entity: any) => entity instanceof AsteroidBeltEntity && entity.isActive) as AsteroidBeltEntity[];
                if (activeAsteroids.length) {
                    game['entities'].forEach((entity: any) => {
                        if (!(entity instanceof Enemy || entity instanceof EnemyAdvanced) || !entity.isActive) return;
                        const entityCenterX = entity.x + entity.width / 2;
                        const entityCenterY = entity.y + entity.height / 2;
                        const nearest = activeAsteroids
                            .map((asteroid) => {
                                const asteroidX = asteroid.x + asteroid.width / 2;
                                const asteroidY = asteroid.y + asteroid.height / 2;
                                return { asteroid, asteroidX, asteroidY, distance: Math.hypot(entityCenterX - asteroidX, entityCenterY - asteroidY) };
                            })
                            .sort((a, b) => a.distance - b.distance)[0];
                        if (!nearest) return;
                        const safeDistance = nearest.asteroid.radius + Math.max(entity.width, entity.height) * 0.65 + 118;
                        if (nearest.distance >= safeDistance || nearest.distance <= 1) return;
                        const urgency = (safeDistance - nearest.distance) / safeDistance;
                        const awayX = (entityCenterX - nearest.asteroidX) / nearest.distance;
                        const awayY = (entityCenterY - nearest.asteroidY) / nearest.distance;
                        entity.applyKnockback(awayX * 3.2 * urgency, awayY * 2.4 * urgency, 1);
                        entity.x += awayX * urgency * deltaTime * 108;
                        entity.y += awayY * urgency * deltaTime * 76;
                    });
                }
                resolveStageHazardCollisions();

                if (finalBossAssembly?.isMeltdownActive()) {
                    finalBossAssembly.update(deltaTime);
                    if (finalBossAssembly.isDefeated() && bossDefeatedAt === null) {
                        finalBossAssembly.getParts().forEach((part) => {
                            if (part.isActive) {
                                part.isActive = false;
                                game.addEntity(new Explosion(part.x + part.width / 2, part.y + part.height / 2, 66));
                            }
                        });
                        const rewardBoss = finalBossAssembly.getParts()[0];
                        gameState.addScore(Math.floor((rewardBoss?.getReward() ?? 100000) * 2.5));
                        bossDefeatedAt = performance.now() / 1000;
                        testNoticeText = 'ARCHON SUPREME // REACTOR MELTDOWN COMPLETE // VICTORY CONFIRMED';
                        testNoticeUntil = performance.now() + 7000;
                        SoundSystem.playUpgrade();
                    }
                }

                // Resolve Equipment Drop pickups by player
                game['entities'].forEach((entity: any) => {
                    if (!(entity instanceof EquipmentDropEntity) || !entity.isActive) return;
                    if (entity.collidesWith(player)) {
                        entity.isActive = false;
                        const addedPart = equipmentSystem.addDropPart(entity.equipmentType, entity.tier);
                        testNoticeText = `SALVAGE COLLECTED // ${addedPart.type.toUpperCase()} TIER ${addedPart.tier}`;
                        testNoticeUntil = performance.now() + 4500;
                        SoundSystem.playUpgrade();
                    }
                });

                // Resolve Asteroid Belt collisions & damage
                game['entities'].forEach((entity: any) => {
                    if (!(entity instanceof AsteroidBeltEntity) || !entity.isActive) return;
                    game['entities'].forEach((other: any) => {
                        if (!other.isActive || other === entity) return;
                        if (!entity.collidesWith(other)) return;

                        const isProjectile = other instanceof Bullet || other instanceof HomingBullet || other instanceof HeavyBullet || other instanceof EnemyBullet || other instanceof LaserBullet || other instanceof BlackHoleBullet;
                        if (isProjectile) {
                            if (other instanceof HeavyBullet) {
                                entity.takeDamage(other.damage);
                                // Trigger HeavyBullet split on asteroid impact
                                const hBullet = other as any;
                                if (hBullet.onSplit && !hBullet.hasSplit) {
                                    hBullet.hasSplit = true;
                                    hBullet.onSplit(hBullet.x, hBullet.y, hBullet.level, hBullet.damage);
                                }
                            } else if (other instanceof BlackHoleBullet) {
                                entity.takeDamage(other.damage);
                            } else {
                                entity.takeDamage(10);
                            }
                            other.isActive = false;
                            return;
                        }

                        if (other === player) {
                            applyPlayerDamage(entity.kind === 'massive' ? 35 : 20, true);
                            entity.takeDamage(25);
                            return;
                        }

                        if (other instanceof Enemy || other instanceof EnemyAdvanced || other instanceof Boss) {
                            other.takeDamage(20);
                            entity.takeDamage(20);
                        }
                    });
                });

                // Handle collisions
                const applyHeavyImpact = (bullet: HeavyBullet, target: Enemy | EnemyAdvanced | Boss): boolean => {
                    const impact = bullet.consumeImpact(target);
                    if (!impact) return false;
                    target.takeDamage(impact.damage);
                    const direction = bullet.getImpactDirection();
                    const resistance = target instanceof Boss ? 0.18 : 1;
                    target.applyKnockback(direction.x * impact.force, direction.y * impact.force, resistance);
                    const blastRadius = bullet.getBlastRadius();
                    const blastDamage = bullet.getBlastDamage(impact.damage);
                    game['entities'].forEach((nearby: any) => {
                        if (nearby === target || !nearby.isActive || !(nearby instanceof Enemy || nearby instanceof EnemyAdvanced || nearby instanceof Boss)) return;
                        const distance = Math.hypot(
                            nearby.x + nearby.width / 2 - (target.x + target.width / 2),
                            nearby.y + nearby.height / 2 - (target.y + target.height / 2)
                        );
                        if (distance > blastRadius) return;
                        nearby.takeDamage(blastDamage);
                        const blastDirectionX = (nearby.x + nearby.width / 2) - (target.x + target.width / 2);
                        const blastDirectionY = (nearby.y + nearby.height / 2) - (target.y + target.height / 2);
                        const blastDistance = Math.max(1, Math.hypot(blastDirectionX, blastDirectionY));
                        nearby.applyKnockback(
                            (blastDirectionX / blastDistance) * impact.force * 0.28,
                            (blastDirectionY / blastDistance) * impact.force * 0.28,
                            nearby instanceof Boss ? 0.12 : 1
                        );
                        if (nearby instanceof Enemy || nearby instanceof EnemyAdvanced) registerEnemyDefeat(nearby);
                    });
                    return true;
                };
                const applyBlackHoleImpact = (bullet: BlackHoleBullet, target: Enemy | EnemyAdvanced | Boss): boolean => {
                    if (!bullet.canHitTarget(target)) return false;
                    const damage = bullet.getDamageForTarget();
                    bullet.registerHit(target);
                    target.takeDamage(damage);
                    return true;
                };
                const resolveChainLightning = (bolt: ChainLightningBullet, initialTarget: Enemy | EnemyAdvanced | Boss | MissionTargetEntity): void => {
                    if (!bolt.canStrike(initialTarget)) return;
                    let currentTarget: Enemy | EnemyAdvanced | Boss | MissionTargetEntity | null = initialTarget;
                    let sourceX = bolt.x + bolt.width / 2;
                    let sourceY = bolt.y + bolt.height / 2;
                    let damage = bolt.damage;
                    let jumpsLeft = bolt.chainJumps;

                    while (currentTarget && damage >= 1) {
                        // Chain Lightning is a fixed electric weapon. Boss armour disperses
                        // ordinary chain arcs too easily, so the first-class boss hit receives
                        // a controlled 35% conductivity bonus while each jump still decays by 50%.
                        const resolvedDamage = currentTarget instanceof Boss ? damage * 1.35 : damage;
                        bolt.registerStrike(sourceX, sourceY, currentTarget, resolvedDamage);
                        const destroyed = currentTarget.takeDamage(resolvedDamage);
                        if (currentTarget instanceof MissionTargetEntity) {
                            if (destroyed && currentTarget.isActive) {
                                currentTarget.isActive = false;
                                gameState.addScore(currentTarget.reward);
                                testNoticeText = `MISSION OBJECTIVE SECURED // +${currentTarget.reward} CREDITS`;
                                testNoticeUntil = performance.now() + 5000;
                                SoundSystem.playUpgrade();
                                game.addEntity(new Explosion(currentTarget.x + currentTarget.width / 2, currentTarget.y + currentTarget.height / 2, 35));
                            }
                        } else if (currentTarget instanceof Enemy || currentTarget instanceof EnemyAdvanced) {
                            registerEnemyDefeat(currentTarget);
                        } else {
                            registerBossDefeat(currentTarget);
                        }

                        sourceX = currentTarget.x + currentTarget.width / 2;
                        sourceY = currentTarget.y + currentTarget.height / 2;
                        if (jumpsLeft-- <= 0) break;
                        damage *= 0.5;

                        const nextTarget = game['entities']
                            .filter((entity: any) => (entity instanceof Enemy || entity instanceof EnemyAdvanced || entity instanceof Boss || (entity instanceof MissionTargetEntity && entity.missionType === 'bounty')) && entity.isActive && !bolt.hasStruck(entity))
                            .map((entity: Enemy | EnemyAdvanced | Boss | MissionTargetEntity) => ({
                                entity,
                                distance: Math.hypot((entity.x + entity.width / 2) - sourceX, (entity.y + entity.height / 2) - sourceY)
                            }))
                            .filter(({ distance }: { distance: number }) => distance <= bolt.chainRange)
                            .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)[0]?.entity ?? null;
                        currentTarget = nextTarget;
                    }
                    bolt.finishChain();
                };

                const applyBlackHoleField = (bullet: BlackHoleBullet): void => {
                    game['entities'].forEach((target: any) => {
                        const isEnemy = target instanceof Enemy || target instanceof EnemyAdvanced;
                        const isHostileShot = target instanceof EnemyBullet && !target.isFriendly;
                        const isAsteroid = target instanceof AsteroidBeltEntity;
                        if ((!isEnemy && !isHostileShot && !isAsteroid) || !target.isActive) return;
                        if (!bullet.isWithinField(target) || (!isAsteroid && !bullet.canSuctionTarget(target))) return;

                        const center = bullet.getFieldCenter();
                        const targetCenterX = target.x + target.width / 2;
                        const targetCenterY = target.y + target.height / 2;
                        const deltaX = center.x - targetCenterX;
                        const deltaY = center.y - targetCenterY;
                        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
                        const fieldRadius = bullet.getFieldRadius();
                        const falloff = Math.max(0.35, 1 - distance / fieldRadius);
                        const suction = bullet.getSuctionStrength() * (0.65 + falloff * 0.75);
                        bullet.registerSuction(target, isHostileShot ? 0.025 : 0.09);

                        if (target instanceof AsteroidBeltEntity) {
                            // A massive asteroid cannot be destroyed, but a singularity still
                            // bends its flight path. Fragile debris uses the same pull and can
                            // then be shattered by ordinary weapon impacts.
                            target.applyGravityToward(center.x, center.y, suction, deltaTime);
                            return;
                        }

                        if (target instanceof EnemyBullet && !target.isFriendly) {
                            // Bend hostile fire toward the event horizon. Repeated pulls make
                            // the shot visibly curve, and the core consumes it instead of letting
                            // it pass through the singularity toward the player.
                            const pullX = deltaX / distance;
                            const pullY = deltaY / distance;
                            const nextX = target.dirX + pullX * suction * deltaTime * 2.8;
                            const nextY = target.dirY + pullY * suction * deltaTime * 2.8;
                            const magnitude = Math.max(0.001, Math.hypot(nextX, nextY));
                            target.dirX = nextX / magnitude;
                            target.dirY = nextY / magnitude;
                            target.x += pullX * suction * deltaTime * 22;
                            target.y += pullY * suction * deltaTime * 22;
                            if (distance <= bullet.getProjectileCaptureRadius()) target.isActive = false;
                            return;
                        }

                        if (!(target instanceof Enemy || target instanceof EnemyAdvanced)) return;

                        // Ordinary enemies are dragged through the lane as well as damaged.
                        // Bosses remain outside canSuctionTarget's size limit and keep only the
                        // direct-impact interaction, preserving encounter readability.
                        const pullX = deltaX / distance;
                        const pullY = deltaY / distance;
                        target.applyKnockback(pullX * suction, pullY * suction, 1);
                        target.x += pullX * suction * deltaTime * 14;
                        target.y += pullY * suction * deltaTime * 14;
                        target.takeDamage(bullet.getSuctionDamage());
                        registerEnemyDefeat(target);
                    });
                };
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof BlackHoleBullet && entity.isActive) applyBlackHoleField(entity);
                });
                updateElementalBurns(deltaTime);
                const collisions = collisionSystem.getCollisions();
                                collisions.forEach((collision: any) => {
                    const { entityA, entityB } = collision;
                    const playerProjectile = entityA instanceof Bullet || entityA instanceof HomingBullet || entityA instanceof HeavyBullet || entityA instanceof LaserBullet || entityA instanceof ChainLightningBullet || entityA instanceof BlackHoleBullet
                        ? entityA
                        : entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet || entityB instanceof LaserBullet || entityB instanceof ChainLightningBullet || entityB instanceof BlackHoleBullet
                            ? entityB
                            : null;
                    const alliedSera = entityA instanceof SeraAllyShipEntity
                        ? entityA
                        : entityB instanceof SeraAllyShipEntity
                            ? entityB
                            : null;
                    const seraTarget = entityA instanceof SeraDuelEntity
                        ? entityA
                        : entityB instanceof SeraDuelEntity
                            ? entityB
                            : null;
                    if (alliedSera && playerProjectile) {
                        // The pilot and Sera share a fire lane; friendly fire is disabled for the alliance arc.
                        playerProjectile.isActive = false;
                        return;
                    }
                    if (seraTarget?.isVoidArmoredForDuel() && playerProjectile) {
                        playerProjectile.isActive = false;
                        return;
                    }

                    // Sera's mirrored laser and singularity are hostile projectiles and can damage the pilot.
                    if (entityA instanceof LaserBullet && !entityA.isPlayerBullet && entityB instanceof Player && entityA.intersectsTarget(entityB)) {
                        const damage = entityA.getDamageForTarget(entityB);
                        if (damage > 0 && entityB.isActive) {
                            const isDead = applyPlayerDamage(damage);
                            if (isDead) handlePlayerDefeat();
                        }
                        entityA.isActive = false;
                        return;
                    } else if (entityB instanceof LaserBullet && !entityB.isPlayerBullet && entityA instanceof Player && entityB.intersectsTarget(entityA)) {
                        const damage = entityB.getDamageForTarget(entityA);
                        if (damage > 0 && entityA.isActive) {
                            const isDead = applyPlayerDamage(damage);
                            if (isDead) handlePlayerDefeat();
                        }
                        entityB.isActive = false;
                        return;
                    }
                    if (entityA instanceof BlackHoleBullet && !entityA.isFriendly && entityB instanceof Player && entityA.canHitTarget(entityB)) {
                        entityA.registerHit(entityB);
                        const isDead = applyPlayerDamage(entityA.getDamageForTarget());
                        if (isDead) handlePlayerDefeat();
                        entityA.isActive = false;
                        return;
                    } else if (entityB instanceof BlackHoleBullet && !entityB.isFriendly && entityA instanceof Player && entityB.canHitTarget(entityA)) {
                        entityB.registerHit(entityA);
                        const isDead = applyPlayerDamage(entityB.getDamageForTarget());
                        if (isDead) handlePlayerDefeat();
                        entityB.isActive = false;
                        return;
                    }

                    // Continuous laser beams can pierce multiple targets, with per-beam falloff and a target quota.
                    if (entityA instanceof LaserBullet && entityA.isPlayerBullet && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced) && entityA.intersectsTarget(entityB)) {
                        const damage = entityA.getDamageForTarget(entityB);
                        if (damage > 0 && entityB.isActive) {
                            entityB.takeDamage(damage);
                            applyElementalCore(entityB, damage, entityA.x, entityA.y);
                        }
                        registerEnemyDefeat(entityB);
                    } else if (entityB instanceof LaserBullet && entityB.isPlayerBullet && (entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && entityB.intersectsTarget(entityA)) {
                        const damage = entityB.getDamageForTarget(entityA);
                        if (damage > 0 && entityA.isActive) {
                            entityA.takeDamage(damage);
                            applyElementalCore(entityA, damage, entityB.x, entityB.y);
                        }
                        registerEnemyDefeat(entityA);
                    }

                    // Void Lance pierces enemies and applies a temporary movement drag.
                    if (entityA instanceof BlackHoleBullet && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced)) {
                        applyBlackHoleImpact(entityA, entityB);
                        registerEnemyDefeat(entityB);
                    } else if (entityB instanceof BlackHoleBullet && (entityA instanceof Enemy || entityA instanceof EnemyAdvanced)) {
                        applyBlackHoleImpact(entityB, entityA);
                        registerEnemyDefeat(entityA);
                    }

                    // Chain Lightning has a fixed electrical identity and resolves its full chain on the first hit.
                    if (entityA instanceof ChainLightningBullet && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced || entityB instanceof Boss || (entityB instanceof MissionTargetEntity && entityB.missionType === 'bounty'))) {
                        resolveChainLightning(entityA, entityB);
                        return;
                    } else if (entityB instanceof ChainLightningBullet && (entityA instanceof Enemy || entityA instanceof EnemyAdvanced || entityA instanceof Boss || (entityA instanceof MissionTargetEntity && entityA.missionType === 'bounty'))) {
                        resolveChainLightning(entityB, entityA);
                        return;
                    }

                    // Friendly Sera rounds use the enemy-bullet renderer, but damage hostile entities only.
                    if (entityA instanceof EnemyBullet && entityA.isFriendly && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced)) {
                        if (entityB.isActive) {
                            entityB.takeDamage(entityA.damage);
                            entityA.isActive = false;
                        }
                        registerEnemyDefeat(entityB);
                    } else if (entityB instanceof EnemyBullet && entityB.isFriendly && (entityA instanceof Enemy || entityA instanceof EnemyAdvanced)) {
                        if (entityA.isActive) {
                            entityA.takeDamage(entityB.damage);
                            entityB.isActive = false;
                        }
                        registerEnemyDefeat(entityA);
                    }

                    // Player rounds hit enemies. Heavy rounds can keep travelling after impact.
                    if ((entityA instanceof Bullet || entityA instanceof HomingBullet || entityA instanceof HeavyBullet) && !(entityA instanceof BlackHoleBullet) && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced)) {
                        if (entityB.isActive) {
                            if (entityA instanceof HeavyBullet) applyHeavyImpact(entityA, entityB);
                            else {
                                entityB.takeDamage(entityA.damage);
                                entityA.isActive = false;
                            }
                            applyElementalCore(entityB, entityA.damage, entityA.x, entityA.y);
                        }
                        registerEnemyDefeat(entityB);
                    } else if ((entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && (entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet) && !(entityB instanceof BlackHoleBullet)) {
                        if (entityA.isActive) {
                            if (entityB instanceof HeavyBullet) applyHeavyImpact(entityB, entityA);
                            else {
                                entityA.takeDamage(entityB.damage);
                                entityB.isActive = false;
                            }
                            applyElementalCore(entityA, entityB.damage, entityB.x, entityB.y);
                        }
                        registerEnemyDefeat(entityA);
                    }

                    // Player laser hits boss and consumes one penetration slot for this beam.
                    if (entityA instanceof LaserBullet && entityA.isPlayerBullet && entityB instanceof Boss && entityA.intersectsTarget(entityB)) {
                        const damage = entityA.getDamageForTarget(entityB);
                        if (damage > 0 && entityB.isActive) {
                            entityB.takeDamage(damage);
                            applyElementalCore(entityB, damage, entityA.x, entityA.y);
                        }
                        if (entityB.isActive && !entityB.isAlive()) {
                            entityB.isActive = false;
                            registerBossDefeat(entityB);
                        }
                    } else if (entityB instanceof LaserBullet && entityB.isPlayerBullet && entityA instanceof Boss && entityB.intersectsTarget(entityA)) {
                        const damage = entityB.getDamageForTarget(entityA);
                        if (damage > 0 && entityA.isActive) {
                            entityA.takeDamage(damage);
                            applyElementalCore(entityA, damage, entityB.x, entityB.y);
                        }
                        if (entityA.isActive && !entityA.isAlive()) {
                            entityA.isActive = false;
                            registerBossDefeat(entityA);
                        }
                    }

                    // Void Lance also pierces the boss and applies only a reduced movement drag.
                    if (entityA instanceof BlackHoleBullet && entityB instanceof Boss) {
                        applyBlackHoleImpact(entityA, entityB);
                        if (entityB.isActive && !entityB.isAlive()) {
                            entityB.isActive = false;
                            registerBossDefeat(entityB);
                        }
                    } else if (entityB instanceof BlackHoleBullet && entityA instanceof Boss) {
                        applyBlackHoleImpact(entityB, entityA);
                        if (entityA.isActive && !entityA.isAlive()) {
                            entityA.isActive = false;
                            registerBossDefeat(entityA);
                        }
                    }

                    // Player rounds hit the boss. Heavy rounds retain remaining impact force.
                    if ((entityA instanceof Bullet || entityA instanceof HomingBullet || entityA instanceof HeavyBullet) && !(entityA instanceof BlackHoleBullet) && entityB instanceof Boss) {
                        const damage = entityA.damage;
                        if (entityA instanceof HeavyBullet) applyHeavyImpact(entityA, entityB);
                        else {
                            entityB.takeDamage(damage);
                            entityA.isActive = false;
                        }
                        applyElementalCore(entityB, damage, entityA.x, entityA.y);
                        if (entityB.isActive && !entityB.isAlive()) {
                            entityB.isActive = false;
                            registerBossDefeat(entityB);
                        }
                    } else if ((entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet) && !(entityB instanceof BlackHoleBullet) && entityA instanceof Boss) {
                        const damage = entityB.damage;
                        if (entityB instanceof HeavyBullet) applyHeavyImpact(entityB, entityA);
                        else {
                            entityA.takeDamage(damage);
                            entityB.isActive = false;
                        }
                        applyElementalCore(entityA, damage, entityB.x, entityB.y);
                        if (entityA.isActive && !entityA.isAlive()) {
                            entityA.isActive = false;
                            registerBossDefeat(entityA);
                        }
                    }

                    // Player rounds hit Mission Target entity
                    if ((entityA instanceof Bullet || entityA instanceof HomingBullet || entityA instanceof HeavyBullet || entityA instanceof LaserBullet) && entityB instanceof MissionTargetEntity) {
                        const damage = entityB instanceof HeavyBullet ? 35 : entityB instanceof HomingBullet ? 20 : 15;
                        const isDestroyed = entityB.takeDamage(damage);
                        entityA.isActive = false;
                        if (isDestroyed && entityB.isActive) {
                            entityB.isActive = false;
                            gameState.addScore(entityB.reward);
                            testNoticeText = `MISSION OBJECTIVE SECURED // +${entityB.reward} CREDITS`;
                            testNoticeUntil = performance.now() + 5000;
                            SoundSystem.playUpgrade();
                            game.addEntity(new Explosion(entityB.x + entityB.width / 2, entityB.y + entityB.height / 2, 35));
                        }
                    } else if ((entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet || entityB instanceof LaserBullet) && entityA instanceof MissionTargetEntity) {
                        const damage = entityA instanceof HeavyBullet ? 35 : entityA instanceof HomingBullet ? 20 : 15;
                        const isDestroyed = entityA.takeDamage(damage);
                        entityB.isActive = false;
                        if (isDestroyed && entityA.isActive) {
                            entityA.isActive = false;
                            gameState.addScore(entityA.reward);
                            testNoticeText = `MISSION OBJECTIVE SECURED // +${entityA.reward} CREDITS`;
                            testNoticeUntil = performance.now() + 5000;
                            SoundSystem.playUpgrade();
                            game.addEntity(new Explosion(entityA.x + entityA.width / 2, entityA.y + entityA.height / 2, 35));
                        }
                    }

                    // Hostile fire can damage Sera's allied prototype; losing her does not fail the mission.
                    if (entityA instanceof EnemyBullet && !entityA.isFriendly && entityB instanceof SeraAllyShipEntity) {
                        if (entityB.isActive) entityB.takeDamage(entityA.damage);
                        entityA.isActive = false;
                        if (!entityB.isAlive()) {
                            entityB.isActive = false;
                            seraAlly = null;
                            testNoticeText = 'ALLIANCE LINK // SERA CRAFT DISABLED';
                            testNoticeUntil = performance.now() + 4200;
                        }
                    } else if (entityB instanceof EnemyBullet && !entityB.isFriendly && entityA instanceof SeraAllyShipEntity) {
                        if (entityA.isActive) entityA.takeDamage(entityB.damage);
                        entityB.isActive = false;
                        if (!entityA.isAlive()) {
                            entityA.isActive = false;
                            seraAlly = null;
                            testNoticeText = 'ALLIANCE LINK // SERA CRAFT DISABLED';
                            testNoticeUntil = performance.now() + 4200;
                        }
                    }

                    // Enemy fire can destroy defense and escort objectives. Their loss returns the pilot to command.
                    if (entityA instanceof EnemyBullet && !entityA.isFriendly && entityB instanceof MissionTargetEntity && entityB.isDefensiveObjective()) {
                        const isDestroyed = entityB.takeDamage(entityA.damage);
                        entityA.isActive = false;
                        if (isDestroyed) failMission(`${entityB.targetName} DESTROYED`);
                    } else if (entityB instanceof EnemyBullet && !entityB.isFriendly && entityA instanceof MissionTargetEntity && entityA.isDefensiveObjective()) {
                        const isDestroyed = entityA.takeDamage(entityB.damage);
                        entityB.isActive = false;
                        if (isDestroyed) failMission(`${entityA.targetName} DESTROYED`);
                    }

                    // Enemy bullet hits player. VOID ARMOR consumes the projectile without damaging the hull.
                    if (entityA instanceof EnemyBullet && !entityA.isFriendly && entityB instanceof Player) {
                        if (tacticalAbilitySystem.isVoidArmored()) {
                            entityA.isActive = false;
                        } else {
                            const isDead = applyPlayerDamage(entityA.damage);
                            entityA.isActive = false;
                            if (isDead) {
                                handlePlayerDefeat();
                            } else {
                                const explosion = new Explosion(player.x + player.width / 2, player.y + player.height / 2, 15);
                                game.addEntity(explosion);
                            }
                        }
                    } else if (entityA instanceof Player && entityB instanceof EnemyBullet && !entityB.isFriendly) {
                        if (tacticalAbilitySystem.isVoidArmored()) {
                            entityB.isActive = false;
                        } else {
                            const isDead = applyPlayerDamage(entityB.damage);
                            entityB.isActive = false;
                            if (isDead) {
                                handlePlayerDefeat();
                            } else {
                                const explosion = new Explosion(player.x + player.width / 2, player.y + player.height / 2, 15);
                                game.addEntity(explosion);
                            }
                        }
                    }

                    // Enemy hulls still exist during VOID ARMOR, but their collision cannot damage the player.
                    if ((entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && entityB instanceof Player) {
                        if (!tacticalAbilitySystem.isVoidArmored()) {
                            const collisionDamage = entityA instanceof EnemyAdvanced ? 28 : 20;
                            const isDead = applyPlayerDamage(collisionDamage, true);
                            entityA.isActive = false;
                            if (isDead) {
                                handlePlayerDefeat();
                            } else {
                                const explosion = new Explosion(entityA.x + entityA.width / 2, entityA.y + entityA.height / 2, 25);
                                game.addEntity(explosion);
                            }
                        }
                    } else if (entityA instanceof Player && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced)) {
                        if (!tacticalAbilitySystem.isVoidArmored()) {
                            const collisionDamage = entityB instanceof EnemyAdvanced ? 28 : 20;
                            const isDead = applyPlayerDamage(collisionDamage, true);
                            entityB.isActive = false;
                            if (isDead) {
                                handlePlayerDefeat();
                            } else {
                                const explosion = new Explosion(entityB.x + entityB.width / 2, entityB.y + entityB.height / 2, 25);
                                game.addEntity(explosion);
                            }
                        }
                    }
                });

                // Update level time and check progression. Boss levels end five seconds
                // after the boss is destroyed, rather than forcing the player to wait.
                const currentTime = performance.now() / 1000;
                gameState.updateLevelTime(currentTime);
                // In-mission communications are retained in the mission archive, but no
                // longer interrupt or overlay combat after the pre-launch dialogue is complete.
                if (!inMissionCommsTriggered && stageBriefing.inMissionComms && gameState.levelTimeElapsed >= 6.0) {
                    inMissionCommsTriggered = true;
                    MissionArchiveSystem.recordInMissionComms(stageBriefing);
                }
                if (!currentMissionTarget && gameState.level % 3 !== 0 && gameState.level !== 31 && gameState.levelTimeElapsed >= 45) {
                    spawnMissionTarget();
                }
                const bossStage = gameState.level % 3 === 0 || gameState.level === 31 || gameState.level === 101;
                // A sealed regular sector should never soft-lock because one enemy has been
                // displaced or stranded by a fragmentation blast. After a generous clearance
                // window, remaining ordinary enemies retreat; bosses and bounty objectives are
                // deliberately excluded from this failsafe.
                const sealedClearanceTimeout = !bossStage && sectorSealed && gameState.levelTimeElapsed >= gameState.levelDuration + 12;
                if (sealedClearanceTimeout) {
                    let retreatedEnemy = false;
                    game['entities'].forEach((entity: any) => {
                        if (entity.isActive && (entity instanceof Enemy || entity instanceof EnemyAdvanced)) {
                            entity.isActive = false;
                            retreatedEnemy = true;
                        }
                    });
                    if (retreatedEnemy) {
                        testNoticeText = 'SECTOR EVACUATION // STRANDED HOSTILES WITHDRAWN';
                        testNoticeUntil = performance.now() + 3500;
                    }
                }
                const activeHostiles = game['entities'].filter((entity: any) => entity.isActive && (
                    entity instanceof Enemy || entity instanceof EnemyAdvanced || entity instanceof Boss ||
                    (entity instanceof MissionTargetEntity && entity.missionType === 'bounty')
                )).length;
                const bossStageClear = bossDefeatedAt !== null && activeHostiles === 0;
                const regularStageClear = !bossStage && gameState.isLevelComplete() && activeHostiles === 0;
                if (regularStageClear || (bossStage && bossStageClear)) {
                    finalizeStageTelemetry(true);
                    gameState.levelComplete = true;
                    gameState.showLevelScreen = true;
                    if (gameState.level === 101) {
                        // Special campaign completion finale screen flow
                        finaleSceneIndex = 0;
                    shopScreen = 'finale_victory';
                    } else {
                        // Every completed stage receives a proper debrief with its earned XP
                        // and performance data; chapter dialogue is an optional extra inside it.
                        showAfterActionModal = true;
                    }
                }
            };

            // Override render
            game.render = function() {
                const canvas = game.getCanvas();
                const shopMode = gameState.showLevelScreen || showBranchModal;
                if (canvas.height !== (shopMode ? SHOP_CANVAS_HEIGHT : GAME_CANVAS_HEIGHT)) {
                    canvas.height = shopMode ? SHOP_CANVAS_HEIGHT : GAME_CANVAS_HEIGHT;
                }
                const ctx = game.getContext();
                ctx.clearRect(0, 0, game.getCanvas().width, game.getCanvas().height);
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                // Render thematic dynamic background based on level and chapter
                BackgroundRenderer.renderBackground(
                    ctx,
                    game.getCanvas().width,
                    GAME_CANVAS_HEIGHT,
                    gameState.level,
                    gameState.levelTimeElapsed,
                    gameState.level % 3 === 0 || gameState.level === 101,
                    graphicsQuality
                );

                // Engine trails and slow energy mist stay behind all ships and projectiles.
                combatVisualEffects.renderBehind(ctx);

                // Render entities with phase cloak state for player
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof Player) {
                        entity.render(ctx, tacticalAbilitySystem.isPhaseCloaked());
                    } else {
                        entity.render(ctx);
                    }
                });

                // Impact sparks, elemental pulses and explosion rings stay above the battlefield.
                combatVisualEffects.renderOver(ctx);

                // Render UI
                ctx.fillStyle = '#00FF88';
                ctx.font = 'bold 22px Arial';
                ctx.fillText(`Score: ${gameState.score}`, 20, 32);
                ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 20, 62);
                ctx.fillText(`Level: ${gameState.level}`, 20, 92);
                // Display only real combat events: active targets, timed arrivals, bosses, or formations.
                ctx.font = 'bold 14px Arial';
                const hasMissionObjective = stageBriefing.missionType === 'bounty' || stageBriefing.missionType === 'escort' || (stageBriefing.missionType === 'singularity' && gameState.level >= 70);
                if (gameState.level === 31 && !bossDefeatedAt) {
                    ctx.fillStyle = '#ff6b9b';
                    ctx.fillText('SERA DUEL ACTIVE // HIGH-VALUE PILOT TARGET', 20, 148);
                } else if (currentMissionTarget && currentMissionTarget.isActive) {
                    ctx.fillStyle = '#ffb700';
                    ctx.fillText(`TARGET: ${currentMissionTarget.targetName} (${Math.floor(currentMissionTarget.health)}/${currentMissionTarget.maxHealth})`, 20, 148);
                } else if (gameState.level === 101) {
                    const archonObjective = finalBossAssembly?.getObjectiveLabel() ?? 'ARCHON SUPREME // TARGETING SYSTEMS';
                    ctx.fillStyle = finalBossAssembly?.isMeltdownActive() ? '#ff4d6d' : '#ffb000';
                    ctx.fillText(archonObjective, 20, 148);
                } else if (gameState.level % 3 === 0) {
                    ctx.fillStyle = '#ff6b6b';
                    ctx.fillText('BOUNTY TARGET ACTIVE // FLAGSHIP HUNT', 20, 148);
                } else if (hasMissionObjective && !missionEventSpawned) {
                    ctx.fillStyle = '#75d8e7';
                    ctx.fillText('COMBAT EVENT INBOUND // ETA 00:15', 20, 148);
                } else if (gravityWell?.isActive) {
                    ctx.fillStyle = '#c59cff';
                    ctx.fillText(`SINGULARITY ACTIVE // ${stageBriefing.missionTargetName.toUpperCase()}`, 20, 148);
                } else if (hasMissionObjective) {
                    ctx.fillStyle = '#00FF88';
                    ctx.fillText(`OBJECTIVE SECURED  •  +${Math.floor(stageBriefing.bountyReward * COMBAT_REWARD_MULTIPLIER)} CREDITS`, 20, 148);
                } else {
                    ctx.fillStyle = '#f0b84e';
                    ctx.fillText(`FORMATION ACTIVE // ${resolveStageCombatEvent(gameState.level, stageBriefing.missionType).toUpperCase()}`, 20, 148);
                }

                // Stage 101 shifts from subsystem destruction to a survival countdown after reactor breach.
                ctx.font = 'bold 14px Arial';
                if (gameState.level === 101) {
                    const destroyed = finalBossAssembly?.getDestroyedParts() ?? 0;
                    const outerDestroyed = finalBossAssembly?.getDestroyedOuterSystems() ?? 0;
                    ctx.fillStyle = finalBossAssembly?.isMeltdownActive() ? '#ff4d6d' : '#ffb000';
                    const archonReadout = finalBossAssembly?.isMeltdownActive()
                        ? `MELTDOWN COUNTDOWN: ${finalBossAssembly.getMeltdownRemaining().toFixed(1)}s  // SURVIVE`
                        : `OUTER SYSTEMS: ${outerDestroyed}/3  // TOTAL DESTROYED: ${destroyed}/6`;
                    ctx.fillText(archonReadout, 20, 122);
                } else {
                    const timeRemaining = gameState.getLevelTimeRemaining();
                    const timeMinutes = Math.floor(timeRemaining / 60);
                    const timeSeconds = Math.floor(timeRemaining % 60);
                    const timeDisplay = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;
                    ctx.fillText(`LEVEL TIME: ${timeDisplay}`, 20, 122);
                }
                ctx.fillText(`ENEMIES KILLED: ${gameState.enemiesDefeated}`, 20, 174);
                ctx.fillStyle = '#8ea9b4';
                ctx.font = '12px monospace';
                ctx.fillText('TEST CONTROLS: HOLD M 8s = CREDITS  •  L = STAGE JUMP', 20, 156);

                // Draw shield bar
                const barWidth = 150;
                const barHeight = 12;
                const barX = 20;
                const barY = 190;
                ctx.fillStyle = '#333333';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                const shieldPercent = player.shield / player.maxShield;
                ctx.fillStyle = 'rgb(0, ' + Math.floor(200 * shieldPercent) + ', 255)';
                ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);
                ctx.strokeStyle = '#00CCDD';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = '#00CCDD';
                ctx.font = '12px Arial';
                const shieldReadout = `Shield: ${Math.floor(player.shield)}/${player.maxShield}  •  +${player.shieldRegenRate.toFixed(1)}/s`;
                ctx.fillText(shieldReadout, barX + 160, barY + 10);

                // Draw power bar
                const powerBarY = 220;
                ctx.fillStyle = '#333333';
                ctx.fillRect(barX, powerBarY, barWidth, barHeight);
                const powerPercent = powerSystem.currentPower / powerSystem.getMaxPower();
                const reactorRecovering = powerSystem.isReactorRecovering();
                const powerColor = reactorRecovering
                    ? '#ff3b30'
                    : powerPercent > 0.5 ? 'rgb(255, ' + Math.floor(200 * powerPercent) + ', 0)' : 'rgb(255, 0, 0)';
                ctx.fillStyle = powerColor;
                ctx.fillRect(barX, powerBarY, barWidth * powerPercent, barHeight);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, powerBarY, barWidth, barHeight);
                ctx.fillStyle = reactorRecovering ? '#ff6b5f' : '#FFD700';
                const powerReadout = reactorRecovering
                    ? `REACTOR RECOVERY ${Math.floor(powerSystem.getReactorRecoveryPercent() * 100)}% // WEAPONS OFFLINE`
                    : 'Power: ' + Math.floor(powerSystem.currentPower) + '/' + Math.floor(powerSystem.getMaxPower());
                ctx.fillText(powerReadout, barX + 160, powerBarY + 10);

                const activeCoreProfile = elementalCoreSystem.getProfile(elementalCoreSystem.getActiveCore());
                const fixedElementWeapon = player.weaponType === 'arc' || player.weaponType === 'void_lance';
                const coreHudX = 744;
                const coreHudY = 38;
                const coreHudWidth = 432;
                const coreColor = fixedElementWeapon ? (player.weaponType === 'arc' ? '#f8ff79' : '#b06cff') : activeCoreProfile.color;
                ctx.fillStyle = 'rgba(4, 18, 36, 0.9)';
                ctx.fillRect(coreHudX, coreHudY, coreHudWidth, 48);
                ctx.strokeStyle = coreColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(coreHudX, coreHudY, coreHudWidth, 48);
                ctx.fillStyle = coreColor;
                ctx.font = 'bold 13px monospace';
                ctx.fillText(
                    fixedElementWeapon
                        ? `FIXED IDENTITY // ${player.weaponType === 'arc' ? 'ELECTRIC // CHAIN LIGHTNING' : 'VOID // BLACK HOLE'}`
                        : `ACTIVE CORE // ${activeCoreProfile.name.toUpperCase()} // RANK ${activeCoreProfile.rank}/5`,
                    coreHudX + 12,
                    coreHudY + 19
                );
                ctx.fillStyle = '#b8d4df';
                ctx.font = '11px monospace';
                ctx.fillText(fixedElementWeapon ? '1–5 STORE YOUR NEXT SWITCHABLE CORE' : '1 CRYO   2 FIRE   3 CORROSION   4 KINETIC   5 PLASMA', coreHudX + 12, coreHudY + 37);

                // Tactical ability readout: only the selected module can be armed at once.
                const abilityBarY = 250;
                const abilityUnlocked = tacticalAbilitySystem.isSystemUnlocked(shipSystem.getCurrentShipId());
                const selectedAbility = tacticalAbilitySystem.getCurrentAbility();
                const selectedStatus = tacticalAbilitySystem.getStatus(selectedAbility, shipSystem.getCurrentShipId());
                const abilityName = selectedAbility === TacticalAbilityType.TIME_LOCK
                    ? 'TIME LOCK'
                    : selectedAbility === TacticalAbilityType.VOID_ARMOR
                        ? 'VOID ARMOR'
                        : 'OVER POWER';
                const abilityPercent = tacticalAbilitySystem.getChargePercent();
                const abilityMeterHeight = 24;
                ctx.fillStyle = '#182432';
                ctx.fillRect(barX, abilityBarY, barWidth, abilityMeterHeight);
                ctx.fillStyle = tacticalAbilitySystem.isActive() ? '#ff6bff' : abilityUnlocked ? '#a66bff' : '#52606a';
                ctx.fillRect(barX, abilityBarY, barWidth * abilityPercent, abilityMeterHeight);
                ctx.strokeStyle = tacticalAbilitySystem.isActive() ? '#ffffff' : '#a66bff';
                ctx.strokeRect(barX, abilityBarY, barWidth, abilityMeterHeight);
                ctx.fillStyle = tacticalAbilitySystem.isActive() ? '#ffffff' : '#c59cff';
                ctx.font = 'bold 13px Arial';
                const abilityState = tacticalAbilitySystem.isActive()
                    ? `ACTIVE ${tacticalAbilitySystem.getActiveTimeRemaining().toFixed(1)}s`
                    : !abilityUnlocked
                        ? 'LOCKED: DESTROYER'
                        : selectedStatus.level <= 0
                            ? 'INSTALL IN SHOP'
                            : tacticalAbilitySystem.isChargeFull()
                                ? 'READY [E]'
                                : 'CHARGING';
                const storedUses = tacticalAbilitySystem.getStoredUses();
                const cartridgeCapacity = tacticalAbilitySystem.getMagazineCapacity();
                ctx.fillText(`${abilityName}  •  ${abilityState}`, barX + 8, abilityBarY + 16);
                ctx.fillStyle = '#f0d5ff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(`CHARGE ${Math.floor(tacticalAbilitySystem.getCharge())}/${tacticalAbilitySystem.getMaxCharge()}  •  CARTRIDGES ${storedUses}/${cartridgeCapacity}`, barX + 8, abilityBarY + 42);
                if (performance.now() < testNoticeUntil) {
                    ctx.fillStyle = '#ffcf5a';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillText(testNoticeText, barX + 160, abilityBarY + 56);
                }
                drawContactPanel(ctx);

                // Level complete shop screen: two-column layout with mouse hitboxes.
                if (showBranchModal) {
                    shopHitboxes.length = 0;
                    ctx.fillStyle = 'rgba(2, 6, 20, 0.98)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);
                    const branchCanvasWidth = game.getCanvas().width;
                    const addButton = (id: string, x: number, y: number, width: number, height: number, action: () => void): void => {
                        shopHitboxes.push({ id, x, y, width, height, action });
                    };
                    const drawButton = (id: string, label: string, x: number, y: number, width: number, height: number, color: string, action: () => void): void => {
                        const isHovered = hoveredShopItem === id;
                        ctx.fillStyle = isHovered ? '#173c4b' : '#0b1e2d';
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = isHovered ? '#ffffff' : color;
                        ctx.lineWidth = isHovered ? 2 : 1;
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillStyle = color;
                        ctx.font = 'bold 15px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, x + width / 2, y + height / 2 + 4);
                        addButton(id, x, y, width, height, action);
                    };

                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 40px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`CHAPTER ${CampaignSystem.getChapterNumber(gameState.level)} COMPLETED`, branchCanvasWidth / 2, 80);

                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText('Choose Your Sector Route Strategy', branchCanvasWidth / 2, 120);

                    const routes = BranchSystem.getAvailableBranches(CampaignSystem.getChapterNumber(gameState.level));
                    const routeColors: Record<string, string> = {
                        direct: '#ff5c5c',
                        stealth: '#a78bfa',
                        convoy: '#f59e0b',
                        command: '#22d3ee'
                    };
                    const routeLabels: Record<string, string> = {
                        direct: 'HIGH PRESSURE',
                        stealth: 'HAZARD CORRIDOR',
                        convoy: 'ARMORED TARGETS',
                        command: 'ELITE COMMAND'
                    };

                    routes.forEach((route, index) => {
                        const boxX = 48 + index * 372;
                        const boxY = 164;
                        const boxWidth = 340;
                        const boxHeight = 156;
                        const accent = routeColors[route.id] ?? '#00FF88';
                        const isCardHovered = hoveredShopItem === `branch-${route.id}` || hoveredShopItem === `branch-action-${route.id}`;
                        const pulse = 0.5 + Math.sin(performance.now() * 0.004 + index) * 0.5;
                        const difficulty = Math.round(route.difficultyMultiplier * 100);
                        const reward = Math.round((route.rewardMultiplier - 1) * 100);

                        ctx.save();
                        ctx.fillStyle = isCardHovered ? '#102b3b' : '#071624';
                        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

                        const cardGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
                        cardGradient.addColorStop(0, isCardHovered ? `${accent}22` : `${accent}0d`);
                        cardGradient.addColorStop(1, '#030812');
                        ctx.fillStyle = cardGradient;
                        ctx.fillRect(boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4);

                        ctx.strokeStyle = isCardHovered ? accent : `${accent}88`;
                        ctx.lineWidth = isCardHovered ? 3 : 1.5;
                        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                        ctx.fillStyle = accent;
                        ctx.globalAlpha = isCardHovered ? 0.75 + pulse * 0.25 : 0.7;
                        ctx.fillRect(boxX, boxY, boxWidth, 6);
                        ctx.globalAlpha = 1;

                        // Tactical route emblem.
                        ctx.strokeStyle = accent;
                        ctx.fillStyle = `${accent}33`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        if (route.id === 'stealth') {
                            ctx.arc(boxX + 34, boxY + 40, 18, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(boxX + 20, boxY + 47);
                            ctx.lineTo(boxX + 48, boxY + 33);
                            ctx.stroke();
                        } else if (route.id === 'convoy') {
                            ctx.rect(boxX + 18, boxY + 24, 32, 32);
                            ctx.fill();
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(boxX + 25, boxY + 40);
                            ctx.lineTo(boxX + 43, boxY + 40);
                            ctx.stroke();
                        } else if (route.id === 'command') {
                            ctx.moveTo(boxX + 34, boxY + 20);
                            ctx.lineTo(boxX + 52, boxY + 40);
                            ctx.lineTo(boxX + 34, boxY + 60);
                            ctx.lineTo(boxX + 16, boxY + 40);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
                        } else {
                            ctx.moveTo(boxX + 34, boxY + 20);
                            ctx.lineTo(boxX + 52, boxY + 56);
                            ctx.lineTo(boxX + 16, boxY + 56);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
                        }

                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#7f9dad';
                        ctx.font = 'bold 13px monospace';
                        ctx.fillText(`ROUTE ${index + 1} // ${routeLabels[route.id] ?? 'TACTICAL OPTION'}`, boxX + 72, boxY + 27);
                        ctx.fillStyle = '#f4fbff';
                        ctx.font = 'bold 17px Arial';
                        ctx.fillText(route.title, boxX + 72, boxY + 52);

                        ctx.fillStyle = '#c5d6dc';
                        ctx.font = '15px Arial';
                        drawWrappedText(ctx, route.description, boxX + 20, boxY + 88, boxWidth - 40, 16, 5);

                        ctx.fillStyle = '#89a4ae';
                        ctx.font = 'bold 13px monospace';
                        ctx.fillText('TACTICAL PROFILE', boxX + 20, boxY + 166);
                        ctx.fillStyle = '#283f4c';
                        ctx.fillRect(boxX + 20, boxY + 178, boxWidth - 40, 8);
                        ctx.fillStyle = '#ef4444';
                        ctx.fillRect(boxX + 20, boxY + 178, Math.min(1, route.difficultyMultiplier / 1.5) * (boxWidth - 40), 8);
                        ctx.fillStyle = '#89a4ae';
                        ctx.fillText(`THREAT ${difficulty}%`, boxX + 20, boxY + 204);
                        ctx.fillText(`REWARD +${reward}%`, boxX + 178, boxY + 204);

                        ctx.fillStyle = '#283f4c';
                        ctx.fillRect(boxX + 20, boxY + 214, boxWidth - 40, 8);
                        ctx.fillStyle = '#facc15';
                        ctx.fillRect(boxX + 20, boxY + 214, Math.min(1, route.rewardMultiplier / 2) * (boxWidth - 40), 8);

                        const chooseRoute = () => {
                            currentBranchRoute = route;
                            showBranchModal = false;
                            gameState.nextLevel();
                            persistAutosave('AUTOSAVE // ROUTE CONFIRMED');
                            stageBriefing = CampaignSystem.getStageBriefing(gameState.level, gameplayLangRef.current);
                            inMissionCommsTriggered = false;
                            activeContactLine = stageBriefing.contact;
                            MissionArchiveSystem.recordBriefing(stageBriefing, false);
                            openStageBriefing();
                            stageFailureReason = null;
                            upgradeBriefing = CampaignSystem.getUpgradeBriefing('weapon', 'Straight Shot', 1);
                            bossSpawnedForLevel = false;
                            bossDefeatedAt = null;
                        };

                        shopHitboxes.push({
                            id: `branch-${route.id}`,
                            x: boxX,
                            y: boxY,
                            width: boxWidth,
                            height: boxHeight,
                            action: chooseRoute
                        });

                        drawButton(`branch-action-${route.id}`, isCardHovered ? 'CONFIRM ROUTE  >>' : 'SELECT ROUTE', boxX + 20, boxY + 248, boxWidth - 40, 34, accent, chooseRoute);
                        ctx.restore();
                    });
                    return;
                }

                if (showCommsModal) {
                    shopHitboxes.length = 0;
                    const canvasWidth = game.getCanvas().width;
                    const canvasHeight = game.getCanvas().height;
                    const isRightToLeft = gameplayLangRef.current === 'he';
                    const dialogueFont = gameplayLangRef.current === 'ja'
                        ? '"Yu Gothic", "Noto Sans JP", Arial, sans-serif'
                        : gameplayLangRef.current === 'zh'
                            ? '"Microsoft YaHei", "Noto Sans SC", Arial, sans-serif'
                            : 'Arial, sans-serif';
                    const addButton = (id: string, x: number, y: number, width: number, height: number, action: () => void): void => {
                        shopHitboxes.push({ id, x, y, width, height, action });
                    };
                    const drawButton = (id: string, label: string, x: number, y: number, width: number, height: number, color: string, action: () => void): void => {
                        const isHovered = hoveredShopItem === id;
                        ctx.fillStyle = isHovered ? 'rgba(31, 91, 104, 0.96)' : 'rgba(7, 27, 45, 0.96)';
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = isHovered ? '#ffffff' : color;
                        ctx.lineWidth = isHovered ? 3 : 2;
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillStyle = color;
                        ctx.font = `bold 18px ${dialogueFont}`;
                        ctx.textAlign = 'center';
                        ctx.fillText(label, x + width / 2, y + height / 2 + 6);
                        addButton(id, x, y, width, height, action);
                    };

                    ctx.fillStyle = 'rgba(1, 8, 20, 0.985)';
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                    const gridColor = 'rgba(82, 217, 255, 0.055)';
                    ctx.strokeStyle = gridColor;
                    ctx.lineWidth = 1;
                    for (let x = 0; x <= canvasWidth; x += 48) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, canvasHeight);
                        ctx.stroke();
                    }
                    for (let y = 0; y <= canvasHeight; y += 48) {
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(canvasWidth, y);
                        ctx.stroke();
                    }

                    const dialogueLines = stageBriefing.dialogueSequence ?? [{ speaker: stageBriefing.contact.speaker, name: stageBriefing.contact.name, message: stageBriefing.contact.message }];
                    const activeLine = dialogueLines[Math.min(commsParagraphIndex, dialogueLines.length - 1)];
                    const accentColor = activeLine.speaker === 'sera' ? '#ff8a9c' : activeLine.speaker === 'ghost' ? '#d6a5ff' : '#72ffe1';
                    const alertColor = activeLine.speaker === 'sera' ? '#ff6b6b' : '#00d9b5';
                    const panelX = 42;
                    const panelY = 122;
                    const panelWidth = canvasWidth - 84;
                    const panelHeight = 576;
                    const portraitSize = 150;
                    const contentX = panelX + 204;
                    const contentRight = panelX + panelWidth - 34;
                    const contentWidth = contentRight - contentX;

                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#52d9ff';
                    ctx.font = 'bold 15px "Space Mono", monospace';
                    ctx.fillText('INCOMING // PRIORITY MISSION COMMUNICATION', panelX, 40);
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#9bb8c5';
                    ctx.font = 'bold 14px "Space Mono", monospace';
                    ctx.fillText(`STAGE ${String(gameState.level).padStart(3, '0')}  •  CHAPTER ${stageBriefing.chapter}`, canvasWidth - panelX, 40);
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#f6ffff';
                    ctx.font = `bold 32px ${dialogueFont}`;
                    ctx.fillText(stageBriefing.title, canvasWidth / 2, 82);
                    ctx.fillStyle = '#f4c66a';
                    ctx.font = `bold 16px ${dialogueFont}`;
                    ctx.fillText(`${stageBriefing.operationCode}  //  ${stageBriefing.location}`, canvasWidth / 2, 108);

                    ctx.fillStyle = 'rgba(5, 23, 43, 0.97)';
                    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                    ctx.strokeStyle = alertColor;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
                    ctx.fillStyle = accentColor;
                    ctx.fillRect(panelX, panelY, 7, panelHeight);
                    ctx.fillStyle = 'rgba(82, 217, 255, 0.12)';
                    ctx.fillRect(panelX + 24, panelY + 28, 156, portraitSize + 48);
                    ctx.strokeStyle = accentColor;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(panelX + 24, panelY + 28, 156, portraitSize + 48);
                    drawPortrait(ctx, activeLine.speaker, panelX + 27, panelY + 31, portraitSize);
                    ctx.textAlign = 'center';
                    ctx.fillStyle = accentColor;
                    ctx.font = 'bold 13px "Space Mono", monospace';
                    ctx.fillText('OPEN COMMS', panelX + 102, panelY + 205);
                    ctx.fillStyle = '#8da9b8';
                    ctx.font = 'bold 12px "Space Mono", monospace';
                    ctx.fillText(`LINE ${commsParagraphIndex + 1} OF ${dialogueLines.length}`, panelX + 102, panelY + 228);

                    ctx.textAlign = isRightToLeft ? 'right' : 'left';
                    const alignedContentX = isRightToLeft ? contentRight : contentX;
                    ctx.fillStyle = accentColor;
                    ctx.font = `bold 28px ${dialogueFont}`;
                    ctx.fillText(activeLine.name, alignedContentX, panelY + 66);
                    ctx.fillStyle = '#f4c66a';
                    ctx.font = 'bold 15px "Space Mono", monospace';
                    ctx.fillText(isRightToLeft ? 'ערוץ מוצפן // תקשורת מאובטחת' : 'ENCRYPTED CHANNEL // SECURE COMMS', alignedContentX, panelY + 94);
                    ctx.strokeStyle = 'rgba(114, 255, 225, 0.28)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(contentX, panelY + 118);
                    ctx.lineTo(contentRight, panelY + 118);
                    ctx.stroke();

                    ctx.fillStyle = '#f2f8fb';
                    ctx.font = `22px ${dialogueFont}`;
                    drawWrappedText(ctx, activeLine.message, alignedContentX, panelY + 158, contentWidth, 31, 6);

                    const objectiveY = panelY + 372;
                    const objectiveHeight = 142;
                    ctx.fillStyle = 'rgba(7, 36, 50, 0.92)';
                    ctx.fillRect(contentX, objectiveY, contentWidth, objectiveHeight);
                    ctx.strokeStyle = 'rgba(82, 217, 255, 0.55)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(contentX, objectiveY, contentWidth, objectiveHeight);
                    ctx.fillStyle = '#00ff88';
                    ctx.fillRect(contentX, objectiveY, 5, objectiveHeight);
                    ctx.textAlign = isRightToLeft ? 'right' : 'left';
                    ctx.fillStyle = '#00ff88';
                    ctx.font = 'bold 15px "Space Mono", monospace';
                    ctx.fillText(isRightToLeft ? 'יעד המשימה' : 'MISSION OBJECTIVE', alignedContentX, objectiveY + 30);
                    ctx.fillStyle = '#f5ffff';
                    ctx.font = `bold 18px ${dialogueFont}`;
                    drawWrappedText(ctx, stageBriefing.objective, alignedContentX, objectiveY + 59, contentWidth - 26, 25, 2);
                    const commsHazard = getStageHazardBrief(gameState.level, stageBriefing.missionType);
                    ctx.fillStyle = '#9bc7d8';
                    ctx.font = `15px ${dialogueFont}`;
                    const intelLine = isRightToLeft
                        ? `מטרה: ${stageBriefing.missionTargetName}  •  סיכון: ${commsHazard.name}`
                        : `TARGET: ${stageBriefing.missionTargetName}  •  HAZARD: ${commsHazard.name}`;
                    ctx.fillText(intelLine, alignedContentX, objectiveY + 119);

                    const buttonY = 732;
                    const nextLabel = commsParagraphIndex < dialogueLines.length - 1
                        ? 'ENTER // NEXT TRANSMISSION'
                        : 'ENTER // CONFIRM & LAUNCH';
                    drawButton('comms-next', nextLabel, panelX, buttonY, panelWidth - 274, 66, '#00ff88', advanceBriefing);
                    drawButton('comms-skip', 'ESC // SKIP BRIEFING', panelX + panelWidth - 250, buttonY, 250, 66, '#75d8e7', () => {
                        startStagePlay();
                    });
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#8da9b8';
                    ctx.font = 'bold 13px "Space Mono", monospace';
                    ctx.fillText('ENTER ADVANCES MESSAGE  •  ESC LAUNCHES MISSION  •  CLICK ANY LARGE COMMAND', canvasWidth / 2, 838);
                    return;
                }

                if (gameState.showLevelScreen) {
                    shopHitboxes.length = 0;
                    ctx.fillStyle = 'rgba(2, 6, 20, 0.96)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                    if (gameState.level === 101 && shopScreen === 'finale_victory') {
                        const canvasWidth = game.getCanvas().width;
                        const canvasHeight = game.getCanvas().height;
                        const addButton = (id: string, x: number, y: number, width: number, height: number, action: () => void): void => {
                            shopHitboxes.push({ id, x, y, width, height, action });
                        };
                        const drawButton = (id: string, label: string, x: number, y: number, width: number, height: number, color: string, action: () => void): void => {
                            const isHovered = hoveredShopItem === id;
                            ctx.fillStyle = isHovered ? '#173c4b' : '#0b1e2d';
                            ctx.fillRect(x, y, width, height);
                            ctx.strokeStyle = isHovered ? '#ffffff' : color;
                            ctx.lineWidth = isHovered ? 2 : 1;
                            ctx.strokeRect(x, y, width, height);
                            ctx.fillStyle = color;
                            ctx.font = 'bold 16px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(label, x + width / 2, y + height / 2 + 6);
                            addButton(id, x, y, width, height, action);
                        };

                        const activeLanguage = gameplayLangRef.current;
                        const isHebrew = activeLanguage === 'he';
                        const finaleCopy = getEpilogueInterfaceCopy(activeLanguage);
                        const epilogueScenes = getEpilogueScenes(activeLanguage);
                        const sceneIndex = finaleSceneIndex % epilogueScenes.length;
                        const currentScene = epilogueScenes[sceneIndex];
                        const currentImage = epilogueImages[currentScene.id];
                        const textX = isHebrew ? canvasWidth - 76 : 76;
                        const textWidth = 500;
                        const imageX = isHebrew ? 76 : canvasWidth - 526;
                        const imageY = 158;
                        const imageWidth = 450;
                        const imageHeight = 410;

                        ctx.save();
                        ctx.fillStyle = '#00FF88';
                        ctx.font = 'bold 40px Arial';
                        ctx.textAlign = 'center';
                        ctx.direction = 'ltr';
                        ctx.fillText(finaleCopy.campaignComplete, canvasWidth / 2, 60);
                        ctx.fillStyle = '#FFD700';
                        ctx.font = 'bold 17px Arial';
                        ctx.fillText(finaleCopy.lead, canvasWidth / 2, 94);

                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(60, 118, canvasWidth - 120, 490);
                        ctx.strokeStyle = '#75d8e7';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(60, 118, canvasWidth - 120, 490);
                        ctx.fillStyle = '#75d8e7';
                        ctx.font = 'bold 15px Arial';
                        ctx.textAlign = isHebrew ? 'right' : 'left';
                        ctx.direction = isHebrew ? 'rtl' : 'ltr';
                        ctx.fillText(finaleCopy.archive, textX, 146);
                        ctx.fillStyle = '#8da8b5';
                        ctx.font = '12px Arial';
                        ctx.textAlign = isHebrew ? 'left' : 'right';
                        ctx.fillText(`${sceneIndex + 1} / ${epilogueScenes.length}`, isHebrew ? 76 : canvasWidth - 76, 146);

                        ctx.fillStyle = '#0a1a29';
                        ctx.fillRect(imageX - 4, imageY - 4, imageWidth + 8, imageHeight + 8);
                        ctx.strokeStyle = '#c084fc';
                        ctx.strokeRect(imageX - 4, imageY - 4, imageWidth + 8, imageHeight + 8);
                        if (currentImage?.complete && currentImage.naturalWidth > 0) {
                            const sourceRatio = currentImage.naturalWidth / currentImage.naturalHeight;
                            const targetRatio = imageWidth / imageHeight;
                            let sourceX = 0;
                            let sourceY = 0;
                            let sourceWidth = currentImage.naturalWidth;
                            let sourceHeight = currentImage.naturalHeight;
                            if (sourceRatio > targetRatio) {
                                sourceWidth = currentImage.naturalHeight * targetRatio;
                                sourceX = (currentImage.naturalWidth - sourceWidth) / 2;
                            } else {
                                sourceHeight = currentImage.naturalWidth / targetRatio;
                                sourceY = (currentImage.naturalHeight - sourceHeight) / 2;
                            }
                            ctx.drawImage(currentImage, sourceX, sourceY, sourceWidth, sourceHeight, imageX, imageY, imageWidth, imageHeight);
                        } else {
                            ctx.fillStyle = '#102c3e';
                            ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
                        }

                        ctx.textAlign = isHebrew ? 'right' : 'left';
                        ctx.direction = isHebrew ? 'rtl' : 'ltr';
                        ctx.fillStyle = '#f4c66a';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(currentScene.characterName, textX, 188);
                        ctx.fillStyle = '#f2f8fb';
                        ctx.font = 'bold 27px Arial';
                        ctx.fillText(currentScene.title, textX, 225);
                        ctx.strokeStyle = 'rgba(114, 255, 225, 0.35)';
                        ctx.beginPath();
                        ctx.moveTo(isHebrew ? textX - textWidth : textX, 244);
                        ctx.lineTo(isHebrew ? textX : textX + textWidth, 244);
                        ctx.stroke();
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '18px Arial';
                        drawWrappedText(ctx, currentScene.body[0], textX, 280, textWidth, 27, 4);
                        ctx.fillStyle = '#b8d4df';
                        ctx.font = '17px Arial';
                        drawWrappedText(ctx, currentScene.body[1], textX, 420, textWidth, 26, 4);
                        ctx.restore();

                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(60, 626, canvasWidth - 120, 94);
                        ctx.strokeStyle = '#c084fc';
                        ctx.strokeRect(60, 626, canvasWidth - 120, 94);
                        ctx.fillStyle = '#c084fc';
                        ctx.font = 'bold 15px Arial';
                        ctx.textAlign = isHebrew ? 'right' : 'left';
                        ctx.direction = isHebrew ? 'rtl' : 'ltr';
                        ctx.fillText(finaleCopy.credits, isHebrew ? canvasWidth - 85 : 85, 656);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '13px Arial';
                        ctx.fillText(finaleCopy.creditsLine, isHebrew ? canvasWidth - 85 : 85, 684);
                        ctx.fillText(finaleCopy.closingLine, isHebrew ? canvasWidth - 85 : 85, 706);

                        drawButton('finale-previous', finaleCopy.previous, 90, 750, 180, 52, '#75d8e7', () => {
                            finaleSceneIndex = (finaleSceneIndex + epilogueScenes.length - 1) % epilogueScenes.length;
                        });
                        drawButton('finale-next', finaleCopy.next, canvasWidth - 270, 750, 180, 52, '#75d8e7', () => {
                            finaleSceneIndex = (finaleSceneIndex + 1) % epilogueScenes.length;
                        });
                        drawButton('finale-return', finaleCopy.returnToTitle, canvasWidth / 2 - 190, 750, 380, 52, '#00FF88', () => {
                            returnToTitle();
                            shopScreen = 'hub';
                        });
                        return;
                    }

                    const canvasWidth = game.getCanvas().width;
                    const canvasHeight = game.getCanvas().height;
                    const addButton = (id: string, x: number, y: number, width: number, height: number, action: () => void): void => {
                        shopHitboxes.push({ id, x, y, width, height, action });
                    };
                    const drawButton = (id: string, label: string, x: number, y: number, width: number, height: number, color: string, action: () => void): void => {
                        const isHovered = hoveredShopItem === id;
                        ctx.fillStyle = isHovered ? '#173c4b' : '#0b1e2d';
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = isHovered ? '#ffffff' : color;
                        ctx.lineWidth = isHovered ? 2 : 1;
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillStyle = color;
                        ctx.font = 'bold 15px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, x + width / 2, y + height / 2 + 4);
                        addButton(id, x, y, width, height, action);
                    };
                    const drawCard = (x: number, y: number, width: number, height: number, title: string, accent: string): void => {
                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = accent;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillStyle = accent;
                        ctx.fillRect(x, y, width, 3);
                        ctx.textAlign = 'left';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(title, x + 16, y + 28);
                    };

                    // Top header summary & multi-language picker
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 22px Arial';
                    ctx.fillText(`PROTECT THE STARSHIP // STAGE ${gameState.level} READY ROOM`, 28, 44);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Available Credits: ${gameState.score}`, 28, 72);

                    const secretWeaponUnlocked = weaponSystem.isSecretWeaponUnlocked();
                    const secretWeaponFragments = weaponSystem.getSecretWeaponFragments();
                    const drawShopNav = (active: ShopScreen): void => {
                        const navY = 96;
                        const navWidth = 142;
                        const navGap = 10;
                        const navItems: Array<{ id: ShopScreen; label: string; color: string }> = [
                            { id: 'hub', label: 'CONTROL DECK', color: '#00CCDD' },
                            { id: 'weapons', label: 'WEAPON BAY', color: '#00FF88' },
                            { id: 'elements', label: 'ELEMENT CORES', color: '#b5f58a' },
                            { id: 'systems', label: 'HULL SYSTEMS', color: '#FFD166' },
                            { id: 'abilities', label: 'TACTICAL OPS', color: '#c59cff' },
                            { id: 'pilot_skills', label: 'PILOT SKILLS', color: '#38bdf8' },
                            { id: 'equipment', label: 'EQUIPMENT BAY', color: '#f43f5e' }
                        ];
                        navItems.forEach((item, index) => {
                            const x = 28 + index * (navWidth + navGap);
                            const isActive = active === item.id;
                            drawButton(`shop-nav-${item.id}`, isActive ? `● ${item.label}` : item.label, x, navY, navWidth, 42, isActive ? '#ffffff' : item.color, () => {
                                shopScreen = item.id;
                                hoveredShopItem = null;
                            });
                        });
                        // Manual saves are a Ready Room action only, but must be visible
                        // regardless of which upgrade bay the pilot is currently inspecting.
                        drawButton('shop-save-progress', 'SAVE PROGRESS', 786, 24, 184, 42, '#c59cff', openBetweenStageSave);
                    };

                    const drawShopFooter = (backLabel = 'BACK TO CONTROL DECK'): void => {
                        drawButton('shop-back', backLabel, 28, 820, 250, 52, '#75d8e7', () => {
                            shopScreen = 'hub';
                            hoveredShopItem = null;
                        });
                        const launchLabel = stageFailureReason
                            ? 'RETRY MISSION  [ENTER]'
                            : initialLaunchPending
                                ? `${resumeData ? `CONTINUE FROM STAGE ${gameState.level}` : 'INITIATE NEW LAUNCH'}  [ENTER]`
                                : 'CONTINUE TO NEXT LEVEL  [ENTER]';
                        drawButton('shop-continue', launchLabel, 310, 820, 462, 52, stageFailureReason ? '#ff9b9b' : '#00FF88', advanceFromShop);
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#7996a4';
                        ctx.font = '13px monospace';
                        ctx.fillText('ESC: control deck  •  mouse: navigate and purchase  •  credits remain shared across all bays', 28, 910);
                    };

                if (showAfterActionModal) {
                    ctx.fillStyle = 'rgba(2, 6, 20, 0.95)';
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                    const boxX = 64;
                    const boxY = 220;
                    const boxWidth = canvasWidth - 128;
                    const boxHeight = 400;

                    ctx.fillStyle = '#06121e';
                    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                    ctx.strokeStyle = '#f0b84e';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#FFD166';
                    ctx.font = 'bold 30px Arial';
                    ctx.fillText(stageBriefing.stage === 31 ? 'STAGE 31 // PILOT TRIAL OUTCOME' : `STAGE ${gameState.level} // FLIGHT REPORT`, canvasWidth / 2, boxY - 40);

                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 18px monospace';
                    ctx.fillText(stageBriefing.stage === 31
                        ? (seraDuelOutcome === 'win' ? 'SERA DUEL // VICTORY CONFIRMED' : 'SERA DUEL // TRIAL COMPLETE // CONTINUATION AUTHORIZED')
                        : `STAGE ${gameState.level} COMPLETE // PERFORMANCE ANALYSIS`, boxX + 48, boxY + 62);

                    const performance = lastStagePerformanceXp;
                    const telemetry = lastStageMasteryResult?.telemetry;
                    if (performance && telemetry) {
                        ctx.fillStyle = '#75d8e7';
                        ctx.font = 'bold 14px monospace';
                        ctx.fillText(`XP +${performance.totalXp}  //  KILLS ${telemetry.enemiesDefeated}/${telemetry.enemiesSpawned}  //  ELIMINATION ${telemetry.eliminationPercent.toFixed(0)}%`, boxX + 48, boxY + 108);
                        ctx.fillText(`SHIELD HITS ${telemetry.shieldHits}  //  SHIELD DMG ${telemetry.shieldDamageAbsorbed.toFixed(1)}  //  HULL DMG ${telemetry.hullDamageTaken.toFixed(1)}`, boxX + 48, boxY + 136);
                        ctx.fillStyle = performance.superBonusPercent > 0 ? '#ff77e8' : performance.noHit ? '#00ff88' : '#ffd166';
                        ctx.fillText(performance.superBonusPercent > 0 ? 'SUPER BONUS +50%  //  NO HIT +30%  //  CLEAN SWEEP +30%' : performance.noHit ? 'NO HIT BONUS +30%' : performance.fullClear ? 'CLEAN SWEEP BONUS +30%' : 'PERFORMANCE DATA RECORDED', boxX + 48, boxY + 164);
                    }

                    ctx.fillStyle = '#8ea6b2';
                    ctx.font = '15px monospace';
                    ctx.fillText('FLIGHT DATA ARCHIVED // READY ROOM SYSTEMS AVAILABLE', boxX + 48, boxY + 210);

                    drawButton('after-action-continue', 'PROCEED TO CONTROL DECK  [ENTER]', boxX + 28, boxY + 310, boxWidth - 56, 52, '#00FF88', () => {
                        showAfterActionModal = false;
                    });
                    return;
                }

                if (shopScreen === 'hub') {
                        drawShopNav('hub');
                        const stageEvent = resolveStageCombatEvent(gameState.level, stageBriefing.missionType);
                        const eventInfo = getExpectedEventInfo(gameState.level, stageBriefing.missionType, stageEvent);

                        drawCard(28, 156, 944, 570, `MISSION BRIEFING // ${stageBriefing.operationCode.toUpperCase()}`, '#00CCDD');
                        if (lastStagePerformanceXp && lastStageMasteryResult) {
                            const report = lastStagePerformanceXp;
                            const telemetry = lastStageMasteryResult.telemetry;
                            drawCard(52, 180, 896, 132, `FLIGHT REPORT // STAGE ${telemetry.level} // +${report.totalXp} XP`, report.superBonusPercent > 0 ? '#ff77e8' : '#38bdf8');
                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = 'bold 14px monospace';
                            ctx.fillText(`BASE ${report.baseXp}  •  ELIMINATION ${telemetry.eliminationPercent.toFixed(0)}%  •  DAMAGE ${report.damagePercent.toFixed(1)}%`, 72, 234);
                            ctx.fillStyle = report.fullClear ? '#00ff88' : '#ffd166';
                            ctx.fillText(`${report.fullClear ? 'CLEAN SWEEP +30%' : report.eliminationBonusPercent > 0 ? 'HIGH ELIMINATION +10%' : 'ELIMINATION BONUS LOST'}`, 72, 262);
                            ctx.fillStyle = report.noHit ? '#00ff88' : '#8ea4b2';
                            ctx.fillText(`${report.noHit ? 'NO HIT +30%' : report.survivalBonusPercent > 0 ? `LOW DAMAGE +${report.survivalBonusPercent}%` : 'SURVIVAL BONUS LOST'}`, 370, 262);
                            ctx.fillStyle = report.superBonusPercent > 0 ? '#ff77e8' : '#526874';
                            ctx.fillText(report.superBonusPercent > 0 ? 'SUPER BONUS +50%' : 'SUPER BONUS // REQUIRE NO HIT + CLEAN SWEEP', 610, 262);
                        }
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#FFD166';
                        ctx.font = 'bold 20px Arial';
                        ctx.fillText(stageBriefing.title, 52, 344);
                        ctx.fillStyle = '#75d8e7';
                        ctx.font = '15px monospace';
                        ctx.fillText(`LOCATION: ${stageBriefing.location}`, 52, 370);
                        ctx.fillText(`MISSION TYPE: ${stageBriefing.missionType.toUpperCase()}`, 52, 394);
                        const deckHazard = getStageHazardBrief(gameState.level, stageBriefing.missionType);
                        ctx.fillStyle = '#f0b84e';
                        ctx.fillText(`FIELD HAZARD: ${deckHazard.name}`, 52, 418);
                        ctx.fillStyle = '#c59cff';
                        ctx.font = 'bold 15px monospace';
                        ctx.fillText(`EXPECTED EVENT: ${eventInfo.name}`, 52, 482);
                        ctx.fillStyle = '#b7cdd6';
                        ctx.font = '13px Arial';
                        drawWrappedText(ctx, `${eventInfo.desc}  ${deckHazard.detail}`, 52, 506, 890, 16, 2);

                        ctx.fillStyle = '#00FF88';
                        ctx.font = 'bold 15px monospace';
                        ctx.fillText(`PRIMARY OBJECTIVE: ${stageBriefing.missionTargetName}`, 52, 570);
                        ctx.fillText(`BOUNTY: +${Math.floor(stageBriefing.bountyReward * COMBAT_REWARD_MULTIPLIER)} CREDITS`, 52, 596);

                        ctx.fillStyle = '#FFD166';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(`AVAILABLE CREDITS  ${gameState.score}`, 680, 684);
                        drawButton('hub-continue', stageFailureReason ? 'RETRY MISSION  [ENTER]' : 'CONTINUE TO NEXT LEVEL  [ENTER]', 290, 752, 280, 56, stageFailureReason ? '#ff9b9b' : '#00FF88', advanceFromShop);
                        drawButton('hub-stagemap', 'STAGE MAP 01-100', 585, 752, 180, 56, '#38bdf8', () => {
                            setShowStageMapModal(true);
                        });
                        drawButton('hub-main-menu', 'MAIN MENU', 780, 752, 172, 56, '#c59cff', returnToTitle);
                        ctx.fillStyle = '#7996a4';
                        ctx.font = '13px monospace';
                        ctx.fillText('Select a bay above to upgrade armaments, hull systems, or tactical ops.', 242, 840);

                        return;
                    }

                    drawShopNav(shopScreen);

                    if (shopScreen === 'elements') {
                        drawCard(28, 156, 1144, 650, 'ELEMENT CORE BAY // SWITCH IN FLIGHT WITH 1–5', '#b5f58a');
                        const descriptions: Record<ElementalCoreType, string> = {
                            cryo: 'Slow movement; bosses receive a reduced slow.',
                            fire: 'Refreshes a burning damage-over-time effect.',
                            corrosion: 'Breaches armor with bonus impact damage.',
                            kinetic: 'Pushes targets away from the impact lane.',
                            plasma: 'Creates a short-range rupture around the target.'
                        };
                        elementalCoreSystem.getAllProfiles().forEach((profile, index) => {
                            const y = 206 + index * 108;
                            const active = elementalCoreSystem.getActiveCore() === profile.id;
                            drawCard(52, y, 1092, 88, `${index + 1} // ${profile.name} CORE // RANK ${profile.rank}/5`, active ? '#ffffff' : profile.color);
                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = '14px Arial';
                            ctx.textAlign = 'left';
                            ctx.fillText(descriptions[profile.id], 72, y + 54);
                            const nextLabel = profile.nextCost === null ? 'MAX RANK' : `UPGRADE  ${profile.nextCost} CREDITS`;
                            const canUpgrade = profile.nextCost !== null && gameState.score >= profile.nextCost;
                            drawButton(`element-select-${profile.id}`, active ? 'ACTIVE' : 'SET ACTIVE', 760, y + 24, 128, 38, active ? '#ffffff' : profile.color, () => elementalCoreSystem.selectCore(profile.id));
                            drawButton(`element-upgrade-${profile.id}`, nextLabel, 904, y + 24, 210, 38, profile.nextCost === null ? '#00FF88' : (canUpgrade ? profile.color : '#ff6666'), () => upgradeElementalCore(profile.id));
                        });
                        ctx.fillStyle = '#8ea6b2';
                        ctx.font = '13px Arial';
                        ctx.fillText('Black Hole and Chain Lightning have fixed identities: they do not consume or replace the active core.', 52, 760);
                        drawShopFooter();
                    }

                    if (shopScreen === 'pilot_skills') {
                        drawCard(28, 156, 1144, 920, 'PILOT SPECIALIZATION // SURVIVAL • REACTOR • COMBAT', '#38bdf8');
                        const rank = pilotSkillSystem.getRank();
                        const xp = pilotSkillSystem.getXP();
                        const nextXp = pilotSkillSystem.getNextRankXpRequirement();
                        const points = pilotSkillSystem.getSkillPoints();

                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#38bdf8';
                        ctx.font = 'bold 17px Arial';
                        ctx.fillText(`PILOT RANK ${rank}/${PilotSkillSystem.MAX_RANK}  •  AVAILABLE SKILL POINTS: ${points}`, 52, 202);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '12px Arial';
                        ctx.fillText(pilotSkillSystem.isMaxRank() ? 'MAXIMUM PILOT RANK // SPECIALIZE YOUR BUILD' : `Experience: ${xp} / ${nextXp} XP to next rank. One rank earns one skill point.`, 52, 224);

                        drawButton('pilot-respec', 'RESET BUILD // REFUND POINTS', 920, 185, 228, 36, '#ff6666', () => {
                            pilotSkillSystem.resetSkills();
                            applyPlayerDefenseProfile(false, false);
                            powerSystem.setPilotModifiers(1, 1);
                            syncPlayerWeapon(weaponSystem.getCurrentWeapon());
                            testNoticeText = 'SKILL BUILD RESET // ALL POINTS REFUNDED';
                            testNoticeUntil = performance.now() + 4500;
                            SoundSystem.playUpgrade();
                        });

                        // XP Progress Bar
                        ctx.fillStyle = '#0b1e2d';
                        ctx.fillRect(52, 236, 1096, 12);
                        ctx.strokeStyle = '#284b5d';
                        ctx.strokeRect(52, 236, 1096, 12);
                        ctx.fillStyle = '#38bdf8';
                        const xpRatio = Math.min(1.0, xp / nextXp);
                        ctx.fillRect(54, 238, Math.floor(1092 * xpRatio), 8);

                        const nodes = pilotSkillSystem.getAllNodes();
                        const branchHeaders = [
                            { label: 'SURVIVAL // HULL & AEGIS', color: '#42e8bf' },
                            { label: 'REACTOR // POWER MANAGEMENT', color: '#75d8e7' },
                            { label: 'COMBAT // WEAPON CONTROL', color: '#ffd166' }
                        ];
                        let hoveredSkillNode: any = null;

                        branchHeaders.forEach((branch, index) => {
                            const branchY = 265 + index * 150;
                            ctx.fillStyle = branch.color;
                            ctx.font = 'bold 13px Arial';
                            ctx.fillText(branch.label, 52, branchY);
                        });

                        nodes.forEach((node, index) => {
                            const col = index % 3;
                            const row = Math.floor(index / 3);
                            const cardX = 52 + col * 372;
                            const cardY = 277 + row * 150;
                            const branchColor = branchHeaders[row]?.color ?? '#38bdf8';
                            const isCardHovered = hoveredShopItem === `skill-card-${node.id}`;
                            ctx.fillStyle = isCardHovered ? '#102b3b' : '#0b1e2d';
                            ctx.fillRect(cardX, cardY, 350, 126);
                            ctx.strokeStyle = isCardHovered ? '#ffffff' : branchColor;
                            ctx.strokeRect(cardX, cardY, 350, 126);
                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = 'bold 13px Arial';
                            ctx.fillText(node.name, cardX + 14, cardY + 24);
                            ctx.fillStyle = branchColor;
                            ctx.font = '12px Arial';
                            ctx.fillText(`LEVEL ${node.level}/${node.maxLevel}`, cardX + 14, cardY + 46);
                            ctx.fillStyle = '#8ea4b2';
                            ctx.font = '12px Arial';
                            drawWrappedText(ctx, node.description, cardX + 14, cardY + 66, 320, 14, 2);
                            const canInvest = points > 0 && node.level < node.maxLevel;
                            drawButton(`invest-${node.id}`, 'INVEST +1', cardX + 214, cardY + 84, 118, 28, canInvest ? branchColor : '#526874', () => {
                                if (pilotSkillSystem.investPoint(node.id)) {
                                    if (node.id === 'hull_integrity' || node.id === 'aegis_protocol') applyPlayerDefenseProfile(false, false);
                                    if (node.id === 'generator_output' || node.id === 'capacitor_reserve' || node.id === 'weapon_efficiency') {
                                        powerSystem.setPilotModifiers(
                                            pilotSkillSystem.getBonusMultiplier('capacitor_reserve'),
                                            pilotSkillSystem.getBonusMultiplier('weapon_efficiency')
                                        );
                                    }
                                    if (node.id === 'weapon_damage' || node.id === 'fire_rate' || node.id === 'critical_targeting') {
                                        syncPlayerWeapon(weaponSystem.getCurrentWeapon());
                                    }
                                    SoundSystem.playUpgrade();
                                }
                            });
                            shopHitboxes.push({ id: `skill-card-${node.id}`, x: cardX, y: cardY, width: 350, height: 126, action: () => {} });
                            if (hoveredShopItem === `skill-card-${node.id}`) hoveredSkillNode = node;
                        });

                        // Hover Inspector Panel for Skills at bottom
                        if (hoveredSkillNode) {
                            ctx.fillStyle = 'rgba(3, 10, 24, 0.95)';
                            ctx.fillRect(52, 790, 1096, 95);
                            ctx.strokeStyle = '#38bdf8';
                            ctx.strokeRect(52, 790, 1096, 95);

                            ctx.textAlign = 'left';
                            ctx.fillStyle = '#38bdf8';
                            ctx.font = 'bold 14px Arial';
                            ctx.fillText(`SKILL INSPECT: ${hoveredSkillNode.name} (Lvl ${hoveredSkillNode.level}/${hoveredSkillNode.maxLevel})`, 72, 818);

                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = '13px Arial';
                            ctx.fillText(`• Description: ${hoveredSkillNode.description}`, 72, 846);
                            ctx.fillText(`• Branch: ${hoveredSkillNode.branch.toUpperCase()}  •  Every rank costs one skill point.`, 72, 870);
                        }
                        return;
                    }

                    if (shopScreen === 'equipment') {
                        drawCard(28, 156, 1144, 920, 'EQUIPMENT BAY // CLASSIC COMPONENT MOUNTING & FUSION', '#f43f5e');
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#f43f5e';
                        ctx.font = 'bold 17px Arial';
                        ctx.fillText(`MOUNT PARTS ON SHIP SLOTS  •  DRAG OR SELECT 3 IDENTICAL PARTS FOR FUSION`, 52, 205);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '13px Arial';
                        ctx.fillText(`Parts drop from enemies in combat. Click a part to mount, inspect, or calibrate levels with credits.`, 52, 228);

                        // Draw Ship Graphic Box (left side)
                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(52, 250, 420, 790);
                        ctx.strokeStyle = '#f43f5e';
                        ctx.strokeRect(52, 250, 420, 790);

                        ctx.fillStyle = '#f43f5e';
                        ctx.font = 'bold 15px Arial';
                        ctx.fillText(`ACTIVE HULL: ${shipSystem.getCurrentShip().name}`, 72, 278);

                        // Ship mounted slots
                        const slots: Array<{ type: EquipmentPartType; label: string; x: number; y: number }> = [
                            { type: 'weapon', label: 'WEAPON', x: 262, y: 320 },
                            { type: 'shield', label: 'SHIELD', x: 152, y: 380 },
                            { type: 'generator', label: 'GENERATOR', x: 372, y: 380 },
                            { type: 'engine', label: 'ENGINE', x: 262, y: 440 },
                            { type: 'computer', label: 'COMPUTER', x: 262, y: 500 }
                        ];

                        slots.forEach(slot => {
                            const equipped = equipmentSystem.getEquipped(slot.type);
                            ctx.fillStyle = '#0b1e2d';
                            ctx.fillRect(slot.x - 70, slot.y - 18, 140, 42);
                            ctx.strokeStyle = equipped ? '#00FF88' : '#526874';
                            ctx.strokeRect(slot.x - 70, slot.y - 18, 140, 42);

                            ctx.textAlign = 'center';
                            ctx.fillStyle = equipped ? '#00FF88' : '#8ea4b2';
                            ctx.font = 'bold 11px Arial';
                            ctx.fillText(equipped ? `${slot.type.toUpperCase()} T${equipped.tier} L${equipped.level}` : `[ ${slot.label} ]`, slot.x, slot.y - 2);

                            if (equipped) {
                                drawButton(`unequip-${slot.type}`, 'UNMOUNT', slot.x - 55, slot.y + 5, 110, 17, '#ff6666', () => {
                                    if (equipmentSystem.unequipPart(slot.type) && slot.type === 'shield') {
                                        applyPlayerDefenseProfile(false, false);
                                    }
                                });
                            }
                        });

                        // Comprehensive Ship Status Board (Lower left side)
                        ctx.fillStyle = '#0b1e2d';
                        ctx.fillRect(68, 550, 388, 470);
                        ctx.strokeStyle = '#38bdf8';
                        ctx.strokeRect(68, 550, 388, 470);

                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#38bdf8';
                        ctx.font = 'bold 14px Arial';
                        ctx.fillText('SHIP & EQUIPMENT STATUS BOARD', 88, 578);

                        const bonuses = equipmentSystem.getActiveBonuses();
                        const currentShip = shipSystem.getCurrentShip();
                        const statusLines = [
                            `Base Hull Health: ${player.maxHealth}`,
                            `Shield Capacity: ${player.maxShield} (+${bonuses.shieldCap.toFixed(1)}%)`,
                            `Generator Output: ${powerSystem.getGeneratorOutput(1).toFixed(0)} p/s (+${bonuses.genOutput.toFixed(1)}%)`,
                            `Weapon Damage & Rate: +${bonuses.weaponDmg.toFixed(1)}%`,
                            `Engine Propulsion Speed: +${bonuses.moveSpeed.toFixed(1)}%`,
                            `Crit Hit Chance: +${bonuses.critChance.toFixed(1)}%`,
                            `Critical Hit Damage: +${bonuses.critDmg.toFixed(1)}%`,
                            `Tactical Ability Duration: +${bonuses.abilityDuration.toFixed(1)}s`,
                            `Weapon / Gen Cap: ${currentShip.weaponCapacity} / ${currentShip.generatorCapacity}`
                        ];

                        statusLines.forEach((line, lIdx) => {
                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = '12px Arial';
                            ctx.fillText(`• ${line}`, 88, 608 + lIdx * 25);
                        });

                        // Inventory & Fusion Box (right side)
                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(492, 250, 674, 790);
                        ctx.strokeStyle = '#38bdf8';
                        ctx.strokeRect(492, 250, 674, 790);

                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#38bdf8';
                        ctx.font = 'bold 15px Arial';
                        ctx.fillText(`SALVAGED INVENTORY (${equipmentSystem.getInventory().length} PARTS)`, 512, 280);

                        const drawPartIcon = (type: EquipmentPartType, cx: number, cy: number, tier: number) => {
                            ctx.save();
                            const col = tier === 5 ? '#ff3333' : tier === 4 ? '#ffd700' : tier === 3 ? '#3388ff' : tier === 2 ? '#33cc66' : '#ffffff';
                            ctx.strokeStyle = col;
                            ctx.fillStyle = `${col}33`;
                            ctx.lineWidth = 2;

                            if (type === 'engine') {
                                // Miniature rocket engine nozzle shape
                                ctx.beginPath();
                                ctx.moveTo(cx - 10, cy - 12);
                                ctx.lineTo(cx + 10, cy - 12);
                                ctx.lineTo(cx + 14, cy + 12);
                                ctx.lineTo(cx - 14, cy + 12);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                            } else if (type === 'shield') {
                                // Miniature defense shield crest
                                ctx.beginPath();
                                ctx.arc(cx, cy, 12, Math.PI, 0, false);
                                ctx.lineTo(cx, cy + 14);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                            } else if (type === 'generator') {
                                // Power core crystal/generator
                                ctx.beginPath();
                                ctx.moveTo(cx, cy - 14);
                                ctx.lineTo(cx + 12, cy);
                                ctx.lineTo(cx, cy + 14);
                                ctx.lineTo(cx - 12, cy);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                            } else if (type === 'weapon') {
                                // Dual cannon barrels
                                ctx.fillRect(cx - 10, cy - 12, 6, 24);
                                ctx.fillRect(cx + 4, cy - 12, 6, 24);
                                ctx.strokeRect(cx - 10, cy - 12, 6, 24);
                                ctx.strokeRect(cx + 4, cy - 12, 6, 24);
                            } else if (type === 'computer') {
                                // Tactical computer chip matrix
                                ctx.strokeRect(cx - 12, cy - 12, 24, 24);
                                ctx.fillRect(cx - 8, cy - 8, 16, 16);
                            }
                            ctx.restore();
                        };

                        const inventory = equipmentSystem.getInventory();
                        let hoveredPartData: any = null;

                        inventory.forEach((part, index) => {
                            const col = index % 4;
                            const row = Math.floor(index / 4);
                            const partX = 512 + col * 155;
                            const partY = 310 + row * 95;

                            if (partY + 85 < 720) {
                                const isItemHovered = hoveredShopItem === `part-card-${part.id}`;
                                ctx.fillStyle = isItemHovered ? '#102b3b' : '#0b1e2d';
                                ctx.fillRect(partX, partY, 145, 85);
                                ctx.strokeStyle = isItemHovered ? '#38bdf8' : (part.equippedSlot ? '#00FF88' : '#284b5d');
                                ctx.strokeRect(partX, partY, 145, 85);

                                drawPartIcon(part.type, partX + 22, partY + 34, part.tier);

                                ctx.fillStyle = '#dbe9ee';
                                ctx.font = 'bold 12px Arial';
                                ctx.fillText(`${part.type.toUpperCase()}`, partX + 42, partY + 24);

                                const partCol = part.tier === 5 ? '#ff3333' : part.tier === 4 ? '#ffd700' : part.tier === 3 ? '#3388ff' : part.tier === 2 ? '#33cc66' : '#ffffff';
                                ctx.fillStyle = partCol;
                                ctx.font = 'bold 11px Arial';
                                ctx.fillText(`T${part.tier} • L${part.level}`, partX + 42, partY + 42);

                                drawButton(`mount-${part.id}`, part.equippedSlot ? 'MOUNTED' : 'MOUNT', partX + 8, partY + 54, 64, 24, '#00FF88', () => {
                                    if (equipmentSystem.equipPart(part.id) && part.type === 'shield') {
                                        applyPlayerDefenseProfile(false, false);
                                    }
                                });

                                const calibCost = equipmentSystem.getCalibrationCost(part);
                                const canCalib = part.level < equipmentSystem.getMaxLevelForTier(part.tier) && gameState.score >= calibCost;
                                drawButton(`calib-${part.id}`, `L+1 (${calibCost})`, partX + 76, partY + 54, 62, 24, canCalib ? '#FFD166' : '#526874', () => {
                                    const res = equipmentSystem.calibratePart(part.id, gameState.score);
                                    if (res.success) {
                                        gameState.score -= res.cost;
                                        if (part.type === 'shield' && part.equippedSlot) {
                                            applyPlayerDefenseProfile(false, false);
                                        }
                                        SoundSystem.playUpgrade();
                                    }
                                });

                                // Add hover detection for part description panel
                                shopHitboxes.push({
                                    id: `part-card-${part.id}`,
                                    x: partX,
                                    y: partY,
                                    width: 145,
                                    height: 85,
                                    action: () => {}
                                });

                                if (hoveredShopItem === `part-card-${part.id}`) {
                                    hoveredPartData = part;
                                }
                            }
                        });

                        // Hover Inspector Panel (if a part is hovered)
                        if (hoveredPartData) {
                            ctx.fillStyle = 'rgba(3, 10, 24, 0.95)';
                            ctx.fillRect(492, 580, 674, 150);
                            ctx.strokeStyle = '#38bdf8';
                            ctx.strokeRect(492, 580, 674, 150);

                            ctx.textAlign = 'left';
                            ctx.fillStyle = '#38bdf8';
                            ctx.font = 'bold 14px Arial';
                            ctx.fillText(`COMPONENT INSPECT: ${hoveredPartData.type.toUpperCase()} (Tier ${hoveredPartData.tier}, Level ${hoveredPartData.level})`, 512, 608);

                            const maxLvl = equipmentSystem.getMaxLevelForTier(hoveredPartData.tier);
                            const nextCost = equipmentSystem.getCalibrationCost(hoveredPartData);
                            let bonusDesc = '';
                            if (hoveredPartData.type === 'engine') bonusDesc = `Grants +${(2 + (hoveredPartData.tier - 1) * 1 + hoveredPartData.level * 0.4).toFixed(1)}% movement speed and agility.`;
                            else if (hoveredPartData.type === 'shield') bonusDesc = `Grants +${(3 + (hoveredPartData.tier - 1) * 2 + hoveredPartData.level * 0.5).toFixed(1)}% shield capacity.`;
                            else if (hoveredPartData.type === 'generator') bonusDesc = `Grants +${(3 + (hoveredPartData.tier - 1) * 2 + hoveredPartData.level * 0.5).toFixed(1)}% generator power output speed.`;
                            else if (hoveredPartData.type === 'weapon') bonusDesc = `Grants +${(2 + (hoveredPartData.tier - 1) * 1.5 + hoveredPartData.level * 0.4).toFixed(1)}% weapon damage and rate.`;
                            else if (hoveredPartData.type === 'computer') bonusDesc = `Grants +${(1.5 + (hoveredPartData.tier - 1) * 1 + hoveredPartData.level * 0.3).toFixed(1)}% crit chance & +${(5 + (hoveredPartData.tier - 1) * 3 + hoveredPartData.level * 1.0).toFixed(1)}% crit damage.`;

                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = '13px Arial';
                            ctx.fillText(`• Current Bonus: ${bonusDesc}`, 512, 638);
                            ctx.fillText(`• Max Level for Tier ${hoveredPartData.tier}: ${maxLvl} | Next Level Calibration Cost: ${nextCost} Credits`, 512, 668);
                            ctx.fillText(`• Status: ${hoveredPartData.equippedSlot ? 'Mounted on active ship hull' : 'In salvaged inventory ready for mount or fusion'}`, 512, 698);
                        }

                        // Fusion Box area at bottom right
                        ctx.fillStyle = '#0b1e2d';
                        ctx.fillRect(512, 740, 634, 280);
                        ctx.strokeStyle = '#FFD166';
                        ctx.strokeRect(512, 740, 634, 280);

                        ctx.fillStyle = '#FFD166';
                        ctx.font = 'bold 15px Arial';
                        ctx.fillText('FUSION CHAMBER (Place 3 identical parts to upgrade Tier)', 532, 770);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '12px Arial';
                        ctx.fillText('Click any 3 matching parts from inventory to fuse them into a higher Tier part.', 532, 792);

                        // Simple Fusion helper button for matching triplets
                        const matchingGroups: Record<string, typeof inventory> = {};
                        inventory.forEach(p => {
                            if (!p.equippedSlot) {
                                const key = `${p.type}_T${p.tier}`;
                                if (!matchingGroups[key]) matchingGroups[key] = [];
                                matchingGroups[key].push(p);
                            }
                        });

                        let fY = 820;
                        let fuseCount = 0;
                        Object.entries(matchingGroups).forEach(([key, parts]) => {
                            if (parts.length >= 3 && fuseCount < 3) {
                                const [type, tierStr] = key.split('_');
                                ctx.fillStyle = '#dbe9ee';
                                ctx.font = '13px Arial';
                                ctx.fillText(`Ready to fuse: 3x ${type.toUpperCase()} ${tierStr} available`, 532, fY + 16);

                                drawButton(`fuse-group-${key}`, `FUSE 3x ${tierStr} ${type.toUpperCase()}`, 880, fY, 240, 32, '#00FF88', () => {
                                    equipmentSystem.fuseParts([parts[0].id, parts[1].id, parts[2].id]);
                                    SoundSystem.playUpgrade();
                                });

                                fY += 45;
                                fuseCount++;
                            }
                        });

                        if (fuseCount === 0) {
                            ctx.fillStyle = '#8ea4b2';
                            ctx.font = '13px Arial';
                            ctx.fillText('No 3 matching unequipped parts available for fusion yet. Keep fighting!', 532, 840);
                        }

                        return;
                    }

                    if (shopScreen === 'weapons') {
                        drawCard(28, 156, 944, 730, stageMasterySystem.hasWeaponMastery() ? 'WEAPON BAY // OVERKILL MATRIX ACTIVE' : 'WEAPON BAY // ARMAMENT CONTROL', '#00FF88');
                        const weaponOptions = [
                            { key: '1', name: 'Straight Shot', type: WeaponType.STRAIGHT, accent: '#8ee7ff', locked: false },
                            { key: '2', name: 'Spread Shot', type: WeaponType.SPREAD, accent: '#00FF88', locked: false },
                            { key: '3', name: 'Homing Missiles', type: WeaponType.HOMING, accent: '#ff66dd', locked: false },
                            { key: '4', name: 'Split Bomb', type: WeaponType.HEAVY, accent: '#ffb347', locked: false },
                            { key: '5', name: 'Pulse Laser', type: WeaponType.LASER, accent: '#00ffff', locked: false },
                            { key: '6', name: 'Chain Lightning', type: WeaponType.ARC, accent: '#f8ff79', locked: false },
                            { key: '7', name: secretWeaponUnlocked ? 'Black Hole Projectile' : 'UNKNOWN', type: WeaponType.VOID_LANCE, accent: '#b06cff', locked: !secretWeaponUnlocked }
                        ];
                        weaponOptions.forEach((weapon, index) => {
                            const rowY = 342 + index * 92;
                            const currentLevel = weaponSystem.getCurrentLevel(weapon.type);
                            const levels = weaponSystem.getWeaponLevels(weapon.type);
                            const isLocked = weapon.locked;
                            const isSelected = !isLocked && weaponSystem.getCurrentWeapon() === weapon.type;
                            const nextLevel = isLocked ? null : (currentLevel < 0 ? levels[0] : levels[currentLevel + 1]);
                            const nextPowerCost = nextLevel ? powerSystem.getWeaponCost(weapon.type, currentLevel < 0 ? 0 : currentLevel + 1) : 0;
                            const hullWeaponCap = shipSystem.getCurrentShip().weaponCapacity;
                            const hullSupportsNext = Boolean(nextLevel && weaponSystem.canShipSupportWeaponLevel(shipSystem.getCurrentShipId(), nextLevel.level));
                            const canAfford = Boolean(nextLevel && hullSupportsNext && gameState.score >= nextLevel.cost);
                            ctx.textAlign = 'left';
                            ctx.fillStyle = isSelected ? '#00FF88' : '#e6f1f5';
                            ctx.font = 'bold 18px Arial';
                            ctx.fillText(`${isSelected ? '▶ ' : ''}${weapon.key}. ${weapon.name}`, 48, rowY + 20);
                            ctx.fillStyle = '#8ea6b2';
                            ctx.font = '14px Arial';
                            ctx.fillText(isLocked ? `CLASSIFIED • RESEARCH FRAGMENTS ${secretWeaponFragments}/3` : (currentLevel < 0 ? 'NOT OWNED' : `LEVEL ${currentLevel + 1}/25`), 48, rowY + 43);
                            ctx.fillText(isLocked ? 'RESEARCH COURIERS: STAGES 17 / 37 / 47+ • APPEAR AT 28s • ESCAPE IN 5s' : (nextLevel ? (hullSupportsNext ? `${nextLevel.description} • ${nextLevel.cost} pts` : `HULL CAP LEVEL ${hullWeaponCap} • UPGRADE SHIP REQUIRED`) : 'MAXIMUM LEVEL'), 48, rowY + 64);
                            if (!isLocked && nextLevel) {
                                ctx.fillStyle = '#ffd166';
                                ctx.font = '12px Arial';
                                ctx.fillText(`Energy ${nextPowerCost.toFixed(1)} / shot`, 48, rowY + 83);
                            }
                            if (!isLocked) addButton(`weapon-select-${weapon.type}`, 38, rowY + 2, 540, 72, () => selectWeapon(weapon.type));
                            if (isLocked) drawButton(`weapon-locked-${weapon.type}`, 'LOCKED', 628, rowY + 16, 120, 42, '#7c5abf', () => undefined);
                            else if (nextLevel) drawButton(`weapon-upgrade-${weapon.type}`, hullSupportsNext ? (currentLevel < 0 ? 'BUY' : 'UPGRADE') : 'HULL LOCK', 628, rowY + 16, 130, 42, canAfford ? '#00FF88' : '#ff6666', () => upgradeWeapon(weapon.type));
                            else {
                                ctx.fillStyle = '#526874';
                                ctx.font = 'bold 13px Arial';
                                ctx.fillText('MAX', 674, rowY + 42);
                            }
                            if (!isLocked && currentLevel > 0) {
                                const refund = levels[currentLevel]?.cost ?? 0;
                                drawButton(`weapon-downgrade-${weapon.type}`, 'DOWN', 778, rowY + 16, 110, 42, '#ffb347', () => downgradeWeapon(weapon.type));
                                ctx.fillStyle = '#ffcf8a';
                                ctx.font = '12px Arial';
                                ctx.fillText(`refund ${refund}`, 778, rowY + 72);
                            }
                        });
                        // drawShopFooter removed per user request to eliminate bottom buttons area
                        return;
                    }

                    if (shopScreen === 'systems') {
                        drawCard(28, 156, 944, 950, 'HULL SYSTEMS // SHIP, SHIELD, REACTOR & ENGINES', '#FFD166');
                        const systemsX = 48;
                        const systemsWidth = 904;
                        const actionX = 774;
                        const nextGeneratorCost = generatorCosts[powerSystem.generatorLevel + 1] ?? 0;
                        const generatorCanBuy = powerSystem.canUpgradeGenerator() && shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1) && gameState.score >= nextGeneratorCost;
                        const shieldCost = (shieldLevel + 1) * 2500;
                        const canBuyShield = shieldLevel < 10 && gameState.score >= shieldCost;
                        const nextEngineCost = engineUpgradeSystem.getNextCost();
                        const engineCanBuy = engineUpgradeSystem.canUpgrade() && gameState.score >= nextEngineCost;
                        const equipmentEngineBonus = equipmentSystem.getActiveBonuses().moveSpeed;
                        const displayedCruiseSpeed = 7.5 * engineUpgradeSystem.getSpeedMultiplier() * (1 + equipmentEngineBonus / 100);

                        drawCard(systemsX, 328, systemsWidth, 116, 'POWER CORE // GENERATOR', '#FFD166');
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#FFD166';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(`LEVEL ${powerSystem.generatorLevel + 1}/50`, 72, 372);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        ctx.fillText(`Output ${powerSystem.getGeneratorOutput(pilotSkillSystem.getBonusMultiplier('generator_output')).toFixed(0)} power/sec`, 72, 398);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.fillText('Generator upgrades increase recharge speed; capacity remains fixed.', 72, 424);
                        drawButton('systems-generator-upgrade', powerSystem.canUpgradeGenerator() ? `UPGRADE  ${nextGeneratorCost} PTS` : 'MAX GENERATOR', actionX, 365, 138, 42, generatorCanBuy ? '#00FF88' : '#ff6666', upgradeGenerator);

                        drawCard(systemsX, 456, systemsWidth, 116, 'DEFENSE GRID // SHIELD', '#00FFCC');
                        ctx.fillStyle = '#00FFCC';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(`LEVEL ${shieldLevel}/10`, 72, 500);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        ctx.fillText(`Max ${player.maxShield}  •  Recharge ${player.shieldRegenRate.toFixed(1)}/s continuously`, 72, 526);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.fillText(`Temporary layer: overflow reaches the hull. Next calibration: ${shieldCost} pts`, 72, 552);
                        drawButton('systems-shield-upgrade', shieldLevel < 10 ? `UPGRADE  ${shieldCost} PTS` : 'MAX SHIELD', actionX, 493, 138, 42, canBuyShield ? '#00FFCC' : '#ff6666', upgradeShield);

                        drawCard(systemsX, 584, systemsWidth, 116, 'PROPULSION // ENGINE THRUSTERS', '#82E9FF');
                        ctx.fillStyle = '#82E9FF';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(`RANK ${engineUpgradeSystem.getRank()}/${engineUpgradeSystem.getMaxRank()}  •  +${engineUpgradeSystem.getBonusPercent()}% THRUST`, 72, 628);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        ctx.fillText(`Cruise speed ${displayedCruiseSpeed.toFixed(2)}  •  Equipment bonus +${equipmentEngineBonus.toFixed(1)}%`, 72, 654);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.fillText('Each rank adds a controlled 2% speed. Turning precision and bullet patterns stay unchanged.', 72, 680);
                        drawButton('systems-engine-upgrade', engineUpgradeSystem.canUpgrade() ? `UPGRADE  ${nextEngineCost} PTS` : 'MAX ENGINE', actionX, 621, 138, 42, engineCanBuy ? '#82E9FF' : '#ff6666', upgradeEngine);

                        drawCard(systemsX, 712, systemsWidth, 396, `HULL FLEET // ACTIVE: ${shipSystem.getCurrentShip().name}`, '#f4fbff');
                        shipSystem.getAllShips().forEach((ship: any, index: number) => {
                            const shipY = 758 + index * 60;
                            const isCurrent = shipSystem.getCurrentShipId() === ship.id;
                            const isNext = ship.id === shipSystem.getCurrentShipId() + 1;
                            const canBuy = isNext && gameState.score >= ship.cost;
                            if (index > 0) {
                                ctx.strokeStyle = '#1d3a4a';
                                ctx.beginPath();
                                ctx.moveTo(72, shipY - 14);
                                ctx.lineTo(928, shipY - 14);
                                ctx.stroke();
                            }
                            ctx.textAlign = 'left';
                            ctx.fillStyle = isCurrent ? '#00FF88' : '#dbe9ee';
                            ctx.font = 'bold 15px Arial';
                            ctx.fillText(`${['S', 'I', 'D', 'B', 'D', 'A'][index] || 'X'}. ${ship.name}${isCurrent ? '  // ACTIVE HULL' : ''}`, 72, shipY + 10);
                            ctx.fillStyle = '#8ea4b2';
                            ctx.font = '12px Arial';
                            const defenseProfile = getShipDefenseProfile(ship.id);
                            ctx.fillText(`Hull ${defenseProfile.hullHealth}  •  Aegis ${defenseProfile.shieldCapacity}  •  Weapons ${ship.weaponCapacity}  •  Generator ${ship.generatorCapacity}`, 72, shipY + 28);
                            drawButton(`systems-ship-${ship.id}`, isCurrent ? 'ACTIVE' : ship.id < shipSystem.getCurrentShipId() ? 'OWNED' : `BUY  ${ship.cost} PTS`, actionX, shipY + 2, 138, 38, isCurrent ? '#00FF88' : canBuy ? '#FFD166' : '#ff6666', () => purchaseShip(ship.id));
                        });
                        // drawShopFooter removed per user request to eliminate bottom buttons area
                        return;
                    }

                    if (shopScreen === 'abilities') {
                    drawCard(28, 156, 944, 978, 'TACTICAL OPS // SPECIAL ABILITIES', '#c59cff');
                    const abilityUnlocked = tacticalAbilitySystem.isSystemUnlocked(shipSystem.getCurrentShipId());
                    ctx.textAlign = 'left';
                    ctx.fillStyle = abilityUnlocked ? '#c59cff' : '#ff8f8f';
                    ctx.font = 'bold 17px Arial';
                    ctx.fillText(abilityUnlocked ? 'SYSTEM ONLINE  •  SELECT ONE ACTIVE MODULE' : 'SYSTEM LOCKED  •  REQUIRES DESTROYER HULL', 52, 342);
                    ctx.fillStyle = '#8ea4b2';
                    ctx.font = '14px Arial';
                    ctx.fillText('Passive charge fills one cartridge in 20 seconds. Each enemy defeat adds +0.1% tactical charge.', 52, 366);
                    tacticalAbilitySystem.getAllTypes().forEach((type, index) => {
                        const abilityY = 392 + index * 164;
                        const status = tacticalAbilitySystem.getStatus(type, shipSystem.getCurrentShipId());
                        const next = tacticalAbilitySystem.getNextAbilityLevel(type);
                        const name = type === TacticalAbilityType.TIME_LOCK ? 'TIME LOCK' : type === TacticalAbilityType.VOID_ARMOR ? 'VOID ARMOR' : type === TacticalAbilityType.OVER_POWER ? 'OVER POWER' : 'PHASE CLOAK';
                        const color = type === TacticalAbilityType.TIME_LOCK ? '#7dd3fc' : type === TacticalAbilityType.VOID_ARMOR ? '#f0abfc' : type === TacticalAbilityType.OVER_POWER ? '#fbbf24' : '#34d399';
                        const selected = status.selected;
                        const canAfford = Boolean(next && abilityUnlocked && gameState.score >= next.cost);
                        drawCard(48, abilityY, 904, 144, `${selected ? 'ACTIVE // ' : ''}${name}`, color);
                        ctx.textAlign = 'left';
                        ctx.fillStyle = selected ? color : '#e6f1f5';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(status.level > 0 ? `LEVEL ${status.level}/5  •  ${status.duration.toFixed(1)}s DURATION` : 'NOT INSTALLED', 72, abilityY + 52);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '14px Arial';
                        ctx.fillText(next ? next.description : 'MAXIMUM CALIBRATION', 72, abilityY + 78);
                        drawButton(`ability-select-${type}`, selected ? 'ACTIVE MODULE' : 'SELECT MODULE', 72, abilityY + 92, 260, 34, selected ? color : '#75d8e7', () => selectTacticalAbility(type));
                        if (next) drawButton(`ability-upgrade-${type}`, status.level === 0 ? `INSTALL  ${next.cost} PTS` : `UPGRADE  ${next.cost} PTS`, 740, abilityY + 84, 180, 42, canAfford ? color : '#ff6666', () => upgradeTacticalAbility(type));
                        else {
                            ctx.fillStyle = '#526874';
                            ctx.font = 'bold 14px Arial';
                            ctx.fillText('MAXIMUM', 790, abilityY + 110);
                        }
                    });

                    const magazineY = 1048;
                    const nextMagazineCost = tacticalAbilitySystem.getNextMagazineCost();
                    const magazineCapacity = tacticalAbilitySystem.getMagazineCapacity();
                    const storedUses = tacticalAbilitySystem.getStoredUses();
                    const canAffordMagazine = Boolean(nextMagazineCost && abilityUnlocked && gameState.score >= nextMagazineCost);
                    drawCard(48, magazineY, 904, 74, 'TACTICAL MAGAZINE // CONSECUTIVE USE RESERVE', '#fbbf24');
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#f6d78c';
                    ctx.font = 'bold 15px Arial';
                    ctx.fillText(`CAPACITY ${magazineCapacity}/3  •  STORED USES ${storedUses}/${magazineCapacity}  •  EACH CARTRIDGE FILLS IN 20s`, 72, magazineY + 42);
                    ctx.fillStyle = '#8ea4b2';
                    ctx.font = '12px Arial';
                    ctx.fillText('Reserve cartridges store full tactical activations. Expensive upgrades: capacity 2 costs 2,000,000; capacity 3 costs 4,000,000.', 72, magazineY + 62);
                    if (nextMagazineCost) {
                        drawButton('ability-magazine-buy', `BUY RESERVE  ${nextMagazineCost} PTS`, 704, magazineY + 25, 216, 38, canAffordMagazine ? '#fbbf24' : '#ff6666', purchaseTacticalMagazine);
                    } else {
                        ctx.fillStyle = '#00ff88';
                        ctx.font = 'bold 14px Arial';
                        ctx.fillText('MAXIMUM 3-CARTRIDGE RESERVE', 704, magazineY + 50);
                    }
                    // drawShopFooter removed per user request to eliminate bottom buttons area
                    return;
                    }

                    if (false) {
                        const leftX = 28;
                    const rightX = 412;
                    const cardTop = 232;
                    const cardWidth = 360;
                    // The cards are tall enough for all weapons and systems; the canvas wrapper scrolls on short screens.
                    drawCard(leftX, cardTop, cardWidth, 500, stageMasterySystem.hasWeaponMastery() ? 'WEAPONS // OVERKILL MATRIX' : 'WEAPONS', '#00CCDD');
                    drawCard(rightX, cardTop, cardWidth, 500, stageMasterySystem.hasAegisMastery() ? 'SYSTEMS & SHIPS // AEGIS MATRIX' : 'SYSTEMS & SHIPS', '#FFD700');

                    const secretWeaponUnlocked = weaponSystem.isSecretWeaponUnlocked();
                    const secretWeaponFragments = weaponSystem.getSecretWeaponFragments();
                    const weaponOptions = [
                        { key: '1', name: 'Straight Shot', type: WeaponType.STRAIGHT, accent: '#8ee7ff', locked: false },
                        { key: '2', name: 'Spread Shot', type: WeaponType.SPREAD, accent: '#00FF88', locked: false },
                        { key: '3', name: 'Homing Missiles', type: WeaponType.HOMING, accent: '#ff66dd', locked: false },
                        { key: '4', name: 'Split Bomb', type: WeaponType.HEAVY, accent: '#ffb347', locked: false },
                        { key: '5', name: 'Pulse Laser', type: WeaponType.LASER, accent: '#00ffff', locked: false },
                        { key: '6', name: 'Chain Lightning', type: WeaponType.ARC, accent: '#f8ff79', locked: false },
                        { key: '7', name: secretWeaponUnlocked ? 'Black Hole Projectile' : 'UNKNOWN', type: WeaponType.VOID_LANCE, accent: '#b06cff', locked: !secretWeaponUnlocked }
                    ];

                    weaponOptions.forEach((weapon, index) => {
                        const rowY = cardTop + 48 + index * 70;
                        const currentLevel = weaponSystem.getCurrentLevel(weapon.type);
                        const levels = weaponSystem.getWeaponLevels(weapon.type);
                        const isLocked = weapon.locked;
                        const isSelected = !isLocked && weaponSystem.getCurrentWeapon() === weapon.type;
                        const nextLevel = isLocked ? null : (currentLevel < 0 ? levels[0] : levels[currentLevel + 1]);
                        const canAfford = Boolean(nextLevel && gameState.score >= nextLevel.cost);
                        const title = `${weapon.key}. ${weapon.name}`;
                        const status = isLocked ? `CLASSIFIED • FRAGMENTS ${secretWeaponFragments}/3` : (currentLevel < 0 ? 'NOT OWNED' : `LEVEL ${currentLevel + 1}/15`);
                        ctx.textAlign = 'left';
                        ctx.fillStyle = isSelected ? '#00FF88' : '#e6f1f5';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(`${isSelected ? '▶ ' : ''}${title}`, leftX + 16, rowY + 16);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.font = '14px Arial';
                        ctx.fillText(status, leftX + 16, rowY + 34);
                        if (isLocked) ctx.fillText('SIGNAL SEALED  •  HUNT THE SPECIAL TARGET', leftX + 16, rowY + 50);
                        else if (nextLevel) ctx.fillText(`${nextLevel.description}  •  ${nextLevel.cost} pts`, leftX + 16, rowY + 50);
                        else ctx.fillText('MAXIMUM LEVEL', leftX + 16, rowY + 50);

                        if (!isLocked) addButton(`weapon-select-${weapon.type}`, leftX + 10, rowY, 176, 58, () => selectWeapon(weapon.type));
                        if (isLocked) {
                            drawButton(`weapon-locked-${weapon.type}`, 'LOCKED', leftX + 194, rowY + 8, 82, 38, '#7c5abf', () => undefined);
                        } else if (nextLevel) {
                            drawButton(`weapon-upgrade-${weapon.type}`, currentLevel < 0 ? 'BUY' : 'UPGRADE', leftX + 194, rowY + 8, 82, 38, canAfford ? '#00FF88' : '#ff6666', () => upgradeWeapon(weapon.type));
                        } else {
                            ctx.fillStyle = '#526874';
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('MAX', leftX + 235, rowY + 31);
                        }
                        if (!isLocked && currentLevel > 0) {
                            const downgradeRefund = levels[currentLevel]?.cost ?? 0;
                            drawButton(`weapon-downgrade-${weapon.type}`, 'DOWN', leftX + 282, rowY + 8, 78, 38, '#ffb347', () => downgradeWeapon(weapon.type));
                            ctx.fillStyle = '#ffcf8a';
                            ctx.font = '11px Arial';
                            ctx.fillText(`Refund ${downgradeRefund} pts`, leftX + 282, rowY + 57);
                        }
                    });

                    const generatorY = cardTop + 48;
                    const nextGeneratorCost = generatorCosts[powerSystem.generatorLevel + 1] ?? 0;
                    const generatorCanBuy = powerSystem.canUpgradeGenerator() && shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1) && gameState.score >= nextGeneratorCost;
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Generator  •  LEVEL ${powerSystem.generatorLevel + 1}/15`, rightX + 16, generatorY + 12);
                    ctx.fillStyle = '#8ea6b2';
                    ctx.font = '14px Arial';
                    ctx.fillText(`Output: ${powerSystem.getGeneratorOutput(pilotSkillSystem.getBonusMultiplier('generator_output')).toFixed(0)} power/sec`, rightX + 16, generatorY + 31);
                    const generatorCanAdvance = powerSystem.canUpgradeGenerator() && shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1);
                    const generatorStatus = !powerSystem.canUpgradeGenerator() ? 'MAXIMUM LEVEL' : !shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1) ? `Requires a larger ship (cap ${shipSystem.getCurrentShip().generatorCapacity})` : `Next level: ${nextGeneratorCost} pts`;
                    ctx.fillText(generatorStatus, rightX + 16, generatorY + 48);
                    drawButton('generator-upgrade', generatorCanAdvance ? 'UPGRADE' : 'LOCKED', rightX + 252, generatorY + 3, 92, 38, generatorCanBuy ? '#00FF88' : '#ff6666', upgradeGenerator);

                    ctx.fillStyle = '#FFFF00';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'left';
                    // Shield is deliberately below the generator with its own row and hitbox.
                    const shieldY = cardTop + 112;
                    const shieldCost = (shieldLevel + 1) * 2500;
                    const canBuyShield = shieldLevel < 10 && gameState.score >= shieldCost;
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#00FFCC';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Shield  •  LEVEL ${shieldLevel}/10`, rightX + 16, shieldY + 12);
                    ctx.fillStyle = '#8ea6b2';
                    ctx.font = '13px Arial';
                    ctx.fillText(`Max ${player.maxShield}  •  Recharge ${player.shieldRegenRate}/s`, rightX + 16, shieldY + 30);
                    drawButton('shield-up', shieldLevel < 10 ? `UPGRADE  ${shieldCost} PTS` : 'MAX SHIELD', rightX + 218, shieldY + 1, 126, 34, shieldLevel >= 10 ? '#00FF88' : (canBuyShield ? '#00FFCC' : '#ff6666'), upgradeShield);

                    ctx.fillStyle = '#FFFF00';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Ships  •  ACTIVE: ${shipSystem.getCurrentShip().name}`, rightX + 16, cardTop + 178);
                    const shipKeys = ['S', 'I', 'D', 'B'];
                    shipSystem.getAllShips().forEach((ship: any, index: number) => {
                        const shipY = cardTop + 196 + index * 43;
                        const currentShipId = shipSystem.getCurrentShipId();
                        const isCurrent = currentShipId === ship.id;
                        const isNext = ship.id === currentShipId + 1;
                        const canBuy = isNext && gameState.score >= ship.cost;
                        ctx.fillStyle = isCurrent ? '#00FF88' : '#dbe9ee';
                        ctx.font = 'bold 11px Arial';
                        ctx.fillText(`${shipKeys[index]}. ${ship.name}`, rightX + 16, shipY + 13);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '13px Arial';
                        ctx.fillText(`Weapon cap ${ship.weaponCapacity}  •  Generator cap ${ship.generatorCapacity}`, rightX + 16, shipY + 28);
                        if (isCurrent) {
                            drawButton(`ship-${ship.id}`, 'ACTIVE', rightX + 260, shipY + 1, 84, 32, '#00FF88', () => undefined);
                        } else if (ship.id < currentShipId) {
                            drawButton(`ship-${ship.id}`, 'OWNED', rightX + 260, shipY + 1, 84, 32, '#526874', () => undefined);
                        } else {
                            drawButton(`ship-${ship.id}`, `${ship.cost} PTS`, rightX + 250, shipY + 1, 94, 32, canBuy ? '#00FF88' : '#ff6666', () => purchaseShip(ship.id));
                        }
                    });

                    // Tactical modules unlock with the third ship (Destroyer) and remain separate from generator power.
                    const abilityTitleY = cardTop + 365;
                    const abilityUnlocked = tacticalAbilitySystem.isSystemUnlocked(shipSystem.getCurrentShipId());
                    ctx.fillStyle = '#c59cff';
                    ctx.font = 'bold 15px Arial';
                    ctx.fillText(`TACTICAL MODULES  •  ${abilityUnlocked ? 'SYSTEM ONLINE' : 'REQUIRES DESTROYER'}`, rightX + 16, abilityTitleY);
                    tacticalAbilitySystem.getAllTypes().forEach((type, index) => {
                        const abilityY = abilityTitleY + 10 + index * 39;
                        const status = tacticalAbilitySystem.getStatus(type, shipSystem.getCurrentShipId());
                        const next = tacticalAbilitySystem.getNextAbilityLevel(type);
                        const name = type === TacticalAbilityType.TIME_LOCK ? 'TIME LOCK' : type === TacticalAbilityType.VOID_ARMOR ? 'VOID ARMOR' : type === TacticalAbilityType.OVER_POWER ? 'OVER POWER' : 'PHASE CLOAK';
                        const color = type === TacticalAbilityType.TIME_LOCK ? '#7dd3fc' : type === TacticalAbilityType.VOID_ARMOR ? '#f0abfc' : type === TacticalAbilityType.OVER_POWER ? '#fbbf24' : '#34d399';
                        const isSelected = status.selected;
                        const canAfford = Boolean(next && abilityUnlocked && gameState.score >= next.cost);
                        ctx.fillStyle = isSelected ? color : '#dbe9ee';
                        ctx.font = 'bold 10px Arial';
                        ctx.fillText(`${isSelected ? '▶ ' : ''}${name}`, rightX + 16, abilityY + 12);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '11px Arial';
                        ctx.fillText(status.level > 0 ? `LEVEL ${status.level}/5  •  ${status.duration.toFixed(1)}s` : 'NOT INSTALLED', rightX + 16, abilityY + 26);
                        addButton(`ability-select-${type}`, rightX + 8, abilityY - 4, 178, 34, () => selectTacticalAbility(type));
                        if (next) {
                            drawButton(`ability-upgrade-${type}`, status.level === 0 ? 'INSTALL' : 'UPGRADE', rightX + 232, abilityY - 4, 112, 32, canAfford ? color : '#ff6666', () => upgradeTacticalAbility(type));
                            ctx.fillStyle = '#8ea4b2';
                            ctx.font = '11px Arial';
                            ctx.fillText(`${next.cost} PTS`, rightX + 190, abilityY + 16);
                        } else {
                            ctx.fillStyle = '#526874';
                            ctx.font = 'bold 9px Arial';
                            ctx.fillText('MAX', rightX + 280, abilityY + 16);
                        }
                    });

                    const footerY = 680;
                    ctx.fillStyle = '#0b1e2d';
                    ctx.fillRect(28, footerY, canvasWidth - 56, 112);
                    ctx.strokeStyle = '#284b5d';
                    ctx.strokeRect(28, footerY, canvasWidth - 56, 90);
                    drawPortrait(ctx, 'naomi', 46, footerY + 14, 52);
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#FFD166';
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText(upgradeBriefing.title, 112, footerY + 28);
                    ctx.fillStyle = '#dbe9ee';
                    ctx.font = '13px Arial';
                    drawWrappedText(ctx, upgradeBriefing.message, 112, footerY + 46, 570, 12, 2);
                    ctx.fillStyle = '#94a9b8';
                    ctx.font = '13px Arial';
                    ctx.fillText('Mouse: select, BUY/UPGRADE, DOWN or ship tier  •  Generator upgrades increase recharge speed only.', 112, footerY + 76);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText('Keyboard: 1–6 weapons • E ability • G generator • S/I/D/B ships • ENTER continue', 112, footerY + 96);

                    drawButton('continue', stageFailureReason ? 'RETRY MISSION  [ENTER]' : 'CONTINUE TO NEXT LEVEL  [ENTER]', 205, 800, 390, 54, stageFailureReason ? '#ff9b9b' : '#00FF88', advanceFromShop);
                    ctx.textAlign = 'left';
                    }
                }

                if (gameState.isPaused && !gameState.gameOver && !gameState.showLevelScreen) {
                    ctx.fillStyle = 'rgba(1, 8, 20, 0.76)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);
                    ctx.strokeStyle = '#75d8e7';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(game.getCanvas().width / 2 - 230, game.getCanvas().height / 2 - 85, 460, 170);
                    ctx.fillStyle = '#00ff88';
                    ctx.font = 'bold 42px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PAUSED', game.getCanvas().width / 2, game.getCanvas().height / 2 - 18);
                    ctx.fillStyle = '#dbe9ee';
                    ctx.font = 'bold 17px Arial';
                    ctx.fillText('P / ESC  //  RESUME MISSION', game.getCanvas().width / 2, game.getCanvas().height / 2 + 24);
                    ctx.textAlign = 'left';
                }

                // Game over screen
                if (gameState.gameOver) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                    ctx.fillStyle = '#FF3333';
                    ctx.font = 'bold 48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', game.getCanvas().width / 2, game.getCanvas().height / 2 - 40);

                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(`Final Score: ${gameState.score}`, game.getCanvas().width / 2, game.getCanvas().height / 2 + 20);
                    ctx.fillText(`Level Reached: ${gameState.level}`, game.getCanvas().width / 2, game.getCanvas().height / 2 + 60);
                    
                    ctx.fillStyle = '#00CCDD';
                    ctx.font = '18px Arial';
                    ctx.fillText('Press SPACE to play again', game.getCanvas().width / 2, game.getCanvas().height / 2 + 110);
                    ctx.textAlign = 'left';
                }
            };

            // Handle key presses for weapon selection, progression, and explicit test cheats.
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'm' || e.key === 'M') {
                    e.preventDefault();
                    if (mCheatStartedAt === null) {
                        mCheatStartedAt = performance.now();
                        mCheatLastGrantAt = null;
                        testNoticeText = 'TEST MODE // HOLD M FOR DEV CREDITS';
                        testNoticeUntil = performance.now() + 1200;
                    }
                    return;
                }
                if (e.key === 'l' || e.key === 'L') {
                    e.preventDefault();
                    setShowStageMapModal(true);
                    testNoticeText = 'TEST MODE // STAGE SELECT OPENED';
                    testNoticeUntil = performance.now() + 2400;
                    return;
                }
                    if (showAfterActionModal) {
                        e.preventDefault();
                        showAfterActionModal = false;
                        return;
                    }
                    if (showCommsModal) {
                        e.preventDefault();
                        if (e.key === 'Escape') {
                            startStagePlay();
                        } else if (e.key === 'Enter' || e.key === ' ') {
                            advanceBriefing();
                        }
                        return;
                    }

                if (!gameState.gameOver && !gameState.showLevelScreen && (e.key === 'p' || e.key === 'P' || e.key === 'Escape')) {
                    e.preventDefault();
                    if (!e.repeat) gameState.togglePause();
                    return;
                }

                // A user key press is a valid browser gesture for resuming the AudioContext.
                if (!gameState.gameOver && !gameState.showLevelScreen && !gameState.isPaused) SoundSystem.startMusic();

                // Weapon selection is locked to the Ready Room. During combat, 1–5 switch
                // the active elemental core instead; Black Hole and Chain Lightning keep their
                // fixed identities and deliberately ignore this switch.
                if (!gameState.gameOver && !gameState.showLevelScreen) {
                    if (inputManager.isActionPressed('tacticalAbility')) {
                        e.preventDefault();
                        if (!e.repeat) toggleTacticalAbility();
                        return;
                    }
                    const coreIndex = Number(e.key) - 1;
                    if (!e.repeat && Number.isInteger(coreIndex) && coreIndex >= 0 && coreIndex < ELEMENTAL_CORE_ORDER.length) {
                        e.preventDefault();
                        const core = ELEMENTAL_CORE_ORDER[coreIndex];
                        elementalCoreSystem.selectCore(core);
                        const profile = elementalCoreSystem.getProfile(core);
                        testNoticeText = (player.weaponType === 'arc' || player.weaponType === 'void_lance')
                            ? `${getWeaponDisplayName(weaponSystem.getCurrentWeapon()).toUpperCase()} // FIXED ELEMENT // CORE STORED: ${profile.name}`
                            : `ELEMENT CORE // ${profile.name} // RANK ${profile.rank}`;
                        testNoticeUntil = performance.now() + 1800;
                        return;
                    }
                }

                if (gameState.showLevelScreen) {
                    if (shopScreen === 'finale_victory') {
                        e.preventDefault();
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') returnToTitle();
                        return;
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        shopScreen = 'hub';
                        hoveredShopItem = null;
                        return;
                    } else if (e.key === '1') {
                        e.preventDefault();
                        selectWeapon(WeaponType.STRAIGHT);
                    } else if (e.key === '2') {
                        e.preventDefault();
                        upgradeWeapon(WeaponType.SPREAD);
                    } else if (e.key === 'Shift' && e.code === 'Digit2') {
                        // Shift+2 to downgrade Spread Shot
                        e.preventDefault();
                        downgradeWeapon(WeaponType.SPREAD);
                    } else if (e.key === '3') {
                        e.preventDefault();
                        upgradeWeapon(WeaponType.HOMING);
                    } else if (e.key === 'Shift' && e.code === 'Digit3') {
                        // Shift+3 to downgrade Homing Missiles
                        e.preventDefault();
                        downgradeWeapon(WeaponType.HOMING);
                    } else if (e.key === '4') {
                        e.preventDefault();
                        upgradeWeapon(WeaponType.HEAVY);
                    } else if (e.key === '5') {
                        e.preventDefault();
                        selectWeapon(WeaponType.LASER);
                    } else if (e.key === '6') {
                        e.preventDefault();
                        selectWeapon(WeaponType.ARC);
                    } else if (e.key === '7') {
                        e.preventDefault();
                        selectWeapon(WeaponType.VOID_LANCE);
                    } else if (e.key === 'Shift' && e.code === 'Digit4') {
                        // Shift+4 to downgrade Heavy Cannon
                        e.preventDefault();
                        downgradeWeapon(WeaponType.HEAVY);
                    } else if (e.key === 'g' || e.key === 'G') {
                        e.preventDefault();
                        upgradeGenerator();
                    } else if (e.key === 's' || e.key === 'S') {
                        // Ship 1 (Starter Fighter - free)
                        e.preventDefault();
                        shipSystem.reset();
                        upgradeBriefing = CampaignSystem.getUpgradeBriefing('ship', 'Starter Fighter', 1);
                    } else if (e.key === 'i' || e.key === 'I') {
                        // Ship 2 (Interceptor)
                        e.preventDefault();
                        purchaseShip(1);
                    } else if (e.key === 'd' || e.key === 'D') {
                        // Ship 3 (Destroyer)
                        e.preventDefault();
                        purchaseShip(2);
                    } else if (e.key === 'b' || e.key === 'B') {
                        // Ship 4 (Battleship)
                        e.preventDefault();
                        purchaseShip(3);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (shopScreen === 'hub') advanceFromShop();
                        else shopScreen = 'hub';
                    }
                } else if (gameState.gameOver) {
                    if (e.key === ' ') {
                        e.preventDefault();
                        gameState.reset();
                        stageMasterySystem.beginStage(gameState.level);
                        lastStageMasteryResult = null;
                        stageTelemetryFinalized = false;
                        stageBriefing = CampaignSystem.getStageBriefing(gameState.level, gameplayLangRef.current);
                        commVisibleUntil = performance.now() + 9000;
                        upgradeBriefing = CampaignSystem.getUpgradeBriefing('weapon', 'Straight Shot', 1);
                        bossSpawnedForLevel = false;
                        bossDefeatedAt = null;
                        enemySpawner.reset();
                        weaponSystem.reset();
                        elementalCoreSystem.reset();
                        powerSystem.reset();
                        tacticalAbilitySystem.reset();
                        resetStageRuntime();
                        game['entities'] = [player];
                        spawnMissionTarget();
                        player.setWeapon('straight', 0, 6, 10);
                    }
                }
            };
            const handleKeyUp = (e: KeyboardEvent): void => {
                if (e.key === 'm' || e.key === 'M') {
                    mCheatStartedAt = null;
                    mCheatLastGrantAt = null;
                }
            };
            const handleWindowBlur = (): void => {
                mCheatStartedAt = null;
                mCheatLastGrantAt = null;
                touchInputRef.current.moveX = 0;
                setTouchFireActive(false);
                touchInputRef.current.moveY = 0;
                touchInputRef.current.fire = false;
                mouseInputRef.current.targetX = null;
                mouseInputRef.current.targetY = null;
                mouseInputRef.current.fire = false;
                inputManager.clear();
            };
            const canvas = game.getCanvas();
            const getShopPoint = (event: MouseEvent | PointerEvent): { x: number; y: number } => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: (event.clientX - rect.left) * (canvas.width / rect.width),
                    y: (event.clientY - rect.top) * (canvas.height / rect.height)
                };
            };

            const handleCanvasMouseMove = (event: MouseEvent): void => {
                const point = getShopPoint(event);
                if (!gameState.showLevelScreen && !showCommsModal) {
                    hoveredShopItem = null;
                    if (mouseControlsEnabled) {
                        mouseInputRef.current.targetX = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, point.x));
                        mouseInputRef.current.targetY = Math.max(player.height / 2, Math.min(GAME_CANVAS_HEIGHT - player.height / 2, point.y));
                        canvas.style.cursor = 'crosshair';
                    } else {
                        canvas.style.cursor = 'default';
                    }
                    return;
                }

                const hit = shopHitboxes.find((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
                const nextHoveredShopItem = hit?.id ?? null;
                if (nextHoveredShopItem !== hoveredShopItem && nextHoveredShopItem) {
                    const hoveredWeaponType = Object.values(WeaponType).find((type) => nextHoveredShopItem.endsWith(type));
                    if (hoveredWeaponType) setWeaponHoverBriefing(hoveredWeaponType);
                }
                hoveredShopItem = nextHoveredShopItem;
                canvas.style.cursor = hit ? 'pointer' : 'default';
            };

            const handleCanvasMouseDown = (event: MouseEvent): void => {
                if (!mouseControlsEnabled || event.button !== 0 || gameState.showLevelScreen || showCommsModal) return;
                const point = getShopPoint(event);
                // The tactical meter remains a click-only UI target rather than beginning weapon fire.
                if (point.x >= 12 && point.x <= 455 && point.y >= 238 && point.y <= 286) return;
                event.preventDefault();
                mouseInputRef.current.fire = true;
            };

            const handleCanvasMouseUp = (event: MouseEvent): void => {
                if (event.button === 0) mouseInputRef.current.fire = false;
            };

            const handleCanvasMouseLeave = (): void => {
                mouseInputRef.current.targetX = null;
                mouseInputRef.current.targetY = null;
                mouseInputRef.current.fire = false;
                if (!gameState.showLevelScreen && !showCommsModal) canvas.style.cursor = 'default';
            };

            const handleCanvasContextMenu = (event: MouseEvent): void => {
                if (mouseControlsEnabled && !gameState.showLevelScreen && !showCommsModal) event.preventDefault();
            };

            const setDirectTouchTarget = (event: PointerEvent): void => {
                const point = getShopPoint(event);
                touchInputRef.current.targetX = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, point.x));
                touchInputRef.current.targetY = Math.max(player.height / 2, Math.min(GAME_CANVAS_HEIGHT - player.height / 2, point.y));
            };
            const handleCanvasTouchStart = (event: PointerEvent): void => {
                if (!showDirectTouchFlight || event.pointerType !== 'touch' || gameState.showLevelScreen || showCommsModal) return;
                event.preventDefault();
                canvas.setPointerCapture(event.pointerId);
                setDirectTouchTarget(event);
            };
            const handleCanvasTouchMove = (event: PointerEvent): void => {
                if (!showDirectTouchFlight || event.pointerType !== 'touch' || gameState.showLevelScreen || showCommsModal) return;
                event.preventDefault();
                setDirectTouchTarget(event);
            };
            const releaseCanvasTouch = (event: PointerEvent): void => {
                if (event.pointerType !== 'touch') return;
                if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
            };

            const handleCanvasClick = (event: MouseEvent): void => {
                const point = getShopPoint(event);
                if (!gameState.showLevelScreen && !showCommsModal) {
                    // The in-canvas tactical meter is also a direct touch/mouse target.
                    if (point.x >= 12 && point.x <= 455 && point.y >= 238 && point.y <= 286) {
                        event.preventDefault();
                        toggleTacticalAbility();
                    }
                    return;
                }
                const hit = shopHitboxes.find((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
                if (!hit) return;
                event.preventDefault();
                hit.action();
                handleCanvasMouseMove(event);
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            window.addEventListener('blur', handleWindowBlur);
            canvas.addEventListener('mousemove', handleCanvasMouseMove);
            canvas.addEventListener('mousedown', handleCanvasMouseDown);
            canvas.addEventListener('mouseup', handleCanvasMouseUp);
            canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
            canvas.addEventListener('contextmenu', handleCanvasContextMenu);
            canvas.addEventListener('pointerdown', handleCanvasTouchStart);
            canvas.addEventListener('pointermove', handleCanvasTouchMove);
            canvas.addEventListener('pointerup', releaseCanvasTouch);
            canvas.addEventListener('pointercancel', releaseCanvasTouch);
            canvas.addEventListener('click', handleCanvasClick);

            // Start the game
            console.log('Starting game...');
            game.start();

            // Cleanup
            const langUnsubCheck = setInterval(() => {
                if (gameplayLangRef.current !== currentLangForBriefing) {
                    currentLangForBriefing = gameplayLangRef.current;
                    stageBriefing = CampaignSystem.getStageBriefing(gameState.level, currentLangForBriefing);
                    activeContactLine = stageBriefing.contact;
                    if (showCommsModal) {
                        commsParagraphIndex = 0;
                        playBriefingLine(commsParagraphIndex);
                    }
                }
            }, 100);

            return () => {
                languageRefreshActionRef.current = null;
                clearInterval(langUnsubCheck);
                game.stop();
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                window.removeEventListener('blur', handleWindowBlur);
                inputManager.destroy();
                touchActionsRef.current.toggleAbility = undefined;
                touchActionsRef.current.advanceMission = undefined;
                handleWindowBlur();
                canvas.removeEventListener('mousemove', handleCanvasMouseMove);
                canvas.removeEventListener('mousedown', handleCanvasMouseDown);
                canvas.removeEventListener('mouseup', handleCanvasMouseUp);
                canvas.removeEventListener('mouseleave', handleCanvasMouseLeave);
                canvas.removeEventListener('contextmenu', handleCanvasContextMenu);
                canvas.removeEventListener('pointerdown', handleCanvasTouchStart);
                canvas.removeEventListener('pointermove', handleCanvasTouchMove);
                canvas.removeEventListener('pointerup', releaseCanvasTouch);
                canvas.removeEventListener('pointercancel', releaseCanvasTouch);
                canvas.removeEventListener('click', handleCanvasClick);
                canvas.style.cursor = 'default';
                if (initialStageTimer !== null) window.clearTimeout(initialStageTimer);
                window.removeEventListener('tyrian:jump-to-stage', handleStageJumpEvent as EventListener);
            };
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }, [gameStarted, initialStage, startFromResume, graphicsQuality]);

    const updateTouchJoystick = (event: ReactPointerEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = rect.width * 0.38;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.hypot(dx, dy);
        const scale = distance > radius ? radius / distance : 1;
        const moveX = Math.max(-1, Math.min(1, (dx * scale) / radius));
        const moveY = Math.max(-1, Math.min(1, (dy * scale) / radius));
        touchInputRef.current.moveX = moveX;
        touchInputRef.current.moveY = moveY;
        const knob = event.currentTarget.querySelector<HTMLElement>('.mobile-joystick-knob');
        if (knob) knob.style.transform = `translate(${moveX * radius * 0.45}px, ${moveY * radius * 0.45}px)`;
    };

    const releaseTouchJoystick = (event: ReactPointerEvent<HTMLDivElement>): void => {
        event.preventDefault();
        touchInputRef.current.moveX = 0;
        touchInputRef.current.moveY = 0;
        const knob = event.currentTarget.querySelector<HTMLElement>('.mobile-joystick-knob');
        if (knob) knob.style.transform = 'translate(0, 0)';
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const setTouchFire = (active: boolean, event: ReactPointerEvent<HTMLButtonElement>): void => {
        event.preventDefault();
        touchInputRef.current.fire = active;
        setTouchFireActive(active);
        if (active) event.currentTarget.setPointerCapture(event.pointerId);
        else if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const activateTouchAbility = (event: ReactPointerEvent<HTMLButtonElement>): void => {
        event.preventDefault();
        setTouchAbilityPulse(true);
        window.setTimeout(() => setTouchAbilityPulse(false), 180);
        touchActionsRef.current.toggleAbility?.();
    };

    if (!gameStarted) {
        return (
            <div className="launch-console" role="region" aria-label="Program Zero launch console">
                <div className="launch-console__signal-row">
                    <span>PROGRAM ZERO // FLIGHT CORE</span>
                    <span>LINK STATE: STANDBY</span>
                </div>
                <div className="launch-console__core">
                    <p className="launch-console__eyebrow">ARK-9 / EXPERIMENTAL HULL 01</p>
                            <h2>PROTECT <span>THE STARSHIP</span></h2>
                    <p className="launch-console__briefing">
                        Arm the 100-stage campaign, protect Ark-9, and break the signal behind the border war. Boss contact is expected every third stage.
                    </p>
                    <div className="launch-console__telemetry" aria-label="Mission telemetry">
                        <span><b>100</b> STAGES</span>
                        <span><b>10</b> CHAPTERS</span>
                        <span><b>04</b> HULLS</span>
                    </div>
                    {resumeCheckpoint && (
                        <div className="mb-4 border border-amber-400/50 bg-amber-950/20 px-4 py-3 text-left text-sm text-amber-100" role="status">
                            <div className="font-bold tracking-[0.18em] text-amber-156">{resumeCheckpoint.reason}</div>
                            <div className="mt-1">Checkpoint ready: Stage {resumeCheckpoint.level}  •  Credits {resumeCheckpoint.score}</div>
                            <button
                                onClick={() => {
                                    SoundSystem.toggleSound(true);
                                    SoundSystem.toggleMusic(true);
                                    SoundSystem.startMusic();
                                    setStartFromResume(true);
                                    setGameStarted(true);
                                }}
                                className="mt-3 w-full border border-amber-156/70 px-4 py-3 font-bold tracking-[0.12em] text-amber-200 transition hover:bg-amber-156/15"
                            >
                                CONTINUE FROM STAGE {resumeCheckpoint.level}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            SoundSystem.toggleSound(true);
                            SoundSystem.toggleMusic(true);
                            SoundSystem.startMusic();
                            setStartFromResume(false);
                            setGameStarted(true);
                        }}
                        className="launch-command"
                    >
                        INITIATE NEW LAUNCH
                    </button>
                    <p className="launch-console__hint">COMMAND CONFIRMATION REQUIRED // PILOT LINK IS LOCAL</p>
                </div>
                <div className="launch-console__footer">
                    <span>READY ROOM // INPUT: POINTER</span>
                    <span>ARK-9 GATE / ZERO SIGNAL</span>
                </div>
            </div>
        );
    }

    const activeControlBindings = loadControlBindings();
    const movementKeysLabel = [
        formatControlCode(activeControlBindings.moveUp),
        formatControlCode(activeControlBindings.moveDown),
        formatControlCode(activeControlBindings.moveLeft),
        formatControlCode(activeControlBindings.moveRight),
    ].join(' ');

    const activeLanguageOption = LANGUAGE_OPTIONS.find((option) => option.id === gameplayLang) ?? LANGUAGE_OPTIONS[0];

    const triggerStageJump = (requestedStage: number): void => {
        const targetStage = Math.max(1, Math.min(CampaignSystem.TOTAL_STAGES, Math.floor(requestedStage)));
        if (gameRef.current) {
            // Trigger jump through window custom event or direct reset if game instance is active
            window.dispatchEvent(new CustomEvent('tyrian:jump-to-stage', { detail: targetStage }));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6 w-full">
            {naomiTutorial && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="naomi-upgrade-title">
                    <section className="grid w-full max-w-3xl overflow-hidden border border-cyan-200/75 bg-[#071426] shadow-2xl shadow-cyan-950/70 sm:grid-cols-[250px_1fr]">
                        <div className="relative min-h-56 overflow-hidden border-b border-cyan-200/35 bg-cyan-950/30 sm:min-h-full sm:border-b-0 sm:border-r">
                            <img src="/portraits/naomi.png" alt="Dr. Naomi" className="absolute inset-0 h-full w-full object-cover object-top" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent px-4 py-5 text-sm font-black tracking-[0.15em] text-cyan-100">NAOMI // ENGINEERING</div>
                        </div>
                        <div className="flex min-h-64 flex-col p-6 sm:p-8">
                            <p className="text-xs font-black tracking-[0.22em] text-amber-200">FIRST-TIME SYSTEM BRIEFING</p>
                            <h2 id="naomi-upgrade-title" className="mt-2 text-2xl font-black tracking-wide text-white sm:text-3xl">{naomiTutorial.title}</h2>
                            <p className="mt-5 flex-1 text-lg leading-relaxed text-slate-100">{naomiTutorial.message}</p>
                            <button type="button" onClick={() => setNaomiTutorial(null)} className="mt-7 min-h-12 border border-cyan-200/70 bg-cyan-950/65 px-5 text-base font-black tracking-[0.12em] text-cyan-50 transition hover:bg-cyan-800/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100">ACKNOWLEDGED // CONTINUE</button>
                        </div>
                    </section>
                </div>
            )}
            {showManualSaveModal && manualSaveState && (
                <SaveLoadModal
                    isOpen={showManualSaveModal}
                    mode="save"
                    currentState={manualSaveState}
                    onClose={() => {
                        setShowManualSaveModal(false);
                        setManualSaveState(undefined);
                    }}
                />
            )}
            {showStageMapModal && (
                <StageSelectModal
                    maxUnlockedLevel={maxUnlockedLevel}
                    allowAllStages={false}
                    onSelectStage={(stageNum) => {
                        setShowStageMapModal(false);
                        triggerStageJump(stageNum);
                    }}
                    onClose={() => setShowStageMapModal(false)}
                />
            )}
            <div
                className={`game-stage-shell ${showTouchControls ? 'game-stage-shell--touch' : ''} relative w-full max-w-[1200px] max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-lg border border-green-500/20 bg-black/30`}
                aria-label="Scrollable game viewport"
            >
                <canvas
                    ref={canvasRef}
                    id="gameCanvas"
                    className="block w-full h-auto border-2 border-green-500 bg-black shadow-lg shadow-green-500/50"
                />
                <div className="absolute right-3 top-3 z-50 min-w-48 font-sans text-left">
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 border border-cyan-300/80 bg-slate-950/95 px-3 py-2 text-sm font-bold tracking-wide text-cyan-100 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-950/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
                        aria-haspopup="menu"
                        aria-expanded={isLanguageMenuOpen}
                        aria-controls="game-language-menu"
                        onClick={() => setIsLanguageMenuOpen((open) => !open)}
                    >
                        <span>LANGUAGE</span>
                        <span className="text-amber-200">{activeLanguageOption.label} ▾</span>
                    </button>
                    {isLanguageMenuOpen && (
                        <div id="game-language-menu" role="menu" className="mt-1 overflow-hidden border border-cyan-300/80 bg-slate-950/98 shadow-xl shadow-cyan-950/60">
                            {LANGUAGE_OPTIONS.map((option) => {
                                const selected = option.id === gameplayLang;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={selected}
                                        className={`flex w-full items-center justify-between px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cyan-200 ${selected ? 'bg-cyan-900/70 text-amber-200' : 'text-cyan-50 hover:bg-cyan-950/80'}`}
                                        onClick={() => selectGameplayLanguage(option.id)}
                                    >
                                        <span>{option.menuLabel}</span>
                                        <span aria-hidden="true">{selected ? '✓' : ''}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                {showTouchControls && (
                    <div className={`mobile-touch-layer ${showDirectTouchFlight ? 'mobile-touch-layer--direct' : ''}`} aria-label="Touch flight controls">
                        {showDirectTouchFlight ? (
                            <div className="mobile-direct-flight-hint" aria-hidden="true">
                                <span>DRAG THE BATTLEFIELD</span>
                                <small>SHIP FOLLOWS YOUR TOUCH</small>
                            </div>
                        ) : (
                            <div className="mobile-joystick-zone">
                                <span className="mobile-control-label">DRAG TO MOVE</span>
                                <div
                                    className="mobile-joystick"
                                    role="slider"
                                    aria-label="Move ship"
                                    aria-valuemin={-1}
                                    aria-valuemax={1}
                                    aria-valuenow={0}
                                    onPointerDown={(event) => {
                                        event.preventDefault();
                                        event.currentTarget.setPointerCapture(event.pointerId);
                                        updateTouchJoystick(event);
                                    }}
                                    onPointerMove={updateTouchJoystick}
                                    onPointerUp={releaseTouchJoystick}
                                    onPointerCancel={releaseTouchJoystick}
                                >
                                    <span className="mobile-joystick-ring" />
                                    <span className="mobile-joystick-knob" />
                                </div>
                            </div>
                        )}
                        {showDirectTouchFlight && (
                            <div className="mobile-android-command-zone">
                                <button
                                    type="button"
                                    className="mobile-next-command"
                                    aria-label="Continue dialogue or start mission"
                                    onPointerDown={(event) => {
                                        event.preventDefault();
                                        SoundSystem.toggleSound(true);
                                        SoundSystem.toggleMusic(true);
                                        VoicePlaybackManager.primeFromGesture();
                                        touchActionsRef.current.advanceMission?.();
                                    }}
                                >
                                    NEXT / START
                                </button>
                                <button
                                    type="button"
                                    className="mobile-command-exit"
                                    aria-label="Return to the Android title screen"
                                    onPointerDown={(event) => {
                                        event.preventDefault();
                                        onReturnToTitle?.();
                                    }}
                                >
                                    COMMAND
                                </button>
                            </div>
                        )}
                        <div className="mobile-action-zone">
                            <button
                                type="button"
                                className={`mobile-ability-button ${touchAbilityPulse ? 'is-pressed' : ''}`}
                                aria-label="Tap to activate or stop the tactical ability"
                                onPointerDown={activateTouchAbility}
                                onContextMenu={(event) => event.preventDefault()}
                            >
                                <span>TACTICAL</span>
                                <small>TAP ON / OFF</small>
                            </button>
                            <button
                                type="button"
                                className={`mobile-fire-button ${touchFireActive ? 'is-firing' : ''}`}
                                aria-label="Hold to fire"
                                onPointerDown={(event) => setTouchFire(true, event)}
                                onPointerUp={(event) => setTouchFire(false, event)}
                                onPointerCancel={(event) => setTouchFire(false, event)}
                                onPointerLeave={(event) => setTouchFire(false, event)}
                                onContextMenu={(event) => event.preventDefault()}
                            >
                                <span>FIRE</span>
                                <small>HOLD</small>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="text-center text-sm text-gray-400">
                <p><span className="text-green-400 font-semibold">{movementKeysLabel}</span> move · <span className="text-green-400 font-semibold">{formatControlCode(activeControlBindings.fire)}</span> fires · <span className="text-green-400 font-semibold">{formatControlCode(activeControlBindings.tacticalAbility)}</span> toggles tactical {mouseControlsEnabled && <>· <span className="text-cyan-300 font-semibold">MOUSE</span> flies / left click fires</>}</p>
                {showTouchControls && <p className="mobile-input-hint">{showDirectTouchFlight ? 'Android: drag anywhere on the battle field to fly. Hold FIRE and tap TACTICAL.' : 'On mobile: drag the left joystick, hold FIRE, and tap TACTICAL to start or stop the ability.'}</p>}
            </div>
        </div>
    );
}
