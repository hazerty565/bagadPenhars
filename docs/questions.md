# Questions ouvertes et arbitrages partiels

Ce fichier conserve les questions encore ouvertes ou partiellement tranchées,
avec leur contexte, leurs options et les conséquences d'un arbitrage. Les
décisions entièrement intégrées aux documents de référence sont retirées pour
éviter les doublons.

## Arbitrages reçus — 2026-11-06

### Q-2026-11-06-03 — Conservation et suppression des données personnelles

- **Question restante :** Quelles durées de conservation appliquer aux
  réponses aux événements, aux journaux d'audit et aux messages de contact ?
- **Pourquoi :** la section 8 de [`Spec.md`](./Spec.md) signale encore les
  durées de conservation comme ouvertes. Le schéma documente une table de
  demandes de suppression, mais ne suffit pas à
  définir les délais ni les données à effacer ou anonymiser. Cela conditionne
  les suppressions en base, les tâches de maintenance et les tests backend.
- **Processus déjà décidé :** la suppression de compte suit le processus décrit
  dans [`Spec.md`](./Spec.md) §4.3; les règles sur les réponses et leur
  anonymisation figurent en §4.4. La question restante porte sur les durées
  de conservation et l'activation d'une purge.
- **Options déjà proposées :** anonymiser et conserver les réponses sans limite;
  conserver `activity_log` 24 mois, les messages de contact 12 mois et les
  invitations expirées 30 jours. La purge doit rester désactivée par défaut
  jusqu'à validation des durées par l'association.
- **État :** Partiellement décidée; les durées de conservation restent
  ouvertes.
- **Décision :** Un membre peut demander la suppression de son compte. Le
  compte est immédiatement désactivé; l'administrateur traite la demande,
  supprime les données personnelles, les photos de profil et les associations
  avec les pupitres, puis anonymise les réponses conservées à des fins
  historiques. Les données soumises à une obligation légale sont conservées
  séparément avec un accès restreint. L'administrateur clôt la demande et
  notifie le membre. Aucune purge automatique irréversible n'est activée avant
  validation des durées par l'association.

## 2026-11-07 — Questions issues de la relecture de bout en bout

### Q-2026-11-07-02 — Couleurs et icônes définitives du thème PWA

- **Question ouverte :** `pwa.md` indique que les couleurs du manifest doivent
  reprendre le thème du site et que les couleurs et icônes définitives restent
  à définir.
- **À arbitrer :** confirmer les couleurs du thème et fournir l'icône finale de
  l'application. Un exemple de design existe dans `src/autre/`; il ne remplace
  pas l'icône de production.

## 2026-11-08 — Questions issues de la revue du chef de projet

> Questions ouvertes avant de poursuivre l'implémentation. Tant qu'elles ne sont
> pas tranchées, l'équipe ne doit pas les implémenter par supposition.

### Q-2026-11-09-02 — Validation des contenus de la page d'accueil

- **Date :** 2026-11-09
- **Problème :** les textes de présentation, l'année de création (1985), l'adresse (`6 Av. des Oiseaux`, `29000 Quimper`), l'e-mail (`bagadpenhars@gmail.com`) et les liens Facebook/Instagram proviennent du site officiel `https://bagad-penhars.com/` et n'ont pas été reconfirmés par le bureau.
- **Pourquoi :** ces informations sont publiques et engagent l'association ; une adresse ou une année erronée serait visible immédiatement.
- **Proposition :** faire valider ces éléments par le bureau avant mise en production, ainsi que les légendes des photographies de la galerie d'accueil.

### Q-2026-11-09-03 — Pistes audio du lecteur

- **Date :** 2026-11-09
- **Problème :** le lecteur flottant est livré en état vide honnête (« Aucune piste publiée ») car aucun fichier audio n'est présent dans le dépôt.
- **Pourquoi :** l'étape 32 du plan (lecteur audio) ne peut pas être finalisée sans pistes, titres, durées et droits de diffusion.
- **Proposition :** fournir les fichiers (MP3/OGG) et leurs métadonnées, ou valider que le lecteur reste en état vide jusqu'à l'étape 32.

### Q-2026-11-10-01 — Informations pratiques de la page Formation

