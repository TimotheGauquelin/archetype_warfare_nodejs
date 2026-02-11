import { Request, Response, NextFunction } from 'express';
import TournamentService from '../services/TournamentService';
import { getIntParam } from '../utils/request';
import Tournament from '../models/TournamentModel';
import { CustomError } from '../errors/CustomError';

class TournamentController {
    async create(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { name, number_of_rounds, matches_per_round, max_players, location, event_date, event_date_end, is_online } = request.body;
            if (!name || number_of_rounds == null || matches_per_round == null) {
                response.status(400).json({ message: 'name, number_of_rounds et matches_per_round sont requis' });
                return;
            }
            if (matches_per_round !== 1 && matches_per_round !== 3 && matches_per_round !== 5) {
                response.status(400).json({ message: 'matches_per_round doit être 1, 3 ou 5' });
                return;
            }
            const tournament = await TournamentService.create({
                name,
                number_of_rounds: Number(number_of_rounds),
                matches_per_round: matches_per_round as 1 | 3 | 5,
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
            const tournament = await TournamentService.getById(id);
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
            const { name, status, max_players, location, event_date, event_date_end, is_online } = request.body;
            const tournament = await TournamentService.update(id, { name, status, max_players, location, event_date, event_date_end, is_online });
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
            const tp = await TournamentService.registerToATournament({ tournamentId, userId });
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

            const canStartRound = ['registration_open', 'tournament_beginning', 'tournament_in_progress'].includes(tournament.status);

            if (!canStartRound) {
                throw new CustomError('Ce tournoi ne peut pas démarrer une ronde', 400);
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
}

export default new TournamentController();