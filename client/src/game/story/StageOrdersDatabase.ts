import type { CharacterId } from './CampaignSystem';

export type MissionType = 'patrol' | 'defense' | 'escort' | 'bounty' | 'recovery' | 'singularity';

export interface ContactBrief {
    speaker: CharacterId;
    name: string;
    message: string;
}

export interface StageOrderEntry {
    stage: number;
    speaker: CharacterId;
    name: string;
    code: string;
    message: string;
    inMissionComms?: {
        speaker: CharacterId;
        name: string;
        message: string;
    };
    missionType: MissionType;
    missionTargetName: string;
    bountyReward: number;
}

export const STAGE_ORDERS_DATABASE: StageOrderEntry[] = [
    // Chapter 1: The Ark-9 Patrols (Stages 1–10)
    {
        stage: 1, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'ARK-9 // SECTOR 01',
        message: 'The prototype is small because it was never designed to win a war. It was designed to reach the place no fleet can reach.',
        missionType: 'patrol', missionTargetName: 'Sector 01 Perimeter Beacon', bountyReward: 1000
    
},
    {
        stage: 2, speaker: 'elena', name: 'Commander Elena Vail', code: 'ZONE-A // PATROL',
        message: 'First watch is clean, Program Zero. Keep your sensors on the freight lanes and report any unregistered signature.',
        missionType: 'patrol', missionTargetName: 'Meridian Lane Patrol Grid', bountyReward: 1200
    
},
    {
        stage: 3, speaker: 'elena', name: 'Commander Elena Vail', code: 'SECTOR-02 // DUSTLINE',
        message: 'Smugglers have been dropping cargo crates near the dustline. Check the debris and clear any hostile scout wings.',
        missionType: 'recovery', missionTargetName: 'Abandoned Smuggler Cargo Crate', bountyReward: 1500
    
},
    {
        stage: 4, speaker: 'elena', name: 'Commander Elena Vail', code: 'ORBIT-04 // BEACON',
        message: 'Navigation beacon 14 has stopped transmitting its handshake. Investigate the quiet orbit immediately.',
        missionType: 'defense', missionTargetName: 'Navigation Relay 14', bountyReward: 1800
    
},
    {
        stage: 5, speaker: 'elena', name: 'Commander Elena Vail', code: 'LANE-05 // CONVOY',
        message: 'A civilian freighter reported intermittent jamming. Sweep the convoy route and escort them past the belt.',
        missionType: 'escort', missionTargetName: 'Civilian Freighters Convoy', bountyReward: 2200
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 6, speaker: 'elena', name: 'Commander Elena Vail', code: 'DEEP-SPACE // RELAY 06',
        message: 'Unregistered military telemetry is bouncing off the relay. Someone is testing encrypted channel switches.',
        missionType: 'patrol', missionTargetName: 'Encrypted Relay Node', bountyReward: 2500
    
},
    {
        stage: 7, speaker: 'elena', name: 'Commander Elena Vail', code: 'SECTOR-03 // DISTRESS',
        message: 'We received a false distress call from Sector 3. It was a bait trap—eliminate the ambush wing.',
        missionType: 'bounty', missionTargetName: 'Ambush Decoy Vessel', bountyReward: 3000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Target sighted. The distress call was bait—break the ambush wing before it closes on the route.' }
},
    {
        stage: 8, speaker: 'elena', name: 'Commander Elena Vail', code: 'OUTPOST-08 // FIRE',
        message: 'Supply outpost 8 is under heavy kinetic fire. Provide immediate tactical cover until reinforcements arrive.',
        missionType: 'defense', missionTargetName: 'Outpost 8 Defense Platform', bountyReward: 3500
    
},
    {
        stage: 9, speaker: 'elena', name: 'Commander Elena Vail', code: 'RED-ZONE // ANOMALY 09',
        message: 'A fast un-flagged hull just crossed the sector border. It is moving like an experimental hunter—intercept it.',
        missionType: 'bounty', missionTargetName: 'Evasive Hunter Prototype', bountyReward: 5000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Target sighted. The hunter is faster than standard raiders—do not let it cross the sector border.' }
},
    {
        stage: 10, speaker: 'elena', name: 'Commander Elena Vail', code: 'ARK-9 // CORE INTERFACE',
        message: 'Those raiders are reading sealed military routes. Someone high up in the chain is feeding them our maps.',
        missionType: 'singularity', missionTargetName: 'Ark-9 Command Terminal', bountyReward: 7500
    
},

    // Chapter 2: Vanishing Convoys (Stages 11–20)
    {
        stage: 11, speaker: 'elena', name: 'Commander Elena Vail', code: 'MERIDIAN // BOUNTY 11',
        message: 'A pirate captain took the missing convoy through the asteroid cluster. Hunt the captain down and collect the Meridian bounty.',
        missionType: 'bounty', missionTargetName: 'Meridian Pirate Captain', bountyReward: 4500
    
},
    {
        stage: 12, speaker: 'ghost', name: 'GHOST', code: 'FREIGHT-LANE // WRECK 12',
        message: 'Three cargo hulls found dead in space. Their navigation cores were wiped clean before they lost power.',
        missionType: 'recovery', missionTargetName: 'Wiped Navigation Core', bountyReward: 2400
    
},
    {
        stage: 13, speaker: 'elena', name: 'Commander Elena Vail', code: 'CARRIER-13 // ABANDONED',
        message: 'An empty military carrier is drifting without life support. Boarding drones report unauthorized entry.',
        missionType: 'defense', missionTargetName: 'Drifting Carrier Hull', bountyReward: 2800
    
},
    {
        stage: 14, speaker: 'ghost', name: 'GHOST', code: 'SIGNAL-BAY // HARVEST 14',
        message: 'Enemy signal harvesters are sucking tactical data straight out of the local comms buoy. Destroy them.',
        missionType: 'patrol', missionTargetName: 'Signal Harvester Drone', bountyReward: 3200
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 15, speaker: 'elena', name: 'Commander Elena Vail', code: 'BLACKOUT // ZONE 15',
        message: 'We have three minutes of total communications blackout across the meridian. Hold your perimeter!',
        missionType: 'defense', missionTargetName: 'Meridian Perimeter Grid', bountyReward: 3800
    
},
    {
        stage: 16, speaker: 'elena', name: 'Commander Elena Vail', code: 'RAIDER-GRID // 16',
        message: 'Unmarked raider corvettes are swarming the shipping lanes. Show them no quarter.',
        missionType: 'bounty', missionTargetName: 'Raider Corvette Leader', bountyReward: 4200
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 17, speaker: 'ghost', name: 'GHOST', code: 'SALVAGE-TRAP // 17',
        message: 'That distress signal is an automated trap. Heavy mines and automated turrets are blanketing the approach.',
        missionType: 'defense', missionTargetName: 'Automated Minefield Grid', bountyReward: 4800
    
},
    {
        stage: 18, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'ZERO-CORRIDOR // 18',
        message: 'Another hunter signature just crossed our scope. If you drop it, the hidden weapon schematics will be ours.',
        missionType: 'bounty', missionTargetName: 'Evasive Hunter MK-II', bountyReward: 6000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 19, speaker: 'ghost', name: 'GHOST', code: 'FAMILIAR-WERE // 19',
        message: 'The wreckage debris matches experimental armor plating from our own black-budget laboratories.',
        missionType: 'recovery', missionTargetName: 'Classified Armor Fragment', bountyReward: 5500
    
},
    {
        stage: 20, speaker: 'elena', name: 'Commander Elena Vail', code: 'REDACTED // ARCHIVE 20',
        message: 'There are no civilian records for these raider hulls. They belong to a command cell that doesn’t exist on paper.',
        missionType: 'singularity', missionTargetName: 'Shadow Archive Server', bountyReward: 8500
    
},

    // Chapter 3: The Broken Order (Stages 21–30)
    {
        stage: 21, speaker: 'elena', name: 'Commander Elena Vail', code: 'COMMAND // FILE 21',
        message: 'Follow the order, pilot. If the order is compromised, bring me proof before you bring me questions.',
        missionType: 'patrol', missionTargetName: 'Command Audit Drone', bountyReward: 3000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 22, speaker: 'ghost', name: 'GHOST', code: 'FRIENDLY-FIRE // 22',
        message: 'Command just classified our patrol wing as hostile targets. Watch your back—our own fleet is firing.',
        missionType: 'defense', missionTargetName: 'Loyalist Interceptor Wing', bountyReward: 3500
    
},
    {
        stage: 23, speaker: 'ghost', name: 'GHOST', code: 'COLONY-04 // SILENT',
        message: 'Mining colony 4 is completely silent. No distress beacons, no automated replies. Proceed with caution.',
        missionType: 'recovery', missionTargetName: 'Colony Comms Terminal', bountyReward: 4000
    
},
    {
        stage: 24, speaker: 'ghost', name: 'GHOST', code: 'SILENCE-GRID // 24',
        message: 'An automated suppression grid is active. Every transmission out of this sector is being intercepted.',
        missionType: 'defense', missionTargetName: 'Suppression Grid Node', bountyReward: 4500
    
},
    {
        stage: 25, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'LAB-RECOVERY // 25',
        message: 'Burn the evidence before the inspection fleet arrives. We cannot let them confiscate Program Zero.',
        missionType: 'recovery', missionTargetName: 'Research Lab Core', bountyReward: 5000
    
},
    {
        stage: 26, speaker: 'ghost', name: 'GHOST', code: 'PILOT-LOG // 26',
        message: 'Recovered a downed pilot log: they were ordered to hunt down their own comrades without explanation.',
        missionType: 'recovery', missionTargetName: 'Downed Flight Recorder', bountyReward: 5500
    
},
    {
        stage: 27, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'HUNTER-SECTOR // 27',
        message: 'Another experimental hunter is inbound. Defeat it and claim the classified weapon schematics.',
        missionType: 'bounty', missionTargetName: 'Evasive Hunter MK-III', bountyReward: 7000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 28, speaker: 'elena', name: 'Commander Elena Vail', code: 'OVERRIDE-28',
        message: 'High Command issued a total capture-or-destroy directive for Program Zero. What did you uncover, pilot?',
        missionType: 'bounty', missionTargetName: 'Enforcer Vanguard', bountyReward: 6500
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 29, speaker: 'ghost', name: 'GHOST', code: 'COST-OF-OBEDIENCE // 29',
        message: 'Obedience has a price, and command is paying for it with our lives. Prepare for a fight.',
        missionType: 'defense', missionTargetName: 'Command Barrage Platform', bountyReward: 7500
    
},
        {
        stage: 30, speaker: 'elena', name: 'Commander Elena Vail', code: 'DUEL-PREP // 30',
        message: 'A military flight trial is scheduled for tomorrow. Sera Kane will test Program Zero under an official order, but no live fleet support is authorized.',
        missionType: 'patrol', missionTargetName: 'Experimental Flight Trial Range', bountyReward: 4000
    
},
    // Chapter 4: Runaway Protocol (Stages 31–40)
    {
        stage: 31, speaker: 'sera', name: 'Sera Kane', code: 'MIRROR-DUEL // 31',
        message: 'Two experimental pilots. Two mirrored loadouts. One private trial to discover who is controlling the orders.',
        missionType: 'bounty', missionTargetName: 'Sera Kane Experimental Craft', bountyReward: 15500
    ,
    inMissionComms: { speaker: 'sera', name: 'Sera Kane', message: 'No escorts. No fleet fire. Just our two prototypes and the truth hidden in their telemetry.' }
},
    {
        stage: 32, speaker: 'sera', name: 'Sera Kane', code: 'DUEL-AFTERMATH // 32',
        message: 'The duel is over. Recover the telemetry archive before the fleet edits the result.',
        missionType: 'recovery', missionTargetName: 'Mirror Trial Telemetry Archive', bountyReward: 5000
    
},
    {
        stage: 33, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'SCRAP-MOON // 33',
        message: 'Duck into the scrap-moon asteroid belt. The radar clutter will buy us enough time to re-calibrate.',
        missionType: 'patrol', missionTargetName: 'Scrap Asteroid Cluster', bountyReward: 5000
    
},
    {
        stage: 34, speaker: 'sera', name: 'Sera Kane', code: 'LONG-BURN // 34',
        message: 'You cannot outrun a military pursuit grid for long, pilot. Pull over before this gets messy.',
        missionType: 'bounty', missionTargetName: 'Pursuit Interceptor Lead', bountyReward: 5500
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 35, speaker: 'ghost', name: 'GHOST', code: 'STATIC-HAND // 35',
        message: 'An underground contact is whispering on our emergency frequency. Follow the static.',
        missionType: 'recovery', missionTargetName: 'Underground Beacon', bountyReward: 6000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 36, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'FUEL-CACHE // 36',
        message: 'We found a hidden underground fuel cache. Restock your reactor and check your generator output.',
        missionType: 'recovery', missionTargetName: 'Hidden Fuel Depot', bountyReward: 6500
    
},
    {
        stage: 37, speaker: 'sera', name: 'Sera Kane', code: 'PURSUIT-WING // 37',
        message: 'My pursuit wing has your coordinates bracketed. Drop your shields and surrender.',
        missionType: 'bounty', missionTargetName: 'Pursuit Squadron Lead', bountyReward: 7000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 38, speaker: 'ghost', name: 'GHOST', code: 'DEAD-CHANNEL // 38',
        message: 'Military channels are dead silent. They are preparing an orbital blockade ahead of us.',
        missionType: 'defense', missionTargetName: 'Blockade Flagship', bountyReward: 8000
    
},
    {
        stage: 39, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'DEFECTION // 39',
        message: 'First underground defection confirmed. Friendly rebels have opened a secret corridor through the blockade.',
        missionType: 'escort', missionTargetName: 'Rebel Corridor Gate', bountyReward: 8500
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 40, speaker: 'sera', name: 'Sera Kane', code: 'RUNAWAY // 40',
        message: 'You slipped through the blockade, Program Zero. But the outer rim is where things get truly dangerous.',
        missionType: 'singularity', missionTargetName: 'Rim Gate Array', bountyReward: 15000
    
},

    // Chapter 5: The Fleet Beneath the Fleet (Stages 41–50)
    {
        stage: 41, speaker: 'ghost', name: 'GHOST', code: 'BLACK-RELAY // 41',
        message: 'We detected a massive shadow fleet hiding inside the gas giant’s rings. They answer to no government.',
        missionType: 'patrol', missionTargetName: 'Shadow Scout Lead', bountyReward: 6000
    
},
    {
        stage: 42, speaker: 'sera', name: 'Sera Kane', code: 'FALSE-COLORS // 42',
        message: 'Those ships are wearing false military colors. Someone is staging a war behind both our backs.',
        missionType: 'bounty', missionTargetName: 'False-Flag Cruiser', bountyReward: 6500
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 43, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'GHOST-HANGAR // 43',
        message: 'Scanned an abandoned orbital hangar filled with unregistered dreadnought hulls. They were building an armada.',
        missionType: 'recovery', missionTargetName: 'Dreadnought Hangar Core', bountyReward: 7000
    
},
    {
        stage: 44, speaker: 'ghost', name: 'GHOST', code: 'BORROWED-CODES // 44',
        message: 'The shadow fleet is using encrypted command codes stolen from High Command archives.',
        missionType: 'recovery', missionTargetName: 'Code Relay Beacon', bountyReward: 7500
    
},
    {
        stage: 45, speaker: 'sera', name: 'Sera Kane', code: 'UNSEEN-ADMIRAL // 45',
        message: 'An unseen admiral is pulling the strings from the central nexus. We need to dismantle their relay grid.',
        missionType: 'singularity', missionTargetName: 'Admiral Nexus Core', bountyReward: 10000
    
},
    {
        stage: 46, speaker: 'ghost', name: 'GHOST', code: 'FLEET-WITHIN // 46',
        message: 'The shadow fleet has sleeper cells embedded in every major defense squadron across Ark-9.',
        missionType: 'defense', missionTargetName: 'Sleeper Cell Node', bountyReward: 8000
    
},
    {
        stage: 47, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'DOOR-WITHOUT-KEY // 47',
        message: 'Found a secure vault door with no keycode. Program Zero’s resonance field is the only thing that can open it.',
        missionType: 'recovery', missionTargetName: 'Secure Vault Door', bountyReward: 8500
    
},
    {
        stage: 48, speaker: 'ghost', name: 'GHOST', code: 'SIGNAL-BURIAL // 48',
        message: 'They tried to bury the distress signals in deep-space white noise. We cleaned the logs.',
        missionType: 'patrol', missionTargetName: 'White Noise Jammer', bountyReward: 9000
    
},
    {
        stage: 49, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'ARCHITECT-MARK // 49',
        message: 'Every ship in the shadow fleet bears the mark of the gate architect. This conspiracy goes back decades.',
        missionType: 'recovery', missionTargetName: 'Architect Obelisk', bountyReward: 9500
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 50, speaker: 'sera', name: 'Sera Kane', code: 'NEXUS-50',
        message: 'Program Zero, if we don’t break their nexus now, the entire galaxy will be caught in their manufactured war.',
        missionType: 'singularity', missionTargetName: 'Shadow Fleet Master Nexus', bountyReward: 18000
    
},

    // Chapter 6: Program Zero (Stages 51–60)
    {
        stage: 51, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'PROTOTYPE-WAKE // 51',
        message: 'The prototype reactor is waking up to its true frequency. Expect strange sensor anomalies in this sector.',
        missionType: 'patrol', missionTargetName: 'Frequency Sensor Buoy', bountyReward: 7000
    
},
    {
        stage: 52, speaker: 'ghost', name: 'GHOST', code: 'FOUR-CHASSIS // 52',
        message: 'The database confirms: four experimental chassis were built. We are flying the first, but where are the others?',
        missionType: 'recovery', missionTargetName: 'Chassis Log Terminal', bountyReward: 7500
    
},
    {
        stage: 53, speaker: 'elena', name: 'Commander Elena Vail', code: 'MISSING-FLIGHT // 53',
        message: 'The flight logs for Program Zero were sealed by order of the Supreme Council twenty years ago.',
        missionType: 'recovery', missionTargetName: 'Sealed Archive Node', bountyReward: 8000
    
},
    {
        stage: 54, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'ENGINE-ROOM // 54',
        message: 'The engine room telemetry is synchronizing with the gate frequency. Keep your generator output stable.',
        missionType: 'defense', missionTargetName: 'Gate Telemetry Station', bountyReward: 8500
    
},
    {
        stage: 55, speaker: 'ghost', name: 'GHOST', code: 'FIRST-PILOT // 55',
        message: 'Recovered audio from the very first test flight: "It isn’t an engine. It’s a receiver."',
        missionType: 'recovery', missionTargetName: 'Test Flight Black Box', bountyReward: 9000
    
},
    {
        stage: 56, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'MEMORY-HULL // 56',
        message: 'The titanium hull remembers every battle. The weapon calibrations are adapting to your combat style.',
        missionType: 'patrol', missionTargetName: 'Hull Calibration Node', bountyReward: 9500
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 57, speaker: 'sera', name: 'Sera Kane', code: 'FAILED-WAR // 57',
        message: 'The war they are trying to start now? It was fought and lost in secret twenty years ago.',
        missionType: 'recovery', missionTargetName: 'Secret War Memorial', bountyReward: 10000
    
},
    {
        stage: 58, speaker: 'ghost', name: 'GHOST', code: 'ZERO-SHADOW // 58',
        message: 'Shadow telemetry is matching our exact flight path. Something is hunting Program Zero specifically.',
        missionType: 'bounty', missionTargetName: 'Shadow Hunter Vanguard', bountyReward: 11000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 59, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'UPGRADE-PRICE // 59',
        message: 'Every upgrade pushes the chassis closer to its design limit. Watch your power draw!',
        missionType: 'defense', missionTargetName: 'Power Limit Regulator', bountyReward: 11500
    
},
    {
        stage: 60, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'PROGRAM-ZERO // 60',
        message: 'Program Zero is fully online. Now we find out why they tried to bury us.',
        missionType: 'singularity', missionTargetName: 'Program Zero Core', bountyReward: 20000
    
},

    // Chapter 7: Civil War in Orbit (Stages 61–70)
    {
        stage: 61, speaker: 'elena', name: 'Commander Elena Vail', code: 'SPLIT-COMMAND // 61',
        message: 'The defense grid has split into loyalist and rebel factions. Choose your targets carefully.',
        missionType: 'defense', missionTargetName: 'Faction Relay Station', bountyReward: 8000
    
},
    {
        stage: 62, speaker: 'sera', name: 'Sera Kane', code: 'FRIENDLY-HUNTERS // 62',
        message: 'Loyalist hunter wings are deploying experimental munitions across the orbital ring.',
        missionType: 'bounty', missionTargetName: 'Loyalist Hunter Lead', bountyReward: 8500
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 63, speaker: 'ghost', name: 'GHOST', code: 'DEFECTOR-LINE // 63',
        message: 'Defector supply lines are under artillery barrage from orbital defense platforms.',
        missionType: 'escort', missionTargetName: 'Defector Supply Train', bountyReward: 9000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 64, speaker: 'elena', name: 'Commander Elena Vail', code: 'PORT-HELIX // 64',
        message: 'Port Helix is under total siege. Break the enemy lines and secure landing clearance.',
        missionType: 'defense', missionTargetName: 'Port Helix Defense Shield', bountyReward: 10000
    
},
    {
        stage: 65, speaker: 'sera', name: 'Sera Kane', code: 'TWO-FLAGS // 65',
        message: 'Two flags flying over the same shattered station. This civil war is tearing the sector apart.',
        missionType: 'patrol', missionTargetName: 'Shattered Station Core', bountyReward: 10500
    
},
    {
        stage: 66, speaker: 'ghost', name: 'GHOST', code: 'LOYALTY-TEST // 66',
        message: 'An automated loyalty broadcast is flooding all comm channels. Mute it and focus on the enemy.',
        missionType: 'patrol', missionTargetName: 'Loyalty Broadcast Buoy', bountyReward: 11000
    
},
    {
        stage: 67, speaker: 'elena', name: 'Commander Elena Vail', code: 'COMMANDERS-WAR // 67',
        message: 'Commanders on both sides refuse to negotiate. Only raw firepower will force them to listen.',
        missionType: 'bounty', missionTargetName: 'Stubborn Commander Vessel', bountyReward: 12000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 68, speaker: 'ghost', name: 'GHOST', code: 'LAST-OFFICIAL // 68',
        message: 'The last official military order has been countermanded by three separate admirals.',
        missionType: 'recovery', missionTargetName: 'Admiral Countermand Terminal', bountyReward: 12500
    
},
    {
        stage: 69, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'DOUBT-FLEET // 69',
        message: 'Half the enemy fleet is hesitating on our approach. They know the war is built on a lie.',
        missionType: 'escort', missionTargetName: 'Hesitant Fleet Vanguard', bountyReward: 13000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 70, speaker: 'sera', name: 'Sera Kane', code: 'ORBITAL-CIVIL-WAR // 70',
        message: 'Orbital civil war reaches its climax here. Clear the sector so we can reach the gate network.',
        missionType: 'singularity', missionTargetName: 'Civil War Capital Ship', bountyReward: 22000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},

    // Chapter 8: The Gate Network (Stages 71–80)
    {
        stage: 71, speaker: 'ghost', name: 'GHOST', code: 'DEAD-CHANNEL // 71',
        message: 'Sera stayed near the pilot after the trial. Her prototype is now being hunted by the same copied command signature.',
        missionType: 'patrol', missionTargetName: 'Debris Corridor Patrol', bountyReward: 10000
    
},
    {
        stage: 72, speaker: 'ghost', name: 'GHOST', code: 'TWIN-BOUNTY // 72',
        message: 'Two pirate lieutenants carry two bounty contracts with the same forged timestamp. Hunt them together before the evidence disappears.',
        missionType: 'bounty', missionTargetName: 'Twin Pirate Lieutenants', bountyReward: 11000
    ,
            inMissionComms: { speaker: 'sera', name: 'Sera Kane', message: 'The second lieutenant is breaking formation. I am cutting off the escape vector—keep the evidence intact.' }
},
    {
        stage: 73, speaker: 'elena', name: 'Commander Elena Vail', code: 'GLASS-CONVOY // 73',
        message: 'A civilian convoy is entering the asteroid field. Sera takes the right lane; Program Zero clears the left.',
        missionType: 'escort', missionTargetName: 'Glass Civilian Convoy', bountyReward: 12000
    
},
    {
        stage: 74, speaker: 'elena', name: 'Commander Elena Vail', code: 'RECALL-ORDER // 74',
        message: 'Elite military interceptors are inbound with orders to capture both experimental craft. That order is not mine.',
        missionType: 'bounty', missionTargetName: 'Military Capture Wing', bountyReward: 13000
    
},
    {
        stage: 75, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'BLACK-TRANSIT // 75',
        message: 'A moving micro-singularity is bending every shot across the field. Sera can read the distortion—listen to her.',
        missionType: 'singularity', missionTargetName: 'Micro-Singularity Transit Field', bountyReward: 14000
    ,
            inMissionComms: { speaker: 'naomi', name: 'Dr. Naomi Ren', message: 'Gravity lens is shifting left. Sera is reading the field correctly—follow her lane and save your reactor.' }
},
    {
        stage: 76, speaker: 'ghost', name: 'GHOST', code: 'SHIPYARD-ZERO // 76',
        message: 'An abandoned megastructure is blocking movement and fire. Destroy its data cores before the fleet can erase them.',
        missionType: 'recovery', missionTargetName: 'Shipyard Zero Data Cores', bountyReward: 15000
    
},
    {
        stage: 77, speaker: 'ghost', name: 'GHOST', code: 'RED-KNIFE // 77',
        message: 'High-value bounty: a military officer who sold prototype flight data. I need the target alive if possible.',
        missionType: 'bounty', missionTargetName: 'Red Knife Data Broker', bountyReward: 16000
    ,
            inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Red Knife is transmitting the stolen flight archive. Do not destroy the relay until the download completes.' }
},
    {
        stage: 78, speaker: 'ghost', name: 'GHOST', code: 'MORALE-BREAKER // 78',
        message: 'A distorted strategic signal is calling both prototypes defective copies. It knows a private phrase from Sera’s test program.',
        missionType: 'patrol', missionTargetName: 'Morale Broadcast Array', bountyReward: 17000
    
},
    {
        stage: 79, speaker: 'sera', name: 'Sera Kane', code: 'LONG-COVER // 79',
        message: 'A refugee carrier needs cover on the far corridor. The highest-value target is escaping, but I am staying with the civilians.',
        missionType: 'defense', missionTargetName: 'Refugee Carrier Corridor', bountyReward: 18000
    
},
    {
        stage: 80, speaker: 'ghost', name: 'GHOST', code: 'FRACTURE-LINE // 80',
        message: 'The command wreck carries the copied key. It will enter after the first waves, near the moving singularity and wreck field.',
        missionType: 'bounty', missionTargetName: 'Fracture Line Command Wreck', bountyReward: 25000
    
},

    // Chapter 9: The Last Alliance (Stages 81–90)
    {
        stage: 81, speaker: 'elena', name: 'Commander Elena Vail', code: 'UNEASY-ESCORT // 81',
        message: 'Loyalists and rebels are flying in the same formation for the first time. Keep them protected.',
        missionType: 'escort', missionTargetName: 'Alliance Vanguard Convoy', bountyReward: 14000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 82, speaker: 'sera', name: 'Sera Kane', code: 'OLD-ENEMIES // 82',
        message: 'Fighting alongside old enemies feels strange, but the shadow fleet leaves us no choice.',
        missionType: 'patrol', missionTargetName: 'Joint Patrol Checkpoint', bountyReward: 15000
    
},
    {
        stage: 83, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'SERA-SIGNAL // 83',
        message: 'Sera’s fleet has secured the perimeter relay. Hold the center lane against the counter-attack.',
        missionType: 'defense', missionTargetName: 'Perimeter Relay Station', bountyReward: 16000
    
},
    {
        stage: 84, speaker: 'ghost', name: 'GHOST', code: 'JOINT-STRIKE // 84',
        message: 'Joint strike package is away. Target the flagship’s missile batteries first.',
        missionType: 'bounty', missionTargetName: 'Alliance Strike Target', bountyReward: 17000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 85, speaker: 'elena', name: 'Commander Elena Vail', code: 'NO-ONE-FLIES-ALONE // 85',
        message: 'No one flies alone today. Watch your wingman and keep the formation tight.',
        missionType: 'escort', missionTargetName: 'Wingman Lead Vessel', bountyReward: 18000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 86, speaker: 'ghost', name: 'GHOST', code: 'BROKEN-FORMATION // 86',
        message: 'Enemy suicide interceptors are trying to break our joint formation. Intercept them!',
        missionType: 'defense', missionTargetName: 'Suicide Interceptor Lead', bountyReward: 19000
    
},
    {
        stage: 87, speaker: 'sera', name: 'Sera Kane', code: 'DEBT-REPAID // 87',
        message: 'That debt is repaid, Program Zero. Now let’s finish what we started together.',
        missionType: 'patrol', missionTargetName: 'Alliance Honor Beacon', bountyReward: 20000
    
},
    {
        stage: 88, speaker: 'elena', name: 'Commander Elena Vail', code: 'ALLIANCE-TEST // 88',
        message: 'The alliance test is under heavy fire from the core dreadnoughts.',
        missionType: 'defense', missionTargetName: 'Alliance Defense Anchor', bountyReward: 22000
    
},
    {
        stage: 89, speaker: 'ghost', name: 'GHOST', code: 'ONE-LINE // 89',
        message: 'All ships, one line! Push everything you have into the final approach.',
        missionType: 'escort', missionTargetName: 'Final Approach Corridor', bountyReward: 24000
    ,
    inMissionComms: { speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }
},
    {
        stage: 90, speaker: 'sera', name: 'Sera Kane', code: 'LAST-ALLIANCE // 90',
        message: 'The Last Alliance is assembled. The gates to the core are open.',
        missionType: 'singularity', missionTargetName: 'Alliance Core Citadel', bountyReward: 30000
    
},

    // Chapter 10: Zero Protocol (Stages 91–100)
    {
        stage: 91, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'FINAL-APPROACH // 91',
        message: 'Final approach to the singularity core. The radiation is spiking—check your shield integrity!',
        missionType: 'patrol', missionTargetName: 'Singularity Radiation Buoy', bountyReward: 20000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 92, speaker: 'ghost', name: 'GHOST', code: 'WAR-ROOM // 92',
        message: 'We breached the enemy war room server. They were planning to quarantine the entire star cluster.',
        missionType: 'recovery', missionTargetName: 'War Room Server Core', bountyReward: 22000
    
},
    {
        stage: 93, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'HIDDEN-CORE // 93',
        message: 'The hidden core is pulsing with ancient energy. It responds directly to Program Zero’s reactor.',
        missionType: 'singularity', missionTargetName: 'Ancient Energy Resonator', bountyReward: 25000
    
},
    {
        stage: 94, speaker: 'sera', name: 'Sera Kane', code: 'DISTORTED-VOICE // 94',
        message: 'A distorted strategic broadcast is targeting both prototypes. It names no ruler, but it knows our private flight data.',
        missionType: 'recovery', missionTargetName: 'Encrypted Strategic Broadcast Array', bountyReward: 28000
    
},
    {
        stage: 95, speaker: 'ghost', name: 'GHOST', code: 'FOUR-SHADOWS // 95',
        message: 'Four experimental shadow hulls are guarding the core entrance. Show them who flies the original.',
        missionType: 'bounty', missionTargetName: 'Shadow Hull Prototype Alpha', bountyReward: 32000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }
},
    {
        stage: 96, speaker: 'elena', name: 'Commander Elena Vail', code: 'LAST-COMMAND // 96',
        message: 'This is the last command from Ark-9: protect the galaxy at all costs. Dismissed.',
        missionType: 'defense', missionTargetName: 'Ark-9 Final Relay', bountyReward: 35000
    
},
    {
        stage: 97, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'GALAXY-LISTENING // 97',
        message: 'Every monitoring station in the galaxy is listening to our telemetry feed right now.',
        missionType: 'patrol', missionTargetName: 'Galactic Broadcast Relay', bountyReward: 40000
    
},
    {
        stage: 98, speaker: 'ghost', name: 'GHOST', code: 'POINT-OF-NO-RETURN // 98',
        message: 'We have passed the point of no return. Zero Protocol is executing.',
        missionType: 'singularity', missionTargetName: 'Zero Protocol Switch', bountyReward: 45000
    ,
    inMissionComms: { speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }
},
    {
        stage: 99, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'ZERO-PROTOCOL // 99',
        message: 'Zero Protocol initialized. The gate is unlocking its ultimate secret.',
        missionType: 'singularity', missionTargetName: 'Gate Ultimate Vault', bountyReward: 50000
    
},
    {
        stage: 100, speaker: 'naomi', name: 'Dr. Naomi Ren', code: 'CORE // END OF LINE',
        message: 'We made it to the center. The signal has a living source, and the hidden ruler finally answers from behind the gate.',
        missionType: 'singularity', missionTargetName: 'The Singularity Heart', bountyReward: 100000
    
}
];
