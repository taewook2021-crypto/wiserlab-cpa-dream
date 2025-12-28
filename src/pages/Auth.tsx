import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import iconWiserlab from "@/assets/icon-wiserlab.png";

// Preload the image
const preloadImage = new Image();
preloadImage.src = iconWiserlab;

const Auth = () => {
  const { user, loading, signInWithKakao } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  
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

  const canSignUp = agreedToTerms && agreedToPrivacy;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6">
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
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-6">
            <p className="text-muted-foreground text-sm text-center">
              기존 회원이시면 로그인하세요
            </p>
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
              카카오로 로그인
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-6">
            <p className="text-muted-foreground text-sm text-center">
              처음이시면 약관에 동의 후 가입하세요
            </p>
            
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <label 
                  htmlFor="terms" 
                  className="text-sm leading-tight cursor-pointer"
                >
                  <Link to="/terms" className="underline hover:text-primary">이용약관</Link>에 동의합니다 (필수)
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="privacy" 
                  checked={agreedToPrivacy}
                  onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                />
                <label 
                  htmlFor="privacy" 
                  className="text-sm leading-tight cursor-pointer"
                >
                  <Link to="/privacy" className="underline hover:text-primary">개인정보처리방침</Link>에 동의합니다 (필수)
                </label>
              </div>
            </div>
            
            <Button
              onClick={() => signInWithKakao()}
              disabled={!canSignUp}
              className="w-full h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.64 6.77-.14.52-.92 3.35-.95 3.57 0 0-.02.17.09.24.11.07.24.01.24.01.31-.04 3.64-2.4 4.22-2.81.58.08 1.17.12 1.76.12 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
              </svg>
              카카오로 회원가입
            </Button>
            
            {!canSignUp && (
              <p className="text-xs text-muted-foreground text-center">
                약관에 모두 동의해야 가입할 수 있습니다
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
