---
title: Gemini部署教程
pubDate: '2026-01-17T16:36:45.259Z'
draft: false
description: windows下的Gemini部署教程
categories:
  - 技术
  - AI
---
# Windows 部署 Gemini 智能助手教程

本教程将指导你在 Windows 上部署一个支持文件操作的 Gemini 命令行助手。

---

## 目录

1. [前置要求](#1-前置要求)
2. [安装 Python](#2-安装-python)
3. [获取 API Key](#3-获取-api-key)
4. [配置环境变量](#4-配置环境变量)
5. [安装依赖](#5-安装依赖)
6. [创建脚本文件](#6-创建脚本文件)
7. [配置快捷命令](#7-配置快捷命令)
8. [使用说明](#8-使用说明)
9. [常见问题](#9-常见问题)

---

## 1. 前置要求

- Windows 10/11 系统
- 网络代理工具（如 Clash、V2Ray 等），用于访问 API 服务
- 记下你的代理端口号（如 Clash 默认 7890）

---

## 2. 安装 Python

### 2.1 下载 Python

访问 Python 官网下载页面：https://www.python.org/downloads/

下载 Python 3.10 或更高版本。

### 2.2 安装 Python

运行安装程序时，**务必勾选以下选项**：

- ✅ **Add Python to PATH**（非常重要！）
- ✅ Install for all users（可选）

点击 "Install Now" 完成安装。

### 2.3 验证安装

打开命令提示符（Win+R 输入 `cmd`），运行：

```cmd
python --version
```

如果显示版本号（如 `Python 3.12.0`），说明安装成功。

---

## 3. 获取 API Key

### 方式一：使用 API 转发服务（推荐国内用户）

如果你在国内，建议使用 API 转发服务（如 anyrouter、openrouter 等）：

1. 注册转发服务账号
2. 充值或获取免费额度
3. 在控制台获取 **API Key** 和 **Base URL**

示例（anyrouter）：
- Base URL: `https://anyrouter.top/v1`
- API Key: `sk-xxxxxxxxxxxxxxxx`

### 方式二：使用 Google 官方 API

1. 访问 https://aistudio.google.com/apikey
2. 登录 Google 账号
3. 点击 "Create API Key" 创建密钥
4. 复制保存你的 API Key

> 注意：官方 API 需要能够直接访问 Google 服务

---

## 4. 配置环境变量

### 4.1 打开环境变量设置

1. 按 `Win + S` 搜索"环境变量"
2. 点击"编辑系统环境变量"
3. 点击"环境变量"按钮

### 4.2 添加 API Key

在"用户变量"区域，点击"新建"：

- **变量名**: `GEMINI_API_KEY`
- **变量值**: 你的 API Key（如 `sk-xxxxxxxx`）

点击"确定"保存。

### 4.3 使环境变量生效

**重新打开**命令提示符窗口（关闭旧窗口，打开新窗口）。

验证环境变量：

```cmd
echo %GEMINI_API_KEY%
```

如果显示你的 API Key，说明配置成功。

---

## 5. 安装依赖

打开命令提示符，运行：

```cmd
pip install openai
```

等待安装完成。

---

## 6. 创建脚本文件

### 6.1 创建文件夹

在你喜欢的位置创建一个文件夹，例如：

```
C:\Gemini
```

### 6.2 创建脚本

在该文件夹中创建文件 `chat_gemini.py`，内容如下：

```python
import os
import json
import subprocess
import glob as glob_module
from openai import OpenAI

# 设置代理
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:7890'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:7890'

# 配置API
client = OpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url="https://anyrouter.top/v1"
)

# 权限管理
class PermissionManager:
    # 敏感操作列表
    SENSITIVE_TOOLS = {
        "write_file": "写入文件",
        "edit_file": "编辑文件",
        "delete_file": "删除文件",
        "run_command": "执行命令",
        "create_directory": "创建目录",
        "delete_directory": "删除目录"
    }

    def __init__(self):
        self.always_allow = set()  # 始终允许的操作

    def check_permission(self, tool_name, details):
        """检查是否有权限执行操作"""
        if tool_name not in self.SENSITIVE_TOOLS:
            return True, None

        if tool_name in self.always_allow:
            print(f"\n[自动允许: {self.SENSITIVE_TOOLS[tool_name]}]")
            return True, None

        # 请求用户确认
        print(f"\n{'='*50}")
        print(f"⚠️  敏感操作请求: {self.SENSITIVE_TOOLS[tool_name]}")
        print(f"{'='*50}")
        print(f"详情: {details}")
        print(f"\n选项:")
        print(f"  [Y] 允许这次操作")
        print(f"  [A] 始终允许此类操作 ({tool_name})")
        print(f"  [N] 拒绝操作")

        while True:
            choice = input("\n请选择 [Y/A/N]: ").strip().upper()
            if choice == 'Y':
                return True, None
            elif choice == 'A':
                self.always_allow.add(tool_name)
                print(f"[已设置: 始终允许 {self.SENSITIVE_TOOLS[tool_name]}]")
                return True, None
            elif choice == 'N':
                reason = input("拒绝原因(可选，直接回车跳过): ").strip()
                return False, reason if reason else "用户拒绝了此操作"
            else:
                print("无效选项，请输入 Y、A 或 N")

permission_manager = PermissionManager()

# ==================== 工具函数 ====================

def read_file(file_path):
    """读取文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"success": True, "content": content}
    except Exception as e:
        return {"success": False, "error": str(e)}

def write_file(file_path, content):
    """写入文件(创建或覆盖)"""
    try:
        dir_path = os.path.dirname(file_path)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return {"success": True, "message": f"文件已保存到 {file_path}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def edit_file(file_path, old_text, new_text):
    """编辑文件(替换指定内容)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if old_text not in content:
            return {"success": False, "error": "未找到要替换的内容"}

        # 检查是否有多处匹配
        count = content.count(old_text)
        if count > 1:
            return {"success": False, "error": f"找到 {count} 处匹配，请提供更精确的内容以确保唯一匹配"}

        new_content = content.replace(old_text, new_text)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return {"success": True, "message": "文件已更新"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_file(file_path):
    """删除文件"""
    try:
        os.remove(file_path)
        return {"success": True, "message": f"文件 {file_path} 已删除"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def list_directory(dir_path="."):
    """列出目录内容"""
    try:
        items = os.listdir(dir_path)
        result = []
        for item in items:
            full_path = os.path.join(dir_path, item)
            item_type = "目录" if os.path.isdir(full_path) else "文件"
            size = os.path.getsize(full_path) if os.path.isfile(full_path) else None
            result.append({"name": item, "type": item_type, "size": size})
        return {"success": True, "items": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

def create_directory(dir_path):
    """创建目录"""
    try:
        os.makedirs(dir_path, exist_ok=True)
        return {"success": True, "message": f"目录 {dir_path} 已创建"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_directory(dir_path):
    """删除目录"""
    try:
        import shutil
        shutil.rmtree(dir_path)
        return {"success": True, "message": f"目录 {dir_path} 已删除"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def run_command(command):
    """执行系统命令"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        return {
            "success": True,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "命令执行超时(60秒)"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def search_files(pattern, dir_path="."):
    """搜索文件(支持通配符)"""
    try:
        search_pattern = os.path.join(dir_path, "**", pattern)
        files = glob_module.glob(search_pattern, recursive=True)
        return {"success": True, "files": files[:100]}  # 限制返回100个
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_file_info(file_path):
    """获取文件信息"""
    try:
        stat = os.stat(file_path)
        return {
            "success": True,
            "exists": True,
            "is_file": os.path.isfile(file_path),
            "is_directory": os.path.isdir(file_path),
            "size": stat.st_size,
            "modified_time": stat.st_mtime,
            "absolute_path": os.path.abspath(file_path)
        }
    except FileNotFoundError:
        return {"success": True, "exists": False}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_current_directory():
    """获取当前工作目录"""
    return {"success": True, "path": os.getcwd()}

def change_directory(dir_path):
    """切换工作目录"""
    try:
        os.chdir(dir_path)
        return {"success": True, "message": f"已切换到 {os.getcwd()}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ==================== 工具定义 ====================

tools = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "读取文件内容",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "文件路径"}
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "创建或覆盖文件",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "文件路径"},
                    "content": {"type": "string", "description": "文件内容"}
                },
                "required": ["file_path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "编辑文件，将指定的旧内容替换为新内容",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "文件路径"},
                    "old_text": {"type": "string", "description": "要替换的原内容"},
                    "new_text": {"type": "string", "description": "替换后的新内容"}
                },
                "required": ["file_path", "old_text", "new_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "删除文件",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "要删除的文件路径"}
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "列出目录下的所有文件和文件夹",
            "parameters": {
                "type": "object",
                "properties": {
                    "dir_path": {"type": "string", "description": "目录路径，默认当前目录"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_directory",
            "description": "创建目录",
            "parameters": {
                "type": "object",
                "properties": {
                    "dir_path": {"type": "string", "description": "要创建的目录路径"}
                },
                "required": ["dir_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_directory",
            "description": "删除目录及其所有内容",
            "parameters": {
                "type": "object",
                "properties": {
                    "dir_path": {"type": "string", "description": "要删除的目录路径"}
                },
                "required": ["dir_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "执行系统命令(如python、npm、git等)",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "要执行的命令"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "搜索文件，支持通配符如 *.py, *.txt",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "搜索模式，如 *.py"},
                    "dir_path": {"type": "string", "description": "搜索目录，默认当前目录"}
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_file_info",
            "description": "获取文件或目录的详细信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "文件或目录路径"}
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_directory",
            "description": "获取当前工作目录",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "change_directory",
            "description": "切换工作目录",
            "parameters": {
                "type": "object",
                "properties": {
                    "dir_path": {"type": "string", "description": "目标目录路径"}
                },
                "required": ["dir_path"]
            }
        }
    }
]

# ==================== 工具执行 ====================

def get_tool_details(tool_name, arguments):
    """生成工具调用的详情描述"""
    if tool_name == "write_file":
        content_preview = arguments.get("content", "")[:100]
        return f"文件: {arguments.get('file_path')}\n内容预览: {content_preview}..."
    elif tool_name == "edit_file":
        return f"文件: {arguments.get('file_path')}\n替换: '{arguments.get('old_text')[:50]}...' -> '{arguments.get('new_text')[:50]}...'"
    elif tool_name == "delete_file":
        return f"文件: {arguments.get('file_path')}"
    elif tool_name == "delete_directory":
        return f"目录: {arguments.get('dir_path')}"
    elif tool_name == "run_command":
        return f"命令: {arguments.get('command')}"
    elif tool_name == "create_directory":
        return f"目录: {arguments.get('dir_path')}"
    return json.dumps(arguments, ensure_ascii=False)

def execute_tool(tool_name, arguments):
    """执行工具并处理权限"""
    # 检查权限
    if tool_name in PermissionManager.SENSITIVE_TOOLS:
        details = get_tool_details(tool_name, arguments)
        allowed, reason = permission_manager.check_permission(tool_name, details)
        if not allowed:
            return {"success": False, "error": f"操作被用户拒绝: {reason}"}

    # 执行工具
    tool_map = {
        "read_file": lambda: read_file(arguments["file_path"]),
        "write_file": lambda: write_file(arguments["file_path"], arguments["content"]),
        "edit_file": lambda: edit_file(arguments["file_path"], arguments["old_text"], arguments["new_text"]),
        "delete_file": lambda: delete_file(arguments["file_path"]),
        "list_directory": lambda: list_directory(arguments.get("dir_path", ".")),
        "create_directory": lambda: create_directory(arguments["dir_path"]),
        "delete_directory": lambda: delete_directory(arguments["dir_path"]),
        "run_command": lambda: run_command(arguments["command"]),
        "search_files": lambda: search_files(arguments["pattern"], arguments.get("dir_path", ".")),
        "get_file_info": lambda: get_file_info(arguments["file_path"]),
        "get_current_directory": lambda: get_current_directory(),
        "change_directory": lambda: change_directory(arguments["dir_path"])
    }

    if tool_name in tool_map:
        return tool_map[tool_name]()
    return {"error": f"未知工具: {tool_name}"}

# ==================== 主循环 ====================

history = []

print("=" * 50)
print("Gemini 智能助手")
print("=" * 50)
print("功能: 文件读写、编辑、删除、执行命令等")
print("敏感操作会请求确认，可选择始终允许")
print("输入 'quit' 或 '退出' 结束对话")
print("输入 'reset' 重置权限设置")
print("输入 'clear' 清除对话历史")
print("=" * 50)

while True:
    user_input = input("\n你: ").strip()

    if not user_input:
        continue

    if user_input.lower() in ['quit', '退出', 'exit']:
        print("再见！")
        break

    if user_input.lower() == 'reset':
        permission_manager.always_allow.clear()
        print("[已重置所有权限设置]")
        continue

    if user_input.lower() == 'clear':
        history.clear()
        print("[已清除对话历史]")
        continue

    history.append({"role": "user", "content": user_input})

    try:
        response = client.chat.completions.create(
            model="gemini-2.5-pro",
            messages=history,
            tools=tools
        )
        message = response.choices[0].message

        # 工具调用循环
        while message.tool_calls:
            history.append(message)

            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)

                # 非敏感操作显示调用信息
                if tool_name not in PermissionManager.SENSITIVE_TOOLS:
                    print(f"\n[调用: {tool_name}]")

                result = execute_tool(tool_name, arguments)

                # 显示结果摘要
                result_str = json.dumps(result, ensure_ascii=False)
                if len(result_str) > 200:
                    print(f"[结果: {result_str[:200]}...]")
                else:
                    print(f"[结果: {result_str}]")

                history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, ensure_ascii=False)
                })

            response = client.chat.completions.create(
                model="gemini-2.5-pro",
                messages=history,
                tools=tools
            )
            message = response.choices[0].message

        # 输出回复
        if message.content:
            print(f"\nGemini: {message.content}")
            history.append({"role": "assistant", "content": message.content})

    except KeyboardInterrupt:
        print("\n[操作中断]")
        continue
    except Exception as e:
        print(f"\n出错了: {e}")

```

### 6.3 修改配置

打开 `chat_gemini.py`，修改顶部的配置区域：

```python
# 代理设置（修改为你的代理端口）
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:7890'  
# 改成你的端口
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:7890'

# API 配置
API_BASE_URL = "https://anyrouter.top/v1"  # 改成你的 API 地址
MODEL_NAME = "gemini-2.5-pro"              # 改成你要用的模型
```

---

## 7. 配置快捷命令

让你可以在任意位置输入 `gemini` 启动助手。

### 7.1 创建批处理文件

在 任意文件夹中创建 `gemini.bat` 文件（记好路径，如 `C:\Gemini`，内容：

```batch
@echo off
python C:\Gemini\chat_gemini.py
```

> 注意：路径要改成你实际的脚本路径

### 7.2 添加到系统 PATH

1. 按 `Win + S` 搜索"环境变量"
2. 点击"编辑系统环境变量" → "环境变量"
3. 在"用户变量"中找到 `Path`，双击编辑
4. 点击"新建"，添加你脚本所在目录的路径，如：`C:\Gemini`
5. 点击"确定"保存

### 7.3 测试

重新打开命令提示符，输入：

```cmd
gemini
```

如果看到欢迎界面，说明配置成功！

---

## 8. 使用说明

### 8.1 基本对话

```
你: 你好，介绍一下你自己
Gemini: 你好！我是 Gemini，一个由 Google 开发的 AI 助手...
```

### 8.2 文件操作

```
你: 列出当前目录的文件
你: 读取 test.py 的内容
你: 创建一个 hello.txt，写入"你好世界"
你: 把 hello.txt 中的"你好"改成"Hello"
```

### 8.3 执行命令

```
你: 运行 python test.py
你: 执行 pip list 看看安装了什么包
```

### 8.4 权限确认

敏感操作会请求确认：

```
==================================================
⚠️  敏感操作请求: 写入文件
==================================================
详情: 文件: hello.txt
内容预览: 你好世界...

选项:
  [Y] 允许这次操作
  [A] 始终允许此类操作 (write_file)
  [N] 拒绝操作

请选择 [Y/A/N]:
```

- **Y** - 仅允许这一次
- **A** - 以后同类操作都自动允许
- **N** - 拒绝操作

### 8.5 特殊命令

| 命令 | 功能 |
|------|------|
| `quit` / `退出` | 结束对话 |
| `reset` | 重置权限设置 |
| `clear` | 清除对话历史 |

---

## 9. 常见问题

### Q1: 提示"无法连接"或"503错误"

**原因**：网络无法访问 API 服务

**解决**：
1. 确保代理软件已开启
2. 检查代理端口是否正确
3. 检查 API 地址是否正确

### Q2: 提示"API Key 无效"

**原因**：API Key 配置错误

**解决**：
1. 检查环境变量 `GEMINI_API_KEY` 是否设置正确
2. 确认 API Key 与 API 服务匹配（转发服务的 Key 不能用于官方 API）

### Q3: 提示"模块未找到"

**原因**：依赖未安装

**解决**：
```cmd
pip install openai
```

### Q4: 输入 `gemini` 提示"不是内部或外部命令"

**原因**：PATH 未配置或未生效

**解决**：
1. 确认 `C:\Gemini` 已添加到 PATH
2. 重新打开命令提示符窗口
3. 确认 `gemini.bat` 文件存在

### Q5: 中文显示乱码

**解决**：在命令提示符中执行：
```cmd
chcp 65001
```

或使用 Windows Terminal（推荐）代替传统命令提示符。

---

## 附录：可用工具列表

| 工具 | 功能 | 需要确认 |
|------|------|----------|
| read_file | 读取文件 | 否 |
| write_file | 创建/覆盖文件 | 是 |
| edit_file | 编辑文件 | 是 |
| delete_file | 删除文件 | 是 |
| list_directory | 列出目录 | 否 |
| create_directory | 创建目录 | 是 |
| delete_directory | 删除目录 | 是 |
| run_command | 执行命令 | 是 |
| search_files | 搜索文件 | 否 |
| get_file_info | 获取文件信息 | 否 |
| get_current_directory | 获取当前目录 | 否 |
| change_directory | 切换目录 | 否 |

---

如有问题，欢迎反馈！
