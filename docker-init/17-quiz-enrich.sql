-- Quizz : image / indice / explication + thèmes enrichis + nouvelles questions

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
    ADD COLUMN IF NOT EXISTS hint TEXT NULL,
    ADD COLUMN IF NOT EXISTS explanation TEXT NULL;

-- Renommer TCG → Jeu de Cartes
UPDATE quiz_theme
SET slug = 'jeu-de-cartes',
    label = 'Jeu de Cartes',
    description = 'Questions sur le jeu de cartes Yu-Gi-Oh! (TCG / OCG)',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'tcg';

UPDATE quiz_theme
SET label = 'Jeu de Cartes',
    description = 'Questions sur le jeu de cartes Yu-Gi-Oh! (TCG / OCG)',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'jeu-de-cartes';

INSERT INTO quiz_theme (slug, label, description)
VALUES
    ('culture-g', 'Culture G', 'Culture générale autour de Yu-Gi-Oh! et de son univers'),
    ('jeu-video', 'Jeu Video', 'Questions sur les jeux vidéo Yu-Gi-Oh!')
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Nouvelles questions MCQ (thème Jeu de Cartes)
INSERT INTO quiz_question (theme_id, type, prompt, payload, points, hint, explanation, is_active)
SELECT t.id, 'mcq', q.prompt, q.payload::jsonb, 1, q.hint, q.explanation, TRUE
FROM quiz_theme t
CROSS JOIN (
    VALUES
        (
            'La carte qui possède cet Artwork a été créée pour fêter un événement bien spécifique. Lequel ?',
            '{"choices":["Les 20ans de Yu-Gi-Oh! TCG","La fin de la Banlist","La sortie d''un nouveau dessin animé","L''existence de 10''000 cartes différentes"],"correctIndex":3}',
            NULL,
            'Comme son nom l''indique, le Dragon Dix-Mille fête l''existence de 10''000 cartes différentes dans le TCG Yu-Gi-Oh!'
        ),
        (
            'De quels types sont les cartes de l''archétype Guerrier Magnétique ?',
            '{"choices":["Machine","Rocher","Guerrier","Magicien"],"correctIndex":1}',
            'Dur comme de la pierre !',
            'Malgré leur apparence qui laisse supposer que ce sont des machines et leur nom que ce sont des guerriers, les Guerrier Magnétique sont de type Rocher.'
        ),
        (
            'L''ère GX a vu beaucoup d''archétypes jouer autour des compteurs. Parmi ces quatre propositions, quel compteur est correctement associé à l''archétype Nuagien ?',
            '{"choices":["Compteur Brouillard","Compteur Nuage","Compteur Fumée","Compteur Brume"],"correctIndex":0}',
            'C''est comme un nuage mais ça touche le sol.',
            NULL
        ),
        (
            'Apollousa, Arc de la Déesse possède deux artworks. Sur cet artwork, vous pouvez voir Apollousa agenouillée mais sur son artwork originel, elle est montée sur un animal. Quel animal est-ce ?',
            '{"choices":["Un Ours","Un Faucon","Un Rhinocéros","Un Lion"],"correctIndex":0}',
            'Brun ou polaire, ils sont tout aussi puissants.',
            NULL
        ),
        (
            'Quelle est l''ATK d''origine la plus élevée dans le jeu de cartes Yu-Gi-Oh! (TCG/OCG inclus) ?',
            '{"choices":["4000","4500","5000","5500"],"correctIndex":2}',
            NULL,
            'Chevalier Maître des Dragons ou Dragon à Cinq Têtes entre autres possèdent une ATK d''origine à 5000.'
        ),
        (
            'Quelle proposition parmi ces quatre cartes n''est pas une carte de l''archétype Bête Fantôme ?',
            '{"choices":["Gazelle, Roi des Bêtes Mythiques","Bête Fantôme Lézard-Rocher","Berfomet","Bête Fantôme Méca O-Lion"],"correctIndex":2}',
            'On l''utilise pour invoquer Chimère, Bête Mythique Volante',
            'Gazelle, Roi des Bêtes Mythiques a eu un errata dans sa description précisant que c''est une carte Bête Fantôme.'
        ),
        (
            'Actuellement, combien existe-t-il de zones sur un terrain de duel ? (Vous et votre adversaire compris)',
            '{"choices":["28","30","32","34"],"correctIndex":1}',
            NULL,
            'Depuis 2017 avec l''arrivée des cartes Lien, le terrain se compose de 6 zones monstres (Extra Zone + Main Monster Zone), 6 zones magies/pièges (les pendules sont désormais à chaque extrémité) et 3 autres zones (Cimetière, Deck et Extra Deck). Cela fait donc 15 zones × 2 = 30 zones.'
        ),
        (
            'Combien existe-t-il d''Attributs dans le jeu de cartes Yu-Gi-Oh! (TCG/OCG confondus) ?',
            '{"choices":["4","5","6","7"],"correctIndex":3}',
            NULL,
            'Il existe 7 attributs (Feu, Eau, Terre, Vent, Lumière, Ténèbres et Divin).'
        ),
        (
            'Parmi tous les monstres Fusion, quelle est l''ATK la plus basse ?',
            '{"choices":["0","300","600","100"],"correctIndex":0}',
            NULL,
            'Le Renoncé aux Mille Yeux est l''un des monstres Fusion avec l''ATK la plus basse.'
        ),
        (
            'Parmi tous les monstres Fusion, quelle est l''ATK la plus élevée ?',
            '{"choices":["2000","3000","4000","5000"],"correctIndex":3}',
            NULL,
            'Le Chevalier Maître des Dragons est l''un des monstres Fusion avec l''ATK la plus élevée.'
        ),
        (
            'Combien d''ATK a le monstre Malédiction du Dragon ?',
            '{"choices":["2000","2200","2400","2600"],"correctIndex":0}',
            NULL,
            NULL
        ),
        (
            'Combien d''ATK a le monstre Dragon Photon aux Yeux Galactiques ?',
            '{"choices":["2000","2500","3000","3500"],"correctIndex":2}',
            NULL,
            NULL
        ),
        (
            'Combien de DEF a le monstre Bouclier du Millenium ?',
            '{"choices":["3000","3200","3400","3600"],"correctIndex":0}',
            NULL,
            NULL
        ),
        (
            'À partir du second tour de jeu, combien y a-t-il de phases de jeu ?',
            '{"choices":["5","6","7","8"],"correctIndex":1}',
            'Autant que les faces d''un dé',
            'Un tour se structure de 6 phases de jeu : Draw Phase - Standby Phase - Main Phase 1 - Battle Phase - Main Phase 2 - End Phase.'
        ),
        (
            'Quelle proposition est vraie sur l''archétype HEROS Masqué, en TCG/OCG ?',
            '{"choices":["Ce sont tous des monstres de Niveau 8","Ce sont tous des cartes Fusion","Il existe une fusion pour chaque Attribut","Ils possèdent tous au minimum 3000 ATK"],"correctIndex":1}',
            NULL,
            'Les HEROS Masqué sont de Niveau 6 et 8. L''archétype compte des monstres de 6 attributs différents, seul l''attribut Divin n''est pas représenté. L''ATK des Héros Masqué se situe entre 2200 et 2800 ATK. En TCG, les HEROS Masqué sont tous des cartes Fusion bien que dans le manga l''archétype possède des monstres invocables depuis le Main Deck.'
        ),
        (
            'Avec quelle carte puis-je invoquer un monstre Fusion ?',
            '{"choices":["Polymérisation","Sage Fusion","Diffusion Ondulatoire","8"],"correctIndex":0}',
            NULL,
            NULL
        ),
        (
            'Quel est le rang de la carte Numéro 17 : Dragon Léviathan ?',
            '{"choices":["3","4","5","6"],"correctIndex":0}',
            NULL,
            NULL
        ),
        (
            'Quel est le rang de la carte Numéro 39 : Utopie ?',
            '{"choices":["3","4","5","6"],"correctIndex":1}',
            NULL,
            NULL
        ),
        (
            'Quel est le nom de la carte qui possède cette Artwork (Dragon Poussière d''Étoile) ?',
            '{"choices":["Dragon Poussière d''Étoile","Dragon Rouge Archdémon","Dragon Rose Noire","Dragon Électromécanique"],"correctIndex":0}',
            NULL,
            NULL
        ),
        (
            'Quel est le nom de la carte qui possède cette Artwork (Dragon Pare-Feu) ?',
            '{"choices":["Dragon Poussière d''Étoile","Dragon Pare-Feu","Dragon Pendule aux Yeux Impairs","Dragon Blanc aux Yeux Bleus"],"correctIndex":1}',
            NULL,
            NULL
        ),
        (
            'Quel est le nom du tout premier booster sorti en TCG ?',
            '{"choices":["La Légende du Dragon Blanc aux Yeux Bleus","L''Illusion du Magicien Sombre","La Fureur du Dragon Noir aux Yeux Rouges","Le Chaos des Dieux Égyptiens"],"correctIndex":0}',
            NULL,
            'Ce booster est sorti pour la première fois en France le 8 mars 2002.'
        ),
        (
            'Les cartes Pot sont des cartes qui permettent au joueur de piocher. Si au début du jeu de cartes l''artwork des pots n''étaient qu''une seule entité, ils se sont assemblés pour n''en faire qu''un. C''est le cas de Pot de Dualité qui est l''assemblage de deux pots. Lesquels ?',
            '{"choices":["Pot de Cupidité et Pot de Possessivité","Pot de Cupidité et Pot de Générosité","Pot des Riches et Pot d''Avarice","Pot des Riches et Pot de Possessivité"],"correctIndex":1}',
            NULL,
            NULL
        )
) AS q(prompt, payload, hint, explanation)
WHERE t.slug = 'jeu-de-cartes'
  AND NOT EXISTS (
      SELECT 1 FROM quiz_question existing
      WHERE existing.theme_id = t.id AND existing.prompt = q.prompt
  );
