<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { ZoomIn, X } from "lucide-svelte"

  let sectionEl: HTMLElement
  let lightboxOpen = $state(false)
  let lightboxSrc = $state("")
  let lightboxAlt = $state("")

  const photos = [
    { src: "/gallery1.webp", alt: "Concert en plein air — Fête de Cornouaille", size: "tall" },
    { src: "/gallery2.webp", alt: "Les binious en procession", size: "wide" },
    { src: "/gallery3.webp", alt: "Répétition du Bagad", size: "normal" },
    { src: "/gallery4.webp", alt: "Festival Interceltique de Lorient", size: "normal" },
    { src: "/album1.webp", alt: "Musiciens en costume breton", size: "wide" },
    { src: "/album2.webp", alt: "Concert de nuit", size: "normal" },
  ]

  function openLightbox(photo: { src: string; alt: string }) {
    lightboxSrc = photo.src
    lightboxAlt = photo.alt
    lightboxOpen = true
    document.body.style.overflow = "hidden"
  }

  function closeLightbox() {
    lightboxOpen = false
    document.body.style.overflow = ""
  }

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(sectionEl.querySelectorAll(".gallery-item"), {
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionEl.querySelector(".gallery-grid"),
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    })
  })
</script>

<section
  id="galerie"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden"
  style="background: oklch(0.94 0.02 235);"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div class="text-center mb-20">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: oklch(0.40 0.22 240);">
        Souvenirs
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style="font-family: var(--font-serif);">
        Notre <span class="gradient-text">Galerie</span>
      </h2>
      <div class="knot-divider w-24 mx-auto"></div>
    </div>

    <div class="gallery-grid columns-2 lg:columns-3 gap-4 space-y-4">
      {#each photos as photo, i}
        <button
          onclick={() => openLightbox(photo)}
          class="gallery-item block w-full rounded-xl overflow-hidden relative group cursor-zoom-in break-inside-avoid mb-4"
        >
          <div
            class="overflow-hidden rounded-xl"
            class:aspect-square={photo.size === "normal"}
            class:aspect-video={photo.size === "wide"}
            style={photo.size === "tall" ? "aspect-ratio: 3/4;" : ""}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading={i < 3 ? "eager" : "lazy"}
            />
            <div
              class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
                     transition-all duration-300"
              style="background: oklch(0.13 0.045 240 / 50%);"
            >
              <div class="w-12 h-12 rounded-full flex items-center justify-center"
                style="background: oklch(0.74 0.155 75 / 90%);">
                <ZoomIn size={20} style="color: oklch(0.13 0.045 240);" />
              </div>
            </div>
          </div>
          <p class="sr-only">{photo.alt}</p>
        </button>
      {/each}
    </div>

  </div>
</section>

{#if lightboxOpen}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style="background: oklch(0.10 0.05 240 / 93%); backdrop-filter: blur(8px);"
    onclick={closeLightbox}
    onkeydown={(e) => e.key === 'Escape' && closeLightbox()}
    role="dialog"
    aria-modal="true"
    aria-label="Lightbox image"
    tabindex="-1"
  >
    <button
      onclick={closeLightbox}
      class="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center
             transition-all duration-200 hover:bg-white/10"
      style="color: oklch(0.74 0.155 75);"
      aria-label="Fermer"
    >
      <X size={22} />
    </button>
    <img
      src={lightboxSrc}
      alt={lightboxAlt}
      class="max-w-full max-h-[85vh] rounded-xl object-contain pointer-events-none"
      style="box-shadow: 0 0 80px oklch(0.74 0.155 75 / 20%);"
    />
    <p class="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
      {lightboxAlt}
    </p>
  </div>
{/if}
