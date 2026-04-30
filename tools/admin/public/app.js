const $ = (id) => document.getElementById(id);

const $list = $('list');
const $filter = $('filter');
const $count = $('count');
const $uploadMd = $('upload-md');
const $uploadReward = $('upload-reward');
const $refresh = $('refresh');
const $manageCategories = $('manage-categories');
const $publish = $('publish');
const $delete = $('delete');
const $openSite = $('open-site');
const $vTitle = $('v-title');
const $vSub = $('v-sub');
const $raw = $('raw');
const $preview = $('preview');
const $editCategories = $('edit-categories');
const $saveCategories = $('save-categories');
const $modal = $('modal');
const $modalBackdrop = $('modal-backdrop');
const $modalClose = $('modal-close');
const $modalTitle = $('modal-title');
const $modalBody = $('modal-body');
const $modalActions = $('modal-actions');
const $settingsMeta = $('settings-meta');
const $settingsPreview = $('settings-preview');
const $settingsSave = $('settings-save');
const $settingsPublish = $('settings-publish');
const $settingsSingle = $('settings-single');

let posts = [];
let activeSlug = '';
let categories = [];
let pendingUploadFile = null;
let pendingRewardFile = null;
let settingsDraft = null;
let settingsMeta = null;
let adminPage = 'posts';
let settingsActiveGroup = 'features';

const baseUrl = (path) => `${path}`;
const formatDate = (s) => (s ? new Date(s).toLocaleDateString('zh-CN') : '');
const formatDateTime = (s) => (s ? new Date(s).toLocaleString('zh-CN') : '—');
const settingsCardState = {
	features: 'features-视觉微调',
	texts: 'texts-文案配置',
	integrations: 'integrations-giscus',
};

const fieldHelpMap = {
	'site_texts.footerSignature': ['页脚签名', '显示在页脚的补充说明文案'],
	'site_texts.greetingMorning': ['早晨问候', '用于清晨时段的问候语'],
	'site_texts.greetingNoon': ['中午问候', '用于中午时段的问候语'],
	'site_texts.greetingAfternoon': ['下午问候', '用于下午时段的问候语'],
	'site_texts.greetingEvening': ['晚间问候', '用于晚上时段的问候语'],
	'site_texts.greetingNight': ['深夜问候', '用于夜间时段的问候语'],
	'site_texts.copyCode': ['复制按钮文案', '代码块复制按钮默认文字'],
	'site_texts.copySuccess': ['复制成功文案', '复制成功后短提示文字'],
	'site_texts.copyFailed': ['复制失败文案', '复制失败时提示文字'],
	'site_texts.mermaidFallback': ['Mermaid失败提示', '流程图渲染失败时提示'],
	'site_texts.sidebarTitle': ['侧边栏标题', '抽屉侧边栏标题与按钮文案'],
	'site_texts.sidebarStatusLabel': ['状态标签标题', '例如“当前状态”'],
	'site_texts.sidebarActivityLabel': ['活跃区标题', '例如“活跃日历”'],
	'site_texts.sidebarStatusValue': ['状态值', '状态标签实际内容'],
	'site_texts.sidebarActivityHint': ['活跃区说明', '活跃区的占位或说明文字'],
	'site_texts.randomPostLabel': ['随机文章按钮', '页脚随机文章入口文案'],
	'site_texts.notFoundRandomLabel': ['404随机入口文案', '404 页随机文章按钮文案'],
	'site_texts.linksPageTitle': ['链接页标题', '数字名片页主标题'],
	'site_texts.linksPageIntro': ['链接页简介', '数字名片页说明文字'],
	'site_theme_tweaks.viewTransitionDurationMs': ['切换动画时长(ms)', '页面过渡动画持续时长'],
	'site_theme_tweaks.viewTransitionEasing': ['切换动画曲线', '例如 ease / linear / ease-in-out'],
	'site_theme_tweaks.cursorNormalLight': ['浅色正常态鼠标', '默认状态使用的 CSS cursor 值'],
	'site_theme_tweaks.cursorNormalDark': ['深色正常态鼠标', '默认状态使用的 CSS cursor 值'],
	'site_theme_tweaks.cursorClickLight': ['浅色点击态鼠标', '按钮、链接等交互态使用的 cursor 值'],
	'site_theme_tweaks.cursorClickDark': ['深色点击态鼠标', '按钮、链接等交互态使用的 cursor 值'],
	'site_theme_tweaks.cursorLoadingLight': ['浅色加载态鼠标', '页面切换和加载阶段使用的 cursor 值'],
	'site_theme_tweaks.cursorLoadingDark': ['深色加载态鼠标', '页面切换和加载阶段使用的 cursor 值'],
	'site_theme_tweaks.greetingMorningEndHour': ['早晨截止小时', '小时范围 1-23'],
	'site_theme_tweaks.greetingNoonEndHour': ['中午截止小时', '小时范围 1-23'],
	'site_theme_tweaks.greetingAfternoonEndHour': ['下午截止小时', '小时范围 1-23'],
	'site_theme_tweaks.greetingEveningEndHour': ['晚上截止小时', '小时范围 1-23'],
	'site_theme_tweaks.festivalStartDate': ['节日开始日期', '格式 MM-DD，例如 12-24'],
	'site_theme_tweaks.festivalEndDate': ['节日结束日期', '格式 MM-DD，例如 12-26'],
	'site_theme_tweaks.festivalDurationMs': ['节日动效时长(ms)', '动效显示时长，建议 600-8000'],
	'site_theme_tweaks.tocActiveOffset': ['目录高亮偏移', '滚动联动时的顶部偏移值'],
	'site_theme_tweaks.sidebarDefaultCollapsed': ['侧边栏默认收起', '是否默认关闭抽屉侧边栏'],
	'site_theme_tweaks.uptimeStartAt': ['站点起始时间', '用于页脚运行时长计时'],
	'site_integrations.giscus.repo': ['Giscus 仓库', '格式 owner/repo'],
	'site_integrations.giscus.repoId': ['Giscus Repo ID', '从 Giscus 配置页面复制'],
	'site_integrations.giscus.category': ['Giscus 分类名', '评论映射到的 Discussions 分类名'],
	'site_integrations.giscus.categoryId': ['Giscus 分类ID', '从 Giscus 配置页面复制'],
	'site_integrations.giscus.mapping': ['评论映射策略', '按 pathname/url/title 等映射评论主题'],
	'site_integrations.giscus.term': ['指定映射值', 'mapping=specific 时填写'],
	'site_integrations.giscus.lang': ['评论语言', '如 zh-CN / en'],
	'site_integrations.giscus.enableOnPosts': ['文章页启用', '文章详情页是否显示评论'],
	'site_integrations.giscus.enableOnPages': ['普通页启用', '非文章页是否显示评论'],
};

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function getByPath(obj, path) {
	return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setByPath(obj, path, value) {
	const parts = path.split('.');
	let cursor = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const key = parts[i];
		if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
		cursor = cursor[key];
	}
	cursor[parts[parts.length - 1]] = value;
}

