import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        toast.error("잘못된 결제 정보입니다.");
        navigate("/summit");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("toss-payment", {
          body: {
            paymentKey,
            orderId,
            amount: parseInt(amount, 10),
          },
        });

        if (error) {
          console.error("Payment confirmation error:", error);
          toast.error("결제 확인 중 오류가 발생했습니다.");
          navigate("/payment/fail?message=" + encodeURIComponent("결제 확인 실패"));
          return;
        }

        if (data.success) {
          setIsSuccess(true);
          setOrderInfo({
            orderId: data.orderId,
            totalAmount: data.totalAmount,
          });

          // 로컬스토리지의 주문 정보 삭제
          localStorage.removeItem("pendingOrder");

          toast.success("결제가 완료되었습니다!");
        } else {
          toast.error(data.error || "결제 확인에 실패했습니다.");
          navigate("/payment/fail?message=" + encodeURIComponent(data.error || "결제 확인 실패"));
        }
      } catch (error) {
        console.error("Payment confirmation error:", error);
        toast.error("결제 확인 중 오류가 발생했습니다.");
        navigate("/payment/fail?message=" + encodeURIComponent("결제 확인 중 오류 발생"));
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">결제를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!isSuccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="container mx-auto px-6 py-20 max-w-lg text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-2xl font-medium mb-2">결제가 완료되었습니다</h1>
          <p className="text-muted-foreground mb-8">
            주문해 주셔서 감사합니다. 상품은 빠른 시일 내에 배송될 예정입니다.
          </p>

          {orderInfo && (
            <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-mono text-sm">{orderInfo.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제금액</span>
                <span className="font-medium">{formatPrice(orderInfo.totalAmount)}원</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={() => navigate("/mypage")} className="w-full">
              마이페이지로 이동
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
