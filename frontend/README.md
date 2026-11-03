# 🔨 Auction Platform — Frontend

A high-performance, real-time online auction and bidding web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 📑 Table of Contents

- [Architectural Overview](#architectural-overview)
- [Project Structure & Conventions](#project-structure--conventions)
  - [Top-Level Directory Structure](#top-level-directory-structure)
  - [App Router Architecture](#app-router-architecture)
  - [Route Groups & URLs](#route-groups--urls)
  - [Component Hierarchy](#component-hierarchy)
  - [Private Folders & Colocation](#private-folders--colocation)
- [Auction Platform Route Map](#auction-platform-route-map)
- [Design System & Styling](#design-system--styling)
- [Getting Started](#getting-started)
- [Development Guidelines](#development-guidelines)

---

## 🏛️ Architectural Overview

This project implements the modern Next.js 16 App Router architecture following the official Vercel project structure conventions:

```
┌──────────────────────────────────────────────────────────┐
│                      Next.js 16 App                      │
│                                                          │
│  ┌────────────────────┐   ┌───────────────────────────┐  │
│  │   Route Groups     │   │     Colocated Modules     │  │
│  │  (marketing)       │   │  _components (UI widgets) │  │
│  │  (auction)         │   │  _lib (helpers, schemas)  │  │
│  │  (dashboard)       │   │  _hooks (domain state)    │  │
│  │  (auth)            │   └───────────────────────────┘  │
│  └────────────────────┘                                  │
│            ▲                                             │
│            │ Uses                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Shared Application Code                           │  │
│  │  @/components  │  @/lib  │  @/hooks  │  @/types    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Server-First by Default**: Pages and layouts are Server Components (RSC) to maximize SEO, initial page load speed, and bundle efficiency.
- **Client Components on Demand**: Real-time bidding timers, WebSocket listeners, and interactive bid modals are isolated with `'use client'`.
- **Route-Group Isolation**: Shared layouts and nested navigation are partitioned using route groups `(...)` without polluting URL segments.

---

## 📂 Project Structure & Conventions

### Top-Level Directory Structure

```
frontend/
├── app/                  # Next.js App Router root (routing, layouts, pages)
├── components/           # Globally shared UI components
│   ├── ui/               # Reusable atomic primitives (buttons, modals, badges, inputs)
│   ├── layout/           # Global navigation (Navbar, Footer, Notifications)
│   └── auction/          # Shared auction widgets (Cards, Timers, BidFeed)
├── hooks/                # Shared custom React hooks (useTimer, useWebSocket)
├── lib/                  # Shared utilities, API client, currency & date formatters
├── types/                # TypeScript interface and type declarations
├── public/               # Static assets (logos, placeholders, icons)
├── .next/                # Next.js build cache & output
├── eslint.config.mjs     # ESLint flat configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration with @/* path aliases
└── globals.css           # Tailwind CSS v4 configuration and theme tokens
```

---

### App Router Architecture

In accordance with Next.js 16 routing conventions, the `app/` directory uses standardized special files:

| File Convention | Extension | Purpose |
| :--- | :--- | :--- |
| `layout` | `.tsx` | Shared layout across child segments. Preserves state across navigations. |
| `page` | `.tsx` | Unique UI for a routable URL segment (makes a route public). |
| `loading` | `.tsx` | Instant loading skeleton using React Suspense. |
| `error` | `.tsx` | Segment-level React Error Boundary with recovery triggers. |
| `not-found` | `.tsx` | Segment or global 404 handler (`notFound()`). |
| `route` | `.ts` | Server-side API endpoint handlers (`GET`, `POST`, etc.). |
| `template` | `.tsx` | Re-mounted layout instance on every navigation. |

---

### Route Groups & URLs

Route groups `(groupName)` organize application code and isolate layout boundaries without modifying the public URL path:

```
app/
├── (marketing)/
│   ├── layout.tsx             # Marketing layout with Hero & Announcement banner
│   └── page.tsx               # Landing page (URL: /)
├── (auth)/
│   ├── layout.tsx             # Centered card layout for authentication
│   ├── login/page.tsx         # Login view (URL: /login)
│   └── register/page.tsx      # Register view (URL: /register)
├── (auction)/
│   ├── auctions/
│   │   ├── page.tsx           # Browse all auctions (URL: /auctions)
│   │   ├── [id]/
│   │   │   ├── page.tsx       # Live bidding room (URL: /auctions/:id)
│   │   │   ├── loading.tsx    # Bidding room skeleton
│   │   │   └── error.tsx      # Auction expired / error UI
│   │   └── create/page.tsx    # Create listing view (URL: /auctions/create)
└── (dashboard)/
    ├── layout.tsx             # Sidebar dashboard layout
    └── dashboard/
        ├── bids/page.tsx      # My bids (URL: /dashboard/bids)
        ├── watchlist/page.tsx # Saved auctions (URL: /dashboard/watchlist)
        └── sales/page.tsx     # Seller dashboard (URL: /dashboard/sales)
```

---

### Component Hierarchy

Next.js evaluates nested route files in the following hierarchical order:

```
Root Layout (app/layout.tsx)
 └── Route Group Layout (app/(auction)/layout.tsx)
      └── Template (optional)
           └── Error Boundary (error.tsx)
                └── Suspense Boundary (loading.tsx)
                     └── Page (page.tsx)
```

---

### Private Folders & Colocation

Non-routable files can be safely colocated directly within route segments or enclosed in private folders:

- **Private folders (`_folderName`)**:
  - `app/(auction)/auctions/[id]/_components/` — Specific live bid ticker, countdown timer, or bid history feed.
  - `app/(auction)/auctions/[id]/_lib/` — Bidding validation rules and client socket emitters.
- **Why use private folders**:
  - Prevents accidental routing exposure.
  - Cleanly separates feature-specific logic from reusable global components in `@/components`.
  - Keeps complex route segments organized and self-contained.

---

## 🗺️ Auction Platform Route Map

| Route Path | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | Server Component | Public | Hero banner, live highlights, ending-soon auctions |
| `/auctions` | Server Component | Public | Search, category filter, price sorting, grid view |
| `/auctions/[id]` | Hybrid (RSC + Client) | Public | Live auction detail, real-time bid feed, instant bidding |
| `/auctions/create` | Client Component | Authenticated | Multi-step auction listing creation form |
| `/dashboard/bids` | Server Component | Authenticated | Bid activity history, winning status, auto-bid settings |
| `/dashboard/watchlist` | Server Component | Authenticated | Bookmarked lots and ending-soon alerts |
| `/login` & `/register` | Client Component | Public | User authentication & onboarding |

---

## 🎨 Design System & Styling

- **Tailwind CSS v4**: Loaded directly in [app/globals.css](file:///d:/Auction/frontend/app/globals.css) via `@import "tailwindcss";`.
- **Theming**:
  - Light & dark mode powered by CSS variables (`--background`, `--foreground`).
  - Fluid typography with Next.js font optimization (`next/font`).
- **Path Aliases**:
  - Import shared files cleanly using `@/*` mapped to root (e.g. `@/components/ui/button`, `@/lib/utils`, `@/types/auction`).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm, yarn, pnpm, or bun

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Production

```bash
# Build production bundle
npm run build

# Start production server
npm run start

# Lint check
npm run lint
```

---

## 🛠️ Development Guidelines

1. **Keep Server Components Pure**: Fetch auction initial state in Server Components. Wrap real-time interactive widgets (bidding buttons, countdown clocks) in client-boundary components (`'use client'`).
2. **Path Aliases**: Always use `@/...` rather than deeply nested relative paths (`../../..`).
3. **Optimistic Updates**: For bidding actions, utilize React 19's `useOptimistic` or responsive UI feedback while socket events sync.
4. **Data Validation**: Keep bidding and form schemas defined in TypeScript and validated before submission.