function openModal({ title, bodyHtml, actionsHtml }) {
	if ($modalTitle) $modalTitle.textContent = title || '';
	if ($modalBody) $modalBody.innerHTML = bodyHtml || '';
	if ($modalActions) $modalActions.innerHTML = actionsHtml || '';
	if ($modal) $modal.hidden = false;
}

function closeModal() {
	if ($modal) $modal.hidden = true;
	if ($modalTitle) $modalTitle.textContent = '';
	if ($modalBody) $modalBody.innerHTML = '';
	if ($modalActions) $modalActions.innerHTML = '';
	pendingUploadFile = null;
	pendingRewardFile = null;
}

function safeBasename(fileName) {
	const base = fileName.replace(/\.[^/.]+$/, '');
	return base.trim().replace(/[\\/:*?"<>|]/g, '_');
}

function postMatches(p, q) {
	const hay = [
		p.slug,
		p.title,
		...(p.categories || []),
		p.description || '',
	].join(' ').toLowerCase();
	return hay.includes(q.toLowerCase());
}

function renderList() {
	const q = ($filter?.value ?? '').trim();
	const filtered = q ? posts.filter((p) => postMatches(p, q)) : posts;
	if ($count) $count.textContent = `显示 ${filtered.length} / ${posts.length}`;
	if (!$list) return;

	$list.innerHTML = filtered
		.map((p) => {
			const active = p.slug === activeSlug ? 'active' : '';
			const sub = [
				formatDate(p.pubDate),
				p.categories?.length ? p.categories.join(', ') : '未分类',
				p.draft ? '草稿' : '',
			]
				.filter(Boolean)
				.join(' · ');
			return `
				<div class="panel item ${active}" data-slug="${p.slug}">
					<div class="item-title">${p.title}</div>
					<div class="item-sub">${sub}</div>
					<div class="item-sub muted">${p.slug}</div>
				</div>
			`;
		})
		.join('');
}

function showAdminPage(page) {
	adminPage = page;
	document.querySelectorAll('[data-tree-item]').forEach((btn) => {
		const btnPage = btn.getAttribute('data-admin-page');
		const isSettingsTarget = btnPage === 'settings' && page === 'settings';
		btn.classList.toggle('active', btnPage === page && !isSettingsTarget);
	});
	document.querySelectorAll('[data-admin-page-panel]').forEach((panel) => {
		panel.hidden = panel.getAttribute('data-admin-page-panel') !== page;
	});
}

function setSettingsCardByTree(group, target, tab) {
	if (!group || !target) return;
	settingsActiveGroup = group;
	settingsCardState[group] = target;
	renderSettingsSingle();
	document.querySelectorAll('[data-tree-item][data-settings-card]').forEach((btn) => {
		const same = btn.getAttribute('data-settings-group') === group && btn.getAttribute('data-settings-card') === settingsCardState[group];
		btn.classList.toggle('active', same);
	});
}

async function loadPosts() {
	const resp = await fetch(baseUrl('/api/posts'));
	const data = await resp.json();
	posts = data.posts ?? [];
	const catsResp = await fetch(baseUrl('/api/categories'));
	if (catsResp.ok) {
		const catsData = await catsResp.json();
		categories = catsData.categories ?? [];
	} else {
		categories = [];
	}
	renderList();
}

function updateSettingsMeta() {
	if (!$settingsMeta || !settingsDraft) return;
	$settingsMeta.textContent = `保存时间：${formatDateTime(settingsDraft.savedAt)} · 生效时间：${formatDateTime(settingsDraft.publishedAt)}`;
}

function getFieldHelp(path) {
	const item = fieldHelpMap[path];
	if (!item) return { label: path, desc: '' };
	return { label: item[0], desc: item[1] };
}

function renderCardSwitcher(group, cards) {
	const safeCards = Array.isArray(cards) ? cards : [];
	const activeId = settingsCardState[group];
	const active = safeCards.some((item) => item.id === activeId) ? activeId : safeCards[0]?.id;
	const currentCard = safeCards.find((item) => item.id === active) || null;
	settingsCardState[group] = currentCard?.id || '';
	if (!currentCard) return '<div class="hint">暂无可编辑配置</div>';
	return `<section class="settings-card active" data-card-id="${currentCard.id}">
		<div class="settings-group-title">${currentCard.title}</div>
		${currentCard.desc ? `<div class="hint">${currentCard.desc}</div>` : ''}
		${currentCard.body}
	</section>`;
}

function renderFeatureRows(groupTitle, rows) {
	return `
		<div class="settings-group">
			<div class="settings-group-title">${groupTitle}</div>
			${rows
				.map(
					(item) => `
				<label class="settings-row">
					<div class="settings-switch">
						<input type="checkbox" data-settings-path="${item.key}" ${getByPath(settingsDraft, item.key) ? 'checked' : ''} />
						<span>${item.consume || item.key}</span>
					</div>
					<div class="muted settings-key">${item.key}</div>
					<div class="hint">默认值：${String(item.defaultValue)}；回滚：${item.rollback}</div>
				</label>
			`
				)
				.join('')}
		</div>
	`;
}

function buildSettingsFeaturesCards() {
	if (!settingsDraft || !settingsMeta) return [];
	const groups = ['视觉微调', '内容增强', '实用工具', '社交互动'].map((name) => ({
		id: `features-${name}`,
		title: name,
		desc: `该分组包含 ${name} 相关开关，建议逐项灰度开启。`,
		rows: settingsMeta.site_features.filter((item) => item.category === name),
	}));
	return groups.map((g) => ({
		id: g.id,
		title: g.title,
		desc: g.desc,
		body: renderFeatureRows(g.title, g.rows),
	}));
}

function buildSettingsTextsCards() {
	if (!settingsDraft) return [];
	const paths = [
		'site_texts.footerSignature',
		'site_texts.greetingMorning',
		'site_texts.greetingNoon',
		'site_texts.greetingAfternoon',
		'site_texts.greetingEvening',
		'site_texts.greetingNight',
		'site_texts.copyCode',
		'site_texts.copySuccess',
		'site_texts.copyFailed',
		'site_texts.mermaidFallback',
		'site_texts.sidebarTitle',
		'site_texts.sidebarStatusLabel',
		'site_texts.sidebarActivityLabel',
		'site_texts.sidebarStatusValue',
		'site_texts.sidebarActivityHint',
		'site_texts.randomPostLabel',
		'site_texts.notFoundRandomLabel',
		'site_texts.linksPageTitle',
		'site_texts.linksPageIntro',
	];
	const textBody = paths
		.map((path) => {
			const value = getByPath(settingsDraft, path) ?? '';
			const isLong = /Signature|Intro|Hint/.test(path);
			const help = getFieldHelp(path);
			return `
				<label class="settings-row">
					<div class="label">${help.label}</div>
					<div class="hint">${help.desc}</div>
					<div class="muted settings-key">${path}</div>
					${isLong ? `<textarea class="textarea" data-settings-path="${path}">${value}</textarea>` : `<input class="input" data-settings-path="${path}" value="${String(value).replaceAll('"', '&quot;')}" />`}
				</label>
			`;
		})
		.join('');

	const tweakPaths = [
		'site_theme_tweaks.viewTransitionDurationMs',
		'site_theme_tweaks.viewTransitionEasing',
		'site_theme_tweaks.cursorNormalLight',
		'site_theme_tweaks.cursorNormalDark',
		'site_theme_tweaks.cursorClickLight',
		'site_theme_tweaks.cursorClickDark',
		'site_theme_tweaks.cursorLoadingLight',
		'site_theme_tweaks.cursorLoadingDark',
		'site_theme_tweaks.greetingMorningEndHour',
		'site_theme_tweaks.greetingNoonEndHour',
		'site_theme_tweaks.greetingAfternoonEndHour',
		'site_theme_tweaks.greetingEveningEndHour',
		'site_theme_tweaks.festivalStartDate',
		'site_theme_tweaks.festivalEndDate',
		'site_theme_tweaks.festivalDurationMs',
		'site_theme_tweaks.tocActiveOffset',
		'site_theme_tweaks.uptimeStartAt',
	];
	const tweakBody = tweakPaths
		.map((path) => {
			const help = getFieldHelp(path);
			const value = getByPath(settingsDraft, path);
			const numberInput = /Duration|Offset|Hour/.test(path);
			return `<label class="settings-row"><div class="label">${help.label}</div><div class="hint">${help.desc}</div><div class="muted settings-key">${path}</div><input class="input" ${numberInput ? 'type="number"' : ''} data-settings-path="${path}" value="${String(value ?? '').replaceAll('"', '&quot;')}" /></label>`;
		})
		.join('');
	const collapseHelp = getFieldHelp('site_theme_tweaks.sidebarDefaultCollapsed');
	const collapseBody = `<label class="settings-row"><div class="label">${collapseHelp.label}</div><div class="hint">${collapseHelp.desc}</div><div class="muted settings-key">site_theme_tweaks.sidebarDefaultCollapsed</div><label class="settings-switch"><input type="checkbox" data-settings-path="site_theme_tweaks.sidebarDefaultCollapsed" ${getByPath(settingsDraft, 'site_theme_tweaks.sidebarDefaultCollapsed') ? 'checked' : ''} /><span>启用</span></label></label>`;
	const cursorUploaderBody = `
		<div class="settings-group">
			<div class="settings-group-title">鼠标皮肤上传</div>
			<div class="hint">上传后会自动重命名并覆盖到固定路径，可选择上传后直接推送仓库。</div>
			<div class="table">
				<div class="table-row">
					<div class="name">浅色-正常态</div>
					<div class="muted">normal/light</div>
					<div class="muted">当前：${String(getByPath(settingsDraft, 'site_theme_tweaks.cursorNormalLight') ?? 'auto')}</div>
					<div class="inline"><button class="btn" type="button" data-cursor-upload data-cursor-shape="normal" data-cursor-theme="light">上传</button></div>
				</div>
				<div class="table-row">
					<div class="name">浅色-点击态</div>
					<div class="muted">click/light</div>
					<div class="muted">当前：${String(getByPath(settingsDraft, 'site_theme_tweaks.cursorClickLight') ?? 'pointer')}</div>
					<div class="inline"><button class="btn" type="button" data-cursor-upload data-cursor-shape="click" data-cursor-theme="light">上传</button></div>
				</div>
				<div class="table-row">
					<div class="name">浅色-加载态</div>
					<div class="muted">loading/light</div>
					<div class="muted">当前：${String(getByPath(settingsDraft, 'site_theme_tweaks.cursorLoadingLight') ?? 'progress')}</div>
					<div class="inline"><button class="btn" type="button" data-cursor-upload data-cursor-shape="loading" data-cursor-theme="light">上传</button></div>
				</div>
				<div class="table-row">
					<div class="name">深色-正常态</div>
					<div class="muted">normal/dark</div>
					<div class="muted">当前：${String(getByPath(settingsDraft, 'site_theme_tweaks.cursorNormalDark') ?? 'auto')}</div>
					<div class="inline"><button class="btn" type="button" data-cursor-upload data-cursor-shape="normal" data-cursor-theme="dark">上传</button></div>
				</div>
				<div class="table-row">
					<div class="name">深色-点击态</div>
					<div class="muted">click/dark</div>
					<div class="muted">当前：${String(getByPath(settingsDraft, 'site_theme_tweaks.cursorClickDark') ?? 'pointer')}</div>
					<div class="inline"><button class="btn" type="button" data-cursor-upload data-cursor-shape="click" data-cursor-theme="dark">上传</button></div>
				</div>
				<div class="table-row">
					<div class="name">深色-加载态</div>
					<div class="muted">loading/dark</div>
					<div class="muted">当前：${String(getByPath(settingsDraft, 'site_theme_tweaks.cursorLoadingDark') ?? 'progress')}</div>
					<div class="inline"><button class="btn" type="button" data-cursor-upload data-cursor-shape="loading" data-cursor-theme="dark">上传</button></div>
				</div>
			</div>
		</div>
	`;
	return [
		{ id: 'texts-文案配置', title: '文案配置', desc: '用于页面文案与提示信息配置。', body: `<div class="settings-group">${textBody}</div>` },
		{ id: 'texts-视觉参数', title: '视觉参数', desc: '用于动画、光标、时段边界等参数配置。', body: `<div class="settings-group">${tweakBody}${collapseBody}</div>${cursorUploaderBody}` },
	];
}

function buildSettingsIntegrationsCards() {
	if (!settingsDraft) return [];
	const giscusFields = [
		'site_integrations.giscus.repo',
		'site_integrations.giscus.repoId',
		'site_integrations.giscus.category',
		'site_integrations.giscus.categoryId',
		'site_integrations.giscus.mapping',
		'site_integrations.giscus.term',
		'site_integrations.giscus.lang',
	];
	const giscusBody = giscusFields
		.map((path) => {
			const help = getFieldHelp(path);
			if (path === 'site_integrations.giscus.mapping') {
				return `<label class="settings-row"><div class="label">${help.label}</div><div class="hint">${help.desc}</div><div class="muted settings-key">${path}</div><select class="select" data-settings-path="${path}"><option value="pathname">pathname</option><option value="url">url</option><option value="title">title</option><option value="og:title">og:title</option><option value="specific">specific</option><option value="number">number</option></select></label>`;
			}
			return `<label class="settings-row"><div class="label">${help.label}</div><div class="hint">${help.desc}</div><div class="muted settings-key">${path}</div><input class="input" data-settings-path="${path}" value="${String(getByPath(settingsDraft, path) ?? '').replaceAll('"', '&quot;')}" /></label>`;
		})
		.join('');
	const enablePostsHelp = getFieldHelp('site_integrations.giscus.enableOnPosts');
	const enablePagesHelp = getFieldHelp('site_integrations.giscus.enableOnPages');
	const cards = [
		{
			id: 'integrations-giscus',
			title: 'Giscus 评论',
			desc: '配置 GitHub Discussions 评论系统。',
			body: `<div class="settings-group">${giscusBody}
				<label class="settings-row"><div class="label">${enablePostsHelp.label}</div><div class="hint">${enablePostsHelp.desc}</div><div class="muted settings-key">site_integrations.giscus.enableOnPosts</div><label class="settings-switch"><input type="checkbox" data-settings-path="site_integrations.giscus.enableOnPosts" ${getByPath(settingsDraft, 'site_integrations.giscus.enableOnPosts') ? 'checked' : ''} /><span>启用</span></label></label>
				<label class="settings-row"><div class="label">${enablePagesHelp.label}</div><div class="hint">${enablePagesHelp.desc}</div><div class="muted settings-key">site_integrations.giscus.enableOnPages</div><label class="settings-switch"><input type="checkbox" data-settings-path="site_integrations.giscus.enableOnPages" ${getByPath(settingsDraft, 'site_integrations.giscus.enableOnPages') ? 'checked' : ''} /><span>启用</span></label></label>
			</div>`,
		},
	];
	(getByPath(settingsDraft, 'site_integrations.links') || []).forEach((item, idx) => {
		cards.push({
			id: `integrations-link-${idx}`,
			title: `链接项 ${idx + 1}`,
			desc: '用于链接/数字名片页面展示，按 order 升序。',
			body: `<div class="settings-group">
				<label class="settings-row"><div class="label">唯一标识</div><div class="hint">系统内唯一 key，建议英文</div><div class="muted settings-key">site_integrations.links.${idx}.id</div><input class="input" data-settings-path="site_integrations.links.${idx}.id" value="${item.id}" /></label>
				<label class="settings-row"><div class="label">显示名称</div><div class="hint">页面上展示的名称</div><div class="muted settings-key">site_integrations.links.${idx}.label</div><input class="input" data-settings-path="site_integrations.links.${idx}.label" value="${item.label}" /></label>
				<label class="settings-row"><div class="label">链接地址</div><div class="hint">支持 http(s)、mailto、站内路径</div><div class="muted settings-key">site_integrations.links.${idx}.url</div><input class="input" data-settings-path="site_integrations.links.${idx}.url" value="${item.url}" /></label>
				<label class="settings-row"><div class="label">图标标识</div><div class="hint">用于后续图标映射（如 github/rss/mail）</div><div class="muted settings-key">site_integrations.links.${idx}.icon</div><input class="input" data-settings-path="site_integrations.links.${idx}.icon" value="${item.icon}" /></label>
				<label class="settings-row"><div class="label">排序值</div><div class="hint">数字越小越靠前</div><div class="muted settings-key">site_integrations.links.${idx}.order</div><input class="input" type="number" data-settings-path="site_integrations.links.${idx}.order" value="${item.order}" /></label>
			</div>`,
		});
	});
	return cards;
}

function syncInputToDraft(target) {
	const path = target.getAttribute('data-settings-path');
	if (!path || !settingsDraft) return;
	if (target instanceof HTMLInputElement && target.type === 'checkbox') {
		setByPath(settingsDraft, path, target.checked);
		return;
	}
	if (target instanceof HTMLInputElement && target.type === 'number') {
		setByPath(settingsDraft, path, Number(target.value || 0));
		return;
	}
	if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
		setByPath(settingsDraft, path, target.value);
	}
}

function renderSettingsSingle() {
	if (!$settingsSingle || !settingsDraft) return;
	const allCards = {
		features: buildSettingsFeaturesCards(),
		texts: buildSettingsTextsCards(),
		integrations: buildSettingsIntegrationsCards(),
	};
	const group = settingsActiveGroup in allCards ? settingsActiveGroup : 'features';
	const activeGroup = allCards[group].length ? group : 'features';
	$settingsSingle.innerHTML = renderCardSwitcher(activeGroup, allCards[activeGroup]);
	const mappingSelect = $settingsSingle.querySelector('select[data-settings-path="site_integrations.giscus.mapping"]');
	if (mappingSelect) mappingSelect.value = getByPath(settingsDraft, 'site_integrations.giscus.mapping');
}

function renderSettingsAll() {
	renderSettingsSingle();
	updateSettingsMeta();
}

async function loadSiteSettings() {
	const resp = await fetch(baseUrl('/api/site-settings'));
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'load_site_settings_failed');
	settingsDraft = clone(data.settings);
	settingsMeta = data.meta || null;
	renderSettingsAll();
}

