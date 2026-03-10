import sequelize from '../config/Sequelize';
import { Op } from 'sequelize';
import type { Transaction } from 'sequelize';
import {
    Tournament,
    TournamentPlayer,
    TournamentRound,
    TournamentMatch,
    User,
    Deck,
    DeckCard,
    TournamentPlayerDeck,
    TournamentPlayerDeckCard,
    Card,
    Archetype,
    PenaltyType,
    TournamentPlayerPenalty
} from '../models/relations';
import { CustomError } from '../errors/CustomError';

import type { RoundStatus } from '../models/TournamentRoundModel';
import { TournamentStatus } from '../models/TournamentModel';
import { sendPlayerRemovedFromTournamentMail } from '../mailing/sendPlayerRemovedFromTournamentMail';
import { sendPlayerAddedToTournamentMail } from '../mailing/sendPlayerAddedToTournamentMail';

const REGISTRATION_DEADLINE_HOURS = 48;

/** Check that the registration/unregistration is still allowed (at least 48 hours before the start).
 * 
 * @param eventDate - The event date of the tournament.
 * @returns A boolean indicating if the registration/unregistration is still allowed.
 */
function isWithinRegistrationWindow(eventDate: Date | null): boolean {
    if (!eventDate) return true;
    const start = new Date(eventDate).getTime();
    const deadline = start - REGISTRATION_DEADLINE_HOURS * 60 * 60 * 1000;
    return Date.now() < deadline;
}

/** Vérifie que l'utilisateur n'est pas déjà inscrit à un autre tournoi dont les dates chevauchent (sans avoir dropped). */
async function ensureNoOverlappingRegistration(
    userId: string,
    tournamentId: string,
    tournament: Tournament
): Promise<void> {
    if (tournament.event_date == null) return;

    const newStart = new Date(tournament.event_date).getTime();
    const newEnd = tournament.event_date_end
        ? new Date(tournament.event_date_end).getTime()
        : newStart;

    const otherParticipations = await TournamentPlayer.findAll({
        where: { user_id: userId, dropped: false, tournament_id: { [Op.ne]: tournamentId } },
        include: [{ model: Tournament, as: 'tournament' }]
    });

    for (const tp of otherParticipations) {
        const other = (tp as any).tournament as Tournament | undefined;
        if (!other || other.event_date == null) continue;

        const otherStart = new Date(other.event_date).getTime();
        const otherEnd = other.event_date_end ? new Date(other.event_date_end).getTime() : otherStart;

        if (newStart <= otherEnd && otherStart <= newEnd) {
            throw new CustomError(
                'Vous êtes déjà inscrit à un tournoi sur cette période. Abandonnez l\'autre tournoi pour vous inscrire ici.',
                400
            );
        }
    }
}

interface CreateTournamentData {
    name: string;
    max_number_of_rounds: number;
    matches_per_round: 1 | 3 | 5;
    until_winner?: boolean;
    require_deck_list?: boolean;
    max_players?: number | null;
    location?: string | null;
    event_date?: Date | string | null;
    event_date_end?: Date | string | null;
    is_online?: boolean;
}

interface RegisterPlayerData {
    tournamentId: string;
    userId: string;
}

interface RecordMatchResultData {
    matchId: number;
    player1GamesWon: number;
    player2GamesWon: number;
}

/** Get the set of tournament_player IDs that have already received a BYE in this tournament
 *  (in rounds strictly before the given round number).
 */
async function getPlayersWhoHadBye(tournamentId: string, beforeRoundNumber: number): Promise<Set<number>> {
    const rounds = await TournamentRound.findAll({
        where: { tournament_id: tournamentId, round_number: { [Op.lt]: beforeRoundNumber } },
        attributes: ['id']
    });
    const roundIds = rounds.map((r) => r.id);
    if (roundIds.length === 0) return new Set();

    const matches = await TournamentMatch.findAll({
        where: {
            tournament_id: tournamentId,
            round_id: { [Op.in]: roundIds },
            player2_tournament_player_id: null
        },
        attributes: ['player1_tournament_player_id']
    });
    const ids = new Set<number>();
    for (const m of matches) {
        const id = m.player1_tournament_player_id;
        if (id != null) ids.add(id);
    }
    return ids;
}

/** Get the played pairs for a tournament.
 * 
 * @param tournamentId - The ID of the tournament to get the played pairs for.
 * @returns A promise that resolves to a set of strings representing the played pairs.
 */
async function getPlayedPairs(tournamentId: string): Promise<Set<string>> {
    const matches = await TournamentMatch.findAll({
        where: { tournament_id: tournamentId },
        attributes: ['player1_tournament_player_id', 'player2_tournament_player_id']
    });
    const pairs = new Set<string>();
    for (const m of matches) {
        const b = m.player2_tournament_player_id;
        if (b == null) continue;
        const a = m.player1_tournament_player_id;
        pairs.add([Math.min(a, b), Math.max(a, b)].join('-'));
    }
    return pairs;
}

/** Check if two players have already played against each other.
 * 
 * @param pairs - The set of played pairs.
 * @param id1 - The ID of the first player.
 * @param id2 - The ID of the second player.
 * @returns A boolean indicating if the two players have already played against each other.
 */
function haveAlreadyPlayed(pairs: Set<string>, id1: number, id2: number): boolean {
    return pairs.has([Math.min(id1, id2), Math.max(id1, id2)].join('-'));
}

/** Pair the players using the Swiss system.
 * 
 * @param players - The players to pair.
 * @param playedPairs - The set of played pairs.
 * @returns A promise that resolves to an array of pairs of player IDs.
 */
function swissPair(players: { id: number; match_wins: number }[], playedPairs: Set<string>): [number, number][] {
    const sorted = [...players].sort((a, b) => b.match_wins - a.match_wins);
    const used = new Set<number>();
    const result: [number, number][] = [];

    for (let i = 0; i < sorted.length; i++) {
        if (used.has(sorted[i].id)) continue;
        let found = false;
        for (let j = i + 1; j < sorted.length; j++) {
            if (used.has(sorted[j].id)) continue;
            if (!haveAlreadyPlayed(playedPairs, sorted[i].id, sorted[j].id)) {
                result.push([sorted[i].id, sorted[j].id]);
                used.add(sorted[i].id);
                used.add(sorted[j].id);
                found = true;
                break;
            }
        }
        if (!found) { /* laissé pour le fallback */ }
    }

    // Fallback : s'il reste des joueurs non appariés, autoriser les rematches
    const remaining = sorted.filter(p => !used.has(p.id));
    for (let i = 0; i < remaining.length; i++) {
        if (used.has(remaining[i].id)) continue;
        for (let j = i + 1; j < remaining.length; j++) {
            if (used.has(remaining[j].id)) continue;
            result.push([remaining[i].id, remaining[j].id]);
            used.add(remaining[i].id);
            used.add(remaining[j].id);
            break;
        }
    }

    return result;
}

