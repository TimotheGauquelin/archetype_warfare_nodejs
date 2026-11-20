import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authenticateRoutes from './routes/AuthenticateRoute';
import banlistRoutes from './routes/BanlistRoute';
import banlistReasonRoutes from './routes/BanlistReasonRoute';
import archetypeRoutes from './routes/ArchetypeRoute';
import typeRoutes from './routes/TypeRoute';
import summonMechanicRoutes from './routes/SummonMechanicRoute';
import attributeRoutes from './routes/AttributeRoute';
import eraRoutes from './routes/EraRoute';
import cardRoutes from './routes/CardRoute';
import cardTypeRoutes from './routes/CardTypeRoute';
import cardStatusRoutes from './routes/CardStatusRoute';
import userRoutes from './routes/UserRoute';
import uploadImageRoutes from './routes/UploadImageRoute';
import deckRoutes from './routes/DeckRoute';
import tournamentRoutes from './routes/TournamentRoute';
import { ErrorHandler } from './middlewares/errorHandler';
import path from 'path';
import './models/relations';
import { limiter } from './middlewares/rateLimitMiddleware';
import websiteActionsRoutes from './routes/WebsiteActionsRoute';
import archetypeRankingRoutes from './routes/ArchetypeRankingRoute';
import quizRoutes from './routes/QuizRoute';
import medalRoutes from './routes/MedalRoute';
import envVars from './config/envValidation';
import logger from './utils/logger';

// Validation des variables d'environnement au démarrage
logger.info('✅ Variables d\'environnement validées avec succès');

const app: Express = express();
const apiRouter = express.Router();

// Derrière Docker / reverse-proxy (rate-limit IP réelle)
app.set('trust proxy', 1);

app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'none'"],
                formAction: ["'none'"],
            },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

const corsOptions: cors.CorsOptions = {
    origin: [
        envVars.FRONTEND_URL,
        envVars.FRONTEND_URL.replace(/\/$/, ''),
        'https://archetype-warfare-reactjs.onrender.com',
        'https://archetype-warfare-reactjs.onrender.com/',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match'],
    exposedHeaders: ['ETag'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(limiter);
// Upload images (base64) : limite plus haute uniquement sur /api/images
app.use('/api/images', express.json({ limit: '10mb' }));
app.use('/api/images', express.urlencoded({ limit: '10mb', extended: true }));
// Sync cartes YGO (dump complet) : POST /api/cards
app.use('/api/cards', express.json({ limit: '50mb' }));
app.use('/api/cards', express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.use('/api', apiRouter);
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Routes
apiRouter.use('/authenticate', authenticateRoutes);
apiRouter.use('/banlists', banlistRoutes);
apiRouter.use('/banlist-reasons', banlistReasonRoutes);
apiRouter.use('/archetypes', archetypeRoutes);
apiRouter.use('/types', typeRoutes);
apiRouter.use('/summon-mechanics', summonMechanicRoutes);
apiRouter.use('/attributes', attributeRoutes);
apiRouter.use('/eras', eraRoutes);
apiRouter.use('/cards', cardRoutes);
apiRouter.use('/card-types', cardTypeRoutes);
apiRouter.use('/card-statuses', cardStatusRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/images', uploadImageRoutes);
apiRouter.use('/decks', deckRoutes);
apiRouter.use('/tournaments', tournamentRoutes);
apiRouter.use('/website-actions', websiteActionsRoutes);
apiRouter.use('/archetype-rankings', archetypeRankingRoutes);
apiRouter.use('/quizzes', quizRoutes);
apiRouter.use('/medals', medalRoutes);

// ErrorHandler doit être après toutes les routes
app.use(ErrorHandler);

export default app;