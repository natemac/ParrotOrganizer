/**
 * GameScanner - Alternative method to scan games without pre-generated lists
 *
 * This module attempts to discover games by probing common game names
 * Can be used as fallback when gameProfiles.txt doesn't exist
 */

export class GameScanner {
    constructor(pathManager) {
        this.pathManager = pathManager;
    }

    /**
     * Try to load game list from pre-generated file
     * If fails, attempt to scan by trying to load known games
     */
    async loadGameList() {
        try {
            // First try to load from pre-generated list (now in storage folder)
            const response = await fetch('./storage/gameProfiles.txt');
            if (response.ok) {
                const text = await response.text();
                const games = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                if (games.length > 0) {
                    console.log(`✅ Loaded ${games.length} games from gameProfiles.txt`);
                    return games;
                }
            }
        } catch (error) {
            console.warn('⚠️ gameProfiles.txt not found, will attempt auto-scan...');
        }

        // Fallback: Try to auto-discover games
        return await this.autoScanGames();
    }

    /**
     * Auto-scan by trying to load common game files
     * This is slower but doesn't require pre-generation
     */
    async autoScanGames() {
        console.log('🔍 Auto-scanning for games...');

        const foundGames = [];
        const commonGames = this.getCommonGameList();

        // Try to load each game profile
        let loaded = 0;
        for (const gameName of commonGames) {
            try {
                const response = await fetch(`../GameProfiles/${gameName}.xml`, { method: 'HEAD' });
                if (response.ok) {
                    foundGames.push(gameName);
                    loaded++;

                    // Show progress every 50 games
                    if (loaded % 50 === 0) {
                        console.log(`   Found ${loaded} games...`);
                    }
                }
            } catch (error) {
                // File doesn't exist, skip
            }
        }

        console.log(`✅ Auto-scan complete: Found ${foundGames.length} games`);

        if (foundGames.length === 0) {
            throw new Error('No games found. Please run scripts/generateGameLists.bat');
        }

        return foundGames;
    }

