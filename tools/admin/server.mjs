import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import anchor from 'markdown-it-anchor';
import iconv from 'iconv-lite';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const projectRoot = process.cwd();
const postsDir = path.join(projectRoot, 'src', 'content', 'blog');
const publicDir = path.join(projectRoot, 'public');
const cursorDir = path.join(publicDir, 'cursors');
const adminPublicDir = path.join(projectRoot, 'tools', 'admin', 'public');
const dataDir = path.join(projectRoot, 'data');
const settingsPath = path.join(dataDir, 'site-settings.json');

await fs.mkdir(postsDir, { recursive: true });
await fs.mkdir(publicDir, { recursive: true });
await fs.mkdir(cursorDir, { recursive: true });
await fs.mkdir(dataDir, { recursive: true });

const defaultSiteSettings = {
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

const siteSettingsMeta = {
	site_features: [
		{
			category: '视觉微调',
			key: 'site_features.visual.dynamicFooterGreeting',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'SiteFooter 动态问候语',
			rollback: '关闭开关即可回退到静态页脚文案',
		},
		{
			category: '视觉微调',
			key: 'site_features.visual.festivalEffect',
			defaultValue: false,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'Layout 节日动效覆盖层',
			rollback: '关闭开关立即停用节日动效',
		},
		{
			category: '视觉微调',
			key: 'site_features.visual.customCursor',
			defaultValue: false,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'Layout 全局鼠标样式',
			rollback: '关闭后恢复浏览器默认鼠标',
		},
		{
			category: '视觉微调',
			key: 'site_features.visual.viewTransitions',
			defaultValue: false,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'Layout Astro ViewTransitions',
			rollback: '关闭后退回无动画页面切换',
		},
		{
			category: '内容增强',
			key: 'site_features.content.tocEnhanced',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'Toc 目录高亮联动',
			rollback: '关闭后保留静态目录',
		},
		{
			category: '内容增强',
			key: 'site_features.content.codeCopy',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: '代码块复制按钮',
			rollback: '关闭后隐藏复制按钮',
		},
		{
			category: '内容增强',
			key: 'site_features.content.mermaid',
			defaultValue: false,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'Markdown Mermaid 渲染',
			rollback: '关闭后回退到原始代码块',
		},
		{
			category: '实用工具',
			key: 'site_features.tools.sidebar',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: '全站侧边栏系统',
			rollback: '关闭后不渲染侧边栏',
		},
		{
			category: '实用工具',
			key: 'site_features.tools.siteUptime',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: '页脚运行时长计时器',
			rollback: '关闭后隐藏计时器',
		},
		{
			category: '实用工具',
			key: 'site_features.tools.randomPost',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: '随机文章入口（页脚/404）',
			rollback: '关闭后隐藏随机入口',
		},
		{
			category: '实用工具',
			key: 'site_features.tools.timeMachine',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: '时光机页面入口',
			rollback: '关闭后入口隐藏，页面可保留',
		},
		{
			category: '社交互动',
			key: 'site_features.social.giscus',
			defaultValue: false,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: 'Giscus 评论系统',
			rollback: '关闭后不加载第三方脚本',
		},
		{
			category: '社交互动',
			key: 'site_features.social.linkCard',
			defaultValue: true,
			type: 'boolean',
			validate: '布尔值',
			control: 'switch',
			consume: '链接/数字名片页',
			rollback: '关闭后页面展示提示态',
		},
	],
	site_texts: [
		{ key: 'site_texts.footerSignature', type: 'string', control: 'textarea' },
		{ key: 'site_texts.greetingMorning', type: 'string', control: 'input' },
		{ key: 'site_texts.greetingNoon', type: 'string', control: 'input' },
		{ key: 'site_texts.greetingAfternoon', type: 'string', control: 'input' },
		{ key: 'site_texts.greetingEvening', type: 'string', control: 'input' },
		{ key: 'site_texts.greetingNight', type: 'string', control: 'input' },
		{ key: 'site_texts.copyCode', type: 'string', control: 'input' },
		{ key: 'site_texts.copySuccess', type: 'string', control: 'input' },
		{ key: 'site_texts.copyFailed', type: 'string', control: 'input' },
		{ key: 'site_texts.mermaidFallback', type: 'string', control: 'input' },
	],
	site_theme_tweaks: [
		{ key: 'site_theme_tweaks.viewTransitionDurationMs', type: 'number', control: 'number' },
		{ key: 'site_theme_tweaks.viewTransitionEasing', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.cursorNormalLight', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.cursorNormalDark', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.cursorClickLight', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.cursorClickDark', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.cursorLoadingLight', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.cursorLoadingDark', type: 'string', control: 'input' },
		{ key: 'site_theme_tweaks.uptimeStartAt', type: 'string', control: 'datetime-local' },
	],
	site_integrations: [
		{ key: 'site_integrations.giscus.repo', type: 'string', control: 'input' },
		{ key: 'site_integrations.giscus.repoId', type: 'string', control: 'input' },
		{ key: 'site_integrations.giscus.category', type: 'string', control: 'input' },
		{ key: 'site_integrations.giscus.categoryId', type: 'string', control: 'input' },
		{ key: 'site_integrations.giscus.mapping', type: 'string', control: 'select' },
		{ key: 'site_integrations.giscus.lang', type: 'string', control: 'input' },
	],
};

const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
});
md.use(markdownItKatex);
md.use(anchor, { level: [1, 2, 3, 4], permalink: false });

