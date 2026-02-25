import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET

if (!supabaseUrl || !supabaseJwtSecret) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_JWT_SECRET environment variables')
}

export { supabaseJwtSecret }

export default createClient(supabaseUrl, supabaseJwtSecret)
