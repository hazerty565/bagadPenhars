<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { ScrollTrigger } from "gsap/ScrollTrigger"
  import { Mail, Phone, MapPin, Facebook, Youtube, Instagram, Send } from "lucide-svelte"

  let sectionEl: HTMLElement
  let sending = $state(false)
  let sent = $state(false)

  let form = $state({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    sending = true
    await new Promise((r) => setTimeout(r, 1200))
    sending = false
    sent = true
    form = { name: "", email: "", subject: "", message: "" }
    setTimeout(() => { sent = false }, 4000)
  }

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(sectionEl.querySelectorAll(".animate-in"), {
      opacity: 0,
      y: 30,
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
  id="contact"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden section-gradient"
>
  <!-- Floral border divider -->
  <div class="floral-divider absolute top-0 left-0 right-0 h-3"></div>

  <!-- Footer decoration -->
  <div class="absolute bottom-0 left-0 right-0 h-px"
    style="background: linear-gradient(90deg, transparent, var(--blue) / 35%, transparent);">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Header -->
    <div class="text-center mb-20 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: var(--blue);">
        Rejoignez-nous
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style="font-family: var(--font-serif);">
        <span class="gradient-text">Contact</span>
      </h2>
      <div class="knot-divider w-24 mx-auto mb-6"></div>
      <p class="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
        Une question, un projet, une audition ? Nous sommes toujours heureux d'entendre de nouvelles voix.
      </p>
    </div>

    <div class="grid lg:grid-cols-[1fr_420px] gap-16">

      <!-- Contact form -->
      <div class="animate-in">
        <form onsubmit={handleSubmit} class="space-y-5">
          <div class="grid sm:grid-cols-2 gap-5">
            <div>
              <label for="name" class="block text-sm font-medium text-muted-foreground mb-2">
                Nom complet
              </label>
              <input
                id="name"
                type="text"
                required
                bind:value={form.name}
                placeholder="Jean Dupont"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                       placeholder:text-muted-foreground/50 text-foreground"
                style="background: oklch(0.155 0.025 265 / 80%); border: 1px solid oklch(0.74 0.155 75 / 20%);
                       focus:border-color: oklch(0.74 0.155 75 / 60%);"
                onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 60%)')}
                onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 20%)')}
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-muted-foreground mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                bind:value={form.email}
                placeholder="jean@exemple.fr"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                       placeholder:text-muted-foreground/50 text-foreground"
                style="background: oklch(0.155 0.025 265 / 80%); border: 1px solid oklch(0.74 0.155 75 / 20%);"
                onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 60%)')}
                onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 20%)')}
              />
            </div>
          </div>

          <div>
            <label for="subject" class="block text-sm font-medium text-muted-foreground mb-2">
              Sujet
            </label>
            <input
              id="subject"
              type="text"
              bind:value={form.subject}
              placeholder="Demande d'information..."
              class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                     placeholder:text-muted-foreground/50 text-foreground"
              style="background: oklch(0.155 0.025 265 / 80%); border: 1px solid oklch(0.74 0.155 75 / 20%);"
              onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 60%)')}
              onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 20%)')}
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium text-muted-foreground mb-2">
              Message
            </label>
            <textarea
              id="message"
              required
              bind:value={form.message}
              rows={5}
              placeholder="Votre message..."
              class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none
                     placeholder:text-muted-foreground/50 text-foreground"
              style="background: oklch(0.155 0.025 265 / 80%); border: 1px solid oklch(0.74 0.155 75 / 20%);"
              onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 60%)')}
              onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 20%)')}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={sending}
            class="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold
                   transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60
                   disabled:cursor-not-allowed"
            style="background: var(--blue); color: white; box-shadow: 0 0 20px var(--blue) / 40%;"
          >
            {#if sending}
              <span class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block">
              </span>
              Envoi en cours...
            {:else if sent}
              <span>✓ Message envoyé!</span>
            {:else}
              <Send size={15} />
              Envoyer le message
            {/if}
          </button>
        </form>
      </div>

      <!-- Info sidebar -->
      <div class="space-y-6 animate-in">
        <div class="glass-card rounded-2xl p-8 celtic-border space-y-6">
          <h3 class="text-lg font-semibold" style="font-family: var(--font-serif);">
            Informations
          </h3>

          <div class="space-y-4">
            {#each [
              { icon: MapPin, label: "Adresse", value: "Salle Kergariou, Penhars\n29000 Quimper, Finistère" },
              { icon: Mail, label: "Email", value: "contact@bagad-penhars.bzh" },
              { icon: Phone, label: "Téléphone", value: "+33 (0)2 98 XX XX XX" },
            ] as item}
              <div class="flex items-start gap-4">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style="background: oklch(0.74 0.155 75 / 12%);">
                  <item.icon size={16} style="color: var(--yellow-flower);" />
                </div>
                <div>
                  <div class="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                  <div class="text-sm text-foreground whitespace-pre-line">{item.value}</div>
                </div>
              </div>
            {/each}
          </div>

          <div class="pt-4 border-t" style="border-color: oklch(0.74 0.155 75 / 15%);">
            <p class="text-xs text-muted-foreground mb-4">Retrouvez-nous sur</p>
            <div class="flex gap-3">
              {#each [
                { icon: Facebook, label: "Facebook" },
                { icon: Youtube, label: "YouTube" },
                { icon: Instagram, label: "Instagram" },
              ] as social}
                <button
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                         hover:scale-110"
                  style="background: oklch(0.74 0.155 75 / 10%); border: 1px solid oklch(0.74 0.155 75 / 25%);"
                  aria-label={social.label}
                >
                  <social.icon size={16} style="color: var(--blue);" />
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Rehearsal info -->
        <div class="glass-card rounded-2xl p-6 celtic-border">
          <h4 class="text-sm font-semibold mb-3" style="color: var(--blue);">
            Répétitions
          </h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Tous les <strong class="text-foreground">mercredis soir</strong> et
            <strong class="text-foreground">samedis matin</strong>.<br />
            Auditions ouvertes sur rendez-vous pour tous les instruments bretons.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-24 pt-8 border-t text-center" style="border-color: oklch(0.74 0.155 75 / 10%);">
      <p class="text-xs text-muted-foreground">
        © 2026 Bagad Penhars · Quimper, Bretagne ·
        <span style="color: var(--blue);">Pemp Hent, Ur C'halon</span>
      </p>
    </div>
  </div>
</section>
