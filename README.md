# LFM - Lebanese Freelance Marketplace

This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`.
It uses [Supabase](https://supabase.com) for backend services (Auth, Database, Realtime).

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd LFM_Lebaese_Freelance_Marketplace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file to create your local environment configuration:

```bash
cp .env.example .env.local
```

Open `.env.local` and populate it with your Supabase credentials:

-   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon (Public) Key

You can find these keys in your Supabase Dashboard under `Settings > API`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

-   **Framework:** Next.js 14+ (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **Backend:** Supabase
-   **Linting:** ESLint

## Project Structure

-   `/app`: Main application code (App Router)
-   `/public`: Static assets
-   `middleware.ts`: Middleware for Supabase Auth (optional, if set up)
