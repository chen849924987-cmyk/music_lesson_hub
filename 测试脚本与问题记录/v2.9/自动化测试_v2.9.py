#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.9 管理端全面增强 - 自动化测试脚本
========================================
测试范围：
  1. AdminModule 统计接口（GET /admin/stats）
  2. 用户管理增强（搜索/筛选/启用禁用/删除）
  3. 教师管理增强（分页/详情/认证/取消认证）

使用方法：
  python "测试脚本与问题记录/v2.9/自动化测试_v2.9.py"

前置条件：
  1. MySQL/Redis/MinIO 已启动
  2. 种子数据已执行（node backend/scripts/seed.js）
  3. 后端已启动（npm run start:dev）
"""

import requests
import json
import time
import os
import sys
import io
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

# 设置控制台输出编码为 UTF-8（解决 Windows GBK 无法输出 emoji 的问题）
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================
# 配置
# ============================================================
BASE_URL = "http://localhost:3000/api/v1"
API_PREFIX = BASE_URL

# ============================================================
# 测试结果统计
# ============================================================
test_results = []
passed_count = 0
failed_count = 0
P0_failed = []
P1_failed = []
P2_failed = []


def record_result(
    case_id: str,
    case_name: str,
    priority: str,
    success: bool,
    actual_status: int = None,
    expected_status: int = None,
    detail: str = "",
):
    """
    记录单个测试用例的结果

    @param case_id 用例编号，如 TC-ADM-01
    @param case_name 用例名称
    @param priority 优先级 P0/P1/P2
    @param success 是否通过
    @param actual_status 实际 HTTP 状态码
    @param expected_status 期望 HTTP 状态码
    @param detail 详细说明
    """
    global passed_count, failed_count
    status_icon = "✅" if success else "❌"
    result_str = "通过" if success else "失败"

    test_results.append({
        "case_id": case_id,
        "case_name": case_name,
        "priority": priority,
        "success": success,
        "actual_status": actual_status,
        "expected_status": expected_status,
        "detail": detail,
    })

    if success:
        passed_count += 1
    else:
        failed_count += 1
        if priority == "P0":
            P0_failed.append(case_id)
        elif priority == "P1":
            P1_failed.append(case_id)
        else:
            P2_failed.append(case_id)

    print(f"  {status_icon} [{case_id}] {case_name} [{priority}] → {result_str}")
    if detail:
        print(f"      备注: {detail}")


def print_separator(title: str):
    """打印分隔标题"""
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}")


def print_subtitle(title: str):
    """打印子标题"""
    print(f"\n{'─' * 50}")
    print(f"  {title}")
    print(f"{'─' * 50}")


# ============================================================
# HTTP 请求辅助函数
# ============================================================

def get_data(data: dict) -> dict:
    """
    安全获取 API 响应中的 data 字段。

    @param data API 响应字典
    @returns data 字段的内容（可能为空字典）
    """
    if data and isinstance(data, dict):
        d = data.get("data")
        return d if isinstance(d, dict) else {}
    return {}


def get_items(data: dict) -> list:
    """安全获取分页结果中的 items 列表"""
    d = get_data(data)
    items = d.get("items", d.get("list", []))
    return items if isinstance(items, list) else []


def api_request(
    method: str,
    path: str,
    token: str = None,
    json_body: dict = None,
    files: dict = None,
    data: dict = None,
    params: dict = None,
    expected_status: int = 200,
    timeout: int = 10,
) -> Tuple[int, dict]:
    """
    发送 HTTP 请求并返回状态码和响应数据

    @param method 请求方法 (GET/POST/PUT/PATCH/DELETE)
    @param path API 路径
    @param token JWT token
    @param json_body JSON 请求体
    @param files 文件上传
    @param data form-data
    @param params 查询参数
    @param timeout 超时时间（秒）
    @returns (status_code, response_json)
    """
    url = f"{API_PREFIX}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, params=params, timeout=timeout)
        elif method == "POST":
            if files:
                headers.pop("Content-Type", None)
                resp = requests.post(url, headers=headers, files=files, data=data, timeout=timeout)
            elif data:
                headers.pop("Content-Type", None)
                resp = requests.post(url, headers=headers, data=data, timeout=timeout)
            else:
                resp = requests.post(url, headers=headers, json=json_body, timeout=timeout)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=json_body, timeout=timeout)
        elif method == "PATCH":
            resp = requests.patch(url, headers=headers, json=json_body, timeout=timeout)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=timeout)
        else:
            return 0, {"error": f"Unsupported method: {method}"}

        try:
            ret_data = resp.json()
        except:
            ret_data = {"raw_text": resp.text}

        return resp.status_code, ret_data

    except requests.exceptions.ConnectionError:
        return 0, {"error": f"无法连接到 {url}，请确保后端已启动"}
    except requests.exceptions.Timeout:
        return 0, {"error": f"请求超时: {url}"}
    except Exception as e:
        return 0, {"error": str(e)}


def login_admin() -> Optional[str]:
    """登录超级管理员"""
    # 实际路由：/auth/admin/login（从后端日志确认）
    status, data = api_request("POST", "/auth/admin/login", json_body={
        "username": "admin",
        "password": "admin123",
    })
    d = get_data(data)
    if status == 200 and d.get("accessToken"):
        token = d["accessToken"]
        print(f"  ✅ 登录成功 [admin] token: {token[:20]}...")
        return token
    else:
        print(f"  ❌ 登录失败 [admin]: status={status}, data={json.dumps(data, ensure_ascii=False, default=str)[:100]}")
        return None


def login_teacher() -> Optional[str]:
    """登录教师（使用统一管理员登录接口）"""
    status, data = api_request("POST", "/auth/admin/login", json_body={
        "username": "teacher01",
        "password": "admin123",
    })
    d = get_data(data)
    if status == 200 and d.get("accessToken"):
        token = d["accessToken"]
        print(f"  ✅ 登录成功 [teacher01] token: {token[:20]}...")
        return token
    else:
        print(f"  ❌ 登录失败 [teacher01]: status={status}, data={json.dumps(data, ensure_ascii=False, default=str)[:100]}")
        return None


def login_or_register_student() -> Optional[str]:
    """尝试登录或注册一个学员账号"""
    suffix = int(time.time())
    # 先尝试登录已有的学员
    status, data = api_request("POST", "/auth/login", json_body={
        "username": "student01",
        "password": "admin123",
    })
    d = get_data(data)
    if status == 200 and d.get("accessToken"):
        print(f"  ✅ 登录成功 [student01]")
        return d["accessToken"]
    # 注册新的
    print(f"  ℹ️ 注册新学员账号...")
    status, data = api_request("POST", "/auth/register", json_body={
        "username": f"test_student_{suffix}",
        "password": "admin123",
        "nickname": f"测试学员_{suffix}",
    })
    if status == 201 or status == 200:
        d = get_data(data)
        if d.get("accessToken"):
            return d["accessToken"]
        # 注册成功后自动登录
        status, data = api_request("POST", "/auth/login", json_body={
            "username": f"test_student_{suffix}",
            "password": "admin123",
        })
        d = get_data(data)
        if status == 200 and d.get("accessToken"):
            return d["accessToken"]
    return None


# ============================================================
# 测试场景实现
# ============================================================

def test_01_admin_stats():
    """
    测试 1: AdminModule 统计接口
    GET /api/v1/admin/stats
    """
    print_separator("1. AdminModule 统计接口")

    admin_token = login_admin()

    # ---------- TC-ADM-01: 管理员获取统计数据 ----------
    if admin_token:
        status, data = api_request("GET", "/admin/stats", token=admin_token)
        d = get_data(data)
        record_result(
            "TC-ADM-01", "管理员获取控制台统计数据", "P0",
            success=(status == 200) and d.get("totalUsers") is not None and d.get("totalTeachers") is not None,
            actual_status=status,
            expected_status=200,
            detail=f"用户:{d.get('totalUsers')} 教师:{d.get('totalTeachers')} 课程:{d.get('totalCourses')} 待审核:{d.get('pendingReviewCount')}",
        )

        # ---------- TC-ADM-02: 统计字段完整性 ----------
        # 后端实际返回的字段名为 pendingCourses / pendingAttachments，并非 pendingReviewCount
        required_fields = ["totalUsers", "totalTeachers", "totalCourses", "pendingCourses"]
        has_all_fields = all(field in d for field in required_fields)
        record_result(
            "TC-ADM-02", "统计接口返回所有必需字段", "P1",
            success=has_all_fields,
            detail=f"返回字段: {list(d.keys())}",
        )
    else:
        record_result("TC-ADM-01", "管理员获取控制台统计数据", "P0", False, detail="管理员登录失败，跳过测试")
        record_result("TC-ADM-02", "统计接口返回所有必需字段", "P1", False, detail="管理员登录失败，跳过测试")

    # ---------- TC-ADM-03: 教师无权访问统计 ----------
    teacher_token = login_teacher()
    if teacher_token:
        status, data = api_request("GET", "/admin/stats", token=teacher_token)
        record_result(
            "TC-ADM-03", "教师无权访问管理端统计", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )
    else:
        record_result("TC-ADM-03", "教师无权访问管理端统计", "P1", False, detail="教师登录失败，跳过测试")

    # ---------- TC-ADM-04: 未登录无权访问 ----------
    status, data = api_request("GET", "/admin/stats")
    record_result(
        "TC-ADM-04", "未登录无权访问管理端统计", "P1",
        success=(status == 401),
        actual_status=status,
        expected_status=401,
    )


def test_02_user_management():
    """
    测试 2: 用户管理增强
    - 用户列表搜索/筛选（keyword/role）
    - 切换启用/禁用状态
    - 删除用户
    """
    print_separator("2. 用户管理增强")

    admin_token = login_admin()
    if not admin_token:
        # 管理员登录失败，标记所有用例失败
        cases_info = [
            ("TC-USER-01", "获取用户列表（默认分页）", "P0"),
            ("TC-USER-02", "按角色筛选（teacher）", "P0"),
            ("TC-USER-03", "按角色筛选（admin）", "P1"),
            ("TC-USER-04", "关键词搜索（用户名: admin）", "P0"),
            ("TC-USER-05", "关键词搜索（无匹配）", "P2"),
            ("TC-USER-06", "切换用户状态（启用→禁用）", "P0"),
            ("TC-USER-07", "管理员不能删除自己", "P1"),
            ("TC-USER-08", "删除用户", "P0"),
            ("TC-USER-09", "删除后用户不存在", "P1"),
            ("TC-USER-10", "删除不存在的用户", "P2"),
            ("TC-USER-11", "未登录无权访问用户列表", "P1"),
            ("TC-USER-12", "教师无权访问用户列表", "P1"),
        ]
        for cid, cname, pri in cases_info:
            record_result(cid, cname, pri, False, detail="管理员登录失败，跳过测试")
        return

    # ---------- TC-USER-01: 获取用户列表（默认分页） ----------
    status, data = api_request("GET", "/users", token=admin_token)
    items = get_items(data)
    d = get_data(data)
    total = d.get("total", 0) or d.get("meta", {}).get("total", 0)
    record_result(
        "TC-USER-01", "获取用户列表（默认分页）", "P0",
        success=(status == 200) and len(items) > 0,
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条, 共 {total} 个用户",
    )

    # ---------- TC-USER-02: 按角色筛选（teacher） ----------
    status, data = api_request("GET", "/users", token=admin_token, params={"role": "teacher"})
    items = get_items(data)
    record_result(
        "TC-USER-02", "按角色筛选（teacher）", "P0",
        success=(status == 200) and len(items) > 0,
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条教师用户",
    )

    # ---------- TC-USER-03: 按角色筛选（admin） ----------
    status, data = api_request("GET", "/users", token=admin_token, params={"role": "admin"})
    items = get_items(data)
    record_result(
        "TC-USER-03", "按角色筛选（admin）", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条管理员用户",
    )

    # ---------- TC-USER-04: 关键词搜索（用户名） ----------
    status, data = api_request("GET", "/users", token=admin_token, params={"keyword": "admin"})
    items = get_items(data)
    record_result(
        "TC-USER-04", "关键词搜索（用户名: admin）", "P0",
        success=(status == 200) and len(items) > 0,
        actual_status=status,
        expected_status=200,
        detail=f"搜索'admin' 返回 {len(items)} 条",
    )

    # ---------- TC-USER-05: 关键词搜索（无匹配） ----------
    status, data = api_request("GET", "/users", token=admin_token, params={"keyword": "zzz_no_match_999"})
    items = get_items(data)
    record_result(
        "TC-USER-05", "关键词搜索（无匹配）", "P2",
        success=(status == 200) and len(items) == 0,
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条（期望0）",
    )

    # 找一个普通用户（不是admin自己）来测试启用/禁用
    status, data = api_request("GET", "/users", token=admin_token, params={"pageSize": 50})
    items = get_items(data)
    target_user = None
    for u in items:
        if u.get("username") != "admin":
            target_user = u
            break

    if target_user:
        user_id = target_user.get("id")
        current_active = target_user.get("isActive", target_user.get("active", True))

        # ---------- TC-USER-06: 切换用户状态（启用→禁用） ----------
        status, data = api_request("PATCH", f"/users/{user_id}/toggle", token=admin_token)
        d = get_data(data)
        new_active = d.get("isActive", d.get("active"))
        record_result(
            "TC-USER-06", "切换用户状态（启用→禁用）", "P0",
            success=(status == 200 or status == 201),
            actual_status=status,
            expected_status=200,
            detail=f"用户: {target_user.get('username')}, 原状态: {current_active}, 新状态: {new_active}",
        )

        # 恢复状态
        api_request("PATCH", f"/users/{user_id}/toggle", token=admin_token)
    else:
        record_result("TC-USER-06", "切换用户状态（启用→禁用）", "P0", False, detail="找不到非admin用户进行测试")

    # ---------- TC-USER-07: 管理员不能删除自己 ----------
    admin_data = None
    for u in items:
        if u.get("username") == "admin":
            admin_data = u
            break
    if admin_data:
        status, data = api_request("DELETE", f"/users/{admin_data.get('id')}", token=admin_token)
        record_result(
            "TC-USER-07", "管理员不能删除自己", "P1",
            success=(status == 400 or status == 403),
            actual_status=status,
            expected_status=400,
            detail=f"响应: {data.get('message', str(data))[:80]}",
        )
    else:
        record_result("TC-USER-07", "管理员不能删除自己", "P1", False, detail="找不到admin用户")

    # ---------- TC-USER-08: 删除用户（创建临时用户后删除） ----------
    # 创建临时用户
    suffix = int(time.time())
    status, data = api_request("POST", "/auth/register", json_body={
        "username": f"temp_delete_{suffix}",
        "password": "admin123",
        "nickname": f"待删除用户_{suffix}",
    })
    if status == 201 or status == 200:
        # 获取该用户的ID
        status, data = api_request("GET", "/users", token=admin_token, params={"keyword": f"temp_delete_{suffix}"})
        items = get_items(data)
        if items:
            delete_id = items[0].get("id")
            status, data = api_request("DELETE", f"/users/{delete_id}", token=admin_token)
            record_result(
                "TC-USER-08", "删除用户", "P0",
                success=(status == 200 or status == 201),
                actual_status=status,
                expected_status=200,
                detail=f"删除用户ID: {delete_id}",
            )

            # ---------- TC-USER-09: 删除后查询不到 ----------
            status, data = api_request("GET", "/users", token=admin_token, params={"keyword": f"temp_delete_{suffix}"})
            items = get_items(data)
            record_result(
                "TC-USER-09", "删除后用户不存在", "P1",
                success=(status == 200) and len(items) == 0,
                actual_status=status,
                expected_status=200,
                detail=f"搜索已删除用户返回 {len(items)} 条（期望0）",
            )
        else:
            record_result("TC-USER-08", "删除用户", "P0", False, 0, 200, detail="创建用户后无法查询到ID")
    else:
        record_result("TC-USER-08", "删除用户", "P0", False, status, 201, detail=f"创建用户失败: {str(data)[:80]}")

    # ---------- TC-USER-10: 删除不存在的用户 ----------
    status, data = api_request("DELETE", "/users/99999", token=admin_token)
    record_result(
        "TC-USER-10", "删除不存在的用户", "P2",
        success=(status == 404),
        actual_status=status,
        expected_status=404,
    )

    # ---------- TC-USER-11: 未登录无权访问用户列表 ----------
    status, data = api_request("GET", "/users")
    record_result(
        "TC-USER-11", "未登录无权访问用户列表", "P1",
        success=(status == 401),
        actual_status=status,
        expected_status=401,
    )

    # ---------- TC-USER-12: 教师无权访问用户列表 ----------
    teacher_token = login_teacher()
    if teacher_token:
        status, data = api_request("GET", "/users", token=teacher_token)
        record_result(
            "TC-USER-12", "教师无权访问用户列表", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )
    else:
        record_result("TC-USER-12", "教师无权访问用户列表", "P1", False, detail="教师登录失败，跳过测试")


def test_03_teacher_management():
    """
    测试 3: 教师管理增强
    - 教师列表分页
    - 教师详情
    - 认证/取消认证
    """
    print_separator("3. 教师管理增强")

    admin_token = login_admin()
    if not admin_token:
        cases_info = [
            ("TC-TCH-01", "获取教师列表（默认分页）", "P0"),
            ("TC-TCH-02", "教师列表分页（page=1, pageSize=2）", "P1"),
            ("TC-TCH-03", "教师列表分页（page=2, pageSize=2）", "P1"),
            ("TC-TCH-04", "管理员查看教师详情", "P0"),
            ("TC-TCH-05", "管理员认证教师（POST verify）", "P0"),
            ("TC-TCH-06", "管理员取消教师认证（PATCH review）", "P0"),
            ("TC-TCH-07", "认证不存在的教师", "P2"),
            ("TC-TCH-08", "教师无权访问教师管理列表", "P1"),
            ("TC-TCH-09", "未登录无权访问教师列表", "P1"),
        ]
        for cid, cname, pri in cases_info:
            record_result(cid, cname, pri, False, detail="管理员登录失败，跳过测试")
        return

    # ---------- TC-TCH-01: 获取教师列表（默认分页） ----------
    status, data = api_request("GET", "/teachers", token=admin_token)
    items = get_items(data)
    record_result(
        "TC-TCH-01", "获取教师列表（默认分页）", "P0",
        success=(status == 200) and len(items) > 0,
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条",
    )

    # 检查是否有教师 ID 供后续测试
    teacher_item = items[0] if items else None

    # ---------- TC-TCH-02: 教师列表分页（第1页，每页2条） ----------
    status, data = api_request("GET", "/teachers", token=admin_token, params={"page": 1, "pageSize": 2})
    items = get_items(data)
    record_result(
        "TC-TCH-02", "教师列表分页（page=1, pageSize=2）", "P1",
        success=(status == 200) and len(items) <= 2,
        actual_status=status,
        expected_status=200,
        detail=f"pageSize=2, 实际返回 {len(items)} 条",
    )

    # ---------- TC-TCH-03: 教师列表分页（第2页） ----------
    status, data = api_request("GET", "/teachers", token=admin_token, params={"page": 2, "pageSize": 2})
    items = get_items(data)
    record_result(
        "TC-TCH-03", "教师列表分页（page=2, pageSize=2）", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"第2页返回 {len(items)} 条",
    )

    # 重新获取第一页以获得 teacher_item（如果之前获取分页改变了指针）
    status, data = api_request("GET", "/teachers", token=admin_token)
    items = get_items(data)
    teacher_item = items[0] if items else teacher_item

    # ---------- TC-TCH-04: 教师详情（根据教师ID查询） ----------
    if teacher_item:
        teacher_id = teacher_item.get("id")
        # 尝试直接查询教师详情（如果没有 /teachers/:id 路由，可能返回 404 或利用 findAll 的 id 参数）
        status, data = api_request("GET", f"/teachers/{teacher_id}", token=admin_token)
        d = get_data(data)
        record_result(
            "TC-TCH-04", "管理员查看教师详情", "P0",
            success=(status == 200) and (d.get("id") == teacher_id or d.get("id") is not None),
            actual_status=status,
            expected_status=200,
            detail=f"教师ID: {teacher_id}, 认证状态: {d.get('isVerified', d.get('verified', 'N/A'))}",
        )
    else:
        record_result("TC-TCH-04", "管理员查看教师详情", "P0", False, detail="没有可用的教师记录")

    # ---------- TC-TCH-05: 认证教师（POST /:id/verify） ----------
    if teacher_item:
        teacher_id = teacher_item.get("id")
        status, data = api_request("POST", f"/teachers/{teacher_id}/verify", token=admin_token)
        d = get_data(data)
        # 判断认证状态（字段名可能是 isVerified 或 verified）
        is_verified = d.get("isVerified", d.get("verified", False))
        record_result(
            "TC-TCH-05", "管理员认证教师（POST verify）", "P0",
            success=(status == 200 or status == 201) and is_verified == True,
            actual_status=status,
            expected_status=200,
            detail=f"教师ID: {teacher_id}, 认证状态: {is_verified}",
        )
    else:
        record_result("TC-TCH-05", "管理员认证教师（POST verify）", "P0", False, detail="没有可用的教师记录")

    # ---------- TC-TCH-06: 取消认证（PATCH review approved=false） ----------
    if teacher_item:
        teacher_id = teacher_item.get("id")
        status, data = api_request("PATCH", f"/teachers/{teacher_id}/review", token=admin_token, json_body={
            "approved": False,
        })
        d = get_data(data)
        is_verified = d.get("isVerified", d.get("verified", True))
        record_result(
            "TC-TCH-06", "管理员取消教师认证（PATCH review）", "P0",
            success=(status == 200 or status == 201),
            actual_status=status,
            expected_status=200,
            detail=f"教师ID: {teacher_id}, 认证状态: {is_verified}",
        )
        # 恢复认证
        api_request("POST", f"/teachers/{teacher_id}/verify", token=admin_token)
    else:
        record_result("TC-TCH-06", "管理员取消教师认证（PATCH review）", "P0", False, detail="没有可用的教师记录")

    # ---------- TC-TCH-07: 认证不存在的教师 ----------
    status, data = api_request("POST", "/teachers/99999/verify", token=admin_token)
    # 可能后端在教师Id不存在时返回 404 或 500
    record_result(
        "TC-TCH-07", "认证不存在的教师", "P2",
        success=(status == 404 or status == 400),
        actual_status=status,
        expected_status=404,
    )

    # ---------- TC-TCH-08: 教师无权访问管理列表 ----------
    teacher_token = login_teacher()
    if teacher_token:
        status, data = api_request("GET", "/teachers", token=teacher_token)
        record_result(
            "TC-TCH-08", "教师无权访问教师管理列表", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )
    else:
        record_result("TC-TCH-08", "教师无权访问教师管理列表", "P1", False, detail="教师登录失败，跳过测试")

    # ---------- TC-TCH-09: 未登录无权访问教师列表 ----------
    status, data = api_request("GET", "/teachers")
    record_result(
        "TC-TCH-09", "未登录无权访问教师列表", "P1",
        success=(status == 401),
        actual_status=status,
        expected_status=401,
    )


def test_04_admin_module_security():
    """
    测试 4: AdminModule 权限安全
    - 各角色访问控制
    """
    print_separator("4. AdminModule 权限安全")

    admin_token = login_admin()
    teacher_token = login_teacher()
    student_token = login_or_register_student()

    # ---------- TC-SEC-01: 管理员有权限 ----------
    if admin_token:
        status, data = api_request("GET", "/admin/stats", token=admin_token)
        record_result(
            "TC-SEC-01", "管理员有权限访问 admin/stats", "P1",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
        )
    else:
        record_result("TC-SEC-01", "管理员有权限访问 admin/stats", "P1", False, detail="管理员登录失败")

    # ---------- TC-SEC-02: 教师无权限 ----------
    if teacher_token:
        status, data = api_request("GET", "/admin/stats", token=teacher_token)
        record_result(
            "TC-SEC-02", "教师无权限访问 admin/stats", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )
    else:
        record_result("TC-SEC-02", "教师无权限访问 admin/stats", "P1", False, detail="教师登录失败")

    # ---------- TC-SEC-03: 学员无权限 ----------
    if student_token:
        status, data = api_request("GET", "/admin/stats", token=student_token)
        record_result(
            "TC-SEC-03", "学员无权限访问 admin/stats", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )
    else:
        record_result("TC-SEC-03", "学员无权限访问 admin/stats", "P1", False, detail="学员登录失败")


def print_summary():
    """打印测试总结"""
    global passed_count, failed_count

    total = passed_count + failed_count
    pass_rate = (passed_count / total * 100) if total > 0 else 0

    print(f"\n{'=' * 70}")
    print(f"  📊 测试总结")
    print(f"{'=' * 70}")
    print(f"  总用例数: {total}")
    print(f"  通过: {passed_count}  ({pass_rate:.1f}%)")
    print(f"  失败: {failed_count}  ({100 - pass_rate:.1f}%)")
    print()

    # 按优先级统计
    for priority in ["P0", "P1", "P2"]:
        cases = [r for r in test_results if r["priority"] == priority]
        if not cases:
            continue
        p_passed = sum(1 for r in cases if r["success"])
        p_total = len(cases)
        p_rate = p_passed / p_total * 100 if p_total > 0 else 0
        print(f"  [{priority}] 通过率: {p_passed}/{p_total} ({p_rate:.1f}%)")

    # 失败列表
    if failed_count > 0:
        print(f"\n  ❌ 失败用例详情:")
        for r in test_results:
            if not r["success"]:
                print(f"    [{r['priority']}] {r['case_id']} {r['case_name']}")
                if r["actual_status"] or r["expected_status"]:
                    print(f"          期望 {r['expected_status']}, 实际 {r['actual_status']}")
                if r["detail"]:
                    print(f"          详情: {r['detail']}")


# ============================================================
# 主函数
# ============================================================

def main():
    """
    主函数：依次执行所有 v2.9 测试场景

    执行流程：
    1. AdminModule 统计接口（TC-ADM-01 ~ TC-ADM-04）
    2. 用户管理增强（TC-USER-01 ~ TC-USER-12）
    3. 教师管理增强（TC-TCH-01 ~ TC-TCH-09）
    4. AdminModule 权限安全（TC-SEC-01 ~ TC-SEC-03）
    """
    print(f"\n{'=' * 70}")
    print(f"  🚀 v2.9 管理端全面增强 - 自动化测试脚本")
    print(f"  开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'=' * 70}")

    start_time = time.time()

    print(f"\n📌 接口基础地址: {API_PREFIX}")

    # 测试前检查后端连通性
    print(f"\n📡 检查后端连通性...")
    try:
        resp = requests.get(f"{API_PREFIX}/courses", timeout=5)
        if resp.status_code == 200 or resp.status_code == 401:
            print(f"  ✅ 后端连接正常")
        else:
            print(f"  ⚠️ 后端返回状态码: {resp.status_code}")
    except:
        print(f"  ❌ 无法连接到后端，请确保后端已启动")
        return 1

    # 1. AdminModule 统计接口
    test_01_admin_stats()

    # 2. 用户管理增强
    test_02_user_management()

    # 3. 教师管理增强
    test_03_teacher_management()

    # 4. AdminModule 权限安全
    test_04_admin_module_security()

    elapsed = time.time() - start_time
    print(f"\n⏱ 总耗时: {elapsed:.1f} 秒")

    # 打印总结
    print_summary()

    # 返回失败数量
    return failed_count


if __name__ == "__main__":
    sys.exit(main())
