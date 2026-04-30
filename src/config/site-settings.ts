import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type SiteFeatureGroups = {
	visual: {
		dynamicFooterGreeting: boolean;
		festivalEffect: boolean;
		customCursor: boolean;
		viewTransitions: boolean;
	};
	content: {
		tocEnhanced: boolean;
		codeCopy: boolean;
		mermaid: boolean;
	};
	tools: {
		sidebar: boolean;
		siteUptime: boolean;
		randomPost: boolean;
		timeMachine: boolean;
	};
	social: {
		giscus: boolean;
		linkCard: boolean;
	};
};

export type SiteTexts = {
	footerSignature: string;
	greetingMorning: string;
	greetingNoon: string;
	greetingAfternoon: string;
	greetingEvening: string;
	greetingNight: string;
	copyCode: string;
	copySuccess: string;
	copyFailed: string;
	mermaidFallback: string;
	sidebarTitle: string;
	sidebarStatusLabel: string;
	sidebarActivityLabel: string;
	sidebarStatusValue: string;
	sidebarActivityHint: string;
	randomPostLabel: string;
	notFoundRandomLabel: string;
	linksPageTitle: string;
	linksPageIntro: string;
};

export type SiteThemeTweaks = {
	viewTransitionDurationMs: number;
	viewTransitionEasing: string;
	cursorNormalLight: string;
	cursorNormalDark: string;
	cursorClickLight: string;
	cursorClickDark: string;
	cursorLoadingLight: string;
	cursorLoadingDark: string;
	greetingMorningEndHour: number;
	greetingNoonEndHour: number;
	greetingAfternoonEndHour: number;
	greetingEveningEndHour: number;
	festivalStartDate: string;
	festivalEndDate: string;
	festivalDurationMs: number;
	sidebarDefaultCollapsed: boolean;
	tocActiveOffset: number;
	uptimeStartAt: string;
};

export type SiteIntegrations = {
	giscus: {
		repo: string;
		repoId: string;
		category: string;
		categoryId: string;
		mapping: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
		term: string;
		reactionsEnabled: '0' | '1';
		inputPosition: 'top' | 'bottom';
		lang: string;
		loading: 'lazy' | 'eager';
		enableOnPosts: boolean;
		enableOnPages: boolean;
	};
	links: Array<{
		id: string;
		label: string;
		url: string;
		icon: string;
		order: number;
	}>;
};

export type SiteSettings = {
	version: number;
	savedAt: string;
	publishedAt: string;
	site_features: SiteFeatureGroups;
	site_texts: SiteTexts;
	site_theme_tweaks: SiteThemeTweaks;
	site_integrations: SiteIntegrations;
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dataDir = path.join(projectRoot, 'data');
const settingsFilePath = path.join(dataDir, 'site-settings.json');

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
	version: 1,
	savedAt: '',
	publishedAt: '',
	site_features: {
		visual: {
			dynamicFooterGreeting: true,
			festivalEffect: false,
			customCursor: false,
			viewTransitions: false,
		},
		content: {
			tocEnhanced: true,
			codeCopy: true,
			mermaid: false,
		},
		tools: {
			sidebar: true,
			siteUptime: true,
			randomPost: true,
			timeMachine: true,
		},
		social: {
			giscus: false,
			linkCard: true,
		},
	},
	site_texts: {
		footerSignature: '谢谢你的阅读，愿你今天也有好状态。',
		greetingMorning: '早上好，祝你今天高效顺利。',
		greetingNoon: '中午好，记得休息一下。',
		greetingAfternoon: '下午好，继续推进你的目标。',
		greetingEvening: '晚上好，欢迎来这里放松一下。',
		greetingNight: '夜深了，注意休息。',
		copyCode: '复制',
		copySuccess: '已复制',
		copyFailed: '复制失败，请手动复制',
		mermaidFallback: '图表渲染失败，已回退为代码块展示。',
		sidebarTitle: '侧边栏',
		sidebarStatusLabel: '当前状态',
		sidebarActivityLabel: '活跃日历',
		sidebarStatusValue: '专注开发中',
		sidebarActivityHint: '可在后台配置活动数据源或占位文案。',
		randomPostLabel: '随机文章',
		notFoundRandomLabel: '随便看看一篇文章',
		linksPageTitle: '链接与数字名片',
		linksPageIntro: '这里整理了常用的社交与联系入口。',
	},
	site_theme_tweaks: {
		viewTransitionDurationMs: 260,
		viewTransitionEasing: 'ease',
		cursorNormalLight: 'auto',
		cursorNormalDark: 'auto',
		cursorClickLight: 'pointer',
		cursorClickDark: 'pointer',
		cursorLoadingLight: 'progress',
		cursorLoadingDark: 'progress',
		greetingMorningEndHour: 11,
		greetingNoonEndHour: 14,
		greetingAfternoonEndHour: 18,
		greetingEveningEndHour: 23,
		festivalStartDate: '12-24',
		festivalEndDate: '12-26',
		festivalDurationMs: 1800,
		sidebarDefaultCollapsed: false,
		tocActiveOffset: 96,
		uptimeStartAt: '2026-01-01T00:00:00+08:00',
	},
	site_integrations: {
		giscus: {
			repo: '',
			repoId: '',
			category: 'Announcements',
			categoryId: '',
			mapping: 'pathname',
			term: '',
			reactionsEnabled: '1',
			inputPosition: 'bottom',
			lang: 'zh-CN',
			loading: 'lazy',
			enableOnPosts: true,
			enableOnPages: false,
		},
		links: [
			{ id: 'github', label: 'GitHub', url: 'https://github.com/', icon: 'github', order: 1 },
			{ id: 'email', label: '邮箱', url: 'mailto:example@example.com', icon: 'mail', order: 2 },
			{ id: 'rss', label: 'RSS', url: '/rss.xml', icon: 'rss', order: 3 },
		],
	},
};

