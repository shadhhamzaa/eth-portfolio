# Eth Portfolio — Shariah-Compliant Investment Screening Tool

Automates AAOIFI-standard compliance checks and tazkiyah calculation for Muslim retail investors. Built to replace manual spreadsheet screening with a real-time, data-driven dashboard.

**Live Demo:** [eth-portfolio.vercel.app](https://eth-portfolio.vercel.app)

---

## The Problem

Muslim retail investors have no simple way to verify whether their stock portfolio is Shariah-compliant. Even when stocks are screened and filtered, calculation of Tazkiyah amount is still almost impossible. The current options are,
- Manual spreadsheet screening (slow, error-prone)
- Paid Islamic finance screeners (£10–£50/month)
- Asking a scholar for every stock (not  practical and scalable)
- Calculate Tazkiyah approximately and add a buffer. 


Eth Portfolio automates the whole process - upload your broker export, get a compliance verdict and tazkiyah amount in minutes.

---

## The Integration Challenge

This project connects four external systems into a single coherent pipeline,

Trading 212 CSV Export
↓
CSV Parser (auto-detects broker format)
↓
Supabase (PostgreSQL) — stores holdings per user
↓
Polygon.io API — fetches sector, revenue, debt data
↓
Compliance Engine (AAOIFI rules)
↓
Tazkiyah Calculator
↓
Real-time Dashboard

---

**Key integration problems solved:**
- API rate limiting handled via a 30-day compliance cache in Supabase
- Inconsistent sector naming across data providers normalised in the compliance engine
- Different broker CSV formats handled via auto-detection and flexible column mapping
- Trading 212 exports transaction history not holdings — built a parser that reconstructs current positions from buy/sell history

---

## Features

-  **CSV Upload** — Auto-detects Trading 212 transaction format, reconstructs current holdings from buy/sell history
-  **Shariah Compliance Engine** — Screens every stock by sector and financial ratios against AAOIFI standards
-  **Tazkiyah Calculator** — Auto-calculates purification amount from real dividend data via Polygon.io
-  **Live Portfolio Tracking** — Previous-close prices, total portfolio value, and P&L per holding
-  **Smart Caching** — Compliance results cached in Supabase for 30 days, reducing API calls by 90%+ on repeat loads
-  **User Authentication** — Supabase Auth with email/password, each user sees only their own portfolio

---
## Shariah Screening stanadards 

Uses AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) standards — the most widely recognised standard in UK Islamic finance:

| Screen | Threshold | Result |
|---|---|---|
| Sector (banking, alcohol, gambling etc.) | Any exposure |  Haram |
| Debt / Total Assets | > 33% |  Haram |
| Interest Income / Revenue | > 5% |  Haram |
| Approaching thresholds | 25–33% debt or 3–5% interest |  Doubtful |
| Passes all screens | Under all thresholds |  Halal |

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

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server and client in one codebase, API routes keep credentials secure |
| Language | TypeScript | Type safety across the data pipeline |
| Styling | Tailwind CSS | Rapid UI development |
| Database | Supabase (PostgreSQL) | Relational structure needed for compliance caching and user data |
| Financial Data | Polygon.io API | Unlimited daily requests on free tier |
| Auth | Supabase Auth | Built-in, integrates directly with RLS policies |
| Hosting | Vercel | Native Next.js support, auto-deploys from GitHub |

---

## Key Technical Decisions

**Supabase over Firebase**
Needed relational structure for compliance caching. SQL query flexibility and row-level security policies made Supabase the stronger choice over Firebase's document model.

**Polygon.io over Alpha Vantage**
Alpha Vantage's free tier caps at 25 requests per day — unusable for any real portfolio. Polygon.io offers unlimited daily requests with a per-minute rate limit instead, which is solvable via caching.

**Compliance caching in PostgreSQL**
Polygon.io's free tier allows 5 requests per minute. Caching compliance results per ticker for 30 days reduces API calls by over 90% on repeat dashboard loads, making the app usable without a paid API plan.

**AAOIFI over MSCI/Dow Jones Islamic**
AAOIFI is the most widely recognised Shariah standard in UK Islamic finance, making it the most defensible and relevant choice for a UK retail investor user base.

**CSV upload over manual entry**
Most brokers (Trading 212, Freetrade, eToro) support CSV export in one click. Manual entry would be slow and error-prone for portfolios with 20+ holdings. The parser auto-detects the broker format and handles column name variations automatically.

---

## Limitations & What I'd Do Next

**Current limitations:**
- Polygon.io free tier limits data freshness — a production version would need a paid plan. 
- US-listed stocks only — UK/LSE ticker support is the most important next addition
- Compliance engine relies on sector classifications from Polygon.io's and that can be wrong.


**Roadmap:**
- [ ] UK/LSE stock support
- [ ] Zakat calculator
- [ ] Multi-currency support
- [ ] Direct broker API integration - currently Trading 212 dont provide an API .(replacing CSV upload)
- [ ] Email alerts when a stock's compliance status changes
- [ ] Move compliance rules to database so they can be updated without code changes

---
## Database Schema

Full schema available in [docs/schema.sql](docs/schema.sql)

---

## Author

Built by [Shadh Hamza](https://github.com/shadhhamzaa)

Integration and solutions engineering portfolio project : connecting broker data, financial APIs, and Islamic finance compliance standards.
Live PROD hosted in vercel - https://eth-portfolio.vercel.app

[GitHub](https://github.com/shadhhamzaa) 



----