async function saveSiteSettings() {
	const resp = await fetch(baseUrl('/api/site-settings/save'), {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ settings: settingsDraft }),
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'save_site_settings_failed');
	settingsDraft = clone(data.settings);
	renderSettingsAll();
}

async function publishSiteSettings() {
	const resp = await fetch(baseUrl('/api/site-settings/publish'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({}),
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'publish_site_settings_failed');
	settingsDraft = clone(data.settings);
	renderSettingsAll();
}

async function loadPost(slug) {
	activeSlug = slug;
	renderList();

	const resp = await fetch(baseUrl(`/api/posts/${encodeURIComponent(slug)}`));
	if (!resp.ok) return;
	const data = await resp.json();

	const title = data.frontmatter?.title || slug;
	const pub = data.frontmatter?.pubDate ? formatDate(data.frontmatter.pubDate) : '';
	const upd = data.frontmatter?.updatedDate ? formatDate(data.frontmatter.updatedDate) : '';
	const categories = Array.isArray(data.frontmatter?.categories) ? data.frontmatter.categories : [];

	if ($vTitle) $vTitle.textContent = title;
	if ($vSub) {
		const parts = [];
		if (pub) parts.push(`发布：${pub}`);
		if (upd) parts.push(`更新：${upd}`);
		parts.push(`分类：${categories.length ? categories.join(', ') : '未分类'}`);
		$vSub.textContent = parts.join(' · ');
	}

	if ($raw) $raw.textContent = data.raw || '';
	if ($editCategories) {
		$editCategories.disabled = false;
		$editCategories.value = categories.join(', ');
	}
	$saveCategories && ($saveCategories.disabled = false);

	$delete && ($delete.disabled = false);
	$openSite && ($openSite.disabled = false);

	const previewResp = await fetch(baseUrl('/api/preview'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ markdown: data.content || '' }),
	});
	const previewData = await previewResp.json();
	if ($preview) $preview.innerHTML = previewData.html || '';
}

