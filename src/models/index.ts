import sequelize from '../config/Sequelize';
import './associations';
import logger from '../utils/logger';

// Fonction pour synchroniser la base de données
export const syncDatabase = async (force: boolean = false): Promise<void> => {
    try {
        await sequelize.sync({ force });
        logger.info('Base de données synchronisée avec succès');
    } catch (error) {
        logger.logError('Erreur lors de la synchronisation de la base de données', error instanceof Error ? error : null);
        throw error;
    }
};

// Fonction pour tester la connexion à la base de données
export const testConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        logger.info('Connexion à la base de données établie avec succès');
    } catch (error) {
        logger.logError('Impossible de se connecter à la base de données', error instanceof Error ? error : null);
        throw error;
    }
};

// Export des modèles
export {
    User,
    Role,
    Deck,
    DeckCard,
    Card,
    Archetype,
    Era,
    Attribute,
    SummonMechanic,
    CardType,
    Banlist,
    CardStatus,
    BanlistArchetypeCard,
    ArchetypeType,
    ArchetypeAttribute,
    ArchetypeSummonMechanic
} from './associations';
