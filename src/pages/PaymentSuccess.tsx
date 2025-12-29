import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, Copy, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    totalAmount: number;
    examNumber: string;
  } | null>(null);
  
  // 중복 실행 방지를 위한 ref
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const confirmPayment = async () => {
      // 이미 처리 중이면 중복 실행 방지
      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;
      
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        toast.error("잘못된 결제 정보입니다.");
        navigate("/summit");
        return;
      }

      try {
        // toss-payment Edge Function 호출 (결제 승인 + 주문 저장)
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
          let examNumber = data.examNumber || '';

          // 서버에서 주문이 저장되지 않은 경우, DB에서 조회 시도
          if (!data.orderSaved || !examNumber) {
            // 잠시 대기 후 주문 조회 (서버 처리 시간 확보)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: savedOrder } = await supabase
              .from('orders')
              .select('exam_number')
              .eq('order_id', data.orderId)
              .maybeSingle();

            if (savedOrder?.exam_number) {
              examNumber = savedOrder.exam_number;
            }
          }

          setIsSuccess(true);
          setOrderInfo({
            orderId: data.orderId,
            totalAmount: data.totalAmount,
            examNumber: examNumber,
          });

          // 로컬스토리지의 주문 정보 삭제 (이전 버전 호환)
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
              {orderInfo.examNumber && (
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-muted-foreground">수험번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{orderInfo.examNumber}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(orderInfo.examNumber);
                        setCopied(true);
                        toast.success("수험번호가 복사되었습니다");
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              )}
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