import { getCollection } from 'astro:content';

export async function GET({ site }: { site: URL }) {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const origin = site ?? new URL('http://localhost:4321');
	const base = new URL(import.meta.env.BASE_URL ?? '/', origin);
	const items = posts
		.slice()
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
		.map((p) => {
			const lastmod = (p.data.updatedDate ?? p.data.pubDate).toISOString();
			return { loc: new URL(`posts/${p.slug}/`, base).toString(), lastmod };
		});

	const staticPaths = ['/', 'posts/', 'categories/', 'search/', 'about/'];
	const staticItems = staticPaths.map((p) => ({
		loc: new URL(p, base).toString(),
		lastmod: new Date().toISOString(),
	}));

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		[...staticItems, ...items]
			.map(
				(u) =>
					`  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
		},
	});
}