/** Mark the round as completed (in the provided transaction).
 * 
 * @param tournamentId - The ID of the tournament.
 * @param roundNumber - The number of the round to mark as completed.
 * @param transaction - The transaction to use.
 * @returns A promise that resolves to void.
 */
async function markRoundAsCompleted(
    tournamentId: string,
    roundNumber: number,
    transaction: Transaction
): Promise<void> {
    const round = await TournamentRound.findOne({
        where: { tournament_id: tournamentId, round_number: roundNumber },
        transaction
    });
    if (round) {
        round.status = 'completed';
        await round.save({ transaction });
    }
}

class TournamentService {
    /** Create a new tournament.
     * 
     * @param data - The data to create the tournament with.
     * @returns A promise that resolves to the created tournament.
     */
    static async create(data: CreateTournamentData) {
        // Ne jamais passer id : la base (SERIAL) l'auto-incrémente.
        const payload = {
            name: data.name,
            max_number_of_rounds: data.max_number_of_rounds,
            matches_per_round: data.matches_per_round,
            until_winner: data.until_winner ?? false,
            require_deck_list: data.require_deck_list ?? false,
            max_players: data.max_players ?? null,
            location: data.location ?? null,
            event_date: data.event_date != null ? new Date(data.event_date) : null,
            event_date_end: data.event_date_end != null ? new Date(data.event_date_end) : null,
            is_online: data.is_online ?? true,
            status: 'registration_closed' as const,
            current_round: 0
        };
        return Tournament.create(payload);
    }

