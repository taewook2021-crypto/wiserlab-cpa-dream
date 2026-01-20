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

    console.log("Sending email via Resend", {
      from: "Wiser Lab <support@wiserlab.co.kr>",
      to: recipient_email,
      kakao_email,
      batch_name,
      code: discountCode,
    });

    // Plain text version for better deliverability
    const plainTextContent = `Wiser Lab

할인 코드가 발급되었습니다

안녕하세요,

SUMMIT 모의고사 구매에 사용할 수 있는 할인 코드가 발급되었습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

할인 코드: ${discountCode}
할인 금액: 20,000원

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

사용 안내
- 카카오 계정 이메일: ${kakao_email}
- 위 카카오 계정으로 로그인하면 할인이 자동 적용됩니다
- 또는 결제 시 위 코드를 직접 입력하셔도 됩니다
- 할인 코드는 1회만 사용 가능합니다

SUMMIT 구매하기: https://wiserlab.co.kr/summit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

본 메일은 발신 전용입니다.
문의사항이 있으시면 wiserlab.co.kr을 방문해 주세요.

© 2025 Wiser Lab. All rights reserved.
`;

    // HTML version matching website's minimalist monochrome design
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Wiser Lab - 할인 코드 발급</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #000000;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <tr>
      <td style="padding: 48px 24px 32px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <img src="https://wiserlab.lovable.app/email/wiser-lab-logo.svg" alt="Wiser Lab" width="160" height="28" style="display: block; margin: 0 auto; max-width: 160px; height: auto;" />
      </td>
    </tr>
    
    <!-- Main Content -->
    <tr>
      <td style="padding: 48px 24px;">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 300; color: #000000; text-align: center;">
          할인 코드가 발급되었습니다
        </h1>
        
        <p style="margin: 0 0 32px; font-size: 15px; color: #666666; text-align: center; font-weight: 300;">
          SUMMIT 모의고사 구매에 사용할 수 있는 할인 코드입니다.
        </p>
        
        <!-- Code Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px;">
          <tr>
            <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 500; letter-spacing: 4px; font-family: 'SF Mono', 'Consolas', monospace; color: #000000; margin-bottom: 12px;">
                ${discountCode}
              </div>
              <div style="font-size: 16px; color: #000000; font-weight: 300;">
                20,000원 할인
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Info Section -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px;">
          <tr>
            <td style="background-color: #fafafa; padding: 24px; border-left: 2px solid #000000;">
              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #000000;">
                사용 안내
              </p>
              <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #666666; font-weight: 300;">
                <li style="margin-bottom: 8px;">카카오 계정: <strong style="color: #000000;">${kakao_email}</strong></li>
                <li style="margin-bottom: 8px;">위 카카오 계정으로 로그인하면 할인이 자동 적용됩니다</li>
                <li style="margin-bottom: 8px;">또는 결제 시 코드를 직접 입력하셔도 됩니다</li>
                <li>할인 코드는 1회만 사용 가능합니다</li>
              </ul>
            </td>
          </tr>
        </table>
        
        <!-- CTA Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
          <tr>
            <td style="background-color: #000000; padding: 14px 48px;">
              <a href="https://wiserlab.co.kr/summit" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 400; letter-spacing: 0.5px;">
                SUMMIT 구매하기
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 32px 24px; border-top: 1px solid #e5e5e5; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #999999; font-weight: 300;">
          본 메일은 발신 전용입니다.
        </p>
        <p style="margin: 0; font-size: 12px; color: #999999; font-weight: 300;">
          © 2025 Wiser Lab. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "Wiser Lab <support@wiserlab.co.kr>",
      to: [recipient_email],
      subject: "SUMMIT 할인 코드가 발급되었습니다",
      html: htmlContent,
      text: plainTextContent,
    });

    const emailId = (emailResponse as any)?.data?.id;

    // Resend 응답 확인 및 에러 처리
    if (emailResponse.error) {
      console.error("Resend email error:", emailResponse.error);
      return new Response(
        JSON.stringify({
          success: true,
          code: discountCode,
          email_sent: false,
          email_error: emailResponse.error.message,
          recipient: recipient_email,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", { id: emailId, recipient: recipient_email });

    return new Response(
      JSON.stringify({
        success: true,
        code: discountCode,
        email_sent: true,
        recipient: recipient_email,
        email_id: emailId,
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