- **Date :** 2026-11-10
- **Problème :** `docs/maquette_UI.md` §8.3 demande de présenter, pour chaque pupitre, les instruments, les niveaux, le contenu des cours, les horaires, le lieu et les modalités de prêt d'instrument. Ces informations ne sont pas dans le dépôt ; elles ont été reprises de la page Formation du site officiel `https://bagad-penhars.com/formation` (niveaux dès 8 ans et adultes ; Espace Chaptal, 6 avenue des Oiseaux, 29000 Quimper ; mardi 17 h–21 h ; 210 € nouveaux apprenants avec prêt d'instrument la première année, 90 € cotisation bagad sans les cours Sonerion, 60 € sympathisant ; cours d'essai gratuit).
- **Pourquoi :** ces montants et ces horaires engagent l'association. Le site officiel peut être obsolète, et une page Formation qui annoncerait un tarif ou un horaire périmé induirait en erreur les personnes qui veulent rejoindre le bagad.
- **Proposition :** faire reconfirmer par le bureau les quatre points repris (niveaux, lieu, horaires, tarifs), en particulier la distinction entre cotisation bagad et cotisation sympathisant, puis indiquer la date de dernière mise à jour à afficher.

### Q-2026-11-10-02 — Mascottes du site

- **Date :** 2026-11-10
- **Problème :** aucune charte ne prévoit de mascotte. L'association a fourni quatre silhouettes vectorielles de cerf (`static/mascotte_1.svg` à `mascotte_4.svg`), une par pupitre, désormais intégrées à la page Formation.
- **Pourquoi :** une mascotte devient un signe de reconnaissance de l'association ; elle doit être validée comme telle, et son usage (taille, présence sur les autres pages, éventuel logo dérivé) doit être tranché.
- **Proposition :** valider la mascotte cerf et sa déclinaison par pupitre, puis décider de son emploi hors de la page Formation. Le hero de la page Formation réunit désormais les quatre silhouettes sur une image composée (`static/mascottes-groupe.svg`) : confirmer que cette composition convient, ou fournir une illustration de groupe dessinée comme telle.

### Q-2026-11-10-03 — Photographies des pupitres

- **Date :** 2026-11-10
- **Problème :** la page Formation devait utiliser les fichiers `Formation_*.webp` du dossier `static/`. Seul `Formation_bombarde.webp` est présent (renommé depuis `IMG_0873.webp`, la photo officielle de la bombarde). Les trois autres pupitres utilisent provisoirement les photographies du site officiel déjà déposées : `IMG_0874.webp` (cornemuse, practice chanters), `IMG_0881.webp` (caisse claire, practice pads) et `IMG_0880.webp` (percussions, grosse caisse).
- **Pourquoi :** ces trois images ne suivent pas la convention `Formation_*` et pourraient être remplacées par de meilleures prises de vue ; il faut aussi s'assurer des autorisations de diffusion des personnes reconnaissables.
- **Proposition :** déposer les fichiers `Formation_cornemuse.webp`, `Formation_caisse-claire.webp` et `Formation_percussion.webp`, ou valider définitivement les trois images actuelles ; confirmer les autorisations à l'image.

### Q-2026-11-10-04 — Partenaires : liste, liens et usage des logos

- **Date :** 2026-11-10
- **Problème :** la page Partenaires affiche quatre structures reprises de la page officielle `https://bagad-penhars.com/partenaires` — Quimper, Département du Finistère, Mederien Penhars et « fenetres detoit 29 » — avec les logos fournis dans `static/logos/` et un lien vers le site de chacune. Le nom du quatrième partenaire a été normalisé en « Fenêtres de toit 29 ».
- **Pourquoi :** `docs/maquette_UI.md` §8.6 n'autorise à publier un logo et un lien que s'ils ont été fournis et validés. La liste, les URL et l'orthographe des noms n'ont pas été reconfirmées par le bureau, et l'autorisation d'usage de chaque logo n'est pas formalisée.
- **Proposition :** faire valider par le bureau la liste des quatre partenaires, l'ordre d'affichage, l'orthographe « Fenêtres de toit 29 », les quatre URL et l'accord de chaque partenaire pour l'affichage de son logo ; préciser s'il faut ajouter une catégorie (institutionnel, association, entreprise).

### Q-2026-11-10-05 — Coordonnées et horaires affichés sur la page Contact