    /** Get all current tournaments.
     * 
     * @param status - The status of the tournaments to get.
     * @returns A promise that resolves to an array of tournaments.
     */
    static async getAllCurrentTournaments(status?: TournamentStatus) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 7);
        dateFrom.setHours(0, 0, 0, 0);
        const where: Record<string, unknown> = {
            event_date: { [Op.gte]: dateFrom }
        };
        if (status) where.status = status;
        return Tournament.findAll({
            where,
            order: [['event_date', 'ASC']],
            include: [{ model: TournamentPlayer, as: 'players', attributes: ['id'] }]
        });
    }

    /** Recherche tous les tournois (admin). Filtres optionnels : name, status, location (mot dans le lieu), is_online. */
    static async searchAllTournaments(filters?: {
        name?: string;
        status?: TournamentStatus;
        location?: string;
        is_online?: boolean;
    }) {
        const where: Record<string, unknown> = {};
        if (filters?.name?.trim()) {
            where.name = { [Op.iLike]: `%${filters.name.trim()}%` };
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.location?.trim()) {
            where.location = { [Op.iLike]: `%${filters.location.trim()}%` };
        }
        if (filters?.is_online !== undefined) {
            where.is_online = filters.is_online;
        }
        return Tournament.findAll({
            where,
            order: [['event_date', 'ASC']],
            include: [{ model: TournamentPlayer, as: 'players', attributes: ['id'] }]
        });
    }

    /** Get the tournaments for a user.
     * 
     * @param userId - The ID of the user to get the tournaments for.
     * @returns A promise that resolves to an array of tournaments.
     */
    static async getTournamentsForUser(userId: string) {
        const userTournamentPlayers = await TournamentPlayer.findAll({
            where: { user_id: userId },
            attributes: ['tournament_id']
        });

        const tournamentIds = Array.from(
            new Set(userTournamentPlayers.map(tp => tp.tournament_id as string))
        );

        if (tournamentIds.length === 0) {
            return [];
        }

        return Tournament.findAll({
            where: { id: tournamentIds },
            include: [
                {
                    model: TournamentPlayer,
                    as: 'players',
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username', 'email']
                        }
                    ]
                }
            ],
            order: [['event_date', 'DESC']]
        });
    }

    /** Get the details of a tournament for a user participating : tournament info + only his matches by round. */
    static async getTournamentDetailsForUser(tournamentId: string, userId: string) {
        const tournamentPlayer = await TournamentPlayer.findOne({
            where: { tournament_id: tournamentId, user_id: userId }
        });
        if (!tournamentPlayer) {
            throw new CustomError('Vous ne participez pas à ce tournoi', 403);
        }

        const penalties = await TournamentPlayerPenalty.findAll({
            where: { tournament_player_id: tournamentPlayer.id },
            include: [
                { model: PenaltyType, as: 'penalty_type' },
                { model: TournamentRound, as: 'round' },
                { model: TournamentMatch, as: 'tournament_match' }
            ],
            order: [['applied_at', 'ASC']]
        });

        const tournament = await Tournament.findByPk(tournamentId, {
            include: [
                {
                    model: TournamentRound,
                    as: 'rounds',
                    order: [['round_number', 'ASC']],
                    required: false,
                    include: [
                        {
                            model: TournamentMatch,
                            as: 'matches',
                            required: false,
                            where: {
                                [Op.or]: [
                                    { player1_tournament_player_id: tournamentPlayer.id },
                                    { player2_tournament_player_id: tournamentPlayer.id }
                                ]
                            },
                            include: [
                                { model: TournamentPlayer, as: 'player1', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
                                { model: TournamentPlayer, as: 'player2', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
                                { model: TournamentPlayer, as: 'winner', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        const plain = tournament.get({ plain: true }) as {
            id: string;
            name: string;
            status: string;
            max_number_of_rounds: number;
            matches_per_round: number;
            current_round: number;
            until_winner?: boolean;
            require_deck_list?: boolean;
            event_date: string | null;
            event_date_end?: string | null;
            location?: string | null;
            max_players?: number | null;
            is_online?: boolean;
            rounds?: Array<{
                id: number;
                round_number: number;
                status: string;
                matches?: Array<{
                    id: number;
                    round_id: number;
                    status: string;
                    player1_tournament_player_id: number;
                    player2_tournament_player_id: number | null;
                    player1_games_won: number;
                    player2_games_won: number;
                    winner_tournament_player_id: number | null;
                    player1?: { user?: { id: string; username: string } } | null;
                    player2?: { user?: { id: string; username: string } } | null;
                    winner?: { user?: { id: string; username: string } } | null;
                }>;
            }>;
        };

        return {
            id: plain.id,
            name: plain.name,
            status: plain.status,
            max_number_of_rounds: plain.max_number_of_rounds,
            matches_per_round: plain.matches_per_round,
            current_round: plain.current_round,
            until_winner: plain.until_winner ?? false,
            require_deck_list: plain.require_deck_list ?? false,
            event_date: plain.event_date,
            ...(plain.event_date_end != null && { event_date_end: plain.event_date_end }),
            ...(plain.location != null && { location: plain.location }),
            ...(plain.max_players != null && { max_players: plain.max_players }),
            ...(plain.is_online != null && { is_online: plain.is_online }),
            tournament_player: {
                id: tournamentPlayer.id,
                user_id: tournamentPlayer.user_id,
                deck_id: tournamentPlayer.deck_id,
                match_wins: tournamentPlayer.match_wins,
                match_losses: tournamentPlayer.match_losses,
                match_draws: tournamentPlayer.match_draws,
                games_won: tournamentPlayer.games_won,
                games_played: tournamentPlayer.games_played,
                dropped: tournamentPlayer.dropped,
                penalties: penalties.map((p) => {
                    const plainPenalty = p.get({ plain: true }) as any;
                    return {
                        id: plainPenalty.id,
                        penalty_type: plainPenalty.penalty_type
                            ? {
                                id: plainPenalty.penalty_type.id,
                                code: plainPenalty.penalty_type.code,
                                label: plainPenalty.penalty_type.label
                            }
                            : null,
                        round: plainPenalty.round
                            ? {
                                id: plainPenalty.round.id,
                                round_number: plainPenalty.round.round_number
                            }
                            : null,
                        tournament_match: plainPenalty.tournament_match
                            ? {
                                id: plainPenalty.tournament_match.id
                            }
                            : null,
                        reason: plainPenalty.reason,
                        notes: plainPenalty.notes,
                        disqualification_with_prize: plainPenalty.disqualification_with_prize,
                        applied_at: plainPenalty.applied_at
                    };
                })
            },
            rounds: (plain.rounds || []).map((r) => {
                const m = (r.matches && r.matches[0]) || null;

                let match:
                    | null
                    | {
                        id: number;
                        round_id: number;
                        status: string;
                        player1: {
                            id: string | null;
                            username: string | null;
                            isWinner: boolean;
                            gamesWon: number;
                        } | null;
                        player2:
                        | {
                            id: string;
                            username: string;
                            isWinner: boolean;
                            gamesWon: number;
                        }
                        | null;
                    } = null;

                if (m) {
                    const isP1Winner = m.winner_tournament_player_id === m.player1_tournament_player_id;
                    const isP2Winner =
                        m.player2_tournament_player_id != null &&
                        m.winner_tournament_player_id === m.player2_tournament_player_id;

                    const p1User = m.player1?.user;
                    const p2User = m.player2?.user;

                    match = {
                        id: m.id,
                        round_id: m.round_id,
                        status: m.status,
                        player1: p1User
                            ? {
                                id: p1User.id,
                                username: p1User.username,
                                isWinner: isP1Winner,
                                gamesWon: m.player1_games_won
                            }
                            : null,
                        player2:
                            m.player2_tournament_player_id == null || !p2User
                                ? null
                                : {
                                    id: p2User.id,
                                    username: p2User.username,
                                    isWinner: isP2Winner,
                                    gamesWon: m.player2_games_won
                                }
                    };
                }

                return {
                    id: r.id,
                    round_number: r.round_number,
                    status: r.status,
                    match
                };
            })
        };
    }

    static async getById(id: string, options?: { includePlayers?: boolean }) {
        const includePlayers = options?.includePlayers !== false;
        const include: Array<Record<string, unknown>> = [
            { model: TournamentRound, as: 'rounds', order: [['round_number', 'ASC']], include: [{ model: TournamentMatch, as: 'matches' }] }
        ];
        if (includePlayers) {
            include.unshift({
                model: TournamentPlayer,
                as: 'players',
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: TournamentPlayerDeck,
                        as: 'deck_snapshot',
                        include: [
                            {
                                model: TournamentPlayerDeckCard,
                                as: 'cards',
                                include: [
                                    {
                                        model: Card,
                                        as: 'card'
                                    }
                                ]
                            },
                            {
                                model: Archetype,
                                as: 'archetype'
                            },
                            {
                                model: User,
                                as: 'snapshot_by',
                                attributes: ['id', 'username']
                            }
                        ]
                    }
                ]
            });
        }
        const t = await Tournament.findByPk(id, { include });
        if (!t) throw new CustomError('Tournoi introuvable', 404);
        return t;
    }

    static async update(
        id: string,
        updates: {
            name?: string;
            status?: TournamentStatus;
            max_number_of_rounds?: number;
            until_winner?: boolean;
            require_deck_list?: boolean;
            max_players?: number | null;
            location?: string | null;
            event_date?: Date | string | null;
            event_date_end?: Date | string | null;
            is_online?: boolean;
            allow_penalities?: boolean;
        }
    ) {
        const t = await Tournament.findByPk(id);
        if (!t) throw new CustomError('Tournoi introuvable', 404);
        if (updates.name != null) t.name = updates.name;
        if (updates.status != null) t.status = updates.status;
        if (updates.max_number_of_rounds !== undefined) t.max_number_of_rounds = updates.max_number_of_rounds;
        if (updates.until_winner !== undefined) t.until_winner = updates.until_winner;
        if (updates.require_deck_list !== undefined) t.require_deck_list = updates.require_deck_list;
        if (updates.max_players !== undefined) t.max_players = updates.max_players;
        if (updates.location !== undefined) t.location = updates.location;
        if (updates.event_date !== undefined) t.event_date = updates.event_date != null ? new Date(updates.event_date) : null;
        if (updates.event_date_end !== undefined) t.event_date_end = updates.event_date_end != null ? new Date(updates.event_date_end) : null;
        if (updates.is_online !== undefined) t.is_online = updates.is_online;
        if (updates.allow_penalities !== undefined) t.allow_penalities = updates.allow_penalities;
        await t.save();
        return t;
    }

    static async toggleRegistrationStatus(tournamentId: string) {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }
        if (tournament.status !== 'registration_open' && tournament.status !== 'registration_closed') {
            throw new CustomError('Seul un tournoi en inscription ouverte ou fermée peut basculer ce statut', 400);
        }

        tournament.status = tournament.status === 'registration_open' ? 'registration_closed' : 'registration_open';
        await tournament.save();

        if (tournament.status === 'registration_closed') {
            await this.createDeckSnapshotsForTournament(tournamentId);
        }

        return {
            message: 'Le statut a été modifié avec succès'
        };
    }

    /**
     * Crée le snapshot du deck pour chaque joueur inscrit ayant choisi un deck (au verrouillage des inscriptions).
     */
    static async createDeckSnapshotsForTournament(tournamentId: string): Promise<void> {
        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId, deck_id: { [Op.ne]: null } },
            include: [
                { model: Deck, as: 'deck', required: true, include: [{ model: DeckCard, as: 'deck_cards' }] }
            ]
        });

        for (const tp of players) {
            const existing = await TournamentPlayerDeck.findOne({ where: { tournament_player_id: tp.id } });
            if (existing) continue;

            const deck = tp.get('deck') as Deck & { deck_cards?: DeckCard[] };
            if (!deck) continue;

            const deckCards = deck.deck_cards ?? [];
            await sequelize.transaction(async (transaction) => {
                const snapshot = await TournamentPlayerDeck.create(
                    {
                        tournament_player_id: tp.id,
                        label: deck.label,
                        archetype_id: deck.archetype_id,
                        is_playable: deck.is_playable
                    },
                    { transaction }
                );
                for (const dc of deckCards) {
                    await TournamentPlayerDeckCard.create(
                        {
                            tournament_player_deck_id: snapshot.id,
                            card_id: dc.card_id,
                            quantity: dc.quantity
                        },
                        { transaction }
                    );
                }
            });
        }
    }

    /**
     * Crée ou met à jour le snapshot de deck pour un joueur donné (en fonction de son deck_id actuel).
     */
    private static async ensureSnapshotForTournamentPlayer(tp: TournamentPlayer, snapshotByUserId: string | null = null): Promise<void> {
        if (!tp.deck_id) {
            return;
        }

        const deck = await Deck.findByPk(tp.deck_id, {
            include: [{ model: DeckCard, as: 'deck_cards' }]
        });
        if (!deck) {
            return;
        }

        await sequelize.transaction(async (transaction) => {
            const existing = await TournamentPlayerDeck.findOne({
                where: { tournament_player_id: tp.id },
                transaction
            });

            if (existing) {
                await existing.destroy({ transaction });
            }

            const snapshot = await TournamentPlayerDeck.create(
                {
                    tournament_player_id: tp.id,
                    label: deck.label,
                    archetype_id: deck.archetype_id,
                    is_playable: deck.is_playable,
                    snapshot_by_user_id: snapshotByUserId
                },
                { transaction }
            );

            const deckCards = (deck as Deck & { deck_cards?: DeckCard[] }).deck_cards ?? [];
            for (const dc of deckCards) {
                await TournamentPlayerDeckCard.create(
                    {
                        tournament_player_deck_id: snapshot.id,
                        card_id: dc.card_id,
                        quantity: dc.quantity
                    },
                    { transaction }
                );
            }
        });
    }

    /** Supprime un tournoi (les joueurs, rondes et matchs sont supprimés en cascade). */
    static async delete(id: string): Promise<void> {
        const t = await Tournament.findByPk(id);
        if (!t) throw new CustomError('Tournoi introuvable', 404);
        await t.destroy();
    }

    static async registerToATournament(data: RegisterPlayerData) {
        const tournament = await Tournament.findByPk(data.tournamentId);

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        if (tournament.status !== 'registration_open') {
            throw new CustomError('Les inscriptions ne sont pas ouvertes pour ce tournoi', 400);
        }

        if (!isWithinRegistrationWindow(tournament.event_date)) {
            throw new CustomError('Les inscriptions sont closes 48 h avant le début du tournoi', 400);
        }
        if (tournament.max_players != null) {
            const count = await TournamentPlayer.count({ where: { tournament_id: data.tournamentId } });
            if (count >= tournament.max_players) {
                throw new CustomError('Le tournoi est complet', 400);
            }
        }

        const existing = await TournamentPlayer.findOne({ where: { tournament_id: data.tournamentId, user_id: data.userId } });
        if (existing) {
            throw new CustomError('Vous êtes déjà inscrit à ce tournoi', 400);
        }

        await ensureNoOverlappingRegistration(data.userId, data.tournamentId, tournament);

        return TournamentPlayer.create({ tournament_id: data.tournamentId, user_id: data.userId, deck_id: null });
    }

    /**
     * Admin ajoute un utilisateur à un tournoi. L'utilisateur ne doit pas déjà y être inscrit.
     */
    static async addPlayerToTournament(tournamentId: string, userId: string, deckId?: string | null) {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw new CustomError('Utilisateur introuvable', 404);
        }

        const existing = await TournamentPlayer.findOne({
            where: { tournament_id: tournamentId, user_id: userId }
        });
        if (existing) {
            throw new CustomError('Cet utilisateur est déjà inscrit à ce tournoi', 400);
        }

        if (tournament.max_players != null) {
            const count = await TournamentPlayer.count({ where: { tournament_id: tournamentId } });
            if (count >= tournament.max_players) {
                throw new CustomError('Le tournoi est complet', 400);
            }
        }

        await ensureNoOverlappingRegistration(userId, tournamentId, tournament);

        const tournamentPlayer = await TournamentPlayer.create({ tournament_id: tournamentId, user_id: userId, deck_id: deckId ?? null });

        if (deckId != null) {
            await this.ensureSnapshotForTournamentPlayer(tournamentPlayer);
        }

        if (user.email) {
            await sendPlayerAddedToTournamentMail({
                email: user.email,
                username: user.username ?? 'Joueur',
                tournamentName: tournament.name
            });
        }

        return tournamentPlayer;
    }

    static async unregisterToATournament(data: RegisterPlayerData) {
        const tournament = await Tournament.findByPk(data.tournamentId);

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        if (tournament.status !== 'registration_open') {
            throw new CustomError('La désinscription n\'est plus possible pentru ce tournoi', 400);
        }

        if (!isWithinRegistrationWindow(tournament.event_date)) {
            throw new CustomError('La désinscription n\'est plus possible 48 h avant le début du tournoi', 400);
        }

        const tp = await TournamentPlayer.findOne({ where: { tournament_id: data.tournamentId, user_id: data.userId } });

        if (!tp) {
            throw new CustomError('Vous n\'êtes pas inscrit à ce tournoi', 400);
        }

        await tp.destroy();
    }

    /**
     * Définit le deck du joueur connecté pour un tournoi (inscription déjà faite).
     * Autorisé tant que les inscriptions sont ouvertes ou fermées (avant le début du tournoi).
     */
    static async setMyDeckForTournament(tournamentId: string, userId: string, deckId: string): Promise<TournamentPlayer> {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }
        if (tournament.status !== 'registration_open' && tournament.status !== 'registration_closed') {
            throw new CustomError('Il n\'est plus possible de modifier votre deck pour ce tournoi', 400);
        }

        const transaction = await sequelize.transaction();
        try {
            const tp = await TournamentPlayer.findOne({ where: { tournament_id: tournamentId, user_id: userId }, transaction });
            if (!tp) {
                throw new CustomError('Vous n\'êtes pas inscrit à ce tournoi', 404);
            }

            const deck = await Deck.findByPk(deckId, { transaction });
            if (!deck || deck.user_id !== userId) {
                throw new CustomError('Deck introuvable ou ne vous appartient pas', 400);
            }

            const oldDeckId = tp.deck_id as string | null;

            await tp.update({ deck_id: deckId }, { transaction });

            const newDeckArchetypeId = deck.archetype_id;
            let oldDeckArchetypeId: number | null = null;

            if (oldDeckId) {
                const oldDeck = await Deck.findByPk(oldDeckId, { transaction });
                if (oldDeck) {
                    oldDeckArchetypeId = oldDeck.archetype_id;
                }
            }

            if (newDeckArchetypeId != null) {
                await Archetype.increment(
                    { popularity_poll: 3 },
                    {
                        where: { id: newDeckArchetypeId },
                        transaction
                    }
                );
            }

            if (oldDeckArchetypeId != null) {
                await Archetype.increment(
                    { popularity_poll: -3 },
                    {
                        where: { id: oldDeckArchetypeId },
                        transaction
                    }
                );
            }

            await transaction.commit();

            // ensureSnapshotForTournamentPlayer crée sa propre transaction, on l'appelle après commit
            await this.ensureSnapshotForTournamentPlayer(tp, userId);
            return tp;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Admin assigne un deck jouable à un joueur déjà inscrit.
     * Si le statut du tournoi n'est pas "registration_open", le joueur reçoit la pénalité booléenne "late_deck_penalty"
     * et éventuellement une pénalité KDE/Konami si allow_penalities est activé.
     */
    static async adminSetDeckForTournamentPlayer(
        tournamentId: string,
        tournamentPlayerId: number,
        deckId: string,
        adminUserId: string
    ): Promise<TournamentPlayer> {
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }
        const allowedStatuses: TournamentStatus[] = ['registration_open', 'registration_closed', 'tournament_beginning'];
        const canModifyInProgress =
            tournament.status === 'tournament_in_progress' && tournament.current_round <= 1;
        if (!allowedStatuses.includes(tournament.status) && !canModifyInProgress) {
            throw new CustomError('Il n\'est plus possible de modifier le deck de ce joueur pour ce tournoi', 400);
        }

        const transaction = await sequelize.transaction();
        try {
            const tp = await TournamentPlayer.findOne({
                where: { id: tournamentPlayerId, tournament_id: tournamentId },
                transaction
            });
            if (!tp) {
                throw new CustomError('Ce joueur n\'est pas inscrit à ce tournoi', 404);
            }

            const deck = await Deck.findByPk(deckId, { transaction });
            if (!deck) {
                throw new CustomError('Deck introuvable', 404);
            }
            if (deck.user_id !== tp.user_id) {
                throw new CustomError('Ce deck n\'appartient pas à ce joueur', 400);
            }
            if (!deck.is_playable) {
                throw new CustomError('Ce deck n\'est pas jouable (40 à 60 cartes requises)', 400);
            }

            const oldDeckId = tp.deck_id as string | null;

            const late_deck_penalty = tournament.status !== 'registration_open';
            await tp.update({ deck_id: deckId, late_deck_penalty }, { transaction });

            // Popularité des archetypes : +3 pour le nouveau, -3 pour l'ancien
            const newDeckArchetypeId = deck.archetype_id;
            let oldDeckArchetypeId: number | null = null;

            if (oldDeckId) {
                const oldDeck = await Deck.findByPk(oldDeckId, { transaction });
                if (oldDeck) {
                    oldDeckArchetypeId = oldDeck.archetype_id;
                }
            }

            if (newDeckArchetypeId != null) {
                await Archetype.increment(
                    { popularity_poll: 3 },
                    {
                        where: { id: newDeckArchetypeId },
                        transaction
                    }
                );
            }

            if (oldDeckArchetypeId != null) {
                await Archetype.increment(
                    { popularity_poll: -3 },
                    {
                        where: { id: oldDeckArchetypeId },
                        transaction
                    }
                );
            }

            const allowPenalties = (tournament as any).allow_penalities === true;
            const shouldApplyChecklistPenalty = allowPenalties && tournament.status !== 'registration_open';

            if (shouldApplyChecklistPenalty) {
                const warningType = await PenaltyType.findOne({ where: { code: 'warning' }, transaction });
                if (warningType) {
                    await TournamentPlayerPenalty.create({
                        tournament_player_id: tp.id,
                        penalty_type_id: warningType.id,
                        round_id: null,
                        tournament_match_id: null,
                        applied_by_user_id: adminUserId,
                        reason: 'Ajout tardif du deck pour le tournoi',
                        notes: null,
                        disqualification_with_prize: null,
                        written_statement_sent_at: null
                    }, { transaction });
                }
            }

            await transaction.commit();

            // ensureSnapshotForTournamentPlayer crée sa propre transaction, on l'appelle après commit
            await this.ensureSnapshotForTournamentPlayer(tp, adminUserId);
            return tp;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Admin removes a player from a tournament (sets dropped = true) and sends an email with the reason.
     */
    static async removePlayerFromTournament(tournamentId: string, playerId: number, reason: string) {

        console.log('tournamentId', tournamentId);
        console.log('playerId', playerId);
        const tournament = await Tournament.findByPk(tournamentId);
        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        const tournamentPlayer = await TournamentPlayer.findOne({
            where: { tournament_id: tournamentId, id: playerId },
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
        });

        if (!tournamentPlayer) {
            throw new CustomError('Ce joueur n\'est pas inscrit à ce tournoi', 404);
        }

        tournamentPlayer.destroy();

        const user = (tournamentPlayer as any).user;
        if (user?.email) {
            await sendPlayerRemovedFromTournamentMail({
                email: user.email,
                username: user.username ?? 'Joueur',
                tournamentName: tournament.name,
                reason: reason?.trim() || 'Non précisé.'
            });
        }

        return {
            message: `${user?.username ?? 'Joueur'} a été retiré du tournoi et un email lui a été envoyé.`,
        };
    }

    /**
     * Allow a player to drop from a tournament ("drop").
     * - Before the start (registration open) : equivalent to unregistration.
     * - During the tournament : forbidden if the player has still an active match in the current round.
     * 
     * @param data - The data to drop from the tournament.
     * @returns A promise that resolves to void.
     */

    static async dropATournament(data: RegisterPlayerData) {
        const tournament = await Tournament.findByPk(data.tournamentId);

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        const droppableStatuses: TournamentStatus[] = ['tournament_in_progress'];
        if (!droppableStatuses.includes(tournament.status)) {
            throw new CustomError('Vous ne pouvez pas abandonner ce tournoi à ce stade', 400);
        }

        const tournamentPlayer = await TournamentPlayer.findOne({
            where: { tournament_id: data.tournamentId, user_id: data.userId }
        });

        if (!tournamentPlayer) {
            throw new CustomError('Vous ne participez pas à ce tournoi', 400);
        }

        if (tournament.current_round >= 1) {
            const currentRound = await TournamentRound.findOne({
                where: { tournament_id: data.tournamentId, round_number: tournament.current_round }
            });

            if (currentRound) {
                const activeMatch = await TournamentMatch.findOne({
                    where: {
                        round_id: currentRound.id,
                        [Op.or]: [
                            { player1_tournament_player_id: tournamentPlayer.id },
                            { player2_tournament_player_id: tournamentPlayer.id }
                        ],
                        status: { [Op.ne]: 'completed' }
                    }
                });

                if (activeMatch) {
                    throw new CustomError(
                        'Vous ne pouvez pas abandonner tant que votre match de la ronde en cours n\'est pas terminé',
                        400
                    );
                }
            }
        }

        tournamentPlayer.dropped = true;
        await tournamentPlayer.save();
    }

    static async startTournament(tournamentId: string) {
        const tournament = await Tournament.findByPk(tournamentId);

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        if (['tournament_beginning', 'tournament_in_progress', 'tournament_finished', 'tournament_cancelled'].includes(tournament.status)) {
            throw new CustomError('Ce tournoi est déjà démarré ou terminé', 400);
        }

        tournament.status = 'tournament_beginning';
        await tournament.save();

        await this.createDeckSnapshotsForTournament(tournamentId);

        return tournament;
    }

    /**
     * Start the next round : close the current round if needed, create the new round
     * with Swiss pairings and BYE matches. If it was the last round, finish the tournament.
     * 
     * @param tournament - The tournament to start the next round for.
     * @returns A promise that resolves to the next round.
     */
    static async startNextRound(tournament: Tournament) {

        const tournamentId = tournament.id;

        const nextRoundNum = tournament.current_round + 1;

        if (tournament.until_winner && tournament.current_round >= 1) {
            const singleLeader = await this.hasSingleLeader(tournamentId);
            if (singleLeader) {
                return this.finishTournament(tournamentId, tournament.current_round);
            }
        }

        if (nextRoundNum > tournament.max_number_of_rounds) {
            return this.finishTournament(tournamentId, tournament.current_round);
        }

        await this.ensureCurrentRoundFullyPlayed(tournamentId, tournament.current_round);

        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId, dropped: false },
            attributes: ['id', 'match_wins']
        });
        if (players.length < 2) {
            throw new CustomError('Il faut au moins 2 joueurs pour démarrer une ronde', 400);
        }

        const playedPairs = await getPlayedPairs(tournamentId);
        const pairs = swissPair(players.map((p) => ({ id: p.id, match_wins: p.match_wins })), playedPairs);

        const playersWhoHadBye = await getPlayersWhoHadBye(tournamentId, nextRoundNum);
        const maxRounds = tournament.max_number_of_rounds;
        const playerCount = players.length;

        const nextRoundId = await sequelize.transaction(async (transaction) => {
            if (tournament.current_round >= 1) {
                await markRoundAsCompleted(tournamentId, tournament.current_round, transaction);
            }

            if (tournament.status === 'tournament_beginning') {
                tournament.status = 'tournament_in_progress';
                await tournament.save({ transaction });
            }

            const nextRound = await TournamentRound.create(
                {
                    tournament_id: tournamentId,
                    round_number: nextRoundNum,
                    status: 'in_progress' as RoundStatus
                },
                { transaction }
            );

            for (const [p1Id, p2Id] of pairs) {
                await TournamentMatch.create(
                    {
                        round_id: nextRound.id,
                        tournament_id: tournamentId,
                        player1_tournament_player_id: p1Id,
                        player2_tournament_player_id: p2Id,
                        status: 'pending'
                    },
                    { transaction }
                );
            }

            const pairedIds = new Set(pairs.flatMap(([a, b]) => [a, b]));
            const unpaired = players.filter((p) => !pairedIds.has(p.id));

            if (unpaired.length > 0) {
                const preferNoByeYet = unpaired.filter((p) => !playersWhoHadBye.has(p.id));
                const canReceiveBye = preferNoByeYet.length > 0
                    ? preferNoByeYet
                    : (maxRounds > playerCount ? unpaired : []);

                if (canReceiveBye.length === 0) {
                    throw new CustomError(
                        'Impossible d\'attribuer le BYE : tous les joueurs non appariés en ont déjà eu un, et le nombre de rondes ne permet pas d\'en attribuer un second.',
                        400
                    );
                }

                const byePlayer = await TournamentPlayer.findByPk(canReceiveBye[0].id, { transaction });
                if (byePlayer) {
                    await TournamentMatch.create(
                        {
                            round_id: nextRound.id,
                            tournament_id: tournamentId,
                            player1_tournament_player_id: byePlayer.id,
                            player2_tournament_player_id: null,
                            player1_games_won: 0,
                            player2_games_won: 0,
                            winner_tournament_player_id: byePlayer.id,
                            status: 'completed'
                        },
                        { transaction }
                    );
                    byePlayer.match_wins += 1;
                    await byePlayer.save({ transaction });
                }
            }

            tournament.current_round = nextRoundNum;
            await tournament.save({ transaction });

            return nextRound.id;
        });

        return this.getRoundWithMatches(nextRoundId);
    }

    /**
     * Rollback the last round of a tournament : remove its matches, delete the round
     * and revert players' stats (wins/losses/draws/games) impacted by that round.
     * 
     * @param tournamentId - The ID of the tournament.
     */
    static async rollbackLastRound(tournamentId: string) {
        const tournament = await Tournament.findByPk(tournamentId);

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        if (tournament.status === 'tournament_finished') {
            throw new CustomError('Impossible d\'annuler une ronde d\'un tournoi terminé', 400);
        }

        const currentRoundNumber = tournament.current_round;
        if (currentRoundNumber < 1) {
            throw new CustomError('Aucune ronde à annuler pour ce tournoi', 400);
        }

        return sequelize.transaction(async (transaction) => {
            const round = await TournamentRound.findOne({
                where: { tournament_id: tournamentId, round_number: currentRoundNumber },
                transaction
            });

            if (!round) {
                throw new CustomError('Ronde actuelle introuvable pour ce tournoi', 404);
            }

            const matches = await TournamentMatch.findAll({
                where: { round_id: round.id },
                transaction
            });

            // Précharger les joueurs concernés en une seule requête
            const playerIds = Array.from(
                new Set(
                    matches
                        .flatMap((m) => [m.player1_tournament_player_id, m.player2_tournament_player_id])
                        .filter((id): id is number => id != null)
                )
            );

            const players = await TournamentPlayer.findAll({
                where: { id: playerIds },
                transaction
            });
            const playersById = new Map(players.map((p) => [p.id, p]));

            // Revenir en arrière sur les stats des joueurs pour cette ronde
            for (const match of matches) {
                if (match.status !== 'completed') {
                    continue;
                }

                const p1 =
                    match.player1_tournament_player_id != null
                        ? playersById.get(match.player1_tournament_player_id)
                        : undefined;
                const p2 =
                    match.player2_tournament_player_id != null
                        ? playersById.get(match.player2_tournament_player_id)
                        : undefined;

                // BYE : uniquement p1 existe, p2 est null
                if (match.player2_tournament_player_id == null) {
                    if (p1 && p1.match_wins > 0) {
                        p1.match_wins -= 1;
                    }
                    continue;
                }

                if (!p1 || !p2) {
                    continue;
                }

                const p1Games = match.player1_games_won ?? 0;
                const p2Games = match.player2_games_won ?? 0;
                const totalGames = p1Games + p2Games;
                const winnerId = match.winner_tournament_player_id;

                if (winnerId === p1.id) {
                    if (p1.match_wins > 0) p1.match_wins -= 1;
                    if (p2.match_losses > 0) p2.match_losses -= 1;
                } else if (winnerId === p2.id) {
                    if (p2.match_wins > 0) p2.match_wins -= 1;
                    if (p1.match_losses > 0) p1.match_losses -= 1;
                } else {
                    if (p1.match_draws > 0) p1.match_draws -= 1;
                    if (p2.match_draws > 0) p2.match_draws -= 1;
                }

                p1.games_won = Math.max(0, p1.games_won - p1Games);
                p1.games_played = Math.max(0, p1.games_played - totalGames);

                p2.games_won = Math.max(0, p2.games_won - p2Games);
                p2.games_played = Math.max(0, p2.games_played - totalGames);
            }

            // Sauvegarde des joueurs modifiés
            for (const player of playersById.values()) {
                await player.save({ transaction });
            }

            // Supprimer les matchs de la ronde
            await TournamentMatch.destroy({
                where: { round_id: round.id },
                transaction
            });

            // Supprimer la ronde elle-même (sinon conflit sur round_number lors de la recréation)
            await round.destroy({ transaction });

            // Mettre à jour le tournoi (current_round et éventuellement status)
            const newCurrentRound = currentRoundNumber - 1;
            tournament.current_round = newCurrentRound;
            if (newCurrentRound === 0 && tournament.status === 'tournament_in_progress') {
                // Plus aucune ronde en cours : on revient à "tournament_beginning"
                tournament.status = 'tournament_beginning';
            } else if (newCurrentRound >= 1) {
                // On remet la ronde précédente en "in_progress"
                const previousRound = await TournamentRound.findOne({
                    where: { tournament_id: tournamentId, round_number: newCurrentRound },
                    transaction
                });
                if (previousRound) {
                    previousRound.status = 'in_progress';
                    await previousRound.save({ transaction });
                }
            }
            await tournament.save({ transaction });

            return {
                message: 'Dernière ronde annulée avec succès',
                current_round: tournament.current_round,
                status: tournament.status
            };
        });
    }

    /** Recalcule les stats d'un joueur (match_wins, match_losses, match_draws, games_won, games_played) à partir de tous ses matchs complétés dans le tournoi. */
    private static async recomputePlayerStatsFromMatches(
        tournamentId: string,
        tournamentPlayerId: number,
        transaction?: Transaction
    ): Promise<{ match_wins: number; match_losses: number; match_draws: number; games_won: number; games_played: number }> {
        const matches = await TournamentMatch.findAll({
            where: {
                tournament_id: tournamentId,
                status: 'completed',
                [Op.or]: [
                    { player1_tournament_player_id: tournamentPlayerId },
                    { player2_tournament_player_id: tournamentPlayerId }
                ]
            },
            transaction
        });
        let match_wins = 0;
        let match_losses = 0;
        let match_draws = 0;
        let games_won = 0;
        let games_played = 0;
        for (const m of matches) {
            const p1Games = m.player1_games_won ?? 0;
            const p2Games = m.player2_games_won ?? 0;
            const totalGames = p1Games + p2Games;
            const winnerId = m.winner_tournament_player_id;
            const isP1 = m.player1_tournament_player_id === tournamentPlayerId;

            if (m.player2_tournament_player_id == null) {
                if (isP1) {
                    match_wins += 1;
                    games_won += p1Games;
                    games_played += p1Games;
                }
                continue;
            }
            if (winnerId === tournamentPlayerId) {
                match_wins += 1;
            } else if (winnerId != null) {
                match_losses += 1;
            } else {
                match_draws += 1;
            }
            if (isP1) {
                games_won += p1Games;
                games_played += totalGames;
            } else {
                games_won += p2Games;
                games_played += totalGames;
            }
        }
        return { match_wins, match_losses, match_draws, games_won, games_played };
    }

    /** True if there is exactly one leader (strictly better than second on match_wins, match_draws, games_won). */
    private static async hasSingleLeader(tournamentId: string): Promise<boolean> {
        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId, dropped: false },
            attributes: ['id', 'match_wins', 'match_draws', 'games_won']
        });
        const sorted = [...players].sort((a, b) => {
            if (a.match_wins !== b.match_wins) return b.match_wins - a.match_wins;
            if (a.match_draws !== b.match_draws) return b.match_draws - a.match_draws;
            return b.games_won - a.games_won;
        });
        if (sorted.length === 0) return false;
        if (sorted.length === 1) return true;
        const first = sorted[0];
        const second = sorted[1];
        return (
            first.match_wins > second.match_wins ||
            (first.match_wins === second.match_wins && first.match_draws > second.match_draws) ||
            (first.match_wins === second.match_wins && first.match_draws === second.match_draws && first.games_won > second.games_won)
        );
    }

    /** Finish the last round and mark the tournament as finished.
     * 
     * @param tournamentId - The ID of the tournament to finish.
     * @param currentRoundNumber - The number of the current round to finish.
     * @returns A promise that resolves to the message 'Le tournoi est terminé'.
     */
    private static async finishTournament(tournamentId: string, currentRoundNumber: number) {
        return sequelize.transaction(async (transaction) => {
            await markRoundAsCompleted(tournamentId, currentRoundNumber, transaction);
            await Tournament.update(
                { status: 'tournament_finished' },
                { where: { id: tournamentId }, transaction }
            );
            return { message: 'Le tournoi est terminé' };
        });
    }

    /** Check that all matches of the current round are completed ; otherwise throw an error 400. 
     * 
     * @param tournamentId - The ID of the tournament to check.
     * @param currentRoundNumber - The number of the current round to check.
     * @returns A promise that resolves to void.
    */
    private static async ensureCurrentRoundFullyPlayed(tournamentId: string, currentRoundNumber: number): Promise<void> {
        if (currentRoundNumber < 1) return;
        const currentRound = await TournamentRound.findOne({
            where: { tournament_id: tournamentId, round_number: currentRoundNumber }
        });
        if (!currentRound) return;
        const pendingCount = await TournamentMatch.count({
            where: { round_id: currentRound.id, status: { [Op.ne]: 'completed' } }
        });
        if (pendingCount > 0) {
            throw new CustomError(
                'Tous les scores de la ronde en cours doivent être renseignés avant de démarrer la ronde suivante',
                400
            );
        }
    }
    static async getRoundWithMatches(roundId: number) {
        const round = await TournamentRound.findByPk(roundId, {
            include: [
                { model: Tournament, as: 'tournament' },
                {
                    model: TournamentMatch,
                    as: 'matches',
                    include: [
                        { model: TournamentPlayer, as: 'player1', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
                        { model: TournamentPlayer, as: 'player2', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
                        { model: TournamentPlayer, as: 'winner', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] }
                    ]
                }
            ]
        });
        if (!round) throw new CustomError('Ronde introuvable', 404);
        return round;
    }

    static async recordMatchResult(data: RecordMatchResultData) {
        const match = await TournamentMatch.findByPk(data.matchId, { include: [{ model: Tournament, as: 'tournament' }] });
        if (!match) throw new CustomError('Match introuvable', 404);
        if (match.player2_tournament_player_id == null) {
            throw new CustomError('Ce match est un bye, aucun résultat à enregistrer', 400);
        }
        const tour = match.get('tournament') as Tournament;
        const maxGames = tour.matches_per_round;
        if (
            data.player1GamesWon < 0 ||
            data.player1GamesWon > maxGames ||
            data.player2GamesWon < 0 ||
            data.player2GamesWon > maxGames
        ) {
            throw new CustomError(`Chaque score doit être entre 0 et ${maxGames} (matches_per_round)`, 400);
        }
        const winnerId =
            data.player1GamesWon > data.player2GamesWon
                ? match.player1_tournament_player_id
                : data.player2GamesWon > data.player1GamesWon
                    ? match.player2_tournament_player_id
                    : null;

        const transaction = await sequelize.transaction();
        try {
            match.player1_games_won = data.player1GamesWon;
            match.player2_games_won = data.player2GamesWon;
            match.winner_tournament_player_id = winnerId;
            match.status = 'completed';
            await match.save({ transaction });
            const p1 = await TournamentPlayer.findByPk(match.player1_tournament_player_id, { transaction });
            const p2 = await TournamentPlayer.findByPk(match.player2_tournament_player_id, { transaction });
            if (!p1 || !p2) throw new CustomError('Joueurs du match introuvables', 500);

            const tournamentId = tour.id;
            const [stats1, stats2] = await Promise.all([
                this.recomputePlayerStatsFromMatches(tournamentId, p1.id, transaction),
                this.recomputePlayerStatsFromMatches(tournamentId, p2.id, transaction)
            ]);
            p1.match_wins = stats1.match_wins;
            p1.match_losses = stats1.match_losses;
            p1.match_draws = stats1.match_draws;
            p1.games_won = stats1.games_won;
            p1.games_played = stats1.games_played;
            p2.match_wins = stats2.match_wins;
            p2.match_losses = stats2.match_losses;
            p2.match_draws = stats2.match_draws;
            p2.games_won = stats2.games_won;
            p2.games_played = stats2.games_played;
            await p1.save({ transaction });
            await p2.save({ transaction });
            await transaction.commit();
            return TournamentMatch.findByPk(match.id, {
                include: [
                    { model: TournamentPlayer, as: 'player1', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
                    { model: TournamentPlayer, as: 'player2', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
                    { model: TournamentPlayer, as: 'winner', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] }
                ]
            });
        } catch (err) {
            try {
                await transaction.rollback();
            } catch { }
            throw err;
        }
    }

    static async completeRound(roundId: number) {

        const round = await TournamentRound.findByPk(roundId);

        if (!round) {
            throw new CustomError('Ronde introuvable', 404);
        }

        const pending = await TournamentMatch.count({ where: { round_id: roundId, status: 'pending' } });
        if (pending > 0) {
            throw new CustomError('Tous les matchs de la ronde doivent être terminés avant de clôturer', 400);
        }

        round.status = 'completed';
        await round.save();

        const tournament = await Tournament.findByPk(round.tournament_id);
        if (tournament) {
            const remainingMatches = await TournamentMatch.count({
                where: { tournament_id: tournament.id, status: { [Op.ne]: 'completed' } }
            });
            if (remainingMatches === 0) {
                tournament.status = 'tournament_finished';
                await tournament.save();
            }
        }

        return round;
    }

    static async getStandings(tournamentId: string) {
        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'username'] },
                {
                    model: TournamentPlayerDeck,
                    as: 'deck_snapshot',
                    include: [
                        {
                            model: TournamentPlayerDeckCard,
                            as: 'cards',
                            include: [
                                {
                                    model: Card,
                                    as: 'card'
                                }
                            ]
                        },
                        {
                            model: Archetype,
                            as: 'archetype'
                        }
                    ]
                }
            ],
            order: [['match_wins', 'DESC'], ['match_draws', 'DESC'], ['games_won', 'DESC']]
        });
        return players.map((player, index) => {
            const snapshot = (player as any).deck_snapshot ?? null;
            return {
                rank: index + 1,
                tournament_player_id: player.id,
                user_id: player.user_id,
                username: (player as any).user?.username ?? null,
                deck: snapshot,
                late_deck_penalty: player.late_deck_penalty ?? false,
                matches_breakdown: {
                    wins: {
                        count: player.match_wins,
                        total_points: player.match_wins * 3
                    },
                    losses: {
                        count: player.match_losses,
                        total_points: player.match_losses * 0
                    },
                    draws: {
                        count: player.match_draws,
                        total_points: player.match_draws * 1
                    },
                    games_won: player.games_won,
                    games_played: player.games_played,
                    hasDropped: player.dropped
                }
            };
        });
    }

    /**
     * Récupère le snapshot de deck (et ses cartes) pour un TournamentPlayer donné.
     */
    static async getDeckSnapshotForTournamentPlayer(tournamentPlayerId: number) {
        const snapshot = await TournamentPlayerDeck.findOne({
            where: { tournament_player_id: tournamentPlayerId },
            include: [
                {
                    model: TournamentPlayerDeckCard,
                    as: 'cards',
                    include: [
                        {
                            model: Card,
                            as: 'card'
                        }
                    ]
                },
                {
                    model: Archetype,
                    as: 'archetype'
                }
            ]
        });

        if (!snapshot) {
            throw new CustomError('Snapshot de deck introuvable pour ce joueur de tournoi', 404);
        }

        return snapshot;
    }
}

export default TournamentService;