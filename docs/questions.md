# Questions à trancher

Répondre aux questions produit avant d'implémenter le comportement concerné.
Pour chaque décision, consigner la réponse, la personne qui l'a validée et la
date. Les hypothèses techniques ne remplacent pas une décision produit.

## Décisions déjà prises

- Supabase est l'unique fournisseur de données : Supabase Auth, PostgreSQL/RLS
  et Storage.
- Netlify sert à héberger l'application.
- OneSignal est le service prévu pour les notifications push.
- L'interface adhérent est en français; les langues publiques ont été tranchées
  en français, anglais et breton.

## P0 — À décider avant de développer les fonctions concernées

1. **Langues publiques** — le site public est-il en français uniquement ou en
   français, anglais et breton? Le dépôt contient déjà un routage `fr/en/br`,
   mais le brief laisse la décision ouverte.

   Décision : français, anglais et breton (fr/en/br).

2. **Rôle secrétaire** — la secrétaire est-elle un rôle applicatif autonome
   (`secretaire`) ou un titre de bureau? Le brief dit que les titres du bureau
   ne donnent aucun droit, mais le schéma historique ne contient pas de rôle
   `secretaire`. Confirmer aussi si une secrétaire peut modifier/consulter
   toutes les données de membres nécessaires aux invitations et validations,
   sans avoir les droits globaux de l'admin.

   Décision : la secrétaire est un rôle applicatif autonome (`secretaire`). Elle peut gérer les membres, invitations et validations nécessaires à sa fonction, sans disposer des droits globaux de l'admin. L'attribution d'une fonction au bureau n'attribue jamais automatiquement un rôle applicatif : les deux restent indépendants. Président et trésorier sont des titres honorifiques sans droits métier dans l'application. Les statuts du compte (`pending`, `active`, `suspended`) sont distincts du rôle applicatif.

3. **Invitations et approbation** — décision validée le 2026-11-01 :
   seul l'administrateur envoie l'invitation avec `inviteUserByEmail()`.
   Le lien Supabase Auth expire après une heure. Le membre confirme son
   adresse et définit son mot de passe ; `account_status` reste `pending`
   jusqu'à activation manuelle par l'administrateur après confirmation de
   l'adresse. L'activation ne change pas `app_role`.
   Si le lien expire, l'administrateur peut renvoyer une invitation au compte
   Auth existant. Le rôle initial est `member`; l'activation ne change que
   `account_status`.
   Les paramètres Auth du projet hébergé et les modèles d'e-mails d'invitation
   sont à configurer dans le Dashboard Supabase ; il s'agit d'une opération
   technique, pas d'une décision produit.

4. **Visibilité des partitions et événements** — le brief précise que tous les
   membres approuvés peuvent consulter les partitions de tous les pupitres;
   une autre phrase dit « visibles selon le pupitre ». Confirmer la règle
   d'accès en lecture. Les droits de dépôt (chef sur son pupitre, secrétaire
   et admin) sont-ils bien distincts des droits de lecture?

   Décision : les partitions sont visibles par tous les membres actifs,
   quel que soit leur pupitre. Un chef ne peut gérer que les événements de son
   pupitre unique, même s'il n'en est pas l'auteur. Les événements publics,
   globaux ou multi-pupitres sont gérés exclusivement par l'admin ou la
   secrétaire.

