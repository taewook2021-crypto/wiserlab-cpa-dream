import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import summitFeature from "@/assets/summit-feature.png";
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
    description: "서울대학교, 연세대학교 최상위권 데이터\n기반으로 객관적인 평가 기회를 제공합니다.",
  },
  {
    title: "트렌디하며 기본에 충실한 모의고사를",
    description: "출제 가능성이 전혀 없는 주제를 다루지 않으며, 최근 1차 시험의 난이도를 반영한 가장 실전적인 모의고사입니다.",
  },
  {
    title: "2026 개정세법 완벽 반영",
    description: "2025년 12월 법률 개정안까지 반영 완료.\n시험일까지 개정세법 영향 문제를 지속적으로 업데이트합니다.",
  },
] as const;

const PRODUCT_INTRO = {
  title: "SUMMIT 모의고사의 구성과 특징",
  subtitle: "재무회계 · 세법 각 2회분, 실전과 동일한 구성",
  descriptions: [
    "SUMMIT 모의고사는 실제 CPA 1차 시험과 동일한 형식으로 제작되었습니다. 문항 수, 시험 시간, 배점까지 실전과 완벽히 일치하여 실제 시험장에서의 감각을 미리 체험할 수 있습니다.",
    "서울대학교, 연세대학교 출신 공인회계사들이 직접 출제에 참여하여, 최신 출제 경향과 난이도를 정밀하게 분석·반영하였습니다.",
    "구매 후 제공되는 성적 분석 서비스를 통해 전국 응시자 대비 나의 위치를 객관적으로 파악하고, 취약 영역을 효과적으로 보완할 수 있습니다.",
  ],
};

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
                    <p className="text-xs sm:text-xs md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Product Introduction Section */}
        <section className="py-16 sm:py-20 md:py-28 border-b border-border bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="grid sm:grid-cols-2 gap-8 md:gap-16 items-center">
              {/* Left: Book Image Placeholder */}
              <div className="flex justify-center">
                <div className="bg-muted w-full max-w-[500px] aspect-[4/3] rounded-lg flex items-center justify-center text-muted-foreground border border-border">
                  <span className="text-sm">이미지 추가 예정</span>
                </div>
              </div>
              
              {/* Right: Text Content */}
              <div className="space-y-6 md:space-y-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {PRODUCT_INTRO.title}
                </h2>
                <div className="border-t border-border pt-4 md:pt-6">
                  <p className="text-sm md:text-base font-medium text-foreground">
                    {PRODUCT_INTRO.subtitle}
                  </p>
                </div>
                <div className="space-y-4 md:space-y-5 text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  {PRODUCT_INTRO.descriptions.map((desc, i) => (
                    <p key={i}>{desc}</p>
                  ))}
                </div>
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
