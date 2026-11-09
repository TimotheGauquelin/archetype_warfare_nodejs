import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/Sequelize';
import { CustomError } from '../errors/CustomError';
import QuizTheme from '../models/QuizThemeModel';
import QuizQuestion, {
    QuizQuestionDifficulty,
} from '../models/QuizQuestionModel';
import QuizDaily from '../models/QuizDailyModel';
import QuizAttempt from '../models/QuizAttemptModel';
import QuizAnswer from '../models/QuizAnswerModel';
import QuizSeason from '../models/QuizSeasonModel';
import User from '../models/UserModel';
import Card from '../models/CardModel';
import UploadImageService from './UploadImageService';
import CardService from './CardService';
import QuizSeasonService from './QuizSeasonService';
import MedalService from './MedalService';

const DEFAULT_QUESTION_COUNT = 5;
/** Limite de parties libres pour les comptes classiques (non Admin / non Premium). */
const FREE_PLAY_LIMIT = 5;
/** Rôles sans limite de parties libres (Premium prévu plus tard). */
const UNLIMITED_FREE_PLAY_ROLES = ['Admin', 'Premium'] as const;
const PLAYABLE_TYPES = [
    'mcq',
    'true_false',
    'order',
    'name_the_cards',
    'summoner',
    'zoom',
    'hint_ladder',
] as const;

/** Types forcément rattachés au thème « Jeu de Cartes » */
const CARD_GAME_QUESTION_TYPES = ['summoner', 'zoom', 'hint_ladder'] as const;
const CARD_GAME_THEME_SLUG = 'jeu-de-cartes';

/** Points max / phase pour le mode Zoom (phase 1→3, 2→2, 3→1) */
const ZOOM_MAX_POINTS = 3;
const ZOOM_DEFAULT_PHASE_SECONDS = 15;

/** Indices : Difficile→3, Moyen→2, Facile→1, Newbie→0 */
const HINT_LADDER_MAX_POINTS = 3;
const HINT_LADDER_LEVELS = ['hard', 'medium', 'easy', 'newbie'] as const;
type HintLadderLevel = (typeof HINT_LADDER_LEVELS)[number];

type OrderItemStored = {
    id: string;
    label: string;
    imageUrl: string | null;
};

type NameTheCardsAnswerStored = {
    cardId: string;
    label: string;
};

type SummonerPropositionStored = {
    cardId: string;
    label: string;
    isMaterial: boolean;
};

type ZoomPayloadStored = {
    cardId: string;
    label: string;
    focusX: number;
    focusY: number;
    phaseDurationSeconds: number;
};

type HintLadderPayloadStored = {
    cardId: string;
    label: string;
    hints: Record<HintLadderLevel, string>;
};

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const FREE_PLAY_ALL_SLUG = 'all';
const FREE_PLAY_HIDDEN_SLUGS = new Set([FREE_PLAY_ALL_SLUG]);

type McqChoiceStored = {
    text: string;
    cardId: string | null;
};

type McqChoicePublic = {
    text: string;
    cardId: string | null;
    name: string | null;
    artworkUrl: string | null;
};

type PublicQuestion = {
    id: number;
    type: string;
    prompt: string;
    points: number;
    difficulty: QuizQuestionDifficulty;
    imageUrl: string | null;
    hint: string | null;
    explanation: string | null;
    explanationImageUrl: string | null;
    theme: { id: number; slug: string; label: string } | null;
    payload: Record<string, unknown>;
    userAnswer?: Record<string, unknown> | null;
    isCorrect?: boolean | null;
    correctPayload?: Record<string, unknown> | null;
};

