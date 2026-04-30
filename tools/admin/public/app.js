const $ = (id) => document.getElementById(id);

const $list = $('list');
const $filter = $('filter');
const $count = $('count');
const $uploadMd = $('upload-md');
const $uploadStart = $('upload-start');
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
const $startList = $('start-list');
const $settingsMeta = $('settings-meta');
const $settingsPreview = $('settings-preview');
const $settingsSave = $('settings-save');
const $settingsPublish = $('settings-publish');
const $settingsFeatures = $('settings-features');
const $settingsTexts = $('settings-texts');
const $settingsIntegrations = $('settings-integrations');

let posts = [];
let activeSlug = '';
let categories = [];
let pendingUploadFile = null;
let pendingRewardFile = null;
let pendingStartFile = null;
let startImages = [];
let settingsDraft = null;
let settingsMeta = null;
let settingsActiveTab = 'features';

const baseUrl = (path) => `${path}`;
const formatDate = (s) => (s ? new Date(s).toLocaleDateString('zh-CN') : '');
const formatDateTime = (s) => (s ? new Date(s).toLocaleString('zh-CN') : '—');

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
	pendingStartFile = null;
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

function renderStartAssets() {
	if (!$startList) return;
	if (!startImages.length) {
		$startList.innerHTML = '<div class="muted">暂无启动图，请先上传。</div>';
		return;
	}
	$startList.innerHTML = startImages
		.map(
			(item) => `
				<div class="panel start-item" data-name="${item.name}">
					<img class="start-thumb" src="${item.path}" alt="${item.name}" loading="lazy" />
					<div class="start-meta">
						<div class="start-name">${item.name}</div>
						<div class="muted start-sub">${new Date(item.updatedAt).toLocaleString('zh-CN')}</div>
					</div>
					<div class="start-actions">
						<button class="btn danger" data-action="delete-start" type="button">删除</button>
					</div>
				</div>
			`
		)
		.join('');
}

function updateSettingsMeta() {
	if (!$settingsMeta || !settingsDraft) return;
	$settingsMeta.textContent = `保存时间：${formatDateTime(settingsDraft.savedAt)} · 生效时间：${formatDateTime(settingsDraft.publishedAt)}`;
}

function renderFeatureRows(groupTitle, rows) {
	return `
		<div class="settings-group">
			<div class="settings-group-title">${groupTitle}</div>
			${rows
				.map(
					(item) => `
				<label class="settings-row">
					<label class="settings-switch">
						<input type="checkbox" data-settings-path="${item.key}" ${getByPath(settingsDraft, item.key) ? 'checked' : ''} />
						<span>${item.key}</span>
					</label>
					<div class="hint">默认值：${String(item.defaultValue)}；回滚：${item.rollback}</div>
				</label>
			`
				)
				.join('')}
		</div>
	`;
}

function renderSettingsFeatures() {
	if (!$settingsFeatures || !settingsDraft || !settingsMeta) return;
	const groups = ['视觉微调', '内容增强', '实用工具', '社交互动'].map((name) => ({
		name,
		rows: settingsMeta.site_features.filter((item) => item.category === name),
	}));
	$settingsFeatures.innerHTML = groups.map((g) => renderFeatureRows(g.name, g.rows)).join('');
}

