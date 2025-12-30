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

    // 결제 승인 성공 후 주문 저장 시도 (서버 사이드에서 직접 처리)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 이미 저장된 주문인지 확인
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_id', data.orderId)
        .maybeSingle();

      if (existingOrder) {
        console.log('Order already exists:', data.orderId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            orderId: data.orderId,
            method: data.method,
            totalAmount: data.totalAmount,
            status: data.status,
            orderSaved: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // pending_orders에서 배송 정보 조회
      const { data: pendingOrder, error: pendingError } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (pendingError) {
        console.error('Error fetching pending order:', pendingError);
      }

      if (pendingOrder) {
        // 주문 저장 (exam_number 없이)
        const { error: orderError } = await supabase.from('orders').insert({
          user_id: pendingOrder.user_id,
          order_id: data.orderId,
          payment_key: paymentKey,
          product_name: pendingOrder.product_name,
          amount: data.totalAmount,
          status: 'paid',
          buyer_name: pendingOrder.buyer_name,
          buyer_email: pendingOrder.buyer_email || '',
          buyer_phone: pendingOrder.buyer_phone,
          shipping_address: pendingOrder.shipping_address,
          shipping_detail_address: pendingOrder.shipping_detail_address,
          shipping_postal_code: pendingOrder.shipping_postal_code,
          paid_at: new Date().toISOString(),
        });

        if (orderError) {
          console.error('Failed to save order:', orderError);
        } else {
          console.log('Order saved successfully from toss-payment:', data.orderId);
          
          // pending_order 삭제
          await supabase.from('pending_orders').delete().eq('order_id', orderId);

          return new Response(
            JSON.stringify({ 
              success: true, 
              orderId: data.orderId,
              method: data.method,
              totalAmount: data.totalAmount,
              status: data.status,
              orderSaved: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('No pending order found for:', orderId);
      }
    } catch (saveError) {
      console.error('Error saving order in toss-payment:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: data.orderId,
        method: data.method,
        totalAmount: data.totalAmount,
        status: data.status,
        orderSaved: false,
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
