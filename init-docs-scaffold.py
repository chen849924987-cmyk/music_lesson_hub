#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
  文档脚手架初始化工具 —— 一键生成项目开发文档体系
================================================================================

功能说明：
  当你启动一个全新的项目工程时，运行此脚本即可自动创建一套完整的
  文档脚手架（docs/ + .clinerules/ + 测试脚本与问题记录/），
  帮助你从一开始就建立规范化的文档维护体系。

使用方法：
    python init-docs-scaffold.py

    运行后脚本会提示输入项目基本信息（如项目名称、描述等），
    然后自动生成全部文档模板文件。

生成的文件结构：
    .clinerules/
    ├── promot.md                        # 开发规范与流程
    ├── UI设计规范.md                     # UI 设计规范
    ├── 经验教训汇总精简版.md               # 经验教训精简版
    └── hooks/
        └── pre-check-docs.py            # 文档同步预检查钩子

    docs/
    ├── README.md                        # 项目总览 README
    ├── 产品需求文档-PRD.md                # 产品需求文档
    ├── 技术方案设计.md                    # 技术方案设计文档
    ├── 开发路线.md                       # 开发路线图
    ├── 已完成阶段详细清单与更新日志.md      # 已完成功能清单与更新日志
    ├── 经验教训汇总.md                    # 经验教训汇总文档
    ├── 技术栈.md                         # 技术选型汇总

    测试脚本与问题记录/
    ├── 问题记录与修复日志.md               # 活跃问题记录
    └── 归档/                             # 历史归档目录（初始为空）

依赖：Python 3.6+ (仅使用标准库，无需额外安装)
兼容：Windows / Linux / macOS

版本：v1.0
最后更新：2026-05-16
================================================================================
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# ============================================================
# 编码兼容
# ============================================================
if sys.stdout.encoding != 'utf-8' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================
# 全局常量
# ============================================================
CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")


def get_project_info():
    """
    交互式获取用户输入的项目基本信息。
    返回包含项目信息的字典。
    """
    print()
    print("=" * 60)
    print("  欢迎使用 文档脚手架初始化工具")
    print("=" * 60)
    print()
    print("请填写以下项目基本信息（直接回车使用默认值）：")
    print()

    info = {
        "project_name": "我的项目",
        "project_desc": "一个高质量的项目",
        "tech_stack": "Vue 3 + NestJS",
        "author": "开发团队"
    }

    name = input("  项目名称 [默认: 我的项目]: ").strip()
    if name:
        info["project_name"] = name

    desc = input("  项目一句话描述 [默认: 一个高质量的项目]: ").strip()
    if desc:
        info["project_desc"] = desc

    tech = input("  主要技术栈 [默认: Vue 3 + NestJS]: ").strip()
    if tech:
        info["tech_stack"] = tech

    author = input("  作者/团队名 [默认: 开发团队]: ").strip()
    if author:
        info["author"] = author

    print()
    return info


def create_directory(path):
    """创建目录（如果不存在）"""
    Path(path).mkdir(parents=True, exist_ok=True)


def write_file(path, content):
    """写入文件，自动创建父目录"""
    file_path = Path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")
    print(f"  [OK] 创建文件: {path}")


# ============================================================
# 模板定义
# ============================================================

