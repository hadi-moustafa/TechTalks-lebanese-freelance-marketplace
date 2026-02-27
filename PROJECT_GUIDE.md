# LFM Project Guide — Complete Walkthrough for the Team

This document explains **every important file** in the Lebanese Freelance Marketplace (LFM) project: what each file does, line-by-line where useful, and how files relate to each other. Use it to onboard new developers or to clarify responsibilities.

**For line-by-line and block-by-block explanation of every file plus a full “related files” map, see [DEEP_DIVE_EVERY_FILE.md](./DEEP_DIVE_EVERY_FILE.md).**

---

## Table of Contents

1. [Project overview & tech stack](#1-project-overview--tech-stack)
2. [Directory structure](#2-directory-structure)
3. [Config & environment](#3-config--environment)
4. [Middleware (auth gate)](#4-middleware-auth-gate)
5. [Supabase clients (which to use where)](#5-supabase-clients-which-to-use-where)
6. [App Router & routes](#6-app-router--routes)
7. [Authentication flows](#7-authentication-flows)
8. [API routes](#8-api-routes)
9. [Services (business logic)](#9-services-business-logic)
10. [Lib (shared code)](#10-lib-shared-code)
11. [Components](#11-components)
12. [Role dashboards (admin, freelancer, client)](#12-role-dashboards-admin-freelancer-client)
13. [Database assumptions](#13-database-assumptions)
14. [File dependency map](#14-file-dependency-map)

---

## 1. Project overview & tech stack

- **What it is:** A freelance marketplace for Lebanese talent. Users sign up, choose a role (client or freelancer), and get redirected to role-specific dashboards. Admins have a separate dashboard (e.g. service approval).
- **Framework:** Next.js 16 (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS v4 (with custom theme in `globals.css`).
- **Backend / Auth / DB:** Supabase (Auth, Database, Storage, optional Realtime).
- **Email:** Nodemailer (SMTP) for OTP and password-related emails.

Important concepts:

- **Roles:** `admin` | `freelancer` | `client`. Stored in `public.users.role`.
- **Auth:** Supabase Auth (email/password + optional Google OAuth). Session is in cookies; middleware reads it and enforces routes by role.
- **Public schema:** `users` table mirrors auth users and adds `username`, `role`, `profile_pic`, `password_hash`, etc.

---

## 2. Directory structure

```
LFM-Local_Freelance_Marketplace/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, metadata, html/body)
│   ├── page.tsx                  # "/" → redirects to /signup
│   ├── globals.css               # Tailwind + theme (lira colors, animations)
│   ├── (auth)/                   # Route group (no segment in URL)
│   │   ├── login/
│   │   │   ├── page.tsx          # Login UI
│   │   │   └── actions.tsx       # Server actions: login, verify OTP, resend OTP
│   │   ├── signup/page.tsx      # Signup UI (OTP step + verify & create)
│   │   └── onboarding.tsx        # Legacy/welcome onboarding (see note below)
│   ├── onboarding/
│   │   └── page.tsx              # Role selection (client | freelancer) → sets users.role
│   ├── auth/
│   │   └── callback/route.ts     # OAuth callback: exchange code, sync user, redirect
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   └── _components/         # AdminProfileMenu, ServiceApproval
│   ├── freelancer/
│   │   ├── page.tsx              # Freelancer dashboard
│   │   └── _components/         # Navbar, Dashboard, ProfileMenu, create-service
│   ├── client/
│   │   ├── page.tsx              # Client dashboard
│   │   └── _components/         # ClientProfileMenu
│   ├── api/
│   │   ├── auth/                 # signout, signup, sync, otp/send, otp/verify
│   │   └── password/             # change, verify
│   ├── supabase/
│   │   ├── client.tsx            # Browser client + server admin client
│   │   └── server.tsx            # Server Supabase client (cookies)
│   └── test/                     # Test pages (admin, freelancer, client)
├── components/
│   ├── auth/                     # AuthCard, OTPModal
│   ├── profile/                  # UsernameChangeInput, PasswordChangeInput, ProfilePictureUpload
│   └── ui/                       # Button, Input
├── lib/
│   ├── supabase.ts               # Plain createClient (anon) — used by some services
│   ├── supabaseClient.ts         # createBrowserClient (SSR/cookies)
│   ├── types.tsx                 # Shared TS interfaces
│   ├── utils.ts                  # cn() for Tailwind
│   └── services/                 # send-test-email, email (sendOTPEmail)
├── services/                     # Business logic (email, password, username, profilePicture)
├── middleware.ts                 # Runs on every request: session + role routing
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs / eslint.config.mjs
```

**Note on onboarding:** The URL `/onboarding` is served by `app/onboarding/page.tsx` (role selection). The file `app/(auth)/onboarding.tsx` is a different welcome/placeholder page; with the current structure it does **not** get its own URL (route groups don’t add path segments). So the live “choose your role” flow is in `app/onboarding/page.tsx`.

---

## 3. Config & environment

### `package.json`

- **Scripts:** `dev`, `build`, `start`, `lint`, `test:email`, `test:smtp`.
- **Key deps:** `next`, `react`, `@supabase/ssr`, `@supabase/supabase-js`, `bcryptjs`, `nodemailer`, `otp-generator`, `react-hot-toast`, `lucide-react`, `tailwindcss`, etc.
- **Path alias:** `@/*` is set in `tsconfig.json` to `./*`, so `@/components/ui/Button` means `components/ui/Button.tsx`.

### `tsconfig.json`

- **paths:** `"@/*": ["./*"]` — all `@/` imports resolve from project root.
- **include:** `next-env.d.d.ts`, `**/*.ts`, `**/*.tsx`, and explicitly `app/supabase/client.tsx`, `test-env-email.ts`.

### `next.config.ts`

- **reactCompiler:** true.
- **env:** Exposes `SMTP_*` to the server so Nodemailer can use them.

### Environment variables (`.env.local`)

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- **SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` (and optionally `SMTP_FROM` for lib email).

---

## 4. Middleware (auth gate)

**File:** `middleware.ts`

Runs on every request (except static assets per `config.matcher`). It:

1. **Creates a Supabase server client** using request cookies (`getAll`) and response cookies (`setAll`) so session can be read/updated.
2. **Gets session:** `supabase.auth.getSession()`.
3. **No session:**
   - If path is under `/login`, `/signup`, `/auth`, `/auth/callback`, or `/api/auth` → allow.
   - Otherwise → redirect to `/login`.
4. **Has session:**
   - Fetches `users.role` and `users.is_suspended` for `session.user.id`.
   - If no user row or `role` is null → treat as new user: redirect to `/onboarding` (except when already on `/onboarding`).
   - If `is_suspended` → redirect to `/suspended`.
   - If user has a role:
     - On `/onboarding` → redirect to role dashboard (`/admin`, `/freelancer`, or `/client`).
     - On auth paths → redirect to role dashboard.
     - On `/` → redirect to role dashboard.
     - If path does **not** start with the role’s root (e.g. admin on `/freelancer`) → redirect to that role’s dashboard.

So: **middleware is the single place that enforces “logged in”, “has role”, and “can only access own role’s routes”.**

---

## 5. Supabase clients (which to use where)

The app has several Supabase client setups. Use the right one to avoid RLS/auth issues.

| File | Export | Use case |
|------|--------|----------|
| `app/supabase/client.tsx` | `supabase` | **Browser.** Cookie-based session, for client components (login, signup, profile menus, ServiceApproval). |
| `app/supabase/client.tsx` | `supabaseAdmin()` | **Server only.** Service role key; bypasses RLS. Used in API routes (signup, sync) and any server code that must act as “admin”. |
| `app/supabase/server.tsx` | `createClient()` | **Server.** Uses `next/headers` cookies; for Server Components or route handlers that need the current user’s session. |
| `lib/supabase.ts` | `supabase` | **Server or client.** Plain `createClient(url, anonKey)` — no cookie handling. Used by `services/` (username, password, profile picture) and API routes that don’t need the logged-in user (e.g. password verify when verifying by code). |
| `lib/supabaseClient.ts` | `supabase` | **Browser.** Same idea as `app/supabase/client` (createBrowserClient). Some profile menus or older code may import from here; prefer `app/supabase/client` for app router. |

**Rule of thumb:**

- **Client components:** `import { supabase } from '@/app/supabase/client'`.
- **Server actions / API routes that need current user:** create server client from `app/supabase/server.tsx` or use cookies in route.
- **API routes that create users or bypass RLS:** `supabaseAdmin()` from `app/supabase/client.tsx`.
- **Services that only need anon access (e.g. read/update `users` by id):** `lib/supabase.ts` is OK if RLS allows it; otherwise use server client or admin.

---

## 6. App Router & routes

- **`app/layout.tsx`**  
  Root layout: loads Geist fonts, sets `metadata`, wraps `children` in `<html>` / `<body>`. No auth logic.

- **`app/page.tsx`**  
  Root page: only `redirect("/signup")`. So visiting `/` sends users to signup.

- **`app/globals.css`**  
  Tailwind import, `@theme` with lira colors (e.g. `lira-green-1k`, `lira-text`), `.bg-lebanese-pattern`, keyframes for fade-in/slide-up, and `:root` vars for Lebanon branding.

---

## 7. Authentication flows

### 7.1 Login (`app/(auth)/login/`)

- **`page.tsx`** (client component):
  - Form: email + password.
  - Submit → `loginAction(formData)` (server action).
  - On success with `redirectTo` → `router.push(redirectTo)` (e.g. `/admin`, `/freelancer`, `/client`, or `/onboarding`).
  - If you later add OTP-for-login, `requiresOTP` would show OTP UI; OTP submit would call `verifyOTPAction` then redirect.
  - Also has “Sign in with Google” → `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: origin + '/auth/callback' })`.

- **`actions.tsx`** (server actions):
  - **`loginAction`:** Uses server Supabase client (cookies). `signInWithPassword`. On success, reads `users.role` for that user and returns `redirectTo`: `/admin`, `/freelancer`, `/client`, or `/onboarding` if no role.
  - **`verifyOTPAction`:** Reads OTP from cookie (set elsewhere, e.g. resend flow), checks email/code/expiry. On success deletes cookie and returns `redirectTo` based on `users.role` or `/onboarding`.
  - **`resendOTPAction`:** Generates new OTP, stores in cookie, sends email via `sendOTPEmail` from `lib/services/email`.

So: **login is email/password (+ optional OTP) and optionally Google; redirect depends on `users.role`.**

### 7.2 Signup (`app/(auth)/signup/page.tsx`)

- **Step 1:** Username, email, password. Submit → `POST /api/auth/otp/send` with `{ email }`. On success → step 2.
- **Step 2:** User enters OTP. Submit → `POST /api/auth/signup` with `{ email, password, username, otp }`. That route verifies OTP (Supabase RPC `verify_otp`), creates user in Supabase Auth (admin client, `email_confirm: true`), inserts row in `public.users` with `role: null`. Then the page calls `supabase.auth.signInWithPassword` and `router.push('/onboarding')`.

So: **signup = OTP by email → verify OTP → create auth user + public user → sign in → onboarding.**

### 7.3 OAuth callback (`app/auth/callback/route.ts`)

- **GET** with `?code=...` (and optional `?next=...`).
- Exchanges code for session with `exchangeCodeForSession(code)`.
- Then syncs to `public.users`: find by `id` or by `email`; if not found, inserts new row (username from metadata, `role: null`, `password_hash: 'oauth_provider_placeholder'`).
- Redirect:
  - New user → `/onboarding` (or `next` if provided).
  - Existing user with role and `next === '/onboarding'` → role dashboard.
  - Otherwise → `next` or `/onboarding`.

So: **Google (or other OAuth) lands here, then either new user goes to onboarding or existing user goes to dashboard.**

### 7.4 Onboarding (role selection)

- **`app/onboarding/page.tsx`** (client component):
  - User picks “Client” or “Freelancer”.
  - On continue: `supabase.auth.getUser()`, then `supabase.from('users').update({ role: selectedRole }).eq('id', user.id)`.
  - Redirects to `/client` or `/freelancer`.

**Note:** There is no “admin” choice here; admin users are typically created manually in DB or by a seed.

---

## 8. API routes

### Auth

- **`POST /api/auth/signout`**  
  Creates server Supabase client from cookies, calls `supabase.auth.signOut()` to clear session, returns `{ success: true }`. Profile menus call this then redirect to `/login`.

- **`POST /api/auth/signup`**  
  Body: `{ email, password, username, otp }`. Verifies OTP via Supabase RPC `verify_otp`; then uses `supabaseAdmin()` to create auth user (email_confirm: true) and insert into `public.users` (id, email, username, password_hash, role: null). Handles “already registered” by updating existing user.

- **`POST /api/auth/sync`**  
  Gets current user from cookie or Authorization header. Uses `supabaseAdmin()` to find/update or create `public.users` by id or email. Returns `{ role }` or `{ role: null }`. Used to keep public profile in sync with Auth (e.g. after OAuth).

- **`POST /api/auth/otp/send`**  
  Body: `{ email }`. Generates 6-digit OTP (otp-generator), stores it in Supabase via RPC `request_otp`, sends email via `services/emailService.sendEmail`. Returns success/error.

- **`POST /api/auth/otp/verify`**  
  Body: `{ email, otp }`. Calls Supabase RPC `verify_otp`. Returns `{ valid, message }`. Used by signup or other flows that need to verify OTP server-side.

### Password

- **`POST /api/password/change`**  
  Body: `{ userId, currentPassword, newPassword }`. Calls `PasswordService.initiatePasswordChange` (validates current password, generates code, stores in memory, sends verification email). Returns success and “verification required”.

- **`POST /api/password/verify`**  
  Body: `{ userId, code }`. Calls `PasswordService.verifyAndChangePassword` (checks code, updates `users.password_hash`), then sends confirmation email. Uses `lib/supabase` to read user for email content.

---

## 9. Services (business logic)

These are used by API routes and/or client components. They usually talk to Supabase or send email.

### `services/emailService.ts`

- **Class `EmailService`** (singleton exported as default and as `emailService`).
- Uses **nodemailer** with `SMTP_*` env vars.
- **`sendEmail({ to, subject, html, text? })`** — generic send.
- **`sendPasswordChangeVerification(email, username, verificationCode)`** — HTML template for “verify password change”.
- **`sendPasswordChangeConfirmation(email, username, role)`** — HTML template for “password changed”.
- **`testConnection()`** — verifies SMTP.

Used by: `/api/auth/otp/send`, `/api/password/change`, `/api/password/verify`.

### `services/passwordService.ts`

- Uses **`lib/supabase`** to read/update `users` (password_hash).
- **In-memory store** for verification codes (userId → { code, expiresAt, newPassword }). So codes are lost on server restart; for production you’d use Redis or DB.
- **`initiatePasswordChange(userId, currentPassword, newPassword)`:** Validates new password, checks current password (currently **plain text** comparison for testing — see comments for bcrypt version), generates code, stores in Map, returns code + email/username for sending email.
- **`verifyAndChangePassword(userId, code)`:** Checks code and expiry, updates `users.password_hash` with stored new password (plain text in current “testing” version), clears stored data.
- **`validatePassword`** — length, upper/lower/number/special.
- **`getUserRole(userId)`** — returns `users.role`.

Used by: `/api/password/change`, `/api/password/verify`.

### `services/usernameService.ts`

- Uses **`lib/supabase`**.
- **`updateUsername(userId, newUsername)`:** Validates username, checks uniqueness (other users), updates `users.username`, returns new username.
- **`getUsername(userId)`** — returns `users.username`.
- **`validateUsername`** — length 3–30, alphanumeric/underscore/hyphen, must start with letter/number.

Used by: profile menus and `UsernameChangeInput` component.

### `services/profilePictureService.ts`

- Uses **`lib/supabase`** (storage + `users.profile_pic`).
- **`uploadProfilePicture(userId, file)`:** Validates image type/size, deletes old file from bucket if any, uploads to `profile-pictures` bucket as `userId/timestamp.ext`, gets public URL, updates `users.profile_pic`.
- **`deleteProfilePicture(userId)`** — removes from storage and sets `profile_pic` to null.
- **`getProfilePicture(userId)`** — returns URL.
- **`deleteImageFromStorage(imageUrl)`** — helper to parse URL and remove from bucket.

Used by: `ProfilePictureUpload` component.

---

## 10. Lib (shared code)

- **`lib/types.tsx`** — Interfaces: `User`, `OTPVerification`, `LoginCredentials`, `OTPVerificationRequest`, `ApiResponse<T>`.
- **`lib/utils.ts`** — `cn(...inputs)` using `clsx` + `tailwind-merge` for class names.
- **`lib/services/email.tsx`** — Server-side nodemailer transporter and **`sendOTPEmail({ email, otp, userName })`** used by login resend OTP and similar. Different from `services/emailService.ts` (which is used by API routes and has more templates).

---

## 11. Components

### UI

- **`components/ui/Button.tsx`** — Props: `variant` (default | social | outline | ghost), `size` (sm | md | lg), `loading`, `disabled`, etc. Renders a button with Tailwind; “social” for OAuth-style buttons.
- **`components/ui/Input.tsx`** — Label, optional icon, error message; forwards rest props to `<input>`. Used in login, signup, profile forms.

### Auth

- **`components/auth/AuthCard.tsx`** — Full-screen card with background image (Lebanese skyline), optional image side, title, subtitle. Wraps login/signup/onboarding content.

### Profile

- **`components/profile/UsernameChangeInput.tsx`** — Displays current username; edit mode calls `UsernameService.updateUsername`, then `onUpdate(newUsername)`.
- **`components/profile/PasswordChangeInput.tsx`** — Current password, new password, confirm; calls `POST /api/password/change`, then shows verification code input and calls `POST /api/password/verify`. Uses strength indicator and toasts.
- **`components/profile/ProfilePictureUpload.tsx`** — Shows avatar or placeholder; file input triggers `ProfilePictureService.uploadProfilePicture`, updates local state and optional `onUpdate(url)`.

These profile components are used inside **Admin**, **Freelancer**, and **Client** profile menus (each menu passes its own `userId` and optional props).

---

## 12. Role dashboards (admin, freelancer, client)

### Admin

- **`app/admin/page.tsx`** — Layout: header “Admin Dashboard”, `AdminProfileMenu`, and main content area with **`ServiceApproval`**.
- **`app/admin/_components/AdminProfileMenu.tsx`** — Dropdown: profile picture upload, username change, password change, dark mode/language placeholders, sign out. Uses hardcoded admin userId for demo (`e5c7a983-...`). Sign out: `supabase.auth.signOut()`, then `POST /api/auth/signout`, then `window.location.href = '/login'`.
- **`app/admin/_components/ServiceApproval.tsx`** — Client component. Uses **Supabase client** (createClient with anon key in file) to:
  - **Fetch:** `from('services').select('*, users:freelancer_id (username, email), categories:category_id (name)').eq('status', 'pending')`.
  - **Approve:** `update({ status: 'approved' }).eq('id', id)`.
  - **Reject:** `update({ status: 'rejected', rejection_reason }).eq('id', id)`.
  - Renders list with approve/reject buttons and rejection reason textarea. So **admin service approval talks to Supabase directly from the browser** (RLS must allow read/update for admin or anon if you use anon).

### Freelancer

- **`app/freelancer/page.tsx`** — Renders `FreelancerNavbar` and `FreelancerDashboard` (and layout with pattern background).
- **`_components/FreelancerNavbar.tsx`** / **`FreelancerDashboard.tsx`** / **`FreelancerProfileMenu.tsx`** — Define the freelancer UI and profile menu (same pattern: profile picture, username, password, sign out). May use a hardcoded freelancer userId in places; later you’d use session.

### Client

- **`app/client/page.tsx`** — Header “Client Portal” and `ClientProfileMenu`; main area is placeholder “Under Construction”.
- **`_components/ClientProfileMenu.tsx`** — Same idea as admin/freelancer profile menu (username, password, sign out).

---

## 13. Database assumptions

The code assumes at least:

- **`public.users`**  
  Columns used: `id` (uuid, matches Supabase Auth), `email`, `username`, `role` (admin | freelancer | client), `profile_pic`, `password_hash`, `is_suspended`, `updated_at`, etc.

- **Supabase RPCs**  
  - **`request_otp(p_email, p_code)`** — Stores OTP for email (e.g. in a table or edge function).  
  - **`verify_otp(p_email, p_code)`** — Returns boolean (valid/expired).  
  Signup and OTP send/verify depend on these.

- **`public.services`** (for admin approval)  
  Columns: `id`, `title`, `description`, `price`, `status` (e.g. pending | approved | rejected), `rejection_reason`, `created_at`, `freelancer_id`, `category_id`. Optional FK to `users` and `categories` for the select in ServiceApproval.

- **Storage**  
  Bucket **`profile-pictures`** for profile images; public URLs stored in `users.profile_pic`.

RLS policies must allow:
- Logged-in user to read/update own row in `users`.
- Admin (or anon if used) to read and update `services` for approval (depending on how you wire ServiceApproval).

---

## 14. File dependency map

High-level flow:

- **Middleware** → uses Supabase server client (cookies) and `users` table → controls access to all routes.
- **Login** → `loginAction` (server Supabase + `users.role`) → redirect.
- **Signup** → `/api/auth/otp/send` (RPC + emailService) → `/api/auth/signup` (verify_otp RPC + supabaseAdmin + users insert) → client `signInWithPassword` → `/onboarding`.
- **Onboarding** → `app/onboarding/page.tsx` → Supabase client `users.update({ role })` → redirect to `/client` or `/freelancer`.
- **OAuth** → `/auth/callback` → exchange code → sync to `users` → redirect.
- **Profile menus** → `UsernameChangeInput` (UsernameService), `PasswordChangeInput` (API password change/verify), `ProfilePictureUpload` (ProfilePictureService), sign out (client signOut + `/api/auth/signout`).
- **Admin** → `ServiceApproval` → Supabase client → `services` table (pending list, approve/reject).

Key cross-file links:

- **Auth + DB:** Login/signup/callback and middleware all depend on `public.users` and Supabase Auth.
- **Profile:** AdminProfileMenu, FreelancerProfileMenu, ClientProfileMenu share the same profile components and services; only `userId` (and styling) differ.
- **Email:** OTP and password flows use `services/emailService.ts` or `lib/services/email.tsx`; both use SMTP env vars.

---

## Quick reference for your team

| I want to… | Look at / use |
|------------|----------------|
| Change what happens after login | `app/(auth)/login/actions.tsx` (loginAction), `middleware.ts` (redirect by role). |
| Change signup or OTP | `app/(auth)/signup/page.tsx`, `/api/auth/otp/send`, `/api/auth/signup`, Supabase RPCs `request_otp` / `verify_otp`. |
| Change role selection | `app/onboarding/page.tsx`. |
| Restrict who can access which URL | `middleware.ts` only. |
| Add a new API route | `app/api/...`; use `supabaseAdmin()` or server client as needed. |
| Send email | `services/emailService.ts` or `lib/services/email.tsx`; set SMTP in `.env.local`. |
| Change password flow | `services/passwordService.ts`, `/api/password/change`, `/api/password/verify`, `PasswordChangeInput`. |
| Change username or profile picture | `services/usernameService.ts`, `services/profilePictureService.ts`, and profile components. |
| Change admin service approval | `app/admin/_components/ServiceApproval.tsx` and `public.services` + RLS. |
| Use Supabase in browser | `import { supabase } from '@/app/supabase/client'`. |
| Use Supabase on server with current user | `app/supabase/server.tsx` createClient(). |
| Use Supabase on server as admin | `supabaseAdmin()` from `app/supabase/client.tsx`. |

If you want, the next step can be a short “developer checklist” (e.g. env vars, DB migrations, RLS) or a one-page diagram of the auth and role flows.
