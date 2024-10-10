import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ywrsdgppwstmicguafvm.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export interface ResultData {
  city: string
  days: number
}

export async function saveResult(data: ResultData) {
  try {
    const { error } = await supabase
      .from('results')
      .insert([data])
    
    if (error) {
      console.error('Error saving result:', error)
      // You might want to throw the error here if you want to handle it in the calling function
      // throw error;
    }
  } catch (error) {
    console.error('Failed to save result:', error)
    // Handle the error gracefully, maybe by showing a user-friendly message
  }
}

export async function getPercentileRank(days: number): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('days')
      .order('days', { ascending: true })

    if (error) {
      console.error('Error fetching results:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 100
    }

    const totalCount = data.length
    const lowerCount = data.filter(item => item.days < days).length

    return Math.round((lowerCount / totalCount) * 100)
  } catch (error) {
    console.error('Failed to get percentile rank:', error)
    return 0 // Return a default value in case of error
  }
}

// Function to check Supabase connection
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('results').select('count', { count: 'exact' })
    if (error) {
      console.error('Supabase connection check failed:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Failed to check Supabase connection:', error)
    return false
  }
}