- **Date :** 2026-11-10
- **Problème :** la page Contact affiche l'adresse (Espace Chaptal, 6 avenue des Oiseaux, 29000 Quimper), le courriel `bagadpenhars@gmail.com` et les horaires « Mardi 17 h – 21 h », « Vendredi 20 h – 22 h 30 » et « Samedi 15 h – 17 h 30 ». Le mardi est repris de `https://bagad-penhars.com/contact` et de la page Formation du site officiel ; le vendredi et le samedi ont été corrigés ou ajoutés sur demande le 2026-11-10 et ne correspondent plus au site officiel (qui indique 18 h – 21 h le vendredi et pas de samedi). Aucun de ces éléments n'est encore reconfirmé par écrit, et seule la journée du mardi est décrite dans les informations pratiques de la formation.
- **Pourquoi :** une adresse, un horaire ou une adresse électronique erronés sont visibles immédiatement et empêchent les visiteurs de joindre l'association. La carte place le marqueur au 6 avenue des Oiseaux d'après le géocodage OpenStreetMap (47,9920253 / −4,1209120), pas d'après un relevé de l'association.
- **Proposition :** confirmer l'adresse complète, le nom du lieu (« Espace Chaptal »), l'adresse de réception des messages, les trois plages horaires (mardi, vendredi et samedi) et la position exacte du marqueur ; préciser aussi si les horaires concernent les cours, les répétitions ou l'accueil du public.

### Q-2026-11-10-06 — Expéditeur Resend et clés Turnstile par environnement

- **Date :** 2026-11-10
- **Problème :** l'envoi Resend utilise aujourd'hui `CONTACT_EMAIL` comme adresse d'expédition (`from`). Or cette variable désigne l'adresse de réception (`bagadpenhars@gmail.com`) : Resend refuse d'expédier depuis une adresse dont le domaine n'est pas authentifié, et un expéditeur `@gmail.com` ne peut pas l'être. Par ailleurs les clés Turnstile présentes dans `.env` semblent être celles de production, limitées au domaine `bagad-penhars.com` : le widget peut donc refuser de s'afficher sur `localhost` ou sur une URL de préversion Cloudflare Pages.
- **Pourquoi :** sans expéditeur vérifié, aucun message ne part en production ; sans clés de test, le formulaire ne peut pas être vérifié de bout en bout en développement ni en préversion.
- **Proposition :** créer un domaine d'envoi authentifié chez Resend (par exemple `bagad-penhars.com`) et renseigner une variable `CONTACT_FROM` dédiée (déjà prévue dans `.env.example`, avec repli sur `CONTACT_EMAIL`). Fournir en complément les clés Turnstile de test ou autoriser `localhost` et les domaines `*.pages.dev` sur le widget de production. Confirmer que l'adresse d'expédition peut différer de l'adresse de réception.

### Q-2026-11-10-07 — Ancienne route de contact issue du squelette

- **Date :** 2026-11-10
- **Problème :** `src/routes/public/[lang=lang]/contact/` subsiste à côté de la route réelle `src/routes/(public)/[lang=lang]/contact/`. Ce vestige du squelette expose une page à l'URL `/public/fr/contact`, poste vers `/api/[lang=lang]/contact` (endpoint inexistant), contient un gestionnaire inutilisé et une balise `<token-input>` inconnue. Il ne fait pas partie du site livré mais il est compilé et déclenche une erreur ESLint.
- **Pourquoi :** une route morte qui répond et un formulaire factice peuvent être indexés ou confondre un futur intervenant ; `AGENTS.md` demande par ailleurs de ne pas supprimer un fichier sans l'avoir compris.
- **Proposition :** supprimer le dossier `src/routes/public/` (vestige) après validation, ou confirmer qu'il sert encore de référence. En attendant, seule la balise auto-fermante a été corrigée pour ne plus produire d'avertissement de compilation.

### Q-2026-11-10-08 — Chiffres, photos et ancienneté de la page Bagad

- **Date :** 2026-11-10
- **Problème :** la page Bagad reprend du site officiel les textes de présentation, les chiffres « 25+ musiciens actifs » et « 100+ concerts et festivals », et deux photographies (`groupe_bagad.webp`, `couple_joueur.webp`) dont la première porte un filigrane de photographe (« Bazotos Création »). Le site officiel affiche aussi « 40+ ans d'expérience » et « 40 années d'existence », ce qui ne correspond pas à une création en 1985 (41 ans en 2026) ; la page livrée n'affiche donc que « 1985 — année de création », sans nombre d'années.
- **Pourquoi :** un effectif, un nombre de concerts ou une ancienneté erronés sont des affirmations visibles qui engagent l'association ; publier une photographie sans accord ni crédit pose en plus une question de droits.
- **Proposition :** confirmer l'année de création, les deux chiffres, l'autorisation de publier les deux photographies et le crédit à afficher (ou fournir des photos sans filigrane). Décider enfin comment exprimer l'ancienneté : année de création seule (état actuel), formule « depuis 1985 », ou nombre d'années calculé automatiquement.

