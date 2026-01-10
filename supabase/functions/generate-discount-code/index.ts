import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface GenerateCodeRequest {
  kakao_email: string;
  recipient_email: string;
  batch_name: string;
}

const generateCode = (): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "DISC-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // API Key 검증 (Google Apps Script에서 호출 시 사용)
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("DISCOUNT_API_KEY");
    
    // API Key가 설정되어 있으면 검증
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { kakao_email, recipient_email, batch_name }: GenerateCodeRequest = await req.json();

    // 입력값 검증
    if (!kakao_email || !recipient_email || !batch_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: kakao_email, recipient_email, batch_name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Supabase 클라이언트 생성 (Service Role 사용)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 이미 해당 카카오 이메일로 발급된 코드가 있는지 확인
    const { data: existingCode, error: checkError } = await supabase
      .from("discount_codes")
      .select("code")
      .eq("assigned_email", kakao_email)
      .single();

    if (existingCode) {
      console.log(`Code already exists for ${kakao_email}: ${existingCode.code}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "이미 해당 카카오 이메일로 발급된 할인 코드가 있습니다.",
          existing_code: existingCode.code
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 고유한 할인 코드 생성
    const discountCode = generateCode();

    // 데이터베이스에 저장
    const { error: insertError } = await supabase
      .from("discount_codes")
      .insert({
        code: discountCode,
        discount_amount: 20000,
        batch_name: batch_name,
        assigned_email: kakao_email,
      });

    if (insertError) {
      console.error("Failed to insert discount code:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save discount code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Resend로 이메일 발송
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: true, 
          code: discountCode,
          email_sent: false,
          message: "코드가 생성되었지만 이메일 발송 설정이 되어있지 않습니다."
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "WISER LAB <support@wiserlab.co.kr>",
      to: [recipient_email],
      subject: "[WISER LAB] SUMMIT 할인 코드가 발급되었습니다",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .code-box { background: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 4px; font-family: monospace; }
            .discount { font-size: 18px; color: #16a34a; margin-top: 10px; }
            .info { background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">WISER LAB</div>
            </div>
            
            <h2>할인 코드가 발급되었습니다 🎉</h2>
            
            <p>안녕하세요!</p>
            <p>SUMMIT 모의고사 구매에 사용할 수 있는 할인 코드가 발급되었습니다.</p>
            
            <div class="code-box">
              <div class="code">${discountCode}</div>
              <div class="discount">20,000원 할인</div>
            </div>
            
            <div class="info">
              <strong>📌 사용 안내</strong>
              <ul>
                <li>카카오 계정 이메일: <strong>${kakao_email}</strong></li>
                <li>위 카카오 계정으로 로그인하면 할인이 자동 적용됩니다</li>
                <li>또는 결제 시 위 코드를 직접 입력하셔도 됩니다</li>
                <li>할인 코드는 1회만 사용 가능합니다</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="https://wiserlab.co.kr/summit" class="button">SUMMIT 구매하기</a>
            </p>
            
            <div class="footer">
              <p>본 메일은 발신 전용입니다.</p>
              <p>© 2025 WISER LAB. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Resend 응답 확인 및 에러 처리
    if (emailResponse.error) {
      console.error("Resend email error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: true, 
          code: discountCode,
          email_sent: false,
          email_error: emailResponse.error.message,
          recipient: recipient_email
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        code: discountCode,
        email_sent: true,
        recipient: recipient_email
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-discount-code function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
