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
	(repoName && !isUserPagesRepo ? `/${repoName}` : '');

let site = 'http://localhost:4321';
if (process.env.SITE_URL) {
	try {
		site = new URL(process.env.SITE_URL).origin;
	} catch {}
} else if (repoOwner) {
	site = `https://${repoOwner}.github.io`;
}

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
