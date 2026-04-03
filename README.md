# Eth Portfolio 

A Shariah-compliant stock portfolio dashboard for Muslim/Ethical investors. Upload your holdings, check compliance against AAOIFI standards, and calculate your tazkiyah (purification) automatically.

---

## Features

-  **CSV Upload** — Import holdings from Trading 212 or any broker
-  **Shariah Compliance Engine** — Screens every stock by sector and financial ratios (AAOIFI standards)
-  **Tazkiyah Calculator** — Auto-calculates purification amount from real dividend data
-  **Live Portfolio Tracking** — Current prices, portfolio value, and P&L
-  **Smart Caching** — Compliance results cached in Supabase to minimise API calls

---

## How It Works

1. Export the portfolio as a CSV from your broker
2. Upload it to Eth Portfolio
3. The compliance engine screens each stock:
   - **Sector screening** — flags haram sectors (banking, alcohol, gambling etc.)
   - **Debt ratio** — total debt must be under 33% of assets (AAOIFI)
   - **Interest income** — must be under 5% of total revenue (AAOIFI)
4. Dashboard shows halal / doubtful / haram status per stock
5. Tazkiyah is calculated automatically from dividend history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Financial Data | Polygon.io API |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Polygon.io API key (free tier)

### Installation
```bash
git clone https://github.com/shadhhamzaa/eth-portfolio.git
cd eth-portfolio
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
POLYGON_API_KEY=your_polygon_api_key


### Database Setup

Run these SQL queries in your Supabase SQL editor:
```sql
create table portfolios (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()),
  user_id text,
  stock_ticker text not null,
  stock_name text,
  quantity numeric not null,
  average_price numeric,
  compliance_status text check (compliance_status in ('halal', 'doubtful', 'haram')),
  haram_income_percentage numeric,
  tazkiyah_amount numeric
);

create table compliance_cache (
  id uuid default gen_random_uuid() primary key,
  ticker text unique not null,
  company_name text,
  sector text,
  total_revenue numeric,
  interest_income numeric,
  total_debt numeric,
  total_assets numeric,
  compliance_status text check (compliance_status in ('halal', 'doubtful', 'haram')),
  haram_income_percentage numeric,
  reason text,
  fetched_at timestamp with time zone default timezone('utc', now())
);
```

### Run Locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## CSV Format

Your CSV should include these columns (column names are flexible):

Ticker, Name, Quantity, Average Price
AAPL, Apple Inc, 10, 145.23
TSLA, Tesla Inc, 5, 220.50

---

---

## Shariah Screening Standards

This app uses **AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions)** standards:

-  Haram sectors: banking, insurance, alcohol, tobacco, gambling, weapons, adult entertainment
-  Debt ratio exceeds 33% of total assets
-  Interest income exceeds 5% of total revenue
-  Doubtful: ratios within limits but approaching thresholds
-  Halal: passes all screens

---

## Roadmap

- [ ] User authentication
- [ ] Multi-currency support
- [ ] UK stock support (LSE tickers)
- [ ] Email alerts for compliance changes
- [ ] Zakat calculator

---

## Author

Built by [Shadh Hamza](https://github.com/shadhhamzaa) as part of a fintech portfolio project exploring Islamic finance and ethical investing.


-----