<script lang="ts">
	/**
	 * Rendu Markdown sûr, sans `{@html}`.
	 *
	 * Le texte est découpé en blocs et rendu avec des éléments Svelte : aucune
	 * chaîne saisie par l’utilisateur n’est interprétée comme du HTML.
	 */
	interface Block {
		kind: 'heading' | 'paragraph' | 'list' | 'quote';
		level?: number;
		text?: string;
		items?: string[];
	}

	interface Props {
		markdown: string;
	}

	let { markdown }: Props = $props();

	function cleanInline(value: string): string {
		return value
			.replace(/\*\*(.+?)\*\*/g, '$1')
			.replace(/\*(.+?)\*/g, '$1')
			.replace(/`(.+?)`/g, '$1')
			.replace(/\[(.+?)\]\((.+?)\)/g, '$1');
	}

	const blocks = $derived.by<Block[]>(() => {
		const lines = markdown.replace(/\r\n/g, '\n').split('\n');
		const result: Block[] = [];
		let paragraph: string[] = [];
		let list: string[] = [];
		let quote: string[] = [];

		const flushParagraph = () => {
			if (paragraph.length) {
				result.push({ kind: 'paragraph', text: cleanInline(paragraph.join(' ')) });
				paragraph = [];
			}
		};
		const flushList = () => {
			if (list.length) {
				result.push({ kind: 'list', items: list.map(cleanInline) });
				list = [];
			}
		};
		const flushQuote = () => {
			if (quote.length) {
				result.push({ kind: 'quote', text: cleanInline(quote.join(' ')) });
				quote = [];
			}
		};
		const flushAll = () => {
			flushParagraph();
			flushList();
			flushQuote();
		};

		for (const rawLine of lines) {
			const line = rawLine.trimEnd();
			if (!line.trim()) {
				flushAll();
				continue;
			}
			const heading = /^(#{1,3})\s+(.*)$/.exec(line);
			if (heading) {
				flushAll();
				result.push({
					kind: 'heading',
					level: heading[1].length,
					text: cleanInline(heading[2])
				});
				continue;
			}
			const listItem = /^(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
			if (listItem) {
				flushParagraph();
				flushQuote();
				list.push(listItem[1]);
				continue;
			}
			if (line.startsWith('>')) {
				flushParagraph();
				flushList();
				quote.push(line.replace(/^>\s?/, ''));
				continue;
			}
			flushList();
			flushQuote();
			paragraph.push(line.trim());
		}
		flushAll();
		return result;
	});
</script>

<div class="space-y-4 text-sm leading-relaxed text-ink">
	{#each blocks as block, index (index)}
		{#if block.kind === 'heading' && block.level === 1}
			<h2 class="font-serif text-2xl text-marine">{block.text}</h2>
		{:else if block.kind === 'heading' && block.level === 2}
			<h3 class="font-serif text-xl text-marine">{block.text}</h3>
		{:else if block.kind === 'heading'}
			<h4 class="font-serif text-lg text-marine">{block.text}</h4>
		{:else if block.kind === 'list'}
			<ul class="list-disc space-y-1 pl-5 text-ardoise">
				{#each block.items ?? [] as item, itemIndex (itemIndex)}
					<li>{item}</li>
				{/each}
			</ul>
		{:else if block.kind === 'quote'}
			<blockquote class="border-l-2 border-or bg-ivoire/60 px-4 py-2 font-serif italic text-marine">
				{block.text}
			</blockquote>
		{:else}
			<p class="text-ardoise">{block.text}</p>
		{/if}
	{/each}
</div>
