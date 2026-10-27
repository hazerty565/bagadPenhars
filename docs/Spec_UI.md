# SpecUI.md - Bagad Penhars Website

**Auteur:** hazerty565  
**Date:** 2024  
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
- Bouton "Écouter" avec lecteur audio (caché mobile < md)
- Bouton Connexion (caché mobile < sm)
- Menu burger mobile (< lg)

**HERO**
- Image/vidéo full width
- Overlay semi-transparent
- Titre centré + sous-titre + CTA

**ENCART BIENVENUE**
- Grille 1 col (mobile) / 2 col (desktop)
- Colonne 1: Card avec texte présentation + bouton CTA
- Colonne 2: Image hero (hidden mobile)
- Animations au scroll

---

## Composants clés

| Composant | Description | Notes |
|-----------|-------------|-------|
| Header.svelte | Navigation + actions | Responsive, sticky |
| Hero.svelte | Section hero | Animations fade |
| WelcomeCard.svelte | Card bienvenue | Animations scroll |
| AudioPlayer.svelte | Lecteur audio | Desktop/mobile versions |
| LanguageDropdown.svelte | Sélecteur langue | Store persisté |

---

## Responsive Design

**Mobile (< 640px)**
- Menu burger au clic
- Logo seul dans header
- Full width sans lecteur audio
- Stack vertical pour grille

**Tablette (640px - 1024px)**
- Menu burger
- Texte "Bagad Penhars" visible
- Lecteur audio visible
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