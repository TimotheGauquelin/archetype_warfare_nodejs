import sequelize from '../config/Sequelize';
import { Op } from 'sequelize';
import type { Transaction } from 'sequelize';
import { Tournament, TournamentPlayer, TournamentRound, TournamentMatch, User } from '../models/relations';
import { CustomError } from '../errors/CustomError';

import type { RoundStatus } from '../models/TournamentRoundModel';
import { TournamentStatus } from '../models/TournamentModel';

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

interface CreateTournamentData {
    name: string;
    number_of_rounds: number;
    matches_per_round: 1 | 3 | 5;
    max_players?: number | null;
    location?: string | null;
    event_date?: Date | string | null;
    event_date_end?: Date | string | null;
    is_online?: boolean;
}

interface RegisterPlayerData {
    tournamentId: number;
    userId: number;
}

interface RecordMatchResultData {
    matchId: number;
    player1GamesWon: number;
    player2GamesWon: number;
}

/** Get the played pairs for a tournament.
 * 
 * @param tournamentId - The ID of the tournament to get the played pairs for.
 * @returns A promise that resolves to a set of strings representing the played pairs.
 */
async function getPlayedPairs(tournamentId: number): Promise<Set<string>> {
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
        if (!found) used.add(sorted[i].id);
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
    tournamentId: number,
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
            number_of_rounds: data.number_of_rounds,
            matches_per_round: data.matches_per_round,
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

    /** Get the tournaments for a user.
     * 
     * @param userId - The ID of the user to get the tournaments for.
     * @returns A promise that resolves to an array of tournaments.
     */
    static async getTournamentsForUser(userId: number) {
        return Tournament.findAll({
            include: [
                {
                    model: TournamentPlayer,
                    as: 'players',
                    required: true,
                    where: { user_id: userId },
                    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
                }
            ],
            order: [['event_date', 'DESC']]
        });
    }

    /** Get the details of a tournament for a user participating : tournament info + only his matches by round. */
    static async getTournamentDetailsForUser(tournamentId: number, userId: number) {
        const tournamentPlayer = await TournamentPlayer.findOne({
            where: { tournament_id: tournamentId, user_id: userId }
        });
        if (!tournamentPlayer) {
            throw new CustomError('Vous ne participez pas à ce tournoi', 403);
        }

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
            id: number;
            name: string;
            status: string;
            number_of_rounds: number;
            matches_per_round: number;
            current_round: number;
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
                    player1?: { user?: { id: number; username: string } } | null;
                    player2?: { user?: { id: number; username: string } } | null;
                    winner?: { user?: { id: number; username: string } } | null;
                }>;
            }>;
        };

        return {
            id: plain.id,
            name: plain.name,
            status: plain.status,
            number_of_rounds: plain.number_of_rounds,
            matches_per_round: plain.matches_per_round,
            current_round: plain.current_round,
            event_date: plain.event_date,
            ...(plain.event_date_end != null && { event_date_end: plain.event_date_end }),
            ...(plain.location != null && { location: plain.location }),
            ...(plain.max_players != null && { max_players: plain.max_players }),
            ...(plain.is_online != null && { is_online: plain.is_online }),
            tournament_player: {
                id: tournamentPlayer.id,
                user_id: tournamentPlayer.user_id,
                match_wins: tournamentPlayer.match_wins,
                match_losses: tournamentPlayer.match_losses,
                match_draws: tournamentPlayer.match_draws,
                games_won: tournamentPlayer.games_won,
                games_played: tournamentPlayer.games_played,
                dropped: tournamentPlayer.dropped
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
                            id: number | null;
                            username: string | null;
                            isWinner: boolean;
                            gamesWon: number;
                        } | null;
                        player2:
                        | {
                            id: number;
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

    static async getById(id: number) {
        const t = await Tournament.findByPk(id, {
            include: [
                { model: TournamentPlayer, as: 'players', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }] },
                { model: TournamentRound, as: 'rounds', order: [['round_number', 'ASC']], include: [{ model: TournamentMatch, as: 'matches' }] }
            ]
        });
        if (!t) throw new CustomError('Tournoi introuvable', 404);
        return t;
    }

    static async update(
        id: number,
        updates: {
            name?: string;
            status?: TournamentStatus;
            max_players?: number | null;
            location?: string | null;
            event_date?: Date | string | null;
            event_date_end?: Date | string | null;
            is_online?: boolean;
        }
    ) {
        const t = await Tournament.findByPk(id);
        if (!t) throw new CustomError('Tournoi introuvable', 404);
        if (updates.name != null) t.name = updates.name;
        if (updates.status != null) t.status = updates.status;
        if (updates.max_players !== undefined) t.max_players = updates.max_players;
        if (updates.location !== undefined) t.location = updates.location;
        if (updates.event_date !== undefined) t.event_date = updates.event_date != null ? new Date(updates.event_date) : null;
        if (updates.event_date_end !== undefined) t.event_date_end = updates.event_date_end != null ? new Date(updates.event_date_end) : null;
        if (updates.is_online !== undefined) t.is_online = updates.is_online;
        await t.save();
        return t;
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

        return TournamentPlayer.create({ tournament_id: data.tournamentId, user_id: data.userId });
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

    /** Met un tournoi en statut "tournament_beginning" (démarrage sans créer de ronde). */
    static async startTournament(tournamentId: number) {
        const tournament = await Tournament.findByPk(tournamentId);

        if (!tournament) {
            throw new CustomError('Tournoi introuvable', 404);
        }

        if (['tournament_beginning', 'tournament_in_progress', 'tournament_finished', 'tournament_cancelled'].includes(tournament.status)) {
            throw new CustomError('Ce tournoi est déjà démarré ou terminé', 400);
        }

        tournament.status = 'tournament_beginning';
        await tournament.save();
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

        if (nextRoundNum > tournament.number_of_rounds) {
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
            for (const p of players) {
                if (pairedIds.has(p.id)) continue;
                const byePlayer = await TournamentPlayer.findByPk(p.id, { transaction });
                if (!byePlayer) continue;
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

            tournament.current_round = nextRoundNum;
            await tournament.save({ transaction });

            return nextRound.id;
        });

        return this.getRoundWithMatches(nextRoundId);
    }

    /** Finish the last round and mark the tournament as finished.
     * 
     * @param tournamentId - The ID of the tournament to finish.
     * @param currentRoundNumber - The number of the current round to finish.
     * @returns A promise that resolves to the message 'Le tournoi est terminé'.
     */
    private static async finishTournament(tournamentId: number, currentRoundNumber: number) {
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
    private static async ensureCurrentRoundFullyPlayed(tournamentId: number, currentRoundNumber: number): Promise<void> {
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
            if (winnerId === p1.id) {
                p1.match_wins += 1;
                p2.match_losses += 1;
            } else if (winnerId === p2.id) {
                p2.match_wins += 1;
                p1.match_losses += 1;
            } else {
                p1.match_draws += 1;
                p2.match_draws += 1;
            }
            p1.games_won += data.player1GamesWon;
            p1.games_played += data.player1GamesWon + data.player2GamesWon;
            p2.games_won += data.player2GamesWon;
            p2.games_played += data.player1GamesWon + data.player2GamesWon;
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

    static async getStandings(tournamentId: number) {
        const players = await TournamentPlayer.findAll({
            where: { tournament_id: tournamentId },
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
            order: [['match_wins', 'DESC'], ['match_draws', 'DESC'], ['games_won', 'DESC']]
        });
        return players.map((player, index) => ({
            rank: index + 1,
            tournament_player_id: player.id,
            user_id: player.user_id,
            username: (player as any).user?.username ?? null,
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
        }));
    }
}

export default TournamentService;