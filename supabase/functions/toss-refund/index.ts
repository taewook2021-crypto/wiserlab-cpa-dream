import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentKey, cancelReason, orderId } = await req.json();

    console.log('Refund request:', { paymentKey, cancelReason, orderId });

    if (!paymentKey || !cancelReason) {
      return new Response(
        JSON.stringify({ error: 'paymentKey and cancelReason are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('TOSS_PAYMENTS_SECRET_KEY');
    if (!secretKey) {
      console.error('TOSS_PAYMENTS_SECRET_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Base64 encode the secret key for Basic Auth
    const encodedSecretKey = btoa(`${secretKey}:`);

    // Cancel payment with Toss Payments API
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Toss Payments API error:', data);
      return new Response(
        JSON.stringify({ 
          error: data.message || 'Refund failed',
          code: data.code 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Refund successful:', data.orderId);

    // Update order status in database
    if (orderId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: cancelReason,
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: data.orderId,
        status: data.status,
        canceledAt: data.cancels?.[0]?.canceledAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in toss-refund function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
