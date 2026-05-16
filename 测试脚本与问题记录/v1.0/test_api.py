#!/usr/bin/env python3
"""API 自动化测试脚本 - 根据测试指南 v0.1.0 执行"""
import requests
import json
import sys
import io
import time

# Windows 控制台编码修复
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 生成唯一后缀避免多次运行冲突
_SUFFIX = str(int(time.time()))[-6:]
def uname(base):
    return f"{base}_{_SUFFIX}"

BASE_URL = "http://localhost:3000/api/v1"

def req(method, path, token=None, json_data=None):
    """发送 HTTP 请求"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{path}"
    if method == "GET":
        r = requests.get(url, headers=headers)
    elif method == "POST":
        r = requests.post(url, headers=headers, json=json_data)
    elif method == "PUT":
        r = requests.put(url, headers=headers, json=json_data)
    elif method == "PATCH":
        r = requests.patch(url, headers=headers)
    return r

def test_case(case_id, name, result, expected_code, detail=""):
    """记录测试结果"""
    status = "[PASS]" if result else "[FAIL]"
    print(f"| {case_id} | {name} | {status} | code={expected_code} | {detail} |")

# =============================================
# 获取 Token
# =============================================
print("\n========== 获取测试 Token ==========")
r = req("POST", "/auth/login", json_data={"username": "admin", "password": "admin123"})
admin_data = r.json()
ADMIN_TOKEN = admin_data.get("data", {}).get("accessToken", "")
print(f"Admin Token: {ADMIN_TOKEN[:50]}...")

r2 = req("POST", "/auth/login", json_data={"username": "teacher01", "password": "admin123"})
teacher_data = r2.json()
TEACHER_TOKEN = teacher_data.get("data", {}).get("accessToken", "")
print(f"Teacher Token: {TEACHER_TOKEN[:50]}...")

r3 = req("POST", "/auth/login", json_data={"username": "student_test2", "password": "test123456"})
student_data = r3.json()
STUDENT_TOKEN = student_data.get("data", {}).get("accessToken", "")
print(f"Student Token: {STUDENT_TOKEN[:50]}...")

# =============================================
print("\n========== TC-001~TC-004: 认证模块 ==========")
# TC-001 学员注册
_stu = uname("stu_test")
r = req("POST", "/auth/register", json_data={
    "username": _stu, "password": "test123456",
    "nickname": "API测试学员", "phone": "13900001111", "email": "api@test.com"
})
test_case("TC-001", "学员注册", r.status_code == 201, r.status_code, r.json().get("message"))

# TC-002 学员登录
r = req("POST", "/auth/login", json_data={"username": _stu, "password": "test123456"})
test_case("TC-002", "学员登录", r.status_code == 200, r.status_code, r.json().get("message"))

# TC-003 管理员登录（已测）
test_case("TC-003", "管理员登录", r2.status_code == 200, r2.status_code, r2.json().get("message"))

# TC-004 密码错误登录（已测）
r = req("POST", "/auth/login", json_data={"username": "admin", "password": "wrongpass"})
test_case("TC-004", "密码错误登录", r.status_code == 400 and "用户名或密码错误" in r.json().get("message", ""), r.status_code, r.json().get("message"))

# =============================================
print("\n========== TC-005~TC-007: 管理创建账号 ==========")
# TC-005 创建教师账号
_t_name = uname("tc_api")
r = req("POST", "/auth/accounts/teacher", token=ADMIN_TOKEN, json_data={
    "username": _t_name, "password": "teacher123", "nickname": "API老师"
})
data = r.json().get('data') or {}
test_case("TC-005", "创建教师账号", r.status_code == 201, r.status_code, f"role={data.get('role','')}")

# TC-006 创建审核员账号
_r_name = uname("rv_api")
r = req("POST", "/auth/accounts/reviewer", token=ADMIN_TOKEN, json_data={
    "username": _r_name, "password": "reviewer123", "nickname": "API审核员"
})
data = r.json().get('data') or {}
test_case("TC-006", "创建审核员账号", r.status_code == 201, r.status_code, f"role={data.get('role','')}")

# TC-007 创建运营员账号
_o_name = uname("op_api")
r = req("POST", "/auth/accounts/operator", token=ADMIN_TOKEN, json_data={
    "username": _o_name, "password": "operator123", "nickname": "API运营员"
})
data = r.json().get('data') or {}
test_case("TC-007", "创建运营员账号", r.status_code == 201, r.status_code, f"role={data.get('role','')}")

# =============================================
print("\n========== TC-008~TC-009: 用户模块 ==========")
# TC-008 获取当前用户信息
r = req("GET", "/users/profile", token=ADMIN_TOKEN)
test_case("TC-008", "获取用户信息", r.status_code == 200, r.status_code, f"username={r.json().get('data',{}).get('username','')}")

# TC-009 更新用户信息
r = req("PUT", "/users/profile", token=ADMIN_TOKEN, json_data={
    "nickname": "超级管理员(已更新)", "phone": "13988886666"
})
test_case("TC-009", "更新用户信息", r.status_code == 200, r.status_code, r.json().get("message"))

# =============================================
print("\n========== TC-010~TC-012: 管理员用户管理 ==========")
# TC-010 获取用户列表
r = req("GET", "/users?page=1&pageSize=20", token=ADMIN_TOKEN)
data = r.json().get("data", {})
test_case("TC-010", "用户列表", r.status_code == 200 and len(data.get("items",[]))>0, r.status_code, f"总数={data.get('total',0)}")

# TC-011 按角色筛选
r = req("GET", "/users?role=teacher", token=ADMIN_TOKEN)
data = r.json().get("data", {})
items = data.get("items", [])
all_teacher = all(i.get("role") == "teacher" for i in items) if items else True
test_case("TC-011", "按角色筛选", r.status_code == 200 and all_teacher, r.status_code, f"教师数={data.get('total',0)}")

# TC-012 切换用户状态（禁用用户2）
r = req("PATCH", "/users/2/toggle", token=ADMIN_TOKEN)
test_case("TC-012", "切换用户状态", r.status_code == 200, r.status_code, r.json().get("message"))

# 验证：禁用后无法登录
r = req("POST", "/auth/login", json_data={"username": "teacher01", "password": "admin123"})
test_case("TC-012b", "禁用用户登录验证", r.status_code == 403 and "禁用" in r.json().get("message",""), r.status_code, r.json().get("message"))

# 恢复用户状态
r = req("PATCH", "/users/2/toggle", token=ADMIN_TOKEN)
print(f"  [恢复] 用户2状态: {r.json().get('message')}")

# =============================================
print("\n========== TC-013~TC-017: 教师模块 ==========")
# 先用新教师登录
r = req("POST", "/auth/login", json_data={"username": _t_name, "password": "teacher123"})
T2_TOKEN = r.json().get("data", {}).get("accessToken", "")

# TC-013 创建教师详情
r = req("POST", "/teachers/profile", token=T2_TOKEN, json_data={"realName": "李四"})
test_case("TC-013", "创建教师详情", r.status_code == 201, r.status_code, r.json().get("message"))

# TC-014 获取当前教师信息
r = req("GET", "/teachers/profile", token=T2_TOKEN)
test_case("TC-014", "获取教师信息", r.status_code == 200, r.status_code, f"realName={r.json().get('data',{}).get('realName','')}")

# TC-015 更新教师信息
r = req("PUT", "/teachers/profile", token=T2_TOKEN, json_data={
    "introduction": "资深吉他教师，15年教学经验",
    "specialties": "吉他,尤克里里,指弹",
    "contactInfo": "微信: teacher_li"
})
test_case("TC-015", "更新教师信息", r.status_code == 200, r.status_code, r.json().get("message"))

# TC-016 管理员获取教师列表
r = req("GET", "/teachers", token=ADMIN_TOKEN)
data = r.json().get("data", {})
test_case("TC-016", "教师列表", r.status_code == 200, r.status_code, f"教师数={data.get('total',0)}")

# TC-017 管理员认证教师（认证 teacher01，ID=1）
r = req("POST", "/teachers/1/verify", token=ADMIN_TOKEN)
test_case("TC-017", "认证教师", r.status_code == 201 or r.status_code == 200, r.status_code, r.json().get("message"))

# =============================================
print("\n========== TC-032~TC-040: 异常场景 ==========")
# TC-032 重复注册
r = req("POST", "/auth/register", json_data={
    "username": _stu, "password": "test123456", "nickname": "重复"
})
test_case("TC-032", "重复注册", r.status_code == 409 and "已存在" in r.json().get("message",""), r.status_code, r.json().get("message"))

# TC-034 无 Token 访问
r = req("GET", "/users/profile")
test_case("TC-034", "无Token访问", r.status_code == 401, r.status_code, r.json().get("message"))

# TC-035 无效 Token
r = requests.get(f"{BASE_URL}/users/profile", headers={"Authorization": "Bearer invalid_token_xxx"})
test_case("TC-035", "无效Token", r.status_code == 401, r.status_code, r.json().get("message"))

# TC-037 越权操作（学员调用管理员接口）
r = req("GET", "/users", token=STUDENT_TOKEN)
test_case("TC-037", "越权操作", r.status_code == 403, r.status_code, r.json().get("message"))

# TC-038 密码校验（密码少于6位）
r = req("POST", "/auth/register", json_data={
    "username": "shortpw", "password": "123", "nickname": "短密码"
})
test_case("TC-039", "参数校验(短密码)", r.status_code == 400, r.status_code, r.json().get("message"))

# TC-040 404
r = requests.get(f"{BASE_URL}/not-exist-path")
test_case("TC-040", "404路由", r.status_code == 404, r.status_code, r.json().get("message"))

# =============================================
print("\n========== 测试结果汇总 ==========")
print("| 用例编号 | 用例名称 | 结果 | HTTP状态码 | 备注 |")
print("|:--------:|----------|:---:|:----------:|------|")
