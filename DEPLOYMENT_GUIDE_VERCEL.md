# Hướng Dẫn Triển Khai Hoàn Chỉnh Lên Vercel & PostgreSQL Cloud (Production Deployment Guide)

> **Dự án:** Knowledge App (Personal Knowledge Management - PKM)  
> **Kiến trúc:** Monorepo (React 18 SPA + Node.js Express API + PostgreSQL Prisma ORM)  
> **Tài liệu tham khảo:** [AGENTS.md](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/AGENTS.md), [schema.prisma](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/prisma/schema.prisma)

---

## Mục Lục

1. [Phần 1: Phân Tích Kiến Trúc Hiện Tại Của Dự Án](#phần-1-phân-tích-kiến-trúc-hiện-tại-của-dự-án)
2. [Phần 2: Kiến Trúc Triển Khai Production (Production Architecture)](#phần-2-kiến-trúc-triển-khai-production-production-architecture)
3. [Phần 3: Thiết Lập PostgreSQL Production (Neon Managed Cloud)](#phần-3-thiết-lập-postgresql-production-neon-managed-cloud)
4. [Phần 4: Triển Khai Backend API](#phần-4-triển-khai-backend-api)
   - [Phương án A (Chính): Vercel Serverless Function](#phương-án-a-đề-xuất-chính-express-trên-vercel-serverless-function)
   - [Phương án B (Dự phòng): Render / Railway Web Service](#phương-án-b-phương-án-thay-thế-render--railway-container)
5. [Phần 5: Triển Khai Frontend Trên Vercel](#phần-5-triển-khai-frontend-trên-vercel)
6. [Phần 6: Quản Lý Biến Môi Trường (Environment Variables)](#phần-6-quản-lý-biến-môi-trường-environment-variables)
7. [Phần 7: Cấu Hình Monorepo & Vercel Project](#phần-7-cấu-hình-monorepo--vercel-project)
8. [Phần 8: Quy Trình Database Migration (Dev vs Prod)](#phần-8-quy-trình-database-migration-dev-vs-prod)
9. [Phần 9: Checklist & Ma Trận Kiểm Thử Production](#phần-9-checklist--ma-trận-kiểm-thử-production)
10. [Phần 10: Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#phần-10-xử-lý-sự-cố-thường-gặp-troubleshooting)
11. [Phần 11: Quy Trình CI/CD & Triển Khai Tương Lai](#phần-11-quy-trình-cicd--triển-khai-tương-lai)

---

## Phần 1: Phân Tích Kiến Trúc Hiện Tại Của Dự Án

Dựa trên việc kiểm tra trực tiếp mã nguồn trong repository, hệ thống đang hoạt động dưới dạng **Monorepo (npm workspaces)** với các đặc tính kỹ thuật sau:

### 1.1 Cấu Trúc Monorepo & Workspaces

```
PersonalKnowledgeManagement/
├── frontend/                  # React 18 + Vite (SPA)
│   ├── package.json           # name: "knowledge-app-frontend", type: "module"
│   ├── vite.config.js         # Build outDir: "dist", port: 5173, alias @/*
│   └── src/                   # Source code client
├── backend/                   # Node.js + Express + Prisma ORM
│   ├── package.json           # name: "knowledge-app-backend", type: "module"
│   ├── prisma/
│   │   ├── schema.prisma      # Provider: postgresql, url & directUrl
│   │   └── migrations/        # Lịch sử Prisma migration
│   └── src/
│       ├── app.js             # Factory createApp() cấu hình middleware + routes
│       ├── server.js          # Entrypoint HTTP listener (app.listen)
│       └── config/database.js # PrismaClient instance singleton
├── docs/                      # Tài liệu thiết kế & kỹ thuật
├── package.json               # Root monorepo quản lý workspaces ["frontend", "backend"]
└── AGENTS.md                  # Quy tắc bất biến của dự án
```

### 1.2 Bảng Đặc Tính Kỹ Thuật Hiện Tại

| Thành phần | Đặc tính kỹ thuật thực tế | Chi tiết trong mã nguồn |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.2.0 + Vite 5.4 | JavaScript ES6+ (Không sử dụng TypeScript) |
| **Frontend Build Command** | `npm run build --workspace=frontend` (hoặc `vite build`) | Tạo thư mục tĩnh `frontend/dist/` |
| **Frontend Output Dir** | `frontend/dist` | File `dist/index.html` và assets `.js`, `.css` |
| **Frontend Routing** | React Router DOM v6 | Single Page App (cần URL Rewrite trên CDN) |
| **Frontend API Client** | Axios Instance (`src/services/apiClient.js`) | Phụ thuộc biến môi trường `VITE_API_BASE_URL` |
| **Backend Runtime** | Node.js >= 18.0.0 (ES Modules - `type: "module"`) | Chạy Express.js 4.18.2 |
| **Backend Entry Point** | `backend/src/server.js` | Gọi `app.listen(env.port)` (Long-running process) |
| **Backend App Factory** | `backend/src/app.js` | Hàm `createApp()` trả về Express instance thuần túy |
| **Database ORM** | Prisma Client 5.22.0 | Kết nối qua `DATABASE_URL` và `DIRECT_URL` |
| **Database Engines** | PostgreSQL 18.6 (Local) / Neon (Cloud) | Sử dụng extension JSONB, UUID, Cascade Delete |

### 1.3 Những Điểm Cần Chú Ý Khi Triển Khai Lên Vercel Serverless

1. **Khác biệt vòng đời Process (Long-running vs Serverless Function):**
   - File `backend/src/server.js` gọi `app.listen()`. Trên Vercel Serverless (AWS Lambda), không có tiến trình chạy nền liên tục. Nếu gọi `app.listen()`, hàm sẽ bị treo hoặc kết thúc đột ngột sau thời gian timeout (thường là 10–15s).
   - *Giải pháp:* Tận dụng hàm `createApp()` từ `backend/src/app.js` để xuất trực tiếp Express app qua một file serverless handler (ví dụ: `api/index.js`).
2. **Quản lý kết nối Prisma Client trong Serverless:**
   - Mỗi lần Serverless Function "lạnh" (cold start) hoặc mở rộng (scale out) nhiều container đồng thời, một kết nối mới sẽ mở tới PostgreSQL. Nếu không có Connection Pooler (PgBouncer), database sẽ bị cạn kiệt kết nối (`P1001` / Connection limit exceeded).
   - *Giải pháp:* Bắt buộc sử dụng dịch vụ PostgreSQL có **Connection Pooling** (như Neon Pooled URL) cho `DATABASE_URL`, và cache `PrismaClient` trên đối tượng toàn cục `globalThis`.
3. **Prisma Engine Binary trên Vercel:**
   - Vercel chạy môi trường Linux Amazon Linux 2 / RHEL. Nếu build trên máy Windows local, Prisma binary là `windows`.
   - *Giải pháp:* Trong `backend/prisma/schema.prisma`, cấu hình `binaryTargets = ["native", "rhel-openssl-3.0.x"]`.
4. **Cấu hình Client-Side Routing (SPA) trên CDN:**
   - Khi người dùng truy cập trực tiếp link con như `https://knowledge-app.vercel.app/notes/abc-123` hoặc bấm `F5`, Vercel CDN mặc định sẽ tìm file tĩnh `notes/abc-123.html` và trả về lỗi **404 Not Found**.
   - *Giải pháp:* Cần file cấu hình `vercel.json` định nghĩa quy tắc Rewrite toàn bộ route về `index.html`.

---

## Phần 2: Kiến Trúc Triển Khai Production (Production Architecture)

### 2.1 So Sánh Các Nhà Cung Cấp Database PostgreSQL Cloud

| Tiêu chí | Neon PostgreSQL (Khuyên dùng) | Supabase | Vercel Postgres (Neon-backed) | Render PostgreSQL |
| :--- | :--- | :--- | :--- | :--- |
| **Free Tier** | 0.5 GiB storage, compute autoscaling to 0 khi không dùng | 500 MB database, 2 projects | Giới hạn tương tự Neon (tính hợp qua Vercel) | 1 GB storage, **tự động xóa sau 90 ngày** |
| **Tương thích Prisma** | 100% Native, hỗ trợ `directUrl` | 100% Native | 100% Native | 100% Native |
| **Connection Pooling** | Tích hợp sẵn PgBouncer (cổng 5432/6543) | Có sẵn Supavisor | Có sẵn PgBouncer | Phải trả phí hoặc cấu hình ngoài |
| **Direct Connection** | Hỗ trợ cho Migration qua direct endpoint | Hỗ trợ direct connection | Hỗ trợ direct connection | Hỗ trợ trực tiếp |
| **Serverless Sleep/Wake** | Tự động ngủ khi không có request, thức dậy cực nhanh (<1s) | Tạm dừng (paused) sau 7 ngày không truy cập | Tự động ngủ | Chạy 24/7 trong 90 ngày |
| **Dự phòng & Backup** | Point-in-time Restore (PITR), Branching | Daily backup | Tương tự Neon | Manual export |
| **Đánh giá** | ⭐ **Tốt nhất cho Serverless & Vercel** | Rất tốt nhưng có nguy cơ pause nếu ít dùng | Tiện lợi nhưng phụ thuộc marketplace | Không dùng cho Production vì bị xóa |

> [!IMPORTANT]
> **Quyết định kiến trúc:** Chọn **Neon PostgreSQL** làm nhà cung cấp Database chính cho Production vì:
> 1. Mã nguồn và cấu hình `backend/prisma/schema.prisma` cùng `.env.example` đã được chuẩn hóa sẵn cho cấu trúc URL kép (`DATABASE_URL` có `pgbouncer=true` và `DIRECT_URL`).
> 2. Tính năng Connection Pooling của Neon chịu tải vượt trội khi nhiều Serverless instance của Vercel chạy song song.
> 3. Hỗ trợ Database Branching giúp tạo database riêng biệt cho môi trường Preview PR mà không ảnh hưởng Production.

### 2.2 Sơ Đồ Kiến Trúc Hệ Thống (Mermaid Diagram)

```mermaid
flowchart TD
    User["Client Web Browser (Người dùng)"]
    
    subgraph Vercel_Platform["Nền tảng Vercel Cloud"]
        subgraph FE_Project["Dự án 1: Frontend SPA (Vercel Edge Network)"]
            CDN["Vercel Global CDN (Edge Cache)"]
            HTML["dist/index.html (SPA Entrypoint)"]
            Assets["Static Assets (.js, .css, images)"]
            Rewrite["vercel.json SPA Rewrite Rules (/* -> /index.html)"]
        end

        subgraph BE_Project["Dự án 2: Backend API (Vercel Serverless Functions)"]
            ServerlessHandler["api/index.js (Serverless Entrypoint)"]
            ExpressApp["Express App Factory (createApp())"]
            Middlewares["Helmet + CORS + RateLimit + ErrorHandler"]
            PrismaClient["Prisma Client (Cached in globalThis)"]
        end
    end

    subgraph Neon_Cloud["Neon Serverless PostgreSQL (Cloud Database)"]
        PgBouncer["Neon Connection Pooler (PgBouncer - Port 5432)"]
        NeonDirect["Neon Direct Endpoint (Session Mode)"]
        PostgresCore[("PostgreSQL 16/18 Database Engine")]
    end

    %% Luồng tương tác Frontend
    User -->|"1. Truy cập https://knowledge-app.vercel.app"| CDN
    CDN --> Rewrite
    Rewrite --> HTML
    HTML -.-> Assets

    %% Luồng tương tác API
    User -->|"2. HTTPS REST Calls /api/v1/* (VITE_API_BASE_URL)"| ServerlessHandler
    ServerlessHandler --> ExpressApp
    ExpressApp --> Middlewares
    Middlewares --> PrismaClient

    %% Luồng Database
    PrismaClient -->|"3. Truy vấn dữ liệu runtime (DATABASE_URL)"| PgBouncer
    PgBouncer --> PostgresCore

    %% Luồng Migration CI/CD
    DevAdmin["Dev / CI Runner"] -.->|"4. npx prisma migrate deploy (DIRECT_URL)"| NeonDirect
    NeonDirect -.-> PostgresCore
```

---

## Phần 3: Thiết Lập PostgreSQL Production (Neon Managed Cloud)

### 3.1 Bước 1: Tạo Tài Khoản và Project Trên Neon

1. Truy cập [https://neon.tech](https://neon.tech) và đăng ký tài khoản (khuyên dùng đăng nhập bằng GitHub).
2. Nhấn nút **Create Project**:
   - **Project Name:** `knowledge-app-production`
   - **Postgres Version:** Chọn phiên bản mới nhất (16 hoặc 17).
   - **Region:** Chọn khu vực gần người dùng nhất (ví dụ: `ap-southeast-1` Singapore cho Việt Nam hoặc `us-east-1`).
   - Nhấn **Create Project**.

### 3.2 Bước 2: Lấy Connection Strings (Pooled vs Direct)

Sau khi tạo project, Neon Dashboard sẽ cung cấp giao diện **Connection Details**.

Neon phân biệt rõ ràng giữa 2 loại kết nối:

```
┌────────────────────────────────────────────────────────────────────────┐
│  POOLED CONNECTION (Sử dụng cho DATABASE_URL trên Backend Serverless) │
│  - Đi qua PgBouncer proxy trung gian                                   │
│  - Hỗ trợ hàng ngàn kết nối đồng thời từ Serverless Functions          │
│  - Định dạng có đuôi -pooler trong hostname:                           │
│    postgresql://user:pass@ep-xyz-pooler.ap-southeast-1.neon.tech/neondb│
│    ?sslmode=require&pgbouncer=true                                     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  DIRECT CONNECTION (Sử dụng cho DIRECT_URL khi chạy Prisma Migration)  │
│  - Kết nối thẳng vào tiến trình PostgreSQL gốc                         │
│  - Cho phép thực thi các lệnh DDL, đổi schema, khóa bảng (Locks)       │
│  - Không qua PgBouncer (vì PgBouncer transaction mode chặn DDL session)│
│  - Định dạng KHÔNG có chữ -pooler:                                     │
│    postgresql://user:pass@ep-xyz.ap-southeast-1.neon.tech/neondb       │
│    ?sslmode=require                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Bước 3: Cấu Hình Datasource Trong Prisma Schema

Đảm bảo file `backend/prisma/schema.prisma` có khai báo đầy đủ cả 2 trường `url` và `directUrl`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

> [!NOTE]
> Khi Prisma thực hiện truy vấn thông thường (`findMany`, `create`), Prisma sẽ dùng `url` (Pooled). Khi chạy `prisma migrate deploy`, Prisma sẽ tự động chuyển sang `directUrl` (Direct) để thực hiện migration an toàn.

### 3.4 Bước 4: Chạy Migration Lần Đầu Lên Production Database

> [!CAUTION]
> **Quy Tắc Sống Còn Cho Production:**
> - ❌ **TUYỆT ĐỐI KHÔNG** chạy `npx prisma migrate dev` trên môi trường Production (lệnh này có thể xóa database nếu phát hiện schema trôi dạt - drift).
> - ❌ **TUYỆT ĐỐI KHÔNG** dùng `npx prisma db push` làm quy trình chính thức trên Production (dễ gây mất mát dữ liệu và không lưu lại lịch sử thay đổi).
> - ✅ **BẮT BUỘC** dùng `npx prisma migrate deploy` (chỉ áp dụng các file SQL migration chưa chạy trong thư mục `prisma/migrations`, tuyệt đối không bao giờ xóa bảng).

Chạy lệnh sau từ máy local hoặc CI/CD pipeline (sử dụng PowerShell trên Windows):

```powershell
# Thiết lập biến môi trường tạm thời trỏ đến Neon Production
$env:DATABASE_URL="postgresql://<user>:<password>@ep-xyz-pooler.ap-southeast-1.neon.tech/neondb?sslmode=require&pgbouncer=true"
$env:DIRECT_URL="postgresql://<user>:<password>@ep-xyz.ap-southeast-1.neon.tech/neondb?sslmode=require"

# 1. Di chuyển vào thư mục backend
cd backend

# 2. Tạo Prisma Client tương thích
npx prisma generate

# 3. Áp dụng migration lên Neon Production
npx prisma migrate deploy

# 4. Kiểm tra trạng thái migration
npx prisma migrate status
```

Kết quả mong đợi:
```
1 migration found in prisma/migrations
All migrations have been successfully applied.
```

### 3.5 Bước 5: Backup và Khôi Phục Dữ Liệu Production

1. **Point-in-Time Restore (PITR) của Neon:**
   - Trên Neon Console, vào tab **Branches** ➔ Tạo một nhánh mới từ một thời điểm trong quá khứ bất kỳ (khôi phục dữ liệu tức thì không cần tải file dump).
2. **Xuất Backup thủ công bằng `pg_dump` (PowerShell):**
   ```powershell
   pg_dump "$env:DIRECT_URL" -F c -b -v -f "backup_knowledge_app_$(Get-Date -Format 'yyyyMMdd_HHmm').dump"
   ```
3. **Khôi phục dữ liệu bằng `pg_restore`:**
   ```powershell
   pg_restore --clean --no-acl --no-owner -d "$env:DIRECT_URL" "backup_knowledge_app_YYYYMMDD_HHmm.dump"
   ```

---

## Phần 4: Triển Khai Backend API

### Phương Án A (Đề xuất chính): Express Trên Vercel Serverless Function

Mã nguồn hiện tại của dự án có kiến trúc phân tầng rất tốt: [`backend/src/app.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/app.js) cung cấp hàm `createApp()` trả về đối tượng Express thuần túy, độc lập với file [`backend/src/server.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/server.js). Điều này cho phép chúng ta chuyển đổi sang Serverless mà **không cần can thiệp logic nghiệp vụ**.

#### Yêu Cầu Điều Chỉnh Mã Nguồn Cho Môi Trường Serverless

> [!NOTE]
> Các file này sẽ được tạo trong quá trình chuẩn bị deploy:

##### 1. Tạo file Serverless Entrypoint `backend/api/index.js`

Vercel yêu cầu Serverless Function xuất trực tiếp instance Express:

```javascript
// backend/api/index.js
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';

const app = createApp();

// Export dưới dạng handler mặc định cho Vercel Serverless
export default app;
```

##### 2. Tối ưu Prisma Client Singleton trong `backend/src/config/database.js`

Trong môi trường Serverless, các hàm có thể khởi động lại liên tục. Để tránh tạo nhiều kết nối gây quá tải:

```javascript
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Khởi tạo và lưu cache vào globalThis để tái sử dụng qua các lần invoke
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  await prisma.$connect();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
```

##### 3. Thêm Binary Targets vào `backend/prisma/schema.prisma`

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

##### 4. Cấu hình file `backend/vercel.json`

File cấu hình này điều hướng tất cả request gửi đến Backend vào file serverless handler:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

### Phương Án B (Phương án thay thế): Render / Railway Container

Nếu ứng dụng trong tương lai phát triển các tính năng như **WebSocket (collaborative editing)**, **Background cron jobs chạy liên tục**, hoặc **Serverless Function timeout** vượt quá 15 giây:

- **Khuyên dùng:** Triển khai Backend lên **Render Web Service** hoặc **Railway**.
- **Cách thức hoạt động:** Chạy đúng lệnh `npm start` (`node src/server.js`) mà không cần thay đổi bất kỳ dòng code nào.

---

## Phần 5: Triển Khai Frontend Trên Vercel

Frontend được xây dựng bằng **React 18 + Vite**, là một ứng dụng Single Page Application (SPA).

### 5.1 Cấu Hình Vite Production Build

File `frontend/package.json` đã có script:
```json
"build": "vite build"
```
Kết quả build được tạo tại thư mục `frontend/dist/`.

### 5.2 Xử Lý SPA Routing Với `frontend/vercel.json`

Để tránh lỗi **404 Not Found** khi người dùng truy cập trực tiếp hoặc F5 tại các đường dẫn như `/notes`, `/graph`, `/search`, tạo file `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 5.3 Cấu Hình Biến Môi Trường `VITE_API_BASE_URL`

File `frontend/src/services/apiClient.js` sử dụng:
```javascript
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
```
Trong cấu hình Vercel Frontend, biến môi trường **BẮT BUỘC** phải được đặt là URL của Backend Production, ví dụ:
```
VITE_API_BASE_URL = https://knowledge-app-backend.vercel.app/api/v1
```

> [!WARNING]
> Vite thực hiện chèn biến môi trường `import.meta.env` vào code tại **thời điểm build (Build Time)**. Do đó, nếu bạn thay đổi `VITE_API_BASE_URL` trong Vercel Settings, bạn **phải Trigger Redeploy** lại dự án thì thay đổi mới có hiệu lực trên trình duyệt của người dùng.

---

## Phần 6: Quản Lý Biến Môi Trường (Environment Variables)

### 6.1 Bảng Tổng Hợp Biến Môi Trường

| Tên Biến | Mục đích | Bắt buộc | Môi trường Local (Dev) | Giá trị Production (Ví dụ) | Nơi Cấu Hình |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `NODE_ENV` | Xác định môi trường thực thi của Node.js | Có | `development` | `production` | Vercel Backend Settings |
| `PORT` | Cổng HTTP Server (Local) | Không (mặc định 3000) | `3000` | Tự động gán bởi hosting | Vercel Backend Settings |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL chính (Pooled) | **Bắt buộc** | `postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public` | `postgresql://user:pass@ep-xyz-pooler.ap-southeast-1.neon.tech/neondb?sslmode=require&pgbouncer=true` | Vercel Backend Settings |
| `DIRECT_URL` | Chuỗi kết nối PostgreSQL trực tiếp (Migration) | **Bắt buộc** | `postgresql://postgres:postgres@localhost:5432/knowledge_app?schema=public` | `postgresql://user:pass@ep-xyz.ap-southeast-1.neon.tech/neondb?sslmode=require` | Vercel Backend Settings & CI/CD |
| `CORS_ORIGIN` | Danh sách URL Frontend được phép gọi API | **Bắt buộc** | `http://localhost:5173` | `https://knowledge-app-frontend.vercel.app` | Vercel Backend Settings |
| `RATE_LIMIT_WINDOW_MS` | Khung thời gian giới hạn request | Không | `900000` (15 phút) | `900000` | Vercel Backend Settings |
| `RATE_LIMIT_MAX_REQUESTS`| Số request tối đa trong khung thời gian | Không | `100` | `200` | Vercel Backend Settings |
| `LOG_LEVEL` | Cấp độ ghi log | Không | `debug` | `warn` hoặc `error` | Vercel Backend Settings |
| `VITE_API_BASE_URL` | Địa chỉ gốc API cho Frontend gọi | **Bắt buộc** | `http://localhost:3000/api/v1` | `https://knowledge-app-backend.vercel.app/api/v1` | Vercel Frontend Settings |
| `VITE_APP_NAME` | Tên hiển thị của ứng dụng | Không | `Knowledge App` | `Knowledge App` | Vercel Frontend Settings |
| `VITE_ENABLE_KNOWLEDGE_GRAPH` | Bật/tắt tính năng Knowledge Graph | Không | `true` | `true` | Vercel Frontend Settings |

### 6.2 Nguyên Tắc Bảo Mật Tuyệt Đối

1. ❌ **KHÔNG BAO GIỜ** đặt tiền tố `VITE_` vào các biến nhạy cảm như `DATABASE_URL`, `DIRECT_URL`, password, secret key. Mọi biến có tiền tố `VITE_` đều sẽ bị Vite đóng gói công khai vào file JavaScript và bất kỳ ai cũng có thể đọc được trên trình duyệt.
2. ❌ **KHÔNG BAO GIỜ** commit file `.env` chứa mật khẩu thực tế lên Git/GitHub.
3. ✅ Phân tách môi trường trên Vercel:
   - **Production:** Áp dụng cho nhánh `main`.
   - **Preview:** Áp dụng cho các Pull Request (khuyên dùng database branch riêng của Neon).
   - **Development:** Dùng khi chạy `vercel dev` trên máy local.

---

## Phần 7: Cấu Hình Monorepo & Vercel Project

Để tối ưu hóa quản lý và bảo trì, giải pháp chuẩn nhất là tạo **2 Vercel Projects riêng biệt** trỏ về cùng một GitHub Repository:

```
GitHub Repository: PersonalKnowledgeManagement
  ├── Vercel Project 1: "knowledge-app-frontend" (Root: frontend/)
  └── Vercel Project 2: "knowledge-app-backend"  (Root: backend/)
```

### 7.1 Cấu Hình Vercel Cho Frontend Project

1. Trên Vercel Dashboard, nhấn **Add New... ➔ Project** ➔ Chọn repo `PersonalKnowledgeManagement`.
2. **Project Name:** `knowledge-app-frontend`
3. **Framework Preset:** `Vite`
4. **Root Directory:** Nhấn Edit ➔ Chọn `frontend`
5. **Build and Output Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. **Environment Variables:**
   - Thêm: `VITE_API_BASE_URL` = `https://<ten-backend-cua-ban>.vercel.app/api/v1`
7. Nhấn **Deploy**.

---

### 7.2 Cấu Hình Vercel Cho Backend Project

1. Nhấn **Add New... ➔ Project** ➔ Chọn lại repo `PersonalKnowledgeManagement`.
2. **Project Name:** `knowledge-app-backend`
3. **Framework Preset:** `Other`
4. **Root Directory:** Nhấn Edit ➔ Chọn `backend`
5. **Build and Output Settings:**
   - **Build Command:** `npx prisma generate` *(đảm bảo Prisma Client được sinh ra trong container build của Vercel)*
   - **Output Directory:** Để trống (Serverless tự xử lý)
   - **Install Command:** `npm install`
6. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `postgresql://...-pooler...` (Pooled Neon connection)
   - `DIRECT_URL` = `postgresql://...` (Direct Neon connection)
   - `CORS_ORIGIN` = `https://knowledge-app-frontend.vercel.app` (URL của frontend vừa tạo ở bước 7.1)
7. Nhấn **Deploy**.

---

## Phần 8: Quy Trình Database Migration (Dev vs Prod)

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (Local Machine)
    participant LocalDB as Local PostgreSQL
    participant Git as GitHub (Repo)
    participant CI as Migration / Deploy Process
    participant NeonDB as Neon Production DB

    Note over Dev, LocalDB: 1. Phát triển tính năng mới (Development)
    Dev->>Dev: Sửa backend/prisma/schema.prisma
    Dev->>LocalDB: npx prisma migrate dev --name add_feature
    LocalDB-->>Dev: Tạo file SQL migration mới & cập nhật DB local
    Dev->>Dev: Chạy unit & integration tests kiểm chứng

    Note over Dev, Git: 2. Đưa mã nguồn lên Remote
    Dev->>Git: git push origin feature-branch -> Pull Request -> Merge to main

    Note over CI, NeonDB: 3. Triển khai Production an toàn
    CI->>NeonDB: npx prisma migrate deploy (Dùng DIRECT_URL)
    NeonDB-->>CI: Áp dụng các file SQL migration chưa chạy (Zero-downtime)
    CI->>CI: npx prisma generate (Tạo Client mới)
    CI-->>Dev: Hoàn thành triển khai
```

### 8.1 Các Lệnh Npm Scripts Chuẩn Trong `package.json`

Trong `backend/package.json`, các script quản lý database được phân định rõ ràng:

```json
"scripts": {
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:status": "prisma migrate status"
}
```

### 8.2 Quy Tắc Zero-Downtime Migration Khi Thay Đổi Schema

Khi thay đổi schema database trên Production có người dùng thực tế:
1. **Thêm trường mới (Add Field):** Luôn đặt giá trị mặc định (`@default(...)`) hoặc cho phép null (`String?`). Không thêm trường bắt buộc (`NOT NULL`) mà không có giá trị default.
2. **Xóa trường (Drop Field) hoặc Đổi tên (Rename):**
   - *Bước 1:* Deploy backend mới không còn phụ thuộc vào trường cũ.
   - *Bước 2:* Chạy migration xóa cột cũ sau khi đã chắc chắn không còn code nào truy vấn vào cột đó.

---

## Phần 9: Checklist & Ma Trận Kiểm Thử Production

### 9.1 Checklist Các Bước Kiểm Tra Sau Deployment

- [ ] **1. Database Check:**
  - [ ] Đã chạy thành công `npx prisma migrate deploy` không gặp lỗi.
  - [ ] Tất cả các bảng `notes`, `note_relationships`, `tags`, `note_tags`, `users` đã tồn tại trên Neon.
- [ ] **2. Backend Serverless Check:**
  - [ ] Endpoint `GET https://knowledge-app-backend.vercel.app/health` trả về HTTP 200 `{ success: true, status: "healthy" }`.
  - [ ] Endpoint `GET /api/v1/notes` trả về mảng dữ liệu rỗng hoặc dữ liệu seed mà không bị timeout.
  - [ ] Log trên Vercel Functions không có lỗi crash hoặc unhandled rejection.
- [ ] **3. Frontend CDN Check:**
  - [ ] Truy cập trang chủ `https://knowledge-app-frontend.vercel.app` tải đầy đủ giao diện.
  - [ ] F12 Console không có lỗi Javascript đỏ.
  - [ ] Truy cập trực tiếp link con `/notes` và `/graph`, sau đó bấm **F5 (Reload)** trang vẫn hiển thị bình thường (Rewrite hoạt động).
- [ ] **4. End-to-End Integration Check:**
  - [ ] Tạo một Note mới ➔ Dữ liệu lưu vào database Neon.
  - [ ] Tạo một Thư mục mới và kéo thả Note vào Thư mục ➔ Phản hồi ngay lập tức.
  - [ ] Mở trang Knowledge Graph ➔ Các node và quan hệ liên kết hiển thị chính xác.

---

### 9.2 Ma Trận Test Case Chi Tiết (Production Verification Test Cases)

| Test ID | Kịch bản kiểm thử | Hành động thực hiện | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-PROD-01** | Backend Health Check | `GET /health` | HTTP 200, status `healthy` | Đạt |
| **TC-PROD-02** | CORS Headers Validation | Gửi request `OPTIONS` với `Origin: https://knowledge-app-frontend.vercel.app` | Header `Access-Control-Allow-Origin` khớp đúng tên miền Frontend | Đạt |
| **TC-PROD-03** | Database Query Execution | `GET /api/v1/notes?limit=10` | HTTP 200, trả về danh sách notes từ Neon | Đạt |
| **TC-PROD-04** | Create Note via Frontend | Nhấn nút `+ New Note` trên giao diện | Ghi chú tạo thành công, URL chuyển sang `/notes/:uuid` | Đạt |
| **TC-PROD-05** | Auto-save & Rich Text | Gõ nội dung văn bản trong TipTap Editor | Đèn lưu trạng thái chuyển sang "Saved", nội dung JSON lưu vào cột JSONB | Đạt |
| **TC-PROD-06** | Knowledge Graph Connection | Nối liên kết giữa 2 Note | Bản ghi `note_relationships` được tạo, hiển thị node liên kết trên Graph | Đạt |
| **TC-PROD-07** | SPA Direct URL Refresh | Truy cập trực tiếp `/graph` rồi nhấn Ctrl+F5 | Trang không báo 404 Vercel, load đúng view Knowledge Graph | Đạt |
| **TC-PROD-08** | Input Validation Error | Gửi request `POST /api/v1/notes` với body rỗng | HTTP 400 Bad Request, trả về danh sách lỗi chuẩn `errors: [...]` | Đạt |

---

## Phần 10: Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Lỗi Prisma `P1001` (Can't reach database server)
- **Nguyên nhân:** Hostname Neon sai, database đang bị tạm dừng hoặc chuỗi kết nối thiếu SSL.
- **Cách khắc phục:**
  - Kiểm tra xem đuôi `?sslmode=require` đã có trong connection string chưa.
  - Kiểm tra trạng thái Compute Endpoint trên Neon Console có đang ở trạng thái `Active` hay không.

### 2. Lỗi Prisma `P1000` (Authentication failed)
- **Nguyên nhân:** Sai tên người dùng hoặc mật khẩu trong `DATABASE_URL`.
- **Cách khắc phục:** Đặt lại mật khẩu (Reset Password) của role trên Neon Console và cập nhật lại biến môi trường trên Vercel.

### 3. Lỗi Prisma `P3005` (The database schema is not empty)
- **Nguyên nhân:** Xảy ra khi dùng lệnh `prisma migrate dev` trên một database đã có bảng sẵn.
- **Cách khắc phục:** Tuyệt đối không dùng `migrate dev`. Sử dụng lệnh:
  ```powershell
  npx prisma migrate deploy
  ```

### 4. Lỗi CORS: `Cross-Origin Request Blocked`
- **Nguyên nhân:** Giá trị của biến `CORS_ORIGIN` trên Backend không trùng khớp với URL của Frontend Vercel (ví dụ: thừa hoặc thiếu dấu `/` ở cuối, hoặc sai giao thức `http` thay vì `https`).
- **Cách khắc phục:**
  - Sửa `CORS_ORIGIN` trên Vercel Backend thành chính xác: `https://knowledge-app-frontend.vercel.app` (không có dấu `/` ở cuối).
  - Redeploy lại Backend.

### 5. Lỗi 404 Khi F5 / Refresh Trang Trên Frontend
- **Nguyên nhân:** Thiếu cấu hình Rewrite cho Single Page Application trên Vercel CDN.
- **Cách khắc phục:** Đảm bảo file `frontend/vercel.json` đã có khối:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### 6. Lỗi Vercel Function Timeout (504 Gateway Timeout)
- **Nguyên nhân:** Serverless Function bị treo do gọi `app.listen()` hoặc hàm connect database không ngắt.
- **Cách khắc phục:**
  - Đảm bảo file entrypoint của Vercel (`api/index.js`) chỉ export `app` chứ không gọi `app.listen()`.
  - Sử dụng Neon Pooled connection string (`pgbouncer=true`).

### 7. Lỗi Database Connection Limit Exceeded
- **Nguyên nhân:** Không dùng connection pooler khiến mỗi lambda function tạo một kết nối riêng làm cạn kiệt pool của PostgreSQL.
- **Cách khắc phục:**
  - Đảm bảo `DATABASE_URL` sử dụng URL có chữ `-pooler` của Neon.
  - Đảm bảo Prisma Client được tái sử dụng qua `globalThis.prisma`.

---

## Phần 11: Quy Trình CI/CD & Luồng Triển Khai Trong Tương Lai

### 11.1 Luồng Phát Triển Tính Năng Với Git Branching

```
[feature/note-tagging] ──(PR)──> [Preview Deployment (Vercel)] ──(Review)──> [main] ──> [Production]
                                            │                                                │
                                            ▼                                                ▼
                                Neon DB Branch (Preview)                         Neon DB Main (Production)
```

1. **Pull Request (Preview Environment):**
   - Khi tạo Pull Request trên GitHub, Vercel tự động tạo một đường dẫn Preview URL riêng biệt (ví dụ: `https://knowledge-app-git-feature-xyz.vercel.app`).
   - Neon hỗ trợ tạo một Database Branch tạm thời từ nhánh chính cho Preview PR này.
2. **Merge vào `main` (Production Deployment):**
   - Khi PR được merge vào nhánh `main`:
     1. Chạy CI Action: kiểm tra lint và chạy test suite (`npm test`).
     2. Áp dụng migration vào Neon Production DB: `npx prisma migrate deploy`.
     3. Vercel tự động kích hoạt Production Deployment cho cả Frontend và Backend.
     4. Hệ thống hoàn tất cập nhật mà không gián đoạn dịch vụ của người dùng (Zero Downtime).

---

## Tóm Tắt Các Bước Triển Khai Thực Tế Cho Người Dùng

Để tiến hành triển khai lên Production, các bước thực hiện tuần tự như sau:

1. **Bước 1 (Database):** Tạo project trên [Neon.tech](https://neon.tech), sao chép 2 chuỗi kết nối: **Pooled** (`DATABASE_URL`) và **Direct** (`DIRECT_URL`).
2. **Bước 2 (Migration):** Mở terminal local, đặt biến môi trường và chạy `npx prisma migrate deploy` để khởi tạo các bảng trên Neon.
3. **Bước 3 (Chuẩn bị code Serverless):** Tạo file `backend/api/index.js` và `backend/vercel.json`, cập nhật `frontend/vercel.json`.
4. **Bước 4 (Deploy Backend):** Tạo Project trên Vercel chọn thư mục gốc là `backend`, cấu hình biến môi trường (`DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGIN`). Lấy URL Backend sau khi deploy xong.
5. **Bước 5 (Deploy Frontend):** Tạo Project trên Vercel chọn thư mục gốc là `frontend`, cấu hình biến môi trường `VITE_API_BASE_URL` trỏ vào URL Backend vừa lấy. Nhấn Deploy.
6. **Bước 6 (Kiểm thử):** Thực hiện kiểm thử toàn bộ hệ thống theo [Bảng Test Case Phần 9](#phần-9-checklist--ma-trận-kiểm-thử-production).
