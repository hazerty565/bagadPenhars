<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Music, Wind, Drum, Users, Clock, ChevronRight, Star } from "lucide-svelte"

  let sectionEl: HTMLElement

  const instruments = [
    {
      id: "cornemuse",
      name: "Cornemuse",
      breton: "Binioù Kozh",
      image: "/formation-cornemuse.webp",
      icon: Wind,
      description:
        "La cornemuse bretonne (binioù kozh) est l'âme du bagad. Instrument emblématique de Cornouaille, elle demande patience et souffle, mais sa maîtrise est une récompense incomparable.",
      levels: ["Débutant", "Intermédiaire", "Avancé"],
      schedule: "Mardi 18h–19h30",
      ageMin: 7,
      color: { bg: "oklch(0.40 0.22 240)", text: "oklch(0.74 0.155 75)" },
    },
    {
      id: "bombarde",
      name: "Bombarde",
      breton: "Bombard",
      image: "/formation-bombarde.webp",
      icon: Music,
      description:
        "La bombarde est un hautbois breton au son puissant et chaud. Voix des processions et pardons, elle dialogue traditionnellement avec la cornemuse dans les couples de sonneurs.",
      levels: ["Débutant", "Intermédiaire", "Avancé"],
      schedule: "Mardi 18h–19h30",
      ageMin: 7,
      color: { bg: "oklch(0.74 0.155 75)", text: "oklch(0.13 0.045 240)" },
    },
    {
      id: "caisse-claire",
      name: "Caisse Claire",
      breton: "Korn Boud",
      image: "/formation-caisse-claire.webp",
      icon: Drum,
      description:
        "La caisse claire est le moteur rythmique du bagad. Technique et précision sont de mise pour maîtriser le roulement et les rudiments qui donnent l'élan à tout l'ensemble.",
      levels: ["Débutant", "Intermédiaire", "Avancé"],
      schedule: "Mardi 19h30–21h",
      ageMin: 7,
      color: { bg: "oklch(0.45 0.12 160)", text: "oklch(0.98 0.005 235)" },
    },
    {
      id: "percussion",
      name: "Percussions",
      breton: "Sonerezh",
      image: "/formation-percussion.webp",
      icon: Drum,
      description:
        "Les percussions — grosse caisse, cymbales et tom — assurent la puissance sonore du bagad en concert. Une formation complète pour rejoindre la section rythmique.",
      levels: ["Débutant", "Intermédiaire"],
      schedule: "Samedi 10h–12h",
      ageMin: 10,
      color: { bg: "oklch(0.55 0.15 30)", text: "oklch(0.98 0.005 235)" },
    },
  ]

  let activeCard = $state<string | null>(null)

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(sectionEl.querySelectorAll(".formation-card"), {
      opacity: 0,
      y: 50,
      duration: 0.7,
      stagger: 0.12,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionEl.querySelector(".cards-grid"),
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    })

    gsap.from(sectionEl.querySelectorAll(".animate-in"), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionEl,
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
    })
  })
</script>

<section
  id="formation"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden bg-background"
