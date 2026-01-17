import rss from '@astrojs/rss';
import { siteConfig } from '../site.config';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL }) {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		items: posts
			.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
			.map((post) => ({
				title: post.data.title,
				description: post.data.description ?? '',
				pubDate: post.data.pubDate,
				link: `/posts/${post.slug}`,
			})),
	});
}

