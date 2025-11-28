<script lang="ts">
	import { page } from '$app/stores'; // eslint-disable-line @typescript-eslint/no-unused-vars
	import { title as siteTitle, description as siteDescription, url as siteUrl } from '$lib/config';

	// Props für spezifische Seiten (z.B. ein Blog-Post)
	export let title: string | undefined = undefined;
	export let description: string | undefined = undefined;
	export let image: string | undefined = undefined; // z.B. '/blog-images/mein-post.png'
	export let type: 'website' | 'article' = 'website';

	// Bestimmt die finalen Werte für die Meta-Tags
	const finalTitle = title ? `${title} | ${siteTitle}` : siteTitle;
	const finalDescription = description ?? siteDescription;
	const finalUrl = `${siteUrl}${$page.url.pathname}`;
	// Ein Standard-OG-Bild ist eine gute Praxis. Wir nehmen an, es existiert unter /og-image.png im static-Ordner.
	const finalImage = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`;
</script>

<svelte:head>
	<title>{finalTitle}</title>
	<meta name="description" content={finalDescription} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:url" content={finalUrl} />
	<meta property="og:title" content={finalTitle} />
	<meta property="og:description" content={finalDescription} />
	<meta property="og:image" content={finalImage} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={finalUrl} />
	<meta name="twitter:title" content={finalTitle} />
	<meta name="twitter:description" content={finalDescription} />
	<meta name="twitter:image" content={finalImage} />
</svelte:head>
