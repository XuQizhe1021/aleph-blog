---
title: openclaw + Kimi K2.5 + Feishu
pubDate: '2026-03-14T17:51:26.896Z'
draft: false
description: 本地使用小龙虾的一次探索
categories:
  - 技术
  - AI
---
# 本地安装 openclaw + Kimi K2.5 + Feishu

## Kimi API

依旧先去moonshot平台获取 API key。

## 安装 OpenClaw

### **powershell 执行：**

安装 nvm-windows 管理 Node.js

访问 [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases) 下载 `nvm-setup.exe`，安装后以**管理员身份**打开 PowerShell：

```
# 安装 Node.js 22
nvm install 22

# 使用该版本
nvm use 22.22.0

# 验证
node --version  # v22.x.x
```

从 [Git官网](https://git-scm.com/download/win) 下载安装包，安装时确保勾选 **"Add Git to PATH"**

以**管理员身份**打开 PowerShell，执行：

```
# 允许本地脚本运行
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 为当前进程解除限制
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

若弹出权限提示，输入 `Y` 确认

配置 npm 镜像(如果npm你之前已经装过了就不用管)：

```
npm config set registry https://registry.npmmirror.com/
```

在**管理员 PowerShell** 中运行:

```
iwr -useb https://openclaw.ai/install.ps1 | iex
```

---

初始化配置:

```
# 启动配置向导
openclaw onboard

# 如果遇到命令找不到，先检查 PATH
# 通常 npm 全局路径在 %AppData%\npm
```

选择 `yes` 后，选择 `QuickStart`。

选择你的模型平台，这里我们使用的是Kimi K2.5，所以选择Moonshot AI，然后选择你的账户平台（.ai 或 .cn）。

以选择.cn为例，随后选择 Paste API key now

输入你的 API Key，回车后选择 Keep current。

选择飞书。

Feishu plugin直接选择本地，忽略白名单提醒。

---

浏览器访问 [飞书开放平台](https://open.feishu.cn/app)，**创建企业自建应用**，填写应用名称（比如 "OpenClaw助手"）、描述，上传或选择一个图标。

创建成功后，自动进入应用详情页。在左侧导航栏找到 **"凭证与基础信息"**，在这个页面有两个关键参数：

- **App ID**（一串字符）
- **App Secret**（另一串更长的字符，**请保密，不要泄露**）

这两个值就是之后需要在 OpenClaw 界面中填写的。

---

为了让 OpenClaw 能在飞书中正常工作（如收发消息、读取通讯录等），需要给这个应用开启相应权限：

1. 在左侧导航栏点击 **"权限管理"** 
2. 在权限搜索框中，搜索并开启以下关键权限（OpenClaw 提示中的第4条已列出）：

- `im:message`（获取与发送单聊、群组消息）
- `im:chat`（获取群组信息）
- `contact:user.base:readonly`（获取用户基本信息）

除此之外，建议再开启以下常用权限，确保插件功能完整：

- 获取用户手机号
- 获取用户邮箱信息
- 获取用户 user ID
- 以应用的身份发消息
- 获取通讯录基本信息 

勾选后点击 **"批量开通"**。

---

在左侧导航栏点击 “**添加应用能力**”，在能力列表中，找到**「机器人」**，点击「添加」

---

发布应用：

1. 在左侧导航栏点击 **"应用发布" → "版本管理与发布"** 
2. 点击 **"创建版本"**，填写版本号等信息
3. 设置可用性为 **"所有员工"** 
4. 点击 **"申请发布"**，然后请公司管理员登录飞书管理后台审核通过

回到powershell，输入 ID 和 Secret。

连接模式直接选择 **WebSocket（default）**。

三种模式：

**Allowlist – 白名单模式**（默认推荐）

- **含义**：机器人**只会在你指定的某些群组里回复消息**，其他群组即使@它也不会响应。
- **适用场景**：机器人服务于特定的几个团队或项目群，避免在无关群组中被@造成打扰。
- **后续操作**：选择此项后，下一步会要求你输入允许的群ID列表（可以在飞书客户端获取群聊ID）。

**Open – 开放模式**

- **含义**：机器人**可以在任何群组中回复消息**，但前提是**必须在消息中@机器人**（例如输入 `@你的机器人 天气怎么样`）。
- **适用场景**：机器人能被公司内任意群组使用，但又不想它主动干扰对话（因为需要@才会触发）。
- **注意**：此模式下机器人不会自动响应未被@的消息。

**Disabled – 禁用群聊**

- **含义**：机器人**完全不在任何群组中响应**，仅支持与用户的私聊对话。
- **适用场景**：机器人主要用于一对一助手场景，或者暂时不想处理群聊消息。

Search provider 选择你的联网搜索模型，然后输入对应 API Key。

Configure skills now? (recommended) 会让你选择安装相关的扩展技能，我由于测试并未安装（但强制要求至少装一个），有需要者自己配置时可在 Install missing skill dependencies 中进行选择，各个技能名对应的能力可询问 AI 或在 OpenClaw 文档中查看。

接下来的 API 密钥，没有就选 no。

钩子（Hooks）是进阶技能，比如 boot-md（启动时加载 Markdown），机器人启动时自动加载指定的 Markdown 文件（比如帮助文档、常用模板）；本次安装选择 boot-md，读者在安装时如有需求可自行配置，后续依旧可手动更改。

 ```
 openclaw hooks list 
 openclaw hooks enable <name>
 openclaw hooks disable <name>
 ```

接下来需要对机器人进行孵化，也就是赋予机器人“个性”，可以选择跳过，后续通过 `openclaw hatch` 重新孵化。

Hatch in TUI：通过**文本交互界面**一步步配置机器人。系统会引导你回答一些问题（例如：你希望机器人扮演什么角色？它的语气是正式还是幽默？有哪些特定的知识或任务要掌握？），然后根据你的描述生成机器人的**系统提示词**。输入 `/exit` 或按 `Ctrl+C` 退出 TUI。

Open the Web UI：直接打开 Web 管理界面（`http://127.0.0.1:18789/`），在图形界面中手动配置机器人的系统提示、技能、插件等。

从TUI退出后，会直接回到命令行。

在飞书客户端搜索你创建的应用名称，找到机器人。给它发一条消息试试，比如“你好”或“现在几点”。如果需要添加到群聊，记得按照你之前选择的群聊策略操作（白名单/开放/禁用）

**后续个性化：**

查看可用的技能列表:

```
openclaw skills list-available
```

安装某个技能（例如 summarize）

```
openclaw skills install summarize
```

查看已安装的技能

```
openclaw skills list
```

修改机器人角色/系统提示

```
openclaw hatch
```

配置插件（如飞书）

```
openclaw plugins config feishu
```

或者直接更改文件：C:\Users\你的用户名\\.openclaw\openclaw.json后，重启网关：

```
openclaw gateway restart
```

配置钩子（Hooks）

```
openclaw hooks config
```

打开控制面板

```
openclaw dashboard
```

---

### 个人使用与常态运行

注：去掉飞书相关部分，就是自己单独使用的教程。由于未使用服务器，故需保持本地后台运行。可以将 OpenClaw 网关设置为 Windows 开机自启，这样就不用手动启动了

#### 如何启动服务？

如果之后电脑重启或服务意外停止，需要手动启动它：

打开 PowerShell（普通权限即可），运行：

```
openclaw gateway start
```

#### 如何让服务开机自启动？

##### 方法一：使用任务计划程序（推荐）

1. 打开“任务计划程序”（Task Scheduler）。
2. 创建基本任务，触发器设为“计算机启动时”。
3. 操作设为“启动程序”，程序为 `C:\Users\用户名\AppData\Roaming\npm\openclaw.cmd`（或你系统里 `openclaw` 命令的实际路径），参数填 `gateway start`。
4. 完成。

##### 方法二：添加到启动文件夹

- 按 `Win + R`，输入 `shell:startup` 回车。
- 创建一个快捷方式，目标指向 `C:\Users\27156\AppData\Roaming\npm\openclaw.cmd`，参数为 `gateway start`。

### 如何检查服务状态？

随时可以运行：

```
openclaw gateway status
```

如果看到类似“Gateway is running”的信息，说明一切正常。

### 如何停止服务？

```
openclaw gateway stop
```

------

### 更新与维护

#### 更新 OpenClaw 核心

偶尔官方会发布新版本，可以手动升级：

```
npm update -g openclaw
```
#### 更新插件/技能

```
openclaw plugins update feishu      # 更新飞书插件
openclaw skills update <技能名>      # 更新某个技能
```



#### 查看日志

如果遇到机器人无响应，可以查看日志排查问题：

```
openclaw logs
```



日志会输出到终端，帮助定位错误。

------

### 什么时候需要关闭服务？

- 暂时不想让机器人工作时（例如需要释放资源），可以执行 `openclaw gateway stop`。
- 如果你要彻底卸载 OpenClaw，才需要停止服务并删除相关文件。

------

### 重要提醒

- OpenClaw 网关在后台运行时，会占用一定的内存和 CPU（通常很少，约几十到几百 MB），对日常使用影响不大。
- 如果电脑关机或休眠，机器人自然也会离线，直到再次开机并启动服务。
- 如果不希望机器人一直占用资源，可以只在需要时手动启动，用完再停止。

---

### **wsl 执行：**

必要工具：

```
sudo apt install -y git python3 python3-pip python3-venv build-essential
```

脚本安装：

```
curl -fsSL https://openclaw.ai/install.sh | bash
```

运行初始化向导 ：

```
openclaw onboard --install-daemon
```

此文档[使用 OpenClaw 连接 Kimi K2.5 模型 - Moonshot AI 开放平台 - Kimi K2.5 大模型 API 服务](https://platform.moonshot.cn/docs/guide/use-kimi-in-openclaw#第一步创建-kimi-开放平台-api-key)可解决wsl中的本地OpenClaw安装与使用问题，未涉及的飞书部分与前文powershell相同。

