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
const adminPublicDir = path.join(projectRoot, 'tools', 'admin', 'public');

await fs.mkdir(postsDir, { recursive: true });
await fs.mkdir(publicDir, { recursive: true });

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

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.use('/admin', express.static(adminPublicDir, { extensions: ['html'] }));
app.use(
	'/vendor/katex',
	express.static(path.join(projectRoot, 'node_modules', 'katex', 'dist'))
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

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
app.listen(port, () => {
	console.log(`Admin running at http://localhost:${port}/admin`);
});
