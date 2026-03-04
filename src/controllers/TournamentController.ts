import { Request, Response, NextFunction } from 'express';
import TournamentService from '../services/TournamentService';
import { getIntParam } from '../utils/request';
import Tournament from '../models/TournamentModel';
import { CustomError } from '../errors/CustomError';

class TournamentController {
    async create(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { name, max_number_of_rounds, matches_per_round, until_winner, max_players, location, event_date, event_date_end, is_online } = request.body;
            if (!name || max_number_of_rounds == null || matches_per_round == null) {
                response.status(400).json({ message: 'name, max_number_of_rounds et matches_per_round sont requis' });
                return;
            }
            if (matches_per_round !== 1 && matches_per_round !== 3 && matches_per_round !== 5) {
                response.status(400).json({ message: 'matches_per_round doit être 1, 3 ou 5' });
                return;
            }
            const tournament = await TournamentService.create({
                name,
                max_number_of_rounds: Number(max_number_of_rounds),
                matches_per_round: matches_per_round as 1 | 3 | 5,
                until_winner: until_winner === true,
                require_deck_list: request.body.require_deck_list === true,
                max_players: max_players != null ? Number(max_players) : null,
                location: location ?? null,
                event_date: event_date ?? null,
                event_date_end: event_date_end ?? null,
                is_online: is_online !== false
            });
            response.status(201).json(tournament);
        } catch (error) {
            next(error);
        }
    }

    async getAllCurrentTournaments(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const status = request.query.status as string | undefined;
            const tournaments = await TournamentService.getAllCurrentTournaments(status as any);
            response.status(200).json(tournaments);
        } catch (error) {
            next(error);
        }
    }

    async searchAllTournaments(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const name = request.query.name as string | undefined;
            const status = request.query.status as string | undefined;
            const location = request.query.location as string | undefined;
            const is_onlineParam = request.query.is_online as string | undefined;
            let is_online: boolean | undefined;
            if (is_onlineParam === 'true') is_online = true;
            else if (is_onlineParam === 'false') is_online = false;
            const tournaments = await TournamentService.searchAllTournaments({
                name,
                status: status as import('../models/TournamentModel').TournamentStatus | undefined,
                location,
                is_online
            });
            response.status(200).json(tournaments);
        } catch (error) {
            next(error);
        }
    }

    async getUserTournaments(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user?.id;
            if (!userId) {
                response.status(401).json({ message: 'Authentification requise' });
                return;
            }
            const tournaments = await TournamentService.getTournamentsForUser(userId);
            response.status(200).json(tournaments);
        } catch (error) {
            next(error);
        }
    }

    async getById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.tournamentId);
            const includePlayersParam = request.query.includePlayers as string | undefined;
            const includePlayers = includePlayersParam === undefined || includePlayersParam === 'true';
            const tournament = await TournamentService.getById(id, { includePlayers });
            response.status(200).json(tournament);
        } catch (error) {
            next(error);
        }
    }

    async getMyTournamentDetails(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user?.id;
            if (!userId) {
                response.status(401).json({ message: 'Authentification requise' });
                return;
            }
            const tournamentId = getIntParam(request.params.tournamentId);
            const details = await TournamentService.getTournamentDetailsForUser(tournamentId, userId);
            response.status(200).json(details);
        } catch (error) {
            next(error);
        }
    }

    async update(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.tournamentId);
            const { name, status, max_number_of_rounds, until_winner, max_players, location, event_date, event_date_end, is_online } = request.body;
            const tournament = await TournamentService.update(id, {
                name,
                status,
                max_number_of_rounds,
                until_winner,
                require_deck_list: request.body.require_deck_list !== undefined ? request.body.require_deck_list === true : undefined,
                max_players,
                location,
                event_date,
                event_date_end,
                is_online
            });
            response.status(200).json(tournament);
        } catch (error) {
            next(error);
        }
    }

    async deleteTournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.tournamentId);
            await TournamentService.delete(id);
            response.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async toggleRegistrationStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const tournament = await TournamentService.toggleRegistrationStatus(tournamentId);
            response.status(200).json(tournament);
        } catch (error) {
            next(error);
        }
    }

    async registerToATournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);

            const userId = request.user?.id;

            if (!userId) {
                response.status(401).json({ message: 'Authentification requise pour s\'inscrire' });
                return;
            }
            const tp = await TournamentService.registerToATournament({
                tournamentId,
                userId
            });
            response.status(201).json({
                message: 'Inscription réussie',
                tournamentPlayer: tp
            });
        } catch (error) {
            next(error);
        }
    }

    async unregisterToATournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);

            const userId = request.user?.id;

            if (!userId) {
                response.status(401).json({ message: 'Authentification requise pour se désinscrire' });
                return;
            }

            await TournamentService.unregisterToATournament({ tournamentId, userId });

            response.status(200).json({
                message: 'Désinscription réussie',
            });
        } catch (error) {
            next(error);
        }
    }

    async setMyDeckForTournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const userId = request.user?.id;
            if (!userId) {
                response.status(401).json({ message: 'Authentification requise' });
                return;
            }
            const deckId = request.body?.deckId;
            if (deckId == null || (typeof deckId !== 'number' && typeof deckId !== 'string')) {
                response.status(400).json({ message: 'deckId est requis dans le body' });
                return;
            }
            const deckIdNum = Number(deckId);
            if (!Number.isInteger(deckIdNum) || deckIdNum < 1) {
                response.status(400).json({ message: 'deckId doit être un entier positif' });
                return;
            }
            const tp = await TournamentService.setMyDeckForTournament(tournamentId, userId, deckIdNum);
            response.status(200).json({
                message: 'Deck enregistré pour le tournoi',
                tournamentPlayer: tp
            });
        } catch (error) {
            next(error);
        }
    }

    async addPlayerToTournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const userId = getIntParam(request.params.userId);
            const deckId = request.body?.deckId != null ? Number(request.body.deckId) : undefined;
            const tournamentPlayer = await TournamentService.addPlayerToTournament(tournamentId, userId, deckId);
            response.status(201).json({
                message: 'Joueur ajouté au tournoi',
                tournamentPlayer
            });
        } catch (error) {
            next(error);
        }
    }

    async removePlayerFromTournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const playerId = getIntParam(request.params.playerId);
            const reason = typeof request.body?.reason === 'string' ? request.body.reason : '';
            const result = await TournamentService.removePlayerFromTournament(tournamentId, playerId, reason);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async dropATournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const userId = request.user?.id;

            if (!userId) {
                response.status(401).json({ message: 'Authentification requise pour abandonner un tournoi' });
                return;
            }

            await TournamentService.dropATournament({ tournamentId, userId });

            response.status(200).json({
                message: 'Abandon du tournoi enregistré',
            });
        } catch (error) {
            next(error);
        }
    }

    async startTournament(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const tournament = await TournamentService.startTournament(tournamentId);
            response.status(200).json(tournament);
        } catch (error) {
            next(error);
        }
    }

    async startNextRound(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);

            const tournament = await Tournament.findByPk(tournamentId);

            if (!tournament) {
                throw new CustomError('Tournoi introuvable', 404);
            }

            if (tournament.status === 'tournament_finished') {
                throw new CustomError('Le tournoi est terminé', 400);
            }

            const canStartRound = ['tournament_beginning', 'tournament_in_progress'].includes(tournament.status);

            if (!canStartRound) {
                throw new CustomError('Vous devez d\'abord démarrer le tournoi', 400);
            }

            const round = await TournamentService.startNextRound(tournament as Tournament);
            response.status(201).json(round);
        } catch (error) {
            next(error);
        }
    }

    async getRound(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const roundId = getIntParam(request.params.roundId);
            const round = await TournamentService.getRoundWithMatches(roundId);
            response.status(200).json(round);
        } catch (error) {
            next(error);
        }
    }

    async recordMatchResult(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const matchId = getIntParam(request.params.matchId);
            const { player1_games_won, player2_games_won } = request.body;
            const match = await TournamentService.recordMatchResult({
                matchId,
                player1GamesWon: Number(player1_games_won ?? 0),
                player2GamesWon: Number(player2_games_won ?? 0)
            });
            response.status(200).json(match);
        } catch (error) {
            next(error);
        }
    }

    async completeRound(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const roundId = getIntParam(request.params.tournamentId);

            const round = await TournamentService.completeRound(roundId);
            response.status(200).json(round);
        } catch (error) {
            next(error);
        }
    }

    async getStandings(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const standings = await TournamentService.getStandings(tournamentId);
            response.status(200).json(standings);
        } catch (error) {
            next(error);
        }
    }

    async getPlayerDeckSnapshot(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentPlayerId = getIntParam(request.params.tournamentPlayerId);
            const snapshot = await TournamentService.getDeckSnapshotForTournamentPlayer(tournamentPlayerId);
            response.status(200).json(snapshot);
        } catch (error) {
            next(error);
        }
    }

    async rollbackLastRound(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getIntParam(request.params.tournamentId);
            const result = await TournamentService.rollbackLastRound(tournamentId);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new TournamentController();