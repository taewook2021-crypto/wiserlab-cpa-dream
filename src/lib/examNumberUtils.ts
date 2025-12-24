import { supabase } from "@/integrations/supabase/client";

// 혼동하기 쉬운 문자 제외 (O, 0, I, 1, L)
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * WLS-XXXX 형식의 유료 구입자 수험번호 생성
 */
export const generatePaidExamNumber = (): string => {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `WLS-${code}`;
};

/**
 * 중복되지 않는 고유 수험번호 생성
 * DB에서 중복 체크 후 유니크한 번호 반환
 */
export const generateUniqueExamNumber = async (): Promise<string> => {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const examNumber = generatePaidExamNumber();
    
    // 중복 체크
    const { data, error } = await supabase
      .from("orders")
      .select("exam_number")
      .eq("exam_number", examNumber)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking exam number:", error);
      continue;
    }
    
    // 중복이 없으면 반환
    if (!data) {
      return examNumber;
    }
  }
  
  // 최대 시도 횟수 초과 시 타임스탬프 포함
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `WLS-${timestamp}`;
};
