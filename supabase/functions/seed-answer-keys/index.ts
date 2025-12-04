import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUMMIT_1_FINANCIAL_ACCOUNTING_ANSWERS = [
  3, 2, 2, 3, 1, 5, 2, 1, 5, 4,  // 1-10
  5, 1, 2, 5, 3, 4, 1, 4, 4, 4,  // 11-20
  3, 4, 3, 3, 2, 2, 3, 5, 4, 3,  // 21-30
  5, 3, 1, 1, 5                   // 31-35
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Prepare answer key data
    const answerKeys = SUMMIT_1_FINANCIAL_ACCOUNTING_ANSWERS.map((answer, index) => ({
      exam_name: 'SUMMIT',
      exam_round: 1,
      subject: 'financial_accounting',
      question_number: index + 1,
      correct_answer: answer
    }))

    // Insert data (upsert to avoid duplicates)
    const { data, error } = await supabase
      .from('exam_answer_keys')
      .upsert(answerKeys, { 
        onConflict: 'exam_name,exam_round,subject,question_number',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Successfully inserted answer keys:', data?.length)

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Inserted ${answerKeys.length} answer keys for SUMMIT 1회 재무회계`,
      count: data?.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})