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
import { Enemy } from '@/game/entities/Enemy';
import { EnemyAdvanced, EnemyShot } from '@/game/entities/EnemyAdvanced';
import { EnemyBullet } from '@/game/entities/EnemyBullet';
import { Explosion } from '@/game/entities/Explosion';
import { WeaponUpgradeSystem, WeaponType } from '@/game/core/WeaponUpgradeSystem';
import { getWeaponRuntimeProfile } from '@/game/core/WeaponRuntimeProfile';
import { StarField } from '@/game/systems/StarField';
import { InputManager } from '@/game/systems/InputManager';
import { CollisionSystem } from '@/game/systems/CollisionSystem';
import { EnemySpawner, StageCombatEvent } from '@/game/systems/EnemySpawner';
import { PowerSystem } from '@/game/core/PowerSystem';
import { Boss } from '@/game/entities/Boss';
import { SeraDuelEntity, SeraMirrorLoadout, SeraShot } from '@/game/entities/SeraDuelEntity';
import { SeraAllyShipEntity, SeraAllyLoadout } from '@/game/entities/SeraAllyShipEntity';
import { ShipUpgradeSystem } from '@/game/core/ShipUpgradeSystem';
import { TacticalAbilitySystem, TacticalAbilityType } from '@/game/core/TacticalAbilitySystem';
import { PilotSkillSystem } from '@/game/core/PilotSkillSystem';
import { EquipmentSystem, EquipmentPartType } from '@/game/core/EquipmentSystem';
import { CampaignSystem, CharacterId, UpgradeBriefing } from '@/game/story/CampaignSystem';
import { SoundSystem } from '@/game/core/SoundSystem';
import { BranchSystem, BranchRoute } from '@/game/story/BranchSystem';
import { BackgroundRenderer } from '@/game/story/BackgroundRenderer';
import { StageMasteryResult, StageMasterySystem } from '@/game/core/StageMasterySystem';
import { MissionTargetEntity } from '@/game/entities/MissionTargetEntity';
import { GravityWell } from '@/game/entities/GravityWell';
import { EquipmentDropEntity } from '@/game/entities/EquipmentDropEntity';
import { AsteroidBeltEntity } from '@/game/entities/AsteroidBeltEntity';
import { StageHazard, StageHazardKind } from '@/game/entities/StageHazard';
import { MissionArchiveSystem } from '@/game/story/MissionArchiveSystem';
import { DifficultySystem, DifficultyId, DifficultyProfile } from '@/game/core/DifficultySystem';
import { FinalBossAssembly, FinalBossPart } from '@/game/entities/FinalBossPart';
import { VoicePlaybackManager } from '@/game/core/VoicePlaybackManager';
import { StageSelectModal } from '@/components/StageSelectModal';

interface ResumeCheckpoint {
    level: number;
    score: number;
    reason: string;
    savedAt: number;
    shipId?: number;
    generatorLevel?: number;
    shieldLevel?: number;
    weaponState?: {
        weaponLevels?: Record<string, number>;
        currentWeapon?: string;
        secretWeaponUnlocked?: boolean;
    };
    pilotSkillsState?: any;
    equipmentState?: any;
}

const RESUME_CHECKPOINT_KEY = 'tyrian_resume_checkpoint';
const GAME_CANVAS_HEIGHT = 900;
const SHOP_CANVAS_HEIGHT = 1150;
const COMBAT_REWARD_MULTIPLIER = 0.75;
type ShopScreen = 'hub' | 'weapons' | 'systems' | 'abilities' | 'pilot_skills' | 'equipment' | 'finale_victory';

// Style: the game viewport is an armed retro-futurist flight console, with operational copy, signal strips, and no generic demo language.
interface GameContainerProps {
    touchControlsEnabled?: boolean;
}

