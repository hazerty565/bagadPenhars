# Maquette UI --- Bagad Penhars

> Document de direction artistique et de cadrage UI pour la refonte du
> site Bagad Penhars.
>
> **Statut :** document de référence pour concevoir et intégrer
> l'interface. Les éléments explicitement demandés par le client sont
> distingués des pistes graphiques proposées, qui restent ajustables.
>
> **Référence du site actuel :** https://bagad-penhars.com/\
> **Maquette de référence :** https://github.com/hazerty565/Test_svelte\
> **Projet de production :** https://github.com/hazerty565/bagadPenhars\
> **Branche de travail consultée pour le projet principal :** `proto`\
> **Date :** 9 novembre 2026

------------------------------------------------------------------------

## 1. Objectif du document

Créer une interface pour le nouveau site du Bagad Penhars qui :

-   conserve et valorise les informations utiles déjà présentes sur le
    site actuel ;
-   modernise nettement l'organisation et la présentation ;
-   possède une identité visuelle reconnaissable, liée au Bagad et à son
    costume ;
-   ne ressemble pas à un template générique produit par une IA ;
-   s'appuie sur les bonnes idées de la maquette Bolt `Test_svelte`,
    sans recopier aveuglément son architecture ni ses contenus de
    démonstration ;
-   s'intègre au projet de production `bagadPenhars` et à ses
    contraintes fonctionnelles.

Le résultat doit évoquer une véritable association musicale et
culturelle bretonne : vivante, accueillante, enracinée dans son
territoire et actuelle.

## 2. Principes directeurs

La direction retenue combine trois influences complémentaires :

### A --- Élégant et éditorial

-   Mise en page aérée et hiérarchie typographique soignée.
-   Fonds clairs, ivoire ou blanc cassé.
-   Titres expressifs, avec une typographie à caractère.
-   Photographies authentiques mises en valeur.
-   Composition inspirée d'un magazine culturel plutôt que d'un tableau
    de bord ou d'un assemblage de cartes.

### B --- Traditionnel et identitaire

-   Identité colorée inspirée du costume du Bagad.
-   Bleu profond et touches dorées.
-   Détails graphiques inspirés des broderies florales réellement
    visibles sur le costume.
-   Ornements employés avec mesure : filets, séparateurs, petites
    frises, détails autour de certains titres ou éléments de navigation.
-   Le résultat doit rester élégant et contemporain, sans tomber dans
    une décoration folklorique excessive.

### C --- Moderne et associatif

-   Navigation simple, compréhensible et responsive.
-   Contenus faciles à parcourir.
-   Composants cohérents et réutilisables.
-   Animations discrètes et utiles.
-   Interface accessible et agréable sur mobile, tablette et ordinateur.

**Équilibre attendu :** A constitue la base de composition, B donne au
site son identité propre, C garantit sa facilité d'utilisation et sa
modernité.

## 3. Référence essentielle : le costume du Bagad

Une photographie fournie par le client dans la conversation sert de
référence visuelle. Elle montre plusieurs musiciens portant le costume
du Bagad.

Éléments à observer et à reprendre dans la direction artistique :

-   vêtement principalement noir ;
-   larges panneaux ou empiècements bleus ;
-   galons et broderies dorés ;
-   ornements brodés à caractère floral et traditionnel ;
-   contraste entre le noir du vêtement, le bleu et les détails dorés.

La broderie est un élément important de l'identité visuelle. Il ne faut
pas la remplacer par des fleurs génériques provenant d'une banque
d'images.

### Utilisation recommandée de la broderie

1.  Observer les détails réels du costume et, si possible, récupérer des
    photographies rapprochées et nettes des broderies.
2.  Créer un motif graphique original inspiré de ces broderies, sans
    prétendre reproduire un motif qui ne serait pas suffisamment
    visible.
3.  Employer ce motif comme une signature : séparateur de section,
    petite frise, ornement de titre, détail de fond ou élément ponctuel.
4.  Prévoir une version discrète, lisible et adaptée aux petits écrans.
5.  Éviter les grands motifs répétitifs qui concurrenceraient les
    photographies et le contenu.

Les motifs peuvent être dessinés en SVG pour rester nets et légers. Ils
doivent être décoratifs et ne pas gêner la lecture.

## 4. Palette chromatique

