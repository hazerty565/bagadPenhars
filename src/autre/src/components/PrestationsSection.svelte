<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Minus, Plus } from "lucide-svelte"

  let sectionEl: HTMLElement

  const prestations = [
    {
      id: "aubade",
      title: "Aubade",
      description:
        "Le Bagad Penhars propose des prestations scéniques composées de son propre répertoire musical. Un spectacle complet alliant sonorités traditionnelles bretonnes et arrangements contemporains pour émerveiller votre public.",
    },
    {
      id: "deambulation",
      title: "Déambulation",
      description:
        "Le Bagad Penhars propose aussi des prestations déambulatoires pour animer rues et ruelles dans vos fêtes et festivals. Une expérience immersive qui fait vibrer tout un quartier au rythme des cornemuses et bombardes.",
    },
    {
      id: "fest-noz",
      title: "Fest-noz / Fest-deiz",
      description:
        "Le répertoire musical du Bagad Penhars étant composé d'airs traditionnels bretons, le groupe peut donc animer vos fest-noz / fest-deiz et faire danser les foules ! Une soirée inoubliable garantie au cœur de la tradition bretonne.",
    },
    {
      id: "couple-trio",
      title: "Couple / Trio",
      description:
        "Pour une petite représentation à l'occasion d'un mariage, d'un cocktail, d'une inauguration... un couple cornemuse/bombarde ou un trio cornemuse/bombarde/batterie peut intervenir et apporter une touche bretonne authentique à votre événement.",
    },
  ]

  let openItems = $state<Set<string>>(new Set(["aubade", "deambulation", "fest-noz", "couple-trio"]))

  function toggle(id: string) {
    const next = new Set(openItems)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    openItems = next
  }

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(sectionEl.querySelectorAll(".animate-in"), {
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionEl,
        start: "top 78%",
        toggleActions: "play none none reverse",
      },
    })
  })
</script>

<section
  id="prestations"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden bg-background"
>
  <!-- Decorative blobs -->
  <div class="absolute right-0 top-0 w-80 h-80 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, oklch(0.74 0.155 75), transparent);">
  </div>
  <div class="absolute left-0 bottom-0 w-64 h-64 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
    style="background: radial-gradient(circle, oklch(0.40 0.22 240), transparent);">
  </div>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Section header -->
    <div class="text-center mb-16 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3"
        style="color: oklch(0.74 0.155 75);">
        À votre service
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
        style="font-family: var(--font-serif);">
        Nos <span class="gradient-text">Prestations</span>
      </h2>
      <div class="knot-divider w-24 mx-auto mb-6"></div>
      <p class="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
        Du concert en salle à la déambulation festive, le Bagad Penhars s'adapte
        à tous vos événements avec passion et professionnalisme.
      </p>
    </div>

    <!-- Accordion -->
    <div class="animate-in space-y-3">
      {#each prestations as p, i}
        <div class="rounded-xl overflow-hidden"
          style="box-shadow: 0 4px 20px oklch(0.40 0.22 240 / 10%);">

          <!-- Header bar -->
          <button
            onclick={() => toggle(p.id)}
            class="w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-200
                   hover:opacity-90 active:scale-[0.995]"
            style="background: oklch(0.74 0.155 75);"
            aria-expanded={openItems.has(p.id)}
          >
            <span class="text-xl font-bold" style="font-family: var(--font-serif); color: oklch(0.13 0.045 240);">
              {p.title}
            </span>
            <span class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300"
              style="background: oklch(0.13 0.045 240 / 12%);"
              class:rotate-0={!openItems.has(p.id)}
            >
              {#if openItems.has(p.id)}
                <Minus size={16} style="color: oklch(0.13 0.045 240);" />
              {:else}
                <Plus size={16} style="color: oklch(0.13 0.045 240);" />
              {/if}
            </span>
          </button>

          <!-- Content panel -->
          {#if openItems.has(p.id)}
            <div class="px-6 py-5"
              style="background: oklch(1 0 0); border: 1px solid oklch(0.74 0.155 75 / 20%);
                     border-top: none;">
              <p class="text-muted-foreground leading-relaxed">
                {p.description}
              </p>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Contact CTA -->
    <div class="animate-in text-center mt-14">
      <p class="text-muted-foreground mb-6">
        Vous souhaitez nous inviter pour votre événement ?
      </p>
      <a
        href="#contact"
        onclick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) }}
        class="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
               transition-all duration-300 hover:scale-105 active:scale-95"
        style="background: oklch(0.74 0.155 75); color: oklch(0.13 0.045 240);
               box-shadow: 0 4px 24px oklch(0.74 0.155 75 / 35%);"
      >
        Nous contacter
      </a>
    </div>

  </div>
</section>
