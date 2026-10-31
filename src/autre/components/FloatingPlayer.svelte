<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, Shuffle, Repeat,
    X, Minus, Maximize2, Music2, ChevronUp,
  } from "lucide-svelte"
  import type { Track } from "../lib/tracks.js"
  import { formatTime } from "../lib/utils.js"

  interface Props {
    open: boolean
    currentTrackIndex: number
    isPlaying: boolean
    tracks: Track[]
  }
  let {
    open = $bindable(true),
    currentTrackIndex = $bindable(0),
    isPlaying = $bindable(false),
    tracks,
  }: Props = $props()

  // Player state
  let progress = $state(0)
  let volume = $state(75)
  let muted = $state(false)
  let shuffle = $state(false)
  let repeat = $state(false)
  let minimized = $state(false)
  let elapsed = $state(0)

  // Drag state
  let playerEl: HTMLElement = $state()!
  let isDragging = $state(false)
  let pos = $state({ x: 0, y: 0 })
  let dragStart = $state({ mx: 0, my: 0, px: 0, py: 0 })

  // Canvas
  let canvasEl: HTMLCanvasElement = $state()!
  let animFrame = 0
  let prevTime = 0

  const currentTrack = $derived(tracks[currentTrackIndex])

  // Auto-progress timer
  let progressInterval = 0

  $effect(() => {
    if (isPlaying) {
      progressInterval = window.setInterval(() => {
        if (progress >= 100) {
          nextTrack()
        } else {
          progress += (100 / currentTrack.duration) * 0.25
          elapsed = (progress / 100) * currentTrack.duration
        }
      }, 250)
    } else {
      clearInterval(progressInterval)
    }
    return () => clearInterval(progressInterval)
  })

  // Reset progress on track change
  $effect(() => {
    if (currentTrackIndex >= 0) {
      progress = 0
      elapsed = 0
    }
  })

  function togglePlay() {
    isPlaying = !isPlaying
  }

  function nextTrack() {
    if (shuffle) {
      currentTrackIndex = Math.floor(Math.random() * tracks.length)
    } else if (repeat) {
      progress = 0
      elapsed = 0
    } else {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length
    }
    progress = 0
    elapsed = 0
  }

  function prevTrack() {
    if (elapsed > 3) {
      progress = 0
      elapsed = 0
    } else {
      currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
      progress = 0
      elapsed = 0
    }
  }

  function seekTo(e: MouseEvent) {
    const bar = e.currentTarget as HTMLElement
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    progress = ratio * 100
    elapsed = ratio * currentTrack.duration
  }

  // Drag handlers
  function startDrag(e: MouseEvent | TouchEvent) {
    if ((e.target as HTMLElement).closest("button, input, canvas")) return
    isDragging = true
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    dragStart = { mx: clientX, my: clientY, px: pos.x, py: pos.y }
    e.preventDefault()
  }

  function onMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const newX = dragStart.px + clientX - dragStart.mx
    const newY = dragStart.py + clientY - dragStart.my
    const maxX = window.innerWidth - (minimized ? 320 : 360)
    const maxY = window.innerHeight - (minimized ? 72 : 320)
    pos = {
      x: Math.max(8, Math.min(maxX, newX)),
      y: Math.max(8, Math.min(maxY, newY)),
    }
  }

  function stopDrag() {
    isDragging = false
  }

  onMount(() => {
    // Initial position: bottom-right
    pos = {
      x: window.innerWidth - 376,
      y: window.innerHeight - 340,
    }

    // GSAP entrance
    gsap.from(playerEl, {
      opacity: 0,
      scale: 0.85,
      y: 30,
      duration: 0.5,
      ease: "back.out(1.5)",
      delay: 1.2,
    })

    // Canvas waveform
    function drawWave() {
      if (!canvasEl) { animFrame = requestAnimationFrame(drawWave); return }
      const ctx = canvasEl.getContext("2d")!
      const w = canvasEl.width
      const h = canvasEl.height
      const now = Date.now()
      const t = now * 0.0015

      ctx.clearRect(0, 0, w, h)

      const barCount = 40
      const barW = w / barCount - 1
      const intensity = isPlaying ? 1 : 0.15

      for (let i = 0; i < barCount; i++) {
        const x = i * (barW + 1)
        const phase = i * 0.3 + t
        const amp = (
          Math.sin(phase) * 0.4 +
          Math.sin(phase * 2.1 + 1) * 0.3 +
          Math.sin(phase * 0.7 + 2) * 0.3
        ) * intensity

        const barH = Math.abs(amp) * (h * 0.7) + 3
        const y = (h - barH) / 2

        const alpha = 0.4 + Math.abs(amp) * 0.6
        ctx.fillStyle = `oklch(0.74 0.155 75 / ${alpha})`
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, 2)
        ctx.fill()
      }

      animFrame = requestAnimationFrame(drawWave)
    }

    drawWave()

    return () => cancelAnimationFrame(animFrame)
  })

  let effectiveVolume = $derived(muted ? 0 : volume)
</script>

<svelte:window
  onmousemove={onMove}
  onmouseup={stopDrag}
  ontouchmove={onMove}
  ontouchend={stopDrag}
