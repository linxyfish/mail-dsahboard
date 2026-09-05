# MXRoute 邮箱管理系统

基于 **Vite + React + TypeScript + tRPC** 的邮箱管理系统，用于统一管理 [MXRoute](https://mxroute.com/) 账户下的全部邮箱账号及邮件，并通过 **Telegram Bot** 实时接收邮件通知，通知模板可自定义。

## 功能特性

- ✅ **统一访问当前 API 下的所有邮箱账号**：列出、创建、删除邮箱账号，查看可用域名与邮箱配额。
- ✅ **读取任意邮箱中的邮件**：查看邮件列表、正文、附件、发件人等，支持 IMAP 拉取。
- ✅ **Telegram 邮件通知**：新邮件到达时自动推送到你的 Telegram 账号/群组。
- ✅ **自定义通知模板**：基于模板引擎（如 Handlebars / EJS）自由编写通知内容与格式，支持按天/按字数/静默时段等规则。
- ✅ **端到端类型安全**：Vite 前端与 Node 后端通过 tRPC 共享类型，前后端接口零手写契约。
- ✅ **现代化 UI**：React + Tailwind CSS + shadcn/ui，桌面/移动端自适应。

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite（`@vitejs/plugin-react`） |
| 样式 | Tailwind CSS + shadcn/ui |
| 本地开发 | tRPC v10 async + `@trpc/client` |
| API 层 | tRPC + `@trpc/server` + zod 运行时校验 |
| 后端服务 | Node.js + Express（httpAdapter）+ tsx/ts-node |
| 数据库 | SQLite（Prisma / better-sqlite3），可选 PostgreSQL |
| 邮件服务 | IMAP 客户端（`imapflow`）+ Nodemailer |
| 消息推送 | Telegram Bot API（`node-telegram-bot-api` 或 axios） |
| 模板引擎 | Handlebars（`handlebars`） |
| 任务调度 | `node-cron` |

---

## 项目结构

```
mail-tg/
├── apps/
│   ├── web/                     # Vite + React 前端
│   │   ├── src/
│   │   │   ├── components/      # UI 组件
│   │   │   ├── pages/           # 页面（邮箱列表 / 邮件查看 / 通知设置）
│   │   │   ├── trpc.ts          # tRPC 客户端封装
│   │   │   └── main.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── server/                  # Node + tRPC 后端
│       ├── src/
│       │   ├── routers/         # 业务路由（mailbox / mail / notification）
│       │   ├── services/        # MXRoute / IMAP / Telegram 服务
│       │   ├── templates/       # 通知模板（.hbs）
│       │   ├── trpc.ts          # tRPC 初始化
│       │   └── index.ts         # 服务入口
│       └── package.json
├── packages/
│   └── shared/                  # 前后端共享类型与常量
│       └── src/
│           ├── schemas.ts       # zod schema（共享类型来源）
│           └── types.ts
├── .env.example                 # 环境变量模板
├── pnpm-workspace.yaml
└── README.md
```

> 采用 pnpm monorepo 管理，`apps/web`（前端）与 `apps/server`（后端）共享 `packages/shared` 中的 zod schema，tRPC 据此自动推导前后端类型。

---

## 快速开始

### 1. 环境要求

- Node.js ≥ 20（推荐 22 LTS）
- pnpm ≥ 9（`npm i -g pnpm`）
- 一个 MXRoute 账户（含 cPanel / API token）
- 一个 Telegram Bot Token（通过 [@BotFather](https://t.me/BotFather) 创建）

### 2. 克隆并安装依赖

```bash
git clone <your-repo-url> mail-tg
cd mail-tg
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
# ---------- 通用 ----------
NODE_ENV=development
PORT=3000                       # tRPC 后端端口
WEB_ORIGIN=http://localhost:5173

# ---------- MXRoute / 邮件服务器（IMAP）----------
# 你可以在 MXRoute cPanel 的 API Tokens 或者自动生成的账户中找到这些信息
IMAP_HOST=mail.your-domain.com   # MXRoute 提供的 IMAP 主机
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=master@your-domain.com # 用于连接的主账户
IMAP_PASSWORD=your-imap-password

# ---------- Telegram Bot ----------
TG_BOT_TOKEN=123456:ABC-DEF_YourBotToken
TG_CHAT_ID=123456789            # 接收通知的 Telegram 聊天/群组 ID
# 可选：推送失败时投递到该邮箱
ALERT_EMAIL=admin@your-domain.com

# ---------- 自定义通知模板 ----------
TEMPLATE_DIR=./apps/server/src/templates
TEMPLATE_DEFAULT=mail-default.hbs

# ---------- 数据库（可选，默认 SQLite）----------
DATABASE_URL=file:./data/maillog.db
```

> ⚠️ **关于 MXRoute 凭据**：MXRoute 默认不开放 Razor/API token。绝大多数情况下，你可以使用任一邮箱账号的 **IMAP/SMTP 凭据（主机、用户名、密码）** 直接连接读取邮件，无需额外开通 API。请在 MXRoute 后台“Mailbox”或欢迎邮件中查看 `mail.example.com` 主机与端口。

### 4. 启动开发环境

```bash
# 启动 tRPC 后端（http://localhost:3000）
pnpm --filter @mail/server dev

# 启动 Vite 前端（http://localhost:5173，另开一个终端）
pnpm --filter @mail/web dev
```

打开 `http://localhost:5173` 即可访问管理界面。

### 5. 生产构建

```bash
# 构建共享包 + 前端 + 后端
pnpm --filter @mail/web build
pnpm --filter @mail/server build

# 用 PM2 / systemd 管理后端进程
pm2 start apps/server/dist/index.js --name mail-server
```

也可使用 `Dockerfile` 或 `docker-compose.yml` 一键部署（见 [Docker 部署](#docker-部署可选)）。

---

## Web 端邮箱连接流程

无需在 `.env` 手动填写 IMAP 配置。打开 Web 界面的「邮箱账号」并创建邮箱，输入完整邮箱地址和密码后，服务端会根据域名自动推导 `mail.<你的域名>`，使用 993 端口和 SSL 验证 IMAP 连接。连接成功后，凭据保存在服务端数据文件，后续邮件读取和 Telegram 轮询都会按已配置邮箱建立连接。

如果 MXRoute 为你的域名提供了不同的邮件主机，可以在创建邮箱时填写可选的「IMAP 主机」覆盖自动推导结果。

## MXRoute API 对接说明

本系统通过 **IMAP 协议**访问 MXRoute 邮箱，无需依赖私有 REST API，兼容性最好。核心流程：

```text
Vite 前端 --tRPC--> tRPC 后端 --IMAP--> MXRoute IMAP Server
                          |
                          +--Telegram API--> 你的 Telegram 
```

### 获取 MXRoute 链接凭据

1. 登录 [MXRoute Client Area](https://clients.mxroute.com/)。
2. 打开你的 **三合一账户 / mail root**。
3. 获取以下信息（通常在欢迎邮件或 `SOLARMANAGER` / cPanel 邮件客户端设置里）：
   - **IMAP 主机**：形如 `mail.your-domain.com`
   - **IMAP 端口**：`993`（SSL）
   - **账户**：完整邮箱地址，如 `you@your-domain.com`
   - **密码**：对应邮箱密码

   > 你自己账号的“发件/收件”凭据即可连上去读全部邮件；若要管理所有邮箱账号（增删改），可使用一个 **管理员/域主账号**，或使用 MXRoute 后台的 Account API（若你有 Razor token）。

### 支持的业务能力

| 能力 | 实现方式 |
| --- | --- |
| 列出所有邮箱账号 | 通过 IMAP + SMTP 账户元数据 / 配置的账号清单 |
| 读取各邮箱邮件列表 | `imapflow` 分页拉取序列号与信封 |
| 读取邮件正文/附件 | 拉取 FETCH `RFC822` / `BODY[]`，解析 MIME |
| 删除/归档邮件 | IMAP `STORE` 标记 + MOVE |
| 发送邮件 | SMTP（`nodemailer`），给列表加邮件管理字段 |

> 🔐 安全建议：邮箱密码由 Web 界面提交并保存在服务端数据文件中，生产环境请限制数据文件权限并配置 `API_KEY`；敏感接口应通过 HTTPS 访问。

---

## Telegram 邮件通知

系统启动后，后台定时任务按周期轮询 IMAP，发现新邮件后：

1. 判重（`Message-ID` / UID 去重，记录在 SQLite）。
2. 用模板渲染通知文本。
3. 调用 Telegram `sendMessage` 推送到指定 `TG_CHAT_ID`。

该任务由 `apps/server/src/services/notifier.ts` 中的 `node-cron` 调度：

```ts
cron.schedule('*/1 * * * *', async () => {
  const mails = await checkNewMails(); // 轮询新邮件
  for (const m of mails) {
    await pushToTelegram(renderTemplate(m)); // 渲染 + 推送
  }
});
```

### Telegram Bot 配置步骤

1. 在 Telegram 中搜索 **@BotFather** → 发送 `/newbot` → 按提示命名，获得 `BOT_TOKEN`。
2. 若希望推送到私有聊天：把机器人加入会话后再发消息，调用 `getUpdates` 拿到自己的 `chat_id`。
3. 若希望推送到群组：创建群组 → 将机器人拉入群，即可使用群组 `chat_id`（通常以 `-100` 开头）。
4. 在 Web 界面的「通知设置」中填写 `Telegram Bot Token` 和 `Chat ID`，点击「保存设置」，再点击「发送测试」验证。`.env` 中的 Telegram 值仅作为首次启动时的默认值，网页保存后以网页配置为准。

---

## 自定义通知模板

通知模板使用 **Handlebars** 编写，位于 `TEMPLATE_DIR`，启动时与数据库中的自定义模板合并，`TEMPLATE_DEFAULT` 指定默认模板文件。

### 可用变量

渲染邮件通知时，模板上下文包含以下字段：

| 字段 | 说明 |
| --- | --- |
| `{{subject}}` | 邮件主题 |
| `{{from.name}}` / `{{from.address}}` | 发件人名称 / 地址 |
| `{{date}}` | 收件时间（可自定义格式） |
| `{{to}}` | 收件人列表 |
| `{{body.text}}` | 纯文本正文（已截断） |
| `{{body.html}}` | HTML 正文（可选） |
| `{{attachments}}` | 附件数量 / 列表 |
| `{{url}}` | 邮件详情页链接（可选） |

### 默认模板示例 `mail-default.hbs`

```handlebars
🔔 新邮件通知

📌 主题：{{subject}}
👤 发件人：{{from.name}} <{{from.address}}>
🕒 时间：{{date}}
📎 附件：{{attachments.length}} 个

—— 正文预览 ——
{{body.text}}
```

### 在管理界面对模板做自定义

页面「通知设置」提供可视化编辑：

- **编辑模板源码**：直接修改 Handlebars 文本。
- **动态变量**：插入上表字段。
- **规则**：按关键词 / 发件人 / 主题匹配才通知；支持每天第二通静默、按邮件数批量合并。

系统会校验模板编译后再保存，避免语法错误导致推送失败：

```ts
const compiled = Handlebars.compile(templateSource); // 编译失败即抛错
await saveTemplate(compiled);
```

---

## Docker 部署（可选）

仓库提供 `Dockerfile` 与 `docker-compose.yml`。示例：

```yaml
# docker-compose.yml
services:
  mail-server:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data          # 持久化 SQLite 与日志
      - ./apps/server/src/templates:/app/apps/server/src/templates
    restart: unless-stopped
```

```bash
docker compose up -d --build
```

如需正式域名 + HTTPS，可在反向代理层（如 Nginx / Caddy）加上 TLS，并设置 `WEB_ORIGIN` 为你的域名。

---

## 常用命令速查

```bash
# 安装
pnpm install

# 开发（前端 + 后端分开两个终端）
pnpm --filter @mail/server dev
pnpm --filter @mail/web dev

# 类型检查
pnpm -r typecheck

# 构建
pnpm -r build

# 生产启动
node apps/server/dist/index.js

# 测试 Telegram 推送是否工作
curl -X POST http://localhost:3000/trpc/notification.test \
  -H "Content-Type: application/json" \
  -d '{"json":{"text":"Hello from MXRoute Mail System!"}}'
```

---

## 目录速览（关键文件）

| 文件 | 作用 |
| --- | --- |
| `apps/server/src/routers/mailbox.ts` | 邮箱账号管理路由（列表 / 增删） |
| `apps/server/src/routers/mail.ts` | 邮件读取路由（列表 / 详情 / 附件） |
| `apps/server/src/routers/notification.ts` | 通知配置与 Telegram 相关路由 |
| `apps/server/src/services/mxroute.ts` | IMAP/SMTP 连接封装 |
| `apps/server/src/services/notifier.ts` | 新邮件轮询 + 推送调度 |
| `apps/server/src/services/template.ts` | 模板渲染与校验 |
| `apps/web/src/trpc.ts` | tRPC 客户端（浏览器侧） |
| `packages/shared/src/schemas.ts` | 前后端共享的 zod schema |

---

## 常见问题（FAQ）

**Q1：tRPC 前端访问报跨域（CORS）？**
A：确保后端 `CORS` 允许的 `origin` 包含前端地址。生产环境把 `WEB_ORIGIN` 设为实际域名。

**Q2：为什么有些邮件读不出来？**
A：确认 IMAP 主机、端口、账户、密码正确；部分邮箱开启了两步验证或 IMAP 权限限制，请在 MXRoute / cPanel 中确认开启 IMAP。

**Q3：Telegram 收不到通知？**
A：依次排查：① `.env` 的 `TG_BOT_TOKEN` / `TG_CHAT_ID` 是否正确；② 机器人是否已加入目标会话/群组；③ 用 `notification.test` 接口手动测一发；④ 查看后端日志确认轮询是否有新邮件。

**Q4：如何修改通知模板？**
A：可直接编辑 `apps/server/src/templates/*.hbs`，或在 Web 界面的「通知设置」里在线编辑并保存到数据库。

**Q5：我有 MXRoute 的私有 API token，能用吗？**
A：本系统默认走 IMAP 以实现最大兼容；如需接入私有 API，可在 `apps/server/src/services/mxroute.ts` 增加一个基于 token 的 Provider，并在路由层做抽象切换。

---

## License

MIT