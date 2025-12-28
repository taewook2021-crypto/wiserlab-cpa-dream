import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import summitFeature from "@/assets/summit-cover-new.jpg";
import summitCover from "@/assets/summit-cover.png";
import { useState } from "react";

const BUNDLE_PRICE = 50000;

// Preload critical images immediately (outside component)
const preloadedCover = new Image();
preloadedCover.src = summitCover;
const preloadedFeature = new Image();
preloadedFeature.src = summitFeature;

// Static data moved outside component to prevent recreation
const FEATURES = [
  {
    title: "모든 곳에서 완벽함을 추구하다",
    description: "문항의 배치부터 시험지의 양식까지, SUMMIT 모의고사는 실제 CPA 시험지와 동일하게 구현했습니다.",
  },
  {
    title: "객관적 평가가 가능한 모의고사를",
    description: "서울대 데이터 기반의 정밀 분석으로 객관적 평가 기회를 제공합니다.",
  },
  {
    title: "트렌디하며 기본에 충실한 모의고사를",
    description: "출제 가능성이 전혀 없는 주제를 다루지 않으며, 최근 1차 시험의 난이도를 반영한 가장 실전적인 모의고사입니다.",
  },
] as const;

const INSTRUCTORS = {
  financial: {
    subject: "재무회계",
    name: "김용재",
    title: "스마트 경영 아카데미 재무회계 강사",
    teamDescription: "서울대학교 출신 공인회계사 7명 출제팀",
    credentials: [
      { main: "2024년 2차 재무회계 133점", sub: "(서울대학교 경제학부 출신 공인회계사)" },
      { main: "2025년 2차 고급회계 42점", sub: "(서울대학교 경영학과 출신 공인회계사)" },
    ],
  },
  tax: {
    subject: "세법",
    name: "오정화",
    title: "바른생각 세법 강사",
    teamDescription: "서울대학교 출신 공인회계사 5명 출제팀",
    credentials: [
      { main: "전원 2025년 세법 2차 75점 이상", sub: "" },
    ],
  },
} as const;

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const Summit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);


  const handleAddToCart = useCallback(async () => {
    if (!user) {
      navigate("/auth?redirect=/summit");
      return;
    }

    setIsAddingToCart(true);

    try {
      const { data: existingItems } = await supabase
        .from("cart_items")
        .select("product_type")
        .eq("user_id", user.id)
        .eq("product_type", "summit_bundle");

      if (existingItems && existingItems.length > 0) {
        toast.error("이미 장바구니에 담긴 상품입니다.");
        return;
      }

      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_type: "summit_bundle",
        product_name: "SUMMIT 전과목 PACK (재무회계 + 세법)",
        price: BUNDLE_PRICE,
      });

      if (error) {
        toast.error("장바구니에 담기를 실패했습니다.");
        return;
      }

      toast.success("장바구니에 담았습니다.");
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsAddingToCart(false);
    }
  }, [user, navigate]);

  const handlePurchase = useCallback(() => {
    if (!user) {
      navigate("/auth?redirect=/summit");
      return;
    }
    navigate("/payment?items=bundle");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        {/* Product Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-12 sm:py-16 md:py-28">
            <div className="grid sm:grid-cols-2 gap-8 sm:gap-10 md:gap-20 items-start">
              {/* Left: Product Image */}
              <div className="flex items-center justify-center">
                <div className="shadow-xl rounded-sm overflow-hidden w-[180px] sm:w-[180px] md:w-[280px] lg:w-[400px]">
                  <img
                    src={summitCover}
                    alt="Wiser Lab SUMMIT 모의고사 패키지"
                    className="w-full h-auto object-contain"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>

              {/* Right: Product Info */}
              <div className="space-y-3 sm:space-y-3 md:space-y-6 lg:space-y-10">
                <div>
                  <h1 className="text-lg sm:text-lg md:text-xl lg:text-3xl font-light mb-2 sm:mb-2 md:mb-4 lg:mb-6">
                    Wiser Lab SUMMIT PACK
                  </h1>
                  <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-base text-muted-foreground leading-relaxed">
                    가장 실전적인 모의고사, SUMMIT
                  </p>
                </div>

                {/* Product Info */}
                <div className="space-y-3 sm:space-y-3 md:space-y-4 lg:space-y-6 py-4 sm:py-4 md:py-5 lg:py-8 border-y border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-xs md:text-sm lg:text-base font-medium">전과목 PACK</p>
                      <p className="text-[10px] sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">
                        재무회계 + 세법 모의고사 각 2회분
                      </p>
                    </div>
                    <p className="text-lg sm:text-lg md:text-lg lg:text-2xl font-medium">
                      {formatPrice(BUNDLE_PRICE)}원
                    </p>
                  </div>
                </div>

                {/* Delivery & Notice */}
                <div className="space-y-1 sm:space-y-1 md:space-y-2 lg:space-y-3 text-[10px] sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">
                  <p className="text-foreground font-medium">
                    배송 안내: 결제 완료 후 영업일 기준 2~3일 이내 출고
                  </p>
                  <p>
                    * 본 상품은 2026년 CPA 1차 시험 대비용 모의고사로, 시험 종료
                    후에는 구매가 불가합니다.
                  </p>
                  <p>* 재무회계, 세법 개별 구매는 불가합니다.</p>
                </div>

                {/* Total & CTA */}
                <div className="pt-4 sm:pt-4 md:pt-5 lg:pt-8 border-t border-border space-y-3 sm:space-y-3 md:space-y-4 lg:space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">총 상품금액</p>
                    <p className="text-lg sm:text-lg md:text-lg lg:text-2xl font-medium">
                      {formatPrice(BUNDLE_PRICE)}원
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-2 md:gap-2 lg:gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 sm:h-10 md:h-11 lg:h-14 text-xs sm:text-xs md:text-xs lg:text-base font-normal"
                      disabled={isAddingToCart}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4 mr-1 sm:mr-1 md:mr-1 lg:mr-2" />
                      {isAddingToCart ? "담는 중..." : "장바구니에 담기"}
                    </Button>
                    <Button
                      className="flex-1 h-10 sm:h-10 md:h-11 lg:h-14 text-xs sm:text-xs md:text-xs lg:text-base font-normal"
                      onClick={handlePurchase}
                    >
                      바로구매 하기
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 md:py-28 border-b border-border">
          <div className="grid sm:grid-cols-2">
            {/* Left: Image */}
            <div className="aspect-square sm:aspect-auto sm:min-h-[500px] md:min-h-[700px] overflow-hidden">
              <img
                src={summitFeature}
                alt="SUMMIT 모의고사 특징"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Right: Features */}
            <div className="bg-background p-8 sm:p-10 md:p-24 flex flex-col justify-center">
              <div className="space-y-8 sm:space-y-10 md:space-y-16">
                {FEATURES.map((feature, index) => (
                  <div
                    key={index}
                    className={index < FEATURES.length - 1 ? "pb-8 sm:pb-10 md:pb-16 border-b border-border" : ""}
                  >
                    <h3 className="text-sm sm:text-base md:text-xl font-medium mb-3 sm:mb-4 md:mb-6">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-xs md:text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 출제진 소개 Section */}
        <section className="py-12 sm:py-16 md:py-32 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-xl md:text-3xl font-light text-center mb-8 sm:mb-12 md:mb-20">
                출제진 소개
              </h2>

              <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 md:gap-24">
                {Object.values(INSTRUCTORS).map((instructor) => (
                  <div key={instructor.subject} className="space-y-4 sm:space-y-6 md:space-y-10">
                    <h3 className="text-sm sm:text-base md:text-xl font-medium border-b border-border pb-3 sm:pb-4 md:pb-6">
                      {instructor.subject}
                    </h3>
                    <div className="space-y-1 sm:space-y-2 md:space-y-3">
                      <p className="text-sm sm:text-base md:text-lg font-medium">{instructor.name}</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                        {instructor.title}
                      </p>
                    </div>
                    <div className="space-y-2 sm:space-y-3 md:space-y-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">
                      <p className="font-medium text-foreground">
                        {instructor.teamDescription}
                      </p>
                      {instructor.credentials.map((cred, index) => (
                        <div key={index} className="space-y-1 pl-3 sm:pl-4 border-l-2 border-border">
                          <p>{cred.main}</p>
                          {cred.sub && (
                            <p className="text-[9px] sm:text-[10px] md:text-xs">{cred.sub}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Summit;
