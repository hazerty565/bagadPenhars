# SpecUI.md - Bagad Penhars Website

> **Passages obsolètes :** certaines règles de pupitres et de responsabilités
> ont été précisées depuis la rédaction de cette spécification. Consulter les
> arbitrages datés de [`questions.md`](./questions.md) et ne pas prendre en
> compte les passages qui y sont marqués **OBsolète — ne plus prendre en
> compte**.

**Auteur:** hazerty565  
**Date:** 2026  
**Stack:** Svelte 5 + SvelteKit + Tailwind CSS + Motion + shadcn

---

## Vue d'ensemble

Site vitrine pour le Bagad Penhars avec présentation de l'association, actualités, formations et événements. Focus sur l'expérience utilisateur responsive (mobile/tablette/desktop) avec animations fluides.

---

## Page d'accueil

**HEADER**

- Logo + "Bagad Penhars" (logo caché mobile < md)
- Menu centré: Accueil / Bagad / Formation / Agenda / Médias / Partenaires / Contact (desktop only > lg)
- Réseaux: Facebook, Instagram
- Dropdown langue: FR / EN / BR
- Bouton « Écouter » avec une icône Lucide `Music2` (deux croches), qui ouvre le lecteur flottant ; sur mobile, l'accès reste disponible dans le menu burger.
- Bouton Connexion (caché mobile < sm)
- Menu burger mobile (< lg)

**LECTEUR AUDIO FLOTTANT GLOBAL**

- Le lecteur est disponible depuis toutes les pages publiques et reste monté
  dans la structure partagée du site ; naviguer entre les pages ne ferme pas la
  lecture et ne réinitialise ni le morceau en cours ni sa position.
- Le bouton « Écouter » du header ouvre ou réaffiche le lecteur sans démarrer
  un autre morceau. Le lecteur peut être réduit ou fermé ; le rouvrir conserve
  la lecture en cours.
- Le bouton reste identifiable avec son libellé accessible « Écouter », même
  lorsque le texte est masqué visuellement sur un petit écran.

**HERO**

- Image/vidéo full width
- Overlay semi-transparent
- Titre centré + sous-titre + CTA

**CONTENU — PAGE D'ACCUEIL SYNTHÉTIQUE**

La page d'accueil donne un aperçu du Bagad et de ses activités. Elle réutilise
les pistes visuelles du prototype `src/autre/src/components/`, sans reprendre
ses données de démonstration ni dupliquer le contenu complet des pages
dédiées. Chaque aperçu comporte un lien vers sa page de référence.

1. **Hero** — image, titre, présentation courte et appel à l'action.
2. **Le Bagad** — résumé issu de la présentation de l'association, avec image
   et lien « Découvrir le Bagad » vers la page dédiée.
3. **Formation** — aperçu des quatre pupitres (bombarde, cornemuse, caisse
   claire et percussion), sous forme de cartes courtes avec visuel et lien vers
   la page Formation détaillée.
4. **Agenda** — afficher les deux prochaines représentations publiques à
   venir, triées par date croissante, en lecture seule. Si moins de deux dates
   sont disponibles, afficher celles qui existent. Les événements internes ou
   ciblés sur un pupitre ne sont jamais affichés sur la page publique. Un lien
   ouvre l'agenda public complet, qui liste toutes les dates publiques.
5. **Galerie** — afficher trois photos distinctes choisies au hasard parmi
   les photos publiées et accessibles publiquement, ou toutes les photos
   disponibles s'il y en a moins de trois. La sélection est fournie au rendu
   initial et conservée pendant l'hydratation. Ne jamais sélectionner de
   document ou de photo privée. Un lien ouvre la galerie complète.

Les aperçus ne remplacent pas les pages dédiées :

- **Bagad** : contenu complet sur l'histoire, les valeurs, les dates clés,
  l'effectif, les photos et les principaux événements ou palmarès validés par
  le bureau ;
- **Formation** : présentation complète des quatre pupitres, avec niveaux,
  contenu des cours, horaires, lieu et modalités de prêt d'instrument ; les
  informations manquantes sont fournies ou validées par le bureau ;
- **Agenda** : toutes les dates publiques, accessibles sans connexion et en
  lecture seule ; les membres connectés retrouvent les événements internes ou
  de pupitre dans l'espace adhérent selon leurs droits ;
- **Médias** : galerie complète des albums explicitement publiés pour le
  public.

L'ordre visuel proposé s'inspire de `HeroSection`, `AboutSection`,
`FormationSection`, `EventsSection` et `GallerySection` dans le prototype. Le
contenu de production est alimenté par les données publiques réelles, pas par
les tableaux statiques de la maquette.

---

## Espace adhérents

### Trombinoscope

Le trombinoscope est une fonctionnalité obligatoire de la V1 et doit être
opérationnel dès la première mise en production. Il est accessible uniquement
aux membres actifs connectés. Chaque fiche affiche le prénom, le nom, la photo
de profil, le ou les pupitres, le niveau musical et, le cas échéant, la fonction
au bureau.

