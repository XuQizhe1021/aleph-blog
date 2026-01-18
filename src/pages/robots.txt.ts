export async function GET({ site }: { site: URL }) {
	const base = site ?? new URL('http://localhost:4321');
	const sitemap = new URL('/sitemap.xml', base).toString();
	const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
		},
	});
}

