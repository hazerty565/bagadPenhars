<script lang="ts">
  import { Music, Menu, X, ChevronDown } from "lucide-svelte"

  interface Props {
    playerOpen: boolean
    onOpenPlayer: () => void
  }
  let { playerOpen, onOpenPlayer }: Props = $props()

  let scrollY = $state(0)
  let mobileOpen = $state(false)
  let scrolled = $derived(scrollY > 60)

  const navLinks = [
    { href: "#bagad", label: "Notre Bagad" },
    { href: "#musique", label: "Musique" },
    { href: "#agenda", label: "Agenda" },
    { href: "#galerie", label: "Galerie" },
    { href: "#contact", label: "Contact" },
  ]

  function handleNavClick(href: string) {
    mobileOpen = false
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }
</script>

<svelte:window bind:scrollY />

<header
  class="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
  class:scrolled
>
  <div
    class="transition-all duration-500"
    class:bg-transparent={!scrolled && !mobileOpen}
    style={scrolled || mobileOpen
      ? "background: oklch(0.08 0.01 265 / 95%); backdrop-filter: blur(16px); border-bottom: 2px solid var(--blue) / 25%;"
      : ""}
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 lg:h-20">

        <!-- Logo -->
        <a
          href="/"
          onclick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}
          class="flex items-center gap-3 group"
        >
          <!-- Celtic knot SVG logo -->
          <div class="w-9 h-9 relative flex items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" class="w-full h-full" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="var(--blue)" stroke-width="1.5" opacity="0.6"/>
              <path
                d="M20 6 C26 10 34 14 34 20 C34 26 26 30 20 34 C14 30 6 26 6 20 C6 14 14 10 20 6Z"
                stroke="var(--blue)" stroke-width="1.5" fill="none"
              />
              <circle cx="20" cy="20" r="4" fill="var(--yellow-flower)" opacity="0.9"/>
              <circle cx="20" cy="20" r="2" fill="oklch(0.08 0.01 265)"/>
            </svg>
          </div>
          <div class="hidden sm:block">
            <div class="text-sm font-semibold tracking-widest text-primary uppercase leading-none"
              style="font-family: var(--font-serif);">
              Bagad
            </div>
            <div class="text-base font-bold tracking-wide leading-none mt-0.5"
              style="font-family: var(--font-serif); color: oklch(0.93 0.018 78);">
              Penhars
            </div>
          </div>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-1">
          {#each navLinks as link}
            <button
              onclick={() => handleNavClick(link.href)}
              class="px-4 py-2 text-sm font-medium tracking-wide rounded-md transition-all duration-200
                     text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              {link.label}
            </button>
          {/each}
        </nav>

        <!-- Right actions -->
        <div class="flex items-center gap-3">
          <button
            onclick={onOpenPlayer}
            class="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                   transition-all duration-300 border"
            style="background: var(--blue) / 15%; border-color: var(--blue) / 45%;
                   color: var(--blue);"
            class:pulse-gold={!playerOpen}
          >
            <Music size={15} />
            <span class="hidden md:inline">Écouter</span>
          </button>

          <!-- Mobile menu button -->
          <button
            class="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            onclick={() => { mobileOpen = !mobileOpen }}
            aria-label="Menu"
          >
            {#if mobileOpen}
              <X size={22} />
            {:else}
              <Menu size={22} />
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    {#if mobileOpen}
      <div class="lg:hidden border-t" style="border-color: var(--blue) / 25%;">
        <div class="px-4 py-4 space-y-1">
          {#each navLinks as link}
            <button
              onclick={() => handleNavClick(link.href)}
              class="w-full text-left px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground
                     hover:bg-white/5 transition-colors text-sm font-medium tracking-wide"
            >
              {link.label}
            </button>
          {/each}
          <button
            onclick={() => { onOpenPlayer(); mobileOpen = false }}
            class="w-full flex items-center gap-2 mt-2 px-4 py-3 rounded-lg text-sm font-medium
                   transition-all duration-200"
            style="background: var(--blue) / 15%; color: var(--blue);"
          >
            <Music size={16} />
            Ouvrir le lecteur
          </button>
        </div>
      </div>
    {/if}
  </div>
</header>

<style>
  .scrolled {
    /* already handled via inline style binding above */
  }
  .pulse-gold {
    animation: pulse-gold 2s ease-in-out infinite;
  }
  @keyframes pulse-gold {
    0%, 100% { box-shadow: 0 0 10px oklch(0.74 0.155 75 / 30%); }
    50% { box-shadow: 0 0 20px oklch(0.74 0.155 75 / 60%), 0 0 40px oklch(0.74 0.155 75 / 20%); }
  }
</style>
