import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { paymentKey, orderId, amount } = await req.json();

    console.log('Payment confirmation request:', { paymentKey, orderId, amount });

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

    // Confirm payment with Toss Payments API
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Toss Payments API error:', data);
      return new Response(
        JSON.stringify({ 
          error: data.message || 'Payment confirmation failed',
          code: data.code 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment confirmed successfully:', data.orderId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: data.orderId,
        method: data.method,
        totalAmount: data.totalAmount,
        status: data.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in toss-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