async function saveCategories(slug, categoriesRaw) {
	const resp = await fetch(baseUrl(`/api/posts/${encodeURIComponent(slug)}/categories`), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ categories: categoriesRaw }),
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'save_failed');
}

async function uploadMd(file) {
	const form = new FormData();
	form.append('file', file);
	const title = $('upload-title')?.value?.trim?.() ?? '';
	const categories = $('upload-categories')?.value?.trim?.() ?? '';
	const description = $('upload-description')?.value?.trim?.() ?? '';
	if (title) form.append('title', title);
	if (categories) form.append('categories', categories);
	if (description) form.append('description', description);
	const resp = await fetch(baseUrl('/api/posts/upload'), { method: 'POST', body: form });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'upload_failed');
	await loadPosts();
	if (data.slug) await loadPost(data.slug);
	return data;
}

async function uploadReward(file) {
	const form = new FormData();
	form.append('file', file);
	const resp = await fetch(baseUrl('/api/reward-image'), { method: 'POST', body: form });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'upload_failed');
	return data;
}

async function uploadCursorSkin(file, shape, theme) {
	const form = new FormData();
	form.append('file', file);
	form.append('shape', shape);
	form.append('theme', theme);
	const resp = await fetch(baseUrl('/api/cursor-skins'), { method: 'POST', body: form });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'upload_cursor_skin_failed');
	if (data?.settings) settingsDraft = clone(data.settings);
	return data;
}

