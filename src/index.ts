import express, { Express } from 'express';
import cors from 'cors';
import authenticateRoutes from './routes/AuthenticateRoute';
import banlistRoutes from './routes/BanlistRoute';
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
// import { limiter } from './middlewares/rateLimitMiddleware';
import websiteActionsRoutes from './routes/WebsiteActionsRoute';
import archetypeRankingRoutes from './routes/ArchetypeRankingRoute';
import envVars from './config/envValidation';
import logger from './utils/logger';

// Validation des variables d'environnement au démarrage
logger.info('✅ Variables d\'environnement validées avec succès');

const app: Express = express();
const apiRouter = express.Router();

const corsOptions: cors.CorsOptions = {
    origin: [envVars.FRONTEND_URL, 'https://archetype-warfare-reactjs.onrender.com/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};

app.use(cors(corsOptions));
// app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', apiRouter);
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Routes
apiRouter.use('/authenticate', authenticateRoutes);
apiRouter.use('/banlists', banlistRoutes);
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

// ErrorHandler doit être après toutes les routes
app.use(ErrorHandler);

export default app;
