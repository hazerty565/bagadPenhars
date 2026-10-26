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

   Décision : la secrétaire est un rôle applicatif autonome (secretaire). Elle peut gérer les membres, invitations et validations nécessaires à sa fonction, sans disposer des droits globaux de l'admin.

3. **Invitations et approbation** — le brief autorise l'admin et la secrétaire
   à inviter et approuver, tandis que d'anciens écrans/documentations semblent
   réserver certaines actions à l'admin. Confirmer les rôles autorisés,
   notamment si l'approbation donne toujours le rôle `member` ou peut attribuer
   un autre rôle. Quelle durée d'expiration faut-il appliquer? Une ancienne
   documentation indique sept jours, mais ce délai n'est pas dans le brief.

   Décision : l'admin et la secrétaire peuvent inviter et approuver les adhérents. Toute approbation attribue le rôle member. Les invitations expirent après 7 jours.

4. **Visibilité des partitions et événements** — le brief précise que tous les
   membres approuvés peuvent consulter les partitions de tous les pupitres;
   une autre phrase dit « visibles selon le pupitre ». Confirmer la règle
   d'accès en lecture. Les droits de dépôt (chef sur son pupitre, secrétaire
   et admin) sont-ils bien distincts des droits de lecture?

   Décision : les partitions sont visibles par tous les membres approuvés,
   quel que soit leur pupitre. Un événement peut cibler un ou plusieurs
   pupitres. Les événements communs et les événements publics sont créés par
   l'admin ou la secrétaire. Un chef de pupitre ne crée que des événements
   concernant son pupitre.

5. **Événements par pupitre** — les chefs créent des événements pour leur
   pupitre, mais le modèle historique d'événement n'a pas de champ
   d'audience/pupitre. Un événement peut-il cibler plusieurs pupitres? Qui peut
   créer les représentations publiques et les événements communs?

   Décision : un événement peut cibler un ou plusieurs pupitres. Les événements communs et les événements publics sont créés par l'admin ou la secrétaire. Un chef de pupitre ne peut créer que des événements concernant son pupitre.

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
   traite les messages et combien de temps sont-ils conservés?

   Décision : les messages sont envoyés à l'adresse officielle de l'association,
   à configurer. Une confirmation est envoyée à l'expéditeur. Pas de pièces
   jointes. Les responsables du bureau traitent les messages.

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

11. **Fuseau horaire et récurrence** — confirmer le fuseau de référence
    (probablement Europe/Paris), la gestion des changements d'heure, les
    exceptions aux répétitions récurrentes et les modifications d'une seule
    occurrence.
Décision : fuseau Europe/Paris. Les changements d'heure sont gérés automatiquement. Les occurrences récurrentes peuvent être modifiées individuellement sans modifier toute la série.

12. **Photos et vie privée** — qui peut publier/supprimer un album? Quel
    processus de retrait appliquer si une personne demande la suppression
    d'une photo? Les médias publics seront-ils accessibles sans connexion
    après publication?

    Décision : l'admin et la secrétaire peuvent publier et supprimer les albums. Toute demande de retrait d'une photo est traitée rapidement par un responsable habilité. Les médias publics publiés sont accessibles sans connexion.

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

    tout sauf sont pupitre peuvent être modifiés que
    par l'admin ou la secrétaire.

18. **Contenus publics** — quels champs composent un article et un album
    (titre, texte, date, auteur, légende, ordre des photos)? Une publication
    nécessite-t-elle une prévisualisation ou une confirmation?

    Décision : articles avec titre, texte, date et auteur ; albums avec titre, description, date, légendes et ordre des photos. Une prévisualisation est requise avant publication.

19. **Capacités fichiers** — partitions PDF uniquement. Voir la décision 29
    pour le traitement et les limites des photos; aucun avatar ni vidéo pour
    la première version.

## Questions complémentaires avant les fonctions concernées

20. **Langue de l'espace adhérents** — le brief et le README indiquent le
    français uniquement, tandis que la section « Décisions déjà prises »
    ci-dessus indique français/anglais. Quelle règle faut-il appliquer?

     Décision : le site public est en français, anglais et breton; l'espace
     adhérents est en français uniquement.

