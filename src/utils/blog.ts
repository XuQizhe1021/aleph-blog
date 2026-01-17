import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export async function getPublicPosts() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getCategories(post: BlogEntry) {
	const raw = Array.isArray(post.data.categories) ? post.data.categories : [];
	const list = raw.map((c) => String(c).trim()).filter(Boolean);
	return list.length ? list : ['未分类'];
}

export function getPrimaryCategory(post: BlogEntry) {
	return getCategories(post)[0] ?? '未分类';
}

export function getAllCategories(posts: BlogEntry[]) {
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const c of getCategories(post)) {
			const category = c.trim() || '未分类';
			counts.set(category, (counts.get(category) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'zh'));
}