Palette de travail proposée à partir du costume et des orientations
données. Les valeurs sont des points de départ à confronter aux
photographies réelles et au rendu dans le navigateur ; elles ne
constituent pas une charte graphique officielle déjà validée.

  -----------------------------------------------------------------------
  Rôle                    Couleur de travail      Usage
  ----------------------- ----------------------- -----------------------
  Bleu profond            `#173B63`               Titres importants,
                                                  liens actifs, éléments
                                                  structurants

  Or brodé                `#C6A45B`               Filets, ornements,
                                                  détails et accents

  Ivoire                  `#F5F1E8`               Fonds chaleureux et
                                                  alternance des sections

  Blanc                   `#FFFFFF`               Fonds de lecture et
                                                  espaces respirants

  Anthracite              `#25282B`               Texte courant et
                                                  contrastes

  Gris doux               À définir               Bordures et textes
                                                  secondaires
  -----------------------------------------------------------------------

### Règles d'utilisation

-   Le bleu ne doit pas recouvrir toutes les sections : il structure
    l'interface et souligne les éléments importants.
-   Le doré reste une couleur d'accent. Il ne doit pas devenir une
    couleur de texte courant sur fond clair si le contraste est
    insuffisant.
-   L'ivoire apporte de la chaleur et évite un rendu trop froid ou trop
    institutionnel.
-   L'anthracite assure une bonne lisibilité.
-   Les couleurs doivent être centralisées dans des variables ou tokens
    de thème.
-   Vérifier les contrastes selon les critères d'accessibilité avant
    validation.

## 5. Photographies et médias

### Priorité absolue : les vraies photographies du Bagad

Le client a indiqué que, hormis la photographie retenue pour le Hero,
les images d'ambiance proposées précédemment ne convenaient pas. Elles
ne doivent donc pas être considérées comme des images validées ni être
intégrées au site.

Ordre de priorité :

1.  Photographies fournies ou validées par le Bagad.
2.  Photographies déjà publiées sur le site actuel, après vérification
    de leur pertinence et de leurs droits d'utilisation.
3.  Photographies présentes dans les archives ou la galerie du Bagad et
    validées pour publication.
4.  À défaut, laisser un emplacement éditorial clairement identifié
    plutôt que d'inventer une photographie ou d'utiliser une image
    générique trompeuse.

Ne pas utiliser des images générées par IA pour faire croire qu'elles
représentent les musiciens, les costumes, les événements ou les lieux du
Bagad.

### Photographie du Hero

La photographie fournie par le client dans la conversation est la
référence souhaitée pour le Hero. Elle montre les musiciens en costume
bleu, noir et or dans un contexte réel de sortie ou de représentation.

Consignes :

-   conserver l'esprit documentaire et authentique de cette photographie
    ;
-   ne pas lui appliquer un traitement artificiel ou une colorimétrie
    excessive ;
-   prévoir un recadrage responsive qui conserve les musiciens et les
    détails du costume ;
-   assurer la lisibilité du titre et des actions par un traitement de
    contraste sobre si nécessaire ;
-   ne pas masquer les broderies ou les visages par des éléments
    graphiques.

### Qualité et présentation des images

-   Préférer des photographies nettes, authentiques et contextualisées.
-   Éviter les images génériques de cornemuses, de costumes bretons ou
    de festivals qui ne représentent pas le Bagad Penhars.
-   Respecter les proportions et le cadrage des images.
-   Utiliser des formats optimisés pour le web, notamment WebP lorsque
    cela convient.
-   Prévoir des textes alternatifs pertinents pour les images
    informatives ; les images purement décoratives doivent être ignorées
    par les technologies d'assistance.
-   Ne pas sélectionner de photos privées ou de documents dans les
    aperçus publics.

## 6. Ce qu'il faut éviter

Le client souhaite explicitement éviter un rendu trop artificiel ou trop
typé « design IA ».

À éviter :

-   dégradés décoratifs omniprésents ;
-   glassmorphism systématique ;
-   accumulation de cartes identiques ;
-   grands rayons d'arrondi sur tous les éléments ;
-   ombres épaisses ou lumineuses ;
-   effets de lueur, halos et effets 3D gratuits ;
-   animations permanentes ou trop démonstratives ;
-   motifs floraux génériques sans lien avec le costume ;
-   banques d'images génériques présentées comme des photos du Bagad ;
-   compositions qui donnent l'impression d'un template de landing page
    interchangeable.

