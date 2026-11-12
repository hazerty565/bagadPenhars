<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	/**
	 * Carte OpenStreetMap.
	 *
	 * Leaflet est chargé à la demande dans `onMount` : il n'entre jamais dans le
	 * rendu serveur (il repose sur `window`) et n'alourdit pas les pages qui ne
	 * l'affichent pas. Les tuiles proviennent du service public OpenStreetMap ;
	 * l'attribution est obligatoire et un lien de repli reste disponible si la
	 * carte ne peut pas s'afficher.
	 */
	interface Props {
		lat: number;
		lon: number;
		zoom?: number;
		/** Nom accessible du marqueur. */
		markerLabel: string;
		/** Nom accessible de la zone cartographique. */
		ariaLabel: string;
		loadingLabel: string;
		errorLabel: string;
		openLabel: string;
		/** Libellé du lien vers Google Maps. */
		openGoogleLabel: string;
		/** Libellé du lien vers Apple Maps. */
		openAppleLabel: string;
	}

	let {
		lat,
		lon,
		zoom = 16,
		markerLabel,
		ariaLabel,
		loadingLabel,
		errorLabel,
		openLabel,
		openGoogleLabel,
		openAppleLabel
	}: Props = $props();

	let container: HTMLDivElement;
	let status = $state<'loading' | 'ready' | 'error'>('loading');

	const osmUrl = $derived(
		`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`
	);

	/** Lien universel Google Maps (fonctionne sur mobile et sur le web). */
	const googleUrl = $derived(`https://www.google.com/maps/search/?api=1&query=${lat}%2C${lon}`);

	/** Lien Apple Maps : utilisé par iOS et macOS, ignoré ailleurs. */
	const appleUrl = $derived(
		`https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(markerLabel)}&z=${zoom}`
	);

	onMount(() => {
		let cancelled = false;
		let map: import('leaflet').Map | undefined;

		(async () => {
			try {
				// Selon la façon dont Vite pré-bundle Leaflet (UMD ou ESM), le
				// namespace importé expose soit les fonctions nommées, soit
				// uniquement l'objet `L` en export par défaut.
				const leaflet = await import('leaflet');
				const L: typeof import('leaflet') =
					(leaflet as unknown as { default?: typeof import('leaflet') }).default ?? leaflet;

				if (cancelled || !container) return;

				const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

				map = L.map(container, {
					scrollWheelZoom: false,
					zoomAnimation: !reduceMotion,
					fadeAnimation: !reduceMotion,
					markerZoomAnimation: !reduceMotion
				}).setView([lat, lon], zoom);

				L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				}).addTo(map);

				L.marker([lat, lon], {
					title: markerLabel,
					alt: markerLabel,
					icon: L.divIcon({
						className: 'bagad-marker',
						html: '<span></span>',
						iconSize: [26, 26],
						iconAnchor: [13, 13]
					})
				}).addTo(map);

				status = 'ready';
			} catch (error) {
				console.error('[carte] chargement impossible :', error);
				status = 'error';
			}
		})();

		return () => {
			cancelled = true;
			map?.remove();
		};
	});
</script>

<div class="relative">
	<div
		bind:this={container}
		role="region"
		aria-label={ariaLabel}
		class="z-0 h-[320px] w-full bg-sable sm:h-[420px] lg:h-[480px]"
	></div>

	{#if status !== 'ready'}
		<div
			class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-sable/90 px-6 text-center text-sm text-ink/70"
		>
			{status === 'loading' ? loadingLabel : errorLabel}
		</div>
	{/if}
</div>

<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
	<p class="text-xs text-ink/50">
		&copy; <a
			href="https://www.openstreetmap.org/copyright"
			target="_blank"
			rel="noopener noreferrer external"
			class="underline decoration-ink/25 underline-offset-2 hover:text-marine">OpenStreetMap</a
		>
	</p>
	<div class="flex flex-wrap items-center gap-x-5 gap-y-2">
		<a
			href={osmUrl}
			target="_blank"
			rel="noopener noreferrer external"
			class="text-xs font-semibold text-marine underline decoration-or decoration-2 underline-offset-4 hover:text-marine-700"
		>
			{openLabel}
		</a>
		<a
			href={googleUrl}
			target="_blank"
			rel="noopener noreferrer external"
			class="text-xs font-semibold text-marine underline decoration-or decoration-2 underline-offset-4 hover:text-marine-700"
		>
			{openGoogleLabel}
		</a>
		<a
			href={appleUrl}
			target="_blank"
			rel="noopener noreferrer external"
			class="text-xs font-semibold text-marine underline decoration-or decoration-2 underline-offset-4 hover:text-marine-700"
		>
			{openAppleLabel}
		</a>
	</div>
</div>

<style>
	/* Le contenu d'un `divIcon` est injecté par Leaflet, hors du champ de
	   compilation des styles scopés de Svelte : le sélecteur doit être global. */
	:global(.bagad-marker) {
		display: grid;
		place-items: center;
	}

	:global(.bagad-marker span) {
		display: block;
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: var(--penhars-marine);
		border: 3px solid #fff;
		box-shadow:
			0 0 0 2px var(--penhars-or),
			0 1px 6px rgb(0 0 0 / 0.3);
	}
</style>
