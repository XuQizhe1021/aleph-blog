import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export async function getPublicPosts() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getCategory(post: BlogEntry) {
	return post.data.category?.trim() || '未分类';
}

export function getAllCategories(posts: BlogEntry[]) {
	const counts = new Map<string, number>();
	for (const post of posts) {
		const category = getCategory(post);
		counts.set(category, (counts.get(category) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'zh'));
}

export function getAllTags(posts: BlogEntry[]) {
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags ?? []) {
			const t = tag.trim();
			if (!t) continue;
			counts.set(t, (counts.get(t) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh'));
}

