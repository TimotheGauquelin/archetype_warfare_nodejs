# Guide de Refactoring de l'Architecture

Ce document explique comment refactoriser les services et controllers pour améliorer l'architecture du projet.

## 🎯 Objectifs

1. **Découpler les services de HTTP** - Les services ne doivent pas dépendre de `request` et `response`
2. **Séparer les responsabilités** - Controllers gèrent HTTP, Services gèrent la logique métier
3. **Améliorer la testabilité** - Services purs plus faciles à tester
4. **Ajouter la validation** - Utiliser express-validator pour valider les entrées

## 📋 Pattern à suivre

### ❌ AVANT (Mauvais pattern)

```javascript
// Service - ❌ Dépend de HTTP
class ArchetypeService {
    static async searchArchetypes(request, response, next) {
        const { name, era } = request.query;
        // ...
        return response.json(result);
    }
}

// Controller - ❌ Passe request/response au service
class ArchetypeController {
    async searchArchetypes(request, response, next) {
        const result = await ArchetypeService.searchArchetypes(request, response, next);
        return response.status(200).json(result);
    }
}

// Route - ❌ Callback inline verbeux
router.get('/search', (req, res, next) => Controller.searchArchetypes(req, res, next));
```

### ✅ APRÈS (Bon pattern)

```javascript
// Service - ✅ Pur, sans dépendance HTTP
class ArchetypeService {
    /**
     * Recherche d'archétypes
     * @param {Object} filters - Filtres de recherche
     * @returns {Promise<Object>} - Résultats avec pagination
     */
    static async searchArchetypes(filters = {}) {
        const { name, era, page = 1, size = 10 } = filters;
        // Logique métier pure
        return {
            data: result.rows,
            pagination: { /* ... */ }
        };
    }
}

// Controller - ✅ Extrait les données et appelle le service
class ArchetypeController {
    async searchArchetypes(request, response, next) {
        try {
            const filters = {
                name: request.query.name,
                era: request.query.era ? parseInt(request.query.era) : undefined,
                page: request.query.page ? parseInt(request.query.page) : 1,
                size: request.query.size ? parseInt(request.query.size) : 10
            };
            
            const result = await ArchetypeService.searchArchetypes(filters);
            return response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

// Route - ✅ Simple et propre avec validation
import { validateRequest } from '../middlewares/validation.js';
import { validateSearchArchetypes } from '../validators/archetypeValidators.js';

router.get('/search', 
    validateRequest(validateSearchArchetypes),
    ArchetypeController.searchArchetypes.bind(ArchetypeController)
);
```

## 🔧 Étapes de refactoring

### 1. Créer les validateurs

Créer un fichier dans `src/validators/` pour chaque ressource :

```javascript
// src/validators/archetypeValidators.js
import { query, param, body } from 'express-validator';

export const validateSearchArchetypes = [
    query('name').optional().isString().trim().escape(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('size').optional().isInt({ min: 1, max: 100 }).toInt(),
];
```

### 2. Refactoriser le Service

**Avant :**
```javascript
static async searchArchetypes(request, response, next) {
    try {
        const { name } = request.query;
        // ...
        return response.json(result);
    } catch (error) {
        next(error);
    }
}
```

**Après :**
```javascript
static async searchArchetypes(filters = {}) {
    const { name, page = 1, size = 10 } = filters;
    // Logique métier
    return {
        data: result.rows,
        pagination: { /* ... */ }
    };
}
```

**Points importants :**
- ❌ Retirer `request`, `response`, `next`
- ❌ Retirer les `try/catch` (les erreurs remontent naturellement)
- ✅ Accepter des paramètres simples (objets, primitives)
- ✅ Retourner des données (pas de `response.json()`)
- ✅ Lancer des `CustomError` si nécessaire

### 3. Refactoriser le Controller

**Avant :**
```javascript
async searchArchetypes(request, response, next) {
    const result = await ArchetypeService.searchArchetypes(request, response, next);
    return response.status(200).json(result);
}
```

**Après :**
```javascript
async searchArchetypes(request, response, next) {
    try {
        // Extraire et transformer les données de la requête
        const filters = {
            name: request.query.name,
            page: request.query.page ? parseInt(request.query.page) : 1,
            size: request.query.size ? parseInt(request.query.size) : 10
        };
        
        // Appeler le service avec les données extraites
        const result = await ArchetypeService.searchArchetypes(filters);
        
        // Retourner la réponse HTTP
        return response.status(200).json(result);
    } catch (error) {
        next(error);
    }
}
```

### 4. Mettre à jour la Route

**Avant :**
```javascript
router.get('/search', (req, res, next) => Controller.searchArchetypes(req, res, next));
```

**Après :**
```javascript
import { validateRequest } from '../middlewares/validation.js';
import { validateSearchArchetypes } from '../validators/archetypeValidators.js';

router.get('/search', 
    validateRequest(validateSearchArchetypes),
    ArchetypeController.searchArchetypes.bind(ArchetypeController)
);
```

## 📝 Gestion des erreurs

### Dans les Services

```javascript
static async getArchetypeById(id) {
    const archetype = await Archetype.findOne({ where: { id } });
    
    if (!archetype) {
        throw new CustomError('Archétype non trouvé', 404);
    }
    
    return archetype;
}
```

### Dans les Controllers

Les erreurs sont automatiquement capturées et passées à `next()` :

```javascript
async getArchetypeById(request, response, next) {
    try {
        const { id } = request.params;
        const archetype = await ArchetypeService.getArchetypeById(parseInt(id));
        return response.status(200).json(archetype);
    } catch (error) {
        next(error); // Passe à ErrorHandler
    }
}
```

## ✅ Checklist de refactoring

Pour chaque méthode de service :

- [ ] Retirer `request`, `response`, `next` des paramètres
- [ ] Retirer les `try/catch` (sauf si logique métier spécifique)
- [ ] Accepter des paramètres simples (objets, primitives)
- [ ] Retourner des données (pas de `response.json()`)
- [ ] Ajouter JSDoc pour documenter les paramètres
- [ ] Mettre à jour le controller pour extraire les données
- [ ] Créer les validateurs express-validator
- [ ] Mettre à jour la route avec validation et `.bind()`

## 🚀 Exemple complet

Voir les fichiers refactorisés :
- `src/services/ArchetypeService.js` - Méthode `searchArchetypes` refactorisée
- `src/controllers/ArchetypeController.js` - Controller mis à jour
- `src/routes/ArchetypeRoute.js` - Route avec validation
- `src/validators/archetypeValidators.js` - Validateurs

## 📚 Ressources

- [express-validator Documentation](https://express-validator.github.io/docs/)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
