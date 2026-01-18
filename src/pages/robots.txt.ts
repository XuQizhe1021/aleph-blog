export async function GET({ site }: { site: URL }) {
	const origin = site ?? new URL('http://localhost:4321');
	let basePath = import.meta.env.BASE_URL ?? '/';
	if (process.env.SITE_URL) {
		try {
			basePath = new URL(process.env.SITE_URL).pathname || basePath;
		} catch {}
	}
	if (!basePath.endsWith('/')) basePath += '/';
	const base = new URL(basePath, origin);
	const sitemap = new URL('sitemap.xml', base).toString();
	const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
		},
	});
}
