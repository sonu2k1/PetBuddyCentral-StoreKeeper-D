# AGENTS.md — Codebase Context for AI Assistants

This file provides crucial context about the **PetBuddyCentral Store Keeper** codebase to help AI agents (like Jules, Copilot, or Claude) understand the architecture, conventions, and how to effectively write code for this project.

## 🏗️ Architecture & Stack

- **Framework**: Next.js 16 (App Router exclusively). All pages are server components by default unless marked with `"use client"`.
- **Language**: TypeScript (strict mode enabled).
- **Database ORM**: Prisma (`v6.19.2`).
- **Database**: SQLite (`dev.db`). This is a local database.
- **Authentication**: NextAuth.js (v5 beta).
- **Styling**: Standard CSS (`globals.css`) with standard class names (No Tailwind currently configured).
- **Icons**: `lucide-react`.
- **Charts**: `recharts`.

## 👥 Multi-Tenant Role System

The system operates on a strict 3-tier hierarchy:

1. **Super Admin** (`SUPER_ADMIN`): Full access across all organizations and stores. Route: `/super-admin/*`
2. **Franchise Owner** (`FRANCHISE_OWNER`): Access limited to their specific `Organization` and its child `Store`s. Route: `/franchise/*`
3. **Store Manager** (`STORE_MANAGER`): Access limited to their assigned `Store`. Route: `/store/*`

**AI Instruction**: When building features or APIs, *always* verify the user's role and scopes using NextAuth sessions. Never load data without filtering by the appropriate `orgId` or `storeId`.

## 🗄️ Database & Prisma Conventions

- The schema is located at `app/prisma/schema.prisma`.
- Whenever you (the AI) propose changes to the Prisma schema:
  1. Update `app/prisma/schema.prisma`.
  2. Run `npm run db:push` to sync the SQLite database.
  3. (If applicable) Update `app/prisma/seed.ts` to include initial data for the new models.
- **Prisma Client**: Use the singleton instance exported from `app/lib/prisma.ts`. Do *not* instantiate `new PrismaClient()` in standard files.

### Key Models Context
- `Organization`: The top-level franchise entity.
- `Store`: Physical pet store locations (belongs to Organization).
- `User`: Staff members (belongs to Organization, optionally tied to a specific Store).
- `Product`: Global catalog items (belongs to Organization).
- `StoreInventory`: Store-specific stock quantities for Products.
- `Invoice`: Sales transactions.

## 🧩 Component Conventions

- Use functional components.
- Place reusable UI components in `app/components/` (or specific subdirectories like `app/components/inventory/`).
- Use the `lucide-react` library for all iconography. Example: `<ShoppingBag className="w-5 h-5" />`.
- Since we use raw CSS in `globals.css`, avoid inline styles where possible. Use semantic class names if defining new styles.

## 🔐 API & Server Actions

- Favor **Next.js Server Actions** for form submissions and simple mutations to keep the client light.
- Use **API Routes** (`app/app/api/.../route.ts`) primarily for external integrations (like webhooks) or complex client-side data fetching that cannot be easily done in Server Components.
- For data fetching, perform it directly in the Server Component `page.tsx` and pass data down as props to Client Components.

## 🔄 Updating Phase Completion

When completing a "phase" of work:
1. Ensure the code compiles (`npm run build`) and lints (`npm run lint`).
2. Update this `AGENTS.md` file if any new architectural patterns or major dependencies shift.
3. Commit the changes using semantic commit messages (e.g., `feat: implemented stock adjustments`, `fix: invoice calculation bug`).
4. Push all changes to the `main` branch on GitHub.

## 🤖 Instructions for Jules & Other Agents

1. **Read `README.md`**: For high-level project goals and getting-started steps.
2. **Read `schema.prisma`**: For the exact data shapes before generating database queries.
3. **Read `app/lib/auth.ts`**: To understand how the auth session provides `user.role`, `user.orgId`, and `user.storeId`.
4. **Follow the Route Structure**: Always respect the `/app/[role]/[feature]` directory pattern so dashboards remain isolated.

## 🏁 Completed Phases & Feature Log

As the codebase evolves, keeping track of completed modules helps provide context on what is already stable.

- **Phase 1: Project Setup & Authentication (✅ Completed)**
  - Initialized Next.js 16 with Prisma & NextAuth setup.
  - Multi-tenant data model implemented.
  - Role-based dashboard scaffolding (`/super-admin`, `/franchise`, `/store`).
- **Phase 2: Products & Inventory Management (✅ Completed)**
  - **Products**: Super Admin capabilities to create, edit, and view the global catalog (`app/app/super-admin/products`).
  - **Inventory**: Store and Franchise tracking views with low-stock alerts and Stock Adjustment Modals (`app/app/franchise/inventory`, `app/app/store/inventory`, `app/components/inventory`).
  - **Actions**: Server actions integrated for secure DB mutations (`app/app/actions`).
