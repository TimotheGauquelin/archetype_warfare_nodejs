import {
    Medal,
    UserMedal,
    User,
    Deck,
    Tournament,
    TournamentPlayer,
    QuizAttempt,
} from '../models/relations';
import ArchetypeRankingService from './ArchetypeRankingService';
import logger from '../utils/logger';

export type AwardedMedal = {
    code: string;
    title: string;
    description: string;
    category: string;
    contextId: string;
    contextLabel: string | null;
    earnedAt: Date;
};

const DAILY_SESSION_CODES = [
    'QUIZ_DAILY_SESSION_10',
    'QUIZ_DAILY_SESSION_20',
    'QUIZ_DAILY_SESSION_50',
] as const;

const DAILY_TOTAL_CODES = [
    'QUIZ_DAILY_TOTAL_100',
    'QUIZ_DAILY_TOTAL_200',
    'QUIZ_DAILY_TOTAL_500',
] as const;

const MASTER_COUNT_CODES = [
    'MASTER_COUNT_1',
    'MASTER_COUNT_10',
    'MASTER_COUNT_50',
] as const;

const ACCOUNT_AGE_CODES = [
    'ACCOUNT_AGE_7D',
    'ACCOUNT_AGE_30D',
    'ACCOUNT_AGE_365D',
] as const;

const ARCHETYPE_WIN_CODES = [
    'OFFICIAL_ARCHETYPE_WINS_2',
    'OFFICIAL_ARCHETYPE_WINS_3',
] as const;

class MedalService {
    private static medalCache: Map<string, Medal> | null = null;

    private static async getMedalByCode(code: string): Promise<Medal | null> {
        if (!this.medalCache) {
            const medals = await Medal.findAll();
            this.medalCache = new Map(medals.map((m) => [m.code, m]));
        }
        return this.medalCache.get(code) ?? null;
    }

