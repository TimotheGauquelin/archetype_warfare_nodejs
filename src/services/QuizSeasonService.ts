import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/Sequelize';
import { CustomError } from '../errors/CustomError';
import QuizSeason from '../models/QuizSeasonModel';
import QuizQuestion from '../models/QuizQuestionModel';

/** Durée par défaut d'une saison Daily (~3 mois) */
export const DEFAULT_SEASON_DAYS = 90;

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

        const overlap = await QuizSeason.findOne({
            where: {
                start_date: { [Op.lte]: endDate },
                end_date: { [Op.gte]: startDate },
            },
        });
        if (overlap) {
            throw new CustomError(
                `Chevauchement avec la saison « ${overlap.name} »`,
                400
            );
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

        const overlap = await QuizSeason.findOne({
            where: {
                id: { [Op.ne]: season.id },
                start_date: { [Op.lte]: season.end_date },
                end_date: { [Op.gte]: season.start_date },
            },
        });
        if (overlap) {
            throw new CustomError(
                `Chevauchement avec la saison « ${overlap.name} »`,
                400
            );
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

    /** Podium des 3 meilleurs joueurs sur la saison (somme des scores daily). */
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
            LIMIT 3
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