À privilégier :

-   des compositions éditoriales avec des proportions variées ;
-   des sections qui respirent ;
-   des séparateurs fins et des détails dorés ;
-   des images réelles avec des légendes utiles ;
-   des fonds unis ou très légèrement texturés ;
-   des angles plutôt modérés, parfois droits ;
-   une hiérarchie claire entre titres, textes, images et actions.

## 7. Typographie

La maquette `Test_svelte` utilise notamment Playfair Display et Inter.
Cette combinaison peut servir de piste, mais le choix final doit être
vérifié sur l'ensemble des pages.

Orientation :

-   typographie à caractère, éventuellement serif, pour les grands
    titres et certains titres de section ;
-   sans-serif très lisible pour les paragraphes, menus, formulaires et
    informations pratiques ;
-   tailles et interlignages confortables ;
-   limiter le nombre de familles et de graisses ;
-   ne pas utiliser une typographie décorative pour les textes longs.

La typographie doit évoquer la culture et l'élégance sans rendre le site
ancien ou difficile à lire.

## 8. Structure du site public

La maquette Bolt présente plusieurs sections de page d'accueil. Le site
de production doit conserver une navigation multi-pages cohérente avec
le projet `bagadPenhars`.

Navigation publique prévue dans la spécification UI :

-   Accueil
-   Bagad
-   Formation
-   Agenda
-   Médias
-   Partenaires
-   Contact

Le header prévoit également :

-   logo et nom « Bagad Penhars » ;
-   liens vers Facebook et Instagram ;
-   sélecteur de langue FR / EN / BR ;
-   action « Écouter » ;
-   accès à la connexion ;
-   menu burger sur les petits écrans.

Les libellés et destinations exactes devront correspondre aux routes
réellement implémentées.

### 8.1 Accueil

L'accueil doit être une synthèse vivante, pas une copie complète de
toutes les pages.

Ordre de contenu de référence :

1.  **Hero** : photographie authentique, titre, courte présentation et
    appels à l'action.
2.  **Le Bagad** : résumé de l'association, image et lien vers la page
    détaillée.
3.  **Formation** : aperçu des quatre pupitres avec visuels et liens
    vers la page Formation.
4.  **Agenda** : deux prochaines représentations publiques à venir,
    triées par date croissante. Si moins de deux événements sont
    disponibles, afficher ceux qui existent. Ne jamais afficher un
    événement interne ou ciblé sur un pupitre.
5.  **Galerie** : trois photos distinctes choisies parmi les photos
    publiées et accessibles publiquement, ou toutes les photos
    disponibles s'il y en a moins de trois. La sélection doit être
    stable entre le rendu initial et l'hydratation.

Chaque aperçu renvoie vers sa page de référence.

### 8.2 Page Bagad

Page de présentation complète de l'association :

-   histoire ;
-   valeurs ;
-   dates clés ;
-   effectif ;
-   photographies ;
-   principaux événements et palmarès validés par le bureau.

Ne pas inventer de dates, de résultats, de chiffres d'effectif ou
d'informations historiques. Les informations doivent provenir du site
actuel, des documents du Bagad ou être validées par le bureau.

Composition livrée : hero éditorial (accroche, titre, chapeau) et photographie
de groupe pleine largeur, section « Notre histoire » avec l'année de création
mise en exergue et lien vers la Formation, section « Notre mission » avec une
photographie de scène et trois repères chiffrés, bandeau marine d'appel à
l'adhésion (Formation, Contact). Les textes proviennent de la page Bagad du site
officiel ; les chiffres et les photographies restent à valider
(Q-2026-11-10-08).

### 8.3 Page Formation

Présenter les quatre pupitres :

-   bombarde ;
-   cornemuse ;
-   caisse claire ;
-   percussion.

Prévoir une présentation claire de chaque pupitre et, lorsque les
informations sont disponibles :

-   instruments ;
-   niveaux ;
-   contenu des cours ;
-   horaires ;
-   lieu ;
-   modalités de prêt d'instrument.

Les informations manquantes doivent être fournies ou validées par le
bureau. La percussion reste un pupitre distinct de la caisse claire dans
la présentation, même si certaines règles métier internes peuvent
rapprocher leurs membres.

### 8.4 Agenda public

