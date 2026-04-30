# 个人博客（Astro + 本地管理后台 + 配置驱动）
这是一个偏简洁、轻量、移动端优先的 Astro 个人博客模板，包含本地管理后台与 GitHub Pages 发布流程。当前版本已经从“源码硬编码”升级为“配置驱动”，新增功能可在后台进行开关、文案和参数管理，尽量减少后续手改源码。

## 功能总览
- 内容与基础能力：Markdown/MDX、KaTeX、搜索、分类浏览、响应式、深浅色主题、SEO 基础页面（sitemap/robots）
- 视觉与交互增强：页脚动态问候、可选节日短时动效、自定义鼠标样式、可开关的 Astro ViewTransitions
- 内容呈现增强：目录滚动联动高亮、代码块一键复制、Mermaid 渲染（失败自动兜底）
- 实用工具：可收纳侧边栏、页脚站点运行时长、随机文章入口（页脚 + 404）、时光机时间轴页面
- 社交互动：Giscus 评论（按页面类型控制）、链接/数字名片页面（支持后台配置排序）
- 管理后台：文章管理、分类管理、打赏图管理、配置中心（预览/保存/发布并记录时间）

## 快速开始
### 1) 安装与启动
```bash
npm install
npm run dev:all
```
- 博客预览：`http://localhost:4321/`
- 管理后台：`http://localhost:4322/admin`

### 2) 常用命令
```bash
npm run dev
npm run admin
npm run test
npm run build
```

## 内容管理
文章仍然放在 `src/content/blog/*.md`（或 `.mdx`），Frontmatter 示例：
```md
---
title: 我的第一篇文章
description: 一句话简介（可选）
pubDate: 2026-01-17
categories:
  - 分类
draft: false
---
```
管理后台支持上传、覆盖、删除、分类批量调整、渲染预览、资源管理（`public/reward.*`）。

## 配置中心（重点）
统一配置文件：`data/site-settings.json`。  
前端通过 `src/config/site-settings.ts` 统一读取，不建议在页面组件里散读硬编码。

### 配置模型
- `site_features`：功能开关（视觉/内容/工具/社交）
- `site_texts`：文案配置（问候语、复制提示、侧边栏文案、链接页文案等）
- `site_theme_tweaks`：视觉参数（过渡时长/曲线、问候时段边界、动效时长、光标样式、TOC 偏移、站点起始时间）
- `site_integrations`：第三方配置（Giscus）与链接名片列表

### 保存与发布
后台配置中心提供：
- 预览：查看当前配置 JSON
- 保存草稿：更新 `savedAt`
- 发布生效：更新 `publishedAt`

注意：这是静态站点，发布配置后若要线上立即生效，仍需按你的部署流程触发构建（例如 push 到 `main`）。

## 新增页面与入口
- 时光机：`/time-machine`
- 链接/数字名片：`/links`
- 404 页面已增加随机文章入口

## 部署说明（GitHub Pages）
仓库中已包含 `.github/workflows/deploy.yml`。  
首次配置请在 GitHub 仓库 `Settings -> Pages` 中将 `Build and deployment` 设置为 `GitHub Actions`。之后 push 到 `main` 会自动构建发布。

## 兼容与降级策略
- Feature Flag 默认保守值，支持灰度和快速回滚（直接关闭对应开关）
- 浏览器增强逻辑均有客户端检测与失败兜底（复制、Mermaid、评论脚本）
- 不改变既有内容目录与主要路由结构，尽量保持现有视觉语言与性能基线
