# 漫剧资产管理工具（原型）

一个面向漫剧/游戏美术流程的轻量资产管理前端原型（React + TypeScript + Tailwind）。

## 当前功能（已按最新需求简化）

- 左侧分类导航：职业、怪物、武器、装备/道具、技能特效
- 最小化录入：创建资产只需
  - 名称（必填）
  - 标签（可选）
  - 图片（必填）
- UID 自动生成（无需手填），版本号已移除
- 自动生成缩略图，用于卡片快速预览
- 搜索与标签筛选
- 资产编辑、删除
- 点击详情大图可尝试打开图片所在文件夹（受浏览器安全限制）

## 启动

```bash
npm install
npm run dev
```

打开：`http://localhost:5173`

## 使用说明

1. 左侧先选择分类。
2. 右侧表单中输入名称、标签并上传图片，然后保存。
3. 保存后会自动生成 UID 和缩略图，列表卡片优先展示缩略图。
4. 点击卡片查看详情；点击大图右下角「打开所在文件夹」会尝试跳转本地目录。

## 关于“打开所在文件夹”

- 标准浏览器通常无法直接读取本地绝对路径，因此该能力是 **best effort**：
  - 若运行环境能提供本地路径（如部分桌面壳场景），会尝试打开 `file://` 目录。
  - 若拿不到路径，会提示受浏览器限制。

## 更新本地已下载代码（Git）

如果你已经 `git clone` 过仓库，后续更新推荐这样做：

```bash
# 1) 进入项目目录
cd 你的项目目录

# 2) 查看当前分支
git branch --show-current

# 3) 拉取远端最新信息
git fetch origin

# 4) 更新当前分支（假设你在 main）
git pull origin main
```

如果你是在自己的功能分支上开发，先保存本地改动再更新：

```bash
# 方案A：先提交
git add .
git commit -m "wip: save local changes"
git pull --rebase origin main

# 方案B：临时收起改动
git stash
git pull --rebase origin main
git stash pop
```

### 常见情况

- `Already up to date.`：说明你本地已经是最新。
- `CONFLICT`：有冲突，按提示编辑冲突文件后再 `git add` 并继续。
- 不确定远端默认分支名时，可先看：

```bash
git remote show origin
```

## 在项目目录里直接输入 `cmd` 可以吗？

可以，完全没问题，这是 Windows 下最常见操作：

1. 打开你的项目文件夹。
2. 在资源管理器地址栏输入 `cmd` 回车。
3. 会在当前目录直接打开命令行。
4. 直接执行：

```bash
git fetch origin
git pull origin main
```

如果你的默认分支不是 `main`（例如 `master`），把命令里的 `main` 换成实际分支名即可。
