import { QueryTypes } from 'sequelize';
import sequelize from '../config/Sequelize';
import { CustomError } from '../errors/CustomError';
import SeasonPointAward from '../models/SeasonPointAwardModel';
import SeasonTournamentRankSnapshot from '../models/SeasonTournamentRankSnapshotModel';
import QuizSeason from '../models/QuizSeasonModel';
import Tournament from '../models/TournamentModel';
import TournamentPlayer from '../models/TournamentPlayerModel';
import User from '../models/UserModel';
import QuizSeasonService from './QuizSeasonService';
import MedalService from './MedalService';
import {
    resolveSeasonTournamentTier,
    type SeasonTournamentTier,
} from '../utils/seasonTournamentRank';

const TOURNAMENT_SWISS_REASON = 'tournament_swiss';
const TOURNAMENT_SOURCE = 'tournament' as const;

/** Bonus podium circuit : 1er=5, 2e=4, 3e=3. */
function placementBonusForRank(rank: number): number {
    if (rank === 1) return 5;
    if (rank === 2) return 4;
    if (rank === 3) return 3;
    return 0;
}

/**
 * Points Swiss circuit : V=3, D=0 (nul = 0 pour le circuit saison).
 * DQ = 0 point circuit sur ce tournoi (match + podium).
 */
function swissMatchPointsForPlayer(player: TournamentPlayer): number {
    if (player.disqualified_at) return 0;
    const wins = Math.max(0, Number(player.match_wins) || 0);
    return wins * 3;
}

function compareStandings(
    a: TournamentPlayer,
    b: TournamentPlayer
): number {
    const winsDiff =
        Math.max(0, Number(b.match_wins) || 0) -
        Math.max(0, Number(a.match_wins) || 0);
    if (winsDiff !== 0) return winsDiff;
    const drawsDiff =
        Math.max(0, Number(b.match_draws) || 0) -
        Math.max(0, Number(a.match_draws) || 0);
    if (drawsDiff !== 0) return drawsDiff;
    return (
        Math.max(0, Number(b.games_won) || 0) -
        Math.max(0, Number(a.games_won) || 0)
    );
}

function todayDateString(timeZone = 'Europe/Paris'): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

type RankingRow = {
    userId: string;
    username: string;
    totalPoints: number;
    tournamentsCount: number;
    rank: number;
    tier: SeasonTournamentTier;
    nextTier: SeasonTournamentTier | null;
    nextTierMinPoints: number | null;
    pointsToNextTier: number | null;
    frozen: boolean;
};

class SeasonPointAwardService {
    static toNumberId(value: unknown): number {
        return Number(value);
    }

    private static enrichTier(points: number, frozen = false) {
        const info = resolveSeasonTournamentTier(points);
        return {
            tier: info.tier,
            nextTier: frozen ? null : info.nextTier,
            nextTierMinPoints: frozen ? null : info.nextTierMinPoints,
            pointsToNextTier: frozen ? null : info.pointsToNextTier,
            frozen,
        };
    }

    /** Recrée les awards Swiss d'un tournoi (ou les efface si non éligible). */
    static async syncTournamentSwissAwards(tournamentId: string): Promise<{
        awarded: number;
        cleared: boolean;
        seasonId: number | null;
    }> {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament) throw new CustomError('Tournoi introuvable', 404);

        const sourceId = String(tournament.id);
        const seasonId =
            tournament.season_id != null
                ? this.toNumberId(tournament.season_id)
                : null;

        const eligible =
            tournament.status === 'tournament_finished' &&
            Boolean(tournament.is_official) &&
            seasonId != null &&
            Number.isFinite(seasonId);

        await SeasonPointAward.destroy({
            where: {
                source_type: TOURNAMENT_SOURCE,
                source_id: sourceId,
                reason: TOURNAMENT_SWISS_REASON,
            },
        });

        if (!eligible || seasonId == null) {
            return { awarded: 0, cleared: true, seasonId };
        }

