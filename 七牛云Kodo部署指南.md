# 七牛云 Kodo 部署指南

这份项目是纯静态站，七牛云 Kodo 只需要上传 `dist/` 目录里的文件。项目已经内置了构建和上传配置生成脚本，日常流程是：

```bash
npm run build
QINIU_BUCKET=<你的空间名> npm run kodo:config
qshell qupload -c 5 .qiniu/qupload.json
```

也可以合成一步：

```bash
QINIU_BUCKET=<你的空间名> npm run kodo:deploy
```

## 1. 七牛云控制台准备

1. 登录七牛云控制台。
2. 进入对象存储 Kodo，新建一个公开空间，存储区域建议选离主要访问用户近的区域。
3. 进入空间设置，开启静态页面，默认首页填写 `index.html`。
4. 绑定一个 CDN 加速域名，按七牛云提示把域名 CNAME 到七牛分配的地址。
5. 如果面向中国大陆稳定访问，域名通常需要完成 ICP 备案，否则国内 CDN 域名绑定和访问可能受限。

如果只是临时测试，可以先用七牛分配的测试域名或空间域名验证页面，但正式发布建议使用自己的备案域名。

## 2. 安装 qshell

七牛官方推荐用 Qshell 命令行工具管理 Kodo 上传。安装后确认：

```bash
qshell -v
```

然后把七牛账号密钥保存到本机 Qshell 配置：

```bash
qshell account <AccessKey> <SecretKey> aboutguyuan
```

`AccessKey` 和 `SecretKey` 在七牛云控制台的密钥管理中查看。不要把它们写进仓库、Markdown、截图或公开聊天。

## 3. 本项目的部署命令

首次部署：

```bash
npm run build
QINIU_BUCKET=<你的空间名> npm run kodo:config
qshell qupload -c 5 .qiniu/qupload.json
```

以后改完文章或样式后部署：

```bash
QINIU_BUCKET=<你的空间名> npm run kodo:deploy
```

如果你的站点不是部署在域名根路径，而是部署到某个前缀目录，可以加 `QINIU_KEY_PREFIX`：

```bash
QINIU_BUCKET=<你的空间名> QINIU_KEY_PREFIX=bjtu-book/ npm run kodo:deploy
```

一般绑定独立域名时不要设置 `QINIU_KEY_PREFIX`，直接部署到空间根目录。

## 4. 项目里新增的文件

- `tools/kodo-config.mjs`：读取 `dist/` 和 `QINIU_BUCKET`，生成 `.qiniu/qupload.json`。
- `.qiniu/qupload.json`：本地生成的 Qshell 上传配置，不提交到 Git。
- `.qiniu/qupload.log`：本地上传日志，不提交到 Git。
- `package.json`：
  - `npm run kodo:config`：生成七牛上传配置。
  - `npm run kodo:deploy`：构建项目并上传到 Kodo。

## 5. 验证清单

上传完成后检查：

1. 打开七牛绑定域名，首页能加载。
2. 刷新页面后不 404。
3. `index.html`、`style.css`、`app.js`、`data.js` 都能正常访问。
4. 左侧目录、搜索、章节跳转、作者 GitHub 链接都能正常使用。
5. 手机浏览器访问时布局正常。

## 6. 常见问题

### 页面打开是文件列表或 404

确认空间的静态页面设置里，默认首页是 `index.html`。

### 页面没有样式

检查 `style.css` 是否已经上传到空间根目录，并且浏览器访问 `https://你的域名/style.css` 能返回 CSS 内容。

### 内容还是旧的

可能是 CDN 缓存。可以在七牛 CDN 控制台刷新以下 URL：

- `https://你的域名/index.html`
- `https://你的域名/style.css`
- `https://你的域名/app.js`
- `https://你的域名/data.js`

如果改动很多，刷新整个目录。

### 上传提示未鉴权

先执行：

```bash
qshell user ls
qshell user cu aboutguyuan
```

如果没有账号，重新执行：

```bash
qshell account <AccessKey> <SecretKey> aboutguyuan
```

### 公开访问受限

确认 Kodo 空间是公开空间，并确认绑定的 CDN 域名状态正常。正式面向大陆用户访问时，建议使用已备案域名。

## 7. 官方参考

- 七牛 Kodo 文档入口：<https://developer.qiniu.com/kodo>
- Qshell 官方文档：<https://developer.qiniu.com/kodo/1302/qshell>
- Qshell 上传配置说明：<https://github.com/qiniu/qshell/blob/master/docs/qupload.md>