5. **Événements par pupitre** — les chefs créent des événements pour leur
   pupitre, mais le modèle historique d'événement n'a pas de champ
   d'audience/pupitre. Un événement peut-il cibler plusieurs pupitres? Qui peut
   créer les représentations publiques et les événements communs?

   Décision validée le 2026-11-01 : la secrétaire et l'administrateur peuvent
   créer, modifier et supprimer tous les événements, y compris ceux ciblant
   plusieurs pupitres ou tous les pupitres. Un chef gère uniquement ceux de son
   pupitre unique, indépendamment de `author_id`; les événements
   multi-pupitres ou globaux ne sont pas gérables par un chef. Décision
   actualisée le 2026-11-01 : `event_type` est un ENUM (`sortie`, `concert`,
   `fest-noz`, `festival`, `concours`, `gala`, `repetition`, `reunion`,
   `repas`) et `visibility` est un ENUM indépendant (`public`, `interne`,
   `pupitre`). Les événements `pupitre` ne sont visibles et ouverts aux
   réponses que pour les membres actifs des pupitres ciblés ; un chef crée
   toujours un événement ciblé sur son pupitre. Les événements `interne` sont
   visibles et ouverts aux réponses de tous les membres actifs.

6. **Présences et sondages** — les réponses à un événement sont décrites comme
   oui/non, tandis que le sondage utilise présent/absent. S'agit-il de deux types de réponse distincts ou d'une seule
   fonctionnalité? À quel moment un sondage crée-t-il l'événement : dès sa
   création, à sa clôture ou après validation? Que devient l'événement si le
   sondage est annulé?

    Décision : les réponses aux sondages sont présent ou absent. Un sondage
    n'a pas d'étape de validation préalable.

7. **Notifications** — OneSignal est confirmé, mais faut-il envoyer des push
   uniquement ou aussi des emails? Quel événement déclenche des notifications
   automatiques (nouvel événement, rappel, nouvelle partition), et les membres
   peuvent-ils gérer leurs préférences ou se désabonner?

Décision : notifications push via OneSignal uniquement pour la première
version. Les nouveaux événements déclenchent une notification automatique.
Les membres peuvent gérer leurs préférences de notification.

8. **Contact** — quelle adresse reçoit les formulaires? Faut-il envoyer une
   confirmation à l'expéditeur? Les pièces jointes sont-elles interdites? Qui
   traite les messages?

   Décision : les messages sont envoyés à l'adresse officielle de l'association,
   configurée dans Netlify. Une confirmation est envoyée à l'expéditeur. Pas
   de pièces jointes. Les responsables du bureau traitent manuellement les
   soumissions dans le dashboard Netlify.

## P1 — À décider avant mise en production ou import de données

9. **Données existantes** — le nouveau projet Supabase démarre-t-il sans
   données, ou faut-il migrer des comptes, invitations, événements et fichiers
   depuis le système historique? Si une migration est requise, quelle source
   est la référence et quelles données doivent être conservées?

   Décision : démarrage avec une base Supabase vierge. Aucune migration historique prévue.

10. **Comptes et suppressions** — un membre peut-il demander la suppression de
    son compte? Quelle durée de conservation appliquer aux réponses de
    présence, invitations utilisées et journaux d'audit après son départ?

Décision : un membre peut demander la suppression de son compte. Les données personnelles sont supprimées ou anonymisées selon les obligations légales. Les durées de conservation des présences et journaux d'audit restent à définir.

11. **Fuseau horaire et récurrence** — décision validée le 2026-11-01 :
    fuseau de référence `Europe/Paris`, changements d'heure gérés
    automatiquement. Aucune gestion des événements récurrents en V1 ; la
    migration 005 ne contient pas `event_series`, `events.series_id` ni les
    objets exclusivement liés aux récurrences.

12. **Photos et vie privée** — qui peut publier/supprimer un album? Quel
    processus de retrait appliquer si une personne demande la suppression
    d'une photo? Les médias publics seront-ils accessibles sans connexion
    après publication?

    Décision : l'admin et la secrétaire peuvent publier et supprimer les albums. Toute demande de retrait d'une photo est traitée rapidement par un responsable habilité. Les médias publics publiés sont accessibles sans connexion.
    Décision Storage validée le 2026-11-01 : les médias publics vont dans
    `bagad-public` (`public = true`) ; les photos de profil et documents privés
    vont dans `bagad-private` (`public = false`). Les profils actifs peuvent
    lire les avatars de tous les membres actifs ; seul le propriétaire modifie
    sa photo, administrateurs inclus.

