# 📖 **CHARTE DE NOMMAGE DES COMMITS** 📖

Les commits doivent suivre une structure précise pour garantir une meilleure lisibilité et traçabilité. Chaque message de commit est divisé en trois parties : 

>  **":Emote: Type(Portée): Sujet"**

### **Exemple :**
>✨ feat(167990df3): create a generic button

Un message de commit se compose de :
1. **Emote et type** : L’emoji (gitmoji) associé et le type de changement.
2. **Portée (ou Identifiant)** : Le contexte ou la référence à une tâche spécifique, souvent lié à un ID de ticket.
3. **Sujet** : Une brève description claire de ce qui a été fait.


## ✅ **[Emote](https://gitmoji.dev/) et Type de Commit :**

### Voici les types principaux :
| Emoji  | Type        | Description                                                                 |
|--------|-------------|-----------------------------------------------------------------------------|
| ✨      | **feat**    | Ajout d’une nouvelle fonctionnalité.                                        |
| 🔄      | **refacto** | Réorganisation ou amélioration du code sans impact fonctionnel ni performance. |
| 🐛      | **fix**     | Correction d’un bug.                                                       |
| 🚀      | **test**    | Ajout ou modification de tests.                                            |
| 📝      | **docs**    | Mise à jour ou rédaction de documentation.                                 |

> **Astuce :** Vous pouvez explorer la liste complète des emojis disponibles sur [Gitmoji.dev](https://gitmoji.dev/).


## ✅ **Portée :**

- La **portée** identifie le contexte ou le module concerné.
- - Pour les tickets ou tâches, utilisez l’**ID de la carte** mentionné dans l'URL (ex. : `869797yh5`, `167990df3`).
- Si aucun ID n’est disponible, utilisez un mot-clé clair pour décrire la portée (`auth`, `header`, etc.).

## ✅ **Sujet :**

- Le sujet doit être court, précis et rédigé en français (ou anglais), à l'impératif.
  - Exemples :
    - **✅ Correct** : `✨ feat(167990df3): create a generic button`
    - **❌ Incorrect** : `✨ feat(167990df3): I created a generic button`

## ☝️ **Bonnes pratiques :**
1. **Utilisez l'anglais** pour garantir une uniformité avec les standards internationaux ou **en français** (à définir).
2. **Évitez les phrases trop longues** : maximum 50 caractères pour le sujet.
3. **Un commit = une tâche** : Chaque commit doit refléter une seule modification logique.
4. **Testez votre code avant de committer** : Assurez-vous que votre changement ne casse pas le projet.
5. **Mettez à jour la documentation si nécessaire** lorsque vous ajoutez de nouvelles fonctionnalités.