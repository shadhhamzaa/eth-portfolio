/*
MOD002 - SUPABASE INTEGRATION - Defines the shape of Portfolio row
*/

// Sets up the Supabase client using environment variables  so we can  talk to the database from anywhere in the app
import { createClient } from '@supabase/supabase-js' 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

//MOD001 - Defines the shape of Portfolio row

export type PortfolioRow = {
  stock_ticker: string
  stock_name: string
  quantity: number
  average_price: number
  compliance_status?: 'halal' | 'doubtful' | 'haram'
  haram_income_percentage?: number
  tazkiyah_amount?: number
}

//MOD002 End