def get_promot_template(info):
    """返回 .clinerules/promot.md 内容"""
    return f"""# Role & Philosophy

你是一名资深的全栈开发架构师。
你的核心职责是编写高质量、高可维护性、高可读性的代码，并严格遵守工程化开发规范。
**所有交互、思考过程、代码注释、提交记录必须完全使用简体中文。**

# 1. 语言与注释规范

**核心原则：代码是写给人看的，注释必须清晰详尽，杜绝模糊不清。**

1. **全中文交互**：

   * 无论是解释代码、思考过程、生成 Commit Message 还是编写文档，**必须**使用简体中文。
   * 保留专业技术名词（如 `Promise`, `Component`, `Interface`）的英文原文，不进行强行翻译。
2. **强制性文档注释**：

   * **每一个**类、公共方法、导出函数（Function/Method）都必须包含标准的文档注释。
   * **注释格式必须包含**：
     * `功能描述`：一句话清晰描述该函数解决什么业务问题。
     * `@param`：详细说明参数名称、数据类型、以及参数的业务含义（必填/选填）。
     * `@return`：详细说明返回值的类型、数据结构以及不同情况下的返回内容。
3. **行内注释**：

   * 对于复杂的逻辑判断、正则表达式或算法实现，必须在代码行上方添加中文注释，解释"为什么要这么写"以及"逻辑流向"。

# 2. 项目结构意识

**核心原则：严谨区分上下文，防止前后端代码混淆。**

1. **目录隔离**：

   * 在编写代码前，必须先分析当前项目的目录结构。
   * 如果项目是前后端分离结构（例如存在 `frontend/` vs `backend/`, `client/` vs `server/`）：
     * **严禁**在前端目录下创建后端逻辑文件（如数据库连接、API 路由）。
     * **严禁**在后端目录下引入前端组件（如 React/Vue 组件）。
   * 在执行文件操作时，必须明确指定所属的根目录模块。
2. **路径规范**：

   * 引用文件或生成新文件时，始终使用清晰的相对路径或绝对路径，确保文件落位准确。

# 3. 开发闭环工作流 (The Development Loop)

你必须严格按照以下闭环流程执行任务。**只有完成当前功能的所有收尾工作（提交+文档），才能进入下一个功能的开发。**

## Phase 1: 思考与设计 (Think)

* 也就是 "Chain of Thought"。在写代码前，用中文列出实现步骤。
* 确认修改的文件路径，确认前后端界限。

## Phase 2: 代码实现 (Code)

* 编写代码，严格执行上述"注释规范"。
* 保持原子化：一次只解决一个具体的需求或 Bug，不要在这个阶段做无关的优化。

## Phase 3: 交付与归档 (Mandatory Closing)

**当功能代码编写完成并验证无误后，必须按顺序执行以下两步操作：**

### Step A: 提交代码 (Git Commit)

生成符合 **Conventional Commits** 规范的中文提交信息：

* `feat: <描述>` (新增功能，例如：`feat: 完成用户登录接口开发`)
* `fix: <描述>` (修复 Bug)
* `docs: <描述>` (文档变更)
* `style: <描述>` (格式化，不影响代码运行的变动)
* `refactor: <描述>` (代码重构)

### Step B: 完善项目文档 (Doc Update)

**这一步是强制的。** 立即检查项目 docs 目录下的 `README.md`，`开发路线.md`，`产品需求文档.md`，`技术方案设计.md` 或项目说明文件：

1. **功能更新**：将新开发的功能点添加到"功能列表"或"更新日志"中。
2. **接口同步**：如果修改了 API，同步更新文档中的接口定义、参数说明。
3. **配置检查**：如果引入了新的依赖或环境变量，必须在文档的"安装/配置"部分进行更新。
4. **错误总结**：如果修复了一个 bug，必须对测试脚本与问题记录文件夹下的`问题记录与修复日志.md`进行更新，但记住功能类的更新不写入此文档。

---

# 4. 细分开发框架要求

### 1. Python 开发规范

* **依赖管理**：禁止直接使用 `pip install` 操作环境。必须在项目根目录维护 `requirements.txt` 或 `pyproject.toml`。新引入库后，必须同步更新依赖文件。
* **环境隔离**：必须使用 `venv` 或 `Conda` 进行环境隔离，并在文档中注明 Python 版本（建议 ≥3.10）。
* **配置管理**：严禁硬编码。必须使用 `.env` 文件配合 `python-dotenv` 加载环境变量，或使用 `settings.yaml` 管理配置。
* **异步编程**：涉及网络请求必须使用 `asyncio` 异步框架，严禁在异步函数中使用同步阻塞库。

### 2. JavaScript/TypeScript 开发规范

* **依赖管理**：维护 `package.json` + lock 文件，禁止全局安装。
* **ESLint + Prettier**：必须配置代码规范检查工具。
* **TypeScript 优先**：新项目优先使用 TypeScript，类型定义需完整。

### 3. Java 开发规范

* **持久层约束**：必须使用 `MyBatis-Plus`。禁止手写基础 CRUD SQL。
* **代码生成器**：新模块开发必须先配置 `MyBatis-Plus Generator` 自动生成 Entity、Mapper、Service 接口。
* **统一响应**：所有 Controller 必须返回统一的 `Result<T>` 包装类。
* **异常拦截**：必须编写 `@RestControllerAdvice` 全局异常处理器。

### 4. Vue 前端开发规范

* **样式约束**：
  * **禁止内联**：严禁在 HTML 标签上编写 `style` 属性。
  * **Class 优先**：必须使用 Scoped CSS 或 Tailwind CSS 类的组合。
  * **设计变量**：字体大小、主题色、间距必须引用全局 CSS 变量。
* **组件通信**：禁止使用 `props` 深层传递（超过3层）。跨组件状态必须使用 Pinia/Vuex 存储。
* **TypeScript**：所有组件必须声明 `Props` 和 `Emits` 的接口定义。

### 5. NestJS 后端开发规范

**核心原则**：类型安全、路由顺序敏感、ORM 列名显式、响应包装不截断。

* **路由顺序**：具名路由（`pending-review`）必须定义在通配路由（`:id`）之前。
* **联合类型列**：`number | null` 等联合类型字段必须显式声明 `@Column({{ type: 'int', nullable: true }})`。
* **手写 SQL 列名**：若 `@Column()` 未指定 `name`，SQL 中用驼峰列名。
* **分页响应额外字段**：用 `ApiResponse.success({{ items, meta, stats }})`。
* **DTO 类型转换**：`@Type(() => Number)` + `@IsInt()` 配合使用。

### 6. 通用工程化底座

不论何种语言，必须遵循：

1. **日志规范**：必须包含 Logger 记录，禁止使用 `print()` 或 `System.out.println()`，日志确保可以自动删除15天以上的防止日志文件无限变大。
2. **文件规范**：文件夹和模块必须清晰的分割开来，不允许把所有的文件全部放到根目录下。
3. **单元测试**：核心业务逻辑必须配套编写测试用例。
4. **代码规范**：新生成的代码注意不要重复造轮子，需要查看原来的框架中是否存在类似的方法，可通用的方法整理到 utils 或者 tools 中。

## 7. 文档同步钩子（Post-Development Hook）

**每次功能开发完成后，必须执行以下文档同步检查：**

```bash
python .clinerules/hooks/pre-check-docs.py
```

该钩子脚本会自动执行以下检查：
1. 所有必需文档是否存在
2. 文档内容完整性（文件头标记）
3. 交叉引用链接是否缺失
4. 各文档版本号一致性
5. PRD 功能状态标记完整性

**执行准则：**
每当你完成一个功能开发，请按照以下模板结束对话，提示用户确认：

> **功能已完成**
>
> 1. 代码已更新（附带关键注释）。
> 2. Git Commit 建议：`feat: ...`
> 3. 文档同步预检查已执行（`python .clinerules/hooks/pre-check-docs.py`）。
> 4. 文档已同步更新。
"""


