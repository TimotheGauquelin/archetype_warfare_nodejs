import { Op, QueryTypes, Transaction } from 'sequelize';
import sequelize from '../config/Sequelize';
import { CustomError } from '../errors/CustomError';
import QuizSeason from '../models/QuizSeasonModel';
import QuizQuestion, {
    QuizQuestionDifficulty,
    QuizQuestionType,
} from '../models/QuizQuestionModel';

/** Durée par défaut d'une saison Daily (~3 mois) */
export const DEFAULT_SEASON_DAYS = 90;

const DIFFICULTIES: QuizQuestionDifficulty[] = ['easy', 'medium', 'hard'];
const AUTO_SCHEDULE_PLAYABLE_TYPES: QuizQuestionType[] = [
    'mcq',
    'true_false',
    'order',
    'name_the_cards',
    'summoner',
    'zoom',
    'hint_ladder',
];

/** Écart minimum (en jours) entre deux questions même niveau + même mode. */
const MIN_PAIR_GAP_DAYS = 7;

type PlannedSlot = {
    date: string;
    questionId: number;
    difficulty: QuizQuestionDifficulty;
    type: string;
};

class QuizSeasonService {
    static toNumberId(value: string | number): number {
        return typeof value === 'number' ? value : Number(value);
    }

    static todayDateString(): string {
        return new Date().toISOString().slice(0, 10);
    }

    static addDays(dateStr: string, days: number): string {
        const d = new Date(`${dateStr}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    }

    static daysInclusive(start: string, end: string): number {
        const a = new Date(`${start}T12:00:00Z`).getTime();
        const b = new Date(`${end}T12:00:00Z`).getTime();
        return Math.max(1, Math.floor((b - a) / 86400000) + 1);
    }

    static normalizeDate(value: unknown, field: string): string {
        const raw = String(value ?? '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            throw new CustomError(`${field} invalide (YYYY-MM-DD)`, 400);
        }
        return raw;
    }

    static async serializeSeason(season: QuizSeason) {
        const questionCount = await QuizQuestion.count({
            where: {
                season_id: season.id,
            },
        });
        const today = this.todayDateString();
        let status: 'past' | 'current' | 'upcoming' = 'upcoming';
        if (season.end_date < today) status = 'past';
        else if (season.start_date <= today && season.end_date >= today) {
            status = 'current';
        }

        return {
            id: this.toNumberId(season.id),
            name: season.name,
            startDate: season.start_date,
            endDate: season.end_date,
            dayCount: this.daysInclusive(season.start_date, season.end_date),
            questionCount,
            status,
            createdAt: season.created_at ?? null,
            updatedAt: season.updated_at ?? null,
        };
    }

    static async findSeasonForDate(quizDate: string): Promise<QuizSeason | null> {
        return QuizSeason.findOne({
            where: {
                start_date: { [Op.lte]: quizDate },
                end_date: { [Op.gte]: quizDate },
            },
            order: [['start_date', 'DESC']],
        });
    }

    /** Saison en cours + les 2 prochaines (ou prochaines seules si pas de courante). */
    static async listDashboardSeasons() {
        const today = this.todayDateString();
        const current = await QuizSeason.findOne({
            where: {
                start_date: { [Op.lte]: today },
                end_date: { [Op.gte]: today },
            },
            order: [['start_date', 'DESC']],
        });

        const upcoming = await QuizSeason.findAll({
            where: {
                start_date: { [Op.gt]: today },
            },
            order: [['start_date', 'ASC']],
            limit: current ? 2 : 3,
        });

        const rows = [...(current ? [current] : []), ...upcoming].slice(0, 3);
        return Promise.all(rows.map((s) => this.serializeSeason(s)));
    }

    static async listAllSeasons() {
        const seasons = await QuizSeason.findAll({
            order: [
                ['start_date', 'DESC'],
                ['id', 'DESC'],
            ],
        });
        return Promise.all(seasons.map((s) => this.serializeSeason(s)));
    }

    static async getSeasonById(seasonId: number) {
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);
        return this.serializeSeason(season);
    }

    /** Message d'erreur de chevauchement + 1er jour libre après les saisons en conflit. */
    private static overlapErrorMessage(overlaps: QuizSeason[]): string {
        const sorted = [...overlaps].sort((a, b) =>
            a.end_date < b.end_date ? 1 : a.end_date > b.end_date ? -1 : 0
        );
        const latest = sorted[0];
        const nextFreeStart = this.addDays(latest.end_date, 1);
        const names = overlaps.map((s) => `« ${s.name} »`).join(', ');
        const rangeLabel =
            overlaps.length === 1
                ? `${latest.start_date} → ${latest.end_date}`
                : `jusqu'au ${latest.end_date}`;
        return (
            `Chevauchement avec ${names} (${rangeLabel}). ` +
            `Vous pouvez créer une saison à partir du ${nextFreeStart}.`
        );
    }

    private static async findOverlappingSeasons(
        startDate: string,
        endDate: string,
        excludeId?: number
    ): Promise<QuizSeason[]> {
        const where: Record<string, unknown> = {
            start_date: { [Op.lte]: endDate },
            end_date: { [Op.gte]: startDate },
        };
        if (excludeId != null) {
            where.id = { [Op.ne]: excludeId };
        }
        return QuizSeason.findAll({
            where,
            order: [['end_date', 'DESC']],
        });
    }

    static async createSeason(data: {
        name?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const name = String(data.name ?? '').trim();
        if (!name) throw new CustomError('Nom de saison requis', 400);

        const startDate = this.normalizeDate(
            data.startDate ?? this.todayDateString(),
            'startDate'
        );
        const endDate = data.endDate
            ? this.normalizeDate(data.endDate, 'endDate')
            : this.addDays(startDate, DEFAULT_SEASON_DAYS - 1);

        if (endDate < startDate) {
            throw new CustomError(
                'La date de fin doit être postérieure ou égale au début',
                400
            );
        }

        const overlaps = await this.findOverlappingSeasons(startDate, endDate);
        if (overlaps.length > 0) {
            throw new CustomError(this.overlapErrorMessage(overlaps), 400);
        }

        const season = await QuizSeason.create({
            name,
            start_date: startDate,
            end_date: endDate,
        });
        return this.serializeSeason(season);
    }

    static async updateSeason(
        seasonId: number,
        data: { name?: string; startDate?: string; endDate?: string }
    ) {
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);

        if (data.name !== undefined) {
            const name = String(data.name).trim();
            if (!name) throw new CustomError('Nom de saison requis', 400);
            season.name = name;
        }
        if (data.startDate !== undefined) {
            season.start_date = this.normalizeDate(data.startDate, 'startDate');
        }
        if (data.endDate !== undefined) {
            season.end_date = this.normalizeDate(data.endDate, 'endDate');
        }
        if (season.end_date < season.start_date) {
            throw new CustomError(
                'La date de fin doit être postérieure ou égale au début',
                400
            );
        }

        const overlaps = await this.findOverlappingSeasons(
            season.start_date,
            season.end_date,
            this.toNumberId(season.id)
        );
        if (overlaps.length > 0) {
            throw new CustomError(this.overlapErrorMessage(overlaps), 400);
        }

        await season.save();
        return this.serializeSeason(season);
    }

    static async deleteSeason(seasonId: number) {
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);
        await season.destroy();
        return { success: true };
    }