$list?.addEventListener('click', (e) => {
	const el = e.target?.closest?.('[data-slug]');
	const slug = el?.getAttribute?.('data-slug');
	if (!slug) return;
	loadPost(slug);
});

$filter?.addEventListener('input', () => renderList());

$refresh?.addEventListener('click', () => loadPosts());

$editCategories?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $saveCategories?.click();
});

$saveCategories?.addEventListener('click', async () => {
	if (!activeSlug) return;
	try {
		const value = $editCategories?.value ?? '';
		await saveCategories(activeSlug, value);
		await loadPosts();
		await loadPost(activeSlug);
	} catch (e) {
		alert(String(e?.message || e));
	}
});

$modalBackdrop?.addEventListener('click', () => closeModal());
$modalClose?.addEventListener('click', () => closeModal());
window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeModal();
});

function showUploadModal(file) {
	pendingUploadFile = file;
	const slug = safeBasename(file.name);
	const chips = categories
		.filter((c) => c.name && c.name !== '未分类')
		.map(
			(c) =>
				`<button class="btn" type="button" data-cat="${c.name}">${c.name} (${c.count})</button>`
		)
		.join('');
	openModal({
		title: '确认上传',
		bodyHtml: `
			<div class="row">
				<div class="label">文件</div>
				<div class="muted">${file.name}</div>
				<div class="hint">Slug 将保存为：${slug}.md</div>
			</div>
			<div class="row">
				<div class="label">标题</div>
				<input class="input" id="upload-title" placeholder="留空则使用文章 frontmatter 或文件名" />
			</div>
			<div class="row">
				<div class="label">描述</div>
				<textarea class="textarea" id="upload-description" placeholder="可留空"></textarea>
				<div class="hint">留空则保持文章原描述。</div>
			</div>
			<div class="row">
				<div class="label">分类</div>
				<input class="input" id="upload-categories" placeholder="多个分类用逗号分隔，例如：技术, 随笔" />
				<div class="inline" id="cat-chips">${chips || '<div class="muted">暂无已有分类</div>'}</div>
				<div class="hint">留空则保持文章原分类；若文章无分类则为未分类。</div>
			</div>
			<div class="row">
				<label class="inline muted">
					<input type="checkbox" id="upload-autopublish" />
					上传后自动发布到 GitHub（会执行 git commit + git push）
				</label>
				<div class="hint">线上站点是静态的，必须 push 到 GitHub 并部署后才会更新。</div>
			</div>
		`,
		actionsHtml: `
			<button class="btn" id="upload-cancel" type="button">取消</button>
			<button class="btn" id="upload-confirm" type="button">确认上传</button>
		`,
	});
	$('upload-cancel')?.addEventListener('click', () => closeModal());
	$('cat-chips')?.addEventListener('click', (ev) => {
		const btn = ev.target?.closest?.('button[data-cat]');
		const cat = btn?.getAttribute?.('data-cat') ?? '';
		if (!cat) return;
		const input = $('upload-categories');
		if (!input) return;
		const parts = input.value
			.split(/[,，]/g)
			.map((c) => c.trim())
			.filter(Boolean);
		const has = parts.includes(cat);
		const next = has ? parts.filter((c) => c !== cat) : [...parts, cat];
		input.value = Array.from(new Set(next)).join(', ');
	});
	$('upload-confirm')?.addEventListener('click', async () => {
		if (!pendingUploadFile) return;
		try {
			const autoPublish = $('upload-autopublish')?.checked ?? false;
			const data = await uploadMd(pendingUploadFile);
			closeModal();
			if (autoPublish) {
				await publishSite();
				if (data?.slug) await loadPost(data.slug);
			}
		} catch (e) {
			alert(String(e?.message || e));
		}
	});
}

