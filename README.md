# LFM-Local_Freelance_Marketplace
Empowering local Lebanese talent through a centralized freelance marketplace.
This platform allows creatives to display their portfolios and provides a direct channel for client communication.
Developed as a collaborative internship project with TechTalks using (Next.js , Supabase).

LFM is a high-integrity marketplace platform featuring automated market regulation, tiered commission logic, and a robust debt-tracking system for direct payments.

## 🚀 Core Features

- **Market Price Guard:** Category-based price ceilings derived from median market data with Admin override capabilities.
- **Smart Debt Ledger:** Automated tracking of platform commissions for direct freelancer-to-client transactions with a 7-day alert cycle.
- **Tiered Gamification:** Enum-driven badge levels (`New Comer` → `Expert`) that dynamically unlock platform privileges.
- **Real-Time Communication:** WebSocket-powered chat rooms linked to specific service contexts.
- **Anti-Spam Engine:** Calendar-day rate limiting based on user account levels.

## 🛠 Tech Stack

- **Backend:** Node.js / Express
- **Database:** PostgreSQL (Relational integrity for financial logic)
- **Real-Time:** Socket.io
- **Caching:** Redis (Median price storage & rate limiting)

## 📊 Database Architecture

The system uses a highly normalized schema to decouple business logic from core entities:
- **Governance Layer:** `account_levels`, `categories`
- **Operational Layer:** `users`, `services`, `service_images`
- **Financial Layer:** `debt_ledger`, `commission_snapshots`
- **Engagement Layer:** `chat_rooms`, `messages`, `service_views`

## ⚙️ Installation

1. Clone the repository.
2. Run `npm install`.
3. Configure your `.env` with PostgreSQL credentials.
4. Run `npx knex migrate:latest` to initialize the schema provided in the `/docs` folder.
5. Start the server with `npm start`.
