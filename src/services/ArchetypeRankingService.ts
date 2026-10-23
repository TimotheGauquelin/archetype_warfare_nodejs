import {
    Tournament,
    TournamentPlayer,
    User,
    Archetype,
    TournamentPlayerDeck
} from '../models/relations';

export interface TournamentWinnerResult {
    tournamentPlayerId: number;
    userId: string;
    username: string | null;
    deckId: string | null;
    archetypeId: number | null;
    archetypeName: string | null;
}

export interface PlayerRankingEntry {
    userId: string;
    username: string | null;
    country: string | null;
    /** Points cumulés sur les tournois officiels (1er=10, 2e=5, 3e=3, reste=1). */
    points: number;
}

export interface ArchetypeRankingResult {
    archetypeId: number;
    archetypeName: string;
    rankings: PlayerRankingEntry[];
}

export interface ArchetypeMasterEntry {
    archetypeId: number;
    archetypeName: string;
    master: PlayerRankingEntry | null;
}

function placementPoints(rank: number): number {
    if (rank === 1) return 10;
    if (rank === 2) return 5;
    if (rank === 3) return 3;
    return 1;
}

class ArchetypeRankingService {
    /**
     * Détermine le vainqueur d'un tournoi terminé (suisse) : joueur avec le plus de match_wins,
     * puis games_won en cas d'égalité.
     * L'archétype ne vient que du snapshot de decklist (pas du deck live).
     */
    static async getTournamentWinner(tournamentId: string): Promise<TournamentWinnerResult | null> {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament || tournament.status !== 'tournament_finished') {
            return null;
        }

        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId, dropped: false },
            order: [
                ['match_wins', 'DESC'],
                ['games_won', 'DESC']
            ],
            include: [
                { model: User, as: 'user', attributes: ['id', 'username'] },
                {
                    model: TournamentPlayerDeck,
                    as: 'deck_snapshot',
                    attributes: ['id', 'archetype_id'],
                    required: false,
                    include: [{ model: Archetype, as: 'archetype', attributes: ['id', 'name'], required: false }]
                }
            ]
        });

        const winner = players[0];
        if (!winner) return null;

        const deckSnapshot = winner.get('deck_snapshot') as (TournamentPlayerDeck & { archetype?: Archetype }) | null;
        const archetype = deckSnapshot?.archetype ?? null;
        const archetypeId = deckSnapshot?.archetype_id ?? null;
        const user = winner.get('user') as User | null;

        return {
            tournamentPlayerId: winner.id,
            userId: winner.user_id,
            username: user?.username ?? null,
            deckId: winner.deck_id,
            archetypeId: archetypeId ?? null,
            archetypeName: archetype?.name ?? null
        };
    }

    /**
     * Points maîtres : tournois officiels terminés.
     * Classement global du tournoi → 1er=10, 2e=5, 3e=3, reste=1,
     * attribués à l'archétype du snapshot de decklist.
     */
    private static async computePointsByArchetypeAndUser(): Promise<Map<number, Map<string, number>>> {
        const tournaments = await Tournament.findAll({
            where: {
                status: 'tournament_finished',
                is_official: true,
            },
            attributes: ['id']
        });

        const pointsByArchetypeAndUser = new Map<number, Map<string, number>>();

        for (const t of tournaments) {
            const players = await TournamentPlayer.findAll({
                where: { tournament_id: t.id },
                order: [
                    ['match_wins', 'DESC'],
                    ['match_draws', 'DESC'],
                    ['games_won', 'DESC']
                ],
                include: [
                    {
                        model: TournamentPlayerDeck,
                        as: 'deck_snapshot',
                        attributes: ['archetype_id'],
                        required: false
                    }
                ]
            });

            // Rang = classement global du tournoi ; points seulement si snapshot + archétype
            players.forEach((player, index) => {
                const deckSnapshot = player.get('deck_snapshot') as TournamentPlayerDeck | null;
                const archetypeId = deckSnapshot?.archetype_id ?? null;
                if (archetypeId == null) return;

                const pts = placementPoints(index + 1);
                if (!pointsByArchetypeAndUser.has(archetypeId)) {
                    pointsByArchetypeAndUser.set(archetypeId, new Map());
                }
                const userPoints = pointsByArchetypeAndUser.get(archetypeId)!;
                userPoints.set(player.user_id, (userPoints.get(player.user_id) ?? 0) + pts);
            });
        }

        return pointsByArchetypeAndUser;
    }

    /**
     * Classement pour un archétype donné : joueurs triés par points (tournois officiels).
     */
    static async getArchetypeRanking(archetypeId: number): Promise<ArchetypeRankingResult | null> {
        const archetype = await Archetype.findByPk(archetypeId, { attributes: ['id', 'name'] });
        if (!archetype) return null;

        const pointsByArchetypeAndUser = await this.computePointsByArchetypeAndUser();
        const userPoints = pointsByArchetypeAndUser.get(archetypeId);
        if (!userPoints || userPoints.size === 0) {
            return { archetypeId: archetype.id, archetypeName: archetype.name, rankings: [] };
        }

        const userIds = [...userPoints.keys()];
        const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'username', 'country']
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const rankings: PlayerRankingEntry[] = [...userPoints.entries()]
            .map(([userId, points]) => {
                const user = userMap.get(userId);
                return {
                    userId,
                    username: user?.username ?? null,
                    country: user?.country ?? null,
                    points,
                };
            })
            .sort((a, b) => b.points - a.points);

        return { archetypeId: archetype.id, archetypeName: archetype.name, rankings };
    }

    /**
     * Points maîtres de l'utilisateur connecté, par archétype joué en tournoi officiel.
     */
    static async getUserArchetypeRankings(userId: string): Promise<{
        totalPoints: number;
        archetypes: Array<{
            archetypeId: number;
            archetypeName: string;
            slug: string | null;
            points: number;
            rank: number;
            playersCount: number;
        }>;
    }> {
        const pointsByArchetypeAndUser = await this.computePointsByArchetypeAndUser();
        const entries: Array<{
            archetypeId: number;
            points: number;
            rank: number;
            playersCount: number;
        }> = [];

        for (const [archetypeId, userMap] of pointsByArchetypeAndUser) {
            const points = userMap.get(userId);
            if (points == null || points <= 0) continue;

            const sorted = [...userMap.entries()].sort((a, b) => b[1] - a[1]);
            const rank = sorted.findIndex(([id]) => id === userId) + 1;
            entries.push({
                archetypeId,
                points,
                rank,
                playersCount: userMap.size,
            });
        }

        if (entries.length === 0) {
            return { totalPoints: 0, archetypes: [] };
        }

        const archetypes = await Archetype.findAll({
            where: { id: entries.map((e) => e.archetypeId) },
            attributes: ['id', 'name', 'slug'],
        });
        const archetypeMap = new Map(archetypes.map((a) => [a.id, a]));

        const result = entries
            .map((entry) => {
                const archetype = archetypeMap.get(entry.archetypeId);
                return {
                    archetypeId: entry.archetypeId,
                    archetypeName: archetype?.name ?? `#${entry.archetypeId}`,
                    slug: archetype?.slug ?? null,
                    points: entry.points,
                    rank: entry.rank,
                    playersCount: entry.playersCount,
                };
            })
            .sort((a, b) => b.points - a.points || a.archetypeName.localeCompare(b.archetypeName));

        return {
            totalPoints: result.reduce((sum, a) => sum + a.points, 0),
            archetypes: result,
        };
    }

    /**
     * Liste des "maîtres" par archétype : joueur en tête (plus de points).
     */
    static async getAllMasters(): Promise<ArchetypeMasterEntry[]> {
        const pointsByArchetypeAndUser = await this.computePointsByArchetypeAndUser();
        if (pointsByArchetypeAndUser.size === 0) return [];

        const archetypeIds = [...pointsByArchetypeAndUser.keys()];
        const archetypes = await Archetype.findAll({
            where: { id: archetypeIds },
            attributes: ['id', 'name']
        });

        const allUserIds = new Set<string>();
        pointsByArchetypeAndUser.forEach(userMap => userMap.forEach((_, userId) => allUserIds.add(userId)));
        const users = await User.findAll({
            where: { id: [...allUserIds] },
            attributes: ['id', 'username', 'country']
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const result: ArchetypeMasterEntry[] = [];

        for (const archetype of archetypes) {
            const userPoints = pointsByArchetypeAndUser.get(archetype.id);
            if (!userPoints || userPoints.size === 0) continue;

            const top = [...userPoints.entries()].sort((a, b) => b[1] - a[1])[0];
            const user = userMap.get(top[0]);
            result.push({
                archetypeId: archetype.id,
                archetypeName: archetype.name,
                master: {
                    userId: top[0],
                    username: user?.username ?? null,
                    country: user?.country ?? null,
                    points: top[1]
                }
            });
        }

        result.sort((a, b) => a.archetypeName.localeCompare(b.archetypeName));
        return result;
    }
}

export default ArchetypeRankingService;
