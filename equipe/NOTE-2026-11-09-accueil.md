# Note d'architecte — page d'accueil publique

**Date :** 2026-11-09
**Branche :** `proto`
**Étape du plan :** 27 (pages publiques) — préfiguration
**Statut :** livrée, données agenda/galerie à brancher

---

## 1. Objectif et périmètre

Livrer une première page d'accueil publique complète, avec header et footer
partagés, en respectant la direction artistique de `docs/maquette_UI.md` et
les contrats de `docs/Spec_UI.md`.

### Dans le périmètre

- Route localisée `/(public)/[lang=lang]`.
- Redirection `/` → `/fr`.
- Header sticky : logo, navigation, réseaux, sélecteur FR/EN/BR, « Écouter »,
  connexion, menu mobile.
- Footer : navigation, coordonnées, réseaux, accès adhérents.
- Lecteur audio flottant en état vide.
- Sections d'accueil : hero, présentation, pupitres, aperçu agenda, aperçu
  galerie, appel à rejoindre.
- SEO : titre, description, canonical, `hreflang`, Open Graph.
- Thème Tailwind et polices.

### Hors périmètre (assumé)

- Branchement Neon de l'agenda public.
- Branchement R2 des albums photo.
- Pistes audio réelles.
- Refonte des pages publiques internes (bagad, formation, médias,
  partenaires, contact), encore à l'état d'ébauche.
- PWA et notifications.

---

## 2. Structure livrée

```text
src/
  app.css                         tokens et classes utilitaires
  app.html                        polices, theme-color, %lang%
  hooks.server.ts                 injection de la langue
  lib/
    components/
      layout/Nav.svelte
      layout/Footer.svelte
      layout/FloatingPlayer.svelte
      layout/LanguageSwitcher.svelte
      ui/Ornament.svelte
      ui/SocialIcon.svelte
      home/Hero.svelte
      home/About.svelte
      home/Pupitres.svelte
      home/AgendaPreview.svelte
      home/GalleryPreview.svelte
      home/Join.svelte
    data/nav.ts                   routes publiques + clés de navigation
    data/site.ts                  coordonnées, réseaux, galerie provisoire
    data/pupitres.ts              référentiel des quatre pupitres
    i18n/{types,fr,en,br,index}.ts
    types.ts                      DTO publics
  routes/
    (public)/+page.server.ts               redirection / → /fr
    (public)/[lang=lang]/+layout.server.ts validation de la langue
    (public)/[lang=lang]/+layout.svelte    header + footer + lecteur
    (public)/[lang=lang]/+page.server.ts   données d'accueil
    (public)/[lang=lang]/+page.svelte      composition + SEO
```

---

## 3. Contrats de données

La page consomme les DTO de `equipe/CONTRAT_API.md` §3 :

- `PublicEvent` : `nextPublicEvents` (vide tant que Neon n'est pas branché).
- `PublicPhoto` : `galleryPhotos` (alimenté provisoirement par des photos du
  dépôt, en attendant les albums R2).
- `Pupitre` : `pupitres`.

Le load `+page.server.ts` est volontairement pur et synchrone : il ne touche
pas la base. Le branchement Neon devra :

1. lire uniquement les événements `visibility = 'public'` et non annulés ;
2. limiter aux deux prochaines dates ;
3. renvoyer des dates `YYYY-MM-DD` et un `state` calculé côté serveur ;
4. rester indépendant de l'identité (pas de cache privé).

---

## 4. Décisions techniques

| Sujet | Décision | Raison |
| --- | --- | --- |
| i18n | dictionnaires TypeScript typés maison | `svelte-i18n` non installé ; complétude vérifiée à la compilation. Question Q-2026-11-09-01. |
| Liens internes | `resolve()` de `$app/paths` + `PUBLIC_NAV` | règle `svelte/no-navigation-without-resolve`. |
| Thème | tokens Tailwind v3 | version installée ; pas de Tailwind 4 du prototype. |
| Polices | Google Fonts (Playfair Display + Inter) | direction éditoriale de la maquette. |
| Icônes réseaux | `SocialIcon.svelte` | `lucide-svelte@1.0.1` n'exporte pas Facebook/Instagram. |
| Lecteur | état vide explicite | aucune piste audio dans le dépôt. |
| Agenda | état vide explicite | base publique non branchée ; pas de données de démonstration. |

### Correctifs d'infrastructure associés

- `vite.config.ts` : `ssr.noExternal` pour `better-auth`, `@better-auth/core`
  et `zod`, afin que Better Auth (Zod 4) et les schémas applicatifs (Zod 3)
  résolvent chacun leur version.
- `src/lib/server/auth.ts` : secret lu depuis `BETTER_AUTH_API_KEY`, nom
  réellement présent dans `.env`.
- `.env.example` créé ; `.env*` ajoutés à `.prettierignore`.

---

## 5. Critères de fin

- [x] `/` redirige vers `/fr`.
- [x] `/fr`, `/en`, `/br` rendent la page avec le bon `lang`.
- [x] Header et footer présents sur toutes les langues.
- [x] Navigation desktop et menu mobile accessibles au clavier.
- [x] `npm run check` sans erreur.
- [x] `npm run build` OK avec les variables de `.env`.
- [x] ESLint/Prettier ciblés OK.
- [ ] Agenda alimenté par Neon.
- [ ] Galerie alimentée par R2.
- [ ] Contenus et légendes validés par le bureau.
- [ ] Relecture bretonne.

---

## 6. Dépendances et risques

- **Neon** : l'agenda et les albums dépendent des étapes backend.
- **R2** : les vignettes définitives dépendent du pipeline médias.
- **Contenus** : année, adresse, e-mail et textes issus du site officiel sont
  à reconfirmer (Q-2026-11-09-02).
- **Build** : `DATABASE_URL` est requise à l'import de `$lib/db`; le build et
  le dev doivent charger `.env`.
- **Lint global** : des fichiers préexistants ne sont pas formatés; ne pas
  lancer `prettier --write .` sans arbitrage.