### Q-2026-11-10-10 — Débordement horizontal de la navigation desktop

- **Date :** 2026-11-10
- **Problème :** entre environ 1024 px et 1380 px de large, la barre de navigation desktop dépasse la largeur de la fenêtre (95 px mesurés à 1284 px), ce qui provoque un défilement horizontal. Le défaut se produit aussi sur `/fr/bagad` et les autres pages publiques : il est antérieur à la page Agenda.
- **Pourquoi :** 1280 px est la largeur la plus courante des écrans de portables ; un défilement horizontal à cette taille se voit immédiatement.
- **Proposition :** corriger le `Nav` (réduire les espacements, raccourcir le bouton « Écouter » ou déplacer le point de rupture). La modification touche le layout partagé, elle attend donc une validation avant d'être engagée.
- **Avancement du 2026-11-11 :** à la demande du bureau, « Le Bagad » ne passe plus à la ligne dans la barre de navigation (`whitespace-nowrap`) et l'espacement entre les liens a été réduit de `gap-7` à `gap-5`. Mesures après correction : 74 → **45 px** de débordement à 1024 px, 112 → **82 px** à 1280 px, 24 → **0 px** à 1440 px. Le débordement résiduel vient du bloc de droite (réseaux sociaux, langues, « Écouter », « Connexion ») : le problème reste donc ouvert.

### Q-2026-11-11-01 — Identité juridique à compléter sur la page « Informations légales »

