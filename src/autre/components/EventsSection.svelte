<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Calendar, MapPin, Ticket, ChevronRight } from "lucide-svelte"
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

  const typeColors: Record<string, string> = {
    Festival: "var(--blue)",
    Concert: "var(--yellow-flower)",
    Tradition: "var(--orange-fruit)",
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
  class="relative py-28 lg:py-40 overflow-hidden section-gradient"
>
  <!-- Floral border divider -->
  <div class="floral-divider absolute top-0 left-0 right-0 h-3"></div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Header -->
    <div class="text-center mb-20">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: var(--blue);">
        Prochainement
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style="font-family: var(--font-serif);">
        Notre <span class="gradient-text">Agenda</span>
      </h2>
      <div class="knot-divider w-24 mx-auto"></div>
    </div>

    <!-- Events list -->
    <div class="max-w-3xl mx-auto space-y-4">
      {#each events as event}
        {@const date = formatDate(event.date)}
        <div
          class="event-card glass-card rounded-2xl p-6 celtic-border group
                 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-start gap-6">
            <!-- Date box -->
            <div
              class="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-center"
              style="background: var(--blue) / 15%; border: 1px solid var(--blue) / 30%;"
            >
              <span class="text-xl font-bold leading-none" style="color: var(--blue);">
                {date.day}
              </span>
              <span class="text-xs font-medium text-muted-foreground mt-1">{date.month}</span>
            </div>

            <!-- Event details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <h3 class="font-semibold text-foreground text-lg leading-tight"
                  style="font-family: var(--font-serif);">
                  {event.title}
                </h3>
                <span
                  class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
                  style="background: {typeColors[event.type] ?? 'var(--blue)'}/20%; color: {typeColors[event.type] ?? 'var(--blue)'};"
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

    <!-- CTA -->
    <div class="text-center mt-12">
      <button
        class="inline-flex items-center gap-2 px-6 py-3 rounded-full border text-sm font-medium
               transition-all duration-300 hover:bg-white/5"
        style="border-color: var(--blue) / 40%; color: var(--blue);"
      >
        <Calendar size={15} />
        Voir tout l'agenda
      </button>
    </div>

  </div>
</section>
