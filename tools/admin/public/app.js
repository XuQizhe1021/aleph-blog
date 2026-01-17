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

let posts = [];
let activeSlug = '';
let categories = [];
let pendingUploadFile = null;
let pendingRewardFile = null;

const baseUrl = (path) => `${path}`;
const formatDate = (s) => (s ? new Date(s).toLocaleDateString('zh-CN') : '');

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

await loadPosts();
