# 北京交通大学生存手册

一份面向北京交通大学新生与在校生的非官方生存指南，整理校园生活、课程学习、信息获取、科研竞赛、升学就业与长期规划中的常见问题。

[在线阅读](https://aboutguyuan.github.io/BJTU-book/) · [提交问题](https://github.com/aboutguyuan/BJTU-book/issues) · [参与完善](https://github.com/aboutguyuan/BJTU-book/pulls)

> 本项目不是学校官方文件。涉及学籍、选课、成绩、毕业、推免、就业手续和校区安排等事项，请以学校、学院及辅导员的正式通知为准。

## 项目特点

- 按主题拆分的 Markdown 手册，便于逐章维护和审阅。
- 原生 HTML、CSS 和 JavaScript 静态阅读站，无前端框架依赖。
- 支持章节导航、页内目录、全文关键词搜索和章节链接复制。
- 适配桌面端与移动端，可部署到 GitHub Pages 或静态对象存储。
- 内容尽量区分事实、经验和建议，并避免公开可识别的个人信息。

## 内容范围

- 入学适应、信息核验、宿舍生活、课程、绩点、专业选择与校园关系。
- 科研、竞赛、项目、升学、就业、实习、读研与长期能力建设。
- 常见问题、突发场景、路线速查、校园事务和按学期执行的行动工具。
- 信息来源、复盘、自查、沟通模板和风险清单等附录资料。

## 快速开始

建议使用 Node.js 22（与 GitHub Actions 环境一致）。

```bash
git clone https://github.com/aboutguyuan/BJTU-book.git
cd BJTU-book
npm ci
npm run build
npm run preview
```

浏览器访问 <http://127.0.0.1:4173>。如需更换端口：

```bash
PORT=4174 npm run preview
```

预览服务器不提供热更新。修改内容后，需要重新运行 `npm run build` 并刷新页面。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 重新生成根目录 `data.js` 和 `dist/` 静态站 |
| `npm run preview` | 在本地预览 `dist/`，默认端口为 `4173` |
| `npm run dev` | 当前与预览模式相同，不包含热更新 |
| `npm run chapters` | 从完整稿重新拆分全部章节，会覆盖 `content/chapters/` |
| `npm run kodo:config` | 生成七牛云 Kodo 上传配置 |
| `npm run kodo:deploy` | 构建并通过 `qshell` 上传到 Kodo |

## 内容维护

日常正文的推荐编辑入口是 `content/chapters/*.md`。构建脚本按文件名排序读取章节；只有该目录不存在或没有 Markdown 文件时，才回退读取完整稿。

章节文件使用以下标题层级：

```markdown
## 第一章 章节标题

### 1.1 小节标题
```

当前构建器只会把 `###` 识别为页内目录中的小节标题，不要使用 `####` 代替小节标题。

推荐的内容更新流程：

```bash
# 1. 修改 content/chapters/ 中的 Markdown
# 2. 重新构建并预览
npm run build
npm run preview

# 3. 检查后提交正文和生成的数据
git status
git add content/chapters data.js
git commit -m "更新手册内容"
git push origin main
```

注意：

- `data.js` 由构建脚本生成，不要手动编辑；正文变化后应与章节一起提交。
- `dist/` 每次构建都会重建，已被 Git 忽略，不要手动维护或提交。
- `npm run chapters` 会删除并重建整个 `content/chapters/`。只有完整稿已经同步全部最新修改时才可运行。
- 写入真实经历时请做匿名化处理，不公开姓名、学号、联系方式、精确宿舍或其他可识别信息。

## 项目结构

```text
BJTU-book/
├── content/chapters/        # 日常维护的分章 Markdown
├── 北京交通大学生存指南/北京交通大学生存手册_重构完整稿.md
│                            # 旧单文件完整稿，仅作为构建回退
├── tools/                   # 拆章、构建、预览和部署脚本
├── .github/workflows/       # GitHub Pages 自动发布流程
├── index.html               # 阅读站页面结构
├── style.css                # 页面样式
├── app.js                   # 导航、搜索和交互逻辑
└── data.js                  # 构建生成的手册数据
```

## 部署

### GitHub Pages

推送到 `main` 后，[GitHub Actions](https://github.com/aboutguyuan/BJTU-book/actions) 会使用 Node.js 22 执行 `npm ci` 和 `npm run build`，再将 `dist/` 发布到 `gh-pages` 分支。

线上地址：<https://aboutguyuan.github.io/BJTU-book/>

### 七牛云 Kodo（可选）

本机需要先安装并登录 `qshell`，然后运行：

```bash
QINIU_BUCKET=<空间名> npm run kodo:deploy
```

如需上传到指定前缀：

```bash
QINIU_BUCKET=<空间名> QINIU_KEY_PREFIX=bjtu-book/ npm run kodo:deploy
```

请勿将 AccessKey、SecretKey、`.env` 或 `.qiniu/` 提交到仓库。

## 参与完善

欢迎通过 Issue 或 Pull Request 提交勘误、补充信息和改进建议。涉及政策、流程或时间节点时，请附上官方出处和核对日期；涉及个人经历时，请先匿名化并确认获得必要授权。
