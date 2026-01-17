import { getCollection } from 'astro:content';

function stripMarkdown(md: string) {
	return md
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*?\]\([^)]+\)/g, ' ')
		.replace(/\[[^\]]*?\]\([^)]+\)/g, ' ')
		.replace(/#+\s+/g, ' ')
		.replace(/>\s+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export async function GET() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const items = posts
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
		.map((p) => {
			const text = stripMarkdown(p.body ?? '');
			return {
				slug: p.slug,
				title: p.data.title,
				description: p.data.description ?? '',
				category: p.data.category ?? '',
				tags: p.data.tags ?? [],
				pubDate: p.data.pubDate.toISOString(),
				text: text.slice(0, 6000),
			};
		});

	return new Response(JSON.stringify({ items }), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, max-age=0, must-revalidate',
		},
	});
}

