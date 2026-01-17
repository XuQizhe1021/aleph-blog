export const siteConfig = {
	title: 'XQZ的小屋',
	description: '一个小小的个人博客',
	author: 'aleph blanc',
	rewardImagePath: '/reward.png',
	nav: [
		{ href: '/', label: '首页' },
		{ href: '/posts', label: '文章' },
		{ href: '/categories', label: '分类' },
		{ href: '/search', label: '搜索' },
		{ href: '/about', label: '关于' },
	],
} as const;
