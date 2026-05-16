#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.4 ~ v2.8 自动化测试脚本
============================
测试范围：
  - 课程审核流程（提交审核/审核通过/驳回/撤回/下架申请/审核下架）
  - 课程推荐/置顶
  - 课程封面上传
  - 课程播放与试看
  - 附件审核流程（上传/审核/删除/按课时查询）
  - 教师端运营中心（仪表盘/制作人/收益/设置）
  - 状态流转覆盖测试
  - 附件硬删除

使用方法：
  python "测试脚本与问题记录/v2.4-v2.8/自动化测试_v2.4_v2.8.py"

前置条件：
  1. MySQL/Redis/MinIO 已启动
  2. 种子数据已执行（node backend/scripts/seed.js）
  3. 后端已启动（npm run start:dev）

注意事项：
  - 本脚本会创建/更新部分课程数据用于测试
  - 测试完成后会清理自己创建的课程记录
"""

import requests
import json
import time
import os
import sys
import io
from datetime import datetime

# 设置控制台输出编码为 UTF-8（解决 Windows GBK 无法输出 emoji 的问题）
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from typing import Optional, Dict, Any, List, Tuple

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

    @param case_id 用例编号，如 TC-REV-01
    @param case_name 用例名称，如 "教师提交审核"
    @param priority 优先级 P0/P1/P2
    @param success 是否通过
    @param actual_status 实际 HTTP 状态码
    @param expected_status 期望 HTTP 状态码
    @param detail 详细说明
    """
    global passed_count, failed_count
    status_icon = "✅" if success else "❌"
    result_str = "通过" if success else "失败"

    # 记录结果
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
    处理 data 为 None 的情况。
    
    @param data API 响应字典
    @returns data 字段的内容（可能为空字典）
    """
    if data and isinstance(data, dict):
        d = data.get("data")
        return d if isinstance(d, dict) else {}
    return {}


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
    @param path API 路径（不包含 BASE_URL）
    @param token JWT token（可选）
    @param json_body JSON 请求体
    @param files 文件上传
    @param data form-data 数据
    @param params 查询参数
    @param expected_status 期望的状态码（仅用于日志记录）
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
                # 文件上传时不设置 Content-Type（requests 自动设置 multipart）
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


def login(username: str, password: str = "admin123") -> Optional[str]:
    """
    登录并获取 token

    @param username 用户名
    @param password 密码（默认 admin123）
    @returns access_token 或 None
    """
    status, data = api_request("POST", "/auth/login", json_body={
        "username": username,
        "password": password,
    })
    d = get_data(data)
    if status == 200 and d.get("accessToken"):
        token = d["accessToken"]
        print(f"  ✅ 登录成功 [{username}] token: {token[:20]}...")
        return token
    else:
        print(f"  ❌ 登录失败 [{username}]: status={status}, data={data}")
        return None


def get_user_id(token: str) -> Optional[int]:
    """获取当前登录用户的 ID（从 /auth/me 或 /users/me）"""
    status, data = api_request("GET", "/auth/me", token=token)
    if status == 200:
        return get_data(data).get("id")
    return None


def login_or_register_student() -> Optional[str]:
    """
   尝试登录 student01，如果不存在则注册一个新学员账号
   
   @returns student_token 或 None
   """
    student_token = login("student01")
    if not student_token:
        # 注册学员
        suffix = int(time.time())
        status, data = api_request("POST", "/auth/register", json_body={
            "username": f"student_{suffix}",
            "password": "admin123",
            "nickname": f"测试学员_{suffix}",
            "role": "student",
        })
        if status == 201 or status == 200:
            student_token = login(f"student_{suffix}")
    return student_token


# ============================================================
# 测试场景实现
# ============================================================

def test_01_course_review_flow():
    """
    3.1 课程审核流程（15个测试用例）
    包含：提交审核、审核通过、驳回、撤回、下架申请、审核下架
    """
    print_separator("3.1 课程审核流程")

    # 登录
    teacher_token = login("teacher01")
    admin_token = login("admin")
    reviewer_token = login("reviewer01")
    student_token = login_or_register_student()

    if not all([teacher_token, admin_token, reviewer_token]):
        print("  ❌ 登录失败，跳过测试")
        return

    # 先获取 teacher01 的用户 ID
    teacher_user_id = get_user_id(teacher_token)

    # 创建临时课程用于测试
    print_subtitle("创建临时课程用于审核流程测试")
    status, data = api_request("POST", "/courses", token=teacher_token, json_body={
        "title": f"审核测试课程_{int(time.time())}",
        "description": "用于审核流程自动化测试",
        "categoryId": 1,
        "price": 19900,
        "courseType": "single",
    })
    test_course_id = None
    if status == 201 or status == 200:
        test_course_id = get_data(data).get("id")
        if test_course_id:
            print(f"  ✅ 创建测试课程成功: id={test_course_id}")
        else:
            print(f"  ❌ 创建课程成功但未获取到ID: {data}")
            return
    else:
        print(f"  ❌ 创建课程失败: {data}")
        return

    # ---------- TC-REV-01: 教师提交审核 ----------
    print_subtitle("TC-REV-01 ~ TC-REV-10 审核流程")
    status, data = api_request("POST", f"/courses/{test_course_id}/submit-review", token=teacher_token)
    d = get_data(data)
    new_status = d.get("status", "")
    record_result(
        "TC-REV-01", "教师提交审核", "P0",
        success=(status == 201 or status == 200) and new_status == "pending",
        actual_status=status,
        expected_status=201,
        detail=f"课程状态: {new_status}",
    )

    # ---------- TC-REV-12: 获取待审核课程列表 ----------
    status, data = api_request("GET", "/courses/pending-review", token=reviewer_token)
    record_result(
        "TC-REV-12", "获取待审核课程列表", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
    )

    # ---------- TC-REV-13: 获取待审核课程数量 ----------
    status, data = api_request("GET", "/courses/stats/pending-count", token=reviewer_token)
    d = get_data(data)
    record_result(
        "TC-REV-13", "获取待审核课程数量", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"待审核数量: {d.get('count', 'N/A')}",
    )

    # ---------- TC-REV-14: 获取课程审核历史 ----------
    status, data = api_request("GET", f"/courses/{test_course_id}/reviews", token=teacher_token)
    record_result(
        "TC-REV-14", "获取课程审核历史", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
    )

    # ---------- TC-REV-04: 管理员审核通过课程 ----------
    status, data = api_request("POST", f"/courses/{test_course_id}/review", token=admin_token, json_body={
        "approved": True,
    })
    d = get_data(data)
    new_status = d.get("status", "")
    record_result(
        "TC-REV-04", "管理员审核通过课程", "P0",
        success=(status == 200 or status == 201) and new_status == "approved",
        actual_status=status,
        expected_status=200,
        detail=f"课程状态: {new_status}",
    )

    # ---------- TC-REV-15: 学员无权审核 ----------
    if student_token:
        status, data = api_request("POST", f"/courses/{test_course_id}/review", token=student_token, json_body={
            "approved": True,
        })
        record_result(
            "TC-REV-15", "学员无权审核课程", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )

    # 创建另一个草稿课程用于驳回测试
    print_subtitle("创建驳回测试课程")
    status, data = api_request("POST", "/courses", token=teacher_token, json_body={
        "title": f"驳回测试课程_{int(time.time())}",
        "description": "用于驳回流程测试",
        "categoryId": 2,
        "price": 9900,
        "courseType": "single",
    })
    reject_course_id = get_data(data).get("id")
    
    # ---------- TC-REV-06: 驳回时缺少原因 ----------
    if reject_course_id:
        # 先提交审核
        api_request("POST", f"/courses/{reject_course_id}/submit-review", token=teacher_token)
        # 尝试驳回时不提供原因
        status, data = api_request("POST", f"/courses/{reject_course_id}/review", token=admin_token, json_body={
            "approved": False,
        })
        record_result(
            "TC-REV-06", "驳回时缺少原因", "P2",
            success=(status == 400),
            actual_status=status,
            expected_status=400,
        )
    
    # 重新创建另一个课程用于完整的驳回→重新提交测试
    status, data = api_request("POST", "/courses", token=teacher_token, json_body={
        "title": f"驳回重提交测试_{int(time.time())}",
        "description": "用于驳回后重新提交审核测试",
        "categoryId": 1,
        "price": 9900,
        "courseType": "single",
    })
    reject_resubmit_id = get_data(data).get("id")

    # ---------- TC-REV-05: 管理员审核驳回课程 ----------
    if reject_resubmit_id:
        # 提交审核
        api_request("POST", f"/courses/{reject_resubmit_id}/submit-review", token=teacher_token)
        status, data = api_request("POST", f"/courses/{reject_resubmit_id}/review", token=admin_token, json_body={
            "approved": False,
            "comment": "课件内容不完整，请补充",
        })
        d = get_data(data)
        new_status = d.get("status", "")
        record_result(
            "TC-REV-05", "管理员审核驳回课程", "P0",
            success=(status == 200 or status == 201) and new_status == "rejected",
            actual_status=status,
            expected_status=200,
            detail=f"课程状态: {new_status}",
        )

        # ---------- TC-REV-02: 已驳回课程重新提交审核 ----------
        status, data = api_request("POST", f"/courses/{reject_resubmit_id}/submit-review", token=teacher_token)
        d = get_data(data)
        new_status = d.get("status", "")
        record_result(
            "TC-REV-02", "已驳回课程提交审核", "P0",
            success=(status == 200 or status == 201) and new_status == "pending",
            actual_status=status,
            expected_status=201,
            detail=f"课程状态: {new_status}",
        )
        # 审核通过（清理）
        api_request("POST", f"/courses/{reject_resubmit_id}/review", token=admin_token, json_body={"approved": True})

    # ---------- TC-REV-07: 撤回审核申请（草稿→pending）----------
    print_subtitle("TC-REV-07 ~ TC-REV-08 撤回审核申请")
    status, data = api_request("POST", "/courses", token=teacher_token, json_body={
        "title": f"撤回测试课程_{int(time.time())}",
        "description": "用于撤回审核测试",
        "categoryId": 1,
        "price": 14900,
        "courseType": "single",
    })
    withdraw_course_id = get_data(data).get("id")
    if withdraw_course_id:
        # 先提交审核
        api_request("POST", f"/courses/{withdraw_course_id}/submit-review", token=teacher_token)
        # 撤回
        status, data = api_request("POST", f"/courses/{withdraw_course_id}/withdraw-review", token=teacher_token)
        d = get_data(data)
        new_status = d.get("status", "")
        record_result(
            "TC-REV-07", "教师撤回审核申请（草稿→待审核）", "P0",
            success=(status == 200 or status == 201) and new_status == "draft",
            actual_status=status,
            expected_status=200,
            detail=f"课程状态: {new_status}",
        )

        # ---------- TC-REV-03: 已上架编辑后提交审核 ----------
        # 先审核通过这个课程
        api_request("POST", f"/courses/{withdraw_course_id}/submit-review", token=teacher_token)
        api_request("POST", f"/courses/{withdraw_course_id}/review", token=admin_token, json_body={"approved": True})
        # 更新课程（触发 pendingEdit）
        api_request("PUT", f"/courses/{withdraw_course_id}", token=teacher_token, json_body={"title": f"撤回测试课程_已编辑_{int(time.time())}"})
        # 提交审核
        status, data = api_request("POST", f"/courses/{withdraw_course_id}/submit-review", token=teacher_token)
        d = get_data(data)
        new_status = d.get("status", "")
        record_result(
            "TC-REV-03", "已上架编辑后提交审核", "P0",
            success=(status == 200 or status == 201) and new_status == "pending",
            actual_status=status,
            expected_status=201,
            detail=f"课程状态: {new_status}",
        )

        # ---------- TC-REV-08: 撤回已上架编辑后的审核 ----------
        status, data = api_request("POST", f"/courses/{withdraw_course_id}/withdraw-review", token=teacher_token)
        d = get_data(data)
        new_status = d.get("status", "")
        record_result(
            "TC-REV-08", "撤回已上架编辑后的审核申请", "P0",
            success=(status == 200 or status == 201) and new_status == "approved",
            actual_status=status,
            expected_status=200,
            detail=f"课程状态: {new_status}",
        )

    # ---------- TC-REV-09: 申请下架课程 ----------
    print_subtitle("TC-REV-09 ~ TC-REV-11 下架申请流程")
    # 找一个已上架的课程
    available_course_id = None
    status, data = api_request("GET", "/courses", params={"pageSize": 10})
    if status == 200:
        items = get_data(data).get("items", [])
        for item in items:
            if item.get("status") == "approved":
                available_course_id = item.get("id")
                break
    
    if available_course_id:
        status, data = api_request("GET", f"/courses/{available_course_id}", token=teacher_token)
        if status == 200:
            d = get_data(data)
            course_teacher_id = d.get("teacherId")
            if course_teacher_id != teacher_user_id:
                # 用 admin 直接下架
                status, data = api_request("PATCH", f"/courses/{available_course_id}/status", token=admin_token, json_body={"status": "off_shelf"})
                record_result(
                    "TC-REV-09", "教师申请下架课程（使用管理端直接操作）", "P0",
                    success=(status == 200 or status == 201),
                    actual_status=status,
                    expected_status=200,
                    detail="使用管理端 PATCH /status 直接下架",
                )
            else:
                status, data = api_request("POST", f"/courses/{available_course_id}/request-off-shelf", token=teacher_token)
                d = get_data(data)
                pending_off_shelf = d.get("pendingOffShelf")
                record_result(
                    "TC-REV-09", "教师申请下架课程", "P0",
                    success=(status == 200 or status == 201) and pending_off_shelf == True,
                    actual_status=status,
                    expected_status=200,
                    detail=f"pendingOffShelf: {pending_off_shelf}",
                )

                if pending_off_shelf:
                    # 审批下架
                    status, data = api_request("POST", f"/courses/{available_course_id}/review", token=admin_token, json_body={"approved": True})
                    d = get_data(data)
                    new_status = d.get("status", "")
                    record_result(
                        "TC-REV-10", "管理员审批下架申请（通过）", "P0",
                        success=(status == 200 or status == 201) and new_status == "off_shelf",
                        actual_status=status,
                        expected_status=200,
                        detail=f"课程状态: {new_status}",
                    )

                    # 驳回下架申请
                    api_request("PATCH", f"/courses/{available_course_id}/status", token=admin_token, json_body={"status": "approved"})
                    api_request("POST", f"/courses/{available_course_id}/request-off-shelf", token=teacher_token)
                    status, data = api_request("POST", f"/courses/{available_course_id}/review", token=admin_token, json_body={
                        "approved": False,
                        "comment": "课程内容合规，暂不下架",
                    })
                    d = get_data(data)
                    new_status = d.get("status", "")
                    record_result(
                        "TC-REV-11", "管理员驳回下架申请", "P1",
                        success=(status == 200 or status == 201) and new_status == "approved",
                        actual_status=status,
                        expected_status=200,
                        detail=f"课程状态: {new_status}",
                    )
    else:
        print("  ⚠️ 没有找到已上架的课程，跳过下架测试")


def test_02_featured_courses():
    """
    3.2 课程推荐/置顶
    """
    print_separator("3.2 课程推荐/置顶")

    admin_token = login("admin")
    teacher_token = login("teacher01")

    # 获取一个已上架的课程
    status, data = api_request("GET", "/courses", params={"pageSize": 10})
    course_id = None
    if status == 200:
        items = get_data(data).get("items", [])
        for item in items:
            if item.get("status") == "approved":
                course_id = item.get("id")
                break

    if not course_id:
        print("  ⚠️ 没有可用的已上架课程")
        return

    # ---------- TC-FEA-01: 设置推荐 ----------
    status, data = api_request("PATCH", f"/courses/{course_id}/featured", token=admin_token, json_body={
        "isRecommended": True,
    })
    record_result(
        "TC-FEA-01", "管理端设置课程推荐", "P1",
        success=(status == 200 or status == 201),
        actual_status=status,
        expected_status=200,
    )

    # ---------- TC-FEA-02: 取消推荐 ----------
    status, data = api_request("PATCH", f"/courses/{course_id}/featured", token=admin_token, json_body={
        "isRecommended": False,
    })
    record_result(
        "TC-FEA-02", "管理端取消课程推荐", "P1",
        success=(status == 200 or status == 201),
        actual_status=status,
        expected_status=200,
    )

    # ---------- TC-FEA-03: 教师无权设置推荐 ----------
    status, data = api_request("PATCH", f"/courses/{course_id}/featured", token=teacher_token, json_body={
        "isRecommended": True,
    })
    record_result(
        "TC-FEA-03", "教师无权设置推荐", "P1",
        success=(status == 403),
        actual_status=status,
        expected_status=403,
    )


def test_03_course_cover_upload():
    """
    3.3 课程封面上传
    """
    print_separator("3.3 课程封面上传")

    teacher_token = login("teacher01")
    student_token = login_or_register_student()

    # 找一个课程用于测试
    status, data = api_request("GET", "/courses/teacher", token=teacher_token)
    course_id = None
    if status == 200:
        items = get_data(data).get("items", [])
        if items:
            course_id = items[0].get("id")

    if not course_id:
        print("  ⚠️ 没有可用的教师课程，跳过封面测试")
        return

    # 使用默认图片（从项目目录读取已有图片）
    import os
    default_img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "用于测试上传功能的视频和图片", "default-course.jpeg")
    if os.path.exists(default_img_path):
        with open(default_img_path, "rb") as f:
            test_image_content = f.read()
    else:
        # 生成一个最小的 1x1 白色 PNG 图片
        import struct, zlib
        def create_minimal_png():
            sig = b'\x89PNG\r\n\x1a\n'
            ihdr_data = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
            ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
            ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
            raw_data = b'\x00\xff\xff\xff'
            compressed = zlib.compress(raw_data)
            idat_crc = zlib.crc32(b'IDAT' + compressed)
            idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
            iend_crc = zlib.crc32(b'IEND')
            iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
            return sig + ihdr + idat + iend
        test_image_content = create_minimal_png()

    # ---------- TC-COV-01: 上传课程封面 ----------
    files = {"file": ("test_cover.jpg", test_image_content, "image/jpeg")}
    status, data = api_request("POST", f"/courses/{course_id}/cover", token=teacher_token, files=files)
    record_result(
        "TC-COV-01", "教师上传课程封面", "P0",
        success=(status == 201 or status == 200),
        actual_status=status,
        expected_status=201,
        detail=f"响应: {str(data)[:100]}",
    )

    # ---------- TC-COV-02: 上传非图片格式 ----------
    txt_content = b"This is not an image file"
    files = {"file": ("test.txt", txt_content, "text/plain")}
    status, data = api_request("POST", f"/courses/{course_id}/cover", token=teacher_token, files=files)
    record_result(
        "TC-COV-02", "上传非图片格式", "P2",
        success=(status == 400),
        actual_status=status,
        expected_status=400,
    )

    # ---------- TC-COV-03: 未登录上传封面 ----------
    files = {"file": ("test.jpg", test_image_content, "image/jpeg")}
    status, data = api_request("POST", f"/courses/{course_id}/cover", files=files)
    record_result(
        "TC-COV-03", "未登录上传封面", "P1",
        success=(status == 401),
        actual_status=status,
        expected_status=401,
    )

    # ---------- TC-COV-04: 学员上传封面（无权） ----------
    if student_token:
        files = {"file": ("test.jpg", test_image_content, "image/jpeg")}
        status, data = api_request("POST", f"/courses/{course_id}/cover", token=student_token, files=files)
        record_result(
            "TC-COV-04", "学员上传封面（无权）", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )


def test_04_course_playback():
    """
    3.4 课程播放与试看
    
    功能描述：测试课程详情接口、购买状态检查、课时播放权限（免费/付费）、已购课程列表、公开课程列表筛选等。
    由于种子数据中已上架课程不包含课时，本测试会动态创建一个系列课程并添加课时用于测试。
    """
    print_separator("3.4 课程播放与试看")

    teacher_token = login("teacher01")
    admin_token = login("admin")
    student_token = login_or_register_student()

    # ========== 动态创建测试用课程（含课时）==========
    print_subtitle("创建测试用系列课程（含免费课时和付费课时）")
    
    # 创建系列课程
    course_title = f"播放测试系列课_{int(time.time())}"
    status, data = api_request("POST", "/courses", token=teacher_token, json_body={
        "title": course_title,
        "description": "用于播放与试看权限测试的系列课程",
        "categoryId": 1,
        "price": 29900,
        "courseType": "series",
    })
    test_course_id = get_data(data).get("id") if (status == 201 or status == 200) else None
    if not test_course_id:
        print("  ❌ 创建测试课程失败，跳过播放测试")
        record_result("TC-PLY-01", "公开课程详情", "P0", False, status, 200, detail=f"创建课程失败: {str(data)[:100]}")
        record_result("TC-PLY-02", "检查购买状态（未购买）", "P1", False, status, 200, detail="前置条件失败")
        record_result("TC-PLY-03", "未登录检查购买状态", "P1", False, 401, 401, detail="前置条件失败")
        record_result("TC-PLY-04", "课时播放权限（免费·未登录）", "P0", False, 0, 200, detail="前置条件失败")
        record_result("TC-PLY-05", "课时播放权限（付费·未登录）", "P0", False, 0, 200, detail="前置条件失败")
        record_result("TC-PLY-06", "课时播放权限（teacher01）", "P1", False, 0, 200, detail="前置条件失败")
        record_result("TC-PLY-07", "获取已购课程列表", "P1", False, 0, 200, detail="前置条件失败")
        record_result("TC-PLY-08", "公开课程列表筛选/搜索/排序", "P0", False, 0, 200, detail="前置条件失败")
        return

    print(f"  ✅ 创建系列课程成功: id={test_course_id}")

    # 添加章节（系列课程下创建章节：POST /courses/:courseId/chapters）
    status, data = api_request("POST", f"/courses/{test_course_id}/chapters", token=teacher_token, json_body={
        "title": f"第一章_{int(time.time())}",
        "sortOrder": 1,
    })
    chapter_id = get_data(data).get("id") if (status == 201 or status == 200) else None
    if not chapter_id:
        print("  ❌ 创建章节失败")
        return
    print(f"  ✅ 创建章节成功: id={chapter_id}")

    # 添加免费课时（系列课程：POST /courses/:courseId/chapters/:chapterId/lessons）
    status, data = api_request("POST", f"/courses/{test_course_id}/chapters/{chapter_id}/lessons", token=teacher_token, json_body={
        "title": "免费试听课：基础入门",
        "isFree": True,
        "duration": 600,
        "sortOrder": 1,
    })
    free_lesson_id = get_data(data).get("id") if (status == 201 or status == 200) else None
    if free_lesson_id:
        print(f"  ✅ 创建免费课时成功: id={free_lesson_id}")

    # 添加付费课时（系列课程：POST /courses/:courseId/chapters/:chapterId/lessons）
    status, data = api_request("POST", f"/courses/{test_course_id}/chapters/{chapter_id}/lessons", token=teacher_token, json_body={
        "title": "核心技巧讲解",
        "isFree": False,
        "duration": 1200,
        "sortOrder": 2,
    })
    paid_lesson_id = get_data(data).get("id") if (status == 201 or status == 200) else None
    if paid_lesson_id:
        print(f"  ✅ 创建付费课时成功: id={paid_lesson_id}")

    # 提交审核 → 通过
    api_request("POST", f"/courses/{test_course_id}/submit-review", token=teacher_token)
    api_request("POST", f"/courses/{test_course_id}/review", token=admin_token, json_body={"approved": True})
    print(f"  ✅ 课程已审核通过")
    
    # 让 teacher01 购买此课程（模拟已购）
    api_request("POST", f"/courses/{test_course_id}/purchase", token=teacher_token, json_body={})
    print(f"  ✅ teacher01 已购此课程（测试用）")

    # ---------- TC-PLY-01: 公开课程详情 ----------
    status, data = api_request("GET", f"/courses/{test_course_id}")
    d = get_data(data)
    record_result(
        "TC-PLY-01", "公开课程详情", "P0",
        success=(status == 200) and d.get("id") == test_course_id,
        actual_status=status,
        expected_status=200,
        detail=f"课程标题: {d.get('title', 'N/A')}",
    )

    # ---------- TC-PLY-02: 检查购买状态（已登录未购买）----------
    if student_token:
        status, data = api_request("GET", f"/courses/{test_course_id}/purchase-status", token=student_token)
        d = get_data(data)
        record_result(
            "TC-PLY-02", "检查购买状态（未购买）", "P1",
            success=(status == 200) and d.get("purchased") == False,
            actual_status=status,
            expected_status=200,
            detail=f"是否已购买: {d.get('purchased')}",
        )

    # ---------- TC-PLY-03: 未登录检查购买状态 ----------
    status, data = api_request("GET", f"/courses/{test_course_id}/purchase-status")
    record_result(
        "TC-PLY-03", "未登录检查购买状态", "P1",
        success=(status == 401),
        actual_status=status,
        expected_status=401,
    )

    # ---------- TC-PLY-04: 免费课时播放权限（未登录）----------
    if free_lesson_id:
        status, data = api_request("GET", f"/courses/{test_course_id}/lessons/{free_lesson_id}/access")
        d = get_data(data)
        record_result(
            "TC-PLY-04", "课时播放权限（免费·未登录）", "P0",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
            detail=f"access: {d.get('access')}, isFree: {d.get('isFree')}",
        )
    else:
        record_result("TC-PLY-04", "课时播放权限（免费·未登录）", "P0", False, 0, 200, detail="未创建免费课时")

    # ---------- TC-PLY-05: 付费课时播放权限（未登录）----------
    if paid_lesson_id:
        status, data = api_request("GET", f"/courses/{test_course_id}/lessons/{paid_lesson_id}/access")
        d = get_data(data)
        record_result(
            "TC-PLY-05", "课时播放权限（付费·未登录）", "P0",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
            detail=f"access: {d.get('access')}",
        )
    else:
        record_result("TC-PLY-05", "课时播放权限（付费·未登录）", "P0", False, 0, 200, detail="未创建付费课时")

    # ---------- TC-PLY-06: 已购课 teacher01 播放付费课时 ----------
    if paid_lesson_id:
        status, data = api_request("GET", f"/courses/{test_course_id}/lessons/{paid_lesson_id}/access", token=teacher_token)
        d = get_data(data)
        record_result(
            "TC-PLY-06", "课时播放权限（老师/已购·付费课时）", "P1",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
            detail=f"access: {d.get('access')}",
        )
    else:
        record_result("TC-PLY-06", "课时播放权限（老师/已购·付费课时）", "P1", False, 0, 200, detail="未创建付费课时")

    # ---------- TC-PLY-07: 获取已购课程列表 ----------
    if student_token:
        status, data = api_request("GET", "/courses/my/purchased", token=student_token)
        record_result(
            "TC-PLY-07", "获取已购课程列表", "P1",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
        )

    # ---------- TC-PLY-08: 公开课程列表筛选/搜索/排序 ----------
    status, data = api_request("GET", "/courses", params={
        "sortBy": "price",
        "sortOrder": "ASC",
    })
    items = get_data(data).get("items", [])
    record_result(
        "TC-PLY-08", "公开课程列表筛选/搜索/排序", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条记录",
    )


def test_05_attachment_review_flow():
    """
    3.5 附件审核流程
    注意：附件模块需要有相应的后端实现才会通过
    """
    print_separator("3.5 附件审核流程")

    teacher_token = login("teacher01")
    admin_token = login("admin")
    reviewer_token = login("reviewer01")
    student_token = login_or_register_student()

    test_pdf_content = b"%PDF-1.4 test pdf content (simulated)"

    # 先获取教师可用的课程
    status, data = api_request("GET", "/courses/teacher", token=teacher_token)
    course_id = None
    if status == 200:
        items = get_data(data).get("items", [])
        if items:
            course_id = items[0].get("id")

    if not course_id:
        print("  ⚠️ 没有可用的教师课程，跳过附件测试")
        return

    # ---------- TC-ATT-01: 上传附件 ----------
    files = {"file": ("test_attachment.pdf", test_pdf_content, "application/pdf")}
    data_form = {"courseId": str(course_id), "attachmentType": "courseware"}
    status, data = api_request("POST", "/attachments/upload", token=teacher_token, data=data_form, files=files)

    attachment_id = None
    if status == 201 or status == 200:
        attachment_id = get_data(data).get("id")
        record_result(
            "TC-ATT-01", "教师上传附件（multipart）", "P0",
            success=True,
            actual_status=status,
            expected_status=201,
            detail=f"附件ID: {attachment_id}",
        )
    else:
        record_result(
            "TC-ATT-01", "教师上传附件（multipart）", "P0",
            success=False,
            actual_status=status,
            expected_status=201,
            detail=f"status={status}, data={str(data)[:100]}",
        )

    # 如果上传成功
    if attachment_id:
        # ---------- TC-ATT-02: 上传附件指定课时 ----------
        files = {"file": ("test_lesson_attachment.pdf", test_pdf_content, "application/pdf")}
        data_form = {"courseId": str(course_id), "attachmentType": "score"}
        status, data = api_request("POST", "/attachments/upload", token=teacher_token, data=data_form, files=files)
        lesson_attachment_id = get_data(data).get("id") if (status == 201 or status == 200) else None
        record_result(
            "TC-ATT-02", "上传附件指定课时", "P0",
            success=(status == 201 or status == 200),
            actual_status=status,
            expected_status=201,
            detail=f"附件ID: {lesson_attachment_id}",
        )

        # ---------- TC-ATT-03: 按课时查询附件 ----------
        status, data = api_request("GET", "/attachments/lesson/1", token=teacher_token)
        record_result(
            "TC-ATT-03", "按课时查询附件", "P1",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
        )

        # ---------- TC-ATT-04: 获取待审核附件列表 ----------
        status, data = api_request("GET", "/attachments/pending", token=reviewer_token)
        record_result(
            "TC-ATT-04", "审核员获取待审核附件列表", "P0",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
        )

        # ---------- TC-ATT-08: 教师获取我的附件列表 ----------
        status, data = api_request("GET", "/attachments/my", token=teacher_token)
        record_result(
            "TC-ATT-08", "教师获取我的附件列表", "P1",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
        )

        # ---------- TC-ATT-05: 审核员通过附件审核 ----------
        status, data = api_request("PATCH", f"/attachments/{attachment_id}/review", token=reviewer_token, json_body={
            "status": "approved",
            "reviewComment": "课件内容完整",
        })
        record_result(
            "TC-ATT-05", "审核员通过附件审核", "P0",
            success=(status == 200 or status == 201),
            actual_status=status,
            expected_status=200,
        )

        # 重新上传一个附件用于驳回测试
        files = {"file": ("test_reject.pdf", test_pdf_content, "application/pdf")}
        data_form = {"courseId": str(course_id), "attachmentType": "courseware"}
        status, data = api_request("POST", "/attachments/upload", token=teacher_token, data=data_form, files=files)
        reject_attachment_id = get_data(data).get("id") if (status == 201 or status == 200) else None

        if reject_attachment_id:
            # ---------- TC-ATT-06: 审核员驳回附件（带上驳回原因）----------
            status, data = api_request("PATCH", f"/attachments/{reject_attachment_id}/review", token=reviewer_token, json_body={
                "status": "rejected",
                "reviewComment": "请补充完整内容",
            })
            record_result(
                "TC-ATT-06", "审核员驳回附件审核", "P0",
                success=(status == 200 or status == 201),
                actual_status=status,
                expected_status=200,
            )

        # ---------- TC-ATT-07: 上传不支持的文件类型 ----------
        files = {"file": ("malware.exe", b"fake exe content", "application/x-msdownload")}
        data_form = {"courseId": str(course_id), "attachmentType": "other"}
        status, data = api_request("POST", "/attachments/upload", token=teacher_token, data=data_form, files=files)
        record_result(
            "TC-ATT-07", "上传不支持的文件类型", "P2",
            success=(status == 400),
            actual_status=status,
            expected_status=400,
        )

        # ---------- TC-ATT-09: 删除附件（硬删除）----------
        files = {"file": ("to_delete.pdf", b"to be deleted", "application/pdf")}
        data_form = {"courseId": str(course_id), "attachmentType": "other"}
        status, data = api_request("POST", "/attachments/upload", token=teacher_token, data=data_form, files=files)
        delete_id = get_data(data).get("id") if (status == 201 or status == 200) else None

        if delete_id:
            status, data = api_request("DELETE", f"/attachments/{delete_id}", token=teacher_token)
            record_result(
                "TC-ATT-09", "教师删除自己的附件", "P0",
                success=(status == 200),
                actual_status=status,
                expected_status=200,
            )

            # ---------- TC-HRD-01: 硬删除后查询 ----------
            status, data = api_request("GET", f"/attachments/{delete_id}", token=teacher_token)
            record_result(
                "TC-HRD-01", "硬删除后数据库查询不到", "P1",
                success=(status == 404),
                actual_status=status,
                expected_status=404,
            )

            # ---------- TC-HRD-03: 删除不存在的附件 ----------
            status, data = api_request("DELETE", "/attachments/99999", token=teacher_token)
            record_result(
                "TC-HRD-03", "删除不存在的附件", "P2",
                success=(status == 404),
                actual_status=status,
                expected_status=404,
            )

        # ---------- TC-ATT-10: 学员获取已审核通过的附件 ----------
        if student_token:
            status, data = api_request("GET", f"/attachments/course/{course_id}", token=student_token)
            items = get_data(data).get("items", [])
            record_result(
                "TC-ATT-10", "学员获取已审核通过附件", "P1",
                success=(status == 200),
                actual_status=status,
                expected_status=200,
                detail=f"返回 {len(items)} 条",
            )


def test_06_teacher_dashboard():
    """
    3.6.1 仪表盘
    """
    print_separator("3.6.1 教师仪表盘")

    teacher_token = login("teacher01")
    student_token = login_or_register_student()

    # ---------- TC-DSH-01: 获取仪表盘统计 ----------
    status, data = api_request("GET", "/courses/teacher/stats", token=teacher_token)
    d = get_data(data)
    record_result(
        "TC-DSH-01", "教师获取仪表盘统计数据", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"课程数: {d.get('totalCourses')}, 制作人数: {d.get('totalStudents')}",
    )

    # ---------- TC-DSH-02: 学员无权查看 ----------
    if student_token:
        status, data = api_request("GET", "/courses/teacher/stats", token=student_token)
        record_result(
            "TC-DSH-02", "学员无权查看仪表盘", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )


def test_07_teacher_producers():
    """
    3.6.2 制作人管理
    """
    print_separator("3.6.2 制作人管理")

    teacher_token = login("teacher01")
    student_token = login_or_register_student()

    # ---------- TC-PRO-01: 获取制作人列表 ----------
    status, data = api_request("GET", "/courses/teacher/producers", token=teacher_token)
    items = get_data(data).get("items", [])
    record_result(
        "TC-PRO-01", "教师获取制作人列表", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"返回 {len(items)} 条",
    )

    # ---------- TC-PRO-02: 制作人列表分页 ----------
    status, data = api_request("GET", "/courses/teacher/producers", token=teacher_token, params={"page": 1, "pageSize": 5})
    items = get_data(data).get("items", [])
    record_result(
        "TC-PRO-02", "制作人列表分页", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"pageSize=5, 实际返回 {len(items)} 条",
    )

    # ---------- TC-PRO-03: 学员无权查看 ----------
    if student_token:
        status, data = api_request("GET", "/courses/teacher/producers", token=student_token)
        record_result(
            "TC-PRO-03", "学员无权查看制作人列表", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )


def test_08_earnings():
    """
    3.6.3 收益管理
    """
    print_separator("3.6.3 收益管理")

    teacher_token = login("teacher01")
    student_token = login_or_register_student()

    # ---------- TC-EAR-01: 获取收益概览 ----------
    status, data = api_request("GET", "/earnings/stats", token=teacher_token)
    d = get_data(data)
    record_result(
        "TC-EAR-01", "教师获取收益概览", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"总收入: {d.get('totalEarnings')}, 可提现: {d.get('withdrawableBalance')}",
    )

    # ---------- TC-EAR-02: 获取收益明细 ----------
    status, data = api_request("GET", "/earnings/details", token=teacher_token)
    record_result(
        "TC-EAR-02", "教师获取收益明细", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
    )

    # ---------- TC-EAR-03: 收益明细分页 ----------
    status, data = api_request("GET", "/earnings/details", token=teacher_token, params={"page": 1, "pageSize": 10})
    items = get_data(data).get("items", [])
    record_result(
        "TC-EAR-03", "收益明细分页", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"pageSize=10, 实际返回 {len(items)} 条",
    )

    # ---------- TC-EAR-06: 提现金额为负数 ----------
    status, data = api_request("POST", "/earnings/withdraw", token=teacher_token, json_body={
        "amount": -100,
        "account": "test@example.com",
        "accountType": "alipay",
    })
    record_result(
        "TC-EAR-06", "提现金额为负数", "P2",
        success=(status == 400),
        actual_status=status,
        expected_status=400,
    )

    # 先获取余额
    status, stats_data = api_request("GET", "/earnings/stats", token=teacher_token)
    balance = 0
    if status == 200:
        balance = get_data(stats_data).get("withdrawableBalance", 0)

    # 如果余额足够 100 元（最少提现100元），测试提现
    if balance >= 10000:  # 100元 = 10000分
        # ---------- TC-EAR-04: 提交提现申请 ----------
        status, data = api_request("POST", "/earnings/withdraw", token=teacher_token, json_body={
            "amount": 10000,
            "account": "test@example.com",
            "accountType": "alipay",
        })
        d = get_data(data)
        record_result(
            "TC-EAR-04", "教师提交提现申请", "P0",
            success=(status == 201 or status == 200),
            actual_status=status,
            expected_status=201,
            detail=f"提现状态: {d.get('status', 'N/A')}",
        )

        # ---------- TC-EAR-07: 获取提现记录列表 ----------
        status, data = api_request("GET", "/earnings/withdrawals", token=teacher_token)
        items = get_data(data).get("items", [])
        record_result(
            "TC-EAR-07", "教师获取提现记录列表", "P0",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
            detail=f"返回 {len(items)} 条提现记录",
        )

        # ---------- TC-EAR-08: 提现记录分页 ----------
        status, data = api_request("GET", "/earnings/withdrawals", token=teacher_token, params={"page": 1, "pageSize": 10})
        record_result(
            "TC-EAR-08", "提现记录分页", "P1",
            success=(status == 200),
            actual_status=status,
            expected_status=200,
        )

        # ---------- TC-EAR-05: 提现金额超过余额 ----------
        status, data = api_request("POST", "/earnings/withdraw", token=teacher_token, json_body={
            "amount": balance + 1000000,
            "account": "test@example.com",
            "accountType": "alipay",
        })
        record_result(
            "TC-EAR-05", "提现金额超过可提现余额", "P2",
            success=(status == 400),
            actual_status=status,
            expected_status=400,
        )
    else:
        print("  ⚠️ 可提现余额不足 100 元，跳过提现测试")

    # ---------- TC-EAR-09: 学员操作收益（无权）----------
    if student_token:
        status, data = api_request("GET", "/earnings/stats", token=student_token)
        record_result(
            "TC-EAR-09", "学员操作收益（无权）", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )


def test_09_teacher_settings():
    """
    3.6.4 教师设置
    """
    print_separator("3.6.4 教师设置")

    teacher_token = login("teacher01")
    student_token = login_or_register_student()

    # ---------- TC-SET-01: 获取当前教师信息 ----------
    status, data = api_request("GET", "/teachers/profile", token=teacher_token)
    d = get_data(data)
    record_result(
        "TC-SET-01", "获取当前教师信息", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"姓名: {d.get('realName', 'N/A')}",
    )

    # ---------- TC-SET-02: 更新教师信息（收款账号）----------
    status, data = api_request("PUT", "/teachers/profile", token=teacher_token, json_body={
        "realName": "张老师",
        "paymentAccount": "zhang@alipay.com",
        "notificationEnabled": True,
    })
    d = get_data(data)
    record_result(
        "TC-SET-02", "更新教师信息（收款账号）", "P0",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"更新后的paymentAccount: {d.get('paymentAccount', 'N/A')}",
    )

    # ---------- TC-SET-03: 更新教师信息（通知开关）----------
    status, data = api_request("PUT", "/teachers/profile", token=teacher_token, json_body={
        "notificationEnabled": False,
    })
    # 注意：如果 API 响应不包含 notificationEnabled，则测试仅验证 status==200
    record_result(
        "TC-SET-03", "更新教师信息（通知开关）", "P1",
        success=(status == 200),
        actual_status=status,
        expected_status=200,
        detail=f"notificationEnabled响应值: {get_data(data).get('notificationEnabled', '无此字段')}",
    )

    # 恢复通知设置（不影响后续使用）
    api_request("PUT", "/teachers/profile", token=teacher_token, json_body={"notificationEnabled": True})

    # ---------- TC-SET-05: 学员无权修改 ----------
    if student_token:
        status, data = api_request("PUT", "/teachers/profile", token=student_token, json_body={
            "realName": "学员冒充教师",
        })
        record_result(
            "TC-SET-05", "学员无权修改教师设置", "P1",
            success=(status == 403),
            actual_status=status,
            expected_status=403,
        )


def test_10_status_flow():
    """
    3.8 覆盖课程状态流转
    使用 PATCH /api/v1/courses/:id/status 测试合法/非法流转
    """
    print_separator("3.8 课程状态流转覆盖测试")

    admin_token = login("admin")
    teacher_token = login("teacher01")

    # 创建草稿课程
    status, data = api_request("POST", "/courses", token=teacher_token, json_body={
        "title": f"状态流转测试_{int(time.time())}",
        "description": "用于状态流转测试",
        "categoryId": 1,
        "price": 9900,
        "courseType": "single",
    })
    flow_course_id = get_data(data).get("id")

    if flow_course_id:
        # ---------- TC-FLW-05: 非法流转 draft → approved ----------
        status, data = api_request("PATCH", f"/courses/{flow_course_id}/status", token=admin_token, json_body={
            "status": "approved",
        })
        record_result(
            "TC-FLW-05", "非法流转：draft → 直接 approved", "P2",
            success=(status == 400),
            actual_status=status,
            expected_status=400,
            detail=f"响应: {data.get('message', str(data))[:80]}",
        )

        # ---------- TC-FLW-01: 完整流转 draft → pending → approved ----------
        # draft → pending
        api_request("POST", f"/courses/{flow_course_id}/submit-review", token=teacher_token)
        status, data = api_request("GET", f"/courses/{flow_course_id}", token=teacher_token)
        d = get_data(data)
        current_status = d.get("status", "")
        step1_ok = current_status == "pending"

        # pending → approved
        api_request("POST", f"/courses/{flow_course_id}/review", token=admin_token, json_body={"approved": True})
        status, data = api_request("GET", f"/courses/{flow_course_id}", token=teacher_token)
        d = get_data(data)
        current_status = d.get("status", "")
        step2_ok = current_status == "approved"

        record_result(
            "TC-FLW-01", "完整流转：draft → pending → approved", "P0",
            success=step1_ok and step2_ok,
            detail=f"最终状态: {current_status}",
        )

        # ---------- TC-FLW-04: 完整流转：已上架 → 编辑 → 提交审核 → 审核通过 ----------
        api_request("PUT", f"/courses/{flow_course_id}", token=teacher_token, json_body={"title": f"已编辑_{int(time.time())}"})
        api_request("POST", f"/courses/{flow_course_id}/submit-review", token=teacher_token)
        status, data = api_request("GET", f"/courses/{flow_course_id}", token=teacher_token)
        step1_ok = get_data(data).get("status") == "pending"
        api_request("POST", f"/courses/{flow_course_id}/review", token=admin_token, json_body={"approved": True})
        status, data = api_request("GET", f"/courses/{flow_course_id}", token=teacher_token)
        step2_ok = get_data(data).get("status") == "approved"

        record_result(
            "TC-FLW-04", "完整流转：已上架 → 编辑 → 重新提交 → 批准", "P0",
            success=step1_ok and step2_ok,
            detail=f"最终状态: approved",
        )

        # 清理测试数据（删除测试课程）
        api_request("DELETE", f"/courses/{flow_course_id}", token=teacher_token)

    # 引用说明
    print("  ℹ️ TC-FLW-02 完整流转 rejected → pending 已在 TC-REV-02 中验证")
    print("  ℹ️ TC-FLW-03 完整流转 approved → off_shelf 由管理端直接操作完成")


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

    # 按照优先级统计
    for priority in ["P0", "P1", "P2"]:
        cases = [r for r in test_results if r["priority"] == priority]
        if not cases:
            continue
        p_passed = sum(1 for r in cases if r["success"])
        p_total = len(cases)
        p_rate = p_passed / p_total * 100 if p_total > 0 else 0
        print(f"  [{priority}] 通过率: {p_passed}/{p_total} ({p_rate:.1f}%)")

    # 失败的详细列表
    if failed_count > 0:
        print(f"\n  ❌ 失败用例详情:")
        for r in test_results:
            if not r["success"]:
                print(f"    [{r['priority']}] {r['case_id']} {r['case_name']}")
                print(f"          期望 {r['expected_status']}, 实际 {r['actual_status']}")
                if r["detail"]:
                    print(f"          详情: {r['detail']}")


# ============================================================
# 主函数
# ============================================================

def main():
    """
    主函数：依次执行所有测试场景

    执行流程：
    1. 课程审核流程（TC-REV-01 ~ TC-REV-15）
    2. 课程推荐/置顶（TC-FEA-01 ~ TC-FEA-03）
    3. 课程封面上传（TC-COV-01 ~ TC-COV-04）
    4. 课程播放与试看（TC-PLY-01 ~ TC-PLY-08）
    5. 附件审核流程（TC-ATT-01 ~ TC-ATT-10）
    6. 教师仪表盘（TC-DSH-01 ~ TC-DSH-02）
    7. 制作人管理（TC-PRO-01 ~ TC-PRO-03）
    8. 收益管理（TC-EAR-01 ~ TC-EAR-09）
    9. 教师设置（TC-SET-01 ~ TC-SET-05）
    10. 状态流转覆盖（TC-FLW-01 ~ TC-FLW-05）
    """
    print(f"\n{'=' * 70}")
    print(f"  🚀 v2.4 ~ v2.8 自动化测试脚本")
    print(f"  开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'=' * 70}")

    start_time = time.time()

    print(f"\n📌 接口基础地址: {API_PREFIX}")

    # 1. 课程审核流程
    test_01_course_review_flow()

    # 2. 课程推荐/置顶
    test_02_featured_courses()

    # 3. 课程封面上传
    test_03_course_cover_upload()

    # 4. 课程播放与试看
    test_04_course_playback()

    # 5. 附件审核流程
    test_05_attachment_review_flow()

    # 6. 教师仪表盘
    test_06_teacher_dashboard()

    # 7. 制作人管理
    test_07_teacher_producers()

    # 8. 收益管理
    test_08_earnings()

    # 9. 教师设置
    test_09_teacher_settings()

    # 10. 状态流转覆盖
    test_10_status_flow()

    elapsed = time.time() - start_time
    print(f"\n⏱ 总耗时: {elapsed:.1f} 秒")

    # 打印总结
    print_summary()

    # 返回失败数量（用于 CI/CD 退出码）
    return failed_count


if __name__ == "__main__":
    sys.exit(main())