-   Afficher les événements explicitement publics.
-   Consultation possible sans connexion.
-   Lecture seule pour les visiteurs.
-   Ne jamais exposer les événements internes ou réservés à un ou
    plusieurs pupitres.
-   Proposer un accès clair à l'espace adhérent pour les événements
    privés, après authentification.

### 8.5 Médias et galerie

-   Présenter les albums explicitement publiés pour le public.
-   Utiliser les photographies réelles du Bagad.
-   Prévoir une présentation éditoriale, avec des albums ou
    regroupements pertinents si les données le permettent.
-   Ne jamais mélanger les photos de profil privées des adhérents avec
    la galerie publique.

### 8.6 Partenaires

Prévoir une page ou une section dédiée aux partenaires, avec leurs logos
et liens uniquement lorsque les éléments ont été fournis et validés.

### 8.7 Contact

Prévoir les informations de contact validées par l'association et un
formulaire accessible. Ne pas inventer d'adresse, de numéro ou d'adresse
électronique.

Composition livrée : hero éditorial, formulaire (nom, prénom, courriel, sujet,
message) avec libellés visibles, erreurs par champ et vérification anti-robots
Cloudflare Turnstile, encart de coordonnées (adresse, courriel, horaires) puis
carte OpenStreetMap avec liens vers OpenStreetMap, Google Maps et Apple Maps. La
carte reste en retrait du formulaire
sur mobile et son marqueur n'est pas un relevé de l'association tant que
l'adresse n'est pas confirmée (Q-2026-11-10-05). Le formulaire ne stocke rien :
le message part par courriel.

### 8.8 Actualités

Le projet prévoit des articles et actualités. Leur présentation doit
rester cohérente avec la direction éditoriale du site. Le contenu et les
dates doivent provenir des données réelles.

## 9. Lecteur audio flottant

La maquette `Test_svelte` comprend un composant `FloatingPlayer` et une
action « Écouter » dans le header.

Comportement spécifié pour le site :

-   lecteur disponible depuis toutes les pages publiques ;
-   lecteur conservé dans la structure partagée du site ;
-   navigation entre les pages sans interrompre la lecture ni
    réinitialiser le morceau ou sa position ;
-   le bouton « Écouter » ouvre ou réaffiche le lecteur sans démarrer un
    autre morceau ;
-   possibilité de réduire ou fermer le lecteur ;
-   réouverture sans perdre la lecture en cours ;
-   libellé accessible « Écouter », même si le texte est visuellement
    masqué sur petit écran ;
-   accès au lecteur également disponible depuis le menu mobile.

Utiliser l'API audio HTML5 et gérer correctement les états de lecture,
pause, chargement et erreur. Ne pas démarrer automatiquement une lecture
sonore sans action explicite de l'utilisateur.

## 10. Espace adhérents : cohérence visuelle

L'espace adhérents appartient au même site et doit reprendre les mêmes
couleurs, typographies, composants et principes de navigation, mais il
doit privilégier l'efficacité et la lisibilité.

Fonctionnalités déjà prévues dans la spécification :

### Trombinoscope

-   Fonctionnalité obligatoire en V1.
-   Accessible uniquement aux membres actifs connectés.
-   Affiche prénom, nom, photo de profil, pupitre(s), niveau musical et
    fonction éventuelle au bureau.
-   Aucun annuaire public.
-   Tous les membres actifs autorisés peuvent consulter les photos des
    autres membres.
-   Ne jamais afficher téléphone, adresse e-mail personnelle, adresse
    postale ou autres données privées non autorisées.
-   Les photos de profil proviennent d'un stockage privé, via accès
    authentifié ou URL signée courte.
-   Un membre, y compris un administrateur, ne peut pas remplacer la
    photo d'un autre membre.

### Agenda adhérents

Les membres actifs peuvent accéder aux événements selon leur visibilité
et leurs pupitres.

Valeurs de visibilité prévues :

-   `public` ;
-   `interne` ;
-   `pupitre`.

Les visiteurs ne voient que les événements publics. Les membres actifs
voient les événements internes et ceux des pupitres auxquels ils
appartiennent, selon les règles métier.

Les chefs de pupitre ne gèrent que les événements ciblés sur les
pupitres qu'ils dirigent. La secrétaire et l'administrateur disposent
des droits globaux prévus par les règles métier.

### Invitations et validation des comptes