    private static enumerateDays(start: string, end: string): string[] {
        const days: string[] = [];
        let cursor = start;
        while (cursor <= end) {
            days.push(cursor);
            cursor = this.addDays(cursor, 1);
        }
        return days;
    }

    private static daysBetween(a: string, b: string): number {
        const ms =
            new Date(`${b}T12:00:00Z`).getTime() -
            new Date(`${a}T12:00:00Z`).getTime();
        return Math.round(ms / 86400000);
    }

    private static pairKey(difficulty: string, type: string): string {
        return `${difficulty}::${type}`;
    }

    private static normalizeDifficultyValue(
        value: unknown
    ): QuizQuestionDifficulty {
        const raw = String(value ?? 'medium').trim().toLowerCase();
        if (DIFFICULTIES.includes(raw as QuizQuestionDifficulty)) {
            return raw as QuizQuestionDifficulty;
        }
        return 'medium';
    }

    private static weightedPick<T>(items: T[], weights: number[]): T {
        const safeWeights = weights.map((w) => Math.max(0, w));
        const total = safeWeights.reduce((sum, w) => sum + w, 0);
        if (items.length === 0) {
            throw new CustomError('Aucun élément à tirer', 500);
        }
        if (total <= 0) {
            return items[Math.floor(Math.random() * items.length)];
        }
        let roll = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            roll -= safeWeights[i];
            if (roll <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    private static pickRandom<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }

    /**
     * Propose (dryRun) ou applique un auto-remplissage des jours non planifiés.
     * Contraintes :
     * - même (niveau + mode) : écart ≥ 7 jours
     * - sur une fenêtre de 7 jours : viser 2 faciles, 2 moyens, 2 difficiles (+ 1 libre)
     * - variation des modes de jeu, tirage aléatoire
     *
     * `currentAssignments` (jour → questionId) permet de partir d'un brouillon local.
     */
    static async autoFillSeasonSchedule(
        seasonId: number,
        options?: {
            dryRun?: boolean;
            currentAssignments?: Record<string, number>;
            /** Si fourni (ex. liste UI), on place uniquement parmi ces questions. */
            candidateQuestionIds?: number[];
        }
    ): Promise<{
        assignedCount: number;
        skippedDays: string[];
        emptyDaysBefore: number;
        notEnoughQuestions: boolean;
        assigned: Array<{ day: string; questionId: number; difficulty: string; type: string }>;
    }> {
        const dryRun = Boolean(options?.dryRun);
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);

        const days = this.enumerateDays(season.start_date, season.end_date);
        const plan = new Map<string, PlannedSlot>();

        // En dry-run / brouillon : currentAssignments (même vide) fait foi.
        // Sinon on part de ce qui est déjà en base.
        const useDraftAssignments = options?.currentAssignments !== undefined;
        if (useDraftAssignments) {
            const draftAssignments = options?.currentAssignments ?? {};
            const ids = [...new Set(Object.values(draftAssignments).map(Number))].filter(
                (id) => Number.isFinite(id)
            );
            const questions = ids.length
                ? await QuizQuestion.findAll({ where: { id: { [Op.in]: ids } } })
                : [];
            const byId = new Map(
                questions.map((q) => [this.toNumberId(q.id), q])
            );
            for (const [date, rawId] of Object.entries(draftAssignments)) {
                const questionId = Number(rawId);
                const q = byId.get(questionId);
                if (!q || !days.includes(date)) continue;
                plan.set(date, {
                    date,
                    questionId,
                    difficulty: this.normalizeDifficultyValue(q.difficulty),
                    type: String(q.type),
                });
            }
        } else {
            const alreadyScheduled = await QuizQuestion.findAll({
                where: {
                    season_id: seasonId,
                    scheduled_date: { [Op.ne]: null },
                },
            });
            for (const q of alreadyScheduled) {
                const date = q.scheduled_date
                    ? String(q.scheduled_date).slice(0, 10)
                    : null;
                if (!date) continue;
                plan.set(date, {
                    date,
                    questionId: this.toNumberId(q.id),
                    difficulty: this.normalizeDifficultyValue(q.difficulty),
                    type: String(q.type),
                });
            }
        }

        const emptyDays = days.filter((d) => !plan.has(d));
        if (emptyDays.length === 0) {
            return {
                assignedCount: 0,
                skippedDays: [],
                emptyDaysBefore: 0,
                notEnoughQuestions: false,
                assigned: [],
            };
        }

        const usedIds = new Set([...plan.values()].map((s) => s.questionId));
        const candidateIds = (options?.candidateQuestionIds ?? [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && !usedIds.has(id));

        let pool: QuizQuestion[] = [];
        if (candidateIds.length > 0) {
            // Aligné sur la liste admin : on utilise exactement les candidats fournis
            pool = await QuizQuestion.findAll({
                where: { id: { [Op.in]: candidateIds } },
            });
        } else {
            // Fallback : questions non brûlées Daily (false ou null), types jouables
            const poolWhere: Record<string, unknown> = {
                was_daily_question: { [Op.or]: [false, null] },
                type: { [Op.in]: AUTO_SCHEDULE_PLAYABLE_TYPES },
            };
            if (usedIds.size > 0) {
                poolWhere.id = { [Op.notIn]: [...usedIds] };
            }
            pool = await QuizQuestion.findAll({ where: poolWhere });
        }

        const available = pool.filter((q) => !usedIds.has(this.toNumberId(q.id)));
        const assigned: Array<{
            day: string;
            questionId: number;
            difficulty: string;
            type: string;
        }> = [];
        const skippedDays: string[] = [];

        const runFill = async (persist: boolean, transaction?: Transaction) => {
            for (const day of emptyDays) {
                const nearby = [...plan.values()].filter((slot) => {
                    const gap = Math.abs(this.daysBetween(day, slot.date));
                    return gap > 0 && gap < MIN_PAIR_GAP_DAYS;
                });

                const forbiddenPairs = new Set(
                    nearby.map((slot) => this.pairKey(slot.difficulty, slot.type))
                );

                const diffCounts: Record<QuizQuestionDifficulty, number> = {
                    easy: 0,
                    medium: 0,
                    hard: 0,
                };
                const typeCounts = new Map<string, number>();
                for (const slot of nearby) {
                    diffCounts[slot.difficulty] += 1;
                    typeCounts.set(
                        slot.type,
                        (typeCounts.get(slot.type) ?? 0) + 1
                    );
                }

                const underQuota = DIFFICULTIES.filter((d) => diffCounts[d] < 2);
                const preferredDiffs =
                    underQuota.length > 0 ? underQuota : DIFFICULTIES;

                const valid = available.filter(
                    (q) =>
                        !forbiddenPairs.has(
                            this.pairKey(
                                this.normalizeDifficultyValue(q.difficulty),
                                String(q.type)
                            )
                        )
                );

                if (valid.length === 0) {
                    skippedDays.push(day);
                    continue;
                }

                const targetDifficulty = this.weightedPick(
                    preferredDiffs,
                    preferredDiffs.map((d) =>
                        underQuota.length > 0 ? 2 - diffCounts[d] : 1
                    )
                );

                let candidates = valid.filter(
                    (q) =>
                        this.normalizeDifficultyValue(q.difficulty) ===
                        targetDifficulty
                );
                if (candidates.length === 0) {
                    candidates = valid.filter((q) =>
                        preferredDiffs.includes(
                            this.normalizeDifficultyValue(q.difficulty)
                        )
                    );
                }
                if (candidates.length === 0) {
                    candidates = valid;
                }

                const minTypeCount = Math.min(
                    ...candidates.map((q) => typeCounts.get(String(q.type)) ?? 0)
                );
                const typePreferred = candidates.filter(
                    (q) => (typeCounts.get(String(q.type)) ?? 0) === minTypeCount
                );
                const pick = this.pickRandom(
                    typePreferred.length > 0 ? typePreferred : candidates
                );

                const difficulty = this.normalizeDifficultyValue(pick.difficulty);
                const type = String(pick.type);
                const questionId = this.toNumberId(pick.id);

                if (persist) {
                    // Planifier seulement : was_daily_question reste false jusqu'au passage en Daily
                    pick.season_id = seasonId;
                    pick.scheduled_date = day;
                    await pick.save({ transaction });
                }

                plan.set(day, { date: day, questionId, difficulty, type });
                assigned.push({ day, questionId, difficulty, type });

                const idx = available.findIndex((q) => q.id === pick.id);
                if (idx >= 0) available.splice(idx, 1);
            }
        };

        if (dryRun) {
            await runFill(false);
        } else {
            await sequelize.transaction(async (transaction) => {
                await runFill(true, transaction);
            });
        }

        return {
            assignedCount: assigned.length,
            skippedDays,
            emptyDaysBefore: emptyDays.length,
            notEnoughQuestions: skippedDays.length > 0 || assigned.length < emptyDays.length,
            assigned,
        };
    }

    /** Classement saison : tous les joueurs (somme des scores daily), du meilleur au moins bon. */
    static async getSeasonPodium(seasonId: number) {
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);

        const rows = await sequelize.query<{
            user_id: string;
            username: string;
            total_score: string | number;
            attempts_count: string | number;
        }>(
            `
            SELECT
                u.id AS user_id,
                u.username,
                COALESCE(SUM(a.score), 0) AS total_score,
                COUNT(a.id) AS attempts_count
            FROM quiz_attempt a
            INNER JOIN "user" u ON u.id = a.user_id
            WHERE a.mode = 'daily'
              AND a.status = 'finished'
              AND a.daily_date IS NOT NULL
              AND a.daily_date >= :startDate
              AND a.daily_date <= :endDate
            GROUP BY u.id, u.username
            ORDER BY total_score DESC, attempts_count DESC, u.username ASC
            `,
            {
                replacements: {
                    startDate: season.start_date,
                    endDate: season.end_date,
                },
                type: QueryTypes.SELECT,
            }
        );

        return {
            season: await this.serializeSeason(season),
            podium: rows.map((row, index) => ({
                rank: index + 1,
                userId: String(row.user_id),
                username: row.username,
                totalScore: Number(row.total_score) || 0,
                attemptsCount: Number(row.attempts_count) || 0,
            })),
        };
    }
}

export default QuizSeasonService;
