<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta
		name="description"
		content="Bagad Penhars — Espace adhérents : agenda, membres, documents, notifications et administration du bagad de Penhars."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="preload"
		as="style"
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap"
	/>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap"
		media="print"
		on:load={() => { const link = document.querySelector('link[href*="fonts.googleapis.com"][rel="stylesheet"]'); if (link instanceof HTMLLinkElement) link.media = 'all'; }}
	/>
	<noscript>
		<link
			rel="stylesheet"
			href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap"
		/>
	</noscript>

	<style>
		:root {
			--penhars-marine: #173b63;
			--penhars-or: #c6a45b;
			--penhars-ivoire: #f5f1e8;
			--penhars-ink: #25282b;
		}
		html {
			scroll-behavior: smooth;
			-webkit-text-size-adjust: 100%;
		}
		body {
			font-family: Inter, system-ui, sans-serif;
			background: #fff;
			color: #25282b;
			-webkit-font-smoothing: antialiased;
		}
		::selection {
			background: rgba(198, 164, 91, 0.35);
			color: #25282b;
		}
		:focus-visible {
			outline: 2px solid #173b63;
			outline-offset: 3px;
		}
		.container-page {
			margin: 0 auto;
			width: 100%;
			max-width: 80rem;
			padding: 0 1.25rem;
		}
		@media (min-width: 640px) {
			.container-page {
				padding: 0 2rem;
			}
		}
		@media (min-width: 1024px) {
			.container-page {
				padding: 0 3rem;
			}
		}
		.eyebrow {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			font-size: 0.68rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.22em;
			color: rgba(23, 59, 99, 0.7);
		}
		.btn-primary {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			background: #173b63;
			padding: 0.75rem 1.25rem;
			font-size: 0.875rem;
			font-weight: 600;
			color: #fff;
			transition: background-color;
		}
		.btn-primary:hover {
			background: #0f2a4a;
		}
		.btn-ghost {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			border: 1px solid rgba(23, 59, 99, 0.25);
			padding: 0.75rem 1.25rem;
			font-size: 0.875rem;
			font-weight: 600;
			color: #173b63;
			transition: border-color, background-color;
		}
		.btn-ghost:hover {
			border-color: #173b63;
			background: rgba(23, 59, 99, 0.05);
		}
		.btn-gold {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			background: #c6a45b;
			padding: 0.75rem 1.25rem;
			font-size: 0.875rem;
			font-weight: 600;
			color: #25282b;
			transition: background-color;
		}
		.btn-gold:hover {
			background: #d4b87a;
		}
		.btn-light {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			border: 1px solid rgba(245, 241, 232, 0.4);
			padding: 0.75rem 1.25rem;
			font-size: 0.875rem;
			font-weight: 600;
			color: #f5f1e8;
			transition: background-color;
		}
		.btn-light:hover {
			background: rgba(245, 241, 232, 0.1);
		}
		.skip-link {
			position: absolute;
			left: -9999px;
			top: auto;
			width: 1px;
			height: 1px;
			overflow: hidden;
		}
		.skip-link:focus {
			position: fixed;
			left: 1rem;
			top: 1rem;
			z-index: 100;
			background: #173b63;
			padding: 0.5rem 1rem;
			font-size: 0.875rem;
			font-weight: 600;
			color: #fff;
		}
		@media (prefers-reduced-motion: reduce) {
			html {
				scroll-behavior: auto;
			}
			*,
			::before,
			::after {
				animation-duration: 0.01ms !important;
				animation-iteration-count: 1 !important;
				transition-duration: 0.01ms !important;
				scroll-behavior: auto !important;
			}
		}
	</style>
</svelte:head>

{@render children()}