    private static async awardIfMissing(
        userId: string,
        code: string,
        options?: { contextId?: string; contextLabel?: string | null }
    ): Promise<AwardedMedal | null> {
        const medal = await this.getMedalByCode(code);
        if (!medal) return null;

        const contextId = options?.contextId ?? '';
        const existing = await UserMedal.findOne({
            where: {
                user_id: userId,
                medal_id: medal.id,
                context_id: contextId,
            },
        });
        if (existing) return null;

        try {
            const row = await UserMedal.create({
                user_id: userId,
                medal_id: medal.id,
                context_id: contextId,
                context_label: options?.contextLabel ?? null,
                earned_at: new Date(),
            });

            return {
                code: medal.code,
                title: medal.title,
                description: medal.description,
                category: medal.category,
                contextId,
                contextLabel: options?.contextLabel ?? null,
                earnedAt: row.earned_at,
            };
        } catch (error) {
            // Concurrence : unique constraint → déjà attribuée
            logger.logDebug('Médaille déjà attribuée (ignore)', {
                userId,
                code,
                contextId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }

    private static async awardThresholds(
        userId: string,
        codes: readonly string[],
        value: number,
        options?: { contextId?: string; contextLabel?: string | null }
    ): Promise<AwardedMedal[]> {
        const awarded: AwardedMedal[] = [];
        for (const code of codes) {
            const medal = await this.getMedalByCode(code);
            if (!medal || medal.threshold == null) continue;
            if (value < medal.threshold) continue;
            const result = await this.awardIfMissing(userId, code, options);
            if (result) awarded.push(result);
        }
        return awarded;
    }

    /** Fire-and-forget safe wrapper. */
    static evaluateSafe(label: string, fn: () => Promise<unknown>): void {
        void fn().catch((error) => {
            logger.logWarn(`Médaille evaluate failed (${label})`, {
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }

    static async onDeckCreated(userId: string): Promise<AwardedMedal[]> {
        const count = await Deck.count({ where: { user_id: userId } });
        return this.awardThresholds(userId, ['DECK_COUNT_5'], count);
    }

    static async onQuizAttemptProgress(params: {
        userId: string;
        mode: string;
        attemptScore: number;
        userQuizPoints: number;
        justFinished?: boolean;
    }): Promise<AwardedMedal[]> {
        const awarded: AwardedMedal[] = [];

        if (params.justFinished || params.attemptScore > 0) {
            const play = await this.awardIfMissing(params.userId, 'QUIZ_PLAY');
            if (play) awarded.push(play);
        }

        if (params.mode === 'daily') {
            awarded.push(
                ...(await this.awardThresholds(
                    params.userId,
                    DAILY_SESSION_CODES,
                    params.attemptScore
                ))
            );
            awarded.push(
                ...(await this.awardThresholds(
                    params.userId,
                    DAILY_TOTAL_CODES,
                    params.userQuizPoints
                ))
            );
        }

        return awarded;
    }

    /**
     * À brancher quand les sessions classées fermées existeront.
     * Attribue QUIZ_SESSION_FIRST au vainqueur (1× lifetime).
     */
    static async onRankedQuizSessionClosed(winnerUserId: string): Promise<AwardedMedal[]> {
        const awarded = await this.awardIfMissing(winnerUserId, 'QUIZ_SESSION_FIRST');
        return awarded ? [awarded] : [];
    }

    static async onOfficialTournamentFinished(tournamentId: string): Promise<AwardedMedal[]> {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament || !tournament.is_official) return [];
        if (tournament.status !== 'tournament_finished') return [];

        const awarded: AwardedMedal[] = [];
        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId, dropped: false },
            attributes: ['id', 'user_id'],
        });

        for (const player of players) {
            const play = await this.awardIfMissing(
                player.user_id,
                'OFFICIAL_TOURNAMENT_PLAY'
            );
            if (play) awarded.push(play);
        }

        const winner = await ArchetypeRankingService.getTournamentWinner(tournamentId);
        if (winner?.userId) {
            const win = await this.awardIfMissing(
                winner.userId,
                'OFFICIAL_TOURNAMENT_WIN'
            );
            if (win) awarded.push(win);

            if (winner.archetypeId != null) {
                awarded.push(
                    ...(await this.evaluateOfficialArchetypeWins(
                        winner.userId,
                        winner.archetypeId,
                        winner.archetypeName
                    ))
                );
            }
        }

        awarded.push(...(await this.evaluateMastersForAllUsers()));
        return awarded;
    }

    private static async countOfficialWinsWithArchetype(
        userId: string,
        archetypeId: number
    ): Promise<number> {
        const tournaments = await Tournament.findAll({
            where: {
                status: 'tournament_finished',
                is_official: true,
            },
            attributes: ['id'],
        });

        let wins = 0;
        for (const t of tournaments) {
            const winner = await ArchetypeRankingService.getTournamentWinner(String(t.id));
            if (
                winner &&
                String(winner.userId) === String(userId) &&
                winner.archetypeId === archetypeId
            ) {
                wins += 1;
            }
        }
        return wins;
    }

    private static async evaluateOfficialArchetypeWins(
        userId: string,
        archetypeId: number,
        archetypeName: string | null
    ): Promise<AwardedMedal[]> {
        const wins = await this.countOfficialWinsWithArchetype(userId, archetypeId);
        return this.awardThresholds(userId, ARCHETYPE_WIN_CODES, wins, {
            contextId: String(archetypeId),
            contextLabel: archetypeName,
        });
    }

    /**
     * Recompute current masters and award MASTER_ARCHETYPE + MASTER_COUNT_*.
     */
    static async evaluateMastersForAllUsers(): Promise<AwardedMedal[]> {
        const masters = await ArchetypeRankingService.getAllMasters();
        const awarded: AwardedMedal[] = [];
        const masterCountByUser = new Map<string, number>();

        for (const entry of masters) {
            if (!entry.master?.userId) continue;
            const userId = entry.master.userId;
            masterCountByUser.set(userId, (masterCountByUser.get(userId) ?? 0) + 1);

            const result = await this.awardIfMissing(userId, 'MASTER_ARCHETYPE', {
                contextId: String(entry.archetypeId),
                contextLabel: entry.archetypeName,
            });
            if (result) {
                // Affichage dynamique côté front via contextLabel
                awarded.push({
                    ...result,
                    title: `Maître des ${entry.archetypeName}`,
                });
            }
        }

        for (const [userId, count] of masterCountByUser.entries()) {
            awarded.push(
                ...(await this.awardThresholds(userId, MASTER_COUNT_CODES, count))
            );
        }

        return awarded;
    }

    static async evaluateAccountAge(userId: string): Promise<AwardedMedal[]> {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'is_active', 'is_banned', 'created_at'],
        });
        if (!user || !user.is_active || user.is_banned || !user.created_at) {
            return [];
        }

        const ageMs = Date.now() - new Date(user.created_at).getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        return this.awardThresholds(userId, ACCOUNT_AGE_CODES, ageDays);
    }

