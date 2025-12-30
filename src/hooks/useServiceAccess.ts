import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AccessType = "paid" | "free_code" | "admin" | null;

interface ServiceAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  accessType: AccessType;
}

export const useServiceAccess = (): ServiceAccessResult => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessType, setAccessType] = useState<AccessType>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setAccessType(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // 1. 관리자 여부 확인
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          setHasAccess(true);
          setAccessType("admin");
          setIsLoading(false);
          return;
        }

        // 2. 유료 구매 확인
        const { data: orderData } = await supabase
          .from("orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .limit(1);

        if (orderData && orderData.length > 0) {
          setHasAccess(true);
          setAccessType("paid");
          setIsLoading(false);
          return;
        }

        // 3. 무료 코드 연결 확인
        const { data: codeData } = await supabase
          .from("exam_numbers")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (codeData && codeData.length > 0) {
          setHasAccess(true);
          setAccessType("free_code");
          setIsLoading(false);
          return;
        }

        // 접근 권한 없음
        setHasAccess(false);
        setAccessType(null);
      } catch (error) {
        console.error("Error checking service access:", error);
        setHasAccess(false);
        setAccessType(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  return { hasAccess, isLoading, accessType };
};