function asBoolean(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback: string) {
	return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
	if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
	return Math.min(max, Math.max(min, value));
}

export function normalizeSiteSettings(input: unknown): SiteSettings {
	const source = (input && typeof input === 'object' ? input : {}) as Partial<SiteSettings>;
	const f: Partial<SiteFeatureGroups> = source.site_features ?? {};
	const t: Partial<SiteTexts> = source.site_texts ?? {};
	const tt: Partial<SiteThemeTweaks> = source.site_theme_tweaks ?? {};
	const i: Partial<SiteIntegrations> = source.site_integrations ?? {};
	const giscus: Partial<SiteIntegrations['giscus']> = i.giscus ?? {};
	const links: Array<Partial<SiteIntegrations['links'][number]>> = Array.isArray(i.links)
		? i.links
		: DEFAULT_SITE_SETTINGS.site_integrations.links;

	return {
		version: asNumber(source.version, 1, 1, 9999),
		savedAt: asString(source.savedAt, ''),
		publishedAt: asString(source.publishedAt, ''),
		site_features: {
			visual: {
				dynamicFooterGreeting: asBoolean(
					f.visual?.dynamicFooterGreeting,
					DEFAULT_SITE_SETTINGS.site_features.visual.dynamicFooterGreeting
				),
				festivalEffect: asBoolean(
					f.visual?.festivalEffect,
					DEFAULT_SITE_SETTINGS.site_features.visual.festivalEffect
				),
				customCursor: asBoolean(
					f.visual?.customCursor,
					DEFAULT_SITE_SETTINGS.site_features.visual.customCursor
				),
				viewTransitions: asBoolean(
					f.visual?.viewTransitions,
					DEFAULT_SITE_SETTINGS.site_features.visual.viewTransitions
				),
			},
			content: {
				tocEnhanced: asBoolean(
					f.content?.tocEnhanced,
					DEFAULT_SITE_SETTINGS.site_features.content.tocEnhanced
				),
				codeCopy: asBoolean(
					f.content?.codeCopy,
					DEFAULT_SITE_SETTINGS.site_features.content.codeCopy
				),
				mermaid: asBoolean(f.content?.mermaid, DEFAULT_SITE_SETTINGS.site_features.content.mermaid),
			},
			tools: {
				sidebar: asBoolean(f.tools?.sidebar, DEFAULT_SITE_SETTINGS.site_features.tools.sidebar),
				siteUptime: asBoolean(f.tools?.siteUptime, DEFAULT_SITE_SETTINGS.site_features.tools.siteUptime),
				randomPost: asBoolean(f.tools?.randomPost, DEFAULT_SITE_SETTINGS.site_features.tools.randomPost),
				timeMachine: asBoolean(
					f.tools?.timeMachine,
					DEFAULT_SITE_SETTINGS.site_features.tools.timeMachine
				),
			},
			social: {
				giscus: asBoolean(f.social?.giscus, DEFAULT_SITE_SETTINGS.site_features.social.giscus),
				linkCard: asBoolean(f.social?.linkCard, DEFAULT_SITE_SETTINGS.site_features.social.linkCard),
			},
		},
		site_texts: {
			footerSignature: asString(t.footerSignature, DEFAULT_SITE_SETTINGS.site_texts.footerSignature),
			greetingMorning: asString(t.greetingMorning, DEFAULT_SITE_SETTINGS.site_texts.greetingMorning),
			greetingNoon: asString(t.greetingNoon, DEFAULT_SITE_SETTINGS.site_texts.greetingNoon),
			greetingAfternoon: asString(t.greetingAfternoon, DEFAULT_SITE_SETTINGS.site_texts.greetingAfternoon),
			greetingEvening: asString(t.greetingEvening, DEFAULT_SITE_SETTINGS.site_texts.greetingEvening),
			greetingNight: asString(t.greetingNight, DEFAULT_SITE_SETTINGS.site_texts.greetingNight),
			copyCode: asString(t.copyCode, DEFAULT_SITE_SETTINGS.site_texts.copyCode),
			copySuccess: asString(t.copySuccess, DEFAULT_SITE_SETTINGS.site_texts.copySuccess),
			copyFailed: asString(t.copyFailed, DEFAULT_SITE_SETTINGS.site_texts.copyFailed),
			mermaidFallback: asString(t.mermaidFallback, DEFAULT_SITE_SETTINGS.site_texts.mermaidFallback),
			sidebarTitle: asString(t.sidebarTitle, DEFAULT_SITE_SETTINGS.site_texts.sidebarTitle),
			sidebarStatusLabel: asString(
				t.sidebarStatusLabel,
				DEFAULT_SITE_SETTINGS.site_texts.sidebarStatusLabel
			),
			sidebarActivityLabel: asString(
				t.sidebarActivityLabel,
				DEFAULT_SITE_SETTINGS.site_texts.sidebarActivityLabel
			),
			sidebarStatusValue: asString(
				t.sidebarStatusValue,
				DEFAULT_SITE_SETTINGS.site_texts.sidebarStatusValue
			),
			sidebarActivityHint: asString(
				t.sidebarActivityHint,
				DEFAULT_SITE_SETTINGS.site_texts.sidebarActivityHint
			),
			randomPostLabel: asString(t.randomPostLabel, DEFAULT_SITE_SETTINGS.site_texts.randomPostLabel),
			notFoundRandomLabel: asString(
				t.notFoundRandomLabel,
				DEFAULT_SITE_SETTINGS.site_texts.notFoundRandomLabel
			),
			linksPageTitle: asString(t.linksPageTitle, DEFAULT_SITE_SETTINGS.site_texts.linksPageTitle),
			linksPageIntro: asString(t.linksPageIntro, DEFAULT_SITE_SETTINGS.site_texts.linksPageIntro),
		},
		site_theme_tweaks: {
			viewTransitionDurationMs: asNumber(
				tt.viewTransitionDurationMs,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.viewTransitionDurationMs,
				100,
				1200
			),
			viewTransitionEasing: asString(
				tt.viewTransitionEasing,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.viewTransitionEasing
			),
			// 兼容历史字段 cursorLight/cursorDark，并优先使用新的三态字段。
			cursorNormalLight: asString(
				tt.cursorNormalLight,
				asString(
					(tt as Partial<{ cursorLight: string }>).cursorLight,
					DEFAULT_SITE_SETTINGS.site_theme_tweaks.cursorNormalLight
				)
			),
			cursorNormalDark: asString(
				tt.cursorNormalDark,
				asString(
					(tt as Partial<{ cursorDark: string }>).cursorDark,
					DEFAULT_SITE_SETTINGS.site_theme_tweaks.cursorNormalDark
				)
			),
			cursorClickLight: asString(
				tt.cursorClickLight,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.cursorClickLight
			),
			cursorClickDark: asString(tt.cursorClickDark, DEFAULT_SITE_SETTINGS.site_theme_tweaks.cursorClickDark),
			cursorLoadingLight: asString(
				tt.cursorLoadingLight,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.cursorLoadingLight
			),
			cursorLoadingDark: asString(
				tt.cursorLoadingDark,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.cursorLoadingDark
			),
			greetingMorningEndHour: asNumber(
				tt.greetingMorningEndHour,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.greetingMorningEndHour,
				1,
				23
			),
			greetingNoonEndHour: asNumber(
				tt.greetingNoonEndHour,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.greetingNoonEndHour,
				1,
				23
			),
			greetingAfternoonEndHour: asNumber(
				tt.greetingAfternoonEndHour,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.greetingAfternoonEndHour,
				1,
				23
			),
			greetingEveningEndHour: asNumber(
				tt.greetingEveningEndHour,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.greetingEveningEndHour,
				1,
				23
			),
			festivalStartDate: asString(
				tt.festivalStartDate,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.festivalStartDate
			),
			festivalEndDate: asString(tt.festivalEndDate, DEFAULT_SITE_SETTINGS.site_theme_tweaks.festivalEndDate),
			festivalDurationMs: asNumber(
				tt.festivalDurationMs,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.festivalDurationMs,
				600,
				8000
			),
			sidebarDefaultCollapsed: asBoolean(
				tt.sidebarDefaultCollapsed,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.sidebarDefaultCollapsed
			),
			tocActiveOffset: asNumber(
				tt.tocActiveOffset,
				DEFAULT_SITE_SETTINGS.site_theme_tweaks.tocActiveOffset,
				40,
				200
			),
			uptimeStartAt: asString(tt.uptimeStartAt, DEFAULT_SITE_SETTINGS.site_theme_tweaks.uptimeStartAt),
		},
		site_integrations: {
			giscus: {
				repo: asString(giscus.repo, DEFAULT_SITE_SETTINGS.site_integrations.giscus.repo),
				repoId: asString(giscus.repoId, DEFAULT_SITE_SETTINGS.site_integrations.giscus.repoId),
				category: asString(giscus.category, DEFAULT_SITE_SETTINGS.site_integrations.giscus.category),
				categoryId: asString(giscus.categoryId, DEFAULT_SITE_SETTINGS.site_integrations.giscus.categoryId),
				mapping:
					giscus.mapping === 'url' ||
					giscus.mapping === 'title' ||
					giscus.mapping === 'og:title' ||
					giscus.mapping === 'specific' ||
					giscus.mapping === 'number'
						? giscus.mapping
						: DEFAULT_SITE_SETTINGS.site_integrations.giscus.mapping,
				term: asString(giscus.term, DEFAULT_SITE_SETTINGS.site_integrations.giscus.term),
				reactionsEnabled:
					giscus.reactionsEnabled === '0' ? '0' : DEFAULT_SITE_SETTINGS.site_integrations.giscus.reactionsEnabled,
				inputPosition:
					giscus.inputPosition === 'top' ? 'top' : DEFAULT_SITE_SETTINGS.site_integrations.giscus.inputPosition,
				lang: asString(giscus.lang, DEFAULT_SITE_SETTINGS.site_integrations.giscus.lang),
				loading:
					giscus.loading === 'eager' ? 'eager' : DEFAULT_SITE_SETTINGS.site_integrations.giscus.loading,
				enableOnPosts: asBoolean(
					giscus.enableOnPosts,
					DEFAULT_SITE_SETTINGS.site_integrations.giscus.enableOnPosts
				),
				enableOnPages: asBoolean(
					giscus.enableOnPages,
					DEFAULT_SITE_SETTINGS.site_integrations.giscus.enableOnPages
				),
			},
			links: links
				.map((item, index: number) => ({
					id: asString(item?.id, `link-${index + 1}`),
					label: asString(item?.label, `链接 ${index + 1}`),
					url: asString(item?.url, '/'),
					icon: asString(item?.icon, 'link'),
					order: asNumber(item?.order, index + 1, 1, 999),
				}))
				.sort((a: { order: number }, b: { order: number }) => a.order - b.order),
		},
	};
}

export async function getSiteSettings() {
	try {
		const raw = await fs.readFile(settingsFilePath, 'utf-8');
		return normalizeSiteSettings(JSON.parse(raw));
	} catch {
		return DEFAULT_SITE_SETTINGS;
	}
}
