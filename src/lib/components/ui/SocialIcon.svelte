<script lang="ts">
	/**
	 * Icônes de réseaux sociaux fournies par l'association
	 * (`static/Facebook_icon.svg`, `static/instagram_icon.svg`).
	 *
	 * Ce sont des marques en couleur : elles ne prennent donc pas la couleur du
	 * texte environnant. L'image est décorative (`alt=""`) car le lien qui la
	 * contient porte déjà son nom accessible.
	 */
	type SocialName = 'facebook' | 'instagram';

	const ICONS: Record<SocialName, { src: string; size: number }> = {
		facebook: { src: '/Facebook_icon.svg', size: 667 },
		instagram: { src: '/instagram_icon.svg', size: 800 }
	};

	let { name, className = 'h-5 w-5' }: { name: SocialName; className?: string } = $props();

	const icon = $derived(ICONS[name]);
</script>

<img
	src={icon.src}
	alt=""
	width={icon.size}
	height={icon.size}
	fetchpriority="high"
	decoding="async"
	class={className}
/>
