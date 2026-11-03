# ⚙️ Auction Platform — Backend (Node.js & Express.js)

A scalable, modular, enterprise-ready REST & Real-Time API backend for the **Auction Platform**, engineered with **Node.js 24+**, **Express 5**, and native **TypeScript**.

---

## 📑 Table of Contents

- [Architectural Philosophy](#architectural-philosophy)
- [Directory & Folder Structure](#directory--folder-structure)
- [Deep Dive into Modules](#deep-dive-into-modules)
  - [1. Config (`/config`) & Samples (`/samples`)](#1-config-config--samples-samples)
  - [2. Database Connectors (`/database`)](#2-database-connectors-database)
  - [3. Routes (`/routes`)](#3-routes-routes)
  - [4. Controllers (`/controllers`)](#4-controllers-controllers)
  - [5. Models (`/models`)](#5-models-models)
  - [6. Middleware (`/middleware`)](#6-middleware-middleware)
  - [7. Utils (`/utils`) & Helpers (`/helpers`)](#7-utils-utils--helpers-helpers)
- [Auction API Route Map](#auction-api-route-map)
- [TypeScript & Execution Configuration](#typescript--execution-configuration)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## 🏛️ Architectural Philosophy

The backend adopts an **MVC + Service-Separated Modular Structure**, dividing concerns across strictly decoupled layers:

```
┌────────────────────────────────────────────────────────┐
│                   Incoming HTTP Request                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │   Middleware Layer        │  (CORS, Auth, Logger, Rate-Limit)
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │   Routing Layer (/routes) │  (Route definitions & parameter mapping)
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Controller Layer          │  (Request parsing, flow orchestration)
              └───────┬───────────┬───────┘
                      │           │
           ┌──────────▼───┐   ┌───▼──────────┐
           │   Helpers    │   │ Data Models  │  (Schema validation, DB entities)
           │   & Utils    │   └───────┬──────┘
           └──────────────┘           │
                                      ▼
                      ┌───────────────────────────┐
                      │ Database Layer (/database)│  (PostgreSQL / MongoDB / Redis)
                      └───────────────────────────┘
```

---

## 📂 Directory & Folder Structure

Following production-grade Node.js and Express.js design patterns:

```
backend/
├── src/
│   ├── app.ts                        # Express application entry & server listener
│   ├── config/                       # Application, system & database configurations
│   │   ├── app.conf.ts               # Port, CORS origins, payload limits, rate limits
│   │   ├── db.conf.ts                # Database connection credentials & options
│   │   ├── app.keys.ts               # JWT secrets, API tokens (loaded from env)
│   │   └── init.ts                   # Centralized configuration exporter
│   ├── database/                     # Database managers & lifecycle handlers
│   │   ├── Mongo.database.ts         # Document database connector (if MongoDB)
│   │   ├── Postgres.database.ts      # Relational database connector (PostgreSQL)
│   │   ├── Redis.database.ts         # Cache & pub/sub store for real-time bids
│   │   └── init.ts                   # Database connection initializer & health hooks
│   ├── routes/                       # Modular route endpoints
│   │   ├── App.routes.ts             # Health check and root ping routes
│   │   ├── Auth.routes.ts            # Registration, login, token refresh routes
│   │   ├── Auction.routes.ts         # Item listings, live bidding, details routes
│   │   ├── Dashboard.routes.ts       # User watchlist, active bids, seller stats
│   │   └── index.ts                  # Root router aggregating all sub-routes
│   ├── controllers/                  # Request/Response handlers & orchestrators
│   │   ├── App.controller.ts         # System health & API status controllers
│   │   ├── Auth.controller.ts        # Authentication flows & session handling
│   │   ├── Auction.controller.ts     # Lot creation, bidding logic, status updates
│   │   └── User.controller.ts        # Profile management & user records
│   ├── models/                       # Data schemas, table entities & validations
│   │   ├── User.model.ts             # User account schema & password hashing
│   │   ├── Auction.model.ts          # Auction lot schema (price, timer, seller)
│   │   └── Bid.model.ts              # Individual bid history transaction schema
│   ├── middleware/                   # Express request pipeline middlewares
│   │   ├── App.middleware.ts         # Standard parsers, CORS headers, security headers
│   │   ├── Auth.middleware.ts        # Bearer token validation & role check (Admin/User)
│   │   ├── ErrorHandler.middleware.ts# Global catch-all error handling & formatted JSON
│   │   └── init.ts                   # Sequential middleware bootstrapping
│   ├── helpers/                      # Dynamic computation helpers (tied to workflows)
│   │   ├── Bid.helper.ts             # Bid increment calculations & anti-snipe logic
│   │   └── Response.helper.ts        # Standardized API response formatters
│   └── utils/                        # Pure static utility functions
│       ├── Logger.util.ts            # Structured logging (timestamps, levels)
│       └── Time.util.ts              # Time-zone calculations & remaining duration
├── samples/                          # Template configuration files (Committed to Git)
│   ├── .env.sample                   # Sample environment variables
│   ├── db.conf.sample                # Database connection schema sample
│   ├── app.conf.sample               # App configuration sample
│   └── app.keys.sample               # Secret keys placeholder sample
├── package.json                      # Node.js project manifest & scripts
├── tsconfig.json                     # TypeScript compiler configuration (nodenext)
├── .env                              # Local environment variables (DO NOT COMMIT)
└── README.md                         # Project documentation
```

---

## 🔍 Deep Dive into Modules

### 1. Config (`/config`) & Samples (`/samples`)
Configuration is segregated into 3 distinct categories:
- **System Configuration (`.env`)**: Environment-specific flags (`NODE_ENV`, `PORT`).
- **App Configuration (`app.conf.ts`)**: Payload limits (`10mb`), rate-limiting caps, CORS origins.
- **App Keys (`app.keys.ts`)**: Secret credentials like JWT signing secrets, payment gateway keys.
> ⚠️ **Security Rule**: Actual configuration with real secrets is never committed to Git. The `/samples` directory maintains `.sample` copies with placeholder values for team onboarding.

### 2. Database Connectors (`/database`)
Maintains connections to persistence and caching layers:
- Isolates lifecycle event listeners (`on('connected')`, `on('error')`, `on('disconnected')`).
- Houses connection pooling and retry mechanisms.
- Supports multi-database architectures (e.g., PostgreSQL for primary bids + Redis for high-concurrency live ticker locks).

### 3. Routes (`/routes`)
Keeps routing definitions clean and declarative. Instead of stacking all endpoints into `app.ts`, routes are segregated by resource:
```typescript
import { Router } from 'express';
import { AuctionRoutes } from './Auction.routes.js';
import { AuthRoutes } from './Auth.routes.js';

const router = Router();
router.use('/auctions', AuctionRoutes);
router.use('/auth', AuthRoutes);

export default router;
```

### 4. Controllers (`/controllers`)
Controllers handle HTTP request parameters, call business logic, and dispatch JSON responses:
- Receives typed requests (`Request`, `Response`).
- Validates payload presence and invokes models or services.
- Keeps route files purely declarative.

### 5. Models (`/models`)
Encapsulates entity definitions and data access layers:
- Enforces strict TypeScript interfaces for DB entities (`User`, `AuctionItem`, `Bid`).
- Defines schema constraints, indexing, and validation hooks.

### 6. Middleware (`/middleware`)
Intercepts HTTP requests prior to reaching controller handlers:
- **`App.middleware.ts`**: Configures JSON parsers, URL-encoded body parsers, and CORS.
- **`Auth.middleware.ts`**: Verifies JWT tokens, extracts authenticated user context.
- **`ErrorHandler.middleware.ts`**: Catches unhandled errors and ensures uniform error schemas (`{ success: false, message: ... }`).

### 7. Utils (`/utils`) & Helpers (`/helpers`)
- **Utils (`Logger.util.ts`)**: Static, stateless functions with no domain-specific dependency.
- **Helpers (`Bid.helper.ts`)**: Domain-specific logic, such as calculating minimum allowable bid increments or validating anti-sniping countdown extensions.

---

## 🗺️ Auction API Route Map

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | API status ping & health summary |
| `GET` | `/api/health` | Public | System uptime & memory diagnostics |
| `GET` | `/api/auctions` | Public | Fetch active auction listings with filters |
| `GET` | `/api/auctions/:id` | Public | Retrieve single auction lot details & bid history |
| `POST` | `/api/auctions/:id/bid` | Authenticated | Place a real-time counter-bid on an item |
| `POST` | `/api/auctions` | Authenticated | Create a new auction listing (Seller) |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/dashboard/bids` | Authenticated | Fetch current user's active & won bids |

---

## ⚡ TypeScript & Execution Configuration

The backend is configured to run TypeScript natively on modern Node.js versions (Node 22.18+ / 24+):

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

- **Native Strip-Types Execution**: Node.js executes TypeScript directly without complex build steps via `node src/app.ts`.
- **Type Checking**: Standalone type verification is triggered via `npm run type-check` (`tsc`).

---

## 🚀 Getting Started

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy sample environment configuration:

```bash
cp samples/.env.sample .env
```

### 3. Development Server (Auto-Reload)

```bash
npm run dev
```

The API server will listen on [http://localhost:5000](http://localhost:5000).

### 4. Type Checking

Verify TypeScript validity across all files:

```bash
npm run type-check
```

---

## 🔐 Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which Express server listens |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin for CORS |
| `JWT_SECRET` | `super_secret_key` | Secret key for signing authentication tokens |
| `DATABASE_URL` | — | Connection string for database instance |
