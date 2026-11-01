<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Calendar, MapPin, ChevronRight } from "lucide-svelte"
  import { events } from "../lib/tracks.js"

  let sectionEl: HTMLElement

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return {
      day: d.getDate().toString().padStart(2, "0"),
      month: d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase(),
      year: d.getFullYear(),
    }
  }

  const typeColors: Record<string, { bg: string; text: string }> = {
    Festival: { bg: "oklch(0.74 0.155 75 / 12%)", text: "oklch(0.58 0.13 75)" },
    Concert:  { bg: "oklch(0.40 0.22 240 / 12%)", text: "oklch(0.40 0.22 240)" },
    Tradition:{ bg: "oklch(0.45 0.12 160 / 12%)", text: "oklch(0.35 0.12 160)" },
  }

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(sectionEl.querySelectorAll(".event-card"), {
      opacity: 0,
      x: -30,
      duration: 0.7,
      stagger: 0.12,
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
  id="agenda"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden bg-background"
>
  <!-- Subtle background pattern -->
  <div class="absolute inset-0 pointer-events-none opacity-[0.025]"
    style="background-image: radial-gradient(circle at 1px 1px, oklch(0.40 0.22 240) 1px, transparent 0); background-size: 32px 32px;">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div class="text-center mb-20">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: oklch(0.40 0.22 240);">
        Prochainement
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style="font-family: var(--font-serif);">
        Notre <span class="gradient-text">Agenda</span>
      </h2>
      <div class="knot-divider w-24 mx-auto"></div>
    </div>

    <div class="max-w-3xl mx-auto space-y-4">
      {#each events as event}
        {@const date = formatDate(event.date)}
        {@const tc = typeColors[event.type] ?? typeColors.Festival}
        <div
          class="event-card rounded-2xl p-6 group hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          style="background: oklch(1 0 0); border: 1px solid oklch(0.40 0.22 240 / 12%);
                 box-shadow: 0 4px 20px oklch(0.40 0.22 240 / 6%);"
        >
          <div class="flex items-start gap-6">
            <!-- Date box -->
            <div
              class="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-center"
              style="background: oklch(0.40 0.22 240); box-shadow: 0 4px 16px oklch(0.40 0.22 240 / 30%);"
            >
              <span class="text-xl font-bold leading-none" style="color: oklch(0.74 0.155 75);">
                {date.day}
              </span>
              <span class="text-xs font-medium mt-1" style="color: oklch(0.85 0.04 235);">{date.month}</span>
            </div>

            <!-- Event details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <h3 class="font-semibold text-lg leading-tight"
                  style="font-family: var(--font-serif); color: oklch(0.13 0.045 240);">
                  {event.title}
                </h3>
                <span
                  class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
                  style="background: {tc.bg}; color: {tc.text};"
                >
                  {event.type}
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <MapPin size={13} />
                <span>{event.location}</span>
              </div>

              <p class="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            <ChevronRight
              size={18}
              class="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-1"
            />
          </div>
        </div>
      {/each}
    </div>

    <div class="text-center mt-12">
      <button
        class="inline-flex items-center gap-2 px-6 py-3 rounded-full border text-sm font-medium
               transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        style="border-color: oklch(0.40 0.22 240 / 30%); color: oklch(0.40 0.22 240);"
      >
        <Calendar size={15} />
        Voir tout l'agenda
      </button>
    </div>

  </div>
</section>