$uploadMd?.addEventListener('change', async (e) => {
	const file = e.target.files?.[0];
	if (!file) return;
	try {
		await loadPosts();
		showUploadModal(file);
	} finally {
		e.target.value = '';
	}
});

$uploadReward?.addEventListener('change', async (e) => {
	const file = e.target.files?.[0];
	if (!file) return;
	try {
		showRewardUploadModal(file);
	} finally {
		e.target.value = '';
	}
});

function showRewardUploadModal(file) {
	pendingRewardFile = file;
	openModal({
		title: '上传打赏图',
		bodyHtml: `
			<div class="row">
				<div class="label">文件</div>
				<div class="muted">${file.name}</div>
				<div class="hint">上传后会覆盖原打赏图（仓库里只保留一个 reward.* 文件）。</div>
			</div>
			<div class="row">
				<label class="inline muted">
					<input type="checkbox" id="reward-autopublish" checked />
					上传后自动发布到 GitHub（会执行 git commit + git push）
				</label>
			</div>
		`,
		actionsHtml: `
			<button class="btn" id="reward-cancel" type="button">取消</button>
			<button class="btn" id="reward-confirm" type="button">确认上传</button>
		`,
	});
	$('reward-cancel')?.addEventListener('click', () => closeModal());
	$('reward-confirm')?.addEventListener('click', async () => {
		if (!pendingRewardFile) return;
		try {
			const autoPublish = $('reward-autopublish')?.checked ?? false;
			await uploadReward(pendingRewardFile);
			closeModal();
			if (autoPublish) await publishSite();
		} catch (e2) {
			alert(String(e2?.message || e2));
		}
	});
}

