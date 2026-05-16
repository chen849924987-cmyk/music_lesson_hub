#!/usr/bin/env python3
"""API 自动化测试脚本 - 根据测试指南 v0.2.0-p1 执行课程模块测试"""
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

# 测试结果统计
pass_count = 0
fail_count = 0
test_results = []

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
        r = requests.patch(url, headers=headers, json=json_data)
    elif method == "DELETE":
        r = requests.delete(url, headers=headers)
    return r

def test_case(case_id, name, result, expected_code, detail=""):
    """记录测试结果"""
    global pass_count, fail_count
    status = "✅ PASS" if result else "❌ FAIL"
    if result:
        pass_count += 1
    else:
        fail_count += 1
    test_results.append((case_id, name, status, expected_code, detail))
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

r3 = req("POST", "/auth/login", json_data={"username": "operator01", "password": "admin123"})
operator_data = r3.json()
OPERATOR_TOKEN = operator_data.get("data", {}).get("accessToken", "")
print(f"Operator Token: {OPERATOR_TOKEN[:50]}...")

# 注册一个学员用于测试
_stu = uname("stu_course")
_stu_pwd = "test123456"
r = req("POST", "/auth/register", json_data={
    "username": _stu, "password": _stu_pwd,
    "nickname": "课程测试学员", "phone": "13900002222", "email": "course_test@test.com"
})
# 注册后重新登录获取 token（注册接口可能不返回 accessToken）
r = req("POST", "/auth/login", json_data={"username": _stu, "password": _stu_pwd})
student_data = r.json()
STUDENT_TOKEN = student_data.get("data", {}).get("accessToken", "")
print(f"Student Token: {STUDENT_TOKEN[:50] if STUDENT_TOKEN else '(empty)'}...")

# =============================================
print("\n========== 分类管理 Categories (TC-C01~C08) ==========")

# TC-C01 获取所有分类列表
r = req("GET", "/categories")
data = r.json().get("data", [])
test_case("TC-C01", "获取所有分类列表", r.status_code == 200 and len(data) >= 6, r.status_code, f"分类数={len(data)}")

# TC-C02 获取启用的分类列表
r = req("GET", "/categories/active")
data = r.json().get("data", [])
all_active = all(c.get("isActive") == True for c in data) if data else True
test_case("TC-C02", "获取启用的分类列表", r.status_code == 200 and all_active, r.status_code, f"启用数={len(data)}")

# TC-C03 获取分类详情
r = req("GET", "/categories/1")
data = r.json().get("data", {})
test_case("TC-C03", "获取分类详情", r.status_code == 200 and data.get("name") == "钢琴", r.status_code, f"name={data.get('name','')}")

# TC-C04 管理员创建分类
r = req("POST", "/categories", token=ADMIN_TOKEN, json_data={
    "name": "小提琴", "icon": "violin", "sortOrder": 7, "isActive": True
})
data = r.json().get("data", {})
test_case("TC-C04", "管理员创建分类", r.status_code == 201 and data.get("name") == "小提琴", r.status_code, f"id={data.get('id','')}")

# 记录新分类ID
NEW_CAT_ID = data.get("id")

# TC-C05 管理员更新分类
r = req("PUT", f"/categories/{NEW_CAT_ID}", token=ADMIN_TOKEN, json_data={
    "name": "小提琴（已更新）", "sortOrder": 8
})
data = r.json().get("data", {})
test_case("TC-C05", "管理员更新分类", r.status_code == 200 and "已更新" in data.get("name", ""), r.status_code, f"name={data.get('name','')}")

# TC-C06 管理员删除分类
r = req("DELETE", f"/categories/{NEW_CAT_ID}", token=ADMIN_TOKEN)
test_case("TC-C06", "管理员删除分类", r.status_code == 200, r.status_code, r.json().get("message"))

# TC-C07 运营员可管理分类
r = req("POST", "/categories", token=OPERATOR_TOKEN, json_data={
    "name": "大提琴", "icon": "cello", "sortOrder": 9, "isActive": True
})
data = r.json().get("data", {})
test_case("TC-C07", "运营员可管理分类", r.status_code == 201 and data.get("name") == "大提琴", r.status_code, f"id={data.get('id','')}")