- **Date :** 2026-11-11
- **Problème :** la page `/fr/informations-legales` est rédigée avec les seules
  informations publiques déjà connues : nom de l'association, adresse du siège
  (6 avenue des Oiseaux, 29000 Quimper), adresse e-mail de contact, hébergeur
  (Cloudflare Pages) et hébergement de la base (Neon). Il manque les éléments
  que la loi impose de publier et qu'aucune source du dépôt ne contient :
  forme juridique et numéro d'immatriculation (RNA, et SIREN si l'association
  en dispose) — **fournis le 2026-11-11, voir le dernier point** —, nom du
  président en exercice en tant que directeur de la publication, et crédits
  photographiques (au moins une image porte un filigrane d'auteur,
  « Finnegan's / Bazotos Création »).
- **Pourquoi :** ces mentions engagent juridiquement l'association ; les
  inventer serait à la fois inexact et risqué. La page reste donc volontairement
  générale sur ces trois points (« le président de l'association, en exercice »,
  photographies appartenant à leurs auteurs).
- **Proposition :** communiquer la forme juridique, le numéro RNA et, le cas
  échéant, le SIREN, le nom du président en exercice et les crédits photo à
  afficher ; ils seront ajoutés en tête de la section « Éditeur du site » et
  dans une ligne de crédits. Confirmer aussi que le site n'utilise ni mesure
  d'audience ni cookie publicitaire (vérifié dans le code à cette date) et que
  la conservation des données décrite correspond à la pratique du bureau.
- **Compléments relevés le 2026-11-11** en comparant la page à la fiche
  « Mentions sur votre site internet : les obligations à respecter »
  (economie.gouv.fr, LCEN art. 6-III et RGPD art. 13) :
  - **Téléphone de l'association** : la LCEN impose un numéro de téléphone pour
    contacter la personne morale ; le site n'en publie aucun et le dépôt n'en
    contient aucun (la page Contact ne liste que l'adresse et l'e-mail). Un
    numéro de téléphone personnel ne doit pas être publié sans accord exprès :
    le bureau doit fournir le numéro à afficher, ou confirmer qu'aucun numéro
    ne doit figurer.
  - **Téléphone de l'hébergeur** : la LCEN impose nom, raison sociale, adresse
    et numéro de téléphone de l'hébergeur. Seuls le nom et l'adresse de
    Cloudflare, Inc. sont publiés ; le numéro à afficher doit être confirmé sur
    le site de Cloudflare avant d'être écrit.
  - **Base juridique des traitements** : à confirmer (consentement pour le
    formulaire de contact, exécution de la relation d'adhésion pour l'espace
    membres). Non rédigée à ce jour faute de validation.
  - **Caractère obligatoire ou facultatif des données** et conséquences d'un
    refus : à préciser pour le formulaire de contact et le profil adhérent.
  - **Destinataires** : la page cite les prestataires techniques (Cloudflare,
    Neon, OneSignal) mais pas les destinataires au sens du RGPD (bureau,
    secrétaires, chefs de pupitre ayant accès aux réponses de présence).
  - **Durée de conservation** : la page indique « le temps nécessaire » ; une
    durée chiffrée par catégorie de données est attendue (messages de contact,
    comptes adhérents, réponses RSVP).
  - **Crédits photographiques** : la LCEN demande de faire figurer la propriété
    intellectuelle des images. La page renvoie aux auteurs sans les nommer.
  - **Non applicable** à cette association, et donc absent volontairement :
    RCS/RNE, TVA intracommunautaire, CGV, résiliation d'abonnement en ligne,
    activité artisanale ou réglementée. Le point mérite d'être confirmé pour
    écarter toute ambiguïté lors d'une relecture juridique.
- **Résolu le 2026-11-11** pour l'identité de la personne morale : les données
  officielles ont été fournies par le bureau depuis
  <https://annuaire-entreprises.data.gouv.fr/entreprise/bagad-penhars-504354234#association-section>
  et figurent désormais dans l'encart « Identité de l'association » de la page :
  dénomination « Bagad Penhars », forme juridique « Association déclarée »,
  SIREN 504 354 234, SIRET du siège 504 354 234 00024, n° RNA W294 004 157,
  date de création 4 décembre 1985, siège 6 avenue des Oiseaux, 29000 Quimper,
  objet « promotion musicale et culturelle bretonne ». Restent ouverts les
  points listés ci-dessus (téléphones, nom du directeur de la publication,
  crédits photo, précisions RGPD).

## 2026-11-20 — Audit RLS backend

**Contexte.** Cette section consigne l'**audit RLS backend**, conduit **en lecture seule** sur la branche Neon `test`
(6 migrations appliquées, 29 tables, rôle `bagad_app` sans `SUPERUSER`, sans
`BYPASSRLS`, sans rôle parent). **Aucun fichier n'a été modifié, aucune
migration générée, aucune écriture en base, `production` n'a jamais été
contactée.**


### Questions ouvertes du 2026-11-20

Les décisions Q-A1 à Q-A9 sont détaillées dans `equipe/PLAN.md` §9 et `database.md`; les points ci-dessous restent ouverts.


Les cinq questions ci-dessous ne bloquent **aucune** étape du plan. Elles sont
consignées telles quelles pour que les développeurs ne tranchent pas à la place
du client.

#### Question 1 : Événements `pupitre` déjà créés par des chefs sur `test`

- **Contexte :** la branche `test` contient **16 événements**, dont **4 créés par
  des chefs** en visibilité `pupitre`. La règle Q-A2 interdit désormais à un chef
  de produire cette visibilité.
- **Ambiguïté :** ces 4 événements restent-ils **modifiables** par leur chef
  (renommage, date, description) **sans changer la visibilité** ? Un `WITH CHECK`
  strict sur `visibility` refuserait toute mise à jour, même anodine.
- **Options possibles :** **A** aucune exception (ils deviennent non modifiables
  par le chef, seul un rôle secrétaire/admin peut les corriger) / **B** exception
  limitée à la conservation de la visibilité existante (`OLD.visibility`), sans
  possibilité de la changer / **C** campagne de données ponctuelle pour les
  ramener en `interne`.
- **Recommandation :** **B**, si le client confirme qu'il veut que les chefs
  puissent corriger leurs événements existants ; sinon **A**, plus simple et plus
  strict. Dans tous les cas, **la migration ne réécrit aucune donnée** : l'étape
  54 vérifie seulement que ces 4 lignes restent inchangées.

#### Question 2 : `can_view_event` conserve la branche `created_by`

- **Contexte :** Q-A1 ne concerne que la **gestion**. La fonction de **lecture**
  `app.can_view_event()` conserve sa branche `OR e.created_by =
  app.current_profile_id()`.
- **Ambiguïté :** un chef qui a créé un événement qu'il **ne gère plus** (perte
  du pupitre, événement élargi) doit-il conserver la **lecture** de cet
  événement ? Aujourd'hui : oui.
