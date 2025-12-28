import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import iconWiserlab from "@/assets/icon-wiserlab.png";

// Preload the image
const preloadImage = new Image();
preloadImage.src = iconWiserlab;

const Auth = () => {
  const { user, loading, signInWithKakao } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // sessionStorage에서 저장된 리다이렉트 경로 확인, 없으면 URL 파라미터, 그것도 없으면 "/"
  const getRedirectPath = () => {
    const savedRedirect = sessionStorage.getItem('auth_redirect');
    if (savedRedirect) {
      sessionStorage.removeItem('auth_redirect');
      return savedRedirect;
    }
    return searchParams.get("redirect") || "/";
  };

  useEffect(() => {
    if (!loading && user) {
      const redirectTo = getRedirectPath();
      navigate(redirectTo);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
            <img 
              src={iconWiserlab} 
              alt="Wiser Lab" 
              className="w-full h-full object-cover"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
          </div>
          <h1 className="text-2xl font-light tracking-wide">Wiser Lab</h1>
          <p className="text-muted-foreground text-sm text-center">
            SUMMIT 모의고사 서비스에 로그인하세요
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => signInWithKakao()}
            className="w-full h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-medium"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.64 6.77-.14.52-.92 3.35-.95 3.57 0 0-.02.17.09.24.11.07.24.01.24.01.31-.04 3.64-2.4 4.22-2.81.58.08 1.17.12 1.76.12 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
            </svg>
            카카오로 시작하기
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          로그인하면 Wiser Lab의{" "}
          <a href="#" className="underline hover:text-foreground">이용약관</a>과{" "}
          <a href="#" className="underline hover:text-foreground">개인정보처리방침</a>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};

export default Auth;