function safeBasename(fileName) {
	const base = path.parse(fileName).name;
	return base.trim().replace(/[\\/:*?"<>|]/g, '_');
}

function sanitizeCursorSlot(shape, theme) {
	const shapeMap = {
		normal: 'normal',
		click: 'click',
		loading: 'loading',
	};
	const themeMap = {
		light: 'light',
		dark: 'dark',
	};
	return {
		shape: shapeMap[String(shape || '').toLowerCase()] || '',
		theme: themeMap[String(theme || '').toLowerCase()] || '',
	};
}

function normalizeCursorExt(originalName, mimeType) {
	let ext = String(path.extname(originalName || '')).toLowerCase();
	if (!ext) {
		const mime = String(mimeType || '').toLowerCase();
		if (mime === 'image/png') ext = '.png';
		else if (mime === 'image/jpeg') ext = '.jpg';
		else if (mime === 'image/webp') ext = '.webp';
		else if (mime === 'image/gif') ext = '.gif';
		else if (mime === 'image/svg+xml') ext = '.svg';
		else if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') ext = '.cur';
		else ext = '.png';
	}
	if (!/^\.[a-z0-9]+$/i.test(ext)) ext = '.png';
	return ext;
}

function toCursorCssValue(filePath) {
	const safePath = String(filePath || '').replace(/"/g, '%22');
	return `url("${safePath}") 8 8, auto`;
}

function decodePossiblyMojibakeName(name) {
	try {
		const decoded = Buffer.from(name, 'latin1').toString('utf-8');
		if (decoded && !decoded.includes('\uFFFD')) return decoded;
	} catch {}
	return name;
}

function decodeMarkdownBuffer(buf) {
	const utf8 = buf.toString('utf-8');
	if (!utf8.includes('\uFFFD')) return utf8;
	try {
		const gbk = iconv.decode(buf, 'gbk');
		if (gbk && !gbk.includes('\uFFFD')) return gbk;
	} catch {}
	return utf8;
}

async function readTextFile(filePath) {
	const buf = await fs.readFile(filePath);
	return decodeMarkdownBuffer(buf);
}

async function readPostFile(slug) {
	const mdPath = path.join(postsDir, `${slug}.md`);
	const mdxPath = path.join(postsDir, `${slug}.mdx`);
	if (fssync.existsSync(mdPath)) return mdPath;
	if (fssync.existsSync(mdxPath)) return mdxPath;
	return null;
}

function normalizeFrontmatter(data) {
	const out = { ...data };

	if (typeof out.title !== 'string' || !out.title.trim()) out.title = '未命名';
	if (!out.pubDate) out.pubDate = new Date().toISOString();

	const rawCategories = [];
	if (Array.isArray(out.categories)) rawCategories.push(...out.categories);
	if (typeof out.categories === 'string') rawCategories.push(...out.categories.split(/[,，]/g));
	if (typeof out.category === 'string') rawCategories.push(out.category);
	if (Array.isArray(out.tags)) rawCategories.push(...out.tags);
	if (typeof out.tags === 'string') rawCategories.push(...out.tags.split(/[,，]/g));

	const categories = Array.from(
		new Set(rawCategories.map((c) => String(c).trim()).filter(Boolean))
	);
	if (categories.length) out.categories = categories;
	else delete out.categories;
	delete out.category;
	delete out.tags;

	out.draft = Boolean(out.draft);

	return out;
}

function isLocalRequest(req) {
	const ip = req.ip ?? '';
	return ip.includes('127.0.0.1') || ip.includes('::1') || ip === '::ffff:127.0.0.1';
}

function runGit(args, cwd) {
	return new Promise((resolve) => {
		const child = spawn('git', args, { cwd, windowsHide: true });
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (d) => (stdout += String(d)));
		child.stderr.on('data', (d) => (stderr += String(d)));
		child.on('close', (code) => resolve({ code: Number(code ?? 0), stdout, stderr }));
	});
}

function asBoolean(value, fallback) {
	return typeof value === 'boolean' ? value : fallback;
}

function asString(value, fallback) {
	return typeof value === 'string' ? value : fallback;
}

function asNumber(value, fallback, min, max) {
	if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
	return Math.min(max, Math.max(min, value));
}

function normalizeSiteSettings(input) {
	const src = input && typeof input === 'object' ? input : {};
	const f = src.site_features ?? {};
	const t = src.site_texts ?? {};
	const tt = src.site_theme_tweaks ?? {};
	const i = src.site_integrations ?? {};
	const giscus = i.giscus ?? {};
	const links = Array.isArray(i.links) ? i.links : defaultSiteSettings.site_integrations.links;

	return {
		version: asNumber(src.version, defaultSiteSettings.version, 1, 9999),
		savedAt: asString(src.savedAt, ''),
		publishedAt: asString(src.publishedAt, ''),
		site_features: {
			visual: {
				dynamicFooterGreeting: asBoolean(
					f.visual?.dynamicFooterGreeting,
					defaultSiteSettings.site_features.visual.dynamicFooterGreeting
				),
				festivalEffect: asBoolean(
					f.visual?.festivalEffect,
					defaultSiteSettings.site_features.visual.festivalEffect
				),
				customCursor: asBoolean(
					f.visual?.customCursor,
					defaultSiteSettings.site_features.visual.customCursor
				),
				viewTransitions: asBoolean(
					f.visual?.viewTransitions,
					defaultSiteSettings.site_features.visual.viewTransitions
				),
			},
			content: {
				tocEnhanced: asBoolean(
					f.content?.tocEnhanced,
					defaultSiteSettings.site_features.content.tocEnhanced
				),
				codeCopy: asBoolean(f.content?.codeCopy, defaultSiteSettings.site_features.content.codeCopy),
				mermaid: asBoolean(f.content?.mermaid, defaultSiteSettings.site_features.content.mermaid),
			},
			tools: {
				sidebar: asBoolean(f.tools?.sidebar, defaultSiteSettings.site_features.tools.sidebar),
				siteUptime: asBoolean(f.tools?.siteUptime, defaultSiteSettings.site_features.tools.siteUptime),
				randomPost: asBoolean(f.tools?.randomPost, defaultSiteSettings.site_features.tools.randomPost),
				timeMachine: asBoolean(f.tools?.timeMachine, defaultSiteSettings.site_features.tools.timeMachine),
			},
			social: {
				giscus: asBoolean(f.social?.giscus, defaultSiteSettings.site_features.social.giscus),
				linkCard: asBoolean(f.social?.linkCard, defaultSiteSettings.site_features.social.linkCard),
			},
		},
		site_texts: {
			footerSignature: asString(t.footerSignature, defaultSiteSettings.site_texts.footerSignature),
			greetingMorning: asString(t.greetingMorning, defaultSiteSettings.site_texts.greetingMorning),
			greetingNoon: asString(t.greetingNoon, defaultSiteSettings.site_texts.greetingNoon),
			greetingAfternoon: asString(t.greetingAfternoon, defaultSiteSettings.site_texts.greetingAfternoon),
			greetingEvening: asString(t.greetingEvening, defaultSiteSettings.site_texts.greetingEvening),
			greetingNight: asString(t.greetingNight, defaultSiteSettings.site_texts.greetingNight),
			copyCode: asString(t.copyCode, defaultSiteSettings.site_texts.copyCode),
			copySuccess: asString(t.copySuccess, defaultSiteSettings.site_texts.copySuccess),
			copyFailed: asString(t.copyFailed, defaultSiteSettings.site_texts.copyFailed),
			mermaidFallback: asString(t.mermaidFallback, defaultSiteSettings.site_texts.mermaidFallback),
			sidebarTitle: asString(t.sidebarTitle, defaultSiteSettings.site_texts.sidebarTitle),
			sidebarStatusLabel: asString(t.sidebarStatusLabel, defaultSiteSettings.site_texts.sidebarStatusLabel),
			sidebarActivityLabel: asString(
				t.sidebarActivityLabel,
				defaultSiteSettings.site_texts.sidebarActivityLabel
			),
			sidebarStatusValue: asString(t.sidebarStatusValue, defaultSiteSettings.site_texts.sidebarStatusValue),
			sidebarActivityHint: asString(t.sidebarActivityHint, defaultSiteSettings.site_texts.sidebarActivityHint),
			randomPostLabel: asString(t.randomPostLabel, defaultSiteSettings.site_texts.randomPostLabel),
			notFoundRandomLabel: asString(
				t.notFoundRandomLabel,
				defaultSiteSettings.site_texts.notFoundRandomLabel
			),
			linksPageTitle: asString(t.linksPageTitle, defaultSiteSettings.site_texts.linksPageTitle),
			linksPageIntro: asString(t.linksPageIntro, defaultSiteSettings.site_texts.linksPageIntro),
		},
		site_theme_tweaks: {
			viewTransitionDurationMs: asNumber(
				tt.viewTransitionDurationMs,
				defaultSiteSettings.site_theme_tweaks.viewTransitionDurationMs,
				100,
				1200
			),
			viewTransitionEasing: asString(
				tt.viewTransitionEasing,
				defaultSiteSettings.site_theme_tweaks.viewTransitionEasing
			),
			// 向后兼容旧字段 cursorLight/cursorDark。
			cursorNormalLight: asString(
				tt.cursorNormalLight,
				asString(tt.cursorLight, defaultSiteSettings.site_theme_tweaks.cursorNormalLight)
			),
			cursorNormalDark: asString(
				tt.cursorNormalDark,
				asString(tt.cursorDark, defaultSiteSettings.site_theme_tweaks.cursorNormalDark)
			),
			cursorClickLight: asString(
				tt.cursorClickLight,
				defaultSiteSettings.site_theme_tweaks.cursorClickLight
			),
			cursorClickDark: asString(tt.cursorClickDark, defaultSiteSettings.site_theme_tweaks.cursorClickDark),
			cursorLoadingLight: asString(
				tt.cursorLoadingLight,
				defaultSiteSettings.site_theme_tweaks.cursorLoadingLight
			),
			cursorLoadingDark: asString(
				tt.cursorLoadingDark,
				defaultSiteSettings.site_theme_tweaks.cursorLoadingDark
			),
			greetingMorningEndHour: asNumber(
				tt.greetingMorningEndHour,
				defaultSiteSettings.site_theme_tweaks.greetingMorningEndHour,
				1,
				23
			),
			greetingNoonEndHour: asNumber(
				tt.greetingNoonEndHour,
				defaultSiteSettings.site_theme_tweaks.greetingNoonEndHour,
				1,
				23
			),
			greetingAfternoonEndHour: asNumber(
				tt.greetingAfternoonEndHour,
				defaultSiteSettings.site_theme_tweaks.greetingAfternoonEndHour,
				1,
				23
			),
			greetingEveningEndHour: asNumber(
				tt.greetingEveningEndHour,
				defaultSiteSettings.site_theme_tweaks.greetingEveningEndHour,
				1,
				23
			),
			festivalStartDate: asString(tt.festivalStartDate, defaultSiteSettings.site_theme_tweaks.festivalStartDate),
			festivalEndDate: asString(tt.festivalEndDate, defaultSiteSettings.site_theme_tweaks.festivalEndDate),
			festivalDurationMs: asNumber(
				tt.festivalDurationMs,
				defaultSiteSettings.site_theme_tweaks.festivalDurationMs,
				600,
				8000
			),
			sidebarDefaultCollapsed: asBoolean(
				tt.sidebarDefaultCollapsed,
				defaultSiteSettings.site_theme_tweaks.sidebarDefaultCollapsed
			),
			tocActiveOffset: asNumber(tt.tocActiveOffset, defaultSiteSettings.site_theme_tweaks.tocActiveOffset, 40, 200),
			uptimeStartAt: asString(tt.uptimeStartAt, defaultSiteSettings.site_theme_tweaks.uptimeStartAt),
		},
		site_integrations: {
			giscus: {
				repo: asString(giscus.repo, defaultSiteSettings.site_integrations.giscus.repo),
				repoId: asString(giscus.repoId, defaultSiteSettings.site_integrations.giscus.repoId),
				category: asString(giscus.category, defaultSiteSettings.site_integrations.giscus.category),
				categoryId: asString(giscus.categoryId, defaultSiteSettings.site_integrations.giscus.categoryId),
				mapping:
					giscus.mapping === 'url' ||
					giscus.mapping === 'title' ||
					giscus.mapping === 'og:title' ||
					giscus.mapping === 'specific' ||
					giscus.mapping === 'number'
						? giscus.mapping
						: defaultSiteSettings.site_integrations.giscus.mapping,
				term: asString(giscus.term, defaultSiteSettings.site_integrations.giscus.term),
				reactionsEnabled:
					giscus.reactionsEnabled === '0' ? '0' : defaultSiteSettings.site_integrations.giscus.reactionsEnabled,
				inputPosition:
					giscus.inputPosition === 'top' ? 'top' : defaultSiteSettings.site_integrations.giscus.inputPosition,
				lang: asString(giscus.lang, defaultSiteSettings.site_integrations.giscus.lang),
				loading: giscus.loading === 'eager' ? 'eager' : defaultSiteSettings.site_integrations.giscus.loading,
				enableOnPosts: asBoolean(giscus.enableOnPosts, defaultSiteSettings.site_integrations.giscus.enableOnPosts),
				enableOnPages: asBoolean(giscus.enableOnPages, defaultSiteSettings.site_integrations.giscus.enableOnPages),
			},
			links: links
				.map((item, index) => ({
					id: asString(item?.id, `link-${index + 1}`),
					label: asString(item?.label, `链接 ${index + 1}`),
					url: asString(item?.url, '/'),
					icon: asString(item?.icon, 'link'),
					order: asNumber(item?.order, index + 1, 1, 999),
				}))
				.sort((a, b) => a.order - b.order),
		},
	};
}

async function readSiteSettings() {
	try {
		const raw = await fs.readFile(settingsPath, 'utf-8');
		return normalizeSiteSettings(JSON.parse(raw));
	} catch {
		return normalizeSiteSettings(defaultSiteSettings);
	}
}

async function writeSiteSettings(settings) {
	const normalized = normalizeSiteSettings(settings);
	await fs.writeFile(settingsPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8');
	return normalized;
}

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.use('/admin', express.static(adminPublicDir, { extensions: ['html'] }));
app.use(
	'/vendor/katex',
	express.static(path.join(projectRoot, 'node_modules', 'katex', 'dist'))
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/site-settings/meta', (_req, res) => {
	res.json({ meta: siteSettingsMeta });
});

app.get('/api/site-settings', async (_req, res) => {
	try {
		const settings = await readSiteSettings();
		res.json({ settings, meta: siteSettingsMeta });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.put('/api/site-settings/save', async (req, res) => {
	try {
		const incoming = req.body?.settings;
		if (!incoming || typeof incoming !== 'object') {
			return res.status(400).json({ error: 'invalid_settings' });
		}
		const current = await readSiteSettings();
		const next = normalizeSiteSettings({
			...current,
			...incoming,
			savedAt: new Date().toISOString(),
		});
		const settings = await writeSiteSettings(next);
		res.json({ ok: true, settings });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/site-settings/publish', async (_req, res) => {
	try {
		const current = await readSiteSettings();
		const now = new Date().toISOString();
		const settings = await writeSiteSettings({
			...current,
			savedAt: current.savedAt || now,
			publishedAt: now,
		});
		res.json({ ok: true, settings });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.use((req, res, next) => {
	if (req.path.startsWith('/api/') || req.path === '/api') {
		if (!isLocalRequest(req)) return res.status(403).json({ error: 'forbidden' });
	}
	next();
});

app.get('/api/posts', async (_req, res) => {
	try {
		const files = (await fs.readdir(postsDir)).filter((f) => /\.(md|mdx)$/i.test(f));
		const posts = await Promise.all(
			files.map(async (file) => {
				const full = path.join(postsDir, file);
				const raw = await readTextFile(full);
				const parsed = matter(raw);
				const slug = path.parse(file).name;
				const data = normalizeFrontmatter(parsed.data ?? {});
				return {
					slug,
					file,
					title: data.title,
					description: typeof data.description === 'string' ? data.description : '',
					categories: Array.isArray(data.categories) ? data.categories : [],
					pubDate: data.pubDate,
					updatedDate: data.updatedDate ?? '',
					draft: Boolean(data.draft),
				};
			})
		);
		posts.sort((a, b) => String(b.pubDate).localeCompare(String(a.pubDate)));
		res.json({ posts });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.get('/api/posts/:slug', async (req, res) => {
	try {
		const slug = req.params.slug;
		const filePath = await readPostFile(slug);
		if (!filePath) return res.status(404).json({ error: 'not_found' });
		const raw = await readTextFile(filePath);
		const parsed = matter(raw);
		const data = normalizeFrontmatter(parsed.data ?? {});
		res.json({
			slug,
			file: path.basename(filePath),
			frontmatter: data,
			content: parsed.content ?? '',
			raw,
		});
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/posts/upload', upload.single('file'), async (req, res) => {
	try {
		const file = req.file;
		if (!file) return res.status(400).json({ error: 'missing_file' });
		const originalname = decodePossiblyMojibakeName(file.originalname);
		const slug = safeBasename(originalname);
		const targetPath = path.join(postsDir, `${slug}.md`);

		const incomingRaw = decodeMarkdownBuffer(file.buffer);
		const incomingParsed = matter(incomingRaw);

		let data = normalizeFrontmatter(incomingParsed.data ?? {});
		if (data.title === '未命名') data.title = slug;
		const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
		if (title) data.title = title;
		const description =
			typeof req.body?.description === 'string' ? req.body.description.trim() : '';
		if (description) data.description = description;
		const categoriesRaw =
			typeof req.body?.categories === 'string' ? req.body.categories.trim() : '';
		if (categoriesRaw) {
			const categories = Array.from(
				new Set(
					categoriesRaw
						.split(/[,，]/g)
						.map((c) => c.trim())
						.filter(Boolean)
				)
			);
			if (categories.length) data.categories = categories;
			else delete data.categories;
		}

		const existingPath = await readPostFile(slug);
		if (existingPath) {
			const existingRaw = await readTextFile(existingPath);
			const existingParsed = matter(existingRaw);
			const existingData = normalizeFrontmatter(existingParsed.data ?? {});
			if (!incomingParsed.data?.pubDate) data.pubDate = existingData.pubDate;
			data.updatedDate = new Date().toISOString();
		}

		const out = matter.stringify(incomingParsed.content ?? '', data);
		await fs.writeFile(targetPath, out, 'utf-8');
		if (existingPath && path.basename(existingPath) !== path.basename(targetPath)) {
			await fs.unlink(existingPath);
		}
		res.json({ ok: true, slug, file: path.basename(targetPath) });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.get('/api/categories', async (_req, res) => {
	try {
		const files = (await fs.readdir(postsDir)).filter((f) => /\.(md|mdx)$/i.test(f));
		const counts = new Map();
		for (const file of files) {
			const full = path.join(postsDir, file);
			const raw = await readTextFile(full);
			const parsed = matter(raw);
			const data = normalizeFrontmatter(parsed.data ?? {});
			const cats =
				Array.isArray(data.categories) && data.categories.length ? data.categories : ['未分类'];
			for (const c of cats) {
				counts.set(c, (counts.get(c) ?? 0) + 1);
			}
		}
		const categories = Array.from(counts.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
		res.json({ categories });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/categories/rename', async (req, res) => {
	try {
		const from = typeof req.body?.from === 'string' ? req.body.from.trim() : '';
		const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
		if (!from) return res.status(400).json({ error: 'missing_from' });
		if (from === to) return res.json({ ok: true, changed: 0 });
		const files = (await fs.readdir(postsDir)).filter((f) => /\.(md|mdx)$/i.test(f));
		let changed = 0;
		for (const file of files) {
			const full = path.join(postsDir, file);
			const raw = await readTextFile(full);
			const parsed = matter(raw);
			const data = normalizeFrontmatter(parsed.data ?? {});
			const cats = Array.isArray(data.categories) ? data.categories : [];
			if (!cats.includes(from)) continue;
			const next = cats
				.map((c) => (c === from ? to : c))
				.map((c) => String(c).trim())
				.filter(Boolean)
				.filter((c) => c !== '未分类');
			const outCats = Array.from(new Set(next));
			if (outCats.length) data.categories = outCats;
			else delete data.categories;
			data.updatedDate = new Date().toISOString();
			const out = matter.stringify(parsed.content ?? '', data);
			await fs.writeFile(full, out, 'utf-8');
			changed++;
		}
		res.json({ ok: true, changed });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.delete('/api/categories/:name', async (req, res) => {
	try {
		const name = decodeURIComponent(req.params.name ?? '').trim();
		if (!name) return res.status(400).json({ error: 'missing_name' });
		const files = (await fs.readdir(postsDir)).filter((f) => /\.(md|mdx)$/i.test(f));
		let changed = 0;
		for (const file of files) {
			const full = path.join(postsDir, file);
			const raw = await readTextFile(full);
			const parsed = matter(raw);
			const data = normalizeFrontmatter(parsed.data ?? {});
			const cats = Array.isArray(data.categories) ? data.categories : [];
			if (!cats.includes(name)) continue;
			const next = cats
				.map((c) => String(c).trim())
				.filter(Boolean)
				.filter((c) => c !== name)
				.filter((c) => c !== '未分类');
			const outCats = Array.from(new Set(next));
			if (outCats.length) data.categories = outCats;
			else delete data.categories;
			data.updatedDate = new Date().toISOString();
			const out = matter.stringify(parsed.content ?? '', data);
			await fs.writeFile(full, out, 'utf-8');
			changed++;
		}
		res.json({ ok: true, changed });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/publish', async (req, res) => {
	try {
		if (!isLocalRequest(req)) return res.status(403).json({ error: 'forbidden' });
		const status = await runGit(['status', '--porcelain'], projectRoot);
		if (status.code !== 0) return res.status(500).json({ error: status.stderr || status.stdout });
		if (!status.stdout.trim()) return res.json({ ok: true, message: 'no_changes' });
		const add = await runGit(['add', '-A'], projectRoot);
		if (add.code !== 0) return res.status(500).json({ error: add.stderr || add.stdout });
		const msg =
			typeof req.body?.message === 'string' && req.body.message.trim()
				? req.body.message.trim()
				: `publish ${new Date().toISOString()}`;
		const commit = await runGit(['commit', '-m', msg], projectRoot);
		if (commit.code !== 0)
			return res.status(500).json({ error: commit.stderr || commit.stdout });
		const push = await runGit(['push'], projectRoot);
		if (push.code !== 0) return res.status(500).json({ error: push.stderr || push.stdout });
		res.json({
			ok: true,
			output: [status.stdout, commit.stdout, commit.stderr, push.stdout, push.stderr]
				.filter(Boolean)
				.join('\n'),
		});
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/posts/:slug/categories', async (req, res) => {
	try {
		const slug = req.params.slug;
		const filePath = await readPostFile(slug);
		if (!filePath) return res.status(404).json({ error: 'not_found' });

		const categoriesRaw = req.body?.categories;
		let next = [];
		if (Array.isArray(categoriesRaw)) next = categoriesRaw;
		else if (typeof categoriesRaw === 'string') next = categoriesRaw.split(/[,，]/g);
		else if (categoriesRaw == null) next = [];
		else return res.status(400).json({ error: 'invalid_categories' });

		const categories = Array.from(
			new Set(
				next
					.map((c) => String(c).trim())
					.filter(Boolean)
					.filter((c) => c !== '未分类')
			)
		);

		const raw = await readTextFile(filePath);
		const parsed = matter(raw);
		const data = normalizeFrontmatter(parsed.data ?? {});
		if (categories.length) data.categories = categories;
		else delete data.categories;
		data.updatedDate = new Date().toISOString();

		const out = matter.stringify(parsed.content ?? '', data);
		await fs.writeFile(filePath, out, 'utf-8');
		res.json({ ok: true, categories });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.delete('/api/posts/:slug', async (req, res) => {
	try {
		const slug = req.params.slug;
		const filePath = await readPostFile(slug);
		if (!filePath) return res.status(404).json({ error: 'not_found' });
		await fs.unlink(filePath);
		res.json({ ok: true });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/reward-image', upload.single('file'), async (req, res) => {
	try {
		const file = req.file;
		if (!file) return res.status(400).json({ error: 'missing_file' });
		const originalname = decodePossiblyMojibakeName(file.originalname);
		let ext = (path.extname(originalname) || '').toLowerCase();
		if (!ext) {
			const mime = String(file.mimetype || '').toLowerCase();
			if (mime === 'image/png') ext = '.png';
			else if (mime === 'image/jpeg') ext = '.jpg';
			else if (mime === 'image/webp') ext = '.webp';
			else if (mime === 'image/gif') ext = '.gif';
			else if (mime === 'image/svg+xml') ext = '.svg';
			else ext = '.png';
		}
		if (!/^\.[a-z0-9]+$/i.test(ext)) ext = '.png';

		const existing = (await fs.readdir(publicDir)).filter((f) => /^reward\./i.test(f));
		await Promise.all(existing.map((f) => fs.unlink(path.join(publicDir, f)).catch(() => null)));
		const target = path.join(publicDir, `reward${ext}`);
		await fs.writeFile(target, file.buffer);
		res.json({ ok: true, path: `/reward${ext}` });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.get('/api/reward-image', async (_req, res) => {
	try {
		const files = (await fs.readdir(publicDir))
			.filter((f) => /^reward\./i.test(f))
			.sort((a, b) => a.localeCompare(b));
		const file = files[0] ?? '';
		res.json({ path: file ? `/${file}` : '' });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/cursor-skins', upload.single('file'), async (req, res) => {
	try {
		const file = req.file;
		if (!file) return res.status(400).json({ error: 'missing_file' });
		const { shape, theme } = sanitizeCursorSlot(req.body?.shape, req.body?.theme);
		if (!shape || !theme) return res.status(400).json({ error: 'invalid_cursor_slot' });

		const originalname = decodePossiblyMojibakeName(file.originalname);
		const ext = normalizeCursorExt(originalname, file.mimetype);
		const fileBase = `cursor-${shape}-${theme}`;
		const nextFileName = `${fileBase}${ext}`;
		const nextFilePath = path.join(cursorDir, nextFileName);

		const oldFiles = (await fs.readdir(cursorDir)).filter((name) =>
			name.startsWith(`${fileBase}.`)
		);
		await Promise.all(
			oldFiles
				.filter((name) => name !== nextFileName)
				.map((name) => fs.unlink(path.join(cursorDir, name)).catch(() => null))
		);
		await fs.writeFile(nextFilePath, file.buffer);

		const settings = await readSiteSettings();
		const relativePath = `/cursors/${nextFileName}`;
		const cssValue = toCursorCssValue(relativePath);
		if (shape === 'normal' && theme === 'light') settings.site_theme_tweaks.cursorNormalLight = cssValue;
		if (shape === 'normal' && theme === 'dark') settings.site_theme_tweaks.cursorNormalDark = cssValue;
		if (shape === 'click' && theme === 'light') settings.site_theme_tweaks.cursorClickLight = cssValue;
		if (shape === 'click' && theme === 'dark') settings.site_theme_tweaks.cursorClickDark = cssValue;
		if (shape === 'loading' && theme === 'light') settings.site_theme_tweaks.cursorLoadingLight = cssValue;
		if (shape === 'loading' && theme === 'dark') settings.site_theme_tweaks.cursorLoadingDark = cssValue;
		settings.savedAt = new Date().toISOString();
		const normalized = await writeSiteSettings(settings);

		res.json({
			ok: true,
			path: relativePath,
			cssValue,
			settings: normalized,
		});
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.post('/api/preview', async (req, res) => {
	try {
		const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown : '';
		const html = md.render(markdown);
		res.json({ html });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

const port = Number(process.env.ADMIN_PORT ?? 4322);
app.listen(port, '127.0.0.1', () => {
	console.log(`Admin running at http://localhost:${port}/admin`);
});