13. **OneSignal et PWA** — le document PWA signale le conflit potentiel entre
    son service worker et celui de OneSignal. Quelle approche faut-il valider,
    et quelles plateformes/navigateurs sont requis pour la première version?

Décision : utiliser une configuration compatible avec le service worker de l'application et celui de OneSignal. La compatibilité des navigateurs et plateformes sera validée avant mise en production.

14. **Environnements Supabase** — prévoir un projet distinct pour développement,
    preview et production, ou utiliser des branches Supabase? Qui gère les
    accès et sauvegardes de production? Ne jamais inscrire de clés ou secrets
    dans ce fichier.
    Décision : environnements distincts pour le développement, la preview et la production. Accès à la production réservé aux personnes autorisées. Sauvegardes régulières obligatoires. Aucun secret dans le dépôt.

## P2 — À préciser lors de la définition UI

15. **Page Formation** — pour chaque instrument (bombarde, cornemuse, caisse
    claire, percussion), quels éléments faut-il publier : âge ou niveau requis,
    contenu des cours, horaires, lieu, enseignant, prêt d'instrument, tarif et
    modalités d'inscription? Quel canal de contact doit être proposé?

    Décision : présenter les quatre instruments, les niveaux requis, le contenu des cours, les horaires, le lieu, les modalités de prêt d'instrument. Les informations manquantes seront complétées par le bureau.

16. **Page Bagad** — quels éléments doivent présenter l'association (histoire,
    dates clés, effectif, valeurs, photos, palmarès)? Qui valide les textes et
    les chiffres publiés?

   Décision : présenter l'histoire, les valeurs, les dates clés, l'effectif, les photos et les principaux événements ou palmarès. Les contenus sont validés par le bureau. 

17. **Profil membre** — quels champs le membre peut-il modifier lui-même
    (téléphone, photo, email, nom), et lesquels ne peuvent être modifiés que
    par l'admin ou la secrétaire?

    **Question close — voir la décision validée à la question 21.** Le membre
    peut modifier ses informations de profil et uniquement sa propre photo,
    administrateurs inclus ; il ne peut modifier ni son rôle ni ses pupitres.
    Le trombinoscope est obligatoire dès la V1 et expose uniquement les champs
    décidés. L'admin et la secrétaire peuvent modifier les pupitres; seuls les
    admins peuvent attribuer les rôles applicatifs supérieurs.

18. **Contenus publics** — quels champs composent un article et un album
    (titre, texte, date, auteur, légende, ordre des photos)? Une publication
    nécessite-t-elle une prévisualisation ou une confirmation?

    Décision : articles avec titre, texte, date et auteur ; albums avec titre, description, date, légendes et ordre des photos. Une prévisualisation est requise avant publication.

19. **Capacités fichiers** — partitions PDF uniquement. Voir la décision 29
    pour le traitement et les limites des photos; les avatars sont stockés
    dans le bucket privé, les vidéos sont interdites.

## Questions complémentaires avant les fonctions concernées

20. **Langue de l'espace adhérents** — décision confirmée : le site public est
    disponible en français, anglais et breton (`fr`, `en`, `br`); l'espace
    adhérents et les pages d'authentification sont en français uniquement.

    **Question close.** Cette décision est également reprise dans
    [`docs/brief.md`](./brief.md) et [`docs/Spec.md`](./Spec.md).