    /**
     * Get list of common TeknoParrot games to probe
     * This is a curated list of known games as fallback
     */
    getCommonGameList() {
        // Return a large list of known TeknoParrot games
        // This list can be extended over time
        return [
            '2Spicy', 'AAA', 'abc', 'ActionDeka', 'AliensArmageddon', 'AlpineRacer',
            'ArcanaHeart3Nesica', 'Batman', 'BattleGear4Tuned', 'BBCF', 'BlazBlueCalaminityTrigger',
            'BlazBlueCrossTagBattle', 'BorderBreakScramble', 'ChaseHQ2', 'Contra', 'CrimzonClover',
            'CruisnBlast', 'DariusBurst', 'Daytona3', 'DeadHeat', 'DeadHeatRiders', 'DengekiBunkoFightingClimax',
            'DirtyDrivin', 'DOA5', 'DOA6', 'EXVS2', 'EXVS2XB', 'FNF', 'FNFDrift', 'FNFSB', 'FNFSC',
            'FZeroAX', 'GG', 'GGS', 'GGXrd', 'GtiClub3', 'GundamPod', 'GundamSpiritsOfZeon',
            'H2Overdrive', 'HOTD4', 'HOTD4SP', 'HOTDEX', 'Ikaruga', 'ID4Exp', 'ID5', 'ID6', 'ID7', 'ID8',
            'IDZ', 'IDZTP', 'IDZv2', 'Injustice', 'JojoLastSurvivor', 'KingofFightersXIII',
            'KingofFightersXIIIClimax', 'KingOfFightersXIV', 'LGI', 'LGI3D', 'LGJ', 'LGJS',
            'LuigisMansion', 'MarioBros', 'MarioKartGP', 'MarioKartGP2', 'MaximumHeat', 'MB',
            'MKDX', 'MKDXUSA', 'MS', 'Persona4U', 'PokkenTournament', 'ProjectDiva',
            'Rambo', 'RazingStorm', 'R-Tuned', 'SamuraiShodown', 'SDR', 'SegaOlympic2016',
            'SegaOlympic2020', 'segartv', 'SilentHill', 'Skullgirls2E', 'SSASR',
            'StarWars', 'StreetFighterIII3rdStrike', 'StreetFighterIV', 'StreetFighterVTypeArcade',
            'SuperStreetFighterIVArcadeEdition', 'Taiko', 'TankTankTank', 'Tekken6', 'Tekken6BR',
            'Tekken7', 'Tekken7FR', 'Terminator', 'TMNT', 'TombRaider', 'Transformers',
            'UltraStreetFighterIV', 'UnderNightInBirth', 'VF5B', 'VF5C', 'VF5Esports', 'VF5FS',
            'VF5R', 'VirtuaStriker4', 'VT3', 'VT4', 'WackyRaces', 'WalkingDead',
            'WMMT3', 'WMMT5', 'WMMT5DX', 'WMMT6', 'WMMT6R', 'WMMT6RR',

            // Add more as discovered...
            'abcELF2', 'acedriv3', 'AfterDark', 'AfterDark2', 'akaievo', 'AkaiKatanaShinNesica',
            'Akuma', 'Aleste', 'AliensExtermination', 'AquapazzaAquaplusDreamMatch', 'ArcadeLove',
            'ArcanaHeart2Nesica', 'ArcticThunder', 'BattleClimax', 'BattleFantasia', 'BattleGear4',
            'BBHPro', 'BladeArcus', 'BladeStrangers', 'BlazBlueContinuumShift', 'BlazBlueContinuumShift2',
            'BlazingAngels', 'bldyr3b', 'BlockKing', 'ByonByon', 'CaladriusAC', 'Cars', 'Castlevania',
            'CC', 'ChaosBreaker', 'ChaosCodeNSOC103', 'ChaseChaseJoker', 'cobrata', 'ComeOnBaby2',
            'Coopers9', 'CottonRnR', 'CrazyRide', 'CrazySpeed', 'CrossfirePaintball', 'D1GP',
            'DaemonBrideExboard', 'DarkEscape4D', 'Daytona3NSE', 'DealOrNoDeal', 'Deathsmiles2',
            'DenshaDeGo', 'DinoKing', 'DoNotFallRunforYourDrink', 'Drakons', 'DSPS', 'EADP',
            'ElevatorAction', 'ElevatorActionInvasion', 'EnEinsPerfektewelt', 'FarCryParadiseLost',
            'FightingClimax', 'FightingClimaxIgnition', 'FightingExLayer', 'FR', 'FrenzyExpress',
            'Friction', 'Frogger', 'GaelcoChampionshipTuningRace', 'GaiaAttack4', 'Gashaaaan',
            'GGXX', 'GHA', 'GhostBusters', 'GigaWingGenerations', 'Goketsuji', 'GoldenTeeLive2009',
            'GRID', 'GSEVO', 'Gunslinger', 'Harley', 'HauntedMuseum', 'HauntedMuseumII', 'Homura',
            'HotWheels', 'Hummer', 'hummerextreme', 'HyperStreetFighterII', 'InfinityBladeFX',
            'JurassicPark', 'JusticeLeague', 'Koihime', 'LethalEnforcers3', 'LGS', 'LostLand',
            'MagicalBeat', 'MeltyBloodRE2', 'MillionArthurArcanaBlood', 'MissionImpossible',
            'MotoGP', 'MusicGunGun2', 'NERF', 'NFSHeatTakedown', 'NicktoonsNitro', 'Nirin',
            'NitroplusBlasterz', 'Nosferatu', 'OG', 'or2spdlx', 'PacmanChomp', 'Persona4A',
            'PhantomBreaker', 'PointBlankX', 'PoliceTrainer2', 'PowerInstinctV', 'Primevil',
            'PsychicForce2012', 'PuyoPuyoEsports', 'PuzzleBobble', 'QMA', 'RabbidsHollywood',
            'RadikalBikers', 'RaidenIII', 'RaidenIV', 'RainbowBombergirl', 'Rampage', 'RastanSaga',
            'Revolt', 'RingRiders', 'RobinHood', 'RollingGunner', 'RumbleFish2Nesica',
            'SamuraiSpiritsSen', 'SAO', 'SB3', 'SchoolOfRagnarok', 'Shigami3', 'ShiningForceCrossElysion',
            'SilverStrikeBowlingLive', 'SNKHeroines', 'SnoCross', 'Snowboarder', 'SonicBlastHeroes',
            'SonicDashExtreme', 'soulclb2', 'soulclb3', 'SpaceInvaders', 'SpicaAdventure', 'Spiderman',
            'SpongeBob', 'SR3', 'SRC', 'SRG', 'StarTrekVoyager', 'StarwingParadox', 'StormRider',
            'StraniaTheStellaMachina', 'StreetFighterZero3', 'SuggoiArcanaHeart2Nesica', 'superdbz',
            'SuperStreetFighterIVArcadeEditionVer2012', 'SWDC', 'taikoblue', 'taikogreen', 'taikored',
            'TaisenHotGimmick5', 'TargetTerrorGold', 'TC5', 'tekken4', 'tekken51', 'tekken5d',
            'Tekken7R2', 'TetrisTheGrandMaster3TerrorInstinct', 'TheAct', 'Theatrhythm',
            'timecrs3', 'timecrs4', 'TokyoCop', 'TottemoEMahjong', 'TroubleWitches', 'ttt2', 'ttt2u',
            'UDX', 'UltimateArcticThunder', 'Umifresh', 'UnderNightAPM3', 'UnderNightInBirthExeLatest',
            'VampireSavior', 'VF3TB', 'VirtuaRLimit', 'VirtuaStriker3', 'vnight', 'wanganmd', 'wanganmr',
            'WartranTroopers', 'WastelandRacers', 'WheelOfFortune', 'WildWestShootout', 'WinningEleven08',
            'WMMT3DXP', 'WMMT5DXPlus', 'WonderlandWars', 'Xiyangyang', 'Yatagarasu', 'YugiohDT6U',
            'zgundm', 'zgundmdx', 'zoidiexp', 'zoidsinf'
        ];
    }

    /**
     * Check if we should regenerate game lists
     * (Called when refresh button is clicked)
     */
    async shouldRegenerateList() {
        // Check if gameProfiles.txt exists and when it was last modified
        try {
            const response = await fetch('./storage/gameProfiles.txt', { method: 'HEAD' });
            if (!response.ok) {
                return true; // File doesn't exist, need to generate
            }

            // File exists, but we can't check modification time from browser
            // User should manually regenerate when TeknoParrot updates
            return false;
        } catch (error) {
            return true;
        }
    }
}