# 清理运营员创建的分类
if data.get("id"):
    req("DELETE", f"/categories/{data.get('id')}", token=ADMIN_TOKEN)

# TC-C08 教师无权管理分类
r = req("POST", "/categories", token=TEACHER_TOKEN, json_data={
    "name": "教师分类", "icon": "test", "sortOrder": 99
})
test_case("TC-C08", "教师无权管理分类", r.status_code == 403, r.status_code, r.json().get("message"))

# =============================================
print("\n========== 课程管理 Courses (TC-C09~C21) ==========")

# TC-C09 公开获取已上架课程列表
r = req("GET", "/courses")
data = r.json().get("data", {})
items = data.get("items", [])
all_approved = all(i.get("status") == "approved" for i in items) if items else True
test_case("TC-C09", "公开获取已上架课程列表", r.status_code == 200 and all_approved, r.status_code, f"课程数={data.get('meta', {}).get('total',0)}")

# TC-C10 按分类筛选课程
r = req("GET", "/courses?categoryId=1")
data = r.json().get("data", {})
items = data.get("items", [])
all_piano = all(i.get("categoryId") == 1 for i in items) if items else True
test_case("TC-C10", "按分类筛选课程", r.status_code == 200 and all_piano, r.status_code, f"钢琴课程数={data.get('meta', {}).get('total',0)}")

# TC-C11 按关键词搜索课程
r = req("GET", "/courses?keyword=钢琴")
data = r.json().get("data", {})
items = data.get("items", [])
has_keyword = any("钢琴" in i.get("title", "") for i in items) if items else False
test_case("TC-C11", "按关键词搜索课程", r.status_code == 200 and has_keyword, r.status_code, f"结果数={data.get('meta', {}).get('total',0)}")

# TC-C12 按价格排序
r = req("GET", "/courses?sortBy=price&sortOrder=ASC")
data = r.json().get("data", {})
items = data.get("items", [])
is_sorted = True
if len(items) > 1:
    prices = [i.get("price", 0) or 0 for i in items]
    is_sorted = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
test_case("TC-C12", "按价格排序", r.status_code == 200 and is_sorted, r.status_code, f"价格顺序={[i.get('price',0) for i in items[:3]]}")

# TC-C13 公开获取课程详情
r = req("GET", "/courses/1")
data = r.json().get("data", {})
has_chapters = len(data.get("chapters", [])) > 0
has_lessons = len(data.get("chapters", [{}])[0].get("lessons", [])) > 0 if data.get("chapters") else False
test_case("TC-C13", "公开获取课程详情", r.status_code == 200 and has_chapters and has_lessons, r.status_code, f"章节数={len(data.get('chapters',[]))}")

# TC-C14 教师创建课程
r = req("POST", "/courses", token=TEACHER_TOKEN, json_data={
    "title": "测试课程-声乐入门",
    "description": "从零开始学习声乐基础技巧",
    "categoryId": 3,
    "courseType": "single",
    "price": 19900,
    "originalPrice": 29900,
    "tags": "声乐,入门,发声"
})
data = r.json().get("data", {})
NEW_COURSE_ID = data.get("id")
test_case("TC-C14", "教师创建课程", r.status_code == 201 and data.get("status") == "draft", r.status_code, f"id={NEW_COURSE_ID}, status={data.get('status','')}")

# TC-C15 教师获取我的课程列表
r = req("GET", "/courses/teacher", token=TEACHER_TOKEN)
data = r.json().get("data", {})
items = data.get("items", [])
my_courses = any(i.get("id") == NEW_COURSE_ID for i in items) if items else False
test_case("TC-C15", "教师获取我的课程列表", r.status_code == 200 and my_courses, r.status_code, f"我的课程数={data.get('meta', {}).get('total',0)}")

# TC-C16 教师更新课程
r = req("PUT", f"/courses/{NEW_COURSE_ID}", token=TEACHER_TOKEN, json_data={
    "title": "测试课程-声乐入门（已更新）",
    "price": 24900
})
data = r.json().get("data", {})
test_case("TC-C16", "教师更新课程", r.status_code == 200 and "已更新" in data.get("title", ""), r.status_code, f"title={data.get('title','')}")

