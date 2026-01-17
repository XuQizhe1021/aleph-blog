const $ = (id) => document.getElementById(id);

const $list = $('list');
const $filter = $('filter');
const $count = $('count');
const $uploadMd = $('upload-md');
const $uploadReward = $('upload-reward');
const $refresh = $('refresh');
const $delete = $('delete');
const $openSite = $('open-site');
const $vTitle = $('v-title');
const $vSub = $('v-sub');
const $raw = $('raw');
const $preview = $('preview');

let posts = [];
let activeSlug = '';

const baseUrl = (path) => `${path}`;
const formatDate = (s) => (s ? new Date(s).toLocaleDateString('zh-CN') : '');

function postMatches(p, q) {
	const hay = [
		p.slug,
		p.title,
		p.category,
		...(p.tags || []),
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
				p.category ? p.category : '未分类',
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
	const category = data.frontmatter?.category || '未分类';
	const tags = Array.isArray(data.frontmatter?.tags) ? data.frontmatter.tags : [];

	if ($vTitle) $vTitle.textContent = title;
	if ($vSub) {
		const parts = [];
		if (pub) parts.push(`发布：${pub}`);
		if (upd) parts.push(`更新：${upd}`);
		parts.push(`分类：${category}`);
		if (tags.length) parts.push(`标签：${tags.join(', ')}`);
		$vSub.textContent = parts.join(' · ');
	}

	if ($raw) $raw.textContent = data.raw || '';

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

async function uploadMd(file) {
	const form = new FormData();
	form.append('file', file);
	const resp = await fetch(baseUrl('/api/posts/upload'), { method: 'POST', body: form });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'upload_failed');
	await loadPosts();
	if (data.slug) await loadPost(data.slug);
}

async function uploadReward(file) {
	const form = new FormData();
	form.append('file', file);
	const resp = await fetch(baseUrl('/api/reward-image'), { method: 'POST', body: form });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.error || 'upload_failed');
}

$list?.addEventListener('click', (e) => {
	const el = e.target?.closest?.('[data-slug]');
	const slug = el?.getAttribute?.('data-slug');
	if (!slug) return;
	loadPost(slug);
});

$filter?.addEventListener('input', () => renderList());

$refresh?.addEventListener('click', () => loadPosts());

$uploadMd?.addEventListener('change', async (e) => {
	const file = e.target.files?.[0];
	if (!file) return;
	try {
		await uploadMd(file);
	} finally {
		e.target.value = '';
	}
});

$uploadReward?.addEventListener('change', async (e) => {
	const file = e.target.files?.[0];
	if (!file) return;
	try {
		await uploadReward(file);
	} finally {
		e.target.value = '';
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
	await loadPosts();
});

$openSite?.addEventListener('click', () => {
	if (!activeSlug) return;
	const url = `http://localhost:4321/posts/${encodeURIComponent(activeSlug)}`;
	window.open(url, '_blank', 'noopener,noreferrer');
});

await loadPosts();