Ne jamais afficher dans cette interface le téléphone, l'adresse e-mail
personnelle, l'adresse postale ou toute autre donnée privée non autorisée. La
fonction au bureau est une information de présentation et ne modifie pas les
droits d'accès. Aucun membre, y compris un administrateur, ne peut remplacer
la photo d'un autre membre. Les photos se chargent depuis le bucket privé par
accès authentifié ou URL signée courte.

### Agenda et formulaire événement

Le formulaire de création/modification comprend :

- le titre, la description et les dates ;
- un `event_type` parmi `sortie`, `concert`, `fest-noz`, `festival`,
  `concours`, `gala`, `repetition`, `reunion` et `repas` ;
- une visibilité choisie indépendamment du type : `public`, `interne` ou
  `pupitre` ;
- pour un chef, la visibilité `pupitre` est automatique et une liste de
  sélection propose uniquement les pupitres qu'il dirige, avec une seule cible ;
- pour la secrétaire et l'administrateur, un ou plusieurs pupitres peuvent être
  ciblés, ou aucun pour un événement global.

Le type ne détermine jamais la visibilité : une répétition peut être publique,
interne ou ciblée sur un pupitre. Les événements `public` sont visibles par
tous ; les événements `interne` par tous les membres actifs ; les événements
`pupitre` uniquement par les membres actifs des pupitres ciblés. Les membres
autorisés peuvent répondre aux événements qu'ils voient. Un chef ne peut gérer que les
événements ciblés sur son pupitre, même s'il n'en est pas l'auteur ; il ne peut pas
gérer d'événement multi-pupitres ou global. Secrétaire et administrateur
peuvent gérer tous les événements, y compris multi-pupitres et globaux.

Les visiteurs voient uniquement les événements publics. Les membres actifs
voient également tous les événements internes et ceux des pupitres auxquels
ils appartiennent. Les chefs gèrent les événements ciblés sur leur pupitre,
y compris ceux créés par
un autre utilisateur ; ils ne gèrent ni les événements globaux ni ceux d'autres
pupitres. Secrétaire et administrateur gèrent tous les événements. Un membre
classique ne dispose d'aucune action de création, modification ou suppression.
La récurrence n'est pas proposée en V1.

### Invitations et validation des comptes

Seul un administrateur peut créer une invitation. Son formulaire recueille
l'adresse e-mail, les informations nécessaires du membre et son ou ses pupitres.
Le compte Auth est créé lors de l'invitation ; le profil apparaît avec
`account_status = pending` et un `app_role` indépendant.

Le membre confirme son adresse et définit son mot de passe dans l'heure.
Après confirmation, son `account_status` reste `pending` jusqu'à activation
manuelle par un administrateur. L'activation ne change pas le rôle. La liste de
validation permet de vérifier l'état de confirmation ; un compte non confirmé
ne peut pas être activé. Si le lien
expire, l'administrateur peut renvoyer une invitation au compte Auth existant.
Aucun compte `pending` ou `suspended` ne reçoit les actions d'un membre actif.

---

## Composants clés

| Composant               | Description             | Notes                             |
| ----------------------- | ----------------------- | --------------------------------- |
| Header.svelte           | Navigation + actions    | Responsive, sticky                |
| Hero.svelte             | Section hero            | Animations fade                   |
| WelcomeCard.svelte      | Card bienvenue          | Animations scroll                 |
| FloatingPlayer.svelte   | Lecteur flottant global | Lecture conservée entre les pages |
| LanguageDropdown.svelte | Sélecteur langue        | Store persisté                    |

---

## Responsive Design

**Mobile (< 640px)**

- Menu burger au clic
- Logo seul dans header
- Accès au lecteur flottant depuis le menu ; le lecteur conserve le morceau
  pendant la navigation
- Stack vertical pour grille

**Tablette (640px - 1024px)**

- Menu burger
- Texte "Bagad Penhars" visible
- Accès au lecteur flottant depuis le header
- Grille 2 col

**Desktop (> 1024px)**

- Menu centré complet
- Tous les éléments visibles
- Animations hover
- Layouts optimisés

---

## Animations & Interactions

- Transitions fade/slide sur éléments
- Hover scale sur boutons et images
- Audio player avec contrôles
- Menu dropdown langue
- Animations au scroll (Intersection Observer)

---

## Couleurs & Typo

- **Primary:** À définir (couleur Bagad)
- **Palettes:** white, gray-50/100/200/600/900
- **Fonts:** Bold headings, medium nav, normal body
- **Spacing:** Tailwind standard (gap-4, py-8, px-4, etc.)

---

## Technos

✓ Svelte 5 + Runes ($state, $derived, $effect)  
✓ SvelteKit avec routing  
✓ Tailwind CSS responsive  
✓ Svelte Transitions (fade, slide, scale)  
✓ Store persisté pour langue  
✓ Audio API native HTML5

---

## Prochaines étapes

- [ ] Pages secondaires (Bagad, Formation, Agenda, Contact)
- [ ] Intégration CMS pour contenu
- [ ] Blog/Actualités
- [ ] Galerie média
- [ ] Formulaire contact
