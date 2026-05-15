import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export async function getPublicPosts() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

// 统一使用“更新优先、发布时间兜底”的时间语义，避免各页面各算各的。
export function getPostActivityDate(post: BlogEntry) {
	return post.data.updatedDate ?? post.data.pubDate;
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

export function getCategorySummaries(posts: BlogEntry[]) {
	const summaries = new Map<string, { category: string; count: number; latestDate: Date }>();
	for (const post of posts) {
		const latestDate = getPostActivityDate(post);
		for (const c of getCategories(post)) {
			const category = c.trim() || '未分类';
			const current = summaries.get(category);
			if (!current) {
				summaries.set(category, { category, count: 1, latestDate });
				continue;
			}
			current.count += 1;
			if (latestDate.getTime() > current.latestDate.getTime()) {
				current.latestDate = latestDate;
			}
		}
	}
	return [...summaries.values()].sort(
		(a, b) =>
			b.count - a.count ||
			b.latestDate.getTime() - a.latestDate.getTime() ||
			a.category.localeCompare(b.category, 'zh')
	);
}

