import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewcfggvvuzmzdbzpfkjq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Y2ZnZ3Z2dXptemRienBma2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzAwMjMsImV4cCI6MjA2NDcwNjAyM30.bS1vAokazyIodQ_Eou86ANuGrVKSEb7matsPELhUh9o'

export const supabase = createClient(supabaseUrl, supabaseKey)
// Make supabase available in browser devtools
// @ts-ignore
window.supabase = supabase;