function showCursorUploadModal(shape, theme) {
	const shapeLabel = shape === 'normal' ? '正常态' : shape === 'click' ? '点击态' : '加载态';
	const themeLabel = theme === 'light' ? '浅色主题' : '深色主题';
	openModal({
		title: '上传鼠标皮肤',
		bodyHtml: `
			<div class="row">
				<div class="label">目标槽位</div>
				<div class="muted">${themeLabel} / ${shapeLabel}</div>
				<div class="hint">文件会自动重命名为 cursor-${shape}-${theme}.* 并覆盖同槽位旧文件。</div>
			</div>
			<div class="row">
				<div class="label">选择文件</div>
				<input class="input" id="cursor-upload-file" type="file" accept="image/*,.cur,.ani" />
			</div>
			<div class="row">
				<label class="inline muted">
					<input type="checkbox" id="cursor-autopublish" />
					上传后自动发布到 GitHub（会执行 git commit + git push）
				</label>
			</div>
		`,
		actionsHtml: `
			<button class="btn" id="cursor-upload-cancel" type="button">取消</button>
			<button class="btn" id="cursor-upload-confirm" type="button">确认上传</button>
		`,
	});
	$('cursor-upload-cancel')?.addEventListener('click', () => closeModal());
	$('cursor-upload-confirm')?.addEventListener('click', async () => {
		const file = $('cursor-upload-file')?.files?.[0];
		if (!file) return alert('请先选择鼠标皮肤文件');
		try {
			const autoPublish = $('cursor-autopublish')?.checked ?? false;
			await uploadCursorSkin(file, shape, theme);
			closeModal();
			renderSettingsAll();
			if (autoPublish) await publishSite();
		} catch (e) {
			alert(String(e?.message || e));
		}
	});
}

document.querySelectorAll('[data-tree-item]').forEach((btn) => {
	btn.addEventListener('click', () => {
		const page = btn.getAttribute('data-admin-page');
		if (!page) return;
		showAdminPage(page);
		const group = btn.getAttribute('data-settings-group');
		const target = btn.getAttribute('data-settings-card');
		if (group && target) setSettingsCardByTree(group, target);
	});
});

document.querySelectorAll('[data-tree-toggle]').forEach((btn) => {
	btn.addEventListener('click', () => {
		const node = btn.closest('[data-tree-node]');
		if (!(node instanceof HTMLElement)) return;
		const open = node.dataset.open !== '0';
		node.dataset.open = open ? '0' : '1';
	});
});

[$settingsSingle].forEach((el) => {
	el?.addEventListener('click', (ev) => {
		const uploadBtn = ev.target?.closest?.('[data-cursor-upload]');
		if (!uploadBtn) return;
		const shape = uploadBtn.getAttribute('data-cursor-shape');
		const theme = uploadBtn.getAttribute('data-cursor-theme');
		if (!shape || !theme) return;
		showCursorUploadModal(shape, theme);
	});
	el?.addEventListener('input', (ev) => syncInputToDraft(ev.target));
	el?.addEventListener('change', (ev) => syncInputToDraft(ev.target));
});