21. **Modification du profil** — la réponse à la question 17 (« tout sauf son
    pupitre peuvent être modifiés que par l'admin ou la secrétaire ») peut
    signifier que tous les champs sauf le pupitre sont réservés à ces rôles,
    ou que le membre peut modifier son pupitre. Quels champs le membre peut-il
    modifier? La secrétaire peut-elle modifier les mêmes champs que l'admin?

    Décision : le membre peut modifier ses informations de profil sauf son
    rôle et son ou ses pupitres. L'admin et la secrétaire peuvent modifier les
    pupitres. L'attribution des rôles applicatifs supérieurs reste réservée à
    l'admin.

22. **Publication des événements par un chef** — la réponse saisie sous la
    question 4 indique qu'un chef peut choisir de publier « pour tout le monde »,
    tandis que la réponse à la question 5 réserve les événements publics à
    l'admin et à la secrétaire. « Tout le monde » désigne-t-il tous les membres
    ou le site public? Un chef peut-il publier un événement sur le site public?

    Décision : l'agenda public est consultable sans connexion. Les événements
    ciblés par pupitre sont visibles par tous les membres approuvés; un chef ne
    crée que des événements concernant son ou ses pupitres. L'admin et la
    secrétaire créent les événements communs internes (par exemple repas ou
    répétition générale privée) et les événements destinés à l'agenda public.

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

25. **Conservation et suppression** — quelles durées appliquer aux présences,
    journaux d'audit et messages de contact? Quel processus permet de traiter
    la demande de suppression d'un membre tout en respectant les obligations
    légales?

    Décision : le formulaire de contact utilise Netlify Forms pour le moment.
    Cette réponse ne fixe pas les durées de conservation des présences et
    journaux d'audit, ni le traitement des demandes de suppression de compte.

26. **Limites des fichiers médias** — quelles tailles maximales et quels
    formats accepter pour les avatars, photos et vidéos? (Les partitions sont
    limitées au PDF.)

    Décision : pas d'avatar téléversé pour la première version; afficher les
    initiales du prénom et du nom. Les photos publiées sont au format WebP.
    Voir la décision 29 : les fichiers JPG/JPEG jusqu'à 20 Mo sont convertis
    en WebP; les vidéos sont interdites.

## Questions restantes

27. **Audience des notifications de sondage** — à quels membres la notification
    push d'un sondage est-elle envoyée : tous les membres, les membres du
    pupitre ciblé, ou seulement ceux qui ont activé cette préférence?

    Décision : l'admin et la secrétaire peuvent créer, modifier et supprimer
    des sondages publics ou privés. Un chef peut créer, modifier et supprimer
    les événements, y compris les sondages, de son ou ses pupitres.
    Statut : l'audience des notifications de sondage reste À VALIDER.

28. **Conservation et suppression** — quelle durée de conservation appliquer
    aux soumissions Netlify Forms, présences et journaux d'audit? Quel processus
    suivre pour une demande de suppression de compte? La destination des
    notifications de formulaire et la confirmation à l'expéditeur sont déjà
    décidées; il reste à confirmer leur configuration effective avec Netlify
    Forms.

    Décision : la configuration Netlify Forms existe déjà; seul le code
    d'intégration et sa validation sont à effectuer. La consigne « ne rien
    faire pour le moment » rend le calendrier ambigu.
    Statut : À VALIDER — faut-il différer l'intégration ou l'inclure dans la
    prochaine tâche? Le mécanisme de confirmation à l'expéditeur, les durées
    de conservation et le traitement des demandes de suppression restent
    également à préciser.

29. **Médias** — décision : refuser les vidéos; accepter les photos source
    JPG/JPEG jusqu'à 20 Mo et les convertir en WebP. Aucun avatar téléversé
    pour la première version; afficher les initiales.

## Règle de validation

Chaque décision est validée par le responsable du projet et datée lors de son
approbation. Toute décision non confirmée reste explicitement marquée À VALIDER
et ne doit pas être considérée comme une exigence produit définitive.