L'interface doit rendre compréhensibles les états de compte et les
actions autorisées. Les règles de sécurité et de droits sont définies
côté serveur ; l'interface ne constitue jamais une protection suffisante
à elle seule.

### Articles

L'édition des articles est prévue avec Milkdown en WYSIWYG Markdown,
avec prévisualisation avant publication. La présentation publique des
articles doit rester cohérente avec le style éditorial.

## 11. Responsive design

L'interface doit être conçue mobile-first et vérifiée sur plusieurs
largeurs.

### Mobile

-   Menu burger.
-   Logo compact.
-   Accès au lecteur audio depuis le menu.
-   Contenu empilé verticalement.
-   Photographies recadrées sans perdre le sujet principal.
-   Boutons et zones tactiles suffisamment grands.
-   Aucun débordement horizontal.

### Tablette

-   Navigation adaptée, généralement sous forme de menu compact.
-   Grilles pouvant passer à deux colonnes.
-   Hiérarchie typographique conservée.
-   Images et ornements ajustés.

### Ordinateur

-   Navigation complète lorsque l'espace le permet.
-   Compositions éditoriales plus amples.
-   Grilles et mises en page asymétriques lorsque cela améliore la
    présentation.
-   Largeur de lecture maîtrisée pour les textes longs.

Les seuils exacts doivent suivre les points de rupture du projet et être
validés dans le navigateur.

## 12. Animations et interactions

La maquette Bolt utilise GSAP et Motion. Le projet principal prévoit
Motion et des transitions Svelte.

Principes :

-   animations courtes et discrètes ;
-   transitions de navigation et d'apparition uniquement lorsqu'elles
    apportent quelque chose ;
-   effets hover sobres ;
-   aucun mouvement permanent décoratif ;
-   respecter la préférence système `prefers-reduced-motion` ;
-   ne pas retarder l'accès au contenu ;
-   préserver les performances sur mobile.

La bibliothèque d'animation définitive doit être choisie en cohérence
avec le projet principal. Éviter d'ajouter plusieurs bibliothèques pour
réaliser les mêmes effets.

## 13. Accessibilité et qualité d'interface

-   Navigation entièrement utilisable au clavier.
-   Focus visible et cohérent avec la charte graphique.
-   Contrastes suffisants, notamment pour le doré.
-   Structure de titres logique.
-   Libellés explicites pour les champs et boutons.
-   Textes alternatifs adaptés.
-   Boutons et liens différenciés visuellement.
-   États de chargement, succès, erreur et désactivation clairement
    identifiables.
-   Respect de `prefers-reduced-motion`.
-   Composants accessibles sur mobile et avec lecteurs d'écran.

Les composants de bibliothèque UI peuvent fournir une partie des
comportements d'accessibilité, mais leur intégration doit être vérifiée
: ne pas supposer qu'un composant est accessible sans test.

## 14. Référence Bolt et intégration technique

### Maquette `Test_svelte`

Le dépôt `hazerty565/Test_svelte` est une référence UI issue de
Bolt.new. Les composants repérés dans la maquette comprennent notamment
:

-   `NavBar`
-   `HeroSection`
-   `AboutSection`
-   `MusicSection`
-   `PrestationsSection`
-   `FormationSection`
-   `EventsSection`
-   `GallerySection`
-   `ContactSection`
-   `FloatingPlayer`

La maquette est principalement organisée comme une page unique avec
ancres et données de démonstration. Elle sert à étudier la présentation,
les compositions et les interactions, pas à imposer l'architecture de
production.

### Projet de production `bagadPenhars`

Le dépôt `hazerty565/bagadPenhars` est le projet de production. La
branche `proto` consultée utilise notamment :

-   Svelte 5 ;
-   SvelteKit ;
-   TypeScript ;
-   Tailwind CSS ;
-   composants organisés dans `src/lib/components/` par domaines ;
-   routage SvelteKit ;
-   backend et données du projet, notamment Neon/PostgreSQL et Drizzle
    selon les décisions techniques récentes du projet.

**Règle d'intégration :** adapter les idées de la maquette aux
conventions, routes, composants, données et contrats du projet
principal. Ne pas importer en bloc la structure Vite/one-page de la
maquette, ni ses données statiques, ni ses dépendances sans analyse
préalable.

### Séparation des responsabilités

-   Le design doit être décrit dans ce document et les composants UI
    doivent rester cohérents.