$settingsPreview?.addEventListener('click', () => {
	if (!settingsDraft) return;
	openModal({
		title: '配置预览',
		bodyHtml: `<pre class="code">${JSON.stringify(settingsDraft, null, 2)}</pre>`,
		actionsHtml: `<button class="btn" id="settings-preview-close" type="button">关闭</button>`,
	});
	$('settings-preview-close')?.addEventListener('click', () => closeModal());
});

$settingsSave?.addEventListener('click', async () => {
	try {
		await saveSiteSettings();
		alert('配置草稿已保存');
	} catch (e) {
		alert(String(e?.message || e));
	}
});

$settingsPublish?.addEventListener('click', async () => {
	try {
		await saveSiteSettings();
		await publishSiteSettings();
		const publishResult = await publishSite({ silent: true });
		if (publishResult === 'no_changes') {
			alert('配置已发布，但仓库无新增变更可推送。');
			return;
		}
		alert('配置已发布并自动推送，等待 Actions 部署完成即可更新线上站点。');
	} catch (e) {
		alert(String(e?.message || e));
	}
});

$delete?.addEventListener('click', async () => {
	if (!activeSlug) return;
	const ok = confirm(`确认删除：${activeSlug} ？`);
	if (!ok) return;
	const resp = await fetch(baseUrl(`/api/posts/${encodeURIComponent(activeSlug)}`), {
		method: 'DELETE',
	});
	const data = await resp.json();
	if (!resp.ok) alert(data.error || 'delete_failed');
	activeSlug = '';
	$vTitle && ($vTitle.textContent = '请选择一篇文章');
	$vSub && ($vSub.textContent = '');
	$raw && ($raw.textContent = '');
	$preview && ($preview.innerHTML = '');
	$delete && ($delete.disabled = true);
	$openSite && ($openSite.disabled = true);
	$editCategories && ($editCategories.value = '');
	$editCategories && ($editCategories.disabled = true);
	$saveCategories && ($saveCategories.disabled = true);
	await loadPosts();
});

$openSite?.addEventListener('click', () => {
	if (!activeSlug) return;
	const url = `http://localhost:4321/posts/${encodeURIComponent(activeSlug)}`;
	window.open(url, '_blank', 'noopener,noreferrer');
});

async function publishSite(options = {}) {
	const silent = Boolean(options.silent);
	const resp = await fetch(baseUrl('/api/publish'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({}),
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'publish_failed');
	if (data.message === 'no_changes') {
		if (!silent) alert('没有需要发布的改动');
		return data.message;
	}
	if (!silent) alert('已提交并推送到 GitHub，等待 Actions 部署完成即可更新线上站点');
	return data.message || 'ok';
}

$publish?.addEventListener('click', async () => {
	try {
		await publishSite();
	} catch (e) {
		alert(String(e?.message || e));
	}
});

$manageCategories?.addEventListener('click', async () => {
	await loadPosts();
	const rows = categories
		.map(
			(c) => `
				<div class="table-row" data-name="${c.name}">
					<div class="name">${c.name}</div>
					<div class="count">${c.count}</div>
					<input class="input" data-rename placeholder="新分类名（留空=未分类）" />
					<div class="inline">
						<button class="btn" data-action="rename" type="button">重命名</button>
						<button class="btn danger" data-action="delete" type="button">删除分类</button>
					</div>
				</div>
			`
		)
		.join('');
	openModal({
		title: '分类管理',
		bodyHtml: `
			<div class="hint">重命名会批量修改所有文章的 frontmatter 分类字段；删除分类会把对应文章设为未分类。</div>
			<div class="table">${rows || '<div class="muted">暂无分类</div>'}</div>
		`,
		actionsHtml: `<button class="btn" id="cat-close" type="button">关闭</button>`,
	});
	$('cat-close')?.addEventListener('click', () => closeModal());
	$modalBody?.addEventListener('click', async (ev) => {
		const btn = ev.target?.closest?.('button[data-action]');
		if (!btn) return;
		const row = btn.closest?.('.table-row');
		const name = row?.getAttribute?.('data-name') ?? '';
		if (!name) return;
		const action = btn.getAttribute('data-action');
		if (action === 'rename') {
			const to = row.querySelector?.('input[data-rename]')?.value?.trim?.() ?? '';
			const ok = confirm(`确认把分类「${name}」重命名为「${to || '未分类'}」？`);
			if (!ok) return;
			const resp = await fetch(baseUrl('/api/categories/rename'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ from: name, to }),
			});
			const data = await resp.json();
			if (!resp.ok) return alert(data.error || 'rename_failed');
			await loadPosts();
			alert(`已修改 ${data.changed ?? 0} 篇文章`);
			closeModal();
		}
		if (action === 'delete') {
			const ok = confirm(`确认删除分类「${name}」？将把对应文章设为未分类。`);
			if (!ok) return;
			const resp = await fetch(baseUrl(`/api/categories/${encodeURIComponent(name)}`), {
				method: 'DELETE',
			});
			const data = await resp.json();
			if (!resp.ok) return alert(data.error || 'delete_failed');
			await loadPosts();
			alert(`已修改 ${data.changed ?? 0} 篇文章`);
			closeModal();
		}
	});
});

await Promise.all([loadPosts(), loadSiteSettings()]);
showAdminPage(adminPage);