21. **Modification du profil** — la réponse à la question 17 (« tout sauf son
    pupitre peuvent être modifiés que par l'admin ou la secrétaire ») peut
    signifier que tous les champs sauf le pupitre sont réservés à ces rôles,
    ou que le membre peut modifier son pupitre. Quels champs le membre peut-il
    modifier? La secrétaire peut-elle modifier les mêmes champs que l'admin?

    Décision : le membre peut modifier ses informations de profil sauf son
    rôle et ses pupitres. L'admin et la secrétaire peuvent modifier les
    pupitres. L'attribution des rôles applicatifs supérieurs reste réservée à
    l'admin.

22. **Publication des événements par un chef** — la réponse saisie sous la
    question 4 indique qu'un chef peut choisir de publier « pour tout le monde »,
    tandis que la réponse à la question 5 réserve les événements publics à
    l'admin et à la secrétaire. « Tout le monde » désigne-t-il tous les membres
    ou le site public? Un chef peut-il publier un événement sur le site public?

    Décision actualisée le 2026-11-01 : `event_type` est un ENUM de neuf valeurs
    (`sortie`, `concert`, `fest-noz`, `festival`, `concours`, `gala`,
    `repetition`, `reunion`, `repas`). `visibility` est un ENUM indépendant
    avec trois valeurs :
    - `public` : visible par tout le monde (visiteurs non connectés et membres connectés).
    - `interne` : visible par tous les membres connectés approuvés.
    - `pupitre` : visible et ouvert aux réponses uniquement aux membres actifs
      des pupitres ciblés.
    Une répétition peut avoir chacune des trois visibilités. Un chef crée
    uniquement des événements `pupitre` pour son pupitre et peut gérer tout
    événement `pupitre` de son pupitre, même s'il n'en est pas l'auteur. Les
    événements multi-pupitres ou globaux relèvent exclusivement de l'admin et
    de la secrétaire. Validé le 2026-11-01.

23. **Sondages** — les sondages sont-ils des événements et nécessitent-ils une
    validation préalable? Qui peut les modifier ou les supprimer?

    Décision : le sondage est lui-même l'événement d'agenda; il est créé sans
    validation préalable ni création différée d'un second événement. L'admin
    et la secrétaire peuvent le modifier ou le supprimer; les droits des chefs
    sur les événements de leur pupitre sont précisés à la question 27.

24. **Préférences et audiences OneSignal** — quelles préférences un membre
    peut-il gérer (désactivation globale, rappels, types d'événements)? À quels
    membres sont envoyées les notifications automatiques d'un événement selon
    son audience?

    Décision : le membre peut régler ses préférences globales, les rappels et
    les notifications d'événements, dont les rappels lorsqu'il n'a pas répondu
    au sondage d'un événement.

25. **Conservation et suppression** — quelles durées appliquer aux présences
    et journaux d'audit? Quel processus permet de traiter la demande de
    suppression d'un membre tout en respectant les obligations légales?

    Décision : voir la décision 10 pour la suppression du compte. Les durées
    de conservation des présences et journaux d'audit restent à définir.

26. **Limites des fichiers médias** — quelles tailles maximales et quels
    formats accepter pour les avatars, photos et vidéos? (Les partitions sont
    limitées au PDF.)

    Décision : les photos source JPG/JPEG jusqu'à 20 Mo sont converties en WebP.
    Les avatars sont enregistrés sous `profiles/{profile_id}/avatar.webp` dans
    le bucket privé. Voir la décision 29; les vidéos sont interdites.

## Questions restantes

27. **Audience des notifications de sondage** — à quels membres la notification
    push d'un sondage est-elle envoyée : tous les membres, les membres du
    pupitre ciblé, ou seulement ceux qui ont activé cette préférence?

    Décision : VALIDÉE (le 2026-10-26)

    L'audience des notifications push dépend de la portée du sondage :

    - **Sondage de pupitre :** seuls les membres du ou des pupitres ciblés sont notifiés.
    - **Sondage interne :** tous les membres du Bagad sont notifiés.
    - **Sondage public :** tous les membres du Bagad sont notifiés.

    Les notifications push sont envoyées uniquement aux membres concernés qui ont activé les notifications sur leur appareil et n'ont pas désactivé la préférence correspondante.

    Les droits de consultation du sondage restent distincts des préférences de notification : la notification ne confère aucun droit d'accès supplémentaire.

    Les règles de création, de modification et de suppression restent celles définies dans les décisions relatives aux rôles et aux événements.

28. **Netlify Forms** — les soumissions du formulaire de contact sont gérées
    manuellement par les responsables du bureau dans le dashboard Netlify.
    **Question close :** leur traitement opérationnel relève de Netlify et ne
    nécessite pas de règle de conservation dans cette documentation produit.
    L'intégration du formulaire dans l'application reste une tâche
    d'implémentation, pas une décision produit. Les durées de conservation des
    présences et journaux d'audit restent suivies à la question 25.

29. **Médias** — décision : refuser les vidéos; accepter les photos source
    JPG/JPEG jusqu'à 20 Mo et les convertir en WebP. Les avatars sont stockés
    dans le bucket privé au chemin `profiles/{profile_id}/avatar.webp`.

30. **Modélisation des sondages (`events` vs `polls`)** — la décision 23 indique
    que « le sondage est lui-même l'événement d'agenda ». Pourtant, la
    documentation de la base (`docs/database.md`) mentionnait encore deux tables
    distinctes `polls` et `poll_responses`.

    **Statut : VALIDÉE** (le 2026-10-26)

    **Décision :** le sondage est lui-même un événement d'agenda. Les sondages et les événements classiques sont donc regroupés dans la table `events`, au moyen d'un champ `is_poll BOOLEAN NOT NULL DEFAULT FALSE`.

    La table `polls` est supprimée au profit de `events`. La table `poll_responses` est remplacée par `event_responses`, sous réserve de vérifier la compatibilité des données et des contraintes existantes.

    Les réponses utilisent exclusivement les statuts `present` et `absent` (`create type response_status as enum ('present', 'absent');`).

    La portée du sondage (pupitre, interne ou public) est distincte de son type (`is_poll`) et détermine son audience et ses règles d'accès :

    - **Pupitre :** notification aux membres des pupitres ciblés.
    - **Interne :** notification à tous les membres du Bagad.
    - **Public :** notification à tous les membres du Bagad.

    Les règles de permissions et de notifications définies dans les autres décisions restent applicables.

    **Consignes techniques :** avant toute migration, le développeur doit examiner `docs/database.md`, le schéma réel, les données existantes, les clés étrangères, les contraintes, les policies RLS et le code applicatif. Il doit mettre à jour la documentation et proposer une migration cohérente, sans perte de données ni régression fonctionnelle.
31. **Nettoyage immédiat du socle technique (legacy)** — le dépôt contenait
    encore les packages et fichiers de Better Auth, Kysely, pg et Netlify
    Blobs.
    Décision : package.json nettoyé et réinitialisé comme un projet vierge avec
    les dépendances officielles Supabase SSR, et purge du legacy. Validé le 2026-10-26.

32. **Statut du compte et rôle applicatif** — distinction validée le
    2026-11-01 : `account_status` vaut `pending`, `active` ou `suspended`;
    `app_role` vaut `member`, `chef_pupitre`, `secretaire` ou `admin`.
    L'activation n'attribue pas un rôle et la suspension bloque l'accès sans
    supprimer les données.

33. **Pupitre Percussion** — Percussion reste distinct, mais toute affectation
    Percussion donne aussi une appartenance effective à Caisse claire, sans
    dupliquer la ligne d'affectation. Cette appartenance héritée ouvre les
    événements Caisse claire ; elle ne confère pas au chef de Percussion les
    droits de gestion du chef de Caisse claire.

34. **Trombinoscope V1** — exigence obligatoire à la première mise en
    production. Une vue SQL limitée aux champs autorisés, ses relations et
    l'accès privé aux avatars doivent être opérationnels avant lancement.

## Règle de validation

Chaque décision est validée par le responsable du projet et datée lors de son
approbation. Toute décision non confirmée reste explicitement marquée À VALIDER
et ne doit pas être considérée comme une exigence produit définitive.