export type RandomPostItem = {
	slug: string;
	title: string;
};

export function pickRandomPost(
	posts: RandomPostItem[],
	rng: () => number = Math.random
) {
	if (!posts.length) return null;
	const index = Math.floor(rng() * posts.length);
	const safeIndex = Math.max(0, Math.min(posts.length - 1, index));
	return posts[safeIndex] ?? null;
}

