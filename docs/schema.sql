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