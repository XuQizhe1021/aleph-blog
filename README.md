# 个人博客（本地可视化管理 + GitHub Pages 发布）
你好，我是aleph blanc，我知道你会来看源仓库（https://github.com/XuQizhe1021/aleph-blog）。

使用时记得把我代码里的硬编码（例如站点标题、作者、描述、部分链接等）替换为你自己的。

不过我的博客其实并不怎么好用，我也只是拿来写点感兴趣的。可扩展性也是一坨，接入一些额外功能可能需要你从源码方面进行操作。
## 功能

- 公网博客：Markdown、LaTeX、文章搜索、分类浏览、文章阅读、浅色/深色主题、可收纳打赏栏
- 本地管理后台：上传 md、同名覆盖更新、删除、检索、预览（含 LaTeX）、上传打赏二维码图片

## 使用教程（本地写作/管理 → 推送 → 公网访问）

### 1) 本地启动（同时启动博客 + 管理后台）

在项目根目录运行：

```bash
npm install #仅在首次
npm run dev:all
```

访问：

- 博客预览： http://localhost:4321/
- 管理后台： http://localhost:4322/admin

### 2) 用管理后台管理文章

进入管理后台后：

我觉得你应该会自己摸索出使用方法。(●'◡'●)
我觉得你应该会自己摸索出使用方法。(●'◡'●)

文章文件存放位置：

- `src/content/blog/*.md`

这时一大缺点，文章会占用你的本地存储，我也在考虑要不要升级一下，但估计要鸽。

文章 Frontmatter（头部信息）示例，所以如果一个文章的相关信息你觉得设置得不好，你可以从源码层面直接更改：

```md
---
title: 我的第一篇文章
description: 一句话简介（可选）
pubDate: 2026-01-17
category: 
  -分类
draft: false
---
```

### 3) 推送到 GitHub

如果你执行 `git push -u origin main` 报错：

```
error: src refspec main does not match any
```

常见原因是“你本地当前分支不叫 main”。

把本地分支重命名为 main，再推送
把本地分支重命名为 main，再推送

```bash
git branch -M main
git push -u origin main
```

### 4) 打开 GitHub Pages（一次性设置）

GitHub 仓库页面：

- Settings → Pages → Build and deployment
- 选择：GitHub Actions

之后每次 push 到 `main`，会自动部署到 GitHub Pages。

访问地址通常是：

- 项目页：`https://<用户名>.github.io/<仓库名>/`
- 如果仓库名就是 `<用户名>.github.io`（用户主页仓库）：`https://<用户名>.github.io/`


但如果你直接使用我的代码的话，我建议你不要直接给仓库起名 `<用户名>.github.io`，而是起个别的名字，例如 `blog`。

## 个性化配置

修改站点信息：

- `src/site.config.ts`：标题、作者、描述、导航、打赏图片路径等

另外记得在关于里给我个友链O(∩_∩)O，谢谢:（https://github.com/XuQizhe1021）。