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

  console.log('Toss webhook received');

  try {
    const body = await req.json();
    console.log('Webhook payload:', JSON.stringify(body));

    const { eventType, data } = body;

    // 결제 완료 이벤트만 처리
    if (eventType !== 'PAYMENT_STATUS_CHANGED' || data?.status !== 'DONE') {
      console.log('Ignoring event:', eventType, 'status:', data?.status);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, paymentKey, totalAmount } = data;
    console.log('Processing payment completion:', { orderId, paymentKey, totalAmount });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 이미 저장된 주문인지 확인
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingOrder) {
      console.log('Order already exists, skipping:', orderId);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already exists' }),
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
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch pending order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingOrder) {
      console.error('No pending order found for:', orderId);
      return new Response(
        JSON.stringify({ success: false, error: 'Pending order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 수험번호 생성
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let examNumber = 'WLS-';
    for (let i = 0; i < 4; i++) {
      examNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 주문 저장
    const { error: orderError } = await supabase.from('orders').insert({
      user_id: pendingOrder.user_id,
      order_id: orderId,
      payment_key: paymentKey,
      product_name: pendingOrder.product_name,
      amount: totalAmount,
      status: 'paid',
      buyer_name: pendingOrder.buyer_name,
      buyer_email: pendingOrder.buyer_email || '',
      buyer_phone: pendingOrder.buyer_phone,
      shipping_address: pendingOrder.shipping_address,
      shipping_detail_address: pendingOrder.shipping_detail_address,
      shipping_postal_code: pendingOrder.shipping_postal_code,
      paid_at: new Date().toISOString(),
      exam_number: examNumber,
    });

    if (orderError) {
      console.error('Failed to save order:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order saved successfully from webhook:', orderId, 'examNumber:', examNumber);

    // pending_order 삭제
    await supabase.from('pending_orders').delete().eq('order_id', orderId);

    return new Response(
      JSON.stringify({ success: true, orderId, examNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in toss-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});