/>

{#if open}
  <!-- Floating player window -->
  <div
    bind:this={playerEl}
    class="fixed z-50 select-none"
    style="left: {pos.x}px; top: {pos.y}px; width: {minimized ? '320px' : '360px'};"
    role="dialog"
    aria-label="Lecteur musical"
  >
    <div
      class="rounded-2xl overflow-hidden"
      style="background: oklch(0.09 0.028 265 / 96%); backdrop-filter: blur(20px);
             border: 1px solid oklch(0.74 0.155 75 / 25%);
             box-shadow: 0 25px 60px oklch(0.05 0.02 265 / 80%), 0 0 0 1px var(--blue) / 8%,
                         0 0 60px var(--blue) / 15%;"
    >
      <!-- Title bar (drag handle) -->
      <div
        class="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
        style="background: var(--blue) / 8%; border-bottom: 1px solid var(--blue) / 20%;"
        onmousedown={startDrag}
        ontouchstart={startDrag}
        role="none"
      >
        <div class="flex items-center gap-2">
          <Music2 size={14} style="color: var(--yellow-flower);" />
          <span class="text-xs font-medium tracking-widest uppercase"
            style="color: var(--blue) / 85%;">
            Bagad Penhars
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button
            onclick={() => { minimized = !minimized }}
            class="w-7 h-7 rounded-md flex items-center justify-center transition-colors
                   hover:bg-white/10"
            style="color: oklch(0.60 0.04 78);"
            aria-label={minimized ? "Agrandir" : "Réduire"}
          >
            {#if minimized}
              <Maximize2 size={12} />
            {:else}
              <Minus size={12} />
            {/if}
          </button>
          <button
            onclick={() => { open = false }}
            class="w-7 h-7 rounded-md flex items-center justify-center transition-colors
                   hover:bg-red-500/20 hover:text-red-400"
            style="color: oklch(0.60 0.04 78);"
            aria-label="Fermer le lecteur"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {#if !minimized}
        <!-- Album art + info -->
        <div class="p-5">
          <div class="flex gap-4 mb-5">
            <!-- Album art -->
            <div class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative"
              style="border: 1px solid oklch(0.74 0.155 75 / 20%);">
              <img
                src={currentTrack?.albumArt ?? "/images/album1.jpg"}
                alt={currentTrack?.album ?? "Album"}
                class="w-full h-full object-cover"
                class:rotating={isPlaying}
              />
              {#if !isPlaying}
                <div class="absolute inset-0 flex items-center justify-center"
                  style="background: oklch(0.09 0.028 265 / 40%);">
                  <div class="w-6 h-6 rounded-full"
                    style="border: 2px solid oklch(0.74 0.155 75 / 60%); background: oklch(0.74 0.155 75 / 20%);">
                  </div>
                </div>
              {/if}
            </div>

            <!-- Track info -->
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-semibold text-sm text-foreground truncate mb-0.5"
                style="font-family: var(--font-serif);">
                {currentTrack?.title ?? "—"}
              </h3>
              <p class="text-xs text-muted-foreground truncate">
                {currentTrack?.subtitle ?? ""}
              </p>
              <p class="text-xs mt-1 truncate" style="color: oklch(0.74 0.155 75 / 70%);">
                {currentTrack?.album ?? ""}
              </p>
            </div>
          </div>

          <!-- Waveform canvas -->
          <div class="mb-4 rounded-lg overflow-hidden" style="height: 48px;">
            <canvas
              bind:this={canvasEl}
              width={320}
              height={48}
              class="w-full h-full"
            ></canvas>
          </div>

          <!-- Progress bar -->
          <div class="mb-4">
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
            <div
              class="h-1.5 rounded-full cursor-pointer relative group mb-1.5"
              style="background: oklch(0.74 0.155 75 / 15%);"
              onclick={seekTo}
              role="slider"
              aria-label="Progression"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabindex="0"
            >
              <div
                class="absolute left-0 top-0 h-full rounded-full transition-all"
                style="width: {progress}%; background: linear-gradient(90deg, var(--blue) / 70%, var(--blue));"
              ></div>
              <!-- Thumb -->
              <div
                class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100
                       transition-opacity -translate-x-1/2"
                style="left: {progress}%; background: var(--blue); box-shadow: 0 0 8px var(--blue) / 70%;"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground font-mono">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(currentTrack?.duration ?? 0)}</span>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-between mb-4">
            <!-- Shuffle -->
            <button
              onclick={() => { shuffle = !shuffle }}
              class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style="color: {shuffle ? 'var(--blue)' : 'oklch(0.50 0.04 78)'};"
              aria-label="Aléatoire"
              aria-pressed={shuffle}
            >
              <Shuffle size={14} />
            </button>

            <!-- Prev -->
            <button
              onclick={prevTrack}
              class="w-9 h-9 flex items-center justify-center rounded-full transition-all
                     hover:bg-white/5 active:scale-90"
              style="color: oklch(0.80 0.04 78);"
              aria-label="Précédent"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            <!-- Play/Pause -->
            <button
              onclick={togglePlay}
              class="w-12 h-12 flex items-center justify-center rounded-full transition-all
                     hover:scale-110 active:scale-95"
              style="background: var(--blue); color: white;
                     box-shadow: 0 0 20px var(--blue) / 50%;"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {#if isPlaying}
                <Pause size={20} fill="currentColor" />
              {:else}
                <Play size={20} fill="currentColor" class="translate-x-0.5" />
              {/if}
            </button>

            <!-- Next -->
            <button
              onclick={nextTrack}
              class="w-9 h-9 flex items-center justify-center rounded-full transition-all
                     hover:bg-white/5 active:scale-90"
              style="color: oklch(0.80 0.04 78);"
              aria-label="Suivant"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>

            <!-- Repeat -->
            <button
              onclick={() => { repeat = !repeat }}
              class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style="color: {repeat ? 'var(--blue)' : 'oklch(0.50 0.04 78)'};"
              aria-label="Répéter"
              aria-pressed={repeat}
            >
              <Repeat size={14} />
            </button>
          </div>

          <!-- Volume -->
          <div class="flex items-center gap-3">
            <button
              onclick={() => { muted = !muted }}
              class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors
                     hover:bg-white/5"
              style="color: oklch(0.60 0.04 78);"
              aria-label={muted ? "Activer le son" : "Couper le son"}
            >
              {#if muted || volume === 0}
                <VolumeX size={14} />
              {:else}
                <Volume2 size={14} />
              {/if}
            </button>
            <div class="flex-1 relative h-1.5 rounded-full cursor-pointer group"
              style="background: oklch(0.74 0.155 75 / 15%);">
              <input
                type="range"
                min="0"
                max="100"
                bind:value={volume}
                onchange={() => { if (volume > 0) muted = false }}
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Volume"
              />
              <div
                class="h-full rounded-full transition-all"
                style="width: {muted ? 0 : volume}%; background: linear-gradient(90deg, var(--blue) / 70%, var(--blue));"
              ></div>
              <div
                class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100
                       transition-opacity -translate-x-1/2"
                style="left: {muted ? 0 : volume}%; background: var(--blue);"
              ></div>
            </div>
            <span class="text-xs font-mono text-muted-foreground w-7 text-right">
              {muted ? "0" : volume}
            </span>
          </div>

          <!-- Track list mini -->
          <div class="mt-5 space-y-1 border-t pt-4" style="border-color: oklch(0.74 0.155 75 / 12%);">
            {#each tracks.slice(0, 4) as track, i}
              {@const active = i === currentTrackIndex}
              <button
                onclick={() => { currentTrackIndex = i; isPlaying = true; progress = 0; elapsed = 0 }}
                class="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 text-left hover:bg-white/5"
                class:active-track={active}
              >
                <div class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style="background: {active ? 'var(--blue)' : 'oklch(0.40 0.04 78)'};">
                </div>
                <span class="text-xs flex-1 truncate"
                  style="color: {active ? 'var(--blue)' : 'oklch(0.70 0.04 78)'};">
                  {track.title}
                </span>
                <span class="text-xs font-mono"
                  style="color: oklch(0.45 0.04 78);">
                  {formatTime(track.duration)}
                </span>
              </button>
            {/each}
            {#if tracks.length > 4}
              <p class="text-xs text-center text-muted-foreground pt-1 opacity-50">
                +{tracks.length - 4} morceaux
              </p>
            {/if}
          </div>
        </div>
      {:else}
        <!-- Minimized view -->
        <div
          class="flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing"
          onmousedown={startDrag}
          ontouchstart={startDrag}
          role="none"
        >
          <img
            src={currentTrack?.albumArt ?? "/images/album1.jpg"}
            alt="Album"
            class="w-10 h-10 rounded-lg flex-shrink-0 object-cover"
            class:rotating={isPlaying}
          />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate text-foreground">{currentTrack?.title ?? "—"}</p>
            <p class="text-xs text-muted-foreground truncate">{currentTrack?.subtitle ?? ""}</p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button onclick={prevTrack} class="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"
              style="color: var(--blue);" aria-label="Précédent">
              <SkipBack size={13} fill="currentColor" />
            </button>
            <button onclick={togglePlay}
              class="w-8 h-8 flex items-center justify-center rounded-full"
              style="background: var(--blue); color: white;"
              aria-label={isPlaying ? "Pause" : "Lecture"}>
              {#if isPlaying}
                <Pause size={13} fill="currentColor" />
              {:else}
                <Play size={13} fill="currentColor" class="translate-x-0.5" />
              {/if}
            </button>
            <button onclick={nextTrack} class="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"
              style="color: var(--blue);" aria-label="Suivant">
              <SkipForward size={13} fill="currentColor" />
            </button>
          </div>
        </div>
        <!-- Mini progress -->
        <div class="h-0.5 mx-4 mb-3 rounded-full" style="background: var(--blue) / 20%;">
          <div class="h-full rounded-full" style="width: {progress}%; background: var(--blue);"></div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes spin-vinyl {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .rotating {
    animation: spin-vinyl 3s linear infinite;
  }
</style>
