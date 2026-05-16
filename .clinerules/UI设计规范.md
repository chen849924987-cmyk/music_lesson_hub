# UI设计规范

> **版本**: v2.1
> **最后更新**: 2026-05-07
> **设计参考**: Vuestic UI Design System (https://vuestic.dev)
> **应用范围**: 在线教育平台前端（Vue 3 + TypeScript）

---

## 1. 设计原则

- **简洁高效**：减少不必要的视觉干扰，聚焦内容本身。
- **一致统一**：所有组件遵循统一的设计令牌（Design Tokens），确保视觉一致性。
- **双主题支持**：完整支持亮色（Light）和暗色（Dark）两种主题。
- **响应式适配**：适配桌面端与移动端的不同场景。

---

## 2. 设计令牌体系（Design Tokens）

### 2.1 品牌色板（Brand Colors）

| 令牌 | 用途 | 亮色主题值 | 暗色主题值 |
|------|------|-----------|-----------|
| `--va-primary` | 主色 / 品牌色 | `#0066FF` | `#4D94FF` |
| `--va-primary-darken` | 主色（深）/ 暗色模式按钮背景 | `#0052CC` | `#285AA8` |
| `--va-primary-lighten` | 主色（浅） | `#4D94FF` | `#80B3FF` |
| `--va-secondary` | 次要色 | `#7B8794` | `#94A3B8` |
| `--va-success` | 成功状态 | `#10B981` | `#34D399` |
| `--va-warning` | 警告状态 | `#F59E0B` | `#FBBF24` |
| `--va-danger` | 危险/错误状态 | `#EF4444` | `#F87171` |
| `--va-info` | 信息提示 | `#3B82F6` | `#60A5FA` |

### 2.2 中性色板（Neutral Colors）

| 令牌 | 用途 | 亮色主题值 | 暗色主题值 |
|------|------|-----------|-----------|
| `--va-background-primary` | 主背景 | `#FFFFFF` | `#0F172A` |
| `--va-background-secondary` | 次背景 | `#F8FAFC` | `#1E293B` |
| `--va-background-element` | 元素背景/分割线 | `#E2E8F0` | `#334155` |
| `--va-background-border` | 边框 | `#CBD5E1` | `#475569` |
| `--va-on-background-primary` | 主文字 | `#1E293B` | `#F1F5F9` |
| `--va-on-background-secondary` | 次要文字 | `#475569` | `#CBD5E1` |
| `--va-on-background-element` | 占位文字/弱化 | `#94A3B8` | `#64748B` |
| `--va-text-inverted` | 反转文字（深色背景上的浅色文字） | `#FFFFFF` | `#0B121A` |
| `--va-muted` | 弱化文字 | `#94A3B8` | `#64748B` |

### 2.3 焦点与轮廓（Focus & Outline）

| 令牌 | 值 | 用途 |
|------|---|------|
| `--va-focus` | `#49A8FF` | 焦点环颜色（`:focus-visible` 可见焦点） |
| `--va-outline-border-width` | `0.125rem` (2px) | 轮廓边框宽度 |
| `--va-outline-box-shadow` | `none` | 轮廓阴影（默认无） |

### 2.4 表单与控件（Form & Controls）

| 令牌 | 值 | 用途 |
|------|---|------|
| `--va-control-box-shadow` | `none` | 控件默认阴影（无） |
| `--va-control-border` | `0` | 控件默认边框（无） |
| `--va-form-element-border-width` | `1px` | 表单元素边框宽度 |
| `--va-form-element-border-radius` | `0.25rem` | 表单元素圆角 |
| `--va-form-element-default-width` | `250px` | 表单元素默认宽度 |
| `--va-form-element-min-width` | `50px` | 表单元素最小宽度 |
| `--va-form-padding` | `1.25rem` | 表单容器内边距 |
| `--va-form-border-radius` | `0.125rem` | 表单容器圆角 |

### 2.5 链接色（Link Colors）

| 令牌 | 值 | 用途 |
|------|---|------|
| `--va-link-color` | `var(--va-primary)` | 链接默认色 |
| `--va-link-color-hover` | `var(--va-primary-lighten)` | 链接悬浮色 |
| `--va-link-color-secondary` | `var(--va-secondary)` | 次要链接色 |

### 2.6 阴影体系（Shadow Tokens）

| 令牌 | 值 | 用途 |
|------|---|------|
| `--va-shadow` | `rgba(0,0,0,0.08)`（亮色）/ `rgba(0,0,0,0.3)`（暗色） | 阴影色 |
| `--va-box-shadow` | `0 0.25rem 0.5rem 0 var(--va-shadow)` | 卡片悬浮阴影 |
| `--va-block-box-shadow` | `0 2px 3px 0 rgba(52,56,85,0.25)`（亮色） | 常规区块阴影 |

### 2.7 边框与圆角（Border & Radius）

| 令牌 | 值 | 用途 |
|------|---|------|
| `--va-block-border` | `thin solid var(--va-background-element)` | 区块分隔边框 |
| `--va-block-border-radius` | `0.375rem` (6px) | 区块圆角 |
| `--va-square-border-radius` | `0.25rem` (4px) | 元素小圆角 |
| `--va-stripe-border-size` | `0.25rem` (4px) | 条纹边框尺寸 |

### 2.8 半透明色与辅助色

| 令牌 | 值（亮色） | 值（暗色） | 用途 |
|------|-----------|-----------|------|
| `--va-primary-alpha` | `rgba(0,102,255,0.12)` | `rgba(77,148,255,0.18)` | 主色半透明背景 |
| `--va-primary-light-alpha` | `rgba(0,102,255,0.06)` | `rgba(77,148,255,0.08)` | 主色浅透明背景 |
| `--va-on-primary` | `#FFFFFF` | `#FFFFFF` | 主色上的文字 |
| `--va-background-hover` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | 行/项悬浮背景 |
| `--va-topbar-background` | `rgba(255,255,255,0.85)` | `rgba(15,23,42,0.85)` | 顶栏毛玻璃背景 |
| `--va-text-selected` | `#B3D4FC` | `#1E40AF` | 文本选中高亮 |
| `--va-text-highlighted` | `#FFC5274E` | `#B453094E` | 文本高亮标记 |

---

## 3. 排版体系（Typography）

### 3.1 字体栈（Font Stack）

```css
--va-font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
  'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
--va-letter-spacing: 0.0375rem;
```

- **西文**: Source Sans Pro（自托管 woff2，支持 Regular/Regular Italic/SemiBold/SemiBold Italic/Bold/Bold Italic）
- **中文**: 系统 Noto Sans SC 回退
- **代码**: Source Code Pro, 'Courier New', monospace

### 3.2 标题系统（Heading System）

| 级别 | 字号（font-size） | 行高（line-height） | 字重 | 上下边距 |
|------|-------------------|--------------------|------|---------|
| h1   | 3rem (48px)       | 3.5rem (56px)      | 700  | 0.5rem 0 |
| h2   | 2.5rem (40px)     | 3rem (48px)        | 700  | 0.5rem 0 |
| h3   | 2rem (32px)       | 2.5rem (40px)      | 700  | 0.5rem 0 |
| h4   | 1.75rem (28px)    | 2rem (32px)        | 700  | 0.5rem 0 |
| h5   | 1.5rem (24px)     | 1.75rem (28px)     | 700  | 0.5rem 0 |
| h6   | 1.25rem (20px)    | 1.5rem (24px)      | 700  | 0.5rem 0 |

### 3.3 小标题（Title / Label CSS Class）

用于卡片标题、区块标题等场景（10px uppercase）：

```css
.va-title {
  font-family: var(--va-font-family);
  font-size: 0.625rem;    /* 10px */
  letter-spacing: 0.6px;
  line-height: 1.2;
  font-weight: 700;
  text-transform: uppercase;
  color: currentColor;
}
```

色彩变体：`.va-title-info`、`.va-title-danger`、`.va-title-warning`

### 3.4 正文与段落

- **默认字号**: 1rem (16px)
- **行高**: 1.6
- **段落间距**: 底部 0.75rem
- **字体渲染**: `-webkit-font-smoothing: antialiased` + `-moz-osx-font-smoothing: grayscale`

### 3.5 链接（Link）

| 状态 | 颜色 | 过滤亮度 |
|------|------|---------|
| 默认 | `--va-link-color` (primary) | — |
| Hover | `--va-link-color-hover` | `filter: brightness(125%)` |
| Active | `--va-link-color` | `filter: brightness(150%)` |
| Visited | `--va-link-color` | `filter: brightness(90%)` |

次要链接：`.va-link-secondary` → `color: var(--va-link-color-secondary)`

### 3.6 排版工具类

| 类名 | 作用 |
|------|------|
| `.va-text-bold` | 字体加粗 700 |
| `.va-text-left` / `.va-text-right` / `.va-text-center` | 文本对齐 |
| `.va-text-uppercase` / `.va-text-lowercase` / `.va-text-capitalize` | 大小写转换 |
| `.va-text-no-wrap` | 禁止换行 |
| `.va-text-truncate` | 单行截断 + 省略号 |
| `.va-text-code` | 代码文本样式（Source Code Pro + 背景色） |

### 3.7 引用（Blockquote）

```css
.va-blockquote {
  border-left: 0.25rem solid var(--va-primary);
  border-radius: 0.125rem;
  padding: 0.4rem 0 0.4rem 0.8rem;
  color: var(--va-secondary);
}
```

### 3.8 列表样式

**无序列表 `.va-unordered`**：
- 自定义 0.5rem 圆形标记，颜色 `--va-primary`
- 列表项内边距：0 1rem

**有序列表 `.va-ordered`**：
- 自定义 CSS 计数器 `olCounter`
- 数字格式：`counter(olCounter) ". "`

### 3.9 表格（Table）

```css
.va-table {
  width: 100%;
  font-family: var(--va-font-family);
}
.va-table th {
  font-size: 0.625rem; letter-spacing: 0.6px;
  font-weight: 700; text-transform: uppercase;
  border-bottom: 2px solid var(--va-on-background-primary);
}
.va-table td {
  vertical-align: top;
  border-bottom: 1px solid var(--va-background-element);
}
```

### 3.10 分割线

`.va-separator`：2px 高度，`--va-background-element` 背景色，上下 1rem 间距

---

## 4. 布局体系

### 4.1 侧边栏（Sidebar）

| 属性 | 值 |
|------|----|
| 宽度 | 240px（桌面端） |
| 背景色 | `--va-background-primary` |
| 右边框 | `var(--va-block-border)` |
| 头部高度 | 64px（品牌标识区域） |
| 菜单项激活指示 | 左侧 3px 竖条 + `--va-primary-alpha` 背景 |
| 菜单项间距 | 2px |
| 菜单项圆角 | `var(--va-square-border-radius)` (4px) |

底部用户信息区：
- 上边框分隔 `border-top: var(--va-block-border)`
- 头像：2.25rem 圆形，`linear-gradient(135deg, --va-primary, #00c4ff)` 渐变色背景
- 角色徽章：10px uppercase badge 样式

### 4.2 顶部栏（Topbar）

| 属性 | 值 |
|------|----|
| 高度 | 56px |
| 背景色 | `--va-background-primary`（或毛玻璃 `--va-topbar-background`） |
| 下边框 | `var(--va-block-border)` |
| 内边距 | 水平 1.5rem |

### 4.3 主内容区

| 属性 | 值 |
|------|----|
| 内边距 | 1.5rem |
| 背景色 | `--va-background-secondary` |
| 溢出 | auto（纵向滚动） |
| 过渡 | `var(--va-transition)` |

### 4.4 卡片（Card）

| 属性 | 值 |
|------|----|
| 背景色 | `--va-background-primary` |
| 边框 | `var(--va-block-border)` |
| 圆角 | `var(--va-block-border-radius)` (0.375rem) |
| 阴影 | `var(--va-block-box-shadow)` |
| 内边距 | 1.5rem |
| 悬浮态 | `box-shadow: var(--va-box-shadow)` |

---

## 5. 组件规范

### 5.1 按钮（Button）

基础属性：

| 属性 | 值 |
|------|----|
| 字号 | 0.875rem (14px) |
| 字重 | 600 (semi-bold) |
| 圆角 | `var(--va-square-border-radius)` (0.25rem) |
| 内边距 | 0.5rem 1.25rem |
| 过渡 | `var(--va-swing-transition)` (0.3s swing) |
| 边框 | `var(--va-control-border)` (0) |
| 盒阴影 | `var(--va-control-box-shadow)` (none) |

按钮变体：

| 变体 | 背景色 | 文字色 | 悬浮态 |
|------|--------|-------|--------|
| `.btn-primary` | `--va-primary` | `--va-on-primary` | `--va-primary-darken` |
| `.btn-secondary` | 透明 | `--va-on-background-primary` | 1px border + `--va-background-secondary` |
| `.btn-text` | 透明 | `--va-on-background-secondary` | color → `--va-danger` |
| `.btn-danger` | `--va-danger` | `#FFFFFF` | opacity 0.9 |

### 5.2 输入框（Input）

| 属性 | 值 |
|------|----|
| 内边距 | 0.625rem 0.875rem |
| 背景色 | `--va-background-primary` |
| 边框 | `--va-form-element-border-width` (1px) solid `--va-background-border` |
| 圆角 | `var(--va-form-element-border-radius)` (0.25rem) |
| Focus 状态 | 边框→`--va-primary` + `box-shadow: 0 0 0 2px var(--va-primary-alpha)` |
| Focus-visible 状态 | `--va-outline-border-width` solid `--va-focus`，outline-offset 1px |
| 占位符颜色 | `--va-on-background-element` |
| 过渡 | `var(--va-transition)` |
| 盒阴影 | `var(--va-control-box-shadow)` (none) |

### 5.3 标签（Label）

| 属性 | 值 |
|------|----|
| 字号 | 0.8125rem (13px) |
| 字重 | 600 (semi-bold) |
| 颜色 | `--va-on-background-secondary` |
| 底部间距 | 0.375rem |
| 字母间距 | `var(--va-letter-spacing)` |

### 5.4 徽章（Badge）

| 属性 | 值 |
|------|----|
| 字号 | 0.625rem (10px) |
| 内边距 | 0 0.25rem |
| 圆角 | 0.6rem |
| 字重 | 700 (bold) |
| Letter-spacing | 0.0375rem |

徽章颜色变体：

| 变体 | 背景色 | 文字色 |
|------|--------|-------|
| `.badge--primary` | `--va-primary-alpha` | `--va-primary` |
| `.badge--success` | `rgba(16,185,129,0.12)` | `--va-success` |
| `.badge--warning` | `rgba(245,158,11,0.12)` | `--va-warning` |
| `.badge--danger` | `rgba(239,68,68,0.12)` | `--va-danger` |
| `.badge--info` | `rgba(59,130,246,0.12)` | `--va-info` |
| `.badge--orange` | `rgba(249,115,22,0.12)` | `#F97316` |

### 5.5 提示信息块（Alert）

| 属性 | 值 |
|------|----|
| 内边距 | 0.75rem 1rem |
| 圆角 | `var(--va-block-border-radius)` (0.375rem) |
| 字号 | 0.8125rem (13px) |
| 行高 | 1.5 |

| 变体 | 背景色 | 文字色 | 边框 |
|------|--------|-------|------|
| `.alert--info` | `rgba(59,130,246,0.1)` | `--va-info` | `rgba(59,130,246,0.2)` |
| `.alert--success` | `rgba(16,185,129,0.1)` | `--va-success` | `rgba(16,185,129,0.2)` |
| `.alert--warning` | `rgba(245,158,11,0.1)` | `--va-warning` | `rgba(245,158,11,0.2)` |
| `.alert--danger` | `rgba(239,68,68,0.1)` | `--va-danger` | `rgba(239,68,68,0.2)` |

### 5.6 骨架屏（Skeleton）

| 属性 | 值 |
|------|----|
| 动画 | `skeleton-loading`（1.5s ease-in-out infinite） |
| 渐变 | `--va-background-element` → `--va-background-secondary` → `--va-background-element` |
| 背景尺寸 | 200% 100% |
| 圆角 | `var(--va-square-border-radius)` |

### 5.7 空状态（Empty State）

| 属性 | 值 |
|------|----|
| 内边距 | 3rem 1.5rem |
| 文字色 | `--va-muted` |
| 图标字号 | 3rem（opacity: 0.5） |
| 文本字号 | 0.875rem |
| 排列 | flex column + center |

---

## 6. 间距体系（Spacing）

| 令牌 | 值 | 场景 |
|------|---|------|
| `--va-gap-small` | 0.25rem (4px) | 极小间距，如按钮与图标间隙 |
| `--va-gap-medium` | 0.375rem (6px) | 常规间距，如按钮组间距 |
| `--va-gap-large` | 0.75rem (12px) | 较大间距，如 flex 项目间距 |

通用间距工具类：

| 类名 | 值 |
|------|----|
| `.gap-xs` | `var(--va-gap-small)` |
| `.gap-sm` | `var(--va-gap-medium)` |
| `.gap-md` | `var(--va-gap-large)` |
| `.gap-lg` | 1rem (16px) |
| `.gap-xl` | 1.5rem (24px) |
| `.p-4` | 1rem (16px) |
| `.p-6` | 1.5rem (24px) |
| `.p-8` | 2rem (32px) |

---

## 7. 过渡动画

| 令牌 | 值 | 适用场景 |
|------|---|---------|
| `--va-transition` | `0.2s cubic-bezier(0.4, 0, 0.6, 1)` | 颜色变化、背景切换、边框过渡 |
| `--va-swing-transition` | `0.3s cubic-bezier(0.25, 0.8, 0.5, 1)` | 悬浮缩放动画、位移过渡 |

Vue 过渡类：

- **fade**: 简单透明度过渡（opacity 0→1）
- **slide-fade**: 位移 + 透明度过渡（translateY 10px + opacity 0）

---

## 8. 滚动条样式

针对 Webkit 内核浏览器：

| 部分 | 样式 |
|------|------|
| 宽度 | 6px |
| 轨道 | `--va-background-secondary` |
| 滑块 | `--va-background-element`，圆角 3px |
| 滑块悬浮 | `--va-background-border` |

---

## 9. 主题切换

通过 `data-theme` 属性切换主题：

```html
<!-- 亮色主题（默认） -->
<html data-theme="light">

<!-- 暗色主题 -->
<html data-theme="dark">
```

所有组件样式必须基于 `--va-*` CSS 变量，**禁止硬编码颜色值**。

---

## 10. 暗色主题适配指南

1. **颜色**：使用 CSS 变量替代硬编码值，确保双主题自动适配。
2. **阴影**：暗色主题下阴影透明度增加（从 0.08 → 0.3）。
3. **毛玻璃**：暗色主题的毛玻璃背景使用深色 rgba 值。
4. **悬停态**：暗色主题的悬停背景使用白色半透明（0.06）。
5. **图像**：必要时提供深色版本的图标/图片资源。
6. **轮廓焦点**：暗色主题下 `--va-focus` 保持不变（`#49A8FF`），确保可访问性。
7. **按钮亮度降级（重要）**：
   * **问题**：暗色主题下，亮色 `--va-primary`（`#4D94FF`）在深色背景上过于刺眼、饱和度高。
   * **解决方案**：暗色主题下所有主要按钮（`btn-primary` / `el-button--primary`）的背景色使用 `--va-primary-darken`（`#285AA8`），这是一个降饱和度、降亮度的深蓝版本，与暗色背景和谐共存。
   * **实现方式**：
     ```css
     /* 自定义按钮 */
     [data-theme="dark"] .btn-primary {
       background-color: var(--va-primary-darken); /* #285AA8 */
     }
     
     /* Element Plus 按钮覆写 */
     [data-theme="dark"] {
       --el-color-primary: var(--va-primary-darken); /* #285AA8 */
     }
     ```
   * **hover 态**：暗色下 primary 按钮 hover 加深为 `--el-color-primary-dark-2`（`#1F4680`）。
   * **链接/徽章/图标**：仍然使用 `--va-primary`（`#4D94FF`）保持识别度，仅大面积蓝色背景（按钮、块状元素）使用降级色。

---

## 11. 通用工具类

### Flexbox 布局

| 类名 | 属性 |
|------|------|
| `.flex` | `display: flex` |
| `.flex-col` | `flex-direction: column` |
| `.flex-wrap` | `flex-wrap: wrap` |
| `.items-center` | `align-items: center` |
| `.items-start` | `align-items: flex-start` |
| `.items-end` | `align-items: flex-end` |
| `.justify-center` | `justify-content: center` |
| `.justify-between` | `justify-content: space-between` |
| `.justify-end` | `justify-content: flex-end` |
| `.flex-1` | `flex: 1` |

### 文字与颜色

| 类名 | 属性 |
|------|------|
| `.text-sm` / `.text-base` / `.text-lg` / `.text-xl` / `.text-2xl` | 字号 0.875rem ~ 1.5rem |
| `.font-normal` / `.font-semibold` / `.font-bold` | 字重 400 / 600 / 700 |
| `.text-muted` | 弱化文字色 `--va-muted` |
| `.text-primary` / `.text-success` / `.text-warning` / `.text-danger` / `.text-info` | 语义色 |

---

## 12. 代码注释与命名约定

### 12.1 CSS 类名命名

采用 BEM-like 风格：

```css
.block__element--modifier   /* 双下划线表示子元素，双减号表示修饰符 */
.block-element__sub-element /* 单词间用单连字符分隔 */
```

### 12.2 CSS 变量命名

`--va-{category}-{property}` 格式：

```
--va-primary                    /* 颜色类别 */
--va-background-primary         /* 背景类别 */
--va-on-background-primary      /* 上层元素 */
--va-block-border-radius        /* 复合属性 */
```

### 12.3 样式注释格式

```css
/* ============================================================
 * 区块标题
 * 简短描述该区块的功能
 * ============================================================ */

/* ---- 子区块标题 ---- */
```

---

## 13. 组件开发 Checklist

- [ ] 使用 `--va-*` CSS 变量，无硬编码颜色
- [ ] 同时测试亮色/暗色主题效果
- [ ] 添加必要的过渡动画
- [ ] 适配 375px+ 屏幕宽度
- [ ] 遵循 BEM-like 命名规范
- [ ] 保持与设计令牌体系的一致性
- [ ] 按钮等控件使用 `.btn`、`.input`、`.badge` 等预定义工具类
- [ ] `:focus-visible` 使用 `--va-focus` 定义可见焦点
- [ ] 空数据和加载状态使用 `.empty-state` / `.skeleton`
- [ ] 滚动条使用 `--va-*` 变量保持一致的主题
