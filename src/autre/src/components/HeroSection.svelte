<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ChevronDown, Play } from "lucide-svelte"

  interface Props {
    onPlay: () => void
  }
  let { onPlay }: Props = $props()

  let heroEl: HTMLElement
  let titleEl: HTMLElement
  let subtitleEl: HTMLElement
  let ctaEl: HTMLElement
  let scrollIndicatorEl: HTMLElement
  let canvasEl: HTMLCanvasElement
  let animFrame = 0

  onMount(() => {
    const tl = gsap.timeline({ delay: 0.3 })

    tl.from(titleEl, {
      opacity: 0,
      y: 60,
      duration: 1.2,
      ease: "power3.out",
    })
    .from(subtitleEl, {
      opacity: 0,
      y: 30,
      duration: 0.9,
      ease: "power2.out",
    }, "-=0.6")
    .from(ctaEl, {
      opacity: 0,
      y: 20,
      scale: 0.95,
      duration: 0.7,
      ease: "back.out(1.4)",
    }, "-=0.4")
    .from(scrollIndicatorEl, {
      opacity: 0,
      y: -10,
      duration: 0.6,
      ease: "power2.out",
    }, "-=0.2")

    const ctx = canvasEl.getContext("2d")!
    const particles: ParticleObj[] = []

    function createParticle(): ParticleObj {
      const isGold = Math.random() > 0.4
      return {
        x: Math.random() * canvasEl.width,
        y: Math.random() * canvasEl.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.8 - 0.2,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        life: 0,
        maxLife: Math.random() * 300 + 100,
        color: isGold ? "#c9a43a" : "#7eb8f7",
      }
    }

    function updateParticle(p: ParticleObj) {
      p.x += p.vx
      p.y += p.vy
      p.life++
      const ratio = p.life / p.maxLife
      p.opacity = ratio < 0.1 ? ratio * 6 : ratio > 0.8 ? (1 - ratio) * 5 : 0.5
    }

    function drawParticle(p: ParticleObj, c: CanvasRenderingContext2D) {
      c.save()
      c.globalAlpha = p.opacity
      c.fillStyle = p.color
      c.beginPath()
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }

    function resizeCanvas() {
      canvasEl.width = canvasEl.offsetWidth
      canvasEl.height = canvasEl.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    for (let i = 0; i < 70; i++) {
      particles.push(createParticle())
    }

    function animate() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)

      const t = Date.now() * 0.0005
      for (let i = 0; i < 3; i++) {
        ctx.save()
        ctx.globalAlpha = 0.03 + i * 0.015
        ctx.strokeStyle = i % 2 === 0 ? "#c9a43a" : "#5b9bd5"
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let x = 0; x <= canvasEl.width; x += 4) {
          const y = canvasEl.height / 2
            + Math.sin(x * 0.008 + t + i * 2.1) * 80
            + Math.sin(x * 0.015 + t * 1.3 + i) * 40
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        updateParticle(particles[i])
        drawParticle(particles[i], ctx)
        if (particles[i].life >= particles[i].maxLife) {
          particles[i] = createParticle()
        }
      }

      animFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener("resize", resizeCanvas)
    }
  })
</script>

<script module lang="ts">
  interface ParticleObj {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    life: number
    maxLife: number
    color: string
  }
</script>

<section
  bind:this={heroEl}
  class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
>
  <!-- Background image with deep blue overlay -->
  <div
    class="absolute inset-0 z-0"
    style="background-image: url('/hero-bg.webp'); background-size: cover; background-position: center; background-attachment: fixed;"
  >
    <!-- Deep blue + gold gradient overlay -->
    <div class="absolute inset-0 hero-gradient"></div>
    <!-- Blue vignette -->
    <div class="absolute inset-0"
      style="background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, oklch(0.12 0.07 240 / 65%) 100%);">
    </div>
    <!-- Bottom fade to white for page transition -->
    <div class="absolute bottom-0 left-0 right-0 h-40"
      style="background: linear-gradient(to bottom, transparent, oklch(0.97 0.008 235));">
    </div>
  </div>

  <!-- Particle canvas -->
  <canvas
    bind:this={canvasEl}
    class="absolute inset-0 w-full h-full z-[1] pointer-events-none"
    aria-hidden="true"
  ></canvas>

  <!-- Celtic decorative rings -->
  <div class="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none" aria-hidden="true">
    <div class="w-[600px] h-[600px] rounded-full border opacity-[0.07]"
      style="border-color: oklch(0.74 0.155 75); animation: spin-slow 30s linear infinite;">
    </div>
    <div class="absolute w-[450px] h-[450px] rounded-full border opacity-[0.10]"
      style="border-color: oklch(0.60 0.20 240); animation: spin-slow 20s linear infinite reverse;">
    </div>
  </div>

  <!-- Content -->
  <div class="relative z-10 text-center px-4 max-w-5xl mx-auto">
    <!-- Tagline badge -->
    <div
      class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-widest uppercase mb-8 border"
      style="background: oklch(0.74 0.155 75 / 10%); border-color: oklch(0.74 0.155 75 / 40%); color: oklch(0.74 0.155 75);"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse"></span>
      Musique Traditionnelle Bretonne
    </div>

    <!-- Main title -->
    <div bind:this={titleEl}>
      <h1
        class="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none tracking-tight mb-4"
        style="font-family: var(--font-serif);"
      >
        <span class="gradient-text">Bagad</span>
        <br />
        <span style="color: oklch(0.97 0.008 235);">Penhars</span>
      </h1>
    </div>

    <!-- Subtitle -->
    <div bind:this={subtitleEl}>
      <div class="knot-divider w-32 mx-auto my-6"></div>
      <p class="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed"
        style="color: oklch(0.82 0.04 235);">
        L'âme de la Cornouaille résonne dans chaque note.
        Binioù, bombarde et tambour — la musique qui fait battre le cœur de la Bretagne.
      </p>
    </div>

    <!-- CTA buttons -->
    <div bind:this={ctaEl} class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
      <button
        onclick={onPlay}
        class="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
               transition-all duration-300 hover:scale-105 active:scale-95"
        style="background: oklch(0.74 0.155 75); color: oklch(0.13 0.045 240); box-shadow: 0 0 30px oklch(0.74 0.155 75 / 45%);"
      >
        <Play size={18} fill="currentColor" />
        Écouter notre musique
      </button>
      <button
        onclick={() => document.querySelector('#bagad')?.scrollIntoView({ behavior: 'smooth' })}
        class="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-medium
               transition-all duration-300 border"
        style="border-color: oklch(1 0 0 / 25%); color: oklch(0.97 0.008 235); background: oklch(1 0 0 / 5%);"
        onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(1 0 0 / 12%)' }}
        onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(1 0 0 / 5%)' }}
      >
        Découvrir le Bagad
      </button>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div
    bind:this={scrollIndicatorEl}
    class="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
    style="color: oklch(0.74 0.155 75 / 70%);"
  >
    <span class="text-xs tracking-widest uppercase">Défiler</span>
    <ChevronDown size={20} class="animate-bounce" />
  </div>
</section>

<style>
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
