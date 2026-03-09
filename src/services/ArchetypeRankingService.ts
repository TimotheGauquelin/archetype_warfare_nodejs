import {
    Tournament,
    TournamentPlayer,
    Deck,
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
    tournamentWins: number;
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

class ArchetypeRankingService {
    /**
     * Détermine le vainqueur d'un tournoi terminé (suisse) : joueur avec le plus de match_wins,
     * puis games_won en cas d'égalité.
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
                    model: Deck,
                    as: 'deck',
                    attributes: ['id', 'archetype_id'],
                    required: false,
                    include: [{ model: Archetype, as: 'archetype', attributes: ['id', 'name'], required: false }]
                },
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
        const deck = winner.get('deck') as (Deck & { archetype?: Archetype }) | null;
        const archetype = deckSnapshot?.archetype ?? deck?.archetype ?? null;
        const archetypeId = deckSnapshot?.archetype_id ?? deck?.archetype_id ?? null;
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
     * Construit la map (archetypeId -> userId -> nombre de victoires en tournoi).
     */
    private static async computeWinsByArchetypeAndUser(): Promise<Map<number, Map<string, number>>> {
        const tournaments = await Tournament.findAll({
            where: { status: 'tournament_finished' },
            attributes: ['id']
        });

        const winsByArchetypeAndUser = new Map<number, Map<string, number>>();

        for (const t of tournaments) {
            const winner = await this.getTournamentWinner(t.id);
            if (!winner || winner.archetypeId == null) continue;

            if (!winsByArchetypeAndUser.has(winner.archetypeId)) {
                winsByArchetypeAndUser.set(winner.archetypeId, new Map());
            }
            const userWins = winsByArchetypeAndUser.get(winner.archetypeId)!;
            userWins.set(winner.userId, (userWins.get(winner.userId) ?? 0) + 1);
        }

        return winsByArchetypeAndUser;
    }

    /**
     * Classement pour un archétype donné : liste des joueurs avec leur nombre de victoires en tournoi.
     */
    static async getArchetypeRanking(archetypeId: number): Promise<ArchetypeRankingResult | null> {
        const archetype = await Archetype.findByPk(archetypeId, { attributes: ['id', 'name'] });
        if (!archetype) return null;

        const winsByArchetypeAndUser = await this.computeWinsByArchetypeAndUser();
        const userWins = winsByArchetypeAndUser.get(archetypeId);
        if (!userWins || userWins.size === 0) {
            return { archetypeId: archetype.id, archetypeName: archetype.name, rankings: [] };
        }

        const userIds = [...userWins.keys()];
        const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'username']
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const rankings: PlayerRankingEntry[] = [...userWins.entries()]
            .map(([userId, tournamentWins]) => {
                const user = userMap.get(userId);
                return { userId, username: user?.username ?? null, tournamentWins };
            })
            .sort((a, b) => b.tournamentWins - a.tournamentWins);

        return { archetypeId: archetype.id, archetypeName: archetype.name, rankings };
    }

    /**
     * Liste des "maîtres" par archétype : pour chaque archétype ayant au moins une victoire,
     * le joueur en tête (plus de victoires).
     */
    static async getAllMasters(): Promise<ArchetypeMasterEntry[]> {
        const winsByArchetypeAndUser = await this.computeWinsByArchetypeAndUser();
        if (winsByArchetypeAndUser.size === 0) return [];

        const archetypeIds = [...winsByArchetypeAndUser.keys()];
        const archetypes = await Archetype.findAll({
            where: { id: archetypeIds },
            attributes: ['id', 'name']
        });

        const allUserIds = new Set<string>();
        winsByArchetypeAndUser.forEach(userMap => userMap.forEach((_, userId) => allUserIds.add(userId)));
        const users = await User.findAll({
            where: { id: [...allUserIds] },
            attributes: ['id', 'username']
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const result: ArchetypeMasterEntry[] = [];

        for (const archetype of archetypes) {
            const userWins = winsByArchetypeAndUser.get(archetype.id);
            if (!userWins || userWins.size === 0) continue;

            const top = [...userWins.entries()].sort((a, b) => b[1] - a[1])[0];
            const user = userMap.get(top[0]);
            result.push({
                archetypeId: archetype.id,
                archetypeName: archetype.name,
                master: {
                    userId: top[0],
                    username: user?.username ?? null,
                    tournamentWins: top[1]
                }
            });
        }

        result.sort((a, b) => a.archetypeName.localeCompare(b.archetypeName));
        return result;
    }
}

export default ArchetypeRankingService;
