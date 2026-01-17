import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z
		.object({
			title: z.string(),
			description: z.string().optional(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			categories: z.union([z.array(z.string()), z.string()]).optional(),
			category: z.string().optional(),
			tags: z.union([z.array(z.string()), z.string()]).optional(),
			draft: z.boolean().default(false),
		})
		.transform((data) => {
			const fromCsv = (v: string) =>
				v
					.split(/[,，]/g)
					.map((x) => x.trim())
					.filter(Boolean);
			const raw = [
				...(Array.isArray(data.categories)
					? data.categories
					: typeof data.categories === 'string'
						? fromCsv(data.categories)
						: []),
				...(typeof data.category === 'string' && data.category.trim() ? [data.category] : []),
				...(Array.isArray(data.tags)
					? data.tags
					: typeof data.tags === 'string'
						? fromCsv(data.tags)
						: []),
			]
				.map((x) => String(x).trim())
				.filter(Boolean);
			const categories = Array.from(new Set(raw));
			return {
				...data,
				categories,
				tags: [],
				category: undefined,
			};
		}),
});

export const collections = { blog };