# TC-C17 教师删除课程
r = req("DELETE", f"/courses/{NEW_COURSE_ID}", token=TEACHER_TOKEN)
test_case("TC-C17", "教师删除课程", r.status_code == 200, r.status_code, r.json().get("message"))

# 验证删除后查询返回 404
r = req("GET", f"/courses/{NEW_COURSE_ID}")
test_case("TC-C17b", "删除后查询验证", r.status_code == 404, r.status_code, r.json().get("message"))

# TC-C18 管理员获取所有课程列表
r = req("GET", "/courses/admin", token=ADMIN_TOKEN)
data = r.json().get("data", {})
items = data.get("items", [])
has_draft = any(i.get("status") == "draft" for i in items) if items else False
test_case("TC-C18", "管理员获取所有课程列表", r.status_code == 200 and has_draft, r.status_code, f"总数={data.get('meta', {}).get('total',0)}")

# TC-C19 教师变更课程状态（提交审核）
# 先创建一个新课程用于状态流转测试
r = req("POST", "/courses", token=TEACHER_TOKEN, json_data={
    "title": "状态流转测试课程",
    "description": "用于测试课程状态流转",
    "categoryId": 1,
    "courseType": "single",
    "price": 9900
})
STATUS_COURSE_ID = r.json().get("data", {}).get("id")

r = req("PATCH", f"/courses/{STATUS_COURSE_ID}/status", token=TEACHER_TOKEN, json_data={"status": "pending"})
data = r.json().get("data", {})
test_case("TC-C19", "教师提交审核", r.status_code == 200 and data.get("status") == "pending", r.status_code, f"status={data.get('status','')}")

# TC-C20 管理员审核课程
r = req("PATCH", f"/courses/{STATUS_COURSE_ID}/status", token=ADMIN_TOKEN, json_data={"status": "approved"})
data = r.json().get("data", {})
test_case("TC-C20", "管理员审核课程", r.status_code == 200 and data.get("status") == "approved", r.status_code, f"status={data.get('status','')}")

# 清理状态测试课程
req("DELETE", f"/courses/{STATUS_COURSE_ID}", token=TEACHER_TOKEN)

# TC-C21 学员无权创建课程
r = req("POST", "/courses", token=STUDENT_TOKEN, json_data={
    "title": "学员课程", "categoryId": 1, "courseType": "single"
})
test_case("TC-C21", "学员无权创建课程", r.status_code == 403, r.status_code, r.json().get("message"))

# =============================================
print("\n========== 章节管理 Chapters (TC-C22~C27) ==========")

# TC-C22 公开获取章节列表
r = req("GET", "/courses/1/chapters")
data = r.json().get("data", [])
test_case("TC-C22", "公开获取章节列表", r.status_code == 200 and len(data) >= 3, r.status_code, f"章节数={len(data)}")

# TC-C23 获取章节详情
r = req("GET", "/courses/1/chapters/1")
data = r.json().get("data", {})
test_case("TC-C23", "获取章节详情", r.status_code == 200 and data.get("id") == 1, r.status_code, f"title={data.get('title','')}")

# TC-C24 教师创建章节
r = req("POST", "/courses/1/chapters", token=TEACHER_TOKEN, json_data={
    "title": "进阶技巧",
    "description": "学习更高级的演奏技巧",
    "sortOrder": 4
})
data = r.json().get("data", {})
NEW_CHAPTER_ID = data.get("id")
test_case("TC-C24", "教师创建章节", r.status_code == 201 and data.get("title") == "进阶技巧", r.status_code, f"id={NEW_CHAPTER_ID}")

# TC-C25 教师更新章节
r = req("PUT", f"/courses/1/chapters/{NEW_CHAPTER_ID}", token=TEACHER_TOKEN, json_data={
    "title": "进阶技巧（已更新）"
})
data = r.json().get("data", {})
test_case("TC-C25", "教师更新章节", r.status_code == 200 and "已更新" in data.get("title", ""), r.status_code, f"title={data.get('title','')}")

