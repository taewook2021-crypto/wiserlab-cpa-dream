import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Tag, X, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    TossPayments: new (clientKey: string) => TossPaymentsInstance;
  }
}

interface TossPaymentsInstance {
  requestPayment: (method: string, options: TossPaymentOptions) => Promise<void>;
}

interface TossPaymentOptions {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  successUrl: string;
  failUrl: string;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => { open: () => void };
    };
  }
}

interface DaumPostcodeData {
  zonecode: string;
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
}

const BUNDLE_PRICE = 50000;
const TOSS_CLIENT_KEY = "live_ck_Poxy1XQL8RbE1qJpGGAZ87nO5Wml";

const Payment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isProcessing, setIsProcessing] = useState(false);

  // 구매자 정보
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // 배송지 정보
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  // 할인 코드 관련 상태
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    codeId: string;
    isAutoApplied?: boolean;
  } | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isLoadingAutoDiscount, setIsLoadingAutoDiscount] = useState(true);

  // URL params에서 상품 확인
  const isValidOrder = useMemo(() => {
    const items = searchParams.get("items");
    return items === "bundle";
  }, [searchParams]);

  const shippingFee = 0;
  const discountAmount = appliedDiscount?.amount || 0;
  const totalPrice = Math.max(0, BUNDLE_PRICE + shippingFee - discountAmount);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  // 다음 우편번호 + 토스페이먼츠 스크립트 로드
  useEffect(() => {
    // 다음 우편번호 스크립트
    const daumScript = document.createElement("script");
    daumScript.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    daumScript.async = true;
    document.head.appendChild(daumScript);

    // 토스페이먼츠 SDK 스크립트
    const tossScript = document.createElement("script");
    tossScript.src = "https://js.tosspayments.com/v1/payment";
    tossScript.async = true;
    document.head.appendChild(tossScript);

    return () => {
      document.head.removeChild(daumScript);
      document.head.removeChild(tossScript);
    };
  }, []);

  // 우편번호 검색
  const handlePostcodeSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      toast.error("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        setPostcode(data.zonecode);
        setAddress(data.address);
      },
    }).open();
  };

  // 로그인 확인
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/summit");
    }
  }, [user, loading, navigate]);

  // 프로필에서 배송 정보 자동 완성
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data) {
        const profile = data as Record<string, unknown>;
        if (profile.phone) {
          setBuyerPhone(profile.phone as string);
        }
        if (profile.shipping_postal_code) {
          setPostcode(profile.shipping_postal_code as string);
        }
        if (profile.shipping_address) {
          setAddress(profile.shipping_address as string);
        }
        if (profile.shipping_detail_address) {
          setDetailAddress(profile.shipping_detail_address as string);
        }
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  // 유효하지 않은 주문이면 summit으로 리다이렉트
  useEffect(() => {
    if (!isValidOrder) {
      navigate("/summit");
    }
  }, [isValidOrder, navigate]);

  // 자동 할인 코드 적용 (이메일로 지정된 코드 조회)
  useEffect(() => {
    const checkAutoDiscount = async () => {
      if (!user?.email) {
        setIsLoadingAutoDiscount(false);
        return;
      }

      try {
        // 사용자 이메일로 지정된 미사용 할인 코드 조회
        const { data, error } = await supabase
          .from("discount_codes")
          .select("*")
          .eq("assigned_email", user.email)
          .eq("is_used", false)
          .maybeSingle();

        if (!error && data) {
          setAppliedDiscount({
            code: data.code,
            amount: data.discount_amount,
            codeId: data.id,
            isAutoApplied: true,
          });
          toast.success(`${data.discount_amount.toLocaleString("ko-KR")}원 할인이 자동 적용되었습니다.`);
        }
      } catch (error) {
        console.error("Auto discount check error:", error);
      } finally {
        setIsLoadingAutoDiscount(false);
      }
    };

    if (user && !loading) {
      checkAutoDiscount();
    }
  }, [user, loading]);

  // 할인 코드 적용
  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("할인 코드를 입력해주세요.");
      return;
    }

    setIsCheckingCode(true);

    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        toast.error("유효하지 않은 할인 코드입니다.");
        setIsCheckingCode(false);
        return;
      }

      if (data.is_used) {
        toast.error("이미 사용된 할인 코드입니다.");
        setIsCheckingCode(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("만료된 할인 코드입니다.");
        setIsCheckingCode(false);
        return;
      }

      setAppliedDiscount({
        code: data.code,
        amount: data.discount_amount,
        codeId: data.id,
      });
      toast.success(`${formatPrice(data.discount_amount)}원 할인이 적용되었습니다.`);
    } catch (error) {
      console.error("Discount code check error:", error);
      toast.error("할인 코드 확인 중 오류가 발생했습니다.");
    } finally {
      setIsCheckingCode(false);
    }
  };

  // 할인 코드 제거
  const handleRemoveDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    toast.success("할인 코드가 제거되었습니다.");
  };

  const handlePayment = async () => {
    if (!buyerName.trim()) {
      toast.error("주문자 이름을 입력해주세요.");
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error("연락처를 입력해주세요.");
      return;
    }
    if (!postcode || !address) {
      toast.error("배송지 주소를 입력해주세요.");
      return;
    }
    if (!detailAddress.trim()) {
      toast.error("상세 주소를 입력해주세요.");
      return;
    }

    if (!window.TossPayments) {
      toast.error("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsProcessing(true);

    try {
      const tossPayments = new window.TossPayments(TOSS_CLIENT_KEY);
      const orderId = `ORDER_${Date.now()}_${user?.id?.slice(0, 8)}`;
      
      // pending_orders 테이블에 배송 정보 저장 (서버 사이드 처리를 위해)
      const { error: pendingError } = await supabase.from('pending_orders').insert({
        user_id: user!.id,
        order_id: orderId,
        buyer_name: buyerName,
        buyer_email: user?.email || '',
        buyer_phone: buyerPhone,
        shipping_address: address,
        shipping_detail_address: detailAddress,
        shipping_postal_code: postcode,
        product_name: appliedDiscount 
          ? `SUMMIT 전과목 PACK (할인: ${appliedDiscount.code})`
          : 'SUMMIT 전과목 PACK',
        amount: totalPrice,
      });

      if (pendingError) {
        console.error('Failed to save pending order:', pendingError);
        toast.error('주문 정보 저장에 실패했습니다. 다시 시도해주세요.');
        setIsProcessing(false);
        return;
      }

      // 할인 코드가 적용된 경우 사용 처리
      if (appliedDiscount) {
        const { error: discountError } = await supabase
          .from("discount_codes")
          .update({
            is_used: true,
            user_id: user!.id,
            used_at: new Date().toISOString(),
          })
          .eq("id", appliedDiscount.codeId)
          .eq("is_used", false);

        if (discountError) {
          console.error('Failed to mark discount code as used:', discountError);
          toast.error('할인 코드 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
          setIsProcessing(false);
          return;
        }
      }

      await tossPayments.requestPayment("카드", {
        amount: totalPrice,
        orderId,
        orderName: appliedDiscount 
          ? `SUMMIT 전과목 PACK (할인 적용)`
          : "SUMMIT 전과목 PACK",
        customerName: buyerName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error: unknown) {
      console.error("Payment error details:", error);
      console.error("Error type:", typeof error);
      console.error("Error JSON:", JSON.stringify(error, null, 2));
      
      let errorMessage = "결제 처리 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as { message?: string; code?: string };
        errorMessage = errObj.message || errObj.code || errorMessage;
      }
      
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>이전으로</span>
          </button>

          <h1 className="text-2xl font-light mb-10">주문 / 결제</h1>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left: Order Form */}
            <div className="lg:col-span-2 space-y-10">
              {/* 주문 상품 */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium">주문 상품</h2>
                <div className="border border-border rounded-lg divide-y divide-border">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">SUMMIT 전과목 PACK</p>
                      <p className="text-sm text-muted-foreground">
                        재무회계 + 세법 모의고사 각 2회분
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(BUNDLE_PRICE)}원</p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* 할인 코드 */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  할인 코드
                </h2>
                {isLoadingAutoDiscount ? (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground animate-pulse">할인 코드 확인 중...</p>
                  </div>
                ) : appliedDiscount ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">
                          {appliedDiscount.code}
                          {appliedDiscount.isAutoApplied && (
                            <span className="ml-2 text-xs bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                              자동 적용
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatPrice(appliedDiscount.amount)}원 할인 적용됨
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDiscountCode}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="할인 코드를 입력하세요"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyDiscountCode}
                      disabled={isCheckingCode}
                    >
                      {isCheckingCode ? "확인 중..." : "적용"}
                    </Button>
                  </div>
                )}
              </section>

              <Separator />

              {/* 주문자 정보 */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium">주문자 정보</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerName">주문자 이름</Label>
                    <Input
                      id="buyerName"
                      placeholder="이름을 입력하세요"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerPhone">연락처</Label>
                    <Input
                      id="buyerPhone"
                      placeholder="010-0000-0000"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* 배송지 정보 */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium">배송지 정보</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="postcode">우편번호</Label>
                    <div className="flex gap-2">
                      <Input
                        id="postcode"
                        placeholder="우편번호"
                        value={postcode}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePostcodeSearch}
                        className="shrink-0"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        주소 검색
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">주소</Label>
                    <Input
                      id="address"
                      placeholder="주소를 검색해주세요"
                      value={address}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detailAddress">상세 주소</Label>
                    <Input
                      id="detailAddress"
                      placeholder="상세 주소를 입력하세요"
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* 결제 수단 안내 */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium">결제 수단</h2>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    결제하기 버튼을 누르면 토스페이먼츠 결제창이 열립니다.
                    <br />
                    신용카드, 체크카드, 계좌이체 등 다양한 결제 수단을 이용하실 수 있습니다.
                  </p>
                </div>
              </section>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-lg p-6 sticky top-24 space-y-6">
                <h2 className="text-lg font-medium">결제 금액</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span>{formatPrice(BUNDLE_PRICE)}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">배송비</span>
                    <span className="text-primary">무료</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>할인 ({appliedDiscount.code})</span>
                      <span>-{formatPrice(appliedDiscount.amount)}원</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-medium">총 결제 금액</span>
                  <span className="text-xl font-medium">
                    {formatPrice(totalPrice)}원
                  </span>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "결제 처리 중..." : `${formatPrice(totalPrice)}원 결제하기`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  주문 내용을 확인하였으며, 결제에 동의합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