- **Options possibles :** **A** conserver la branche (aucun changement) / **B**
  aligner la lecture sur la visibilité seule (un événement `pupitre` reste lisible
  par les membres des pupitres ciblés, indépendamment du créateur).
- **Recommandation :** **A**, ne rien changer tant que le client n'a pas tranché :
  la branche est conservée par décision explicite, et la retirer pourrait masquer
  à un chef un événement qu'il a lui-même créé.

#### Question 3 : Chef de plusieurs pupitres et événement multi-pupitres

- **Contexte :** Q-A2 impose à un chef **exactement 1** pupitre, même s'il en
  dirige plusieurs.
- **Ambiguïté :** un chef dirigeant **deux pupitres** doit-il pouvoir créer un
  événement ciblant **ces deux pupitres** (par exemple une répétition commune) ?
  Aujourd'hui : **non**, il doit passer par la secrétaire.
- **Options possibles :** **A** statu quo (exactement 1 pupitre) / **B**
  autoriser N pupitres **tant qu'ils sont tous dirigés par lui**, toujours en
  visibilité `interne` / **C** autoriser B sans changer la visibilité.
- **Recommandation :** **A** pour la première livraison (règle simple, testable,
  cohérente avec §12.1) ; **B** si le bureau juge la friction réelle en usage.

#### Question 4 : Suppression par un chef — événements à venir seulement ?

- **Contexte :** Q-A4 décide que le chef **peut supprimer** un événement
  mono-pupitre de son pupitre.
- **Ambiguïté :** la règle s'applique-t-elle aux **événements passés** (et à
  leurs réponses) ou **uniquement aux événements à venir** ?
- **Options possibles :** **A** aucune restriction temporelle / **B** suppression
  limitée aux événements **dont la date n'est pas dépassée** / **C** suppression
  possible sur les événements à venir, **annulation** (`cancelled_at`) seule sur
  les événements passés.
- **Recommandation :** **C** : c'est cohérent avec la conservation des réponses
  (§12.2) et évite qu'un chef efface l'historique de présence d'une répétition
  passée. Tant que la question est ouverte, le plan **n'ajoute aucune restriction
  temporelle** (option A par défaut, donc l'état le plus permissif, à réviser).

## 2026-11-25 — Chargement ciblé de l'espace privé (plan §10, contrat §7.11)

**Contexte.** Le client demande de supprimer `buildMemberSnapshot` et les
réponses « instantané complet » au profit de **lectures serveur ciblées par
page** (`src/lib/server/member/queries/`), avec des DTO ne contenant que les
champs utiles, en conservant les guards serveur, `withUserContext(..., profileId)`
et le RLS `app.profile_id`. Le plan §10 (étapes 58 à 73) et le contrat §3.1,
§7.11, §7.12 et §11.1 portent ce chantier. **Aucune évolution de schéma, aucune
migration, aucun nouveau package.**

**État vérifié (lecture seule) :**

- `src/lib/server/member/snapshot.ts` construit 10 sections et renvoie
  `MemberSnapshot` ; `GET /api/member` renvoie cet instantané complet.
- `src/routes/dashboard/+layout.server.ts` charge **toutes** les sections pour
  `/dashboard/admin` et pour toute route inconnue.
- `snapshot.ts` lit `profiles`, `profile_pupitres` et `event_responses` **sans
  filtre** (lignes 145, 183, 329).
- L'annuaire **fabrique** des valeurs (`email: ''`, `role: 'member'`,
  `accountStatus: 'active'`, `joinedAt: ''`, lignes 256-275), ce que §12.3 et
  §12.7 interdisent (« aucune valeur inventée »).

### Question 1 : `isChef` d'un autre profil — affichage des chefs et édition

- **Réf.** : Q-2026-11-25-01.
- **Contexte :** `isChef` n'est aujourd'hui pas limité au profil courant.
  `src/lib/member/services/members.ts` s'en sert pour `activeChefs` (espace
  pupitre) et `AdminMembersPage` pour éditer les pupitres. Le DTO cible ne doit
  exposer `isChef` que là où l'écran l'utilise.
- **Ambiguïté ou conflit :** §12.3 et Q-A5 déclarent `isChef` **strictement
  interne** et interdisent explicitement `/dashboard/pupitre/membres`, page qui
  affiche pourtant les chefs. Retirer `isChef` d'autrui **viderait** ces listes :
  ce serait une modification d'interface, contraire à la consigne « UI
  strictement inchangée ».
