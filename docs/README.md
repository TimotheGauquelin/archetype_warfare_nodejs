# **📖 READ ME DU PROJET FOR EACH ALUMNI 📖**

Bienvenue dans le projet **For Each Alumni** !  
Ce projet utilise les technologies suivantes :  

- **⚛️ React** pour l'interface **FRONT**.  
- **🌐 NodeJS/Express** pour l'API **BACK**.  
- **🐘 PostgreSQL** pour la **base de données** (BDD).


## **📦 Structure du projet :**

Voici les différentes parties à cloner :  
- **FRONT :** 📂 [Alumni Frontend](https://github.com/foreach-academy/Alumni_Frontend)  
- **BACK :** 📂 [Alumni Backend](https://github.com/foreach-academy/Alumni_Backend)  
- **BDD :** 🗄️ Base de données initialisée via les scripts dans `docker-init/` (schéma + seed).  


## **🚀 Pour lancer ce projet :**

### **Étapes générales :**

1. **🛠️ Installer les dépendances :**
   - Allez dans chaque dossier (`Frontend` et `Backend`) et exécutez :  
     ```bash
     npm install
     ```

2. **🔧 Configurer les variables d'environnement :**  
   - Créez un fichier `.env` dans chaque dossier.   
   - Ajoutez toutes les variables d'environnement nécessaires.
   
   > **⚠️ Note importante :**  
     Les variables d'environnement **ne doivent jamais être partagées**. C'est pourquoi le fichier `.env` est inclus dans le `.gitignore`.

3. **📜 Base de données :**  
   - Avec Docker : `docker compose up -d` (les scripts dans `docker-init/` créent les tables et les données au premier démarrage).  
   - Sans Docker : `npm run db:recreate` puis `npm run db:seed` (référence : `docker-init/01-schema.sql` et `docker-init/02-data.sql`).  

### **Commandes disponibles :**

Dans le fichier `package.json` (Backend), vous trouverez les commandes suivantes :  

- **▶️ `npm run start` :**  
  Lancer l'application en mode production.  

- **🛠️ `npm run dev` :**  
  Lancer l'application en mode développement (avec rechargement automatique grâce à **Nodemon**).  

## **🌟 Bonnes pratiques :**

1. **📂 Organisation des fichiers :**
   - Respectez l'arborescence des dossiers.  
   - Consultez la charte de nommage pour un code propre et maintenable.  

2. **🔒 Gestion des secrets :**
   - **Ne partagez jamais vos variables `.env`.**   

3. **📥 Clonage rapide :**
   - Clonez les deux dépôts dans un même répertoire pour simplifier la navigation.  