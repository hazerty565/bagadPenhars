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

<!-- Gold decorative band like the Breton poster -->
<div class="breton-band w-full"></div>

<section
  id="contact"
  bind:this={sectionEl}
  class="relative py-28 lg:py-40 overflow-hidden"
  style="background: oklch(0.40 0.22 240);"
>
  <!-- Subtle dot pattern on blue -->
  <div class="absolute inset-0 pointer-events-none opacity-[0.04]"
    style="background-image: radial-gradient(circle at 1px 1px, oklch(1 0 0) 1px, transparent 0); background-size: 32px 32px;">
  </div>

  <!-- Gold decorative radial glow -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.06] blur-3xl pointer-events-none"
    style="background: oklch(0.74 0.155 75);">
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div class="text-center mb-20 animate-in">
      <p class="text-xs font-semibold tracking-widest uppercase mb-3" style="color: oklch(0.74 0.155 75);">
        Rejoignez-nous
      </p>
      <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
        style="font-family: var(--font-serif); color: oklch(0.98 0.005 235);">
        <span class="gradient-text">Contact</span>
      </h2>
      <div class="knot-divider-white w-24 mx-auto mb-6"></div>
      <p class="max-w-lg mx-auto text-lg leading-relaxed" style="color: oklch(0.82 0.04 235);">
        Une question, un projet, une audition ? Nous sommes toujours heureux d'entendre de nouvelles voix.
      </p>
    </div>

    <div class="grid lg:grid-cols-[1fr_420px] gap-16">

      <!-- Contact form -->
      <div class="animate-in">
        <form onsubmit={handleSubmit} class="space-y-5">
          <div class="grid sm:grid-cols-2 gap-5">
            <div>
              <label for="name" class="block text-sm font-medium mb-2" style="color: oklch(0.85 0.04 235);">
                Nom complet
              </label>
              <input
                id="name"
                type="text"
                required
                bind:value={form.name}
                placeholder="Jean Dupont"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style="background: oklch(1 0 0 / 12%); border: 1px solid oklch(1 0 0 / 25%);
                       color: oklch(0.98 0.005 235); placeholder:color: oklch(0.70 0.04 235);"
                onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 70%)')}
                onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(1 0 0 / 25%)')}
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium mb-2" style="color: oklch(0.85 0.04 235);">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                bind:value={form.email}
                placeholder="jean@exemple.fr"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style="background: oklch(1 0 0 / 12%); border: 1px solid oklch(1 0 0 / 25%);
                       color: oklch(0.98 0.005 235);"
                onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 70%)')}
                onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(1 0 0 / 25%)')}
              />
            </div>
          </div>

          <div>
            <label for="subject" class="block text-sm font-medium mb-2" style="color: oklch(0.85 0.04 235);">
              Sujet
            </label>
            <input
              id="subject"
              type="text"
              bind:value={form.subject}
              placeholder="Demande d'information..."
              class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
              style="background: oklch(1 0 0 / 12%); border: 1px solid oklch(1 0 0 / 25%);
                     color: oklch(0.98 0.005 235);"
              onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 70%)')}
              onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(1 0 0 / 25%)')}
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium mb-2" style="color: oklch(0.85 0.04 235);">
              Message
            </label>
            <textarea
              id="message"
              required
              bind:value={form.message}
              rows={5}
              placeholder="Votre message..."
              class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
              style="background: oklch(1 0 0 / 12%); border: 1px solid oklch(1 0 0 / 25%);
                     color: oklch(0.98 0.005 235);"
              onfocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.74 0.155 75 / 70%)')}
              onblur={(e) => (e.currentTarget.style.borderColor = 'oklch(1 0 0 / 25%)')}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={sending}
            class="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold
                   transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60
                   disabled:cursor-not-allowed"
            style="background: oklch(0.74 0.155 75); color: oklch(0.13 0.045 240); box-shadow: 0 0 20px oklch(0.74 0.155 75 / 40%);"
          >
            {#if sending}
              <span class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block"></span>
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
        <div class="rounded-2xl p-8 space-y-6"
          style="background: oklch(1 0 0 / 10%); border: 1px solid oklch(1 0 0 / 20%);">
          <h3 class="text-lg font-semibold" style="font-family: var(--font-serif); color: oklch(0.98 0.005 235);">
            Informations
          </h3>

          <div class="space-y-4">
            {#each [
              { icon: MapPin, label: "Adresse", value: "Salle Kergariou, Penhars\n29000 Quimper, Finistère" },
              { icon: Mail, label: "Email", value: "bagadpenhars@gmail.com" },
              { icon: Phone, label: "Téléphone", value: "+33 (0)2 98 XX XX XX" },
            ] as item}
              <div class="flex items-start gap-4">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style="background: oklch(0.74 0.155 75 / 20%);">
                  <item.icon size={16} style="color: oklch(0.74 0.155 75);" />
                </div>
                <div>
                  <div class="text-xs mb-0.5" style="color: oklch(0.72 0.04 235);">{item.label}</div>
                  <div class="text-sm whitespace-pre-line" style="color: oklch(0.95 0.005 235);">{item.value}</div>
                </div>
              </div>
            {/each}
          </div>

          <div class="pt-4 border-t" style="border-color: oklch(1 0 0 / 15%);">
            <p class="text-xs mb-4" style="color: oklch(0.72 0.04 235);">Retrouvez-nous sur</p>
            <div class="flex gap-3">
              {#each [
                { icon: Facebook, label: "Facebook" },
                { icon: Youtube, label: "YouTube" },
                { icon: Instagram, label: "Instagram" },
              ] as social}
                <button
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                         hover:scale-110"
                  style="background: oklch(1 0 0 / 12%); border: 1px solid oklch(1 0 0 / 20%);"
                  aria-label={social.label}
                >
                  <social.icon size={16} style="color: oklch(0.74 0.155 75);" />
                </button>
              {/each}
            </div>
          </div>
        </div>

        <div class="rounded-2xl p-6"
          style="background: oklch(1 0 0 / 10%); border: 1px solid oklch(1 0 0 / 20%);">
          <h4 class="text-sm font-semibold mb-3" style="color: oklch(0.74 0.155 75);">
            Répétitions
          </h4>
          <p class="text-sm leading-relaxed" style="color: oklch(0.85 0.03 235);">
            Cours le <strong style="color: oklch(0.98 0.005 235);">mardi à partir de 18h</strong>.<br />
            Répétitions Bagad le <strong style="color: oklch(0.98 0.005 235);">vendredi soir de 20h à 22h</strong>
            et le <strong style="color: oklch(0.98 0.005 235);">samedi de 16h à 18h</strong>.<br />
            Inscriptions dès 7 ans.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-24 pt-8 border-t text-center" style="border-color: oklch(1 0 0 / 12%);">
      <p class="text-xs" style="color: oklch(0.72 0.04 235);">
        © 2026 Bagad Penhars · 6 Av. des Oiseaux, 29000 Quimper ·
        <span style="color: oklch(0.74 0.155 75);">Pemp Hent, Ur C'halon</span>
      </p>
    </div>
  </div>
</section>
