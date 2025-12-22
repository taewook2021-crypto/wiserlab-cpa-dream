import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PaymentFail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorMessage = searchParams.get("message") || "결제가 취소되었거나 실패했습니다.";
  const errorCode = searchParams.get("code");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="container mx-auto px-6 py-20 max-w-lg text-center">
          <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
          
          <h1 className="text-2xl font-medium mb-2">결제에 실패했습니다</h1>
          <p className="text-muted-foreground mb-2">{errorMessage}</p>
          {errorCode && (
            <p className="text-sm text-muted-foreground mb-8">
              오류 코드: {errorCode}
            </p>
          )}

          <div className="space-y-3">
            <Button onClick={() => navigate("/payment?items=bundle")} className="w-full">
              다시 결제하기
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/summit")}
              className="w-full"
            >
              상품 페이지로 돌아가기
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentFail;
