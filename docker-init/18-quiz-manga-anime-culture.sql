-- Séparer Manga / Anime + questions Culture G

UPDATE quiz_theme
SET label = 'Manga',
    description = 'Questions sur le manga Yu-Gi-Oh!',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'manga';

INSERT INTO quiz_theme (slug, label, description)
VALUES
    ('anime', 'Anime', 'Questions sur les animés Yu-Gi-Oh!')
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO quiz_question (theme_id, type, prompt, payload, points, hint, explanation, is_active)
SELECT t.id, 'mcq', q.prompt, q.payload::jsonb, 1, q.hint, q.explanation, TRUE
FROM quiz_theme t
CROSS JOIN (
    VALUES
        (
            'Sirènemure Abyssgunde est une carte qui s''inspire du poisson-clown, un poisson reconnaissable par sa couleur orangée à bandes blanches. Les poissons-clown ont comme particularité d''entretenir une relation mutualiste (c''est-à-dire qu''ils tirent chacun avantage de l''autre) avec un autre animal. Lequel ?',
            '{"choices":["Le corail","La baleine","Les algues","L''anémone de mer"],"correctIndex":3}',
            'C''est aussi un prénom !',
            'L''anémone de mer est un animal doté de tentacules urticantes où réside le poisson-clown. Protégé par ses écailles recouvertes de mucus, il ne subit pas le venin de l''anémone. Ainsi, il peut vivre en son sein. Le poisson quant à lui nettoie ses tentacules d''éventuels parasites.'
        ),
        (
            'Vous recherchez : le nom d''une carte magie Continue qui est aussi le nom d''une période pendant laquelle il a été interdit, aux États-Unis, de fabriquer, vendre, importer et exporter de l''alcool.',
            '{"choices":["Loi de la Normal","Prohibition","Gouttelette de l''Interdit","Sermon Solennel"],"correctIndex":1}',
            'Empêcher, en latin, se dit : "prohibere"',
            'Après la fin de la Première Guerre mondiale, les États-Unis entrent dans une frénésie consommatrice. De plus, avec l''immigration et le développement de l''industrie, de nombreux Écossais et Irlandais mettent en œuvre leur savoir-faire sur le sol américain. L''alcool se répand rapidement sur le territoire amenant les conservateurs du pays à dénoncer ses effets néfastes sur l''homme. La Prohibition dura de 1919 à 1933.'
        ),
        (
            'Moai Chronomaly et Canons Intercepteurs Moai font référence aux Moai, des statues situées sur une île du Pacifique. Quel est le nom de cette île ?',
            '{"choices":["Île de Pâques","Île de la Chandeleur","Île de la Toussaint","Île de la Pentecôte"],"correctIndex":0}',
            'Œufs et lapins en chocolat !',
            'L''île de Pâques porte ce nom car le hollandais Jakob Roggeveen y accosta le 6 avril 1722, jour de Pâques. L''île compte 1042 statues en basalte mesurant en moyenne 4 m de hauteur. Elle fait partie du patrimoine de l''Unesco depuis 1995.'
        ),
        (
            'L''archétype Kaiju s''inspire des Kaiju Eiga, des films où se combattent entre elles des créatures géantes. Dogoran, Kaiju des Flammes Enragées est une carte inspirée de quel monstre géant célèbre ?',
            '{"choices":["King Kong","Ymir","Godzilla","Cyclope"],"correctIndex":2}',
            'Dinosaure radioactif',
            'Godzilla fut créé par Ishirô Honda en 1954.'
        ),
        (
            'Gosse Suprême du BaseBall est sorti pour la première fois en 2004. Sur sa casquette est inscrit le kanji « 炎 ». Que signifie-t-il ?',
            '{"choices":["Feu","Eau","Terre","Vent"],"correctIndex":0}',
            'Regardez son attribut',
            NULL
        ),
        (
            'Chiron, le Mage est une carte basée sur le personnage mythologique du même nom. Centaure immortel, il est doté d''un très grand savoir et un modèle pour tous. Il s''est vu confier l''éducation de nombreux héros tels qu''Ulysse, Héraclès, Jason et aussi de ce héros immortel dont le talon est le point faible. Quel est ce héros ?',
            '{"choices":["Patrocle","Thétis","Pelée","Achille"],"correctIndex":3}',
            'Vidéo Achille Talon.',
            'Chiron aide Pelée à séduire Thétis. Elle devint son épouse et eurent un enfant, Achille. Pour le rendre invulnérable, Thétis plongea son fils dans le Styx à l''exception du talon par lequel elle le tenait. Effrayé de cet événement, Pelée demande à Chiron d''éduquer Achille dès son plus jeune âge. Il lui transmet une éducation physique et intellectuelle faisant de lui l''incarnation du héros parfait.'
        ),
        (
            'Chacune des cartes de l''archétype Préhistorique portent un nom inspiré d''un dinosaure. Cependant, ce n''est pas le cas pour la carte Synchro de Niveau 10. Le nom de cette carte s''inspire d''un corps extraterrestre qui aurait provoqué l''extermination des dinosaures lors de son impact sur Terre il y a plus de 65 millions d''années. Quel est ce corps ?',
            '{"choices":["Un Satellite","Une Voiture Tesla","Un Vaisseau Spatial","Une Météorite"],"correctIndex":3}',
            'Les voitures Tesla n''existaient pas encore.',
            NULL
        ),
        (
            'Les HEROS Masqués s''inspirent des super-héros des Super Sentai japonais ; des guerriers multicolores ayant pour but de vaincre les forces du mal. Au début des années 1990, Haim Saban achète les droits d''image et des costumes de la franchise pour un public américain et en fait une série. Quel est le nom de cette série ?',
            '{"choices":["Les Chevaliers de Tir Na Nog","M.A.S.K","Power Ranger","Inspecteur Gadget"],"correctIndex":2}',
            'Go ! Go !',
            'L''archétype est aussi inspiré d''un autre Tokusatsu, Kamen Rider, dont Kamen veut tout simplement dire « Masque ».'
        ),
        (
            'La carte Ret-time Reviver Emit-ter se lit aussi bien à l''endroit qu''à l''envers. Comment appelle-t-on cette figure de style ?',
            '{"choices":["Un Palindrome","Une Métaphore","Une Antonomase","Une Antithèse"],"correctIndex":0}',
            NULL,
            'Une métaphore est une figure de style qui désigne une chose par une autre avec qui elle partage un trait, une qualité. Une antonomase désigne un nom propre utilisé comme nom commun (ex. : « Une poubelle », un « Don Juan »). Une antithèse désigne une opposition entre deux termes ou deux ensembles de termes contraires (ex. : « Être ou ne pas être »).'
        ),
        (
            'La carte Alien Gris est pour beaucoup de personnes l''image que l''on se fait des extra-terrestres. Au soir du 2 juillet 1947, aux États-Unis, beaucoup de personnes ont affirmé avoir vu un OVNI et même plus encore. Cet OVNI aurait explosé et se serait écrasé dans une ville du Nouveau-Mexique. Quel est le nom de cette ville ?',
            '{"choices":["Milwaukee","Nashville","Washington","Roswell"],"correctIndex":3}',
            'Lewsor est le nom d''un Pokémon.',
            NULL
        ),
        (
            'La carte Monster Reborn fut complètement redessinée pour le TCG. La carte OCG représente une croix ansée aussi appelée Ankh. Que signifie Ankh ?',
            '{"choices":["La Vie","La Force","La Sagesse","La Mort"],"correctIndex":0}',
            'Il n''y a pas meilleur indice que l''effet de la carte.',
            NULL
        )
) AS q(prompt, payload, hint, explanation)
WHERE t.slug = 'culture-g'
  AND NOT EXISTS (
      SELECT 1 FROM quiz_question existing
      WHERE existing.theme_id = t.id AND existing.prompt = q.prompt
  );