- **Options possibles :** **A** conserver la projection actuelle, mais
  **uniquement** par `getPupitrePage` et `listAdminMembersPage`, jamais dans
  l'annuaire, l'agenda ou les notifications (comportement retenu par défaut par
  le plan §10) / **B** retirer totalement `isChef` d'autrui et le remplacer par
  une donnée dédiée `pupitreChefs` (liste de noms), ce qui exige de modifier
  `services/members.ts` **et** l'affichage / **C** réserver `isChef` aux rôles
  `secretaire`/`admin` et retirer la liste des chefs de l'espace pupitre.
- **Décision Chef (2026-11-25) : A** — conservation de la projection actuelle
  sans modification d'écran ; `isChef` n'apparaît que dans
  `getPupitrePage` (liste des chefs du pupitre) et
  `listAdminMembersPage` (édition des pupitres), jamais dans l'annuaire,
  l'agenda, le détail d'événement ou les notifications. Aucune donnée
  nominative supplémentaire n'est exposée.

### Question 2 : droits d'écriture sur `tests/**`

- **Réf.** : Q-2026-11-25-02.
- **Contexte :** l'étape 73 prévoit `tests/member-queries.test.ts` (clés des
  DTO, comptage de requêtes, refus de rôle). `tests/i18n.test.ts` et
  `tests/invitation.test.ts` existent mais sont **vides** (0 octet).
- **Ambiguïté ou conflit :** la répartition des rôles ne dit pas explicitement
  qui écrit dans `tests/**`. `AGENTS.md` §3 réserve `equipe/TESTS.md` et
  `equipe/essais/` au Testeur, sans nommer `tests/**`. L'étape 73 reste donc
  **planifiée mais non attribuable**.
- **Options possibles :** **A** Testeur (cohérent avec `equipe/TESTS.md`) /
  **B** dev-backend (les fonctions testées sont les siennes) / **C** dev-frontend
  (les DTO et le store sont les siens).
- **Décision Chef (2026-11-25) : A** — attribution au Testeur conformément à
  `equipe/TESTS.md` ; relecture du code testé par le Backend. La décision est
  consignée pour le démarrage de l'étape 73 ; aucune autre étape n'en dépend.

### Question 3 : tests vides existants (`i18n`, `invitation`)

- **Réf.** : Q-2026-11-25-03.
- **Contexte :** `tests/i18n.test.ts` doit couvrir la **parité des clés** des
  dictionnaires typés `fr`/`en`/`br` (pas `svelte-i18n`), et
  `tests/invitation.test.ts` le parcours d'invitation (jeton 1 h, usage unique,
  adresse concordante, révocation), conformément aux étapes 45 et 57.
- **Ambiguïté ou conflit :** ces deux fichiers ne relèvent pas du chantier
  « chargement ciblé ». Les remplir « au passage » élargirait le périmètre sans
  validation.
- **Options possibles :** **A** les traiter dans une étape dédiée après l'étape
  73 / **B** les intégrer aux étapes 45 et 57 existantes / **C** les laisser
  ouverts.
- **Décision Chef (2026-11-25) : B** — intégrer le test de parité des clés
  dictionnaires (`fr`/`en`/`br`) aux étape 45 (déjà en cours) et le test
  parcours d'invitation à l'étape 57, sans toucher au chantier « chargement
  ciblé » 58-73. Ne pas les remplir pendant les étapes 58 à 73.

### Point documentaire — `AGENTS.md` corrigé

`AGENTS.md` §2 nomme désormais `set_config('app.profile_id', '...', true)` et
déclare le contexte conforme à Q-A9. L'écart de gouvernance C9 du plan §8 est
donc **levé côté client** ; il reste à en tenir compte à l'étape 57 (le test
`grep` sur `app.current_user_id` doit désormais être **vert** hors commentaire).

### Point documentaire — `svelte-i18n` hors de la pile déclarée

`AGENTS.md` §0 ne cite plus `svelte-i18n` dans la pile frontend (SvelteKit 5 +
Tailwind), alors que le plan §7.1 le conserve comme dépendance inerte et que
`docs/questions.md` (2026-11-21) actait sa conservation. **Aucune étape du
chantier 2026-11-25 ne touche à ce paquet.** Le retrait du `package.json`
relèverait d'une décision du mainteneur et du client (audit de dépendance), pas
d'une conséquence automatique de la formulation d'`AGENTS.md` : ne pas
l'installer, ne pas le retirer sans arbitrage.