# TC-C26 教师更新章节排序
r = req("PATCH", f"/courses/1/chapters/{NEW_CHAPTER_ID}/sort", token=TEACHER_TOKEN, json_data={"sortOrder": 1})
data = r.json().get("data", {})
test_case("TC-C26", "教师更新章节排序", r.status_code == 200 and data.get("sortOrder") == 1, r.status_code, f"sortOrder={data.get('sortOrder','')}")

# TC-C27 教师删除章节
r = req("DELETE", f"/courses/1/chapters/{NEW_CHAPTER_ID}", token=TEACHER_TOKEN)
test_case("TC-C27", "教师删除章节", r.status_code == 200, r.status_code, r.json().get("message"))

# =============================================
print("\n========== 课时管理 Lessons (TC-C28~C34) ==========")

# TC-C28 公开获取课时列表
r = req("GET", "/courses/1/lessons")
data = r.json().get("data", [])
test_case("TC-C28", "公开获取课时列表", r.status_code == 200 and len(data) >= 8, r.status_code, f"课时数={len(data)}")

# TC-C29 获取课时详情
r = req("GET", "/courses/1/lessons/1")
data = r.json().get("data", {})
test_case("TC-C29", "获取课时详情", r.status_code == 200 and data.get("id") == 1, r.status_code, f"title={data.get('title','')}")

# TC-C30 教师创建课时（关联章节）
r = req("POST", "/courses/1/lessons", token=TEACHER_TOKEN, json_data={
    "chapterId": 1,
    "title": "新增课时-音阶练习",
    "description": "学习基本音阶的弹奏方法",
    "duration": 360,
    "isFree": False,
    "sortOrder": 4
})
data = r.json().get("data", {})
NEW_LESSON_ID = data.get("id")
test_case("TC-C30", "教师创建课时（关联章节）", r.status_code == 201 and data.get("chapterId") == 1, r.status_code, f"id={NEW_LESSON_ID}")

# TC-C31 教师创建课时（单课程，无章节）
r = req("POST", "/courses/2/lessons", token=TEACHER_TOKEN, json_data={
    "title": "新增课时-指弹入门",
    "description": "学习指弹的基本技巧",
    "duration": 480,
    "isFree": True,
    "sortOrder": 5
})
data = r.json().get("data", {})
NEW_LESSON_ID2 = data.get("id")
test_case("TC-C31", "教师创建课时（单课程）", r.status_code == 201 and data.get("chapterId") is None, r.status_code, f"id={NEW_LESSON_ID2}, chapterId={data.get('chapterId')}")

# TC-C32 教师更新课时
r = req("PUT", f"/courses/1/lessons/{NEW_LESSON_ID}", token=TEACHER_TOKEN, json_data={
    "title": "新增课时-音阶练习（已更新）",
    "duration": 420
})
data = r.json().get("data", {})
test_case("TC-C32", "教师更新课时", r.status_code == 200 and "已更新" in data.get("title", ""), r.status_code, f"title={data.get('title','')}")

# TC-C33 教师更新课时排序
r = req("PATCH", f"/courses/1/lessons/{NEW_LESSON_ID}/sort", token=TEACHER_TOKEN, json_data={"sortOrder": 1})
data = r.json().get("data", {})
test_case("TC-C33", "教师更新课时排序", r.status_code == 200 and data.get("sortOrder") == 1, r.status_code, f"sortOrder={data.get('sortOrder','')}")

# TC-C34 教师删除课时
r = req("DELETE", f"/courses/1/lessons/{NEW_LESSON_ID}", token=TEACHER_TOKEN)
test_case("TC-C34", "教师删除课时", r.status_code == 200, r.status_code, r.json().get("message"))

# 清理第二个课时
if NEW_LESSON_ID2:
    req("DELETE", f"/courses/2/lessons/{NEW_LESSON_ID2}", token=TEACHER_TOKEN)

# =============================================
print("\n========== 异常场景 (TC-C35~C44) ==========")

# TC-C35 创建课程缺少必填字段
r = req("POST", "/courses", token=TEACHER_TOKEN, json_data={
    "categoryId": 1, "courseType": "single"
})
test_case("TC-C35", "创建课程缺少必填字段", r.status_code == 400, r.status_code, r.json().get("message"))

