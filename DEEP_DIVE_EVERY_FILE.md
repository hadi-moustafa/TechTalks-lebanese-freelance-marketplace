# LFM — Deep Dive: Every File Explained (Line by Line)

This document explains **every file** in the project in deep detail: what each line or block does, and how files relate to each other. Use it to understand the codebase completely.

---

## Table of Contents

1. [Config & root files](#1-config--root-files)
2. [Middleware](#2-middleware)
3. [Supabase clients](#3-supabase-clients)
4. [App layout & global styles](#4-app-layout--global-styles)
5. [Authentication (login, signup, callback, onboarding)](#5-authentication)
6. [API routes](#6-api-routes)
7. [Services](#7-services)
8. [Lib (types, utils, email)](#8-lib)
9. [UI & auth components](#9-ui--auth-components)
10. [Profile components](#10-profile-components)
11. [Admin, Freelancer, Client pages & components](#11-admin-freelancer-client)
12. [Related-files map](#12-related-files-map)

---

## 1. Config & root files

### `package.json`

| Line / block | What it does |
|--------------|--------------|
| `"name": "lfm-temp"` | Project name (npm package name). |
| `"scripts"` | `dev` runs Next.js dev server; `build` / `start` for production; `lint` runs ESLint; `test:email` and `test:smtp` run small scripts that need `ts-node` and a separate tsconfig. |
| `"dependencies"` | **Next.js** and **React** for the app; **@supabase/ssr** and **@supabase/supabase-js** for auth and DB; **bcryptjs** for password hashing (used in signup API); **nodemailer** and **resend** for email; **otp-generator** for 6-digit OTP; **react-hot-toast** for toasts; **lucide-react** for icons; **Tailwind**-related packages; **clsx** and **tailwind-merge** for the `cn()` helper in `lib/utils.ts`. |
| `"devDependencies"` | TypeScript, type defs, ESLint, Tailwind, PostCSS, ts-node for running test scripts. |

**Related:** All other files depend on these packages. `tsconfig.json` uses the path alias that matches `@/*`.

---

### `tsconfig.json`

| Line / block | What it does |
|--------------|--------------|
| `"paths": { "@/*": ["./*"] }` | So `@/components/ui/Button` resolves to `components/ui/Button.tsx` from the project root. |
| `"include"` | Which files TypeScript compiles; includes `next-env.d.d.ts`, all `.ts`/`.tsx`, and explicitly `app/supabase/client.tsx` and `test-env-email.ts`. |
| `"exclude": ["node_modules"]` | Don’t type-check dependencies. |

**Related:** Every file that uses `@/` imports relies on this.

---

### `next.config.ts`

| Line / block | What it does |
|--------------|--------------|
| `reactCompiler: true` | Enables React Compiler (optimizations). |
| `env: { SMTP_USER, ... }` | Exposes these env vars to the **server** (Node) so Nodemailer in `services/emailService.ts` and email routes can read them. Client-side code only sees `NEXT_PUBLIC_*`. |

**Related:** `services/emailService.ts`, `lib/services/email.tsx`, and any API route that sends email.

---

## 2. Middleware

**File:** `middleware.ts`

This runs on **every request** (except static assets — see `config.matcher` at the bottom). It decides: allow, redirect to login, redirect to onboarding, or redirect to role dashboard.

| Line(s) | What it does |
|---------|--------------|
| `import { NextResponse } from "next/server"` | Next.js helper to build the response (including redirects). |
| `import type { NextRequest } from "next/server"` | Type for the incoming request. |
| `import { createServerClient } from "@supabase/ssr"` | Supabase client that can read/write **cookies** so the session is available on the server. |
| `const res = NextResponse.next()` | Default: let the request continue (we’ll mutate `res` to set cookies). |
| `const path = req.nextUrl.pathname` | Current URL path (e.g. `/admin`, `/login`). |
| `const authPaths = ["/login", "/signup", "/auth", "/auth/callback", "/api/auth"]` | Paths that are “auth-related”; unauthenticated users are **allowed** to hit these; authenticated users with a role are **redirected away** from these. |
| `createServerClient(...)` | Builds Supabase with cookie getters/setters: `getAll()` reads from the request, `setAll()` writes to the **response** so the browser gets updated cookies (e.g. after session refresh). |
| `await supabase.auth.getSession()` | Gets the current session from cookies. If the user logged in (or completed OAuth), this returns their session. |
| `if (!session)` | **Not logged in.** If path **starts with** any of `authPaths` → return `res` (allow). Otherwise → `NextResponse.redirect(new URL("/login", req.url))` so they must log in. |
| `const { data: user } = await supabase.from("users").select("role, is_suspended").eq("id", session.user.id).single()` | Fetch this user’s row from `public.users` to get their **role** and **suspended** flag. |
| `if (!user \|\| !user.role)` | No row or role is null → treat as **new user**. If not already on `/onboarding`, redirect to `/onboarding`. So new signups and OAuth users without a role land here. |
| `if (user.is_suspended)` | Redirect to `/suspended`. |
| `if (path.startsWith("/onboarding"))` and user has role | They already have a role; don’t let them stay on onboarding. Redirect to their dashboard (`/admin`, `/freelancer`, or `/client`). |
| `if (authPaths.some(p => path.startsWith(p)))` and user has role | Logged-in user tried to open login/signup/etc. Redirect to their dashboard. |
| `const allowedRoot = roleRoutes[user.role]` | Map role to the only base path they’re allowed: admin → `/admin`, freelancer → `/freelancer`, client → `/client`. |
| `if (path === "/")` | Root URL → redirect to their dashboard. |
| `if (!path.startsWith(allowedRoot))` | They’re trying to access another role’s area (e.g. admin opening `/freelancer`). Redirect to **their** dashboard. |
| `return res` | Request is allowed (correct role, correct path). |
| `export const config = { matcher: ["/((?!_next/static\|_next/image\|favicon.ico\|images\|assets).*)"] }` | Run this middleware for all routes **except** static files and images (better performance). |

**Related:**  
- **Supabase:** uses same env vars as `app/supabase/client.tsx` (URL + anon key).  
- **Database:** reads `public.users` (role, is_suspended).  
- **Routes:** All of `app/(auth)/login`, `app/(auth)/signup`, `app/onboarding`, `app/admin`, `app/freelancer`, `app/client`, `app/auth/callback` are affected by these redirects.

---

## 3. Supabase clients

### `app/supabase/client.tsx`

| Line(s) | What it does |
|---------|--------------|
| `import { createBrowserClient } from '@supabase/ssr'` | Builds a Supabase client that stores the session in **cookies** and works in the browser (and with SSR when the page loads). |
| `import { createClient } from '@supabase/supabase-js'` | Plain Supabase client; used here only for **admin** (service role). |
| `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL \|\| '...'` | Public URL of your Supabase project. |
| `const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY \|\| '...'` | Public anon key (safe to use in browser; RLS applies). |
| `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!` | **Secret** key that bypasses RLS. Must only run on the server. |
| `export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)` | **Main client for the browser.** Use this in Client Components (login page, signup, profile menus, ServiceApproval, onboarding). It sends cookies with requests so Supabase knows the current user. |
| `export const supabaseAdmin = () => { ... }` | Function that **returns** a Supabase client with the **service role** key. It throws if called in the browser (`typeof window !== 'undefined'`). Use in **API routes** or server code when you need to create users, bypass RLS, or sync `public.users`. |

**Related:**  
- **Used by:** Login page (Google OAuth), signup page (signIn after signup), onboarding (getUser + update users), AdminProfileMenu (signOut + optional getUser), ServiceApproval (fetch/update services), FreelancerDashboard (getUser + services), auth callback (if it ever used a client here — currently callback uses its own createServerClient).  
- **supabaseAdmin used by:** `app/api/auth/signup/route.ts`, `app/api/auth/sync/route.ts`.

---

### `app/supabase/server.tsx`

| Line(s) | What it does |
|---------|--------------|
| `import { createServerClient } from '@supabase/ssr'` | Supabase client that uses **Next.js server** cookies (from `next/headers`). |
| `import { cookies } from 'next/headers'` | Access to the current request’s cookies. |
| `export async function createClient()` | Async because `cookies()` is async in Next 15. Returns a Supabase client that reads/writes cookies for the **current request**. Use in **Server Components** or **Route Handlers** when you need the logged-in user’s session on the server. |
| `getAll()` | Passes through `cookieStore.getAll()` so Supabase can read auth cookies. |
| `setAll(cookiesToSet)` | Writes cookies back via `cookieStore.set(...)`. The try/catch is there because in some Server Component contexts you can’t set cookies (middleware handles refresh instead). |

**Related:** Used when you need “current user” in a Server Component or API route that uses this helper. Login **server actions** use their own `createServerClient` with `cookies()` instead of this file; you could refactor to use this for consistency.

---

### `lib/supabase.ts`

| Line(s) | What it does |
|---------|--------------|
| `import { createClient } from '@supabase/supabase-js'` | Plain Supabase client (no cookie handling). |
| `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!` | Same public URL. |
| `const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` | Same anon key. |
| `if (!supabaseUrl \|\| !supabaseAnonKey) { throw new Error(...) }` | Fail fast if env is missing. |
| `export const supabase = createClient(supabaseUrl, supabaseAnonKey)` | One shared instance. No cookies — so it doesn’t automatically send the “current user.” Use for **server-side** code that doesn’t need the session (e.g. services that take `userId` as argument) or for **anonymous** operations. RLS still applies. |

**Related:**  
- **Used by:** `services/usernameService.ts`, `services/passwordService.ts`, `services/profilePictureService.ts`, and `app/api/password/verify/route.ts` (to read user for confirmation email).  
- **Difference from `app/supabase/client`:** Browser client = cookies + current user. This one = no cookies, so you must pass user id explicitly.

---

### `lib/supabaseClient.ts`

| Line(s) | What it does |
|---------|--------------|
| `import { createBrowserClient } from "@supabase/ssr"` | Same as `app/supabase/client.tsx`. |
| `export const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)` | Another **browser** Supabase client. Functionally the same as the one in `app/supabase/client.tsx`. |

**Related:** **FreelancerProfileMenu** imports from here (`@/lib/supabaseClient`). Rest of the app uses `@/app/supabase/client`. You could standardize on one to avoid confusion.

---

## 4. App layout & global styles

### `app/layout.tsx`

| Line(s) | What it does |
|---------|--------------|
| `import type { Metadata } from "next"` | Type for the exported `metadata` object. |
| `import { Geist, Geist_Mono } from "next/font/google"` | Loads Google fonts. |
| `import "./globals.css"` | Applies global CSS (Tailwind + your theme) to every page. |
| `const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })` | Configures Geist sans-serif and exposes it as a CSS variable. |
| `const geistMono = Geist_Mono({ ... })` | Same for monospace. |
| `export const metadata: Metadata = { title: "Create Next App", description: "..." }` | Default title/description for the app (you can change to “LFM” etc.). |
| `export default function RootLayout({ children })` | Root layout: wraps **every** page. |
| `<html lang="en">` | Root HTML element. |
| `<body className={...}>` | Applies font variables and antialiasing. `children` is the current page (e.g. login, admin, freelancer). |

**Related:** Every route under `app/` is wrapped by this layout. No auth logic here — that’s all in middleware.

---

### `app/page.tsx`

| Line(s) | What it does |
|---------|--------------|
| `import { redirect } from "next/navigation"` | Server-side redirect helper. |
| `export default function Home()` | This is the **root page** (route `/`). |
| `redirect("/signup")` | Anyone visiting `/` is immediately sent to `/signup`. So the “home” of the app is the signup page. |

**Related:** Middleware runs first. If the user is logged in with a role, middleware will redirect `/` to their dashboard before this page runs. So this redirect mainly affects **not logged in** users.

---

### `app/globals.css`

| Line(s) | What it does |
|---------|--------------|
| `@import "tailwindcss"` | Tailwind v4 entry. |
| `@theme { --color-lira-green-1k: ...; ... }` | Defines custom Tailwind colors (lira palette) so you can use `bg-lira-green-1k`, `text-lira-text`, etc. |
| `@layer utilities { .bg-lebanese-pattern { ... } }` | Custom utility: dot-pattern background used on admin/freelancer/client dashboards. |
| `:root { --background, --foreground, --lebanon-red, --lebanon-green, --cedar-dark }` | CSS variables for theming. |
| `@theme inline { ... }` | More Tailwind theme: maps these vars into Tailwind’s theme and defines keyframes `fade-in`, `slide-up`. |
| `@media (prefers-color-scheme: dark)` | Dark mode vars (optional). |
| `body { ... }` | Default background, color, font for the whole app. |

**Related:** Any component that uses classes like `lira-green-1k`, `lebanon-green`, `bg-lebanese-pattern`, or animations depends on this file.

---

## 5. Authentication

### `app/(auth)/login/page.tsx`

**Purpose:** Login form (email + password) and optional OTP step; Google OAuth button.

| Line(s) | What it does |
|---------|--------------|
| `'use client'` | This is a Client Component (uses state, event handlers). |
| `useState` for email, password, loading, otpSent, otp, resendLoading | Form state and UI state (which step, loading). |
| `loginAction(formData)` | **Server Action** from `./actions.tsx`. It runs on the server: signs in with Supabase, reads `users.role`, returns `redirectTo` (e.g. `/admin`) or `requiresOTP`. |
| If `result.redirectTo` | Login succeeded and user has a role (or no role → onboarding). Redirect with `router.push(result.redirectTo)`. |
| If `result.requiresOTP` | (If you add OTP-for-login later) show OTP form. |
| `handleOTPSubmit` | Calls `verifyOTPAction(formData)` then redirects to `result.redirectTo`. |
| `handleResendOTP` | Calls `resendOTPAction(formData)`; server sends new OTP email and stores in cookie. |
| OAuth button | `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback' } })`. User goes to Google, then back to `/auth/callback`. |
| `<AuthCard>`, `<Input>`, `<Button>` | Shared UI components. |

**Related:**  
- **actions.tsx** (loginAction, verifyOTPAction, resendOTPAction).  
- **AuthCard, Input, Button** (components).  
- **supabase** from `@/app/supabase/client` (OAuth).  
- **Middleware** redirects logged-in users away from `/login` to their dashboard.

---

### `app/(auth)/login/actions.tsx`

**Purpose:** Server Actions for login, OTP verify, and OTP resend. Run on the server and have access to cookies.

| Line(s) | What it does |
|---------|--------------|
| `'use server'` | All exports are Server Actions (can be called from client). |
| `loginAction(formData)` | Reads `email` and `password` from formData. Creates Supabase server client with `cookies()`. Calls `supabase.auth.signInWithPassword({ email, password })`. On success, selects `users.role` for `data.user.id`. Sets `redirectTo` to `/admin`, `/freelancer`, `/client`, or `/onboarding` if no role. Returns `{ success, message, redirectTo, requiresOTP: false }`. On error returns `{ success: false, message }`. |
| `verifyOTPAction(formData)` | Reads OTP from **cookie** (set by resend or another flow). Compares email, code, expiry. If valid, deletes cookie. Then gets session and user role, returns `redirectTo` by role or `/onboarding`. |
| `resendOTPAction(formData)` | Generates 6-digit OTP, stores in cookie with expiry (10 min). Calls `sendOTPEmail` from `@/lib/services/email` to send email. Returns success and optionally the OTP (for dev). |

**Related:**  
- **Login page** calls these.  
- **lib/services/email.tsx** (`sendOTPEmail`).  
- **Supabase** (server client with cookies) and **public.users** (role).

---

### `app/(auth)/signup/page.tsx`

**Purpose:** Two-step signup: (1) send OTP to email, (2) enter OTP and create account.

| Line(s) | What it does |
|---------|--------------|
| `step` state 1 or 2 | Step 1 = form (username, email, password); step 2 = OTP input. |
| `handleSendOTP` | POST `/api/auth/otp/send` with `{ email }`. On success sets `setStep(2)`. |
| `handleVerifyAndSignup` | POST `/api/auth/signup` with `{ email, password, username, otp }`. That API verifies OTP (Supabase RPC), creates Auth user (admin client), inserts `public.users`. Then this page calls `supabase.auth.signInWithPassword(...)` so the user is logged in, then `router.push('/onboarding')`. |
| Google button | `signInWithOAuth` with `redirectTo: .../auth/callback?next=/onboarding` so after OAuth they go to callback then onboarding. |

**Related:**  
- **API:** `/api/auth/otp/send`, `/api/auth/signup`.  
- **supabase** from `@/app/supabase/client` (signIn after signup, OAuth).  
- **AuthCard, Input, Button.**

---

### `app/auth/callback/route.ts`

**Purpose:** OAuth callback. Google (or other provider) redirects here with `?code=...`. Exchange code for session, sync user to `public.users`, redirect.

| Line(s) | What it does |
|---------|--------------|
| `GET(request)` | Only handles GET (callback is a redirect with query params). |
| `const code = searchParams.get("code")` | Auth code from Supabase/OAuth. |
| `const next = searchParams.get("next") ?? "/onboarding"` | Where to send user after (default onboarding). |
| `createServerClient` with cookies | So we can store the session in cookies when we call `exchangeCodeForSession`. |
| `await supabase.auth.exchangeCodeForSession(code)` | Exchanges the one-time code for a real session; session is written to cookies via setAll. |
| Lookup user in `public.users` by `user.id` | If found → existing user. |
| If not found by id, lookup by `user.email` (ilike) | Handles case where auth id differs (e.g. different OAuth provider same email). |
| If no existing user | Insert new row: `id`, `email`, `username` from metadata, `profile_pic`, `password_hash: 'oauth_provider_placeholder'`, `role: null`. Redirect to `origin/onboarding` (or `next`). |
| If existing user has role and next is onboarding | Redirect to their **dashboard** (`/admin`, `/freelancer`, `/client`) instead of onboarding. |
| Otherwise | Redirect to `next` (e.g. `/onboarding`). |
| No code or error | Redirect to `origin/auth/auth-code-error`. |

**Related:**  
- **Supabase Auth** (exchangeCodeForSession).  
- **public.users** (select + insert).  
- **Middleware** will then allow `/onboarding` or role dashboard based on `users.role`.

---

### `app/onboarding/page.tsx` (role selection)

**Purpose:** Let the user choose “Client” or “Freelancer” and save it to `public.users.role`, then redirect to the right dashboard.

| Line(s) | What it does |
|---------|--------------|
| `'use client'` | Client Component. |
| `selectedRole` state: `'client' \| 'freelancer' \| null` | Which card is selected. |
| `handleRoleSelection(role)` | Sets `setSelectedRole(role)`. |
| `handleContinue` | If no selection, return. Gets current user with `supabase.auth.getUser()`. If no user, toasts and redirects to `/login`. Then `supabase.from('users').update({ role: selectedRole }).eq('id', user.id)`. On success toasts and redirects: client → `/client`, freelancer → `/freelancer`. |
| JSX | Two cards (Client / Freelancer) with Briefcase and User icons; selected state shows green/red border and CheckCircle. Continue button disabled until a role is selected and not loading. |

**Related:**  
- **Supabase** from `@/app/supabase/client` (getUser, update users).  
- **AuthCard, Button.**  
- **Middleware** allows `/onboarding` only when user has no role; after update, next request will have role and middleware will allow `/client` or `/freelancer`.

---

### `app/(auth)/onboarding.tsx` (welcome page — likely unused)

**Purpose:** A **welcome** onboarding page with “Complete Profile,” “Set Preferences,” “Get Started” and buttons to “Complete My Profile” (`/profile/setup`) or “Skip to Dashboard” (`/dashboard`).  

**Important:** In the App Router, the **route** for a file under `(auth)` is the path **without** the group name. So `(auth)/onboarding.tsx` would be at **`/onboarding`**. But you also have **`app/onboarding/page.tsx`**, which is the **folder** route for `/onboarding`. In Next.js, **`app/onboarding/page.tsx` wins** for the path `/onboarding`. So **this file `(auth)/onboarding.tsx` is never reached** unless you have a different route that points to it (e.g. a link to a route that doesn’t exist). So in practice, **only `app/onboarding/page.tsx` (role selection) is the live onboarding**.

| Line(s) | What it does |
|---------|--------------|
| `useEffect` | Checks `document.cookie.includes('session')`; if no session, redirects to `/login` and toasts. |
| Rest | Static welcome UI and two buttons (profile/setup and dashboard). |

**Related:** None in current flow; can be removed or repurposed.

---

## 6. API routes

### `app/api/auth/signout/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(req)` | Creates server Supabase client with cookies. Calls `supabase.auth.getSession()`. If session exists, calls `supabase.auth.signOut()` so Supabase clears the session and updates cookies. Returns `NextResponse.json({ success: true })`. |

**Related:** Called by **AdminProfileMenu**, **FreelancerProfileMenu**, **ClientProfileMenu** before redirecting to `/login`.

---

### `app/api/auth/signup/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(req)` | Body: `email`, `password`, `username`, `otp`. |
| Validates all four present | Else 400. |
| Calls Supabase RPC `verify_otp(p_email, p_code)` with anon client | If error or !isValid, returns 400/500. |
| Hashes password with `bcrypt.hash(password, 10)` | For storing in `public.users.password_hash`. |
| `supabaseAdmin()` | Gets admin client. |
| `admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username } })` | Creates the user in Supabase Auth (no email confirmation needed). |
| If createError is “already registered” (or 422) | Finds user by listing users, updates them (confirm, password, metadata), upserts into `public.users` with hashed password. Returns success. |
| Else on success | Inserts into `public.users`: id from `user.user.id`, email, username, password_hash, role: null. Returns success. |

**Related:**  
- **Signup page** calls this after OTP step.  
- **Supabase:** RPC `verify_otp`, Auth admin API, table `public.users`.  
- **app/supabase/client.tsx** (`supabaseAdmin`).

---

### `app/api/auth/sync/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(req)` | Gets current user from Authorization header (Bearer token) or from cookies (createServerClient). If no user, returns 401. |
| Uses `supabaseAdmin()` to read/update `users` | Find by id; if found, update username/profile_pic/updated_at and return `{ role }`. Else find by email (ilike); if found return role. Else insert new row (id, email, username from metadata, profile_pic, password_hash placeholder, role null) and return `{ role: null }`. |

**Related:** Can be called by client to “sync” auth user to `public.users` (e.g. after OAuth or profile change). Used sparingly in current codebase; middleware and callback do most of the sync.

---

### `app/api/auth/otp/send/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(req)` | Body: `{ email }`. Generates 6-digit OTP with `otpGenerator.generate(6, { upperCaseAlphabets: false, ... })`. |
| Creates plain Supabase client (anon) | Calls RPC `request_otp(p_email, p_code)` to store OTP in DB. |
| `emailService.sendEmail(...)` | Sends email with “Your LFM Verification Code” and the OTP. Returns 200 or 500. |

**Related:**  
- **Signup page** (step 1).  
- **services/emailService.ts.**  
- **Supabase** RPC `request_otp`.

---

### `app/api/auth/otp/verify/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(req)` | Body: `{ email, otp }`. Calls Supabase RPC `verify_otp(p_email, p_code)`. Returns `{ valid, message }` or error. |

**Related:** Could be used by signup or other flows; signup currently verifies OTP inside `/api/auth/signup` via the same RPC.

---

### `app/api/password/change/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(request)` | Body: `userId`, `currentPassword`, `newPassword`. Calls `PasswordService.initiatePasswordChange(...)`. If success and service returns verificationCode/email/username, sends email via `EmailService.sendPasswordChangeVerification(...)`. Returns `{ success, message, verificationRequired: true }` or error. |

**Related:**  
- **PasswordChangeInput** component.  
- **services/passwordService.ts**, **services/emailService.ts**.

---

### `app/api/password/verify/route.ts`

| Line(s) | What it does |
|---------|--------------|
| `POST(request)` | Body: `userId`, `code`. Calls `PasswordService.verifyAndChangePassword(userId, code)`. If success, loads user from `public.users` with `lib/supabase` to get email/username/role, then sends confirmation email via `EmailService.sendPasswordChangeConfirmation(...)`. Returns success or error. |

**Related:**  
- **PasswordChangeInput** (verification step).  
- **PasswordService**, **EmailService**, **lib/supabase**.

---

## 7. Services

### `services/emailService.ts`

| Line(s) | What it does |
|---------|--------------|
| `nodemailer.createTransport({ host, port, secure, auth: { user, pass } })` | Uses env `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`. |
| `sendEmail({ to, subject, html, text? })` | Sends one email; `text` defaults to stripped HTML. |
| `sendPasswordChangeVerification(email, username, verificationCode)` | Uses HTML template with the code, sends via sendEmail. |
| `sendPasswordChangeConfirmation(email, username, role)` | Uses HTML template “Password changed” with timestamp. |
| `stripHtml(html)` | Removes tags for plain-text fallback. |
| `testConnection()` | `transporter.verify()` for health check. |

**Related:** Used by **api/auth/otp/send**, **api/password/change**, **api/password/verify**.

---

### `services/passwordService.ts`

| Line(s) | What it does |
|---------|--------------|
| `private verificationCodes: Map<string, { code, expiresAt, newPassword }>` | In-memory store: userId → verification data. **Not persistent** across restarts. |
| `initiatePasswordChange(userId, currentPassword, newPassword)` | Validates new password (length, upper, lower, number, special). Fetches user from `users` by id. **Compares currentPassword with user.password_hash as plain text** (comment says for testing). If match, generates 6-digit code, stores in Map with 10-min expiry and **plain newPassword**. Returns code + email/username for sending email. |
| `verifyAndChangePassword(userId, code)` | Gets stored data for userId; checks expiry and code; updates `users.password_hash` with stored newPassword (plain); deletes from Map; returns success. |
| `validatePassword` | Enforces 8+ chars, upper, lower, number, special. |
| `getUserRole(userId)` | Selects `users.role` for userId. |

**Related:**  
- **lib/supabase** (read/update users).  
- **api/password/change**, **api/password/verify**.  
- **PasswordChangeInput** (UI that calls those APIs).

---

### `services/usernameService.ts`

| Line(s) | What it does |
|---------|--------------|
| `updateUsername(userId, newUsername)` | Validates with `validateUsername` (3–30 chars, alphanumeric/underscore/hyphen). Checks no other user has same username (select where username = x and id != userId). Updates `users.username` for userId, returns new username. |
| `getUsername(userId)` | Selects `username` for userId; returns null if not found or error. |
| `validateUsername` | Private: trim, length, regex, must start with letter/number. |

**Related:**  
- **lib/supabase.**  
- **UsernameChangeInput** and profile menus (Admin, Client) that fetch/save username.

---

### `services/profilePictureService.ts`

| Line(s) | What it does |
|---------|--------------|
| `uploadProfilePicture(userId, file)` | Validates file is image and ≤ 2MB. Fetches current `profile_pic` from users. If exists, calls `deleteImageFromStorage` (parse URL, remove from bucket `profile-pictures`). Uploads file to `profile-pictures` as `userId/timestamp.ext`, gets public URL, updates `users.profile_pic`. Returns url or error. |
| `deleteProfilePicture(userId)` | Gets current URL from users, deletes from storage, sets `users.profile_pic` to null. |
| `deleteImageFromStorage(imageUrl)` | Parses URL to get path after `/profile-pictures/`, calls storage remove. |
| `getProfilePicture(userId)` | Returns `users.profile_pic` for userId. |

**Related:**  
- **lib/supabase** (storage + users table).  
- **ProfilePictureUpload** component.  
- **Storage bucket:** `profile-pictures`.

---

## 8. Lib

### `lib/types.tsx`

Exports TypeScript interfaces: `User`, `OTPVerification`, `LoginCredentials`, `OTPVerificationRequest`, `ApiResponse<T>`. Used for type safety across the app; no runtime behavior.

**Related:** Any file that imports these types.

---

### `lib/utils.ts`

`export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }` — merges class names and resolves Tailwind conflicts. Used by components that need conditional classes.

**Related:** Various UI components (if they import `cn`).

---

### `lib/services/email.tsx`

| Line(s) | What it does |
|---------|--------------|
| `'use server'` | So `sendOTPEmail` can be used as server action or from server code. |
| `nodemailer.createTransport(...)` | Same SMTP env as emailService. |
| `sendOTPEmail({ email, otp, userName })` | Sends “Your Login OTP Code” HTML email. If SMTP not configured, logs OTP and returns error. Used by **login** resend OTP (actions.tsx). |

**Related:** **app/(auth)/login/actions.tsx** (resendOTPAction).

---

## 9. UI & auth components

### `components/ui/Button.tsx`

Props: `children`, `type`, `variant` (default | social | outline | ghost), `size` (sm | md | lg), `className`, `onClick`, `disabled`, `loading`. Renders a `<button>` with Tailwind; if `loading`, shows spinner + “Loading...”. Used everywhere (login, signup, profile, admin).

**Related:** Used by login, signup, onboarding, profile menus, ServiceApproval, etc.

---

### `components/ui/Input.tsx`

Extends `InputHTMLAttributes`. Props: `label`, `icon`, `error`, plus all native input props. Renders label, a wrapper with optional left icon, and `<input>`. Error message shown below. Used in login, signup, profile forms.

**Related:** Login, signup, UsernameChangeInput, PasswordChangeInput.

---

### `components/auth/AuthCard.tsx`

Props: `children`, `title`, `subtitle`, `imageSideContent?`, `className?`. Full-screen layout: background image (Lebanese skyline), overlay, a two-column card (form side + image/brand side). Form side has logo, title, subtitle, and `children`. Used for login, signup, onboarding (role selection).

**Related:** Login page, signup page, onboarding page.

---

## 10. Profile components

### `components/profile/UsernameChangeInput.tsx`

| Line(s) | What it does |
|---------|--------------|
| Props: `userId`, `currentUsername`, `onUpdate?` | Parent passes current user id and displayed username; optional callback when username is updated. |
| State: `username`, `isEditing`, `isLoading`, `error`, `success` | Tracks input value and UI state. |
| `useEffect` | When not editing, syncs `username` to `currentUsername` and clears error/success. |
| `handleSave` | If trimmed value equals current, just close edit. Else calls `UsernameService.updateUsername(userId, username.trim())`. On success: set success, close edit, call `onUpdate(result.username)`, clear success after 3s. On failure set error. |
| `handleCancel` | Reset to currentUsername, close edit, clear error. |
| `handleKeyDown` | Enter → save, Escape → cancel. |
| JSX | Label, Input (with focus to set isEditing), loading/success/error icons, Save/Cancel buttons when editing and value changed, error/success messages, helper text. |

**Related:** **UsernameService**, **Input**, **Button**. Used by **AdminProfileMenu**, **ClientProfileMenu** (FreelancerProfileMenu still uses a plain input, not this component).

---

### `components/profile/PasswordChangeInput.tsx`

| Line(s) | What it does |
|---------|--------------|
| Props: `userId`, `onSuccess?` | Who is changing password; optional callback after success. |
| State: current/new/confirm password, verification code, show/hide toggles, loading, error, success, `verificationRequired` | Two phases: (1) enter passwords and request code, (2) enter code and confirm. |
| `getPasswordStrength(password)` | Returns strength 0–4 and label/color for a small bar (Too short, Weak, Good, Strong). |
| `handleChangePassword` | Validates all fields and new === confirm, length ≥ 8. POST `/api/password/change` with userId, currentPassword, newPassword. On success sets `verificationRequired` true. |
| `handleVerifyCode` | POST `/api/password/verify` with userId and code. On success clears form, sets success, calls onSuccess. |
| `handleCancel` | Clears verification step and code. |
| JSX (phase 1) | Current / new / confirm password inputs with show-hide eyes; strength bar for new password; requirement checklist (8 chars, upper, lower, number, special); “Change Password” button. |
| JSX (phase 2) | Message “Verification code sent!”, 6-digit input, Cancel and “Verify & Change” buttons. |
| Error/success blocks | Red/green boxes with AlertCircle/Check icon. |

**Related:** **api/password/change**, **api/password/verify**, **Input**, **Button**. Used by **AdminProfileMenu**, **ClientProfileMenu**.

---

### `components/profile/ProfilePictureUpload.tsx`

| Line(s) | What it does |
|---------|--------------|
| Props: `userId`, `currentPictureUrl?`, `userName`, `onUpdate?`, `bgColor`, `iconColor` | Who to upload for; current URL; display name for initials; optional callback; styling. |
| State: `profilePicUrl`, `previewUrl`, `uploading`, `error`, `showImagePreview` | Current URL, preview (before or after upload), loading, error message, modal open. |
| `handleFileSelect` | On file pick: FileReader for immediate preview; calls `uploadFile(file)`; resets input. |
| `uploadFile` | Calls `ProfilePictureService.uploadProfilePicture(userId, file)`. On success updates state and onUpdate(url). On error sets error and restores previous preview. |
| `handleDelete` | Calls `ProfilePictureService.deleteProfilePicture(userId)`. Clears state and onUpdate(null). |
| `getUserInitials()` | First letters of `userName` words, uppercase, max 2. |
| JSX | Hidden file input; circle showing image or initials; hover overlay (View/Camera); loading overlay; on hover when picture exists, small Edit and Delete buttons; error tooltip; modal with large image and Change/Delete. |

**Related:** **ProfilePictureService**, used by **AdminProfileMenu**, **FreelancerProfileMenu**, **ClientProfileMenu**.

---

## 11. Admin, Freelancer, Client

### `app/admin/page.tsx`

Renders: header “Admin Dashboard” + “Manage platform services”, **AdminProfileMenu**, and main content with **ServiceApproval** centered. Background: `bg-lebanese-pattern` and overlay.

**Related:** **AdminProfileMenu**, **ServiceApproval**.

---

### `app/admin/_components/AdminProfileMenu.tsx`

| Line(s) | What it does |
|---------|--------------|
| State: `isOpen`, `currentUsername`, `isLoadingUsername` | Dropdown open/closed; username shown; loading while fetching. |
| `handleSignOut` | Calls `supabase.auth.signOut()` (client), then POST `/api/auth/signout`, then `router.refresh()` and `window.location.href = '/login'`. |
| `useEffect` | Fetches username with `UsernameService.getUsername("e5c7a983-44e4-4b5b-98e0-e8329dc209f8")` and sets `currentUsername`. **Hardcoded admin user id.** |
| JSX | Button with User icon and “Admin” label; when open, dropdown with ProfilePictureUpload (same hardcoded id), “Admin User” / “admin@lfm.com”, UsernameChangeInput, PasswordChangeInput, Dark Mode/Language placeholders, Sign Out button. |

**Related:** **supabase** (app/supabase/client), **UsernameService**, **ProfilePictureUpload**, **UsernameChangeInput**, **PasswordChangeInput**, **Button**, **api/auth/signout**.

---

### `app/admin/_components/ServiceApproval.tsx`

| Line(s) | What it does |
|---------|--------------|
| Creates Supabase client in file with `createClient(supabaseUrl, supabaseAnonKey)` | So it can query/update from the browser. Session may still apply if you use RLS. |
| State: `services`, `loading`, `rejectingId`, `rejectionReason` | List of pending services; loading flag; which row is in “reject” mode; reason text. |
| `fetchServices` | `supabase.from('services').select('*, users:freelancer_id (username, email), categories:category_id (name)').eq('status', 'pending').order('created_at', { ascending: false })`. Expects FKs `freelancer_id` and `category_id`. Sets state. |
| `useEffect` | Runs fetchServices on mount. |
| `handleApprove(id)` | `update({ status: 'approved' }).eq('id', id)`. On success removes from local state and toasts. |
| `handleReject(id)` | If no rejectionReason, toast. Else `update({ status: 'rejected', rejection_reason }).eq('id', id)`. On success removes from state, clears rejectingId/reason, toasts. |
| JSX | Loading spinner; then card with header “Service Approval” and count; empty state “All caught up!” or list of services (category, date, title, username, price, description). Each row has Reject (opens textarea) and Approve. Reject form: textarea + Cancel + “Confirm Rejection”. |

**Related:** **Supabase** (services + users + categories tables). **toast** (react-hot-toast). No API route — direct Supabase from client.

---

### `app/freelancer/page.tsx`

Renders: **FreelancerNavbar** (sticky) and **FreelancerDashboard** inside a max-width container. Same background pattern.

**Related:** **FreelancerNavbar**, **FreelancerDashboard**.

---

### `app/freelancer/_components/FreelancerNavbar.tsx`

| Line(s) | What it does |
|---------|--------------|
| `usePathname()` | Current path for highlighting active link. |
| `navItems`: Dashboard (`/freelancer`), Create Service (`/freelancer/create-service`) | With icons and descriptions. |
| Desktop: logo “LFM”, nav links, **FreelancerProfileMenu**, mobile menu button. |
| Mobile: when `isMobileMenuOpen`, same links in a dropdown. |

**Related:** **FreelancerProfileMenu**, **Link**, **lucide-react**.

---

### `app/freelancer/_components/FreelancerDashboard.tsx`

| Line(s) | What it does |
|---------|--------------|
| Creates its own Supabase client with `createClient(url, anonKey)` (same as ServiceApproval). | |
| State: `stats` (profileViews, activeGigs, totalEarnings, bestService), `loading` | |
| `useEffect` | Gets `supabase.auth.getUser()`. Counts approved services for this user: `from('services').select('*', { count: 'exact', head: true }).eq('freelancer_id', user.id).eq('status', 'approved')`. Then sets stats with **mocked** profileViews, totalEarnings, bestService; real activeGigs from count. 800ms delay to simulate load. |
| JSX | Welcome banner “Ahla wa Sahla”, three stat cards (Profile Views, Active Gigs, Total Earnings), “Star Service” card (bestService + mocked views/orders), “Seller Level” card (Lv. 1, progress bar, “View Requirements” button). |

**Related:** **Supabase** (auth + services table). **create-service** page exists at `/freelancer/create-service` (linked from navbar).

---

### `app/freelancer/_components/FreelancerProfileMenu.tsx`

Same structure as AdminProfileMenu: dropdown with profile area, but **plain inputs** for username and password (not UsernameChangeInput/PasswordChangeInput). Uses **UsernameService.getUsername** with hardcoded id `196dc23e-cf57-4964-ac41-a398b8faeb81`. Sign out: POST signout then router.refresh + replace /login or window.location. Imports supabase from **lib/supabaseClient**.

**Related:** **lib/supabaseClient**, **UsernameService**, **ProfilePictureUpload**, **Button**, **api/auth/signout**.

---

### `app/client/page.tsx`

Header “Client Portal” + **ClientProfileMenu**; main area is placeholder “Client Dashboard Under Construction” with two animated circles.

**Related:** **ClientProfileMenu**.

---

### `app/client/_components/ClientProfileMenu.tsx`

Same pattern as Admin: dropdown with **ProfilePictureUpload**, **UsernameChangeInput**, **PasswordChangeInput**, Dark Mode/Language, Sign Out. Uses hardcoded client id `39326262-b9a0-4c79-b48e-dc92ef87791e`. Supabase from **app/supabase/client**. Sign out same as others.

**Related:** **app/supabase/client**, **UsernameService**, **ProfilePictureUpload**, **UsernameChangeInput**, **PasswordChangeInput**, **Button**, **api/auth/signout**.

---

## 12. Related-files map

Use this to see “what talks to what.”

| File | Imports / uses | Used by |
|------|-----------------|---------|
| **middleware.ts** | Supabase (createServerClient), req/res cookies, users table | Every request |
| **app/supabase/client.tsx** | env (URL, anon, service role) | Login, signup, onboarding, AdminProfileMenu, ServiceApproval, FreelancerDashboard; supabaseAdmin: signup API, sync API |
| **app/supabase/server.tsx** | cookies() | Server Components / routes that need current user |
| **lib/supabase.ts** | env (URL, anon) | usernameService, passwordService, profilePictureService, api/password/verify |
| **lib/supabaseClient.ts** | env (URL, anon) | FreelancerProfileMenu only |
| **app/(auth)/login/page.tsx** | AuthCard, Input, Button, supabase (client), loginAction, verifyOTPAction, resendOTPAction | User visits /login |
| **app/(auth)/login/actions.tsx** | createServerClient, cookies, sendOTPEmail (lib/services/email) | login/page.tsx |
| **app/(auth)/signup/page.tsx** | AuthCard, Input, Button, supabase (client) | User visits /signup; calls api/otp/send, api/signup |
| **app/auth/callback/route.ts** | createServerClient, cookies, users table | OAuth redirect |
| **app/onboarding/page.tsx** | AuthCard, Button, supabase (client) | User after signup or OAuth (no role) |
| **api/auth/signout** | createServerClient, cookies | Admin, Freelancer, Client profile menus |
| **api/auth/signup** | supabaseAdmin, createClient (anon), bcrypt, verify_otp RPC | signup/page.tsx |
| **api/auth/otp/send** | emailService, otp-generator, request_otp RPC | signup/page.tsx |
| **api/password/change** | PasswordService, EmailService | PasswordChangeInput |
| **api/password/verify** | PasswordService, EmailService, lib/supabase | PasswordChangeInput |
| **services/emailService** | nodemailer, env SMTP_* | api/otp/send, api/password/change, api/password/verify |
| **services/passwordService** | lib/supabase, in-memory Map | api/password/change, api/password/verify |
| **services/usernameService** | lib/supabase | UsernameChangeInput, AdminProfileMenu, ClientProfileMenu, FreelancerProfileMenu |
| **services/profilePictureService** | lib/supabase (storage + users) | ProfilePictureUpload |
| **UsernameChangeInput** | UsernameService, Input, Button | AdminProfileMenu, ClientProfileMenu |
| **PasswordChangeInput** | Input, Button, api/password/change, api/password/verify | AdminProfileMenu, ClientProfileMenu |
| **ProfilePictureUpload** | ProfilePictureService | AdminProfileMenu, FreelancerProfileMenu, ClientProfileMenu |
| **AdminProfileMenu** | supabase (app), UsernameService, ProfilePictureUpload, UsernameChangeInput, PasswordChangeInput, Button | admin/page.tsx |
| **ServiceApproval** | createClient (in-file), services + users + categories | admin/page.tsx |
| **FreelancerNavbar** | FreelancerProfileMenu, Link, pathname | freelancer/page.tsx |
| **FreelancerDashboard** | createClient (in-file), services | freelancer/page.tsx |
| **FreelancerProfileMenu** | lib/supabaseClient, UsernameService, ProfilePictureUpload, Button | FreelancerNavbar |
| **ClientProfileMenu** | app/supabase/client, UsernameService, ProfilePictureUpload, UsernameChangeInput, PasswordChangeInput, Button | client/page.tsx |

---

**End of deep dive.** For a higher-level flow (what happens on login, signup, etc.), see **PROJECT_GUIDE.md**.