-   Les règles d'accès et de visibilité sont appliquées côté serveur.
-   Les contenus publics sont alimentés par les données réellement
    publiées.
-   Les données de démonstration ne doivent jamais apparaître en
    production.
-   Les composants communs (header, navigation, lecteur audio, footer)
    doivent éviter les duplications entre pages.

## 15. Organisation visuelle indicative de l'accueil

Cette organisation est une proposition de composition à valider pendant
la réalisation :

1.  Header sobre, logo, navigation et action « Écouter ».
2.  Hero photographique utilisant la photo validée du Bagad.
3.  Présentation courte du Bagad, avec une composition éditoriale.
4.  Frise ou séparateur inspiré de la broderie du costume.
5.  Présentation des quatre pupitres.
6.  Mise en avant de l'agenda public.
7.  Galerie de photographies réelles.
8.  Présentation des actualités ou temps forts.
9.  Partenaires.
10. Footer avec navigation secondaire, réseaux et informations validées.

Ne pas transformer chaque point en une carte identique. Varier les
compositions tout en conservant une grille, des espacements et une
hiérarchie cohérents.

## 16. Contenus : règles de fiabilité

-   Le site actuel `https://bagad-penhars.com/` est une source de
    contenu à examiner et à actualiser, pas un modèle graphique à
    reproduire à l'identique.
-   Reprendre les informations utiles et exactes.
-   Ne pas inventer d'histoire, de dates, de palmarès, de chiffres, de
    coordonnées ou de partenaires.
-   Les informations manquantes doivent être signalées pour validation
    par le Bagad.
-   Les photographies doivent être réelles et autorisées.
-   Les contenus publics et privés doivent rester strictement séparés.

## 17. Critères de validation UI

La maquette ou l'intégration pourra être considérée comme conforme
lorsque les points suivants seront vérifiés :

-   [ ] L'identité visuelle combine élégance éditoriale, identité
    bretonne et modernité.
-   [ ] Le bleu, le doré et l'ivoire sont utilisés avec mesure.
-   [ ] Les ornements floraux sont inspirés des broderies réelles du
    costume.
-   [ ] Le motif de broderie est discret, lisible et cohérent sur toutes
    les tailles d'écran.
-   [ ] La photographie du Hero validée par le client est utilisée sans
    traitement artificiel.
-   [ ] Aucune photographie générique ou générée ne prétend représenter
    le Bagad.
-   [ ] Les autres photos sont issues des ressources réelles et validées
    du Bagad.
-   [ ] Le rendu évite les codes visuels artificiels associés aux
    templates IA.
-   [ ] Les pages publiques prévues sont accessibles par une navigation
    claire.
-   [ ] L'accueil affiche uniquement les aperçus publics prévus.
-   [ ] Le lecteur audio conserve son état lors de la navigation
    publique.
-   [ ] Le site est responsive et utilisable au clavier.
-   [ ] Les préférences de réduction des animations sont respectées.
-   [ ] L'intégration respecte l'architecture et les contrats du dépôt
    `bagadPenhars`.
-   [ ] Aucune donnée de démonstration ne subsiste en production.
-   [ ] Les contenus non confirmés sont signalés pour validation.

## 18. Points à confirmer avant finalisation de la charte

Ces points ne doivent pas être inventés par les développeurs :

-   logo officiel et variantes disponibles ;
-   fichiers originaux ou photos rapprochées des broderies du costume ;
-   validation définitive des teintes exactes de bleu et d'or ;
-   choix final des polices ;
-   sélection des photographies autorisées pour chaque page ;
-   textes historiques, palmarès et informations de formation à jour ;
-   liste et logos des partenaires ;
-   coordonnées et liens officiels à afficher.

------------------------------------------------------------------------

## 19. Consigne générale pour les intervenants UI

Concevoir un site qui semble réellement appartenir au Bagad Penhars. Le
costume, ses couleurs et ses broderies constituent une source
d'inspiration identitaire, pas un prétexte à surcharger l'interface.

L'authenticité vient d'abord des vraies photographies, des contenus
exacts et d'une mise en page soignée. Le bleu et l'or structurent
l'identité ; les broderies la signent ; la sobriété éditoriale et
l'ergonomie rendent le site contemporain.

En cas de doute sur un contenu, une photographie ou une information
historique, demander validation plutôt que compléter par une invention.