class QuizService {
    static todayDateString(timeZone = 'Europe/Paris'): string {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date());
    }

    static toNumberId(value: unknown): number {
        return Number(value);
    }

    static questionMaxPoints(question: { type: string; points: number }): number {
        if (question.type === 'zoom') return ZOOM_MAX_POINTS;
        if (question.type === 'hint_ladder') return HINT_LADDER_MAX_POINTS;
        return Math.max(1, Number(question.points) || 1);
    }

    static normalizeHintLadderLevel(value: unknown): HintLadderLevel {
        const raw = String(value ?? 'hard').trim().toLowerCase();
        if (HINT_LADDER_LEVELS.includes(raw as HintLadderLevel)) {
            return raw as HintLadderLevel;
        }
        const asIndex = Math.floor(Number(value));
        if (Number.isFinite(asIndex) && asIndex >= 0 && asIndex <= 3) {
            return HINT_LADDER_LEVELS[asIndex];
        }
        return 'hard';
    }

    static hintLadderPointsForLevel(level: HintLadderLevel): number {
        switch (level) {
            case 'hard':
                return 3;
            case 'medium':
                return 2;
            case 'easy':
                return 1;
            case 'newbie':
            default:
                return 0;
        }
    }

    static normalizeHintLadderPayload(
        payload: Record<string, unknown>
    ): HintLadderPayloadStored {
        const cardId = String(payload.cardId ?? payload.card_id ?? '').trim();
        const label = String(payload.label ?? payload.name ?? '').trim();
        const rawHints =
            payload.hints && typeof payload.hints === 'object'
                ? (payload.hints as Record<string, unknown>)
                : {};
        return {
            cardId,
            label,
            hints: {
                hard: String(rawHints.hard ?? rawHints.difficile ?? '').trim(),
                medium: String(rawHints.medium ?? rawHints.moyen ?? '').trim(),
                easy: String(rawHints.easy ?? rawHints.facile ?? '').trim(),
                newbie: String(rawHints.newbie ?? '').trim(),
            },
        };
    }

    static normalizeZoomFocus(value: unknown, fallback = 50): number {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(0, Math.min(100, n));
    }

    static normalizeZoomPhaseDuration(value: unknown): number {
        const n = Math.floor(Number(value));
        if (!Number.isFinite(n) || n < 5) return ZOOM_DEFAULT_PHASE_SECONDS;
        return Math.min(30, n);
    }

    static normalizeZoomPayload(payload: Record<string, unknown>): ZoomPayloadStored {
        const cardId = String(payload.cardId ?? payload.card_id ?? '').trim();
        const label = String(payload.label ?? payload.name ?? '').trim();
        return {
            cardId,
            label,
            focusX: this.normalizeZoomFocus(payload.focusX ?? payload.focus_x, 50),
            focusY: this.normalizeZoomFocus(payload.focusY ?? payload.focus_y, 50),
            phaseDurationSeconds: this.normalizeZoomPhaseDuration(
                payload.phaseDurationSeconds ?? payload.phase_duration_seconds
            ),
        };
    }

    /** Phase 1–3 selon elapsed ; au-delà de la phase 3 → reste 3 */
    static zoomPhaseFromElapsedMs(
        elapsedMs: number,
        phaseDurationSeconds: number
    ): number {
        const durationMs = Math.max(1, phaseDurationSeconds) * 1000;
        const phase = Math.floor(elapsedMs / durationMs) + 1;
        return Math.max(1, Math.min(3, phase));
    }

    static zoomPointsForPhase(phase: number): number {
        if (phase <= 1) return 3;
        if (phase === 2) return 2;
        return 1;
    }

    /** 0 = pas de chrono ; sinon N secondes (pas de plafond) */
    static normalizeDailyTimeLimitSeconds(value: unknown): number {
        if (value === undefined || value === null || value === '') return 30;
        const n = Math.floor(Number(value));
        if (!Number.isFinite(n) || n < 0) return 30;
        return n;
    }

    static normalizeMcqChoice(raw: unknown): McqChoiceStored {
        if (typeof raw === 'string') {
            return { text: raw.trim(), cardId: null };
        }
        if (raw && typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            const text = String(obj.text ?? obj.label ?? obj.name ?? '').trim();
            const cardIdRaw = obj.cardId ?? obj.card_id ?? null;
            const cardId =
                cardIdRaw === null || cardIdRaw === undefined || cardIdRaw === ''
                    ? null
                    : String(cardIdRaw);
            return { text, cardId };
        }
        return { text: '', cardId: null };
    }

    static async enrichMcqChoices(
        choices: McqChoiceStored[],
        locale?: string | null
    ): Promise<McqChoicePublic[]> {
        const cardIds = [
            ...new Set(
                choices
                    .map((c) => c.cardId)
                    .filter((id): id is string => Boolean(id))
            ),
        ];
        const cards =
            cardIds.length > 0
                ? await Card.findAll({ where: { id: { [Op.in]: cardIds } } })
                : [];
        const localized = await CardService.applyLocaleToCardRecords(
            cards.map((c) => ({
                id: String(c.id),
                name: c.name,
                artwork_url: c.artwork_url,
            })),
            locale
        );
        const cardMap = new Map(localized.map((c) => [String(c.id), c]));

        return choices.map((choice) => {
            const card = choice.cardId ? cardMap.get(choice.cardId) : undefined;
            const name = card?.name ?? null;
            // Préférer le nom localisé de la carte si disponible
            const text = name || choice.text || '';
            const artworkUrl = card
                ? CardService.resolveArtworkUrl(
                      String(card.id),
                      card.artwork_url
                  )
                : choice.cardId
                  ? CardService.croppedArtworkUrlFromId(choice.cardId)
                  : null;
            return {
                text,
                cardId: choice.cardId,
                name,
                artworkUrl,
            };
        });
    }

    static normalizeOrderItem(raw: unknown, index: number): OrderItemStored {
        if (!raw || typeof raw !== 'object') {
            return { id: String(index), label: '', imageUrl: null };
        }
        const obj = raw as Record<string, unknown>;
        const id =
            obj.id !== undefined && obj.id !== null && String(obj.id).trim() !== ''
                ? String(obj.id)
                : String(index);
        const label = String(obj.label ?? obj.text ?? obj.name ?? '').trim();
        const imageRaw = obj.imageUrl ?? obj.image_url ?? null;
        const imageUrl =
            typeof imageRaw === 'string' && imageRaw.trim() ? imageRaw.trim() : null;
        return { id, label, imageUrl };
    }

    static async toPublicPayload(
        type: string,
        payload: Record<string, unknown>,
        locale?: string | null
    ): Promise<Record<string, unknown>> {
        if (type === 'mcq') {
            const stored = (Array.isArray(payload.choices) ? payload.choices : []).map(
                (c) => this.normalizeMcqChoice(c)
            );
            const choices = await this.enrichMcqChoices(stored, locale);
            return { choices };
        }
        if (type === 'true_false') {
            return {};
        }
        if (type === 'order') {
            const items = (Array.isArray(payload.items) ? payload.items : []).map(
                (item, index) => this.normalizeOrderItem(item, index)
            );
            return {
                items: items.map((item) => ({
                    id: item.id,
                    label: item.label,
                    imageUrl: item.imageUrl,
                })),
            };
        }
        if (type === 'name_the_cards') {
            const monsterCount = Math.max(
                1,
                Math.min(10, Number(payload.monsterCount) || 1)
            );
            return { monsterCount };
        }
        if (type === 'summoner') {
            const propositions = this.extractSummonerPropositions(payload);
            const enriched = await this.enrichNameTheCardsAnswers(
                propositions.map((p) => ({ cardId: p.cardId, label: p.label })),
                locale
            );
            return {
                propositions: enriched.map((item, index) => ({
                    cardId: item.cardId,
                    label: item.label,
                    name: item.name,
                    artworkUrl: item.artworkUrl,
                    // Ne pas exposer isMaterial côté public
                    id: String(index),
                })),
                materialCount: propositions.filter((p) => p.isMaterial).length,
            };
        }
        if (type === 'zoom') {
            const zoom = this.normalizeZoomPayload(payload);
            return {
                focusX: zoom.focusX,
                focusY: zoom.focusY,
                phaseDurationSeconds: zoom.phaseDurationSeconds,
                maxPoints: ZOOM_MAX_POINTS,
            };
        }
        if (type === 'hint_ladder') {
            const ladder = this.normalizeHintLadderPayload(payload);
            return {
                hints: { ...ladder.hints },
                maxPoints: HINT_LADDER_MAX_POINTS,
                levels: HINT_LADDER_LEVELS.map((level) => ({
                    level,
                    points: this.hintLadderPointsForLevel(level),
                })),
            };
        }
        return {};
    }

    static stripCorrectPayload(
        type: string,
        payload: Record<string, unknown>
    ): Record<string, unknown> {
        if (type === 'mcq') {
            return { choices: Array.isArray(payload.choices) ? payload.choices : [] };
        }
        if (type === 'true_false') {
            return {};
        }
        if (type === 'order') {
            return {
                items: Array.isArray(payload.items) ? payload.items : [],
            };
        }
        if (type === 'name_the_cards') {
            return {
                monsterCount: Math.max(
                    1,
                    Math.min(10, Number(payload.monsterCount) || 1)
                ),
            };
        }
        if (type === 'summoner') {
            const propositions = this.extractSummonerPropositions(payload);
            return {
                propositions: propositions.map((p, index) => ({
                    cardId: p.cardId,
                    label: p.label,
                    id: String(index),
                })),
                materialCount: propositions.filter((p) => p.isMaterial).length,
            };
        }
        if (type === 'zoom') {
            const zoom = this.normalizeZoomPayload(payload);
            return {
                focusX: zoom.focusX,
                focusY: zoom.focusY,
                phaseDurationSeconds: zoom.phaseDurationSeconds,
                maxPoints: ZOOM_MAX_POINTS,
            };
        }
        if (type === 'hint_ladder') {
            const ladder = this.normalizeHintLadderPayload(payload);
            return {
                hints: { ...ladder.hints },
                maxPoints: HINT_LADDER_MAX_POINTS,
                levels: HINT_LADDER_LEVELS.map((level) => ({
                    level,
                    points: this.hintLadderPointsForLevel(level),
                })),
            };
        }
        return {};
    }

    static gradeAnswer(
        type: string,
        payload: Record<string, unknown>,
        answer: Record<string, unknown>
    ): boolean {
        if (type === 'mcq') {
            const correctIndex = Number(payload.correctIndex);
            const selectedIndex = Number(answer.selectedIndex);
            return Number.isFinite(correctIndex) && selectedIndex === correctIndex;
        }
        if (type === 'true_false') {
            return Boolean(answer.value) === Boolean(payload.correct);
        }
        if (type === 'order') {
            const correctOrder = Array.isArray(payload.correctOrder)
                ? payload.correctOrder.map((id) => String(id))
                : [];
            const userOrder = Array.isArray(answer.order)
                ? answer.order.map((id) => String(id))
                : [];
            if (correctOrder.length === 0 || correctOrder.length !== userOrder.length) {
                return false;
            }
            return correctOrder.every((id, index) => id === userOrder[index]);
        }
        if (type === 'name_the_cards') {
            const answers = Array.isArray(payload.answers)
                ? payload.answers.map((raw) => this.normalizeNameTheCardsAnswer(raw))
                : [];
            const userCardIds = Array.isArray(answer.cardIds)
                ? answer.cardIds.map((id) => String(id ?? '').trim())
                : [];
            if (answers.length === 0 || answers.length !== userCardIds.length) {
                return false;
            }
            return answers.every(
                (expected, index) => expected.cardId === userCardIds[index]
            );
        }
        if (type === 'summoner') {
            const expected = this.extractSummonerPropositions(payload)
                .filter((p) => p.isMaterial)
                .map((p) => p.cardId)
                .sort();
            const userCardIds = Array.isArray(answer.cardIds)
                ? answer.cardIds.map((id) => String(id ?? '').trim()).filter(Boolean)
                : [];
            if (expected.length === 0 || expected.length !== userCardIds.length) {
                return false;
            }
            const actual = [...userCardIds].sort();
            return expected.every((id, index) => id === actual[index]);
        }
        if (type === 'zoom') {
            const zoom = this.normalizeZoomPayload(payload);
            const cardId = String(answer.cardId ?? answer.card_id ?? '').trim();
            return Boolean(zoom.cardId) && zoom.cardId === cardId;
        }
        if (type === 'hint_ladder') {
            const ladder = this.normalizeHintLadderPayload(payload);
            const cardId = String(answer.cardId ?? answer.card_id ?? '').trim();
            return Boolean(ladder.cardId) && ladder.cardId === cardId;
        }
        return false;
    }

    static normalizeNameTheCardsAnswer(raw: unknown): NameTheCardsAnswerStored {
        if (!raw || typeof raw !== 'object') {
            return { cardId: '', label: '' };
        }
        const obj = raw as Record<string, unknown>;
        const cardId = String(obj.cardId ?? obj.card_id ?? '').trim();
        const label = String(obj.label ?? obj.name ?? obj.text ?? '').trim();
        return { cardId, label };
    }

    static normalizeSummonerProposition(raw: unknown): SummonerPropositionStored {
        if (!raw || typeof raw !== 'object') {
            return { cardId: '', label: '', isMaterial: false };
        }
        const obj = raw as Record<string, unknown>;
        const base = this.normalizeNameTheCardsAnswer(raw);
        const isMaterial = Boolean(
            obj.isMaterial ?? obj.is_material ?? obj.correct ?? false
        );
        return { ...base, isMaterial };
    }

    /** Compatible ancien format { answers, materialCount } (toutes = matériaux). */
    static extractSummonerPropositions(
        payload: Record<string, unknown>
    ): SummonerPropositionStored[] {
        if (Array.isArray(payload.propositions) && payload.propositions.length > 0) {
            return payload.propositions.map((raw) =>
                this.normalizeSummonerProposition(raw)
            );
        }
        if (Array.isArray(payload.answers) && payload.answers.length > 0) {
            return payload.answers.map((raw) => ({
                ...this.normalizeNameTheCardsAnswer(raw),
                isMaterial: true,
            }));
        }
        return [];
    }

    static async getThemes() {
        const themes = await QuizTheme.findAll({
            where: { is_active: true },
            order: [['label', 'ASC']],
        });
        return themes.map((theme) => ({
            id: this.toNumberId(theme.id),
            slug: theme.slug,
            label: theme.label,
            description: theme.description,
        }));
    }

    static async getThemeBySlug(slug: string): Promise<QuizTheme> {
        const normalized = String(slug).trim().toLowerCase();
        const aliases = normalized === 'tcg' ? ['tcg', 'jeu-de-cartes'] : [normalized];
        const theme = await QuizTheme.findOne({
            where: { slug: { [Op.in]: aliases }, is_active: true },
        });
        if (!theme) {
            throw new CustomError('Thème introuvable', 404);
        }
        return theme;
    }

    static normalizeOptionalText(value: unknown): string | null {
        if (value === undefined || value === null) return null;
        const text = String(value).trim();
        return text.length > 0 ? text : null;
    }

    /** Mots-clés admin : tableau ou chaîne séparée par des virgules. */
    static normalizeKeywords(value: unknown): string[] {
        const parts: string[] = [];
        if (Array.isArray(value)) {
            for (const item of value) {
                parts.push(String(item ?? ''));
            }
        } else if (value != null && String(value).trim() !== '') {
            parts.push(...String(value).split(','));
        }
        const seen = new Set<string>();
        const out: string[] = [];
        for (const part of parts) {
            const keyword = part.trim().toLowerCase();
            if (!keyword || seen.has(keyword)) continue;
            seen.add(keyword);
            out.push(keyword);
        }
        return out;
    }

    /** Dossier Cloudinary `quizz/<type>` pour les uploads PC (base64). */
    static cloudinaryFolderForQuizType(type?: string | null): string {
        const normalized = String(type ?? '').trim().toLowerCase();
        if (
            (PLAYABLE_TYPES as readonly string[]).includes(normalized)
        ) {
            return `quizz/${normalized}`;
        }
        return 'quizz';
    }

    static async resolveImageUrl(
        imageUrl: unknown,
        quizType?: string | null
    ): Promise<string | null> {
        if (imageUrl === undefined || imageUrl === null) return null;
        const value = String(imageUrl).trim();
        if (!value) return null;
        if (value.startsWith('data:')) {
            return UploadImageService.uploadImage(
                value,
                this.cloudinaryFolderForQuizType(quizType)
            );
        }
        return value;
    }

    static normalizeDifficulty(value: unknown): QuizQuestionDifficulty {
        const difficulty = String(value ?? 'medium').trim().toLowerCase();
        if (!DIFFICULTIES.includes(difficulty as QuizQuestionDifficulty)) {
            throw new CustomError('Difficulté invalide (easy | medium | hard)', 400);
        }
        return difficulty as QuizQuestionDifficulty;
    }

    /**
     * Partie libre : questions actives hors pool Daily (`for_daily = false`),
     * hors exclusions (ex. Daily du jour).
     */
    static async countPlayableQuestions(
        themeId?: number | number[],
        excludedQuestionIds: number[] = []
    ): Promise<number> {
        const where: Record<string, unknown> = {
            is_active: true,
            for_daily: false,
            type: { [Op.in]: [...PLAYABLE_TYPES] },
        };
        if (themeId !== undefined) {
            where.theme_id = Array.isArray(themeId) ? { [Op.in]: themeId } : themeId;
        }
        if (excludedQuestionIds.length > 0) {
            where.id = { [Op.notIn]: excludedQuestionIds };
        }
        return QuizQuestion.count({ where });
    }

    /**
     * Après passage réel en Daily : historique + bascule en question libre.
     * Conserve season_id / scheduled_date pour rester visible dans le planificateur.
     */
    static async markQuestionsAsPlayedDaily(questionIds: number[]): Promise<void> {
        const ids = [...new Set(questionIds.filter((id) => Number.isFinite(id) && id > 0))];
        if (ids.length === 0) return;
        await QuizQuestion.update(
            {
                was_daily_question: true,
                for_daily: false,
            },
            { where: { id: { [Op.in]: ids } } }
        );
    }

    static async getTodayDailyQuestionIds(quizDate: string): Promise<number[]> {
        const dailies = await QuizDaily.findAll({ where: { quiz_date: quizDate } });
        const ids: number[] = [];
        for (const daily of dailies) {
            for (const id of daily.question_ids ?? []) {
                ids.push(this.toNumberId(id));
            }
        }
        return [...new Set(ids)];
    }

    static displayThemeLabel(theme: QuizTheme): string {
        return theme.label;
    }

    static async resolveFreePlayThemeIds(themeSlug: string): Promise<{
        attemptTheme: QuizTheme;
        questionThemeIds: number[] | null;
    }> {
        const normalized = String(themeSlug).trim().toLowerCase();

        if (normalized === FREE_PLAY_ALL_SLUG) {
            const allTheme = await this.getThemeBySlug(FREE_PLAY_ALL_SLUG);
            return { attemptTheme: allTheme, questionThemeIds: null };
        }

        // Rétrocompat : anciennes parties « manga-anime » → manga seul
        if (normalized === 'manga-anime') {
            const manga = await this.getThemeBySlug('manga');
            return {
                attemptTheme: manga,
                questionThemeIds: [this.toNumberId(manga.id)],
            };
        }

        const theme = await this.getThemeBySlug(normalized);
        return {
            attemptTheme: theme,
            questionThemeIds: [this.toNumberId(theme.id)],
        };
    }

    static async getFreePlayThemes(excludedQuestionIds: number[] = []) {
        const themes = await this.getThemes();
        const bySlug = new Map(themes.map((theme) => [theme.slug, theme]));
        const freeThemes: Array<{
            id: number;
            slug: string;
            label: string;
            description: string | null;
            questionCount: number;
        }> = [];

        const allCount = await this.countPlayableQuestions(undefined, excludedQuestionIds);
        const allTheme = bySlug.get(FREE_PLAY_ALL_SLUG);
        if (allCount > 0 && allTheme) {
            freeThemes.push({
                ...allTheme,
                questionCount: allCount,
            });
        }

        for (const theme of themes) {
            if (FREE_PLAY_HIDDEN_SLUGS.has(theme.slug)) {
                continue;
            }
            const questionCount = await this.countPlayableQuestions(
                theme.id,
                excludedQuestionIds
            );
            if (questionCount > 0) {
                freeThemes.push({ ...theme, questionCount });
            }
        }

        return freeThemes;
    }

    static hasUnlimitedFreePlay(roles?: string[] | null): boolean {
        if (!roles?.length) return false;
        return roles.some((role) =>
            (UNLIMITED_FREE_PLAY_ROLES as readonly string[]).includes(role)
        );
    }

    static async countFreeAttempts(userId: string): Promise<number> {
        return QuizAttempt.count({
            where: { user_id: userId, mode: 'free' },
        });
    }

    static async getFreePlayQuota(userId?: string, roles?: string[] | null) {
        if (userId && this.hasUnlimitedFreePlay(roles)) {
            return {
                unlimited: true as const,
                limit: null,
                used: 0,
                remaining: null,
            };
        }
        const used = userId ? await this.countFreeAttempts(userId) : 0;
        const remaining = Math.max(0, FREE_PLAY_LIMIT - used);
        return {
            unlimited: false as const,
            limit: FREE_PLAY_LIMIT,
            used,
            remaining,
        };
    }

    static async getHub(userId?: string, roles?: string[] | null) {
        const today = this.todayDateString();
        const dailyRows = await this.ensureDailiesForDate(today);
        const excludedFromFree = dailyRows.flatMap((row) =>
            (row.question_ids ?? []).map((id) => this.toNumberId(id))
        );
        const themes = await this.getFreePlayThemes(excludedFromFree);
        const freePlay = await this.getFreePlayQuota(userId, roles);

        type DailyHubEntry = {
            quizDate: string;
            questionCount: number;
            seasonId: number | null;
            theme: {
                id: number;
                slug: string;
                label: string;
                description: string | null;
            } | null;
            season: Awaited<
                ReturnType<typeof QuizSeasonService.serializeSeason>
            > | null;
            myAttempt: {
                id: string;
                status: string;
                score: number;
                max_score: number;
            } | null;
        };

        const dailies: DailyHubEntry[] = [];
        for (const dailyRow of dailyRows) {
            const seasonId = dailyRow.season_id
                ? this.toNumberId(dailyRow.season_id)
                : null;
            const theme = await QuizTheme.findByPk(dailyRow.theme_id);
            const season = seasonId
                ? await QuizSeason.findByPk(seasonId)
                : null;
            let myAttempt: DailyHubEntry['myAttempt'] = null;

            if (userId) {
                const attemptWhere: Record<string, unknown> = {
                    user_id: userId,
                    mode: 'daily',
                    daily_date: today,
                };
                if (seasonId != null) {
                    attemptWhere.season_id = seasonId;
                }
                const attempt = await QuizAttempt.findOne({
                    where: attemptWhere,
                });
                if (attempt) {
                    myAttempt = {
                        id: attempt.id,
                        status: attempt.status,
                        score: attempt.score,
                        max_score: attempt.max_score,
                    };
                }
            }

            dailies.push({
                quizDate: today,
                questionCount: (dailyRow.question_ids ?? []).length,
                seasonId,
                theme: theme
                    ? {
                          id: this.toNumberId(theme.id),
                          slug: theme.slug,
                          label: theme.label,
                          description: theme.description,
                      }
                    : null,
                season: season
                    ? await QuizSeasonService.serializeSeason(season)
                    : null,
                myAttempt,
            });
        }

        /** Daily principal (normale) — rétrocompat. */
        const daily = dailies[0] ?? null;

        type SeasonPodiumBlock = {
            season: Awaited<ReturnType<typeof QuizSeasonService.serializeSeason>>;
            podium: Array<{
                rank: number;
                userId: string;
                username: string;
                totalScore: number;
                attemptsCount: number;
            }>;
        };

        const currentSeasons = await QuizSeasonService.findSeasonsForDate(today);
        const seasonPodiums: SeasonPodiumBlock[] = [];
        for (const season of currentSeasons) {
            const fullPodium = await QuizSeasonService.getSeasonPodium(
                this.toNumberId(season.id)
            );
            seasonPodiums.push({
                season: fullPodium.season,
                podium: fullPodium.podium.slice(0, 3),
            });
        }
        const seasonPodium = seasonPodiums[0] ?? null;

        return {
            themes,
            daily,
            dailies,
            today,
            seasonPodium,
            seasonPodiums,
            freePlay,
        };
    }

    /**
     * Question planifiée du jour pour une saison (ou null).
     * Ne dépend pas de for_daily : une question déjà jouée garde season_id + scheduled_date.
     */
    private static async findScheduledDailyQuestionForSeason(
        seasonId: number,
        quizDate: string
    ): Promise<{ id: number; theme_id: number } | null> {
        const rows = await sequelize.query<{
            id: string | number;
            theme_id: string | number;
        }>(
            `
            SELECT q.id, q.theme_id
            FROM quiz_question q
            WHERE q.is_active = TRUE
              AND q.season_id = :seasonId
              AND q.scheduled_date = :quizDate
              AND q.type IN ('mcq', 'true_false', 'order', 'name_the_cards', 'summoner', 'zoom', 'hint_ladder')
            LIMIT 1
            `,
            {
                replacements: { seasonId, quizDate },
                type: QueryTypes.SELECT,
            }
        );
        if (rows.length === 0) return null;
        return {
            id: this.toNumberId(rows[0].id),
            theme_id: this.toNumberId(rows[0].theme_id),
        };
    }

    /**
     * Crée / met à jour le daily d'UNE saison pour une date (1 question).
     */
    static async ensureDailyForSeason(
        quizDate: string,
        seasonId: number
    ): Promise<QuizDaily | null> {
        const pick = await this.findScheduledDailyQuestionForSeason(
            seasonId,
            quizDate
        );
        if (!pick) return null;

        let existing = await QuizDaily.findOne({
            where: { quiz_date: quizDate, season_id: seasonId },
        });

        // Ancien format : une seule ligne par date (sans / mauvais season_id)
        if (!existing) {
            const legacy = await QuizDaily.findOne({
                where: { quiz_date: quizDate },
            });
            if (
                legacy &&
                (legacy.season_id == null ||
                    this.toNumberId(legacy.season_id) === seasonId)
            ) {
                existing = legacy;
            }
        }

        if (existing) {
            const currentIds = (existing.question_ids ?? []).map((id) =>
                this.toNumberId(id)
            );
            const needsFix =
                currentIds.length !== 1 ||
                currentIds[0] !== pick.id ||
                this.toNumberId(existing.season_id ?? 0) !== seasonId ||
                this.toNumberId(existing.theme_id) !== pick.theme_id;
            if (needsFix) {
                existing.question_ids = [pick.id];
                existing.season_id = seasonId;
                existing.theme_id = pick.theme_id;
                await existing.save();
            }
            await this.markQuestionsAsPlayedDaily([pick.id]);
            return existing;
        }

        try {
            const created = await QuizDaily.create({
                quiz_date: quizDate,
                theme_id: pick.theme_id,
                question_ids: [pick.id],
                season_id: seasonId,
            });
            await this.markQuestionsAsPlayedDaily([pick.id]);
            return created;
        } catch {
            const raced = await QuizDaily.findOne({
                where: { quiz_date: quizDate, season_id: seasonId },
            });
            if (raced) {
                await this.markQuestionsAsPlayedDaily(
                    (raced.question_ids ?? []).map((id) => this.toNumberId(id))
                );
                return raced;
            }
            throw new CustomError('Impossible de créer le quizz quotidien', 500);
        }
    }

    /** Tous les dailys du jour (1 par saison active ayant une question planifiée). */
    static async ensureDailiesForDate(quizDate: string): Promise<QuizDaily[]> {
        const seasons = await QuizSeasonService.findSeasonsForDate(quizDate);
        const rows: QuizDaily[] = [];
        for (const season of seasons) {
            const daily = await this.ensureDailyForSeason(
                quizDate,
                this.toNumberId(season.id)
            );
            if (daily) rows.push(daily);
        }
        return rows;
    }

    /** Daily principal du jour (saison normale, sinon 1ʳᵉ disponible). */
    static async ensureGlobalDaily(quizDate: string): Promise<QuizDaily | null> {
        const dailies = await this.ensureDailiesForDate(quizDate);
        return dailies[0] ?? null;
    }

    static async pickRandomQuestionIds(
        themeIds: number[] | null,
        count: number,
        excludedQuestionIds: number[] = []
    ): Promise<number[]> {
        const themeFilter =
            themeIds && themeIds.length > 0 ? 'AND theme_id IN (:themeIds)' : '';
        const excludedFilter =
            excludedQuestionIds.length > 0 ? 'AND id NOT IN (:excludedIds)' : '';

        const rows = await sequelize.query<{ id: string | number }>(
            `
            SELECT id
            FROM quiz_question
            WHERE is_active = TRUE
              AND for_daily = FALSE
              AND type IN ('mcq', 'true_false', 'order', 'name_the_cards', 'summoner', 'zoom', 'hint_ladder')
              ${themeFilter}
              ${excludedFilter}
            ORDER BY RANDOM()
            LIMIT :limit
            `,
            {
                replacements: {
                    themeIds: themeIds ?? [],
                    excludedIds: excludedQuestionIds,
                    limit: count,
                },
                type: QueryTypes.SELECT,
            }
        );

        if (rows.length === 0) {
            throw new CustomError('Aucune question disponible pour ce thème', 404);
        }

        return rows.map((row) => this.toNumberId(row.id));
    }

    static async startFreeAttempt(
        userId: string,
        themeSlug: string,
        questionCount?: number,
        locale?: string | null,
        roles?: string[] | null
    ) {
        const quota = await this.getFreePlayQuota(userId, roles);
        if (!quota.unlimited && (quota.remaining ?? 0) <= 0) {
            throw new CustomError(
                `Limite de parties libres atteinte (${FREE_PLAY_LIMIT} maximum)`,
                403
            );
        }

        const { attemptTheme, questionThemeIds } =
            await this.resolveFreePlayThemeIds(themeSlug);
        const today = this.todayDateString();
        // La question du jour en cours n'est pas jouable en partie libre
        const excludedQuestionIds = await this.getTodayDailyQuestionIds(today);
        const count = Math.min(
            Math.max(Number(questionCount) || DEFAULT_QUESTION_COUNT, 1),
            20
        );
        const questionIds = await this.pickRandomQuestionIds(
            questionThemeIds,
            count,
            excludedQuestionIds
        );
        const questions = await QuizQuestion.findAll({
            where: { id: { [Op.in]: questionIds } },
        });
        const maxScore = questions.reduce(
            (sum, q) => sum + this.questionMaxPoints(q),
            0
        );

        const attempt = await QuizAttempt.create({
            user_id: userId,
            theme_id: this.toNumberId(attemptTheme.id),
            mode: 'free',
            daily_date: null,
            status: 'in_progress',
            score: 0,
            max_score: maxScore,
            question_ids: questionIds,
        });

        return this.getAttemptForUser(attempt.id, userId, locale);
    }

    static async startDailyAttempt(
        userId: string,
        locale?: string | null,
        seasonIdRaw?: number | string | null
    ) {
        const today = this.todayDateString();
        const seasons = await QuizSeasonService.findSeasonsForDate(today);
        if (seasons.length === 0) {
            throw new CustomError(
                'Aucune question disponible pour le quizz du jour',
                404
            );
        }

        let seasonId: number | null = null;
        if (
            seasonIdRaw !== undefined &&
            seasonIdRaw !== null &&
            String(seasonIdRaw).trim() !== ''
        ) {
            const parsed = Number(seasonIdRaw);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                throw new CustomError('seasonId invalide', 400);
            }
            if (!seasons.some((s) => this.toNumberId(s.id) === parsed)) {
                throw new CustomError(
                    'Cette saison n’a pas de quizz du jour aujourd’hui',
                    404
                );
            }
            seasonId = parsed;
        } else {
            seasonId = this.toNumberId(seasons[0].id);
        }

        const daily = await this.ensureDailyForSeason(today, seasonId);
        if (!daily) {
            throw new CustomError(
                'Aucune question disponible pour le quizz du jour',
                404
            );
        }

        const dailyQuestionIds = (daily.question_ids ?? [])
            .map((id) => this.toNumberId(id))
            .slice(0, 1);
        if (dailyQuestionIds.length === 0) {
            throw new CustomError(
                'Aucune question disponible pour le quizz du jour',
                404
            );
        }

        let existing = await QuizAttempt.findOne({
            where: {
                user_id: userId,
                mode: 'daily',
                daily_date: today,
                season_id: seasonId,
            },
        });
        // Tentatives antérieures sans season_id (avant multi-daily)
        if (!existing) {
            const legacy = await QuizAttempt.findOne({
                where: {
                    user_id: userId,
                    mode: 'daily',
                    daily_date: today,
                    season_id: null,
                },
            });
            if (legacy) {
                legacy.season_id = seasonId;
                await legacy.save();
                existing = legacy;
            }
        }
        if (existing) {
            // Corrige d’éventuelles tentatives multi-questions héritées
            if (
                existing.status === 'in_progress' &&
                ((existing.question_ids ?? []).length !== 1 ||
                    this.toNumberId(existing.question_ids[0]) !==
                        dailyQuestionIds[0])
            ) {
                const answered = await QuizAnswer.findAll({
                    where: { attempt_id: existing.id },
                });
                if (answered.length === 0) {
                    const questions = await QuizQuestion.findAll({
                        where: { id: { [Op.in]: dailyQuestionIds } },
                    });
                    const maxScore = questions.reduce(
                        (sum, q) => sum + this.questionMaxPoints(q),
                        0
                    );
                    existing.question_ids = dailyQuestionIds;
                    existing.max_score = Math.max(1, maxScore);
                    existing.season_id = seasonId;
                    await existing.save();
                }
            }
            return this.getAttemptForUser(existing.id, userId, locale);
        }

        try {
            const dailyQuestions = await QuizQuestion.findAll({
                where: { id: { [Op.in]: dailyQuestionIds } },
            });
            const dailyMaxScore = dailyQuestions.reduce(
                (sum, q) => sum + this.questionMaxPoints(q),
                0
            );
            const attempt = await QuizAttempt.create({
                user_id: userId,
                theme_id: this.toNumberId(daily.theme_id),
                mode: 'daily',
                daily_date: today,
                season_id: seasonId,
                status: 'in_progress',
                score: 0,
                max_score: Math.max(1, dailyMaxScore),
                question_ids: dailyQuestionIds,
            });
            return this.getAttemptForUser(attempt.id, userId, locale);
        } catch {
            const raced = await QuizAttempt.findOne({
                where: {
                    user_id: userId,
                    mode: 'daily',
                    daily_date: today,
                    season_id: seasonId,
                },
            });
            if (raced) return this.getAttemptForUser(raced.id, userId, locale);
            throw new CustomError('Impossible de démarrer le quizz quotidien', 500);
        }
    }

    static async getAttemptForUser(
        attemptId: string,
        userId: string,
        locale?: string | null
    ) {
        const attempt = await QuizAttempt.findByPk(attemptId);
        if (!attempt || String(attempt.user_id) !== String(userId)) {
            throw new CustomError('Tentative introuvable', 404);
        }

        const user = await User.findByPk(userId);
        const resolvedLocale = CardService.normalizeLocale(
            locale ?? user?.locale
        );

        const answers = await QuizAnswer.findAll({ where: { attempt_id: attempt.id } });

        const theme = await QuizTheme.findByPk(attempt.theme_id);
        const questions = await QuizQuestion.findAll({
            where: { id: { [Op.in]: attempt.question_ids } },
            include: [{ model: QuizTheme, as: 'theme' }],
        });
        const questionMap = new Map(questions.map((q) => [this.toNumberId(q.id), q]));
        const answerMap = new Map(answers.map((a) => [this.toNumberId(a.question_id), a]));

        const firstQuestion = attempt.question_ids
            .map((id) => questionMap.get(this.toNumberId(id)))
            .find((q): q is QuizQuestion => Boolean(q));
        // Zoom gère son propre chrono ; multi-questions (saison exceptionnelle) : pas de chrono global unique
        const dailyTimeLimitSeconds =
            attempt.mode === 'daily' &&
            attempt.question_ids.length === 1 &&
            firstQuestion &&
            firstQuestion.type !== 'zoom'
                ? this.normalizeDailyTimeLimitSeconds(
                      firstQuestion.daily_time_limit_seconds
                  )
                : 0;

        // Démarre le chrono dès l'arrivée sur la question du jour (si limite > 0)
        if (
            attempt.mode === 'daily' &&
            attempt.status === 'in_progress' &&
            dailyTimeLimitSeconds > 0 &&
            !attempt.timer_started_at &&
            answers.length === 0
        ) {
            attempt.timer_started_at = new Date();
            await attempt.save();
        }

        const reveal = attempt.status === 'finished';

        const orderedQuestions: PublicQuestion[] = await Promise.all(
            attempt.question_ids
                .map((id) => questionMap.get(this.toNumberId(id)))
                .filter((q): q is QuizQuestion => Boolean(q))
                .map(async (question) => {
                    const answer = answerMap.get(this.toNumberId(question.id));
                    const answered = Boolean(answer);
                    const questionTheme = (question as QuizQuestion & {
                        theme?: QuizTheme;
                    }).theme;
                    const publicPayload = await this.toPublicPayload(
                        question.type,
                        question.payload ?? {},
                        resolvedLocale
                    );
                    const base: PublicQuestion = {
                        id: this.toNumberId(question.id),
                        type: question.type,
                        prompt: question.prompt,
                        points: question.points,
                        difficulty: question.difficulty ?? 'medium',
                        imageUrl: question.image_url ?? null,
                        hint: question.hint ?? null,
                        explanation:
                            answered || reveal ? question.explanation ?? null : null,
                        explanationImageUrl:
                            answered || reveal
                                ? question.explanation_image_url ?? null
                                : null,
                        theme: questionTheme
                            ? {
                                  id: this.toNumberId(questionTheme.id),
                                  slug: questionTheme.slug,
                                  label: this.displayThemeLabel(questionTheme),
                              }
                            : null,
                        payload: publicPayload,
                    };

                    if (answer) {
                        let userAnswer: Record<string, unknown> = {
                            ...(answer.answer ?? {}),
                        };
                        // Enrichit la carte choisie (Zoom / Indices) pour l'affichage après coup
                        if (
                            (question.type === 'zoom' ||
                                question.type === 'hint_ladder') &&
                            typeof userAnswer.cardId === 'string' &&
                            userAnswer.cardId.trim()
                        ) {
                            const enriched = await this.enrichNameTheCardsAnswers(
                                [
                                    {
                                        cardId: String(userAnswer.cardId).trim(),
                                        label: String(
                                            userAnswer.label ??
                                                userAnswer.name ??
                                                ''
                                        ),
                                    },
                                ],
                                resolvedLocale
                            );
                            if (enriched[0]) {
                                userAnswer = {
                                    ...userAnswer,
                                    name: enriched[0].name,
                                    label: enriched[0].label,
                                    artworkUrl: enriched[0].artworkUrl,
                                };
                            }
                        }
                        base.userAnswer = userAnswer;
                        base.isCorrect = answer.is_correct;
                        base.correctPayload = {
                            ...publicPayload,
                            ...(await this.publicCorrectPayload(
                                question.type,
                                question.payload ?? {},
                                resolvedLocale
                            )),
                        };
                    } else if (reveal) {
                        base.correctPayload = {
                            ...publicPayload,
                            ...(await this.publicCorrectPayload(
                                question.type,
                                question.payload ?? {},
                                resolvedLocale
                            )),
                        };
                    }

                    return base;
                })
        );

        return {
            id: attempt.id,
            mode: attempt.mode,
            status: attempt.status,
            score: attempt.score,
            maxScore: attempt.max_score,
            dailyDate: attempt.daily_date,
            startedAt: attempt.started_at,
            finishedAt: attempt.finished_at,
            timerStartedAt: attempt.timer_started_at ?? null,
            timeLimitSeconds:
                attempt.mode === 'daily' && dailyTimeLimitSeconds > 0
                    ? dailyTimeLimitSeconds
                    : null,
            quizPointsAwarded:
                attempt.mode === 'daily' &&
                answers.some((a) => a.is_correct && a.points_awarded > 0),
            userQuizPoints: user?.quiz_points ?? 0,
            theme: theme
                ? {
                      id: this.toNumberId(theme.id),
                      slug: theme.slug,
                      label: this.displayThemeLabel(theme),
                  }
                : null,
            questions: orderedQuestions,
            answeredCount: answers.length,
            totalCount: orderedQuestions.length,
        };
    }

    static async publicCorrectPayload(
        type: string,
        payload: Record<string, unknown>,
        locale?: string | null
    ): Promise<Record<string, unknown>> {
        if (type === 'mcq') {
            return { correctIndex: Number(payload.correctIndex) };
        }
        if (type === 'true_false') {
            return { correct: Boolean(payload.correct) };
        }
        if (type === 'order') {
            return {
                correctOrder: Array.isArray(payload.correctOrder)
                    ? payload.correctOrder.map((id) => String(id))
                    : [],
            };
        }
        if (type === 'name_the_cards') {
            const answers = Array.isArray(payload.answers)
                ? payload.answers.map((raw) => this.normalizeNameTheCardsAnswer(raw))
                : [];
            const enriched = await this.enrichNameTheCardsAnswers(answers, locale);
            return { answers: enriched };
        }
        if (type === 'summoner') {
            const materials = this.extractSummonerPropositions(payload).filter(
                (p) => p.isMaterial
            );
            const enriched = await this.enrichNameTheCardsAnswers(
                materials.map((p) => ({ cardId: p.cardId, label: p.label })),
                locale
            );
            return { answers: enriched };
        }
        if (type === 'zoom') {
            const zoom = this.normalizeZoomPayload(payload);
            const enriched = await this.enrichNameTheCardsAnswers(
                [{ cardId: zoom.cardId, label: zoom.label }],
                locale
            );
            return { cardId: zoom.cardId, answer: enriched[0] ?? null };
        }
        if (type === 'hint_ladder') {
            const ladder = this.normalizeHintLadderPayload(payload);
            const enriched = await this.enrichNameTheCardsAnswers(
                [{ cardId: ladder.cardId, label: ladder.label }],
                locale
            );
            return { cardId: ladder.cardId, answer: enriched[0] ?? null };
        }
        return {};
    }

    static async enrichNameTheCardsAnswers(
        answers: NameTheCardsAnswerStored[],
        locale?: string | null
    ): Promise<
        Array<{
            cardId: string;
            label: string;
            name: string | null;
            artworkUrl: string | null;
        }>
    > {
        const cardIds = [
            ...new Set(answers.map((a) => a.cardId).filter(Boolean)),
        ];
        const cards =
            cardIds.length > 0
                ? await Card.findAll({ where: { id: { [Op.in]: cardIds } } })
                : [];
        const localized = await CardService.applyLocaleToCardRecords(
            cards.map((c) => ({
                id: String(c.id),
                name: c.name,
                artwork_url: c.artwork_url,
            })),
            locale
        );
        const cardMap = new Map(localized.map((c) => [String(c.id), c]));
        return answers.map((answer) => {
            const card = cardMap.get(answer.cardId);
            const localizedName = card?.name ?? null;
            return {
                cardId: answer.cardId,
                // Nom localisé prioritaire sur le label stocké (souvent EN)
                label: localizedName || answer.label || '',
                name: localizedName ?? answer.label ?? null,
                artworkUrl: card
                    ? CardService.resolveArtworkUrl(
                          String(card.id),
                          card.artwork_url
                      )
                    : answer.cardId
                      ? CardService.croppedArtworkUrlFromId(answer.cardId)
                      : null,
            };
        });
    }

    static async submitAnswer(
        attemptId: string,
        userId: string,
        questionId: number,
        answer: Record<string, unknown>,
        locale?: string | null
    ) {
        const attempt = await QuizAttempt.findByPk(attemptId);
        if (!attempt || String(attempt.user_id) !== String(userId)) {
            throw new CustomError('Tentative introuvable', 404);
        }
        if (attempt.status !== 'in_progress') {
            throw new CustomError('Cette tentative est déjà terminée', 400);
        }

        const qid = this.toNumberId(questionId);
        const belongs = attempt.question_ids.some((id) => this.toNumberId(id) === qid);
        if (!belongs) {
            throw new CustomError('Question hors de cette tentative', 400);
        }

        const existing = await QuizAnswer.findOne({
            where: { attempt_id: attempt.id, question_id: qid },
        });
        if (existing) {
            throw new CustomError('Question déjà répondue', 400);
        }

        const question = await QuizQuestion.findByPk(qid);
        if (!question) {
            throw new CustomError('Question introuvable', 404);
        }

        const skipped = Boolean(answer.skipped);
        const timedOut = Boolean(answer.timedOut);
        let isCorrect =
            skipped || timedOut
                ? false
                : this.gradeAnswer(question.type, question.payload ?? {}, answer);
        const dailyTimeLimitSeconds = this.normalizeDailyTimeLimitSeconds(
            question.daily_time_limit_seconds
        );

        if (
            attempt.mode === 'daily' &&
            dailyTimeLimitSeconds > 0 &&
            question.type !== 'zoom'
        ) {
            if (!attempt.timer_started_at) {
                attempt.timer_started_at = new Date();
                await attempt.save();
            }
            const elapsed =
                Date.now() - new Date(attempt.timer_started_at).getTime();
            if (timedOut || elapsed > dailyTimeLimitSeconds * 1000) {
                isCorrect = false;
            }
        }

        const HINT_FORFEIT_TYPES = [
            'mcq',
            'true_false',
            'order',
            'name_the_cards',
            'summoner',
        ] as const;
        const usedHint = Boolean(answer.usedHint);
        const hintForfeitsPoints =
            attempt.mode === 'daily' &&
            usedHint &&
            (HINT_FORFEIT_TYPES as readonly string[]).includes(question.type);

        let pointsAwarded = 0;
        if (isCorrect && !timedOut && !skipped && !hintForfeitsPoints) {
            if (question.type === 'zoom') {
                const zoom = this.normalizeZoomPayload(question.payload ?? {});
                const clientPhase = Math.max(
                    1,
                    Math.min(3, Math.floor(Number(answer.phase) || 3))
                );
                // Anti-triche légère : elapsed client → phase min (pire score)
                const elapsedMs = Number(answer.elapsedMs);
                let phase = clientPhase;
                if (Number.isFinite(elapsedMs) && elapsedMs >= 0) {
                    const fromElapsed = this.zoomPhaseFromElapsedMs(
                        elapsedMs,
                        zoom.phaseDurationSeconds
                    );
                    phase = Math.max(clientPhase, fromElapsed);
                }
                pointsAwarded = this.zoomPointsForPhase(phase);
            } else if (question.type === 'hint_ladder') {
                const level = this.normalizeHintLadderLevel(
                    answer.level ?? answer.hintLevel ?? answer.hint_level
                );
                pointsAwarded = this.hintLadderPointsForLevel(level);
            } else if (attempt.mode === 'daily') {
                pointsAwarded = 1;
            } else {
                pointsAwarded = question.points;
            }
        }

        await QuizAnswer.create({
            attempt_id: attempt.id,
            question_id: qid,
            answer: skipped
                ? { ...answer, skipped: true }
                : timedOut
                  ? { ...answer, timedOut: true }
                  : answer,
            is_correct: isCorrect,
            points_awarded: pointsAwarded,
        });

        if (isCorrect) {
            attempt.score += pointsAwarded;
            await attempt.save();

            if (attempt.mode === 'daily' && pointsAwarded > 0) {
                const user = await User.findByPk(userId);
                if (user) {
                    user.quiz_points = (user.quiz_points ?? 0) + pointsAwarded;
                    await user.save();
                }
            }
        }

        const answeredCount = await QuizAnswer.count({ where: { attempt_id: attempt.id } });
        let justFinished = false;
        if (answeredCount >= attempt.question_ids.length) {
            attempt.status = 'finished';
            attempt.finished_at = new Date();
            await attempt.save();
            justFinished = true;
        }

        const userAfter = await User.findByPk(userId, { attributes: ['quiz_points'] });
        MedalService.evaluateSafe('onQuizAttemptProgress', () =>
            MedalService.onQuizAttemptProgress({
                userId,
                mode: attempt.mode,
                attemptScore: attempt.score,
                userQuizPoints: userAfter?.quiz_points ?? 0,
                justFinished,
            })
        );

        return this.getAttemptForUser(attempt.id, userId, locale);
    }

    static async finishAttempt(
        attemptId: string,
        userId: string,
        locale?: string | null
    ) {
        const attempt = await QuizAttempt.findByPk(attemptId);
        if (!attempt || String(attempt.user_id) !== String(userId)) {
            throw new CustomError('Tentative introuvable', 404);
        }
        if (attempt.status === 'finished') {
            return this.getAttemptForUser(attempt.id, userId, locale);
        }

        attempt.status = 'finished';
        attempt.finished_at = new Date();
        await attempt.save();

        const userAfter = await User.findByPk(userId, { attributes: ['quiz_points'] });
        MedalService.evaluateSafe('onQuizAttemptProgress', () =>
            MedalService.onQuizAttemptProgress({
                userId,
                mode: attempt.mode,
                attemptScore: attempt.score,
                userQuizPoints: userAfter?.quiz_points ?? 0,
                justFinished: true,
            })
        );

        return this.getAttemptForUser(attempt.id, userId, locale);
    }

    static validateAdminPayload(
        type: string,
        payload: Record<string, unknown>
    ): Record<string, unknown> {
        if (type === 'mcq') {
            const choices = Array.isArray(payload.choices)
                ? payload.choices.map((c) => this.normalizeMcqChoice(c))
                : [];
            const rawMode = String(payload.choicesMode ?? '').trim();
            const inferredCards =
                choices.length === 4 && choices.every((c) => Boolean(c.cardId));
            const choicesMode: 'text' | 'cards' =
                rawMode === 'cards' || rawMode === 'text'
                    ? rawMode
                    : inferredCards
                      ? 'cards'
                      : 'text';

            if (choices.length !== 4) {
                throw new CustomError(
                    'MCQ : exactement 4 propositions sont requises',
                    400
                );
            }

            if (choicesMode === 'cards') {
                if (choices.some((c) => !c.cardId)) {
                    throw new CustomError(
                        'MCQ (cartes) : chaque proposition doit avoir une carte sélectionnée',
                        400
                    );
                }
            } else if (choices.some((c) => !c.text.trim())) {
                throw new CustomError(
                    'MCQ (texte) : chaque proposition doit avoir un texte non vide',
                    400
                );
            }

            const normalized = choices.map((c) =>
                choicesMode === 'cards'
                    ? { text: c.text || '', cardId: c.cardId }
                    : { text: c.text.trim(), cardId: null }
            );
            const correctIndex = Number(payload.correctIndex);
            if (![0, 1, 2, 3].includes(correctIndex)) {
                throw new CustomError('MCQ : correctIndex doit être 0, 1, 2 ou 3', 400);
            }
            return { choicesMode, choices: normalized, correctIndex };
        }
        if (type === 'true_false') {
            if (typeof payload.correct !== 'boolean') {
                throw new CustomError('Vrai/Faux : correct (boolean) requis', 400);
            }
            return { correct: payload.correct };
        }
        if (type === 'order') {
            const items = (Array.isArray(payload.items) ? payload.items : []).map(
                (item, index) => this.normalizeOrderItem(item, index)
            );
            if (items.length !== 4) {
                throw new CustomError(
                    'Dans l\'ordre : exactement 4 propositions sont requises',
                    400
                );
            }
            if (items.some((item) => !item.label && !item.imageUrl)) {
                throw new CustomError(
                    'Dans l\'ordre : chaque proposition doit avoir un libellé ou une image',
                    400
                );
            }
            const ids = items.map((item) => item.id);
            if (new Set(ids).size !== ids.length) {
                throw new CustomError(
                    'Dans l\'ordre : les identifiants des propositions doivent être uniques',
                    400
                );
            }
            const correctOrder = Array.isArray(payload.correctOrder)
                ? payload.correctOrder.map((id) => String(id))
                : [];
            if (
                correctOrder.length !== 4 ||
                new Set(correctOrder).size !== 4 ||
                !correctOrder.every((id) => ids.includes(id))
            ) {
                throw new CustomError(
                    'Dans l\'ordre : correctOrder doit être une permutation des 4 propositions',
                    400
                );
            }
            return {
                items: items.map((item) => ({
                    id: item.id,
                    label: item.label,
                    imageUrl: item.imageUrl,
                })),
                correctOrder,
            };
        }
        if (type === 'name_the_cards') {
            const monsterCount = Math.max(
                1,
                Math.min(10, Number(payload.monsterCount) || 0)
            );
            const answers = (Array.isArray(payload.answers) ? payload.answers : []).map(
                (raw) => this.normalizeNameTheCardsAnswer(raw)
            );
            if (monsterCount < 1) {
                throw new CustomError(
                    'Trouvez le nom : le nombre de monstres doit être entre 1 et 10',
                    400
                );
            }
            if (answers.length !== monsterCount) {
                throw new CustomError(
                    `Trouvez le nom : exactement ${monsterCount} réponse(s) carte sont requises`,
                    400
                );
            }
            if (answers.some((a) => !a.cardId)) {
                throw new CustomError(
                    'Trouvez le nom : chaque réponse doit être une carte sélectionnée',
                    400
                );
            }
            return {
                monsterCount,
                answers: answers.map((a) => ({
                    cardId: a.cardId,
                    label: a.label,
                })),
            };
        }
        if (type === 'summoner') {
            const propositions = (
                Array.isArray(payload.propositions)
                    ? payload.propositions
                    : Array.isArray(payload.answers)
                      ? payload.answers
                      : []
            ).map((raw) => this.normalizeSummonerProposition(raw));
            // Ancien format answers sans isMaterial → toutes matériaux
            const normalized =
                Array.isArray(payload.propositions) && payload.propositions.length > 0
                    ? propositions
                    : propositions.map((p) => ({ ...p, isMaterial: true }));

            if (normalized.length < 2 || normalized.length > 10) {
                throw new CustomError(
                    'Invocateur : entre 2 et 10 propositions sont requises',
                    400
                );
            }
            if (normalized.some((p) => !p.cardId)) {
                throw new CustomError(
                    'Invocateur : chaque proposition doit être une carte sélectionnée',
                    400
                );
            }
            const materials = normalized.filter((p) => p.isMaterial);
            if (materials.length < 1) {
                throw new CustomError(
                    'Invocateur : cochez au moins un matériau',
                    400
                );
            }
            return {
                propositions: normalized.map((p) => ({
                    cardId: p.cardId,
                    label: p.label,
                    isMaterial: p.isMaterial,
                })),
            };
        }
        if (type === 'zoom') {
            const zoom = this.normalizeZoomPayload(payload);
            if (!zoom.cardId) {
                throw new CustomError(
                    'Zoom : sélectionnez la carte réponse via l\'autocomplétion',
                    400
                );
            }
            return {
                cardId: zoom.cardId,
                label: zoom.label,
                focusX: zoom.focusX,
                focusY: zoom.focusY,
                phaseDurationSeconds: zoom.phaseDurationSeconds,
            };
        }
        if (type === 'hint_ladder') {
            const ladder = this.normalizeHintLadderPayload(payload);
            if (!ladder.cardId) {
                throw new CustomError(
                    'Indices : sélectionnez la carte réponse via l\'autocomplétion',
                    400
                );
            }
            for (const level of HINT_LADDER_LEVELS) {
                if (!ladder.hints[level]) {
                    throw new CustomError(
                        `Indices : l'indice « ${level} » est obligatoire`,
                        400
                    );
                }
            }
            return {
                cardId: ladder.cardId,
                label: ladder.label,
                hints: { ...ladder.hints },
            };
        }
        throw new CustomError('Type de question non géré en admin pour le moment', 400);
    }

    static async resolveOrderItemsImages(
        items: OrderItemStored[],
        quizType: string = 'order'
    ): Promise<OrderItemStored[]> {
        const resolved: OrderItemStored[] = [];
        for (const item of items) {
            resolved.push({
                ...item,
                imageUrl: await this.resolveImageUrl(item.imageUrl, quizType),
            });
        }
        return resolved;
    }

    static async serializeAdminQuestion(
        question: QuizQuestion,
        theme?: QuizTheme | null,
        season?: QuizSeason | null
    ) {
        const payload = question.payload ?? {};
        let adminPayload: Record<string, unknown> = { ...payload };
        if (question.type === 'mcq' && Array.isArray(payload.choices)) {
            const stored = payload.choices.map((c) => this.normalizeMcqChoice(c));
            const enriched = await this.enrichMcqChoices(stored);
            const choicesMode =
                payload.choicesMode === 'cards' || payload.choicesMode === 'text'
                    ? payload.choicesMode
                    : enriched.every((c) => Boolean(c.cardId))
                      ? 'cards'
                      : 'text';
            adminPayload = {
                ...payload,
                choicesMode,
                choices: enriched.map((c) => ({
                    text: c.text,
                    cardId: c.cardId,
                    name: c.name,
                    artworkUrl: c.artworkUrl,
                })),
            };
        }

        if (question.type === 'name_the_cards') {
            const answers = (
                Array.isArray(payload.answers) ? payload.answers : []
            ).map((raw) => this.normalizeNameTheCardsAnswer(raw));
            const enriched = await this.enrichNameTheCardsAnswers(answers);
            adminPayload = {
                ...payload,
                monsterCount: Math.max(
                    1,
                    Math.min(10, Number(payload.monsterCount) || answers.length || 1)
                ),
                answers: enriched,
            };
        }

        if (question.type === 'summoner') {
            const propositions = this.extractSummonerPropositions(payload);
            const enriched = await this.enrichNameTheCardsAnswers(
                propositions.map((p) => ({ cardId: p.cardId, label: p.label }))
            );
            adminPayload = {
                ...payload,
                propositions: enriched.map((item, index) => ({
                    cardId: item.cardId,
                    label: item.label || item.name || '',
                    name: item.name,
                    artworkUrl: item.artworkUrl,
                    isMaterial: propositions[index]?.isMaterial ?? false,
                })),
            };
        }

        if (question.type === 'zoom') {
            const zoom = this.normalizeZoomPayload(payload);
            const enriched = await this.enrichNameTheCardsAnswers([
                { cardId: zoom.cardId, label: zoom.label },
            ]);
            adminPayload = {
                ...zoom,
                name: enriched[0]?.name ?? zoom.label,
                artworkUrl: enriched[0]?.artworkUrl ?? null,
            };
        }

        if (question.type === 'hint_ladder') {
            const ladder = this.normalizeHintLadderPayload(payload);
            const enriched = await this.enrichNameTheCardsAnswers([
                { cardId: ladder.cardId, label: ladder.label },
            ]);
            adminPayload = {
                ...ladder,
                name: enriched[0]?.name ?? ladder.label,
                artworkUrl: enriched[0]?.artworkUrl ?? null,
            };
        }


        return {
            id: this.toNumberId(question.id),
            theme_id: this.toNumberId(question.theme_id),
            theme: theme
                ? {
                      id: this.toNumberId(theme.id),
                      slug: theme.slug,
                      label: theme.label,
                  }
                : null,
            type: question.type,
            prompt: question.prompt,
            keywords: Array.isArray(question.keywords)
                ? question.keywords.map((k) => String(k))
                : [],
            payload: adminPayload,
            points: this.questionMaxPoints(question),
            is_active: question.is_active,
            difficulty: question.difficulty ?? 'medium',
            for_daily: Boolean(question.for_daily),
            was_daily_question: Boolean(question.was_daily_question),
            daily_time_limit_seconds: this.normalizeDailyTimeLimitSeconds(
                question.daily_time_limit_seconds
            ),
            season_id: question.season_id
                ? this.toNumberId(question.season_id)
                : null,
            scheduled_date: question.scheduled_date
                ? String(question.scheduled_date).slice(0, 10)
                : null,
            season: season
                ? {
                      id: this.toNumberId(season.id),
                      name: season.name,
                      startDate: season.start_date,
                      endDate: season.end_date,
                  }
                : null,
            image_url: question.image_url ?? null,
            hint: question.hint ?? null,
            explanation: question.explanation ?? null,
            explanation_image_url: question.explanation_image_url ?? null,
            created_at: question.created_at,
            updated_at: question.updated_at,
        };
    }

    static async resolveSeasonIdForSchedule(
        seasonIdRaw: unknown
    ): Promise<number | null> {
        if (
            seasonIdRaw === null ||
            seasonIdRaw === undefined ||
            seasonIdRaw === ''
        ) {
            return null;
        }
        const seasonId = Number(seasonIdRaw);
        if (!Number.isFinite(seasonId) || seasonId <= 0) {
            throw new CustomError(
                'Une saison Daily Quizz est requise pour planifier une question',
                400
            );
        }
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);
        return this.toNumberId(season.id);
    }

    static async resolveScheduledDateForSchedule(
        seasonId: number | null,
        scheduledDateRaw: unknown
    ): Promise<string | null> {
        if (!seasonId) return null;
        const scheduledDate = String(scheduledDateRaw ?? '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
            throw new CustomError(
                'Une date (jour) est requise pour planifier la question du défi du jour',
                400
            );
        }
        const season = await QuizSeason.findByPk(seasonId);
        if (!season) throw new CustomError('Saison introuvable', 404);
        if (
            scheduledDate < season.start_date ||
            scheduledDate > season.end_date
        ) {
            throw new CustomError(
                `La date doit être comprise entre ${season.start_date} et ${season.end_date}`,
                400
            );
        }
        return scheduledDate;
    }

    static async listAdminQuestions(filters: {
        themeSlug?: string;
        type?: string;
        isActive?: boolean;
        forDaily?: boolean;
        wasDailyQuestion?: boolean;
        difficulty?: string;
        seasonId?: number;
        limit?: number;
    }) {
        const where: Record<string, unknown> = {};
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.isActive !== undefined) {
            where.is_active = filters.isActive;
        }
        if (filters.forDaily !== undefined) {
            where.for_daily = filters.forDaily;
        }
        if (filters.wasDailyQuestion !== undefined) {
            where.was_daily_question = filters.wasDailyQuestion;
        }
        if (filters.difficulty) {
            where.difficulty = this.normalizeDifficulty(filters.difficulty);
        }
        if (filters.seasonId !== undefined) {
            where.season_id = filters.seasonId;
        }
        if (filters.themeSlug) {
            const theme = await this.getThemeBySlug(filters.themeSlug);
            where.theme_id = theme.id;
        }

        const questions = await QuizQuestion.findAll({
            where,
            include: [
                { model: QuizTheme, as: 'theme' },
                { model: QuizSeason, as: 'season' },
            ],
            order: [
                ['created_at', 'DESC'],
                ['id', 'DESC'],
            ],
            limit:
                filters.limit && Number.isFinite(filters.limit)
                    ? Math.max(1, Math.min(100, filters.limit))
                    : undefined,
        });

        return Promise.all(
            questions.map((q) =>
                this.serializeAdminQuestion(
                    q,
                    (q as QuizQuestion & { theme?: QuizTheme }).theme,
                    (q as QuizQuestion & { season?: QuizSeason }).season
                )
            )
        );
    }

    static async createAdminQuestion(data: {
        themeSlug: string;
        type: string;
        prompt: string;
        keywords?: unknown;
        payload: Record<string, unknown>;
        points?: number;
        is_active?: boolean;
        for_daily?: boolean;
        was_daily_question?: boolean;
        daily_time_limit_seconds?: number;
        difficulty?: string;
        season_id?: number | null;
        scheduled_date?: string | null;
        image_url?: string | null;
        hint?: string | null;
        explanation?: string | null;
        explanation_image_url?: string | null;
    }) {
        const type = String(data.type).trim();
        if (!PLAYABLE_TYPES.includes(type as (typeof PLAYABLE_TYPES)[number])) {
            throw new CustomError(
                'Type invalide (mcq | true_false | order | name_the_cards | summoner | zoom | hint_ladder)',
                400
            );
        }
        const themeSlug = (
            CARD_GAME_QUESTION_TYPES as readonly string[]
        ).includes(type)
            ? CARD_GAME_THEME_SLUG
            : data.themeSlug;
        const theme = await this.getThemeBySlug(themeSlug);
        if (theme.slug === FREE_PLAY_ALL_SLUG) {
            throw new CustomError('Impossible d\'assigner une question au thème « Toutes les questions »', 400);
        }
        const prompt = String(data.prompt ?? '').trim();
        if (!prompt) throw new CustomError('Énoncé requis', 400);

        let payload = this.validateAdminPayload(type, data.payload ?? {});
        if (type === 'order' && Array.isArray(payload.items)) {
            const items = await this.resolveOrderItemsImages(
                payload.items.map((item, index) =>
                    this.normalizeOrderItem(item, index)
                ),
                type
            );
            payload = { ...payload, items };
        }
        const points =
            type === 'zoom'
                ? ZOOM_MAX_POINTS
                : type === 'hint_ladder'
                  ? HINT_LADDER_MAX_POINTS
                  : Math.max(1, Number(data.points) || 1);
        let imageUrl = await this.resolveImageUrl(data.image_url, type);
        if (type === 'zoom' && !imageUrl) {
            const zoom = this.normalizeZoomPayload(payload);
            imageUrl = zoom.cardId
                ? CardService.croppedArtworkUrlFromId(zoom.cardId)
                : null;
        }
        if (type === 'hint_ladder') {
            imageUrl = null;
        }
        if (
            (type === 'name_the_cards' || type === 'summoner' || type === 'zoom') &&
            !imageUrl
        ) {
            throw new CustomError(
                type === 'summoner'
                    ? 'Invocateur : une image de question est obligatoire'
                    : type === 'zoom'
                      ? 'Zoom : sélectionnez une carte réponse'
                      : 'Trouvez le nom : une image de question est obligatoire',
                400
            );
        }
        const difficulty = this.normalizeDifficulty(data.difficulty);
        const forDaily = Boolean(data.for_daily);
        let seasonId: number | null = null;
        let scheduledDate: string | null = null;
        if (forDaily) {
            const rawSeason = data.season_id;
            const rawDate = String(data.scheduled_date ?? '').trim();
            const hasSeason = rawSeason != null && Number(rawSeason) > 0;
            const hasDate = Boolean(rawDate);
            if (hasSeason !== hasDate) {
                throw new CustomError(
                    'Saison et date sont requises ensemble pour planifier une question (sinon laissez les deux vides pour le pool)',
                    400
                );
            }
            if (hasSeason) {
                seasonId = await this.resolveSeasonIdForSchedule(data.season_id);
                scheduledDate = await this.resolveScheduledDateForSchedule(
                    seasonId,
                    data.scheduled_date
                );
            }
        }
        let question: QuizQuestion;
        try {
            question = await QuizQuestion.create({
                theme_id: this.toNumberId(theme.id),
                type: type as (typeof PLAYABLE_TYPES)[number],
                prompt,
                keywords: this.normalizeKeywords(data.keywords),
                payload,
                points,
                is_active: data.is_active !== false,
                for_daily: forDaily,
                was_daily_question: false,
                season_id: seasonId,
                scheduled_date: scheduledDate,
                daily_time_limit_seconds:
                    type === 'zoom'
                        ? 0
                        : this.normalizeDailyTimeLimitSeconds(
                              data.daily_time_limit_seconds
                          ),
                difficulty,
                image_url: imageUrl,
                hint:
                    type === 'zoom' || type === 'hint_ladder'
                        ? null
                        : this.normalizeOptionalText(data.hint),
                explanation:
                    type === 'zoom' || type === 'hint_ladder'
                        ? null
                        : this.normalizeOptionalText(data.explanation),
                explanation_image_url:
                    type === 'zoom' || type === 'hint_ladder'
                        ? null
                        : await this.resolveImageUrl(
                              data.explanation_image_url,
                              type
                          ),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message.includes('uq_quiz_question_season_scheduled_date')) {
                throw new CustomError(
                    'Une question est déjà planifiée pour ce jour dans cette saison',
                    400
                );
            }
            throw error;
        }

        const season = seasonId ? await QuizSeason.findByPk(seasonId) : null;
        return this.serializeAdminQuestion(question, theme, season);
    }

    static async updateAdminQuestion(
        questionId: number,
        data: {
            themeSlug?: string;
            type?: string;
            prompt?: string;
            keywords?: unknown;
            payload?: Record<string, unknown>;
            points?: number;
            is_active?: boolean;
            for_daily?: boolean;
            was_daily_question?: boolean;
            daily_time_limit_seconds?: number;
            difficulty?: string;
            season_id?: number | null;
            scheduled_date?: string | null;
            image_url?: string | null;
            hint?: string | null;
            explanation?: string | null;
            explanation_image_url?: string | null;
        }
    ) {
        const question = await QuizQuestion.findByPk(questionId);
        if (!question) throw new CustomError('Question introuvable', 404);

        let theme = await QuizTheme.findByPk(question.theme_id);
        if (data.type !== undefined) {
            const type = String(data.type).trim();
            if (!PLAYABLE_TYPES.includes(type as (typeof PLAYABLE_TYPES)[number])) {
                throw new CustomError(
                    'Type invalide (mcq | true_false | order | name_the_cards | summoner | zoom | hint_ladder)',
                    400
                );
            }
            question.type = type as (typeof PLAYABLE_TYPES)[number];
            if (type === 'zoom') {
                question.points = ZOOM_MAX_POINTS;
            }
            if (type === 'hint_ladder') {
                question.points = HINT_LADDER_MAX_POINTS;
            }
        }

        const effectiveType = question.type;
        if (
            (CARD_GAME_QUESTION_TYPES as readonly string[]).includes(effectiveType)
        ) {
            theme = await this.getThemeBySlug(CARD_GAME_THEME_SLUG);
            question.theme_id = this.toNumberId(theme.id);
        } else if (data.themeSlug) {
            theme = await this.getThemeBySlug(data.themeSlug);
            if (theme.slug === FREE_PLAY_ALL_SLUG) {
                throw new CustomError(
                    'Impossible d\'assigner une question au thème « Toutes les questions »',
                    400
                );
            }
            question.theme_id = this.toNumberId(theme.id);
        }

        if (data.prompt !== undefined) {
            const prompt = String(data.prompt).trim();
            if (!prompt) throw new CustomError('Énoncé requis', 400);
            question.prompt = prompt;
        }

        if (data.keywords !== undefined) {
            question.keywords = this.normalizeKeywords(data.keywords);
        }

        if (data.payload !== undefined) {
            let payload = this.validateAdminPayload(question.type, data.payload);
            if (question.type === 'order' && Array.isArray(payload.items)) {
                const items = await this.resolveOrderItemsImages(
                    payload.items.map((item, index) =>
                        this.normalizeOrderItem(item, index)
                    ),
                    question.type
                );
                payload = { ...payload, items };
            }
            question.payload = payload;
        }

        if (
            data.points !== undefined &&
            question.type !== 'zoom' &&
            question.type !== 'hint_ladder'
        ) {
            question.points = Math.max(1, Number(data.points) || 1);
        }
        if (question.type === 'zoom') {
            question.points = ZOOM_MAX_POINTS;
        }
        if (question.type === 'hint_ladder') {
            question.points = HINT_LADDER_MAX_POINTS;
        }

        if (data.is_active !== undefined) {
            question.is_active = Boolean(data.is_active);
        }

        if (data.for_daily !== undefined) {
            question.for_daily = Boolean(data.for_daily);
        }

        if (question.for_daily === false) {
            // Question libre : pas de créneau Daily
            if (
                data.for_daily === false ||
                data.season_id !== undefined ||
                data.scheduled_date !== undefined
            ) {
                question.season_id = null;
                question.scheduled_date = null;
            }
        } else if (
            data.season_id !== undefined ||
            data.scheduled_date !== undefined
        ) {
            const nextSeasonId =
                data.season_id !== undefined
                    ? await this.resolveSeasonIdForSchedule(data.season_id)
                    : question.season_id
                      ? this.toNumberId(question.season_id)
                      : null;

            const clearingSchedule =
                data.season_id === null || data.scheduled_date === null;
            let nextScheduledDate: string | null = null;
            if (clearingSchedule && nextSeasonId == null) {
                nextScheduledDate = null;
            } else if (
                data.scheduled_date !== undefined ||
                data.season_id !== undefined
            ) {
                const rawDate =
                    data.scheduled_date !== undefined
                        ? data.scheduled_date
                        : question.scheduled_date;
                if (nextSeasonId == null && (rawDate == null || rawDate === '')) {
                    nextScheduledDate = null;
                } else {
                    nextScheduledDate =
                        await this.resolveScheduledDateForSchedule(
                            nextSeasonId,
                            rawDate
                        );
                }
            } else {
                nextScheduledDate = question.scheduled_date
                    ? String(question.scheduled_date).slice(0, 10)
                    : null;
            }

            if ((nextSeasonId && !nextScheduledDate) || (!nextSeasonId && nextScheduledDate)) {
                throw new CustomError(
                    'Saison et date sont requises ensemble pour planifier une question (sinon laissez les deux vides pour le pool)',
                    400
                );
            }

            question.season_id = nextSeasonId;
            question.scheduled_date = nextScheduledDate;
            question.for_daily = true;
        }

        // Historique : was_daily ne peut jamais repasser à false via l'API métier
        if (data.was_daily_question === true) {
            question.was_daily_question = true;
        }

        if (question.type === 'zoom') {
            question.daily_time_limit_seconds = 0;
        } else if (data.daily_time_limit_seconds !== undefined) {
            question.daily_time_limit_seconds = this.normalizeDailyTimeLimitSeconds(
                data.daily_time_limit_seconds
            );
        }

        if (data.difficulty !== undefined) {
            question.difficulty = this.normalizeDifficulty(data.difficulty);
        }

        if (data.image_url !== undefined) {
            question.image_url = await this.resolveImageUrl(
                data.image_url,
                question.type
            );
        }

        if (question.type === 'zoom') {
            const zoom = this.normalizeZoomPayload(
                (question.payload ?? {}) as Record<string, unknown>
            );
            if (zoom.cardId) {
                const fromCard = await this.resolveImageUrl(
                    data.image_url ??
                        CardService.croppedArtworkUrlFromId(zoom.cardId),
                    question.type
                );
                question.image_url =
                    fromCard ?? CardService.croppedArtworkUrlFromId(zoom.cardId);
            }
        }

        if (question.type === 'hint_ladder' || question.type === 'zoom') {
            question.hint = null;
            question.explanation = null;
            question.explanation_image_url = null;
        }
        if (question.type === 'hint_ladder') {
            question.image_url = null;
        }

        if (
            (question.type === 'name_the_cards' ||
                question.type === 'summoner' ||
                question.type === 'zoom') &&
            !question.image_url
        ) {
            throw new CustomError(
                question.type === 'summoner'
                    ? 'Invocateur : une image de question est obligatoire'
                    : question.type === 'zoom'
                      ? 'Zoom : sélectionnez une carte réponse'
                      : 'Trouvez le nom : une image de question est obligatoire',
                400
            );
        }

        if (
            data.hint !== undefined &&
            question.type !== 'hint_ladder' &&
            question.type !== 'zoom'
        ) {
            question.hint = this.normalizeOptionalText(data.hint);
        }

        if (
            data.explanation !== undefined &&
            question.type !== 'hint_ladder' &&
            question.type !== 'zoom'
        ) {
            question.explanation = this.normalizeOptionalText(data.explanation);
        }

        if (
            data.explanation_image_url !== undefined &&
            question.type !== 'hint_ladder' &&
            question.type !== 'zoom'
        ) {
            question.explanation_image_url = await this.resolveImageUrl(
                data.explanation_image_url,
                question.type
            );
        }

        try {
            await question.save();
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message.includes('uq_quiz_question_season_scheduled_date')) {
                throw new CustomError(
                    'Une question est déjà planifiée pour ce jour dans cette saison',
                    400
                );
            }
            throw error;
        }
        const season = question.season_id
            ? await QuizSeason.findByPk(question.season_id)
            : null;
        return this.serializeAdminQuestion(question, theme, season);
    }

    static async deleteAdminQuestion(questionId: number) {
        const question = await QuizQuestion.findByPk(questionId);
        if (!question) throw new CustomError('Question introuvable', 404);
        await question.destroy();
        return { success: true };
    }

    static async switchAllToInactive(ids?: number[]): Promise<{ updated: number }> {
        if (!ids || ids.length === 0) {
            throw new CustomError('Aucune question sélectionnée', 400);
        }
        const [updated] = await QuizQuestion.update(
            { is_active: false },
            { where: { id: { [Op.in]: ids } } }
        );
        return { updated };
    }

    static async switchAllToActive(ids?: number[]): Promise<{ updated: number }> {
        if (!ids || ids.length === 0) {
            throw new CustomError('Aucune question sélectionnée', 400);
        }
        const [updated] = await QuizQuestion.update(
            { is_active: true },
            { where: { id: { [Op.in]: ids } } }
        );
        return { updated };
    }

    /**
     * Libère les créneaux (saison/date) des questions ciblées.
     * Les questions restent dans le pool Daily (`for_daily`) si elles y étaient.
     */
    static async switchAllToNonDaily(ids?: number[]): Promise<{ updated: number }> {
        if (!ids || ids.length === 0) {
            throw new CustomError('Aucune question sélectionnée', 400);
        }
        const [updated] = await QuizQuestion.update(
            { season_id: null, scheduled_date: null },
            {
                where: {
                    id: { [Op.in]: ids },
                    season_id: { [Op.ne]: null },
                },
            }
        );
        return { updated };
    }

    /**
     * Stats quiz du joueur : total daily + points par saison (session).
     */
    static async getMyStats(userId: string): Promise<{
        quizPoints: number;
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
            attemptsCount: number;
        }>;
    }> {
        const user = await User.findByPk(userId, { attributes: ['id', 'quiz_points'] });
        if (!user) throw new CustomError('Utilisateur introuvable', 404);

        const rows = await sequelize.query<{
            season_id: string | number;
            name: string;
            start_date: string;
            end_date: string;
            image_url: string | null;
            image_focal_x: string | number | null;
            image_focal_y: string | number | null;
            image_zoom: string | number | null;
            points: string | number;
            attempts_count: string | number;
        }>(
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
                COALESCE(SUM(ans.points_awarded), 0) AS points,
                COUNT(DISTINCT a.id)::int AS attempts_count
            FROM quiz_season s
            INNER JOIN quiz_attempt a
                ON a.mode = 'daily'
               AND a.status = 'finished'
               AND a.user_id = :userId
               AND a.daily_date IS NOT NULL
               AND a.daily_date >= s.start_date
               AND a.daily_date <= s.end_date
            INNER JOIN quiz_answer ans ON ans.attempt_id = a.id
            INNER JOIN quiz_question q ON q.id = ans.question_id
            LEFT JOIN quiz_daily d
                ON d.quiz_date = a.daily_date
               AND (
                    a.season_id IS NULL
                    OR d.season_id = a.season_id
               )
            WHERE COALESCE(
                    a.season_id,
                    q.season_id,
                    d.season_id,
                    (
                        SELECT s3.id
                        FROM quiz_season s3
                        WHERE a.daily_date >= s3.start_date
                          AND a.daily_date <= s3.end_date
                        ORDER BY s3.allows_overlap ASC, s3.start_date DESC, s3.id DESC
                        LIMIT 1
                    )
                ) = s.id
            GROUP BY s.id, s.name, s.start_date, s.end_date, s.image_url, s.image_focal_x, s.image_focal_y, s.image_zoom
            ORDER BY s.start_date DESC
            `,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

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

        return {
            quizPoints: user.quiz_points ?? 0,
            seasons: rows.map((row) => ({
                seasonId: Number(row.season_id),
                name: row.name,
                startDate: String(row.start_date).slice(0, 10),
                endDate: String(row.end_date).slice(0, 10),
                imageUrl: row.image_url ? String(row.image_url) : null,
                imageFocalX: clampFocal(row.image_focal_x, 50),
                imageFocalY: clampFocal(row.image_focal_y, 50),
                imageZoom: clampZoom(row.image_zoom, 100),
                points: Number(row.points) || 0,
                attemptsCount: Number(row.attempts_count) || 0,
            })),
        };
    }
}

export default QuizService;