>
  <!-- Blue decorative radial top-left -->
  <div class="absolute left-0 top-0 w-80 h-80 rounded-full opacity-[0.05] blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, oklch(0.40 0.22 240), transparent);">
  </div>
  <div class="absolute right-0 bottom-0 w-80 h-80 rounded-full opacity-[0.05] blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, oklch(0.74 0.155 75), transparent);">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Section header -->
    <div class="text-center mb-20 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: oklch(0.40 0.22 240);">
        Rejoignez-nous
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style="font-family: var(--font-serif);">
        Nos <span class="gradient-text">Formations</span>
      </h2>
      <div class="knot-divider w-24 mx-auto mb-6"></div>
      <p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
        Apprenez à jouer d'un instrument breton et rejoignez l'aventure du Bagad Penhars.
        Cours ouverts dès 7 ans, tous niveaux, avec nos musiciens passionnés.
      </p>
    </div>

    <!-- Info banner -->
    <div class="animate-in max-w-3xl mx-auto mb-16 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
      style="background: oklch(0.40 0.22 240); box-shadow: 0 8px 32px oklch(0.40 0.22 240 / 25%);">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style="background: oklch(0.74 0.155 75 / 20%);">
          <Clock size={18} style="color: oklch(0.74 0.155 75);" />
        </div>
        <div>
          <div class="text-xs font-medium tracking-wide" style="color: oklch(0.74 0.155 75);">Cours le mardi</div>
          <div class="text-sm font-semibold" style="color: oklch(0.98 0.005 235);">à partir de 18h</div>
        </div>
      </div>
      <div class="hidden sm:block w-px h-10" style="background: oklch(1 0 0 / 20%);"></div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style="background: oklch(0.74 0.155 75 / 20%);">
          <Users size={18} style="color: oklch(0.74 0.155 75);" />
        </div>
        <div>
          <div class="text-xs font-medium tracking-wide" style="color: oklch(0.74 0.155 75);">Inscriptions</div>
          <div class="text-sm font-semibold" style="color: oklch(0.98 0.005 235);">Dès 7 ans — tous niveaux</div>
        </div>
      </div>
      <div class="hidden sm:block w-px h-10" style="background: oklch(1 0 0 / 20%);"></div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style="background: oklch(0.74 0.155 75 / 20%);">
          <Star size={18} style="color: oklch(0.74 0.155 75);" />
        </div>
        <div>
          <div class="text-xs font-medium tracking-wide" style="color: oklch(0.74 0.155 75);">Répétitions Bagad</div>
          <div class="text-sm font-semibold" style="color: oklch(0.98 0.005 235);">Vendredi 20h – Samedi 16h</div>
        </div>
      </div>
    </div>

    <!-- Instrument cards grid -->
    <div class="cards-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each instruments as inst}
        <div
          class="formation-card group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                 hover:-translate-y-2"
          style="background: oklch(1 0 0); border: 1px solid oklch(0.40 0.22 240 / 12%);
                 box-shadow: 0 4px 20px oklch(0.40 0.22 240 / 8%);"
          onmouseenter={() => { activeCard = inst.id }}
          onmouseleave={() => { activeCard = null }}
          role="article"
        >
          <!-- Instrument photo -->
          <div class="relative h-52 overflow-hidden">
            <img
              src={inst.image}
              alt={`Formation ${inst.name}`}
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <!-- Colored overlay on hover -->
            <div
              class="absolute inset-0 transition-opacity duration-300"
              style="background: linear-gradient(to bottom, transparent 40%, {inst.color.bg} 100%);
                     opacity: {activeCard === inst.id ? '0.8' : '0.5'};"
            ></div>
            <!-- Instrument name badge -->
            <div class="absolute top-3 left-3">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style="background: {inst.color.bg}; color: {inst.color.text};">
                <inst.icon size={12} />
                {inst.name}
              </div>
            </div>
          </div>

          <!-- Card content -->
          <div class="p-5">
            <div class="mb-2">
              <h3 class="text-lg font-bold" style="font-family: var(--font-serif); color: oklch(0.13 0.045 240);">
                {inst.name}
              </h3>
              <p class="text-xs font-medium tracking-wide" style="color: oklch(0.40 0.22 240);">
                {inst.breton}
              </p>
            </div>

            <p class="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
              {inst.description}
            </p>

            <!-- Schedule -->
            <div class="flex items-center gap-2 text-xs mb-3" style="color: oklch(0.40 0.22 240);">
              <Clock size={12} />
              <span>{inst.schedule}</span>
            </div>

            <!-- Levels -->
            <div class="flex flex-wrap gap-1.5 mb-4">
              {#each inst.levels as level}
                <span class="px-2 py-0.5 rounded-full text-xs"
                  style="background: oklch(0.40 0.22 240 / 10%); color: oklch(0.40 0.22 240);">
                  {level}
                </span>
              {/each}
            </div>

            <!-- Dès X ans -->
            <div class="pt-3 border-t flex items-center justify-between"
              style="border-color: oklch(0.40 0.22 240 / 10%);">
              <span class="text-xs text-muted-foreground">Dès {inst.ageMin} ans</span>
              <a
                href="#contact"
                onclick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) }}
                class="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
                style="color: oklch(0.40 0.22 240);"
              >
                S'inscrire
                <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Bottom CTA -->
    <div class="animate-in text-center mt-16">
      <p class="text-muted-foreground mb-6 text-base">
        Vous voulez rejoindre notre aventure musicale ?
      </p>
      <a
        href="#contact"
        onclick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) }}
        class="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
               transition-all duration-300 hover:scale-105 active:scale-95"
        style="background: oklch(0.40 0.22 240); color: oklch(0.98 0.005 235);
               box-shadow: 0 4px 24px oklch(0.40 0.22 240 / 35%);"
      >
        <Users size={18} />
        Contactez-nous pour vous inscrire
      </a>
    </div>

  </div>
</section>