export function GameContainer({ touchControlsEnabled = true }: GameContainerProps) {
    const isMobile = useIsMobile();
    const showTouchControls = isMobile && touchControlsEnabled;
    const [gameplayLang, setGameplayLang] = useState<'he' | 'en' | 'ja' | 'zh' | 'es'>(() => {
        return (localStorage.getItem('tyrian_gameplay_lang') as any) || 'he';
    });
    const gameplayLangRef = useRef(gameplayLang);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const touchInputRef = useRef({ moveX: 0, moveY: 0, fire: false });
    const touchActionsRef = useRef<{ toggleAbility?: () => void }>({});
    const gameRef = useRef<Game | null>(null);

    const toggleLanguage = () => {
        const languages: Array<'he' | 'en' | 'ja' | 'zh' | 'es'> = ['he', 'en', 'ja', 'zh', 'es'];
        const currentIndex = languages.indexOf(gameplayLangRef.current);
        const next = languages[(currentIndex + 1) % languages.length];
        setGameplayLang(next);
        gameplayLangRef.current = next;
        localStorage.setItem('tyrian_gameplay_lang', next);
        SoundSystem.startMusic();
    };

    useEffect(() => {
        if (!showTouchControls) {
            touchInputRef.current.moveX = 0;
            touchInputRef.current.moveY = 0;
            touchInputRef.current.fire = false;
        }
    }, [showTouchControls]);
    // The game opens directly into the stage briefing/control deck.
    const [gameStarted, setGameStarted] = useState(true);
    const [startFromResume, setStartFromResume] = useState(true);
    const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
        const stored = localStorage.getItem('tyrian_max_unlocked_level');
        return stored ? Math.max(1, parseInt(stored, 10)) : 1;
    });
    const [showStageMapModal, setShowStageMapModal] = useState<boolean>(false);
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
            const collisionSystem = new CollisionSystem();
            const enemySpawner = new EnemySpawner();
            let difficultyId: DifficultyId = DifficultySystem.load();
            let difficultyProfile: DifficultyProfile = DifficultySystem.get(difficultyId);
            enemySpawner.setDifficultyProfile(difficultyProfile);
            const weaponSystem = new WeaponUpgradeSystem();
            const powerSystem = new PowerSystem();
            const shipSystem = new ShipUpgradeSystem();
            if (resumeData?.weaponState) weaponSystem.loadSaveState(resumeData.weaponState);
            if (typeof resumeData?.generatorLevel === 'number') powerSystem.loadSaveState(resumeData.generatorLevel);
            if (typeof resumeData?.shipId === 'number') shipSystem.loadSaveState(resumeData.shipId);
            if (typeof resumeData?.shieldLevel === 'number') shieldLevel = Math.max(1, Math.min(10, Math.floor(resumeData.shieldLevel)));
            const tacticalAbilitySystem = new TacticalAbilitySystem();
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
            let stageBriefing = CampaignSystem.getStageBriefing(gameState.level, currentLangForBriefing);
            let commVisibleUntil = performance.now() + 9000;
            let inMissionCommsTriggered = false;
            let activeContactLine = stageBriefing.contact;

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
            let finalBossAssembly: FinalBossAssembly | null = null;
            let seraDuelOutcome: 'win' | 'loss' | null = null;
            let seraAlly: SeraAllyShipEntity | null = null;
            let lastStageMasteryResult: StageMasteryResult | null = null;
            let stageTelemetryFinalized = false;
            let mCheatStartedAt: number | null = null;
            let mCheatGranted = false;
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
                const words = text.split(' ');
                let line = '';
                let lineNumber = 0;
                for (const word of words) {
                    const candidate = line ? `${line} ${word}` : word;
                    if (ctx.measureText(candidate).width > maxWidth && line) {
                        ctx.fillText(line, x, y + lineNumber * lineHeight);
                        lineNumber++;
                        line = word;
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
                                : type === WeaponType.VOID_LANCE
                                    ? 'void_lance'
                                    : 'heavy';
                const damageBonus = pilotSkillSystem.getBonusMultiplier('weapon_damage');
                const fireRateBonus = pilotSkillSystem.getBonusMultiplier('fire_rate');
                const finalDamage = Math.round(stats.damage * damageBonus);
                const finalFireRate = Math.max(0.04, stats.fireRate / fireRateBonus);
                player.setWeapon(playerWeapon, weaponSystem.getCurrentLevel(type), finalFireRate, finalDamage);
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
            };

            const upgradeShield = (): void => {
                const shieldCost = (shieldLevel + 1) * 2500;
                if (shieldLevel >= 10 || gameState.score < shieldCost) return;
                gameState.score -= shieldCost;
                shieldLevel++;
                player.maxShield += 30;
                player.shield = player.maxShield;
                player.baseShieldRegenRate += 2;
                player.shieldRegenRate = player.baseShieldRegenRate;
                upgradeBriefing = CampaignSystem.getUpgradeBriefing('generator', 'Shield System', shieldLevel);
                SoundSystem.playUpgrade();
            };

            const purchaseShip = (shipId: number): void => {
                if (shipId !== shipSystem.getCurrentShipId() + 1) return;
                const ship = shipSystem.getShip(shipId);
                if (!ship || gameState.score < ship.cost) return;
                const result = shipSystem.upgradeShip(gameState.score);
                if (result) {
                    gameState.score -= result.cost;
                    upgradeBriefing = CampaignSystem.getUpgradeBriefing('ship', result.newShip.name, result.newShip.id + 1);
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
            if (stageMasterySystem.hasAegisMastery()) {
                player.maxShield += 35;
                player.baseShieldRegenRate += 2;
                player.shieldRegenRate = player.baseShieldRegenRate;
                player.shield = player.maxShield;
            }
            for (let appliedShieldLevel = 1; appliedShieldLevel < shieldLevel; appliedShieldLevel++) {
                player.maxShield += 30;
                player.baseShieldRegenRate += 2;
            }
            // Apply pilot skill tree bonuses
            const shieldBonus = pilotSkillSystem.getBonusMultiplier('shield_capacity');
            player.maxShield = Math.round(player.maxShield * shieldBonus);
            player.shieldRegenRate = player.baseShieldRegenRate * shieldBonus;
            player.shield = player.maxShield;

            player.weaponMasteryUnlocked = stageMasterySystem.hasWeaponMastery();
            player.setWeapon('straight', 0, 6, 10);
            game.addEntity(player);
            syncPlayerWeapon(weaponSystem.getCurrentWeapon());

            const getSeraMirrorLoadout = (): SeraMirrorLoadout => {
                const selectedWeapon = weaponSystem.getCurrentWeapon();
                const weaponStats = weaponSystem.getCurrentWeaponStats();
                const selectedAbility = tacticalAbilitySystem.getCurrentAbility();
                const abilityLevel = tacticalAbilitySystem.getCurrentLevel(selectedAbility);
                const abilityData = tacticalAbilitySystem.getAbilityLevel(selectedAbility);
                return {
                    shipTier: shipSystem.getCurrentShipId(),
                    weaponType: selectedWeapon,
                    weaponLevel: Math.max(0, weaponSystem.getCurrentLevel(selectedWeapon)),
                    weaponFireRate: weaponStats?.fireRate ?? 6,
                    weaponDamage: weaponStats?.damage ?? 10,
                    weaponCost: powerSystem.getWeaponCost(selectedWeapon, Math.max(0, weaponSystem.getCurrentLevel(selectedWeapon))),
                    maxShield: player.maxShield,
                    shieldRegenRate: player.baseShieldRegenRate,
                    generatorLevel: powerSystem.generatorLevel,
                    generatorOutput: powerSystem.getGeneratorOutput((pilotSkillSystem.getBonusMultiplier('generator_output') * pilotSkillSystem.getBonusMultiplier('generator_capacity'))),
                    maxPower: powerSystem.getMaxPower(),
                    ability: abilityLevel > 0 ? selectedAbility : null,
                    abilityLevel,
                    abilityDuration: abilityData?.duration ?? 0,
                    abilityFireMultiplier: abilityData?.fireMultiplier ?? 1,
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
                    + shieldInvestment;
                // The escort has a late-campaign Battleship frame. The pilot's total
                // investment determines how close her laser is to the absolute cap,
                // without copying the weapon currently selected by the pilot.
                const laserLevel = Math.min(14, Math.max(12, 12 + Math.floor(Math.log10(Math.max(1, pilotInvestmentBudget)) - 5)));
                const laserStats = weaponSystem.getWeaponLevels(WeaponType.LASER)[laserLevel];
                return {
                    shipTier: 3,
                    shipName: shipSystem.getShip(3)?.name ?? 'Battleship',
                    weaponType: 'laser',
                    weaponLevel: laserLevel,
                    weaponDamage: laserStats?.damage ?? 44,
                    weaponFireRate: laserStats?.fireRate ?? 10,
                    // Sera's escort reactor is tuned for sustained support fire. Her laser remains
                    // high-level, but its dedicated power draw is reduced to 25% of the pilot's
                    // economy cost so the max generator can sustain the beam between TIME LOCK bursts.
                    weaponCost: Math.max(4, Math.round(powerSystem.getWeaponCost(WeaponType.LASER, laserLevel) * 0.25 * 10) / 10),
                    maxShield: 50 + (10 - 1) * 30,
                    shieldRegenRate: 5 + (10 - 1) * 2,
                    generatorLevel: 28,
                    generatorOutput: 15 + 28 * 8.5,
                    maxPower: powerSystem.getMaxPower(),
                    ability: 'over_power',
                    abilityLevel: 5,
                    abilityDuration: 5.2,
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
                        const speed = shot.type === 'heavy' ? 2.6 : shot.type === 'homing' ? 2.35 : 3.05;
                        const style = shot.type === 'heavy' ? 'heavy' : shot.type === 'homing' ? 'plasma' : 'orb';
                        const mirrorBullet = new EnemyBullet(
                            shot.x,
                            shot.y,
                            shot.type === 'heavy' ? 12 : 7,
                            shot.type === 'heavy' ? 12 : 7,
                            speed,
                            damage,
                            dirX,
                            dirY,
                            friendly ? '#63f5ff' : '#ff668f',
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

            const applyPlayerDamage = (damage: number): boolean => {
                const shieldBefore = player.shield;
                const isDead = player.takeDamage(damage);
                const absorbed = Math.min(shieldBefore, Math.max(0, damage));
                if (absorbed > 0) stageMasterySystem.recordShieldImpact(absorbed);
                return isDead;
            };

            const saveResumeCheckpoint = (reason: string): void => {
                const checkpoint: ResumeCheckpoint = {
                    level: gameState.level,
                    score: Math.max(0, Math.floor(gameState.score)),
                    reason,
                    savedAt: Date.now(),
                    shipId: shipSystem.getCurrentShipId(),
                    generatorLevel: powerSystem.generatorLevel,
                    shieldLevel,
                    weaponState: weaponSystem.getSaveState(),
                    pilotSkillsState: pilotSkillSystem.getSaveState(),
                    equipmentState: equipmentSystem.getState()
                };
                localStorage.setItem(RESUME_CHECKPOINT_KEY, JSON.stringify(checkpoint));
                setResumeCheckpoint(checkpoint);
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

            const finalizeStageTelemetry = (): void => {
                if (stageTelemetryFinalized) return;
                lastStageMasteryResult = stageMasterySystem.finalizeStage();
                stageTelemetryFinalized = true;
                localStorage.setItem('tyrian_stage_mastery', JSON.stringify(stageMasterySystem.getSaveState()));
                if (!lastStageMasteryResult) return;
                if (lastStageMasteryResult.rewards.aegisMasteryUnlocked) {
                    player.maxShield += 35;
                    player.baseShieldRegenRate += 2;
                    player.shieldRegenRate = player.baseShieldRegenRate;
                    player.shield = player.maxShield;
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
                    gravityWell = new GravityWell(cWidth / 2, 390, 42, 2.2);
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
                if (currentTime - lastAsteroidSpawnTime < 2.2) return;
                lastAsteroidSpawnTime = currentTime;

                const canvasWidth = game.getCanvas().width;
                const fromLeft = Math.random() < 0.5;
                const startX = fromLeft ? -80 : canvasWidth + 20;
                const targetY = Math.random() * (GAME_CANVAS_HEIGHT - 300) + 120;
                const speed = 2.5 + Math.random() * 2.5;
                const vx = (fromLeft ? 1 : -1) * speed;
                const vy = (Math.random() - 0.5) * 0.8;

                const roll = Math.random();
                let kind: 'massive' | 'fragile' | 'debris' = 'debris';
                let size = 42;
                if (roll < 0.25) {
                    kind = 'massive';
                    size = 78;
                } else if (roll < 0.65) {
                    kind = 'fragile';
                    size = 56;
                } else {
                    kind = 'debris';
                    size = 32;
                }

                const asteroid = new AsteroidBeltEntity(
                    startX,
                    targetY,
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
                powerSystem.refillForStage();
                tacticalAbilitySystem.resetStage();
                player.resetForStage(
                    game.getCanvas().width / 2 - player.width / 2,
                    GAME_CANVAS_HEIGHT - 100
                );
            };

            const getBriefingLines = () => stageBriefing.dialogueSequence ?? [stageBriefing.contact];

            const getBriefingVoiceLineId = (index: number): string => {
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
                commVisibleUntil = performance.now() + 9000;
                SoundSystem.toggleSound(true);
                SoundSystem.toggleMusic(true);
                SoundSystem.startMusic();
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
                finalBossAssembly = null;
                seraDuelOutcome = null;
                seraAlly = null;
            };



            const jumpToStage = (requestedStage: number): void => {
                const targetStage = Math.max(1, Math.min(CampaignSystem.TOTAL_STAGES, Math.floor(requestedStage)));
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

            const requestStageJump = (): void => {
                const rawTarget = window.prompt(
                    'TEST MODE — STAGE JUMP\nEnter a whole-number stage from 1 to 100, then press OK. The selected stage starts immediately.',
                    String(gameState.level)
                );
                if (rawTarget === null) return;
                const targetStage = Number(rawTarget.trim());
                if (!Number.isFinite(targetStage) || targetStage < 1 || targetStage > CampaignSystem.TOTAL_STAGES) {
                    window.alert('Enter a whole-number stage from 1 to 100.');
                    return;
                }
                jumpToStage(targetStage);
            };

            const handleStageJumpEvent = (event: Event) => {
                const customEvent = event as CustomEvent<number>;
                if (customEvent.detail) {
                    jumpToStage(customEvent.detail);
                }
            };
            window.addEventListener('tyrian:jump-to-stage', handleStageJumpEvent as EventListener);

            const registerEnemyDefeat = (enemy: Enemy | EnemyAdvanced): void => {
                if (!enemy.isActive && !enemy.rewardGranted) {
                    enemy.rewardGranted = true;
                    gameState.enemyDefeated(enemy.points ?? 100);
                    stageMasterySystem.recordEnemyDefeat();
                    tacticalAbilitySystem.addKillCharge(enemy.points ?? 100, shipSystem.getCurrentShipId());
                    const enemyXp = Math.max(5, Math.floor((enemy.points ?? 100) * 0.1));
                    if (pilotSkillSystem.addXP(enemyXp)) {
                        testNoticeText = `PILOT RANK UP // RANK ${pilotSkillSystem.getRank()} // +1 SKILL POINT`;
                        testNoticeUntil = performance.now() + 4500;
                        SoundSystem.playUpgrade();
                    }
                    const isSpecialEnemy = enemy instanceof EnemyAdvanced && enemy.isSpecial;
                    if (isSpecialEnemy && weaponSystem.unlockSecretWeapon()) {
                        upgradeBriefing = CampaignSystem.getUpgradeBriefing('weapon', 'Black Hole Projectile', 1);
                        localStorage.setItem('tyrian_secret_weapon_unlocked', 'true');
                        window.dispatchEvent(new CustomEvent('tyrian:secret-weapon-unlocked'));
                        SoundSystem.playUpgrade();
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
                    game.addEntity(new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, isSpecialEnemy ? 32 : 20));
                }
            };

            const registerBossDefeat = (boss: Boss): void => {
                if (!boss.isActive && !boss.isAlive()) {
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
                        resolveSeraDuelOutcome('win');
                        game.addEntity(new Explosion(boss.x, boss.y, 30));
                        if (pilotSkillSystem.addXP(250)) {
                            testNoticeText = `PILOT RANK UP // RANK ${pilotSkillSystem.getRank()} // +1 SKILL POINT`;
                            testNoticeUntil = performance.now() + 4500;
                            SoundSystem.playUpgrade();
                        }
                        return;
                    }
                    gameState.addScore(Math.floor(boss.getReward() * COMBAT_REWARD_MULTIPLIER));
                    stageMasterySystem.recordEnemyDefeat();
                    if (pilotSkillSystem.addXP(350)) {
                        testNoticeText = `PILOT RANK UP // RANK ${pilotSkillSystem.getRank()} // +1 SKILL POINT`;
                        testNoticeUntil = performance.now() + 4500;
                        SoundSystem.playUpgrade();
                    }

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
                if (mCheatStartedAt !== null && !mCheatGranted && now - mCheatStartedAt >= 8000) {
                    gameState.score += 1_000_000_099;
                    mCheatGranted = true;
                    testNoticeText = 'TEST MODE // +1,000,000,099 CREDITS';
                    testNoticeUntil = now + 5000;
                    SoundSystem.playUpgrade();
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
                const activeSeraForInput = game['entities'].find((entity: any) =>
                    entity instanceof SeraDuelEntity && !(entity instanceof SeraAllyShipEntity) && entity.isActive
                ) as SeraDuelEntity | undefined;
                const keyboardMoveX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
                const keyboardMoveY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
                const pilotKeys = activeSeraForInput?.isTimeLockingPlayer()
                    ? {}
                    : {
                        ...keys,
                        moveX: Math.max(-1, Math.min(1, keyboardMoveX + touchInput.moveX)),
                        moveY: Math.max(-1, Math.min(1, keyboardMoveY + touchInput.moveY))
                    };

                // Update player; keyboard arrows and the mobile joystick can be used together.
                player.updateWithInput(deltaTime, pilotKeys, game.getCanvas().width, GAME_CANVAS_HEIGHT);

                // Generate power; OVER POWER keeps the reactor at maximum output for its duration.
                powerSystem.generatePower(deltaTime, (pilotSkillSystem.getBonusMultiplier('generator_output') * pilotSkillSystem.getBonusMultiplier('generator_capacity')));
                if (hasUnlimitedPower) powerSystem.forceReactorOnline();

                // A depleted reactor keeps movement available, but with a small recovery penalty.
                if (powerSystem.isReactorRecovering()) {
                    player.speed = 7.5 * 0.8;
                } else if (powerSystem.currentPower < 20) {
                    player.speed = 7.5 * 0.7;
                } else {
                    player.speed = 7.5;
                }

                // Handle player shooting
                if ((keys.Space || touchInput.fire) && player.canShoot(performance.now() / 1000) && (hasUnlimitedPower || powerSystem.canShoot(player.weaponType, player.weaponLevel))) {
                    const bulletPositions = player.shoot(performance.now() / 1000);
                    const weaponCost = powerSystem.getWeaponCost(player.weaponType, player.weaponLevel);
                    if (!hasUnlimitedPower) powerSystem.consumePower(weaponCost);
                    
                    bulletPositions.forEach((bulletData: any) => {
                        const cloaked = tacticalAbilitySystem.isPhaseCloaked();
                        if (bulletData.type === 'straight') {
                            const bullet = new Bullet(bulletData.x, bulletData.y, 8, 8, 25, player.weaponDamage, '#FFD700', bulletData.angle || 0);
                            (bullet as any).isCloaked = cloaked;
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'spread') {
                            const bullet = new Bullet(bulletData.x, bulletData.y, 8, 8, 25, player.weaponDamage, '#FFD700', bulletData.angle || 0);
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
                                player.weaponDamage,
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
                                player.weaponDamage,
                                bulletData.angle || 0,
                                hLevel,
                                (splitX, splitY, level, baseDamage) => {
                                    const subDmg = Math.max(5, baseDamage * (0.38 + level * 0.022));
                                    for (let fragmentIndex = 0; fragmentIndex < fragmentCount; fragmentIndex++) {
                                        const dAng = (Math.PI * 2 * fragmentIndex) / fragmentCount;
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
                        } else if (bulletData.type === 'void_lance') {
                            const bullet = new BlackHoleBullet(
                                bulletData.x,
                                bulletData.y,
                                player.weaponDamage,
                                player.weaponLevel,
                                bulletData.angle || 0
                            );
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'laser') {
                            const beam = new LaserBullet(
                                bulletData.x,
                                bulletData.y,
                                player.weaponDamage,
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
                }

                if (!missionEventSpawned && gameState.levelTimeElapsed >= 45) spawnMissionTarget();

                const newEnemies = gameState.level === 31
                    ? []
                    : enemySpawner.update(deltaTime, game['entities'], gameState.level);
                stageMasterySystem.recordEnemySpawn(newEnemies.length);
                newEnemies.forEach(enemy => game.addEntity(enemy));

                const seraDuel = game['entities'].find((entity: any) =>
                    entity instanceof SeraDuelEntity && !(entity instanceof SeraAllyShipEntity) && entity.isActive
                ) as SeraDuelEntity | undefined;
                if (seraDuel) {
                    tacticalAbilitySystem.addTimeCharge(deltaTime, shipSystem.getCurrentShipId());
                }
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
                            if (entity.kind === 'massive') {
                                player.takeDamage(35);
                            } else {
                                player.takeDamage(20);
                            }
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
                const applyBlackHoleField = (bullet: BlackHoleBullet): void => {
                    game['entities'].forEach((target: any) => {
                        if (!(target instanceof Enemy || target instanceof EnemyAdvanced) || !target.isActive) return;
                        if (!bullet.isWithinField(target) || !bullet.canSuctionTarget(target)) return;
                        bullet.registerSuction(target);
                        const center = bullet.getFieldCenter();
                        const targetCenterX = target.x + target.width / 2;
                        const targetCenterY = target.y + target.height / 2;
                        const deltaX = center.x - targetCenterX;
                        const deltaY = center.y - targetCenterY;
                        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
                        const suction = bullet.getSuctionStrength();
                        target.applyKnockback((deltaX / distance) * suction, (deltaY / distance) * suction, 1);
                        target.takeDamage(bullet.getSuctionDamage());
                        registerEnemyDefeat(target);
                    });
                };
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof BlackHoleBullet && entity.isActive) applyBlackHoleField(entity);
                });
                const collisions = collisionSystem.getCollisions();
                                collisions.forEach((collision: any) => {
                    const { entityA, entityB } = collision;
                    const playerProjectile = entityA instanceof Bullet || entityA instanceof HomingBullet || entityA instanceof HeavyBullet || entityA instanceof LaserBullet || entityA instanceof BlackHoleBullet
                        ? entityA
                        : entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet || entityB instanceof LaserBullet || entityB instanceof BlackHoleBullet
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
                    if (entityA instanceof LaserBullet && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced) && entityA.intersectsTarget(entityB)) {
                        const damage = entityA.getDamageForTarget(entityB);
                        if (damage > 0 && entityB.isActive) entityB.takeDamage(damage);
                        registerEnemyDefeat(entityB);
                    } else if (entityB instanceof LaserBullet && (entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && entityB.intersectsTarget(entityA)) {
                        const damage = entityB.getDamageForTarget(entityA);
                        if (damage > 0 && entityA.isActive) entityA.takeDamage(damage);
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
                        }
                        registerEnemyDefeat(entityB);
                    } else if ((entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && (entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet) && !(entityB instanceof BlackHoleBullet)) {
                        if (entityA.isActive) {
                            if (entityB instanceof HeavyBullet) applyHeavyImpact(entityB, entityA);
                            else {
                                entityA.takeDamage(entityB.damage);
                                entityB.isActive = false;
                            }
                        }
                        registerEnemyDefeat(entityA);
                    }

                    // Player laser hits boss and consumes one penetration slot for this beam.
                    if (entityA instanceof LaserBullet && entityB instanceof Boss && entityA.intersectsTarget(entityB)) {
                        const damage = entityA.getDamageForTarget(entityB);
                        if (damage > 0 && entityB.isActive) entityB.takeDamage(damage);
                        if (entityB.isActive && !entityB.isAlive()) {
                            entityB.isActive = false;
                            registerBossDefeat(entityB);
                        }
                    } else if (entityB instanceof LaserBullet && entityA instanceof Boss && entityB.intersectsTarget(entityA)) {
                        const damage = entityB.getDamageForTarget(entityA);
                        if (damage > 0 && entityA.isActive) entityA.takeDamage(damage);
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
                        if (entityA instanceof HeavyBullet) applyHeavyImpact(entityA, entityB);
                        else {
                            const damage = entityA instanceof HomingBullet ? 15 : 10;
                            entityB.takeDamage(damage);
                            entityA.isActive = false;
                        }
                        if (entityB.isActive && !entityB.isAlive()) {
                            entityB.isActive = false;
                            registerBossDefeat(entityB);
                        }
                    } else if ((entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet) && !(entityB instanceof BlackHoleBullet) && entityA instanceof Boss) {
                        if (entityB instanceof HeavyBullet) applyHeavyImpact(entityB, entityA);
                        else {
                            const damage = entityB instanceof HomingBullet ? 15 : 10;
                            entityA.takeDamage(damage);
                            entityB.isActive = false;
                        }
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
                            const isDead = applyPlayerDamage(1);
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
                            const isDead = applyPlayerDamage(1);
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
                if (!inMissionCommsTriggered && stageBriefing.inMissionComms && gameState.levelTimeElapsed >= 6.0) {
                    inMissionCommsTriggered = true;
                    activeContactLine = stageBriefing.inMissionComms;
                    MissionArchiveSystem.recordInMissionComms(stageBriefing);
                    commVisibleUntil = performance.now() + 9000;
                    SoundSystem.playCriticalComms(stageBriefing.inMissionComms.speaker, 'intercept');
                }
                if (!currentMissionTarget && gameState.level % 3 !== 0 && gameState.level !== 31 && gameState.levelTimeElapsed >= 45) {
                    spawnMissionTarget();
                }
                const bossStage = gameState.level % 3 === 0 || gameState.level === 31 || gameState.level === 101;
                const bossGracePeriodComplete = bossDefeatedAt !== null && currentTime - bossDefeatedAt >= 5;
                if ((!bossStage && gameState.isLevelComplete()) || (bossStage && bossGracePeriodComplete)) {
                    finalizeStageTelemetry();
                    gameState.levelComplete = true;
                    gameState.showLevelScreen = true;
                    if (gameState.level === 101) {
                        // Special campaign completion finale screen flow
                        finaleSceneIndex = 0;
                    shopScreen = 'finale_victory';
                    } else if ((gameState.level % 10 === 0 || gameState.level === 31) && stageBriefing.afterAction) {
                        showAfterActionModal = true;
                        SoundSystem.playCriticalComms(stageBriefing.afterAction.speaker, 'briefing');
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
                    gameState.level % 3 === 0 || gameState.level === 101
                );

                // Render entities with phase cloak state for player
                game['entities'].forEach((entity: any) => {
                    if (entity instanceof Player) {
                        entity.render(ctx, tacticalAbilitySystem.isPhaseCloaked());
                    } else {
                        entity.render(ctx);
                    }
                });

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
                ctx.fillText('Shield: ' + Math.floor(player.shield) + '/' + player.maxShield, barX + 160, barY + 10);

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
                ctx.fillStyle = '#182432';
                ctx.fillRect(barX, abilityBarY, barWidth, barHeight);
                ctx.fillStyle = tacticalAbilitySystem.isActive() ? '#ff6bff' : abilityUnlocked ? '#a66bff' : '#52606a';
                ctx.fillRect(barX, abilityBarY, barWidth * abilityPercent, barHeight);
                ctx.strokeStyle = tacticalAbilitySystem.isActive() ? '#ffffff' : '#a66bff';
                ctx.strokeRect(barX, abilityBarY, barWidth, barHeight);
                ctx.fillStyle = tacticalAbilitySystem.isActive() ? '#ffffff' : '#c59cff';
                ctx.font = '14px Arial';
                const abilityState = tacticalAbilitySystem.isActive()
                    ? `ACTIVE ${tacticalAbilitySystem.getActiveTimeRemaining().toFixed(1)}s`
                    : !abilityUnlocked
                        ? 'LOCKED: DESTROYER'
                        : selectedStatus.level <= 0
                            ? 'INSTALL IN SHOP'
                            : tacticalAbilitySystem.isChargeFull()
                                ? 'READY [E]'
                                : 'CHARGING';
                ctx.fillText(`${abilityName}  ${Math.floor(tacticalAbilitySystem.getCharge())}%  •  ${abilityState}`, barX + 160, abilityBarY + 10);
                if (performance.now() < testNoticeUntil) {
                    ctx.fillStyle = '#ffcf5a';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillText(testNoticeText, barX + 160, abilityBarY + 30);
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
                    ctx.fillStyle = 'rgba(2, 6, 20, 0.98)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                    const canvasWidth = game.getCanvas().width;
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

                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#00CCDD';
                    ctx.font = 'bold 36px Arial';
                    ctx.fillText(`STAGE ${gameState.level} // MISSION COMMS`, canvasWidth / 2, 64);

                    // Multi-language picker button (HE, EN, JA, ZH, ES)
                    const langLabels: Record<string, string> = { he: 'HEBREW (עב)', en: 'ENGLISH (EN)', ja: 'JAPANESE (日)', zh: 'CHINESE (中)', es: 'SPANISH (ES)' };
                    drawButton('toggle-lang', `LANG: ${langLabels[gameplayLang] || 'HE'} 🌐`, canvasWidth / 2 - 120, 16, 240, 36, '#00d9b5', toggleLanguage);
                    ctx.fillStyle = '#FFD166';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText(stageBriefing.title, canvasWidth / 2, 102);
                    ctx.fillStyle = '#75d8e7';
                    ctx.font = '14px monospace';
                    ctx.fillText(`${stageBriefing.operationCode}  •  ${stageBriefing.location}`, canvasWidth / 2, 126);

                    // Dialog box
                    const boxX = 64;
                    const boxY = 160;
                    const boxWidth = canvasWidth - 128;
                    const boxHeight = 440;
                    ctx.fillStyle = '#06121e';
                    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                    ctx.strokeStyle = stageBriefing.contact.speaker === 'sera' ? '#ff6b6b' : '#00d9b5';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                    drawPortrait(ctx, stageBriefing.contact.speaker, boxX + 28, boxY + 28, 96);
                    ctx.textAlign = 'left';
                    const dialogueLines = stageBriefing.dialogueSequence ?? [{ speaker: stageBriefing.contact.speaker, name: stageBriefing.contact.name, message: stageBriefing.contact.message }];
                    const activeLine = dialogueLines[Math.min(commsParagraphIndex, dialogueLines.length - 1)];

                    drawPortrait(ctx, activeLine.speaker, boxX + 28, boxY + 28, 96);
                    ctx.textAlign = 'left';
                    ctx.fillStyle = activeLine.speaker === 'sera' ? '#ff9b9b' : '#72ffe1';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText(`${activeLine.name}  •  SECURE COMMS`, boxX + 144, boxY + 54);
                    ctx.fillStyle = '#f0b84e';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillText(`BRIEFING SEGMENT ${commsParagraphIndex + 1} / ${dialogueLines.length} // CHAPTER ${stageBriefing.chapter}`, boxX + 144, boxY + 80);

                    ctx.fillStyle = '#dbe9ee';
                    ctx.font = '16px Arial';
                    drawWrappedText(ctx, activeLine.message, boxX + 144, boxY + 120, boxWidth - 168, 24, 4);

                    // Mission Order & Objective Card inside briefing
                    ctx.fillStyle = '#081a28';
                    ctx.fillRect(boxX + 144, boxY + 230, boxWidth - 168, 120);
                    ctx.strokeStyle = '#2f7f90';
                    ctx.strokeRect(boxX + 144, boxY + 230, boxWidth - 168, 120);
                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 13px monospace';
                    ctx.fillText(`MISSION ORDER: ${stageBriefing.objective}`, boxX + 160, boxY + 256);
                    ctx.fillStyle = '#75d8e7';
                    ctx.font = '13px monospace';
                    ctx.fillText(`LOCATION: ${stageBriefing.location} • TARGET: ${stageBriefing.missionTargetName}`, boxX + 160, boxY + 284);
                    const commsHazard = getStageHazardBrief(gameState.level, stageBriefing.missionType);
                    ctx.fillStyle = '#f0b84e';
                    ctx.fillText(`EXPECTED EVENT: ${getExpectedEventInfo(gameState.level, stageBriefing.missionType, resolveStageCombatEvent(gameState.level, stageBriefing.missionType)).name}`, boxX + 160, boxY + 312);
                    ctx.fillText(`HAZARD: ${commsHazard.name}`, boxX + 160, boxY + 340);

                    const nextLabel = commsParagraphIndex < dialogueLines.length - 1 ? 'NEXT BRIEFING LINE  >>' : 'CONFIRM & LAUNCH MISSION  [ENTER]';
                    drawButton('comms-next', nextLabel, boxX + 28, boxY + 416, 320, 48, '#00FF88', advanceBriefing);

                    drawButton('comms-skip', 'SKIP BRIEFING  [ESC]', boxX + boxWidth - 220, boxY + 416, 192, 48, '#75d8e7', () => {
                        startStagePlay();
                    });
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

                        const isHebrew = gameplayLangRef.current === 'he';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = '#00FF88';
                        ctx.font = 'bold 40px Arial';
                        ctx.fillText(isHebrew ? 'הקמפיין הושלם // ארק-9 בטוחה' : 'CAMPAIGN COMPLETE // ARK-9 SECURED', canvasWidth / 2, 60);

                        ctx.fillStyle = '#FFD700';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(isHebrew ? 'ספינת האם של הארכון הושמדה. החייזרים נסוגו בחזרה לחלל העמוק.' : 'The Archon Mothership has fallen. The alien fleet has retreated into the void.', canvasWidth / 2, 94);

                        // Epilogue narrative scenes box
                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(60, 118, canvasWidth - 120, 275);
                        ctx.strokeStyle = '#75d8e7';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(60, 118, canvasWidth - 120, 275);

                        ctx.fillStyle = '#75d8e7';
                        ctx.font = 'bold 16px Arial';
                        ctx.textAlign = isHebrew ? 'right' : 'left';
                        ctx.fillText(isHebrew ? 'יומן אפילוג // סיפורי הדמויות והגלקסיה' : 'MISSION ARCHIVE // TRUE EPILOGUE & CHARACTER ARCS', isHebrew ? canvasWidth - 90 : 90, 150);

                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        const epilogueScenes = isHebrew ? [
                            [
                                '1. השניות שאחרי הניצחון:',
                                'הטייס מנסה לקרוא בקשר ומוצא רק רעש סטטי. "כולם איתי?" הוא שואל.',
                                'נעמי: "החללית שלך איבדה 43% מעטפת ו-61% מערכות, כולל מכונת הקפה!"',
                                'סרה מגיעה לצדו עם חללית פגועה וגוררת אותו החוצה: "תפסיק לנסות למות בדרמטיות. תן לי לנצח את כוח הכבידה."'
                            ],
                            [
                                '2. הטייס וסרה:',
                                'בזמן טיסה משותפת בגבול ארק-9, סרה מודה שבתחילת הדרך נשלחה לעצור אותו אך מצאה בו אמת.',
                                'סרה: "אם לא היית משמיד חצי מהצי שלי, הייתי מזמינה אותך לשתות משהו."',
                                'הטייס: "ואם לא היית מנסה להפיל אותי לשמש, הייתי מסכים. נשמע כמו דייט."',
                                'סרה מחזיקה את ידו בזמן ששתי החלליות הניסיוניות גולשות יחד אל תוך הזריחה.'
                            ],
                            [
                                '3. נקמתה של ד״ר נעמי:',
                                'נעמי מגלה שאביה, פרופסור רחב, תכנן את ספינת האם וניצל את המחקר שלה.',
                                'במקום להרוג אותו, היא משדרת את כל סודותיו לכל הגלקסיה ונועלת עליו את המעבדה.',
                                'נעמי: "אבא, תנסה לפעם אחת בחיים להגיע למסקנה בעצמך. זו שמתפוצצת בעוד שלוש דקות."'
                            ],
                            [
                                '4. גורל הצבא והחייזרים:',
                                'המפקדת אלנה וייל מובילה טיהור יסודי של האדמירלים המושחתים ומציעה לטייס ולסרה פיקוד עצמאי.',
                                'החייזרים נסוגו דרך שערים רחוקים לאחר שהבינו שחלק מהמלחמה הונעה על ידי שקרים של הצי.',
                                'אך גוסט כבר מודיע בקשר מוצפן: "מצאתי עוד אות בדרק-ווב. המשחק רק מתחיל."'
                            ]
                        ] : [
                            [
                                '1. The Moments After Victory:',
                                'The pilot tries calling on the comms: "Is anyone still with me?"',
                                'Naomi: "Your hull is at 43% and your coffee maker is vaporized!"',
                                'Sera arrives alongside with a damaged frame: "Stop trying to die dramatically. Let me beat gravity instead."'
                            ],
                            [
                                '2. Pilot & Sera Arc:',
                                'Cruising along the Ark-9 border, Sera admits she was originally sent to stop him but found loyalty instead.',
                                'Sera: "If you had not blasted half my fleet, I would buy you a drink."',
                                'Pilot: "And if you had not tried to drop me into a sun, I would agree. Sounds like a date."',
                                'Sera holds his hand as both experimental vessels glide together toward dawn.'
                            ],
                            [
                                '3. Dr. Naomi\'s Payback:',
                                'Naomi discovers her father, Professor Arch, engineered the mothership behind her back.',
                                'Instead of a simple execution, she broadcasts his treason across the galaxy and locks him in his lab.',
                                'Naomi: "Father, try reaching a conclusion on your own. The lab explodes in three minutes."'
                            ],
                            [
                                '4. Fleet & Alien Aftermath:',
                                'Commander Elena purges corrupt admirals and offers the pilot and Sera an autonomous task force.',
                                'The alien invaders retreat through distant gates after realizing the war was built on lies.',
                                'Ghost chimes in via a secure pulse: "I found a new signal on the dark web. The game continues."'
                            ]
                        ];

                        epilogueScenes.push(isHebrew ? [
                            '5. תיעוד מסע הקמפיין:',
                            `ניקוד סופי: ${Math.floor(gameState.score)}  //  דרגת חללית: Mk.${shipSystem.getCurrentShipId() + 1}`,
                            `גנרטור: דרגה ${powerSystem.generatorLevel + 1}  //  נשק פעיל: ${weaponSystem.getCurrentWeapon().toUpperCase()}`,
                            `דו־קרב סרה: ${seraDuelOutcome === 'win' ? 'ניצחון' : seraDuelOutcome === 'loss' ? 'ניסיון הושלם' : 'ללא תיעוד'}`,
                            'ארק-9 מאובטחת. יומן המשימות נשאר פתוח לכל קריאה חוזרת.'
                        ] : [
                            '5. Campaign Record:',
                            `Final Score: ${Math.floor(gameState.score)}  //  Ship Tier: Mk.${shipSystem.getCurrentShipId() + 1}`,
                            `Generator: Rank ${powerSystem.generatorLevel + 1}  //  Active Weapon: ${weaponSystem.getCurrentWeapon().toUpperCase()}`,
                            `Sera Duel: ${seraDuelOutcome === 'win' ? 'Victory' : seraDuelOutcome === 'loss' ? 'Trial Completed' : 'No Record'}`,
                            'Ark-9 is secured. The mission archive remains open for review.'
                        ]);
                        const currentScene = epilogueScenes[finaleSceneIndex % epilogueScenes.length];
                        ctx.fillStyle = '#8da8b5';
                        ctx.font = '12px Arial';
                        ctx.textAlign = isHebrew ? 'left' : 'right';
                        ctx.fillText(`${finaleSceneIndex % epilogueScenes.length + 1} / ${epilogueScenes.length}`, isHebrew ? 90 : canvasWidth - 90, 150);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        currentScene.forEach((line, idx) => {
                            ctx.textAlign = isHebrew ? 'right' : 'left';
                            ctx.fillText(line, isHebrew ? canvasWidth - 90 : 90, 185 + idx * 42);
                        });

                        // Credits section
                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(60, 408, canvasWidth - 120, 115);
                        ctx.strokeStyle = '#c084fc';
                        ctx.strokeRect(60, 408, canvasWidth - 120, 115);

                        ctx.fillStyle = '#c084fc';
                        ctx.font = 'bold 15px Arial';
                        ctx.textAlign = isHebrew ? 'right' : 'left';
                        ctx.fillText(isHebrew ? 'קרדיטים ויוצרי המשחק' : 'CREDITS & ACKNOWLEDGMENTS', isHebrew ? canvasWidth - 85 : 90, 435);

                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '13px Arial';
                        ctx.fillText(isHebrew ? 'עיצוב ופיתוח: Manus AI & טייס פרויקט Zero  •  עלילה ודמויות: ד״ר נעמי רן & אלנה וייל' : 'Lead Design: Manus AI & Pilot  •  Narrative & Voice: Dr. Naomi Ren & Elena Vail', isHebrew ? canvasWidth - 85 : 90, 460);
                        ctx.fillText(isHebrew ? 'מנוע סאונד רטרו שמיאסן וסינתיסייזר: Web Audio API  •  גלקסיה: ארק-9' : 'Retro Shamisen Sound Engine: Web Audio API  •  Galaxy: Ark-9', isHebrew ? canvasWidth - 85 : 90, 485);

                        drawButton('finale-previous', isHebrew ? 'הקודם' : 'PREVIOUS', 90, 548, 180, 48, '#75d8e7', () => {
                            finaleSceneIndex = (finaleSceneIndex + epilogueScenes.length - 1) % epilogueScenes.length;
                        });
                        drawButton('finale-next', isHebrew ? 'הבא' : 'NEXT', canvasWidth - 270, 548, 180, 48, '#75d8e7', () => {
                            finaleSceneIndex = (finaleSceneIndex + 1) % epilogueScenes.length;
                        });
                        drawButton('finale-return', isHebrew ? 'חזרה למסך הראשי // תפריט ראשי' : 'RETURN TO TITLE // MAIN MENU', canvasWidth / 2 - 190, 548, 380, 48, '#00FF88', () => {
                            setGameStarted(false);
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
                    ctx.fillText(`TYRIAN 2000 // STAGE ${gameState.level} READY ROOM`, 28, 44);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Available Credits: ${gameState.score}`, 28, 72);

                    const langLabelsShop: Record<string, string> = { he: 'HEBREW (עב)', en: 'ENGLISH (EN)', ja: 'JAPANESE (日)', zh: 'CHINESE (中)', es: 'SPANISH (ES)' };
                    drawButton('toggle-lang', `LANG: ${langLabelsShop[gameplayLang] || 'HE'} 🌐`, canvasWidth - 268, 30, 240, 42, '#00d9b5', toggleLanguage);

                    const secretWeaponUnlocked = weaponSystem.isSecretWeaponUnlocked();
                    const drawShopNav = (active: ShopScreen): void => {
                        const navY = 96;
                        const navWidth = 176;
                        const navGap = 16;
                        const navItems: Array<{ id: ShopScreen; label: string; color: string }> = [
                            { id: 'hub', label: 'CONTROL DECK', color: '#00CCDD' },
                            { id: 'weapons', label: 'WEAPON BAY', color: '#00FF88' },
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

                if (showAfterActionModal && stageBriefing.afterAction) {
                    const aa = stageBriefing.afterAction;
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
                    ctx.fillText(stageBriefing.stage === 31 ? 'STAGE 31 // PILOT TRIAL OUTCOME' : `CHAPTER ${stageBriefing.chapter} // AFTER-ACTION DEBRIEF`, canvasWidth / 2, boxY - 40);

                    drawPortrait(ctx, aa.speaker, boxX + 28, boxY + 28, 96);
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#f0b84e';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText(`${aa.name}  •  CHAPTER CLEAR DEBRIEF`, boxX + 144, boxY + 54);
                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 14px monospace';
                    ctx.fillText(stageBriefing.stage === 31
                        ? (seraDuelOutcome === 'win' ? 'SERA DUEL // VICTORY CONFIRMED' : 'SERA DUEL // TRIAL COMPLETE // CONTINUATION AUTHORIZED')
                        : `STAGE ${gameState.level} COMPLETED SUCCESSFULLY`, boxX + 144, boxY + 80);

                    ctx.fillStyle = '#dbe9ee';
                    ctx.font = '16px Arial';
                    drawWrappedText(ctx, aa.message, boxX + 144, boxY + 120, boxWidth - 168, 24, 5);

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
                        drawPortrait(ctx, stageBriefing.contact.speaker, 52, 442, 56);
                        ctx.fillStyle = stageBriefing.contact.speaker === 'sera' ? '#ff9b9b' : '#72ffe1';
                        ctx.font = 'bold 15px Arial';
                        ctx.fillText(`${stageBriefing.contact.name} // SECURE COMMS`, 122, 462);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        drawWrappedText(ctx, stageBriefing.contact.message, 122, 488, 830, 18, 2);

                        ctx.fillStyle = '#c59cff';
                        ctx.font = 'bold 15px monospace';
                        ctx.fillText(`EXPECTED EVENT: ${eventInfo.name}`, 52, 548);
                        ctx.fillStyle = '#b7cdd6';
                        ctx.font = '13px Arial';
                        drawWrappedText(ctx, `${eventInfo.desc}  ${deckHazard.detail}`, 52, 572, 890, 16, 2);

                        ctx.fillStyle = '#00FF88';
                        ctx.font = 'bold 15px monospace';
                        ctx.fillText(`PRIMARY OBJECTIVE: ${stageBriefing.missionTargetName}`, 52, 624);
                        ctx.fillText(`BOUNTY: +${Math.floor(stageBriefing.bountyReward * COMBAT_REWARD_MULTIPLIER)} CREDITS`, 52, 650);

                        ctx.fillStyle = '#FFD166';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(`AVAILABLE CREDITS  ${gameState.score}`, 680, 684);
                        drawButton('hub-continue', stageFailureReason ? 'RETRY MISSION  [ENTER]' : 'CONTINUE TO NEXT LEVEL  [ENTER]', 290, 752, 280, 56, stageFailureReason ? '#ff9b9b' : '#00FF88', advanceFromShop);
                        drawButton('hub-stagemap', 'STAGE MAP 01-100', 585, 752, 180, 56, '#38bdf8', () => {
                            setShowStageMapModal(true);
                        });
                        ctx.fillStyle = '#7996a4';
                        ctx.font = '13px monospace';
                        ctx.fillText('Select a bay above to upgrade armaments, hull systems, or tactical ops.', 242, 840);

                        drawCard(28, 860, 944, 130, `GLOBAL DIFFICULTY // ACTIVE: ${difficultyProfile.label}`, '#ff6b6b');
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '13px Arial';
                        ctx.fillText('Applies to enemy hull, shields, damage, speed, fire rate, mission threats, and bosses.', 48, 892);
                        DifficultySystem.PROFILES.forEach((profile, index) => {
                            const x = 42 + index * 145;
                            const active = profile.id === difficultyId;
                            drawButton(`difficulty-${profile.id}`, active ? `● ${profile.label}` : profile.label, x, 912, 132, 34, active ? '#00FF88' : '#ff8f8f', () => selectDifficulty(profile.id));
                        });
                        ctx.fillStyle = '#8ea9b4';
                        ctx.font = '12px Arial';
                        ctx.fillText(difficultyProfile.description, 48, 972);
                        return;
                    }

                    drawShopNav(shopScreen);

                    if (shopScreen === 'pilot_skills') {
                        drawCard(28, 156, 1144, 920, 'PILOT EXPERIENCE, TALENT & CRITICAL SKILLS', '#38bdf8');
                        const rank = pilotSkillSystem.getRank();
                        const xp = pilotSkillSystem.getXP();
                        const nextXp = pilotSkillSystem.getNextRankXpRequirement();
                        const points = pilotSkillSystem.getSkillPoints();

                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#38bdf8';
                        ctx.font = 'bold 17px Arial';
                        ctx.fillText(`PILOT RANK ${rank}  •  AVAILABLE SKILL POINTS: ${points}`, 52, 202);
                        ctx.fillStyle = '#8ea4b2';
                        ctx.font = '12px Arial';
                        ctx.fillText(`Experience: ${xp} / ${nextXp} XP to next rank. Invest points in skill cards below.`, 52, 224);

                        drawButton('pilot-respec', 'RESET SKILLS [RESPEC]', 920, 185, 228, 36, '#ff6666', () => {
                            const refunded = pilotSkillSystem.resetSkills();
                            gameState.score += refunded;
                            testNoticeText = `SKILLS RESET // REFUNDED ALL POINTS & ${refunded.toLocaleString()} CREDITS`;
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
                        let hoveredSkillNode: any = null;

                        nodes.forEach((node, index) => {
                            const col = index % 3;
                            const row = Math.floor(index / 3);
                            const cardX = 52 + col * 372;
                            const cardY = 265 + row * 132;

                            const isCardHovered = hoveredShopItem === `skill-card-${node.id}`;
                            ctx.fillStyle = isCardHovered ? '#102b3b' : '#0b1e2d';
                            ctx.fillRect(cardX, cardY, 350, 120);
                            ctx.strokeStyle = isCardHovered ? '#38bdf8' : '#284b5d';
                            ctx.strokeRect(cardX, cardY, 350, 120);

                            ctx.fillStyle = '#dbe9ee';
                            ctx.font = 'bold 13px Arial';
                            ctx.fillText(node.name, cardX + 14, cardY + 24);

                            ctx.fillStyle = '#FFD700';
                            ctx.font = '12px Arial';
                            ctx.fillText(`Level ${node.level} / ${node.maxLevel}`, cardX + 14, cardY + 44);

                            // Invest Button inside card
                            const canInvest = points > 0 && node.level < node.maxLevel;
                            drawButton(`invest-${node.id}`, 'INVEST +1', cardX + 14, cardY + 65, 105, 30, canInvest ? '#00FF88' : '#526874', () => {
                                if (pilotSkillSystem.investPoint(node.id)) {
                                    SoundSystem.playUpgrade();
                                }
                            });

                            // Milestone 5 inside card
                            const m5Unlocked = node.milestonesUnlocked.includes(5);
                            const m5Ready = node.level >= 5 && !m5Unlocked;
                            const m5Color = m5Unlocked ? '#00FF88' : m5Ready ? '#FFD166' : '#526874';
                            drawButton(`milestone-5-${node.id}`, m5Unlocked ? 'M5 OK' : 'M5: 3pts/150K', cardX + 128, cardY + 65, 105, 24, m5Color, () => {
                                if (m5Ready) {
                                    const res = pilotSkillSystem.unlockMilestone(node.id, 5, gameState.score, gameState.level, points);
                                    if (res.success) {
                                        gameState.score -= res.cost;
                                        pilotSkillSystem.consumeSkillPoints(res.pointsCost);
                                        SoundSystem.playUpgrade();
                                    }
                                }
                            });

                            // Milestone 10 inside card
                            const m10Unlocked = node.milestonesUnlocked.includes(10);
                            const m10Ready = node.level >= 10 && !m10Unlocked;
                            const m10Color = m10Unlocked ? '#00FF88' : m10Ready ? '#FFD166' : '#526874';
                            drawButton(`milestone-10-${node.id}`, m10Unlocked ? 'M10 OK' : 'M10: 6pts/750K', cardX + 238, cardY + 65, 100, 24, m10Color, () => {
                                if (m10Ready) {
                                    const res = pilotSkillSystem.unlockMilestone(node.id, 10, gameState.score, gameState.level, points);
                                    if (res.success) {
                                        gameState.score -= res.cost;
                                        pilotSkillSystem.consumeSkillPoints(res.pointsCost);
                                        SoundSystem.playUpgrade();
                                    }
                                }
                            });

                            // Hover hitbox
                            shopHitboxes.push({
                                id: `skill-card-${node.id}`,
                                x: cardX,
                                y: cardY,
                                width: 350,
                                height: 120,
                                action: () => {}
                            });

                            if (hoveredShopItem === `skill-card-${node.id}`) {
                                hoveredSkillNode = node;
                            }
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
                            ctx.fillText(`• Status: Milestone 5 (${hoveredSkillNode.milestonesUnlocked.includes(5) ? 'Unlocked' : 'Locked'}), Milestone 10 (${hoveredSkillNode.milestonesUnlocked.includes(10) ? 'Unlocked' : 'Locked'})`, 72, 870);
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
                                    equipmentSystem.unequipPart(slot.type);
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
                                    equipmentSystem.equipPart(part.id);
                                });

                                const calibCost = equipmentSystem.getCalibrationCost(part);
                                const canCalib = part.level < equipmentSystem.getMaxLevelForTier(part.tier) && gameState.score >= calibCost;
                                drawButton(`calib-${part.id}`, `L+1 (${calibCost})`, partX + 76, partY + 54, 62, 24, canCalib ? '#FFD166' : '#526874', () => {
                                    const res = equipmentSystem.calibratePart(part.id, gameState.score);
                                    if (res.success) {
                                        gameState.score -= res.cost;
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
                            else if (hoveredPartData.type === 'shield') bonusDesc = `Grants +${(3 + (hoveredPartData.tier - 1) * 2 + hoveredPartData.level * 0.5).toFixed(1)}% shield capacity and recharge rate.`;
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
                            { key: '6', name: secretWeaponUnlocked ? 'Black Hole Projectile' : 'UNKNOWN', type: WeaponType.VOID_LANCE, accent: '#b06cff', locked: !secretWeaponUnlocked }
                        ];
                        weaponOptions.forEach((weapon, index) => {
                            const rowY = 342 + index * 92;
                            const currentLevel = weaponSystem.getCurrentLevel(weapon.type);
                            const levels = weaponSystem.getWeaponLevels(weapon.type);
                            const isLocked = weapon.locked;
                            const isSelected = !isLocked && weaponSystem.getCurrentWeapon() === weapon.type;
                            const nextLevel = isLocked ? null : (currentLevel < 0 ? levels[0] : levels[currentLevel + 1]);
                            const nextPowerCost = nextLevel ? powerSystem.getWeaponCost(weapon.type, currentLevel < 0 ? 0 : currentLevel + 1) : 0;
                            const canAfford = Boolean(nextLevel && gameState.score >= nextLevel.cost);
                            ctx.textAlign = 'left';
                            ctx.fillStyle = isSelected ? '#00FF88' : '#e6f1f5';
                            ctx.font = 'bold 18px Arial';
                            ctx.fillText(`${isSelected ? '▶ ' : ''}${weapon.key}. ${weapon.name}`, 48, rowY + 20);
                            ctx.fillStyle = '#8ea6b2';
                            ctx.font = '14px Arial';
                            ctx.fillText(isLocked ? 'CLASSIFIED • DEFEAT EVASIVE HUNTER' : (currentLevel < 0 ? 'NOT OWNED' : `LEVEL ${currentLevel + 1}/25`), 48, rowY + 43);
                            ctx.fillText(isLocked ? 'SIGNAL SEALED • HUNT THE SPECIAL TARGET' : (nextLevel ? `${nextLevel.description} • ${nextLevel.cost} pts` : 'MAXIMUM LEVEL'), 48, rowY + 64);
                            if (!isLocked && nextLevel) {
                                ctx.fillStyle = '#ffd166';
                                ctx.font = '12px Arial';
                                ctx.fillText(`Energy ${nextPowerCost.toFixed(1)} / shot`, 48, rowY + 83);
                            }
                            if (!isLocked) addButton(`weapon-select-${weapon.type}`, 38, rowY + 2, 540, 72, () => selectWeapon(weapon.type));
                            if (isLocked) drawButton(`weapon-locked-${weapon.type}`, 'LOCKED', 628, rowY + 16, 120, 42, '#7c5abf', () => undefined);
                            else if (nextLevel) drawButton(`weapon-upgrade-${weapon.type}`, currentLevel < 0 ? 'BUY' : 'UPGRADE', 628, rowY + 16, 130, 42, canAfford ? '#00FF88' : '#ff6666', () => upgradeWeapon(weapon.type));
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
                        drawCard(28, 156, 944, 730, 'HULL SYSTEMS // SHIP, SHIELD & GENERATOR', '#FFD166');
                        const systemsX = 48;
                        const systemsWidth = 904;
                        const actionX = 774;
                        const nextGeneratorCost = generatorCosts[powerSystem.generatorLevel + 1] ?? 0;
                        const generatorCanBuy = powerSystem.canUpgradeGenerator() && shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1) && gameState.score >= nextGeneratorCost;
                        const shieldCost = (shieldLevel + 1) * 2500;
                        const canBuyShield = shieldLevel < 10 && gameState.score >= shieldCost;

                        drawCard(systemsX, 328, systemsWidth, 116, 'POWER CORE // GENERATOR', '#FFD166');
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#FFD166';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(`LEVEL ${powerSystem.generatorLevel + 1}/50`, 72, 372);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        ctx.fillText(`Output ${powerSystem.getGeneratorOutput((pilotSkillSystem.getBonusMultiplier('generator_output') * pilotSkillSystem.getBonusMultiplier('generator_capacity'))).toFixed(0)} power/sec`, 72, 398);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.fillText('Generator upgrades increase recharge speed; capacity remains fixed.', 72, 424);
                        drawButton('systems-generator-upgrade', powerSystem.canUpgradeGenerator() ? `UPGRADE  ${nextGeneratorCost} PTS` : 'MAX GENERATOR', actionX, 365, 138, 42, generatorCanBuy ? '#00FF88' : '#ff6666', upgradeGenerator);

                        drawCard(systemsX, 456, systemsWidth, 116, 'DEFENSE GRID // SHIELD', '#00FFCC');
                        ctx.fillStyle = '#00FFCC';
                        ctx.font = 'bold 18px Arial';
                        ctx.fillText(`LEVEL ${shieldLevel}/10`, 72, 500);
                        ctx.fillStyle = '#dbe9ee';
                        ctx.font = '14px Arial';
                        ctx.fillText(`Max ${player.maxShield}  •  Recharge ${player.shieldRegenRate}/s`, 72, 526);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.fillText(`Next calibration: ${shieldCost} pts`, 72, 552);
                        drawButton('systems-shield-upgrade', shieldLevel < 10 ? `UPGRADE  ${shieldCost} PTS` : 'MAX SHIELD', actionX, 493, 138, 42, canBuyShield ? '#00FFCC' : '#ff6666', upgradeShield);

                        drawCard(systemsX, 584, systemsWidth, 396, `HULL FLEET // ACTIVE: ${shipSystem.getCurrentShip().name}`, '#f4fbff');
                        shipSystem.getAllShips().forEach((ship: any, index: number) => {
                            const shipY = 630 + index * 60;
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
                            ctx.fillText(`Weapon capacity ${ship.weaponCapacity}  •  Generator capacity ${ship.generatorCapacity}`, 72, shipY + 28);
                            drawButton(`systems-ship-${ship.id}`, isCurrent ? 'ACTIVE' : ship.id < shipSystem.getCurrentShipId() ? 'OWNED' : `BUY  ${ship.cost} PTS`, actionX, shipY + 2, 138, 38, isCurrent ? '#00FF88' : canBuy ? '#FFD166' : '#ff6666', () => purchaseShip(ship.id));
                        });
                        // drawShopFooter removed per user request to eliminate bottom buttons area
                        return;
                    }

                    drawCard(28, 156, 944, 730, 'TACTICAL OPS // SPECIAL ABILITIES', '#c59cff');
                    const abilityUnlocked = tacticalAbilitySystem.isSystemUnlocked(shipSystem.getCurrentShipId());
                    ctx.textAlign = 'left';
                    ctx.fillStyle = abilityUnlocked ? '#c59cff' : '#ff8f8f';
                    ctx.font = 'bold 17px Arial';
                    ctx.fillText(abilityUnlocked ? 'SYSTEM ONLINE  •  SELECT ONE ACTIVE MODULE' : 'SYSTEM LOCKED  •  REQUIRES DESTROYER HULL', 52, 342);
                    ctx.fillStyle = '#8ea4b2';
                    ctx.font = '14px Arial';
                    ctx.fillText('High-cost tactical systems charge from enemy defeats and are designed for decisive moments.', 52, 366);
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
                    // drawShopFooter removed per user request to eliminate bottom buttons area
                    return;

                    if (false) {
                        const leftX = 28;
                    const rightX = 412;
                    const cardTop = 232;
                    const cardWidth = 360;
                    // The cards are tall enough for all weapons and systems; the canvas wrapper scrolls on short screens.
                    drawCard(leftX, cardTop, cardWidth, 500, stageMasterySystem.hasWeaponMastery() ? 'WEAPONS // OVERKILL MATRIX' : 'WEAPONS', '#00CCDD');
                    drawCard(rightX, cardTop, cardWidth, 500, stageMasterySystem.hasAegisMastery() ? 'SYSTEMS & SHIPS // AEGIS MATRIX' : 'SYSTEMS & SHIPS', '#FFD700');

                    const secretWeaponUnlocked = weaponSystem.isSecretWeaponUnlocked();
                    const weaponOptions = [
                        { key: '1', name: 'Straight Shot', type: WeaponType.STRAIGHT, accent: '#8ee7ff', locked: false },
                        { key: '2', name: 'Spread Shot', type: WeaponType.SPREAD, accent: '#00FF88', locked: false },
                        { key: '3', name: 'Homing Missiles', type: WeaponType.HOMING, accent: '#ff66dd', locked: false },
                        { key: '4', name: 'Split Bomb', type: WeaponType.HEAVY, accent: '#ffb347', locked: false },
                        { key: '5', name: 'Pulse Laser', type: WeaponType.LASER, accent: '#00ffff', locked: false },
                        { key: '6', name: secretWeaponUnlocked ? 'Black Hole Projectile' : 'UNKNOWN', type: WeaponType.VOID_LANCE, accent: '#b06cff', locked: !secretWeaponUnlocked }
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
                        const status = isLocked ? 'CLASSIFIED • DEFEAT EVASIVE HUNTER' : (currentLevel < 0 ? 'NOT OWNED' : `LEVEL ${currentLevel + 1}/15`);
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
                    ctx.fillText(`Output: ${powerSystem.getGeneratorOutput((pilotSkillSystem.getBonusMultiplier('generator_output') * pilotSkillSystem.getBonusMultiplier('generator_capacity'))).toFixed(0)} power/sec`, rightX + 16, generatorY + 31);
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
                        mCheatGranted = false;
                        testNoticeText = 'TEST MODE // HOLD M 8s TO GRANT CREDITS';
                        testNoticeUntil = performance.now() + 8000;
                    }
                    return;
                }
                if (e.key === 'l' || e.key === 'L') {
                    e.preventDefault();
                    requestStageJump();
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

                // A user key press is a valid browser gesture for resuming the AudioContext.
                if (!gameState.gameOver && !gameState.showLevelScreen) SoundSystem.startMusic();

                // Weapon selection available anytime (except game over)
                if (!gameState.gameOver && !gameState.showLevelScreen) {
                    if (e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                        toggleTacticalAbility();
                        return;
                    } else if (e.key === '1') {
                        e.preventDefault();
                        weaponSystem.setCurrentWeapon(WeaponType.STRAIGHT);
                        const stats = weaponSystem.getCurrentWeaponStats();
                        if (stats) player.setWeapon('straight', weaponSystem.getCurrentLevel(WeaponType.STRAIGHT), stats.fireRate, stats.damage);
                        return;
                    } else if (e.key === '2') {
                        e.preventDefault();
                        if (weaponSystem.setCurrentWeapon(WeaponType.SPREAD)) {
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('spread', weaponSystem.getCurrentLevel(WeaponType.SPREAD), stats.fireRate, stats.damage);
                        }
                        return;
                    } else if (e.key === '3') {
                        e.preventDefault();
                        if (weaponSystem.setCurrentWeapon(WeaponType.HOMING)) {
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('homing', weaponSystem.getCurrentLevel(WeaponType.HOMING), stats.fireRate, stats.damage);
                        }
                        return;
                    } else if (e.key === '4') {
                        e.preventDefault();
                        if (weaponSystem.setCurrentWeapon(WeaponType.HEAVY)) {
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('heavy', weaponSystem.getCurrentLevel(WeaponType.HEAVY), stats.fireRate, stats.damage);
                        }
                        return;
                    } else if (e.key === '5') {
                        e.preventDefault();
                        selectWeapon(WeaponType.LASER);
                        return;
                    } else if (e.key === '6') {
                        e.preventDefault();
                        selectWeapon(WeaponType.VOID_LANCE);
                        return;
                    }
                }

                if (gameState.showLevelScreen) {
                    if (shopScreen === 'finale_victory') {
                        e.preventDefault();
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') setGameStarted(false);
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
                    mCheatGranted = false;
                }
            };
            const handleWindowBlur = (): void => {
                touchInputRef.current.moveX = 0;
                touchInputRef.current.moveY = 0;
                touchInputRef.current.fire = false;
            };
            const canvas = game.getCanvas();
            const getShopPoint = (event: MouseEvent): { x: number; y: number } => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: (event.clientX - rect.left) * (canvas.width / rect.width),
                    y: (event.clientY - rect.top) * (canvas.height / rect.height)
                };
            };

            const handleCanvasMouseMove = (event: MouseEvent): void => {
                if (!gameState.showLevelScreen && !showCommsModal) {
                    hoveredShopItem = null;
                    canvas.style.cursor = 'default';
                    return;
                }
                const point = getShopPoint(event);
                const hit = shopHitboxes.find((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
                const nextHoveredShopItem = hit?.id ?? null;
                if (nextHoveredShopItem !== hoveredShopItem && nextHoveredShopItem) {
                    const hoveredWeaponType = Object.values(WeaponType).find((type) => nextHoveredShopItem.endsWith(type));
                    if (hoveredWeaponType) setWeaponHoverBriefing(hoveredWeaponType);
                }
                hoveredShopItem = nextHoveredShopItem;
                canvas.style.cursor = hit ? 'pointer' : 'default';
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
                clearInterval(langUnsubCheck);
                game.stop();
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                window.removeEventListener('blur', handleWindowBlur);
                touchActionsRef.current.toggleAbility = undefined;
                handleWindowBlur();
                canvas.removeEventListener('mousemove', handleCanvasMouseMove);
                canvas.removeEventListener('click', handleCanvasClick);
                canvas.style.cursor = 'default';
            };
            window.removeEventListener('tyrian:jump-to-stage', handleStageJumpEvent as EventListener);
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }, [gameStarted, startFromResume]);

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
        if (active) event.currentTarget.setPointerCapture(event.pointerId);
        else if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const activateTouchAbility = (event: ReactPointerEvent<HTMLButtonElement>): void => {
        event.preventDefault();
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
                    <h2>TYRIAN <span>2000</span></h2>
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

    const triggerStageJump = (requestedStage: number): void => {
        const targetStage = Math.max(1, Math.min(CampaignSystem.TOTAL_STAGES, Math.floor(requestedStage)));
        setMaxUnlockedLevel((prev) => {
            const nextMax = Math.max(prev, targetStage);
            localStorage.setItem('tyrian_max_unlocked_level', String(nextMax));
            return nextMax;
        });
        if (gameRef.current) {
            // Trigger jump through window custom event or direct reset if game instance is active
            window.dispatchEvent(new CustomEvent('tyrian:jump-to-stage', { detail: targetStage }));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6 w-full">
            {showStageMapModal && (
                <StageSelectModal
                    maxUnlockedLevel={maxUnlockedLevel}
                    onSelectStage={(stageNum) => {
                        setShowStageMapModal(false);
                        triggerStageJump(stageNum);
                    }}
                    onClose={() => setShowStageMapModal(false)}
                />
            )}
            <div
                className="game-stage-shell w-full max-w-[1200px] max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-lg border border-green-500/20 bg-black/30"
                aria-label="Scrollable game viewport"
            >
                <canvas
                    ref={canvasRef}
                    id="gameCanvas"
                    className="block w-full h-auto border-2 border-green-500 bg-black shadow-lg shadow-green-500/50"
                />
                {showTouchControls && (
                    <div className="mobile-touch-layer" aria-label="Touch flight controls">
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
                        <div className="mobile-action-zone">
                            <button
                                type="button"
                                className="mobile-ability-button"
                                aria-label="Tap to activate or stop the tactical ability"
                                onPointerDown={activateTouchAbility}
                                onContextMenu={(event) => event.preventDefault()}
                            >
                                <span>TACTICAL</span>
                                <small>TAP ON / OFF</small>
                            </button>
                            <button
                                type="button"
                                className="mobile-fire-button"
                                aria-label="Hold to fire"
                                onPointerDown={(event) => setTouchFire(true, event)}
                                onPointerUp={(event) => setTouchFire(false, event)}
                                onPointerCancel={(event) => setTouchFire(false, event)}
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
                <p><span className="text-green-400 font-semibold">Arrow Keys</span> move · <span className="text-green-400 font-semibold">Space</span> fires · <span className="text-green-400 font-semibold">E</span> toggles tactical</p>
                {showTouchControls && <p className="mobile-input-hint">On mobile: drag the left joystick, hold FIRE, and tap TACTICAL to start or stop the ability.</p>}
            </div>
        </div>
    );
}