    /**
     * Backfill / sync : recalcule les médailles dérivables pour un user.
     */
    static async syncUser(userId: string): Promise<AwardedMedal[]> {
        const awarded: AwardedMedal[] = [];
        awarded.push(...(await this.onDeckCreated(userId)));
        awarded.push(...(await this.evaluateAccountAge(userId)));

        const finishedAttempts = await QuizAttempt.count({
            where: { user_id: userId, status: 'finished' },
        });
        if (finishedAttempts > 0) {
            const play = await this.awardIfMissing(userId, 'QUIZ_PLAY');
            if (play) awarded.push(play);
        }

        const dailyAttempts = await QuizAttempt.findAll({
            where: { user_id: userId, mode: 'daily' },
            attributes: ['score'],
        });
        const bestDaily = dailyAttempts.reduce(
            (max, a) => Math.max(max, a.score ?? 0),
            0
        );
        awarded.push(
            ...(await this.awardThresholds(userId, DAILY_SESSION_CODES, bestDaily))
        );

        const user = await User.findByPk(userId, { attributes: ['quiz_points'] });
        awarded.push(
            ...(await this.awardThresholds(
                userId,
                DAILY_TOTAL_CODES,
                user?.quiz_points ?? 0
            ))
        );

        // Tournois officiels
        const officialPlayers = await TournamentPlayer.findAll({
            include: [
                {
                    model: Tournament,
                    as: 'tournament',
                    required: true,
                    where: {
                        is_official: true,
                        status: 'tournament_finished',
                    },
                    attributes: ['id'],
                },
            ],
            where: { user_id: userId, dropped: false },
            attributes: ['id', 'user_id'],
        });
        if (officialPlayers.length > 0) {
            const play = await this.awardIfMissing(userId, 'OFFICIAL_TOURNAMENT_PLAY');
            if (play) awarded.push(play);
        }

        const officialTournaments = await Tournament.findAll({
            where: { is_official: true, status: 'tournament_finished' },
            attributes: ['id'],
        });
        const winsByArchetype = new Map<number, { count: number; name: string | null }>();
        let hasOfficialWin = false;
        for (const t of officialTournaments) {
            const winner = await ArchetypeRankingService.getTournamentWinner(String(t.id));
            if (!winner || String(winner.userId) !== String(userId)) continue;
            hasOfficialWin = true;
            if (winner.archetypeId != null) {
                const prev = winsByArchetype.get(winner.archetypeId) ?? {
                    count: 0,
                    name: winner.archetypeName,
                };
                winsByArchetype.set(winner.archetypeId, {
                    count: prev.count + 1,
                    name: winner.archetypeName,
                });
            }
        }
        if (hasOfficialWin) {
            const win = await this.awardIfMissing(userId, 'OFFICIAL_TOURNAMENT_WIN');
            if (win) awarded.push(win);
        }
        for (const [archetypeId, info] of winsByArchetype.entries()) {
            awarded.push(
                ...(await this.awardThresholds(
                    userId,
                    ARCHETYPE_WIN_CODES,
                    info.count,
                    {
                        contextId: String(archetypeId),
                        contextLabel: info.name,
                    }
                ))
            );
        }

        awarded.push(...(await this.evaluateMastersForUser(userId)));
        return awarded;
    }

    private static async evaluateMastersForUser(userId: string): Promise<AwardedMedal[]> {
        const masters = await ArchetypeRankingService.getAllMasters();
        const mine = masters.filter((m) => m.master && String(m.master.userId) === String(userId));
        const awarded: AwardedMedal[] = [];

        for (const entry of mine) {
            const result = await this.awardIfMissing(userId, 'MASTER_ARCHETYPE', {
                contextId: String(entry.archetypeId),
                contextLabel: entry.archetypeName,
            });
            if (result) {
                awarded.push({
                    ...result,
                    title: `Maître des ${entry.archetypeName}`,
                });
            }
        }

        awarded.push(
            ...(await this.awardThresholds(userId, MASTER_COUNT_CODES, mine.length))
        );
        return awarded;
    }

    static async listCatalog() {
        return Medal.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']] });
    }

    static async listForUser(userId: string) {
        await this.evaluateAccountAge(userId);

        const [catalog, earned] = await Promise.all([
            Medal.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']] }),
            UserMedal.findAll({
                where: { user_id: userId },
                include: [{ model: Medal, as: 'medal' }],
                order: [['earned_at', 'DESC']],
            }),
        ]);

        const earnedRows = earned.map((row) => {
            const medal = row.get('medal') as Medal;
            const isArchetypeMaster =
                medal.code === 'MASTER_ARCHETYPE' && row.context_label;
            return {
                medalId: medal.id,
                code: medal.code,
                category: medal.category,
                title: isArchetypeMaster
                    ? `Maître des ${row.context_label}`
                    : medal.title,
                description: medal.description,
                iconUrl: medal.icon_url,
                isContextual: medal.is_contextual,
                threshold: medal.threshold,
                contextId: row.context_id || null,
                contextLabel: row.context_label,
                earnedAt: row.earned_at,
            };
        });

        const earnedKeys = new Set(
            earnedRows.map((e) => `${e.code}::${e.contextId ?? ''}`)
        );

        const locked = catalog
            .filter((m) => !m.is_contextual)
            .filter((m) => !earnedKeys.has(`${m.code}::`))
            .map((m) => ({
                medalId: m.id,
                code: m.code,
                category: m.category,
                title: m.title,
                description: m.description,
                iconUrl: m.icon_url,
                isContextual: m.is_contextual,
                threshold: m.threshold,
                contextId: null,
                contextLabel: null,
                earnedAt: null,
            }));

        // Contextual locked : on expose le template MASTER_ARCHETYPE / wins sans contexte
        const contextualTemplates = catalog
            .filter((m) => m.is_contextual)
            .filter((m) => !earnedRows.some((e) => e.code === m.code))
            .map((m) => ({
                medalId: m.id,
                code: m.code,
                category: m.category,
                title: m.title,
                description: m.description,
                iconUrl: m.icon_url,
                isContextual: true,
                threshold: m.threshold,
                contextId: null,
                contextLabel: null,
                earnedAt: null,
            }));

        return {
            earned: earnedRows,
            locked: [...locked, ...contextualTemplates],
        };
    }
}

export default MedalService;