def get_ui_design_spec_template(info):
    """返回 .clinerules/UI设计规范.md 内容"""
    return f"""# UI设计规范

> **版本**: v1.0
> **最后更新**: {CURRENT_DATE}
> **设计参考**: （请在此处填写参考的 UI 设计系统）
> **应用范围**: {info['project_name']} 前端

---

## 1. 设计原则

- **简洁高效**：减少不必要的视觉干扰，聚焦内容本身。
- **一致统一**：所有组件遵循统一的设计令牌（Design Tokens），确保视觉一致性。
- **双主题支持**（可选）：完整支持亮色（Light）和暗色（Dark）两种主题。
- **响应式适配**：适配桌面端与移动端的不同场景。

---

## 2. 设计令牌体系（Design Tokens）

### 2.1 品牌色板（Brand Colors）

| 令牌 | 用途 | 亮色主题值 | 暗色主题值 |
|------|------|-----------|-----------|
| `--color-primary` | 主色 / 品牌色 | `#0066FF` | `#4D94FF` |
| `--color-primary-dark` | 主色（深） | `#0052CC` | `#285AA8` |
| `--color-success` | 成功状态 | `#10B981` | `#34D399` |
| `--color-warning` | 警告状态 | `#F59E0B` | `#FBBF24` |
| `--color-danger` | 危险/错误状态 | `#EF4444` | `#F87171` |
| `--color-info` | 信息提示 | `#3B82F6` | `#60A5FA` |

> 以上色值为通用建议，请根据实际品牌规范修改。

### 2.2 中性色板（Neutral Colors）

| 令牌 | 用途 | 亮色主题值 | 暗色主题值 |
|------|------|-----------|-----------|
| `--color-bg-primary` | 主背景 | `#FFFFFF` | `#0F172A` |
| `--color-bg-secondary` | 次背景 | `#F8FAFC` | `#1E293B` |
| `--color-border` | 边框 | `#E2E8F0` | `#475569` |
| `--color-text-primary` | 主文字 | `#1E293B` | `#F1F5F9` |
| `--color-text-secondary` | 次要文字 | `#475569` | `#CBD5E1` |
| `--color-text-muted` | 占位文字 | `#94A3B8` | `#64748B` |

### 2.3 排版体系（Typography）

**字体栈（Font Stack）：**
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
--font-family-mono: 'SF Mono', 'Fira Code', 'Courier New', monospace;
```

**标题系统：**

| 级别 | 字号 | 行高 | 字重 |
|------|------|------|:----:|
| h1 | 2.5rem (40px) | 3rem | 700 |
| h2 | 2rem (32px) | 2.5rem | 700 |
| h3 | 1.75rem (28px) | 2rem | 600 |
| h4 | 1.5rem (24px) | 1.75rem | 600 |
| h5 | 1.25rem (20px) | 1.5rem | 600 |
| h6 | 1rem (16px) | 1.25rem | 600 |

### 2.4 间距体系（Spacing）

| 尺寸 | 值 | 场景 |
|------|---|------|
| xs | 0.25rem (4px) | 极小间距 |
| sm | 0.5rem (8px) | 常规元素间距 |
| md | 1rem (16px) | 组件间距 |
| lg | 1.5rem (24px) | 区块间距 |
| xl | 2rem (32px) | 大区块间距 |

---

## 3. 组件规范

### 3.1 按钮（Button）

| 属性 | 值 |
|------|----|
| 字号 | 0.875rem (14px) |
| 字重 | 600 |
| 圆角 | 0.25rem (4px) |
| 内边距 | 0.5rem 1.25rem |
| 过渡 | 0.2s ease |

**按钮变体：**

| 变体 | 背景色 | 文字色 |
|------|--------|-------|
| `.btn-primary` | `--color-primary` | `#FFFFFF` |
| `.btn-secondary` | 透明 | `--color-text-primary` |
| `.btn-danger` | `--color-danger` | `#FFFFFF` |

### 3.2 输入框（Input）

| 属性 | 值 |
|------|----|
| 内边距 | 0.625rem 0.875rem |
| 边框 | 1px solid `--color-border` |
| 圆角 | 0.25rem |
| Focus 状态 | 边框 color-primary + 阴影 |

### 3.3 卡片（Card）

| 属性 | 值 |
|------|----|
| 背景色 | `--color-bg-primary` |
| 边框 | 1px solid `--color-border` |
| 圆角 | 0.375rem (6px) |
| 内边距 | 1.5rem |

---

## 4. 布局体系

### 4.1 侧边栏（Sidebar）

| 属性 | 值 |
|------|----|
| 宽度 | 240px（桌面端） |
| 背景色 | `--color-bg-primary` |
| 菜单项激活 | 左侧 3px 竖条 |

### 4.2 顶部栏（Topbar）

| 属性 | 值 |
|------|----|
| 高度 | 56px |
| 背景色 | `--color-bg-primary` |

---

## 5. 命名约定

### 5.1 CSS 类名命名

BEM-like 风格：
```css
.block__element--modifier
```

### 5.2 CSS 变量命名

`--{{category}}-{{property}}` 格式：
```
--color-primary
--color-bg-primary
```

### 5.3 组件开发 Checklist

- [ ] 使用 CSS 变量，无硬编码颜色
- [ ] 同时测试亮色/暗色主题效果
- [ ] 添加必要的过渡动画
- [ ] 适配手机端屏幕宽度
- [ ] 空数据和加载状态有对应的占位显示
"""


def get_lessons_template(info):
    """返回 .clinerules/经验教训汇总精简版.md 内容"""
    return f"""# 经验教训汇总（精简引用版）

> 版本：v1.0
> 最后更新：{CURRENT_DATE}
>
> **说明**：本文件是经验教训汇总的精简引用版，供 AI 上下文快速查阅。
> 主文档为 `docs/经验教训汇总.md`，包含详细描述和代码示例。
> 所有更新请优先修改 `docs/经验教训汇总.md`，再同步本文件。

---

## 一、（请在此填写框架名称，如 NestJS / Vue / React）

| 规则 | 正确做法 | 错误后果 |
|:-----|:---------|:---------|
| （请填写经验规则1） | （正确做法描述） | （错误后果描述） |
| （请填写经验规则2） | （正确做法描述） | （错误后果描述） |

## 二、（请填写第二个框架或领域名称）

| 规则 | 正确做法 | 错误后果 |
|:-----|:---------|:---------|
| （请填写经验规则1） | （正确做法描述） | （错误后果描述） |

## 三、其他注意事项

- （请在此处填写其他跨领域的经验教训）
- （如：金额处理、日期格式、权限校验等）
"""