function renderSettingsTexts() {
	if (!$settingsTexts || !settingsDraft) return;
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
	$settingsTexts.innerHTML = `
		<div class="settings-group">
			<div class="settings-group-title">文案配置</div>
			${paths
				.map((path) => {
					const value = getByPath(settingsDraft, path) ?? '';
					const isLong = /Signature|Intro|Hint/.test(path);
					return `
						<label class="settings-row">
							<div class="label">${path}</div>
							${isLong ? `<textarea class="textarea" data-settings-path="${path}">${value}</textarea>` : `<input class="input" data-settings-path="${path}" value="${value.replaceAll('"', '&quot;')}" />`}
						</label>
					`;
				})
				.join('')}
		</div>
		<div class="settings-group">
			<div class="settings-group-title">视觉参数</div>
			<label class="settings-row"><div class="label">site_theme_tweaks.viewTransitionDurationMs</div><input class="input" type="number" data-settings-path="site_theme_tweaks.viewTransitionDurationMs" value="${getByPath(settingsDraft, 'site_theme_tweaks.viewTransitionDurationMs')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.viewTransitionEasing</div><input class="input" data-settings-path="site_theme_tweaks.viewTransitionEasing" value="${getByPath(settingsDraft, 'site_theme_tweaks.viewTransitionEasing')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.cursorLight</div><input class="input" data-settings-path="site_theme_tweaks.cursorLight" value="${getByPath(settingsDraft, 'site_theme_tweaks.cursorLight')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.cursorDark</div><input class="input" data-settings-path="site_theme_tweaks.cursorDark" value="${getByPath(settingsDraft, 'site_theme_tweaks.cursorDark')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.greetingMorningEndHour</div><input class="input" type="number" data-settings-path="site_theme_tweaks.greetingMorningEndHour" value="${getByPath(settingsDraft, 'site_theme_tweaks.greetingMorningEndHour')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.greetingNoonEndHour</div><input class="input" type="number" data-settings-path="site_theme_tweaks.greetingNoonEndHour" value="${getByPath(settingsDraft, 'site_theme_tweaks.greetingNoonEndHour')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.greetingAfternoonEndHour</div><input class="input" type="number" data-settings-path="site_theme_tweaks.greetingAfternoonEndHour" value="${getByPath(settingsDraft, 'site_theme_tweaks.greetingAfternoonEndHour')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.greetingEveningEndHour</div><input class="input" type="number" data-settings-path="site_theme_tweaks.greetingEveningEndHour" value="${getByPath(settingsDraft, 'site_theme_tweaks.greetingEveningEndHour')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.festivalStartDate</div><input class="input" data-settings-path="site_theme_tweaks.festivalStartDate" value="${getByPath(settingsDraft, 'site_theme_tweaks.festivalStartDate')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.festivalEndDate</div><input class="input" data-settings-path="site_theme_tweaks.festivalEndDate" value="${getByPath(settingsDraft, 'site_theme_tweaks.festivalEndDate')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.festivalDurationMs</div><input class="input" type="number" data-settings-path="site_theme_tweaks.festivalDurationMs" value="${getByPath(settingsDraft, 'site_theme_tweaks.festivalDurationMs')}" /></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.tocActiveOffset</div><input class="input" type="number" data-settings-path="site_theme_tweaks.tocActiveOffset" value="${getByPath(settingsDraft, 'site_theme_tweaks.tocActiveOffset')}" /></label>
			<label class="settings-switch"><input type="checkbox" data-settings-path="site_theme_tweaks.sidebarDefaultCollapsed" ${getByPath(settingsDraft, 'site_theme_tweaks.sidebarDefaultCollapsed') ? 'checked' : ''} /><span>site_theme_tweaks.sidebarDefaultCollapsed</span></label>
			<label class="settings-row"><div class="label">site_theme_tweaks.uptimeStartAt</div><input class="input" data-settings-path="site_theme_tweaks.uptimeStartAt" value="${getByPath(settingsDraft, 'site_theme_tweaks.uptimeStartAt')}" /></label>
		</div>
	`;
}

