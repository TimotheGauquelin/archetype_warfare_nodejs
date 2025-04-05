# **✨ CHARTE DE NOMMAGE ✨**

Contient la charte de nommage pour l'API et la BDD

## **🌍 GÉNÉRALITÉS**

Avant tout, les noms doivent être :  
- **📖 En anglais** : Respectez les standards internationaux ou **en français** (à définir)
- **🔍 Clairs et descriptifs** : Chaque nom doit indiquer clairement sa fonction ou son contenu.  
- **👀 Lisibles** : Privilégiez des noms longs mais explicites aux noms courts et ambigus.  

> ⚠️ Les éléments similaires doivent être regroupés et organisés de manière cohérente.  
>**Exemple** : constantes avec constantes, fonctions avec fonctions, classes avec classes.

## **✅ Bonnes pratiques générales :**
1. **❌ Évitez les abréviations** à moins qu’elles ne soient universellement comprises (ex. : `ID`, `URL`, `API`).  
2. **♻️ Pas de redondance inutile** : Préférez `getUserName` à `getUserNameFromUser`.  
3. **📜 Documentez les exceptions** si elles sont nécessaires pour éviter toute confusion.


## **🎨 NOMMAGE DE L'API**

### **📂 Dossiers :**

Les noms de vos dossiers doivent être écrits en **kebab-case** (tout en minuscules, mots séparés par des tirets).  

> **Exemples** : 
>- shared-components 
>- pages 
>- dashboard-settings

### **📜 Fichiers JavaScript :**

Les fichiers JS doivent être nommés en **camelCase**.  
Privilégiez des noms reflétant le rôle du fichier.  

> **Exemples :** 
>- userService.js 
>- authMiddleware.js

### **⚙️ Fonctions :**

Les fonctions doivent être nommées en **camelCase**.  
Chaque nom doit :  
  - Commencer par un verbe (`fetch`, `update`, `delete`, `calculate`, etc.).  
  - Décrire clairement l’objectif de la fonction.  

> **Exemple** : 
```javascript
const updateUserProfile(data) {
  // Code
}
```
### **📦 Variables :**
Les noms doivent être descriptifs et éviter les termes génériques.

Les variables doivent suivre les conventions suivantes :
- **camelCase** pour les variables locales et globales.
- Les constantes spécifiques au front doivent être en **SCREAMING_SNAKE_CASE**.

> **Exemples :**

```javascript 
const API_URL = "https://api.example.com";
let userToken = null;
```

-------

## 🗄️ NOMMAGE DE LA BASE DE DONNÉES
### 📊 Tables :
Les noms doivent être en snake_case, toujours au pluriel.

> **Exemple :**
```sql
users, order_items
```
### 🔑 Colonnes :
Les noms doivent être en snake_case, descriptifs et uniformes.
Ajoutez des préfixes en cas de relations complexes :

> **Exemple :**
```sql
user_id
created_at
product_price
```

### 🔗 Clés primaires et étrangères :
- **Clés primaires** : utilisez id ou une combinaison descriptive (ex. : order_id).
- **Clés étrangères** : incluez le nom de la table associée.
Exemple :

```sql
user_id REFERENCES users(id)
```