# ============================================================
# hooks 脚本模板（作为独立字符串，使用占位符替换）
# ============================================================

# 预检查 hooks 脚本的模板（{{PROJECT_NAME}} 和 {{CURRENT_DATE}} 会在运行时替换）
HOOKS_SCRIPT_TEMPLATE = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文档同步预检查 + Git 提交钩子 —— 在功能开发完成时自动执行。

功能：
1. 检查 docs/ 和 测试脚本与问题记录/ 下的文档是否存在与内容完整性
2. 验证各文档之间的交叉引用一致性
3. 检查版本号一致性
4. 可选：自动生成 Git Commit 信息

用法：
    # 仅检查（推荐开发时使用）
    python .clinerules/hooks/pre-check-docs.py

    # 检查 + 提交（确认文档就绪后使用）
    python .clinerules/hooks/pre-check-docs.py --commit --desc "提交说明"

依赖：无（使用 Python 标准库），需要已安装 git。
兼容：Windows / Linux / macOS

项目：{PROJECT_NAME}
生成时间：{CURRENT_DATE}
"""

import os
import re
import sys
import subprocess
from pathlib import Path

if sys.stdout.encoding != 'utf-8' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# 配置：文档清单（可按实际项目修改）
DOCS_TO_CHECK = [
    "docs/README.md",
    "docs/产品需求文档-PRD.md",
    "docs/技术方案设计.md",
    "docs/开发路线.md",
    "docs/已完成阶段详细清单与更新日志.md",
    "docs/经验教训汇总.md",
    "docs/技术栈.md",
    "测试脚本与问题记录/问题记录与修复日志.md",
]

CROSS_REFERENCES = {{
    "docs/README.md": [
        "docs/产品需求文档-PRD.md",
        "docs/技术方案设计.md",
        "docs/开发路线.md",
        "docs/经验教训汇总.md",
        "docs/技术栈.md",
        "docs/已完成阶段详细清单与更新日志.md",
        "测试脚本与问题记录/问题记录与修复日志.md",
        "测试脚本与问题记录/归档/",
    ],
    "docs/开发路线.md": [
        "docs/已完成阶段详细清单与更新日志.md",
    ],
}}

DOC_HEADER_MARKERS = {{
    "docs/README.md": "{PROJECT_NAME}",
    "docs/产品需求文档-PRD.md": "产品需求文档",
    "docs/技术方案设计.md": "技术方案设计",
    "docs/经验教训汇总.md": "经验教训汇总",
    "docs/已完成阶段详细清单与更新日志.md": "已完成阶段详细清单",
    "docs/开发路线.md": "开发路线",
    "docs/技术栈.md": "技术栈",
    "测试脚本与问题记录/问题记录与修复日志.md": "问题记录与修复日志",
}}


def check_file_exists(filepath):
    full_path = PROJECT_ROOT / filepath
    return full_path.exists()


def check_cross_reference(source, target):
    source_path = PROJECT_ROOT / source
    if not source_path.exists():
        return True
    if target.endswith("/"):
        return True
    content = source_path.read_text(encoding="utf-8")
    target_name = Path(target).stem
    link_pattern = re.compile(r'\\[' + re.escape(target_name) + r'\\]\\([^)]+\\)')
    if not link_pattern.search(content):
        print(f"  [?] {source} 缺少指向 {target} 的引用链接")
        return False
    return True


def check_version_consistency():
    version_pattern = re.compile(r'版本[：:]\\s*v?(\\d+\\.\\d+(?:\\.\\d+)?)')
    versions = {{}}
    for doc_path in DOCS_TO_CHECK:
        full_path = PROJECT_ROOT / doc_path
        if not full_path.exists():
            continue
        content = full_path.read_text(encoding="utf-8")
        match = version_pattern.search(content)
        if match:
            versions[doc_path] = match.group(1)
    if versions:
        unique_versions = set(versions.values())
        if len(unique_versions) > 1:
            print("  [!] 版本号不一致：")
            for doc, ver in versions.items():
                print(f"      {doc}: v{ver}")
            return False
        print(f"  [OK] 版本号一致: v{list(versions.values())[0]}")
    return True


def git_check_changed_docs():
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=PROJECT_ROOT,
            capture_output=True, text=True, check=True
        )
        changed_files = []
        for line in result.stdout.strip().split('\\n'):
            if line.strip():
                parts = line.strip().split(None, 1)
                if len(parts) == 2:
                    status, filepath = parts
                    if filepath.startswith("docs/") or filepath.startswith("测试脚本与问题记录/"):
                        changed_files.append((status, filepath))
        return changed_files
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []


def git_auto_commit(description):
    print("\\n--- Git 自动提交 ---")
    changed_docs = git_check_changed_docs()
    if not changed_docs:
        print("  [?] 未检测到文档变更，跳过提交")
        return True
    print("  [i] 检测到以下文件变更：")
    for status, filepath in changed_docs:
        status_map = {{'M': '修改', 'A': '新增', 'D': '删除', '??': '未跟踪'}}
        s = status_map.get(status, status)
        print(f"      {s}: {filepath}")

    commit_type = "docs"
    commit_msg = f"{{commit_type}}: {{description}}"

    detail_lines = ["", "本次变更涉及的文件："]
    for _, filepath in changed_docs:
        detail_lines.append(f"- {{filepath}}")

    commit_body = "\\n".join(detail_lines)
    full_msg = commit_msg + commit_body
    print(f"\\n  提交信息：{{commit_msg}}")

    try:
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_ROOT, check=True, capture_output=True)
        result = subprocess.run(
            ["git", "commit", "-m", full_msg],
            cwd=PROJECT_ROOT,
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"  [OK] 提交成功")
            if result.stdout.strip():
                print(f"       {{result.stdout.strip()}}")
            return True
        else:
            stderr = result.stderr.strip()
            if "nothing to commit" in stderr or "no changes" in stderr:
                print("  [?] 没有需要提交的变更")
                return True
            print(f"  [!] 提交失败：{{stderr[:200]}}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"  [!] Git 命令失败：{{e}}")
        return False
    except FileNotFoundError:
        print("  [!] 未检测到 git 命令，跳过自动提交")
        return False


def run_checks():
    all_pass = True

    print("\\n[1/5] 文档文件存在性检查")
    for doc in DOCS_TO_CHECK:
        if check_file_exists(doc):
            print(f"  [OK] {{doc}}")
        else:
            print(f"  [!] {{doc}} 不存在！")
            all_pass = False

    print("\\n[2/5] 文档内容完整性检查")
    for doc_path, marker in DOC_HEADER_MARKERS.items():
        full_path = PROJECT_ROOT / doc_path
        if full_path.exists():
            content = full_path.read_text(encoding="utf-8")
            if marker in content:
                print(f"  [OK] {{doc_path}}")
            else:
                print(f"  [?] {{doc_path}} 可能内容异常（未找到标记）")

    print("\\n[3/5] 交叉引用链接检查")
    ref_issues = False
    for source, targets in CROSS_REFERENCES.items():
        for target in targets:
            if not check_cross_reference(source, target):
                ref_issues = True
    if not ref_issues:
        print("  [OK] 所有交叉引用链接正常")
    else:
        all_pass = False

    print("\\n[4/5] 版本号一致性检查")
    if not check_version_consistency():
        all_pass = False

    print("\\n[5/5] 功能状态标记检查")
    prd_path = PROJECT_ROOT / "docs/产品需求文档-PRD.md"
    if prd_path.exists():
        content = prd_path.read_text(encoding="utf-8")
        completed = len(re.findall(r'✅', content))
        pending = len(re.findall(r'❌', content))
        waiting = len(re.findall(r'⏳', content))
        print(f"  [i] PRD 功能状态统计：已完成 {{completed}}，待开发 {{pending}}，待开始 {{waiting}}")
    else:
        print("  [?] PRD 文档不存在，跳过")

    return all_pass


def main():
    should_commit = "--commit" in sys.argv
    commit_desc = None
    for i, arg in enumerate(sys.argv):
        if arg == "--desc" and i + 1 < len(sys.argv):
            commit_desc = sys.argv[i + 1]

    print()
    print("=" * 60)
    print("  文档同步预检查")
    print("=" * 60)

    all_pass = run_checks()

    print()
    print("=" * 60)
    if all_pass:
        print("  预检查全部通过！文档状态良好。")
    else:
        print("  存在需要关注的问题，请根据以上提示处理。")

    if should_commit:
        if not commit_desc:
            commit_desc = "文档同步与整理"
        success = git_auto_commit(commit_desc)
        if success:
            print("\\n  提交完成。")
        else:
            print("\\n  [!] 提交失败，请手动处理。")
            return 1
    else:
        print("\\n  [i] 如需提交，请执行：")
        print(f"      python .clinerules/hooks/pre-check-docs.py --commit --desc \\\"提交说明\\\"")

    print("=" * 60)
    print()
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
'''


def get_pre_check_hooks_content(info):
    """
    返回 .clinerules/hooks/pre-check-docs.py 内容。
    使用占位符替换来处理复杂 Python 代码模板。
    """
    content = HOOKS_SCRIPT_TEMPLATE
    # 替换占位符
    content = content.replace("{PROJECT_NAME}", info["project_name"])
    content = content.replace("{CURRENT_DATE}", CURRENT_DATE)
    return content


def get_readme_template(info):
    """返回 docs/README.md 内容"""
    return f"""# {info['project_name']}

