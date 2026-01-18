// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// https://astro.build/config
const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const isUserPagesRepo = Boolean(repoName && /\.github\.io$/i.test(repoName));
const base =
	process.env.ASTRO_BASE ??
	(process.env.NODE_ENV === 'production' && repoName && !isUserPagesRepo ? `/${repoName}` : '');
const site =
	process.env.SITE_URL ??
	(process.env.NODE_ENV === 'production' && repoOwner ? `https://${repoOwner}.github.io` : 'http://localhost:4321');

export default defineConfig({
	site,
	base,
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			rehypeSlug,
			[
				rehypeAutolinkHeadings,
				{
					behavior: 'append',
					properties: { className: ['heading-anchor'] },
				},
			],
			rehypeKatex,
		],
	},
});
