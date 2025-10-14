import { User, Role } from './src/models/relations.js';
import sequelize from './src/config/Sequelize.js';

async function debugRoles() {
    try {
        console.log('=== DEBUG ROLES ===');

        // 1. Vérifier les rôles existants
        const roles = await Role.findAll();
        console.log('Rôles disponibles:', roles.map(r => ({ id: r.id, label: r.label })));

        // 2. Lister tous les utilisateurs pour trouver l'Admin
        const allUsers = await User.findAll({
            include: [{
                model: Role,
                as: 'roles'
            }]
        });

        console.log('Tous les utilisateurs:', allUsers.map(u => ({
            id: u.id,
            email: u.email,
            username: u.username,
            roles: u.roles?.map(r => r.label) || [],
            rolesCount: u.roles?.length || 0
        })));

        // 3. Vérifier l'utilisateur Admin (premier utilisateur actif)
        const adminUser = allUsers.find(u => u.is_active) || allUsers[0];

        console.log('Utilisateur Admin trouvé:', {
            id: adminUser?.id,
            email: adminUser?.email,
            roles: adminUser?.roles?.map(r => r.label) || [],
            rolesCount: adminUser?.roles?.length || 0
        });

        // 4. Assigner le rôle Admin à l'utilisateur admin@archetypewarfare.com
        const adminUserToFix = allUsers.find(u => u.email === 'admin@archetypewarfare.com');

        if (adminUserToFix && (!adminUserToFix.roles || adminUserToFix.roles.length === 0)) {
            console.log('Assignation du rôle Admin à admin@archetypewarfare.com...');

            // Trouver le rôle Admin
            const adminRole = await Role.findOne({ where: { label: 'Admin' } });

            if (adminRole) {
                await adminUserToFix.addRole(adminRole);
                console.log('Rôle Admin assigné avec succès!');

                // Recharger l'utilisateur avec ses rôles
                await adminUserToFix.reload({
                    include: [{
                        model: Role,
                        as: 'roles'
                    }]
                });

                console.log('Utilisateur après assignation:', {
                    id: adminUserToFix.id,
                    email: adminUserToFix.email,
                    roles: adminUserToFix.roles.map(r => r.label),
                    rolesCount: adminUserToFix.roles.length
                });
            } else {
                console.log('Rôle Admin non trouvé dans la base de données');
            }
        } else {
            console.log('L\'utilisateur admin@archetypewarfare.com a déjà des rôles ou n\'existe pas');
        }

        console.log('=== FIN DEBUG ===');

    } catch (error) {
        console.error('Erreur lors du debug:', error);
    } finally {
        await sequelize.close();
    }
}

debugRoles(); 