{info['project_desc']}

---

## 功能列表

> 请在此处填写项目的主要功能模块列表。

### 模块一
- 功能描述 1
- 功能描述 2

### 模块二
- 功能描述 1
- 功能描述 2

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | （请填写） | 前端框架 |
| **后端** | （请填写） | 后端框架 |
| **数据库** | （请填写） | 关系型/非关系型 |
| **缓存** | （请填写） | 缓存方案 |
| **文件存储** | （请填写） | 对象存储 |

> 详细技术栈说明请参考 [技术栈.md](技术栈.md)

---

## 快速开始

### 环境要求
- （请填写环境依赖，如 Node.js >= 20）

### 1. 安装依赖
```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

### 2. 配置环境变量
编辑 `.env` 文件中的配置信息。

### 3. 启动开发服务器
```bash
# 后端
cd backend && npm run start:dev

# 前端
cd frontend && npm run dev
```

---

## 项目结构

```
{info['project_name']}/
├── frontend/                    # 前端项目
│   └── src/
│       ├── api/                # API 请求层
│       ├── components/         # 公共组件
│       ├── views/              # 页面组件
│       ├── router/             # 路由配置
│       ├── stores/             # 状态管理
│       └── utils/              # 工具函数
├── backend/                     # 后端项目
│   └── src/
│       ├── modules/           # 业务模块
│       ├── common/            # 公共模块
│       └── config/            # 配置
├── docs/                        # 项目文档
└── 测试脚本与问题记录/           # 测试与问题记录
```

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [产品需求文档-PRD.md](docs/产品需求文档-PRD.md) | 详细功能需求、角色权限 |
| [技术方案设计.md](docs/技术方案设计.md) | 系统架构、模块设计 |
| [开发路线.md](docs/开发路线.md) | 开发阶段规划、当前进度 |
| [经验教训汇总.md](docs/经验教训汇总.md) | 从 Bug 修复中提炼的经验 |
| [技术栈.md](技术栈.md) | 技术选型汇总 |
| [.clinerules/promot.md](../.clinerules/promot.md) | 开发规范与流程 |
| [问题记录与修复日志.md](../测试脚本与问题记录/问题记录与修复日志.md) | 活跃问题记录 |

---

## 当前进度

| 阶段 | 版本 | 内容 | 状态 |
|------|------|------|:----:|
| Phase 1 | v1.0 | 基础功能开发 | 待开始 |

---

## 许可证

本项目采用 MIT 许可证。
"""


def get_prd_template(info):
    """返回 docs/产品需求文档-PRD.md 内容"""
    return f"""# 产品需求文档 (PRD) - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}
> 本次更新：初始版本

---

## 1. 产品概述

### 1.1 产品定位
{info['project_desc']}

### 1.2 产品目标
- 目标一：（请填写）
- 目标二：（请填写）
- 目标三：（请填写）

### 1.3 核心差异化
- 差异化特性一：（请填写）
- 差异化特性二：（请填写）

---

## 2. 角色权限体系

### 2.1 角色定义

| 角色 | 标识 | 核心职责 |
|------|------|---------|
| **超级管理员** | `super_admin` | 系统全局配置、账号管理 |
| **（请填写）** | （请填写） | （请填写） |
| **（请填写）** | （请填写） | （请填写） |

### 2.2 权限细分矩阵

> 请在此处填写各角色的详细权限矩阵表格。

---

## 3. 功能模块清单

### 3.1 模块一

| 功能 | 优先级 | 阶段 | 状态 |
|------|:------:|:----:|:----:|
| （功能名称） | P0 | v1.0 | 待开发 |
| （功能名称） | P1 | v2.0 | 待开发 |

### 3.2 模块二

| 功能 | 优先级 | 阶段 | 状态 |
|------|:------:|:----:|:----:|
| （功能名称） | P0 | v1.0 | 待开发 |

---

## 4. 非功能性需求

### 4.1 性能要求
- （请填写性能指标）

### 4.2 安全要求
- （请填写安全要求）

### 4.3 可用性要求
- （请填写可用性要求）

---

## 5. 业务流程

### 5.1 核心流程一
```
（请填写核心业务流程图）
```

### 5.2 核心流程二
```
（请填写核心业务流程图）
```

---

## 6. 页面路由规划

### 6.1 管理端路由

| 路由 | 页面 | 权限 | 阶段 |
|------|------|------|:----:|
| （路径） | （页面名） | （权限） | v1.0 |

### 6.2 其他端路由

---

## 7. 版本规划

| 阶段 | 版本 | 内容 | 预估工时 | 状态 |
|------|:----:|------|:--------:|:----:|
| Phase 1 | v1.0 | 初始版本 | （天数） | 待开始 |
| Phase 2 | v2.0 | （下一阶段） | （天数） | 待开始 |
"""


def get_technical_design_template(info):
    """返回 docs/技术方案设计.md 内容"""
    return f"""# 技术方案设计 - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}
> 本次更新：初始版本

---

## 1. 系统架构概览

### 1.1 整体架构图

```
+---------------------------------------------------------------+
|                        客户端（浏览器）                          |
|  +-----------+  +-----------+  +-----------+                  |
|  | 管理端页面  |  | 用户端页面  |  | 公开页面   |                  |
|  | /admin/*  |  | /app/*    |  | /*        |                  |
|  +-----+-----+  +-----+-----+  +-----+-----+                  |
+--------+----------------+----------------+---------------------+
         |                |                |
         +--------+-------+- HTTP/HTTPS ---+
                  |
+-----------------+------------------------+
|            后端 API 服务                     |
|  +--------------------------------------+  |
|  |  Guard(鉴权)  Pipe(校验)  Interceptor  |  |
|  +--------------------------------------+  |
|  +--------+ +--------+ +--------+ +------+ |
|  | 模块 A  | | 模块 B  | | 模块 C  | | ...  | |
|  +--------+ +--------+ +--------+ +------+ |
+-----------------+--------------------------+
                  |
+-----------------+--------------------------+
|                数据层                        |
|  +-----------+  +-----------+  +----------+ |
|  |  数据库    |  |   缓存     |  |  文件存储  | |
|  +-----------+  +-----------+  +----------+ |
+---------------------------------------------+
```

### 1.2 架构说明

- **前后端分离**：前端通过 RESTful API 与后端通信
- **RBAC 权限体系**：基于角色的访问控制
- **模块化设计**：后端采用模块化架构
- **三层架构**：Controller -> Service -> Repository

---

## 2. 技术选型详解

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| （请填写） | - | 前端框架 |
| （请填写） | - | 构建工具 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| （请填写） | - | 后端框架 |
| （请填写） | - | ORM |

### 2.3 基础设施

| 服务 | 用途 | 部署方式 |
|------|------|---------|
| （请填写） | （用途） | （部署方式） |

---

## 3. 后端模块设计

### 3.1 模块划分

```
src/
 +-- main.ts                    # 应用入口
 +-- common/                    # 公共模块
 |   +-- decorators/            # 自定义装饰器
 |   +-- guards/                # 守卫
 |   +-- interceptors/          # 拦截器
 |   +-- filters/               # 异常过滤器
 |   +-- pipes/                 # 管道
 |   +-- dto/                   # 公共 DTO
 |   +-- constants/             # 常量
 +-- modules/                   # 业务模块
 |   +-- auth/                  # 认证模块
 |   |   +-- auth.module.ts
 |   |   +-- auth.controller.ts
 |   |   +-- auth.service.ts
 |   +-- （其他模块）/
 +-- config/                    # 全局配置
```

### 3.2 模块依赖关系

```
（请在此处绘制模块依赖关系图）
```

---

## 4. 数据库设计

### 4.1 核心表清单

| 表名 | 说明 | 归属模块 | 状态 |
|------|------|---------|:----:|
| `users` | 用户表 | 用户模块 | 待建 |

### 4.2 核心表字段明细

> 请在此处填写各核心表的字段定义。

---

## 5. API 接口设计规范

### 5.1 通用规范

- **基础路径**：`/api/v1`
- **响应格式**：
```json
{{
  "code": 200,
  "message": "success",
  "data": {{}}
}}
```
- **分页响应格式**：
```json
{{
  "code": 200,
  "data": {{
    "items": [],
    "meta": {{
      "total": 0,
      "page": 1,
      "pageSize": 20,
      "totalPages": 0
    }}
  }}
}}
```

### 5.2 API 接口列表

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| （方法） | （路径） | （功能说明） | （权限） |

---

## 6. 认证与权限体系

### 6.1 认证流程
```
用户登录 -> 验证凭据 -> 生成 Token（含角色信息）
-> 客户端存储 -> 每次请求携带
```

### 6.2 权限控制
- RBAC（基于角色的访问控制）

---

## 7. 部署方案

### 7.1 环境配置
```
# .env 配置示例
NODE_ENV=development/production
DB_HOST=localhost
DB_PORT=3306
```

### 7.2 Docker 容器架构（可选）
```
（请填写 Docker 部署架构）
```

---

## 8. 开发规范

### 8.1 Git 分支策略

```
main          # 生产分支
 +-- develop  # 开发分支
 +-- feat/*   # 功能分支
 +-- fix/*    # 修复分支
 +-- release/*# 发布分支
```

### 8.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 后端模块 | 短横线式 | `course-management` |
| 前端组件 | PascalCase | `MyComponent.vue` |
| API 路径 | 短横线式 | `/course-list` |
| 数据库表 | 蛇形式 | `course_reviews` |

### 8.3 提交信息规范

```
feat: 新增功能
fix: 修复问题
docs: 文档更新
refactor: 重构
style: 格式化
```
"""


def get_roadmap_template(info):
    """返回 docs/开发路线.md 内容"""
    return f"""# 开发路线图 - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}

---

## 1. 版本规划总览

| 阶段 | 版本 | 内容 | 预估工时 | 状态 |
|------|:----:|------|:--------:|:----:|
| Phase 1 | v1.0 | 初始版本开发 | （天数） | 待开始 |
| Phase 2 | v2.0 | （下一阶段） | （天数） | 规划中 |
| Phase 3 | v3.0 | （未来阶段） | （天数） | 规划中 |

---

## 2. 各阶段详细计划

### v1.0：初始版本
> 基础功能开发与上线

**后端：**
- [ ] 项目初始化与环境搭建
- [ ] 用户认证模块
- [ ] （其他后端功能）

**前端：**
- [ ] 项目初始化
- [ ] 登录/注册页面
- [ ] （其他前端功能）

### v2.0：（阶段名称）
> （阶段目标描述）

**后端：**
- [ ] （功能清单）

**前端：**
- [ ] （功能清单）

---

## 3. 变更记录

| 日期 | 版本 | 变更内容 |
|------|:----:|---------|
| - | v1.0 | 初始版本规划 |
"""


def get_changelog_template(info):
    """返回 docs/已完成阶段详细清单与更新日志.md 内容"""
    return f"""# 已完成阶段详细清单与更新日志 - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}

---

## 当前进度总览

| 阶段 | 版本 | 状态 |
|------|:----:|:----:|
| Phase 1 | v1.0 | 开发中 |
| Phase 2 | v2.0 | 待开始 |

---

## 已完成的详细功能清单

### v1.0（当前开发中）

> 开发时间：（请填写起止时间）

#### 后端
- [ ] （功能点描述）
- [ ] （功能点描述）

#### 前端
- [ ] （功能点描述）
- [ ] （功能点描述）

---

## 各版本更新日志

### v1.0（当前开发中）
> 发布日期：（请填写）

#### 新增功能
- （功能描述）

#### Bug 修复
- （问题描述）

#### 重构
- （重构描述）

#### 文档
- （文档更新描述）
"""


def get_experience_summary_template(info):
    """返回 docs/经验教训汇总.md 内容"""
    return f"""# 经验教训汇总 - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}
>
> 用途：记录开发过程中遇到的典型问题、根因分析和解决方案。
> 目标：建立团队知识库，避免重复踩坑。

---

## 目录

1. [框架相关经验教训](#1-框架相关经验教训)
2. [前端开发经验教训](#2-前端开发经验教训)
3. [数据库与 ORM 经验教训](#3-数据库与-orm-经验教训)
4. [部署与运维经验教训](#4-部署与运维经验教训)
5. [其他经验教训](#5-其他经验教训)

---

## 1. 框架相关经验教训

### 1.1 （框架名称）

**问题描述**：（请描述问题现象）

**根因分析**：（请分析问题产生的原因）

**解决方案**：（请描述如何解决）

**预防措施**：（如何避免再次发生）

> 精简版引用：`.clinerules/经验教训汇总精简版.md`

---

## 2. 前端开发经验教训

### 2.1 （框架/领域名称）

**问题描述**：（请描述）

**根因分析**：（请分析）

**解决方案**：（请描述）

---

## 3. 数据库与 ORM 经验教训

### 3.1 （问题主题）

**问题描述**：（请描述）

**根因分析**：（请分析）

---

## 4. 部署与运维经验教训

---

## 5. 其他经验教训

---

## 附录：经验教训索引

| 类别 | 问题主题 | 严重程度 | 发生版本 | 是否已修复 |
|------|---------|:--------:|:--------:|:----------:|
| （分类） | （问题） | （高/中/低） | v1.0 |  |
"""


def get_tech_stack_template(info):
    """返回 docs/技术栈.md 内容"""
    return f"""# 技术栈 - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}

---

## 前端技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|:----:|------|
| 核心框架 | （请填写） | - | （框架说明） |
| 构建工具 | （请填写） | - | （构建工具说明） |
| 包管理 | （请填写） | - | （包管理工具） |
| 路由 | （请填写） | - | （路由方案） |
| 状态管理 | （请填写） | - | （状态管理方案） |
| HTTP 请求 | （请填写） | - | （HTTP 库） |
| UI 组件库 | （请填写） | - | （UI 库说明） |

## 后端技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|:----:|------|
| 核心框架 | （请填写） | - | （框架说明） |
| 语言 | （请填写） | - | （语言版本） |
| 数据库 | （请填写） | - | （数据库说明） |
| ORM | （请填写） | - | （ORM 方案） |
| 认证 | （请填写） | - | （认证方案） |
| 校验 | （请填写） | - | （校验方案） |
| 缓存 | （请填写） | - | （缓存方案） |
| 文件存储 | （请填写） | - | （存储方案） |

## 基础设施

| 服务 | 用途 | 部署方式 | 说明 |
|------|------|---------|------|
| （服务名称） | （用途） | （部署方式） | （说明） |

## 权限矩阵

> 请在此处填写各角色的权限矩阵表格。
"""


def get_issue_log_template(info):
    """返回 测试脚本与问题记录/问题记录与修复日志.md 内容"""
    return f"""# 问题记录与修复日志 - {info['project_name']}

> 版本：v1.0
> 最后更新：{CURRENT_DATE}
>
> 用途：记录最近的问题和修复方案，仅保留活跃项（建议保留最近2天）。
> 历史归档请移步 `归档/` 目录。

---

## 活跃问题

| 编号 | 问题描述 | 优先级 | 状态 | 发现时间 | 计划修复版本 |
|:----:|---------|:------:|:----:|:--------:|:-----------:|
| - | - | - | - | - | - |

---

## 最近修复记录

| 编号 | 问题描述 | 根因 | 解决方案 | 修复版本 | 修复时间 |
|:----:|---------|------|---------|:--------:|:--------:|
| - | - | - | - | v1.0 | - |

---

## 未解决/已知问题

> 此处列出已知但尚未解决的问题。

| 编号 | 问题描述 | 影响范围 | 优先级 | 备注 |
|:----:|---------|---------|:------:|------|
| - | - | - | - | - |
"""


def get_empty_archive_readme_template(info):
    """返回 测试脚本与问题记录/归档/README.md 内容"""
    return f"""# 问题记录归档目录

> 说明：此目录存放已归档的历史问题记录文件。
> 按版本或时间归档，文件命名格式：`v{{version}}-问题记录.md`

## 归档索引

> （请按实际情况填写）
>
> | 文件 | 覆盖版本 | 归档时间 |
> |------|---------|:--------:|
> | v1.0-问题记录.md | v1.0 | - |
"""


# ============================================================
# 主流程
# ============================================================


def main():
    # 1. 获取项目信息
    info = get_project_info()

    print()
    print("开始生成文档脚手架...")
    print("-" * 60)

    # ===== 2. 创建 .clinerules/ 目录 =====
    print("\n[1/4] 正在创建 .clinerules/ 目录...")
    create_directory(".clinerules/hooks")

    write_file(".clinerules/promot.md", get_promot_template(info))
    write_file(".clinerules/UI设计规范.md", get_ui_design_spec_template(info))
    write_file(".clinerules/经验教训汇总精简版.md", get_lessons_template(info))
    write_file(".clinerules/hooks/pre-check-docs.py", get_pre_check_hooks_content(info))

    # ===== 3. 创建 docs/ 目录 =====
    print("\n[2/4] 正在创建 docs/ 目录...")
    create_directory("docs")

    write_file("docs/README.md", get_readme_template(info))
    write_file("docs/产品需求文档-PRD.md", get_prd_template(info))
    write_file("docs/技术方案设计.md", get_technical_design_template(info))
    write_file("docs/开发路线.md", get_roadmap_template(info))
    write_file("docs/已完成阶段详细清单与更新日志.md", get_changelog_template(info))
    write_file("docs/经验教训汇总.md", get_experience_summary_template(info))
    write_file("docs/技术栈.md", get_tech_stack_template(info))

    # ===== 4. 创建 测试脚本与问题记录/ 目录 =====
    print("\n[3/4] 正在创建 测试脚本与问题记录/ 目录...")
    create_directory("测试脚本与问题记录/归档")

    write_file("测试脚本与问题记录/问题记录与修复日志.md", get_issue_log_template(info))
    write_file("测试脚本与问题记录/归档/README.md", get_empty_archive_readme_template(info))

    # ===== 5. 设置脚本权限（Unix） =====
    print("\n[4/4] 设置文件权限...")
    hooks_path = Path(".clinerules/hooks/pre-check-docs.py")
    try:
        hooks_path.chmod(0o755)
        print("  [OK] pre-check-docs.py 已设置为可执行")
    except Exception:
        pass  # Windows 不支持 chmod

    # ===== 完成汇总 =====
    print()
    print("=" * 60)
    print(f"  文档脚手架生成完毕！")
    print("=" * 60)
    print()
    print(f"  项目: {info['project_name']}")
    print(f"  作者: {info['author']}")
    print(f"  技术栈: {info['tech_stack']}")
    print()

    print(f"  共创建了 12 个文件：")
    print("     .clinerules/promot.md")
    print("     .clinerules/UI设计规范.md")
    print("     .clinerules/经验教训汇总精简版.md")
    print("     .clinerules/hooks/pre-check-docs.py")
    print("     docs/README.md")
    print("     docs/产品需求文档-PRD.md")
    print("     docs/技术方案设计.md")
    print("     docs/开发路线.md")
    print("     docs/已完成阶段详细清单与更新日志.md")
    print("     docs/经验教训汇总.md")
    print("     docs/技术栈.md")
    print("     测试脚本与问题记录/问题记录与修复日志.md")
    print("     测试脚本与问题记录/归档/README.md")
    print()
    print("-" * 60)
    print("  下一步操作：")
    print()
    print("  1. 查看生成的文档结构，根据实际项目修改内容")
    print("  2. 运行预检查测试：")
    print("     python .clinerules/hooks/pre-check-docs.py")
    print()
    print("  3. 将本脚本（init-docs-scaffold.py）保留在项目根目录")
    print("     以后新项目直接复制使用即可")
    print()
    print("=" * 60)
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
