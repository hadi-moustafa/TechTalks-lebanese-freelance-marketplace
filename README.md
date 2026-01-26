# TechTalks - LFM - Lebanese Freelance Marketplace

**Empowering local Lebanese talent through a centralized freelance marketplace.**

This platform allows creatives to display their portfolios and provides a direct channel for client communication.
Developed as a collaborative internship project with TechTalks, now migrated to **Next.js** and **Supabase**.

LFM is a high-integrity marketplace platform featuring automated market regulation, tiered commission logic, and a robust debt-tracking system for direct payments.

## 🚀 Core Features

- **Market Price Guard:** Category-based price ceilings derived from median market data with Admin override capabilities.
- **Smart Debt Ledger:** Automated tracking of platform commissions for direct freelancer-to-client transactions with a 7-day alert cycle.
- **Tiered Gamification:** Enum-driven badge levels (`New Comer` → `Expert`) that dynamically unlock platform privileges.
- **Real-Time Communication:** Chat rooms linked to specific service contexts (powered by Supabase Realtime).
- **Anti-Spam Engine:** Rate limiting based on user account levels.

## 🛠 Tech Stack

-   **Framework:** Next.js 14+ (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **Backend:** Supabase (Auth, Database, Realtime, Storage)
-   **Linting:** ESLint

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hadi-moustafa/LFM-Local_Freelance_Marketplace.git
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

## Project Structure

-   `/app`: Main application code (App Router)
-   `/public`: Static assets
-   `middleware.ts`: Middleware for Supabase Auth (optional, if set up)

