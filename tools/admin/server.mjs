import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import anchor from 'markdown-it-anchor';

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

	if (typeof out.category === 'string') out.category = out.category.trim();
	if (!out.category) delete out.category;

	if (Array.isArray(out.tags)) {
		out.tags = out.tags.map((t) => String(t).trim()).filter(Boolean);
	} else if (typeof out.tags === 'string') {
		out.tags = out.tags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
	} else {
		out.tags = [];
	}

	out.draft = Boolean(out.draft);

	return out;
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
				const raw = await fs.readFile(full, 'utf-8');
				const parsed = matter(raw);
				const slug = path.parse(file).name;
				const data = normalizeFrontmatter(parsed.data ?? {});
				return {
					slug,
					file,
					title: data.title,
					description: typeof data.description === 'string' ? data.description : '',
					category: typeof data.category === 'string' ? data.category : '',
					tags: Array.isArray(data.tags) ? data.tags : [],
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
		const raw = await fs.readFile(filePath, 'utf-8');
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
		const slug = safeBasename(file.originalname);
		const targetPath = path.join(postsDir, `${slug}.md`);

		const incomingRaw = file.buffer.toString('utf-8');
		const incomingParsed = matter(incomingRaw);

		let data = normalizeFrontmatter(incomingParsed.data ?? {});
		if (data.title === '未命名') data.title = slug;

		const existingPath = await readPostFile(slug);
		if (existingPath) {
			const existingRaw = await fs.readFile(existingPath, 'utf-8');
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
		const ext = (path.extname(file.originalname) || '.png').toLowerCase();
		const target = path.join(publicDir, `reward${ext}`);
		await fs.writeFile(target, file.buffer);
		res.json({ ok: true, path: `/reward${ext}` });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

app.get('/api/reward-image', async (_req, res) => {
	try {
		const files = (await fs.readdir(publicDir)).filter((f) => /^reward\./i.test(f));
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

