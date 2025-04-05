import sequelize from '../config/Sequelize.js';
import './associations.js';

// Fonction pour synchroniser la base de données
export const syncDatabase = async () => {
    try {
        await sequelize.sync({ force });
        console.log('Base de données synchronisée avec succès');
    } catch (error) {
        console.error('Erreur lors de la synchronisation de la base de données:', error);
        throw error;
    }
};

// Fonction pour tester la connexion à la base de données
export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connexion à la base de données établie avec succès');
    } catch (error) {
        console.error('Impossible de se connecter à la base de données:', error);
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
} from './associations.js'; 