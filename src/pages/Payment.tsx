import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Building2, Smartphone, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

interface OrderItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

const subjects: OrderItem[] = [
  {
    id: "financial",
    name: "재무회계",
    description: "SUMMIT 모의고사 2회분",
    price: 30000,
  },
  {
    id: "tax",
    name: "세법",
    description: "SUMMIT 모의고사 2회분",
    price: 30000,
  },
];

const Payment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  // 구매자 정보
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // 배송지 정보
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  // URL params에서 선택된 상품 가져오기
  const selectedItems = useMemo(() => {
    const items = searchParams.get("items");
    if (!items) return [];
    return items.split(",").filter((id) => subjects.some((s) => s.id === id));
  }, [searchParams]);

  const orderItems = useMemo(() => {
    return subjects.filter((s) => selectedItems.includes(s.id));
  }, [selectedItems]);

  const { totalPrice, discountedPrice, discount } = useMemo(() => {
    const total = orderItems.reduce((sum, item) => sum + item.price, 0);
    const hasDiscount = orderItems.length >= 2;
    const discountAmount = hasDiscount ? 10000 : 0;
    return {
      totalPrice: total,
      discountedPrice: total - discountAmount,
      discount: discountAmount,
    };
  }, [orderItems]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  // 다음 우편번호 스크립트 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
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

  // 상품이 없으면 summit으로 리다이렉트
  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate("/summit");
    }
  }, [selectedItems, navigate]);

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

    setIsProcessing(true);

    // 결제 처리 시뮬레이션
    setTimeout(() => {
      toast.success("결제가 완료되었습니다.");
      setIsProcessing(false);
      navigate("/mypage");
    }, 2000);
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
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">SUMMIT {item.name} 모의고사</p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.price)}원</p>
                    </div>
                  ))}
                </div>
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

              {/* 결제 수단 */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium">결제 수단</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-3 gap-4"
                >
                  <label
                    htmlFor="card"
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" className="sr-only" />
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm">신용/체크카드</span>
                  </label>
                  <label
                    htmlFor="bank"
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "bank"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <RadioGroupItem value="bank" id="bank" className="sr-only" />
                    <Building2 className="w-6 h-6" />
                    <span className="text-sm">무통장입금</span>
                  </label>
                  <label
                    htmlFor="mobile"
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "mobile"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <RadioGroupItem
                      value="mobile"
                      id="mobile"
                      className="sr-only"
                    />
                    <Smartphone className="w-6 h-6" />
                    <span className="text-sm">휴대폰결제</span>
                  </label>
                </RadioGroup>
              </section>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-lg p-6 sticky top-24 space-y-6">
                <h2 className="text-lg font-medium">결제 금액</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span>{formatPrice(totalPrice)}원</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>할인 금액</span>
                      <span>-{formatPrice(discount)}원</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-medium">총 결제 금액</span>
                  <span className="text-xl font-medium">
                    {formatPrice(discountedPrice)}원
                  </span>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "결제 처리 중..." : `${formatPrice(discountedPrice)}원 결제하기`}
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
