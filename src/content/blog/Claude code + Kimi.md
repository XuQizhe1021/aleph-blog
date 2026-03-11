---
title: 使用Claude Code调用Kimi
pubDate: '2026-03-11T03:03:06.054Z'
draft: false
categories:
  - 技术
  - AI
---
# 环境准备

## Kimi API

首先需要到Kimi官网申请一个API：[https://platform.moonshot.cn/console/api-keys](https://link.zhihu.com/?target=https%3A//platform.moonshot.cn/console/api-keys)

点击新建API Key的蓝色按钮，名称随便写，项目选择默认即可。

## 安装 Node.js

```Bash
# Ubuntu / Debian 用户，wsl 同样适用
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
node --version

# macOS 用户
sudo xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
node --version
```

## 安装 Claude code 与 Router

```Bash
nvm install 18 # 安装18+版本 也可以是20 22 
nvm use 18 # 切换到18版本 
npm install -g @anthropic-ai/claude-code # 安装命令
npm install -g @musistudio/claude-code-router
claude --version # 输出版本号表示安装成功
nvm alias defalut 18 
#建议操作，否则每次开启都要use到18版本上
#而且cursor，IDEA等相关插件检测不到Claude命令，无法运行
```



# 方案 A：用环境变量快速切换到 Kimi K2.5

把下面内容复制到你的终端（macOS / Linux）里，然后启动 `claude`：

```bash
# 1) Claude Code → Moonshot 的 Anthropic 兼容入口
#   说明：Moonshot 的 Anthropic Messages API 端点是 /anthropic/v1/messages
export ANTHROPIC_BASE_URL="https://api.moonshot.ai/anthropic"

# 2) 认证
export ANTHROPIC_AUTH_TOKEN="YOUR_MOONSHOT_API_KEY"

# 3) 模型
#   常见写法：ANTHROPIC_MODEL / ANTHROPIC_SMALL_FAST_MODEL
export ANTHROPIC_MODEL="kimi-k2.5"
export ANTHROPIC_SMALL_FAST_MODEL="kimi-k2.5"

# 4) 可选：减少非必要流量 & 提升长任务稳定性
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export API_TIMEOUT_MS=600000

# 启动 Claude Code
claude
```

如果你在中国网络环境，把第一行改成：

```bash
export ANTHROPIC_BASE_URL="https://api.moonshot.cn/anthropic"
```

# 方案 B：写进 `~/.claude/settings.json`

Claude Code 官方文档说明：用户级配置文件在 `~/.claude/settings.json`，并支持 `env` 字段。
你可以直接写成这样（把 Key 换成自己的）：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_MOONSHOT_API_KEY",
    "ANTHROPIC_MODEL": "kimi-k2.5",
    "ANTHROPIC_SMALL_FAST_MODEL": "kimi-k2.5",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "600000"
  }
}
```

保存后重新打开终端，再运行：

```bash
claude
```

# 快速自检

进 Claude Code 后，直接问它：

- “请告诉我当前运行的模型名称（model id）是什么？”
- “把 `ANTHROPIC_BASE_URL` 解释一下，并告诉我你连接的是哪个域名（moonshot.ai 还是 moonshot.cn）？”

如果它能正常回答并持续工作，说明链路已通。

# 常见问题排查

## 1)仍然提示登录 Anthropic / 没走 Moonshot

**原因通常是：Claude Code 没读到你的 env**。
建议按这个顺序排：

1. 先用「方案 A」在当前 shell export（最直观）；
2. 再写入 `~/.claude/settings.json`；
3. 重启终端再试。

## 2) 401 / token invalid

- 确保你用的是 **Moonshot Open Platform 的 API Key**；
- 变量名建议用 `ANTHROPIC_AUTH_TOKEN`；
- base URL 要是 `.../anthropic`（不是 `.../v1`，更不是其他 CLI 专用地址）。

## 3) 经常超时、工具调用跑一半断了

- 把 `API_TIMEOUT_MS` 提高（如 600000 / 900000）。
- 开启 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`。
- 避免让 Claude Code 扫描超大目录（`node_modules/`、构建产物等），并用 Claude Code 的权限/deny 规则屏蔽无关路径。

