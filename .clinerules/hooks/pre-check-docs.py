#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文档同步预检查 + Git 提交钩子 —— 在功能开发完成时自动执行。

功能：
1. 检查 docs/ 和 测试脚本与问题记录/ 下的文档是否存在与内容完整性
2. 验证各文档之间的交叉引用一致性
3. 检查版本号一致性
4. 生成 Git Commit 提交并自动提交

用法：
    # 仅检查（推荐开发时使用）
    python .clinerules/hooks/pre-check-docs.py

    # 检查 + 提交（确认文档就绪后使用）
    python .clinerules/hooks/pre-check-docs.py --commit --desc "提交说明"

依赖：无（使用 Python 标准库），需要已安装 git。
兼容：Windows / Linux / macOS
"""

import os
import re
import sys
import subprocess
from pathlib import Path

# ===== 编码兼容 =====
if sys.stdout.encoding != 'utf-8' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# ===== 配置：实际存在的文档清单 =====

# 需要检查的文档路径（相对于项目根目录）
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

# 各文档的交叉引用关系图（源文档 -> 目标文档）
CROSS_REFERENCES = {
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
    "docs/产品需求文档-PRD.md": [
        "docs/已完成阶段详细清单与更新日志.md",
    ],
    "docs/技术方案设计.md": [
        "docs/已完成阶段详细清单与更新日志.md",
    ],
}

# 各文档的预期文件头标记（用于快速识别文档类型）
DOC_HEADER_MARKERS = {
    "docs/README.md": "音乐视频课程销售平台",
    "docs/产品需求文档-PRD.md": "产品需求文档",
    "docs/技术方案设计.md": "技术方案设计",
    "docs/经验教训汇总.md": "经验教训汇总",
    "docs/已完成阶段详细清单与更新日志.md": "已完成阶段详细清单",
    "docs/开发路线.md": "开发路线图",
    "docs/技术栈.md": "技术栈",
    "测试脚本与问题记录/问题记录与修复日志.md": "问题记录与修复日志",
}

# ===== 检查函数 =====


def check_file_exists(filepath):
    full_path = PROJECT_ROOT / filepath
    return full_path.exists()


def check_cross_reference(source, target):
    source_path = PROJECT_ROOT / source
    if not source_path.exists():
        return True
    # 归档目录不强制检查引用链接
    if target.endswith("/"):
        return True
    content = source_path.read_text(encoding="utf-8")
    target_name = Path(target).stem
    # 匹配 [文本](路径) 格式的 Markdown 链接，其中路径包含目标文件名
    link_pattern = re.compile(r'\[' + re.escape(target_name) + r'\]\([^)]+\)')
    if not link_pattern.search(content):
        print(f"  [?] {source} 缺少指向 {target} 的引用链接")
        return False
    return True


def check_version_consistency():
    version_pattern = re.compile(r'版本[：:]\s*v?(\d+\.\d+(?:\.\d+)?)')
    versions = {}
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
    """获取已修改的文档文件列表"""
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=PROJECT_ROOT,
            capture_output=True, text=True, check=True
        )
        changed_files = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                parts = line.strip().split(None, 1)
                if len(parts) == 2:
                    status, filepath = parts
                    # 只关注 docs/ 和 测试脚本与问题记录/ 下的变更
                    if filepath.startswith("docs/") or filepath.startswith("测试脚本与问题记录/"):
                        changed_files.append((status, filepath))
        return changed_files
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []


def git_auto_commit(description):
    """
    自动生成并执行 Git Commit
    
    根据修改的文件类型，自动选择 Conventional Commits 类型。
    自动执行: git add -A -> git commit
    """
    print("\n--- Git 自动提交 ---")

    changed_docs = git_check_changed_docs()
    if not changed_docs:
        print("  [?] 未检测到文档变更，跳过提交")
        return True

    print("  [i] 检测到以下文件变更：")
    for status, filepath in changed_docs:
        status_map = {'M': '修改', 'A': '新增', 'D': '删除', '??': '未跟踪'}
        s = status_map.get(status, status)
        print(f"      {s}: {filepath}")

    # 默认使用 docs 类型
    commit_type = "docs"

    # 构建提交信息
    commit_msg = f"{commit_type}: {description}"

    # 添加详细描述（列出变更的文件）
    detail_lines = ["", "本次变更涉及的文件："]
    for _, filepath in changed_docs:
        detail_lines.append(f"- {filepath}")
    
    commit_body = "\n".join(detail_lines)
    full_msg = commit_msg + commit_body

    print(f"\n  提交信息：{commit_msg}")

    try:
        # git add -A（暂存所有变更）
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_ROOT, check=True, capture_output=True)

        # git commit
        result = subprocess.run(
            ["git", "commit", "-m", full_msg],
            cwd=PROJECT_ROOT,
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"  [OK] 提交成功")
            if result.stdout.strip():
                print(f"       {result.stdout.strip()}")
            return True
        else:
            stderr = result.stderr.strip()
            if "nothing to commit" in stderr or "no changes" in stderr:
                print("  [?] 没有需要提交的变更")
                return True
            print(f"  [!] 提交失败：{stderr[:200]}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"  [!] Git 命令失败：{e}")
        return False
    except FileNotFoundError:
        print("  [!] 未检测到 git 命令，跳过自动提交")
        return False


def run_checks():
    """执行所有检查，返回是否全部通过"""
    all_pass = True

    # 1. 文件存在性检查
    print("\n[1/5] 文档文件存在性检查")
    for doc in DOCS_TO_CHECK:
        if check_file_exists(doc):
            print(f"  [OK] {doc}")
        else:
            print(f"  [!] {doc} 不存在！")
            all_pass = False

    # 2. 文档内容完整性检查
    print("\n[2/5] 文档内容完整性检查")
    for doc_path, marker in DOC_HEADER_MARKERS.items():
        full_path = PROJECT_ROOT / doc_path
        if full_path.exists():
            content = full_path.read_text(encoding="utf-8")
            if marker in content:
                print(f"  [OK] {doc_path}")
            else:
                print(f"  [?] {doc_path} 可能内容异常（未找到标记）")

    # 3. 交叉引用检查
    print("\n[3/5] 交叉引用链接检查")
    ref_issues = False
    for source, targets in CROSS_REFERENCES.items():
        for target in targets:
            if not check_cross_reference(source, target):
                ref_issues = True
    if not ref_issues:
        print("  [OK] 所有交叉引用链接正常")
    else:
        all_pass = False

    # 4. 版本号一致性检查
    print("\n[4/5] 版本号一致性检查")
    if not check_version_consistency():
        all_pass = False

    # 5. 功能状态标记检查（提示）
    print("\n[5/5] 功能状态标记检查")
    prd_path = PROJECT_ROOT / "docs/产品需求文档-PRD.md"
    if prd_path.exists():
        # 统计功能标记数量
        content = prd_path.read_text(encoding="utf-8")
        completed = len(re.findall(r'✅', content))
        pending = len(re.findall(r'❌', content))
        waiting = len(re.findall(r'⏳', content))
        print(f"  [i] PRD 功能状态统计：已完成 {completed}，待开发 {pending}，待开始 {waiting}")
    else:
        print("  [?] PRD 文档不存在，跳过")

    return all_pass


def main():
    # 解析参数
    should_commit = "--commit" in sys.argv
    commit_desc = None
    
    # 提取 --desc 参数
    for i, arg in enumerate(sys.argv):
        if arg == "--desc" and i + 1 < len(sys.argv):
            commit_desc = sys.argv[i + 1]

    print()
    print("=" * 60)
    print("  文档同步预检查")
    print("=" * 60)

    all_pass = run_checks()

    # 汇总
    print()
    print("=" * 60)
    if all_pass:
        print("  预检查全部通过！文档状态良好。")
    else:
        print("  存在需要关注的问题，请根据以上提示处理。")

    # 自动提交
    if should_commit:
        if not commit_desc:
            commit_desc = "文档同步与整理"
        success = git_auto_commit(commit_desc)
        if success:
            print("\n  提交完成。")
        else:
            print("\n  [!] 提交失败，请手动处理。")
            return 1
    else:
        print("\n  [i] 如需提交，请执行：")
        print(f"      python .clinerules/hooks/pre-check-docs.py --commit --desc \"提交说明\"")

    print("=" * 60)
    print()
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