# TC-C36 创建课程使用无效分类ID
r = req("POST", "/courses", token=TEACHER_TOKEN, json_data={
    "title": "无效分类测试", "categoryId": 9999, "courseType": "single"
})
test_case("TC-C36", "创建课程使用无效分类ID", r.status_code == 400, r.status_code, r.json().get("message"))

# TC-C37 教师更新他人课程（使用学员Token尝试更新课程1）
r = req("PUT", "/courses/1", token=STUDENT_TOKEN, json_data={"title": "越权更新"})
test_case("TC-C37", "学员越权更新课程", r.status_code == 403, r.status_code, r.json().get("message"))

# TC-C38 删除不存在的课程
r = req("DELETE", "/courses/9999", token=TEACHER_TOKEN)
test_case("TC-C38", "删除不存在的课程", r.status_code == 404, r.status_code, r.json().get("message"))

# TC-C39 获取不存在的分类
r = req("GET", "/categories/9999")
test_case("TC-C39", "获取不存在的分类", r.status_code == 404, r.status_code, r.json().get("message"))

# TC-C40 创建章节时课程不存在
r = req("POST", "/courses/9999/chapters", token=TEACHER_TOKEN, json_data={"title": "不存在的课程章节"})
test_case("TC-C40", "创建章节时课程不存在", r.status_code == 404, r.status_code, r.json().get("message"))

# TC-C41 创建课时时章节不存在
r = req("POST", "/courses/1/lessons", token=TEACHER_TOKEN, json_data={
    "chapterId": 9999, "title": "不存在的章节课时"
})
test_case("TC-C41", "创建课时时章节不存在", r.status_code == 400, r.status_code, r.json().get("message"))

# TC-C42 未登录访问教师接口
r = req("POST", "/courses", json_data={
    "title": "未登录测试", "categoryId": 1, "courseType": "single"
})
test_case("TC-C42", "未登录访问教师接口", r.status_code == 401, r.status_code, r.json().get("message"))

# TC-C43 学员访问管理端接口
r = req("GET", "/courses/admin", token=STUDENT_TOKEN)
test_case("TC-C43", "学员访问管理端接口", r.status_code == 403, r.status_code, r.json().get("message"))

# TC-C44 课程状态流转非法（直接 draft → approved）
# 先创建一个新课程
r = req("POST", "/courses", token=TEACHER_TOKEN, json_data={
    "title": "非法流转测试课程",
    "description": "测试非法状态流转",
    "categoryId": 1,
    "courseType": "single",
    "price": 5000
})
ILLEGAL_COURSE_ID = r.json().get("data", {}).get("id")
# 尝试直接 draft → approved（跳过 pending）
r = req("PATCH", f"/courses/{ILLEGAL_COURSE_ID}/status", token=ADMIN_TOKEN, json_data={"status": "approved"})
test_case("TC-C44", "课程状态流转非法", r.status_code == 400, r.status_code, r.json().get("message"))
# 清理
if ILLEGAL_COURSE_ID:
    req("DELETE", f"/courses/{ILLEGAL_COURSE_ID}", token=TEACHER_TOKEN)

# =============================================
print("\n========== 测试结果汇总 ==========")
print(f"\n总计: {pass_count + fail_count}  |  ✅ 通过: {pass_count}  |  ❌ 失败: {fail_count}")
print(f"通过率: {pass_count / (pass_count + fail_count) * 100:.1f}%")
print("\n| 用例编号 | 用例名称 | 结果 | HTTP状态码 | 备注 |")
print("|:--------:|----------|:---:|:----------:|------|")
for case_id, name, status, code, detail in test_results:
    print(f"| {case_id} | {name} | {status} | {code} | {detail} |")

# 输出 JSON 格式结果供后续处理
result_json = {
    "total": pass_count + fail_count,
    "passed": pass_count,
    "failed": fail_count,
    "pass_rate": f"{pass_count / (pass_count + fail_count) * 100:.1f}%",
    "results": [
        {"case_id": cid, "name": n, "status": s, "code": c, "detail": d}
        for cid, n, s, c, d in test_results
    ]
}
print("\n\nJSON 结果:")
print(json.dumps(result_json, ensure_ascii=False, indent=2))
