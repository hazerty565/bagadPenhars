<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Wind, Music2, Drum, Users, Award, MapPin } from "lucide-svelte"

  let sectionEl: HTMLElement

  const instruments = [
    {
      icon: Wind,
      name: "Binioù Kozh",
      desc: "La cornemuse bretonne traditionnelle, chant de la Cornouaille",
    },
    {
      icon: Music2,
      name: "Bombarde",
      desc: "Hautbois breton au son puissant, voix des pardons",
    },
    {
      icon: Drum,
      name: "Percussion",
      desc: "Caisse claire et grosse caisse, le pouls de Bretagne",
    },
  ]

  const stats = [
    { value: "1955", label: "Fondé en" },
    { value: "70+", label: "Musiciens" },
    { value: "50+", label: "Concerts/an" },
    { value: "3", label: "Albums" },
  ]

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(sectionEl.querySelectorAll(".animate-in"), {
      opacity: 0,
      y: 50,
      duration: 0.9,
      stagger: 0.12,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionEl,
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
    })

    gsap.from(sectionEl.querySelectorAll(".stat-card"), {
      opacity: 0,
      scale: 0.8,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: sectionEl.querySelector(".stats-grid"),
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  })
</script>

<section
  id="bagad"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden section-gradient"
>
  <!-- Floral border divider at top -->
  

  <!-- Background decoration with floral accents -->
  <div class="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, var(--blue), transparent);">
  </div>
  <div class="absolute left-0 bottom-20 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, var(--yellow-flower), transparent);">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Section header -->
    <div class="text-center mb-20 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3"
        style="color: var(--blue);">
        Qui sommes-nous
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
        style="font-family: var(--font-serif);">
        Notre <span class="gradient-text">Bagad</span>
      </h2>
      <div class="knot-divider w-24 mx-auto mb-6"></div>
      <p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
        Fondé en 1955 à Penhars, quartier de Quimper, notre bagad perpétue et renouvelle
        les traditions musicales de Cornouaille avec passion et exigence.
      </p>
    </div>

    <!-- Content grid -->
    <div class="grid lg:grid-cols-2 gap-16 items-center mb-24">

      <!-- Image side -->
      <div class="animate-in relative">
        <div class="relative rounded-2xl overflow-hidden aspect-[4/3] celtic-border">
          <img
            src="/about-musicians.webp"
            alt="Musiciens du Bagad Penhars en concert"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0"
            style="background: linear-gradient(135deg, oklch(0.38 0.09 145 / 20%) 0%, transparent 60%);">
          </div>
        </div>

        <!-- Floating badge -->
        <div
          class="absolute -bottom-6 -right-6 glass-card rounded-2xl p-5 hidden lg:flex items-center gap-4"
        >
          <div class="w-12 h-12 rounded-full flex items-center justify-center"
            style="background: var(--blue) / 20%;">
            <Award size={22} style="color: var(--yellow-flower);" />
          </div>
          <div>
            <div class="text-sm font-semibold text-foreground">1er grade</div>
            <div class="text-xs text-muted-foreground">Championnat de Bretagne</div>
          </div>
        </div>
      </div>

      <!-- Text side -->
      <div class="space-y-6">
        <div class="animate-in">
          <h3 class="text-2xl font-semibold mb-4" style="font-family: var(--font-serif);">
            Une histoire enracinée dans la tradition
          </h3>
          <p class="text-muted-foreground leading-relaxed">
            Depuis plus de soixante-dix ans, le Bagad Penhars incarne l'âme musicale du
            Pays de Cornouaille. Nos musiciens, formés dès le plus jeune âge à l'école de
            musique bretonne, portent avec fierté l'héritage de leurs aînés tout en
            l'enrichissant de créations contemporaines.
          </p>
        </div>
        <div class="animate-in">
          <p class="text-muted-foreground leading-relaxed">
            Chaque année, nous participons aux plus grands rassemblements celtiques —
            la Fête de Cornouaille à Quimper, le Festival Interceltique de Lorient — et
            parcourons l'Europe pour faire rayonner la culture bretonne au-delà de nos frontières.
          </p>
        </div>

        <div class="animate-in flex items-center gap-2 text-sm" style="color: var(--blue);">
          <MapPin size={15} />
          <span class="text-muted-foreground">Penhars, Quimper, Finistère</span>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
      {#each stats as stat}
        <div class="stat-card glass-card rounded-2xl p-6 text-center celtic-border">
          <div class="text-3xl lg:text-4xl font-bold gradient-text mb-2"
            style="font-family: var(--font-serif);">
            {stat.value}
          </div>
          <div class="text-sm text-muted-foreground tracking-wide">{stat.label}</div>
        </div>
      {/each}
    </div>

    <!-- Instruments -->
    <div>
      <div class="text-center mb-12 animate-in">
        <h3 class="text-2xl sm:text-3xl font-semibold" style="font-family: var(--font-serif);">
          Nos instruments
        </h3>
      </div>
      <div class="grid sm:grid-cols-3 gap-6">
        {#each instruments as instrument}
          <div class="animate-in glass-card rounded-2xl p-8 celtic-border group hover:border-primary/30
                       transition-all duration-300 hover:-translate-y-1">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300
                         group-hover:scale-110"
              style="background: var(--blue) / 15%;">
              <instrument.icon size={26} style="color: var(--blue);" />
            </div>
            <h4 class="text-lg font-semibold mb-2" style="font-family: var(--font-serif);">
              {instrument.name}
            </h4>
            <p class="text-sm text-muted-foreground leading-relaxed">{instrument.desc}</p>
          </div>
        {/each}
      </div>
    </div>

  </div>
</section>
