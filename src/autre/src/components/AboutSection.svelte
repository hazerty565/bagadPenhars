<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Wind, Music2, Drum, Award, MapPin } from "lucide-svelte"

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

  const formations = [
    { image: "/formation-bombarde.webp", label: "Bombarde", breton: "Bombard" },
    { image: "/formation-cornemuse.webp", label: "Cornemuse", breton: "Binioù Kozh" },
    { image: "/formation-caisse-claire.webp", label: "Caisse Claire", breton: "Korn Boud" },
    { image: "/formation-percussion.webp", label: "Percussions", breton: "Sonerezh" },
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
  class="relative py-28 lg:py-40 overflow-hidden bg-background"
>
  <div class="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, oklch(0.40 0.22 240), transparent);">
  </div>
  <div class="absolute left-0 bottom-20 w-64 h-64 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, oklch(0.74 0.155 75), transparent);">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div class="text-center mb-20 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3"
        style="color: oklch(0.40 0.22 240);">
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

    <div class="grid lg:grid-cols-2 gap-16 items-center mb-24">

      <div class="animate-in relative">
        <div class="relative rounded-2xl overflow-hidden aspect-[4/3]"
          style="border: 1px solid oklch(0.40 0.22 240 / 15%); box-shadow: 0 20px 60px oklch(0.40 0.22 240 / 12%);">
          <img
            src="/about-musicians.webp"
            alt="Musiciens du Bagad Penhars en concert"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0"
            style="background: linear-gradient(135deg, oklch(0.40 0.22 240 / 15%) 0%, transparent 60%);">
          </div>
        </div>

        <div
          class="absolute -bottom-6 -right-6 rounded-2xl p-5 hidden lg:flex items-center gap-4"
          style="background: oklch(1 0 0); border: 1px solid oklch(0.40 0.22 240 / 15%);
                 box-shadow: 0 8px 32px oklch(0.40 0.22 240 / 12%);"
        >
          <div class="w-12 h-12 rounded-full flex items-center justify-center"
            style="background: oklch(0.74 0.155 75 / 12%);">
            <Award size={22} style="color: oklch(0.74 0.155 75);" />
          </div>
          <div>
            <div class="text-sm font-semibold" style="color: oklch(0.13 0.045 240);">1er grade</div>
            <div class="text-xs text-muted-foreground">Championnat de Bretagne</div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="animate-in">
          <h3 class="text-2xl font-semibold mb-4" style="font-family: var(--font-serif); color: oklch(0.13 0.045 240);">
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
        <div class="animate-in flex items-center gap-2 text-sm">
          <MapPin size={15} style="color: oklch(0.40 0.22 240);" />
          <span class="text-muted-foreground">Penhars, Quimper, Finistère</span>
        </div>
      </div>
    </div>

    <!-- Stats on blue background -->
    <div class="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
      {#each stats as stat}
        <div class="stat-card rounded-2xl p-6 text-center"
          style="background: oklch(0.40 0.22 240); box-shadow: 0 4px 20px oklch(0.40 0.22 240 / 25%);">
          <div class="text-3xl lg:text-4xl font-bold mb-2"
            style="font-family: var(--font-serif); color: oklch(0.74 0.155 75);">
            {stat.value}
          </div>
          <div class="text-sm tracking-wide" style="color: oklch(0.85 0.04 235);">{stat.label}</div>
        </div>
      {/each}
    </div>

    <!-- Instruments -->
    <div>
      <div class="text-center mb-12 animate-in">
        <h3 class="text-2xl sm:text-3xl font-semibold" style="font-family: var(--font-serif); color: oklch(0.13 0.045 240);">
          Nos instruments
        </h3>
      </div>
      <div class="grid sm:grid-cols-3 gap-6 mb-12">
        {#each instruments as instrument}
          <div class="animate-in rounded-2xl p-8 group hover:-translate-y-1
                       transition-all duration-300"
            style="background: oklch(1 0 0); border: 1px solid oklch(0.40 0.22 240 / 12%);
                   box-shadow: 0 4px 20px oklch(0.40 0.22 240 / 6%);"
          >
            <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300
                         group-hover:scale-110"
              style="background: oklch(0.40 0.22 240 / 10%);">
              <instrument.icon size={26} style="color: oklch(0.40 0.22 240);" />
            </div>
            <h4 class="text-lg font-semibold mb-2" style="font-family: var(--font-serif); color: oklch(0.13 0.045 240);">
              {instrument.name}
            </h4>
            <p class="text-sm text-muted-foreground leading-relaxed">{instrument.desc}</p>
          </div>
        {/each}
      </div>

      <!-- Instrument formation photos -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in">
        {#each formations as f}
          <div class="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
            style="box-shadow: 0 4px 20px oklch(0.40 0.22 240 / 10%);">
            <img
              src={f.image}
              alt={f.label}
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-0 transition-opacity duration-300"
              style="background: linear-gradient(to top, oklch(0.13 0.045 240 / 85%) 0%, transparent 55%);">
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <p class="text-xs font-semibold tracking-widest uppercase mb-0.5"
                style="color: oklch(0.74 0.155 75);">
                {f.breton}
              </p>
              <p class="text-base font-bold" style="font-family: var(--font-serif); color: oklch(0.98 0.005 235);">
                {f.label}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>

  </div>
</section>
