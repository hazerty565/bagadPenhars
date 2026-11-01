<script lang="ts">
  import NavBar from "./components/NavBar.svelte"
  import HeroSection from "./components/HeroSection.svelte"
  import AboutSection from "./components/AboutSection.svelte"
  import MusicSection from "./components/MusicSection.svelte"
  import PrestationsSection from "./components/PrestationsSection.svelte"
  import FormationSection from "./components/FormationSection.svelte"
  import EventsSection from "./components/EventsSection.svelte"
  import GallerySection from "./components/GallerySection.svelte"
  import ContactSection from "./components/ContactSection.svelte"
  import FloatingPlayer from "./components/FloatingPlayer.svelte"
  import { tracks } from "./lib/tracks.js"

  let playerOpen = $state(true)
  let currentTrackIndex = $state(0)
  let isPlaying = $state(false)

  function playTrack(index: number) {
    currentTrackIndex = index
    isPlaying = true
    playerOpen = true
  }
</script>

<div class="min-h-screen bg-background text-foreground relative overflow-x-hidden">
  <!-- Atmospheric background pattern — subtle blue dots on white -->
  <div class="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
    <div class="absolute inset-0 opacity-[0.025]"
      style="background-image: radial-gradient(circle at 1px 1px, oklch(0.40 0.22 240) 1px, transparent 0); background-size: 36px 36px;">
    </div>
  </div>

  <NavBar {playerOpen} onOpenPlayer={() => { playerOpen = true }} />

  <main class="relative z-10">
    <HeroSection onPlay={() => { isPlaying = true; playerOpen = true }} />
    <AboutSection />
    <PrestationsSection />
    <MusicSection {currentTrackIndex} {isPlaying} onPlayTrack={playTrack} />
    <FormationSection />
    <EventsSection />
    <GallerySection />
    <ContactSection />
  </main>

  <FloatingPlayer
    bind:open={playerOpen}
    bind:currentTrackIndex
    bind:isPlaying
    {tracks}
  />
</div>