function renderSettingsIntegrations() {
	if (!$settingsIntegrations || !settingsDraft) return;
	const linksRows = (getByPath(settingsDraft, 'site_integrations.links') || [])
		.map(
			(item, idx) => `
		<div class="settings-group">
			<div class="settings-group-title">链接项 ${idx + 1}</div>
			<label class="settings-row"><div class="label">id</div><input class="input" data-settings-path="site_integrations.links.${idx}.id" value="${item.id}" /></label>
			<label class="settings-row"><div class="label">label</div><input class="input" data-settings-path="site_integrations.links.${idx}.label" value="${item.label}" /></label>
			<label class="settings-row"><div class="label">url</div><input class="input" data-settings-path="site_integrations.links.${idx}.url" value="${item.url}" /></label>
			<label class="settings-row"><div class="label">icon</div><input class="input" data-settings-path="site_integrations.links.${idx}.icon" value="${item.icon}" /></label>
			<label class="settings-row"><div class="label">order</div><input class="input" type="number" data-settings-path="site_integrations.links.${idx}.order" value="${item.order}" /></label>
		</div>`
		)
		.join('');
	$settingsIntegrations.innerHTML = `
		<div class="settings-group">
			<div class="settings-group-title">Giscus 评论</div>
			<label class="settings-row"><div class="label">site_integrations.giscus.repo</div><input class="input" data-settings-path="site_integrations.giscus.repo" value="${getByPath(settingsDraft, 'site_integrations.giscus.repo')}" /></label>
			<label class="settings-row"><div class="label">site_integrations.giscus.repoId</div><input class="input" data-settings-path="site_integrations.giscus.repoId" value="${getByPath(settingsDraft, 'site_integrations.giscus.repoId')}" /></label>
			<label class="settings-row"><div class="label">site_integrations.giscus.category</div><input class="input" data-settings-path="site_integrations.giscus.category" value="${getByPath(settingsDraft, 'site_integrations.giscus.category')}" /></label>
			<label class="settings-row"><div class="label">site_integrations.giscus.categoryId</div><input class="input" data-settings-path="site_integrations.giscus.categoryId" value="${getByPath(settingsDraft, 'site_integrations.giscus.categoryId')}" /></label>
			<label class="settings-row"><div class="label">site_integrations.giscus.mapping</div><select class="select" data-settings-path="site_integrations.giscus.mapping"><option value="pathname">pathname</option><option value="url">url</option><option value="title">title</option><option value="og:title">og:title</option><option value="specific">specific</option><option value="number">number</option></select></label>
			<label class="settings-row"><div class="label">site_integrations.giscus.term</div><input class="input" data-settings-path="site_integrations.giscus.term" value="${getByPath(settingsDraft, 'site_integrations.giscus.term')}" /></label>
			<label class="settings-row"><div class="label">site_integrations.giscus.lang</div><input class="input" data-settings-path="site_integrations.giscus.lang" value="${getByPath(settingsDraft, 'site_integrations.giscus.lang')}" /></label>
			<label class="settings-switch"><input type="checkbox" data-settings-path="site_integrations.giscus.enableOnPosts" ${getByPath(settingsDraft, 'site_integrations.giscus.enableOnPosts') ? 'checked' : ''} /><span>文章页启用评论</span></label>
			<label class="settings-switch"><input type="checkbox" data-settings-path="site_integrations.giscus.enableOnPages" ${getByPath(settingsDraft, 'site_integrations.giscus.enableOnPages') ? 'checked' : ''} /><span>普通页面启用评论</span></label>
		</div>
		${linksRows}
	`;
	const mappingSelect = $settingsIntegrations.querySelector('select[data-settings-path="site_integrations.giscus.mapping"]');
	if (mappingSelect) mappingSelect.value = getByPath(settingsDraft, 'site_integrations.giscus.mapping');
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

function showSettingsTab(tab) {
	settingsActiveTab = tab;
	document.querySelectorAll('.settings-tab').forEach((el) => {
		el.classList.toggle('active', el.getAttribute('data-settings-tab') === tab);
	});
	$settingsFeatures && ($settingsFeatures.hidden = tab !== 'features');
	$settingsTexts && ($settingsTexts.hidden = tab !== 'texts');
	$settingsIntegrations && ($settingsIntegrations.hidden = tab !== 'integrations');
}

function renderSettingsAll() {
	renderSettingsFeatures();
	renderSettingsTexts();
	renderSettingsIntegrations();
	updateSettingsMeta();
	showSettingsTab(settingsActiveTab);
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

async function loadStartAssets() {
	const resp = await fetch(baseUrl('/api/start-assets'));
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'load_start_assets_failed');
	startImages = Array.isArray(data.images) ? data.images : [];
	renderStartAssets();
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

async function uploadStart(file) {
	const form = new FormData();
	form.append('file', file);
	const resp = await fetch(baseUrl('/api/start-assets/upload'), { method: 'POST', body: form });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'upload_failed');
	return data;
}

async function deleteStart(name) {
	const resp = await fetch(baseUrl(`/api/start-assets/${encodeURIComponent(name)}`), {
		method: 'DELETE',
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'delete_failed');
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
$refresh?.addEventListener('click', () => loadStartAssets());

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

$uploadStart?.addEventListener('change', async (e) => {
	const file = e.target.files?.[0];
	if (!file) return;
	try {
		showStartUploadModal(file);
	} finally {
		e.target.value = '';
	}
});

function showStartUploadModal(file) {
	pendingStartFile = file;
	openModal({
		title: '上传首页启动图',
		bodyHtml: `
			<div class="row">
				<div class="label">文件</div>
				<div class="muted">${file.name}</div>
				<div class="hint">上传后会加入首页启动图池，进入站点时会随机首图展示。</div>
			</div>
			<div class="row">
				<label class="inline muted">
					<input type="checkbox" id="start-autopublish" checked />
					上传后自动发布到 GitHub（会执行 git commit + git push）
				</label>
			</div>
		`,
		actionsHtml: `
			<button class="btn" id="start-cancel" type="button">取消</button>
			<button class="btn" id="start-confirm" type="button">确认上传</button>
		`,
	});
	$('start-cancel')?.addEventListener('click', () => closeModal());
	$('start-confirm')?.addEventListener('click', async () => {
		if (!pendingStartFile) return;
		try {
			const autoPublish = $('start-autopublish')?.checked ?? false;
			await uploadStart(pendingStartFile);
			closeModal();
			await loadStartAssets();
			if (autoPublish) await publishSite();
		} catch (e2) {
			alert(String(e2?.message || e2));
		}
	});
}

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

$startList?.addEventListener('click', async (ev) => {
	const btn = ev.target?.closest?.('button[data-action="delete-start"]');
	if (!btn) return;
	const row = btn.closest?.('[data-name]');
	const name = row?.getAttribute?.('data-name') ?? '';
	if (!name) return;
	const ok = confirm(`确认删除启动图：${name} ？`);
	if (!ok) return;
	try {
		await deleteStart(name);
		await loadStartAssets();
	} catch (e2) {
		alert(String(e2?.message || e2));
	}
});

document.querySelectorAll('.settings-tab').forEach((btn) => {
	btn.addEventListener('click', () => {
		const next = btn.getAttribute('data-settings-tab');
		if (!next) return;
		showSettingsTab(next);
	});
});

[$settingsFeatures, $settingsTexts, $settingsIntegrations].forEach((el) => {
	el?.addEventListener('input', (ev) => {
		syncInputToDraft(ev.target);
	});
	el?.addEventListener('change', (ev) => {
		syncInputToDraft(ev.target);
	});
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
		alert('配置已发布，生效时间已记录。若为静态站点，请配合发布流程推送构建。');
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

async function publishSite() {
	const resp = await fetch(baseUrl('/api/publish'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({}),
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'publish_failed');
	if (data.message === 'no_changes') {
		alert('没有需要发布的改动');
		return;
	}
	alert('已提交并推送到 GitHub，等待 Actions 部署完成即可更新线上站点');
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

await Promise.all([loadPosts(), loadStartAssets(), loadSiteSettings()]);
