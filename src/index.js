import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import authenticateRoutes from './routes/AuthenticateRoute.js';
import banlistRoutes from './routes/BanlistRoute.js'
import archetypeRoutes from './routes/ArchetypeRoute.js'
import typeRoutes from './routes/TypeRoute.js'
import summonMechanicRoutes from './routes/SummonMechanicRoute.js'
import attributeRoutes from './routes/AttributeRoute.js'
import eraRoutes from './routes/EraRoute.js'
import cardRoutes from './routes/CardRoute.js'
import cardTypeRoutes from './routes/CardTypeRoute.js'
import cardStatusRoutes from './routes/CardStatusRoute.js'
import userRoutes from './routes/UserRoute.js'
import { ErrorHandler } from "./middlewares/errorHandler.js";
import path from 'path';
import { fileURLToPath } from 'url';
import './models/relations.js';

dotenv.config();

const app = express();
const apiRouter = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiRouter);
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(ErrorHandler);

// Routes
apiRouter.use('/authenticate', authenticateRoutes)
apiRouter.use('/banlists', banlistRoutes)
apiRouter.use('/archetypes', archetypeRoutes)
apiRouter.use('/types', typeRoutes)
apiRouter.use('/summon-mechanics', summonMechanicRoutes)
apiRouter.use('/attributes', attributeRoutes)
apiRouter.use('/eras', eraRoutes)
apiRouter.use('/cards', cardRoutes)
apiRouter.use('/card-types', cardTypeRoutes)
apiRouter.use('/card-statuses', cardStatusRoutes)
apiRouter.use('/users', userRoutes)


export default app;