# Questions à trancher

Répondre aux questions produit avant d'implémenter le comportement concerné.
Pour chaque décision, consigner la réponse, la personne qui l'a validée et la
date. Les hypothèses techniques ne remplacent pas une décision produit.

## Décisions déjà prises

- Supabase est l'unique fournisseur de données : Supabase Auth, PostgreSQL/RLS
  et Storage.
- Netlify sert à héberger l'application.
- OneSignal est le service prévu pour les notifications push.
- L'interface adhérent est en français/anglais; le brief ne tranche pas encore les
  langues du site public.

## P0 — À décider avant de développer les fonctions concernées

1. **Langues publiques** — le site public est-il en français uniquement ou en
   français, anglais et breton? Le dépôt contient déjà un routage `fr/en/br`,
   mais le brief laisse la décision ouverte.

2. **Rôle secrétaire** — la secrétaire est-elle un rôle applicatif autonome
   (`secretaire`) ou un titre de bureau? Le brief dit que les titres du bureau
   ne donnent aucun droit, mais le schéma historique ne contient pas de rôle
   `secretaire`. Confirmer aussi si une secrétaire peut modifier/consulter
   toutes les données de membres nécessaires aux invitations et validations,
   sans avoir les droits globaux de l'admin.

3. **Invitations et approbation** — le brief autorise l'admin et la secrétaire
   à inviter et approuver, tandis que d'anciens écrans/documentations semblent
   réserver certaines actions à l'admin. Confirmer les rôles autorisés,
   notamment si l'approbation donne toujours le rôle `member` ou peut attribuer
   un autre rôle. Quelle durée d'expiration faut-il appliquer? Une ancienne
   documentation indique sept jours, mais ce délai n'est pas dans le brief.

4. **Visibilité des partitions** — le brief précise que tous les membres
   approuvés peuvent consulter les partitions de tous les pupitres; une autre
   phrase dit « visibles selon le pupitre ». Confirmer la règle d'accès en
   lecture. Les droits de dépôt (chef sur son pupitre, secrétaire et admin)
   sont-ils bien distincts des droits de lecture?

5. **Événements par pupitre** — les chefs créent des événements pour leur
   pupitre, mais le modèle historique d'événement n'a pas de champ
   d'audience/pupitre. Un événement peut-il cibler plusieurs pupitres? Qui peut
   créer les représentations publiques et les événements communs?

6. **Présences et sondages** — les réponses à un événement sont décrites comme
   oui/non, tandis que le sondage utilise présent/absent. S'agit-il de deux types de réponse distincts ou d'une seule
   fonctionnalité? À quel moment un sondage crée-t-il l'événement : dès sa
   création, à sa clôture ou après validation? Que devient l'événement si le
   sondage est annulé?

7. **Notifications** — OneSignal est confirmé, mais faut-il envoyer des push
   uniquement ou aussi des emails? Quel événement déclenche des notifications
   automatiques (nouvel événement, rappel, nouvelle partition), et les membres
   peuvent-ils gérer leurs préférences ou se désabonner?

8. **Contact** — quelle adresse reçoit les formulaires? Faut-il envoyer une
   confirmation à l'expéditeur? Les pièces jointes sont-elles interdites? Qui
   traite les messages et combien de temps sont-ils conservés?

## P1 — À décider avant mise en production ou import de données

9. **Données existantes** — le nouveau projet Supabase démarre-t-il sans
   données, ou faut-il migrer des comptes, invitations, événements et fichiers
   depuis le système historique? Si une migration est requise, quelle source
   est la référence et quelles données doivent être conservées?

10. **Comptes et suppressions** — un membre peut-il demander la suppression de
    son compte? Quelle durée de conservation appliquer aux réponses de
    présence, invitations utilisées et journaux d'audit après son départ?

11. **Fuseau horaire et récurrence** — confirmer le fuseau de référence
    (probablement Europe/Paris), la gestion des changements d'heure, les
    exceptions aux répétitions récurrentes et les modifications d'une seule
    occurrence.

12. **Photos et vie privée** — qui peut publier/supprimer un album? Quel
    processus de retrait appliquer si une personne demande la suppression
    d'une photo? Les médias publics seront-ils accessibles sans connexion
    après publication?

13. **OneSignal et PWA** — le document PWA signale le conflit potentiel entre
    son service worker et celui de OneSignal. Quelle approche faut-il valider,
    et quelles plateformes/navigateurs sont requis pour la première version?

14. **Environnements Supabase** — prévoir un projet distinct pour développement,
    preview et production, ou utiliser des branches Supabase? Qui gère les
    accès et sauvegardes de production? Ne jamais inscrire de clés ou secrets
    dans ce fichier.

## P2 — À préciser lors de la définition UI

15. **Page Formation** — pour chaque instrument (bombarde, cornemuse, caisse
    claire, percussion), quels éléments faut-il publier : âge ou niveau requis,
    contenu des cours, horaires, lieu, enseignant, prêt d'instrument, tarif et
    modalités d'inscription? Quel canal de contact doit être proposé?

16. **Page Bagad** — quels éléments doivent présenter l'association (histoire,
    dates clés, effectif, valeurs, photos, palmarès)? Qui valide les textes et
    les chiffres publiés?

17. **Profil membre** — quels champs le membre peut-il modifier lui-même
    (téléphone, photo, email, nom), et lesquels ne peuvent être modifiés que
    par l'admin ou la secrétaire?

18. **Contenus publics** — quels champs composent un article et un album
    (titre, texte, date, auteur, légende, ordre des photos)? Une publication
    nécessite-t-elle une prévisualisation ou une confirmation?

19. **Capacités fichiers** — quelle taille maximale et quels formats accepter
    pour les partitions, avatars et médias? Le brief indique PDF pour les
    partitions; les limites pour les images et vidéos restent à fixer.

## Point de cohérence documentaire

`AGENTS.md` référence `docs/pwa.md`, mais le fichier présent s'appelle
`docs/Pwa.MD`. Les chemins étant sensibles à la casse dans l'environnement de
développement, faut-il renommer le fichier ou corriger la référence dans les
consignes?
