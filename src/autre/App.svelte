<script lang="ts">
  import NavBar from "./components/NavBar.svelte"
  import HeroSection from "./components/HeroSection.svelte"
  import AboutSection from "./components/AboutSection.svelte"
  import MusicSection from "./components/MusicSection.svelte"
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
  <!-- Atmospheric background pattern -->
  <div class="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
    <div class="absolute inset-0 opacity-[0.03]"
      style="background-image: radial-gradient(circle at 1px 1px, var(--blue) 1px, transparent 0); background-size: 40px 40px;">
    </div>
  </div>

  <NavBar {playerOpen} onOpenPlayer={() => { playerOpen = true }} />

  <main class="relative z-10">
    <HeroSection onPlay={() => { isPlaying = true; playerOpen = true }} />
    
    <!-- Liséré breton ornamental pattern -->
    <div class="w-full bg-background">
      <img 
        src="/image2.png" 
        alt="Liséré floral breton" 
        class="w-full h-auto object-cover"
        loading="eager"
      />
    </div>
    
    <AboutSection />
    <MusicSection {currentTrackIndex} {isPlaying} onPlayTrack={playTrack} />
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
