<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Play, Pause, Disc3 } from "lucide-svelte"
  import { tracks, albums } from "../lib/tracks.js"
  import { formatTime } from "../lib/utils.js"

  interface Props {
    currentTrackIndex: number
    isPlaying: boolean
    onPlayTrack: (index: number) => void
  }
  let { currentTrackIndex, isPlaying, onPlayTrack }: Props = $props()

  let sectionEl: HTMLElement
  let activeAlbum = $state(0)

  const albumTracks = $derived(
    tracks.filter((t) => t.album === albums[activeAlbum].title)
  )

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
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
    })
  })
</script>

<section
  id="musique"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden"
  style="background: oklch(0.94 0.02 235);"
>
  <!-- Decorative top line -->
  <div class="absolute left-1/2 top-0 -translate-x-1/2 w-px h-24 opacity-30"
    style="background: linear-gradient(180deg, transparent, oklch(0.40 0.22 240));">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div class="text-center mb-20 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: oklch(0.40 0.22 240);">
        Discographie
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style="font-family: var(--font-serif);">
        Notre <span class="gradient-text">Musique</span>
      </h2>
      <div class="knot-divider w-24 mx-auto mb-6"></div>
      <p class="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
        Trois albums, des dizaines de morceaux — une invitation au voyage au cœur de la Bretagne profonde.
      </p>
    </div>

    <!-- Album tabs -->
    <div class="flex gap-2 justify-center mb-12 animate-in flex-wrap">
      {#each albums as album, i}
        <button
          onclick={() => { activeAlbum = i }}
          class="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
          style={activeAlbum === i
            ? "background: oklch(0.40 0.22 240); color: oklch(0.98 0.005 235); box-shadow: 0 4px 16px oklch(0.40 0.22 240 / 35%);"
            : "background: oklch(1 0 0); color: oklch(0.40 0.22 240); border: 1px solid oklch(0.40 0.22 240 / 25%);"}
        >
          {album.title}
        </button>
      {/each}
    </div>

    <div class="grid lg:grid-cols-[380px_1fr] gap-12 items-start">

      <!-- Album cover -->
      <div class="animate-in">
        <div class="relative rounded-2xl overflow-hidden aspect-square gold-glow"
          style="border: 1px solid oklch(0.74 0.155 75 / 25%); box-shadow: 0 20px 60px oklch(0.40 0.22 240 / 15%);">
          <img
            src={albums[activeAlbum].cover}
            alt={`Album ${albums[activeAlbum].title}`}
            class="w-full h-full object-cover transition-all duration-500"
          />
          <div class="absolute inset-0"
            style="background: linear-gradient(to bottom, transparent 60%, oklch(0.13 0.045 240 / 75%));">
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <div class="text-xs font-semibold tracking-widest uppercase mb-1"
              style="color: oklch(0.74 0.155 75);">
              {albums[activeAlbum].year}
            </div>
            <h3 class="text-xl font-bold" style="font-family: var(--font-serif); color: oklch(0.98 0.005 235);">
              {albums[activeAlbum].title}
            </h3>
            <p class="text-xs mt-1" style="color: oklch(0.75 0.04 235);">{albums[activeAlbum].trackCount} morceaux</p>
          </div>
        </div>

        <p class="mt-4 text-sm text-muted-foreground leading-relaxed px-1">
          {albums[activeAlbum].description}
        </p>
      </div>

      <!-- Track list -->
      <div class="animate-in space-y-2">
        {#each albumTracks as track, i}
          {@const globalIndex = tracks.findIndex(t => t.id === track.id)}
          {@const active = globalIndex === currentTrackIndex}
          <button
            onclick={() => onPlayTrack(globalIndex)}
            class="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group text-left
                   hover:-translate-x-1"
            style={active
              ? "background: oklch(0.40 0.22 240 / 10%); border: 1px solid oklch(0.40 0.22 240 / 25%);"
              : "background: oklch(1 0 0); border: 1px solid oklch(0.40 0.22 240 / 8%);"}
          >
            <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
              {#if active && isPlaying}
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  style="background: oklch(0.74 0.155 75);">
                  <Pause size={14} fill="currentColor" style="color: oklch(0.13 0.045 240);" />
                </div>
              {:else if active}
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  style="background: oklch(0.40 0.22 240 / 15%);">
                  <Play size={14} fill="currentColor" style="color: oklch(0.40 0.22 240);" />
                </div>
              {:else}
                <span class="text-sm text-muted-foreground group-hover:hidden font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Play size={16} class="hidden group-hover:block" style="color: oklch(0.40 0.22 240);" />
              {/if}
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate"
                style={active ? "color: oklch(0.40 0.22 240);" : "color: oklch(0.13 0.045 240);"}>
                {track.title}
              </div>
              <div class="text-xs text-muted-foreground truncate mt-0.5">{track.subtitle}</div>
            </div>

            <div class="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
              <span class="hidden sm:block">{track.instruments.split(",")[0]}</span>
              <span class="font-mono">{formatTime(track.duration)}</span>
            </div>
          </button>
        {/each}

        {#if albumTracks.length === 0}
          <div class="text-center py-12 text-muted-foreground">
            <Disc3 size={32} class="mx-auto mb-3 opacity-30" />
            <p class="text-sm">Aucun morceau disponible</p>
          </div>
        {/if}
      </div>
    </div>

  </div>
</section>
