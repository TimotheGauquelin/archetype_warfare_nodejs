import { Request, Response, NextFunction } from 'express';
import QuizService from '../services/QuizService';
import QuizSeasonService from '../services/QuizSeasonService';
import { getUuidParam } from '../utils/request';
import { CustomError } from '../errors/CustomError';

const localeFromRequest = (request: Request): string | undefined => {
    if (typeof request.query.locale === 'string' && request.query.locale.trim()) {
        return request.query.locale.trim();
    }
    if (typeof request.body?.locale === 'string' && request.body.locale.trim()) {
        return request.body.locale.trim();
    }
    return undefined;
};

class QuizController {
    async getHub(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const user = (request as Request & {
                user?: { id?: string; roles?: string[] };
            }).user;
            const hub = await QuizService.getHub(user?.id, user?.roles);
            response.status(200).json(hub);
        } catch (error) {
            next(error);
        }
    }

    async getThemes(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const themes = await QuizService.getThemes();
            response.status(200).json({ themes });
        } catch (error) {
            next(error);
        }
    }

    async startFree(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const user = (request as Request & {
                user?: { id?: string; roles?: string[] };
            }).user;
            const userId = user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const themeSlug = String(request.body.themeSlug ?? '').trim();
            if (!themeSlug) throw new CustomError('themeSlug requis', 400);
            const attempt = await QuizService.startFreeAttempt(
                userId,
                themeSlug,
                request.body.questionCount,
                localeFromRequest(request),
                user?.roles
            );
            response.status(201).json(attempt);
        } catch (error) {
            next(error);
        }
    }

    async startDaily(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (request as Request & { user?: { id?: string } }).user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const seasonId =
                request.body?.seasonId ??
                request.body?.season_id ??
                request.query?.seasonId ??
                request.query?.season_id ??
                null;
            const attempt = await QuizService.startDailyAttempt(
                userId,
                localeFromRequest(request),
                seasonId
            );
            response.status(201).json(attempt);
        } catch (error) {
            next(error);
        }
    }

    async getAttempt(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (request as Request & { user?: { id?: string } }).user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const attemptId = getUuidParam(request.params.attemptId);
            const attempt = await QuizService.getAttemptForUser(
                attemptId,
                userId,
                localeFromRequest(request)
            );
            response.status(200).json(attempt);
        } catch (error) {
            next(error);
        }
    }

    async submitAnswer(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (request as Request & { user?: { id?: string } }).user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const attemptId = getUuidParam(request.params.attemptId);
            const questionId = Number(request.body.questionId);
            if (!Number.isFinite(questionId)) {
                throw new CustomError('questionId invalide', 400);
            }
            const answer =
                request.body.answer && typeof request.body.answer === 'object'
                    ? (request.body.answer as Record<string, unknown>)
                    : {};
            const attempt = await QuizService.submitAnswer(
                attemptId,
                userId,
                questionId,
                answer,
                localeFromRequest(request)
            );
            response.status(200).json(attempt);
        } catch (error) {
            next(error);
        }
    }

    async finishAttempt(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (request as Request & { user?: { id?: string } }).user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const attemptId = getUuidParam(request.params.attemptId);
            const attempt = await QuizService.finishAttempt(
                attemptId,
                userId,
                localeFromRequest(request)
            );
            response.status(200).json(attempt);
        } catch (error) {
            next(error);
        }
    }

    async getMyStats(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (request as Request & { user?: { id?: string } }).user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const stats = await QuizService.getMyStats(userId);
            response.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getUserStats(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUuidParam(request.params.userId);
            const stats = await QuizService.getMyStats(userId);
            response.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    }

    async listAdminQuestions(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const themeSlug =
                typeof request.query.theme === 'string' ? request.query.theme : undefined;
            const type = typeof request.query.type === 'string' ? request.query.type : undefined;
            const difficulty =
                typeof request.query.difficulty === 'string'
                    ? request.query.difficulty
                    : undefined;
            let isActive: boolean | undefined;
            if (request.query.is_active === 'true') isActive = true;
            if (request.query.is_active === 'false') isActive = false;
            let forDaily: boolean | undefined;
            if (request.query.for_daily === 'true') forDaily = true;
            if (request.query.for_daily === 'false') forDaily = false;
            let wasDailyQuestion: boolean | undefined;
            if (request.query.was_daily_question === 'true') wasDailyQuestion = true;
            if (request.query.was_daily_question === 'false') wasDailyQuestion = false;
            const seasonIdRaw = Number(request.query.season_id);
            const seasonId = Number.isFinite(seasonIdRaw) ? seasonIdRaw : undefined;
            const limitRaw = Number(request.query.limit);
            const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;

            const questions = await QuizService.listAdminQuestions({
                themeSlug,
                type,
                isActive,
                forDaily,
                wasDailyQuestion,
                difficulty,
                seasonId,
                limit,
            });
            response.status(200).json({ questions });
        } catch (error) {
            next(error);
        }
    }

    async createAdminQuestion(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const created = await QuizService.createAdminQuestion({
                themeSlug: String(request.body.themeSlug ?? ''),
                type: String(request.body.type ?? ''),
                prompt: String(request.body.prompt ?? ''),
                keywords: request.body.keywords,
                payload: (request.body.payload ?? {}) as Record<string, unknown>,
                points: request.body.points,
                is_active: request.body.is_active,
                for_daily: request.body.for_daily,
                was_daily_question: request.body.was_daily_question,
                daily_time_limit_seconds: request.body.daily_time_limit_seconds,
                difficulty: request.body.difficulty,
                season_id: request.body.season_id,
                scheduled_date: request.body.scheduled_date,
                image_url: request.body.image_url,
                hint: request.body.hint,
                explanation: request.body.explanation,
                explanation_image_url: request.body.explanation_image_url,
            });
            response.status(201).json(created);
        } catch (error) {
            next(error);
        }
    }

    async updateAdminQuestion(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const questionId = Number(request.params.questionId);
            if (!Number.isFinite(questionId)) {
                throw new CustomError('questionId invalide', 400);
            }
            const updated = await QuizService.updateAdminQuestion(questionId, {
                themeSlug: request.body.themeSlug,
                type: request.body.type,
                prompt: request.body.prompt,
                keywords: request.body.keywords,
                payload: request.body.payload,
                points: request.body.points,
                is_active: request.body.is_active,
                for_daily: request.body.for_daily,
                was_daily_question: request.body.was_daily_question,
                daily_time_limit_seconds: request.body.daily_time_limit_seconds,
                difficulty: request.body.difficulty,
                season_id: request.body.season_id,
                scheduled_date: request.body.scheduled_date,
                image_url: request.body.image_url,
                hint: request.body.hint,
                explanation: request.body.explanation,
                explanation_image_url: request.body.explanation_image_url,
            });
            response.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    async deleteAdminQuestion(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const questionId = Number(request.params.questionId);
            if (!Number.isFinite(questionId)) {
                throw new CustomError('questionId invalide', 400);
            }
            const result = await QuizService.deleteAdminQuestion(questionId);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async switchAllToInactive(
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const rawIds = request.body?.ids;
            const ids = Array.isArray(rawIds)
                ? rawIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
                : [];
            const result = await QuizService.switchAllToInactive(ids);
            response.status(200).json({
                message: 'Les questions sélectionnées sont désormais inactives',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async switchAllToActive(
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const rawIds = request.body?.ids;
            const ids = Array.isArray(rawIds)
                ? rawIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
                : [];
            const result = await QuizService.switchAllToActive(ids);
            response.status(200).json({
                message: 'Les questions sélectionnées sont désormais actives',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async switchAllToNonDaily(
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const rawIds = request.body?.ids;
            const ids = Array.isArray(rawIds)
                ? rawIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
                : [];
            const result = await QuizService.switchAllToNonDaily(ids);
            response.status(200).json({
                message: 'Les créneaux Daily des questions sélectionnées ont été libérés',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async listAdminSeasons(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const preview = request.query.preview === 'true';
            const seasons = preview
                ? await QuizSeasonService.listDashboardSeasons()
                : await QuizSeasonService.listAllSeasons();
            response.status(200).json({ seasons });
        } catch (error) {
            next(error);
        }
    }

    async getAdminSeason(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const seasonId = Number(request.params.seasonId);
            if (!Number.isFinite(seasonId)) {
                throw new CustomError('seasonId invalide', 400);
            }
            const season = await QuizSeasonService.getSeasonById(seasonId);
            response.status(200).json(season);
        } catch (error) {
            next(error);
        }
    }

    async createAdminSeason(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const season = await QuizSeasonService.createSeason({
                name: request.body.name,
                startDate: request.body.startDate ?? request.body.start_date,
                endDate: request.body.endDate ?? request.body.end_date,
                imageUrl:
                    request.body.imageUrl ??
                    request.body.image_url ??
                    undefined,
                imageFocalX:
                    request.body.imageFocalX ?? request.body.image_focal_x,
                imageFocalY:
                    request.body.imageFocalY ?? request.body.image_focal_y,
                imageZoom: request.body.imageZoom ?? request.body.image_zoom,
                allowsOverlap:
                    request.body.allowsOverlap ?? request.body.allows_overlap,
            });
            response.status(201).json(season);
        } catch (error) {
            next(error);
        }
    }

    async updateAdminSeason(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const seasonId = Number(request.params.seasonId);
            if (!Number.isFinite(seasonId)) {
                throw new CustomError('seasonId invalide', 400);
            }
            const season = await QuizSeasonService.updateSeason(seasonId, {
                name: request.body.name,
                startDate: request.body.startDate ?? request.body.start_date,
                endDate: request.body.endDate ?? request.body.end_date,
                imageUrl:
                    request.body.imageUrl !== undefined
                        ? request.body.imageUrl
                        : request.body.image_url !== undefined
                          ? request.body.image_url
                          : undefined,
                imageFocalX:
                    request.body.imageFocalX ?? request.body.image_focal_x,
                imageFocalY:
                    request.body.imageFocalY ?? request.body.image_focal_y,
                imageZoom: request.body.imageZoom ?? request.body.image_zoom,
                allowsOverlap:
                    request.body.allowsOverlap ?? request.body.allows_overlap,
            });
            response.status(200).json(season);
        } catch (error) {
            next(error);
        }
    }

    async deleteAdminSeason(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const seasonId = Number(request.params.seasonId);
            if (!Number.isFinite(seasonId)) {
                throw new CustomError('seasonId invalide', 400);
            }
            const result = await QuizSeasonService.deleteSeason(seasonId);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAdminSeasonPodium(
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const seasonId = Number(request.params.seasonId);
            if (!Number.isFinite(seasonId)) {
                throw new CustomError('seasonId invalide', 400);
            }
            const podium = await QuizSeasonService.getSeasonPodium(seasonId);
            response.status(200).json(podium);
        } catch (error) {
            next(error);
        }
    }

    /** Classement public d'une saison (ou de la saison en cours si seasonId = "current"). */
    async getSeasonRanking(
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const raw = String(request.params.seasonId ?? 'current');
            let seasonId: number;
            if (raw === 'current') {
                const today = QuizService.todayDateString();
                const season = await QuizSeasonService.findSeasonForDate(today);
                if (!season) {
                    throw new CustomError('Aucune saison en cours', 404);
                }
                seasonId = QuizSeasonService.toNumberId(season.id);
            } else {
                seasonId = Number(raw);
                if (!Number.isFinite(seasonId)) {
                    throw new CustomError('seasonId invalide', 400);
                }
            }
            const ranking = await QuizSeasonService.getSeasonPodium(seasonId);
            response.status(200).json(ranking);
        } catch (error) {
            next(error);
        }
    }

    async autoFillAdminSeasonSchedule(
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const seasonId = Number(request.params.seasonId);
            if (!Number.isFinite(seasonId)) {
                throw new CustomError('seasonId invalide', 400);
            }
            const dryRun =
                request.body?.dryRun === true ||
                request.query.dryRun === 'true';
            const rawAssignments = request.body?.currentAssignments;
            let currentAssignments: Record<string, number> | undefined;
            if (rawAssignments && typeof rawAssignments === 'object') {
                currentAssignments = {};
                for (const [day, value] of Object.entries(
                    rawAssignments as Record<string, unknown>
                )) {
                    const id = Number(value);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(id)) {
                        currentAssignments[day] = id;
                    }
                }
            }
            const rawCandidates = request.body?.candidateQuestionIds;
            let candidateQuestionIds: number[] | undefined;
            if (Array.isArray(rawCandidates)) {
                candidateQuestionIds = rawCandidates
                    .map((v) => Number(v))
                    .filter((id) => Number.isFinite(id));
            }
            const result = await QuizSeasonService.autoFillSeasonSchedule(seasonId, {
                dryRun,
                currentAssignments,
                candidateQuestionIds,
            });
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new QuizController();
