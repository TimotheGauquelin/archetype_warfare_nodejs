import app from './index.js';
import sequelize from './config/Sequelize.js';

// export const startServer = async () => {
//     try {
//         // Synchronisation de la base de données
//         await sequelize.sync();
//         console.log('Base de données synchronisée avec succès');

//         const port = process.env.API_PORT || 3005;
//         const server = app.listen(port, () => {
//             console.log(`L'API est lancée sur le port ${port}`);
//         });
//         return server;
//     } catch (error) {
//         console.error('Erreur lors du démarrage du serveur:', error);
//         process.exit(1); // Arrête le processus en cas d'erreur
//     }
// };

// // Export de l'application pour les tests
// export default app;

// // Démarrage du serveur uniquement si le fichier est exécuté directement
// if (process.argv[1] === import.meta.url) {
//     startServer();
// } 

app.listen(process.env.API_PORT || 3005, () => {
    console.log(
        `L'API est lancé sur le port ${process.env.API_PORT}`
    );
});