        const season = await QuizSeason.findByPk(seasonId);
        if (!season) {
            return { awarded: 0, cleared: true, seasonId: null };
        }

        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournament.id },
        });

        const ranked = [...players].sort(compareStandings);
        const rows = ranked.map((player, index) => {
            const standingRank = index + 1;
            const matchPoints = swissMatchPointsForPlayer(player);
            const placementBonus = player.disqualified_at
                ? 0
                : placementBonusForRank(standingRank);
            const points = matchPoints + placementBonus;
            return {
                season_id: seasonId,
                user_id: String(player.user_id),
                source_type: TOURNAMENT_SOURCE,
                source_id: sourceId,
                points,
                reason: TOURNAMENT_SWISS_REASON,
                meta: {
                    tournamentId: sourceId,
                    tournamentName: tournament.name,
                    matchWins: player.match_wins,
                    matchDraws: player.match_draws,
                    matchLosses: player.match_losses,
                    matchPoints,
                    placementBonus,
                    standingRank,
                    dropped: Boolean(player.dropped),
                    disqualified: Boolean(player.disqualified_at),
                },
            };
        });

        if (rows.length > 0) {
            await SeasonPointAward.bulkCreate(rows);
        }

        return { awarded: rows.length, cleared: false, seasonId };
    }

    static async recalculateTournamentSeasonPoints(tournamentId: string) {
        const result = await this.syncTournamentSwissAwards(tournamentId);
        return {
            message: result.cleared
                ? 'Aucun point saison attribué (tournoi non éligible ou sans saison)'
                : `Points saison recalculés (${result.awarded} joueur(s))`,
            ...result,
        };
    }

    private static async loadLiveTournamentTotals(seasonId: number) {
        return sequelize.query<{
            user_id: string;
            username: string;
            total_points: string | number;
            tournaments_count: string | number;
        }>(
            `
            SELECT
                u.id AS user_id,
                u.username,
                COALESCE(SUM(a.points), 0) AS total_points,
                COUNT(DISTINCT a.source_id) FILTER (
                    WHERE a.reason = :swissReason
                ) AS tournaments_count
            FROM season_point_award a
            INNER JOIN "user" u ON u.id = a.user_id
            WHERE a.season_id = :seasonId
              AND a.source_type = :sourceType
            GROUP BY u.id, u.username
            ORDER BY total_points DESC, tournaments_count DESC, u.username ASC
            `,
            {
                replacements: {
                    seasonId,
                    sourceType: TOURNAMENT_SOURCE,
                    swissReason: TOURNAMENT_SWISS_REASON,
                },
                type: QueryTypes.SELECT,
            }
        );
    }

    /** Fige les rangs si la saison est terminée et qu'aucun snapshot n'existe encore. */
    static async ensureSeasonTournamentRankFrozen(
        season: QuizSeason
    ): Promise<boolean> {
        const today = todayDateString();
        if (String(season.end_date) >= today) return false;

        const seasonId = this.toNumberId(season.id);
        const existing = await SeasonTournamentRankSnapshot.count({
            where: { season_id: seasonId },
        });
        if (existing > 0) return true;

        const rows = await this.loadLiveTournamentTotals(seasonId);
        if (rows.length === 0) return true;

        const snapshotRows = rows.map((row, index) => {
            const points = Number(row.total_points) || 0;
            const tierInfo = resolveSeasonTournamentTier(points);
            return {
                season_id: seasonId,
                user_id: String(row.user_id),
                tier: tierInfo.tier,
                points,
                leaderboard_rank: index + 1,
                tournaments_count: Number(row.tournaments_count) || 0,
            };
        });

        await SeasonTournamentRankSnapshot.bulkCreate(snapshotRows);

        MedalService.evaluateSafe('onSeasonTournamentRanksFrozen', () =>
            MedalService.onSeasonTournamentRanksFrozen(
                seasonId,
                snapshotRows.map((row) => ({
                    userId: row.user_id,
                    points: row.points,
                    rank: row.leaderboard_rank,
                }))
            )
        );

        return true;
    }

    static async getSeasonTournamentRanking(seasonIdParam: string | number) {
        let season: QuizSeason | null = null;
        if (String(seasonIdParam) === 'current') {
            const seasons = await QuizSeasonService.findSeasonsForDate(
                todayDateString()
            );
            season = seasons[0] ?? null;
            if (!season) {
                throw new CustomError('Aucune saison en cours', 404);
            }
        } else {
            const id = this.toNumberId(seasonIdParam);
            season = await QuizSeason.findByPk(id);
            if (!season) throw new CustomError('Saison introuvable', 404);
        }

        const seasonId = this.toNumberId(season.id);
        const serialized = await QuizSeasonService.serializeSeason(season);
        const frozen = await this.ensureSeasonTournamentRankFrozen(season);

        let ranking: RankingRow[];

        if (frozen && serialized.status === 'past') {
            const snapshots = await SeasonTournamentRankSnapshot.findAll({
                where: { season_id: seasonId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username'],
                    },
                ],
                order: [
                    ['leaderboard_rank', 'ASC'],
                    ['points', 'DESC'],
                ],
            });

            if (snapshots.length > 0) {
                ranking = snapshots.map((snap) => {
                    const user = (snap as SeasonTournamentRankSnapshot & {
                        user?: User;
                    }).user;
                    return {
                        rank: snap.leaderboard_rank,
                        userId: String(snap.user_id),
                        username: user?.username ?? '',
                        totalPoints: snap.points,
                        tournamentsCount: snap.tournaments_count,
                        tier: snap.tier,
                        nextTier: null,
                        nextTierMinPoints: null,
                        pointsToNextTier: null,
                        frozen: true,
                    };
                });
            } else {
                ranking = [];
            }
        } else {
            const rows = await this.loadLiveTournamentTotals(seasonId);
            ranking = rows.map((row, index) => {
                const points = Number(row.total_points) || 0;
                const tierExtra = this.enrichTier(points, false);
                return {
                    rank: index + 1,
                    userId: String(row.user_id),
                    username: row.username,
                    totalPoints: points,
                    tournamentsCount: Number(row.tournaments_count) || 0,
                    ...tierExtra,
                };
            });
        }

        return {
            season: serialized,
            ranking,
            tiers: [
                { id: 'novice', minPoints: 0 },
                { id: 'bronze', minPoints: 5 },
                { id: 'argent', minPoints: 10 },
                { id: 'or', minPoints: 20 },
                { id: 'platine', minPoints: 35 },
                { id: 'diamant', minPoints: 50 },
                { id: 'master', minPoints: 100 },
            ],
            ranksFrozen: frozen && serialized.status === 'past',
        };
    }

    /**
     * Stats circuit tournois d'un joueur, regroupées par saison
     * (points Swiss + bonus podium des tournois officiels rattachés),
     * avec détail des tournois pour l'UI profil.
     */
    static async getUserTournamentSeasonStats(userId: string): Promise<{
        tournamentPoints: number;
        seasons: Array<{
            seasonId: number;
            name: string;
            startDate: string;
            endDate: string;
            imageUrl: string | null;
            imageFocalX: number;
            imageFocalY: number;
            imageZoom: number;
            points: number;
            tournamentsCount: number;
            tier: SeasonTournamentTier;
            tournaments: Array<{
                tournamentId: string;
                tournamentName: string;
                eventDate: string | null;
                place: number | null;
                playersCount: number | null;
                points: number;
                matchPoints: number | null;
                placementBonus: number | null;
            }>;
        }>;
    }> {
        type SeasonAggRow = {
            season_id: string | number;
            name: string;
            start_date: string;
            end_date: string;
            image_url: string | null;
            image_focal_x: string | number | null;
            image_focal_y: string | number | null;
            image_zoom: string | number | null;
            points: string | number;
            tournaments_count: string | number;
        };

        type TournamentDetailRow = {
            season_id: string | number;
            tournament_id: string;
            tournament_name: string;
            event_date: string | Date | null;
            points: string | number;
            meta: Record<string, unknown> | null;
            players_count: string | number | null;
        };

        const [rows, detailRows] = await Promise.all([
            sequelize.query<SeasonAggRow>(
                `
                SELECT
                    s.id AS season_id,
                    s.name,
                    s.start_date,
                    s.end_date,
                    s.image_url,
                    s.image_focal_x,
                    s.image_focal_y,
                    s.image_zoom,
                    COALESCE(SUM(a.points), 0) AS points,
                    COUNT(DISTINCT a.source_id) FILTER (
                        WHERE a.reason = :swissReason
                    ) AS tournaments_count
                FROM season_point_award a
                INNER JOIN quiz_season s ON s.id = a.season_id
                WHERE a.user_id = :userId
                  AND a.source_type = :sourceType
                GROUP BY
                    s.id,
                    s.name,
                    s.start_date,
                    s.end_date,
                    s.image_url,
                    s.image_focal_x,
                    s.image_focal_y,
                    s.image_zoom
                HAVING COALESCE(SUM(a.points), 0) <> 0
                    OR COUNT(DISTINCT a.source_id) FILTER (
                        WHERE a.reason = :swissReason
                    ) > 0
                ORDER BY s.start_date DESC, s.id DESC
                `,
                {
                    replacements: {
                        userId,
                        sourceType: TOURNAMENT_SOURCE,
                        swissReason: TOURNAMENT_SWISS_REASON,
                    },
                    type: QueryTypes.SELECT,
                }
            ),
            sequelize.query<TournamentDetailRow>(
                `
                SELECT
                    a.season_id,
                    a.source_id AS tournament_id,
                    COALESCE(
                        t.name,
                        a.meta->>'tournamentName',
                        'Tournoi'
                    ) AS tournament_name,
                    t.event_date,
                    a.points,
                    a.meta,
                    (
                        SELECT COUNT(*)::int
                        FROM tournament_player tp
                        WHERE tp.tournament_id = t.id
                    ) AS players_count
                FROM season_point_award a
                LEFT JOIN tournament t
                    ON t.id::text = a.source_id
                WHERE a.user_id = :userId
                  AND a.source_type = :sourceType
                  AND a.reason = :swissReason
                  AND a.source_id IS NOT NULL
                ORDER BY t.event_date DESC NULLS LAST, a.id DESC
                `,
                {
                    replacements: {
                        userId,
                        sourceType: TOURNAMENT_SOURCE,
                        swissReason: TOURNAMENT_SWISS_REASON,
                    },
                    type: QueryTypes.SELECT,
                }
            ),
        ]);

        const clampFocal = (value: unknown, fallback = 50) => {
            const n = Number(value);
            if (!Number.isFinite(n)) return fallback;
            return Math.max(0, Math.min(100, Math.round(n)));
        };
        const clampZoom = (value: unknown, fallback = 100) => {
            const n = Number(value);
            if (!Number.isFinite(n)) return fallback;
            return Math.max(100, Math.min(250, Math.round(n)));
        };

        const tournamentsBySeason = new Map<
            number,
            Array<{
                tournamentId: string;
                tournamentName: string;
                eventDate: string | null;
                place: number | null;
                playersCount: number | null;
                points: number;
                matchPoints: number | null;
                placementBonus: number | null;
            }>
        >();

        for (const detail of detailRows) {
            const seasonId = Number(detail.season_id);
            if (!Number.isFinite(seasonId)) continue;
            const meta =
                detail.meta && typeof detail.meta === 'object'
                    ? detail.meta
                    : {};
            const standingRank = Number(meta.standingRank);
            const matchPoints = Number(meta.matchPoints);
            const placementBonus = Number(meta.placementBonus);
            const eventDateRaw = detail.event_date;
            const eventDate =
                eventDateRaw == null
                    ? null
                    : typeof eventDateRaw === 'string'
                      ? String(eventDateRaw).slice(0, 10)
                      : eventDateRaw.toISOString().slice(0, 10);
            const playersCount = Number(detail.players_count);
            const entry = {
                tournamentId: String(detail.tournament_id),
                tournamentName: String(detail.tournament_name),
                eventDate,
                place: Number.isFinite(standingRank) ? standingRank : null,
                playersCount: Number.isFinite(playersCount)
                    ? playersCount
                    : null,
                points: Number(detail.points) || 0,
                matchPoints: Number.isFinite(matchPoints) ? matchPoints : null,
                placementBonus: Number.isFinite(placementBonus)
                    ? placementBonus
                    : null,
            };
            const list = tournamentsBySeason.get(seasonId) ?? [];
            list.push(entry);
            tournamentsBySeason.set(seasonId, list);
        }

        const seasons = rows.map((row) => {
            const points = Number(row.points) || 0;
            const tierInfo = resolveSeasonTournamentTier(points);
            const seasonId = Number(row.season_id);
            const tournaments = tournamentsBySeason.get(seasonId) ?? [];
            return {
                seasonId,
                name: row.name,
                startDate: String(row.start_date).slice(0, 10),
                endDate: String(row.end_date).slice(0, 10),
                imageUrl: row.image_url ? String(row.image_url) : null,
                imageFocalX: clampFocal(row.image_focal_x, 50),
                imageFocalY: clampFocal(row.image_focal_y, 50),
                imageZoom: clampZoom(row.image_zoom, 100),
                points,
                tournamentsCount:
                    Number(row.tournaments_count) || tournaments.length,
                tier: tierInfo.tier,
                tournaments,
            };
        });

        return {
            tournamentPoints: seasons.reduce((sum, s) => sum + s.points, 0),
            seasons,
        };
    }

    /** Pénalité saison manuelle (ex. après DQ). */
    static async addManualSeasonPenalty(data: {
        seasonId: number;
        userId: string;
        points: number;
        reason?: string;
        meta?: Record<string, unknown> | null;
    }) {
        const season = await QuizSeason.findByPk(data.seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);
        const user = await User.findByPk(data.userId);
        if (!user) throw new CustomError('Utilisateur introuvable', 404);
        const points = Math.trunc(Number(data.points));
        if (!Number.isFinite(points) || points === 0) {
            throw new CustomError('points doit être un entier non nul', 400);
        }
        return SeasonPointAward.create({
            season_id: this.toNumberId(season.id),
            user_id: String(user.id),
            source_type: 'manual',
            source_id: null,
            points,
            reason: data.reason?.trim() || 'season_penalty',
            meta: data.meta ?? null,
        });
    }
}

export default SeasonPointAwardService;
