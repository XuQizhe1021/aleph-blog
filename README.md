# 个人博客（本地可视化管理 + GitHub Pages 发布）

## 功能

- 公网博客：Markdown、LaTeX、文章搜索、分类浏览、文章阅读、RSS、阅读页右侧可收纳目录、浅色/深色主题、移动端抽屉导航、可收纳打赏栏
- 本地管理后台：上传 md、同名覆盖更新、删除、检索、预览（含 LaTeX）、上传打赏二维码图片

## 使用教程（本地写作/管理 → 推送 → 公网访问）

### 1) 本地启动（同时启动博客 + 管理后台）

在项目根目录运行：

```bash
npm install
npm run dev:all
```

访问：

- 博客预览： http://localhost:4321/
- 管理后台： http://localhost:4322/admin

### 2) 用管理后台管理文章

进入管理后台后：

- 上传文章：点击“上传文章(md)”选择 `.md` 文件
  - 文件名会作为 slug，例如 `我的文章.md` → `/posts/我的文章/`
  - 文章内图片请用 URL：`![](https://...)`
- 同名更新：再次上传同名 md，会自动覆盖并写入 `updatedDate`
- 删除文章：选中后点击“删除”
- 检索查找：左侧搜索框支持标题/slug/分类/标签/描述匹配
- 打赏二维码：点击“上传打赏图”，将写入 `public/reward.xxx`，前台右下角“打赏”按钮会显示

文章文件存放位置：

- `src/content/blog/*.md`

文章 Frontmatter（头部信息）示例：

```md
---
title: 我的第一篇文章
description: 一句话简介（可选）
pubDate: 2026-01-17
category: 随笔
tags: [标签1, 标签2]
draft: false
---
```

### 3) 推送到 GitHub

如果你执行 `git push -u origin main` 报错：

```
error: src refspec main does not match any
```

常见原因是“你本地当前分支不叫 main”。例如本仓库当前分支名是 `main-xqz`。

两种修复方式（二选一）：

方式 A：把本地分支重命名为 main，再推送

```bash
git branch -M main
git push -u origin main
```

方式 B：不改本地分支名，直接推送到远端 main

```bash
git push -u origin main-xqz:main
```

### 4) 打开 GitHub Pages（一次性设置）

GitHub 仓库页面：

- Settings → Pages → Build and deployment
- 选择：GitHub Actions

之后每次 push 到 `main`，会自动部署到 GitHub Pages。

访问地址通常是：

- 项目页：`https://<用户名>.github.io/<仓库名>/`
- 如果仓库名就是 `<用户名>.github.io`（用户主页仓库）：`https://<用户名>.github.io/`

## 个性化配置

修改站点信息：

- `src/site.config.ts`：标题、作者、描述、导航、打赏图片路径等
